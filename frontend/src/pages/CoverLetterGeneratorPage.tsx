import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import { supabase } from '../supabaseClient';
import './AiTailorPage.css'; // Reusing the magical CSS from Tailor page

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

const loadingSteps = [
    "⏳ Analyzing Job Description & Identifying Pain Points...",
    "🧠 Extracting Top Matching Achievements from Resume...",
    "✍️ Drafting No-Bullshit Cover Letter..."
];

const CoverLetterGeneratorPage: React.FC = () => {
    const navigate = useNavigate(); // ✅ Hook added for redirection

    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [latexCode, setLatexCode] = useState<string>('');
    const [pdfData, setPdfData] = useState<string | null>(null);
    
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
    const handleGenerateCoverLetter = async () => {
        if (!resumeText.trim() || !jobDescription.trim()) {
            setError('Please provide both your resume and the job description.');
            return;
        }
        
        setIsLoading(true);
        setError('');
        setLatexCode('');
        setPdfData(null);
        setLoadingStep(0);

        let stepInterval: any = null; // Initialize safely so it can be cleared on error

        try {
            // 🛑 TOLL PLAZA CHECK 1: Ensure User is Logged In
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user || !session) {
                setError("You must be logged in to use this AI tool.");
                setIsLoading(false);
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            // ⚠️ DOUBLE DEDUCTION FIX: Manual /api/deduct-token call removed.
            // Backend gatekeeper will automatically check balance and deduct exactly 1 token upon success.

            // ✅ Start Loading Animation
            stepInterval = setInterval(() => {
                setLoadingStep(prev => prev < 2 ? prev + 1 : prev);
            }, 3000);

            const payload = { resume_text: resumeText, job_description: jobDescription };
            
            // ✅ API CALL WITH HEADERS: Sending the session token to the FastAPI Gatekeeper
            const response = await axios.post(`${API_BASE_URL}/api/ai/coverletter`, payload, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (stepInterval) clearInterval(stepInterval); 
            
            if (response.data && response.data.cover_letter && response.data.cover_letter.pdf_base64) {
                setLatexCode(response.data.cover_letter.latex_code);
                setPdfData(response.data.cover_letter.pdf_base64);
            } else {
                throw new Error("Invalid response format received from server.");
            }
        } catch (err: any) {
            if (stepInterval) clearInterval(stepInterval); // Prevent infinite loading loop on failure
            console.error("Error generating cover letter:", err);
            
            // ✅ HANDLE EMPTY TOKENS OR UNAUTHORIZED SESSIONS
            if (err.response?.status === 402 || err.response?.status === 401 || err.response?.status === 403) {
                setError("🚫 Tokens Empty or Session Expired! Redirecting to Premium upgrade...");
                setIsLoading(false);
                setTimeout(() => navigate('/pricing'), 3000);
                return;
            }

            setError(err.response?.data?.detail || 'Failed to generate cover letter. Ensure backend is running.');
        } finally {
            setIsLoading(false);
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
        link.download = 'Tailored_Cover_Letter.pdf';
        link.click();
    };

    const handleDownloadLatex = () => {
        if (!latexCode) return;
        const blob = new Blob([latexCode], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Cover_Letter.tex';
        link.click();
    };

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="tailor-studio-container" style={{ paddingTop: '100px', paddingBottom: '3rem', maxWidth: '96%', margin: '0 auto' }}>
                
                <div className="studio-header text-center" style={{ marginBottom: '3rem' }}>
                    <div className="hero-badge" style={{ borderColor: '#8b5cf6', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' }}>
                        <span className="sparkle">✉️</span> Pitch Perfect
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>AI Cover Letter Generator</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Hook recruiters instantly. Generate a "No-BS", highly targeted cover letter in seconds.</p>
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
                        onClick={handleGenerateCoverLetter} 
                        disabled={isLoading || !resumeText.trim() || !jobDescription.trim()}
                        style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', borderRadius: '50px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
                    >
                        {isLoading ? 'Drafting Letter...' : 'Generate My Cover Letter ✍️'}
                    </button>
                    {error && <div className="error-status" style={{ marginTop: '1rem', fontSize: '1.1rem' }}>{error}</div>}
                </div>

                {(isLoading || latexCode || pdfData) && (
                    <div className="output-section">
                        {isLoading ? (
                            <div className="loading-state glass-card text-center" style={{ padding: '4rem', maxWidth: '600px', margin: '0 auto' }}>
                                <div className="spinner-premium" style={{ borderTopColor: '#8b5cf6' }}></div>
                                <h3 className="step-text" style={{ color: '#8b5cf6', margin: '1.5rem 0' }}>{loadingSteps[loadingStep]}</h3>
                                <div className="progress-bar-container">
                                    <div className="progress-bar-fill" style={{ width: `${((loadingStep + 1) / 3) * 100}%`, background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)' }}></div>
                                </div>
                            </div>
                        ) : (
                            <div className="results-wrapper">
                                <div className="tailor-output-grid">
                                    <div className="panel output-panel glass-card">
                                        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3 style={{ margin: 0, color: '#8b5cf6' }}>💻 LaTeX Source</h3>
                                            <button onClick={handleDownloadLatex} className="btn-outline">
                                                ⬇️ .TEX
                                            </button>
                                        </div>
                                        <textarea 
                                            value={latexCode} 
                                            readOnly
                                            className="code-viewer-premium"
                                            spellCheck={false}
                                        />
                                    </div>

                                    <div className="panel output-panel glass-card">
                                        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3 style={{ margin: 0, color: '#3b82f6' }}>📄 PDF Preview</h3>
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
                                                    aria-label="Cover Letter Preview"
                                                />
                                            ) : (
                                                <div className="pdf-preview-placeholder">
                                                    Preview will appear here
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

export default CoverLetterGeneratorPage;