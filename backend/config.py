import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode


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

    # pg8000 doesn't understand "channel_binding" (Neon adds it by default);
    # drop it while leaving "sslmode", which SQLAlchemy translates for pg8000.
    parts = urlsplit(url)
    query_pairs = [(k, v) for k, v in parse_qsl(parts.query) if k != "channel_binding"]
    url = urlunsplit(parts._replace(query=urlencode(query_pairs)))

    return url


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = _resolve_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    DEFAULT_LOW_STOCK_THRESHOLD = 5
