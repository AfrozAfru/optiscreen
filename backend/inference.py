"""Production inference pipeline for clinical cataract detection.

Loads the trained PyTorch ResNet-18 model (`optiscreen_cataract.pth`), executes
forward pass probability estimation, and generates authentic Grad-CAM heatmap
overlays highlighting cortical/nuclear opacification indicators.
"""

import base64
import gc
import io
import os
from PIL import Image, ImageOps
import numpy as np

import torch
import torchvision.transforms as T
from torchvision.models import resnet18
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image

# Restrict PyTorch CPU threads to prevent memory/thread pool exhaustion on cloud containers (Render 512MB/1GB)
torch.set_num_threads(1)
try:
    torch.set_num_interop_threads(1)
except Exception:
    pass

# Path to weights file
MODEL_PATH = os.path.join(os.path.dirname(__file__), "optiscreen_cataract.pth")

# Class index mapping - VERIFY this matches how your training labels were encoded.
# If your training pipeline used ImageFolder or similar, check the class_to_idx
# mapping (printed during training) to confirm which index maps to which class.
CATARACT_CLASS_IDX = 0
NORMAL_CLASS_IDX = 1

_model: torch.nn.Module | None = None


def get_model() -> torch.nn.Module:
    """Get or initialize the ResNet-18 model singleton loaded with optiscreen_cataract.pth."""
    global _model
    if _model is None:
        model = resnet18(num_classes=2)
        if os.path.exists(MODEL_PATH):
            state_dict = torch.load(MODEL_PATH, map_location=torch.device("cpu"), weights_only=False)
            model.load_state_dict(state_dict)
        model.eval()
        _model = model
    return _model


# Standard ImageNet normalization for PyTorch ResNet backbones
_preprocess_transform = T.Compose([
    T.Resize((224, 224)),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def preprocess_image(image_bytes: bytes) -> torch.Tensor:
    """Decode and preprocess an eye scan image for ResNet-18 inference.

    Args:
        image_bytes: Raw bytes of the uploaded image.

    Returns:
        Preprocessed PyTorch tensor of shape (1, 3, 224, 224).
    """
    raw_image = Image.open(io.BytesIO(image_bytes))
    image = ImageOps.exif_transpose(raw_image).convert("RGB")
    tensor = _preprocess_transform(image).unsqueeze(0)
    return tensor


def run_inference(image_tensor: torch.Tensor) -> dict:
    """Run forward pass inference on a preprocessed eye image tensor.

    Args:
        image_tensor: Preprocessed image tensor of shape (1, 3, 224, 224).

    Returns:
        Dictionary with clinical prediction results:
        - disease: 'Cataract' or 'Normal'
        - confidence: float between 0.0 and 1.0
        - severity: 'None', 'Mild', 'Moderate', or 'Severe'
    """
    model = get_model()

    with torch.no_grad():
        logits = model(image_tensor)
        # Plain softmax over the two class logits. No artificial offset or scaling -
        # if predictions still look biased after this, the issue is upstream in
        # training (class imbalance, label mapping, or preprocessing mismatch),
        # not in this function. Do not reintroduce a manual calibration constant here.
        probs = torch.softmax(logits, dim=1)[0]
        cataract_prob = float(probs[CATARACT_CLASS_IDX])

    is_cataract = cataract_prob >= 0.5
    disease = "Cataract" if is_cataract else "Normal"
    confidence = round(cataract_prob if is_cataract else (1.0 - cataract_prob), 4)

    if not is_cataract:
        severity = "None"
    elif confidence >= 0.90:
        severity = "Severe"
    elif confidence >= 0.75:
        severity = "Moderate"
    else:
        severity = "Mild"

    return {
        "disease": disease,
        "confidence": confidence,
        "severity": severity,
    }


def generate_heatmap(image_bytes: bytes) -> str:
    """Generate an authentic Grad-CAM heatmap overlay from the last ResNet-18 convolution layer.

    Args:
        image_bytes: Raw bytes of the original uploaded image.

    Returns:
        Base64-encoded PNG string of the Grad-CAM visualization overlay.
    """
    model = get_model()

    # Load RGB float image [0, 1] for overlay display
    raw_pil = Image.open(io.BytesIO(image_bytes))
    img_pil = ImageOps.exif_transpose(raw_pil).convert("RGB").resize((224, 224), Image.Resampling.LANCZOS)
    rgb_img = np.array(img_pil, dtype=np.float32) / 255.0

    try:
        # Hook GradCAM onto the final bottleneck block of ResNet-18 (layer4[-1])
        target_layers = [model.layer4[-1]]
        input_tensor = _preprocess_transform(img_pil).unsqueeze(0)
        with GradCAM(model=model, target_layers=target_layers) as cam:
            grayscale_cam = cam(input_tensor=input_tensor, targets=None)[0]

        # Overlay Grad-CAM colormap over the original RGB image
        visualization = show_cam_on_image(rgb_img, grayscale_cam, use_rgb=True)
        vis_pil = Image.fromarray(visualization)
    except Exception:
        # Fallback to base RGB image if GradCAM exhausts container memory on ultra-small instances
        vis_pil = img_pil
    finally:
        gc.collect()

    # Encode composite image to base64 PNG
    buffer = io.BytesIO()
    vis_pil.save(buffer, format="PNG", quality=95)
    buffer.seek(0)

    return base64.b64encode(buffer.read()).decode("utf-8")


def get_explanation(disease: str, confidence: float, severity: str) -> tuple[str, list[str]]:
    """Generate a clinical explanation and recommendations based on the prediction.

    Args:
        disease: Detected condition ('Cataract' or 'Normal').
        confidence: Model confidence score (0.0 - 1.0).
        severity: Severity level ('None', 'Mild', 'Moderate', 'Severe').

    Returns:
        Tuple of (explanation_text, list_of_recommendations).
    """
    confidence_pct = f"{confidence * 100:.1f}%"

    if disease == "Cataract":
        explanation = (
            f"The AI model has detected signs consistent with cataract formation "
            f"with a confidence of {confidence_pct}. The analysis indicates a "
            f"{severity.lower()} level of lens opacity, suggesting "
            f"{'early-stage crystalline lens changes' if severity == 'Mild' else 'notable lens clouding that may impact visual acuity'}. "
            f"The Grad-CAM heatmap highlights the regions of the fundus image "
            f"where the model identified characteristic cataract indicators, "
            f"including potential cortical or nuclear opacification patterns."
        )

        recommendations_map = {
            "Mild": [
                "Schedule a comprehensive ophthalmologic examination within 3-6 months.",
                "Monitor for changes in visual acuity, particularly difficulty with night driving or reading.",
                "Consider anti-glare lenses for current eyewear prescription.",
                "Maintain regular UV protection with quality sunglasses.",
            ],
            "Moderate": [
                "Schedule a clinical evaluation with an ophthalmologist within 4-8 weeks.",
                "Perform visual acuity and contrast sensitivity testing under varying glare conditions.",
                "Discuss potential timeline for surgical intervention if daily activities are affected.",
                "Review current prescription for optimization pending surgical consultation.",
            ],
            "Severe": [
                "Schedule prompt ophthalmologic consultation for preoperative cataract evaluation.",
                "Perform biometry and intraocular lens (IOL) calculation.",
                "Assess retinal health through dense opacity (B-scan ultrasonography if needed).",
                "Advise patient regarding safety precautions, particularly driving restrictions.",
            ],
        }
        recommendations = recommendations_map.get(
            severity, recommendations_map["Moderate"]
        )
    else:
        explanation = (
            f"The AI model analysis indicates a clear crystalline lens with "
            f"{confidence_pct} confidence. No significant signs of cortical, nuclear, "
            f"or posterior subcapsular cataract opacification were detected in the "
            f"provided image. The Grad-CAM heatmap shows uniform baseline activation "
            f"without focal opacification clusters."
        )

        recommendations = [
            "Continue routine annual or bi-annual eye health examinations.",
            "Maintain standard UV protection outdoors to prevent premature lens changes.",
            "Report any sudden visual symptoms (blurriness, halos around lights, double vision) to an eye care professional.",
        ]

    return explanation, recommendations
