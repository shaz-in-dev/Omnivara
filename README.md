# Omnivara One

> Unified AI-native Business Operating System

Omnivara One is a full-stack, multi-tenant SaaS platform — combining CRM, Projects, Helpdesk, Finance, HR, and Inventory into one AI-powered experience. Think Zoho-meets-Notion, built with a premium engineering foundation.

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                     Omnivara One                            │
├────────────┬────────────┬──────────────────────────────────┤
│  apps/web  │ apps/mobile│         apps/desktop             │
│  Next.js   │  Flutter   │   Tauri (reuses web frontend)    │
├────────────┴────────────┴──────────────────────────────────┤
│                    services/api  (NestJS)                   │
│              Modular Monolith · REST + WebSocket            │
├────────────────────────┬────────────────────────────────────┤
│   services/ai (FastAPI)│  services/workflow (Temporal)      │
│   Embeddings · RAG     │  Durable workflows · Automation    │
├────────────────────────┴────────────────────────────────────┤
│  PostgreSQL · Redis · Kafka · ClickHouse · OpenSearch · S3  │
└─────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose
- Flutter SDK 3.x (for mobile)
- Rust (for desktop/Tauri)

### 1. Clone and install

```bash
git clone https://github.com/your-org/omnivara.git
cd omnivara
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start infrastructure

```bash
pnpm docker:up
```

This starts: PostgreSQL, Redis, Kafka (+ Zookeeper), MinIO, MailHog, ClickHouse, OpenSearch.

### 4. Start development servers

```bash
pnpm dev
```

This starts all apps and services in parallel via Turborepo.

## Repository Structure

```
omnivara/
├── apps/
│   ├── web/          # Next.js 14 App Router (primary web surface)
│   ├── mobile/       # Flutter app (iOS + Android)
│   └── desktop/      # Tauri desktop shell
├── services/
│   ├── api/          # NestJS modular monolith
│   ├── ai/           # Python FastAPI AI microservices
│   └── workflow/     # Temporal workflow workers
├── packages/
│   ├── ui/           # Shared React component library
│   ├── contracts/    # TypeScript API contracts & types
│   └── config/       # Shared configuration utilities
├── infra/
│   ├── terraform/    # Infrastructure as Code
│   └── k8s/          # Kubernetes manifests
├── docs/
│   └── architecture/ # Architecture decision records
└── docker-compose.yml
```

## Modules Roadmap

| Module | Phase | Status |
|--------|-------|--------|
| Identity & Access (IAM) | Foundation | 🚧 In Progress |
| CRM Pro | Foundation | 📋 Planned |
| Projects & Agile | Foundation | 📋 Planned |
| Helpdesk & Success | Foundation | 📋 Planned |
| Finance & Billing | Foundation | 📋 Planned |
| HR & People Ops | Expansion | 📋 Planned |
| Inventory & Procurement | Expansion | 📋 Planned |
| AI Copilot | Expansion | 📋 Planned |
| Analytics & Data Studio | Expansion | 📋 Planned |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Frontend | Next.js 14, TypeScript, Tailwind CSS, TanStack Query, Zustand |
| Mobile | Flutter, Riverpod, GoRouter, Dio |
| Desktop | Tauri + Web frontend |
| API | NestJS, TypeScript, Prisma, PostgreSQL |
| AI Services | Python, FastAPI, LangChain |
| Workflow | Temporal.io |
| Messaging | Apache Kafka |
| Cache | Redis |
| Search | OpenSearch |
| Analytics DB | ClickHouse |
| Object Storage | S3-compatible (MinIO dev, S3 prod) |
| Infra | Kubernetes, Helm, Terraform, ArgoCD |
| Observability | OpenTelemetry, Prometheus, Grafana, Loki |

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

## License

Private — All rights reserved.
