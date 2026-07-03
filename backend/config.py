import os
from datetime import timedelta
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


def _resolve_database_uri():
    url = os.environ.get("DATABASE_URL")
    if not url:
        return f"sqlite:///{os.path.join(BASE_DIR, 'stockflow.db')}"
    # Normalize legacy "postgres://" scheme, and force the pg8000 driver
    # (pure-Python, no C extension) since psycopg2-binary's compiled
    # extension frequently fails to import on Vercel's serverless runtime.
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+pg8000://", 1)

    # pg8000 doesn't accept "sslmode" or "channel_binding" as connection
    # kwargs (psycopg2-specific params baked into most Postgres providers'
    # connection strings) — strip them. pg8000 negotiates SSL automatically
    # by default when the server supports it (which Neon requires), so no
    # replacement flag is needed.
    parts = urlsplit(url)
    query_pairs = [
        (k, v) for k, v in parse_qsl(parts.query)
        if k not in ("channel_binding", "sslmode")
    ]
    url = urlunsplit(parts._replace(query=urlencode(query_pairs)))

    return url


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = _resolve_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    DEFAULT_LOW_STOCK_THRESHOLD = 5
