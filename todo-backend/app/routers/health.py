from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session

router = APIRouter(prefix="/api/v1", tags=["health"])


@router.get("/health")
async def health_check(session: AsyncSession = Depends(get_session)) -> JSONResponse:
    try:
        await session.execute(text("SELECT 1"))
        return JSONResponse(content={"status": "ok"})
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "error", "detail": "Database unreachable"},
        )
