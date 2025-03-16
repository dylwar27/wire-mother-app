import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Load environment variables from .env file
dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read system prompt from file
const systemPromptPath = path.join(__dirname, '_SYSTEM PROMPT.md');
let systemPrompt;
try {
  systemPrompt = fs.readFileSync(systemPromptPath, 'utf8');
  console.log("Successfully loaded system prompt from file");
} catch (error) {
  console.error("Error reading system prompt file:", error);
  systemPrompt = "You are Wire Mother, a compassionate AI assistant with a maternal energy.";
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Route for serving frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API Routes
app.post("/api/gpt", async (req, res) => {
  try {
    const { text } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: systemPrompt
          },
          { role: "user", content: text }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Hmm, I'm not sure what to say.";
    
    res.json({ response: reply });
  } catch (error) {
    console.error("Error in /api/gpt route:", error);
    res.status(500).json({ error: "Failed to get GPT response" });
  }
});

app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;

    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          "stability": 0.33,
          "similarity_boost": 0.80,
          "style": 0.95,
          "use_speaker_boost": true,
          "speed": 1.03,
        }
      })
    });

    if (!ttsResponse.ok) {
      const errTxt = await ttsResponse.text();
      console.error("ElevenLabs TTS error:", errTxt);
      return res.status(500).json({ error: "TTS API Error" });
    }

    // Stream audio back to the client
    const audioArrayBuffer = await ttsResponse.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioArrayBuffer));
  } catch (error) {
    console.error("Error in /api/tts route:", error);
    res.status(500).json({ error: "Failed to get TTS audio" });
  }
});

export default app;

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Wire Mother server running on port ${PORT}`);
  console.log("OpenAI key is:", process.env.OPENAI_API_KEY ? "Set correctly" : "Missing");
  console.log("ElevenLabs key is:", process.env.ELEVENLABS_API_KEY ? "Set correctly" : "Missing");
  console.log("ElevenLabs Voice ID:", process.env.ELEVENLABS_VOICE_ID ? "Set correctly" : "Missing");
});