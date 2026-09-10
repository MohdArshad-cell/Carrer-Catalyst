import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Map, Target, BookOpen, Clock, AlertTriangle, Settings2, FileText } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import PdfUploadButton from '../components/PdfUploadButton';
import { useToast } from '../components/Toast';
import { supabase } from '../supabaseClient';
import './AiTailorPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

interface Milestone {
  timeframe: string;
  focus: string;
  action_items: string[];
}

interface Resource {
  title: string;
  type: string;
  reason: string;
}

interface RoadmapData {
  current_assessment: string;
  skills_gap: string[];
  milestones: Milestone[];
  recommended_resources: Resource[];
}

const CareerRoadmapPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [resumeText, setResumeText] = useState('');
    const [targetGoal, setTargetGoal] = useState('');
    const [timeframe, setTimeframe] = useState('12 Months');
    const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!resumeText.trim() || !targetGoal.trim()) {
            showToast('Please provide both your resume and your target career goal.', 'error');
            return;
        }
        
        setIsLoading(true);
        setRoadmapData(null);

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
                target_goal: targetGoal,
                timeframe: timeframe
            };
            
            const response = await axios.post(`${API_BASE_URL}/api/ai/roadmap`, payload, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`, 
                    'Content-Type': 'application/json'
                }
            });
            
            const data = response.data?.roadmap_data;

            if (!data) {
                throw new Error("Invalid response format received from server.");
            }

            setRoadmapData(data);
            showToast('Career roadmap generated successfully!', 'success');

        } catch (err: any) {
            console.error("Error generating roadmap:", err);
            
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

            let finalErrorMessage = "Failed to generate roadmap. Ensure backend is running.";
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
                    <div className="hero-badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                        <Map size={16} style={{ display: 'inline', marginRight: '5px' }}/> Career Planning
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(90deg, #22c55e, #16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>Career Roadmap AI</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Map out your exact steps to promotion or pivot.</p>
                </div>

                <div className="tailor-input-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', alignItems: 'stretch' }}>
                    {/* Resume Panel */}
                    <div className="panel glass-card" style={{ position: 'relative', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #22c55e, transparent)' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className="panel-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.3rem', color: '#e2e8f0' }}>
                                <FileText size={22} color="#22c55e" /> Your Resume
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
                    
                    {/* Target Goal Panel */}
                    <div className="panel glass-card" style={{ position: 'relative', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #16a34a, transparent)' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className="panel-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.3rem', color: '#e2e8f0' }}>
                                <Target size={22} color="#16a34a" /> Target Goal
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Settings2 size={16} color="var(--text-secondary)" />
                                <select 
                                    value={timeframe} 
                                    onChange={(e) => setTimeframe(e.target.value)}
                                    disabled={isLoading}
                                    style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
                                >
                                    <option value="6 Months">6 Months</option>
                                    <option value="12 Months">12 Months</option>
                                    <option value="3 Years">3 Years</option>
                                    <option value="5 Years">5 Years</option>
                                </select>
                            </div>
                        </div>
                        <textarea
                            className="premium-textarea"
                            value={targetGoal}
                            onChange={(e) => setTargetGoal(e.target.value)}
                            placeholder="E.g., Transition from Frontend Developer to Full Stack Engineer, or getting promoted to Senior PM."
                            disabled={isLoading}
                            style={{ minHeight: '200px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1rem', color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.6', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>

                <div className="action-row text-center" style={{ margin: '3rem 0' }}>
                    <button 
                        className="btn-premium pulse-glow massive-btn" 
                        onClick={handleGenerate}
                        disabled={isLoading || !resumeText.trim() || !targetGoal.trim()}
                        style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', borderRadius: '50px', background: 'linear-gradient(45deg, #22c55e, #16a34a)' }}
                    >
                        {isLoading ? 'Plotting Trajectory...' : 'Generate Roadmap 🗺️'}
                    </button>
                </div>

                {roadmapData && (
                    <div className="output-section" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        
                        <div className="metrics-panel glass-card" style={{ marginBottom: '2rem', padding: '2rem', borderLeft: '4px solid #22c55e' }}>
                            <h3 style={{ color: '#22c55e', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Target size={24}/> Current Assessment vs Goal
                            </h3>
                            <p style={{ color: 'white', fontSize: '1.1rem', lineHeight: '1.6', margin: 0 }}>
                                {roadmapData.current_assessment}
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                            
                            {/* Skills Gap */}
                            <div className="panel glass-card">
                                <h3 style={{ color: '#ef4444', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <AlertTriangle size={20}/> Missing Skills & Gaps
                                </h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {roadmapData.skills_gap.map((skill, idx) => (
                                        <span key={idx} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '0.4rem 1rem', borderRadius: '50px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Resources */}
                            <div className="panel glass-card">
                                <h3 style={{ color: '#3b82f6', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <BookOpen size={20}/> Recommended Action Plan
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {roadmapData.recommended_resources.map((res, idx) => (
                                        <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <strong style={{ color: 'white' }}>{res.title}</strong>
                                                <span style={{ fontSize: '0.8rem', background: '#1e3a8a', color: '#93c5fd', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{res.type}</span>
                                            </div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{res.reason}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Timeline */}
                        <div className="panel glass-card">
                            <h3 style={{ color: '#22c55e', margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(34,197,94,0.2)', paddingBottom: '1rem' }}>
                                <Clock size={24}/> Execution Timeline
                            </h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {roadmapData.milestones.map((ms, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '2rem' }}>
                                        <div style={{ width: '120px', flexShrink: 0, textAlign: 'right', color: '#22c55e', fontWeight: 'bold', fontSize: '1.1rem', paddingTop: '0.2rem' }}>
                                            {ms.timeframe}
                                        </div>
                                        <div style={{ width: '2px', background: 'rgba(34,197,94,0.3)', position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: '0.5rem', left: '-5px', width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }}></div>
                                        </div>
                                        <div style={{ flexGrow: 1, background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '1.2rem' }}>{ms.focus}</h4>
                                            <ul style={{ color: 'var(--text-secondary)', margin: 0, paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                                                {ms.action_items.map((action, aIdx) => (
                                                    <li key={aIdx} style={{ marginBottom: '0.5rem' }}>{action}</li>
                                                ))}
                                            </ul>
                                        </div>
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

export default CareerRoadmapPage;
