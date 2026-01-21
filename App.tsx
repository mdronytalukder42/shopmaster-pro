
import React, { useState, useEffect, useMemo } from 'react';
import { 
  AppData, 
  User, 
  UserRole, 
  EditStatus, 
  Sale, 
  Customer, 
  Expense, 
  Investment, 
  MobileTransaction, 
  DailyClosing, 
  DailySummary, 
  Hawlat, 
  HawlatReturn,
  EditRequest,
  ChatMessage
} from './types';
import { INITIAL_SHOPS } from './constants';
import { databaseService } from './services/databaseService';

// Import Tab Components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SalesEntry from './components/SalesEntry';
import CustomerManagement from './components/CustomerManagement';
import ShopManagement from './components/ShopManagement';
import Login from './components/Login';
import Expenses from './components/Expenses';
import MobileBanking from './components/MobileBanking';
import Purchases from './components/Purchases';
import HawlatManagement from './components/HawlatManagement';
import Reports from './components/Reports';
import HalKhata from './components/HalKhata';
import UserManagement from './components/UserManagement';
import CompanySettingsPage from './components/CompanySettings';
import AdminApproval from './components/AdminApproval';
import ShopReports from './components/ShopReports';
import ProfileSettings from './components/ProfileSettings';
import Chat from './components/Chat';

const initialAppData: AppData = {
  company: { name: 'ShopMaster', address: '', phone: '', adminEmail: 'admin@example.com' },
  users: [],
  shops: INITIAL_SHOPS,
  customers: [],
  sales: [],
  expenses: [],
  investments: [],
  mobileTransactions: [],
  dailyClosings: [],
  dailySummaries: [],
  halKhataSessions: [],
  hawlats: [],
  hawlatReturns: [],
  editRequests: [],
  messages: []
};

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(initialAppData);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ledgerTargetId, setLedgerTargetId] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('logged_in_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const unsubscribe = databaseService.subscribeToData((cloudData) => {
      setData(prev => ({
        ...prev,
        ...cloudData,
        // Ensure arrays are initialized even if cloud returns null
        customers: cloudData.customers || [],
        sales: cloudData.sales || [],
        expenses: cloudData.expenses || [],
        investments: cloudData.investments || [],
        mobileTransactions: cloudData.mobileTransactions || [],
        dailyClosings: cloudData.dailyClosings || [],
        dailySummaries: cloudData.dailySummaries || [],
        hawlats: cloudData.hawlats || [],
        hawlatReturns: cloudData.hawlatReturns || [],
        editRequests: cloudData.editRequests || [],
        messages: cloudData.messages || []
      }));
      setIsLoading(false);
    }, initialAppData);
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('logged_in_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('logged_in_user');
  };

  const viewCustomerLedger = (customerId: string) => {
    setLedgerTargetId(customerId);
    setActiveTab('customer-ledger');
  };

  // Deletion Handlers
  const deleteSale = async (id: string) => {
    if (window.confirm("আপনি কি নিশ্চিত যে এই বিক্রয় রেকর্ডটি মুছে ফেলতে চান?")) {
      await databaseService.deleteSale(id);
    }
  };

  const deleteExpense = async (id: string) => {
    if (window.confirm("আপনি কি নিশ্চিত যে এই খরচটি মুছে ফেলতে চান?")) {
      await databaseService.deleteExpense(id);
    }
  };

  const deletePurchase = async (id: string) => {
    if (window.confirm("আপনি কি নিশ্চিত যে এই ইনভেস্টমেন্ট রেকর্ডটি মুছে ফেলতে চান?")) {
      await databaseService.deleteInvestment(id);
    }
  };

  const deleteMobileTx = async (id: string) => {
    if (window.confirm("আপনি কি নিশ্চিত যে এই মোবাইল লেনদেনটি মুছে ফেলতে চান?")) {
      await databaseService.deleteMobileTx(id);
    }
  };

  const deleteHawlat = async (id: string) => {
    if (window.confirm("আপনি কি নিশ্চিত যে এই হাওলাত রেকর্ডটি মুছে ফেলতে চান?")) {
      await databaseService.deleteHawlat(id);
    }
  };

  const deleteCustomer = async (id: string) => {
    const hasSales = data.sales.some(s => s.customerId === id);
    if (hasSales) {
      alert("এই কাস্টমারের বিক্রয় রেকর্ড রয়েছে। কাস্টমার ডিলিট করার আগে তার বিক্রয় রেকর্ডগুলো মুছে ফেলুন।");
      return;
    }
    if (window.confirm("আপনি কি নিশ্চিত যে এই কাস্টমার প্রোফাইলটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।")) {
      await databaseService.deleteCustomer(id);
    }
  };

  const pendingEditCount = useMemo(() => 
    (data.editRequests || []).filter(r => r.status === EditStatus.PENDING).length, 
  [data.editRequests]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
         <div className="h-20 w-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
         <p className="text-white font-black uppercase tracking-[0.3em] text-xs">Syncing Supabase Database...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} users={data.users || []} />;
  }

  const goHome = () => {
    setLedgerTargetId('ALL');
    setActiveTab('dashboard');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        role={currentUser.role}
        company={data.company}
        pendingCount={pendingEditCount}
      />
      <main className="flex-1 md:ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard data={data} />}
          
          {activeTab === 'shops' && (
            <ShopManagement 
              shops={data.shops || []} 
              data={data} 
              role={currentUser.role}
              onClosing={c => databaseService.addDailyClosing(c)}
              onReopen={(shopId, date) => {
                const closing = data.dailyClosings.find(c => c.shopId === shopId && c.date === date);
                if (closing) databaseService.deleteDailyClosing(closing.id);
              }}
              onUpdateShop={(id, name) => {
                const updatedShops = data.shops.map(s => s.id === id ? {...s, name} : s);
                databaseService.saveCompanySettings({ shops: updatedShops });
              }}
              onAddSummary={s => databaseService.addDailySummary(s)}
              onBack={goHome}
            />
          )}

          {activeTab === 'sales' && (
            <SalesEntry 
              shops={data.shops || []} 
              customers={data.customers || []} 
              onAddSale={s => databaseService.addSale(s)}
              onAddCustomer={c => databaseService.addCustomer(c)}
              onBack={goHome}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerManagement 
              customers={data.customers || []} 
              sales={data.sales || []} 
              data={data}
              company={data.company}
              onAdd={c => databaseService.addCustomer(c)} 
              onUpdate={updated => databaseService.updateCustomer(updated)} 
              onDelete={deleteCustomer}
              onViewLedger={viewCustomerLedger}
              onBack={goHome}
            />
          )}

          {activeTab === 'hawlat' && (
            <HawlatManagement 
              data={data} 
              shops={data.shops || []}
              onAddHawlat={h => databaseService.addHawlat(h)}
              onUpdateHawlat={h => databaseService.updateHawlat(h)}
              onAddReturn={r => databaseService.addHawlatReturn(r)}
              onDeleteHawlat={deleteHawlat}
              onBack={goHome}
            />
          )}

          {activeTab === 'purchases' && (
            <Purchases 
              shops={data.shops || []} 
              investments={data.investments || []}
              onAddInvestment={i => databaseService.addInvestment(i)}
              onDeletePurchase={deletePurchase}
              onBack={goHome}
            />
          )}

          {activeTab === 'expenses' && (
            <Expenses 
              shops={data.shops || []} 
              expenses={data.expenses || []}
              onAddExpense={e => databaseService.addExpense(e)}
              onDeleteExpense={deleteExpense}
              onBack={goHome}
            />
          )}

          {activeTab === 'mobile-banking' && (
            <MobileBanking 
              transactions={data.mobileTransactions || []} 
              shops={data.shops || []}
              onAddTx={t => databaseService.addMobileTx(t)}
              onDeleteTx={deleteMobileTx}
              company={data.company}
              onBack={goHome}
            />
          )}

          {activeTab === 'chat' && (
            <Chat 
              currentUser={currentUser} 
              messages={data.messages || []} 
              onBack={goHome} 
            />
          )}

          {activeTab === 'approvals' && currentUser.role === UserRole.OWNER && (
            <AdminApproval 
              data={data} 
              onUpdateData={(newData) => {
                // Not strictly needed with realtime but kept for legacy sync logic
              }}
              currentUser={currentUser}
              onBack={goHome}
            />
          )}

          {activeTab === 'shop-reports' && <ShopReports data={data} shops={data.shops || []} onBack={goHome} />}

          {activeTab === 'customer-ledger' && (
             <Reports 
               data={data} 
               initialCustomerId={ledgerTargetId}
               onUpdateSale={updatedSale => databaseService.updateSale(updatedSale)} 
               onDeleteSale={deleteSale}
               onBack={goHome}
             />
          )}

          {activeTab === 'hal-khata' && (
            <HalKhata 
              data={data} 
              onSessionAdd={s => databaseService.addHalKhataSession(s)}
              onBack={goHome}
            />
          )}

          {activeTab === 'user-management' && currentUser.role === UserRole.OWNER && (
            <UserManagement 
              users={data.users || []} 
              onUpdateUsers={users => databaseService.updateUsersList(users)}
              onBack={goHome}
            />
          )}

          {activeTab === 'company-settings' && (
            <CompanySettingsPage 
              company={data.company} 
              onUpdate={company => databaseService.saveCompanySettings(company)}
              onBack={goHome}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileSettings 
              user={currentUser} 
              onUpdate={(updated) => {
                setCurrentUser(updated);
                localStorage.setItem('logged_in_user', JSON.stringify(updated));
                databaseService.updateUserProfile(updated.id, updated);
              }} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
