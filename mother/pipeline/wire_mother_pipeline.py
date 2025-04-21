import asyncio
import os
from pathlib import Path

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.services.elevenlabs.tts import ElevenLabsTTSService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.services.openai.stt import OpenAISTTService
from pipecat.transports.local.audio import (
    LocalAudioTransport,
    LocalAudioTransportParams,
)

# We'll use event handlers for console status instead of a custom processor

# Load system prompt
def load_system_prompt():
    """Load the system prompt from the file."""
    system_prompt_path = Path(__file__).parent.parent.parent / "_SYSTEM PROMPT.md"
    try:
        with open(system_prompt_path, "r") as f:
            return f.read()
    except Exception as e:
        print(f"Error reading system prompt file: {e}")
        return "You are Wire Mother, a compassionate AI assistant with a maternal energy."

async def create_pipeline():
    """Creates and returns the Wire Mother pipeline."""
    
    # Set up the transport for microphone input and speaker output
    transport = LocalAudioTransport(
        params=LocalAudioTransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
            vad_audio_passthrough=True,
        ),
    )

    # Set up the STT service with OpenAI
    stt = OpenAISTTService(
        api_key=os.getenv("OPENAI_API_KEY"),
        model = "gpt-4o-transcribe",
    )

    # Set up the ElevenLabs TTS service
    tts = ElevenLabsTTSService(
        api_key=os.getenv("ELEVENLABS_API_KEY"),
        voice_id=os.getenv("ELEVENLABS_VOICE_ID"),
        voice_settings={
            "stability": 0.65,
            "similarity_boost": 0.80,
            "style": 0.50,
            "use_speaker_boost": True,
            "speed": 1.2,
        }
    )

    # Set up the LLM service with OpenAI
    llm = OpenAILLMService(
        api_key=os.getenv("OPENAI_API_KEY"),
        model="gpt-4.1"  # Same as in the original app
    )

    # Initialize conversation with system prompt
    system_prompt = load_system_prompt()
    messages = [
        {
            "role": "system",
            "content": system_prompt
        },
    ]

    # Create the context aggregator
    context = OpenAILLMContext(messages)
    context_aggregator = llm.create_context_aggregator(context)

    # Create the pipeline without the console status processor
    pipeline = Pipeline(
        [
            transport.input(),  # Microphone input
            stt,                # Speech-to-text
            context_aggregator.user(),  # Add user message to context
            llm,                # Process with LLM
            tts,                # Text-to-speech
            transport.output(), # Speaker output
            context_aggregator.assistant(),  # Add assistant response to context
        ]
    )
    
    # Instead of using event handlers, let's set up a simple monitor to watch the pipeline
    # This is safer since we don't know exactly which events are available in LocalAudioTransport
    
    # Print a starting message
    print("\n🔄 Pipeline initialized. Waiting for audio input...\n")
    
    # Set up a simple monitoring task that will print updates
    async def monitor_pipeline():
        await asyncio.sleep(1)  # Give time for pipeline to start
        print("\n⏳ Wire Mother is listening. Please start speaking...\n")
        
        # Show the welcome message
        print("\n🤖 Wire Mother: Wire Mother is ready. Start speaking to begin.\n")
    
    # Create the pipeline task
    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            allow_interruptions=True,
            enable_metrics=True,
            enable_usage_metrics=True,
            report_only_initial_ttfb=True,
        ),
    )
    
    # Add initial assistant message to the conversation
    messages.append({
        "role": "assistant", 
        "content": "Wire Mother is ready. Start speaking to begin."
    })
    
    # Queue the initial message to be processed
    async def init_conversation():
        await asyncio.sleep(1)  # Short delay to make sure pipeline is ready
        await task.queue_frames([context_aggregator.assistant().get_context_frame()])
    
    # Return the monitoring task with the main task
    return task, init_conversation, monitor_pipeline