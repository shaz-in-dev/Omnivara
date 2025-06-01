"""Copilot router — AI chat, streaming, plan gating, usage tracking."""
from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import (
    CopilotRequest,
    CopilotResponse,
    SuggestActionsRequest,
    SuggestActionsResponse,
)
from app.services.copilot_service import CopilotService
from app.services.usage_service import UsageService

router = APIRouter()
_copilot = CopilotService()
_usage = UsageService()


async def _check_plan(org_id: str, plan: str):
    """Raise 403 if the org's plan doesn't include AI access."""
    allowed, reason = await _usage.check_access(org_id, plan)
    if not allowed:
        raise HTTPException(status_code=403, detail=reason)


@router.post("/ask", response_model=CopilotResponse)
async def ask_copilot(
    req: CopilotRequest,
    x_org_plan: str = Header(default="starter", alias="X-Org-Plan"),
):
    """
    AI Copilot — non-streaming chat.
    Requires X-Org-Plan header (set by NestJS proxy after auth).
    """
    await _check_plan(req.org_id, x_org_plan)
    model = _usage.get_model(x_org_plan)

    try:
        result = await _copilot.chat(req, model=model)
        # Increment usage after successful response
        await _usage.increment(req.org_id)
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/stream")
async def stream_copilot(
    req: CopilotRequest,
    x_org_plan: str = Header(default="starter", alias="X-Org-Plan"),
):
    """
    AI Copilot — streaming chat (Server-Sent Events).
    Requires X-Org-Plan header (set by NestJS proxy after auth).
    """
    await _check_plan(req.org_id, x_org_plan)
    model = _usage.get_model(x_org_plan)

    tokens_generated = 0

    async def generate():
        nonlocal tokens_generated
        try:
            async for chunk in _copilot.stream(req, model=model):
                tokens_generated += len(chunk.split())  # rough estimate
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
            # Increment usage after stream completes
            await _usage.increment(req.org_id)
        except HTTPException as exc:
            yield f"data: [ERROR] {exc.detail}\n\n"
        except Exception as exc:
            yield f"data: [ERROR] {exc}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/suggest-actions", response_model=SuggestActionsResponse)
async def suggest_actions(req: SuggestActionsRequest):
    """Suggest contextual next actions for a given entity."""
    from app.models.schemas import ActionSuggestion

    # Build context-aware suggestions based on entity type
    suggestions = []
    et = req.entity_type.lower()
    if et == "lead":
        suggestions = [
            ActionSuggestion(action="send_email", description="Send follow-up email", confidence=0.88, data={"template": "follow_up"}),
            ActionSuggestion(action="log_call", description="Log a call", confidence=0.75, data={}),
            ActionSuggestion(action="convert", description="Convert to contact", confidence=0.60, data={}),
        ]
    elif et == "ticket":
        suggestions = [
            ActionSuggestion(action="assign", description="Assign to agent", confidence=0.90, data={}),
            ActionSuggestion(action="reply", description="Send customer reply", confidence=0.85, data={}),
            ActionSuggestion(action="escalate", description="Escalate ticket", confidence=0.50, data={}),
        ]
    elif et == "invoice":
        suggestions = [
            ActionSuggestion(action="send_reminder", description="Send payment reminder", confidence=0.92, data={}),
            ActionSuggestion(action="mark_paid", description="Mark as paid", confidence=0.70, data={}),
        ]
    else:
        suggestions = [
            ActionSuggestion(action="view", description=f"View {et} details", confidence=0.80, data={}),
        ]

    return SuggestActionsResponse(suggestions=suggestions[:3])
