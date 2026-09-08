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
    },
    {
        question: "How do tokens work?",
        answer: "Tokens are our platform currency. You get free tokens on signup, and can purchase more as needed. Each AI generation (tailoring, evaluating) costs 1 token."
    },
    {
        question: "Can I get a refund?",
        answer: "We offer a 7-day money-back guarantee on all unused token packages. If you're not satisfied, just email support."
    },
    {
        question: "Is my data stored or shared?",
        answer: "Your resume data is strictly confidential. We do not sell or share your personal information with recruiters or third parties."
    },
    {
        question: "What file formats do you support?",
        answer: "Currently, we support PDF and raw text uploads. Our AI outputs can be downloaded as optimized PDFs or copied to your clipboard."
    }
];

const testimonials = [
    { name: "Priya S.", role: "Software Engineer", text: "A game-changer. I went from zero replies to three interviews in a week! The ATS score helped me see exactly what was missing.", initial: "P" },
    { name: "Michael T.", role: "Marketing Manager", text: "The Bullet Rewriter turned my boring daily tasks into actual measurable achievements. Highly recommend!", initial: "M" },
    { name: "Sarah L.", role: "Recent Graduate", text: "I didn't know how to write a cover letter. The AI generated one that matched my resume perfectly. Got the job!", initial: "S" },
    { name: "David K.", role: "Product Manager", text: "The Career Roadmap AI gave me a clear 3-month plan to transition into Product. Better than any career coach I've paid.", initial: "D" }
];

const HomePage = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);
    const [user, setUser] = useState(null); // <-- User state add ki hai
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

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

                    {/* Social Proof Counter */}
                    <div className="social-proof-bar" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '3rem', flexWrap: 'wrap' }}>
                        <div className="proof-item glass-card" style={{ padding: '1rem 2rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>12,000+</div>
                            <div style={{ color: 'var(--text-secondary)' }}>Resumes Tailored</div>
                        </div>
                        <div className="proof-item glass-card" style={{ padding: '1rem 2rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>4,500+</div>
                            <div style={{ color: 'var(--text-secondary)' }}>Active Users</div>
                        </div>
                        <div className="proof-item glass-card" style={{ padding: '1rem 2rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#eab308' }}>98%</div>
                            <div style={{ color: 'var(--text-secondary)' }}>ATS Pass Rate</div>
                        </div>
                    </div>
                </header>
            </div>

            {/* Before / After Section */}
            <section className="container" style={{ margin: '5rem auto', padding: '0 20px' }}>
                <div className="section-header text-center" style={{ marginBottom: '3rem' }}>
                    <h2 className="section-title">Why you're getting ghosted</h2>
                    <p className="section-subtitle">See how our AI transforms a generic resume into an interview magnet.</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="before-after-grid">
                    <div className="panel glass-card" style={{ borderTop: '4px solid #ef4444' }}>
                        <h3 style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>Before (Generic & Weak) ❌</h3>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', color: '#d1d5db', lineHeight: '1.6' }}>
                            • Managed social media accounts for the company.<br/>
                            • Worked on a team to build a new feature.<br/>
                            • Handled customer complaints and issues.<br/>
                            • Used React and Node.js for frontend and backend.
                        </div>
                        <p style={{ color: '#ef4444', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>ATS Score: 32% (Rejected)</p>
                    </div>

                    <div className="panel glass-card" style={{ borderTop: '4px solid #10b981' }}>
                        <h3 style={{ color: '#10b981', marginBottom: '1rem', textAlign: 'center' }}>After (AI Tailored) ✅</h3>
                        <div style={{ background: 'rgba(16,185,129,0.1)', padding: '1.5rem', borderRadius: '8px', color: 'white', lineHeight: '1.6' }}>
                            • Spearheaded a <span style={{ color: '#10b981', fontWeight: 'bold' }}>social media strategy</span> that increased engagement by 140% across 3 platforms.<br/>
                            • Architected a highly scalable microservice using <span style={{ color: '#10b981', fontWeight: 'bold' }}>React</span> and <span style={{ color: '#10b981', fontWeight: 'bold' }}>Node.js</span>, reducing load times by 2.1s.<br/>
                            • Resolved 50+ tier-3 <span style={{ color: '#10b981', fontWeight: 'bold' }}>customer issues</span> weekly with a 98% CSAT score.
                        </div>
                        <p style={{ color: '#10b981', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>ATS Score: 95% (Interview Selected!)</p>
                    </div>
                </div>
            </section>

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
                        <div className="bento-content relative-quote" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div className="quote-mark">"</div>
                            <p className="testimonial-text" style={{ transition: 'opacity 0.5s', minHeight: '80px' }}>
                                {testimonials[currentTestimonial].text}
                            </p>
                            <div className="testimonial-author" style={{ marginTop: 'auto' }}>
                                <div className="author-avatar">{testimonials[currentTestimonial].initial}</div>
                                <div className="author-info">
                                    <strong>{testimonials[currentTestimonial].name}</strong>
                                    <span>{testimonials[currentTestimonial].role}</span>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '1rem' }}>
                                {testimonials.map((_, idx) => (
                                    <div key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx === currentTestimonial ? '#3b82f6' : 'rgba(255,255,255,0.2)' }} />
                                ))}
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