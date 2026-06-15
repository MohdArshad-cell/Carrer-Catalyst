import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import './FeaturesPage.css';

// Feature Data Array for easy management
const featuresList = [
    {
        id: 'tailor',
        title: 'AI Resume Tailor',
        icon: '🧠',
        description: 'Micro-tailor your resume for any Job Description in 10 seconds. Get a pixel-perfect LaTeX PDF.',
        status: 'live',
        badge: '🟢 Live',
        route: '/ai-tools', // Change this to your actual Tailor route
        buttonText: 'Launch Tool 🚀'
    },
    {
        id: 'evaluator',
        title: 'Brutal ATS Scanner',
        icon: '🔥',
        description: 'Find out exactly why you are getting rejected. No sugarcoating. Fix weak bullets instantly.',
        status: 'live',
        badge: '🟢 Live',
        route: '/ats-evaluator', // Change to actual Evaluator route
        buttonText: 'Scan Resume 🔍'
    },
    {
        id: 'cover-letter',
        title: 'Pitch-Perfect Cover Letter',
        icon: '✉️',
        description: 'Hook recruiters instantly. Generate a highly targeted, no-BS cover letter in seconds.',
        status: 'live',
        badge: '🟢 Live',
        route: '/cover-letter', // Change to actual Cover Letter route
        buttonText: 'Draft Letter ✍️'
    },
    {
        id: 'xray',
        title: 'ATS X-Ray Vision',
        icon: '👁️',
        description: 'See your resume through the eyes of an ATS. Live split-screen keyword highlighting.',
        status: 'upcoming',
        badge: '⚡ Beta',
        route: '#',
        buttonText: 'Join Early Access ⏳'
    },
    {
        id: 'portfolio',
        title: '1-Click Web Portfolio',
        icon: '🌐',
        description: 'Turn your generated resume into a stunning live webpage to share directly on LinkedIn.',
        status: 'upcoming',
        badge: '🚀 Coming Soon',
        route: '#',
        buttonText: 'Notify Me 🔔'
    },
    {
        id: 'extension',
        title: 'LinkedIn Chrome Extension',
        icon: '🧩',
        description: 'Auto-scrape Job Descriptions from LinkedIn/Naukri and tailor your resume without leaving the tab.',
        status: 'upcoming',
        badge: '🛠️ In Development',
        route: '#',
        buttonText: 'Join Waitlist 🔔'
    }
];

const FeaturesPage: React.FC = () => {
    const navigate = useNavigate();
    const [toastMsg, setToastMsg] = useState('');

    const handleWaitlistClick = (featureName: string) => {
        setToastMsg(`Awesome! You are on the waitlist for ${featureName}. We'll email you when it's ready! 🎉`);
        setTimeout(() => setToastMsg(''), 4000); // Hide after 4 seconds
    };

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="features-container">
                <div className="studio-header text-center">
                    <div className="hero-badge" style={{ borderColor: '#3b82f6', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
                        <span className="sparkle">⚡</span> The Ultimate Arsenal
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
                        Everything You Need to Get Hired.
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
                        From bypassing ruthless ATS algorithms to crafting the perfect pitch, our AI tools are designed to give you an unfair advantage.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="features-grid">
                    {featuresList.map((feature) => (
                        <div key={feature.id} className={`feature-card glass-card ${feature.status === 'upcoming' ? 'upcoming-card' : ''}`}>
                            <div className="card-header">
                                <div className="feature-icon">{feature.icon}</div>
                                <div className={`status-badge ${feature.status === 'live' ? 'badge-live' : 'badge-upcoming'}`}>
                                    {feature.badge}
                                </div>
                            </div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-desc">{feature.description}</p>
                            
                            <div className="card-action">
                                {feature.status === 'live' ? (
                                    <button 
                                        className="btn-premium w-100" 
                                        onClick={() => navigate(feature.route)}
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
                {toastMsg}
            </div>

            <Footer />
        </div>
    );
};

export default FeaturesPage;