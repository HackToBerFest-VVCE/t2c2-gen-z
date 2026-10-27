import os
import tempfile
from typing import Optional
from pydantic import BaseModel

# Automatically load local .env if present (root or backend dir)
def load_local_env():
    possible_envs = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env"),
        ".env"
    ]
    for env_path in possible_envs:
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip('"').strip("'")
                            if k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

load_local_env()

def get_database_url() -> str:
    if os.getenv("DATABASE_URL"):
        return os.environ["DATABASE_URL"]
    # Check if running in Vercel or AWS Lambda serverless environment
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        tmp_db = os.path.join(tempfile.gettempdir(), "fieldpilot.db")
        return f"sqlite:///{tmp_db}"
    return "sqlite:///./fieldpilot.db"

def get_upload_dir() -> str:
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        path = os.path.join(tempfile.gettempdir(), "fieldpilot_uploads")
    else:
        path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
    os.makedirs(path, exist_ok=True)
    return path

class Settings(BaseModel):
    APP_NAME: str = "FieldPilot OfflineFirst AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DATABASE_URL: str = get_database_url()
    UPLOAD_DIR: str = get_upload_dir()
    
    # Secure Server-Side Gemini AI settings
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")
    AI_MODE: str = os.getenv("AI_MODE", "hybrid")  # online | hybrid | strict_offline
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ]

settings = Settings()
