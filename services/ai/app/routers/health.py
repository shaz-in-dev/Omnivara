import time
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()
_start_time = time.time()


class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    version: str


@router.get("", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        uptime_seconds=round(time.time() - _start_time, 2),
        version="0.1.0",
    )
