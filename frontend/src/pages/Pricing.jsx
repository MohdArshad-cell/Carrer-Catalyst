import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import './Pricing.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';
const STRIPE_PRICE_ID = process.env.REACT_APP_STRIPE_PRICE_ID;
const Pricing = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loadingPlan, setLoadingPlan] = useState(null);
    const [error, setError] = useState('');

    // Check if user is logged in
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
    }, []);

    const handleCheckout = async (priceId) => {
        if (!user) {
            // Agar user logged in nahi hai, usko login pe bhejo
            navigate('/login');
            return;
        }
        console.log("SENDING TO BACKEND:", { user_id: user.id, price_id: priceId });
        setLoadingPlan(priceId);
        setError('');

        try {
            const response = await axios.post(`${API_BASE_URL}/api/create-checkout-session`, {
                user_id: user.id, // Supabase user ID bhej rahe hain
                price_id: priceId
            });
            
            // Redirect to Stripe Checkout page
            if (response.data && response.data.url) {
                window.location.href = response.data.url;
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            console.error("Checkout Error:", err);
            setError("Failed to initiate payment. Please try again.");
            setLoadingPlan(null);
        }
    };

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="pricing-container">
                <div className="pricing-header text-center">
                    <div className="hero-badge" style={{ borderColor: '#10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                        <span className="sparkle">💎</span> Upgrade Your Engine
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                        Simple, Transparent Pricing
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                        Get the exact tools you need to land your dream job faster. No hidden fees. Pay only for the AI power you use.
                    </p>
                </div>

                {error && <div className="pricing-error">{error}</div>}

                <div className="pricing-grid">
                    
                    {/* TIER 1: FREE FOREVER */}
                    <div className="pricing-card glass-card">
                        <div className="tier-name">Starter</div>
                        <div className="tier-price">
                            <span className="currency">$</span>0
                        </div>
                        <p className="tier-desc">Perfect to test out the platform and build a basic resume.</p>
                        
                        <div className="tier-features">
                            <div className="feature-item">✔️ 3 Free AI Tokens on Sign up</div>
                            <div className="feature-item">✔️ Basic Resume Builder</div>
                            <div className="feature-item">✔️ PDF & JSON Export</div>
                            <div className="feature-item" style={{ color: 'var(--text-secondary)' }}>❌ Advanced AI Tailoring</div>
                            <div className="feature-item" style={{ color: 'var(--text-secondary)' }}>❌ ATS Evaluation</div>
                        </div>

                        <button 
                            className="btn-outline pricing-btn" 
                            onClick={() => user ? navigate('/ai-tools') : navigate('/login')}
                        >
                            {user ? 'Go to Dashboard' : 'Sign Up Free'}
                        </button>
                    </div>

                    {/* TIER 2: PREMIUM (PRO) */}
                    <div className="pricing-card glass-card pro-tier">
                        <div className="pro-badge">Most Popular</div>
                        <div className="tier-name" style={{ color: '#00e5ff' }}>Premium Powerpack</div>
                        <div className="tier-price">
                            <span className="currency">$</span>5<span className="billing-cycle">/one-time</span>
                        </div>
                        <p className="tier-desc">Unlock full AI capabilities to tailor your resume for every application.</p>
                        
                        <div className="tier-features">
                            <div className="feature-item">✨ <b>10 Premium AI Tokens</b></div>
                            <div className="feature-item">🚀 <b>Resume Tailor (Beat the ATS)</b></div>
                            <div className="feature-item">🔥 Brutal ATS Evaluator</div>
                            <div className="feature-item">✉️ Cover Letter Generator</div>
                            <div className="feature-item">🎤 AI Mock Interview Data</div>
                        </div>

                        <button 
                            className="btn-premium pulse-glow pricing-btn"
                            disabled={loadingPlan !== null}
                            // 👇 YAHAN APNA STRIPE PRICE ID PASTE KARNA HAI 👇
                            onClick={() => handleCheckout(STRIPE_PRICE_ID)}
                            style={{ background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)' }}
                        >
                            {loadingPlan === 'YOUR_STRIPE_PRICE_ID_HERE' ? 'Redirecting to Stripe...' : 'Buy 10 Tokens Now'}
                        </button>
                    </div>

                </div>

                {/* FAQ / Trust section below */}
                <div className="pricing-faq text-center">
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Payments are securely processed by <strong>Stripe</strong>. <br/>
                        1 Token = 1 AI Request (Tailor, Evaluate, Cover Letter, etc.)
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Pricing;