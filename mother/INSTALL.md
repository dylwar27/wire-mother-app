# Wire Mother Installation Guide

This guide provides detailed instructions for setting up and running the Wire Mother application.

## System Requirements

- Python 3.9 or higher
- A working microphone and speakers
- Internet connection for API access

## Step 1: Clone the Repository

If you haven't already, clone the repository:

```bash
git clone <repository-url>
cd wire-mother-app
```

## Step 2: Set Up API Keys

1. **OpenAI API Key**
    - Sign up at https://platform.openai.com/
    - Navigate to API keys and create a new secret key
    - Copy the key for use in step 4

2. **ElevenLabs API Key and Voice ID**
    - Sign up at https://elevenlabs.io/
    - Navigate to your profile settings to find your API key
    - Go to the voice library to select or create a voice
    - Copy the voice ID of your chosen voice

## Step 3: Create Environment File

Create a `.env` file in the `mother` directory by copying the template:

```bash
cp mother/.env.template mother/.env
```

Edit the `.env` file and replace the placeholder values with your actual API keys:

```
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id_here
```

## Step 4: Install Dependencies

Install the required dependencies:

```bash
# Navigate to the mother directory
cd mother

# Install the package in development mode
pip install -e .
```

## Step 5: Run the Application

Start the Wire Mother application:

```bash
python -m mother.main
```

You should see a welcome message in your terminal. Start speaking to interact with Wire Mother. Press Ctrl+C to exit.

## Troubleshooting

- **Microphone not working**: Check your system's audio input settings
- **API errors**: Verify your API keys in the `.env` file
- **Python errors**: Ensure you have the correct Python version installed
- **Package errors**: Try reinstalling the dependencies with `pip install -e .`