
import React, { useState } from 'react';
import { Shop, Expense } from '../types';

interface ExpensesProps {
  shops: Shop[];
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense?: (id: string) => void;
  onBack?: () => void;
}

const Expenses: React.FC<ExpensesProps> = ({ shops, expenses, onAddExpense, onDeleteExpense, onBack }) => {
  const [formData, setFormData] = useState({
    shopId: shops[0]?.id || '',
    type: 'Rent',
    amount: 0,
    description: '',
    sourceType: 'SHOP' as 'SHOP' | 'POCKET',
    sourceShopId: shops[0]?.id || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return;
    onAddExpense({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      ...formData,
      sourceShopId: formData.sourceType === 'SHOP' ? formData.sourceShopId : undefined
    } as Expense);
    setFormData({ ...formData, amount: 0, description: '' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl sticky top-8">
           <div className="flex items-center space-x-3 mb-8">
              {onBack && (
                <button onClick={onBack} className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                  <i className="fas fa-arrow-left"></i>
                </button>
              )}
              <h3 className="text-2xl font-black text-slate-800 flex items-center italic uppercase">
                <i className="fas fa-plus-circle mr-3 text-rose-500"></i> New Expense
              </h3>
           </div>
           
           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Shop</label>
                <select className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" value={formData.shopId} onChange={e => setFormData({...formData, shopId: e.target.value})}>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <select className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option>Rent</option>
                  <option>Electric Bill</option>
                  <option>Labor/Salary</option>
                  <option>Purchase</option>
                  <option>Others</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                <input type="number" required className="w-full p-4 rounded-2xl bg-rose-50 border-rose-100 font-black text-2xl text-rose-600" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
              </div>

              <button type="submit" className="w-full bg-rose-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-rose-600 transition-all">Record Expense</button>
           </form>
        </div>
      </div>

      <div className="lg:col-span-2">
         <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden min-h-[500px]">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Recent Expenses</h3>
               <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase">{expenses.length} Total</span>
            </div>
            <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-black border-b text-left">
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Shop</th>
                    <th className="px-8 py-5">Category</th>
                    <th className="px-8 py-5 text-right">Amount</th>
                    <th className="px-8 py-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-rose-50/30 transition-all">
                      <td className="px-8 py-6 text-xs text-slate-400 font-bold">{new Date(e.date).toLocaleDateString()}</td>
                      <td className="px-8 py-6 font-black text-slate-700 text-sm">{shops.find(s => s.id === e.shopId)?.name}</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase">{e.type}</span>
                        <p className="text-[9px] text-rose-400 font-black uppercase mt-1">Source: {e.sourceType === 'SHOP' ? shops.find(s => s.id === e.sourceShopId)?.name : 'Pocket'}</p>
                      </td>
                      <td className="px-8 py-6 font-black text-rose-600 text-right text-lg">৳{e.amount.toLocaleString()}</td>
                      <td className="px-8 py-6 text-center">
                        <button onClick={() => onDeleteExpense && onDeleteExpense(e.id)} className="h-8 w-8 bg-rose-50 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><i className="fas fa-trash-can text-xs"></i></button>
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

export default Expenses;
