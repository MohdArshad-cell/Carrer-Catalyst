import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ParticleBackground from '../components/ParticleBackground';
import './HomePage.css';
import '../App.css';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../supabaseClient';

/* ─────────────── DATA ─────────────── */

const faqData = [
    {
        question: "Is my resume data private and secure?",
        answer: "Yes. We prioritize your privacy above all else. Your data is processed securely and is never shared with third parties."
    },
    {
        question: "Do I need to be a design expert to use this?",
        answer: "Not at all! Our tools and templates guide you step-by-step, making professional design accessible to everyone."
    },
    {
        question: "How is this better than a generic template?",
        answer: "Generic templates are static. Career Catalyst is dynamic. Our AI tools actively help you write more effective content tailored to the specific job you want."
    },
    {
        question: "How do tokens work?",
        answer: "Tokens are our platform currency. You get free tokens on signup, and can purchase more as needed. Each AI generation (tailoring, evaluating) costs 1 token."
    },
    {
        question: "Can I get a refund?",
        answer: "We offer a 7-day money-back guarantee on all unused token packages. If you're not satisfied, just email support."
    },
    {
        question: "What file formats do you support?",
        answer: "Currently, we support PDF and raw text uploads. Our AI outputs can be downloaded as optimized PDFs or copied to your clipboard."
    }
];

const testimonials = [
    { name: "Priya S.", role: "Software Engineer", text: "A game-changer. I went from zero replies to three interviews in a week! The ATS score helped me see exactly what was missing.", initial: "P" },
    { name: "Michael T.", role: "Marketing Manager", text: "The Bullet Rewriter turned my boring daily tasks into actual measurable achievements. Highly recommend!", initial: "M" },
    { name: "Sarah L.", role: "Recent Graduate", text: "I didn't know how to write a cover letter. The AI generated one that matched my resume perfectly. Got the job!", initial: "S" },
    { name: "David K.", role: "Product Manager", text: "The Career Roadmap AI gave me a clear 3-month plan to transition into Product. Better than any career coach I've paid.", initial: "D" }
];

const features = [
    { icon: "🎯", title: "AI Resume Tailor", desc: "Micro-tailor your resume for any specific Job Description in under 12 seconds. Outputs a pixel-perfect ATS-friendly LaTeX PDF.", tag: "1 Token" },
    { icon: "🔥", title: "Brutal ATS Scanner", desc: "Find out exactly why you're getting rejected. Zero sugarcoating. Get a harsh score and fix weak bullets instantly.", tag: "1 Token" },
    { icon: "✉️", title: "Cover Letter Generator", desc: "Hook recruiters instantly with a hyper-personalized cover letter mapped perfectly to the job description.", tag: "1 Token" },
    { icon: "🎤", title: "Mock Interview AI", desc: "Practice with AI-generated questions tailored to your target role. Get feedback on your answers in real time.", tag: "1 Token" },
    { icon: "💼", title: "LinkedIn Optimizer", desc: "Re-write your headline, About section, and experience to rank higher in LinkedIn Recruiter search algorithms.", tag: "1 Token" },
    { icon: "🗺️", title: "Career Roadmap", desc: "Analyze your resume vs your dream job and get a week-by-week upskilling roadmap powered by AI.", tag: "1 Token" }
];

const freeTools = [
    { icon: "✨", title: "Bullet Rewriter", desc: "Turn weak resume tasks into metric-driven achievements.", path: "/bullet-rewriter" },
    { icon: "🎯", title: "Job Fit Score", desc: "Instantly score your resume against any job description.", path: "/job-fit" },
    { icon: "📝", title: "Resignation Letter", desc: "Draft professional resignation letters in any tone.", path: "/resignation-letter" },
    { icon: "🔍", title: "Resume Diff", desc: "See exactly what changed between resume versions.", path: "/resume-diff" }
];

/* ─────────────── ANIMATED COUNTER HOOK ─────────────── */

function useCountUp(target, duration = 2000, startOnVisible = true) {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!startOnVisible) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasStarted) {
                    setHasStarted(true);
                }
            },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [hasStarted, startOnVisible]);

    useEffect(() => {
        if (!hasStarted) return;
        let startTime = null;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [hasStarted, target, duration]);

    return { count, ref };
}

/* ─────────────── HOMEPAGE COMPONENT ─────────────── */

const HomePage = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);
    const [user, setUser] = useState(null);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    // Animated counters
    const stat1 = useCountUp(12000);
    const stat2 = useCountUp(4500);
    const stat3 = useCountUp(98);

    // Global scroll reveal — observe all .reveal and .reveal-stagger on mount
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
        );
        const elements = document.querySelectorAll('.reveal, .reveal-stagger');
        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    // Testimonial auto-rotation
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Auth check
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const launchTools = () => {
        navigate(user ? '/ai-tools' : '/login');
    };

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const handleMouseMove = useCallback((e) => {
        const { currentTarget: target } = e;
        const rect = target.getBoundingClientRect();
        target.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        target.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    }, []);

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            {/* ────────── 1. HERO ────────── */}
            <section className="hero-section" id="hero">
                <div className="hero-orbit-container">
                    <div className="orbit-ring orbit-ring-1"></div>
                    <div className="orbit-ring orbit-ring-2"></div>
                    <div className="orbit-ring orbit-ring-3"></div>
                </div>

                <div className="hero-inner">
                    <div className="hero-badge">
                        <span className="sparkle">✨</span> AI-Powered Career Acceleration Platform
                    </div>

                    <h1 className="hero-title">
                        Your Unfair Advantage in the Job Market
                    </h1>

                    <p className="hero-subtitle">
                        Create, tailor, and evaluate your resume with AI that understands 
                        exactly how recruiters and ATS systems think. Land interviews, not rejections.
                    </p>

                    <div className="hero-cta-group">
                        <button onClick={launchTools} className="btn-hero-primary" id="hero-cta">
                            {user ? 'Go to Dashboard →' : 'Launch AI Tools →'}
                        </button>
                        <button 
                            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                            className="btn-hero-secondary"
                            id="hero-secondary-cta"
                        >
                            See How It Works ↓
                        </button>
                    </div>

                    <div className="hero-stats-bar">
                        <div className="stat-pill" ref={stat1.ref}>
                            <span className="stat-number cyan">{stat1.count.toLocaleString()}+</span>
                            <span className="stat-label">Resumes Tailored</span>
                        </div>
                        <div className="stat-pill" ref={stat2.ref}>
                            <span className="stat-number blue">{stat2.count.toLocaleString()}+</span>
                            <span className="stat-label">Active Users</span>
                        </div>
                        <div className="stat-pill" ref={stat3.ref}>
                            <span className="stat-number gold">{stat3.count}%</span>
                            <span className="stat-label">ATS Pass Rate</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ────────── 2. TRUSTED BY ────────── */}
            <section className="trusted-section">
                <div className="container">
                    <p className="trusted-label">Trusted by job seekers targeting</p>
                    <div className="trusted-logos-wrapper">
                        <div className="trusted-logos-track">
                            {/* Set 1 */}
                            <span className="trusted-logo">Google</span>
                            <span className="trusted-logo">Amazon</span>
                            <span className="trusted-logo">Microsoft</span>
                            <span className="trusted-logo">Meta</span>
                            <span className="trusted-logo">Apple</span>
                            <span className="trusted-logo">Netflix</span>
                            <span className="trusted-logo">Stripe</span>
                            {/* Set 2 (for infinite scroll) */}
                            <span className="trusted-logo">Google</span>
                            <span className="trusted-logo">Amazon</span>
                            <span className="trusted-logo">Microsoft</span>
                            <span className="trusted-logo">Meta</span>
                            <span className="trusted-logo">Apple</span>
                            <span className="trusted-logo">Netflix</span>
                            <span className="trusted-logo">Stripe</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ────────── 3. HOW IT WORKS ────────── */}
            <section className="how-section container" id="how-it-works">
                <div className="section-header reveal">
                    <span className="section-eyebrow">⚡ Simple 3-Step Process</span>
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-subtitle">
                        Go from application to interview in under 60 seconds.
                    </p>
                </div>

                <div className="steps-container reveal-stagger">
                    <div className="step-card">
                        <div className="step-number">1</div>
                        <span className="step-icon">📄</span>
                        <h3>Upload Your Resume</h3>
                        <p>Paste your existing resume text or upload a PDF — our parser handles the rest.</p>
                    </div>
                    <div className="step-connector">
                        <div className="step-connector-line"></div>
                    </div>
                    <div className="step-card">
                        <div className="step-number">2</div>
                        <span className="step-icon">📋</span>
                        <h3>Paste the Job Description</h3>
                        <p>Drop in the JD you're targeting. Our AI analyzes every keyword and requirement.</p>
                    </div>
                    <div className="step-connector">
                        <div className="step-connector-line"></div>
                    </div>
                    <div className="step-card">
                        <div className="step-number">3</div>
                        <span className="step-icon">🚀</span>
                        <h3>Get Your Tailored PDF</h3>
                        <p>Download a pixel-perfect, ATS-optimized LaTeX resume in under 12 seconds.</p>
                    </div>
                </div>
            </section>

            {/* ────────── 4. FEATURES SHOWCASE ────────── */}
            <section className="features-section container">
                <div className="section-header reveal">
                    <span className="section-eyebrow">💎 Premium AI Toolkit</span>
                    <h2 className="section-title">Everything You Need to Land the Job</h2>
                    <p className="section-subtitle">
                        A complete suite of AI-powered tools, each designed for a specific step in your job search.
                    </p>
                </div>

                <div className="features-grid reveal-stagger">
                    {features.map((f, i) => (
                        <div 
                            className="feature-card" 
                            key={i}
                            onMouseMove={handleMouseMove}
                            onClick={launchTools}
                        >
                            <div className="card-glow"></div>
                            <div className="feature-card-content">
                                <span className="feature-icon">{f.icon}</span>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                                <span className="feature-tag">{f.tag}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ────────── 5. BEFORE VS AFTER ────────── */}
            <section className="compare-section container">
                <div className="section-header reveal">
                    <span className="section-eyebrow">📊 The Proof</span>
                    <h2 className="section-title">Why You're Getting Ghosted</h2>
                    <p className="section-subtitle">
                        See how our AI transforms a generic resume into an interview magnet.
                    </p>
                </div>

                <div className="compare-grid reveal">
                    <div className="compare-card before">
                        <div className="compare-card-header">
                            <h3>Before (Generic & Weak) ❌</h3>
                        </div>
                        <div className="compare-content">
                            <p>
                                • Managed social media accounts for the company.<br/>
                                • Worked on a team to build a new feature.<br/>
                                • Handled customer complaints and issues.<br/>
                                • Used React and Node.js for frontend and backend.
                            </p>
                        </div>
                        <div className="ats-score-bar">
                            <div className="ats-score-label">
                                <span style={{ color: '#ef4444' }}>ATS Score</span>
                                <span style={{ color: '#ef4444' }}>32% — Rejected</span>
                            </div>
                            <div className="ats-score-track">
                                <div className="ats-score-fill fail" style={{ width: '32%' }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="compare-vs">
                        <div className="vs-badge">VS</div>
                    </div>

                    <div className="compare-card after">
                        <div className="compare-card-header">
                            <h3>After (AI Tailored) ✅</h3>
                        </div>
                        <div className="compare-content">
                            <p>
                                • Spearheaded a <span className="highlight">social media strategy</span> that increased engagement by 140% across 3 platforms.<br/>
                                • Architected a highly scalable microservice using <span className="highlight">React</span> and <span className="highlight">Node.js</span>, reducing load times by 2.1s.<br/>
                                • Resolved 50+ tier-3 <span className="highlight">customer issues</span> weekly with a 98% CSAT score.
                            </p>
                        </div>
                        <div className="ats-score-bar">
                            <div className="ats-score-label">
                                <span style={{ color: '#10b981' }}>ATS Score</span>
                                <span style={{ color: '#10b981' }}>95% — Interview!</span>
                            </div>
                            <div className="ats-score-track">
                                <div className="ats-score-fill pass" style={{ width: '95%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ────────── 6. WHO IS THIS FOR ────────── */}
            <section className="personas-section container">
                <div className="section-header reveal">
                    <span className="section-eyebrow">🎯 Built For You</span>
                    <h2 className="section-title">Who Is This For?</h2>
                    <p className="section-subtitle">
                        Whether you're just starting out or leveling up, we've got you covered.
                    </p>
                </div>

                <div className="personas-grid reveal-stagger">
                    <div className="persona-card">
                        <div className="persona-icon-wrap grad">🎓</div>
                        <h3>Students & Graduates</h3>
                        <p>Land your first internship or entry-level role with a resume that actually gets past the ATS.</p>
                    </div>
                    <div className="persona-card">
                        <div className="persona-icon-wrap changer">🚀</div>
                        <h3>Career Changers</h3>
                        <p>Reframe your existing experience to match a completely new industry or role with AI assistance.</p>
                    </div>
                    <div className="persona-card">
                        <div className="persona-icon-wrap pro">🏆</div>
                        <h3>Senior Professionals</h3>
                        <p>Optimize your resume for leadership and executive roles at top-tier companies.</p>
                    </div>
                </div>
            </section>

            {/* ────────── 7. TESTIMONIALS ────────── */}
            <section className="testimonials-section container">
                <div className="section-header reveal">
                    <span className="section-eyebrow">💬 Real Results</span>
                    <h2 className="section-title">What Our Users Say</h2>
                    <p className="section-subtitle">
                        Hear from real job seekers who landed interviews using Career Catalyst.
                    </p>
                </div>

                <div className="testimonial-carousel reveal">
                    <div className="testimonial-slide">
                        <div className="testimonial-quote-mark">"</div>
                        <p className="testimonial-text">
                            {testimonials[currentTestimonial].text}
                        </p>
                        <div className="testimonial-author">
                            <div className="testimonial-avatar">
                                {testimonials[currentTestimonial].initial}
                            </div>
                            <div className="testimonial-info">
                                <strong>{testimonials[currentTestimonial].name}</strong>
                                <span>{testimonials[currentTestimonial].role}</span>
                            </div>
                        </div>
                    </div>

                    <div className="testimonial-dots">
                        {testimonials.map((_, idx) => (
                            <button
                                key={idx}
                                className={`testimonial-dot ${idx === currentTestimonial ? 'active' : ''}`}
                                onClick={() => setCurrentTestimonial(idx)}
                                aria-label={`Go to testimonial ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ────────── 8. FREE TOOLS ────────── */}
            <section className="free-tools-section container">
                <div className="section-header reveal">
                    <span className="section-eyebrow">🆓 No Signup Required</span>
                    <h2 className="section-title">Start with Free Tools</h2>
                    <p className="section-subtitle">
                        Try these powerful tools right now — no account or payment needed.
                    </p>
                </div>

                <div className="free-tools-grid reveal-stagger">
                    {freeTools.map((tool, i) => (
                        <Link to={tool.path} className="free-tool-card" key={i}>
                            <span className="free-tool-icon">{tool.icon}</span>
                            <h3>{tool.title}</h3>
                            <p>{tool.desc}</p>
                            <span className="free-tool-badge">Free Forever</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ────────── 9. FAQ ────────── */}
            <section className="faq-section container">
                <div className="section-header reveal">
                    <span className="section-eyebrow">❓ Got Questions?</span>
                    <h2 className="section-title">Frequently Asked Questions</h2>
                </div>

                <div className="faq-container reveal">
                    {faqData.map((item, index) => (
                        <div className={`faq-item ${openFaq === index ? 'active' : ''}`} key={index}>
                            <div className="faq-question" onClick={() => toggleFaq(index)}>
                                {item.question}
                                <span className="faq-toggle-icon">+</span>
                            </div>
                            <div className="faq-answer-container">
                                <div className="faq-answer-inner">
                                    <p>{item.answer}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ────────── 10. FINAL CTA ────────── */}
            <section className="cta-section container">
                <div className="cta-banner reveal">
                    <h2>Ready to Land Your Dream Job?</h2>
                    <p>Join thousands of job seekers who've already transformed their careers with AI.</p>
                    <button onClick={launchTools} className="btn-hero-primary" id="final-cta">
                        {user ? 'Go to Dashboard →' : 'Get Started — It\'s Free →'}
                    </button>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default HomePage;