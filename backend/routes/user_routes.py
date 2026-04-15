"""
routes/user_routes.py
---------------------
Protected user data endpoints:
  GET  /api/user/dashboard  - dashboard summary + login history
  GET  /api/user/attempts   - full login attempt history
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

import auth
import database as db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/user", tags=["user"])
bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]
) -> str:
    if not creds:
        raise HTTPException(401, "Not authenticated")
    username = auth.decode_access_token(creds.credentials)
    if not username:
        raise HTTPException(401, "Invalid or expired token")
    return username


@router.get("/dashboard")
async def dashboard(username: Annotated[str, Depends(get_current_user)]):
    user     = db.get_user(username)
    attempts = db.get_recent_attempts(username, limit=10)
    files    = db.get_vault_files(username)

    total_bytes = sum(f["file_size"] for f in files)

    return {
        "user": {
            "username":   user["username"],
            "email":      user["email"],
            "created_at": user["created_at"],
            "has_face":   user["face_encoding"] is not None,
        },
        "recent_attempts": attempts,
        "vault_summary": {
            "total_files": len(files),
            "total_mb":    round(total_bytes / 1_000_000, 2),
        },
    }


@router.get("/attempts")
async def login_history(username: Annotated[str, Depends(get_current_user)]):
    attempts = db.get_recent_attempts(username, limit=50)
    return {"attempts": attempts, "count": len(attempts)}
