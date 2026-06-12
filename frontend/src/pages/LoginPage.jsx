import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import './LoginPage.css'; 

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
                redirectTo: `${window.location.origin}/ai-tools`
            }
        });
        
        if (error) {
            console.error("Login error:", error.message);
            setMessage(error.message);
        }
    };

    const messageClass = message.includes('error') || message.includes('Invalid') 
        ? 'msg-error' 
        : 'msg-success';

    return (
        <div className="page-container">
            {/* Background integration to match the rest of the site */}
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="login-studio-container">
                <div className="login-glass-card">
                    
                    <div className="text-center" style={{ marginBottom: '2.5rem' }}>
                        <div className="hero-badge" style={{ borderColor: '#3b82f6', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', margin: '0 auto 1rem auto' }}>
                            <span className="sparkle">🔐</span> Secure Access
                        </div>
                        <h1 className="animated-gradient-text" style={{ fontSize: '2.2rem', margin: '0 0 0.5rem 0' }}>
                            {isSignUp ? 'Create an Account' : 'Welcome Back'}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
                            {isSignUp ? 'Sign up to start building your resume' : 'Log in to access your AI tools'}
                        </p>
                    </div>

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
                                className="login-premium-input"
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
                                className="login-premium-input"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        
                        <button type="submit" disabled={loading} className="btn-premium login-submit-btn">
                            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                        </button>
                    </form>

                    <div className="divider-container">
                        <div className="divider-line"></div>
                        <span className="divider-text">OR</span>
                        <div className="divider-line"></div>
                    </div>

                    <button onClick={handleGoogleLogin} className="google-premium-button">
                        <img 
                            src="https://www.svgrepo.com/show/475656/google-color.svg" 
                            alt="Google logo" 
                            style={{ width: '20px', height: '20px' }} 
                        />
                        Continue with Google
                    </button>

                    <p className="login-footer-text text-center">
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

            <Footer />
        </div>
    );
};

export default LoginPage;