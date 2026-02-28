from __future__ import annotations

from collections.abc import Iterator
from typing import Any

from fastapi import HTTPException, status
from psycopg import Connection
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .config import Settings, get_settings

_pool: ConnectionPool[Connection[dict[str, Any]]] | None = None


def init_db_pool(settings: Settings | None = None) -> None:
    global _pool
    if _pool is not None:
        return

    active_settings = settings or get_settings()
    _pool = ConnectionPool(
        conninfo=active_settings.database_url,
        min_size=active_settings.db_pool_min_size,
        max_size=active_settings.db_pool_max_size,
        timeout=active_settings.db_pool_timeout_seconds,
        max_idle=active_settings.db_pool_max_idle_seconds,
        kwargs={"row_factory": dict_row, "autocommit": True},
        open=False,
    )
    _pool.open(wait=True)


def close_db_pool() -> None:
    global _pool
    if _pool is None:
        return
    _pool.close()
    _pool = None


def get_db_pool() -> ConnectionPool[Connection[dict[str, Any]]]:
    if _pool is None:
        raise RuntimeError("Database pool is not initialized.")
    return _pool


def get_db() -> Iterator[Connection[dict[str, Any]]]:
    if _pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database pool is not initialized.",
        )
    with _pool.connection() as connection:
        yield connection
