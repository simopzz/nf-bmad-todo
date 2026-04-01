import logging
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_tables
from app.routers.todos import router as todos_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    del app
    await create_tables()
    yield


def create_app() -> FastAPI:
    enable_docs = os.environ.get("ENABLE_DOCS", "false").lower() == "true"
    app = FastAPI(
        title="Todo API",
        lifespan=lifespan,
        docs_url="/docs" if enable_docs else None,
        redoc_url="/redoc" if enable_docs else None,
        openapi_url="/openapi.json" if enable_docs else None,
    )

    raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
    allowed_origins = [origin for origin in raw_origins.split() if origin]
    if "*" in allowed_origins:
        raise ValueError(
            "ALLOWED_ORIGINS cannot contain '*' when allow_credentials=True — "
            "browsers reject this per the CORS spec. Use explicit origin URLs."
        )
    logger.info(f"CORS origins: {allowed_origins}")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(todos_router)

    @app.get("/api/v1/health")
    async def health_stub() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
