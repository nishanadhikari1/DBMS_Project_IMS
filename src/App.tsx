import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, profile, loading, error, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#0F172A] mx-auto mb-4" size={40} />
          <p className="text-[#64748B] font-medium">Initializing Everest Inventory...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center max-w-md px-6">
          {error ? (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6">
              <p className="text-red-700 font-bold mb-1">Profile Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : (
            <Loader2 className="animate-spin text-[#0F172A] mx-auto mb-4" size={40} />
          )}
          
          <h2 className="text-xl font-bold text-[#0F172A] mb-2">
            {error ? 'Profile Setup Failed' : 'Setting up your profile...'}
          </h2>
          <p className="text-[#64748B] mb-6">
            {error 
              ? 'We couldn\'t find your profile record in the database. This usually happens if the SQL trigger didn\'t run or if there\'s a connection issue.'
              : 'We\'re preparing your Everest Inventory dashboard. If this takes more than 10 seconds, there might be a connection issue.'}
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#0F172A] text-white rounded-xl font-bold hover:bg-[#1E293B] transition-colors shadow-lg shadow-slate-200"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => signOut()}
              className="w-full py-3 bg-white text-[#64748B] border border-[#E2E8F0] rounded-xl font-bold hover:bg-[#F8F9FA] transition-colors"
            >
              Sign Out & Try Again
            </button>
          </div>
          
          <p className="text-xs text-[#94A3B8] mt-8">
            User ID: <code className="bg-slate-100 px-1 rounded">{user.id}</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
      {activeTab === 'products' && <Products />}
      {activeTab === 'inventory' && <Inventory />}
      {activeTab === 'orders' && <Orders />}
      {activeTab === 'suppliers' && <Suppliers />}
      {activeTab === 'users' && <Users />}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
