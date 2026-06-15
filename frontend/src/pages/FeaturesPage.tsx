import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import './FeaturesPage.css';

const featuresList = [
    {
        id: 'tailor',
        title: 'AI Resume Tailor',
        icon: '🧠',
        description: 'Micro-tailor your resume for any Job Description in 10 seconds. Get a pixel-perfect LaTeX PDF.',
        status: 'live',
        badge: 'Live',
        route: '/ai-tools',
        buttonText: 'Launch Tool 🚀',
        accent: '#3b82f6', 
        accentBg: 'rgba(59, 130, 246, 0.1)',
        tags: ['Gemini AI', 'LaTeX Export', 'ATS Optimized']
    },
    {
        id: 'evaluator',
        title: 'Brutal ATS Scanner',
        icon: '🔥',
        description: 'Find out exactly why you are getting rejected. No sugarcoating. Fix weak bullets instantly.',
        status: 'live',
        badge: 'Live',
        route: '/ats-evaluator',
        buttonText: 'Scan Resume 🔍',
        accent: '#ef4444', 
        accentBg: 'rgba(239, 68, 68, 0.1)',
        tags: ['Harsh Truths', 'Score System', 'Auto-Rewrite']
    },
    {
        id: 'cover-letter',
        title: 'Pitch-Perfect Cover Letter',
        icon: '✉️',
        description: 'Hook recruiters instantly. Generate a highly targeted, no-BS cover letter in seconds.',
        status: 'live',
        badge: 'Live',
        route: '/cover-letter',
        buttonText: 'Draft Letter ✍️',
        accent: '#8b5cf6', 
        accentBg: 'rgba(139, 92, 246, 0.1)',
        tags: ['Hyper-Personalized', 'PDF Download']
    },
    {
        id: 'xray',
        title: 'ATS X-Ray Vision',
        icon: '👁️',
        description: 'See your resume through the eyes of an ATS. Live split-screen keyword highlighting.',
        status: 'upcoming',
        badge: 'Beta',
        route: '#',
        buttonText: 'Join Early Access ⏳',
        accent: '#10b981', 
        accentBg: 'rgba(16, 185, 129, 0.1)',
        tags: ['Live Highlighting', 'Visual Gap Analysis']
    },
    {
        id: 'portfolio',
        title: '1-Click Web Portfolio',
        icon: '🌐',
        description: 'Turn your generated resume into a stunning live webpage to share directly on LinkedIn.',
        status: 'upcoming',
        badge: 'Next Release',
        route: '#',
        buttonText: 'Notify Me 🔔',
        accent: '#06b6d4', 
        accentBg: 'rgba(6, 182, 212, 0.1)',
        tags: ['Custom Link', 'Analytics Tracking']
    },
    {
        id: 'extension',
        title: 'Chrome Extension',
        icon: '🧩',
        description: 'Auto-scrape Job Descriptions from LinkedIn and tailor your resume without leaving the tab.',
        status: 'upcoming',
        badge: 'In Lab',
        route: '#',
        buttonText: 'Join Waitlist 🔔',
        accent: '#f59e0b', 
        accentBg: 'rgba(245, 158, 11, 0.1)',
        tags: ['1-Click Scrape', 'Browser Integration']
    }
];

const FeaturesPage: React.FC = () => {
    const navigate = useNavigate();
    const [toastMsg, setToastMsg] = useState('');

    const handleWaitlistClick = (featureName: string) => {
        setToastMsg(`Awesome! You're on the VIP list for ${featureName}. We'll notify you first! 🎉`);
        setTimeout(() => setToastMsg(''), 4000);
    };

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="features-container">
                <div className="studio-header text-center fade-in-up">
                    <h1 className="title-massive">
                        The Ultimate Arsenal.
                    </h1>
                    <p className="subtitle-text">
                        From bypassing ruthless ATS algorithms to crafting the perfect pitch, our AI tools are designed to give you an unfair, completely legal advantage.
                    </p>
                </div>

                <div className="sleek-features-grid">
                    {featuresList.map((feature, index) => (
                        <div 
                            key={feature.id} 
                            className={`sleek-card ${feature.status === 'upcoming' ? 'card-dimmed' : ''}`}
                            style={{ '--accent': feature.accent, animationDelay: `${index * 0.1}s` } as React.CSSProperties}
                        >
                            {/* Top Row: Icon & Badge */}
                            <div className="card-top-row">
                                <div className="sleek-icon-box" style={{ backgroundColor: feature.accentBg, color: feature.accent, border: `1px solid ${feature.accent}40` }}>
                                    {feature.icon}
                                </div>
                                <div className={`sleek-badge ${feature.status === 'live' ? 'badge-live' : 'badge-upcoming'}`}>
                                    {feature.status === 'live' && <span className="pulsing-dot"></span>}
                                    {feature.badge}
                                </div>
                            </div>

                            {/* Content */}
                            <h3 className="sleek-title">{feature.title}</h3>
                            <p className="sleek-desc">{feature.description}</p>
                            
                            {/* Tiny Tech Pills */}
                            <div className="sleek-tags">
                                {feature.tags.map((tag, i) => (
                                    <span key={i} className="tiny-pill">{tag}</span>
                                ))}
                            </div>
                            
                            {/* Ghost Button */}
                            <div className="mt-auto">
                                <button 
                                    className={`sleek-ghost-btn ${feature.status === 'live' ? 'btn-live' : 'btn-upcoming'}`}
                                    onClick={() => feature.status === 'live' ? navigate(feature.route) : handleWaitlistClick(feature.title)}
                                >
                                    {feature.buttonText}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`sleek-toast ${toastMsg ? 'show' : ''}`}>
                <span>{toastMsg}</span>
            </div>

            <Footer />
        </div>
    );
};

export default FeaturesPage;