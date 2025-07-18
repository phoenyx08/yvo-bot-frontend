import React, { useState } from 'react';
import Chat from './components/Chat';
import LoginForm from './components/LoginForm';

export default function App() {
    const [token, setToken] = useState(localStorage.getItem('jwt') || '');
    const [showLogin, setShowLogin] = useState(false);

    const handleLoginSuccess = (newToken) => {
        localStorage.setItem('jwt', newToken);
        setToken(newToken);
        setShowLogin(false);
    };

    return (
        <div className="p-6 max-w-xl mx-auto font-sans">
            <h1 className="text-2xl mb-4">Chatbot</h1>
            {showLogin ? (
                <LoginForm onSuccess={handleLoginSuccess} />
            ) : (
                <Chat token={token} onUnauthorized={() => setShowLogin(true)} />
            )}
        </div>
    );
}
