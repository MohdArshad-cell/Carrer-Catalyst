import React, { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf'; 
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import './AiTailorPage.css'; 

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const CoverLetterGeneratorPage: React.FC = () => {
    const [resume, setResume] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copyButtonText, setCopyButtonText] = useState('Copy');

    const handleGenerateCoverLetter = async () => {
        if (!resume.trim() || !jobDescription.trim()) {
            setError('Please provide both your resume and the job description.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedCoverLetter('');
        setCopyButtonText('Copy');

        try {
            const payload = { resume, jobDescription };
            const response = await axios.post(`${API_BASE_URL}/api/v1/generate-cover-letter`, payload);
            
            // Defensive programming: check if the expected key exists
            if (response.data && response.data.generatedCoverLetter) {
                setGeneratedCoverLetter(response.data.generatedCoverLetter);
            } else {
                throw new Error("Invalid response format received from server.");
            }
        } catch (err) {
            console.error("Error generating cover letter:", err);
            setError('Failed to generate cover letter. Please check your connection or try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePdfDownload = () => {
        if (!generatedCoverLetter) return;
        
        const doc = new jsPDF();
        const margin = 15;
        const pageHeight = doc.internal.pageSize.height;
        
        // Wrap text to fit page width
        const textLines = doc.splitTextToSize(generatedCoverLetter, 180);
        
        let cursorY = margin;
        
        // Loop through lines to handle multi-page overflow
        textLines.forEach((line: string) => {
            if (cursorY > pageHeight - margin) {
                doc.addPage();
                cursorY = margin; // Reset Y to top of new page
            }
            doc.text(line, margin, cursorY);
            cursorY += 7; // Approximate line height
        });
        
        doc.save('Cover_Letter.pdf');
    };

    const handleCopy = () => {
        if (!generatedCoverLetter) return;
        
        navigator.clipboard.writeText(generatedCoverLetter).then(() => {
            setCopyButtonText('Copied!');
            setTimeout(() => setCopyButtonText('Copy'), 2000);
        }, (err) => {
            console.error('Could not copy text: ', err);
            setCopyButtonText('Failed!');
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
                    <p>Create a compelling cover letter tailored to any job in seconds.</p>
                </div>

                <div className="tailor-grid">
                    <div className="input-panel">
                        <h2>Your Resume</h2>
                        <textarea
                            value={resume}
                            onChange={(e) => setResume(e.target.value)}
                            placeholder="Paste your full resume text here..."
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
                        <div className="results-header">
                            <h2>Generated Cover Letter</h2>
                            <div className="results-actions">
                                <button onClick={handleCopy} disabled={!generatedCoverLetter || isLoading} className="btn btn-secondary">
                                    {copyButtonText}
                                </button>
                                <button onClick={handlePdfDownload} disabled={!generatedCoverLetter || isLoading} className="btn btn-secondary">
                                    Download PDF
                                </button>
                            </div>
                        </div>
                        <div className="results-content">
                            {isLoading && <div className="status-text">Drafting your cover letter... Please wait.</div>}
                            {error && <div className="error-text" style={{ color: '#ff4d4f' }}>{error}</div>}
                            
                            {/* Replaced <pre> with a properly styled div for readability */}
                            {generatedCoverLetter && (
                                <div 
                                    className="evaluation-output" 
                                    style={{ 
                                        whiteSpace: 'pre-wrap', 
                                        wordWrap: 'break-word', 
                                        fontFamily: 'inherit', 
                                        lineHeight: '1.6',
                                        textAlign: 'left'
                                    }}
                                >
                                    {generatedCoverLetter}
                                </div>
                            )}
                            
                            {!isLoading && !error && !generatedCoverLetter && (
                                <div className="placeholder-text">Your generated cover letter will appear here.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="tailor-action">
                    <button 
                        className="btn btn-primary" 
                        onClick={handleGenerateCoverLetter} 
                        disabled={isLoading || !resume.trim() || !jobDescription.trim()}
                    >
                        {isLoading ? 'Generating...' : 'Generate My Cover Letter'}
                    </button>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default CoverLetterGeneratorPage;