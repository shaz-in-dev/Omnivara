"""Embeddings and vector search router."""
from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    EmbeddingRequest,
    EmbeddingResponse,
    IndexDocumentRequest,
    SearchRequest,
    SearchResponse,
    SearchResult,
)
from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStore

router = APIRouter()
_embedding_service = EmbeddingService()
_vector_store = VectorStore()


@router.post("/embed", response_model=EmbeddingResponse)
async def embed_texts(req: EmbeddingRequest):
    """Generate embeddings for a list of texts."""
    try:
        embeddings = await _embedding_service.embed(req.texts)
        return EmbeddingResponse(
            embeddings=embeddings,
            model=req.model,
            tokens_used=sum(len(t.split()) for t in req.texts),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/index")
async def index_document(req: IndexDocumentRequest):
    """Index a document with its embedding for semantic search."""
    try:
        await _vector_store.index(
            org_id=req.org_id,
            document_id=req.document_id,
            document_type=req.document_type,
            content=req.content,
            metadata=req.metadata,
        )
        return {"status": "indexed", "document_id": req.document_id}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/search", response_model=SearchResponse)
async def semantic_search(req: SearchRequest):
    """Perform semantic search over tenant-scoped indexed documents."""
    import time
    start = time.time()
    try:
        raw_results = await _vector_store.search(
            org_id=req.org_id,
            query=req.query,
            limit=req.limit,
            document_types=req.types or None,
        )
        results = [
            SearchResult(
                id=r["id"],
                type=r["type"],
                title=r.get("title", r["id"]),
                snippet=r["content"][:200],
                score=r["score"],
                url=r.get("metadata", {}).get("url"),
            )
            for r in raw_results
        ]
        query_time_ms = (time.time() - start) * 1000
        return SearchResponse(results=results, total=len(results), query_time_ms=query_time_ms)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/index/{org_id}/{document_id}")
async def delete_document(org_id: str, document_id: str):
    """Remove a document from the vector store."""
    try:
        await _vector_store.delete(org_id, document_id)
        return {"status": "deleted", "document_id": document_id}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
