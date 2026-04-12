"""
xray_analysis.py
----------------
Handles chest X-ray image analysis using TorchXRayVision's pretrained DenseNet model.
Uses the densenet121-res224-all model with pretrained weights (NO training or fine-tuning).

The model outputs probability scores for 18 common chest pathologies.
We filter for conditions with probability > 0.5 (high confidence).
"""

import numpy as np
import torch
import torchvision.transforms as transforms
import torchxrayvision as xrv
from PIL import Image
import io

# ---- Global model variable (loaded once at startup) ----
_model = None


def load_model():
    """
    Loads the pretrained DenseNet121 model from TorchXRayVision.
    This should be called once at server startup.
    The model weights are downloaded automatically on first run.
    """
    global _model
    print("[XRay] Loading pretrained DenseNet121 model (densenet121-res224-all)...")
    _model = xrv.models.DenseNet(weights="densenet121-res224-all")
    _model.eval()  # Set to evaluation mode — no training
    print("[XRay] Model loaded successfully.")


def analyze_xray(image_file) -> list:
    """
    Analyzes a chest X-ray image and returns detected conditions.

    Args:
        image_file: A file-like object containing the X-ray image.

    Returns:
        List of dicts with 'condition' and 'probability' keys.
        Only includes conditions with probability > 0.5.
        Returns empty list if no significant conditions are detected.

    Raises:
        RuntimeError: If the model is not loaded or image processing fails.
    """
    global _model

    if _model is None:
        raise RuntimeError("X-ray model is not loaded. Please restart the server.")

    try:
        # Step 1: Open and preprocess the image
        image = Image.open(image_file)

        # Convert to grayscale (X-rays are grayscale)
        image = image.convert("L")

        # Convert to numpy array and normalize to [0, 1]
        img_array = np.array(image, dtype=np.float32)

        # Normalize to [-1024, 1024] range as expected by TorchXRayVision
        img_array = xrv.datasets.normalize(img_array, maxval=255, reshape=True)

        # Step 2: Resize to 224x224 as required by the model
        # XRayCenterCrop and XRayResizer expect numpy arrays, not torch tensors
        img_array = xrv.datasets.XRayCenterCrop()(img_array)
        img_array = xrv.datasets.XRayResizer(224)(img_array)

        # Convert to torch tensor and add batch dimension: (1, 1, 224, 224)
        img_tensor = torch.from_numpy(img_array).unsqueeze(0)

        # Step 3: Run inference (no gradient computation needed)
        with torch.no_grad():
            predictions = _model(img_tensor)

        # Step 4: Extract probabilities
        # The model outputs raw scores; convert to probabilities using sigmoid
        probabilities = torch.sigmoid(predictions).cpu().detach().numpy()[0]

        # Step 5: Map predictions to disease names
        # TorchXRayVision pathology labels
        pathology_names = _model.pathologies

        # Step 6: Filter for conditions with probability > 0.5
        detected_conditions = []
        for name, prob in zip(pathology_names, probabilities):
            prob_val = float(prob)
            if prob_val > 0.5:
                detected_conditions.append({
                    "condition": name,
                    "probability": round(prob_val, 4)
                })

        # Sort by probability (highest first)
        detected_conditions.sort(key=lambda x: x["probability"], reverse=True)

        return detected_conditions

    except RuntimeError:
        raise
    except Exception as e:
        raise RuntimeError(f"Failed to analyze X-ray image: {str(e)}")


def get_full_prediction_summary(image_file) -> dict:
    """
    Analyzes a chest X-ray and returns a comprehensive prediction summary.
    This sends ONLY the model's text predictions to Gemini (no image),
    reducing API quota usage significantly.

    Args:
        image_file: A file-like object containing the X-ray image.

    Returns:
        dict with:
          - high_confidence: conditions with probability > 0.5
          - moderate: conditions with probability 0.3-0.5
          - all_scores: full dict of all pathology scores
    """
    global _model

    if _model is None:
        raise RuntimeError("X-ray model is not loaded. Please restart the server.")

    try:
        # Reuse preprocessing from analyze_xray
        image = Image.open(image_file)
        image = image.convert("L")
        img_array = np.array(image, dtype=np.float32)
        img_array = xrv.datasets.normalize(img_array, maxval=255, reshape=True)
        img_array = xrv.datasets.XRayCenterCrop()(img_array)
        img_array = xrv.datasets.XRayResizer(224)(img_array)
        img_tensor = torch.from_numpy(img_array).unsqueeze(0)

        with torch.no_grad():
            predictions = _model(img_tensor)

        probabilities = torch.sigmoid(predictions).cpu().detach().numpy()[0]
        pathology_names = _model.pathologies

        # Categorize all results
        high_confidence = []
        moderate = []
        all_scores = {}

        for name, prob in zip(pathology_names, probabilities):
            prob_val = round(float(prob), 4)
            all_scores[name] = prob_val

            if prob_val > 0.5:
                high_confidence.append({"condition": name, "probability": prob_val})
            elif prob_val > 0.3:
                moderate.append({"condition": name, "probability": prob_val})

        high_confidence.sort(key=lambda x: x["probability"], reverse=True)
        moderate.sort(key=lambda x: x["probability"], reverse=True)

        return {
            "high_confidence": high_confidence,
            "moderate": moderate,
            "all_scores": all_scores
        }

    except RuntimeError:
        raise
    except Exception as e:
        raise RuntimeError(f"Failed to analyze X-ray image: {str(e)}")

