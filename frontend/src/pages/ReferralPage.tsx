import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Share2, Copy, CheckCircle, Gift, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import { useToast } from '../components/Toast';
import { supabase } from '../supabaseClient';
import './AiTailorPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const ReferralPage: React.FC = () => {
    const { showToast } = useToast();
    const [stats, setStats] = useState<any>(null);
    const [referralCode, setReferralCode] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const [redeemCode, setRedeemCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

    useEffect(() => {
        fetchReferralData();
    }, []);

    const fetchReferralData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await axios.get(`${API_BASE_URL}/api/referral/stats`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            
            setReferralCode(response.data.referral_code);
            setStats(response.data.stats);
        } catch (err) {
            console.error("Error fetching referral stats:", err);
            showToast("Failed to load referral data.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        const url = `${window.location.origin}/signup?ref=${referralCode}`;
        navigator.clipboard.writeText(url);
        setIsCopied(true);
        showToast("Referral link copied!", "success");
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleRedeem = async () => {
        if (!redeemCode.trim()) {
            showToast("Please enter a code to redeem.", "warning");
            return;
        }
        setIsRedeeming(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            await axios.post(`${API_BASE_URL}/api/referral/redeem`, { code: redeemCode.trim() }, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            
            showToast("Code redeemed successfully! +5 Tokens", "success");
            setRedeemCode('');
            fetchReferralData(); // Refresh to show updated tokens if needed (though tokens are tracked globally)
            
            // Reload page to update navbar tokens
            setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
            console.error("Redeem error:", err);
            showToast(err.response?.data?.detail || "Failed to redeem code.", "error");
        } finally {
            setIsRedeeming(false);
        }
    };

    return (
        <div className="page-container">
            <ParticleBackground />
            <div className="background-aurora"></div>
            <Navbar />

            <div className="tailor-studio-container" style={{ paddingTop: '100px', paddingBottom: '3rem', maxWidth: '800px', margin: '0 auto' }}>
                
                <div className="studio-header text-center" style={{ marginBottom: '3rem' }}>
                    <div className="hero-badge" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                        <Gift size={16} style={{ display: 'inline', marginRight: '5px' }}/> Earn Free Tokens
                    </div>
                    <h1 className="animated-gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(90deg, #eab308, #f59e0b)' }}>Refer a Friend</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Give 5 tokens, get 5 tokens. Invite your network to Career Catalyst and earn free AI generations.</p>
                </div>

                {!isLoading && stats ? (
                    <>
                        <div className="panel glass-card text-center" style={{ marginBottom: '2rem', padding: '3rem' }}>
                            <h2 style={{ color: 'white', marginBottom: '1rem' }}>Your Unique Referral Link</h2>
                            
                            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '10px', marginBottom: '1.5rem', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                                <div style={{ flexGrow: 1, textAlign: 'left', color: '#eab308', fontFamily: 'monospace', fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {window.location.origin}/signup?ref={referralCode}
                                </div>
                                <button className="btn-premium" onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.6rem 1rem', background: 'linear-gradient(45deg, #eab308, #d97706)' }}>
                                    {isCopied ? <CheckCircle size={18}/> : <Copy size={18}/>}
                                    {isCopied ? 'Copied!' : 'Copy Link'}
                                </button>
                            </div>

                            <p style={{ color: 'var(--text-secondary)' }}>Share this link. When someone signs up, you both get 5 tokens instantly.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                            <div className="panel glass-card text-center" style={{ padding: '2rem' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#3b82f6' }}>{stats.completed}</div>
                                <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                    <Users size={16}/> Friends Joined
                                </div>
                            </div>
                            <div className="panel glass-card text-center" style={{ padding: '2rem' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#10b981' }}>{stats.tokens_earned}</div>
                                <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                    <Gift size={16}/> Tokens Earned
                                </div>
                            </div>
                        </div>

                        {/* Redeem Section */}
                        <div className="panel glass-card" style={{ padding: '2rem', borderTop: '4px solid #3b82f6' }}>
                            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Have a referral code?</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Enter a friend's code below to claim your 5 free tokens.</p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input 
                                    type="text" 
                                    className="premium-textarea" 
                                    value={redeemCode} 
                                    onChange={(e) => setRedeemCode(e.target.value)}
                                    placeholder="Enter Code (e.g. ABC123XX)"
                                    style={{ flexGrow: 1, minHeight: '50px' }}
                                    disabled={isRedeeming}
                                />
                                <button 
                                    className="btn-premium" 
                                    onClick={handleRedeem}
                                    disabled={isRedeeming || !redeemCode.trim()}
                                    style={{ padding: '0 2rem' }}
                                >
                                    {isRedeeming ? 'Redeeming...' : 'Redeem'}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center" style={{ color: 'white', padding: '3rem' }}>Loading referral data...</div>
                )}
            </div>
            
            <Footer />
        </div>
    );
};

export default ReferralPage;
