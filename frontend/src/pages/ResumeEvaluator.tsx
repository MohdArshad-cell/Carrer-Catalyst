import React, { useState } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import Navbar from '../components/Navbar';       
import Footer from '../components/Footer';       
import ParticleBackground from '../components/ParticleBackground'; 
import './AiTailorPage.css'; 

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const AtsEvaluatorPage: React.FC = () => {
    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [evaluationResult, setEvaluationResult] = useState(''); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copyButtonText, setCopyButtonText] = useState('Copy');

    const handleEvaluateResume = async () => {
        if (!resumeText.trim() || !jobDescription.trim()) {
            setError('Please provide both your resume and the job description.');
            return;
        }
        setIsLoading(true);
        setError('');
        setEvaluationResult('');
        setCopyButtonText('Copy');

        try {
            const payload = { resume: resumeText, jobDescription: jobDescription };
            const response = await axios.post(`${API_BASE_URL}/api/v1/evaluate-resume`, payload);
            
            // Defensive programming: Check if the key actually exists
            if (response.data && response.data.evaluation) {
                setEvaluationResult(response.data.evaluation);
            } else {
                throw new Error("Invalid response format received from server.");
            }
        } catch (err) {
            console.error("Error evaluating resume:", err);
            setError('Failed to get evaluation. Please check your connection or try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTxtDownload = () => {
        if (!evaluationResult) return;
        const blob = new Blob([evaluationResult], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'ATS_Evaluation_Report.txt'); 
    };

    const handleCopy = () => {
        if (!evaluationResult) return;
        navigator.clipboard.writeText(evaluationResult).then(() => {
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
                    <h1>AI ATS Evaluator</h1>
                    <p>Get an instant analysis of your resume against any job description.</p>
                </div>

                <div className="tailor-grid">
                    <div className="input-panel">
                        <h2>Your Resume</h2>
                        <textarea
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
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
                            <h2>Evaluation Report</h2>
                            <div className="results-actions">
                                <button onClick={handleCopy} disabled={!evaluationResult || isLoading} className="btn btn-secondary">
                                    {copyButtonText}
                                </button>
                                <button onClick={handleTxtDownload} disabled={!evaluationResult || isLoading} className="btn btn-secondary">
                                    Download TXT
                                </button>
                            </div>
                        </div>
                        <div className="results-content">
                            {isLoading && <div className="status-text">Analyzing your profile... Please wait.</div>}
                            {error && <div className="error-text" style={{ color: '#ff4d4f' }}>{error}</div>}
                            
                            {/* Replaced <pre> with a stylized div to prevent layout breakage and improve readability */}
                            {evaluationResult && (
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
                                    {evaluationResult}
                                </div>
                            )}
                            
                            {!isLoading && !error && !evaluationResult && (
                                <div className="placeholder-text">Your evaluation report will appear here.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="tailor-action">
                    <button 
                        className="btn btn-primary" 
                        onClick={handleEvaluateResume} 
                        disabled={isLoading || !resumeText.trim() || !jobDescription.trim()}
                    >
                        {isLoading ? 'Analyzing...' : 'Evaluate My Resume'}
                    </button>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default AtsEvaluatorPage;