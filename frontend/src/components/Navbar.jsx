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
                    
                    <Link to="/pricing" style={{ color: 'var(--accent-cyan)', fontWeight: '600' }} onClick={closeMenu}>
                        Pricing
                    </Link>

                    {user ? (
                        <div className="nav-action-group">
                            {/* ✅ Admin Button (Only visible if isAdmin is true) */}
                            {isAdmin && (
                                <button 
                                    onClick={() => { navigate('/admin'); closeMenu(); }} 
                                    className="btn-outline"
                                    style={{ borderColor: '#f59e0b', color: '#f59e0b' }} 
                                    title="Go to Admin Dashboard"
                                >
                                    Admin View
                                </button>
                            )}

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