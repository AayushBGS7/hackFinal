"""
ocr_extraction.py
-----------------
Handles text extraction from medical report files using Tesseract OCR.
Supports:
  - Image files (JPG, JPEG, PNG) — direct OCR
  - PDF files — converts each page to an image, then runs OCR on each page
"""

import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import io
import os


def extract_text_from_image(image_file) -> str:
    """
    Extracts text from an uploaded image file using Tesseract OCR.

    Args:
        image_file: A file-like object (e.g., from Flask's request.files).

    Returns:
        Extracted text as a string.

    Raises:
        RuntimeError: If OCR fails or image cannot be processed.
    """
    try:
        # Open the image using Pillow
        image = Image.open(image_file)

        # Convert to RGB if necessary (handles RGBA, grayscale, etc.)
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Run Tesseract OCR on the image
        # Using English + Hindi language packs for better medical report reading
        text = pytesseract.image_to_string(image, lang="eng")

        if not text.strip():
            raise RuntimeError("OCR could not extract any text from the image. "
                               "Please ensure the image is clear and contains readable text.")

        return text.strip()

    except RuntimeError:
        raise
    except Exception as e:
        raise RuntimeError(f"Failed to extract text from image: {str(e)}")


def extract_text_from_pdf(pdf_file) -> str:
    """
    Extracts text from an uploaded PDF file.
    Converts each page to an image and runs OCR.

    Args:
        pdf_file: A file-like object (e.g., from Flask's request.files).

    Returns:
        Combined extracted text from all pages as a string.

    Raises:
        RuntimeError: If PDF conversion or OCR fails.
    """
    try:
        # Save the uploaded PDF to a temporary location
        temp_pdf_path = os.path.join("temp_uploads", "temp_report.pdf")
        os.makedirs("temp_uploads", exist_ok=True)
        pdf_file.save(temp_pdf_path)

        # Convert PDF pages to images using poppler
        pages = convert_from_path(temp_pdf_path, dpi=300)

        all_text = []
        for i, page in enumerate(pages):
            # Run OCR on each page image
            text = pytesseract.image_to_string(page, lang="eng")
            if text.strip():
                all_text.append(f"--- Page {i + 1} ---\n{text.strip()}")

        # Clean up temporary file
        try:
            os.remove(temp_pdf_path)
        except OSError:
            pass

        combined_text = "\n\n".join(all_text)

        if not combined_text.strip():
            raise RuntimeError("OCR could not extract any text from the PDF. "
                               "Please ensure the PDF contains readable text or images.")

        return combined_text.strip()

    except RuntimeError:
        raise
    except Exception as e:
        raise RuntimeError(f"Failed to extract text from PDF: {str(e)}")


def extract_text(file_obj, filename: str) -> str:
    """
    Determines the file type and routes to the appropriate extraction method.

    Args:
        file_obj: The uploaded file object.
        filename: The original filename (used to determine file type).

    Returns:
        Extracted text string.
    """
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if extension == "pdf":
        return extract_text_from_pdf(file_obj)
    elif extension in ("jpg", "jpeg", "png"):
        return extract_text_from_image(file_obj)
    else:
        raise RuntimeError(
            f"Unsupported file type: .{extension}. "
            "Accepted types: jpg, jpeg, png, pdf"
        )

