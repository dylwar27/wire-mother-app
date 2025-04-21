from pipecat.frames.frames import (
    TextFrame,
    TTSAudioRawFrame,
    TTSStartedFrame,
    TTSStoppedFrame,
)
from pipecat.processors import FrameProcessor
from pipecat.services.tts.elevenlabs import ElevenLabsTTSService

from ..config import (
    ELEVENLABS_API_KEY,
    ELEVENLABS_VOICE_ID,
    TTS_MODEL,
    TTS_VOICE_SETTINGS,
)


class WireMotherTTSService(FrameProcessor):
    """Text-to-Speech processor for Wire Mother using ElevenLabs."""
    
    def __init__(self):
        super().__init__()
        self.tts_service = ElevenLabsTTSService(
            api_key=ELEVENLABS_API_KEY,
            voice_id=ELEVENLABS_VOICE_ID,
            model_id=TTS_MODEL,
            voice_settings=TTS_VOICE_SETTINGS
        )
        
    async def process_frame(self, frame, direction=None):
        if isinstance(frame, TextFrame) and (
            frame.metadata.get("source") == "assistant" or 
            frame.metadata.get("role") == "assistant"
        ):
            # Signal that TTS is starting
            start_frame = TTSStartedFrame()
            
            # Convert response text to audio
            audio_data = await self.tts_service.synthesize_speech(frame.text)
            
            # Create a TTS audio frame with the synthesized speech
            audio_frame = TTSAudioRawFrame(
                audio=audio_data,
                sample_rate=44100,  # ElevenLabs typically uses 44.1kHz
                num_channels=1
            )
            
            # Add metadata
            audio_frame.metadata["source"] = "tts"
            
            # Signal that TTS is complete
            stop_frame = TTSStoppedFrame()
            
            # Return all frames in sequence
            return [start_frame, audio_frame, stop_frame]
            
        return frame