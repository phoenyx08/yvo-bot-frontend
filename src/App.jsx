import React, { useState } from 'react';
import Chat from './components/Chat';
import LoginForm from './components/LoginForm';
import { logo } from './assets/logo';

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
                <img src={logo} alt="Logo" className="w-12 h-auto" />
                <h1 className="text-gray-300 text-2xl">YVO Bot</h1>
            </div>

            <div className="p-2 py-20 md:p-20 md:max-w-4xl max-w-full mx-auto font-sans">
                {showLogin ? (
                    <LoginForm onSuccess={handleLoginSuccess} />
                ) : (
                    <Chat token={token} onUnauthorized={() => setShowLogin(true)} />
                )}
            </div>
        </div>
    );
}
