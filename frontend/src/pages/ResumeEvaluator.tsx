import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import { supabase } from '../supabaseClient';
import './AiTailorPage.css'; // Reusing our magical CSS layout

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

const loadingSteps = [
    "⏳ Parsing Resume & Job Description...",
    "🧠 Executing Deep Keyword Analysis...",
    "🔎 Identifying Red Flags & Dealbreakers...",
    "🔥 Roasting Weak Bullets & Writing Metrics..."
];

// Define the interface based on our Python backend JSON
interface EvaluationData {
    ats_score: number;
    red_flags: string[];
    missing_keywords: {
        hard_skills: string[];
        soft_skills: string[];
    };
    resume_roast: {
        weak_bullet: string;
        why_it_sucks: string;
        rewritten_bullet: string;
    }[];
}

const AtsEvaluatorPage: React.FC = () => {
    const navigate = useNavigate(); // ✅ Hook added for redirection

    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    
    // State to hold the parsed JSON evaluation
    const [evaluationResult, setEvaluationResult] = useState<EvaluationData | null>(null); 
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // --- DRAG & DROP LOGIC ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.type === "application/json" || file.type === "text/plain")) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) setResumeText(event.target.result as string);
            };
            reader.readAsText(file);
        } else {
            setError("Please drop a valid .txt or .json file.");
        }
    };

    // --- MAIN API CALL (WITH TOLL PLAZA 🚧) ---
    const handleEvaluateResume = async () => {
        if (!resumeText.trim() || !jobDescription.trim()) {
            setError('Please provide both your resume and the job description.');
            return;
        }
        
        setIsLoading(true);
        setError('');
        setEvaluationResult(null);
        setLoadingStep(0);

        try {
            // 🛑 TOLL PLAZA CHECK 1: User Logged in hai?
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user) {
                setError("You must be logged in to use this AI tool.");
                setIsLoading(false);
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            // 🛑 TOLL PLAZA CHECK 2: Token deduct karo!
            try {
                await axios.post(`${API_BASE_URL}/api/deduct-token`, { 
                    user_id: user.id 
                });
            } catch (tokenErr: any) {
                // Agar 403 error aaya, matlab tokens khatam
                if (tokenErr.response?.status === 403) {
                    setError("🚫 Tokens Empty! Redirecting to Premium upgrade...");
                    setIsLoading(false);
                    setTimeout(() => navigate('/pricing'), 3000);
                    return;
                }
                throw tokenErr;
            }

            // ✅ TOLL PLAZA CROSSED! Ab AI apna jaadu chalayega...
            const stepInterval = setInterval(() => {
                setLoadingStep(prev => prev < 3 ? prev + 1 : prev);
            }, 3000);

            const payload = { resume_text: resumeText, job_description: jobDescription };
            const response = await axios.post(`${API_BASE_URL}/api/ai/evaluate`, payload);
            
            clearInterval(stepInterval); // Loading rok do
            
            if (response.data && response.data.evaluation_result) {
                setEvaluationResult(response.data.evaluation_result);
            } else {
                throw new Error("Invalid JSON format received from server.");
            }
        } catch (err: any) {
            console.error("Error evaluating resume:", err);
            setError(err.response?.data?.detail || 'Failed to evaluate resume. Ensure backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to determine score color
    const getScoreColor = (score: number) => {
        if (score >= 80) return '#10b981'; // Green
        if (score >= 60) return '#f59e0b'; // Yellow
        return '#ef4444'; // Red
    };

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="tailor-studio-container" style={{ paddingTop: '100px', paddingBottom: '3rem', maxWidth: '96%', margin: '0 auto' }}>
                
                <div className="studio-header text-center" style={{ marginBottom: '3rem' }}>
                    <div className="hero-badge" style={{ borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
                        <span className="sparkle">🔥</span> Brutal ATS Scanner
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Resume Evaluator</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No sugarcoating. Find out exactly why your resume might be rejected.</p>
                </div>

                <div className="tailor-input-grid">
                    <div className="panel glass-card relative-panel">
                        <h2 className="panel-title">Your Resume (Text/JSON)</h2>
                        <textarea
                            className={`drop-zone premium-textarea ${isDragging ? 'drag-active' : ''}`}
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            placeholder="Paste your resume data here or Drop a file..."
                            disabled={isLoading}
                        />
                    </div>
                    <div className="panel glass-card">
                        <h2 className="panel-title">Target Job Description</h2>
                        <textarea
                            className="premium-textarea"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the target JD here..."
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="action-row text-center" style={{ margin: '3rem 0' }}>
                    <button 
                        className="btn-premium pulse-glow massive-btn" 
                        onClick={handleEvaluateResume} 
                        disabled={isLoading || !resumeText.trim() || !jobDescription.trim()}
                        style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', borderRadius: '50px', background: 'linear-gradient(135deg, #ef4444, #f59e0b)' }}
                    >
                        {isLoading ? 'Running ATS Scanner...' : 'Evaluate My Resume 🔥'}
                    </button>
                    {error && <div className="error-status" style={{ marginTop: '1rem', fontSize: '1.1rem' }}>{error}</div>}
                </div>

                {(isLoading || evaluationResult) && (
                    <div className="output-section">
                        {isLoading ? (
                            <div className="loading-state glass-card text-center" style={{ padding: '4rem', maxWidth: '600px', margin: '0 auto' }}>
                                <div className="spinner-premium" style={{ borderTopColor: '#ef4444' }}></div>
                                <h3 className="step-text" style={{ color: '#ef4444', margin: '1.5rem 0' }}>{loadingSteps[loadingStep]}</h3>
                                <div className="progress-bar-container">
                                    <div className="progress-bar-fill" style={{ width: `${((loadingStep + 1) / 4) * 100}%`, background: 'linear-gradient(90deg, #ef4444, #f59e0b)' }}></div>
                                </div>
                            </div>
                        ) : evaluationResult && (
                            <div className="dashboard-wrapper">
                                {/* SCORE & RED FLAGS ROW */}
                                <div className="tailor-input-grid" style={{ marginBottom: '2rem' }}>
                                    
                                    {/* The Score Box */}
                                    <div className="panel glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                        <h2 className="panel-title">ATS Match Score</h2>
                                        <div style={{
                                            width: '140px', height: '140px', borderRadius: '50%', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: `8px solid ${getScoreColor(evaluationResult.ats_score)}`,
                                            fontSize: '3rem', fontWeight: '800', color: '#fff',
                                            boxShadow: `0 0 30px ${getScoreColor(evaluationResult.ats_score)}40`,
                                            marginTop: '1rem'
                                        }}>
                                            {evaluationResult.ats_score}%
                                        </div>
                                    </div>

                                    {/* The Red Flags Box */}
                                    <div className="panel glass-card" style={{ borderLeft: '4px solid #ef4444' }}>
                                        <h2 className="panel-title" style={{ color: '#ef4444' }}>🚩 Critical Dealbreakers</h2>
                                        {evaluationResult.red_flags.length > 0 ? (
                                            <ul style={{ color: '#fca5a5', paddingLeft: '20px', lineHeight: '1.8', fontSize: '1.05rem', margin: 0 }}>
                                                {evaluationResult.red_flags.map((flag, idx) => (
                                                    <li key={idx} style={{ marginBottom: '10px' }}>{flag}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#10b981', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                ✅ No critical red flags found!
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* KEYWORDS ROW */}
                                <div className="panel glass-card" style={{ marginBottom: '2rem' }}>
                                    <h2 className="panel-title" style={{ color: '#00e5ff' }}>🔍 Missing Keywords Tracker</h2>
                                    <div className="tailor-input-grid" style={{ gap: '1rem', marginBottom: 0 }}>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                                            <h4 style={{ color: '#a0aec0', marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Hard Skills / Tech</h4>
                                            <div className="pills-container" style={{ justifyContent: 'flex-start' }}>
                                                {evaluationResult.missing_keywords.hard_skills.map((skill, idx) => (
                                                    <span key={idx} className="glow-pill" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.3)' }}>{skill}</span>
                                                ))}
                                                {evaluationResult.missing_keywords.hard_skills.length === 0 && <span style={{ color: '#10b981' }}>None missing!</span>}
                                            </div>
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                                            <h4 style={{ color: '#a0aec0', marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Soft Skills / Methods</h4>
                                            <div className="pills-container" style={{ justifyContent: 'flex-start' }}>
                                                {evaluationResult.missing_keywords.soft_skills.map((skill, idx) => (
                                                    <span key={idx} className="glow-pill" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fcd34d', borderColor: 'rgba(245, 158, 11, 0.3)' }}>{skill}</span>
                                                ))}
                                                {evaluationResult.missing_keywords.soft_skills.length === 0 && <span style={{ color: '#10b981' }}>None missing!</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ROAST & REWRITE SECTION */}
                                <div className="panel glass-card">
                                    <h2 className="panel-title" style={{ color: '#b620e0' }}>🔥 Resume Roast & Rewrites</h2>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>This is how a recruiter sees your weak points. Use the AI rewrites to instantly fix them.</p>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                                        {evaluationResult.resume_roast.map((roast, idx) => (
                                            <div key={idx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #b620e0' }}>
                                                <div style={{ marginBottom: '1rem' }}>
                                                    <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '1px' }}>WEAK BULLET:</span>
                                                    <p style={{ color: '#e2e8f0', margin: '8px 0 0 0', fontStyle: 'italic', fontSize: '1.05rem' }}>"{roast.weak_bullet}"</p>
                                                </div>
                                                <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '8px' }}>
                                                    <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '1px' }}>WHY IT SUCKS:</span>
                                                    <p style={{ color: '#fcd34d', margin: '8px 0 0 0' }}>{roast.why_it_sucks}</p>
                                                </div>
                                                <div>
                                                    <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '1px' }}>AI REWRITE (USE THIS):</span>
                                                    <p style={{ color: '#a7f3d0', margin: '8px 0 0 0', fontSize: '1.1rem', fontWeight: '500' }}>{roast.rewritten_bullet}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default AtsEvaluatorPage;