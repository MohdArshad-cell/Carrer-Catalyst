import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import './AtsXrayPage.css';

const stopWords = ['and', 'the', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with', 'i', 'you', 'it', 'not', 'or', 'be', 'are', 'from', 'at', 'as', 'your', 'all', 'have', 'new', 'more', 'an', 'was', 'we', 'will', 'home', 'can', 'us', 'about', 'if', 'page', 'my', 'has', 'search', 'free', 'but', 'our', 'one', 'other', 'do', 'no', 'information', 'time', 'they', 'site', 'he', 'up', 'may', 'what', 'which', 'their', 'news', 'out', 'use', 'any', 'there', 'see', 'only', 'so', 'his', 'when', 'contact', 'here', 'business', 'who', 'web', 'also', 'now', 'help', 'get', 'pm', 'view', 'online', 'first', 'am', 'been', 'would', 'how', 'were', 'me', 's', 'services', 'some', 'these', 'click', 'its', 'like', 'service', 'x', 'than', 'find', 'price', 'date', 'back', 'top', 'people', 'had', 'list', 'name', 'just', 'over', 'state', 'year', 'day', 'into', 'email', 'two', 'health', 'n', 'world', 're', 'next', 'used', 'go', 'b', 'work', 'last', 'most', 'products', 'music', 'buy', 'data', 'make', 'them', 'should', 'product', 'system', 'post', 'her', 'city', 't', 'add', 'policy', 'number', 'such', 'please', 'available', 'copyright', 'support', 'message', 'after', 'best', 'software', 'then', 'jan', 'good', 'video', 'well', 'd', 'where', 'info', 'rights', 'public', 'books', 'high', 'school', 'through', 'm', 'each', 'links', 'she', 'review', 'years', 'order', 'very', 'privacy', 'book', 'items', 'company', 'read', 'group', 'sex', 'need', 'many', 'user', 'said', 'de', 'does', 'set', 'under', 'general', 'research', 'university', 'january', 'mail', 'full', 'map', 'reviews', 'program', 'life'];

const AtsXrayPage: React.FC = () => {
    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [score, setScore] = useState(0);

    const [highlightedResume, setHighlightedResume] = useState('');
    const [highlightedJD, setHighlightedJD] = useState('');

    const extractKeywords = (text: string) => {
        // Remove punctuation and convert to lowercase
        const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
        // Filter out short words and stop words
        return [...new Set(words.filter(w => w.length > 2 && !stopWords.includes(w)))];
    };

    const runXrayScan = () => {
        if (!resumeText.trim() || !jobDescription.trim()) return;

        setIsScanning(true);
        setScanComplete(false);

        // Simulate a cool scanning delay
        setTimeout(() => {
            const jdKeywords = extractKeywords(jobDescription);
            const resumeKeywords = extractKeywords(resumeText);

            const matchedKeywords = jdKeywords.filter(kw => resumeKeywords.includes(kw));
            const missingKeywords = jdKeywords.filter(kw => !resumeKeywords.includes(kw));

            // Calculate Score
            const matchPercentage = jdKeywords.length > 0 
                ? Math.round((matchedKeywords.length / jdKeywords.length) * 100) 
                : 0;
            setScore(matchPercentage);

            // Highlight Resume (Show matches in Green)
            let resHtml = resumeText;
            matchedKeywords.forEach(kw => {
                const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
                resHtml = resHtml.replace(regex, '<mark class="match-green">$1</mark>');
            });
            setHighlightedResume(resHtml);

            // Highlight JD (Show missing in Red)
            let jdHtml = jobDescription;
            missingKeywords.forEach(kw => {
                const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
                jdHtml = jdHtml.replace(regex, '<mark class="miss-red">$1</mark>');
            });
            setHighlightedJD(jdHtml);

            setIsScanning(false);
            setScanComplete(true);
        }, 1500);
    };

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="xray-container">
                <div className="studio-header text-center fade-in-up">
                    <div className="hero-badge pulse-border" style={{ borderColor: '#10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                        <span className="sparkle">👁️</span> 100% Free Tool
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
                        ATS X-Ray Vision.
                    </h1>
                    <p style={{ color: '#a1a1aa', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
                        See your resume exactly how an ATS robot sees it. Discover the hidden keywords you are missing before you hit apply.
                    </p>
                </div>

                {!scanComplete ? (
                    <div className="xray-input-grid fade-in-up">
                        <div className="glass-panel">
                            <h3 className="panel-heading">Your Resume</h3>
                            <textarea 
                                className="sleek-textarea" 
                                placeholder="Paste your resume text here..."
                                value={resumeText}
                                onChange={(e) => setResumeText(e.target.value)}
                            />
                        </div>
                        <div className="glass-panel">
                            <h3 className="panel-heading">Target Job Description</h3>
                            <textarea 
                                className="sleek-textarea" 
                                placeholder="Paste the Job Description here..."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="xray-results fade-in-up">
                        <div className="score-dashboard glass-panel">
                            <div className="score-circle" style={{ borderColor: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444' }}>
                                {score}%
                            </div>
                            <div className="score-info">
                                <h2>Keyword Match Score</h2>
                                <p>Aim for 75%+ to bypass strict ATS filters.</p>
                            </div>
                            <button className="btn-outline reset-btn" onClick={() => setScanComplete(false)}>
                                🔄 New Scan
                            </button>
                        </div>

                        <div className="xray-input-grid">
                            <div className="glass-panel">
                                <h3 className="panel-heading text-emerald-400">✅ Matched in Resume</h3>
                                <div className="html-viewer" dangerouslySetInnerHTML={{ __html: highlightedResume }}></div>
                            </div>
                            <div className="glass-panel">
                                <h3 className="panel-heading text-rose-400">❌ Missing from JD</h3>
                                <div className="html-viewer" dangerouslySetInnerHTML={{ __html: highlightedJD }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {!scanComplete && (
                    <div className="text-center mt-4">
                        <button 
                            className={`btn-xray-scan ${isScanning ? 'scanning' : ''}`} 
                            onClick={runXrayScan}
                            disabled={isScanning || !resumeText || !jobDescription}
                        >
                            {isScanning ? 'Scanning Text...' : 'Activate X-Ray Vision 👁️'}
                            {isScanning && <div className="scan-line"></div>}
                        </button>
                    </div>
                )}
            </div>
            
            <Footer />
        </div>
    );
};

export default AtsXrayPage;