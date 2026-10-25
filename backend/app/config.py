import os
import tempfile
from pydantic import BaseModel

def get_database_url() -> str:
    if os.getenv("DATABASE_URL"):
        return os.environ["DATABASE_URL"]
    # Check if running in Vercel or AWS Lambda serverless environment
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        tmp_db = os.path.join(tempfile.gettempdir(), "fieldpilot.db")
        return f"sqlite:///{tmp_db}"
    return "sqlite:///./fieldpilot.db"

class Settings(BaseModel):
    APP_NAME: str = "FieldPilot OfflineFirst AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DATABASE_URL: str = get_database_url()
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ]

settings = Settings()
