
import React, { useState, useMemo, useRef } from 'react';
import { Shop, Investment } from '../types';
import { pdfService } from '../services/pdfService';

interface PurchasesProps {
  shops: Shop[];
  investments: Investment[];
  onAddInvestment: (inv: Investment) => void;
  onDeletePurchase?: (id: string) => void;
  onBack?: () => void;
}

const Purchases: React.FC<PurchasesProps> = ({ shops, investments, onAddInvestment, onDeletePurchase, onBack }) => {
  const [formData, setFormData] = useState({ 
    shopId: shops[0]?.id || '', 
    itemName: '', 
    amount: 0, 
    description: '', 
    sourceType: 'POCKET' as 'SHOP' | 'POCKET',
    sourceShopId: shops[0]?.id || ''
  });
  
  const [selectedShopFilter, setSelectedShopFilter] = useState('ALL');
  const purchaseListRef = useRef<HTMLDivElement>(null);

  const filteredInvestments = useMemo(() => {
    if (selectedShopFilter === 'ALL') return investments;
    return investments.filter(inv => inv.shopId === selectedShopFilter);
  }, [investments, selectedShopFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddInvestment({ 
      id: Math.random().toString(36).substr(2, 9), 
      date: new Date().toISOString(), 
      ...formData,
      sourceShopId: formData.sourceType === 'SHOP' ? formData.sourceShopId : undefined
    } as Investment);
    setFormData({ ...formData, itemName: '', amount: 0, description: '' });
    alert("ক্রয় সফলভাবে এন্ট্রি হয়েছে!");
  };

  const handleDownloadPDF = async () => {
    if (purchaseListRef.current) {
      await pdfService.generatePDF(purchaseListRef.current, `Purchase_Report`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      <div className="lg:col-span-1">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl sticky top-8">
           <div className="flex items-center space-x-3 mb-8">
              {onBack && (
                <button onClick={onBack} className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                  <i className="fas fa-arrow-left"></i>
                </button>
              )}
              <h3 className="text-2xl font-black text-slate-800 flex items-center uppercase italic">
                <i className="fas fa-boxes-packing mr-3 text-indigo-500"></i> Stock Invest
              </h3>
           </div>
           
           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Target Shop (যেখানে মাল আসবে)</label>
                <select className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" value={formData.shopId} onChange={e => setFormData({...formData, shopId: e.target.value})}>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Item Details</label>
                <input required placeholder="যেমন: ৫টি মোবাইল চার্জার" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} />
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                 <label className="text-[10px] font-black uppercase text-indigo-600 ml-1">টাকা দেওয়ার উৎস (Source of Funds)</label>
                 <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setFormData({...formData, sourceType: 'SHOP'})} className={`py-4 rounded-2xl font-black text-[10px] transition-all ${formData.sourceType === 'SHOP' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border'}`}>SHOP CASH</button>
                    <button type="button" onClick={() => setFormData({...formData, sourceType: 'POCKET'})} className={`py-4 rounded-2xl font-black text-[10px] transition-all ${formData.sourceType === 'POCKET' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border'}`}>PERSONAL POCKET</button>
                 </div>
                 {formData.sourceType === 'SHOP' && (
                    <div className="animate-fadeIn">
                       <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Select Shop for Funds</label>
                       <select className="w-full p-3 rounded-xl border bg-white font-bold" value={formData.sourceShopId} onChange={e => setFormData({...formData, sourceShopId: e.target.value})}>
                          {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                    </div>
                 )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Investment Amount</label>
                <input type="number" required className="w-full p-4 rounded-2xl bg-indigo-50 border-indigo-100 font-black text-2xl text-indigo-700" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all">Record Investment</button>
           </form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
         <div className="bg-white p-6 rounded-3xl border border-slate-200 flex justify-between items-center shadow-sm">
            <div className="flex-1 max-w-xs">
               <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Filter by Shop</label>
               <select className="w-full p-3 rounded-xl border bg-slate-50 font-bold" value={selectedShopFilter} onChange={e => setSelectedShopFilter(e.target.value)}>
                  <option value="ALL">Show All Shops</option>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
            </div>
            <button onClick={handleDownloadPDF} className="h-12 px-8 bg-slate-900 text-white rounded-2xl font-black flex items-center shadow-lg"><i className="fas fa-file-pdf mr-2"></i> Download PDF</button>
         </div>

         <div ref={purchaseListRef} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden min-h-[500px]">
            <div className="p-8 border-b bg-slate-50/50">
               <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Overall Purchase History</h3>
            </div>
            <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-black border-b text-left">
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Shop</th>
                    <th className="px-8 py-5">Item</th>
                    <th className="px-8 py-5 text-right">Cost</th>
                    <th className="px-8 py-5 text-center no-print">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvestments.map(inv => (
                    <tr key={inv.id} className="hover:bg-indigo-50/30 transition-all">
                      <td className="px-8 py-6 text-xs text-slate-400 font-bold">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="px-8 py-6 font-black text-slate-700 text-sm">{shops.find(s => s.id === inv.shopId)?.name}</td>
                      <td className="px-8 py-6 font-black text-slate-800 text-sm">
                        {inv.itemName}
                        <p className="text-[9px] text-indigo-500 font-black uppercase mt-1">Source: {inv.sourceType === 'SHOP' ? shops.find(s => s.id === inv.sourceShopId)?.name : 'Pocket'}</p>
                      </td>
                      <td className="px-8 py-6 font-black text-indigo-600 text-right text-lg">৳{inv.amount.toLocaleString()}</td>
                      <td className="px-8 py-6 text-center no-print">
                         <button onClick={() => onDeletePurchase && onDeletePurchase(inv.id)} className="h-8 w-8 bg-rose-50 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><i className="fas fa-trash-can text-xs"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default Purchases;
