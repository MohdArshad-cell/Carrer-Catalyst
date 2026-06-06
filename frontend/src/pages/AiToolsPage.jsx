import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWandMagicSparkles, FaFileLines, FaEnvelopeOpenText, FaFileSignature } from "react-icons/fa6";
import ParticleBackground from '../components/ParticleBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './AiToolsPage.css';
import '../App.css';
import { FaMicrophone } from "react-icons/fa6";

const AiToolsPage = () => {
    const navigate = useNavigate();

    // Function to handle the spotlight hover effect
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

            {/* Reusable Navbar */}
            <Navbar />

            <div className="container" style={{ marginTop: '120px', marginBottom: '5rem' }}>
                <h1 className="ai-tools-title animated-gradient">AI Toolkit Dashboard</h1>
                <p className="ai-tools-subtitle">Select a tool to optimize your job application and get ahead of the competition.</p>

                <div className="tools-bento-grid">
                    {/* Tool 1: Resume From Scratch */}
                    <div className="bento-item tool-card" onMouseMove={handleMouseMove} onClick={() => navigate('/ResumeFromScratchPage')}>
                        <div className="bento-content">
                            <div className="tool-icon"><FaFileSignature /></div>
                            <h3>Create From Scratch</h3>
                            <p>A step-by-step builder to craft a new, professional resume from the ground up.</p>
                            <span className="tool-cta">Start Building →</span>
                        </div>
                    </div>

                    {/* Tool 2: AI Resume Tailor */}
                    <div className="bento-item tool-card" onMouseMove={handleMouseMove} onClick={() => navigate('/ai-tailor')}>
                        <div className="bento-content">
                            <div className="tool-icon"><FaWandMagicSparkles /></div>
                            <h3>AI Resume Tailor</h3>
                            <p>Paste your resume and a job description to get an AI-optimized version in seconds.</p>
                            <span className="tool-cta">Start Tailoring →</span>
                        </div>
                    </div>

                    {/* Tool 3: ATS Score & Checker */}
                    <div className="bento-item tool-card" onMouseMove={handleMouseMove} onClick={() => navigate('/ats-evaluator')}>
                        <div className="bento-content">
                            <div className="tool-icon"><FaFileLines /></div>
                            <h3>ATS Score & Checker</h3>
                            <p>Analyze your resume's compatibility with automated screening software (ATS).</p>
                            <span className="tool-cta">Analyze Now →</span>
                        </div>
                    </div>

                    {/* Tool 4: AI Cover Letter Writer */}
                    <div className="bento-item tool-card" onMouseMove={handleMouseMove} onClick={() => navigate('/cover-letter')}>
                        <div className="bento-content">
                            <div className="tool-icon"><FaEnvelopeOpenText /></div>
                            <h3>AI Cover Letter Writer</h3>
                            <p>Generate a compelling cover letter tailored to your resume and a specific job.</p>
                            <span className="tool-cta">Write Letter →</span>
                        </div>
                    </div>

                    {/* Tool 5: AI Mock Interview Simulator */}
                    <div className="bento-item tool-card" onMouseMove={handleMouseMove} onClick={() => navigate('/mock-interview')}>
                        <div className="bento-content">
                            <div className="tool-icon"><FaMicrophone /></div>
                            <h3>AI Mock Interview</h3>
                            <p>Practice with AI-generated questions tailored to your target job to ace your interviews.</p>
                            <span className="tool-cta">Start Practice →</span>
                        </div>
                    </div>
                </div>

                {/* "HOW IT WORKS" SECTION */}
                <div className="how-it-works-timeline">
                    <h2 className="section-title">A Simple Process</h2>
                    <div className="timeline">
                        <div className="timeline-item">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <h3>1. Select a Tool</h3>
                                <p>Choose from our suite of AI-powered tools.</p>
                            </div>
                        </div>
                        <div className="timeline-item">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <h3>2. Provide Input</h3>
                                <p>Upload your resume, paste a job description, or fill in our guided forms.</p>
                            </div>
                        </div>
                        <div className="timeline-item">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <h3>3. Get Results</h3>
                                <p>Receive your optimized resume, ATS score, or generated cover letter in seconds.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', margin: '4rem 0' }}>
                    <button className="btn btn-outline" onClick={() => navigate('/')}>
                        ← Back to Home
                    </button>
                </div>
            </div>
            
            {/* Reusable Footer */}
            <Footer />
        </div>
    );
};

export default AiToolsPage;