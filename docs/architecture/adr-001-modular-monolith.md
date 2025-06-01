# ADR-001: Start with NestJS Modular Monolith

**Status:** Accepted
**Date:** 2026-05-26

## Context
We need to choose an initial backend architecture that allows fast iteration for a small team while keeping a clean path to microservices as the product scales.

## Decision
Start with a **NestJS modular monolith**. Each business domain (CRM, Projects, Helpdesk, Finance, HR, Inventory) is a NestJS module with its own controllers, services, and DTOs. Modules communicate in-process via injected services and asynchronous domain events via Kafka.

## Rationale
- Monolith is faster to develop, test, and deploy for a small team
- NestJS modules create natural bounded contexts without the overhead of separate deployments
- Kafka integration provides the event backbone needed for eventual service extraction
- Prisma + PostgreSQL with tenant_id guards is simpler to reason about than cross-service distributed queries
- Can extract high-load modules (e.g., AI service is already separate) as services only when needed

## Consequences
- All modules share the same database connection pool (mitigated by Prisma connection management)
- A bug in one module can theoretically affect others (mitigated by NestJS DI isolation and tests)
- Deployment is atomic — no partial rollout per module (mitigated by feature flags)
