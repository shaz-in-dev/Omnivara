"""Daily brief service — generates personalized AI briefs from REAL org data."""
from __future__ import annotations

import json
import re
from datetime import date, datetime, timedelta, timezone
from typing import Any

import anthropic
from app.config import settings
from app.models.schemas import BriefItem, BriefRequest, BriefResponse
from app.services.vector_store import get_pool

_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


async def _fetch_org_data(org_id: str) -> dict[str, Any]:
    """Query the PostgreSQL DB for live org data to include in the brief."""
    pool = await get_pool()
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    two_weeks_ago = now - timedelta(days=14)

    async with pool.acquire() as conn:
        # 1. Overdue invoices
        overdue_invoices = await conn.fetch(
            """
            SELECT number, total, "dueDate"
            FROM invoices
            WHERE "orgId" = $1 AND status IN ('sent','viewed','partial')
              AND "dueDate" < $2
            ORDER BY "dueDate"
            LIMIT 5
            """,
            org_id, now,
        )

        # 2. Leads not contacted in 14+ days
        stale_leads = await conn.fetch(
            """
            SELECT name, company, "createdAt"
            FROM leads
            WHERE "orgId" = $1 AND status = 'new'
              AND "createdAt" < $2
            ORDER BY "createdAt"
            LIMIT 5
            """,
            org_id, two_weeks_ago,
        )

        # 3. Open tickets (breaching SLA > 24 hrs)
        sla_tickets = await conn.fetch(
            """
            SELECT subject, priority, "createdAt"
            FROM tickets
            WHERE "orgId" = $1 AND status IN ('open','pending')
              AND "createdAt" < $2
            ORDER BY priority, "createdAt"
            LIMIT 5
            """,
            org_id, now - timedelta(hours=24),
        )

        # 4. Total pipeline value
        pipeline = await conn.fetchrow(
            """
            SELECT COUNT(*) AS cnt, COALESCE(SUM(value), 0) AS total
            FROM opportunities
            WHERE "orgId" = $1
              AND stage NOT IN ('closed_won','closed_lost')
            """,
            org_id,
        )

        # 5. Month's collected revenue
        monthly_revenue = await conn.fetchrow(
            """
            SELECT COALESCE(SUM(total), 0) AS total
            FROM invoices
            WHERE "orgId" = $1 AND status = 'paid'
              AND "paidAt" >= $2
            """,
            org_id, month_start,
        )

        # 6. Pending leave requests
        pending_leaves = await conn.fetchval(
            """
            SELECT COUNT(*) FROM leave_requests
            WHERE "orgId" = $1 AND status = 'pending'
            """,
            org_id,
        )

        # 7. Tasks due today
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        tasks_due = await conn.fetchval(
            """
            SELECT COUNT(*) FROM tasks
            WHERE "orgId" = $1 AND status NOT IN ('done','cancelled')
              AND "dueDate" BETWEEN $2 AND $3
            """,
            org_id, today_start, today_end,
        )

    return {
        "overdue_invoices": [dict(r) for r in overdue_invoices],
        "stale_leads": [dict(r) for r in stale_leads],
        "sla_tickets": [dict(r) for r in sla_tickets],
        "pipeline_count": pipeline["cnt"] if pipeline else 0,
        "pipeline_value": float(pipeline["total"] if pipeline else 0),
        "monthly_revenue": float(monthly_revenue["total"] if monthly_revenue else 0),
        "pending_leaves": pending_leaves or 0,
        "tasks_due_today": tasks_due or 0,
    }


def _build_context_summary(data: dict[str, Any]) -> str:
    lines = [f"Today's date: {date.today().isoformat()}"]

    if data["monthly_revenue"]:
        lines.append(f"Revenue collected this month: ${data['monthly_revenue']:,.0f}")

    if data["pipeline_value"]:
        lines.append(f"Open pipeline: {data['pipeline_count']} opportunities, ${data['pipeline_value']:,.0f} total value")

    if data["overdue_invoices"]:
        total_overdue = sum(r["total"] for r in data["overdue_invoices"])
        lines.append(f"Overdue invoices: {len(data['overdue_invoices'])} invoices totalling ${total_overdue:,.0f}")
        for inv in data["overdue_invoices"]:
            lines.append(f"  - Invoice #{inv['number']} — ${inv['total']:,.0f} (due {inv['dueDate'].date()})")

    if data["stale_leads"]:
        lines.append(f"Stale leads (no contact in 14+ days): {len(data['stale_leads'])}")
        for lead in data["stale_leads"]:
            co = f" at {lead['company']}" if lead.get("company") else ""
            lines.append(f"  - {lead['name']}{co}")

    if data["sla_tickets"]:
        lines.append(f"Tickets approaching/breaching SLA (>24h old): {len(data['sla_tickets'])}")
        for t in data["sla_tickets"]:
            lines.append(f"  - [{t['priority'].upper()}] {t['subject']}")

    if data["tasks_due_today"]:
        lines.append(f"Tasks due today: {data['tasks_due_today']}")

    if data["pending_leaves"]:
        lines.append(f"Pending leave requests awaiting approval: {data['pending_leaves']}")

    return "\n".join(lines)


class BriefService:
    async def generate(self, request: BriefRequest) -> BriefResponse:
        target_date = request.date or date.today().isoformat()

        # Fetch real data
        try:
            org_data = await _fetch_org_data(request.org_id)
            data_summary = _build_context_summary(org_data)
        except Exception:
            data_summary = f"Today's date: {target_date}\n(Live data unavailable — using generic brief)"

        role_focus = _role_prompt(request.role)

        prompt = f"""Generate a concise daily business brief for a {request.role}.

## Live Business Data
{data_summary}

## Your Focus Area
{role_focus}

Return ONLY valid JSON (no markdown code block) with this structure:
{{
  "greeting": "Good morning! Here's your brief for {target_date}.",
  "items": [
    {{
      "category": "Finance",
      "title": "3 overdue invoices totalling $4,200",
      "summary": "Take action to collect payment",
      "priority": "high",
      "action_url": "/finance/invoices"
    }}
  ]
}}

Rules:
- 3–6 items, ordered by priority (high → medium → low)
- Only include items that have actual data above (no hallucinating)
- If data is missing for a category, skip that item
- priority must be: "high" | "medium" | "low"
- action_url should be a valid app route"""

        try:
            response = await _client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1200,
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.content[0].text if response.content else "{}"

            # Strip markdown code fences if present
            text = re.sub(r"```json?\s*", "", text)
            text = re.sub(r"```\s*", "", text)

            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if not json_match:
                return _fallback_brief(request.role, target_date)

            data = json.loads(json_match.group())
            items = [BriefItem(**item) for item in data.get("items", [])]
            return BriefResponse(
                greeting=data.get("greeting", f"Good morning! Here's your brief for {target_date}."),
                items=items,
                generated_at=date.today().isoformat(),
            )
        except Exception:
            return _fallback_brief(request.role, target_date)


def _role_prompt(role: str) -> str:
    prompts = {
        "ADMIN":   "System health, org metrics, billing status, overall activity.",
        "SALES":   "Pipeline opportunities, overdue follow-ups, stale leads, new deals.",
        "SUPPORT": "Open tickets, SLA breaches, urgent issues, response times.",
        "FINANCE": "Overdue invoices, payment collection, revenue this month.",
        "HR":      "Pending leave approvals, onboarding status, headcount.",
    }
    return prompts.get(role.upper(), "Key tasks, deadlines, and business health.")


def _fallback_brief(role: str, target_date: str) -> BriefResponse:
    return BriefResponse(
        greeting=f"Good morning! Here's your brief for {target_date}.",
        items=[BriefItem(
            category="System",
            title="Brief temporarily unavailable",
            summary="Unable to fetch live data. Check the AI service connection.",
            priority="low",
        )],
        generated_at=date.today().isoformat(),
    )
