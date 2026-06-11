import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Make sure path is correct

const Navbar = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        // 1. Page load hote hi check karo ki kya user logged in hai?
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        // 2. Agar user background mein login/logout karta hai, toh turant update karo
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Logout ka function
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/'); // Logout hone ke baad home par bhej do
    };

    return (
        <nav className="navbar">
            <div className="container nav-container">
                <Link to="/" className="nav-logo">
                    Career<span>Catalyst</span>
                </Link>
                
                <div className="nav-links">
                    <a href="/#full-bento-grid">Features</a>
                    <a href="/#footer">Contact</a>
                    
                    {/* Yahan Asli Magic Hai: Conditional Rendering */}
                    {user ? (
                        /* AGAR USER LOGGED IN HAI: */
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button onClick={() => navigate('/ai-tools')} className="nav-cta-premium" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}>
                                Dashboard
                            </button>
                            <button onClick={handleLogout} className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', color: '#ef4444', borderColor: '#ef4444' }}>
                                Logout
                            </button>
                        </div>
                    ) : (
                        /* AGAR USER LOGGED OUT HAI: */
                        <button onClick={() => navigate('/login')} className="nav-cta-premium">
                            Launch App
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;