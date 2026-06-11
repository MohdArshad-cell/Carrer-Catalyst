import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from '../components/ParticleBackground';
import Scene from '../components/Scene';
import './HomePage.css';
import '../App.css';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../supabaseClient'; // <-- Yeh import add kiya hai

const faqData = [
    {
        question: "Is my resume data private and secure?",
        answer: "Yes. We prioritize your privacy above all else. Your data is processed securely and is never shared with third parties."
    },
    {
        question: "Do I need to be a design expert to use this?",
        answer: "Not at all! Our tools and templates guide you step-by-step, making professional design accessible to everyone."
    },
    {
        question: "How is this better than a generic template?",
        answer: "Generic templates are static. Career Catalyst is dynamic. Our AI tools actively help you write more effective content tailored to the specific job you want."
    }
];

const HomePage = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);
    const [user, setUser] = useState(null); // <-- User state add ki hai

    // Page load hote hi check karega ki user login hai ya nahi
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Ab yeh button SMART ho gaya hai
    const launchTools = () => {
        if (user) {
            navigate('/ai-tools'); // Agar login hai toh seedha Dashboard
        } else {
            navigate('/login'); // Agar login nahi hai toh Login Page
        }
    };

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const handleMouseMove = (e) => {
        const { currentTarget: target } = e;
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        target.style.setProperty("--mouse-x", `${x}px`);
        target.style.setProperty("--mouse-y", `${y}px`);
    };

    return (
        <div className="page-container">
            {/* Background Animations */}
            <ParticleBackground />
            <Scene />
            <div className="background-aurora"></div>
            
            <Navbar />

            <div className="content-wrapper">
                {/* Premium Hero Section */}
                <header id="hero" className="container full-height-hero">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span className="sparkle">✨</span> Welcome to the Future of Hiring
                        </div>
                        <h1 className="hero-title animated-gradient-text">
                            Build a Job-Winning Resume in Minutes
                        </h1>
                        <p className="hero-subtitle">
                            Our AI-powered tools help you create, tailor, and evaluate your resume to land your dream job.
                        </p>
                        
                        {/* Button ka text bhi ab smart ho gaya hai */}
                        <button onClick={launchTools} className="btn-premium pulse-glow">
                            {user ? 'Go to Dashboard →' : 'Launch the AI Tools'}
                        </button>
                        
                    </div>
                </header>
            </div>

            {/* FULL PAGE PREMIUM BENTO GRID */}
            <section id="full-bento-grid" className="container bento-section">
                <div className="section-header">
                    <h2 className="section-title">A New Standard for Job Applications</h2>
                    <p className="section-subtitle">Everything you need to secure your next role, supercharged by AI.</p>
                </div>
                
                <div className="full-bento-container">
                    
                    {/* ITEM 1: Core AI Features */}
                    <div className="bento-item bento-main-feature glass-card hover-glow" onMouseMove={handleMouseMove}>
                        <div className="bento-glow"></div>
                        <div className="bento-content">
                            <div className="bento-header">
                                <span className="bento-icon">🚀</span>
                                <h3>Your All-in-One Career Toolkit</h3>
                            </div>
                            <p className="bento-desc">Everything you need to go from application to interview, powered by AI.</p>
                            
                            <div className="toolkit-grid">
                                <div className="toolkit-item">
                                    <h4><span className="emoji-icon">📄</span> Resume From Scratch</h4>
                                    <p>Build a professional resume from the ground up with our guided, step-by-step editor.</p>
                                </div>
                                <div className="toolkit-item">
                                    <h4><span className="emoji-icon">✨</span> AI Resume Tailor</h4>
                                    <p>Automatically optimize your existing resume to perfectly match the keywords in any job description.</p>
                                </div>
                                <div className="toolkit-item">
                                    <h4><span className="emoji-icon">📊</span> ATS Evaluator</h4>
                                    <p>Get a real-time score on your resume's compatibility with Applicant Tracking Systems.</p>
                                </div>
                                <div className="toolkit-item">
                                    <h4><span className="emoji-icon">🎤</span> Mock Interview</h4>
                                    <p>Practice with AI-generated questions tailored to your target job to ace your interviews.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ITEM 2: Cover Letter */}
                    <div className="bento-item bento-side-feature-1 glass-card hover-glow" onMouseMove={handleMouseMove}>
                        <div className="bento-glow"></div>
                        <div className="bento-content text-center">
                            <div className="big-icon">✉️</div>
                            <h3>Cover Letter Generator</h3>
                            <p>Create compelling cover letters that highlight your unique strengths in seconds.</p>
                        </div>
                    </div>

                    {/* ITEM 3: Who Is This For? */}
                    <div className="bento-item bento-persona glass-card hover-glow" onMouseMove={handleMouseMove}>
                        <div className="bento-glow"></div>
                        <div className="bento-content">
                            <h3>Designed For:</h3>
                            <ul className="persona-list">
                                <li>
                                    <span className="persona-icon">🎓</span> 
                                    <div className="persona-text"><strong>Students & Grads</strong><p>Land your first internship or job.</p></div>
                                </li>
                                <li>
                                    <span className="persona-icon">🚀</span> 
                                    <div className="persona-text"><strong>Career Changers</strong><p>Reframe your existing experience.</p></div>
                                </li>
                                <li>
                                    <span className="persona-icon">🏆</span> 
                                    <div className="persona-text"><strong>Professionals</strong><p>Optimize your resume for senior roles.</p></div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* ITEM 4: Testimonials */}
                    <div className="bento-item bento-testimonials glass-card hover-glow" onMouseMove={handleMouseMove}>
                        <div className="bento-glow"></div>
                        <div className="bento-content relative-quote">
                            <div className="quote-mark">"</div>
                            <p className="testimonial-text">A game-changer. I went from zero replies to three interviews in a week! The ATS score helped me see exactly what was missing.</p>
                            <div className="testimonial-author">
                                <div className="author-avatar">P</div>
                                <div className="author-info">
                                    <strong>Priya S.</strong>
                                    <span>Software Engineer</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ITEM 5: FAQ */}
                    <div className="bento-item bento-faq glass-card hover-glow" onMouseMove={handleMouseMove}>
                        <div className="bento-glow"></div>
                        <div className="bento-content">
                            <h3>Frequently Asked Questions</h3>
                            <div className="faq-wrapper">
                                {faqData.map((item, index) => (
                                    <div className={`faq-item ${openFaq === index ? 'active' : ''}`} key={index}>
                                        <div className="faq-question" onClick={() => toggleFaq(index)}>
                                            {item.question}
                                            <span className="faq-toggle-icon">{openFaq === index ? '−' : '+'}</span>
                                        </div>
                                        <div className="faq-answer-container">
                                            <div className="faq-answer-inner">
                                                <p>{item.answer}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default HomePage;