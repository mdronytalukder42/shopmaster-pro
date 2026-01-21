
import React, { useState, useMemo, useRef } from 'react';
import { AppData, Hawlat, HawlatReturn, Shop } from '../types';

interface HawlatManagementProps {
  data: AppData;
  shops: Shop[];
  onAddHawlat: (h: Hawlat) => void;
  onUpdateHawlat: (h: Hawlat) => void;
  onAddReturn: (r: HawlatReturn) => void;
  onDeleteHawlat?: (id: string) => void;
  onBack?: () => void;
}

const HawlatManagement: React.FC<HawlatManagementProps> = ({ data, shops, onAddHawlat, onUpdateHawlat, onAddReturn, onDeleteHawlat, onBack }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHawlat, setEditingHawlat] = useState<Hawlat | null>(null);
  const [showReturnForm, setShowReturnForm] = useState<Hawlat | null>(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const photoRef = useRef<HTMLInputElement>(null);

  const [hForm, setHForm] = useState({ 
    id: '', 
    receiver: '', 
    fatherName: '',
    houseName: '',
    mobile: '',
    amount: 0, 
    reason: '', 
    sourceType: 'POCKET' as 'SHOP' | 'POCKET',
    shopId: shops[0]?.id || '', 
    photo: '' 
  });
  
  const [rForm, setRForm] = useState({ amount: 0, note: '' });

  const filteredHawlats = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    return (data.hawlats || []).filter(h => {
      const receiverName = (h.receiverName || '').toLowerCase();
      const matchSearch = receiverName.includes(term);
      const matchDate = (h.date || '').startsWith(reportDate);
      return matchSearch && matchDate;
    });
  }, [data, searchTerm, reportDate]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setHForm({ ...hForm, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleHawlatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entryData = {
      receiverName: hForm.receiver, 
      fatherName: hForm.fatherName,
      houseName: hForm.houseName,
      mobile: hForm.mobile,
      amount: hForm.amount, 
      reason: hForm.reason, 
      sourceType: hForm.sourceType,
      shopId: hForm.sourceType === 'SHOP' ? hForm.shopId : undefined,
      photo: hForm.photo 
    };

    if (editingHawlat) {
      onUpdateHawlat({ ...editingHawlat, ...entryData });
      setEditingHawlat(null);
    } else {
      onAddHawlat({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        ...entryData,
        status: 'PENDING'
      } as Hawlat);
    }
    setShowAddForm(false);
    setHForm({ id: '', receiver: '', fatherName: '', houseName: '', mobile: '', amount: 0, reason: '', sourceType: 'POCKET', shopId: shops[0]?.id || '', photo: '' });
  };

  const startEdit = (h: Hawlat) => {
    setHForm({ 
      id: h.id, 
      receiver: h.receiverName, 
      fatherName: h.fatherName || '',
      houseName: h.houseName || '',
      mobile: h.mobile || '',
      amount: h.amount, 
      reason: h.reason, 
      sourceType: h.sourceType || 'POCKET',
      shopId: h.shopId || shops[0]?.id || '', 
      photo: h.photo || '' 
    });
    setEditingHawlat(h);
    setShowAddForm(true);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReturnForm || rForm.amount <= 0) return;
    onAddReturn({ id: Math.random().toString(36).substr(2, 9), hawlatId: showReturnForm.id, date: new Date().toISOString(), amount: rForm.amount, note: rForm.note });
    setShowReturnForm(null);
    setRForm({ amount: 0, note: '' });
  };

  const formatTime = (isoString: string) => {
     return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Search and Filters */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end no-print">
         {onBack && (
            <button onClick={onBack} className="h-14 w-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
               <i className="fas fa-arrow-left"></i>
            </button>
         )}
         <div className="flex-1 min-w-[250px] space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Search Hawlatdar</label>
            <input className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" placeholder="নাম লিখে খুঁজুন..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
         </div>
         <div className="w-48 space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Filter Date</label>
            <input type="date" className="w-full p-4 rounded-2xl bg-indigo-50 border border-indigo-100 font-bold text-indigo-700" value={reportDate} onChange={e => setReportDate(e.target.value)} />
         </div>
         <div className="flex gap-2">
            <button onClick={() => window.print()} className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-black transition-all">
               <i className="fas fa-file-pdf mr-2"></i> Download Log
            </button>
            <button onClick={() => {setEditingHawlat(null); setShowAddForm(true);}} className="h-14 px-8 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all">
               <i className="fas fa-plus mr-2"></i> New Hawlat
            </button>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden printable-area">
         <div className="print-only hidden mb-8 border-b pb-4">
            <h1 className="text-3xl font-black uppercase text-slate-900">{data.company?.name || 'ShopMaster'}</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Hawlat Transaction Log: {reportDate}</p>
         </div>
         <table className="w-full">
            <thead className="bg-slate-50/50 border-b">
               <tr className="text-left text-[10px] uppercase font-black text-slate-400">
                  <th className="p-8">Time & Profile</th>
                  <th className="p-8">Contact & Address</th>
                  <th className="p-8">Source</th>
                  <th className="p-8 text-right">Borrowed</th>
                  <th className="p-8 text-right">Balance</th>
                  <th className="p-8 text-center no-print">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {filteredHawlats.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="p-8">
                        <div className="flex items-center space-x-3">
                           <div className="text-right mr-2 no-print">
                              <p className="text-[9px] font-black text-indigo-500">{formatTime(h.date)}</p>
                           </div>
                           <div className="h-12 w-12 bg-slate-100 rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
                              {h.photo ? <img src={h.photo} className="w-full h-full object-cover" /> : <i className="fas fa-user-circle text-slate-200 text-2xl m-3"></i>}
                           </div>
                           <div>
                              <p className="font-black text-slate-800">{h.receiverName}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{h.fatherName ? `S/O: ${h.fatherName}` : 'Personal'}</p>
                           </div>
                        </div>
                     </td>
                     <td className="p-8">
                        <p className="text-sm font-black text-slate-600">{h.mobile || '---'}</p>
                        <p className="text-[10px] text-slate-400 italic truncate max-w-[150px]">{h.houseName || 'No address'}</p>
                     </td>
                     <td className="p-8">
                        <div className="flex flex-col">
                           <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full w-fit ${h.sourceType === 'SHOP' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                              {h.sourceType === 'SHOP' ? 'Shop Cash' : 'Personal Pocket'}
                           </span>
                           {h.sourceType === 'SHOP' && <p className="text-[10px] font-bold text-slate-400 mt-1">{shops.find(s => s.id === h.shopId)?.name}</p>}
                        </div>
                     </td>
                     <td className="p-8 text-right font-black text-rose-500">৳{h.amount.toLocaleString()}</td>
                     <td className="p-8 text-right font-black text-slate-900 text-xl">
                        ৳{(h.amount - (data.hawlatReturns?.filter(r => r.hawlatId === h.id).reduce((a, b) => a + b.amount, 0) || 0)).toLocaleString()}
                     </td>
                     <td className="p-8 text-center no-print">
                        <div className="flex items-center justify-center space-x-2">
                           <button onClick={() => startEdit(h)} className="p-2 text-indigo-400 hover:text-indigo-600"><i className="fas fa-edit"></i></button>
                           <button onClick={() => setShowReturnForm(h)} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] hover:bg-emerald-600 hover:text-white transition-all">RETURN</button>
                           <button onClick={() => onDeleteHawlat && onDeleteHawlat(h.id)} className="p-2 text-rose-400 hover:text-rose-600 transition-all"><i className="fas fa-trash-can"></i></button>
                        </div>
                     </td>
                  </tr>
               ))}
               {filteredHawlats.length === 0 && (
                 <tr><td colSpan={6} className="p-20 text-center text-slate-300 italic font-black uppercase tracking-widest">No hawlat found for this date.</td></tr>
               )}
            </tbody>
         </table>
      </div>

      {/* Modals remain the same */}
      {showAddForm && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-slideUp overflow-hidden max-h-[90vh] overflow-y-auto">
               <div className="bg-indigo-600 p-8 text-white flex justify-between items-center sticky top-0 z-10">
                  <h3 className="text-2xl font-black">{editingHawlat ? 'সংশোধন হাওলাত' : 'নতুন হাওলাত এন্ট্রি'}</h3>
                  <button onClick={() => setShowAddForm(false)} className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center"><i className="fas fa-times"></i></button>
               </div>
               <form onSubmit={handleHawlatSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 flex justify-center mb-4">
                     <div className="h-24 w-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer shadow-inner" onClick={() => photoRef.current?.click()}>
                        {hForm.photo ? <img src={hForm.photo} className="w-full h-full object-cover" /> : <i className="fas fa-camera text-slate-200 text-2xl"></i>}
                     </div>
                     <input type="file" ref={photoRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400">নাম (Name)</label>
                     <input required className="w-full p-4 rounded-2xl bg-slate-50 border font-bold" value={hForm.receiver} onChange={e => setHForm({...hForm, receiver: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400">মোবাইল (Mobile)</label>
                     <input className="w-full p-4 rounded-2xl bg-slate-50 border font-bold" value={hForm.mobile} onChange={e => setHForm({...hForm, mobile: e.target.value})} />
                  </div>
                  <div className="md:col-span-2 p-6 bg-slate-50 rounded-3xl space-y-4">
                     <label className="text-[10px] font-black uppercase text-slate-400">টাকা দেওয়ার উৎস (Source of Funds)</label>
                     <div className="grid grid-cols-2 gap-4">
                        <button type="button" onClick={() => setHForm({...hForm, sourceType: 'SHOP'})} className={`py-4 rounded-2xl font-black text-xs transition-all ${hForm.sourceType === 'SHOP' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border'}`}>SHOP CASH (দোকান ক্যাশ)</button>
                        <button type="button" onClick={() => setHForm({...hForm, sourceType: 'POCKET'})} className={`py-4 rounded-2xl font-black text-xs transition-all ${hForm.sourceType === 'POCKET' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border'}`}>PERSONAL POCKET (নিজ পকেট)</button>
                     </div>
                     {hForm.sourceType === 'SHOP' && (
                        <div className="animate-fadeIn pt-4">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1">দোকান সিলেক্ট করুন</label>
                           <select className="w-full p-4 rounded-2xl border font-bold" value={hForm.shopId} onChange={e => setHForm({...hForm, shopId: e.target.value})}>
                              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                           </select>
                        </div>
                     )}
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400">পিতার নাম</label>
                     <input className="w-full p-4 rounded-2xl bg-slate-50 border font-bold" value={hForm.fatherName} onChange={e => setHForm({...hForm, fatherName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400">ঠিকানা (Address)</label>
                     <input className="w-full p-4 rounded-2xl bg-slate-50 border font-bold" value={hForm.houseName} onChange={e => setHForm({...hForm, houseName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400">হাওলাত পরিমান (৳)</label>
                     <input type="number" required className="w-full p-4 rounded-2xl bg-indigo-50 border-indigo-100 font-black text-2xl text-indigo-700" value={hForm.amount} onChange={e => setHForm({...hForm, amount: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400">কারণ (Reason)</label>
                     <input className="w-full p-4 rounded-2xl bg-slate-50 border font-bold" value={hForm.reason} onChange={e => setHForm({...hForm, reason: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                     <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all">Submit Hawlat Entry</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {showReturnForm && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[210] flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-slideUp overflow-hidden">
               <div className="bg-emerald-600 p-8 text-white flex justify-between items-center">
                  <h3 className="text-xl font-black">Return Hawlat</h3>
                  <button onClick={() => setShowReturnForm(null)} className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center"><i className="fas fa-times"></i></button>
               </div>
               <form onSubmit={handleReturnSubmit} className="p-8 space-y-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400">Return Amount (৳)</label>
                     <input type="number" required className="w-full p-4 rounded-2xl bg-emerald-50 border-emerald-100 font-black text-xl text-emerald-700" value={rForm.amount} onChange={e => setRForm({...rForm, amount: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-slate-400">Note</label>
                     <input className="w-full p-4 rounded-xl bg-slate-50 border font-bold" value={rForm.note} onChange={e => setRForm({...rForm, note: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-black shadow-lg">Confirm Return</button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default HawlatManagement;
