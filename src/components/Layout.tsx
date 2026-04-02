import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Truck, 
  Warehouse, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { profile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'customer', 'supplier', 'warehouse_manager'] },
    { id: 'products', label: 'Products', icon: Package, roles: ['admin', 'customer', 'supplier', 'warehouse_manager'] },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, roles: ['admin', 'customer', 'supplier', 'warehouse_manager'] },
    { id: 'inventory', label: 'Inventory', icon: Warehouse, roles: ['admin', 'warehouse_manager'] },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, roles: ['admin', 'supplier'] },
    { id: 'users', label: 'Users', icon: Users, roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item => profile && item.roles.includes(profile.role));

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans text-[#1A1A1A]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E5E7EB]">
        <div className="p-6 border-b border-[#E5E7EB]">
          <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">Everest Inventory</h1>
          <p className="text-xs text-[#64748B] mt-1 uppercase tracking-wider font-semibold">
            {profile?.role.replace('_', ' ')} Panel
          </p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-[#0F172A] text-white shadow-lg' 
                  : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E5E7EB]">
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 z-50">
        <h1 className="text-lg font-bold">Everest</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="md:hidden fixed inset-0 bg-white z-40 pt-16"
          >
            <nav className="p-4 space-y-2">
              {filteredMenu.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl ${
                    activeTab === item.id ? 'bg-[#0F172A] text-white' : 'text-[#64748B]'
                  }`}
                >
                  <item.icon size={24} />
                  <span className="text-lg font-medium">{item.label}</span>
                </button>
              ))}
              <button 
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-4 text-[#EF4444]"
              >
                <LogOut size={24} />
                <span className="text-lg font-medium">Sign Out</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <header className="hidden md:flex h-16 bg-white border-b border-[#E5E7EB] items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-[#1E293B]">
            {filteredMenu.find(m => m.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-[#0F172A]">{profile?.display_name || profile?.email}</p>
              <p className="text-xs text-[#64748B]">{profile?.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] font-bold">
              {(profile?.display_name || profile?.email)?.[0].toUpperCase()}
            </div>
          </div>
        </header>
        
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
