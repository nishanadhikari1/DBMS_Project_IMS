import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShoppingCart,
  Truck,
  ShoppingBag
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd fetch these from our Express API
    const fetchStats = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (profile?.role === 'customer' && profile.customer_id) {
          queryParams.append('customerid', profile.customer_id.toString());
        } else if (profile?.role === 'supplier' && profile.supplier_id) {
          queryParams.append('supplierid', profile.supplier_id.toString());
        } else if (profile?.role === 'warehouse_manager' && profile.warehouse_id) {
          queryParams.append('warehouseid', profile.warehouse_id.toString());
        }

        const [productsRes, inventoryRes, salesRes] = await Promise.all([
          fetch(`/api/products?${queryParams.toString()}`),
          fetch(`/api/inventory?${queryParams.toString()}`),
          fetch(`/api/sales?${queryParams.toString()}`)
        ]);
        
        if (!productsRes.ok || !inventoryRes.ok || !salesRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const products = await productsRes.json();
        const inventory = await inventoryRes.json();
        const sales = await salesRes.json();

        const totalStock = Array.isArray(inventory) ? inventory.reduce((acc: number, item: any) => acc + (item.stockqty || 0), 0) : 0;
        const lowStockCount = Array.isArray(inventory) ? inventory.filter((item: any) => (item.stockqty || 0) <= 10).length : 0;
        const totalSales = Array.isArray(sales) ? sales.reduce((acc: number, item: any) => acc + Number(item.totalamount || 0), 0) : 0;

        if (profile?.role === 'customer') {
          setStats({
            orderCount: sales.length,
            totalSpent: totalSales,
            activeOrders: sales.filter((o: any) => o.status === 'Pending').length,
            recentSales: sales.slice(0, 5)
          });
        } else {
          setStats({
            totalProducts: Array.isArray(products) ? products.length : 0,
            totalStock,
            lowStockCount,
            totalSales,
            recentSales: Array.isArray(sales) ? sales.slice(0, 5) : []
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setStats({
          totalProducts: 0,
          totalStock: 0,
          lowStockCount: 0,
          totalSales: 0,
          recentSales: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Clock className="animate-spin text-[#64748B]" /></div>;

  const cards = profile?.role === 'customer' ? [
    { label: 'My Orders', value: stats?.orderCount || 0, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600', trend: 'Recent', isUp: true },
    { label: 'Total Spent', value: `Rs. ${stats?.totalSpent?.toLocaleString() || 0}`, icon: DollarSign, color: 'bg-green-50 text-green-600', trend: 'Lifetime', isUp: true },
    { label: 'Active Orders', value: stats?.activeOrders || 0, icon: Clock, color: 'bg-amber-50 text-amber-600', trend: 'Processing', isUp: true },
    { label: 'Saved Items', value: 0, icon: Package, color: 'bg-purple-50 text-purple-600', trend: 'Wishlist', isUp: true },
  ] : [
    { label: 'Total Sales', value: `Rs. ${stats?.totalSales?.toLocaleString() || 0}`, icon: DollarSign, color: 'bg-blue-50 text-blue-600', trend: '+12.5%', isUp: true },
    { label: 'Total Products', value: stats?.totalProducts || 0, icon: Package, color: 'bg-purple-50 text-purple-600', trend: '+3', isUp: true },
    { label: 'Total Stock', value: stats?.totalStock || 0, icon: TrendingUp, color: 'bg-green-50 text-green-600', trend: 'Stable', isUp: true },
    { label: 'Low Stock Items', value: stats?.lowStockCount || 0, icon: AlertTriangle, color: 'bg-red-50 text-red-600', trend: 'Action Required', isUp: false },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Welcome back, {profile?.display_name || 'User'}</h1>
        <p className="text-[#64748B]">Here's what's happening with your inventory today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl ${card.color}`}>
                <card.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${card.isUp ? 'text-green-600' : 'text-red-600'}`}>
                {card.trend}
                {card.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-[#64748B]">{card.label}</p>
              <h3 className="text-2xl font-bold text-[#0F172A] mt-1">{card.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity & Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center">
            <h3 className="font-bold text-[#0F172A]">Recent Sales Orders</h3>
            <button className="text-sm font-semibold text-blue-600 hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F8F9FA] text-[#64748B] text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Order ID</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {stats?.recentSales?.map((sale: any) => (
                  <tr key={sale.so_id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#0F172A]">#SO-{sale.so_id}</td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">{sale.customer?.customername}</td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">{new Date(sale.so_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-bold text-[#0F172A]">Rs. {Number(sale.totalamount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        sale.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                        sale.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <h3 className="font-bold text-[#0F172A] mb-6">Quick Actions</h3>
          <div className="space-y-3">
            {profile?.role !== 'customer' && (
              <button 
                onClick={() => setActiveTab('products')}
                className="w-full py-3 px-4 bg-[#0F172A] text-white rounded-xl font-bold hover:bg-[#1E293B] transition-all flex items-center justify-center gap-2"
              >
                <Package size={18} />
                Add New Product
              </button>
            )}
            <button 
              onClick={() => setActiveTab('orders')}
              className="w-full py-3 px-4 border border-[#E2E8F0] text-[#0F172A] rounded-xl font-bold hover:bg-[#F8F9FA] transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              {profile?.role === 'customer' ? 'My Orders' : 'Create Sales Order'}
            </button>
            {profile?.role === 'admin' && (
              <button 
                onClick={() => setActiveTab('users')}
                className="w-full py-3 px-4 border border-[#E2E8F0] text-[#0F172A] rounded-xl font-bold hover:bg-[#F8F9FA] transition-all flex items-center justify-center gap-2"
              >
                <Truck size={18} />
                Manage Users
              </button>
            )}
          </div>

          <div className="mt-8">
            <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-4">Inventory Health</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#64748B]">Capacity Used</span>
                  <span className="font-bold text-[#0F172A]">68%</span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full w-[68%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#64748B]">Order Fulfillment</span>
                  <span className="font-bold text-[#0F172A]">92%</span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                  <div className="bg-green-600 h-full w-[92%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
