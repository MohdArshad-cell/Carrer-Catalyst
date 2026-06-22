import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import { supabase } from '../supabaseClient';
import './AiTailorPage.css'; 

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

const loadingSteps = [
    "⏳ Parsing Resume & Job Description...",
    "🧠 Executing Semantic NLP Analysis...",
    "🔎 Identifying Red Flags & Gaps...",
    "🔥 Generating Brutal Constructive Roasts..."
];

// 🚀 UPDATED INTERFACES: Perfectly matches the new Pydantic structure
interface RoastDetail {
    weak_bullet: string;
    critique: string;
    rewrite: string;
}

interface EvaluationData {
    score: number;
    red_flags: string[];
    missing_keywords: string[];
    constructive_roasts: RoastDetail[];
}

const AtsEvaluatorPage: React.FC = () => {
    const navigate = useNavigate(); 

    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
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

    // --- MAIN API CALL ---
    const handleEvaluateResume = async () => {
        if (!resumeText.trim() || !jobDescription.trim()) {
            setError('Please provide both your resume and the job description.');
            return;
        }
        
        setIsLoading(true);
        setError('');
        setEvaluationResult(null);
        setLoadingStep(0);

        let stepInterval: any = null; 

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user || !session) {
                setError("You must be logged in to use this AI tool.");
                setIsLoading(false);
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            stepInterval = setInterval(() => {
                setLoadingStep(prev => prev < 3 ? prev + 1 : prev);
            }, 3000);

            const payload = { resume_text: resumeText, job_description: jobDescription };
            
            const response = await axios.post(`${API_BASE_URL}/api/ai/evaluate`, payload, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (stepInterval) clearInterval(stepInterval); 
            
            if (response.data) {
                const payloadData = response.data.evaluation_result || response.data;
                setEvaluationResult(payloadData);
            } else {
                throw new Error("Invalid JSON format received from server.");
            }
        } catch (err: any) {
            if (stepInterval) clearInterval(stepInterval); 
            console.error("Error evaluating resume:", err);
            
            if (err.response?.status === 402 || err.response?.status === 401 || err.response?.status === 403) {
                setError("🚫 Tokens Empty or Session Expired! Redirecting to Premium upgrade...");
                setIsLoading(false);
                setTimeout(() => navigate('/pricing'), 3000);
                return;
            }

            setError(err.response?.data?.detail || 'Failed to evaluate resume. Ensure backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

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
                        <span className="sparkle">🔥</span> Enterprise ATS Engine
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Resume Evaluator</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No sugarcoating. Find out exactly how a modern semantic ATS ranks you.</p>
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
                                    
                                    <div className="panel glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                        <h2 className="panel-title">ATS Match Score</h2>
                                        <div style={{
                                            width: '140px', height: '140px', borderRadius: '50%', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: `8px solid ${getScoreColor(evaluationResult.score)}`,
                                            fontSize: '3rem', fontWeight: '800', color: '#fff',
                                            boxShadow: `0 0 30px ${getScoreColor(evaluationResult.score)}40`,
                                            marginTop: '1rem'
                                        }}>
                                            {evaluationResult.score}%
                                        </div>
                                    </div>

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
                                    <h2 className="panel-title" style={{ color: '#00e5ff' }}>🔍 Missing Keywords (Semantic Gap)</h2>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                                        <div className="pills-container" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                            {evaluationResult.missing_keywords.length > 0 ? (
                                                evaluationResult.missing_keywords.map((skill, idx) => (
                                                    <span key={idx} className="glow-pill" style={{ background: 'rgba(0, 229, 255, 0.1)', color: '#67e8f9', borderColor: 'rgba(0, 229, 255, 0.3)', padding: '8px 16px', borderRadius: '20px' }}>
                                                        {skill}
                                                    </span>
                                                ))
                                            ) : (
                                                <span style={{ color: '#10b981' }}>Outstanding! No major keyword gaps found.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 🔥 NEW HIGH-VISIBILITY ROASTS SECTION 🔥 */}
                                <div className="panel glass-card">
                                    <h2 className="panel-title" style={{ color: '#b620e0' }}>🔥 Constructive Roasts & Rewrites</h2>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Direct, brutal feedback on how a recruiter perceives your weak bullet points.</p>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {evaluationResult.constructive_roasts.map((roast, idx) => (
                                            <div key={idx} style={{ 
                                                background: 'rgba(10, 10, 10, 0.6)', 
                                                border: '1px solid rgba(182, 32, 224, 0.3)', 
                                                borderRadius: '12px', 
                                                overflow: 'hidden',
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                            }}>
                                                {/* Section 1: The Garbage Bullet */}
                                                <div style={{ padding: '1.2rem', background: 'rgba(239, 68, 68, 0.08)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <span style={{ background: '#ef4444', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px', display: 'inline-block', marginBottom: '8px' }}>
                                                        WEAK BULLET
                                                    </span>
                                                    {/* Strikethrough to emphasize they need to delete this */}
                                                    <p style={{ color: '#fca5a5', margin: 0, fontSize: '1.05rem', textDecoration: 'line-through', opacity: 0.8 }}>
                                                        "{roast.weak_bullet}"
                                                    </p>
                                                </div>

                                                {/* Section 2: The Brutal Critique */}
                                                <div style={{ padding: '1.2rem', borderLeft: '4px solid #f59e0b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <span style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                                                        WHY IT SUCKS:
                                                    </span>
                                                    <p style={{ color: '#fcd34d', margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                                                        {roast.critique}
                                                    </p>
                                                </div>

                                                {/* Section 3: The Fix */}
                                                <div style={{ padding: '1.2rem', background: 'rgba(16, 185, 129, 0.05)', borderLeft: '4px solid #10b981' }}>
                                                    <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                                                        AI REWRITE (USE THIS):
                                                    </span>
                                                    <p style={{ color: '#a7f3d0', margin: 0, fontSize: '1.1rem', fontWeight: '500', lineHeight: '1.5' }}>
                                                        {roast.rewrite}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}

                                        {evaluationResult.constructive_roasts.length === 0 && (
                                            <div style={{ color: '#10b981', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
                                                ✅ Outstanding work. The AI could not find any weak bullet points to roast.
                                            </div>
                                        )}
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