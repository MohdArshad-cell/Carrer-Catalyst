import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileText, Copy, CheckCircle, ArrowRight, Download } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import { useToast } from '../components/Toast';
import './AiTailorPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

interface LetterData {
  subject_line: string;
  letter_body: string;
}

const ResignationLetterPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [employeeName, setEmployeeName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [lastDate, setLastDate] = useState('');
    const [tone, setTone] = useState('professional');
    const [reason, setReason] = useState('');
    
    const [resultData, setResultData] = useState<LetterData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        showToast('Copied to clipboard!', 'success');
    };

    const handleDownload = () => {
        if (!resultData) return;
        const textToSave = `Subject: ${resultData.subject_line}\n\n${resultData.letter_body}`;
        const blob = new Blob([textToSave], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Resignation_Letter_${companyName.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleGenerate = async () => {
        if (!employeeName.trim() || !companyName.trim() || !lastDate.trim()) {
            showToast('Please fill in your name, company name, and last working day.', 'warning');
            return;
        }

        setIsLoading(true);
        setResultData(null);

        try {
            const payload = {
                employee_name: employeeName,
                company_name: companyName,
                last_date: lastDate,
                tone: tone,
                reason: reason
            };

            const response = await axios.post(`${API_BASE_URL}/api/free/resignation-letter`, payload);
            
            setResultData(response.data);
            showToast('Letter generated successfully!', 'success');

        } catch (err: any) {
            console.error("Letter generation error:", err);
            if (err.response?.status === 429) {
                showToast("Rate limit exceeded. Please try again later.", "warning");
            } else {
                showToast("Failed to generate letter.", "error");
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

            <div className="tailor-studio-container" style={{ paddingTop: '100px', paddingBottom: '3rem', maxWidth: '800px', margin: '0 auto' }}>
                
                <div className="studio-header text-center" style={{ marginBottom: '3rem' }}>
                    <div className="hero-badge" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                        <span className="sparkle">✉️</span> Free Tool
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(90deg, #ec4899, #f43f5e)' }}>Resignation Letter Generator</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Draft a perfect, bridge-building resignation letter in seconds.</p>
                </div>

                <div className="panel glass-card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Your Name *</label>
                            <input 
                                type="text" 
                                className="premium-textarea" 
                                style={{ minHeight: '50px' }} 
                                value={employeeName} 
                                onChange={e => setEmployeeName(e.target.value)} 
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Company Name *</label>
                            <input 
                                type="text" 
                                className="premium-textarea" 
                                style={{ minHeight: '50px' }} 
                                value={companyName} 
                                onChange={e => setCompanyName(e.target.value)} 
                                placeholder="Acme Corp"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Last Working Day *</label>
                            <input 
                                type="text" 
                                className="premium-textarea" 
                                style={{ minHeight: '50px' }} 
                                value={lastDate} 
                                onChange={e => setLastDate(e.target.value)} 
                                placeholder="e.g., October 31st, 2026"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Tone</label>
                            <select 
                                className="premium-textarea" 
                                style={{ minHeight: '50px', background: 'rgba(0,0,0,0.4)' }}
                                value={tone}
                                onChange={e => setTone(e.target.value)}
                            >
                                <option value="professional">Professional & Standard</option>
                                <option value="grateful">Grateful & Warm</option>
                                <option value="brief">Short & Brief</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Reason for Leaving (Optional)</label>
                        <input 
                            type="text" 
                            className="premium-textarea" 
                            style={{ minHeight: '50px' }} 
                            value={reason} 
                            onChange={e => setReason(e.target.value)} 
                            placeholder="e.g., Relocating, New opportunity, Going back to school"
                        />
                    </div>
                </div>

                <div className="action-row text-center" style={{ margin: '2rem 0' }}>
                    <button 
                        className="btn-premium pulse-glow massive-btn" 
                        onClick={handleGenerate}
                        disabled={isLoading || !employeeName || !companyName || !lastDate}
                        style={{ padding: '1rem 3rem', fontSize: '1.2rem', borderRadius: '50px', background: 'linear-gradient(45deg, #ec4899, #e11d48)' }}
                    >
                        {isLoading ? 'Drafting...' : 'Generate Letter ⚡'}
                    </button>
                </div>

                {resultData && (
                    <div className="output-section">
                        <div className="panel glass-card" style={{ padding: '2rem', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, color: '#ec4899', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={20}/> Draft Ready
                                </h3>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn-outline" onClick={() => handleCopy(resultData.letter_body)} style={{ padding: '0.4rem 0.8rem', color: '#ec4899', borderColor: 'rgba(236,72,153,0.4)' }}>
                                        {isCopied ? <CheckCircle size={16}/> : <Copy size={16}/>} Copy
                                    </button>
                                    <button className="btn-outline" onClick={handleDownload} style={{ padding: '0.4rem 0.8rem', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>
                                        <Download size={16}/> Save .txt
                                    </button>
                                </div>
                            </div>
                            
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #ec4899', color: 'white', fontSize: '1.1rem', lineHeight: '1.6' }}>
                                <strong>Subject:</strong> {resultData.subject_line}
                                <hr style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1rem 0' }} />
                                <div style={{ whiteSpace: 'pre-wrap' }}>{resultData.letter_body}</div>
                            </div>
                        </div>

                        {/* Upsell CTA */}
                        <div className="glass-card text-center" style={{ marginTop: '2rem', padding: '2rem', background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(0,0,0,0))' }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: 'white' }}>Starting a new job hunt?</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Make sure your resume is ready. Use our Premium AI tools to build, tailor, and optimize your resume for your next role.</p>
                            <button className="btn-premium" onClick={() => navigate('/AiTools')} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                                View AI Toolkit <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <Footer />
        </div>
    );
};

export default ResignationLetterPage;
