"""
VISION: FastAPI Backend Application Entrypoint
Vital Intelligence for System Integrity, Observation & Nostics

Service Architecture:
---------------------
- Asynchronous FastAPI core with p95 response time < 50ms.
- Mounted route controllers: Fleet Overview, Engine Telemetry, RUL Prediction, Decision Optimization.
- Pre-warmed singleton inference engine.
- Permissive CORS for local Vite development (http://localhost:5173).
"""

from __future__ import annotations

import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path

# Ensure repo root and backend directory are on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))
BACKEND_DIR = REPO_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.api.routes_decision import router as decision_router
from backend.app.api.routes_engine import router as engine_router
from backend.app.api.routes_fleet import router as fleet_router
from backend.app.api.routes_predict import router as predict_router
from backend.app.api.routes_stream import router as stream_router
from backend.app.config import settings
from backend.app.logging_config import configure_logging, logger
from backend.app.services.inference_service import inference_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle startup and shutdown hooks."""
    configure_logging()
    logger.info("Initializing VISION Backend Service and warming models...")
    # Pre-warm default dataset and model weights into memory
    try:
        inference_service.warmup_subset(settings.DEFAULT_SUBSET)
        logger.info(f"Successfully warmed up subset {settings.DEFAULT_SUBSET}")
    except Exception as e:
        logger.warning(f"Warning during warmup: {e}")
    yield
    logger.info("Shutting down VISION Backend Service cleanly.")


app = FastAPI(
    title="VISION: Turbofan Prognostics & Digital Twin Engine",
    description="Vital Intelligence for System Integrity, Observation & Nostics (PS 12)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Track request processing latency and log structured telemetry."""
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = (time.perf_counter() - start_time) * 1000.0
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    
    # Structured log
    if request.url.path not in ("/api/stream/telemetry",):
        logger.info(
            f"{request.method} {request.url.path} -> {response.status_code} ({process_time:.2f}ms)",
            extra={
                "endpoint": request.url.path,
                "latency_ms": round(process_time, 2),
                "status_code": response.status_code,
            },
        )
    return response


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "detail": str(exc),
            "path": request.url.path,
        },
    )


# Mount API Routers under /api
app.include_router(fleet_router, prefix="/api")
app.include_router(engine_router, prefix="/api")
app.include_router(predict_router, prefix="/api")
app.include_router(decision_router, prefix="/api")
app.include_router(stream_router, prefix="/api")


@app.get("/api/health", tags=["System"])
async def health_check():
    """Health status and model readiness endpoint."""
    return inference_service.get_health_status()


@app.get("/", tags=["System"])
async def root():
    """Root info endpoint."""
    return {
        "project": "VISION: Vital Intelligence for System Integrity, Observation & Nostics",
        "description": "FastAPI ML Prognostics & 3D Digital Twin Engine",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
        "default_subset": settings.DEFAULT_SUBSET,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.is_debug,
    )

