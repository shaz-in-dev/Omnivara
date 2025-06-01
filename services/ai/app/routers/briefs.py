"""Daily brief router — generate and schedule AI briefs."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import BriefRequest, BriefResponse
from app.services.brief_service import BriefService

router = APIRouter()
_brief_service = BriefService()


@router.post("/generate", response_model=BriefResponse)
async def generate_brief(req: BriefRequest):
    """
    Generate a role-based AI daily brief using real org data.
    Personalized summaries for different user roles (ADMIN, SALES, SUPPORT, FINANCE, HR).
    Called by NestJS scheduler at 8am daily per active user.
    """
    try:
        return await _brief_service.generate(req)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/health")
async def brief_health():
    """Health check for the brief service DB connectivity."""
    try:
        from app.services.vector_store import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return {"status": "ok", "db": "connected"}
    except Exception as exc:
        return {"status": "degraded", "error": str(exc)}
