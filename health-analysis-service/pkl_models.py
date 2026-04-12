"""
pkl_models.py
-------------
Loads and serves predictions from all .pkl ML models.
Models are loaded once at startup and reused for each request.

Supported models:
  - Heart Disease (RandomForest, 13 features)
  - Diabetes (RandomForest, 8 features)
  - Kidney Disease (XGBoost, 24 features)
  - CBC / Anemia (RandomForest, 5 features)
"""

import os
import pickle
import numpy as np

# ---- Global model storage ----
_models = {}

# Path to the pkl files directory — works in both local dev and Docker
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_parent_pkl = os.path.join(os.path.dirname(_BASE_DIR), "ppklfiles")
_local_pkl = os.path.join(_BASE_DIR, "ppklfiles")
PKL_DIR = os.environ.get("PKL_DIR", _parent_pkl if os.path.isdir(_parent_pkl) else _local_pkl)


# ---- Feature definitions ----

HEART_FEATURES = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"
]

DIABETES_FEATURES = [
    "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
    "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"
]

KIDNEY_FEATURES = [
    "age", "bp", "sg", "al", "su", "rbc", "pc", "pcc", "ba",
    "bgr", "bu", "sc", "sod", "pot", "hemo", "pcv", "wc", "rc",
    "htn", "dm", "cad", "appet", "pe", "ane"
]

CBC_FEATURES = [
    "Gender", "Hemoglobin", "MCH", "MCHC", "MCV"
]

# ---- Feature metadata for the frontend ----

HEART_FEATURE_INFO = [
    {"name": "age", "label": "Age", "type": "number", "min": 1, "max": 120, "placeholder": "e.g. 55"},
    {"name": "sex", "label": "Sex", "type": "select", "options": [{"value": 1, "label": "Male"}, {"value": 0, "label": "Female"}]},
    {"name": "cp", "label": "Chest Pain Type", "type": "select", "options": [
        {"value": 0, "label": "Typical Angina"}, {"value": 1, "label": "Atypical Angina"},
        {"value": 2, "label": "Non-anginal Pain"}, {"value": 3, "label": "Asymptomatic"}
    ]},
    {"name": "trestbps", "label": "Resting Blood Pressure (mm Hg)", "type": "number", "min": 50, "max": 250, "placeholder": "e.g. 130"},
    {"name": "chol", "label": "Cholesterol (mg/dl)", "type": "number", "min": 100, "max": 600, "placeholder": "e.g. 250"},
    {"name": "fbs", "label": "Fasting Blood Sugar > 120 mg/dl", "type": "select", "options": [{"value": 1, "label": "Yes"}, {"value": 0, "label": "No"}]},
    {"name": "restecg", "label": "Resting ECG", "type": "select", "options": [
        {"value": 0, "label": "Normal"}, {"value": 1, "label": "ST-T Abnormality"}, {"value": 2, "label": "LV Hypertrophy"}
    ]},
    {"name": "thalach", "label": "Max Heart Rate Achieved", "type": "number", "min": 50, "max": 250, "placeholder": "e.g. 150"},
    {"name": "exang", "label": "Exercise Induced Angina", "type": "select", "options": [{"value": 1, "label": "Yes"}, {"value": 0, "label": "No"}]},
    {"name": "oldpeak", "label": "ST Depression (Oldpeak)", "type": "number", "min": 0, "max": 10, "step": 0.1, "placeholder": "e.g. 1.5"},
    {"name": "slope", "label": "Slope of Peak Exercise ST", "type": "select", "options": [
        {"value": 0, "label": "Upsloping"}, {"value": 1, "label": "Flat"}, {"value": 2, "label": "Downsloping"}
    ]},
    {"name": "ca", "label": "Number of Major Vessels (0-3)", "type": "select", "options": [
        {"value": 0, "label": "0"}, {"value": 1, "label": "1"}, {"value": 2, "label": "2"}, {"value": 3, "label": "3"}
    ]},
    {"name": "thal", "label": "Thalassemia", "type": "select", "options": [
        {"value": 0, "label": "Normal"}, {"value": 1, "label": "Fixed Defect"}, {"value": 2, "label": "Reversible Defect"}
    ]},
]

DIABETES_FEATURE_INFO = [
    {"name": "Pregnancies", "label": "Number of Pregnancies", "type": "number", "min": 0, "max": 20, "placeholder": "e.g. 2"},
    {"name": "Glucose", "label": "Glucose Level (mg/dl)", "type": "number", "min": 0, "max": 300, "placeholder": "e.g. 120"},
    {"name": "BloodPressure", "label": "Blood Pressure (mm Hg)", "type": "number", "min": 0, "max": 200, "placeholder": "e.g. 70"},
    {"name": "SkinThickness", "label": "Skin Thickness (mm)", "type": "number", "min": 0, "max": 100, "placeholder": "e.g. 20"},
    {"name": "Insulin", "label": "Insulin Level (mu U/ml)", "type": "number", "min": 0, "max": 900, "placeholder": "e.g. 80"},
    {"name": "BMI", "label": "BMI (Body Mass Index)", "type": "number", "min": 0, "max": 70, "step": 0.1, "placeholder": "e.g. 25.5"},
    {"name": "DiabetesPedigreeFunction", "label": "Diabetes Pedigree Function", "type": "number", "min": 0, "max": 3, "step": 0.001, "placeholder": "e.g. 0.627"},
    {"name": "Age", "label": "Age", "type": "number", "min": 1, "max": 120, "placeholder": "e.g. 45"},
]

KIDNEY_FEATURE_INFO = [
    {"name": "age", "label": "Age", "type": "number", "min": 1, "max": 120, "placeholder": "e.g. 55"},
    {"name": "bp", "label": "Blood Pressure (mm Hg)", "type": "number", "min": 40, "max": 200, "placeholder": "e.g. 80"},
    {"name": "sg", "label": "Specific Gravity", "type": "select", "options": [
        {"value": 1.005, "label": "1.005"}, {"value": 1.010, "label": "1.010"},
        {"value": 1.015, "label": "1.015"}, {"value": 1.020, "label": "1.020"}, {"value": 1.025, "label": "1.025"}
    ]},
    {"name": "al", "label": "Albumin (0-5)", "type": "select", "options": [
        {"value": 0, "label": "0"}, {"value": 1, "label": "1"}, {"value": 2, "label": "2"},
        {"value": 3, "label": "3"}, {"value": 4, "label": "4"}, {"value": 5, "label": "5"}
    ]},
    {"name": "su", "label": "Sugar (0-5)", "type": "select", "options": [
        {"value": 0, "label": "0"}, {"value": 1, "label": "1"}, {"value": 2, "label": "2"},
        {"value": 3, "label": "3"}, {"value": 4, "label": "4"}, {"value": 5, "label": "5"}
    ]},
    {"name": "rbc", "label": "Red Blood Cells", "type": "select", "options": [{"value": 1, "label": "Normal"}, {"value": 0, "label": "Abnormal"}]},
    {"name": "pc", "label": "Pus Cell", "type": "select", "options": [{"value": 1, "label": "Normal"}, {"value": 0, "label": "Abnormal"}]},
    {"name": "pcc", "label": "Pus Cell Clumps", "type": "select", "options": [{"value": 1, "label": "Present"}, {"value": 0, "label": "Not Present"}]},
    {"name": "ba", "label": "Bacteria", "type": "select", "options": [{"value": 1, "label": "Present"}, {"value": 0, "label": "Not Present"}]},
    {"name": "bgr", "label": "Blood Glucose Random (mg/dl)", "type": "number", "min": 10, "max": 500, "placeholder": "e.g. 120"},
    {"name": "bu", "label": "Blood Urea (mg/dl)", "type": "number", "min": 1, "max": 400, "placeholder": "e.g. 36"},
    {"name": "sc", "label": "Serum Creatinine (mg/dl)", "type": "number", "min": 0, "max": 80, "step": 0.1, "placeholder": "e.g. 1.2"},
    {"name": "sod", "label": "Sodium (mEq/L)", "type": "number", "min": 100, "max": 170, "placeholder": "e.g. 137"},
    {"name": "pot", "label": "Potassium (mEq/L)", "type": "number", "min": 2, "max": 50, "step": 0.1, "placeholder": "e.g. 4.5"},
    {"name": "hemo", "label": "Hemoglobin (g/dl)", "type": "number", "min": 3, "max": 20, "step": 0.1, "placeholder": "e.g. 12.5"},
    {"name": "pcv", "label": "Packed Cell Volume (%)", "type": "number", "min": 10, "max": 60, "placeholder": "e.g. 44"},
    {"name": "wc", "label": "White Blood Cell Count (cells/cumm)", "type": "number", "min": 2000, "max": 30000, "placeholder": "e.g. 7800"},
    {"name": "rc", "label": "Red Blood Cell Count (millions/cmm)", "type": "number", "min": 2, "max": 8, "step": 0.1, "placeholder": "e.g. 5.2"},
    {"name": "htn", "label": "Hypertension", "type": "select", "options": [{"value": 1, "label": "Yes"}, {"value": 0, "label": "No"}]},
    {"name": "dm", "label": "Diabetes Mellitus", "type": "select", "options": [{"value": 1, "label": "Yes"}, {"value": 0, "label": "No"}]},
    {"name": "cad", "label": "Coronary Artery Disease", "type": "select", "options": [{"value": 1, "label": "Yes"}, {"value": 0, "label": "No"}]},
    {"name": "appet", "label": "Appetite", "type": "select", "options": [{"value": 1, "label": "Good"}, {"value": 0, "label": "Poor"}]},
    {"name": "pe", "label": "Pedal Edema", "type": "select", "options": [{"value": 1, "label": "Yes"}, {"value": 0, "label": "No"}]},
    {"name": "ane", "label": "Anemia", "type": "select", "options": [{"value": 1, "label": "Yes"}, {"value": 0, "label": "No"}]},
]

CBC_FEATURE_INFO = [
    {"name": "Gender", "label": "Gender", "type": "select", "options": [{"value": 1, "label": "Male"}, {"value": 0, "label": "Female"}]},
    {"name": "Hemoglobin", "label": "Hemoglobin (g/dl)", "type": "number", "min": 3, "max": 20, "step": 0.1, "placeholder": "e.g. 13.5"},
    {"name": "MCH", "label": "MCH (pg)", "type": "number", "min": 10, "max": 50, "step": 0.1, "placeholder": "e.g. 27.5"},
    {"name": "MCHC", "label": "MCHC (g/dl)", "type": "number", "min": 20, "max": 40, "step": 0.1, "placeholder": "e.g. 33.0"},
    {"name": "MCV", "label": "MCV (fL)", "type": "number", "min": 50, "max": 120, "step": 0.1, "placeholder": "e.g. 85.0"},
]


def load_all_models():
    """
    Loads all .pkl models at startup. Call this once when the server starts.
    Stores models in _models dict for reuse.
    """
    global _models

    model_files = {
        "heart": "heart_model.pkl",
        "diabetes": "diabetes_model.pkl",
        "kidney": "kidney_model.pkl",
        "cbc": "cbc_model.pkl",
    }

    for name, filename in model_files.items():
        filepath = os.path.join(PKL_DIR, filename)
        if os.path.exists(filepath):
            try:
                with open(filepath, "rb") as f:
                    _models[name] = pickle.load(f)
                print(f"[Models] Loaded {name} model from {filename}")
            except Exception as e:
                print(f"[Models] WARNING: Could not load {name} model: {e}")
        else:
            print(f"[Models] WARNING: Model file not found: {filepath}")

    print(f"[Models] Total models loaded: {len(_models)}/{len(model_files)}")


def predict_heart(data: dict) -> dict:
    """
    Predict heart disease from patient data.

    Args:
        data: dict with keys matching HEART_FEATURES

    Returns:
        dict with 'prediction' (0 or 1), 'label', 'probability'
    """
    return _run_prediction("heart", HEART_FEATURES, data, {
        0: "No Heart Disease Detected",
        1: "Heart Disease Risk Detected"
    })


def predict_diabetes(data: dict) -> dict:
    """
    Predict diabetes from patient data.

    Args:
        data: dict with keys matching DIABETES_FEATURES

    Returns:
        dict with 'prediction', 'label', 'probability'
    """
    return _run_prediction("diabetes", DIABETES_FEATURES, data, {
        0: "No Diabetes Detected",
        1: "Diabetes Risk Detected"
    })


def predict_kidney(data: dict) -> dict:
    """
    Predict chronic kidney disease from patient data.

    Args:
        data: dict with keys matching KIDNEY_FEATURES

    Returns:
        dict with 'prediction', 'label', 'probability'
    """
    return _run_prediction("kidney", KIDNEY_FEATURES, data, {
        0: "No Kidney Disease Detected",
        1: "Chronic Kidney Disease Risk Detected"
    })


def predict_cbc(data: dict) -> dict:
    """
    Predict anemia from CBC blood report data.

    Args:
        data: dict with keys matching CBC_FEATURES

    Returns:
        dict with 'prediction', 'label', 'probability'
    """
    return _run_prediction("cbc", CBC_FEATURES, data, {
        0: "No Anemia Detected",
        1: "Anemia Detected"
    })


def _run_prediction(model_name: str, features: list, data: dict, labels: dict) -> dict:
    """
    Internal helper to run a prediction with a loaded model.

    Args:
        model_name: Key in _models dict
        features: List of feature names in order
        data: Input data dict
        labels: Dict mapping prediction values to human-readable labels

    Returns:
        dict with prediction results

    Raises:
        RuntimeError: If model is not loaded or prediction fails
    """
    if model_name not in _models:
        raise RuntimeError(f"{model_name.title()} model is not loaded. Please check the server logs.")

    model = _models[model_name]

    try:
        # Extract features in the correct order
        feature_values = []
        missing = []
        for feat in features:
            if feat not in data:
                missing.append(feat)
            else:
                feature_values.append(float(data[feat]))

        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")

        # Create numpy array and reshape for single prediction
        X = np.array(feature_values).reshape(1, -1)

        # Make prediction
        prediction = int(model.predict(X)[0])

        # Get probability if available
        probability = None
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X)[0]
            probability = round(float(max(proba)), 4)

        return {
            "prediction": prediction,
            "label": labels.get(prediction, f"Class {prediction}"),
            "probability": probability,
            "severity": "High" if prediction == 1 else "Low",
        }

    except ValueError as e:
        raise RuntimeError(str(e))
    except Exception as e:
        raise RuntimeError(f"Prediction failed for {model_name}: {str(e)}")


def get_feature_info(model_name: str) -> list:
    """
    Returns feature metadata for a given model.
    Used by the frontend to dynamically generate forms.
    """
    info_map = {
        "heart": HEART_FEATURE_INFO,
        "diabetes": DIABETES_FEATURE_INFO,
        "kidney": KIDNEY_FEATURE_INFO,
        "cbc": CBC_FEATURE_INFO,
    }
    return info_map.get(model_name, [])

