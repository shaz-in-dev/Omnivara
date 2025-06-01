# Omnivara One — Dev Notes

## Demo Credentials
```
admin@acme.com   / Password123!
sarah@acme.com   / Password123!
support@acme.com / Password123!
```

## Local Dev URLs
| Service        | URL                        |
|----------------|----------------------------|
| Web App        | http://localhost:3000      |
| API (NestJS)   | http://localhost:3001      |
| Swagger UI     | http://localhost:3001/api  |
| AI Service     | http://localhost:8000      |
| MailHog UI     | http://localhost:8025      |
| MinIO Console  | http://localhost:9001      |
| Temporal UI    | http://localhost:8080      |
| PostgreSQL     | localhost:5432             |
| Redis          | localhost:6379             |

## Sprint Status

### ✅ Sprint 1-2 — Foundation
- Monorepo (pnpm + Turborepo), Docker Compose, NestJS scaffold, Next.js shell

### ✅ Sprint 3-4 — Auth + Core UX
- JWT auth (cookie-based), middleware route protection, token refresh queue
- Kanban board (HTML5 DnD), command palette (⌘K), notification drawer
- CRM modal forms: lead, opportunity, contact
- Database schema (16 tables), seed data

### ✅ Sprint 7-8 — AI Copilot + Analytics + HR + Inventory + Pipeline DnD
- **AI Copilot**: Streaming SSE chat (wired to FastAPI), markdown rendering, suggested action chips, floating trigger (Ctrl+/), copilotOpen in ui.store, dedicated `/ai` page
- **Analytics**: Pure SVG charts — revenue vs expenses line chart (hover tooltips), lead funnel with drop-rate annotation, ticket volume bar chart, 8-KPI grid with sparklines
- **HR Module**: Employee card grid, department filter, leave request approve/deny queue, employee detail slide-over (profile / leave balance / leave history)
- **Inventory**: Product table with stock-level color coding, low-stock alert banner, stock status pills, product detail slide-over with stock bar + adjustment form + movement history
- **CRM Pipeline**: HTML5 DnD on PipelineBoard (drag deals between stages, optimistic local state), rich mock data, per-stage deal totals, drop-zone highlight, Add deal button per column
- **NestJS**: HR module (employees CRUD, leave request submit/review), Inventory module (products CRUD, stock adjustment with StockMovement log, low-stock query)
- **Prisma**: Employee, LeaveRequest, Product, StockMovement models + migration 0002
- **ui.store**: Added `copilotOpen`, `setCopilotOpen`, `toggleCopilot`

### ✅ Sprint 5-6 — Modules + API
- **Helpdesk**: ticket list with SLA countdown, ticket detail slide-over, reply thread
- **Finance**: invoice builder with line items, tax, send flow; invoice list with summary cards
- **Settings**: sidebar nav, General (logo/org/regional), Members (invite/manage), Roles (permission matrix)
- **CRM detail drawers**: Lead detail + contact detail slide-overs with activity logs
- **NestJS**: dashboard stats endpoint, email service (nodemailer + MailHog), global search endpoint
- **Shared components**: SlideOver, StatusBadge variants

### ✅ Sprint 18 — Mock Data Elimination (all sub-components)
- leave-requests, employee-detail, contact-detail, product-detail: wired to real APIs
- members-settings: new GET/POST /orgs/:orgId/members endpoints
- backlog-view: new useSprints + useTasks(sprintId='backlog')
- ticket-detail: TicketReply model + endpoint + useTicketReplies hook
- task-detail: TaskComment + TaskChecklist models + endpoints + hooks
- use-notifications: empty initial state (was MOCK_NOTIFICATIONS)

### ✅ Sprint 20 — Stability & Customer Feedback (per blueprint §23)
**Remaining stubs wired:**
- InvoiceBuilder: real POST /finance/invoices + POST /finance/invoices/:id/send (was fake setTimeout)
- Projects: "New Project" button → CreateProjectModal + useCreateProject
- Projects: "Add task" → CreateTaskModal + useCreateTask
- Projects: "Delete task" → useDeleteTask + DELETE /projects/:projectId/tasks/:id

**Observability & support tooling:**
- Sentry: @sentry/nextjs (web) + @sentry/node (API) — init in providers.tsx + main.ts
- PostHog: posthog-js — initPostHog() in providers.tsx, lib/posthog.ts helper
- Intercom: IntercomWidget in providers.tsx — loads when NEXT_PUBLIC_INTERCOM_APP_ID set
- .env.example: SENTRY_DSN, NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_INTERCOM_APP_ID

**First 20 unit tests (all passing):**
- auth.service.spec.ts: validateUser (3), login (2), register (2) = 7 tests
- leads.service.spec.ts: create (2), findAll (2), findOne (2), update (1) = 7 tests
- invoices.service.spec.ts: create (3), findOne (2), send (1), updateStatus (1) = 7 tests
Total: 21 tests, 100% pass rate

## Architecture Notes
- All org-scoped API routes: `GET /orgs/:orgId/...` protected by JwtAuthGuard + TenantGuard
- Global search: `GET /orgs/:orgId/search?q=<term>`
- Email: MailHog on localhost:1025 in dev (web UI at :8025)
- Brand color: indigo (`brand-500 = #6366f1`)
