import React, { useState, MouseEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import './FeaturesPage.css';

interface FeatureStat {
    label: string;
    value: string;
}

interface Feature {
    id: string;
    title: string;
    icon: string;
    description: string;
    status: 'live' | 'upcoming';
    badge: string;
    route: string;
    buttonText: string;
    accent: string;
    tags: string[];
    stats: FeatureStat[];
}

const featuresList: Feature[] = [
    {
        id: 'tailor',
        title: 'AI Resume Tailor',
        icon: '🎯',
        description: 'Micro-tailor your resume for any specific Job Description in 10 seconds. Output is a pixel-perfect, ATS-friendly LaTeX PDF.',
        status: 'live',
        badge: 'Live Now',
        route: '/ai-tools',
        buttonText: 'Launch Engine 🚀',
        accent: '#00e5ff', // Neon Cyan
        tags: ['Gemini 1.5', 'LaTeX Core', 'ATS Bypass'],
        stats: [{ label: 'Speed', value: '< 12s' }, { label: 'Cost', value: '1 Token' }]
    },
    {
        id: 'evaluator',
        title: 'Brutal ATS Scanner',
        icon: '🔥',
        description: 'Find out exactly why you are getting rejected. Zero sugarcoating. Get a brutal score and fix weak bullets instantly.',
        status: 'live',
        badge: 'Live Now',
        route: '/ats-evaluator',
        buttonText: 'Scan Resume 🔍',
        accent: '#ef4444', // Neon Red
        tags: ['Harsh Feedback', 'Score System', 'Auto-Rewrite'],
        stats: [{ label: 'Accuracy', value: '99%' }, { label: 'Cost', value: '1 Token' }]
    },
    {
        id: 'networking',
        title: 'Cold Outreach AI',
        icon: '⚡',
        description: 'Stop waiting for recruiters. Generate highly personalized LinkedIn connection requests and cold emails that guarantee replies.',
        status: 'upcoming',
        badge: 'Next Release',
        route: '#',
        buttonText: 'Join VIP Waitlist ⏳',
        accent: '#f59e0b', // Amber/Gold
        tags: ['Hook Generation', 'Follow-ups', 'Direct DM'],
        stats: [{ label: 'Reply Rate', value: '+40%' }, { label: 'Status', value: 'In Lab' }]
    },
    {
        id: 'cover-letter',
        title: 'Pitch-Perfect Cover Letter',
        icon: '✉️',
        description: 'Hook recruiters instantly. Generate a highly targeted, hyper-personalized cover letter mapped perfectly to the JD.',
        status: 'live',
        badge: 'Live Now',
        route: '/cover-letter',
        buttonText: 'Draft Letter ✍️',
        accent: '#8b5cf6', // Vivid Purple
        tags: ['Context Aware', 'PDF Export'],
        stats: [{ label: 'Words', value: '~300' }, { label: 'Cost', value: '1 Token' }]
    },
    {
        id: 'mock-interview',
        title: 'Voice AI Interviewer',
        icon: '🎙️',
        description: 'Practice with an AI hiring manager. Get real-time feedback on your tone, technical accuracy, and confidence.',
        status: 'upcoming',
        badge: 'In Beta',
        route: '#',
        buttonText: 'Notify Me 🔔',
        accent: '#10b981', // Glowing Emerald
        tags: ['Speech-to-Text', 'Behavioral', 'Tech'],
        stats: [{ label: 'Engine', value: 'Whisper AI' }, { label: 'Status', value: 'Testing' }]
    },
    {
        id: 'extension',
        title: 'LinkedIn X-Ray Extension',
        icon: '🧩',
        description: 'Auto-scrape Job Descriptions from LinkedIn or Naukri and tailor your resume in 1-click without ever leaving the tab.',
        status: 'upcoming',
        badge: 'Concept',
        route: '#',
        buttonText: 'Join Waitlist 🔔',
        accent: '#ec4899', // Pink
        tags: ['Chrome V3', '1-Click Apply'],
        stats: [{ label: 'Platform', value: 'Chrome' }, { label: 'Status', value: 'Design' }]
    }
];

const FeaturesPage: React.FC = () => {
    const navigate = useNavigate();
    const [toastMsg, setToastMsg] = useState<string>('');

    const handleWaitlistClick = (featureName: string) => {
        setToastMsg(`VIP Access granted for ${featureName}. We'll notify you! 🎉`);
        setTimeout(() => setToastMsg(''), 4000);
    };

    // 🚀 OP LEVEL: 3D Magnetic Tilt Logic
    const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        
        // Spotlight calculation
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 3D Tilt calculation
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8; // Max tilt 8 deg
        const rotateY = ((x - centerX) / centerX) * 8;

        target.style.setProperty('--mouse-x', `${x}px`);
        target.style.setProperty('--mouse-y', `${y}px`);
        target.style.setProperty('--rotate-x', `${rotateX}deg`);
        target.style.setProperty('--rotate-y', `${rotateY}deg`);
    }, []);

    const handleMouseLeave = useCallback((e: MouseEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        target.style.setProperty('--rotate-x', `0deg`);
        target.style.setProperty('--rotate-y', `0deg`);
    }, []);

    return (
        <div className="page-container features-page">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <main className="features-main-container">
                {/* Hero Section */}
                <header className="features-hero fade-in">
                    <div className="hero-badge pulse-glow" style={{ borderColor: 'rgba(0, 229, 255, 0.5)', color: '#00e5ff', background: 'rgba(0, 229, 255, 0.1)' }}>
                        <span className="live-indicator"></span> Core Modules Online
                    </div>
                    <h1 className="hero-title">
                        The Ultimate <span className="text-gradient">Arsenal.</span>
                    </h1>
                    <p className="hero-subtitle">
                        Stop guessing. Start dominating. Deploy our suite of AI tools to bypass ruthless ATS algorithms, write killer cold emails, and force recruiters to pay attention.
                    </p>
                </header>

                {/* Interactive Bento Grid */}
                <div className="op-bento-grid">
                    {featuresList.map((feature, index) => (
                        <div 
                            key={feature.id} 
                            className={`op-feature-card ${feature.status === 'upcoming' ? 'card-locked' : ''}`}
                            style={{ '--card-accent': feature.accent, animationDelay: `${index * 0.1}s` } as React.CSSProperties}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="spotlight-overlay"></div>
                            <div className="card-glass-panel">
                                
                                <div className="card-top-row">
                                    <div className="icon-wrapper" style={{ background: `${feature.accent}15`, border: `1px solid ${feature.accent}40`, color: feature.accent, textShadow: `0 0 20px ${feature.accent}` }}>
                                        {feature.icon}
                                    </div>
                                    <div className={`op-status-badge ${feature.status === 'live' ? 'live' : 'upcoming'}`} style={feature.status === 'live' ? {background: `${feature.accent}20`, color: feature.accent, border: `1px solid ${feature.accent}50`} : {}}>
                                        {feature.badge}
                                    </div>
                                </div>

                                <div className="card-body">
                                    <h3 className="op-card-title">{feature.title}</h3>
                                    <p className="op-card-desc">{feature.description}</p>
                                    
                                    <div className="op-tags-row">
                                        {feature.tags.map((tag, i) => (
                                            <span key={i} className="op-tag">{tag}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="card-footer-divider"></div>
                                
                                <div className="card-bottom-row">
                                    <div className="op-stats">
                                        {feature.stats.map((stat, i) => (
                                            <div key={i} className="stat-block">
                                                <span className="stat-label">{stat.label}</span>
                                                <span className="stat-value">{stat.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        className={`op-action-btn ${feature.status === 'live' ? 'primary' : 'secondary'}`}
                                        onClick={() => feature.status === 'live' ? navigate(feature.route) : handleWaitlistClick(feature.title)}
                                        style={feature.status === 'live' ? { background: `linear-gradient(135deg, ${feature.accent}, #000)`, boxShadow: `0 4px 15px ${feature.accent}40` } : {}}
                                    >
                                        {feature.buttonText}
                                    </button>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <div className={`op-toast ${toastMsg ? 'visible' : ''}`}>
                <div className="toast-glass">
                    <span className="toast-icon">⚡</span>
                    <p>{toastMsg}</p>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default FeaturesPage;