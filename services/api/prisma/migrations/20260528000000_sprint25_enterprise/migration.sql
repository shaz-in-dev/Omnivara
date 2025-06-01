-- Sprint 25: Enterprise Features
-- AuditLog, ApiKey, SsoConfig tables

-- ── AuditLog ─────────────────────────────────────────────────────────────────

CREATE TABLE "audit_logs" (
  "id"           TEXT NOT NULL,
  "orgId"        TEXT NOT NULL,
  "userId"       TEXT,
  "action"       TEXT NOT NULL,
  "resourceId"   TEXT,
  "resourceType" TEXT,
  "before"       JSONB,
  "after"        JSONB,
  "ipAddress"    TEXT,
  "userAgent"    TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_orgId_createdAt_idx" ON "audit_logs"("orgId", "createdAt");
CREATE INDEX "audit_logs_orgId_action_idx"    ON "audit_logs"("orgId", "action");

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── ApiKey ──────────────────────────────────────────────────────────────────

CREATE TABLE "api_keys" (
  "id"         TEXT NOT NULL,
  "orgId"      TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "keyHash"    TEXT NOT NULL,
  "prefix"     TEXT NOT NULL,
  "lastUsed"   TIMESTAMP(3),
  "expiresAt"  TIMESTAMP(3),
  "createdBy"  TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");
CREATE INDEX "api_keys_orgId_idx" ON "api_keys"("orgId");

ALTER TABLE "api_keys"
  ADD CONSTRAINT "api_keys_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ── SsoConfig ────────────────────────────────────────────────────────────────

CREATE TABLE "sso_configs" (
  "id"          TEXT NOT NULL,
  "orgId"       TEXT NOT NULL,
  "provider"    TEXT NOT NULL DEFAULT 'saml',
  "entryPoint"  TEXT NOT NULL,
  "issuer"      TEXT NOT NULL,
  "cert"        TEXT NOT NULL,
  "enabled"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "sso_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sso_configs_orgId_key" ON "sso_configs"("orgId");

ALTER TABLE "sso_configs"
  ADD CONSTRAINT "sso_configs_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
