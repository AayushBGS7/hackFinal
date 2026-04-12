"""
image_models.py
---------------
Loads and serves predictions from image-based ML models:
  - MRI Brain Tumor Detection (ViT / PyTorch, 2 classes)
  - Lung CT Scan Analysis (Keras / TensorFlow, 3 classes)

Models are loaded once at startup and reused for each request.
"""

import os
import pickle
import numpy as np
from PIL import Image
import io

# ---- Global model storage ----
_image_models = {}

# Path to the pkl files directory — works in both local dev and Docker
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_parent_pkl = os.path.join(os.path.dirname(_BASE_DIR), "ppklfiles")
_local_pkl = os.path.join(_BASE_DIR, "ppklfiles")
PKL_DIR = os.environ.get("PKL_DIR", _parent_pkl if os.path.isdir(_parent_pkl) else _local_pkl)

# ---- Class labels ----
MRI_LABELS = {0: "No Tumor Detected", 1: "Brain Tumor Detected"}
LUNG_LABELS = {0: "Normal", 1: "Malignant Tumor", 2: "Benign Tumor"}


def load_image_models():
    """
    Loads the MRI ViT model and Lung CT Keras model at startup.
    """
    global _image_models

    # --- Load MRI ViT model (PyTorch) ---
    mri_path = os.path.join(PKL_DIR, "vit_mri_weights.pkl")
    if os.path.exists(mri_path):
        try:
            import torch
            from transformers import ViTForImageClassification, ViTConfig

            # Load weights
            with open(mri_path, "rb") as f:
                state_dict = pickle.load(f)

            # Build ViT model with 2-class head
            config = ViTConfig(
                image_size=224,
                patch_size=16,
                num_channels=3,
                hidden_size=768,
                num_hidden_layers=12,
                num_attention_heads=12,
                intermediate_size=3072,
                num_labels=2,
            )
            model = ViTForImageClassification(config)
            model.load_state_dict(state_dict, strict=False)
            model.eval()
            _image_models["mri"] = model
            print("[ImageModels] Loaded MRI ViT model successfully")
        except Exception as e:
            print(f"[ImageModels] WARNING: Could not load MRI model: {e}")
    else:
        print(f"[ImageModels] WARNING: MRI model file not found: {mri_path}")

    # --- Load Lung CT model (Keras) ---
    lung_path = os.path.join(PKL_DIR, "lung_model (1).pkl")
    if os.path.exists(lung_path):
        try:
            with open(lung_path, "rb") as f:
                model = pickle.load(f)
            _image_models["lung"] = model
            print("[ImageModels] Loaded Lung CT model successfully")
        except Exception as e:
            print(f"[ImageModels] WARNING: Could not load Lung model: {e}")
    else:
        print(f"[ImageModels] WARNING: Lung model file not found: {lung_path}")

    print(f"[ImageModels] Total image models loaded: {len(_image_models)}/2")


def _preprocess_image(file_obj, target_size=(224, 224)):
    """
    Read an uploaded file, convert to RGB, resize to target_size,
    and return as a normalized numpy array.
    """
    image_bytes = file_obj.read()
    file_obj.seek(0)
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(target_size, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    return arr


def predict_mri(file_obj) -> dict:
    """
    Predict brain tumor from an MRI image using the ViT model.

    Args:
        file_obj: Flask file upload object

    Returns:
        dict with prediction, label, probability, severity, details
    """
    if "mri" not in _image_models:
        raise RuntimeError(
            "MRI model is not loaded. Please ensure 'vit_mri_weights.pkl' "
            "exists and the 'transformers' package is installed."
        )

    import torch

    model = _image_models["mri"]

    # Preprocess: ViT expects [B, C, H, W] normalized with ImageNet stats
    arr = _preprocess_image(file_obj, target_size=(224, 224))

    # Normalize with ImageNet mean/std
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    arr = (arr - mean) / std

    # Convert to [B, C, H, W] tensor
    tensor = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0).float()

    with torch.no_grad():
        outputs = model(tensor)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=-1)[0]

    prediction = int(torch.argmax(probs).item())
    confidence = float(probs[prediction].item())

    return {
        "prediction": prediction,
        "label": MRI_LABELS.get(prediction, f"Class {prediction}"),
        "probability": round(confidence, 4),
        "severity": "High" if prediction == 1 else "Low",
        "details": {
            "no_tumor_prob": round(float(probs[0].item()), 4),
            "tumor_prob": round(float(probs[1].item()), 4),
        },
    }


def predict_lung_ct(file_obj) -> dict:
    """
    Predict lung condition from a CT scan image using the Keras model.

    Args:
        file_obj: Flask file upload object

    Returns:
        dict with prediction, label, probability, severity, details
    """
    if "lung" not in _image_models:
        raise RuntimeError(
            "Lung CT model is not loaded. Please ensure 'lung_model (1).pkl' "
            "exists and TensorFlow/Keras is installed."
        )

    model = _image_models["lung"]

    # Preprocess: Keras model expects [B, H, W, C]
    arr = _preprocess_image(file_obj, target_size=(224, 224))
    input_arr = np.expand_dims(arr, axis=0)  # Shape: (1, 224, 224, 3)

    # Predict
    preds = model.predict(input_arr, verbose=0)
    probs = preds[0]

    prediction = int(np.argmax(probs))
    confidence = float(probs[prediction])

    severity_map = {0: "Low", 1: "High", 2: "Moderate"}

    return {
        "prediction": prediction,
        "label": LUNG_LABELS.get(prediction, f"Class {prediction}"),
        "probability": round(confidence, 4),
        "severity": severity_map.get(prediction, "Unknown"),
        "details": {
            "normal_prob": round(float(probs[0]), 4),
            "benign_prob": round(float(probs[2]), 4),
            "malignant_prob": round(float(probs[1]), 4),
        },
    }
