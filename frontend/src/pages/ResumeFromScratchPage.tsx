import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { ResumeData, DownloadLinks } from '../types';

// Import all your form components
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

// The initial empty state for a new resume (UI STATE - uses snake_case and UUIDs for React rendering)
const initialResumeData: ResumeData = {
    personal_info: { full_name: '', address: '', email: '', phone: '', github_handle: '', linkedin_handle: '', portfolio_url: '' },
    education: [{ id: uuidv4(), degree: '', institution: '', start_year: '', end_year: '', gpa: '' }],
    work_experience: [{ id: uuidv4(), job_title: '', company_name: '', location: '', start_date: '', end_date: '', description_points: '' }],
    projects: [{ id: uuidv4(), project_name: '', start_date: '', end_date: '', tech_stack: '', description_points: '' }],
    skills: [], 
    achievements: [],
    certifications: [],
};

const navItems = [
    'Templates', 'Profile', 'Education', 'Work', 
    'Projects', 'Skills', 'Achievements', 'Certifications'
];

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// --- THE ADAPTER: Sanitizes React State into Strict API Contract (camelCase, No UUIDs, No Empty Strings) ---
const buildApiPayload = (data: ResumeData, template: string) => {
    return {
        template_name: template.toLowerCase().replace(/ /g, '_'),
        resume_data: {
            personal_info: {
                fullName: data.personal_info.full_name || "",
                email: data.personal_info.email || "",
                phone: data.personal_info.phone || "",
                address: data.personal_info.address || "",
                github: data.personal_info.github_handle || "",
                linkedin: data.personal_info.linkedin_handle || "",
                portfolioUrl: data.personal_info.portfolio_url || ""
            },
            education: data.education
                .filter(edu => edu.institution || edu.degree)
                .map(edu => ({
                    degree: edu.degree,
                    institution: edu.institution,
                    startYear: edu.start_year,
                    endYear: edu.end_year,
                    grade: edu.gpa
                })),
            workExperience: data.work_experience
                .filter(exp => exp.company_name || exp.job_title)
                .map(exp => ({
                    role: exp.job_title,
                    company: exp.company_name,
                    location: exp.location,
                    startDate: exp.start_date,
                    endDate: exp.end_date,
                    descriptionPoints: exp.description_points ? exp.description_points.split('\n').filter(p => p.trim() !== '') : []
                })),
            projects: data.projects
                .filter(proj => proj.project_name)
                .map(proj => ({
                    projectName: proj.project_name,
                    tech_stack: proj.tech_stack, 
                    startDate: proj.start_date,
                    endDate: proj.end_date,
                    descriptionPoints: proj.description_points ? proj.description_points.split('\n').filter(p => p.trim() !== '') : []
                })),
            skills: data.skills
                .filter(skill => skill.name)
                .map(skill => ({ name: skill.name, value: skill.value })),
            achievements: data.achievements
                .filter(ach => ach.description)
                .map(ach => ({ description: ach.description })),
            certifications: data.certifications
                .filter(cert => cert.name)
                .map(cert => ({ name: cert.name, issuer: cert.issuer, date: cert.date }))
        }
    };
};

const ResumeFromScratchPage: React.FC = () => {
    const [activeSection, setActiveSection] = useState('Templates');
    const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
    const [selectedTemplate, setSelectedTemplate] = useState('Professional');
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [downloadLinks, setDownloadLinks] = useState<DownloadLinks | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    
    const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    const handlePreviewUpdate = async (data: ResumeData, template: string) => {
        setIsPreviewLoading(true);
        setDownloadLinks(null);
        setErrorMessage('');
        
        const payload = buildApiPayload(data, template);
        
        try {
            const response = await axios.post(`${API_BASE_URL}/api/v1/preview`, payload, { responseType: 'blob' });
            if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
            setPreviewPdfUrl(URL.createObjectURL(response.data));
        } catch (error) {
            console.error("Error generating preview:", error);
            setErrorMessage('Auto-preview failed.');
        } finally {
            setIsPreviewLoading(false);
        }
    };



    const handleMakeResume = async () => {
        setIsGenerating(true);
        setDownloadLinks(null);
        setErrorMessage('');
        
        const payload = buildApiPayload(resumeData, selectedTemplate);
        
        try {
            const response = await axios.post(`${API_BASE_URL}/api/v1/generate`, payload);
            const relativeLinks = response.data;
            setDownloadLinks({
                pdfUrl: API_BASE_URL + relativeLinks.pdfUrl,
                latexUrl: API_BASE_URL + relativeLinks.latexUrl,
                jsonUrl: API_BASE_URL + relativeLinks.jsonUrl,
            });
        } catch (error) {
            console.error("Error generating resume:", error);
            setErrorMessage('Failed to generate final resume files. Please check the server logs.');
        } finally {
            setIsGenerating(false);
        }
    };

    const renderActiveForm = () => {
        switch (activeSection) {
            case 'Templates': return <TemplateSelection selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} />;
            case 'Profile': return <ProfileForm data={resumeData.personal_info} setData={(newData) => setResumeData({ ...resumeData, personal_info: newData })} />;
            case 'Education': return <EducationForm data={resumeData.education} setData={(newData) => setResumeData({ ...resumeData, education: newData })} />;
            case 'Work': return <WorkForm data={resumeData.work_experience} setData={(newData) => setResumeData({ ...resumeData, work_experience: newData })} />;
            case 'Projects': return <ProjectsForm data={resumeData.projects} setData={(newData) => setResumeData({ ...resumeData, projects: newData })} />;
            case 'Skills': return <SkillsForm data={resumeData.skills} setData={(newData) => setResumeData({ ...resumeData, skills: newData })} />;
            case 'Achievements': return <AchievementsForm data={resumeData.achievements} setData={(newData) => setResumeData({ ...resumeData, achievements: newData })} />;
            case 'Certifications': return <CertificationsForm data={resumeData.certifications} setData={(newData) => setResumeData({ ...resumeData, certifications: newData })} />;
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
                <a href="/" className="sidebar-logo" title="Back to Home">Resume Builder</a>
                <nav>
                    {navItems.map(item => (
                        <div 
                            key={item} 
                            className={`sidebar-item ${activeSection === item ? 'active' : ''}`}
                            onClick={() => setActiveSection(item)}
                        >
                            {item}
                        </div>
                    ))}
                </nav>
                <div className="sidebar-action">
                    <button className="btn btn-primary" onClick={handleMakeResume} disabled={isGenerating}>
                        {isGenerating ? 'Generating...' : 'MAKE RESUME'}
                    </button>
                </div>
            </aside>

            <main className="scratch-main-panel">
                <div className="scratch-forms-area">
                    {renderActiveForm()}
                </div>

                <div className="scratch-preview-area">
                    <div className="scratch-preview-sticky">
                        <div className="preview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <h3>Live Preview</h3>
    <button 
        className="btn btn-secondary btn-sm" 
        onClick={() => handlePreviewUpdate(resumeData, selectedTemplate)}
        disabled={isPreviewLoading}
        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
    >
        {isPreviewLoading ? 'Updating...' : '↻ Refresh Preview'}
    </button>
</div>
                        
                        {isGenerating && <div className="preview-status">Generating...</div>}
                        {isPreviewLoading && !isGenerating && <div className="preview-status">Updating...</div>}
                        {errorMessage && <div className="error-message">{errorMessage}</div>}

                        {downloadLinks && (
    <div className="download-links-container">
        <a href={downloadLinks.pdfUrl} download className="action-btn pdf-btn">
            📄 Download PDF
        </a>
        <a href={downloadLinks.latexUrl} download className="action-btn latex-btn">
            💻 Download LaTeX
        </a>
        <a href={downloadLinks.jsonUrl} download className="action-btn json-btn">
            ⚙️ Download JSON
        </a>
    </div>
)}

                        {previewPdfUrl ? (
                            <object data={previewPdfUrl} type="application/pdf" className="pdf-preview-object" aria-label="Resume Preview" />
                        ) : (
                            <div className="pdf-preview-placeholder">
                                {isPreviewLoading ? 'Loading Preview...' : 'Your resume will appear here as you type.'}
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