import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Edit3, Copy, CheckCircle, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import { useToast } from '../components/Toast';
import './AiTailorPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

interface RewriteData {
  original: string;
  rewritten: string;
  improvement_notes: string;
}

const BulletRewriterPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [bulletText, setBulletText] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [resultData, setResultData] = useState<RewriteData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        showToast('Copied to clipboard!', 'success');
    };

    const handleRewrite = async () => {
        if (!bulletText.trim()) {
            showToast('Please paste a bullet point to rewrite.', 'warning');
            return;
        }

        setIsLoading(true);
        setResultData(null);

        try {
            const payload = {
                bullet_text: bulletText,
                target_role: targetRole || "General"
            };

            // This is a FREE endpoint - no Auth header required
            const response = await axios.post(`${API_BASE_URL}/api/free/rewrite-bullet`, payload);
            
            setResultData(response.data);
            showToast('Bullet point upgraded!', 'success');

        } catch (err: any) {
            console.error("Rewrite error:", err);
            
            if (err.response?.status === 429) {
                showToast("You've reached the limit for free rewrites. Please try again later.", "warning");
            } else {
                showToast("Failed to rewrite bullet. Ensure the backend is running.", "error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="tailor-studio-container" style={{ paddingTop: '100px', paddingBottom: '3rem', maxWidth: '900px', margin: '0 auto' }}>
                
                <div className="studio-header text-center" style={{ marginBottom: '3rem' }}>
                    <div className="hero-badge" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                        <span className="sparkle">✨</span> Free Tool
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>AI Bullet Rewriter</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Turn weak, generic duties into powerful, metric-driven achievements instantly.</p>
                </div>

                <div className="panel glass-card" style={{ marginBottom: '2rem' }}>
                    <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Edit3 size={20}/> Paste a Bullet Point
                    </h2>
                    <textarea
                        className="premium-textarea"
                        value={bulletText}
                        onChange={(e) => setBulletText(e.target.value)}
                        placeholder="e.g., 'Responsible for managing social media accounts and increasing followers.'"
                        disabled={isLoading}
                        style={{ minHeight: '120px' }}
                    />
                    
                    <h2 className="panel-title" style={{ marginTop: '1.5rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                        Target Role (Optional)
                    </h2>
                    <input
                        type="text"
                        className="premium-textarea"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g., Senior Marketing Manager"
                        disabled={isLoading}
                        style={{ height: '50px', minHeight: '50px' }}
                    />
                </div>

                <div className="action-row text-center" style={{ margin: '2rem 0' }}>
                    <button 
                        className="btn-premium pulse-glow massive-btn" 
                        onClick={handleRewrite}
                        disabled={isLoading || !bulletText.trim()}
                        style={{ padding: '1rem 3rem', fontSize: '1.2rem', borderRadius: '50px' }}
                    >
                        {isLoading ? 'Upgrading...' : 'Rewrite Bullet ⚡'}
                    </button>
                </div>

                {resultData && (
                    <div className="output-section">
                        <div className="panel output-panel glass-card" style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, color: '#c084fc', fontSize: '1.5rem' }}>Optimized Result</h3>
                                <button className="btn-outline" onClick={() => handleCopy(resultData.rewritten)} style={{ padding: '0.4rem 0.8rem', color: '#c084fc', borderColor: 'rgba(168,85,247,0.4)' }}>
                                    {isCopied ? <CheckCircle size={16}/> : <Copy size={16}/>} Copy
                                </button>
                            </div>
                            
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #c084fc', color: 'white', fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                                {resultData.rewritten}
                            </div>
                            
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                                <strong>💡 Why this works:</strong> {resultData.improvement_notes}
                            </div>
                        </div>

                        {/* Upsell CTA */}
                        <div className="glass-card text-center" style={{ marginTop: '2rem', padding: '2rem', background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(0,0,0,0))' }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: 'white' }}>Want to upgrade your ENTIRE resume?</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Let our AI Tailor scan your full resume and rewrite it perfectly for any job description.</p>
                            <button className="btn-premium" onClick={() => navigate('/ai-tailor')} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                                Try Full AI Tailor <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <Footer />
        </div>
    );
};

export default BulletRewriterPage;
