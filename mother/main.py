import asyncio
import os
import signal
import sys

from dotenv import load_dotenv
from loguru import logger
from pipecat.pipeline.runner import PipelineRunner
from pipeline.wire_mother_pipeline import create_pipeline

# Load environment variables from .env file
load_dotenv()

# Check for required environment variables
required_env_vars = [
    "OPENAI_API_KEY",
    "ELEVENLABS_API_KEY",
    "ELEVENLABS_VOICE_ID"
]

missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
    logger.error("Please create a .env file with these variables or set them in your environment.")
    exit(1)

def handle_exit(sig, frame):
    """Handle exit signals gracefully."""
    print("\n\nShutting down Wire Mother...")
    sys.exit(0)

async def main():
    """Main entry point for the Wire Mother application."""
    
    # Set up signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)
    
    logger.info("Starting Wire Mother...")
    
    # Print welcome message
    print("\n" + "=" * 50)
    print("  Wire Mother - Voice Conversation")
    print("  Speak to interact, press Ctrl+C to exit")
    print("=" * 50 + "\n")
    
    try:
        # Create the pipeline task, initialization function, and monitoring task
        task, init_conversation, monitor_pipeline = await create_pipeline()
        
        # Create a runner for the pipeline
        runner = PipelineRunner(handle_sigint=True)
        
        # Run the pipeline, initialization, and monitoring together
        await asyncio.gather(runner.run(task), init_conversation(), monitor_pipeline())
        
    except KeyboardInterrupt:
        logger.info("Wire Mother shutting down gracefully...")
    except Exception as e:
        logger.error(f"An error occurred: {e}")
    finally:
        print("\n" + "=" * 50)
        print("  Wire Mother has disconnected.")
        print("=" * 50 + "\n")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass