import os
import sys

# Add root directory and backend directory to sys.path so modules can be imported in Vercel lambda
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.main import app

# Vercel serverless function entrypoint for FastAPI ASGI
__all__ = ["app"]
