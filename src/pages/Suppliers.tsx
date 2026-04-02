import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Plus, 
  Truck, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Edit2, 
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Suppliers: React.FC = () => {
  const { profile } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    suppliername: '',
    contactname: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers');
      setSuppliers(await res.json());
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingSupplier ? `/api/suppliers/${editingSupplier.supplierid}` : '/api/suppliers';
    const method = editingSupplier ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingSupplier(null);
        setFormData({ suppliername: '', contactname: '', phone: '', email: '', address: '' });
        fetchSuppliers();
      }
    } catch (err) {
      console.error('Error saving supplier:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) fetchSuppliers();
    } catch (err) {
      console.error('Error deleting supplier:', err);
    }
  };

  const canManage = ['admin', 'warehouse_manager'].includes(profile?.role || '');

  const filteredSuppliers = suppliers.filter(s => 
    s.suppliername.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#0F172A] outline-none transition-all"
          />
        </div>
        {canManage && (
          <button 
            onClick={() => {
              setEditingSupplier(null);
              setFormData({ suppliername: '', contactname: '', phone: '', email: '', address: '' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0F172A] text-white font-semibold rounded-xl hover:bg-[#1E293B] transition-all shadow-lg shadow-slate-200"
          >
            <Plus size={18} />
            Add Supplier
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white h-48 rounded-2xl border border-[#E5E7EB] animate-pulse"></div>
          ))
        ) : filteredSuppliers.map((supplier) => (
          <motion.div
            key={supplier.supplierid}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all overflow-hidden group"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Truck size={24} />
                </div>
                {canManage && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingSupplier(supplier);
                        setFormData({
                          suppliername: supplier.suppliername,
                          contactname: supplier.contactname,
                          phone: supplier.phone,
                          email: supplier.email,
                          address: supplier.address
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-[#64748B] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(supplier.supplierid)}
                      className="p-2 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-bold text-[#0F172A] text-lg mb-1">{supplier.suppliername}</h3>
              <div className="flex items-center gap-2 text-sm text-[#64748B] mb-4">
                <User size={14} />
                {supplier.contactname}
              </div>

              <div className="space-y-2 pt-4 border-t border-[#F1F5F9]">
                <div className="flex items-center gap-2 text-sm text-[#64748B]">
                  <Phone size={14} />
                  {supplier.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-[#64748B]">
                  <Mail size={14} />
                  {supplier.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-[#64748B]">
                  <MapPin size={14} />
                  {supplier.address}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
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
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#0F172A]">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#334155] mb-1">Supplier Name</label>
                  <input
                    type="text"
                    required
                    value={formData.suppliername}
                    onChange={(e) => setFormData({ ...formData, suppliername: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] outline-none focus:ring-2 focus:ring-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#334155] mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={formData.contactname}
                    onChange={(e) => setFormData({ ...formData, contactname: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] outline-none focus:ring-2 focus:ring-[#0F172A]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#334155] mb-1">Phone</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] outline-none focus:ring-2 focus:ring-[#0F172A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#334155] mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] outline-none focus:ring-2 focus:ring-[#0F172A]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#334155] mb-1">Address</label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] outline-none focus:ring-2 focus:ring-[#0F172A] min-h-[100px]"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 px-4 border border-[#E2E8F0] text-[#64748B] font-bold rounded-xl hover:bg-[#F8F9FA]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-[#0F172A] text-white font-bold rounded-xl hover:bg-[#1E293B]"
                  >
                    {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Suppliers;
