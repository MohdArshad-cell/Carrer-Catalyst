import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient'; // Uncomment when ready

// 1. Define the exact shape of your User data
interface User {
  id: string;
  email: string;
  role: string;
  tokens: number;
  status: string;
  joined: string;
}

const AdminUsersTable = () => {
  // 2. Tell TypeScript this array will hold 'User' objects
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    // Mock Data for UI Building
    setTimeout(() => {
      setUsers([
        { id: '1', email: 'john.doe@example.com', role: 'user', tokens: 15, status: 'Active', joined: '2023-10-12' },
        { id: '2', email: 'admin@careercatalyst.com', role: 'admin', tokens: 999, status: 'Active', joined: '2023-09-01' },
        { id: '3', email: 'sarah.smith@techcorp.com', role: 'pro', tokens: 150, status: 'Active', joined: '2023-10-15' },
        { id: '4', email: 'spammer123@tempmail.com', role: 'user', tokens: 0, status: 'Banned', joined: '2023-10-18' },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const filteredUsers = users.filter((user) => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 3. Tell TypeScript that userId is a string
  const handleGrantTokens = (userId: string) => {
    alert(`Granting 50 tokens to user ID: ${userId}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">User Management</h2>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search by email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium">User</th>
              <th className="p-4 font-medium">Role / Tier</th>
              <th className="p-4 font-medium">AI Tokens</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Joined</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">Loading user data...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No users found matching "{searchTerm}"</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800 text-sm">{user.email}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'pro' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                      <span className="text-cyan-500">💎</span> {user.tokens}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{user.joined}</td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => handleGrantTokens(user.id)}
                      className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                      title="Grant 50 AI Tokens"
                    >
                      + Tokens
                    </button>
                    <button 
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors"
                      title={user.status === 'Banned' ? 'Unban User' : 'Ban User'}
                    >
                      {user.status === 'Banned' ? 'Unban' : 'Ban'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersTable;