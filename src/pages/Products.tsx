import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ChevronRight,
  Package,
  Tag,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Products: React.FC = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    productname: '',
    reorderlevel: 10,
    unitprice: 0,
    categoryid: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (profile?.role === 'supplier' && profile.supplier_id) {
        queryParams.append('supplierid', profile.supplier_id.toString());
      }
      
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/products?${queryParams.toString()}`),
        fetch('/api/categories')
      ]);
      setProducts(await prodRes.json());
      setCategories(await catRes.json());
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (product: any) => {
    if (!profile?.customer_id && profile?.role === 'customer') {
      alert('Your profile is not linked to a customer record. Please contact admin.');
      return;
    }

    if (!confirm(`Confirm purchase of ${product.productname} for Rs. ${product.unitprice}?`)) return;

    setIsPurchasing(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerid: profile?.customer_id || 1, // Fallback for demo
          totalamount: product.unitprice,
          items: [{
            productid: product.productid,
            quantity: 1,
            unitprice: product.unitprice
          }]
        })
      });

      if (res.ok) {
        alert('Order placed successfully!');
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error('Error purchasing:', err);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProduct ? `/api/products/${editingProduct.productid}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({ productname: '', reorderlevel: 10, unitprice: 0, categoryid: '' });
        fetchData();
      }
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/products/${productToDelete.productid}`, { method: 'DELETE' });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setProductToDelete(null);
        fetchData();
      } else {
        const err = await res.json();
        setDeleteError(err.error || 'This product cannot be deleted because it is referenced in orders or inventory records.');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      setDeleteError('A network error occurred. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isAdmin = profile?.role === 'admin';
  const canManageProducts = ['admin', 'warehouse_manager', 'supplier'].includes(profile?.role || '');

  const filteredProducts = products.filter(p => 
    p.productname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#0F172A] outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E2E8F0] text-[#64748B] font-semibold rounded-xl hover:bg-[#F8F9FA] transition-all">
            <Filter size={18} />
            Filter
          </button>
          {canManageProducts && (
            <button 
              onClick={() => {
                setEditingProduct(null);
                setFormData({ productname: '', reorderlevel: 10, unitprice: 0, categoryid: '' });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0F172A] text-white font-semibold rounded-xl hover:bg-[#1E293B] transition-all shadow-lg shadow-slate-200"
            >
              <Plus size={18} />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white h-64 rounded-2xl border border-[#E5E7EB] animate-pulse"></div>
          ))
        ) : filteredProducts.map((product) => (
          <motion.div
            key={product.productid}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all group overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-[#F1F5F9] rounded-xl text-[#0F172A]">
                  <Package size={24} />
                </div>
                {canManageProducts && (
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setEditingProduct(product);
                        setFormData({
                          productname: product.productname,
                          reorderlevel: product.reorderlevel,
                          unitprice: product.unitprice,
                          categoryid: product.categoryid
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-[#64748B] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductToDelete(product);
                          setDeleteError(null);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <h3 className="font-bold text-[#0F172A] text-lg mb-1 line-clamp-1">{product.productname}</h3>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-4">
                <Tag size={12} />
                {product.category?.categoryname}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9]">
                <div>
                  <p className="text-xs text-[#94A3B8] font-medium">Unit Price</p>
                  <p className="text-lg font-bold text-[#0F172A]">Rs. {Number(product.unitprice).toLocaleString()}</p>
                </div>
                {profile?.role === 'customer' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(product);
                    }}
                    disabled={isPurchasing}
                    className="px-4 py-2 bg-[#0F172A] text-white text-sm font-bold rounded-xl hover:bg-[#1E293B] transition-all shadow-md shadow-slate-200 disabled:opacity-50"
                  >
                    Purchase
                  </button>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                      setIsDetailModalOpen(true);
                    }}
                    className="p-2 bg-[#F8F9FA] text-[#0F172A] rounded-lg hover:bg-[#0F172A] hover:text-white transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && productToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-[#0F172A] mb-2">Delete Product?</h3>
                <p className="text-[#64748B] mb-6">
                  Are you sure you want to delete <span className="font-bold text-[#0F172A]">"{productToDelete.productname}"</span>? This action cannot be undone.
                </p>

                {deleteError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                    {deleteError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 py-3 px-4 border border-[#E2E8F0] text-[#64748B] font-bold rounded-xl hover:bg-[#F8F9FA] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#0F172A]">Product Details</h2>
                <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <ChevronRight className="rotate-180" size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-[#F1F5F9] rounded-2xl flex items-center justify-center text-[#0F172A]">
                    <Package size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#0F172A]">{selectedProduct.productname}</h3>
                    <p className="text-[#64748B] font-medium">{selectedProduct.category?.categoryname}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0]">
                    <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">Unit Price</p>
                    <p className="text-xl font-bold text-[#0F172A]">Rs. {Number(selectedProduct.unitprice).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0]">
                    <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">Reorder Level</p>
                    <p className="text-xl font-bold text-[#0F172A]">{selectedProduct.reorderlevel} Units</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">Product Information</h4>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <span className="text-[#64748B]">Product ID</span>
                    <span className="text-[#0F172A] font-medium">#{selectedProduct.productid}</span>
                    <span className="text-[#64748B]">Category ID</span>
                    <span className="text-[#0F172A] font-medium">{selectedProduct.categoryid}</span>
                    <span className="text-[#64748B]">Status</span>
                    <span className="text-green-600 font-bold">Available</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-full py-3 bg-[#0F172A] text-white font-bold rounded-xl hover:bg-[#1E293B] transition-all"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
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
              <div className="p-6 border-b border-[#E5E7EB]">
                <h2 className="text-xl font-bold text-[#0F172A]">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#334155] mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.productname}
                    onChange={(e) => setFormData({ ...formData, productname: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] outline-none focus:ring-2 focus:ring-[#0F172A]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#334155] mb-1">Unit Price (Rs.)</label>
                    <input
                      type="number"
                      required
                      value={formData.unitprice}
                      onChange={(e) => setFormData({ ...formData, unitprice: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] outline-none focus:ring-2 focus:ring-[#0F172A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#334155] mb-1">Reorder Level</label>
                    <input
                      type="number"
                      required
                      value={formData.reorderlevel}
                      onChange={(e) => setFormData({ ...formData, reorderlevel: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] outline-none focus:ring-2 focus:ring-[#0F172A]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#334155] mb-1">Category</label>
                  <select
                    required
                    value={formData.categoryid}
                    onChange={(e) => setFormData({ ...formData, categoryid: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] outline-none focus:ring-2 focus:ring-[#0F172A]"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.categoryid} value={cat.categoryid}>{cat.categoryname}</option>
                    ))}
                  </select>
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
                    {editingProduct ? 'Update Product' : 'Create Product'}
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

export default Products;
