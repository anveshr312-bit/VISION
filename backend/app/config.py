"""
VISION: Backend Configuration & Environment Settings
Vital Intelligence for System Integrity, Observation & Nostics
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import List, Union

from pydantic_settings import BaseSettings, SettingsConfigDict

# Ensure repo root and backend directory are always on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

BACKEND_DIR = REPO_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


class Settings(BaseSettings):
    """Global configuration settings for FastAPI service."""

    model_config = SettingsConfigDict(
        env_file=str(REPO_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    API_HOST: str = "127.0.0.1"
    API_PORT: int = 8000
    DEBUG: Union[bool, str] = True

    @property
    def is_debug(self) -> bool:
        if isinstance(self.DEBUG, bool):
            return self.DEBUG
        return str(self.DEBUG).strip().lower() in ("true", "1", "yes", "debug")
    DEFAULT_SUBSET: str = "FD001"
    CMAPSS_DIR: str = str(REPO_ROOT / "data" / "raw")
    ARTIFACTS_DIR: str = str(REPO_ROOT / "data" / "artifacts")
    RUL_CAP: int = 125
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]


settings = Settings()
