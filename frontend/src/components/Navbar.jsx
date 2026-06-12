import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 

const Navbar = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [tokens, setTokens] = useState(null); // New state for token count

    useEffect(() => {
        // Fetch session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) fetchTokenBalance(currentUser.id);
        });

        // Listen for auth changes (login/logout)
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

    // Fetch user's token balance from Supabase profiles table
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
        navigate('/'); 
    };

    return (
        <nav className="navbar">
            <div className="container nav-container">
                <Link to="/" className="nav-logo">
                    Career<span>Catalyst</span>
                </Link>
                
                <div className="nav-links">
                    <a href="/#full-bento-grid">Features</a>
                    
                    {/* Always visible Pricing link */}
                    <Link to="/pricing" style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>
                        Pricing
                    </Link>

                    {user ? (
                        /* --- IF LOGGED IN --- */
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            
                            {/* Token Balance / Upgrade Pill */}
                            <button 
                                onClick={() => navigate('/pricing')} 
                                className="token-pill"
                                title="Click to buy more tokens"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
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
                                onClick={() => navigate('/ai-tools')} 
                                className="nav-cta-premium" 
                                style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)' }}
                            >
                                Dashboard
                            </button>
                            
                            <button onClick={handleLogout} className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                                Logout
                            </button>
                        </div>
                    ) : (
                        /* --- IF LOGGED OUT --- */
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button onClick={() => navigate('/login')} className="nav-cta-premium">
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