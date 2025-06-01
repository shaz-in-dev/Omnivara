-- Migration: 0002_hr_inventory
-- Adds HR (employees, leave_requests) and Inventory (products, stock_movements) tables

-- ── Enums ─────────────────────────────────────────────────────────────────────

CREATE TYPE "EmploymentStatus" AS ENUM ('active', 'on_leave', 'terminated', 'offboarding');
CREATE TYPE "LeaveType"        AS ENUM ('annual', 'sick', 'personal', 'parental', 'unpaid');
CREATE TYPE "LeaveRequestStatus" AS ENUM ('pending', 'approved', 'denied', 'cancelled');
CREATE TYPE "StockStatus"      AS ENUM ('in_stock', 'low_stock', 'out_of_stock', 'discontinued');

-- ── HR: employees ─────────────────────────────────────────────────────────────

CREATE TABLE "employees" (
  "id"               TEXT         NOT NULL PRIMARY KEY,
  "orgId"            TEXT         NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "userId"           TEXT,
  "employeeNumber"   TEXT,
  "firstName"        TEXT         NOT NULL,
  "lastName"         TEXT         NOT NULL,
  "email"            TEXT         NOT NULL,
  "phone"            TEXT,
  "jobTitle"         TEXT         NOT NULL,
  "department"       TEXT         NOT NULL,
  "location"         TEXT,
  "managerId"        TEXT         REFERENCES "employees"("id") ON DELETE SET NULL,
  "status"           "EmploymentStatus" NOT NULL DEFAULT 'active',
  "startDate"        TIMESTAMP(3) NOT NULL,
  "endDate"          TIMESTAMP(3),
  "salary"           DECIMAL(15,2),
  "currency"         TEXT         NOT NULL DEFAULT 'USD',
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("orgId", "email")
);

CREATE INDEX "employees_orgId_status_idx"     ON "employees"("orgId", "status");
CREATE INDEX "employees_orgId_department_idx" ON "employees"("orgId", "department");

-- ── HR: leave_requests ────────────────────────────────────────────────────────

CREATE TABLE "leave_requests" (
  "id"          TEXT         NOT NULL PRIMARY KEY,
  "orgId"       TEXT         NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "employeeId"  TEXT         NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "type"        "LeaveType"  NOT NULL,
  "startDate"   TIMESTAMP(3) NOT NULL,
  "endDate"     TIMESTAMP(3) NOT NULL,
  "days"        INTEGER      NOT NULL,
  "reason"      TEXT,
  "status"      "LeaveRequestStatus" NOT NULL DEFAULT 'pending',
  "reviewedBy"  TEXT,
  "reviewedAt"  TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "leave_requests_orgId_status_idx" ON "leave_requests"("orgId", "status");
CREATE INDEX "leave_requests_employeeId_idx"   ON "leave_requests"("employeeId");

-- ── Inventory: products ───────────────────────────────────────────────────────

CREATE TABLE "products" (
  "id"                TEXT        NOT NULL PRIMARY KEY,
  "orgId"             TEXT        NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "sku"               TEXT        NOT NULL,
  "name"              TEXT        NOT NULL,
  "description"       TEXT,
  "category"          TEXT,
  "unitCost"          DECIMAL(15,2) NOT NULL DEFAULT 0,
  "salePrice"         DECIMAL(15,2) NOT NULL DEFAULT 0,
  "stockQuantity"     INTEGER     NOT NULL DEFAULT 0,
  "reorderPoint"      INTEGER     NOT NULL DEFAULT 0,
  "reorderQuantity"   INTEGER     NOT NULL DEFAULT 0,
  "warehouseLocation" TEXT,
  "supplierId"        TEXT,
  "status"            "StockStatus" NOT NULL DEFAULT 'in_stock',
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("orgId", "sku")
);

CREATE INDEX "products_orgId_category_idx" ON "products"("orgId", "category");
CREATE INDEX "products_orgId_status_idx"   ON "products"("orgId", "status");

-- ── Inventory: stock_movements ────────────────────────────────────────────────

CREATE TABLE "stock_movements" (
  "id"          TEXT         NOT NULL PRIMARY KEY,
  "orgId"       TEXT         NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "productId"   TEXT         NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "quantity"    INTEGER      NOT NULL,
  "type"        TEXT         NOT NULL,
  "reference"   TEXT,
  "notes"       TEXT,
  "performedBy" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "stock_movements_productId_createdAt_idx" ON "stock_movements"("productId", "createdAt");
