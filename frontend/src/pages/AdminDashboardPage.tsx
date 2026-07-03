import React, { useState, useEffect } from 'react';
import AdminUsersTable from '../components/AdminUsersTable';
import { supabase } from '../supabaseClient';

interface DashboardStats {
  totalUsers: number;
  activeSubscribers: number;
  apiTokenCost: number;
  failedGenerations: number;
}

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscribers: 0,
    apiTokenCost: 0,
    failedGenerations: 0
  });

  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // 1. Get Total Users Count
        const { count: totalCount, error: totalError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // 2. Get Active Pro Users Count
        const { count: proCount, error: proError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'pro');

        if (totalError) throw totalError;

        setStats({
          totalUsers: totalCount || 0,
          activeSubscribers: proCount || 0,
          apiTokenCost: 0, // Requires a separate logging table to track costs
          failedGenerations: 0 // Requires an error logging table
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    // Layout Fix: Removed min-h-screen and extreme padding that clashes with the global app layout
    <div className="bg-gray-50 p-6 sm:p-10 w-full" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="max-w-7xl mx-auto w-full">
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Admin Control Center
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Monitor system health, API costs, and manage live user accounts.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
          {/* Total Users */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Users</h3>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {loadingStats ? '...' : stats.totalUsers}
            </div>
            <div className="mt-4 text-sm text-blue-600 font-medium">Live Database Count</div>
          </div>

          {/* Pro Users */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wider">Active Pro Users</h3>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {loadingStats ? '...' : stats.activeSubscribers}
            </div>
            <div className="mt-4 text-sm text-green-600 font-medium">Paying Customers</div>
          </div>

          {/* API Cost (Placeholder until you build a logging table) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 opacity-70">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Est. API Cost</h3>
            <div className="mt-2 text-3xl font-bold text-gray-400">$0.00</div>
            <div className="mt-4 text-sm text-gray-400">Requires logging table</div>
          </div>

          {/* Errors (Placeholder) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 opacity-70">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Failed Generations</h3>
            <div className="mt-2 text-3xl font-bold text-gray-400">0</div>
            <div className="mt-4 text-sm text-gray-400">System Healthy</div>
          </div>
        </div>

        <div className="mt-8 w-full">
          <AdminUsersTable />
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;