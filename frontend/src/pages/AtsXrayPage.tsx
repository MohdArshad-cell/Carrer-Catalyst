import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import './AiTailorPage.css'; 

// Standard English + HR/Resume Fluff Stop Words
const stopWords = new Set([
    // Standard English
    'and', 'the', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with', 'i', 'you', 'it', 'not', 'or', 'be', 'are', 'from', 'at', 'as', 'your', 'all', 'have', 'new', 'more', 'an', 'was', 'we', 'will', 'home', 'can', 'us', 'about', 'if', 'page', 'my', 'has', 'search', 'free', 'but', 'our', 'one', 'other', 'do', 'no', 'information', 'time', 'they', 'site', 'he', 'up', 'may', 'what', 'which', 'their', 'news', 'out', 'use', 'any', 'there', 'see', 'only', 'so', 'his', 'when', 'contact', 'here', 'business', 'who', 'web', 'also', 'now', 'help', 'get', 'pm', 'view', 'online', 'first', 'am', 'been', 'would', 'how', 'were', 'me', 's', 'services', 'some', 'these', 'click', 'its', 'like', 'service', 'x', 'than', 'find', 'price', 'date', 'back', 'top', 'people', 'had', 'list', 'name', 'just', 'over', 'state', 'year', 'day', 'into', 'email', 'two', 'health', 'n', 'world', 're', 'next', 'used', 'go', 'b', 'work', 'last', 'most', 'products', 'music', 'buy', 'data', 'make', 'them', 'should', 'product', 'system', 'post', 'her', 'city', 't', 'add', 'policy', 'number', 'such', 'please', 'available', 'copyright', 'support', 'message', 'after', 'best', 'software', 'then', 'jan', 'good', 'video', 'well', 'd', 'where', 'info', 'rights', 'public', 'books', 'high', 'school', 'through', 'm', 'each', 'links', 'she', 'review', 'years', 'order', 'very', 'privacy', 'book', 'items', 'company', 'read', 'group', 'sex', 'need', 'many', 'user', 'said', 'de', 'does', 'set', 'under', 'general', 'research', 'university', 'january', 'mail', 'full', 'map', 'reviews', 'program', 'life',
    
    // --- HR & JD FLUFF WORDS ---
    'role', 'overview', 'looking', 'highly', 'motivated', 'junior', 'senior', 'join', 'team', 
    'required', 'requirements', 'qualifications', 'currently', 'pursuing', 'recently', 'completed', 
    'degree', 'bachelor', 'master', 'related', 'fields', 'experience', 'strong', 'hands', 
    'understanding', 'familiarity', 'key', 'responsibilities', 'working', 'knowledge', 'proven', 
    'track', 'record', 'ability', 'skills', 'plus', 'bonus', 'preferred', 'ideal', 'candidate', 
    'including', 'environment', 'fast', 'paced', 'excellent', 'communication', 'written', 'verbal',
    'must', 'have', 'minimum', 'maximum', 'e.g', 'etc', 'build', 'design', 'optimize', 'complex', 
    'tasks', 'deep', 'core', 'infrastructure'
]);

const scanMessages = [
    "Initializing X-Ray Optics...",
    "Isolating Grammatical Roots...",
    "Cross-referencing ATS Rulesets...",
    "Highlighting Semantic Matches..."
];

const AtsXrayPage: React.FC = () => {
    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    
    // UI States
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessageIdx, setScanMessageIdx] = useState(0);
    const [scanComplete, setScanComplete] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Data States
    const [score, setScore] = useState(0);
    const [foundKeywords, setFoundKeywords] = useState<string[]>([]);
    const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
    const [highlightedResume, setHighlightedResume] = useState('');
    const [highlightedJD, setHighlightedJD] = useState('');

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
    const normalizeWord = (word: string): string => {
        let w = word.toLowerCase();
        if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
        if (w.endsWith('ing') && w.length > 4) return w.slice(0, -3);
        if (w.endsWith('ed') && w.length > 3) return w.slice(0, -2);
        if (w.endsWith('s') && w.length > 3 && !w.endsWith('ss')) return w.slice(0, -1);
        return w;
    };

    const extractStemsMap = (text: string): Map<string, string> => {
        // Returns a map of { stem: originalWord } to keep the UI looking nice
        const words = text.match(/\b[a-zA-Z0-9]+\b/g) || [];
        const stemMap = new Map<string, string>();
        words.forEach(w => {
            const lower = w.toLowerCase();
            if (lower.length > 2 && !stopWords.has(lower)) {
                const stem = normalizeWord(lower);
                if (!stemMap.has(stem)) stemMap.set(stem, w);
            }
        });
        return stemMap;
    };

    const escapeHtml = (unsafe: string) => unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const injectHighlights = (rawText: string, targetStems: Set<string>, type: 'found' | 'missing') => {
        const safeText = escapeHtml(rawText);
        
        // Premium Neon Glow Styling
        const foundStyle = `background: rgba(16, 185, 129, 0.15); color: #6ee7b7; text-shadow: 0 0 8px rgba(16, 185, 129, 0.4); padding: 2px 6px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.4); font-weight: 600;`;
        const missingStyle = `background: rgba(239, 68, 68, 0.15); color: #fca5a5; text-shadow: 0 0 8px rgba(239, 68, 68, 0.4); padding: 2px 6px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.4); font-weight: 600;`;
        
        const style = type === 'found' ? foundStyle : missingStyle;

        return safeText.replace(/\b([a-zA-Z0-9]+)\b/g, (match) => {
            if (targetStems.has(normalizeWord(match)) && !stopWords.has(match.toLowerCase())) {
                return `<mark style="${style}">${match}</mark>`;
            }
            // Dim the non-matched text slightly to make the highlights pop
            return `<span style="opacity: 0.85">${match}</span>`;
        });
    };

    const runXrayScan = () => {
        if (!resumeText.trim() || !jobDescription.trim()) return;

        setIsScanning(true);
        setScanComplete(false);
        setScanMessageIdx(0);

        // UI Theater: Cycle through loading messages
        const msgInterval = setInterval(() => {
            setScanMessageIdx(prev => (prev < scanMessages.length - 1 ? prev + 1 : prev));
        }, 600);

        setTimeout(() => {
            clearInterval(msgInterval);

            const jdMap = extractStemsMap(jobDescription);
            const resumeMap = extractStemsMap(resumeText);

            const jdStems = new Set(jdMap.keys());
            const resumeStems = new Set(resumeMap.keys());

            const matchedStems = new Set([...jdStems].filter(stem => resumeStems.has(stem)));
            const missingStems = new Set([...jdStems].filter(stem => !resumeStems.has(stem)));

            // Save actual words for the UI Pill clouds
            setFoundKeywords(Array.from(matchedStems).map(stem => jdMap.get(stem) || stem));
            setMissingKeywords(Array.from(missingStems).map(stem => jdMap.get(stem) || stem));

            const matchPercentage = jdStems.size > 0 ? Math.round((matchedStems.size / jdStems.size) * 100) : 0;
            setScore(matchPercentage);

            setHighlightedResume(injectHighlights(resumeText, matchedStems, 'found'));
            setHighlightedJD(injectHighlights(jobDescription, missingStems, 'missing'));

            setIsScanning(false);
            setScanComplete(true);
        }, 2500); // 2.5 seconds of "theater" to make it feel valuable
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

                {!scanComplete && !isScanning ? (
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
                                />
                            </div>
                            <div className="panel glass-card">
                                <h2 className="panel-title">Target Job Description</h2>
                                <textarea
                                    className="premium-textarea"
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Paste the target JD here..."
                                />
                            </div>
                        </div>

                        <div className="action-row text-center" style={{ margin: '3rem 0' }}>
                            <button 
                                className="btn-premium pulse-glow massive-btn" 
                                onClick={runXrayScan} 
                                disabled={!resumeText.trim() || !jobDescription.trim()}
                                style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', borderRadius: '50px', background: 'linear-gradient(135deg, #10b981, #047857)' }}
                            >
                                Activate X-Ray Vision 👁️
                            </button>
                        </div>
                    </>
                ) : isScanning ? (
                    <div className="scan-theater" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
                        <div className="scanner-beam"></div>
                        <h2 className="pulse-text-green" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Scanning Document...</h2>
                        <p style={{ color: '#6ee7b7', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                            {scanMessages[scanMessageIdx]}
                        </p>
                    </div>
                ) : (
                    <div className="output-section">
                        <div className="results-wrapper">
                            
                            {/* NEW: TOP SUMMARY DASHBOARD */}
                            <div className="dashboard-wrapper" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2rem' }}>
                                
                                {/* SCORE CARD */}
                                <div className="metrics-panel glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Lexical Match Score</h3>
                                    <div className="score-circle" style={{ 
                                        width: '120px', height: '120px', margin: '1.5rem 0', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                                        border: `6px solid ${score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'}`,
                                        boxShadow: `0 0 30px ${score >= 70 ? '#10b98140' : score >= 40 ? '#f59e0b40' : '#ef444440'}`
                                    }}>
                                        <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff' }}>{score}%</span>
                                    </div>
                                    <button className="btn-outline" onClick={() => { setScanComplete(false); setIsScanning(false); }} style={{ marginTop: '0.5rem', padding: '8px 24px', borderRadius: '20px' }}>
                                        🔄 Scan Again
                                    </button>
                                </div>

                                {/* KEYWORD PILL CLOUDS */}
                                <div className="panel glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <h4 style={{ color: '#10b981', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>✅</span> Discovered Keywords
                                        </h4>
                                        <div className="pills-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {foundKeywords.slice(0, 15).map((kw, i) => (
                                                <span key={i} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>{kw}</span>
                                            ))}
                                            {foundKeywords.length > 15 && <span style={{ color: '#10b981', fontSize: '0.9rem', alignSelf: 'center' }}>+{foundKeywords.length - 15} more</span>}
                                        </div>
                                    </div>
                                    
                                    <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <h4 style={{ color: '#ef4444', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>❌</span> Missing Keywords
                                        </h4>
                                        <div className="pills-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {missingKeywords.slice(0, 15).map((kw, i) => (
                                                <span key={i} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>{kw}</span>
                                            ))}
                                            {missingKeywords.length > 15 && <span style={{ color: '#ef4444', fontSize: '0.9rem', alignSelf: 'center' }}>+{missingKeywords.length - 15} more</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DOCUMENT HIGHLIGHTS */}
                            <div className="tailor-input-grid">
                                <div className="panel output-panel glass-card">
                                    <div className="panel-header" style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(16,185,129,0.2)', paddingBottom: '1rem' }}>
                                        <h3 style={{ margin: 0, color: '#10b981' }}>X-Ray: Resume Match</h3>
                                    </div>
                                    <div 
                                        className="code-viewer-premium custom-scrollbar" 
                                        style={{ overflowY: 'auto', whiteSpace: 'pre-wrap', height: '500px', fontFamily: "'Inter', sans-serif", fontSize: '1rem', lineHeight: '1.8', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px' }} 
                                        dangerouslySetInnerHTML={{ __html: highlightedResume }}
                                    ></div>
                                </div>

                                <div className="panel output-panel glass-card">
                                    <div className="panel-header" style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(239,68,68,0.2)', paddingBottom: '1rem' }}>
                                        <h3 style={{ margin: 0, color: '#ef4444' }}>X-Ray: JD Gaps</h3>
                                    </div>
                                    <div 
                                        className="code-viewer-premium custom-scrollbar" 
                                        style={{ overflowY: 'auto', whiteSpace: 'pre-wrap', height: '500px', fontFamily: "'Inter', sans-serif", fontSize: '1rem', lineHeight: '1.8', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px' }} 
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