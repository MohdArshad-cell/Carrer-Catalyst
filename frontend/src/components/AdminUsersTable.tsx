import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface UserData {
  id: string;
  email: string;
  role: string;
  tokens: number;
}

const AdminUsersTable = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchRealUsers = async () => {
      try {
        // 1. Fetch all profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('id', { ascending: false });

        if (profilesError) throw profilesError;

        // 2. Fetch all token ledgers
        const { data: tokensData, error: tokensError } = await supabase
          .from('token_ledger')
          .select('*');

        if (tokensError) throw tokensError;

        // 3. Merge the data manually (safest method to avoid PostgREST join errors)
        const mergedUsers: UserData[] = profilesData.map((profile: any) => {
          // Find this user's token balance (default to 0 if they don't have one yet)
          const userLedger = tokensData?.find((t: any) => t.user_id === profile.id);
          
          return {
            id: profile.id,
            email: profile.email || 'No email attached',
            role: profile.role || 'user',
            tokens: userLedger ? userLedger.tokens_balance : 0
          };
        });

        setUsers(mergedUsers);
      } catch (error) {
        console.error("Error fetching admin user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealUsers();
  }, []);

  const filteredUsers = users.filter((user) => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGrantTokens = (userId: string) => {
    // We will wire this up next!
    alert(`Backend API call needed to grant tokens to: ${userId}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full">
      <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Live User Database</h2>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search by email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <th className="p-4 font-medium">User Email</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">AI Tokens</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">Loading live database...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No users found.</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
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
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => handleGrantTokens(user.id)}
                      className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                    >
                      + 50 Tokens
                    </button>
                    <button 
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors"
                    >
                      Ban
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