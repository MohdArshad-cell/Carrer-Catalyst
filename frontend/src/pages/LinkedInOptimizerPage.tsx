import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Linkedin, Copy, CheckCircle, Upload, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import { useToast } from '../components/Toast';
import { supabase } from '../supabaseClient';
import './AiTailorPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

interface ExperienceBullet {
  company: string;
  bullets: string[];
}

interface LinkedInData {
  headline: string;
  about_section: string;
  experience_bullets: ExperienceBullet[];
}

const LinkedInOptimizerPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [linkedinContent, setLinkedinContent] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [tone, setTone] = useState('Professional');
    const [optimizedData, setOptimizedData] = useState<LinkedInData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedStates(prev => ({ ...prev, [id]: true }));
        setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [id]: false }));
        }, 2000);
        showToast('Copied to clipboard!', 'success');
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            showToast('Please upload a PDF file.', 'error');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/upload-pdf`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data.extracted_text) {
                setLinkedinContent(response.data.extracted_text);
                showToast('PDF extracted successfully!', 'success');
            }
        } catch (error: any) {
            console.error('PDF upload failed:', error);
            showToast(error.response?.data?.detail || 'Failed to extract text from PDF.', 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleGenerate = async () => {
        if (!linkedinContent.trim() || !jobDescription.trim()) {
            showToast('Please provide both your current LinkedIn content and a target JD.', 'error');
            return;
        }
        
        setIsLoading(true);
        setOptimizedData(null);

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
                linkedin_content: linkedinContent,
                job_description: jobDescription,
                tone: tone
            };
            
            const response = await axios.post(`${API_BASE_URL}/api/ai/linkedin`, payload, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`, 
                    'Content-Type': 'application/json'
                }
            });
            
            const data = response.data?.linkedin_data;

            if (!data) {
                throw new Error("Invalid response format received from server.");
            }

            setOptimizedData(data);
            showToast('LinkedIn profile optimized successfully!', 'success');

        } catch (err: any) {
            console.error("Error generating LinkedIn profile:", err);
            
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

            let finalErrorMessage = "Failed to optimize profile. Ensure backend is running.";
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
                    <div className="hero-badge" style={{ background: 'rgba(0, 119, 181, 0.1)', color: '#0077b5', border: '1px solid rgba(0, 119, 181, 0.2)' }}>
                        <Linkedin size={16} style={{ display: 'inline', marginRight: '5px' }}/> Social Optimization
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(90deg, #0077b5, #00a0dc)' }}>LinkedIn Optimizer</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Transform your profile into a magnet for recruiters.</p>
                </div>

                <div className="tailor-input-grid">
                    <div className="panel glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 className="panel-title" style={{ margin: 0 }}>Current LinkedIn Profile</h2>
                            <input 
                                type="file" 
                                accept="application/pdf" 
                                style={{ display: 'none' }} 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <button 
                                className="btn-outline" 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading || isLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                            >
                                <Upload size={16} />
                                {isUploading ? 'Extracting...' : 'Upload PDF Export'}
                            </button>
                        </div>
                        <textarea
                            className="premium-textarea"
                            value={linkedinContent}
                            onChange={(e) => setLinkedinContent(e.target.value)}
                            placeholder="Upload your LinkedIn PDF export, or paste your current About section and Experience bullets here..."
                            disabled={isLoading}
                        />
                    </div>
                    <div className="panel glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 className="panel-title" style={{ margin: 0 }}>Target Role / JD</h2>
                            <div style={{ position: 'relative' }}>
                                <select 
                                    value={tone} 
                                    onChange={(e) => setTone(e.target.value)}
                                    className="premium-input"
                                    style={{ appearance: 'none', paddingRight: '2rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', padding: '0.5rem 1rem' }}
                                    disabled={isLoading}
                                >
                                    <option value="Professional">Professional Tone</option>
                                    <option value="Conversational">Conversational Tone</option>
                                    <option value="Executive & Bold">Executive & Bold</option>
                                    <option value="Story-Driven">Story-Driven</option>
                                </select>
                                <ChevronDown size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.5)' }} />
                            </div>
                        </div>
                        <textarea
                            className="premium-textarea"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the target Job Description to align your profile with..."
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="action-row text-center" style={{ margin: '3rem 0' }}>
                    <button 
                        className="btn-premium pulse-glow massive-btn" 
                        onClick={handleGenerate}
                        disabled={isLoading || !linkedinContent.trim() || !jobDescription.trim()}
                        style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', borderRadius: '50px', background: 'linear-gradient(45deg, #0077b5, #00a0dc)' }}
                    >
                        {isLoading ? 'Analyzing Profile...' : 'Optimize Profile ⚡'}
                    </button>
                </div>

                {optimizedData && (
                    <div className="output-section" style={{ maxWidth: '900px', margin: '0 auto' }}>
                        <div className="panel output-panel glass-card" style={{ padding: '2rem' }}>
                            <h3 style={{ margin: '0 0 2rem 0', color: '#0077b5', borderBottom: '1px solid rgba(0,119,181,0.2)', paddingBottom: '1rem' }}>
                                Optimized Profile Content
                            </h3>

                            <div style={{ marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ color: 'white', margin: 0 }}>Headline</h4>
                                    <button className="btn-outline" onClick={() => handleCopy(optimizedData.headline, 'headline')} style={{ padding: '0.4rem 0.8rem' }}>
                                        {copiedStates['headline'] ? <CheckCircle size={16}/> : <Copy size={16}/>} Copy
                                    </button>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                                    {optimizedData.headline}
                                </div>
                            </div>

                            <div style={{ marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ color: 'white', margin: 0 }}>About Section</h4>
                                    <button className="btn-outline" onClick={() => handleCopy(optimizedData.about_section, 'about')} style={{ padding: '0.4rem 0.8rem' }}>
                                        {copiedStates['about'] ? <CheckCircle size={16}/> : <Copy size={16}/>} Copy
                                    </button>
                                </div>
                                <div className="markdown-content" style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                    <ReactMarkdown>{optimizedData.about_section}</ReactMarkdown>
                                </div>
                            </div>

                            <div>
                                <h4 style={{ color: 'white', marginBottom: '1.5rem' }}>Experience Section</h4>
                                {optimizedData.experience_bullets.map((exp, idx) => (
                                    <div key={idx} style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h5 style={{ color: 'var(--accent-cyan)', margin: 0, fontSize: '1.1rem' }}>{exp.company}</h5>
                                            <button className="btn-outline" onClick={() => handleCopy(exp.bullets.join('\n'), `exp-${idx}`)} style={{ padding: '0.4rem 0.8rem' }}>
                                                {copiedStates[`exp-${idx}`] ? <CheckCircle size={16}/> : <Copy size={16}/>} Copy
                                            </button>
                                        </div>
                                        <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem', margin: 0, lineHeight: '1.6' }}>
                                            {exp.bullets.map((bullet, bIdx) => (
                                                <li key={bIdx} style={{ marginBottom: '0.5rem' }}>{bullet}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <Footer />
        </div>
    );
};

export default LinkedInOptimizerPage;
