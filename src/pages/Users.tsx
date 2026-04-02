import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  User, 
  Mail, 
  Shield, 
  Calendar,
  CheckCircle2,
  XCircle,
  MoreVertical,
  UserCog
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Users: React.FC = () => {
  const { profile: currentProfile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        headers: { 'x-user-role': currentProfile?.role || '' }
      });
      if (!res.ok) throw new Error('Unauthorized');
      setUsers(await res.json());
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser || !newRole) return;
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/role`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': currentProfile?.role || ''
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
      }
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  const isAdmin = currentProfile?.role === 'admin';

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      warehouse_manager: 'bg-blue-100 text-blue-700 border-blue-200',
      supplier: 'bg-orange-100 text-orange-700 border-orange-200',
      customer: 'bg-green-100 text-green-700 border-green-200'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[role] || 'bg-slate-100 text-slate-700'}`}>
        {role.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#0F172A] outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F8F9FA] text-[#64748B] text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-8 bg-slate-50/50"></td>
                  </tr>
                ))
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#F8F9FA] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#F1F5F9] rounded-full flex items-center justify-center text-[#0F172A] font-bold">
                        {user.display_name?.[0]?.toUpperCase() || <User size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0F172A]">{user.display_name}</p>
                        <p className="text-xs text-[#64748B]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                      <CheckCircle2 size={14} />
                      Active
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isAdmin && (
                      <button 
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(user.role);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <UserCog size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#E5E7EB]">
                <h2 className="text-xl font-bold text-[#0F172A]">Change User Role</h2>
                <p className="text-sm text-[#64748B] mt-1">Updating role for {selectedUser?.display_name}</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#334155] mb-2">Select New Role</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['admin', 'warehouse_manager', 'supplier', 'customer'].map((role) => (
                      <button
                        key={role}
                        onClick={() => setNewRole(role)}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          newRole === role 
                            ? 'border-[#0F172A] bg-[#F8F9FA]' 
                            : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <span className="font-bold text-sm text-[#0F172A] capitalize">
                          {role.replace('_', ' ')}
                        </span>
                        {newRole === role && <CheckCircle2 size={18} className="text-[#0F172A]" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 px-4 border border-[#E2E8F0] text-[#64748B] font-bold rounded-xl hover:bg-[#F8F9FA]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRoleUpdate}
                    className="flex-1 py-3 px-4 bg-[#0F172A] text-white font-bold rounded-xl hover:bg-[#1E293B]"
                  >
                    Update Role
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;
