import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWandMagicSparkles, FaFileLines, FaEnvelopeOpenText, FaFileSignature, FaMicrophone } from "react-icons/fa6";
import ParticleBackground from '../components/ParticleBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './AiToolsPage.css';
import '../App.css';

const AiToolsPage = () => {
    const navigate = useNavigate();

    // Mouse flashlight effect for the premium cards
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
            {/* Background Effects */}
            <ParticleBackground />
            <div className="background-aurora"></div>

            <Navbar />

            <div className="container content-wrapper" style={{ paddingTop: '120px', paddingBottom: '5rem' }}>
                
                {/* Premium Header Section */}
                <div className="page-header text-center">
                    <div className="hero-badge">
                        <span className="sparkle">🛠️</span> Choose Your Weapon
                    </div>
                    <h1 className="hero-title animated-gradient-text">AI Toolkit Dashboard</h1>
                    <p className="hero-subtitle" style={{ maxWidth: '700px', margin: '0 auto 3rem auto' }}>
                        Select a tool to optimize your job application, beat the ATS, and get ahead of the competition.
                    </p>
                </div>

                {/* PREMIUM BENTO GRID FOR TOOLS */}
                <div className="tools-bento-grid">
                    
                    {/* Tool 1: Resume From Scratch */}
                    <div className="bento-item tool-card glass-card hover-glow" onMouseMove={handleMouseMove} onClick={() => navigate('/ResumeFromScratchPage')}>
                        <div className="bento-glow"></div>
                        <div className="bento-content">
                            <div className="tool-icon-wrapper">
                                <FaFileSignature className="premium-icon" />
                            </div>
                            <h3>Create From Scratch</h3>
                            <p>A step-by-step builder to craft a new, professional resume from the ground up.</p>
                            <div className="tool-cta">Start Building <span className="arrow">→</span></div>
                        </div>
                    </div>

                    {/* Tool 2: AI Resume Tailor */}
                    <div className="bento-item tool-card glass-card hover-glow" onMouseMove={handleMouseMove} onClick={() => navigate('/ai-tailor')}>
                        <div className="bento-glow"></div>
                        <div className="bento-content">
                            <div className="tool-icon-wrapper">
                                <FaWandMagicSparkles className="premium-icon" />
                            </div>
                            <h3>AI Resume Tailor</h3>
                            <p>Paste your resume and a job description to get an AI-optimized version in seconds.</p>
                            <div className="tool-cta">Start Tailoring <span className="arrow">→</span></div>
                        </div>
                    </div>

                    {/* Tool 3: ATS Score & Checker */}
                    <div className="bento-item tool-card glass-card hover-glow" onMouseMove={handleMouseMove} onClick={() => navigate('/ats-evaluator')}>
                        <div className="bento-glow"></div>
                        <div className="bento-content">
                            <div className="tool-icon-wrapper">
                                <FaFileLines className="premium-icon" />
                            </div>
                            <h3>ATS Score & Checker</h3>
                            <p>Analyze your resume's compatibility with automated screening software (ATS).</p>
                            <div className="tool-cta">Analyze Now <span className="arrow">→</span></div>
                        </div>
                    </div>

                    {/* Tool 4: AI Cover Letter Writer */}
                    <div className="bento-item tool-card glass-card hover-glow" onMouseMove={handleMouseMove} onClick={() => navigate('/cover-letter')}>
                        <div className="bento-glow"></div>
                        <div className="bento-content">
                            <div className="tool-icon-wrapper">
                                <FaEnvelopeOpenText className="premium-icon" />
                            </div>
                            <h3>AI Cover Letter Writer</h3>
                            <p>Generate a compelling cover letter tailored to your resume and a specific job.</p>
                            <div className="tool-cta">Write Letter <span className="arrow">→</span></div>
                        </div>
                    </div>

                    {/* Tool 5: AI Mock Interview Simulator */}
                    <div className="bento-item tool-card glass-card hover-glow" onMouseMove={handleMouseMove} onClick={() => navigate('/mock-interview')}>
                        <div className="bento-glow"></div>
                        <div className="bento-content">
                            <div className="tool-icon-wrapper">
                                <FaMicrophone className="premium-icon" />
                            </div>
                            <h3>AI Mock Interview</h3>
                            <p>Practice with AI-generated questions tailored to your target job to ace your interviews.</p>
                            <div className="tool-cta">Start Practice <span className="arrow">→</span></div>
                        </div>
                    </div>
                </div>

                {/* PREMIUM "HOW IT WORKS" SECTION */}
                <div className="how-it-works-section glass-card" style={{ marginTop: '5rem', padding: '3rem' }}>
                    <h2 className="section-title" style={{ marginBottom: '3rem' }}>A Simple Process</h2>
                    
                    <div className="timeline-premium">
                        <div className="timeline-item-premium">
                            <div className="timeline-glow-dot">1</div>
                            <div className="timeline-content-premium">
                                <h3>Select a Tool</h3>
                                <p>Choose from our suite of AI-powered tools.</p>
                            </div>
                        </div>
                        
                        <div className="timeline-connector"></div>
                        
                        <div className="timeline-item-premium">
                            <div className="timeline-glow-dot">2</div>
                            <div className="timeline-content-premium">
                                <h3>Provide Input</h3>
                                <p>Upload your resume, paste a job description, or fill in our guided forms.</p>
                            </div>
                        </div>
                        
                        <div className="timeline-connector"></div>
                        
                        <div className="timeline-item-premium">
                            <div className="timeline-glow-dot">3</div>
                            <div className="timeline-content-premium">
                                <h3>Get Results</h3>
                                <p>Receive your optimized resume, ATS score, or generated cover letter in seconds.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back Button */}
                <div style={{ textAlign: 'center', margin: '4rem 0' }}>
                    <button className="btn-outline pulse-glow" onClick={() => navigate('/')} style={{ padding: '0.8rem 2rem', borderRadius: '50px' }}>
                        ← Back to Home
                    </button>
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default AiToolsPage;