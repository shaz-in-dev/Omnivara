-- Migration: 0003_auth_tokens
-- Adds password_reset_tokens and email_verify_tokens tables

CREATE TABLE "password_reset_tokens" (
  "id"        TEXT         NOT NULL PRIMARY KEY,
  "userId"    TEXT         NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "token"     TEXT         NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "used"      BOOLEAN      NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "email_verify_tokens" (
  "id"        TEXT         NOT NULL PRIMARY KEY,
  "userId"    TEXT         NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "token"     TEXT         NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
