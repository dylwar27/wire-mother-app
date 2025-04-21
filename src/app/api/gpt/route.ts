import fs from 'fs';
import path from 'path';
import {NextResponse} from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Type definitions for messages
type Role = 'system' | 'user' | 'assistant';

interface Message {
    role: Role;
    content: string;
}

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
        const {text, conversationHistory = []} = await request.json();
        console.log("Received text:", text);
        console.log("Received conversation history length:", conversationHistory.length);
        console.log("API Key defined:", !!process.env.OPENAI_API_KEY);

        // Build messages array with system prompt, conversation history, and current user message
        const messages: Message[] = [
            {
                role: "system",
                content: systemPrompt
            }
        ];

        // Add conversation history if provided
        if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
            messages.push(...conversationHistory);
        }

        // Add the current user message
        messages.push({role: "user", content: text});

        try {
            console.log("Starting OpenAI API call with", messages.length, "messages");
            const completion = await openai.chat.completions.create({
                model: "gpt-4.1",  // Use a stable model
                messages: messages
            });

            console.log("OpenAI API call completed");
            console.log("Response structure:", JSON.stringify(completion, null, 2));
            const reply = completion.choices[0]?.message?.content || "Hmm, I'm not sure what to say.";
            console.log("Extracted reply:", reply);

            // Create updated conversation history by adding the user message and assistant response
            const updatedHistory = [...(Array.isArray(conversationHistory) ? conversationHistory : [])];
            updatedHistory.push({role: "user", content: text});
            updatedHistory.push({role: "assistant", content: reply});

            return NextResponse.json({
                response: reply,
                conversationHistory: updatedHistory
            });
        } catch (openaiError: any) {
            console.error("OpenAI API Error:", openaiError.message);
            console.error("Error details:", openaiError.response?.data || openaiError);
            throw openaiError;  // Re-throw to be caught by outer catch
        }
    } catch (error) {
        console.error("Error in GPT route:", error);
        return NextResponse.json(
            {error: "Failed to get GPT response"},
            {status: 500}
        );
    }
}