import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trash2, UserPlus, Shield, Loader2, Search, AlertCircle } from 'lucide-react';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  created_at: string;
}

export const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Form State for Adding Users
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [newFullName, setNewFullName] = useState<string>('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch all user profiles from database
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  // Add / Invite New User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('add');
    setError(null);

    try {
      // Invite user via Supabase Auth
      const { data, error: authError } = await supabase.auth.admin.inviteUserByEmail(newEmail, {
        data: { full_name: newFullName, role: newRole }
      });

      // Fallback: If using public signup or manual profile insertion
      if (authError) {
        // Direct profile insert fallback if Auth Admin API is unavailable client-side
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            email: newEmail,
            full_name: newFullName,
            role: newRole,
          }
        ]);
        if (profileError) throw profileError;
      }

      setNewEmail('');
      setNewFullName('');
      setNewRole('user');
      setIsAddModalOpen(false);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to add user.');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete User Function (Alters Database & Auth)
  const handleDeleteUser = async (userId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to permanently delete this user? This action alters the database and cannot be undone.');
    if (!confirmDelete) return;

    setActionLoading(userId);
    setError(null);

    try {
      // Call the secure Postgres RPC function created in Step 1
      const { error: rpcError } = await supabase.rpc('delete_user_by_admin', {
        target_user_id: userId
      });

      if (rpcError) throw rpcError;

      // Update state locally upon successful database alteration
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete user from database.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">Manage user roles, provision accounts, and remove users.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 transition"
        >
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-12 text-gray-500 gap-2">
            <Loader2 className="animate-spin" size={20} />
            <span>Loading user accounts...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            No users found matching your criteria.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{user.full_name || 'N/A'}</div>
                    <div className="text-gray-500 text-xs">{user.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role === 'admin' && <Shield size={12} />}
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={actionLoading === user.id}
                      className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-50 disabled:opacity-50 transition"
                      title="Delete User"
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'add'}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {actionLoading === 'add' && <Loader2 className="animate-spin" size={14} />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};