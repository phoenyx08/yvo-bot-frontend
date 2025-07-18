import React, { useState } from 'react';
const API_BASE = import.meta.env.VITE_API_BASE_URL;


export default function Chat({ token, onUnauthorized }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMessage = { role: 'user', content: input };
        setMessages([...messages, newMessage]);
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
                onUnauthorized(); // trigger login
                return;
            }

            if (!res.ok) throw new Error('Failed to fetch');

            const data = await res.json();
            setMessages((msgs) => [...msgs, newMessage, { role: 'bot', content: data.response }]);
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
