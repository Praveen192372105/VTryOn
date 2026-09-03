import logging
import time
from typing import Generator
from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings, get_settings

logger = logging.getLogger("vtryon.db")


def create_database_engine(cfg: Settings) -> Engine:
    """Creates a SQLAlchemy engine configured from centralized Settings."""
    engine_kwargs = {
        "pool_pre_ping": True,
    }

    if cfg.DATABASE_URL and not cfg.DATABASE_URL.startswith("sqlite"):
        engine_kwargs.update({
            "pool_size": cfg.DB_POOL_SIZE,
            "max_overflow": cfg.DB_MAX_OVERFLOW,
            "pool_timeout": cfg.DB_POOL_TIMEOUT,
            "pool_recycle": cfg.DB_POOL_RECYCLE,
            "echo": cfg.DB_ECHO,
        })

    eng = create_engine(cfg.DATABASE_URL or "", **engine_kwargs)

    # Lightweight slow query instrumentor
    if cfg.DB_SLOW_QUERY_MS > 0:
        @event.listens_for(eng, "before_cursor_execute")
        def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            conn.info.setdefault("query_start_times", []).append(time.perf_counter())

        @event.listens_for(eng, "after_cursor_execute")
        def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            start_times = conn.info.get("query_start_times")
            if start_times:
                duration_ms = (time.perf_counter() - start_times.pop()) * 1000
                if duration_ms > cfg.DB_SLOW_QUERY_MS:
                    logger.warning(
                        f"Slow SQL query ({duration_ms:.2f}ms > {cfg.DB_SLOW_QUERY_MS}ms): {statement[:150]}",
                        extra={"event": "db.slow_query", "duration_ms": duration_ms},
                    )

    return eng


settings = get_settings()
engine: Engine = create_database_engine(settings)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency for yielding transactional database sessions.
    Automatically closes session on request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def dispose_engine() -> None:
    """Close all open connections in the engine connection pool (useful during test teardown)."""
    global engine
    if engine is not None:
        engine.dispose()


__all__ = [
    "create_database_engine",
    "engine",
    "SessionLocal",
    "get_db",
    "dispose_engine",
]
