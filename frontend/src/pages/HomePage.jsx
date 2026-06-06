import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from '../components/ParticleBackground';
import Scene from '../components/Scene';
import './HomePage.css';
import '../App.css';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

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

    const launchTools = () => {
        navigate('/ai-tools');
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
            {/* All three background elements are here */}
            <ParticleBackground />
            <Scene />
            <div className="background-aurora"></div>
            {/* Navigation Bar */}
            <Navbar />

            <div className="content-wrapper">
                {/* Hero Section */}
                <header id="hero" className="container full-height-hero">
                    <div className="hero-content">
                        <h1 className="hero-title animated-gradient">
                            Build a Job-Winning Resume in Minutes
                        </h1>
                        <p className="hero-subtitle">
                            Our AI-powered tools help you create, tailor, and evaluate your resume to land your dream job.
                        </p>
                        <button onClick={launchTools} className="btn btn-primary pulse">
                            Launch the AI Tools
                        </button>
                    </div>
                </header>
            </div>

            {/* FULL PAGE BENTO GRID */}
            <section id="full-bento-grid" className="container">
                <h2 className="section-title">A New Standard for Job Applications</h2>
                <div className="full-bento-container">

                    {/* ITEM 1: Core AI Features */}
                    <div className="bento-item bento-main-feature" onMouseMove={handleMouseMove}>
                        <div className="bento-content">
                            <h3>🚀 Your All-in-One Career Toolkit</h3>
                            <p>Everything you need to go from application to interview, powered by AI.</p>
                            
                            <div className="toolkit-grid">
                                <div className="toolkit-item">
                                    <h4>📄 Resume From Scratch</h4>
                                    <p>Build a professional resume from the ground up with our guided, step-by-step editor.</p>
                                </div>
                                <div className="toolkit-item">
                                    <h4>✨ AI Resume Tailor</h4>
                                    <p>Automatically optimize your existing resume to perfectly match the keywords in any job description.</p>
                                </div>
                                <div className="toolkit-item">
                                    <h4>📊 ATS Evaluator</h4>
                                    <p>Get a real-time score on your resume's compatibility with Applicant Tracking Systems and get actionable feedback.</p>
                                </div>
                                {/* NEW FEATURE ADDED HERE */}
                                <div className="toolkit-item">
                                    <h4>🎤 Mock Interview</h4>
                                    <p>Practice with AI-generated questions tailored to your target job to ace your interviews.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ITEM 2: Cover Letter */}
                    <div className="bento-item bento-side-feature-1" onMouseMove={handleMouseMove}>
                        <div className="bento-content">
                            <h3>✉️ Cover Letter Generator</h3>
                            <p>Create compelling cover letters that highlight your unique strengths in seconds.</p>
                        </div>
                    </div>

                    {/* ITEM 3: Who Is This For? */}
                    <div className="bento-item bento-persona" onMouseMove={handleMouseMove}>
                        <div className="bento-content">
                            <h3>Designed For:</h3>
                            <ul>
                                <li>🎓 <p><strong>Students & Grads</strong><br/>Land your first internship or job.</p></li>
                                <li>🚀 <p><strong>Career Changers</strong><br/>Reframe your existing experience.</p></li>
                                <li>🏆 <p><strong>Professionals</strong><br/>Optimize your resume for senior roles.</p></li>
                            </ul>
                        </div>
                    </div>

                    {/* ITEM 4: Testimonials */}
                    <div className="bento-item bento-testimonials" onMouseMove={handleMouseMove}>
                        <div className="bento-content">
                            <p>"A game-changer. I went from zero replies to three interviews in a week! The ATS score helped me see what was missing."</p>
                            <span>- Priya S., Software Engineer</span>
                        </div>
                    </div>

                    {/* ITEM 5: FAQ */}
                    <div className="bento-item bento-faq" onMouseMove={handleMouseMove}>
                        <div className="bento-content">
                            <h3>Frequently Asked Questions</h3>
                            <div className="faq-bento-container">
                                {faqData.map((item, index) => (
                                    <div className="faq-bento-item" key={index}>
                                        <div className="faq-question" onClick={() => toggleFaq(index)}>
                                            {item.question}
                                            <span>{openFaq === index ? '−' : '+'}</span>
                                        </div>
                                        <div className={`faq-answer ${openFaq === index ? 'open' : ''}`}>
                                            <p>{item.answer}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default HomePage;