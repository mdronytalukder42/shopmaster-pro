
import React, { useState, useMemo, useRef } from 'react';
import { MobileTransaction, MobileBankType, CompanySettings, Shop } from '../types';
import { pdfService } from '../services/pdfService';

interface MobileBankingProps {
  transactions: MobileTransaction[];
  shops: Shop[];
  onAddTx: (tx: MobileTransaction) => void;
  onDeleteTx?: (id: string) => void;
  company: CompanySettings;
  onBack?: () => void;
}

const MobileBanking: React.FC<MobileBankingProps> = ({ transactions, shops, onAddTx, onDeleteTx, company, onBack }) => {
  const [formData, setFormData] = useState({ 
    type: MobileBankType.BKASH, 
    transactionType: 'IN' as 'IN' | 'OUT', 
    amount: 0, 
    description: '',
    sourceType: 'SHOP' as 'SHOP' | 'POCKET' | 'WALLET_REVENUE',
    sourceShopId: shops[0]?.id || ''
  });
  
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeProvider, setActiveProvider] = useState<MobileBankType>(MobileBankType.BKASH);
  const reportRef = useRef<HTMLDivElement>(null);

  const balances = useMemo(() => {
    const calc = (type: MobileBankType) => transactions.filter(t => t.type === type).reduce((acc, t) => acc + (t.transactionType === 'IN' ? t.amount : -t.amount), 0);
    return { [MobileBankType.BKASH]: calc(MobileBankType.BKASH), [MobileBankType.NAGAD]: calc(MobileBankType.NAGAD), [MobileBankType.ROCKET]: calc(MobileBankType.ROCKET), [MobileBankType.RECHARGE]: calc(MobileBankType.RECHARGE) };
  }, [transactions]);

  const filteredHistory = useMemo(() => {
    return transactions.filter(t => t.type === activeProvider && t.date.startsWith(reportDate));
  }, [transactions, reportDate, activeProvider]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return;
    onAddTx({ 
      id: Math.random().toString(36).substr(2, 9), 
      date: new Date().toISOString(), 
      ...formData,
      sourceShopId: formData.sourceType === 'SHOP' ? formData.sourceShopId : undefined
    } as MobileTransaction);
    setFormData({ ...formData, amount: 0, description: '' });
  };

  const handleDownloadReport = async () => {
    if (reportRef.current) {
      await pdfService.generatePDF(reportRef.current, `Mobile_Statement`);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        {Object.values(MobileBankType).map(type => (
          <button 
            key={type} 
            onClick={() => setActiveProvider(type)}
            className={`p-8 rounded-[2.5rem] shadow-2xl transition-all transform hover:scale-105 border-b-8 border-black/10 flex flex-col justify-between h-44 text-left ${activeProvider === type ? 'ring-4 ring-indigo-300' : 'opacity-80'} ${type === 'bKash' ? 'bg-[#d12053] text-white' : type === 'Nagad' ? 'bg-[#f7941d] text-white' : type === 'Rocket' ? 'bg-[#8c3494] text-white' : 'bg-sky-500 text-white'}`}
          >
             <div className="flex justify-between items-start w-full">
                <span className="font-black text-2xl uppercase italic tracking-tighter">{type}</span>
                {activeProvider === type && <i className="fas fa-check-circle"></i>}
             </div>
             <div>
                <p className="text-[10px] font-black opacity-70 uppercase tracking-widest">Active Balance</p>
                <p className="text-4xl font-black">৳{balances[type].toLocaleString()}</p>
             </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl sticky top-8 h-fit">
           <div className="flex items-center space-x-3 mb-8">
              {onBack && (
                <button onClick={onBack} className="h-10 w-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                  <i className="fas fa-arrow-left"></i>
                </button>
              )}
              <h3 className="text-xl font-black uppercase italic flex items-center">
                <i className="fas fa-money-bill-transfer mr-3 text-indigo-500"></i> Post Transaction
              </h3>
           </div>
           
           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <button type="button" onClick={() => setFormData({...formData, transactionType: 'IN'})} className={`py-4 rounded-2xl font-black transition-all ${formData.transactionType === 'IN' ? 'bg-emerald-500 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}>CASH IN</button>
                 <button type="button" onClick={() => setFormData({...formData, transactionType: 'OUT'})} className={`py-4 rounded-2xl font-black transition-all ${formData.transactionType === 'OUT' ? 'bg-rose-500 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}>CASH OUT</button>
              </div>

              {formData.transactionType === 'IN' && (
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 animate-slideDown">
                    <label className="text-[10px] font-black uppercase text-indigo-600 ml-1">টাকা দেওয়ার উৎস (Source of Funds)</label>
                    <div className="grid grid-cols-1 gap-3">
                       <button type="button" onClick={() => setFormData({...formData, sourceType: 'SHOP'})} className={`py-3 rounded-xl font-black text-[10px] transition-all ${formData.sourceType === 'SHOP' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border'}`}>SHOP CASH</button>
                       <button type="button" onClick={() => setFormData({...formData, sourceType: 'POCKET'})} className={`py-3 rounded-xl font-black text-[10px] transition-all ${formData.sourceType === 'POCKET' ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border'}`}>PERSONAL POCKET</button>
                    </div>
                    {formData.sourceType === 'SHOP' && (
                       <select className="w-full p-3 rounded-xl border bg-white font-bold text-xs" value={formData.sourceShopId} onChange={e => setFormData({...formData, sourceShopId: e.target.value})}>
                          {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                    )}
                 </div>
              )}

              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Provider Service</label>
                 <select className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as MobileBankType})}>
                    {Object.values(MobileBankType).map(v => <option key={v} value={v}>{v}</option>)}
                 </select>
              </div>
              
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Transaction Amount (৳)</label>
                 <input type="number" required className="w-full p-4 rounded-2xl bg-indigo-50 border-indigo-100 text-2xl font-black text-indigo-700" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Reference / Note</label>
                 <input className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold" placeholder="যেমন: নম্বর বা নাম" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-black transition-all">Record Transaction</button>
           </form>
        </div>

        <div ref={reportRef} className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col bg-white">
           <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center no-print">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase italic">{activeProvider} Statement</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{reportDate}</p>
              </div>
              <div className="flex items-center space-x-2">
                 <input type="date" className="border rounded-xl p-2 text-xs font-black" value={reportDate} onChange={e => setReportDate(e.target.value)} />
                 <button onClick={handleDownloadReport} className="h-10 px-4 bg-slate-900 text-white rounded-xl font-black text-xs">Download PDF</button>
              </div>
           </div>

           <div className="overflow-y-auto max-h-[600px] flex-1">
             <table className="w-full">
                <thead>
                   <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 text-left border-b">
                      <th className="p-6">Transaction</th>
                      <th className="p-6">Flow</th>
                      <th className="p-6 text-right">Amount</th>
                      <th className="p-6">Source</th>
                      <th className="p-6 text-center no-print">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                       <td className="p-6 text-xs font-bold text-slate-400 uppercase">#{tx.id.substr(0, 6)}</td>
                       <td className="p-6">
                          <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${tx.transactionType === 'IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                             {tx.transactionType === 'IN' ? 'Cash In' : 'Cash Out'}
                          </span>
                       </td>
                       <td className="p-6 font-black text-lg text-right">৳{tx.amount.toLocaleString()}</td>
                       <td className="p-6 text-[10px] font-black text-slate-500 uppercase">
                         {tx.transactionType === 'IN' ? (tx.sourceType === 'SHOP' ? shops.find(s => s.id === tx.sourceShopId)?.name : 'Pocket') : 'Wallet'}
                       </td>
                       <td className="p-6 text-center no-print">
                         <button onClick={() => onDeleteTx && onDeleteTx(tx.id)} className="text-rose-400 hover:text-rose-600"><i className="fas fa-trash-can"></i></button>
                       </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MobileBanking;
