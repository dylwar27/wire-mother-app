from pipecat.frames.frames import (
    BotStartedSpeakingFrame,
    BotStoppedSpeakingFrame,
    InputAudioRawFrame,
    OutputAudioRawFrame,
    TextFrame,
    TranscriptionFrame,
    TTSAudioRawFrame,
    UserStartedSpeakingFrame,
    UserStoppedSpeakingFrame,
)
from pipecat.processors import FrameProcessor


class ConsoleStatusProcessor(FrameProcessor):
    """Simple processor to display the current status in the console."""
    
    def __init__(self, name=None):
        # Initialize the parent FrameProcessor with proper parameters
        super().__init__(name=name or "ConsoleStatusProcessor")
        self.listening = False
        self.thinking = False
        self.speaking = False
    
    async def process_frame(self, frame, direction=None):
        # Handle user speaking events
        if isinstance(frame, UserStartedSpeakingFrame):
            if not self.listening:
                self.listening = True
                self.thinking = False
                self.speaking = False
                print("\n🎤 Listening...\n")
        
        # User stopped speaking
        elif isinstance(frame, UserStoppedSpeakingFrame):
            # Don't change state yet, wait for transcription
            pass
        
        # Handle input audio frames (optional additional feedback)
        elif isinstance(frame, InputAudioRawFrame) and not self.speaking:
            # Audio is coming in, ensure we're in listening mode
            self.listening = True
            
        # Handle transcription frames (speech-to-text results)
        elif isinstance(frame, TranscriptionFrame):
            self.listening = False
            self.thinking = True
            self.speaking = False
            print(f"\n💬 You said: {frame.text}")
            print("\n💭 Thinking...\n")
            
        # Handle text frames when using standard TextFrame output from STT
        elif isinstance(frame, TextFrame) and not self.speaking:
            # This might be from the user (after STT) or the AI (before TTS)
            if self.listening:
                # This is likely from STT
                self.listening = False
                self.thinking = True
                print(f"\n💬 You said: {frame.text}")
                print("\n💭 Thinking...\n")
            elif "assistant" in frame.metadata.get("role", frame.metadata.get("source", "")):
                # This is from the LLM
                self.thinking = False
                print(f"\n🤖 Wire Mother: {frame.text}")
                
        # Bot started speaking
        elif isinstance(frame, BotStartedSpeakingFrame):
            self.listening = False
            self.thinking = False
            self.speaking = True
            print("\n🔊 Speaking...\n")
            
        # Handle TTS audio output
        elif isinstance(frame, TTSAudioRawFrame) or isinstance(frame, OutputAudioRawFrame):
            self.speaking = True
            
        # Bot stopped speaking
        elif isinstance(frame, BotStoppedSpeakingFrame):
            self.listening = False
            self.thinking = False
            self.speaking = False
            print("\n⏳ Waiting for your response...\n")
            
        return frame