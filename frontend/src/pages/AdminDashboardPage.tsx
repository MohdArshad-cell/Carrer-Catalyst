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

  const [logs, setLogs] = useState<any[]>([]);
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

        const { data: logData, error: logError } = await supabase
          .from('generation_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (totalError) throw totalError;

        const fetchedLogs = logData || [];
        const failed = fetchedLogs.filter(l => l.status === 'failed').length;

        setStats({
          totalUsers: totalCount || 0,
          activeSubscribers: proCount || 0,
          apiTokenCost: fetchedLogs.length * 0.01, 
          failedGenerations: failed, 
          monthlyRevenue: (proCount || 0) * 15 
        });
        
        setLogs(fetchedLogs);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    /* ✅ ADDED THIS WRAPPER TO BLOCK APP.CSS STYLES */
    <div className="admin-isolate-wrapper">
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
            <div className="admin-tab-content fade-in">
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
                    {logs.slice(0, 5).map((log, idx) => (
                      <li className="activity-item" key={idx}>
                        <span className="activity-icon">{log.status === 'success' ? '✅' : '❌'}</span>
                        <div className="activity-details">
                          <p>User <strong>{log.user_id.substring(0,8)}...</strong> triggered <strong>{log.action}</strong></p>
                          <div className="activity-time">{new Date(log.created_at).toLocaleString()}</div>
                        </div>
                      </li>
                    ))}
                    {logs.length === 0 && <li className="activity-item">No recent activity</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="admin-tab-content fade-in">
              <AdminUsersTable />
            </div>
          )}

          {/* TAB 3: SYSTEM LOGS */}
          {activeTab === 'logs' && (
            <div className="admin-tab-content fade-in">
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
                    {logs.map((log, idx) => (
                      <tr key={idx}>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                        <td><span className={`badge ${log.action === 'ai_tailor' ? 'pro' : 'admin'}`}>{log.action}</span></td>
                        <td>
                          <span className="badge" style={{ background: log.status === 'success' ? '#ecfdf5' : '#fef2f2', color: log.status === 'success' ? '#059669' : '#dc2626' }}>
                            {log.status} {log.latency_ms ? `(${log.latency_ms}ms)` : ''}
                          </span>
                        </td>
                        <td>{log.error_message || `Tokens: ${log.tokens_deducted}`}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && <tr><td colSpan={4} className="text-center">No logs found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="admin-tab-content fade-in">
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
    </div>
  );
};

export default AdminDashboardPage;