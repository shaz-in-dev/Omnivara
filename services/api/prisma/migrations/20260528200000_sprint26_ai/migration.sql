-- Sprint 26: AI Infrastructure
-- Enable pgvector extension and create document_embeddings table

-- pgvector extension (must run as superuser once per DB)
CREATE EXTENSION IF NOT EXISTS vector;

-- ── document_embeddings ───────────────────────────────────────────────────────
-- Stores per-org document embeddings for RAG semantic search.
-- 1536 dims = OpenAI text-embedding-3-small / voyage-3-lite compatible.

CREATE TABLE IF NOT EXISTS "document_embeddings" (
  "id"            TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "org_id"        TEXT        NOT NULL,
  "document_id"   TEXT        NOT NULL,
  "document_type" TEXT        NOT NULL,  -- 'lead' | 'contact' | 'ticket' | 'invoice'
  "content"       TEXT        NOT NULL,
  "embedding"     vector(1536),
  "metadata"      JSONB       NOT NULL DEFAULT '{}',
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "document_embeddings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_embeddings_org_doc_idx"
  ON "document_embeddings"("org_id", "document_id");

CREATE INDEX "document_embeddings_org_type_idx"
  ON "document_embeddings"("org_id", "document_type");

-- IVFFlat index for approximate nearest-neighbor search (cosine distance)
-- Build after initial data load: CREATE INDEX ... WITH (lists = 100)
-- For small tables (<100k rows), exact search is fast enough.
CREATE INDEX "document_embeddings_embedding_idx"
  ON "document_embeddings" USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 50);
