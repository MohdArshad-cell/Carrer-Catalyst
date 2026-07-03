import React, { useState, useEffect } from 'react';
import AdminUsersTable from '../components/AdminUsersTable';
import { supabase } from '../supabaseClient';
import './AdminDashboard.css'; // <-- Importing your new CSS

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
        const { count: totalCount, error: totalError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const { count: proCount, error: proError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'pro');

        if (totalError) throw totalError;

        setStats({
          totalUsers: totalCount || 0,
          activeSubscribers: proCount || 0,
          apiTokenCost: 0, 
          failedGenerations: 0 
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
    <div className="admin-page">
      <div className="admin-container">
        
        <div className="admin-header">
          <h1>Admin Control Center</h1>
          <p>Monitor system health, API costs, and manage live user accounts.</p>
        </div>
        
        <div className="metrics-grid">
          <div className="metric-card">
            <h3 className="metric-title">Total Users</h3>
            <div className="metric-value">{loadingStats ? '...' : stats.totalUsers}</div>
            <div className="metric-sub">Live Database Count</div>
          </div>

          <div className="metric-card">
            <h3 className="metric-title" style={{ color: '#059669' }}>Active Pro Users</h3>
            <div className="metric-value">{loadingStats ? '...' : stats.activeSubscribers}</div>
            <div className="metric-sub">Paying Customers</div>
          </div>

          <div className="metric-card" style={{ opacity: 0.6 }}>
            <h3 className="metric-title">Est. API Cost</h3>
            <div className="metric-value">$0.00</div>
            <div className="metric-sub neutral">Requires logging setup</div>
          </div>

          <div className="metric-card" style={{ opacity: 0.6 }}>
            <h3 className="metric-title">Failed Generations</h3>
            <div className="metric-value">0</div>
            <div className="metric-sub neutral">System Healthy</div>
          </div>
        </div>

        <AdminUsersTable />

      </div>
    </div>
  );
};

export default AdminDashboardPage;