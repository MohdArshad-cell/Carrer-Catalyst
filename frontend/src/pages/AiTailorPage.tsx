import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import './AiTailorPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

const AiTailorPage: React.FC = () => {
    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Naye state variables backend response ke liye
    const [latexCode, setLatexCode] = useState<string>('');
    const [pdfData, setPdfData] = useState<string | null>(null);

    const handleTailorResume = async () => {
        if (!resumeText.trim() || !jobDescription.trim()) {
            setError('Please provide both your resume and the job description.');
            return;
        }
        
        setIsLoading(true);
        setError('');
        setLatexCode('');
        setPdfData(null);

        try {
            // Backend endpoint ko exact match kiya gaya hai
            const payload = { 
                resume_text: resumeText, 
                job_description: jobDescription 
            };
            
            const response = await axios.post(`${API_BASE_URL}/api/ai/tailor`, payload);
            
            if (response.data && response.data.latex_code && response.data.pdf_base64) {
                setLatexCode(response.data.latex_code);
                setPdfData(response.data.pdf_base64);
            } else {
                throw new Error("Invalid response format received from server.");
            }
        } catch (err: any) {
            console.error("Error tailoring resume:", err);
            setError(err.response?.data?.detail || 'Failed to tailor resume. Ensure backend is running and data is JSON-formatted.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPdf = () => {
        if (!pdfData) return;
        const byteCharacters = atob(pdfData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
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
                    <p>Instantly optimize your structured JSON resume against any job description.</p>
                </div>

                <div className="tailor-grid">
                    <div className="input-panel">
                        <h2>Your Resume (JSON)</h2>
                        <textarea
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            placeholder="Paste your strict JSON resume data here..."
                            disabled={isLoading}
                        />
                    </div>
                    <div className="input-panel">
                        <h2>Job Description</h2>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the target job description here..."
                            disabled={isLoading}
                        />
                    </div>
                    
                    <div className="results-panel">
                        <div className="results-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2>Tailored Output</h2>
                            <div className="results-actions" style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={handleDownloadLatex} 
                                    disabled={!latexCode || isLoading} 
                                    className="btn btn-secondary"
                                >
                                    💻 Download LaTeX
                                </button>
                                <button 
                                    onClick={handleDownloadPdf} 
                                    disabled={!pdfData || isLoading} 
                                    className="btn btn-primary"
                                >
                                    📄 Download PDF
                                </button>
                            </div>
                        </div>
                        
                        <div className="results-content" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {isLoading && <div className="status-text">Analyzing JD, Micro-Tailoring, and Compiling PDF...</div>}
                            {error && <div className="error-text" style={{ color: '#ff4d4f' }}>{error}</div>}
                            
                            {latexCode && (
                                <div className="latex-preview-container">
                                    <h4 style={{ marginBottom: '5px', color: '#00e5ff' }}>Generated LaTeX Code:</h4>
                                    <textarea 
                                        readOnly 
                                        value={latexCode} 
                                        style={{
                                            width: '100%', 
                                            height: '200px', 
                                            fontFamily: 'monospace', 
                                            padding: '10px',
                                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                            color: '#a9b7c6',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </div>
                            )}

                            {pdfData && (
                                <div className="pdf-preview-container" style={{ flexGrow: 1 }}>
                                    <h4 style={{ marginBottom: '5px', color: '#00e5ff' }}>PDF Preview:</h4>
                                    <object 
                                        data={URL.createObjectURL(new Blob([new Uint8Array(atob(pdfData).split('').map(c => c.charCodeAt(0)))], { type: 'application/pdf' }))} 
                                        type="application/pdf" 
                                        className="pdf-preview-object" 
                                        aria-label="Tailored Resume Preview"
                                        style={{ 
                                            width: '100%', 
                                            height: '400px', 
                                            borderRadius: '8px', 
                                            border: '1px solid rgba(255,255,255,0.1)' 
                                        }} 
                                    />
                                </div>
                            )}
                            
                            {!isLoading && !error && !latexCode && (
                                <div className="placeholder-text">Your tailored LaTeX code and PDF preview will appear here.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="tailor-action">
                    <button 
                        className="btn btn-primary" 
                        onClick={handleTailorResume} 
                        disabled={isLoading || !resumeText.trim() || !jobDescription.trim()}
                    >
                        {isLoading ? 'Processing Pipeline...' : 'Tailor My Resume'}
                    </button>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default AiTailorPage;