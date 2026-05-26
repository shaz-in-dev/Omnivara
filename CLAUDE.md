# CLAUDE.md — Omnivara One

This file gives Claude Code context about this repository.

## Project Overview

Omnivara One is a unified AI-native Business Operating System — a multi-tenant SaaS platform
combining CRM, Projects, Helpdesk, Finance, HR, and Inventory modules with embedded AI.

## Repository Structure

- `apps/web` — Next.js 14 App Router (primary web frontend)
- `apps/mobile` — Flutter mobile app
- `apps/desktop` — Tauri desktop app
- `services/api` — NestJS modular monolith (main backend)
- `services/ai` — Python FastAPI AI microservices
- `services/workflow` — Temporal workflow workers (TypeScript)
- `packages/ui` — Shared React component library
- `packages/contracts` — Shared TypeScript types and API contracts
- `packages/config` — Shared config utilities
- `infra/terraform` — Infrastructure as Code
- `infra/k8s` — Kubernetes manifests
- `docs/` — Architecture docs and ADRs

## Key Engineering Decisions

1. **Monorepo** — pnpm workspaces + Turborepo for build orchestration
2. **Multi-tenant** — Shared Postgres with tenant_id + Row Level Security
3. **API** — NestJS modular monolith first, split into services only when needed
4. **Auth** — JWT (access + refresh tokens), RBAC + ABAC, OIDC/SAML for enterprise
5. **AI** — Retrieval-augmented generation with tenant-scoped vector search
6. **Events** — Kafka for async domain events with outbox pattern

## Development Commands

```bash
pnpm install          # Install all dependencies
pnpm dev              # Start all apps/services in parallel
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm test             # Run all tests
pnpm docker:up        # Start local infrastructure (DB, Redis, Kafka, etc.)
pnpm docker:down      # Stop infrastructure
```

## Coding Standards

- TypeScript strict mode everywhere (web, api, packages)
- ESLint + Prettier enforced in CI
- All API endpoints have OpenAPI/Swagger docs
- Every module has unit tests (80%+ coverage target)
- No direct DB queries outside repository classes
- Use feature flags for incremental rollouts
- All tenant-scoped queries MUST include tenant_id guard

## Current Sprint (Sprint 1-2)

- Monorepo and tooling foundation ✅
- Docker Compose dev environment
- NestJS API scaffold
- Next.js web shell
- Flutter mobile shell
- Auth module: users, orgs, roles, JWT
- Tenant model + RLS policies
