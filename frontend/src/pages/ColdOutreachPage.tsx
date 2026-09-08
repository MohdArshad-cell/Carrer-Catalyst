import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Copy, CheckCircle } from 'lucide-react';
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
                job_description: jobDescription 
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
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(90deg, #f97316, #ea580c)' }}>Cold Outreach AI</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Generate highly-converting LinkedIn notes and cold emails to get referrals.</p>
                </div>

                <div className="tailor-input-grid">
                    <div className="panel glass-card relative-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h2 className="panel-title" style={{ margin: 0 }}>Your Resume</h2>
                            <PdfUploadButton onTextExtracted={(text) => setResumeText(text)} disabled={isLoading} />
                        </div>
                        <textarea
                            className="premium-textarea"
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            placeholder="Paste your resume or upload a PDF..."
                            disabled={isLoading}
                        />
                    </div>
                    <div className="panel glass-card">
                        <h2 className="panel-title">Target Company / Job Description</h2>
                        <textarea
                            className="premium-textarea"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the target JD or just the company name and role you are applying to..."
                            disabled={isLoading}
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
                    <div className="output-section" style={{ maxWidth: '900px', margin: '0 auto' }}>
                        <div className="panel output-panel glass-card" style={{ padding: '2rem' }}>
                            <h3 style={{ margin: '0 0 2rem 0', color: '#ea580c', borderBottom: '1px solid rgba(234, 88, 12, 0.2)', paddingBottom: '1rem' }}>
                                Networking Templates
                            </h3>

                            <div style={{ marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ color: 'white', margin: 0 }}>LinkedIn Connection Note</h4>
                                    <button className="btn-outline" onClick={() => handleCopy(outreachData.linkedin_connection_note, 'linkedin')} style={{ padding: '0.4rem 0.8rem' }}>
                                        {copiedStates['linkedin'] ? <CheckCircle size={16}/> : <Copy size={16}/>} Copy
                                    </button>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                                    {outreachData.linkedin_connection_note}
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'gray' }}>Character count: {outreachData.linkedin_connection_note.length} / 300</div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ color: 'white', margin: 0 }}>Cold Email (Initial)</h4>
                                    <button className="btn-outline" onClick={() => handleCopy(`Subject: ${outreachData.cold_email.subject}\n\n${outreachData.cold_email.body}`, 'cold_email')} style={{ padding: '0.4rem 0.8rem' }}>
                                        {copiedStates['cold_email'] ? <CheckCircle size={16}/> : <Copy size={16}/>} Copy
                                    </button>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ color: 'white', marginBottom: '1rem', fontWeight: 'bold' }}>Subject: {outreachData.cold_email.subject}</div>
                                    <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                        {outreachData.cold_email.body}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ color: 'white', margin: 0 }}>Follow-Up Email (Wait 1 week)</h4>
                                    <button className="btn-outline" onClick={() => handleCopy(`Subject: ${outreachData.follow_up_email.subject}\n\n${outreachData.follow_up_email.body}`, 'follow_up')} style={{ padding: '0.4rem 0.8rem' }}>
                                        {copiedStates['follow_up'] ? <CheckCircle size={16}/> : <Copy size={16}/>} Copy
                                    </button>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ color: 'white', marginBottom: '1rem', fontWeight: 'bold' }}>Subject: {outreachData.follow_up_email.subject}</div>
                                    <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
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
