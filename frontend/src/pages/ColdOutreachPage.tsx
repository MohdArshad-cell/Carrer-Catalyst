import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Copy, CheckCircle, FileText, Target, MessageSquare, Settings2, Sparkles, Send, Calendar } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import PdfUploadButton from '../components/PdfUploadButton';
import { useToast } from '../components/Toast';
import { supabase } from '../supabaseClient';
import './AiTailorPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

interface OutreachData {
  linkedin_connection_note: string;
  cold_email: {
    subject: string;
    body: string;
  };
  follow_up_email: {
    subject: string;
    body: string;
  };
}

const ColdOutreachPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [tone, setTone] = useState('Professional');
    const [outreachData, setOutreachData] = useState<OutreachData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedStates(prev => ({ ...prev, [id]: true }));
        setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [id]: false }));
        }, 2000);
        showToast('Copied to clipboard!', 'success');
    };

    const handleGenerate = async () => {
        if (!resumeText.trim() || !jobDescription.trim()) {
            showToast('Please provide both your resume and the target company/JD.', 'error');
            return;
        }
        
        setIsLoading(true);
        setOutreachData(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user || !session) {
                showToast("You must be logged in to use this AI tool.", "warning");
                setIsLoading(false);
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            const payload = { 
                resume_text: resumeText,
                job_description: jobDescription,
                tone: tone
            };
            
            const response = await axios.post(`${API_BASE_URL}/api/ai/outreach`, payload, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`, 
                    'Content-Type': 'application/json'
                }
            });
            
            const data = response.data?.outreach_data;

            if (!data) {
                throw new Error("Invalid response format received from server.");
            }

            setOutreachData(data);
            showToast('Outreach templates generated successfully!', 'success');

        } catch (err: any) {
            console.error("Error generating outreach:", err);
            
            if (err.response?.status === 402 || err.response?.status === 401 || err.response?.status === 403) {
                showToast("🚫 Tokens Empty or Session Expired! Redirecting to Premium upgrade...", "error");
                setIsLoading(false);
                setTimeout(() => navigate('/pricing'), 3000);
                return;
            }

            if (err.response?.status === 429) {
                showToast("Too many requests. Please wait a moment.", "warning");
                setIsLoading(false);
                return;
            }

            let finalErrorMessage = "Failed to generate outreach. Ensure backend is running.";
            try {
                const detail = err.response?.data?.detail;
                if (detail) {
                    finalErrorMessage = typeof detail === "string" ? detail : JSON.stringify(detail);
                }
            } catch (e) {}

            showToast(finalErrorMessage, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="tailor-studio-container" style={{ paddingTop: '100px', paddingBottom: '3rem', maxWidth: '96%', margin: '0 auto' }}>
                
                <div className="studio-header text-center" style={{ marginBottom: '3rem' }}>
                    <div className="hero-badge" style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c', border: '1px solid rgba(234, 88, 12, 0.2)' }}>
                        <Mail size={16} style={{ display: 'inline', marginRight: '5px' }}/> Networking
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(90deg, #f97316, #ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>Cold Outreach AI</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Generate highly-converting LinkedIn notes and cold emails to get referrals.</p>
                </div>

                <div className="tailor-input-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', alignItems: 'stretch' }}>
                    <div className="panel glass-card" style={{ position: 'relative', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #f97316, transparent)' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className="panel-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.3rem', color: '#e2e8f0' }}>
                                <FileText size={22} color="#f97316" /> Your Resume
                            </h2>
                            <PdfUploadButton onTextExtracted={(text) => setResumeText(text)} disabled={isLoading} />
                        </div>
                        <textarea
                            className="premium-textarea"
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            placeholder="Paste your resume or upload a PDF..."
                            disabled={isLoading}
                            style={{ minHeight: '200px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1rem', color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.6', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div className="panel glass-card" style={{ position: 'relative', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #ea580c, transparent)' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className="panel-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.3rem', color: '#e2e8f0' }}>
                                <Target size={22} color="#ea580c" /> Target Role
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Settings2 size={16} color="var(--text-secondary)" />
                                <select 
                                    value={tone} 
                                    onChange={(e) => setTone(e.target.value)}
                                    disabled={isLoading}
                                    style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
                                >
                                    <option value="Professional">Professional</option>
                                    <option value="Enthusiastic & Bold">Enthusiastic & Bold</option>
                                    <option value="Story-Driven">Story-Driven</option>
                                    <option value="Direct & Concise">Direct & Concise</option>
                                </select>
                            </div>
                        </div>
                        <textarea
                            className="premium-textarea"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the target JD or just the company name and role you are applying to..."
                            disabled={isLoading}
                            style={{ minHeight: '200px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1rem', color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.6', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>

                <div className="action-row text-center" style={{ margin: '3rem 0' }}>
                    <button 
                        className="btn-premium pulse-glow massive-btn" 
                        onClick={handleGenerate}
                        disabled={isLoading || !resumeText.trim() || !jobDescription.trim()}
                        style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', borderRadius: '50px', background: 'linear-gradient(45deg, #f97316, #ea580c)' }}
                    >
                        {isLoading ? 'Crafting Outreach...' : 'Generate Messages 🚀'}
                    </button>
                </div>

                {outreachData && (
                    <div className="output-section" style={{ marginTop: '3rem', animation: 'fadeInUp 0.6s ease-out', maxWidth: '1000px', margin: '0 auto' }}>
                        <div className="panel output-panel glass-card" style={{ padding: '3rem', borderRadius: '16px', background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.7), rgba(30, 41, 59, 0.5))', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <h3 style={{ margin: '0 0 2.5rem 0', color: '#ea580c', borderBottom: '1px solid rgba(234, 88, 12, 0.2)', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.6rem' }}>
                                <Sparkles size={26} /> Networking Templates
                            </h3>

                            {/* LinkedIn Note Panel */}
                            <div style={{ marginBottom: '2.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', borderLeft: '4px solid #0a66c2', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                                        <MessageSquare size={18} color="#0a66c2"/> LinkedIn Connection Note
                                    </h4>
                                    <button className="btn-outline" onClick={() => handleCopy(outreachData.linkedin_connection_note, 'linkedin')} style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '6px' }}>
                                        {copiedStates['linkedin'] ? <CheckCircle size={14} color="#10b981"/> : <Copy size={14}/>} {copiedStates['linkedin'] ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <div style={{ padding: '1.5rem', color: '#e2e8f0', fontSize: '1.05rem', lineHeight: '1.6' }}>
                                    {outreachData.linkedin_connection_note}
                                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'gray', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: outreachData.linkedin_connection_note.length <= 300 ? '#10b981' : '#ef4444' }}></div>
                                        {outreachData.linkedin_connection_note.length} / 300 characters
                                    </div>
                                </div>
                            </div>

                            {/* Cold Email Panel */}
                            <div style={{ marginBottom: '2.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', borderLeft: '4px solid #f97316', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                                        <Send size={18} color="#f97316"/> Cold Email (Initial)
                                    </h4>
                                    <button className="btn-outline" onClick={() => handleCopy(`Subject: ${outreachData.cold_email.subject}\n\n${outreachData.cold_email.body}`, 'cold_email')} style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '6px' }}>
                                        {copiedStates['cold_email'] ? <CheckCircle size={14} color="#10b981"/> : <Copy size={14}/>} {copiedStates['cold_email'] ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{ color: 'white', marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.1rem', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Subject: {outreachData.cold_email.subject}</div>
                                    <div style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: '1.7', fontSize: '1.05rem' }}>
                                        {outreachData.cold_email.body}
                                    </div>
                                </div>
                            </div>

                            {/* Follow Up Panel */}
                            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', borderLeft: '4px solid #8b5cf6', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                                        <Calendar size={18} color="#8b5cf6"/> Follow-Up Email (Wait 1 week)
                                    </h4>
                                    <button className="btn-outline" onClick={() => handleCopy(`Subject: ${outreachData.follow_up_email.subject}\n\n${outreachData.follow_up_email.body}`, 'follow_up')} style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '6px' }}>
                                        {copiedStates['follow_up'] ? <CheckCircle size={14} color="#10b981"/> : <Copy size={14}/>} {copiedStates['follow_up'] ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{ color: 'white', marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.1rem', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Subject: {outreachData.follow_up_email.subject}</div>
                                    <div style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: '1.7', fontSize: '1.05rem' }}>
                                        {outreachData.follow_up_email.body}
                                    </div>
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

export default ColdOutreachPage;
