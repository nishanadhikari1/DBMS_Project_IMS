import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { ShoppingBag, Clock, CheckCircle, XCircle, Package, User, Calendar, DollarSign } from 'lucide-react';

export default function Orders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (profile?.role === 'customer' && profile.customer_id) {
        queryParams.append('customerid', profile.customer_id.toString());
      }
      
      const res = await fetch(`/api/sales?${queryParams.toString()}`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/sales/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders(orders.map(o => o.so_id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="text-amber-500" size={18} />;
      case 'completed': return <CheckCircle className="text-emerald-500" size={18} />;
      case 'cancelled': return <XCircle className="text-rose-500" size={18} />;
      default: return <Package className="text-slate-500" size={18} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F172A]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">
          {profile?.role === 'customer' ? 'My Orders' : 'Order Management'}
        </h1>
      </div>

      <div className="grid gap-4">
        {orders.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-[#E2E8F0] text-center">
            <ShoppingBag className="mx-auto text-[#94A3B8] mb-4" size={48} />
            <p className="text-[#64748B] font-medium">No orders found.</p>
          </div>
        ) : orders.map((order) => (
          <motion.div
            key={order.so_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#F1F5F9] rounded-xl text-[#0F172A]">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A]">Order #{order.so_id}</h3>
                    <div className="flex items-center gap-2 text-sm text-[#64748B]">
                      <Calendar size={14} />
                      {new Date(order.so_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </div>
                  {profile?.role !== 'customer' && order.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(order.so_id, 'Completed')}
                        className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => updateStatus(order.so_id, 'Cancelled')}
                        className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#F1F5F9]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F8F9FA] rounded-lg text-[#64748B]">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Customer</p>
                    <p className="font-bold text-[#334155]">{order.customer?.customername || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F8F9FA] rounded-lg text-[#64748B]">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Total Amount</p>
                    <p className="font-bold text-[#334155]">Rs. {Number(order.totalamount).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F8F9FA] rounded-lg text-[#64748B]">
                    <Package size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Handled By</p>
                    <p className="font-bold text-[#334155]">{order.employee?.empname || 'System'}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
