import logging
import mimetypes
import os
import uuid
from pathlib import Path
from typing import Optional

from supabase_client import get_supabase_client, is_supabase_configured

logger = logging.getLogger(__name__)


def _extract_public_url(public_url_response) -> Optional[str]:
    if isinstance(public_url_response, str):
        return public_url_response

    if isinstance(public_url_response, dict):
        data = public_url_response.get("data")
        if isinstance(data, dict) and data.get("publicUrl"):
            return data["publicUrl"]
        if public_url_response.get("publicUrl"):
            return public_url_response["publicUrl"]

    data = getattr(public_url_response, "data", None)
    if isinstance(data, dict) and data.get("publicUrl"):
        return data["publicUrl"]

    public_url = getattr(public_url_response, "public_url", None)
    if isinstance(public_url, str):
        return public_url

    return None


def build_storage_path(filename: str, path_prefix: str = "", default_extension: str = ".bin") -> str:
    extension = os.path.splitext(filename or "")[1].lower() or default_extension
    unique_name = f"{uuid.uuid4()}{extension}"
    cleaned_prefix = path_prefix.strip("/")
    return f"{cleaned_prefix}/{unique_name}" if cleaned_prefix else unique_name


def upload_bytes_to_supabase(
    file_bytes: bytes,
    filename: str,
    *,
    bucket_name: str = "complaints",
    path_prefix: str = "",
    storage_path: Optional[str] = None,
    content_type: Optional[str] = None,
    default_extension: str = ".bin",
    upsert: bool = False,
) -> str:
    if not is_supabase_configured():
        raise RuntimeError("Supabase is not configured.")

    supabase = get_supabase_client()
    if supabase is None:
        raise RuntimeError("Supabase client is unavailable.")

    final_storage_path = storage_path or build_storage_path(
        filename,
        path_prefix=path_prefix,
        default_extension=default_extension,
    )
    mime_type = content_type or mimetypes.guess_type(filename or "")[0] or "application/octet-stream"

    response = supabase.storage.from_(bucket_name).upload(
        path=final_storage_path,
        file=file_bytes,
        file_options={
            "content-type": mime_type,
            "upsert": "true" if upsert else "false",
        },
    )

    error = getattr(response, "error", None)
    if error:
        raise RuntimeError(str(error))

    public_url = _extract_public_url(supabase.storage.from_(bucket_name).get_public_url(final_storage_path))
    if not public_url:
        raise RuntimeError(f"Storage upload succeeded but no public URL was returned for {final_storage_path}.")

    logger.info("Uploaded file to Supabase bucket '%s': %s", bucket_name, final_storage_path)
    return public_url


def upload_filestorage_to_supabase(
    file_storage,
    *,
    bucket_name: str = "complaints",
    path_prefix: str = "",
    default_extension: str = ".bin",
    upsert: bool = False,
) -> str:
    filename = getattr(file_storage, "filename", "") or "upload"
    content_type = getattr(file_storage, "content_type", None)
    file_storage.seek(0)
    file_bytes = file_storage.read()

    if not file_bytes:
        raise RuntimeError(f"Cannot upload an empty file: {filename}")

    return upload_bytes_to_supabase(
        file_bytes,
        filename,
        bucket_name=bucket_name,
        path_prefix=path_prefix,
        content_type=content_type,
        default_extension=default_extension,
        upsert=upsert,
    )


def upload_local_file_to_supabase(
    local_path: Path,
    *,
    bucket_name: str = "complaints",
    path_prefix: str = "",
    storage_path: Optional[str] = None,
    default_extension: str = ".bin",
    upsert: bool = False,
) -> str:
    local_path = Path(local_path)
    if not local_path.exists():
        raise FileNotFoundError(f"Local file not found: {local_path}")

    return upload_bytes_to_supabase(
        local_path.read_bytes(),
        local_path.name,
        bucket_name=bucket_name,
        path_prefix=path_prefix,
        storage_path=storage_path,
        content_type=mimetypes.guess_type(str(local_path))[0],
        default_extension=default_extension or local_path.suffix or ".bin",
        upsert=upsert,
    )
