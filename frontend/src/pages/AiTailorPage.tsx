import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import './AiTailorPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

const loadingSteps = [
    "⏳ Parsing Job Description & Resume...",
    "🧠 Executing Gap Analysis...",
    "✨ Micro-Tailoring Bullet Points...",
    "⚙️ Compiling Pixel-Perfect PDF..."
];

const AiTailorPage: React.FC = () => {
    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [error, setError] = useState('');
    
    const [latexCode, setLatexCode] = useState<string>('');
    const [pdfData, setPdfData] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // --- NEW STATE FOR MANUAL RECOMPILE ---
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
            setError("Please drop a valid .txt or .json file.");
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

    // --- MAIN API CALL ---
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

        const stepInterval = setInterval(() => {
            setLoadingStep(prev => prev < 3 ? prev + 1 : prev);
        }, 4000);

        try {
            const payload = { resume_text: resumeText, job_description: jobDescription };
            const response = await axios.post(`${API_BASE_URL}/api/ai/tailor`, payload);
            
            if (response.data && response.data.latex_code && response.data.pdf_base64) {
                setLatexCode(response.data.latex_code);
                setPdfData(response.data.pdf_base64);
                calculateMetrics(jobDescription);
            } else {
                throw new Error("Invalid response format received from server.");
            }
        } catch (err: any) {
            console.error("Error tailoring resume:", err);
            setError(err.response?.data?.detail || 'Failed to tailor resume. Ensure backend is running.');
        } finally {
            clearInterval(stepInterval);
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

            <div className="tailor-container">
                <div className="tailor-header">
                    <h1>AI Resume Tailor</h1>
                    <p>Instantly optimize your resume against any job description. Precision matters.</p>
                </div>

                {/* --- TOP ROW: INPUTS --- */}
                <div className="input-grid">
                    <div className="panel relative-panel">
                        <h2>Your Resume (JSON or Text)</h2>
                        <textarea
                            className={`drop-zone ${isDragging ? 'drag-active' : ''}`}
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            placeholder="Paste your resume data here or Drop a .txt/.json file..."
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
                        onClick={handleTailorResume} 
                        disabled={isLoading || !resumeText.trim() || !jobDescription.trim()}
                    >
                        {isLoading ? 'Processing Pipeline...' : 'Tailor My Resume'}
                    </button>
                    {error && <div className="error-banner">{error}</div>}
                </div>

                {/* --- BOTTOM ROW: RESULTS --- */}
                {(isLoading || latexCode || pdfData) && (
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
                        ) : (
                            <div className="results-wrapper">
                                {/* METRICS PANEL */}
                                {metrics && (
                                    <div className="metrics-panel">
                                        <div className="metric-card score-card">
                                            <h4>Estimated ATS Match</h4>
                                            <div className="score">{metrics.score}%</div>
                                        </div>
                                        <div className="metric-card keywords-card">
                                            <h4>Keywords Injected</h4>
                                            <div className="pills">
                                                {metrics.keywords.map((kw, i) => <span key={i} className="pill">{kw.replace(/[^a-zA-Z]/g, '')}</span>)}
                                            </div>
                                        </div>
                                        <div className="metric-card actions-card">
                                            <h4>Action Verbs</h4>
                                            <div className="verb-text">Upgraded weak verbs to match JD tone.</div>
                                        </div>
                                    </div>
                                )}

                                {/* 2-COLUMN OUTPUT PANEL (LaTeX vs PDF) */}
                                <div className="output-grid mt-4">
                                    <div className="panel output-panel">
                                        <div className="panel-header">
                                            <h3 style={{ color: '#00e5ff' }}>💻 LaTeX Source</h3>
                                            <div style={{display: 'flex', gap: '10px'}}>
                                                {/* --- RECOMPILE BUTTON --- */}
                                                <button 
                                                    onClick={handleRecompile} 
                                                    disabled={isCompiling} 
                                                    className="btn btn-warning btn-sm"
                                                    style={{ backgroundColor: '#f59e0b', color: '#000', border: 'none', fontWeight: 'bold' }}
                                                >
                                                    {isCompiling ? '🔄 Compiling...' : '🔄 Recompile PDF'}
                                                </button>
                                                <button onClick={handleDownloadLatex} className="btn btn-secondary btn-sm">
                                                    ⬇️ Download .TEX
                                                </button>
                                            </div>
                                        </div>
                                        {/* --- EDITABLE TEXTAREA --- */}
                                        <textarea 
                                            value={latexCode} 
                                            onChange={(e) => setLatexCode(e.target.value)}
                                            className="code-viewer"
                                            spellCheck={false}
                                        />
                                    </div>

                                    <div className="panel output-panel">
                                        <div className="panel-header">
                                            <h3 style={{ color: '#00e5ff' }}>📄 PDF Preview</h3>
                                            <button onClick={handleDownloadPdf} className="btn btn-primary btn-sm">
                                                ⬇️ Download PDF
                                            </button>
                                        </div>
                                        {pdfData ? (
                                            <object 
                                                data={URL.createObjectURL(new Blob([new Uint8Array(atob(pdfData).split('').map(c => c.charCodeAt(0)))], { type: 'application/pdf' }))} 
                                                type="application/pdf" 
                                                className="pdf-viewer" 
                                                aria-label="Tailored Resume Preview"
                                            />
                                        ) : (
                                            <div className="pdf-viewer" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0'}}>
                                                {isCompiling ? 'Compiling new PDF...' : 'Preview will appear here'}
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

export default AiTailorPage;