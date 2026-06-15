import React, { useState, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import './FeaturesPage.css';

// Strict TypeScript Interfaces enforced as per architecture plan
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
}

// Comprehensive Feature Data Array
const featuresList: Feature[] = [
    {
        id: 'tailor',
        title: 'AI Resume Tailor',
        icon: '🧠',
        description: 'Micro-tailor your resume for any Job Description in 10 seconds. Output is a pixel-perfect LaTeX PDF.',
        status: 'live',
        badge: 'Live Now',
        route: '/ai-tools',
        buttonText: 'Launch Tool 🚀',
        accent: '#3b82f6', // Electric Blue
        tags: ['Gemini Pro', 'LaTeX Engine', 'ATS Bypass']
    },
    {
        id: 'evaluator',
        title: 'Brutal ATS Scanner',
        icon: '🔥',
        description: 'Find out exactly why you are getting rejected. Zero sugarcoating. Fix weak bullets instantly.',
        status: 'live',
        badge: 'Live Now',
        route: '/ats-evaluator',
        buttonText: 'Scan Resume 🔍',
        accent: '#ef4444', // Crimson Red
        tags: ['Harsh Feedback', 'Score System', 'Auto-Rewrite']
    },
    {
        id: 'cover-letter',
        title: 'Pitch-Perfect Cover Letter',
        icon: '✉️',
        description: 'Hook recruiters instantly. Generate a highly targeted, hyper-personalized cover letter in seconds.',
        status: 'live',
        badge: 'Live Now',
        route: '/cover-letter',
        buttonText: 'Draft Letter ✍️',
        accent: '#8b5cf6', // Deep Purple
        tags: ['Context Aware', 'PDF Export']
    },
    {
        id: 'xray',
        title: 'ATS X-Ray Vision',
        icon: '👁️',
        description: 'See your resume through the eyes of an ATS. Live split-screen keyword highlighting.',
        status: 'upcoming',
        badge: 'In Beta',
        route: '#',
        buttonText: 'Join Early Access ⏳',
        accent: '#10b981', // Emerald Green
        tags: ['Live Highlighting', 'Gap Analysis']
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
        accent: '#06b6d4', // Cyan
        tags: ['Custom Link', 'Traffic Analytics']
    },
    {
        id: 'extension',
        title: 'Browser Extension',
        icon: '🧩',
        description: 'Auto-scrape Job Descriptions from LinkedIn/Naukri and tailor your resume without leaving the tab.',
        status: 'upcoming',
        badge: 'In Lab',
        route: '#',
        buttonText: 'Join Waitlist 🔔',
        accent: '#f59e0b', // Amber
        tags: ['1-Click Scrape', 'Seamless Integration']
    }
];

const FeaturesPage: React.FC = () => {
    const navigate = useNavigate();
    const [toastMsg, setToastMsg] = useState<string>('');

    // Feature Waitlist Handler
    const handleWaitlistClick = (featureName: string) => {
        setToastMsg(`Status: VIP Access granted for ${featureName}. We will notify you upon deployment.`);
        setTimeout(() => setToastMsg(''), 4000);
    };

    // Magnetic Spotlight Effect Handler
    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        target.style.setProperty('--mouse-x', `${x}px`);
        target.style.setProperty('--mouse-y', `${y}px`);
    };

    return (
        <div className="page-wrapper">
            <ParticleBackground />
            
            {/* Dynamic ambient background glow */}
            <div className="ambient-glow top-left"></div>
            <div className="ambient-glow bottom-right"></div>
            
            <Navbar />

            <main className="features-main-container">
                {/* Hero Section */}
                <header className="features-hero fade-in">
                    <div className="status-pill pulse-border">
                        <span className="live-indicator"></span> System Online
                    </div>
                    <h1 className="hero-title">
                        The Ultimate <span className="text-gradient">Arsenal.</span>
                    </h1>
                    <p className="hero-subtitle">
                        Stop guessing. Start dominating. Deploy our suite of AI tools to bypass ruthless ATS algorithms and force recruiters to pay attention.
                    </p>
                </header>

                {/* Interactive Grid */}
                <div className="magnetic-grid">
                    {featuresList.map((feature, index) => (
                        <div 
                            key={feature.id} 
                            className={`magnetic-card ${feature.status === 'upcoming' ? 'card-locked' : ''}`}
                            style={{ '--card-accent': feature.accent, animationDelay: `${index * 0.05}s` } as React.CSSProperties}
                            onMouseMove={handleMouseMove}
                        >
                            {/* Magnetic Spotlight Overlay */}
                            <div className="spotlight-overlay"></div>
                            
                            <div className="card-content">
                                <div className="card-header">
                                    <div className="icon-container" style={{ background: `linear-gradient(135deg, ${feature.accent}20, transparent)` }}>
                                        <span className="feature-icon">{feature.icon}</span>
                                    </div>
                                    <div className={`status-badge ${feature.status === 'live' ? 'status-live' : 'status-dev'}`}>
                                        {feature.badge}
                                    </div>
                                </div>

                                <h3 className="card-title">{feature.title}</h3>
                                <p className="card-description">{feature.description}</p>
                                
                                <div className="tech-stack-tags">
                                    {feature.tags.map((tag, i) => (
                                        <span key={i} className="tech-badge">{tag}</span>
                                    ))}
                                </div>
                                
                                <div className="card-footer">
                                    <button 
                                        className={`action-button ${feature.status === 'live' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => feature.status === 'live' ? navigate(feature.route) : handleWaitlistClick(feature.title)}
                                        style={feature.status === 'live' ? { boxShadow: `0 0 20px ${feature.accent}40` } : {}}
                                    >
                                        {feature.buttonText}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Premium Toast Notification */}
            <div className={`system-toast ${toastMsg ? 'toast-visible' : ''}`}>
                <div className="toast-content">
                    <span className="toast-icon">⚡</span>
                    <p>{toastMsg}</p>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default FeaturesPage;