import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 

const Navbar = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [tokens, setTokens] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false); // ✅ Added Admin State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchTokenBalance(currentUser.id);
                checkUserRole(currentUser.id); // ✅ Check role on load
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchTokenBalance(currentUser.id);
                checkUserRole(currentUser.id); // ✅ Check role on auth change
            } else {
                setTokens(null);
                setIsAdmin(false); // ✅ Reset on logout
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // ✅ Added function to check if user has 'admin' role in database
    const checkUserRole = async (userId) => {
        try {
            // Note: Ensure you have a 'profiles' or 'users' table with a 'role' column
            const { data, error } = await supabase
                .from('profiles') 
                .select('role')
                .eq('id', userId)
                .single();
                
            if (error) throw error;
            if (data && data.role === 'admin') {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        } catch (err) {
            console.error("Error fetching user role:", err.message);
            setIsAdmin(false);
        }
    };

    const fetchTokenBalance = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('token_ledger')
                .select('tokens_balance')
                .eq('user_id', userId)
                .single();
                
            if (error) throw error;
            if (data) setTokens(data.tokens_balance); 
        } catch (err) {
            console.error("Error fetching tokens:", err.message);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsMobileMenuOpen(false);
        navigate('/'); 
    };

    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <nav className="navbar">
            <div className="container nav-container">
                <Link to="/" className="nav-logo" onClick={closeMenu}>
                    Career<span>Catalyst</span>
                </Link>
                
                <button 
                    className="mobile-menu-btn"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? '✖' : '☰'}
                </button>
                
                <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
                    <Link to="/features" onClick={closeMenu}>Features</Link>
                    
                    <div className="nav-dropdown">
                        <button className="nav-dropdown-btn">
                            Free Tools <span>▼</span>
                        </button>
                        <div className="nav-dropdown-content">
                            <Link to="/bullet-rewriter" onClick={closeMenu}>✨ Bullet Rewriter</Link>
                            <Link to="/job-fit" onClick={closeMenu}>🎯 Job Fit Score</Link>
                            <Link to="/resignation-letter" onClick={closeMenu}>✉️ Resignation Letter</Link>
                            <Link to="/resume-diff" onClick={closeMenu}>🔍 Resume Diff Tool</Link>
                        </div>
                    </div>
                    
                    <Link to="/pricing" style={{ color: 'var(--accent-cyan)', fontWeight: '600' }} onClick={closeMenu}>
                        Pricing
                    </Link>

                    {user ? (
                        <div className="nav-action-group">
                            <button 
                                onClick={() => { navigate('/pricing'); closeMenu(); }} 
                                className="token-pill"
                                title="Click to buy more tokens"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
                                    background: tokens !== null && tokens <= 1 
                                        ? 'rgba(239, 68, 68, 0.15)' 
                                        : tokens !== null && tokens <= 5 
                                            ? 'rgba(245, 158, 11, 0.15)' 
                                            : 'rgba(0, 229, 255, 0.1)',
                                    border: `1px solid ${tokens !== null && tokens <= 1 
                                        ? 'rgba(239, 68, 68, 0.4)' 
                                        : tokens !== null && tokens <= 5 
                                            ? 'rgba(245, 158, 11, 0.4)' 
                                            : 'rgba(0, 229, 255, 0.3)'}`,
                                    padding: '0.4rem 1rem',
                                    borderRadius: '50px',
                                    color: tokens !== null && tokens <= 1 
                                        ? '#ef4444' 
                                        : tokens !== null && tokens <= 5 
                                            ? '#f59e0b' 
                                            : 'var(--accent-cyan)',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.3s ease',
                                    animation: tokens !== null && tokens <= 1 ? 'pulse 2s infinite' : 'none'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                <span style={{ fontSize: '1rem' }}>{tokens !== null && tokens <= 1 ? '🔴' : tokens !== null && tokens <= 5 ? '🟡' : '💎'}</span>
                                {tokens !== null ? `${tokens} Tokens` : '...'}
                            </button>

                            <button 
                                onClick={() => { navigate('/ai-tools'); closeMenu(); }} 
                                className="nav-cta-premium" 
                                style={{ whiteSpace: 'nowrap', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)' }}
                            >
                                Dashboard
                            </button>

                            {/* USER PROFILE DROPDOWN */}
                            <div className="nav-dropdown">
                                <button className="nav-dropdown-btn profile-btn">
                                    <span style={{ fontSize: '1.2rem' }}>👤</span> Account <span className="dropdown-arrow">▼</span>
                                </button>
                                <div className="nav-dropdown-content profile-dropdown-content">
                                    {isAdmin && (
                                        <Link to="/admin" onClick={closeMenu}>🛡️ Admin View</Link>
                                    )}
                                    <Link to="/referrals" onClick={closeMenu}>🎁 Refer & Earn</Link>
                                    <Link to="/history" onClick={closeMenu}>🕒 History</Link>
                                    <div className="dropdown-divider"></div>
                                    <button onClick={handleLogout} className="dropdown-logout-btn">
                                        🚪 Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="nav-action-group">
                            <button onClick={() => { navigate('/login'); closeMenu(); }} className="nav-cta-premium w-100">
                                Launch App
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;