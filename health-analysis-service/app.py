"""
app.py
------
Main Flask application for the Smart Medical Interpreter Service.

Exposes API endpoints:
  POST /analyze-report  — Analyze a medical report (PDF/image) → Hindi guidance
  POST /analyze-xray    — Analyze a chest X-ray image → Hindi guidance
  POST /text-to-speech  — Convert Hindi text to MP3 audio
  POST /predict/heart   — Heart disease prediction
  POST /predict/diabetes — Diabetes prediction
  POST /predict/kidney  — Kidney disease prediction
  POST /predict/cbc     — CBC / Anemia prediction
  POST /ai-chat         — AI chat with Gemini
  GET  /model-info/<name> — Get feature metadata for a model
  GET  /health          — Health check

Usage:
  python app.py

The server runs on the port specified by FLASK_PORT in .env (default: 5050).
"""

import os
from flask import Flask, request, jsonify, send_file, after_this_request
from flask_cors import CORS
from dotenv import load_dotenv

# Import our custom modules — graceful imports for optional heavy dependencies
try:
    from ocr_extraction import extract_text
    from xray_analysis import load_model, analyze_xray, get_full_prediction_summary
    from gemini_helper import explain_report_in_hindi, explain_xray_in_hindi
    HAS_XRAY_MODULE = True
except ImportError as e:
    print(f"[WARNING] Could not import xray/ocr/gemini modules: {e}")
    print("[WARNING] /analyze-report and /analyze-xray endpoints will not work.")
    HAS_XRAY_MODULE = False

try:
    from tts_helper import text_to_speech_hindi, cleanup_audio_file
    HAS_TTS = True
except ImportError as e:
    print(f"[WARNING] Could not import TTS module: {e}")
    HAS_TTS = False

from pkl_models import (
    load_all_models, predict_heart, predict_diabetes,
    predict_kidney, predict_cbc, get_feature_info
)

try:
    from image_models import load_image_models, predict_mri, predict_lung_ct
    HAS_IMAGE_MODELS = True
except ImportError as e:
    print(f"[WARNING] Could not import image_models: {e}")
    HAS_IMAGE_MODELS = False

# ---- Load environment variables from .env ----
load_dotenv()

# ---- Initialize Flask app ----
app = Flask(__name__)

# Enable CORS — restrict origins in production via ALLOWED_ORIGINS env var
_allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
CORS(app, origins=_allowed_origins)

# ---- Configuration ----
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

# Allowed file extensions
ALLOWED_REPORT_EXTENSIONS = {"jpg", "jpeg", "png", "pdf"}
ALLOWED_XRAY_EXTENSIONS = {"jpg", "jpeg", "png"}

# Standard disclaimer for all medical responses
DISCLAIMER = "यह सिस्टम केवल सुझाव देता है। यह डॉक्टर का विकल्प नहीं है।"


# ---- Helper functions ----

def get_file_extension(filename: str) -> str:
    """Extract lowercase file extension from filename."""
    if "." in filename:
        return filename.rsplit(".", 1)[-1].lower()
    return ""


def validate_file(file_obj, allowed_extensions: set) -> tuple:
    """
    Validates an uploaded file for presence, extension, and size.

    Returns:
        (is_valid: bool, error_message: str or None)
    """
    # Check if file was provided
    if not file_obj or file_obj.filename == "":
        return False, "No file was uploaded. Please select a file."

    # Check file extension
    extension = get_file_extension(file_obj.filename)
    if extension not in allowed_extensions:
        allowed_str = ", ".join(sorted(allowed_extensions))
        return False, f"Invalid file type: .{extension}. Accepted types: {allowed_str}"

    # Check file size (read content length)
    file_obj.seek(0, 2)  # Seek to end
    file_size = file_obj.tell()
    file_obj.seek(0)  # Reset to beginning

    if file_size > MAX_FILE_SIZE_BYTES:
        return False, f"File too large ({file_size / (1024*1024):.1f} MB). Maximum allowed size is {MAX_FILE_SIZE_MB} MB."

    if file_size == 0:
        return False, "The uploaded file is empty."

    return True, None


# ======================================================
# ENDPOINT 0: POST /login
# ======================================================
@app.route("/login", methods=["POST"])
def login():
    """
    Dummy login system validation
    """
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")

    if email == "admin@clinical.com" and password == "password123":
        return jsonify({
            "success": True, 
            "token": "dummy-auth-token-123456",
            "user": {
                "id": "1",
                "name": "Arjun Sharma",
                "email": "admin@clinical.com",
                "role": "admin"
            }
        }), 200
    else:
        return jsonify({"success": False, "error": "Invalid email or password"}), 401


# ======================================================
# ENDPOINT 1: POST /analyze-report
# ======================================================
@app.route("/analyze-report", methods=["POST"])
def analyze_report():
    """
    Analyze a medical report (PDF or image).

    Expects multipart form-data with a 'file' field.
    Returns a JSON response with Hindi explanation and severity.
    """
    try:
        # Get the uploaded file
        file = request.files.get("file")
        language = request.form.get("language", "English")
        if "Default" in language:
            language = "English"

        # Validate the file
        is_valid, error_msg = validate_file(file, ALLOWED_REPORT_EXTENSIONS)
        if not is_valid:
            return jsonify({"success": False, "error": error_msg}), 400

        # Step 1: Extract text using OCR
        print(f"[Report] Extracting text from: {file.filename}")
        extracted_text = extract_text(file, file.filename)
        print(f"[Report] Extracted {len(extracted_text)} characters of text.")

        # Step 2: Send to Gemini for explanation
        print(f"[Report] Sending to Gemini for {language} explanation...")
        result = explain_report_in_hindi(extracted_text, language)

        # Step 3: Build and return the response
        return jsonify({
            "success": True,
            "type": "report",
            "extracted_text": extracted_text[:500],  # First 500 chars for preview
            "hindi_explanation": result["hindi_explanation"],
            "severity": result["severity"],
            "disclaimer": DISCLAIMER
        })

    except RuntimeError as e:
        return jsonify({"success": False, "error": str(e)}), 500
    except Exception as e:
        print(f"[Report] Unexpected error: {str(e)}")
        return jsonify({"success": False, "error": f"An unexpected error occurred: {str(e)}"}), 500


# ======================================================
# ENDPOINT 2: POST /analyze-xray
# ======================================================
@app.route("/analyze-xray", methods=["POST"])
def analyze_xray_endpoint():
    """
    Analyze a chest X-ray image.

    Flow: Image → PyTorch model (local) → text predictions → Gemini API
    The image is NEVER sent to Gemini. Only the model's text-based
    prediction scores are sent, reducing API quota usage significantly.

    Expects multipart form-data with a 'file' field (PNG or JPG).
    Returns a JSON response with detected conditions and Hindi explanation.
    """
    try:
        # Get the uploaded file
        file = request.files.get("file")
        language = request.form.get("language", "English")
        if "Default" in language:
            language = "English"

        # Validate the file
        is_valid, error_msg = validate_file(file, ALLOWED_XRAY_EXTENSIONS)
        if not is_valid:
            return jsonify({"success": False, "error": error_msg}), 400

        # Step 1: Run PyTorch model LOCALLY to get predictions (no API call)
        print(f"[XRay] Analyzing X-ray locally with PyTorch model: {file.filename}")
        prediction_summary = get_full_prediction_summary(file)
        high_conf = prediction_summary["high_confidence"]
        moderate = prediction_summary["moderate"]
        print(f"[XRay] Model results — High confidence: {len(high_conf)}, Moderate: {len(moderate)}")

        # Step 2: Send ONLY text predictions to Gemini (no image sent)
        print(f"[XRay] Sending text predictions to Gemini in {language} (no image)...")
        gemini_result = explain_xray_in_hindi(prediction_summary, language)

        # Step 3: Build and return the response
        return jsonify({
            "success": True,
            "type": "xray",
            "detected_conditions": high_conf,
            "moderate_findings": moderate,
            "hindi_explanation": gemini_result["hindi_explanation"],
            "severity": gemini_result["severity"],
            "disclaimer": DISCLAIMER
        })

    except RuntimeError as e:
        return jsonify({"success": False, "error": str(e)}), 500
    except Exception as e:
        print(f"[XRay] Unexpected error: {str(e)}")
        return jsonify({"success": False, "error": f"An unexpected error occurred: {str(e)}"}), 500


# ======================================================
# ENDPOINT 3: POST /text-to-speech
# ======================================================
@app.route("/text-to-speech", methods=["POST"])
def text_to_speech():
    """
    Convert Hindi text to an MP3 audio file.

    Expects JSON body with a 'text' field.
    Returns the MP3 audio file as a downloadable response.
    """
    try:
        # Parse JSON body
        data = request.get_json()

        if not data or "text" not in data:
            return jsonify({
                "success": False,
                "error": "Missing 'text' field in request body. Send JSON: {\"text\": \"your hindi text\"}"
            }), 400

        text = data["text"].strip()
        if not text:
            return jsonify({
                "success": False,
                "error": "Text cannot be empty."
            }), 400

        # Generate the audio file
        print(f"[TTS] Converting {len(text)} characters to speech...")
        audio_path = text_to_speech_hindi(text)

        # Schedule cleanup after the response is sent
        @after_this_request
        def cleanup(response):
            cleanup_audio_file(audio_path)
            return response

        # Return the audio file
        return send_file(
            audio_path,
            mimetype="audio/mpeg",
            as_attachment=True,
            download_name="speech.mp3"
        )

    except RuntimeError as e:
        return jsonify({"success": False, "error": str(e)}), 500
    except Exception as e:
        print(f"[TTS] Unexpected error: {str(e)}")
        return jsonify({"success": False, "error": f"An unexpected error occurred: {str(e)}"}), 500


# ======================================================
# ENDPOINT 4: POST /predict/heart
# ======================================================
@app.route("/predict/heart", methods=["POST"])
def predict_heart_endpoint():
    """Predict heart disease from patient data."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400

        result = predict_heart(data)
        return jsonify({"success": True, "type": "heart", **result, "disclaimer": DISCLAIMER})

    except RuntimeError as e:
        return jsonify({"success": False, "error": str(e)}), 500
    except Exception as e:
        print(f"[Heart] Unexpected error: {str(e)}")
        return jsonify({"success": False, "error": f"Prediction failed: {str(e)}"}), 500


# ======================================================
# ENDPOINT 5: POST /predict/diabetes
# ======================================================
@app.route("/predict/diabetes", methods=["POST"])
def predict_diabetes_endpoint():
    """Predict diabetes from patient data."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400

        result = predict_diabetes(data)
        return jsonify({"success": True, "type": "diabetes", **result, "disclaimer": DISCLAIMER})

    except RuntimeError as e:
        return jsonify({"success": False, "error": str(e)}), 500
    except Exception as e:
        print(f"[Diabetes] Unexpected error: {str(e)}")
        return jsonify({"success": False, "error": f"Prediction failed: {str(e)}"}), 500


# ======================================================
# ENDPOINT 6: POST /predict/kidney
# ======================================================
@app.route("/predict/kidney", methods=["POST"])
def predict_kidney_endpoint():
    """Predict chronic kidney disease from patient data."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400

        result = predict_kidney(data)
        return jsonify({"success": True, "type": "kidney", **result, "disclaimer": DISCLAIMER})

    except RuntimeError as e:
        return jsonify({"success": False, "error": str(e)}), 500
    except Exception as e:
        print(f"[Kidney] Unexpected error: {str(e)}")
        return jsonify({"success": False, "error": f"Prediction failed: {str(e)}"}), 500


# ======================================================
# ENDPOINT 7: POST /predict/cbc
# ======================================================
@app.route("/predict/cbc", methods=["POST"])
def predict_cbc_endpoint():
    """Predict anemia from CBC blood report data."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400

        result = predict_cbc(data)
        return jsonify({"success": True, "type": "cbc", **result, "disclaimer": DISCLAIMER})

    except RuntimeError as e:
        return jsonify({"success": False, "error": str(e)}), 500
    except Exception as e:
        print(f"[CBC] Unexpected error: {str(e)}")
        return jsonify({"success": False, "error": f"Prediction failed: {str(e)}"}), 500


# ======================================================
# ENDPOINT 8: POST /ai-chat
# ======================================================
@app.route("/ai-chat", methods=["POST"])
def ai_chat():
    """
    AI chat endpoint using Gemini API.
    Accepts a user message and returns an AI response about health queries.
    """
    try:
        data = request.get_json()
        if not data or "message" not in data:
            return jsonify({"success": False, "error": "Missing 'message' field"}), 400

        message = data["message"].strip()
        if not message:
            return jsonify({"success": False, "error": "Message cannot be empty"}), 400

        # Import here to use the configured model
        import google.generativeai as genai
        from dotenv import load_dotenv
        load_dotenv()
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-3.1-flash-lite-preview")

        # Build the prompt
        history = data.get("history", [])
        context_parts = [
            "You are Health Saathi AI, a medical health assistant. ",
            "You help patients understand their medical reports, health conditions, and provide general health guidance. ",
            "Be helpful, empathetic, and clear. If the user asks in Hindi/Hinglish, respond in the same language. ",
            "Always remind that your advice is not a substitute for professional medical consultation.\n\n",
        ]

        # Add conversation history
        for msg in history[-6:]:  # Last 6 messages for context
            role = "User" if msg.get("role") == "user" else "Assistant"
            context_parts.append(f"{role}: {msg.get('content', '')}\n")

        context_parts.append(f"User: {message}\nAssistant:")

        prompt = "".join(context_parts)

        response = model.generate_content(prompt)
        reply = response.text.strip()

        return jsonify({
            "success": True,
            "reply": reply,
            "timestamp": __import__("datetime").datetime.now().strftime("%I:%M %p")
        })

    except Exception as e:
        print(f"[Chat] Error: {str(e)}")
        return jsonify({"success": False, "error": f"AI chat error: {str(e)}"}), 500


# ======================================================
# ENDPOINT 13: POST /ai-suggestion
# ======================================================
@app.route("/ai-suggestion", methods=["POST"])
def ai_suggestion():
    """
    Generates AI-powered specialist doctor recommendations based on
    scan/prediction results. Returns which specialist to visit, urgency,
    and next steps.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        scan_type = data.get("type", "unknown")
        label = data.get("label", "")
        severity = data.get("severity", "Low")
        probability = data.get("probability", 0)
        details = data.get("details", {})

        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-3.1-flash-lite-preview")

        prompt = (
            "You are Health Saathi AI, a medical health advisor in India. "
            f"A patient just completed a {scan_type} analysis. The results are:\n\n"
            f"- Diagnosis: {label}\n"
            f"- Severity: {severity}\n"
            f"- Confidence: {round(probability * 100, 1)}%\n"
            f"- Detailed Results: {details}\n\n"
            "Based on these results, provide a helpful recommendation in the following JSON-like format "
            "(respond ONLY in plain text, NOT JSON):\n\n"
            "1. **Specialist Doctor Type**: Which type of specialist should the patient consult? "
            "(e.g., Neurologist, Pulmonologist, Oncologist, General Physician, etc.)\n"
            "2. **Urgency Level**: How urgent is it? (Routine / Soon / Urgent)\n"
            "3. **What To Do Next**: 2-3 specific actionable steps the patient should take\n"
            "4. **Lifestyle Tips**: 2-3 relevant lifestyle/diet tips based on the condition\n"
            "5. **Key Takeaway**: A single reassuring or alert sentence summarizing the situation\n\n"
            "Keep the language simple, clear, and empathetic. Use short bullet points. "
            "If the results show no issues (Low severity), still recommend a general checkup "
            "and healthy lifestyle tips. Always end with a reminder that this is AI guidance, "
            "not a replacement for professional medical advice."
        )

        response = model.generate_content(prompt)
        suggestion_text = response.text.strip()

        return jsonify({
            "success": True,
            "suggestion": suggestion_text,
            "scan_type": scan_type,
            "severity": severity
        })

    except Exception as e:
        print(f"[Suggestion] Error: {str(e)}")
        return jsonify({"success": False, "error": f"AI suggestion error: {str(e)}"}), 500


# ======================================================
# ENDPOINT 9: GET /model-info/<name>
# ======================================================
@app.route("/model-info/<name>", methods=["GET"])
def model_info(name):
    """
    Returns feature metadata for a prediction model.
    Used by the frontend to dynamically generate input forms.
    """
    valid_models = ["heart", "diabetes", "kidney", "cbc"]
    if name not in valid_models:
        return jsonify({
            "success": False,
            "error": f"Unknown model: {name}. Available: {', '.join(valid_models)}"
        }), 404

    features = get_feature_info(name)
    return jsonify({
        "success": True,
        "model": name,
        "features": features,
        "count": len(features)
    })


# ======================================================
# ENDPOINT 11: POST /predict/mri
# ======================================================
@app.route("/predict/mri", methods=["POST"])
def predict_mri_endpoint():
    """
    Predict brain tumor from an MRI image using ViT model.
    Expects multipart form-data with a 'file' field (PNG, JPG, JPEG).
    """
    try:
        file = request.files.get("file")
        is_valid, error_msg = validate_file(file, ALLOWED_XRAY_EXTENSIONS)
        if not is_valid:
            return jsonify({"success": False, "error": error_msg}), 400

        print(f"[MRI] Analyzing MRI scan: {file.filename}")
        result = predict_mri(file)
        return jsonify({"success": True, "type": "mri", **result, "disclaimer": DISCLAIMER})

    except RuntimeError as e:
        return jsonify({"success": False, "error": str(e)}), 500
    except Exception as e:
        print(f"[MRI] Unexpected error: {str(e)}")
        return jsonify({"success": False, "error": f"MRI prediction failed: {str(e)}"}), 500


# ======================================================
# ENDPOINT 12: POST /predict/lung-ct
# ======================================================
@app.route("/predict/lung-ct", methods=["POST"])
def predict_lung_ct_endpoint():
    """
    Predict lung condition from a CT scan image using Keras model.
    Expects multipart form-data with a 'file' field (PNG, JPG, JPEG).
    """
    try:
        file = request.files.get("file")
        is_valid, error_msg = validate_file(file, ALLOWED_XRAY_EXTENSIONS)
        if not is_valid:
            return jsonify({"success": False, "error": error_msg}), 400

        print(f"[LungCT] Analyzing CT scan: {file.filename}")
        result = predict_lung_ct(file)
        return jsonify({"success": True, "type": "lung_ct", **result, "disclaimer": DISCLAIMER})

    except RuntimeError as e:
        return jsonify({"success": False, "error": str(e)}), 500
    except Exception as e:
        print(f"[LungCT] Unexpected error: {str(e)}")
        return jsonify({"success": False, "error": f"Lung CT prediction failed: {str(e)}"}), 500


# ======================================================
# Health check endpoint
# ======================================================
@app.route("/health", methods=["GET"])
def health_check():
    """Simple health check endpoint."""
    return jsonify({
        "status": "running",
        "service": "Smart Medical Interpreter Service",
        "version": "2.1.0",
        "endpoints": [
            "POST /analyze-report",
            "POST /analyze-xray",
            "POST /text-to-speech",
            "POST /predict/heart",
            "POST /predict/diabetes",
            "POST /predict/kidney",
            "POST /predict/cbc",
            "POST /predict/mri",
            "POST /predict/lung-ct",
            "POST /ai-chat",
            "GET /model-info/<name>",
        ]
    })


# ======================================================
# ENDPOINT 10: POST /generate-diet
# ======================================================
@app.route("/generate-diet", methods=["POST"])
def generate_diet():
    """
    Generates a diet plan using Gemini based on a recent medical context.
    """
    try:
        data = request.get_json()
        context = data.get("context", "")
        language = data.get("language", "English")

        if not context:
            return jsonify({"success": False, "error": "Missing medical context"}), 400

        # Import gemini_helper here to avoid circular dependencies if any
        from gemini_helper import generate_diet_plan

        diet_plan = generate_diet_plan(context, language)

        return jsonify({
            "success": True,
            "diet_plan": diet_plan
        })

    except Exception as e:
        print(f"[Generate Diet] Error: {str(e)}")
        return jsonify({"success": False, "error": f"Failed to generate diet: {str(e)}"}), 500


# ======================================================
# Startup — load all models (runs on import for gunicorn)
# ======================================================
def _startup():
    """Load ML models and create temp dirs. Called once at module import."""
    os.makedirs("temp_uploads", exist_ok=True)
    os.makedirs("temp_audio", exist_ok=True)

    print("=" * 60)
    print("  Smart Medical Interpreter Service")
    print("  Starting up...")
    print("=" * 60)

    # Load pkl models at startup (heart, diabetes, kidney, cbc — small files)
    print("\n[Startup] Loading ML models...")
    try:
        load_all_models()
    except Exception as e:
        print(f"[WARNING] Error loading ML models: {e}")

    # Load the X-ray model at startup (one-time operation)
    if HAS_XRAY_MODULE:
        try:
            load_model()
        except Exception as e:
            print(f"[WARNING] Could not load X-ray model: {e}")
            print(f"[WARNING] The /analyze-xray endpoint will not work.")
            print(f"[WARNING] Other endpoints will still function normally.")

    # Load image-based ML models (Lung CT only; MRI skipped in production)
    if HAS_IMAGE_MODELS:
        print("\n[Startup] Loading image-based models (Lung CT)...")
        try:
            load_image_models()
        except Exception as e:
            print(f"[WARNING] Error loading image models: {e}")

    print("\n[Startup] Ready.")


# Run startup on module import so gunicorn workers also load models
_startup()


# ======================================================
# Start the dev server (only when run directly)
# ======================================================
if __name__ == "__main__":
    # PORT (Render) → FLASK_PORT (local) → 5050 (default)
    port = int(os.getenv("PORT", os.getenv("FLASK_PORT", "5050")))

    print(f"\n[Server] Starting on http://localhost:{port}")
    print(f"[Server] Max file size: {MAX_FILE_SIZE_MB} MB")
    print(f"[Server] Endpoints ready. Connect your frontend!\n")

    app.run(host="0.0.0.0", port=port, debug=False)

