
import React, { useMemo } from 'react';
import { AppData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  data: AppData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const stats = useMemo(() => {
    const sales = data.sales || [];
    const expenses = data.expenses || [];
    const investments = data.investments || [];
    const hawlats = data.hawlats || [];

    const totalSales = sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const totalPaid = sales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
    const totalDue = sales.reduce((acc, s) => acc + (s.dueAmount || 0), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const totalInvest = investments.reduce((acc, i) => acc + (i.amount || 0), 0);
    const totalHawlat = hawlats.reduce((acc, h) => acc + (h.amount || 0), 0);
    const cashOnHand = totalPaid - totalExpenses - totalInvest - totalHawlat;
    
    return { totalSales, totalDue, totalExpenses, totalInvest, cashOnHand, totalHawlat };
  }, [data]);

  const shopPerformance = useMemo(() => {
    const shops = data.shops || [];
    const sales = data.sales || [];
    const expenses = data.expenses || [];

    return shops.map(shop => {
      const sSum = sales.filter(s => s.shopId === shop.id).reduce((acc, s) => acc + (s.totalAmount || 0), 0);
      const eSum = expenses.filter(e => e.shopId === shop.id).reduce((acc, e) => acc + (e.amount || 0), 0);
      return { name: shop.name, sales: sSum, expenses: eSum };
    });
  }, [data]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard title="Total Sales" value={stats.totalSales} icon="fa-shopping-cart" color="indigo" />
        <StatCard title="Total Due" value={stats.totalDue} icon="fa-clock" color="amber" />
        <StatCard title="Expenses" value={stats.totalExpenses} icon="fa-receipt" color="rose" />
        <StatCard title="Investments" value={stats.totalInvest} icon="fa-boxes-packing" color="slate" />
        <StatCard title="Hawlat (OUT)" value={stats.totalHawlat} icon="fa-hand-holding-dollar" color="orange" />
        <StatCard title="Net Cash" value={stats.cashOnHand} icon="fa-wallet" color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sales vs Expenses</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shopPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="sales" radius={[10, 10, 0, 0]} fill="#6366f1" barSize={35} />
                  <Bar dataKey="expenses" radius={[10, 10, 0, 0]} fill="#f43f5e" barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Recent Activity</h3>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
               {(data.sales || []).slice(0, 8).map(s => (
                 <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <div>
                       <p className="font-black text-slate-700 text-xs">{(data.customers || []).find(c => c.id === s.customerId)?.name || 'Cash Sale'}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(s.date).toLocaleDateString()}</p>
                    </div>
                    <span className="font-black text-indigo-600">৳{s.totalAmount}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{title: string, value: number, icon: string, color: string}> = ({ title, value, icon, color }) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500 text-indigo-500',
    amber: 'bg-amber-500 text-amber-500',
    rose: 'bg-rose-500 text-rose-500',
    emerald: 'bg-emerald-500 text-emerald-500',
    slate: 'bg-slate-800 text-slate-800',
    orange: 'bg-orange-500 text-orange-500'
  };
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between transform hover:scale-105 transition-all">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-opacity-10 mb-4 ${colorMap[color]}`}>
        <i className={`fas ${icon} text-sm`}></i>
      </div>
      <div>
        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</h3>
        <p className="text-lg font-black text-slate-800">৳{value.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default Dashboard;
