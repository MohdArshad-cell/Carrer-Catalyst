import React, { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf'; 
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import './AiTailorPage.css'; // Reusing the magical CSS from Tailor page

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

const loadingSteps = [
    "⏳ Analyzing Job Description & Identifying Pain Points...",
    "🧠 Extracting Top Matching Achievements from Resume...",
    "✍️ Drafting No-Bullshit Cover Letter..."
];

const CoverLetterGeneratorPage: React.FC = () => {
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

    // --- API CALL LOGIC ---
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

        // Progress bar simulation
        const stepInterval = setInterval(() => {
            setLoadingStep(prev => prev < 2 ? prev + 1 : prev);
        }, 3000);

        try {
            // FIXED: Using correct backend endpoint and payload keys
            const payload = { resume_text: resumeText, job_description: jobDescription };
            const response = await axios.post(`${API_BASE_URL}/api/ai/coverletter`, payload);
            
            if (response.data && response.data.cover_letter) {
                setGeneratedCoverLetter(response.data.cover_letter);
            } else {
                throw new Error("Invalid response format received from server.");
            }
        } catch (err: any) {
            console.error("Error generating cover letter:", err);
            setError(err.response?.data?.detail || 'Failed to generate cover letter. Ensure backend is running.');
        } finally {
            clearInterval(stepInterval);
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

            <div className="tailor-container">
                <div className="tailor-header">
                    <h1>AI Cover Letter Generator</h1>
                    <p>Hook recruiters instantly. Generate a "No-BS", highly targeted cover letter in seconds.</p>
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
                        onClick={handleGenerateCoverLetter} 
                        disabled={isLoading || !resumeText.trim() || !jobDescription.trim()}
                    >
                        {isLoading ? 'Drafting Letter...' : 'Generate My Cover Letter'}
                    </button>
                    {error && <div className="error-banner">{error}</div>}
                </div>

                {/* --- BOTTOM ROW: RESULTS --- */}
                {(isLoading || generatedCoverLetter) && (
                    <div className="output-grid-container">
                        <hr className="section-divider" />
                        
                        {isLoading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <h3 className="step-text">{loadingSteps[loadingStep]}</h3>
                                <div className="progress-bar-container">
                                    <div className="progress-bar" style={{ width: `${((loadingStep + 1) / 3) * 100}%` }}></div>
                                </div>
                            </div>
                        ) : (
                            <div className="panel output-panel" style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
                                <div className="panel-header">
                                    <h3 style={{ color: '#00e5ff' }}>✉️ Final Cover Letter</h3>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={handleCopy} className="btn btn-secondary btn-sm">
                                            {copyButtonText}
                                        </button>
                                        <button onClick={handlePdfDownload} className="btn btn-primary btn-sm">
                                            ⬇️ Download PDF
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Editable Textarea for Cover Letter */}
                                <textarea 
                                    value={generatedCoverLetter}
                                    onChange={(e) => setGeneratedCoverLetter(e.target.value)}
                                    className="code-viewer"
                                    style={{ 
                                        minHeight: '400px', 
                                        fontFamily: 'system-ui, sans-serif', 
                                        fontSize: '1rem', 
                                        lineHeight: '1.6', 
                                        padding: '20px',
                                        backgroundColor: '#1e293b',
                                        color: '#f8fafc',
                                        whiteSpace: 'pre-wrap'
                                    }}
                                />
                                <p style={{ textAlign: 'center', marginTop: '10px', color: '#a0aec0', fontSize: '0.85rem' }}>
                                    Feel free to edit the text above before downloading.
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