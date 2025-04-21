from pipecat.frames.frames import InputAudioRawFrame, TranscriptionFrame
from pipecat.processors.frame_processor import FrameProcessor
from pipecat.services.openai import OpenAISTTService

from ..config import OPENAI_API_KEY, STT_MODEL


class WireMotherSTTService(FrameProcessor):
    """Speech-to-Text processor for Wire Mother using OpenAI's gpt-4o-transcribe."""
    
    def __init__(self):
        super().__init__()
        self.stt_service = OpenAISTTService(
            api_key=OPENAI_API_KEY,
            model=STT_MODEL
        )
        
    async def process_frame(self, frame, direction=None):
        if isinstance(frame, InputAudioRawFrame):
            # Transcribe the audio
            transcription = await self.stt_service.process_frame(frame.audio)
            
            # Create transcription frame with the result
            if transcription:
                # TranscriptionFrame requires user_id and timestamp
                from datetime import datetime
                timestamp = datetime.now().isoformat()
                
                trans_frame = TranscriptionFrame(
                    text=transcription,
                    user_id="local_user",
                    timestamp=timestamp
                )
                
                # Add additional metadata
                trans_frame.metadata["source"] = "user"
                trans_frame.metadata["role"] = "user"
                
                return trans_frame
                
        return frame