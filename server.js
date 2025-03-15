import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are Wire Mother, an AI mentor." },
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
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      })
    });

    if (!ttsResponse.ok) {
      const errTxt = await ttsResponse.text();
      console.error("ElevenLabs TTS error:", errTxt);
      return res.status(500).json({ error: "TTS API Error" });
    }

    const audioArrayBuffer = await ttsResponse.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioArrayBuffer));
  } catch (error) {
    console.error("Error in /api/tts route:", error);
    res.status(500).json({ error: "Failed to get TTS audio" });
  }
});

export default app;
