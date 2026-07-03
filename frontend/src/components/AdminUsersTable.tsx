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
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('id', { ascending: false });

        if (profilesError) throw profilesError;

        const { data: tokensData, error: tokensError } = await supabase
          .from('token_ledger')
          .select('*');

        if (tokensError) throw tokensError;

        const mergedUsers: UserData[] = profilesData.map((profile: any) => {
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
    alert(`Backend API call needed to grant tokens to: ${userId}`);
  };

  return (
    <div className="admin-table-container">
      <div className="table-header">
        <h2>Live User Database</h2>
        <input
          type="text"
          placeholder="Search by email..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User Email</th>
              <th>Role</th>
              <th>AI Tokens</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  Loading live database...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div className="token-cell">
                      <span style={{ color: '#06b6d4' }}>💎</span> {user.tokens}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleGrantTokens(user.id)}
                        className="btn-action btn-add"
                      >
                        + 50 Tokens
                      </button>
                      <button className="btn-action btn-ban">
                        Ban
                      </button>
                    </div>
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