import logging
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from supabase import Client, create_client

logger = logging.getLogger(__name__)

load_dotenv(Path(__file__).resolve().parent / ".env")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip() or os.environ.get("SUPABASE_KEY", "").strip()


def _create_supabase_client() -> Optional[Client]:
    if not SUPABASE_URL or not _key:
        logger.warning(
            "Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY or "
            "SUPABASE_SERVICE_ROLE_KEY in a .env file to enable database-backed features."
        )
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
