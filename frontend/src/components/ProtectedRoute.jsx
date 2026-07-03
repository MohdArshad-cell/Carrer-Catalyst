import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
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

            if (currentUser && requireAdmin) {
                console.log("🔐 Checking admin status for UID:", currentUser.id);
                
                try {
                    // METHOD 1: Try the secure RPC function (Bypasses RLS)
                    const { data: rpcData, error: rpcError } = await supabase.rpc('is_admin');
                    
                    if (!rpcError && rpcData === true) {
                        console.log("✅ Admin verified via secure RPC function.");
                        userIsAdmin = true;
                    } else {
                        // METHOD 2: Fallback to direct table query
                        const { data: tableData, error: tableError } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', currentUser.id)
                            .single();

                        if (tableData && tableData.role === 'admin') {
                            console.log("✅ Admin verified via direct table query.");
                            userIsAdmin = true;
                        } else {
                            // 🚨 FAILURE LOGGING - THIS TELLS US EXACTLY WHAT IS WRONG
                            console.error("❌ Admin Verification Failed.");
                            console.error("1. Current User ID:", currentUser.id);
                            console.error("2. RPC Check Result:", rpcData, "| RPC Error:", rpcError);
                            console.error("3. Table Check Data:", tableData, "| Table Error:", tableError);
                            console.error("💡 FIX: Ensure the ID in your auth.users table exactly matches the ID in your profiles table!");
                        }
                    }
                } catch (error) {
                    console.error("🚨 Critical Error during admin check:", error);
                }
            }

            setAuthState({
                loading: false,
                user: currentUser,
                isAdmin: userIsAdmin
            });
        };

        checkAuth();
    }, [requireAdmin]);

    if (authState.loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#666' }}>
                Verifying secure access...
            </div>
        );
    }

    if (!authState.user) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !authState.isAdmin) {
        console.warn("🚨 Access Denied: You do not have admin privileges.");
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;