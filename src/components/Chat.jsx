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
            let botMessage = { role: 'bot', content: '' };

            // Add an empty bot message first so we can update it as chunks arrive
            setMessages((msgs) => [...msgs, botMessage]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                // Split on }{ in case multiple JSON objects arrive stuck together
                const jsonStrings = chunk
                    .split("}{")
                    .map((part, i, arr) => {
                        if (arr.length > 1) {
                            if (i === 0) return part + "}";
                            else if (i === arr.length - 1) return "{" + part;
                            else return "{" + part + "}";
                        }
                        return part;
                    });

                for (const jsonString of jsonStrings) {
                    try {
                        const parsed = JSON.parse(jsonString);
                        if (parsed.response) {
                            botMessage.content += parsed.response;
                            // Update UI with new partial message
                            setMessages((msgs) => {
                                const updated = [...msgs];
                                updated[updated.length - 1] = { ...botMessage };
                                return updated;
                            });
                        }
                    } catch (err) {
                        console.error("JSON parse error", err, jsonString);
                    }
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
