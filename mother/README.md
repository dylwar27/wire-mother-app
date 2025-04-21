# Wire Mother

A console-based voice conversation application using Pipecat to orchestrate interactions between the user and Wire
Mother.

## Features

- Voice conversation with Wire Mother using your computer's microphone and speakers
- Speech recognition using OpenAI's GPT-4o model
- Natural language processing with GPT-4.5
- High-quality voice synthesis using ElevenLabs

## Prerequisites

- Python 3.9+
- OpenAI API key
- ElevenLabs API key and voice ID

## Setup

1. Create a `.env` file in the project root with the following variables:

```
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id
```

2. Install dependencies:

```bash
pip install -e .
```

## Running the Application

To start a conversation with Wire Mother:

```bash
python -m mother.main
```

Speak into your microphone to interact. Press Ctrl+C to exit.

## System Requirements

- A working microphone and speakers
- Internet connection for API access