-- Omnivara One — PostgreSQL initialization
-- This runs once when the container is first created

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for AI embeddings

-- Create schema for audit trail
CREATE SCHEMA IF NOT EXISTS audit;

-- Row-Level Security helper: get current tenant
-- Used by application-set config parameter: SET app.current_tenant = '<org_id>'
CREATE OR REPLACE FUNCTION current_tenant() RETURNS text AS $$
  SELECT current_setting('app.current_tenant', true);
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION current_tenant() IS 'Returns the current tenant ID set by the application for RLS';

-- Document embeddings table for AI/RAG (vector search)
CREATE TABLE IF NOT EXISTS document_embeddings (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id        TEXT NOT NULL,
  document_id   TEXT NOT NULL,
  document_type TEXT NOT NULL,
  content       TEXT NOT NULL,
  embedding     vector(1536),
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT document_embeddings_org_doc_unique UNIQUE (org_id, document_id)
);

-- HNSW index for fast ANN search (pgvector >= 0.5)
CREATE INDEX IF NOT EXISTS document_embeddings_embedding_hnsw
  ON document_embeddings USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Tenant isolation index
CREATE INDEX IF NOT EXISTS document_embeddings_org_id_idx
  ON document_embeddings (org_id);

-- Partial index by type for filtered searches
CREATE INDEX IF NOT EXISTS document_embeddings_type_idx
  ON document_embeddings (org_id, document_type);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_embeddings_updated_at
  BEFORE UPDATE ON document_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
