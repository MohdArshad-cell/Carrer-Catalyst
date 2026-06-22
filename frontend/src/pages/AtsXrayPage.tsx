import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import './AiTailorPage.css'; 

const stopWords = new Set(['and', 'the', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with', 'i', 'you', 'it', 'not', 'or', 'be', 'are', 'from', 'at', 'as', 'your', 'all', 'have', 'new', 'more', 'an', 'was', 'we', 'will', 'home', 'can', 'us', 'about', 'if', 'page', 'my', 'has', 'search', 'free', 'but', 'our', 'one', 'other', 'do', 'no', 'information', 'time', 'they', 'site', 'he', 'up', 'may', 'what', 'which', 'their', 'news', 'out', 'use', 'any', 'there', 'see', 'only', 'so', 'his', 'when', 'contact', 'here', 'business', 'who', 'web', 'also', 'now', 'help', 'get', 'pm', 'view', 'online', 'first', 'am', 'been', 'would', 'how', 'were', 'me', 's', 'services', 'some', 'these', 'click', 'its', 'like', 'service', 'x', 'than', 'find', 'price', 'date', 'back', 'top', 'people', 'had', 'list', 'name', 'just', 'over', 'state', 'year', 'day', 'into', 'email', 'two', 'health', 'n', 'world', 're', 'next', 'used', 'go', 'b', 'work', 'last', 'most', 'products', 'music', 'buy', 'data', 'make', 'them', 'should', 'product', 'system', 'post', 'her', 'city', 't', 'add', 'policy', 'number', 'such', 'please', 'available', 'copyright', 'support', 'message', 'after', 'best', 'software', 'then', 'jan', 'good', 'video', 'well', 'd', 'where', 'info', 'rights', 'public', 'books', 'high', 'school', 'through', 'm', 'each', 'links', 'she', 'review', 'years', 'order', 'very', 'privacy', 'book', 'items', 'company', 'read', 'group', 'sex', 'need', 'many', 'user', 'said', 'de', 'does', 'set', 'under', 'general', 'research', 'university', 'january', 'mail', 'full', 'map', 'reviews', 'program', 'life']);

const AtsXrayPage: React.FC = () => {
    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [score, setScore] = useState(0);

    const [highlightedResume, setHighlightedResume] = useState('');
    const [highlightedJD, setHighlightedJD] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // --- DRAG & DROP LOGIC ---
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => { setIsDragging(false); };
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
        }
    };

    // --- LIGHTWEIGHT EDGE-COMPUTE NLP ---
    
    // 1. Algorithmic Stemmer: Removes plurals and tenses so "Developing" matches "Developed"
    const normalizeWord = (word: string): string => {
        let w = word.toLowerCase();
        if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
        if (w.endsWith('ing') && w.length > 4) return w.slice(0, -3);
        if (w.endsWith('ed') && w.length > 3) return w.slice(0, -2);
        if (w.endsWith('s') && w.length > 3 && !w.endsWith('ss')) return w.slice(0, -1);
        return w;
    };

    // 2. Extracts unique stems from text for mathematical comparison
    const extractStems = (text: string): Set<string> => {
        const words = text.toLowerCase().match(/\b[a-z0-9]+\b/g) || [];
        const validWords = words.filter(w => w.length > 2 && !stopWords.has(w));
        return new Set(validWords.map(normalizeWord));
    };

    // 3. Security: Escapes HTML to prevent XSS attacks before we inject `<mark>` tags
    const escapeHtml = (unsafe: string) => {
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };

    // 4. Smart Highlighter: Replaces words ONLY if their grammatical root matches our target sets
    const injectHighlights = (rawText: string, targetStems: Set<string>, color: string, bgColor: string) => {
        const safeText = escapeHtml(rawText);
        return safeText.replace(/\b([a-zA-Z0-9]+)\b/g, (match) => {
            const stem = normalizeWord(match);
            if (targetStems.has(stem) && !stopWords.has(match.toLowerCase())) {
                return `<mark style="background: ${bgColor}; color: ${color}; padding: 2px 4px; border-radius: 4px; border-bottom: 2px solid ${color}; font-weight: bold;">${match}</mark>`;
            }
            return match;
        });
    };

    const runXrayScan = () => {
        if (!resumeText.trim() || !jobDescription.trim()) return;

        setIsScanning(true);
        setScanComplete(false);

        // Simulated processing time for UI effect (Data crunching happens instantly)
        setTimeout(() => {
            // Get root stems for both texts
            const jdStems = extractStems(jobDescription);
            const resumeStems = extractStems(resumeText);

            // Find intersections and gaps using Mathematical Sets
            const matchedStems = new Set([...jdStems].filter(stem => resumeStems.has(stem)));
            const missingStems = new Set([...jdStems].filter(stem => !resumeStems.has(stem)));

            // Calculate score based on core semantic match
            const matchPercentage = jdStems.size > 0 
                ? Math.round((matchedStems.size / jdStems.size) * 100) 
                : 0;
            setScore(matchPercentage);

            // Apply Smart Highlighting
            const highlightedRes = injectHighlights(resumeText, matchedStems, '#34d399', 'rgba(16, 185, 129, 0.2)');
            setHighlightedResume(highlightedRes);

            const highlightedJDHtml = injectHighlights(jobDescription, missingStems, '#fb7185', 'rgba(239, 68, 68, 0.2)');
            setHighlightedJD(highlightedJDHtml);

            setIsScanning(false);
            setScanComplete(true);
        }, 1500);
    };

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="tailor-studio-container" style={{ paddingTop: '100px', paddingBottom: '3rem', maxWidth: '96%', margin: '0 auto' }}>
                
                <div className="studio-header text-center" style={{ marginBottom: '3rem' }}>
                    <div className="hero-badge" style={{ borderColor: '#10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                        <span className="sparkle">👁️</span> Local Edge Scanner
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>ATS X-Ray Vision</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>See your resume exactly how an ATS robot sees it. Discover hidden missing keywords instantly.</p>
                </div>

                {!scanComplete ? (
                    <>
                        <div className="tailor-input-grid">
                            <div className="panel glass-card relative-panel">
                                <h2 className="panel-title">Your Resume (Text or JSON)</h2>
                                <textarea
                                    className={`drop-zone premium-textarea ${isDragging ? 'drag-active' : ''}`}
                                    value={resumeText}
                                    onChange={(e) => setResumeText(e.target.value)}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    placeholder='Paste your raw resume text or drag & drop a .txt/.json file here...'
                                    disabled={isScanning}
                                />
                            </div>
                            <div className="panel glass-card">
                                <h2 className="panel-title">Target Job Description</h2>
                                <textarea
                                    className="premium-textarea"
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Paste the target JD here..."
                                    disabled={isScanning}
                                />
                            </div>
                        </div>

                        <div className="action-row text-center" style={{ margin: '3rem 0' }}>
                            <button 
                                className="btn-premium pulse-glow massive-btn" 
                                onClick={runXrayScan} 
                                disabled={isScanning || !resumeText.trim() || !jobDescription.trim()}
                                style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', borderRadius: '50px', background: 'linear-gradient(135deg, #10b981, #047857)' }}
                            >
                                {isScanning ? 'Running Local NLP Engine...' : 'Activate X-Ray Vision 👁️'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="output-section">
                        <div className="results-wrapper">
                            
                            {/* SCORE DASHBOARD */}
                            <div className="metrics-panel glass-card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2rem' }}>
                                <h4>ATS Keyword Match Score</h4>
                                <div className="score-circle" style={{ 
                                    width: '100px', height: '100px', margin: '1rem auto', 
                                    borderColor: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444',
                                    boxShadow: `0 0 20px ${score >= 70 ? '#10b98140' : score >= 40 ? '#f59e0b40' : '#ef444440'}`
                                }}>
                                    <span className="score-text" style={{ fontSize: '2rem' }}>{score}%</span>
                                </div>
                                <p style={{ color: 'var(--text-secondary)' }}>Aim for 75%+ to bypass strict ATS filters.</p>
                                <button className="btn-outline" onClick={() => setScanComplete(false)} style={{ marginTop: '1rem' }}>
                                    🔄 New Scan
                                </button>
                            </div>

                            <div className="tailor-input-grid">
                                <div className="panel output-panel glass-card">
                                    <div className="panel-header" style={{ marginBottom: '1rem' }}>
                                        <h3 style={{ margin: 0, color: '#10b981' }}>✅ Matched in Resume</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '5px 0 0 0' }}>These words successfully bypassed the ATS filters.</p>
                                    </div>
                                    <div 
                                        className="code-viewer-premium" 
                                        style={{ overflowY: 'auto', whiteSpace: 'pre-wrap', minHeight: '400px', fontFamily: "'Inter', sans-serif", fontSize: '1rem', lineHeight: '1.6' }} 
                                        dangerouslySetInnerHTML={{ __html: highlightedResume }}
                                    ></div>
                                </div>

                                <div className="panel output-panel glass-card">
                                    <div className="panel-header" style={{ marginBottom: '1rem' }}>
                                        <h3 style={{ margin: 0, color: '#ef4444' }}>❌ Missing from JD</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '5px 0 0 0' }}>The ATS is looking for these exact concepts. Add them.</p>
                                    </div>
                                    <div 
                                        className="code-viewer-premium" 
                                        style={{ overflowY: 'auto', whiteSpace: 'pre-wrap', minHeight: '400px', fontFamily: "'Inter', sans-serif", fontSize: '1rem', lineHeight: '1.6' }} 
                                        dangerouslySetInnerHTML={{ __html: highlightedJD }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <Footer />
        </div>
    );
};

export default AtsXrayPage;