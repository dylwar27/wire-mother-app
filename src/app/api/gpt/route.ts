import fs from 'fs';
import path from 'path';
import {NextResponse} from 'next/server';

// Read system prompt from file
const systemPromptPath = path.join(process.cwd(), '_SYSTEM PROMPT.md');
let systemPrompt: string;

try {
    systemPrompt = fs.readFileSync(systemPromptPath, 'utf8');
    console.log("Successfully loaded system prompt from file");
} catch (error) {
    console.error("Error reading system prompt file:", error);
    systemPrompt = "You are Wire Mother, a compassionate AI assistant with a maternal energy.";
}

export async function POST(request: Request) {
    try {
        const {text} = await request.json();

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4.5-preview",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {role: "user", content: text}
                ]
            })
        });

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "Hmm, I'm not sure what to say.";

        return NextResponse.json({response: reply});
    } catch (error) {
        console.error("Error in GPT route:", error);
        return NextResponse.json(
            {error: "Failed to get GPT response"},
            {status: 500}
        );
    }
}