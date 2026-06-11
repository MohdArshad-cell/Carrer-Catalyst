import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; // <-- CSS File Import

const LoginPage = () => {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('Account created! Please check your email for verification.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // Direct AI Tools dashboard par bhejo
                navigate('/ai-tools'); 
            }
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Direct AI Tools dashboard par bhejo
                redirectTo: `${window.location.origin}/ai-tools`
            }
        });
        
        if (error) {
            console.error("Login error:", error.message);
            setMessage(error.message);
        }
    };

    // Error ya Success message ke liye dynamic class
    const messageClass = message.includes('error') || message.includes('Invalid') 
        ? 'msg-error' 
        : 'msg-success';

    return (
        <div className="login-container">
            <div className="login-glow-blob"></div>
            
            <div className="login-card">
                <h1 className="login-title">
                    {isSignUp ? 'Create an Account' : 'Welcome Back'}
                </h1>
                <p className="login-subtitle">
                    {isSignUp ? 'Sign up to start building your resume' : 'Log in to access your AI tools'}
                </p>

                {message && (
                    <div className={`login-message ${messageClass}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleEmailAuth} className="login-form">
                    <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="login-input"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login-input"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    
                    <button type="submit" disabled={loading} className="primary-button">
                        {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>
                </form>

                <div className="divider-container">
                    <div className="divider-line"></div>
                    <span className="divider-text">OR</span>
                    <div className="divider-line"></div>
                </div>

                <button onClick={handleGoogleLogin} className="google-button">
                    <img 
                        src="https://www.svgrepo.com/show/475656/google-color.svg" 
                        alt="Google logo" 
                        style={{ width: '20px', height: '20px' }} 
                    />
                    Continue with Google
                </button>

                <p className="login-footer-text">
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <span 
                        className="toggle-link"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setMessage('');
                        }}
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;