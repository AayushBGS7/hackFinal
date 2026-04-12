"""
gemini_helper.py
----------------
Handles all interactions with the Google Gemini API.
Provides prompt templates and response generation for:
  - Medical report explanations in Hindi
  - X-ray analysis explanations in Hindi
"""

import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure the Gemini API with the key from .env
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Use gemini-2.0-flash model for fast, cost-effective generation
model = genai.GenerativeModel("gemini-3.1-flash-lite-preview")


def explain_report_in_hindi(report_text: str, language: str = "English") -> dict:
    """
    Takes extracted medical report text and sends it to Gemini
    with a prompt that asks for a simple Hindi explanation.

    Args:
        report_text: The OCR-extracted text from a medical report.

    Returns:
        dict with keys: hindi_explanation, severity
    """
    prompt = (
        "You are a rural health assistant in India. "
        f"Given the following medical report text, respond ONLY in simple {language}. "
        "Include:\n"
        "1) What the problem is\n"
        "2) Severity level — respond with EXACTLY one of: Low / Medium / High\n"
        "3) What the patient should do next\n\n"
        f"Keep language very simple, as if explaining to someone in a village in {language}.\n\n"
        "IMPORTANT: At the very end of your response, on a new line, write ONLY the severity as:\n"
        "SEVERITY: Low\n"
        "or\n"
        "SEVERITY: Medium\n"
        "or\n"
        "SEVERITY: High\n\n"
        f"Report text:\n{report_text}"
    )

    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Parse severity from the response
        severity = _extract_severity(response_text)

        # Remove the SEVERITY line from the explanation text
        explanation = _remove_severity_line(response_text)

        return {
            "hindi_explanation": explanation,
            "severity": severity
        }

    except Exception as e:
        raise RuntimeError(f"Gemini API error: {str(e)}")


def explain_xray_in_hindi(prediction_data, language: str = "English") -> str:
    """
    Takes the prediction results from the PyTorch X-ray model and sends
    ONLY the text-based predictions (no image) to Gemini for a Hindi explanation.

    This approach avoids sending images to the Gemini API, significantly
    reducing quota usage. The PyTorch model handles all image analysis locally.

    Args:
        prediction_data: Either a dict from get_full_prediction_summary() with
                         keys 'high_confidence', 'moderate', 'all_scores',
                         OR a legacy list of dicts with 'condition' and 'probability'.

    Returns:
        Hindi explanation string from Gemini.
    """
    # Support both new dict format and legacy list format
    if isinstance(prediction_data, dict):
        high_confidence = prediction_data.get("high_confidence", [])
        moderate = prediction_data.get("moderate", [])
        all_scores = prediction_data.get("all_scores", {})
    else:
        # Legacy: plain list of detected conditions
        high_confidence = prediction_data
        moderate = []
        all_scores = {}

    if high_confidence or moderate:
        # Build detailed context from model predictions
        prompt_parts = [
            "You are a rural health assistant in India. ",
            "A chest X-ray was analyzed by a local AI model (DenseNet121 pretrained on chest X-rays). ",
            "Below are the AI model's prediction results (text only, no image). ",
            f"Based on these predictions, provide guidance in very simple {language}.\n\n",
        ]

        if high_confidence:
            conditions_str = ", ".join(
                f"{c['condition']} ({c['probability']:.0%} confidence)"
                for c in high_confidence
            )
            prompt_parts.append(
                f"HIGH CONFIDENCE detections (>50%): {conditions_str}\n"
            )

        if moderate:
            moderate_str = ", ".join(
                f"{c['condition']} ({c['probability']:.0%} confidence)"
                for c in moderate
            )
            prompt_parts.append(
                f"MODERATE findings (30-50%): {moderate_str}\n"
            )

        prompt_parts.append(
            "\nIMPORTANT: At the end, on a new line, write severity as:\n"
            "SEVERITY: Low\nor\nSEVERITY: Medium\nor\nSEVERITY: High\n\n"
            "Include:\n"
            "1) What the conditions mean in simple terms\n"
            "2) What the patient should do next\n"
            "3) Whether they need urgent care\n"
            f"Keep language very simple, as if explaining to someone in a village in {language}."
        )

        prompt = "".join(prompt_parts)
    else:
        # No significant conditions detected
        prompt = (
            "You are a rural health assistant in India. "
            "A chest X-ray was analyzed by a local AI model and no major issues were found. "
            "All pathology scores are below 30% confidence. "
            f"Write a short reassuring message in simple {language} telling the patient "
            "their X-ray looks okay but they should still consult a doctor if they have symptoms.\n\n"
            "At the end, on a new line, write:\nSEVERITY: Low"
        )

    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Parse severity from response
        severity = _extract_severity(response_text)
        explanation = _remove_severity_line(response_text)

        return {
            "hindi_explanation": explanation,
            "severity": severity
        }

    except Exception as e:
        raise RuntimeError(f"Gemini API error: {str(e)}")

def generate_diet_plan(medical_context: str, language: str = "English") -> str:
    """
    Generates a targeted diet plan based on a medical report summary.
    """
    try:
        prompt = (
            f"You are a clinical nutritionist and health expert. "
            f"Based on the following medical report analysis/summary, "
            f"create a personalized, highly specific 1-day sample diet plan. "
            f"Respond ONLY in {language}. Provide response in Markdown formatting.\n\n"
            f"Format strongly with:\n"
            f"**Breakfast:**\n"
            f"**Lunch:**\n"
            f"**Dinner:**\n"
            f"**Snacks:**\n"
            f"**Foods to Strictly Avoid:**\n\n"
            f"Medical Context:\n{medical_context}"
        )
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini Diet] Error: {str(e)}")
        raise RuntimeError(f"Gemini API error: {str(e)}")


def _extract_severity(text: str) -> str:
    """
    Extracts severity level from the Gemini response.
    Looks for the pattern 'SEVERITY: Low/Medium/High' at the end.
    Falls back to 'Medium' if not found.
    """
    lines = text.strip().split("\n")
    for line in reversed(lines):
        line_clean = line.strip().upper()
        if "SEVERITY:" in line_clean:
            if "HIGH" in line_clean:
                return "High"
            elif "MEDIUM" in line_clean:
                return "Medium"
            elif "LOW" in line_clean:
                return "Low"
    # Fallback: try to detect from the full text
    text_upper = text.upper()
    if "HIGH" in text_upper and "SEVERITY" in text_upper:
        return "High"
    elif "LOW" in text_upper and "SEVERITY" in text_upper:
        return "Low"
    return "Medium"


def _remove_severity_line(text: str) -> str:
    """
    Removes the 'SEVERITY: ...' line from the response text
    so it doesn't appear in the explanation shown to users.
    """
    lines = text.strip().split("\n")
    filtered = [
        line for line in lines
        if "SEVERITY:" not in line.strip().upper()
    ]
    return "\n".join(filtered).strip()

