import React, { useState } from 'react';
const API_BASE = import.meta.env.VITE_API_BASE_URL;


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

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Try to extract JSON objects from the buffer
                let boundary;
                while ((boundary = buffer.indexOf('}{')) !== -1) {
                    // Take the first object
                    const jsonStr = buffer.slice(0, boundary + 1);
                    buffer = buffer.slice(boundary + 1); // keep rest in buffer

                    try {
                        const parsed = JSON.parse(jsonStr);
                        if (parsed.response) {
                            botMessage.content += parsed.response;
                            setMessages((msgs) => {
                                const updated = [...msgs];
                                updated[updated.length - 1] = { ...botMessage };
                                return updated;
                            });
                        }
                    } catch (err) {
                        console.error('Parse error (split object)', err, jsonStr);
                    }
                }
            }

            // Try to parse whatever is left in buffer at the end
            buffer = buffer.trim();
            if (buffer) {
                try {
                    const parsed = JSON.parse(buffer);
                    if (parsed.response) {
                        botMessage.content += parsed.response;
                        setMessages((msgs) => {
                            const updated = [...msgs];
                            updated[updated.length - 1] = { ...botMessage };
                            return updated;
                        });
                    }
                } catch (err) {
                    console.error('Parse error (final buffer)', err, buffer);
                }
            }

        } catch (err) {
            console.error(err);
            setMessages((msgs) => [...msgs, { role: 'bot', content: 'Error: Could not get response.' }]);
        }
    };



    return (
        <div>
            <div className="mb-4 space-y-2">
                {messages.map((msg, i) => (
                    <div key={i} className={`p-2 rounded ${msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <input
                    className="flex-1 border p-2 rounded"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                />
                <button className="bg-blue-600 text-white px-4 rounded" onClick={sendMessage}>
                    Send
                </button>
            </div>
        </div>
    );
}
