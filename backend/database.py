import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Load environment variables
_env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(_env_path)

# Ensure fallback to handle local dev without strictly needing to crash if missing
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cti_india_fallback.db")

# Automatically create the MySQL database if it doesn't exist
if SQLALCHEMY_DATABASE_URL.startswith("mysql+pymysql://"):
    import pymysql
    from urllib.parse import urlparse
    parsed = urlparse(SQLALCHEMY_DATABASE_URL)
    db_name = parsed.path.lstrip('/')
    try:
        conn = pymysql.connect(
            host=parsed.hostname,
            user=parsed.username,
            password=parsed.password,
            port=parsed.port or 3306
        )
        conn.cursor().execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        conn.close()
    except Exception as e:
        print(f"Failed to auto-create database {db_name}: {e}")

# If testing locally before setting up MySQL, sqlite fallback is used.
# But for production, "mysql+pymysql://..." is expected.
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
