import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // ✅ Added useNavigate
import { supabase } from '../supabaseClient';   // ✅ Added Supabase
import { ResumeData } from '../types';

import TemplateSelection from '../forms/TemplateSelection';
import ProfileForm from '../forms/ProfileForm';
import EducationForm from '../forms/EducationForm';
import WorkForm from '../forms/WorkForm';
import SkillsForm from '../forms/SkillsForm';
import ProjectsForm from '../forms/ProjectsForm';
import AchievementsForm from '../forms/AchievementsForm';
import CertificationsForm from '../forms/CertificationsForm';

import './ResumeFromScratchPage.css';
import ParticleBackground from '../components/ParticleBackground';
import Navbar from '../components/Navbar'; 
import Footer from '../components/Footer'; 

const initialResumeData: ResumeData = {
    personal_info: { full_name: '', address: '', email: '', phone: '', github_handle: '', linkedin_handle: '', portfolio_url: '' },
    education: [{ id: uuidv4(), degree: '', institution: '', start_year: '', end_year: '', gpa: '' }],
    work_experience: [{ id: uuidv4(), job_title: '', company_name: '', location: '', start_date: '', end_date: '', description_points: '' }],
    projects: [{ id: uuidv4(), project_name: '', start_date: '', end_date: '', tech_stack: '', description_points: '' }],
    skills: [], achievements: [], certifications: [],
};

const navItems = ['Templates', 'Profile', 'Education', 'Work', 'Projects', 'Skills', 'Achievements', 'Certifications'];
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

const buildApiPayload = (data: ResumeData, template: string) => ({
    template_name: template.toLowerCase().replace(/ /g, '_'),
    resume_data: {
        personal_info: { 
            full_name: data.personal_info.full_name || "", 
            email: data.personal_info.email || "", 
            phone: data.personal_info.phone || "", 
            address: data.personal_info.address || "", 
            github_handle: data.personal_info.github_handle || "", 
            linkedin_handle: data.personal_info.linkedin_handle || "", 
            portfolio_url: data.personal_info.portfolio_url || "" 
        },
        education: data.education.filter(e => e.institution || e.degree).map(e => ({ 
            degree: e.degree, 
            institution: e.institution, 
            start_year: e.start_year, 
            end_year: e.end_year, 
            gpa: e.gpa 
        })),
        work_experience: data.work_experience.filter(e => e.company_name || e.job_title).map(e => ({ 
            job_title: e.job_title, 
            company_name: e.company_name, 
            location: e.location, 
            start_date: e.start_date, 
            end_date: e.end_date, 
            description_points: e.description_points 
                ? e.description_points.split('\n').map(pt => pt.trim()).filter(pt => pt !== '') 
                : [] 
        })),
        projects: data.projects.filter(p => p.project_name).map(p => ({ 
            project_name: p.project_name, 
            tech_stack: p.tech_stack, 
            start_date: p.start_date, 
            end_date: p.end_date, 
            description_points: p.description_points 
                ? p.description_points.split('\n').map(pt => pt.trim()).filter(pt => pt !== '') 
                : [] 
        })),
        skills: data.skills.filter(s => s.name).map(s => ({ 
            name: s.name, 
            value: s.value 
        })),
        achievements: data.achievements.filter(a => a.description).map(a => ({ 
            description: a.description 
        })),
        certifications: data.certifications.filter(c => c.name).map(c => ({ 
            name: c.name, 
            issuer: c.issuer, 
            date: c.date 
        }))
    }
});

interface LocalDownloadLinks {
    pdfUrl: string;
    latexUrl: string;
    jsonUrl: string;
}

const ResumeFromScratchPage: React.FC = () => {
    const navigate = useNavigate(); // ✅ Hook added for redirection

    const [activeSection, setActiveSection] = useState('Templates');
    const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
    const [selectedTemplate, setSelectedTemplate] = useState('Professional');
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [downloadLinks, setDownloadLinks] = useState<LocalDownloadLinks | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    
    const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    // Converts base64 string to a Browser Blob
    const b64toBlob = (b64Data: string, contentType = '') => {
        const byteCharacters = atob(b64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        return new Blob([new Uint8Array(byteNumbers)], { type: contentType });
    };

    const pollTask = async (taskId: string, isPreview: boolean) => {
        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/generate/status/${taskId}`);
                
                if (res.data.status === 'completed') {
                    clearInterval(interval);
                    const fileRes = await axios.get(`${API_BASE_URL}/generate/download/${taskId}`);
                    const { pdf_base64, tex_content, json_content } = fileRes.data;

                    const pdfBlob = b64toBlob(pdf_base64, 'application/pdf');
                    const pdfLocalUrl = URL.createObjectURL(pdfBlob);

                    if (isPreview) {
                        if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
                        setPreviewPdfUrl(pdfLocalUrl);
                        setIsPreviewLoading(false);
                    } else {
                        const texBlob = new Blob([tex_content], { type: 'text/plain' });
                        const jsonBlob = new Blob([json_content], { type: 'application/json' });
                        
                        setDownloadLinks({
                            pdfUrl: pdfLocalUrl,
                            latexUrl: URL.createObjectURL(texBlob),
                            jsonUrl: URL.createObjectURL(jsonBlob)
                        });
                        setIsGenerating(false);
                    }
                } else if (res.data.status === 'failed') {
                    clearInterval(interval);
                    setErrorMessage('Generation failed: ' + res.data.error);
                    isPreview ? setIsPreviewLoading(false) : setIsGenerating(false);
                }
            } catch (e) {
                clearInterval(interval);
                setErrorMessage('Connection error. Server might be down.');
                isPreview ? setIsPreviewLoading(false) : setIsGenerating(false);
            }
        }, 2000);
    };

    // --- MAIN API CALL (WITH TOLL PLAZA 🚧) ---
    const handleAction = async (isPreview: boolean) => {
        isPreview ? setIsPreviewLoading(true) : setIsGenerating(true);
        if (!isPreview) setDownloadLinks(null);
        setErrorMessage('');
        
        try {
            // 🛑 TOLL PLAZA CHECK 1: User Logged in hai?
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user) {
                setErrorMessage("You must be logged in to build your resume.");
                isPreview ? setIsPreviewLoading(false) : setIsGenerating(false);
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            // 🛑 TOLL PLAZA CHECK 2: Token deduct karo!
            try {
                await axios.post(`${API_BASE_URL}/api/deduct-token`, { 
                    user_id: user.id 
                });
            } catch (tokenErr: any) {
                // Agar 403 error aaya, matlab tokens khatam
                if (tokenErr.response?.status === 403) {
                    setErrorMessage("🚫 Tokens Empty! Redirecting to Premium upgrade...");
                    isPreview ? setIsPreviewLoading(false) : setIsGenerating(false);
                    setTimeout(() => navigate('/pricing'), 3000);
                    return;
                }
                throw tokenErr; // Koi aur error ho toh main catch block mein bhej do
            }

            // ✅ TOLL PLAZA CROSSED! Ab PDF Engine start hoga...
            const payload = buildApiPayload(resumeData, selectedTemplate);
            const startRes = await axios.post(`${API_BASE_URL}/generate/start`, payload);
            await pollTask(startRes.data.task_id, isPreview);
            
        } catch (e: any) {
            console.error("Error generating resume:", e);
            setErrorMessage('Server connection refused. Check backend.');
            isPreview ? setIsPreviewLoading(false) : setIsGenerating(false);
        }
    };

    const renderActiveForm = () => {
        switch (activeSection) {
            case 'Templates': return <TemplateSelection selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} />;
            case 'Profile': return <ProfileForm data={resumeData.personal_info} setData={(d) => setResumeData({...resumeData, personal_info: d})} />;
            case 'Education': return <EducationForm data={resumeData.education} setData={(d) => setResumeData({...resumeData, education: d})} />;
            case 'Work': return <WorkForm data={resumeData.work_experience} setData={(d) => setResumeData({...resumeData, work_experience: d})} />;
            case 'Projects': return <ProjectsForm data={resumeData.projects} setData={(d) => setResumeData({...resumeData, projects: d})} />;
            case 'Skills': return <SkillsForm data={resumeData.skills} setData={(d) => setResumeData({...resumeData, skills: d})} />;
            case 'Achievements': return <AchievementsForm data={resumeData.achievements} setData={(d) => setResumeData({...resumeData, achievements: d})} />;
            case 'Certifications': return <CertificationsForm data={resumeData.certifications} setData={(d) => setResumeData({...resumeData, certifications: d})} />;
            default: return <TemplateSelection selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} />;
        }
    };

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="scratch-studio-container" style={{ paddingTop: '100px', paddingBottom: '3rem' }}>
                
                {/* Premium Studio Header */}
                <div className="studio-header text-center" style={{ marginBottom: '2rem' }}>
                    <div className="hero-badge">
                        <span className="sparkle">⚙️</span> Workspace
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Resume Studio</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Craft your professional narrative, real-time.</p>
                </div>

                <div className="scratch-builder-layout">
                    
                    {/* Sidebar Navigation */}
                    <aside className="scratch-sidebar glass-card">
                        <nav className="sidebar-nav">
                            {navItems.map(item => (
                                <div key={item} className={`sidebar-item ${activeSection === item ? 'active' : ''}`} onClick={() => setActiveSection(item)}>
                                    {item}
                                </div>
                            ))}
                        </nav>
                        <div className="sidebar-action">
                            <button className="btn-premium pulse-glow w-100" onClick={() => handleAction(false)} disabled={isGenerating}>
                                {isGenerating ? 'Generating...' : 'MAKE RESUME'}
                            </button>
                        </div>
                    </aside>

                    {/* Main Forms Area */}
                    <main className="scratch-main-panel glass-card">
                        <div className="scratch-forms-area">
                            <h2 className="form-section-title">{activeSection}</h2>
                            {renderActiveForm()}
                        </div>
                    </main>

                    {/* Live Preview Area */}
                    <div className="scratch-preview-panel glass-card">
                        <div className="scratch-preview-sticky">
                            <div className="preview-header">
                                <h3 className="preview-title">Live Preview</h3>
                                <button className="btn-outline preview-refresh-btn" onClick={() => handleAction(true)} disabled={isPreviewLoading}>
                                    {isPreviewLoading ? 'Updating...' : '↻ Refresh'}
                                </button>
                            </div>
                            
                            {isGenerating && <div className="preview-status info-status">Processing request securely...</div>}
                            {isPreviewLoading && !isGenerating && <div className="preview-status info-status">Updating preview...</div>}
                            {errorMessage && <div className="preview-status error-status">{errorMessage}</div>}

                            {/* Premium Download Buttons */}
                            {downloadLinks && (
                                <div className="download-links-grid">
                                    <a href={downloadLinks.pdfUrl} download="Resume.pdf" className="premium-download-btn pdf-btn">📄 PDF</a>
                                    <a href={downloadLinks.latexUrl} download="Resume.tex" className="premium-download-btn latex-btn">💻 LaTeX</a>
                                    <a href={downloadLinks.jsonUrl} download="Resume.json" className="premium-download-btn json-btn">⚙️ JSON</a>
                                </div>
                            )}

                            {/* PDF Viewer */}
                            <div className="pdf-viewer-container">
                                {previewPdfUrl ? (
                                    <object data={previewPdfUrl} type="application/pdf" className="pdf-preview-object" aria-label="Resume Preview" />
                                ) : (
                                    <div className="pdf-preview-placeholder">
                                        <div className="placeholder-icon">📄</div>
                                        <p>{isPreviewLoading ? 'Rendering your resume...' : 'Fill out your details and click Refresh Preview to see the magic.'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ResumeFromScratchPage;