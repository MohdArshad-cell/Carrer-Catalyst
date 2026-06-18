import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mic, ChevronDown, ChevronUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import { supabase } from '../supabaseClient';
import './AiTailorPage.css';  // Utilizing the premium Tailor CSS

interface InterviewItem {
  question: string;
  answer: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const MockInterviewPage: React.FC = () => {
    const navigate = useNavigate();

    const [jobDescription, setJobDescription] = useState('');
    const [questions, setQuestions] = useState<InterviewItem[]>([]); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [visibleAnswers, setVisibleAnswers] = useState<{ [key: number]: boolean }>({});

    const toggleAnswer = (index: number) => {
        setVisibleAnswers(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleGenerate = async () => {
        if (!jobDescription.trim()) {
            setError('Please provide a job description first.');
            return;
        }
        
        setIsLoading(true);
        setError('');
        setQuestions([]);
        setVisibleAnswers({}); 

        try {
            // 🛑 TOLL PLAZA CHECK: Verify Supabase Session
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user || !session) {
                setError("You must be logged in to use this AI tool.");
                setIsLoading(false);
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            // ✅ API CALL WITH HEADERS (SECURITY GATEKEEPER)
            // Hitting the correct secured endpoint: /api/ai/interview
            const payload = { job_description: jobDescription };
            const response = await axios.post(`${API_BASE_URL}/api/ai/interview`, payload, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`, 
                    'Content-Type': 'application/json'
                }
            });
            
            // Extract the generated data from the backend's dictionary wrapper
            const interviewData = response.data?.interview_data;

            if (!interviewData || !Array.isArray(interviewData)) {
                throw new Error("Invalid response format received from server.");
            }

            setQuestions(interviewData);

        } catch (err: any) {
            console.error("Error generating interview:", err);
            
            // ✅ HANDLE EMPTY TOKENS OR EXPIRED SESSIONS (401/402/403)
            if (err.response?.status === 402 || err.response?.status === 401 || err.response?.status === 403) {
                setError("🚫 Tokens Empty or Session Expired! Redirecting to Premium upgrade...");
                setIsLoading(false);
                setTimeout(() => navigate('/pricing'), 3000);
                return;
            }

            let finalErrorMessage = "Failed to generate interview questions. Ensure backend is running.";
            
            try {
                const detail = err.response?.data?.detail;
                if (detail) {
                    finalErrorMessage = typeof detail === "string" ? detail : JSON.stringify(detail);
                } else if (err.message) {
                    finalErrorMessage = err.message;
                }
            } catch (fallbackError) {
                finalErrorMessage = "An unknown server error occurred.";
            }

            setError(String(finalErrorMessage));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="tailor-studio-container" style={{ paddingTop: '100px', paddingBottom: '3rem', maxWidth: '96%', margin: '0 auto' }}>
                
                <div className="studio-header text-center" style={{ marginBottom: '3rem' }}>
                    <div className="hero-badge">
                        <span className="sparkle">🎤</span> Interview Prep
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>AI Mock Interview</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Paste a Job Description. Our AI HR Manager will grill you with targeted questions.</p>
                </div>

                {/* Input Section - Centered wide panel */}
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="panel glass-card">
                        <h2 className="panel-title">Target Job Description</h2>
                        <textarea
                            className="premium-textarea"
                            placeholder="Paste the full job description here (e.g., 'Senior Software Engineer at Google...')"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            disabled={isLoading}
                            // Increased height to 350px, forced full width, and allowed vertical resizing
                            style={{ minHeight: '350px', width: '100%', resize: 'vertical' }} 
                        />
                    </div>
                </div>

                <div className="action-row text-center" style={{ margin: '3rem 0' }}>
                    <button 
                        className="btn-premium pulse-glow massive-btn" 
                        onClick={handleGenerate}
                        disabled={isLoading || !jobDescription.trim()}
                        style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', borderRadius: '50px' }}
                    >
                        {isLoading ? 'Analyzing Requirements...' : 'Start Interview 🚀'}
                    </button>
                    {error && <div className="error-status" style={{ marginTop: '1rem', fontSize: '1.1rem', color: '#ff4d4f' }}>{error}</div>}
                </div>

                {/* Output Section */}
                {(isLoading || questions.length > 0) && (
                    <div className="output-section" style={{ maxWidth: '900px', margin: '0 auto' }}>
                        {isLoading ? (
                            <div className="loading-state glass-card text-center" style={{ padding: '4rem' }}>
                                <div className="spinner-premium"></div>
                                <h3 className="step-text" style={{ color: 'var(--accent-cyan)', margin: '1.5rem 0' }}>
                                    🧠 HR AI is reviewing the JD and drafting questions...
                                </h3>
                            </div>
                        ) : (
                            <div className="panel output-panel glass-card">
                                <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                                    <Mic size={28} style={{ color: 'var(--accent-purple)' }} />
                                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem' }}>Interview Session Active</h3>
                                </div>
                                
                                <div className="questions-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {questions.map((item, index) => (
                                        <div key={index} className="question-item glass-card" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
                                            <h4 style={{ color: 'var(--accent-cyan)', margin: '0 0 0.5rem 0' }}>Question {index + 1}</h4>
                                            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '1rem', lineHeight: '1.6' }}>
                                                {item.question}
                                            </p>
                                            
                                            <button 
                                                className="btn-outline" 
                                                onClick={() => toggleAnswer(index)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                            >
                                                {visibleAnswers[index] ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                                {visibleAnswers[index] ? 'Hide Answer' : 'Show Ideal Answer'}
                                            </button>

                                            {visibleAnswers[index] && (
                                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(168, 85, 247, 0.1)', borderLeft: '3px solid var(--accent-purple)', borderRadius: '0 8px 8px 0' }}>
                                                    <strong style={{ color: 'var(--accent-purple)', display: 'block', marginBottom: '0.5rem' }}>💡 Ideal Response Framework:</strong>
                                                    <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                                        {item.answer}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div style={{ width: '100%', marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    );
};

export default MockInterviewPage;