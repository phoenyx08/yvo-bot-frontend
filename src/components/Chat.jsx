import React, { useState } from 'react';
const API_BASE = import.meta.env.VITE_API_BASE_URL;
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function renderMarkdown(markdown) {
    const rawHtml = marked(markdown);
    return DOMPurify.sanitize(rawHtml);
}

export default function Chat({ token, onUnauthorized }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMessage = { role: 'user', content: input };
        setMessages((msgs) => [...msgs, newMessage]);
        setInput('');

        try {
            const res = await fetch(`${API_BASE}/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ query: input }),
            });

            if (res.status === 401) {
                onUnauthorized();
                return;
            }
            if (!res.ok) throw new Error('Failed to fetch');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let botMessage = { role: 'bot', content: '' };

            // Add bot message placeholder
            setMessages((msgs) => [...msgs, botMessage]);

            const findJsonObjectEnd = (str) => {
                let depth = 0;
                let inString = false;
                for (let i = 0; i < str.length; i++) {
                    const char = str[i];
                    if (char === '"' && str[i - 1] !== '\\') {
                        inString = !inString;
                    }
                    if (!inString) {
                        if (char === '{') depth++;
                        else if (char === '}') {
                            depth--;
                            if (depth === 0) return i + 1;
                        }
                    }
                }
                return -1;
            };

            const tryParseObjects = () => {
                buffer = buffer.trim();
                while (buffer.length > 0) {
                    const endIdx = findJsonObjectEnd(buffer);
                    if (endIdx === -1) break; // Wait for more data

                    const jsonStr = buffer.slice(0, endIdx);
                    buffer = buffer.slice(endIdx).trim();

                    try {
                        const parsed = JSON.parse(jsonStr);
                        if (parsed?.response) {
                            botMessage.content += parsed.response;
                            setMessages((msgs) => {
                                const updated = [...msgs];
                                updated[updated.length - 1] = { ...botMessage };
                                return updated;
                            });
                        }
                    } catch (err) {
                        console.error('Parse error', err, jsonStr);
                        break;
                    }
                }
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                tryParseObjects();
            }

            tryParseObjects(); // Flush final

        } catch (err) {
            console.error(err);
            setMessages((msgs) => [
                ...msgs,
                { role: 'bot', content: 'Error: Could not get response.' }
            ]);
        }
    };

    return (
        <div>
            <div className="mb-4 space-y-2 w-full">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`p-2 rounded-2xl text-gray-300 ${
                            msg.role === 'user' ? 'bg-green-950' : 'bg-gray-900'
                        }`}
                    >
                        <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {' '}
                        <span
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                        />
                    </div>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 w-full flex justify-center p-2 bg-gray-800">
                <input
                    className="w-full md:max-w-xl flex flex-col gap-2 p-2 border rounded-lg bg-gray-800 text-gray-100"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                />
                <button
                    className="bg-green-900 text-gray-200 px-4 rounded"
                    onClick={sendMessage}
                >
                    Send
                </button>
            </div>
        </div>
    );
}
