# Rural Health Analysis Service

A standalone Python Flask microservice that provides AI-powered medical analysis for rural health workers in India. It accepts medical reports (PDFs or images) and chest X-ray images, processes them using OCR and deep learning, and returns simple Hindi explanations that can be understood by people in villages.

---

## What This Service Does

This service exposes REST API endpoints that:

1. **Analyze Medical Reports** — Extracts text from uploaded report images/PDFs using Tesseract OCR, then uses Google Gemini AI to generate a simple Hindi explanation of the findings, severity level, and recommended next steps.

2. **Analyze Chest X-rays** — Runs a chest X-ray image through a pretrained TorchXRayVision DenseNet model to detect pathologies, then uses Gemini AI to explain the results in simple Hindi.

3. **Text-to-Speech** — Converts Hindi text to an MP3 audio file using Google Text-to-Speech (gTTS), useful for patients who cannot read.

---

## Prerequisites

Before setting up, make sure you have:

- **Python 3.9+** installed
- **Tesseract OCR** installed on your system
  - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki and add to PATH
  - Linux: `sudo apt install tesseract-ocr`
  - macOS: `brew install tesseract`
- **Poppler** (required for PDF support)
  - Windows: Download from https://github.com/oschwartz10612/poppler-windows/releases and add `bin/` to PATH
  - Linux: `sudo apt install poppler-utils`
  - macOS: `brew install poppler`
- **Google Gemini API key** — Get one at https://aistudio.google.com/app/apikey

---

## Setup Steps

### 1. Clone or copy this folder

```bash
cd health-analysis-service
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

> **Note:** The first run will download the TorchXRayVision pretrained model weights (~50 MB). This is automatic and only happens once.

### 3. Configure environment variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Gemini API key
# GEMINI_API_KEY=your_actual_api_key_here
```

### 4. Start the server

```bash
python app.py
```

The server will start on `http://localhost:5050` (or whatever port you set in `.env`).

---

## Testing with test_ui.html

1. Start the Flask server: `python app.py`
2. Open `test_ui.html` directly in your browser (just double-click the file)
3. Upload a sample file from the `test_samples/` folder
4. Click the appropriate "Analyze" button
5. View the Hindi explanation and results on screen

The test UI connects to the Flask server running on `localhost:5050`. Make sure the server is running before you test.

---

## API Endpoints

### POST `/analyze-report`

Analyze a medical report (PDF or image) and get a Hindi explanation.

**Request:** Multipart form-data with a `file` field

**Response:**
```json
{
  "success": true,
  "type": "report",
  "hindi_explanation": "...",
  "severity": "Low | Medium | High",
  "disclaimer": "यह सिस्टम केवल सुझाव देता है। यह डॉक्टर का विकल्प नहीं है।"
}
```

---

### POST `/analyze-xray`

Analyze a chest X-ray image and get a Hindi explanation.

**Request:** Multipart form-data with a `file` field

**Response:**
```json
{
  "success": true,
  "type": "xray",
  "detected_conditions": [
    {"condition": "Pneumonia", "probability": 0.82},
    {"condition": "Effusion", "probability": 0.61}
  ],
  "hindi_explanation": "...",
  "disclaimer": "यह सिस्टम केवल सुझाव देता है। यह डॉक्टर का विकल्प नहीं है।"
}
```

---

### POST `/text-to-speech`

Convert Hindi text to an MP3 audio file.

**Request:** JSON body
```json
{
  "text": "Hindi text string here"
}
```

**Response:** MP3 audio file (`audio/mpeg`)

---

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "running",
  "service": "Rural Health Analysis Service",
  "version": "1.0.0"
}
```

---

## cURL Examples

### Test report analysis

```bash
curl -X POST http://localhost:5050/analyze-report \
  -F "file=@test_samples/sample_report.jpg"
```

### Test X-ray analysis

```bash
curl -X POST http://localhost:5050/analyze-xray \
  -F "file=@test_samples/sample_xray.png"
```

### Test text-to-speech

```bash
curl -X POST http://localhost:5050/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text": "आपकी रिपोर्ट सामान्य है।"}' \
  --output output.mp3
```

### Health check

```bash
curl http://localhost:5050/health
```

---

## Integrating Into Another Project

This service is designed to be called from any frontend or backend. Just make HTTP POST requests to the endpoints:

```python
# Python example
import requests

# Analyze a report
with open("report.pdf", "rb") as f:
    response = requests.post(
        "http://localhost:5050/analyze-report",
        files={"file": f}
    )
    result = response.json()
    print(result["hindi_explanation"])
```

```javascript
// JavaScript example
const formData = new FormData();
formData.append("file", fileInput.files[0]);

const response = await fetch("http://localhost:5050/analyze-report", {
    method: "POST",
    body: formData
});
const result = await response.json();
console.log(result.hindi_explanation);
```

---

## Project Structure

```
health-analysis-service/
├── app.py                # Flask app, routes, and entry point
├── xray_analysis.py      # TorchXRayVision model loading and inference
├── ocr_extraction.py     # Tesseract OCR text extraction
├── gemini_helper.py      # Gemini API calls and Hindi prompt logic
├── tts_helper.py         # gTTS text-to-speech (optional)
├── requirements.txt      # Python dependencies
├── .env.example          # Environment variable template
├── README.md             # This file
├── test_ui.html          # Browser-based test UI
└── test_samples/         # Sample files for testing
    ├── sample_xray.png
    └── sample_report.jpg
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

Common errors:
- Missing or empty file upload
- Unsupported file type
- File too large (> 10 MB)
- Gemini API key not configured
- Tesseract not installed on the system
- X-ray model failed to load

---

## License

This service is part of a larger rural health project. Use responsibly. This system provides suggestions only and is **not a substitute for professional medical advice**.

