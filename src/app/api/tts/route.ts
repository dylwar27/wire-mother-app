import {NextResponse} from 'next/server';

export async function POST(request: Request) {
    try {
        const {text} = await request.json();

        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "xi-api-key": process.env.ELEVENLABS_API_KEY as string
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    "stability": 0.65,
                    "similarity_boost": 0.80,
                    "style": 0.50,
                    "use_speaker_boost": true,
                    "speed": 1.2,
                }
            })
        });

        if (!ttsResponse.ok) {
            const errTxt = await ttsResponse.text();
            console.error("ElevenLabs TTS error:", errTxt);
            return NextResponse.json(
                {error: "TTS API Error"},
                {status: 500}
            );
        }

        // Get audio as array buffer
        const audioArrayBuffer = await ttsResponse.arrayBuffer();

        // Return audio with appropriate content type
        return new NextResponse(audioArrayBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
            },
        });
    } catch (error) {
        console.error("Error in TTS route:", error);
        return NextResponse.json(
            {error: "Failed to get TTS audio"},
            {status: 500}
        );
    }
}