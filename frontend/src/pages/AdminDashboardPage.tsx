import React, { useState, useEffect } from 'react';
import AdminUsersTable from '../components/AdminUsersTable';

// 1. Define the shape of your dashboard statistics
interface DashboardStats {
  totalUsers: number;
  activeSubscribers: number;
  apiTokenCost: number;
  failedGenerations: number;
}

const AdminDashboardPage = () => {
  // 2. Apply the interface to the state
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscribers: 0,
    apiTokenCost: 0,
    failedGenerations: 0
  });

  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  useEffect(() => {
    // Mock Data for UI
    setTimeout(() => {
      setStats({
        totalUsers: 1245,
        activeSubscribers: 89,
        apiTokenCost: 42.50,
        failedGenerations: 3
      });
      setLoadingStats(false);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Admin Control Center
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Monitor system health, API costs, and manage user accounts.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Users</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {loadingStats ? '...' : stats.totalUsers}
                </span>
              </div>
            </div>
            <div className="mt-4 text-sm text-green-600 font-medium">↑ 12% from last month</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wider">Active Pro Users</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {loadingStats ? '...' : stats.activeSubscribers}
                </span>
              </div>
            </div>
            <div className="mt-4 text-sm text-green-600 font-medium">Generating recurring revenue</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider">Estimated LLM Cost</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  ${loadingStats ? '...' : stats.apiTokenCost.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">This billing cycle</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Failed Generations</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {loadingStats ? '...' : stats.failedGenerations}
                </span>
              </div>
            </div>
            <div className="mt-4 text-sm text-orange-600 font-medium">
              {stats.failedGenerations > 0 ? 'Requires investigation' : 'System healthy'}
            </div>
          </div>

        </div>

        <div className="mt-8">
          <AdminUsersTable />
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;