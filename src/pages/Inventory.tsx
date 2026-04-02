import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  MapPin, 
  ArrowRight, 
  AlertCircle,
  Warehouse as WarehouseIcon,
  Layers
} from 'lucide-react';

const Inventory: React.FC = () => {
  const { profile } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (profile?.role === 'warehouse_manager' && profile.warehouse_id) {
        queryParams.append('warehouseid', profile.warehouse_id.toString());
      }
      
      const res = await fetch(`/api/inventory?${queryParams.toString()}`);
      setInventory(await res.json());
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E5E7EB]">
            <h3 className="font-bold text-[#0F172A]">Stock Distribution</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F8F9FA] text-[#64748B] text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Warehouse</th>
                  <th className="px-6 py-4 font-semibold">Stock Qty</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-4 h-16 bg-slate-50/50"></td>
                    </tr>
                  ))
                ) : inventory.map((item) => (
                  <tr key={`${item.warehouseid}-${item.productid}`} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#F1F5F9] rounded-lg text-[#0F172A]">
                          <Package size={16} />
                        </div>
                        <span className="text-sm font-medium text-[#0F172A]">{item.product?.productname}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-[#64748B]">
                        <MapPin size={14} />
                        {item.warehouse?.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[#0F172A]">{item.stockqty}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.stockqty > 20 ? 'bg-green-100 text-green-700' : 
                        item.stockqty > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.stockqty > 20 ? 'In Stock' : item.stockqty > 0 ? 'Low Stock' : 'Out of Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
            <h4 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2">
              <WarehouseIcon size={18} className="text-blue-600" />
              Warehouse Summary
            </h4>
            <div className="space-y-4">
              <div className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0]">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Main Warehouse</p>
                <div className="flex justify-between items-end">
                  <p className="text-xl font-bold text-[#0F172A]">3,420 units</p>
                  <p className="text-xs text-green-600 font-bold">68% Capacity</p>
                </div>
              </div>
              <div className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0]">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Branch Warehouse</p>
                <div className="flex justify-between items-end">
                  <p className="text-xl font-bold text-[#0F172A]">1,850 units</p>
                  <p className="text-xs text-blue-600 font-bold">42% Capacity</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0F172A] p-6 rounded-2xl shadow-xl text-white">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-yellow-400" />
              Critical Alerts
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white/10 rounded-lg">
                <Layers size={16} className="mt-1 flex-shrink-0" />
                <p className="text-sm">5 products are below reorder level in Main Warehouse.</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/10 rounded-lg">
                <ArrowRight size={16} className="mt-1 flex-shrink-0" />
                <p className="text-sm">Pending transfer from North Storage to Branch.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setResolved(true);
                setTimeout(() => setResolved(false), 3000);
              }}
              className="w-full mt-6 py-2.5 bg-white text-[#0F172A] rounded-lg font-bold text-sm hover:bg-[#F1F5F9] transition-colors"
            >
              {resolved ? 'Alerts Resolved!' : 'Resolve All Alerts'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
