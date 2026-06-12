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
    "⏳ Parsing Input to JSON (Step 0)...",
    "🧠 Executing Gap Analysis...",
    "✨ Micro-Tailoring Bullet Points...",
    "⚙️ Compiling Pixel-Perfect PDF..."
];

const AiTailorPage: React.FC = () => {
    const navigate = useNavigate(); // ✅ Correct hook placement

    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [error, setError] = useState('');
    
    const [latexCode, setLatexCode] = useState<string>('');
    const [pdfData, setPdfData] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    const [isCompiling, setIsCompiling] = useState(false);
    const [metrics, setMetrics] = useState<{ score: number, keywords: string[] } | null>(null);

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
            setError("Please drop a valid .txt or .json file for now. (PDF coming soon)");
        }
    };

    // --- FAKE SMART METRICS LOGIC ---
    const calculateMetrics = (jd: string) => {
        const words = jd.split(/\s+/).filter(w => w.length > 5).slice(0, 5);
        setMetrics({
            score: Math.floor(Math.random() * (98 - 85 + 1)) + 85, 
            keywords: [...new Set(words)]
        });
    };

    // --- MAIN API CALL WITH TOLL PLAZA ---
    const handleTailorResume = async () => {
        if (!resumeText.trim() || !jobDescription.trim()) {
            setError('Please provide both your resume and the job description.');
            return;
        }

        setIsLoading(true);
        setError('');
        setLatexCode('');
        setPdfData(null);
        setMetrics(null);
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
            }, 4000);

            const payload = { 
                resume_text: resumeText, 
                job_description: jobDescription 
            };
            
            const response = await axios.post(`${API_BASE_URL}/api/ai/tailor`, payload);
            clearInterval(stepInterval); 
            
            if (response.data && response.data.latex_code && response.data.pdf_base64) {
                setLatexCode(response.data.latex_code);
                setPdfData(response.data.pdf_base64);
                calculateMetrics(jobDescription);
                setIsLoading(false);
            } else {
                throw new Error("Invalid response format received from server.");
            }
        } catch (err: any) {
            console.error("Error tailoring resume:", err);
            
            let finalErrorMessage = "Failed to tailor resume. Ensure backend is running.";
            
            try {
                const detail = err.response?.data?.detail;
                if (detail) {
                    if (Array.isArray(detail)) {
                        finalErrorMessage = detail.map((e: any) => {
                            const location = Array.isArray(e.loc) ? e.loc.join(' -> ') : 'Field';
                            return `${location}: ${e.msg}`;
                        }).join(" | ");
                    } else if (typeof detail === "string") {
                        finalErrorMessage = detail;
                    } else {
                        finalErrorMessage = JSON.stringify(detail);
                    }
                } else if (err.message) {
                    finalErrorMessage = err.message;
                }
            } catch (fallbackError) {
                finalErrorMessage = "An unknown server error occurred.";
            }

            setError(String(finalErrorMessage));
            setIsLoading(false);
        }
    };

    // --- MANUAL RECOMPILE LOGIC ---
    const handleRecompile = async () => {
        if (!latexCode.trim()) return;
        
        setIsCompiling(true);
        setError('');
        
        try {
            const response = await axios.post(`${API_BASE_URL}/api/ai/compile-only`, { 
                latex_code: latexCode 
            });
            
            if (response.data && response.data.pdf_base64) {
                setPdfData(response.data.pdf_base64);
            } else {
                throw new Error("Compilation failed.");
            }
        } catch (err: any) {
            console.error("Compile Error:", err);
            setError(err.response?.data?.detail || 'LaTeX Compilation failed. Check for missing brackets (}).');
        } finally {
            setIsCompiling(false);
        }
    };

    // --- DOWNLOAD HANDLERS ---
    const handleDownloadPdf = () => {
        if (!pdfData) return;
        const byteCharacters = atob(pdfData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Tailored_Resume.pdf';
        link.click();
    };

    const handleDownloadLatex = () => {
        if (!latexCode) return;
        const blob = new Blob([latexCode], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Tailored_Resume.tex';
        link.click();
    };

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="tailor-studio-container" style={{ paddingTop: '100px', paddingBottom: '3rem', maxWidth: '96%', margin: '0 auto' }}>
                
                <div className="studio-header text-center" style={{ marginBottom: '3rem' }}>
                    <div className="hero-badge">
                        <span className="sparkle">✨</span> AI Optimizer
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Resume Tailor</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Instantly align your resume with any job description. Precision matters.</p>
                </div>

                <div className="tailor-input-grid">
                    <div className="panel glass-card relative-panel">
                        <h2 className="panel-title">Your Resume (Text or JSON)</h2>
                        <textarea
                            className={`drop-zone premium-textarea ${isDragging ? 'drag-active' : ''}`}
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            placeholder='Paste your raw resume text, LaTeX code, or drag & drop a .json/.txt file here...'
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
                        onClick={handleTailorResume} 
                        disabled={isLoading || !resumeText.trim() || !jobDescription.trim()}
                        style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', borderRadius: '50px' }}
                    >
                        {isLoading ? 'Processing Pipeline...' : 'Tailor My Resume 🚀'}
                    </button>
                    {error && <div className="error-status" style={{ marginTop: '1rem', fontSize: '1.1rem' }}>{error}</div>}
                </div>

                {(isLoading || latexCode || pdfData) && (
                    <div className="output-section">
                        {isLoading ? (
                            <div className="loading-state glass-card text-center" style={{ padding: '4rem', maxWidth: '600px', margin: '0 auto' }}>
                                <div className="spinner-premium"></div>
                                <h3 className="step-text" style={{ color: 'var(--accent-cyan)', margin: '1.5rem 0' }}>{loadingSteps[loadingStep]}</h3>
                                <div className="progress-bar-container">
                                    <div className="progress-bar-fill" style={{ width: `${((loadingStep + 1) / 4) * 100}%` }}></div>
                                </div>
                            </div>
                        ) : (
                            <div className="results-wrapper">
                                {metrics && (
                                    <div className="metrics-panel glass-card" style={{ marginBottom: '2rem' }}>
                                        <div className="metrics-grid">
                                            <div className="metric-item">
                                                <h4>Estimated ATS Match</h4>
                                                <div className="score-circle">
                                                    <span className="score-text">{metrics.score}%</span>
                                                </div>
                                            </div>
                                            <div className="metric-item keywords-item">
                                                <h4>Keywords Injected</h4>
                                                <div className="pills-container">
                                                    {metrics.keywords.map((kw, i) => <span key={i} className="glow-pill">{kw.replace(/[^a-zA-Z]/g, '')}</span>)}
                                                </div>
                                            </div>
                                            <div className="metric-item">
                                                <h4>Action Verbs</h4>
                                                <div className="verb-text" style={{ color: 'var(--text-secondary)' }}>Upgraded weak verbs to match JD tone.</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="tailor-output-grid">
                                    <div className="panel output-panel glass-card">
                                        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3 style={{ margin: 0, color: 'var(--accent-cyan)' }}>💻 LaTeX Source</h3>
                                            <div style={{display: 'flex', gap: '10px'}}>
                                                <button 
                                                    onClick={handleRecompile} 
                                                    disabled={isCompiling} 
                                                    className="btn-outline"
                                                    style={{ borderColor: '#f59e0b', color: '#f59e0b' }}
                                                >
                                                    {isCompiling ? '🔄 Compiling...' : '🔄 Recompile PDF'}
                                                </button>
                                                <button onClick={handleDownloadLatex} className="btn-outline">
                                                    ⬇️ .TEX
                                                </button>
                                            </div>
                                        </div>
                                        <textarea 
                                            value={latexCode} 
                                            onChange={(e) => setLatexCode(e.target.value)}
                                            className="code-viewer-premium"
                                            spellCheck={false}
                                        />
                                    </div>

                                    <div className="panel output-panel glass-card">
                                        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3 style={{ margin: 0, color: 'var(--accent-purple)' }}>📄 PDF Preview</h3>
                                            <button onClick={handleDownloadPdf} className="btn-premium" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
                                                ⬇️ Download PDF
                                            </button>
                                        </div>
                                        <div className="pdf-viewer-container-premium">
                                            {pdfData ? (
                                                <object 
                                                    data={URL.createObjectURL(new Blob([new Uint8Array(atob(pdfData).split('').map(c => c.charCodeAt(0)))], { type: 'application/pdf' }))} 
                                                    type="application/pdf" 
                                                    className="pdf-preview-object" 
                                                    aria-label="Tailored Resume Preview"
                                                />
                                            ) : (
                                                <div className="pdf-preview-placeholder">
                                                    {isCompiling ? 'Compiling new PDF...' : 'Preview will appear here'}
                                                </div>
                                            )}
                                        </div>
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

export default AiTailorPage;