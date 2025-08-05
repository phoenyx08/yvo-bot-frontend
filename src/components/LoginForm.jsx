import React, { useState } from 'react';
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function LoginForm({ onSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState('');

    const login = async () => {
        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                setErr('Login failed');
                return;
            }

            const data = await res.json();
            if (!data.accessToken) {
                setErr('No token received');
                return;
            }

            onSuccess(data.accessToken);
        } catch (err) {
            console.error(err);
            setErr('Login error');
        }
    };

    return (
        <div className="p-4 border rounded text-gray-300 bg-gray-800">
            <h2 className="text-lg mb-2">Login Required</h2>
            <input
                className="w-full mb-2 p-2 border rounded"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="password"
                className="w-full mb-2 p-2 border rounded"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button className="bg-green-900 text-gray-200 px-4 py-2 rounded w-full" onClick={login}>
                Login
            </button>
            {err && <p className="text-red-500 mt-2">{err}</p>}
        </div>
    );
}
