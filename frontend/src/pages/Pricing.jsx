import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import './Pricing.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

const Pricing = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loadingPlan, setLoadingPlan] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
    }, []);

    const handleCheckout = async (priceId) => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (!priceId) {
            setError("Pricing configuration error. Stripe Price ID is missing.");
            return;
        }

        setLoadingPlan(priceId);
        setError('');

        try {
            const response = await axios.post(`${API_BASE_URL}/api/create-checkout-session`, {
                user_id: user.id, 
                price_id: priceId
            });
            
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

    // Logical Pricing Structure 
    const pricingPlans = [
        {
            id: 'starter',
            name: 'Desperate Retry',
            price: '99',
            tokens: 10,
            desc: 'Skip one coffee. Land an interview instead.',
            stripeId: process.env.REACT_APP_STRIPE_PRICE_99,
            features: [
                '✔️ 10 Premium AI Tokens',
                '✔️ Resume Tailor (Beat the ATS)',
                '❌ Advanced Cover Letters',
                '❌ Priority Support'
            ],
            isPopular: false,
            buttonText: 'Buy 10 Tokens',
            theme: '#10b981' // Green
        },
        {
            id: 'pro',
            name: 'Serious Hunter',
            price: '199',
            tokens: 30,
            desc: '3x the power for just ₹100 more. Best value.',
            stripeId: process.env.REACT_APP_STRIPE_PRICE_199,
            features: [
                '✨ 30 Premium AI Tokens',
                '🚀 Resume Tailor (Beat the ATS)',
                '🔥 Brutal ATS Evaluator',
                '✉️ Cover Letter Generator'
            ],
            isPopular: true, // The Decoy Effect target
            buttonText: 'Buy 30 Tokens',
            theme: 'linear-gradient(135deg, #00e5ff, #8b5cf6)' // Cyan/Purple
        },
        {
            id: 'elite',
            name: 'Career Dominator',
            price: '499',
            tokens: 100,
            desc: 'For mass-appliers. Never run out of tokens.',
            stripeId: process.env.REACT_APP_STRIPE_PRICE_499,
            features: [
                '💎 100 Premium AI Tokens',
                '🚀 Unrestricted Tool Access',
                '🎤 AI Mock Interview Data',
                '⚡ Priority Generation Speed'
            ],
            isPopular: false,
            buttonText: 'Buy 100 Tokens',
            theme: '#f59e0b' // Gold
        }
    ];

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="pricing-container">
                <div className="pricing-header text-center">
                    <div className="hero-badge" style={{ borderColor: '#10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                        <span className="sparkle">💎</span> Invest In Your Career
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                        Simple, Transparent Pricing
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                        Get the exact tools you need to land your dream job faster. New users get <b>3 free tokens</b> on signup to test the engine.
                    </p>
                </div>

                {error && <div className="pricing-error" style={{ color: '#ef4444', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}

                <div className="pricing-grid">
                    {pricingPlans.map((plan) => (
                        <div 
                            key={plan.id} 
                            className={`pricing-card glass-card ${plan.isPopular ? 'pro-tier' : ''}`}
                            style={plan.isPopular ? { transform: 'scale(1.05)', border: '1px solid #00e5ff' } : {}}
                        >
                            {plan.isPopular && <div className="pro-badge">Most Popular</div>}
                            <div className="tier-name" style={{ color: plan.isPopular ? '#00e5ff' : 'var(--text-primary)' }}>
                                {plan.name}
                            </div>
                            
                            <div className="tier-price">
                                <span className="currency">₹</span>{plan.price}
                            </div>
                            <p className="tier-desc">{plan.desc}</p>
                            
                            <div className="tier-features">
                                {plan.features.map((feature, index) => (
                                    <div key={index} className="feature-item" dangerouslySetInnerHTML={{ __html: feature }}></div>
                                ))}
                            </div>

                            <button 
                                className={`pricing-btn ${plan.isPopular ? 'btn-premium pulse-glow' : 'btn-outline'}`}
                                disabled={loadingPlan !== null}
                                onClick={() => handleCheckout(plan.stripeId)}
                                style={plan.isPopular ? { background: plan.theme } : { borderColor: plan.theme, color: plan.theme }}
                            >
                                {loadingPlan === plan.stripeId ? 'Processing...' : plan.buttonText}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="pricing-faq text-center" style={{ marginTop: '3rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Payments are securely processed by <strong>Stripe (UPI, Cards & Netbanking Supported)</strong>. <br/>
                        1 Token = 1 AI Request (Tailor, Evaluate, or Cover Letter).
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Pricing;