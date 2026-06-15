import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 

const Navbar = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [tokens, setTokens] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 📱 New state for mobile menu

    useEffect(() => {
        // Fetch session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) fetchTokenBalance(currentUser.id);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchTokenBalance(currentUser.id);
            } else {
                setTokens(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchTokenBalance = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('tokens')
                .eq('id', userId)
                .single();
                
            if (error) throw error;
            if (data) setTokens(data.tokens);
        } catch (err) {
            console.error("Error fetching tokens:", err.message);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsMobileMenuOpen(false); // Close menu on logout
        navigate('/'); 
    };

    const closeMenu = () => setIsMobileMenuOpen(false); // Helper to close menu on link click

    return (
        <nav className="navbar">
            <div className="container nav-container">
                <Link to="/" className="nav-logo" onClick={closeMenu}>
                    Career<span>Catalyst</span>
                </Link>
                
                {/* 📱 Hamburger Button (Visible only on mobile) */}
                <button 
                    className="mobile-menu-btn"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? '✖' : '☰'}
                </button>
                
                {/* Links Container (Toggles .active class on mobile) */}
                <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
                    <a href="/#full-bento-grid" onClick={closeMenu}>Features</a>
                    
                    <Link to="/pricing" style={{ color: 'var(--accent-cyan)', fontWeight: '600' }} onClick={closeMenu}>
                        Pricing
                    </Link>

                    {user ? (
                        /* --- IF LOGGED IN --- */
                        <div className="nav-action-group">
                            {/* Token Balance */}
                            <button 
                                onClick={() => { navigate('/pricing'); closeMenu(); }} 
                                className="token-pill"
                                title="Click to buy more tokens"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
                                    background: 'rgba(0, 229, 255, 0.1)',
                                    border: '1px solid rgba(0, 229, 255, 0.3)',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '50px',
                                    color: 'var(--accent-cyan)',
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 229, 255, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 229, 255, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                <span style={{ fontSize: '1rem' }}>💎</span>
                                {tokens !== null ? `${tokens} Tokens` : '...'}
                            </button>

                            <button 
                                onClick={() => { navigate('/ai-tools'); closeMenu(); }} 
                                className="nav-cta-premium" 
                                style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)' }}
                            >
                                Dashboard
                            </button>
                            
                            <button onClick={handleLogout} className="btn-outline logout-btn">
                                Logout
                            </button>
                        </div>
                    ) : (
                        /* --- IF LOGGED OUT --- */
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