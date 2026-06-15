import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import './FeaturesPage.css';

// Upgraded Feature Data Array with Accents and Tags
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
        accent: '#3b82f6', // Blue
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
        accent: '#ef4444', // Red
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
        accent: '#8b5cf6', // Purple
        tags: ['Hyper-Personalized', 'PDF Download']
    },
    {
        id: 'xray',
        title: 'ATS X-Ray Vision',
        icon: '👁️',
        description: 'See your resume through the eyes of an ATS. Live split-screen keyword highlighting.',
        status: 'upcoming',
        badge: '⚡ Beta',
        route: '#',
        buttonText: 'Join Early Access ⏳',
        accent: '#10b981', // Emerald
        tags: ['Live Highlighting', 'Visual Gap Analysis']
    },
    {
        id: 'portfolio',
        title: '1-Click Web Portfolio',
        icon: '🌐',
        description: 'Turn your generated resume into a stunning live webpage to share directly on LinkedIn.',
        status: 'upcoming',
        badge: '🚀 Next Release',
        route: '#',
        buttonText: 'Notify Me 🔔',
        accent: '#06b6d4', // Cyan
        tags: ['Custom Link', 'Analytics tracking']
    },
    {
        id: 'extension',
        title: 'LinkedIn Chrome Extension',
        icon: '🧩',
        description: 'Auto-scrape Job Descriptions from LinkedIn/Naukri and tailor your resume without leaving the tab.',
        status: 'upcoming',
        badge: '🛠️ In Lab',
        route: '#',
        buttonText: 'Join Waitlist 🔔',
        accent: '#f59e0b', // Amber
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
                {/* Mind-Blowing Header Section */}
                <div className="studio-header text-center fade-in-up">
                    <div className="hero-badge pulse-border">
                        <span className="sparkle">⚡</span> The Ultimate Arsenal
                    </div>
                    <h1 className="animated-gradient-text title-massive">
                        Everything You Need <br/> To Get Hired.
                    </h1>
                    <p className="subtitle-text">
                        From bypassing ruthless ATS algorithms to crafting the perfect pitch, our AI tools are designed to give you an unfair, completely legal advantage.
                    </p>
                </div>

                {/* Premium Grid */}
                <div className="features-grid">
                    {featuresList.map((feature, index) => (
                        <div 
                            key={feature.id} 
                            className={`premium-feature-card glass-card ${feature.status === 'upcoming' ? 'card-upcoming' : ''}`}
                            style={{ '--accent-color': feature.accent, animationDelay: `${index * 0.1}s` } as React.CSSProperties}
                        >
                            {/* Accent Top Border */}
                            <div className="card-top-glow"></div>

                            <div className="card-header">
                                <div className="icon-wrapper">
                                    {feature.icon}
                                    <div className="icon-glow"></div>
                                </div>
                                <div className={`smart-badge ${feature.status === 'live' ? 'badge-live' : 'badge-upcoming'}`}>
                                    {feature.status === 'live' && <span className="live-dot"></span>}
                                    {feature.badge}
                                </div>
                            </div>

                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-desc">{feature.description}</p>
                            
                            {/* Feature Tags */}
                            <div className="tags-container">
                                {feature.tags.map((tag, i) => (
                                    <span key={i} className="tech-tag">{tag}</span>
                                ))}
                            </div>
                            
                            <div className="card-action mt-auto">
                                {feature.status === 'live' ? (
                                    <button 
                                        className="btn-premium w-100 action-btn" 
                                        onClick={() => navigate(feature.route)}
                                        style={{ background: `linear-gradient(135deg, ${feature.accent}, #000)` }}
                                    >
                                        {feature.buttonText}
                                    </button>
                                ) : (
                                    <button 
                                        className="btn-outline w-100 waitlist-btn" 
                                        onClick={() => handleWaitlistClick(feature.title)}
                                    >
                                        {feature.buttonText}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom Toast Notification */}
            <div className={`waitlist-toast ${toastMsg ? 'show' : ''}`}>
                <span className="toast-icon">✨</span>
                {toastMsg}
            </div>

            <Footer />
        </div>
    );
};

export default FeaturesPage;