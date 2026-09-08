import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SplitSquareHorizontal, CheckCircle, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import { useToast } from '../components/Toast';
import './AiTailorPage.css';

const ResumeDiffPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [originalText, setOriginalText] = useState('');
    const [newText, setNewText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    interface DiffLine {
        type: 'added' | 'removed' | 'unchanged';
        text: string;
    }
    
    const [diffResult, setDiffResult] = useState<DiffLine[] | null>(null);
    const [stats, setStats] = useState({ added: 0, removed: 0 });

    const analyzeDiff = () => {
        if (!originalText.trim() || !newText.trim()) {
            showToast('Please provide both original and new resume text.', 'warning');
            return;
        }

        setIsAnalyzing(true);

        setTimeout(() => {
            // Simple line-by-line diff algorithm
            const origLines = originalText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const newLines = newText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            const result: DiffLine[] = [];
            let addedCount = 0;
            let removedCount = 0;

            // Very basic matching (could be improved with a real diff library)
            const origSet = new Set(origLines);
            const newSet = new Set(newLines);

            // Find removed
            origLines.forEach(line => {
                if (!newSet.has(line)) {
                    result.push({ type: 'removed', text: line });
                    removedCount++;
                } else {
                    result.push({ type: 'unchanged', text: line });
                }
            });

            // Find added
            newLines.forEach(line => {
                if (!origSet.has(line)) {
                    result.push({ type: 'added', text: line });
                    addedCount++;
                }
            });

            setDiffResult(result);
            setStats({ added: addedCount, removed: removedCount });
            
            setIsAnalyzing(false);
            showToast('Comparison complete!', 'success');
        }, 800);
    };

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="tailor-studio-container" style={{ paddingTop: '100px', paddingBottom: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
                
                <div className="studio-header text-center" style={{ marginBottom: '3rem' }}>
                    <div className="hero-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <span className="sparkle">🔍</span> Free Tool
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(90deg, #10b981, #34d399)' }}>Resume Diff Checker</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Compare your original resume against a tailored version to see exactly what changed.</p>
                </div>

                <div className="tailor-input-grid">
                    <div className="panel glass-card">
                        <h2 className="panel-title">Original Resume</h2>
                        <textarea
                            className="premium-textarea"
                            value={originalText}
                            onChange={(e) => setOriginalText(e.target.value)}
                            placeholder="Paste your original resume text..."
                            disabled={isAnalyzing}
                        />
                    </div>
                    
                    <div className="panel glass-card">
                        <h2 className="panel-title">New / Tailored Resume</h2>
                        <textarea
                            className="premium-textarea"
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            placeholder="Paste the modified resume text..."
                            disabled={isAnalyzing}
                        />
                    </div>
                </div>

                <div className="action-row text-center" style={{ margin: '3rem 0' }}>
                    <button 
                        className="btn-premium pulse-glow massive-btn" 
                        onClick={analyzeDiff}
                        disabled={isAnalyzing || !originalText.trim() || !newText.trim()}
                        style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', borderRadius: '50px', background: 'linear-gradient(45deg, #10b981, #059669)' }}
                    >
                        {isAnalyzing ? 'Comparing...' : 'Compare Resumes 🔍'}
                    </button>
                </div>

                {diffResult && (
                    <div className="output-section">
                        <div className="metrics-panel glass-card" style={{ marginBottom: '2rem', padding: '2rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            <div className="text-center">
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{stats.added}</div>
                                <div style={{ color: 'var(--text-secondary)' }}>Lines Added</div>
                            </div>
                            <div className="text-center">
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }}>{stats.removed}</div>
                                <div style={{ color: 'var(--text-secondary)' }}>Lines Removed</div>
                            </div>
                            <div className="text-center">
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{diffResult.length - stats.added - stats.removed}</div>
                                <div style={{ color: 'var(--text-secondary)' }}>Lines Unchanged</div>
                            </div>
                        </div>

                        <div className="panel glass-card" style={{ padding: '2rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', color: 'white' }}>
                                <SplitSquareHorizontal size={20}/> Diff Viewer
                            </h3>
                            
                            <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '1rem', maxHeight: '500px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                {diffResult.map((line, idx) => {
                                    if (line.type === 'added') {
                                        return <div key={idx} style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#a7f3d0', padding: '4px 8px', margin: '2px 0', borderRadius: '4px' }}>+ {line.text}</div>
                                    } else if (line.type === 'removed') {
                                        return <div key={idx} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '4px 8px', margin: '2px 0', borderRadius: '4px', textDecoration: 'line-through' }}>- {line.text}</div>
                                    } else {
                                        return <div key={idx} style={{ color: '#9ca3af', padding: '4px 8px', margin: '2px 0' }}>  {line.text}</div>
                                    }
                                })}
                            </div>
                        </div>

                        {/* Upsell CTA */}
                        <div className="glass-card text-center" style={{ marginTop: '3rem', padding: '2rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(0,0,0,0))', borderLeft: '4px solid #10b981' }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: 'white' }}>Tired of manual tailoring?</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Let our Premium AI Tailor rewrite your entire resume specifically for any job description in less than 30 seconds.</p>
                            <button className="btn-premium" onClick={() => navigate('/ai-tailor')} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                                Use AI Tailor <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <Footer />
        </div>
    );
};

export default ResumeDiffPage;
