import os
from pathlib import Path


def ensure_storage_dir(base_path: str, user_id: str) -> str:
    """Create and return the user-specific storage directory."""
    user_dir = os.path.join(base_path, str(user_id))
    Path(user_dir).mkdir(parents=True, exist_ok=True)
    return user_dir


def is_allowed_mime(mime_type: str) -> bool:
    allowed = {"application/pdf", "image/jpeg", "image/jpg"}
    return mime_type in allowed
