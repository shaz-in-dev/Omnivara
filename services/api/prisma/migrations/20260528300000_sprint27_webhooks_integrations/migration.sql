-- Sprint 27: Webhooks + Integrations
-- Adds tokens column to ai_usage (if not already present from Sprint 26 fix)
ALTER TABLE "ai_usage" ADD COLUMN IF NOT EXISTS "tokens" INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- WEBHOOKS
-- ============================================================

CREATE TABLE IF NOT EXISTS "webhooks" (
  "id"         TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId"      TEXT         NOT NULL,
  "url"        TEXT         NOT NULL,
  "events"     TEXT[]       NOT NULL DEFAULT '{}',
  "secret"     TEXT         NOT NULL,
  "active"     BOOLEAN      NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "webhooks_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "webhooks_orgId_idx" ON "webhooks"("orgId");

-- ============================================================
-- WEBHOOK DELIVERIES
-- ============================================================

CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "webhookId"    TEXT        NOT NULL,
  "event"        TEXT        NOT NULL,
  "payload"      JSONB       NOT NULL DEFAULT '{}',
  "status"       TEXT        NOT NULL DEFAULT 'pending',
  "statusCode"   INTEGER,
  "responseBody" TEXT,
  "attempts"     INTEGER     NOT NULL DEFAULT 0,
  "deliveredAt"  TIMESTAMPTZ,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "webhook_deliveries_webhookId_fkey"
    FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "webhook_deliveries_webhookId_createdAt_idx"
  ON "webhook_deliveries"("webhookId", "createdAt");

-- ============================================================
-- SLACK INTEGRATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS "slack_integrations" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId"       TEXT        NOT NULL,
  "accessToken" TEXT        NOT NULL,
  "channelId"   TEXT        NOT NULL,
  "channelName" TEXT        NOT NULL,
  "installedBy" TEXT        NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "slack_integrations_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "slack_integrations_orgId_key"      UNIQUE ("orgId"),
  CONSTRAINT "slack_integrations_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE
);
