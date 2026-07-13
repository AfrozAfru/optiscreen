"""OptiScreen — FastAPI Backend for Clinical Cataract Detection."""

import json
import os
from contextlib import asynccontextmanager

from fastapi import (
    BackgroundTasks,
    FastAPI,
    File,
    Header,
    HTTPException,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from schemas import PredictionResponse, HealthResponse
from inference import preprocess_image, run_inference, generate_heatmap, get_explanation
from database import get_supabase, upload_image_to_storage, log_diagnostic

load_dotenv()

# Allowed image MIME types
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_MB = 10


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize resources on startup."""
    # Initialize Supabase client on startup
    get_supabase()
    yield


app = FastAPI(
    title="OptiScreen API",
    description="Clinical-grade cataract detection API powered by deep learning.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware — robustly allow frontend origins (Vercel, Localhost, custom domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _background_log(
    user_id: str,
    image_url: str,
    disease: str,
    confidence: float,
    severity: str,
    explanation: str,
    recommendations: list[str],
):
    """Background task to log diagnostic results to Supabase."""
    try:
        log_diagnostic(
            user_id=user_id,
            image_url=image_url,
            disease_detected=disease,
            confidence_score=confidence,
            severity=severity,
            explanation=explanation,
            recommendations=recommendations,
        )
    except Exception as e:
        # Log but don't crash — this is a fire-and-forget task
        print(f"[WARNING] Failed to log diagnostic to Supabase: {e}")


@app.get("/api/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint."""
    return HealthResponse()


@app.post("/api/predict", response_model=PredictionResponse)
def predict(
    file: UploadFile = File(..., description="Eye image for cataract detection"),
    background_tasks: BackgroundTasks = None,
    x_user_id: str = Header(default="anonymous", alias="X-User-Id"),
):
    """Analyze an eye image for cataract detection.

    Accepts a multipart/form-data image upload, runs inference through
    the cataract detection model, and returns a comprehensive diagnosis
    with Grad-CAM heatmap visualization.
    """
    # 1. Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid file type '{file.content_type}'. "
                f"Accepted: {', '.join(ALLOWED_TYPES)}"
            ),
        )

    # 2. Read file content
    image_bytes = file.file.read()

    # 3. Validate file size
    if len(image_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE_MB}MB.",
        )

    # 4. Upload image to Supabase Storage
    image_url = ""
    try:
        image_url = upload_image_to_storage(
            user_id=x_user_id,
            image_bytes=image_bytes,
            filename=file.filename or "upload.png",
        )
    except Exception as e:
        # Non-critical — continue with inference even if storage fails
        print(f"[WARNING] Image storage upload failed: {e}")

    # 5. Run the inference pipeline
    image_tensor = preprocess_image(image_bytes)
    prediction = run_inference(image_tensor)
    heatmap_b64 = generate_heatmap(image_bytes)
    explanation, recommendations = get_explanation(
        disease=prediction["disease"],
        confidence=prediction["confidence"],
        severity=prediction["severity"],
    )

    # 6. Build response
    response = PredictionResponse(
        disease_detected=prediction["disease"],
        confidence_score=prediction["confidence"],
        severity=prediction["severity"],
        heatmap_base64=heatmap_b64,
        explanation=explanation,
        recommendations=recommendations,
        image_url=image_url,
    )

    # 7. Log to Supabase in the background (fire-and-forget)
    if background_tasks:
        background_tasks.add_task(
            _background_log,
            user_id=x_user_id,
            image_url=image_url,
            disease=prediction["disease"],
            confidence=prediction["confidence"],
            severity=prediction["severity"],
            explanation=explanation,
            recommendations=recommendations,
        )

    return response
