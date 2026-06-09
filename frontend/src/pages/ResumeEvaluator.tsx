import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
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

    // --- API CALL LOGIC ---
    const handleEvaluateResume = async () => {
        if (!resumeText.trim() || !jobDescription.trim()) {
            setError('Please provide both your resume and the job description.');
            return;
        }
        
        setIsLoading(true);
        setError('');
        setEvaluationResult(null);
        setLoadingStep(0);

        const stepInterval = setInterval(() => {
            setLoadingStep(prev => prev < 3 ? prev + 1 : prev);
        }, 3000);

        try {
            // FIXED: Using correct backend endpoint and payload keys
            const payload = { resume_text: resumeText, job_description: jobDescription };
            const response = await axios.post(`${API_BASE_URL}/api/ai/evaluate`, payload);
            
            if (response.data && response.data.evaluation_result) {
                setEvaluationResult(response.data.evaluation_result);
            } else {
                throw new Error("Invalid JSON format received from server.");
            }
        } catch (err: any) {
            console.error("Error evaluating resume:", err);
            setError(err.response?.data?.detail || 'Failed to evaluate resume. Ensure backend is running.');
        } finally {
            clearInterval(stepInterval);
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

            <div className="tailor-container">
                <div className="tailor-header">
                    <h1>Brutally Honest ATS Evaluator</h1>
                    <p>No sugarcoating. Find out exactly why your resume might be rejected and how to fix it.</p>
                </div>

                {/* --- TOP ROW: INPUTS --- */}
                <div className="input-grid">
                    <div className="panel relative-panel">
                        <h2>Your Resume (Text/JSON)</h2>
                        <textarea
                            className={`drop-zone ${isDragging ? 'drag-active' : ''}`}
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            placeholder="Paste your resume data here or Drop a file..."
                            disabled={isLoading}
                        />
                    </div>
                    <div className="panel">
                        <h2>Target Job Description</h2>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the target JD here..."
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* --- MIDDLE: ACTION BUTTON --- */}
                <div className="action-row">
                    <button 
                        className="btn btn-primary massive-btn" 
                        onClick={handleEvaluateResume} 
                        disabled={isLoading || !resumeText.trim() || !jobDescription.trim()}
                    >
                        {isLoading ? 'Running ATS Scanner...' : 'Evaluate My Resume'}
                    </button>
                    {error && <div className="error-banner">{error}</div>}
                </div>

                {/* --- BOTTOM ROW: RESULTS DASHBOARD --- */}
                {(isLoading || evaluationResult) && (
                    <div className="output-grid-container">
                        <hr className="section-divider" />
                        
                        {isLoading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <h3 className="step-text">{loadingSteps[loadingStep]}</h3>
                                <div className="progress-bar-container">
                                    <div className="progress-bar" style={{ width: `${((loadingStep + 1) / 4) * 100}%` }}></div>
                                </div>
                            </div>
                        ) : evaluationResult && (
                            <div className="dashboard-wrapper">
                                
                                {/* SCORE & RED FLAGS ROW */}
                                <div className="dashboard-top-row" style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                    
                                    {/* The Score Box */}
                                    <div className="panel" style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <h2>ATS Match Score</h2>
                                        <div style={{
                                            width: '120px', height: '120px', borderRadius: '50%', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: `8px solid ${getScoreColor(evaluationResult.ats_score)}`,
                                            fontSize: '2.5rem', fontWeight: 'bold', color: '#fff',
                                            boxShadow: `0 0 20px ${getScoreColor(evaluationResult.ats_score)}40`
                                        }}>
                                            {evaluationResult.ats_score}%
                                        </div>
                                    </div>

                                    {/* The Red Flags Box */}
                                    <div className="panel" style={{ flex: '1', borderLeft: '4px solid #ef4444' }}>
                                        <h2 style={{ color: '#ef4444' }}>🚩 Critical Dealbreakers</h2>
                                        {evaluationResult.red_flags.length > 0 ? (
                                            <ul style={{ color: '#fca5a5', paddingLeft: '20px', lineHeight: '1.6' }}>
                                                {evaluationResult.red_flags.map((flag, idx) => (
                                                    <li key={idx} style={{ marginBottom: '10px' }}>{flag}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p style={{ color: '#10b981' }}>✅ No critical red flags found! Good job.</p>
                                        )}
                                    </div>
                                </div>

                                {/* KEYWORDS ROW */}
                                <div className="panel" style={{ marginBottom: '20px' }}>
                                    <h2 style={{ color: '#00e5ff' }}>🔍 Missing Keywords</h2>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ color: '#a0aec0', marginBottom: '10px' }}>Hard Skills / Tech</h4>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {evaluationResult.missing_keywords.hard_skills.map((skill, idx) => (
                                                    <span key={idx} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '5px 10px', borderRadius: '4px', fontSize: '0.85rem' }}>{skill}</span>
                                                ))}
                                                {evaluationResult.missing_keywords.hard_skills.length === 0 && <span style={{ color: '#10b981' }}>None missing!</span>}
                                            </div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ color: '#a0aec0', marginBottom: '10px' }}>Soft Skills / Methods</h4>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {evaluationResult.missing_keywords.soft_skills.map((skill, idx) => (
                                                    <span key={idx} style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', padding: '5px 10px', borderRadius: '4px', fontSize: '0.85rem' }}>{skill}</span>
                                                ))}
                                                {evaluationResult.missing_keywords.soft_skills.length === 0 && <span style={{ color: '#10b981' }}>None missing!</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ROAST & REWRITE SECTION */}
                                <div className="panel">
                                    <h2 style={{ color: '#b620e0' }}>🔥 Resume Roast & Rewrites</h2>
                                    <p style={{ color: '#a0aec0', marginBottom: '20px' }}>We found weak bullet points in your resume. Here is how a recruiter sees them, and how you should rewrite them.</p>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {evaluationResult.resume_roast.map((roast, idx) => (
                                            <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px' }}>
                                                <div style={{ marginBottom: '10px' }}>
                                                    <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.85rem' }}>WEAK BULLET:</span>
                                                    <p style={{ color: '#e2e8f0', margin: '5px 0 0 0', fontStyle: 'italic' }}>"{roast.weak_bullet}"</p>
                                                </div>
                                                <div style={{ marginBottom: '10px' }}>
                                                    <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.85rem' }}>WHY IT SUCKS:</span>
                                                    <p style={{ color: '#fcd34d', margin: '5px 0 0 0' }}>{roast.why_it_sucks}</p>
                                                </div>
                                                <div>
                                                    <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem' }}>AI REWRITE (USE THIS):</span>
                                                    <p style={{ color: '#a7f3d0', margin: '5px 0 0 0', fontWeight: '500' }}>{roast.rewritten_bullet}</p>
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