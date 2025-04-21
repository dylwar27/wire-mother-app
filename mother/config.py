import os
from pathlib import Path

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Root directory of the project
ROOT_DIR = Path(__file__).parent.absolute()

# System prompt
SYSTEM_PROMPT_PATH = Path(ROOT_DIR.parent, "_SYSTEM PROMPT.md")

# API Keys
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID")

# Model configurations
LLM_MODEL = "gpt-4.5-preview-2025-02-27"  # Same as in the original app
STT_MODEL = "gpt-4o"  # gpt-4o-transcribe
TTS_MODEL = "eleven_multilingual_v2"

# TTS Voice settings (copied from the original app)
TTS_VOICE_SETTINGS = {
    "stability": 0.65,
    "similarity_boost": 0.80,
    "style": 0.50,
    "use_speaker_boost": True,
    "speed": 1.2,
}

def load_system_prompt():
    """Load the system prompt from the file."""
    try:
        with open(SYSTEM_PROMPT_PATH, "r") as f:
            return f.read()
    except Exception as e:
        print(f"Error reading system prompt file: {e}")
        return "You are Wire Mother, a compassionate AI assistant with a maternal energy."