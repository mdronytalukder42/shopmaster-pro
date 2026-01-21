
import React, { useState } from 'react';
import { UserRole, CompanySettings } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  role: UserRole;
  company?: CompanySettings;
  pendingCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, role, company, pendingCount = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'shops', label: 'Shops & Closing', icon: 'fa-store' },
    { id: 'sales', label: 'Sales Entry', icon: 'fa-cart-shopping' },
    { id: 'customers', label: 'Customers CRM', icon: 'fa-users-gear' },
    { id: 'hawlat', label: 'Hawlat Tracking', icon: 'fa-hand-holding-dollar' },
    { id: 'purchases', label: 'Purchases (Inv)', icon: 'fa-boxes-packing' },
    { id: 'expenses', label: 'Expenses', icon: 'fa-file-invoice-dollar' },
    { id: 'mobile-banking', label: 'Mobile Bank', icon: 'fa-mobile-screen' },
    { id: 'chat', label: 'Support Chat', icon: 'fa-comments' },
    ...(role === UserRole.OWNER ? [
       { id: 'approvals', label: 'Approvals', icon: 'fa-shield-check', badge: pendingCount }
    ] : []),
    { id: 'shop-reports', label: 'Shop Reports', icon: 'fa-chart-line' },
    { id: 'customer-ledger', label: 'Customer Ledger', icon: 'fa-file-contract' },
    { id: 'hal-khata', label: 'Hal Khata', icon: 'fa-calendar-check' },
    ...(role === UserRole.OWNER ? [{ id: 'user-management', label: 'User Management', icon: 'fa-users-cog' }] : []),
    { id: 'company-settings', label: 'Company Config', icon: 'fa-gears' },
    { id: 'profile', label: 'My Profile', icon: 'fa-user-shield' },
  ];

  const handleNav = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-indigo-600 text-white p-2 rounded-lg shadow-lg no-print"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>

      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-400 transform transition-transform duration-300 ease-in-out sidebar no-print
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        flex flex-col shadow-2xl border-r border-slate-800
      `}>
        <div className="p-8 border-b border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 overflow-hidden">
               {company?.logo ? <img src={company.logo} className="w-full h-full object-cover" /> : <i className="fas fa-cube text-white text-xl"></i>}
            </div>
            <span className="text-xl font-black text-white tracking-tighter truncate max-w-[140px]">{company?.name || 'ShopMaster'}</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200
                ${activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                  : 'hover:bg-slate-800/50 hover:text-white group'}
              `}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${activeTab === item.id ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                  <i className={`fas ${item.icon} text-xs`}></i>
                </div>
                <span className="font-bold text-xs tracking-tight">{item.label}</span>
              </div>
              {item.badge && item.badge > 0 && (
                 <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-full">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800/50 bg-slate-900/50">
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-5 py-4 rounded-2xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all font-black text-xs"
          >
            <i className="fas fa-power-off"></i>
            <span>Logout Account</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
