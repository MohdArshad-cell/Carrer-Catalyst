import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import PdfUploadButton from '../components/PdfUploadButton';
import { useToast } from '../components/Toast';
import './AiTailorPage.css';

const JobFitScorePage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Result State
    const [score, setScore] = useState<number | null>(null);
    const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
    const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);

    const analyzeFit = () => {
        if (!resumeText.trim() || !jobDescription.trim()) {
            showToast('Please provide both resume and job description.', 'warning');
            return;
        }

        setIsAnalyzing(true);

        // Simulate processing time
        setTimeout(() => {
            const resumeLower = resumeText.toLowerCase();
            const jdLower = jobDescription.toLowerCase();

            // Very basic heuristic keyword extraction
            // In a real app, this would use a robust NLP library or API
            const words = jdLower.match(/\b([a-z0-9]+)\b/g) || [];
            
            // Filter out common stop words and keep words > 4 chars to approximate keywords
            const stopWords = ['this', 'that', 'with', 'from', 'your', 'have', 'more', 'will', 'about', 'which', 'their', 'other', 'what'];
            
            const potentialKeywords = Array.from(new Set(words))
                .filter(w => w.length > 4 && !stopWords.includes(w))
                .slice(0, 30); // Grab top 30 potential keywords

            const matched: string[] = [];
            const missing: string[] = [];

            potentialKeywords.forEach(kw => {
                if (resumeLower.includes(kw)) {
                    matched.push(kw);
                } else {
                    missing.push(kw);
                }
            });

            // Calculate score based on keyword match density
            const total = matched.length + missing.length;
            const calculatedScore = total > 0 ? Math.round((matched.length / total) * 100) : 0;

            setMatchedKeywords(matched.slice(0, 10)); // Show top 10
            setMissingKeywords(missing.slice(0, 10));   // Show top 10
            setScore(calculatedScore);
            
            setIsAnalyzing(false);
            showToast('Analysis complete!', 'success');

        }, 1500);
    };

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="tailor-studio-container" style={{ paddingTop: '100px', paddingBottom: '3rem', maxWidth: '1000px', margin: '0 auto' }}>
                
                <div className="studio-header text-center" style={{ marginBottom: '3rem' }}>
                    <div className="hero-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <span className="sparkle">🎯</span> Free Analysis Tool
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}>Job Fit Calculator</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Instantly see if your resume matches a specific job description. 100% free, runs securely in your browser.</p>
                </div>

                <div className="tailor-input-grid">
                    <div className="panel glass-card relative-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h2 className="panel-title" style={{ margin: 0 }}>Your Resume</h2>
                            <PdfUploadButton onTextExtracted={setResumeText} disabled={isAnalyzing} />
                        </div>
                        <textarea
                            className="premium-textarea"
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            placeholder="Paste your resume text here..."
                            disabled={isAnalyzing}
                        />
                    </div>
                    
                    <div className="panel glass-card">
                        <h2 className="panel-title">Target Job Description</h2>
                        <textarea
                            className="premium-textarea"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the job description here..."
                            disabled={isAnalyzing}
                        />
                    </div>
                </div>

                <div className="action-row text-center" style={{ margin: '3rem 0' }}>
                    <button 
                        className="btn-premium pulse-glow massive-btn" 
                        onClick={analyzeFit}
                        disabled={isAnalyzing || !resumeText.trim() || !jobDescription.trim()}
                        style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', borderRadius: '50px', background: 'linear-gradient(45deg, #3b82f6, #2563eb)' }}
                    >
                        {isAnalyzing ? 'Analyzing Fit...' : 'Calculate Fit Score 📊'}
                    </button>
                </div>

                {score !== null && (
                    <div className="output-section">
                        <div className="metrics-panel glass-card text-center" style={{ marginBottom: '2rem', padding: '3rem' }}>
                            <h2 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1rem' }}>Your Fit Score</h2>
                            <div style={{ 
                                fontSize: '5rem', 
                                fontWeight: '900', 
                                color: score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444',
                                textShadow: `0 0 40px ${score >= 75 ? 'rgba(34,197,94,0.4)' : score >= 50 ? 'rgba(234,179,8,0.4)' : 'rgba(239,68,68,0.4)'}`
                            }}>
                                {score}%
                            </div>
                            <p style={{ fontSize: '1.2rem', color: 'white', marginTop: '1rem' }}>
                                {score >= 75 ? '🔥 Strong Match! You are highly competitive for this role.' : 
                                 score >= 50 ? '⚠️ Moderate Match. You should add missing keywords before applying.' : 
                                 '❌ Weak Match. Your resume needs significant tailoring.'}
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div className="panel glass-card">
                                <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                    <XCircle size={20}/> Missing Keywords
                                </h3>
                                {missingKeywords.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {missingKeywords.map((kw, i) => (
                                            <span key={i} style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '0.4rem 0.8rem', borderRadius: '50px', fontSize: '0.9rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--text-secondary)' }}>No major keywords missing!</p>
                                )}
                            </div>

                            <div className="panel glass-card">
                                <h3 style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                    <CheckCircle size={20}/> Matched Keywords
                                </h3>
                                {matchedKeywords.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {matchedKeywords.map((kw, i) => (
                                            <span key={i} style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac', padding: '0.4rem 0.8rem', borderRadius: '50px', fontSize: '0.9rem', border: '1px solid rgba(34,197,94,0.2)' }}>
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--text-secondary)' }}>No keywords matched.</p>
                                )}
                            </div>
                        </div>

                        {/* Upsell CTA */}
                        <div className="glass-card text-center" style={{ marginTop: '3rem', padding: '2rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(0,0,0,0))', borderLeft: '4px solid #3b82f6' }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: 'white' }}>Fix your score instantly with AI</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Our Premium AI Tailor will rewrite your resume to naturally include these missing keywords and guarantee a 90%+ ATS score.</p>
                            <button className="btn-premium" onClick={() => navigate('/ai-tailor')} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                                Upgrade Resume Automatically <ArrowRight size={18} />
                            </button>
                        </div>

                    </div>
                )}
            </div>
            
            <Footer />
        </div>
    );
};

export default JobFitScorePage;
