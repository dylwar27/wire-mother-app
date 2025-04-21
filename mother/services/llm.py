from pipecat.frames.frames import EndFrame, LLMTextFrame, TextFrame
from pipecat.processors import FrameProcessor
from pipecat.services.llm.openai import OpenAILLMService

from ..config import LLM_MODEL, OPENAI_API_KEY, load_system_prompt


class WireMotherLLMService(FrameProcessor):
    """Custom LLM processor for Wire Mother using OpenAI's GPT model."""
    
    def __init__(self):
        super().__init__()
        self.system_prompt = load_system_prompt()
        self.llm_service = OpenAILLMService(
            api_key=OPENAI_API_KEY,
            model=LLM_MODEL,
            system_prompt=self.system_prompt
        )
        self.conversation_history = []
        
    async def process_frame(self, frame, direction=None):
        if isinstance(frame, TextFrame) and frame.metadata.get("source") == "user":
            user_text = frame.text
            
            # Add user message to conversation history
            self.conversation_history.append({"role": "user", "content": user_text})
            
            # Get response from LLM
            response = await self.llm_service.generate_text(
                user_text, 
                conversation_history=self.conversation_history
            )
            
            # Add assistant response to conversation history
            self.conversation_history.append({"role": "assistant", "content": response})
            
            # Create an LLMTextFrame with the response
            response_frame = LLMTextFrame(
                text=response
            )
            # Add metadata
            response_frame.metadata["source"] = "assistant"
            response_frame.metadata["role"] = "assistant"
            
            return response_frame
        
        elif isinstance(frame, EndFrame):
            # Reset conversation history on end
            self.conversation_history = []
            
        return frame