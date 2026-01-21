
import React, { useState, useMemo, useRef } from 'react';
import { AppData, Shop } from '../types';
import { pdfService } from '../services/pdfService';

interface ShopReportsProps {
  data: AppData;
  shops: Shop[];
  // Fix: Added missing onBack prop
  onBack?: () => void;
}

const ShopReports: React.FC<ShopReportsProps> = ({ data, shops, onBack }) => {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShopId, setSelectedShopId] = useState('ALL');
  const reportRef = useRef<HTMLDivElement>(null);

  const filteredStats = useMemo(() => {
    const filterByShop = (item: any) => selectedShopId === 'ALL' || item.shopId === selectedShopId;
    const filterByDate = (item: any) => (item.date || '').startsWith(reportDate);

    const sales = data.sales.filter(s => filterByShop(s) && filterByDate(s));
    const expenses = data.expenses.filter(e => filterByShop(e) && filterByDate(e));
    const investments = data.investments.filter(i => filterByShop(i) && filterByDate(i));
    
    const shopHawlats = (data.hawlats || []).filter(h => 
       h.sourceType === 'SHOP' && 
       (selectedShopId === 'ALL' || h.shopId === selectedShopId) && 
       h.date.startsWith(reportDate)
    );

    return {
      totalSales: sales.reduce((acc, s) => acc + s.totalAmount, 0),
      totalCash: sales.reduce((acc, s) => acc + s.paidAmount, 0),
      totalDue: sales.reduce((acc, s) => acc + s.dueAmount, 0),
      totalExpense: expenses.reduce((acc, e) => acc + e.amount, 0),
      totalInvest: investments.reduce((acc, i) => acc + i.amount, 0),
      totalHawlatGiven: shopHawlats.reduce((acc, h) => acc + h.amount, 0),
      transactions: sales.length,
      salesList: sales
    };
  }, [data, reportDate, selectedShopId]);

  const netCashInHand = filteredStats.totalCash - filteredStats.totalExpense - filteredStats.totalInvest - filteredStats.totalHawlatGiven;

  const handleDownloadPDF = async () => {
    const shopName = selectedShopId === 'ALL' ? 'Combined' : shops.find(s => s.id === selectedShopId)?.name;
    await pdfService.generatePDF(reportRef.current!, `Business_Report_${shopName}_${reportDate}`);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end no-print">
         {/* Fix: Added back button UI */}
         {onBack && (
            <button onClick={onBack} className="h-14 w-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
               <i className="fas fa-arrow-left"></i>
            </button>
         )}
         <div className="flex-1 min-w-[250px] space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Select Shop</label>
            <select className="w-full p-4 rounded-2xl bg-slate-50 border font-bold" value={selectedShopId} onChange={e => setSelectedShopId(e.target.value)}>
               <option value="ALL">All Shops (Combined)</option>
               {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
         </div>
         <div className="w-48 space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Report Date</label>
            <input type="date" className="w-full p-4 rounded-2xl bg-indigo-50 border border-indigo-100 font-bold text-indigo-700" value={reportDate} onChange={e => setReportDate(e.target.value)} />
         </div>
         <button onClick={handleDownloadPDF} className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black shadow-lg flex items-center">
            <i className="fas fa-file-pdf mr-2 text-indigo-400"></i> Download Report PDF
         </button>
      </div>

      <div ref={reportRef} className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-50 bg-white">
        <div className="flex justify-between items-center mb-10 border-b pb-8">
           <div>
              <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em] mb-2">Business Statement</p>
              <h3 className="text-4xl font-black text-slate-800">{selectedShopId === 'ALL' ? 'Combined Shop Analysis' : shops.find(s => s.id === selectedShopId)?.name}</h3>
              <p className="text-slate-400 font-bold mt-1 uppercase text-xs tracking-widest italic">Statement Date: {reportDate}</p>
           </div>
           {data.company?.logo && <img src={data.company.logo} className="h-20 w-auto object-contain" />}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
           <ReportStat title="Total Cash Collected" value={filteredStats.totalCash} color="bg-emerald-600" />
           <ReportStat title="Total New Baki (Due)" value={filteredStats.totalDue} color="bg-rose-500" />
           <ReportStat title="Expenses & Payouts" value={filteredStats.totalExpense + filteredStats.totalHawlatGiven} color="bg-amber-500" />
           <ReportStat title="Stock Investment" value={filteredStats.totalInvest} color="bg-slate-800" />
           <div className="lg:col-span-2 bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase opacity-70 mb-1">Final Net Cash</p>
                <p className="text-5xl font-black tracking-tighter">৳{netCashInHand.toLocaleString()}</p>
              </div>
              <i className="fas fa-vault text-5xl opacity-20"></i>
           </div>
        </div>

        <div className="space-y-6">
           <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b-2 border-slate-100 pb-4">Transaction Details Log</h4>
           <div className="divide-y divide-slate-100">
              {filteredStats.salesList.map(s => (
                <div key={s.id} className="py-5 flex justify-between items-center px-4 hover:bg-slate-50 transition-all rounded-xl">
                   <div className="flex items-center">
                      <div className="mr-6 text-right no-pdf">
                         <p className="text-[10px] font-black text-slate-300 italic">{new Date(s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-lg">{data.customers.find(c => c.id === s.customerId)?.name || 'Cash Customer'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{s.description.substr(0, 50)}...</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="font-black text-slate-900 text-xl">৳{s.totalAmount.toLocaleString()}</p>
                      <p className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${s.dueAmount > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                         {s.dueAmount > 0 ? `Baki: ৳${s.dueAmount}` : 'Paid'}
                      </p>
                   </div>
                </div>
              ))}
              {filteredStats.transactions === 0 && <p className="text-center py-24 text-slate-300 italic font-black uppercase tracking-widest">No activity found.</p>}
           </div>
        </div>

        <div className="mt-16 text-center text-slate-400 text-[10px] uppercase font-black tracking-[0.5em] border-t-2 border-dashed border-slate-100 pt-10">
           Generated via ShopMaster Intelligence Service • {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

const ReportStat = ({ title, value, color }: { title: string, value: number, color: string }) => (
  <div className={`${color} p-6 rounded-[2rem] text-white shadow-xl flex flex-col justify-between h-32`}>
    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{title}</p>
    <p className="text-3xl font-black tracking-tight">৳{value.toLocaleString()}</p>
  </div>
);

export default ShopReports;
