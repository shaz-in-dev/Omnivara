# Omnivara One - Master Product Blueprint

## 1) Vision and Positioning
Omnivara One is a unified business operating system for modern companies that want a Zoho-like suite with a premium, AI-native experience.

Core positioning:
- Suite breadth like Zoho
- UX quality and speed closer to best-in-class SaaS products
- AI copilot embedded in every module, not a separate add-on
- Built for polyglot engineering organizations with strong integrations

North star outcome:
- Reduce operational friction by 40%
- Reduce tool sprawl by consolidating core workflows into one platform
- Improve decision speed with role-specific AI summaries and actions

## 2) Product Surfaces
1. Web App (primary high-end surface)
- For admins, operations, managers, finance, support, and power users
- Deep analytics, large tables, workflows, policy controls

2. Mobile App (Flutter)
- For approvals, alerts, field updates, quick CRM/support actions, executive snapshots

3. Desktop App (optional but recommended)
- Tauri-based desktop app for finance and ops teams needing stable heavy workflows

4. Public and Partner Portals
- Customer self-service portal for tickets/invoices
- Vendor portal for procurement and inventory collaboration

## 3) Core Modules (Phase-based)
### Foundation Modules (must-have)
1. Identity and Access
- Org, users, teams, roles, policies
- SSO, MFA, SCIM, session controls

2. CRM Pro
- Leads, contacts, accounts, opportunities, activities, forecasting
- Pipeline automations and stage-specific guardrails

3. Projects and Agile
- Kanban, scrum, backlog, sprints, dependencies, timesheets
- Goals and milestones tied to business KPIs

4. Helpdesk and Success
- Omnichannel inbox, ticket routing, SLA policies, escalation matrix
- CSAT/NPS capture and renewal-risk flags

5. Finance and Billing
- Invoices, recurring billing, expense claims, approvals
- Payment reminders and cashflow analytics

### Expansion Modules
6. HR and People Ops
- Leave, attendance, onboarding, performance cycles

7. Inventory and Procurement
- Stock, warehouses, vendors, purchase orders, reorder policies

8. Documents and E-sign
- Template library, document generation, approval chains, signatures

9. Workflow Studio
- Visual automation builder with conditional branching and approvals

10. Analytics and Data Studio
- Unified metrics layer, dashboard builder, saved reports, scheduled delivery

11. AI Copilot and Knowledge Graph
- Contextual copilots, search, summarization, recommendations, action suggestions

12. Executive Command Center
- Company health dashboard: revenue, delivery, support, people, risk

## 4) Advanced Features to Differentiate
1. Cross-Module Timeline
- Single event stream across CRM, projects, support, finance, and HR

2. Scenario Planning
- What-if simulations for revenue forecast, staffing, and support load

3. Policy-as-Code Workflows
- Approval and compliance policies defined version-controlled and auditable

4. AI Auto-Briefs
- Daily role-based brief for each user persona

5. Decision Intelligence
- Next-best-action suggestions with confidence and evidence trace

6. Explainable Risk Scores
- Pipeline risk, SLA breach risk, churn risk with drill-down causes

7. Operational Digital Twin
- Service and process map linking teams, tools, and bottlenecks

8. Marketplace and Extensions
- Third-party app marketplace and internal extensions SDK

## 5) User Personas
1. Founder and CEO
- Revenue health, burn risk, high-level decisions, critical alerts

2. Sales Manager
- Pipeline velocity, deal risk, rep performance, forecast confidence

3. Project Manager
- Delivery risk, dependency collisions, team load balancing

4. Support Lead
- Backlog trends, SLA breach risk, escalation causes

5. Finance Controller
- Aging invoices, payment risk, spend anomalies

6. HR Manager
- Attrition risk, onboarding bottlenecks, policy compliance

7. Operations Head
- Process throughput, inventory risk, cross-team blockers

## 6) Technical Architecture
### Frontend
- Web: Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query, Zustand
- Mobile: Flutter, Riverpod, GoRouter, Dio, local offline storage
- Desktop: Tauri shell reusing web frontend

### Backend
- API platform: NestJS (modular monolith initially)
- AI services: Python FastAPI microservices
- Workflow and orchestration: Temporal workers
- Realtime delivery: WebSocket gateway + event subscriptions

### Data Layer
- PostgreSQL for transactional core and tenant-scoped data
- Redis for cache, rate limits, short-lived state
- OpenSearch for search and retrieval
- ClickHouse for event analytics and high-volume aggregations
- S3-compatible object storage for files and exports
- Neo4j optional for advanced relationship graph

### Messaging and Async
- Kafka for event streaming backbone
- Outbox pattern for reliable domain events
- Background workers for enrichment, scoring, notifications

### Infrastructure
- Kubernetes, Helm, Terraform, ArgoCD
- CI/CD with GitHub Actions
- Blue/green and canary deployments

### Observability
- OpenTelemetry traces and metrics
- Prometheus + Grafana + Loki + Tempo
- SLO dashboards and error budget policies

## 7) Multi-Tenant and Security Model
1. Tenant Isolation
- Shared DB with strict tenant_id and Row Level Security
- Optional dedicated DB and storage for enterprise plans

2. Identity and Access
- OIDC/SAML, MFA, conditional access policies
- RBAC + ABAC for fine-grained permissions

3. Audit and Compliance
- Immutable audit log for all sensitive actions
- Export-ready compliance reports

4. Data Protection
- Encryption in transit and at rest
- Field-level encryption for critical PII and finance fields

5. Secret and Key Management
- Vault/cloud secret manager
- Regular key rotation and token expiry policy

6. Enterprise Readiness
- SCIM provisioning
- Data residency controls
- Tenant-specific retention policies

## 8) AI System Design
1. AI Copilot Modes
- Ask mode: semantic Q&A across modules
- Brief mode: role-based daily and weekly summaries
- Action mode: suggest and execute policy-approved actions

2. Knowledge Sources
- Internal records (CRM, tickets, projects, invoices)
- Docs and playbooks
- Integrations (email, chat, issue trackers)

3. Retrieval and Reasoning
- Embeddings and semantic retrieval
- Hybrid retrieval with metadata filters
- Tool-calling layer for transactional actions

4. Guardrails
- Tenant data boundaries in retrieval
- Policy checks before action execution
- Structured output schema validation

5. Feedback Loop
- Thumbs up/down and correction capture
- Model quality metrics by use-case

## 9) API and Integration Strategy
1. API-first Contracts
- OpenAPI contracts for all modules
- Versioned APIs and compatibility policies

2. Integration Connectors
- Google Workspace, Microsoft 365, Slack
- Stripe and payment gateways
- GitHub/Jira for engineering teams
- WhatsApp Business via provider APIs

3. Webhooks and Event Subscriptions
- Inbound and outbound webhook framework
- Replay support and dead-letter queues

4. Rate Limiting and Quotas
- Per-tenant and per-user quotas
- Burst handling and graceful throttling

## 10) Data Model (High Level)
1. Core
- Organization, Workspace, User, Team, Role, Policy

2. CRM
- Lead, Contact, Account, Opportunity, Activity, ForecastSnapshot

3. Projects
- Project, Epic, Task, Sprint, Dependency, TimeEntry

4. Helpdesk
- Ticket, Conversation, SLA, Escalation, CSATResponse

5. Finance
- Invoice, Payment, Expense, Approval, LedgerEntry

6. HR
- Employee, LeaveRequest, AttendanceRecord, PerformanceReview

7. Inventory
- Item, Warehouse, StockMovement, PurchaseOrder, Vendor

8. Platform
- AuditLog, Notification, Attachment, Integration, WorkflowRun

9. AI
- Insight, Recommendation, RiskScore, Explanation, Feedback

## 11) UX and Design System Requirements
1. Design Tokens
- Typography, spacing, color scales, elevations, motion curves

2. Component Library
- Forms, advanced tables, command palette, charting, workflow canvas

3. Accessibility
- Keyboard navigation, screen reader labels, color contrast compliance

4. Performance UX
- Optimistic UI, skeleton loaders, stale-while-revalidate caching

5. Mobile UX
- Quick actions, adaptive layouts, offline queue with conflict resolution

## 12) Reliability and Performance Targets
- API p95 latency under 250ms for core reads
- Event ingestion delay under 5 seconds for priority streams
- Search p95 under 400ms
- Availability target: 99.9% for Growth, 99.95% for Enterprise
- RPO 15 minutes, RTO 60 minutes

## 13) Monetization and Packaging
1. Starter
- CRM + Projects + basic automations + 3 integrations

2. Growth
- Helpdesk + Finance lite + advanced analytics + AI briefs

3. Business
- HR + Inventory + advanced workflow policies + expanded limits

4. Enterprise
- SSO/SCIM, dedicated infra options, data residency, premium SLA, governance

Add-ons:
- Extra AI credits
- Advanced forecasting pack
- Custom connector pack

## 14) Go-To-Market
1. Initial ICP
- 20 to 300 employee tech-enabled SMBs
- Agencies, service companies, and product startups

2. Land-and-Expand
- Start with CRM + Projects, expand into support and finance

3. Activation Strategy
- Guided setup wizard
- 14-day interactive sandbox
- AI-assisted data import

## 15) Delivery Roadmap (12 Months)
### Q1
- Tenant foundation, IAM, CRM MVP, Projects MVP, web + mobile core shell

### Q2
- Helpdesk, workflow builder v1, notifications, integration framework

### Q3
- Finance module, analytics warehouse, executive dashboards, AI briefs

### Q4
- HR + Inventory, enterprise controls, marketplace, internationalization

## 16) Team Plan
Phase 1 team (8-10 people):
- Product manager
- Tech lead/platform architect
- 2 frontend engineers
- 2 backend engineers
- 1 mobile engineer
- 1 AI engineer
- 1 DevOps/SRE engineer
- 1 QA automation engineer

## 17) Engineering Standards
- Trunk-based development with short-lived feature branches
- Contract tests for every module boundary
- Minimum test coverage thresholds by layer
- Security scans in CI and dependency checks
- Feature flags for incremental rollouts

## 18) Risks and Mitigations
1. Scope Creep
- Strict phase gates and module-level acceptance criteria

2. Integration Fragility
- Adapter isolation and connector health monitoring

3. AI Hallucination Risk
- Retrieval constraints, confidence labels, human confirmation for actions

4. Multi-tenant Data Leakage
- Tenant guards in every query path, automated policy tests

5. Performance Degradation at Scale
- Event partitioning, cache strategy, observability-driven tuning

## 19) 90-Day Execution Blueprint
### Sprint 1-2
- Auth, tenant model, org setup, role model, base UI shell

### Sprint 3-4
- CRM entities, pipeline UI, activity timeline, import tools

### Sprint 5-6
- Projects board, sprint planning, notifications and reminders

### Sprint 7-8
- Helpdesk inbox v1, SLA policy engine, mobile quick actions

### Sprint 9-10
- Workflow builder v1, integration hub, webhook framework

### Sprint 11-12
- AI daily brief v1, executive dashboard, hardening and beta prep

## 20) Success Metrics
Product metrics:
- Weekly active users by module
- Cross-module adoption rate
- Time-to-value (first meaningful workflow completed)

Business metrics:
- Trial to paid conversion
- Net revenue retention
- Churn by plan

Engineering metrics:
- Deployment frequency
- MTTR
- Defect escape rate
- p95 latency and uptime targets

## 21) Suggested Repo Structure
- apps/web
- apps/mobile
- apps/desktop
- services/api
- services/ai
- services/workflow
- packages/ui
- packages/contracts
- packages/config
- infra/terraform
- infra/k8s
- docs/architecture

## 22) Immediate Next Actions
1. Approve phase-1 scope and KPI targets
2. Freeze module boundaries for CRM, Projects, Helpdesk
3. Finalize tenancy and auth model before feature build
4. Start with web shell + Flutter shell in parallel
5. Stand up CI/CD and observability before large feature work

---

## 23) Sprint Execution Roadmap — Path to Revenue

> **Current status (end of Sprint 12):**
> Backend: 75% real, solid | Frontend: 60% built, mostly mock data | AI: chat works, RAG stubbed | Tests: 0% | Mobile: shell only | Payments: not started
>
> **Core problem:** Beautiful UI, real backend — but they're not talking to each other. Customers can't use real data yet.

---

### Phase 1 — Connect Everything (Sprints 13–16)
**Goal: Real data in every page | Timeline: 6–8 weeks**

The backend is built. The hooks exist. The highest-leverage work is wiring pages to them.

#### Sprint 13 — CRM Integration
```
Replace mock data in:
  /crm/leads       → use useLeads() hook
  /crm/contacts    → use useContacts() hook
  /crm/accounts    → use useAccounts() hook
  /crm/pipeline    → use useOpportunities() hook

Wire up:
  Create lead modal  → POST to API
  Lead detail drawer → real activity timeline
  Pipeline drag-drop → PATCH opportunity stage on drop

Test manually:
  Create a lead, move it through pipeline, add activity
  Confirm data persists on refresh
```

#### Sprint 14 — Projects + Helpdesk Integration
```
Replace mock data in:
  /projects        → useProjects(), useTasks()
  /helpdesk        → useTickets()

Wire up:
  Create task → POST, drag between columns → PATCH status
  Create ticket → POST, assign agent → PATCH
  SLA countdown → real createdAt from API

Fix:
  Notification drawer → wire to real SSE stream
  Real-time ticket updates
```

#### Sprint 15 — Finance + HR + Inventory Integration
```
Replace mock data in:
  /finance/invoices  → useInvoices()
  /finance/expenses  → useExpenses()
  /hr               → useEmployees()
  /inventory        → useProducts()

Wire up:
  Invoice builder → save as draft → send flow
  Leave request approve/deny → PATCH API
  Stock movement → POST adjustment
```

#### Sprint 16 — Dashboard + Search + AI
```
Wire up:
  /dashboard → real stats from useDashboardStats()
  /search    → real global search results
  /ai        → fix RAG (connect vector store to real data)

AI RAG fix:
  Index CRM records into pgvector on create/update
  Wire embedding_service to OpenAI/Anthropic embeddings
  Test: "show me my overdue invoices" returns real data
```

**End of Phase 1: Every page shows real data. You have a working product.**

---

### Phase 2 — Make It Sellable (Sprints 17–20)
**Goal: Paying customers | Timeline: 6–8 weeks**

#### Sprint 17 — Billing & Payments
```
Stripe integration:
  Create Stripe customer on org signup
  Subscription plans: Free, Pro ($49/user), Business ($99/user)
  Billing portal page in /settings/billing
  Webhook: subscription created/updated/cancelled
  Plan enforcement:
    Free     → 5 user limit enforced in API
    Pro      → AI capped at 200 messages/month
    Business → unlimited
```

#### Sprint 18 — Auth Hardening + Onboarding Polish
```
Onboarding flow (Temporal workflow):
  Step 1: Create org + invite team
  Step 2: Import data (CSV upload for leads/contacts)
  Step 3: Configure modules
  Step 4: AI context setup

Email flows (critical for activation):
  Welcome email on signup
  Invite email for team members
  Invoice sent notification
  Ticket assigned notification
  Password reset (schema done — wire the email)
```

#### Sprint 19 — First 10 Customers Sprint
```
Week 1: Deploy to staging (Vercel + Railway/Render), custom domain, 3-min demo video
Week 2: Reach out to 30 businesses — offer 60-day free Pro trial, white-glove setup
Week 3-4: Daily check-ins, fix every bug, add small features requested

Target: 5 paying customers by end of sprint
At $200/month avg = $1,000 MRR
```

#### Sprint 20 — Stability & Customer Feedback
```
Fix all bugs from first customers
Improve loading states, empty states, error states
Set up:
  Sentry    (error tracking — free tier)
  PostHog   (analytics — free tier)
  Intercom  (support chat — free up to 1,000 contacts)

Write first 20 unit tests (auth, leads, invoices)
```

**End of Phase 2: 10–20 paying customers, $2,000–$5,000 MRR.**

---

### Phase 3 — Grow to $20,000 MRR (Sprints 21–28)
**Goal: Break-even | Timeline: 3–4 months**

#### Sprint 21–22 — Enterprise Features
```
SSO / SAML: Okta, Azure AD, Google Workspace
Advanced RBAC: permission enforcement in every endpoint, custom role UI, field-level visibility
Audit log UI: /settings/audit — filterable log, CSV export
Data export: any module as CSV/Excel, full org GDPR export
```

#### Sprint 23–24 — AI Actually Works
```
Real RAG pipeline:
  Embed all org data (leads, contacts, tickets, invoices) on save
  Use pgvector for similarity search
  Context window: last 20 relevant records

AI briefs:
  Daily morning brief: "Here's what needs attention today"
  Delivered via email + in-app
  Auto-generated from real data

AI suggestions:
  "This lead hasn't been contacted in 14 days"
  "Invoice #42 is 7 days overdue"
  "Ticket #88 breaches SLA in 2 hours"

Gate all AI features behind Pro/Business tier
```

#### Sprint 25–26 — Mobile App v1
```
Flutter — 5 core screens only:
  Dashboard (KPIs), CRM leads list + detail,
  Helpdesk tickets, Notifications, Profile

iOS + Android
Connect to same API
Push notifications via FCM
```

#### Sprint 27–28 — Scale & Harden
```
Performance: Redis caching on heavy endpoints, optimize slow Prisma queries, CDN for assets
Testing: tests for every API module, E2E for critical flows (signup, create lead, send invoice)
Monitoring: Grafana Cloud, uptime monitoring, alert on API errors > 1%
Security: rate limiting audit, input validation audit, penetration test
```

**End of Phase 3: $15,000–$25,000 MRR, stable product, mobile app live.**

---

### Full Timeline at a Glance

| Sprints   | Focus                                 | Outcome                            |
|-----------|---------------------------------------|------------------------------------|
| 13–16     | Wire everything to real API           | Working product, real data         |
| 17–18     | Billing live, onboarding works        | Revenue-ready                      |
| 19–20     | First 10 paying customers             | $1,000–$5,000 MRR                  |
| 21–22     | Enterprise features (SSO, RBAC, audit)| Sell to 50+ person companies       |
| 23–24     | AI actually works (real RAG)          | Differentiated product             |
| 25–26     | Mobile app v1                         | Full platform coverage             |
| 27–28     | Hardened, tested, monitored           | $15,000–$25,000 MRR                |
| 29–35     | GTM gaps closed — see Phase 4 below   | $30,000–$50,000 MRR                |

**Total: ~8 months to $15,000–$25,000 MRR, ~11 months to $50,000 MRR**

---

### Phase 4 — Win the Market (Sprints 29–35)
**Goal: $30,000–$50,000 MRR | Timeline: 3 months**

These are not feature gaps — they are go-to-market and trust gaps. A product with all the code in the world does not grow without positioning, proof, and retention mechanics.

---

#### Sprint 29 — Sharp Positioning + ICP Clarity
**Problem:** "Best all-in-one OS" is too broad. Buyers need to instantly know if Omnivara is for them.

```
Positioning work:
  Pick the ICP: agencies and professional services firms under 50 employees
  Rewrite hero copy: "The operating system for agencies — CRM, projects, helpdesk,
                      and finance in one place. AI included."
  Update /pricing with per-ICP benefit bullets
  Add a comparison page: Omnivara vs. Zoho vs. HubSpot + Monday

Web tasks:
  New landing page hero section with ICP-specific headline and sub-headline
  3-sentence value props for each persona (founder, sales, support, ops)
  "Trusted by agencies, consultants, and IT services firms" social proof strip
  Add Omnivara to G2, Capterra, Product Hunt
```

---

#### Sprint 30 — 15-Minute "Aha" Onboarding Path
**Problem:** A new user who registers and sees an empty dashboard will churn. The product must
guide them to first value in under 15 minutes.

```
Onboarding checklist (in-app, dismissible):
  ☐ Import your first leads (CSV or type manually)        → /crm/leads
  ☐ Create your pipeline                                  → /crm/pipeline
  ☐ Send your first invoice                               → /finance/invoices/new
  ☐ Open your first support ticket                        → /helpdesk/new
  ☐ Invite a teammate                                     → /settings/members

Sample data seeding:
  "Start with sample data" toggle on first login
  Seeds 5 leads, 2 pipeline deals, 1 invoice, 2 tickets for the org
  Removable in one click from onboarding banner

Empty-state upgrades for every module:
  Each module's empty state gets an illustration + 1-sentence CTA + action button
  No more blank white boxes on a fresh account

Onboarding email sequence (5 emails, triggered by day):
  Day 0: Welcome + 3-step quick start guide
  Day 1: "Did you import your leads yet?" + import guide link
  Day 3: "Your first invoice takes 60 seconds" + video link
  Day 7: "Your trial is going well — here's what's next" + feature spotlight
  Day 12: "Trial ends in 2 days" + upgrade CTA with Stripe checkout link
```

---

#### Sprint 31 — Vertical Templates
**Problem:** Buyers want to feel like the product was built for them. Blank slates create friction.

```
Template library at /settings/templates or shown during onboarding:

  Agency template:
    Pipeline stages: Lead → Discovery → Proposal → Contract → Active → Closed
    Project types: Website Build, Brand Identity, SEO Retainer, Campaign
    Helpdesk categories: Revision Request, Bug, Feedback, New Feature
    Invoice line items: Design hours, Dev hours, Ad spend, Monthly retainer

  IT Support / MSP template:
    Pipeline stages: Prospect → Assessment → Proposal → Onboarding → Active
    Ticket categories: Hardware, Software, Network, Security, Billing
    SLA presets: P1 2hr, P2 8hr, P3 48hr
    Recurring invoice: Monthly managed services

  Consulting firm template:
    Pipeline stages: Inquiry → Scoping → Engagement → Delivery → Renewal
    Project phases: Discovery, Strategy, Delivery, Review
    Invoice structure: Retainer, Milestone, T&M

Implementation:
  Templates stored as JSON seed data in DB
  Applied via POST /orgs/:orgId/templates/:templateId
  Can be applied at onboarding ("What kind of business are you?") or from settings
```

---

#### Sprint 32 — Trust Infrastructure
**Problem:** Enterprise buyers and even SMBs need proof before purchasing. Missing trust signals
silently kill deals.

```
Pages to build:
  /security       — Encryption at rest (AES-256), in transit (TLS 1.3), SOC 2 roadmap,
                    pen test summary, backup policy (daily snapshots, 30-day retention),
                    responsible disclosure policy
  /uptime         — Live status page (Statuspage.io free tier or self-hosted),
                    90-day uptime history, incident log
  /privacy        — GDPR compliance story, data residency options, DPA template download
  /compliance     — GDPR, CCPA, ISO 27001 roadmap, audit log feature callout

Social proof to collect:
  Reach out to first 10 customers for a 2-sentence quote + logo
  Write 2 case studies (format: customer, problem, solution, result in numbers)
  Add testimonials strip to /pricing and landing page

Procurement doc pack (PDF downloads from /security or on request):
  Data Processing Agreement (DPA) template
  Security questionnaire answers (standard 30-question format)
  Sub-processor list (Stripe, AWS/Fly.io, Anthropic, Resend, Sentry)
  Penetration test summary (run a basic test via HackerOne or Cobalt)
```

---

#### Sprint 33 — Conversion Funnel Polish
**Problem:** The pricing page exists but the full conversion path has gaps: no demo flow, weak
trial nudges, and no in-app upgrade triggers at the right moment.

```
Demo flow:
  Add "Book a demo" CTA on /pricing (Calendly embed or mailto)
  Build a read-only demo org pre-populated with realistic data (agency scenario)
  Demo link: /demo — auto-logs in as demo@omnivara.io, read-only mode, resets hourly

In-app upgrade triggers (show upgrade modal when hitting a limit):
  User tries to invite 11th member on Growth → "Upgrade to Business for unlimited users"
  User sends 201st AI message → "You've hit your monthly AI limit — upgrade for unlimited"
  User tries to access SAML SSO settings → "SSO is available on Business and above"
  Each trigger links directly to /settings/billing with the right plan pre-selected

Trial nudge bar:
  Sticky top bar during trial: "12 days left in your trial · Upgrade now to keep access →"
  Disappears after upgrade, reappears on day 10 if still on trial

Abandoned registration recovery:
  If user starts register form but doesn't complete, send one reminder email 24h later
  Subject: "You started setting up Omnivara — finish in 2 minutes"
```

---

#### Sprint 34 — Retention Mechanics
**Problem:** Acquiring customers is hard. Losing them silently is worse. Without health scoring and
lifecycle messaging, churn happens invisibly.

```
Customer health score (internal, shown in admin panel):
  Score 0–100 based on:
    Logins in last 14 days (0–30 pts)
    Records created last 30 days (0–20 pts)
    Modules used (0–20 pts — more modules = higher score)
    AI messages sent (0–15 pts)
    Team members active (0–15 pts)
  Red (<40), Yellow (40–70), Green (>70)
  Shown in /admin/customers (internal admin view)
  Weekly digest email to founder with at-risk accounts

Churn-risk alerts:
  Trigger: no login in 7 days during trial → send "Are you stuck?" email with quick-start link
  Trigger: health score drops below 40 → internal Slack notification to founder
  Trigger: no data imported after 48h → send "Start with sample data" email

Lifecycle email sequences (PostHog or Resend automations):
  New feature announcement (monthly, 3 sentences + screenshot)
  Usage report email (weekly, "Here's what your team did this week")
  Renewal reminder at 30, 14, 7 days before annual renewal

In-app NPS (quarterly):
  Modal asking "How likely are you to recommend Omnivara? (0–10)"
  If <7: "What could we do better?" + route to support
  If >8: "Leave us a review on G2" + link
```

---

#### Sprint 35 — Enterprise Buying Basics
**Problem:** Any deal over $500/mo will involve a procurement review. Without these docs and
controls, deals stall or die in security review.

```
Role permissions matrix:
  Publish a clear table at /docs/permissions or in-app help:
    Role (Admin, Manager, Member, Viewer) × Resource (leads, projects, invoices, etc.)
    × Action (create, read, update, delete)
  Expose this in the UI at /settings/roles with toggle matrix

Audit log enhancements:
  Ensure every mutating API call is logged (already done in audit interceptor)
  Add CSV/PDF export with date range filter from /settings/audit
  Retention: 90 days on Business, 1 year on Enterprise

SSO documentation:
  Step-by-step setup guide for Okta, Azure AD, Google Workspace, and generic SAML 2.0
  Hosted at /docs/sso or in in-app help
  Include SP metadata XML download button (already in /auth/sso/saml/metadata)

Procurement answers (self-serve):
  FAQ page at /security or in help docs answering standard procurement questions:
    "Where is data stored?" (AWS region), "Is data encrypted at rest?", "Who has access?",
    "What is your uptime SLA?", "Do you have SOC 2?", "What is your backup policy?",
    "Do you offer a DPA?", "Can we get a penetration test report?"

Data processing agreement:
  DPA template downloadable from /legal/dpa
  Covers: data controller/processor roles, sub-processors, EU SCCs, retention, deletion

Multi-org / white-label (optional, for agencies reselling):
  Allow one account to manage multiple client orgs
  Custom subdomain per org (client.omnivara.io)
  Logo and color theming per org
```

---

### Phase 4 Summary

| Sprint | Focus                        | Key Output                                              |
|--------|------------------------------|---------------------------------------------------------|
| 29     | Positioning + ICP clarity    | Sharp hero copy, comparison page, G2/Capterra listings  |
| 30     | 15-minute aha onboarding     | Checklist, sample data, 5-email sequence, empty states  |
| 31     | Vertical templates           | Agency, IT/MSP, Consulting prebuilt configs             |
| 32     | Trust infrastructure         | /security, /uptime, /compliance, case studies, DPA      |
| 33     | Conversion funnel polish     | Demo org, upgrade triggers, trial nudge bar             |
| 34     | Retention mechanics          | Health score, churn alerts, lifecycle emails, NPS       |
| 35     | Enterprise buying basics     | Permissions matrix, SSO docs, audit export, DPA page    |

**End of Phase 4: $30,000–$50,000 MRR, enterprise-ready, low churn, self-serve funnel that converts.**

The product code is done. Phase 4 is entirely go-to-market execution.
