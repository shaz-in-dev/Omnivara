"""Vector store — pgvector-backed semantic search."""
from __future__ import annotations

import json
from typing import Any

import asyncpg
from app.config import settings
from app.services.embedding_service import EmbeddingService

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(settings.database_url, min_size=2, max_size=10)
    return _pool


class VectorStore:
    def __init__(self) -> None:
        self.embedding_service = EmbeddingService()

    async def index(
        self,
        org_id: str,
        document_id: str,
        document_type: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Upsert a document with its embedding into the vector store."""
        embedding = await self.embedding_service.embed_single(content)
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO document_embeddings
                    (org_id, document_id, document_type, content, embedding, metadata)
                VALUES ($1, $2, $3, $4, $5::vector, $6)
                ON CONFLICT (org_id, document_id)
                DO UPDATE SET
                    content = EXCLUDED.content,
                    embedding = EXCLUDED.embedding,
                    metadata = EXCLUDED.metadata,
                    updated_at = now()
                """,
                org_id,
                document_id,
                document_type,
                content,
                json.dumps(embedding),
                json.dumps(metadata or {}),
            )

    async def search(
        self,
        org_id: str,
        query: str,
        limit: int = 10,
        document_types: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        """Semantic search over indexed documents."""
        query_embedding = await self.embedding_service.embed_single(query)
        pool = await get_pool()

        type_filter = ""
        params: list[Any] = [org_id, json.dumps(query_embedding), limit]
        if document_types:
            type_filter = f"AND document_type = ANY(${len(params) + 1})"
            params.append(document_types)

        async with pool.acquire() as conn:
            rows = await conn.fetch(
                f"""
                SELECT
                    document_id,
                    document_type,
                    content,
                    metadata,
                    1 - (embedding <=> $2::vector) AS similarity
                FROM document_embeddings
                WHERE org_id = $1
                  {type_filter}
                ORDER BY embedding <=> $2::vector
                LIMIT $3
                """,
                *params,
            )

        return [
            {
                "id": row["document_id"],
                "type": row["document_type"],
                "content": row["content"],
                "metadata": json.loads(row["metadata"]),
                "score": float(row["similarity"]),
                "title": json.loads(row["metadata"]).get("title", row["document_id"]),
            }
            for row in rows
        ]

    async def delete(self, org_id: str, document_id: str) -> None:
        """Remove a document from the vector store."""
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "DELETE FROM document_embeddings WHERE org_id = $1 AND document_id = $2",
                org_id,
                document_id,
            )
