import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
// 🚀 Reusing AiTailorPage CSS directly for exact UI match
import './AiTailorPage.css'; 

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
        const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
        return [...new Set(words.filter(w => w.length > 2 && !stopWords.includes(w)))];
    };

    const runXrayScan = () => {
        if (!resumeText.trim() || !jobDescription.trim()) return;

        setIsScanning(true);
        setScanComplete(false);

        setTimeout(() => {
            const jdKeywords = extractKeywords(jobDescription);
            const resumeKeywords = extractKeywords(resumeText);

            const matchedKeywords = jdKeywords.filter(kw => resumeKeywords.includes(kw));
            const missingKeywords = jdKeywords.filter(kw => !resumeKeywords.includes(kw));

            const matchPercentage = jdKeywords.length > 0 
                ? Math.round((matchedKeywords.length / jdKeywords.length) * 100) 
                : 0;
            setScore(matchPercentage);

            // Match highlight inline style (no external CSS dependency needed)
            let resHtml = resumeText;
            matchedKeywords.forEach(kw => {
                const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
                resHtml = resHtml.replace(regex, '<mark style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 2px 4px; border-radius: 4px; font-weight: bold;">$1</mark>');
            });
            setHighlightedResume(resHtml);

            // Miss highlight inline style
            let jdHtml = jobDescription;
            missingKeywords.forEach(kw => {
                const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
                jdHtml = jdHtml.replace(regex, '<mark style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 2px 4px; border-radius: 4px; font-weight: bold; text-decoration: underline;">$1</mark>');
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

            <div className="container content-wrapper" style={{ paddingTop: '120px', paddingBottom: '5rem' }}>
                
                {/* 🚀 Using standard page-header from your ecosystem */}
                <div className="page-header text-center fade-in-up">
                    <h1 className="hero-title animated-gradient-text" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
                        ATS X-Ray Vision
                    </h1>
                    <p className="hero-subtitle" style={{ maxWidth: '750px', margin: '1rem auto 3rem auto' }}>
                        See your resume exactly how an ATS robot sees it. Discover the hidden keywords you are missing before you hit apply.
                    </p>
                </div>

                {!scanComplete ? (
                    /* 🚀 Reusing Tailor's 'input-grid' layout */
                    <div className="input-grid fade-in-up">
                        <div className="input-section glass-card">
                            <h2 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                                Your Resume
                            </h2>
                            <textarea 
                                className="editor-textarea" 
                                placeholder="Paste your raw resume text here..."
                                value={resumeText}
                                onChange={(e) => setResumeText(e.target.value)}
                            />
                        </div>
                        <div className="input-section glass-card">
                            <h2 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                                Target Job Description
                            </h2>
                            <textarea 
                                className="editor-textarea" 
                                placeholder="Paste the target JD here..."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="xray-results fade-in-up">
                        {/* 🚀 Score Dashboard aligned with glass-card standard */}
                        <div className="input-section glass-card text-center" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: `6px solid ${score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', boxShadow: `0 0 20px ${score >= 70 ? '#10b98140' : score >= 40 ? '#f59e0b40' : '#ef444440'}` }}>
                                {score}%
                            </div>
                            <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem' }}>Keyword Match Score</h2>
                            <p style={{ color: '#a1a1aa', marginBottom: '1.5rem' }}>Aim for 75%+ to bypass strict ATS filters.</p>
                            <button className="btn-outline pulse-glow" onClick={() => setScanComplete(false)} style={{ padding: '0.6rem 2rem', borderRadius: '50px' }}>
                                🔄 New Scan
                            </button>
                        </div>

                        {/* 🚀 Reusing Tailor grid for results */}
                        <div className="input-grid">
                            <div className="input-section glass-card">
                                <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', color: '#10b981' }}>
                                    ✅ Matched in Resume
                                </h3>
                                {/* Used editor-textarea class but on a div to mimic the look while allowing HTML */}
                                <div className="editor-textarea" style={{ overflowY: 'auto', whiteSpace: 'pre-wrap', height: '100%', minHeight: '300px' }} dangerouslySetInnerHTML={{ __html: highlightedResume }}></div>
                            </div>
                            <div className="input-section glass-card">
                                <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', color: '#ef4444' }}>
                                    ❌ Missing from JD
                                </h3>
                                <div className="editor-textarea" style={{ overflowY: 'auto', whiteSpace: 'pre-wrap', height: '100%', minHeight: '300px' }} dangerouslySetInnerHTML={{ __html: highlightedJD }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {!scanComplete && (
                    <div className="text-center" style={{ marginTop: '3rem' }}>
                        <button 
                            className="btn-primary" 
                            style={{ 
                                padding: '1rem 3rem', 
                                fontSize: '1.1rem', 
                                background: isScanning ? '#3f3f46' : 'linear-gradient(135deg, #10b981, #047857)',
                                cursor: (isScanning || !resumeText || !jobDescription) ? 'not-allowed' : 'pointer',
                                opacity: (!resumeText || !jobDescription) ? 0.5 : 1
                            }}
                            onClick={runXrayScan}
                            disabled={isScanning || !resumeText || !jobDescription}
                        >
                            {isScanning ? 'Scanning Text...' : 'Activate X-Ray Vision 👁️'}
                        </button>
                    </div>
                )}
            </div>
            
            <Footer />
        </div>
    );
};

export default AtsXrayPage;