import React, { useState } from 'react';
import Chat from './components/Chat';
import LoginForm from './components/LoginForm';
import image from './assets/image.png';

export default function App() {
    const [token, setToken] = useState(localStorage.getItem('jwt') || '');
    const [showLogin, setShowLogin] = useState(false);

    const handleLoginSuccess = (newToken) => {
        localStorage.setItem('jwt', newToken);
        setToken(newToken);
        setShowLogin(false);
    };

    return (
        <div>
            <div className="p-3 fixed w-full bg-black font-sans flex items-center gap-4">
                <img src={image} alt="Logo" className="w-12 h-auto" />
                <h1 className="text-gray-300 text-2xl">YVO Bot</h1>
            </div>

            <div className="p-20 max-w-4xl mx-auto font-sans">
                {showLogin ? (
                    <LoginForm onSuccess={handleLoginSuccess} />
                ) : (
                    <Chat token={token} onUnauthorized={() => setShowLogin(true)} />
                )}
            </div>
        </div>
    );
}
