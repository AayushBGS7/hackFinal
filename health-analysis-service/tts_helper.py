"""
tts_helper.py
-------------
Handles text-to-speech conversion for Hindi text using gTTS.
Generates MP3 audio files from text.
"""

import os
import uuid
from gtts import gTTS

# Directory for temporary audio files
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "temp_audio")
os.makedirs(AUDIO_DIR, exist_ok=True)


def text_to_speech_hindi(text: str) -> str:
    """
    Converts Hindi text to an MP3 audio file.

    Args:
        text: The Hindi text to convert to speech.

    Returns:
        Path to the generated MP3 file.

    Raises:
        RuntimeError: If the conversion fails.
    """
    try:
        # Generate a unique filename
        filename = f"speech_{uuid.uuid4().hex[:8]}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)

        # Use gTTS for Hindi text-to-speech
        tts = gTTS(text=text, lang="hi", slow=False)
        tts.save(filepath)

        return filepath

    except Exception as e:
        raise RuntimeError(f"Text-to-speech conversion failed: {str(e)}")


def cleanup_audio_file(filepath: str):
    """
    Removes a temporary audio file after it has been served.

    Args:
        filepath: Path to the audio file to delete.
    """
    try:
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
    except OSError:
        pass

