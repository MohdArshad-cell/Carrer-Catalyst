import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Added requireAdmin prop (defaults to false for normal user routes)
const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAuthAndRole = async () => {
            // 1. Get current session
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            // 2. If user is logged in AND this specific route requires admin
            if (currentUser && requireAdmin) {
                try {
                    // Fetch the user's role from your database
                    // Note: Change 'profiles' to whatever your user data table is named
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', currentUser.id)
                        .single();

                    if (error) throw error;
                    
                    // Check if the role is exactly 'admin'
                    if (data && data.role === 'admin') {
                        setIsAdmin(true);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setIsAdmin(false);
                }
            }
            
            setLoading(false);
        };

        checkAuthAndRole();

        // Listen for changes (login/logout events)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false); 
            // Note: On sudden auth state changes, a hard refresh of role might be needed, 
            // but keeping it simple here for standard login flows.
        });

        return () => subscription.unsubscribe();
    }, [requireAdmin]);

    // Show a loading state while checking Supabase
    if (loading) return <div className="loading-spinner flex justify-center items-center h-screen">Checking authorization...</div>;

    // Rule 1: If nobody is logged in, kick them to login page
    if (!user) return <Navigate to="/login" replace />;

    // Rule 2: If the route requires an admin, but the user is NOT an admin, kick them out
    if (requireAdmin && !isAdmin) {
        console.warn("Unauthorized access attempt to admin area blocked.");
        return <Navigate to="/" replace />; // Send them back to homepage
    }

    // Rule 3: They passed the checks. Let them in.
    return children;
};

export default ProtectedRoute;