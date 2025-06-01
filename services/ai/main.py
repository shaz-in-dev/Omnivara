"""Omnivara AI Service — FastAPI microservice for AI features."""
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from prometheus_client import make_asgi_app

from app.config import settings
from app.routers import health, copilot, embeddings, briefs

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("omnivara_ai_starting", env=settings.environment)
    # Pre-warm the asyncpg connection pool
    try:
        from app.services.vector_store import get_pool
        await get_pool()
        logger.info("omnivara_ai_db_pool_ready")
    except Exception as exc:
        logger.warning("omnivara_ai_db_pool_failed", error=str(exc))
    yield
    logger.info("omnivara_ai_stopping")
    # Close pool on shutdown
    from app.services import vector_store as vs
    if vs._pool:
        await vs._pool.close()


app = FastAPI(
    title="Omnivara AI Service",
    description="AI microservice powering Omnivara One's copilot, briefs, and recommendations",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url=None,
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.api_url, settings.app_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(copilot.router, prefix="/copilot", tags=["Copilot"])
app.include_router(embeddings.router, prefix="/embeddings", tags=["Embeddings"])
app.include_router(briefs.router, prefix="/briefs", tags=["Briefs"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
