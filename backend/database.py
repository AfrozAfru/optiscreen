"""Supabase client wrapper for database and storage operations."""

import uuid
import json
import os

from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_supabase: Client | None = None


def get_supabase() -> Client:
    """Get or create the Supabase client singleton."""
    global _supabase
    if _supabase is None:
        _supabase = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )
    return _supabase


def upload_image_to_storage(user_id: str, image_bytes: bytes, filename: str) -> str:
    """Upload an image to Supabase Storage and return the public URL.

    Images are stored under: eye-scans/{user_id}/{unique_filename}
    """
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "png"
    storage_path = f"{user_id}/{uuid.uuid4()}.{ext}"

    client = get_supabase()
    client.storage.from_("eye-scans").upload(
        path=storage_path,
        file=image_bytes,
        file_options={"content-type": f"image/{ext}", "upsert": "false"},
    )

    # Get the public URL (or signed URL if bucket is private)
    result = client.storage.from_("eye-scans").get_public_url(storage_path)
    return result


def log_diagnostic(
    user_id: str,
    image_url: str,
    disease_detected: str,
    confidence_score: float,
    severity: str,
    explanation: str,
    recommendations: list[str],
) -> dict:
    """Insert a diagnostic result into the diagnostics table."""
    client = get_supabase()
    response = (
        client.table("diagnostics")
        .insert(
            {
                "user_id": user_id,
                "image_url": image_url,
                "disease_detected": disease_detected,
                "confidence_score": confidence_score,
                "severity": severity,
                "explanation": explanation,
                "recommendations": json.dumps(recommendations),
            }
        )
        .execute()
    )
    return response.data
