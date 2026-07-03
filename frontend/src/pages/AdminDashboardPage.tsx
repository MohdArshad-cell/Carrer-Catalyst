import React, { useState, useEffect } from 'react';
import AdminUsersTable from '../components/AdminUsersTable';
import { supabase } from '../supabaseClient';
import './AdminDashboard.css'; 

const AdminDashboardPage = () => {
  // Safe state initialization without strict TS forcing
  const [activeTab, setActiveTab] = useState('overview');
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscribers: 0,
    apiTokenCost: 0,
    failedGenerations: 0,
    monthlyRevenue: 0
  });

  const [loadingStats, setLoadingStats] = useState(true);

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
          apiTokenCost: 12.45, 
          failedGenerations: 2, 
          monthlyRevenue: (proCount || 0) * 15 
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
        
        {/* Header */}
        <div className="admin-header flex justify-between items-center">
          <div>
            <h1>Admin Control Center</h1>
            <p>Monitor system health, AI API costs, and manage live user accounts.</p>
          </div>
          <button className="btn-action btn-add" onClick={() => alert('Download CSV triggered')}>
            📥 Export Data
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 User Management
          </button>
          <button 
            className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            ⚙️ AI System Logs
          </button>
          <button 
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            🛠️ Platform Settings
          </button>
        </div>
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="tab-content fade-in">
            <div className="metrics-grid">
              <div className="metric-card">
                <h3 className="metric-title">Total Users</h3>
                <div className="metric-value">{loadingStats ? '...' : stats.totalUsers}</div>
                <div className="metric-sub">Live Database Count</div>
              </div>

              <div className="metric-card">
                <h3 className="metric-title" style={{ color: '#059669' }}>Monthly Revenue (Est)</h3>
                <div className="metric-value text-green-600">${loadingStats ? '...' : stats.monthlyRevenue}</div>
                <div className="metric-sub">{stats.activeSubscribers} Active Pro Users</div>
              </div>

              <div className="metric-card">
                <h3 className="metric-title" style={{ color: '#ea580c' }}>LLM API Cost (30d)</h3>
                {/* Added fallback to prevent .toFixed crashing on undefined */}
                <div className="metric-value">${(stats?.apiTokenCost || 0).toFixed(2)}</div>
                <div className="metric-sub neutral">Requires token logging table</div>
              </div>

              <div className="metric-card">
                <h3 className="metric-title" style={{ color: '#dc2626' }}>Failed Generations</h3>
                <div className="metric-value">{stats.failedGenerations}</div>
                <div className="metric-sub" style={{ color: stats.failedGenerations > 0 ? '#dc2626' : '#10b981' }}>
                  {stats.failedGenerations > 0 ? 'Action Required' : 'System Healthy'}
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="panel-card">
                <h2 className="panel-header">📈 Feature Usage Breakdown</h2>
                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                  [ Chart Component will go here ]
                </div>
              </div>

              <div className="panel-card">
                <h2 className="panel-header">⚡ Recent Activity</h2>
                <ul className="activity-list">
                  <li className="activity-item">
                    <span className="activity-icon">📄</span>
                    <div className="activity-details">
                      <p><strong>john@example.com</strong> generated a Cover Letter</p>
                      <div className="activity-time">2 mins ago</div>
                    </div>
                  </li>
                  <li className="activity-item">
                    <span className="activity-icon">🔍</span>
                    <div className="activity-details">
                      <p><strong>sarah@tech.com</strong> used ATS X-Ray</p>
                      <div className="activity-time">15 mins ago</div>
                    </div>
                  </li>
                  <li className="activity-item">
                    <span className="activity-icon">👤</span>
                    <div className="activity-details">
                      <p>New user signup: <strong>alex@mail.com</strong></p>
                      <div className="activity-time">1 hour ago</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="tab-content fade-in">
            <AdminUsersTable />
          </div>
        )}

        {/* TAB 3: SYSTEM LOGS */}
        {activeTab === 'logs' && (
          <div className="tab-content fade-in">
            <div className="panel-card">
              <h2 className="panel-header">🚨 System & AI Generation Logs</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Track OpenAI/Gemini API timeouts, LaTeX compilation errors, and backend failures.
              </p>
              
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th>User ID / Message</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2023-10-24 14:32:01</td>
                    <td><span className="badge admin">LaTeX Compiler</span></td>
                    <td><span className="badge" style={{ background: '#fef2f2', color: '#dc2626' }}>Error 500</span></td>
                    <td>Unescaped '&' character in Work Experience</td>
                  </tr>
                  <tr>
                    <td>2023-10-24 14:28:15</td>
                    <td><span className="badge pro">Gemini API</span></td>
                    <td><span className="badge" style={{ background: '#ecfdf5', color: '#059669' }}>Success (2.1s)</span></td>
                    <td>Generated Cover Letter (245 tokens)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="tab-content fade-in">
            <div className="panel-card" style={{ maxWidth: '600px' }}>
              <h2 className="panel-header">🛠️ Global Platform Settings</h2>
              
              <div className="settings-group">
                <label>Default Free Tokens on Signup</label>
                <input type="number" defaultValue={15} className="search-input" style={{ width: '100px' }} />
              </div>

              <div className="settings-group">
                <label>Token Cost: AI Tailor Resume</label>
                <input type="number" defaultValue={5} className="search-input" style={{ width: '100px' }} />
              </div>

              <div className="settings-group" style={{ marginTop: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                <label style={{ color: '#dc2626' }}>Danger Zone</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn-action btn-ban">Enable Maintenance Mode</button>
                  <button className="btn-action btn-ban" style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}>Clear System Logs</button>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                  Maintenance mode will lock all non-admin users out of the AI generation tools.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboardPage;