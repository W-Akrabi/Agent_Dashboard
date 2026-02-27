from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from urllib.parse import quote_plus

from dotenv import load_dotenv

load_dotenv()


def _csv_to_list(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _build_database_url() -> str:
    explicit_url = os.getenv("DATABASE_URL")
    if explicit_url:
        return explicit_url

    host = os.getenv("SUPABASE_DB_HOST")
    port = os.getenv("SUPABASE_DB_PORT", "5432")
    name = os.getenv("SUPABASE_DB_NAME", "postgres")
    user = os.getenv("SUPABASE_DB_USER", "postgres")
    password = os.getenv("SUPABASE_DB_PASSWORD")
    sslmode = os.getenv("SUPABASE_DB_SSLMODE", "require")

    if host and password:
        escaped_password = quote_plus(password)
        return (
            f"postgresql://{user}:{escaped_password}@{host}:{port}/{name}"
            f"?sslmode={sslmode}"
        )

    raise RuntimeError(
        "Database settings are missing. Set DATABASE_URL or the SUPABASE_DB_* variables."
    )


@dataclass(frozen=True)
class Settings:
    database_url: str
    app_host: str
    app_port: int
    cors_origins: list[str]
    cors_origin_regex: str


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        database_url=_build_database_url(),
        app_host=os.getenv("APP_HOST", "0.0.0.0"),
        app_port=int(os.getenv("APP_PORT", "8000")),
        cors_origins=_csv_to_list(os.getenv("CORS_ORIGINS", "http://localhost:5173")),
        cors_origin_regex=os.getenv(
            "CORS_ORIGIN_REGEX",
            r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        ),
    )
