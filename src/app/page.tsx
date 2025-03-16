'use client';

import {useEffect, useRef, useState} from 'react';

export default function Home() {
    const [messages, setMessages] = useState<{ text: string, isUser: boolean, isError?: boolean }[]>([]);
    const [status, setStatus] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isTextMode, setIsTextMode] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize speech recognition if available in browser
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.lang = 'en-US';
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;

                recognitionRef.current.onresult = (event: any) => {
                    const userInput = event.results[0][0].transcript;
                    console.log("Speech recognized:", userInput);
                    addMessage(userInput, true);
                    getGPTResponse(userInput);
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error("Speech recognition error:", event.error);
                    addMessage(`Speech recognition error: ${event.error}`, false, true);
                };

                recognitionRef.current.onstart = () => {
                    console.log("Speech recognition started");
                    setIsListening(true);
                    setStatus("Listening... Speak now");
                };

                recognitionRef.current.onend = () => {
                    console.log("Speech recognition ended");
                    setIsListening(false);
                    setStatus("Speech recognition stopped");
                };
            } else {
                console.error("Speech Recognition API not available");
                addMessage("Speech recognition is not supported in your browser. Please use the text input option instead.", false, true);
                setIsTextMode(true);
            }
        }

        // Add initial message
        addMessage("Wire Mother is ready. Click 'Start Talking' or use 'Text Mode' to begin.", false);
    }, []);

    // Scroll to bottom when messages update
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Add message to chat
    const addMessage = (text: string, isUser: boolean, isError = false) => {
        setMessages(prev => [...prev, {text, isUser, isError}]);
    };

    // Get response from GPT API
    const getGPTResponse = async (userText: string) => {
        try {
            setStatus("Thinking...");
            setIsLoading(true);

            console.log("Sending request to /api/gpt");
            const res = await fetch("/api/gpt", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({text: userText})
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            console.log("Received response from /api/gpt");
            const data = await res.json();
            addMessage(data.response, false);
            setStatus("Playing audio response...");
            await playTTS(data.response);
            setStatus("");
        } catch (error: any) {
            console.error("Error in getGPTResponse:", error);
            setStatus("");
            addMessage(`Error: ${error.message || "There was an error processing your request."}`, false, true);
        } finally {
            setIsLoading(false);
        }
    };

    // Play TTS audio
    const playTTS = async (text: string) => {
        try {
            console.log("Sending request to /api/tts");
            const res = await fetch("/api/tts", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({text})
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("TTS API Error:", errorText);
                throw new Error(`TTS API error (${res.status}): ${errorText}`);
            }

            console.log("Received audio response from /api/tts");
            const audioBlob = await res.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            return new Promise<void>((resolve, reject) => {
                audio.onended = () => {
                    console.log("Audio playback ended");
                    URL.revokeObjectURL(audioUrl); // Clean up the URL
                    resolve();
                };

                audio.onerror = (e) => {
                    console.error("Audio playback error:", e);
                    URL.revokeObjectURL(audioUrl); // Clean up the URL
                    reject(new Error("Audio playback failed"));
                };

                console.log("Starting audio playback");
                audio.play().catch(err => {
                    console.error("Failed to play audio:", err);
                    reject(err);
                });
            });
        } catch (error: any) {
            console.error("Error in playTTS:", error);
            addMessage(`Audio error: ${error.message || "There was an error playing the audio."}`, false, true);
            throw error;
        }
    };

    // Handle start button click
    const handleStartClick = () => {
        if (!recognitionRef.current) {
            console.error("Speech recognition not available");
            addMessage("Speech recognition is not available in your browser. Please use the text input instead.", false, true);
            setIsTextMode(true);
            return;
        }

        try {
            console.log("Start button clicked");
            setStatus("Starting speech recognition...");
            recognitionRef.current.start();
        } catch (error) {
            console.error("Failed to start speech recognition:", error);
            setStatus("");
            addMessage("Failed to start speech recognition. Please make sure you've granted microphone permissions.", false, true);
        }
    };

    // Handle stop button click
    const handleStopClick = () => {
        if (!recognitionRef.current) {
            return;
        }

        console.log("Stop button clicked");
        setStatus("Stopping speech recognition...");
        try {
            recognitionRef.current.stop();
        } catch (error) {
            console.error("Error stopping recognition:", error);
        }
    };

    // Handle text mode toggle
    const handleTextModeToggle = () => {
        setIsTextMode(!isTextMode);
    };

    // Handle text submission
    const handleSendText = () => {
        if (userInput.trim()) {
            addMessage(userInput, true);
            getGPTResponse(userInput);
            setUserInput("");
        }
    };

    // Handle enter key in text input
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSendText();
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white text-center p-5">
            <h1 className="text-2xl font-bold mb-6">Wire Mother AI</h1>

            <div
                ref={chatContainerRef}
                className={`w-full max-w-2xl mx-auto h-[300px] overflow-y-auto border border-gray-700 p-4 mb-5 rounded-md ${isLoading ? 'opacity-50' : ''}`}
            >
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`inline-block clear-both max-w-[80%] p-3 my-1 rounded-lg ${
                            msg.isError
                                ? 'bg-red-600 float-none mx-auto'
                                : msg.isUser
                                    ? 'bg-blue-600 float-right'
                                    : 'bg-purple-800 float-left'
                        }`}
                    >
                        {msg.text}
                    </div>
                ))}
            </div>

            <div className="italic text-gray-400 min-h-[1.5rem] mb-4">{status}</div>

            <div className="mb-5">
                <button
                    onClick={handleStartClick}
                    disabled={isListening}
                    className={`bg-purple-800 text-white px-4 py-2 rounded-md mx-2 ${isListening ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'}`}
                >
                    Start Talking
                </button>
                <button
                    onClick={handleStopClick}
                    disabled={!isListening}
                    className={`bg-purple-800 text-white px-4 py-2 rounded-md mx-2 ${!isListening ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'}`}
                >
                    Stop Talking
                </button>
            </div>

            <div className="mt-5">
                <button
                    onClick={handleTextModeToggle}
                    className="bg-purple-800 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                >
                    {isTextMode ? 'Hide Text Mode' : 'Text Mode'}
                </button>

                {isTextMode && (
                    <div className="mt-3 flex justify-center">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message here..."
                            className="w-[70%] p-2 rounded-l-md text-black"
                        />
                        <button
                            onClick={handleSendText}
                            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-r-md"
                        >
                            Send
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}