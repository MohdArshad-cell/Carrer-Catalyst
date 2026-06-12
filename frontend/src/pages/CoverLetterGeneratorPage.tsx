import React, { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf'; 
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
    const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [error, setError] = useState('');
    const [copyButtonText, setCopyButtonText] = useState('📋 Copy Text');
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
        setGeneratedCoverLetter('');
        setCopyButtonText('📋 Copy Text');
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
                setLoadingStep(prev => prev < 2 ? prev + 1 : prev);
            }, 3000);

            const payload = { resume_text: resumeText, job_description: jobDescription };
            const response = await axios.post(`${API_BASE_URL}/api/ai/coverletter`, payload);
            
            clearInterval(stepInterval); // Loading rok do
            
            if (response.data && response.data.cover_letter) {
                setGeneratedCoverLetter(response.data.cover_letter);
            } else {
                throw new Error("Invalid response format received from server.");
            }
        } catch (err: any) {
            console.error("Error generating cover letter:", err);
            setError(err.response?.data?.detail || 'Failed to generate cover letter. Ensure backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- PDF EXPORT LOGIC ---
    const handlePdfDownload = () => {
        if (!generatedCoverLetter) return;
        
        const doc = new jsPDF();
        const margin = 15;
        const pageHeight = doc.internal.pageSize.height;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);

        // Wrap text to fit page width
        const textLines = doc.splitTextToSize(generatedCoverLetter, 180);
        
        let cursorY = margin + 10;
        
        // Loop through lines to handle multi-page overflow
        textLines.forEach((line: string) => {
            if (cursorY > pageHeight - margin) {
                doc.addPage();
                cursorY = margin + 10; 
            }
            doc.text(line, margin, cursorY);
            cursorY += 6; // Standard line height
        });
        
        doc.save('Tailored_Cover_Letter.pdf');
    };

    // --- COPY LOGIC ---
    const handleCopy = () => {
        if (!generatedCoverLetter) return;
        
        navigator.clipboard.writeText(generatedCoverLetter).then(() => {
            setCopyButtonText('✅ Copied!');
            setTimeout(() => setCopyButtonText('📋 Copy Text'), 2000);
        }, (err) => {
            console.error('Could not copy text: ', err);
            setCopyButtonText('❌ Failed!');
        });
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

                {(isLoading || generatedCoverLetter) && (
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
                            <div className="panel glass-card" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ margin: 0, color: '#8b5cf6', fontSize: '1.5rem' }}>✉️ Final Cover Letter</h3>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={handleCopy} className="btn-outline" style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
                                            {copyButtonText}
                                        </button>
                                        <button onClick={handlePdfDownload} className="btn-premium" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
                                            ⬇️ Download PDF
                                        </button>
                                    </div>
                                </div>
                                
                                <textarea 
                                    value={generatedCoverLetter}
                                    onChange={(e) => setGeneratedCoverLetter(e.target.value)}
                                    className="premium-textarea"
                                    style={{ 
                                        minHeight: '600px', 
                                        fontFamily: "'Inter', system-ui, sans-serif", 
                                        fontSize: '1.05rem', 
                                        lineHeight: '1.8', 
                                        padding: '2rem',
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        color: '#e2e8f0'
                                    }}
                                />
                                <p style={{ textAlign: 'center', margin: '1rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Feel free to edit the text above directly before copying or downloading.
                                </p>
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