from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote

from storage_utils import upload_local_file_to_supabase
from supabase_client import get_supabase_client, is_supabase_configured

MEDIA_FIELDS = ("image_url", "proof_url", "citizen_voice_url", "worker_voice_url")
UPLOADS_ROOT = Path(__file__).resolve().parent / "static" / "uploads"


def local_file_from_url(url_value: str):
    if not url_value or not url_value.startswith("/static/uploads/"):
        return None
    filename = unquote(url_value.split("/static/uploads/", 1)[1])
    return UPLOADS_ROOT / filename


def storage_path_for(complaint_id: str, field_name: str, local_path: Path) -> str:
    extension = local_path.suffix.lower() or (".webm" if "voice" in field_name else ".jpg")
    return f"migrated/{complaint_id}/{field_name}{extension}"


def main():
    if not is_supabase_configured():
        raise SystemExit("Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY to .env first.")

    if not UPLOADS_ROOT.exists():
        raise SystemExit(f"Local upload folder not found: {UPLOADS_ROOT}")

    supabase = get_supabase_client()
    response = supabase.from_("complaints").select("id,image_url,proof_url,citizen_voice_url,worker_voice_url").execute()
    complaints = response.data or []

    migrated_files = 0
    updated_rows = 0
    missing_files = 0

    for complaint in complaints:
        update_data = {}
        for field_name in MEDIA_FIELDS:
            current_value = complaint.get(field_name)
            if not current_value or current_value.startswith("http://") or current_value.startswith("https://"):
                continue

            local_path = local_file_from_url(current_value)
            if not local_path:
                continue

            if not local_path.exists():
                missing_files += 1
                print(f"[missing] {complaint['id']} {field_name}: {local_path.name}")
                continue

            public_url = upload_local_file_to_supabase(
                local_path,
                bucket_name="complaints",
                storage_path=storage_path_for(complaint["id"], field_name, local_path),
                upsert=True,
            )
            update_data[field_name] = public_url
            migrated_files += 1

        if update_data:
            update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            supabase.from_("complaints").update(update_data).eq("id", complaint["id"]).execute()
            updated_rows += 1
            print(f"[updated] {complaint['id']} -> {', '.join(sorted(update_data.keys()))}")

    print("")
    print(f"Rows updated: {updated_rows}")
    print(f"Files migrated: {migrated_files}")
    print(f"Missing local files: {missing_files}")


if __name__ == "__main__":
    main()
