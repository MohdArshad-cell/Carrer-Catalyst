import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
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
        personal_info: { fullName: data.personal_info.full_name || "", email: data.personal_info.email || "", phone: data.personal_info.phone || "", address: data.personal_info.address || "", github: data.personal_info.github_handle || "", linkedin: data.personal_info.linkedin_handle || "", portfolioUrl: data.personal_info.portfolio_url || "" },
        education: data.education.filter(e => e.institution || e.degree).map(e => ({ degree: e.degree, institution: e.institution, startYear: e.start_year, endYear: e.end_year, grade: e.gpa })),
        workExperience: data.work_experience.filter(e => e.company_name || e.job_title).map(e => ({ role: e.job_title, company: e.company_name, location: e.location, startDate: e.start_date, endDate: e.end_date, descriptionPoints: e.description_points ? e.description_points.split('\n') : [] })),
        projects: data.projects.filter(p => p.project_name).map(p => ({ projectName: p.project_name, tech_stack: p.tech_stack, startDate: p.start_date, endDate: p.end_date, descriptionPoints: p.description_points ? p.description_points.split('\n') : [] })),
        skills: data.skills.filter(s => s.name).map(s => ({ name: s.name, value: s.value })),
        achievements: data.achievements.filter(a => a.description).map(a => ({ description: a.description })),
        certifications: data.certifications.filter(c => c.name).map(c => ({ name: c.name, issuer: c.issuer, date: c.date }))
    }
});

interface LocalDownloadLinks {
    pdfUrl: string;
    latexUrl: string;
    jsonUrl: string;
}

const ResumeFromScratchPage: React.FC = () => {
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

    const handleAction = async (isPreview: boolean) => {
        isPreview ? setIsPreviewLoading(true) : setIsGenerating(true);
        if (!isPreview) setDownloadLinks(null);
        setErrorMessage('');
        
        try {
            const payload = buildApiPayload(resumeData, selectedTemplate);
            const startRes = await axios.post(`${API_BASE_URL}/generate/start`, payload);
            await pollTask(startRes.data.task_id, isPreview);
        } catch (e) {
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

            <div className="scratch-builder-container">
                <aside className="scratch-sidebar">
                    <a href="/" className="sidebar-logo">Resume Builder</a>
                    <nav>
                        {navItems.map(item => (
                            <div key={item} className={`sidebar-item ${activeSection === item ? 'active' : ''}`} onClick={() => setActiveSection(item)}>
                                {item}
                            </div>
                        ))}
                    </nav>
                    <div className="sidebar-action">
                        <button className="btn btn-primary" onClick={() => handleAction(false)} disabled={isGenerating}>
                            {isGenerating ? 'Generating...' : 'MAKE RESUME'}
                        </button>
                    </div>
                </aside>

                <main className="scratch-main-panel">
                    <div className="scratch-forms-area">{renderActiveForm()}</div>

                    <div className="scratch-preview-area">
                        <div className="scratch-preview-sticky">
                            <div className="preview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>Live Preview</h3>
                                <button className="btn btn-secondary btn-sm" onClick={() => handleAction(true)} disabled={isPreviewLoading} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>
                                    {isPreviewLoading ? 'Updating...' : '↻ Refresh Preview'}
                                </button>
                            </div>
                            
                            {isGenerating && <div className="preview-status">Processing request securely...</div>}
                            {isPreviewLoading && !isGenerating && <div className="preview-status">Updating preview...</div>}
                            {errorMessage && <div className="error-message">{errorMessage}</div>}

                            {/* The Separate Download Buttons you asked for */}
                            {downloadLinks && (
                                <div className="download-links-container" style={{ display: 'flex', gap: '10px', marginTop: '15px', marginBottom: '15px' }}>
                                    <a href={downloadLinks.pdfUrl} download="Resume.pdf" className="action-btn pdf-btn" style={{flex: 1, textAlign: 'center'}}>📄 Download PDF</a>
                                    <a href={downloadLinks.latexUrl} download="Resume.tex" className="action-btn latex-btn" style={{flex: 1, textAlign: 'center'}}>💻 Download LaTeX</a>
                                    <a href={downloadLinks.jsonUrl} download="Resume.json" className="action-btn json-btn" style={{flex: 1, textAlign: 'center'}}>⚙️ Download JSON</a>
                                </div>
                            )}

                            {previewPdfUrl ? (
                                <object data={previewPdfUrl} type="application/pdf" className="pdf-preview-object" aria-label="Resume Preview" style={{ width: '100%', height: '100%', minHeight: '600px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                            ) : (
                                <div className="pdf-preview-placeholder">
                                    {isPreviewLoading ? 'Loading Preview...' : 'Click Refresh Preview to see your resume.'}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default ResumeFromScratchPage;