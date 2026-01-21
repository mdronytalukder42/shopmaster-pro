
import React, { useState, useMemo } from 'react';
import { Shop, DailyClosing, AppData, UserRole, DailySummary } from '../types';
import { geminiService } from '../services/geminiService';

interface ShopManagementProps {
  shops: Shop[];
  data: AppData;
  role: UserRole;
  onClosing: (closing: DailyClosing) => void;
  onReopen: (shopId: string, date: string) => void;
  onUpdateShop: (shopId: string, newName: string) => void;
  onAddSummary: (summary: DailySummary) => void;
  // Fix: Added missing onBack prop
  onBack?: () => void;
}

const ShopManagement: React.FC<ShopManagementProps> = ({ shops, data, role, onClosing, onReopen, onUpdateShop, onAddSummary, onBack }) => {
  const [loadingShop, setLoadingShop] = useState<string | null>(null);
  const [editingShop, setEditingShop] = useState<string | null>(null);
  const [tempShopName, setTempShopName] = useState('');
  
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  const getShopStats = (shopId: string, targetDate: string) => {
    const shopSales = data.sales.filter(s => s.shopId === shopId && s.date.startsWith(targetDate));
    const shopExpenses = data.expenses.filter(e => e.shopId === shopId && e.date.startsWith(targetDate));
    const shopInvests = data.investments.filter(i => i.shopId === shopId && i.date.startsWith(targetDate));
    
    return {
      sales: shopSales.reduce((acc, s) => acc + s.totalAmount, 0),
      cash: shopSales.reduce((acc, s) => acc + s.paidAmount, 0),
      due: shopSales.reduce((acc, s) => acc + s.dueAmount, 0),
      expense: shopExpenses.reduce((acc, e) => acc + e.amount, 0),
      invest: shopInvests.reduce((acc, i) => acc + i.amount, 0),
    };
  };

  const handleSummarize = async (shop: Shop) => {
    setLoadingShop(shop.id);
    const stats = getShopStats(shop.id, reportDate);
    const content = await geminiService.summarizeDailyActivity({
      shop: shop.name,
      ...stats,
      date: reportDate
    });
    onAddSummary({ shopId: shop.id, date: reportDate, content });
    setLoadingShop(null);
  };

  const handleCloseDay = (shopId: string) => {
    const stats = getShopStats(shopId, reportDate);
    const closing: DailyClosing = {
      id: Math.random().toString(36).substr(2, 9),
      date: reportDate, 
      shopId,
      totalSales: stats.sales,
      totalCash: stats.cash,
      totalDue: stats.due,
      totalExpense: stats.expense,
      isClosed: true,
      closedAt: new Date().toISOString()
    };
    onClosing(closing);
  };

  const handleReopen = (shopId: string) => {
    if (window.confirm("আপনি কি নিশ্চিত যে এই দিনের জন্য দোকানটি পুনরায় খুলতে চান?")) {
      onReopen(shopId, reportDate);
      alert("দোকান পুনরায় খোলা হয়েছে!");
    }
  };

  const startEditing = (shop: Shop) => {
    setEditingShop(shop.id);
    setTempShopName(shop.name);
  };

  const saveShopName = () => {
    if (editingShop && tempShopName.trim()) {
      onUpdateShop(editingShop, tempShopName.trim());
      setEditingShop(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Fix: Added back button UI */}
        <div className="flex items-center space-x-4">
          {onBack && (
            <button onClick={onBack} className="h-10 w-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
              <i className="fas fa-arrow-left"></i>
            </button>
          )}
          <div>
             <h2 className="text-xl font-black text-slate-800">Shop Daily Audit</h2>
             <p className="text-slate-500 text-xs font-bold">নিচের ক্যালেন্ডার থেকে তারিখ সিলেক্ট করে রিপোর্ট দেখুন</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 bg-indigo-50 p-2 rounded-2xl">
           <i className="fas fa-calendar-alt text-indigo-600 ml-2"></i>
           <input 
              type="date" 
              className="bg-transparent border-none focus:ring-0 font-black text-indigo-700 cursor-pointer"
              value={reportDate}
              onChange={e => setReportDate(e.target.value)}
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {shops.map(shop => {
          const stats = getShopStats(shop.id, reportDate);
          const isClosed = data.dailyClosings.some(c => c.shopId === shop.id && c.date === reportDate);
          const currentSummary = data.dailySummaries.find(s => s.shopId === shop.id && s.date === reportDate);

          return (
            <div key={shop.id} className={`bg-white rounded-[2.5rem] overflow-hidden border shadow-xl transition-all ${isClosed ? 'opacity-90 border-emerald-300 ring-2 ring-emerald-50' : 'hover:shadow-2xl'}`}>
              <div className={`p-6 text-white relative ${shop.id === '1' ? 'bg-indigo-600' : shop.id === '2' ? 'bg-emerald-600' : 'bg-orange-500'}`}>
                  {isClosed && (
                    <div className="absolute top-4 right-4 bg-white/30 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center shadow-sm">
                      <i className="fas fa-lock mr-1"></i> Closed
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-8">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{shop.type}</p>
                      {editingShop === shop.id ? (
                        <div className="flex items-center mt-1">
                          <input 
                            className="bg-white/20 border-none rounded-lg text-xl font-black text-white w-full px-2 py-1 focus:ring-1 focus:ring-white"
                            value={tempShopName}
                            onChange={e => setTempShopName(e.target.value)}
                            onBlur={saveShopName}
                            onKeyDown={e => e.key === 'Enter' && saveShopName()}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <h3 className="text-2xl font-black mt-1 flex items-center group">
                          {shop.name}
                          <button onClick={() => startEditing(shop)} className="ml-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            <i className="fas fa-edit"></i>
                          </button>
                        </h3>
                      )}
                    </div>
                  </div>
              </div>

              <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোট বিক্রি</p>
                        <p className="text-lg font-black text-slate-800">৳{stats.sales.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">নগদ আদায়</p>
                        <p className="text-lg font-black text-emerald-700">৳{stats.cash.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">বাকি (Due)</p>
                        <p className="text-lg font-black text-rose-700">৳{stats.due.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">খরচ (Exp)</p>
                        <p className="text-lg font-black text-amber-700">৳{stats.expense.toLocaleString()}</p>
                    </div>
                    <div className="col-span-2 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">বিনিয়োগ / ক্রয়</p>
                        <p className="text-lg font-black text-indigo-700">৳{stats.invest.toLocaleString()}</p>
                    </div>
                  </div>

                  {currentSummary && (
                    <div className="bg-indigo-50/50 p-4 rounded-2xl text-xs text-indigo-700 border border-indigo-100 animate-slideDown">
                      <p className="font-black text-[10px] uppercase mb-1 flex items-center"><i className="fas fa-sparkles mr-1"></i> AI Insights:</p>
                      <p className="leading-relaxed font-medium whitespace-pre-wrap">{currentSummary.content}</p>
                    </div>
                  )}

                  <div className="space-y-3 pt-4 border-t border-slate-50">
                    <button 
                      onClick={() => handleSummarize(shop)}
                      disabled={loadingShop === shop.id}
                      className="w-full py-3 rounded-xl border-2 border-indigo-50 text-indigo-600 text-sm font-black hover:bg-indigo-50 transition-all flex items-center justify-center"
                    >
                      {loadingShop === shop.id ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-wand-sparkles mr-2"></i>}
                      {currentSummary ? 'রি-জেনারেট AI রিপোর্ট' : 'AI স্মার্ট রিপোর্ট'}
                    </button>
                    {isClosed ? (
                       <button 
                        onClick={() => handleReopen(shop.id)}
                        className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center justify-center transform active:scale-95"
                      >
                        <i className="fas fa-unlock-alt mr-2"></i> রি-ওপেন করুন (Open Shop)
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleCloseDay(shop.id)}
                        className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black shadow-lg hover:bg-black hover:scale-[1.02] transition-all flex items-center justify-center transform active:scale-95"
                      >
                        <i className="fas fa-check-double mr-2"></i> ডেইলি ক্লোজিং (Close Day)
                      </button>
                    )}
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShopManagement;
