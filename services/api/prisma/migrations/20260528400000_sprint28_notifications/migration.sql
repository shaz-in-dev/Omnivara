-- Sprint 28: Persistent Notifications
-- Replaces the in-memory RxJS Subject with a real DB-backed notification table.

CREATE TABLE IF NOT EXISTS "notifications" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId"     TEXT        NOT NULL,
  "userId"    TEXT,                               -- NULL = broadcast to all org members
  "type"      TEXT        NOT NULL,
  "title"     TEXT        NOT NULL,
  "body"      TEXT        NOT NULL,
  "url"       TEXT,
  "read"      BOOLEAN     NOT NULL DEFAULT false,
  "readAt"    TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "notifications_pkey"      PRIMARY KEY ("id"),
  CONSTRAINT "notifications_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE
);

-- Unread fetch: orgId + userId + read (most common query)
CREATE INDEX IF NOT EXISTS "notifications_orgId_userId_read_idx"
  ON "notifications"("orgId", "userId", "read");

-- Sorted recent list
CREATE INDEX IF NOT EXISTS "notifications_orgId_createdAt_idx"
  ON "notifications"("orgId", "createdAt" DESC);

-- Auto-expire old notifications after 90 days (run by a scheduled job)
-- No hard DB TTL — the scheduler in Sprint 28 handles cleanup.
