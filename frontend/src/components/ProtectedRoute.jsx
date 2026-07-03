import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
    // Grouping state to prevent React race conditions
    const [authState, setAuthState] = useState({
        loading: true,
        user: null,
        isAdmin: false
    });

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user ?? null;
            
            let userIsAdmin = false;

            // Only check the database if the user is logged in AND the route requires admin
            if (currentUser && requireAdmin) {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', currentUser.id)
                        .single();

                    if (!error && data && data.role === 'admin') {
                        userIsAdmin = true;
                    }
                } catch (error) {
                    console.error("Admin check failed:", error);
                }
            }

            // Update all state at once when we have the final answer
            setAuthState({
                loading: false,
                user: currentUser,
                isAdmin: userIsAdmin
            });
        };

        checkAuth();
    }, [requireAdmin]);

    // 1. Show this while checking Supabase
    if (authState.loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#666' }}>
                Verifying secure access...
            </div>
        );
    }

    // 2. Not logged in at all? Go to login.
    if (!authState.user) {
        return <Navigate to="/login" replace />;
    }

    // 3. Logged in, but trying to access Admin without Admin rights? Kick to home.
    if (requireAdmin && !authState.isAdmin) {
        console.warn("🚨 Access Denied: You do not have admin privileges.");
        return <Navigate to="/" replace />;
    }

    // 4. Passed all checks! Let them in.
    return children;
};

export default ProtectedRoute;