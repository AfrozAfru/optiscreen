"""OptiScreen — Pydantic response schemas for API endpoints."""

from pydantic import BaseModel, Field


class PredictionResponse(BaseModel):
    """Unified response payload from the /api/predict endpoint."""

    disease_detected: str = Field(
        ..., description="Detected condition: 'Cataract' or 'Normal'"
    )
    confidence_score: float = Field(
        ..., ge=0.0, le=1.0, description="Model confidence (0.0 - 1.0)"
    )
    severity: str = Field(
        ..., description="Severity level: 'None', 'Mild', 'Moderate', or 'Severe'"
    )
    heatmap_base64: str = Field(
        ..., description="Base64-encoded Grad-CAM heatmap PNG"
    )
    explanation: str = Field(
        ..., description="AI-generated clinical explanation"
    )
    recommendations: list[str] = Field(
        default_factory=list, description="Actionable clinical recommendations"
    )
    image_url: str | None = Field(
        None, description="Supabase Storage URL for the uploaded image"
    )


class HealthResponse(BaseModel):
    """Response payload from the /api/health endpoint."""

    status: str = "healthy"
    service: str = "OptiScreen API"
    version: str = "1.0.0"
