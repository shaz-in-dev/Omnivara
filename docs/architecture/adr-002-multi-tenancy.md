# ADR-002: Shared Database with Row-Level Security

**Status:** Accepted
**Date:** 2026-05-26

## Context
Omnivara is a multi-tenant SaaS. We need to decide between:
1. Database-per-tenant (full isolation, expensive)
2. Schema-per-tenant (moderate isolation, complex migrations)
3. Shared DB with tenant_id + RLS (cost-efficient, simpler migrations)

## Decision
Use **shared PostgreSQL database with tenant_id on every table + PostgreSQL Row-Level Security (RLS)**.

Application sets `SET app.current_tenant = '<org_id>'` at the start of each request via Prisma middleware. RLS policies enforce that all queries are scoped to the current tenant.

Enterprise customers can get dedicated DB instances as an add-on.

## Implementation
- Every domain table has `org_id` (NOT NULL, indexed)
- Prisma middleware sets `app.current_tenant` per request
- RLS policies read `current_tenant()` function
- CI tests include a cross-tenant query test suite

## Consequences
- Migrations are simpler (one schema, not N schemas)
- Data leakage risk is mitigated by RLS + application-level guards + CI tests
- Performance is good for Growth tier; Enterprise gets dedicated infra option
