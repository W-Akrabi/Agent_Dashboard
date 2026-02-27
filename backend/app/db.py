from __future__ import annotations

from collections.abc import Iterator
from typing import Any

import psycopg
from psycopg.rows import dict_row

from .config import get_settings


def get_db() -> Iterator[psycopg.Connection[dict[str, Any]]]:
    settings = get_settings()
    with psycopg.connect(settings.database_url, row_factory=dict_row) as connection:
        yield connection

