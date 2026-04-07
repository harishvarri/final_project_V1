import logging
import os
import sys
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv

try:
    from supabase import Client, create_client
except Exception as exc:
    Client = Any
    create_client = None
    _supabase_import_error = str(exc)
else:
    _supabase_import_error = ""

logger = logging.getLogger(__name__)

for env_path in (
    Path(__file__).resolve().parent.parent / ".env",
    Path(__file__).resolve().parent.parent.parent / ".env",
):
    if env_path.exists():
        load_dotenv(env_path)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip() or os.environ.get("SUPABASE_KEY", "").strip()


def _recommended_python_path() -> str:
    project_root = Path(__file__).resolve().parent.parent
    windows_python = project_root / ".venv" / "Scripts" / "python.exe"
    unix_python = project_root / ".venv" / "bin" / "python"
    if windows_python.exists():
        return str(windows_python)
    if unix_python.exists():
        return str(unix_python)
    return sys.executable


def get_supabase_unavailable_reason() -> str:
    if _supabase_import_error:
        return (
            "Supabase dependency is unavailable in the current Python interpreter. "
            f"Use the project virtualenv at {_recommended_python_path()} or install requirements. "
            f"Import error: {_supabase_import_error}"
        )
    if not SUPABASE_URL or not _key:
        return (
            "Supabase is not configured. Set SUPABASE_URL and "
            "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY in the backend environment."
        )
    if supabase is None:
        return "Supabase client could not be initialized. Check credentials and network access."
    return ""


def _create_supabase_client() -> Optional[Client]:
    if create_client is None:
        logger.warning(get_supabase_unavailable_reason())
        return None

    if not SUPABASE_URL or not _key:
        logger.warning(get_supabase_unavailable_reason())
        return None

    try:
        return create_client(SUPABASE_URL, _key)
    except Exception as exc:
        logger.error("Failed to initialize Supabase client: %s", exc)
        return None


supabase: Optional[Client] = _create_supabase_client()


def get_supabase_client() -> Optional[Client]:
    return supabase


def is_supabase_configured() -> bool:
    return supabase is not None


def get_supabase_dependency_error() -> str:
    return _supabase_import_error
