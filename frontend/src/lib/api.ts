/**
 * FastAPI client wrapper for the OptiScreen prediction endpoint.
 */

export interface PredictionResult {
  disease_detected: "Cataract" | "Normal";
  confidence_score: number;
  severity: "None" | "Mild" | "Moderate" | "Severe";
  heatmap_base64: string;
  explanation: string;
  recommendations: string[];
  image_url: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Send an eye image to the FastAPI backend for cataract prediction.
 *
 * @param file - The image file to analyze
 * @param userId - The authenticated user's ID (passed as X-User-Id header)
 * @returns The prediction result from the backend
 */
export async function predictImage(
  file: File,
  userId: string = "anonymous"
): Promise<PredictionResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/predict`, {
    method: "POST",
    headers: {
      "X-User-Id": userId,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Prediction failed (${response.status})`);
  }

  return response.json();
}
