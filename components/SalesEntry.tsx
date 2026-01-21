
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Shop, Customer, Sale, PaymentType, SaleItem } from '../types';
import { geminiService } from '../services/geminiService';
import { notificationService } from '../services/notificationService';
import { AREAS } from '../constants';

interface SalesEntryProps {
  shops: Shop[];
  customers: Customer[];
  onAddSale: (sale: Sale) => Promise<void>;
  onAddCustomer: (customer: Customer) => Promise<void>;
  onBack?: () => void;
}

const SalesEntry: React.FC<SalesEntryProps> = ({ shops, customers, onAddSale, onAddCustomer, onBack }) => {
  const [formData, setFormData] = useState({
    shopId: shops[0]?.id || '',
    customerId: '',
    description: '',
    totalAmount: 0,
    paidAmount: 0,
    paymentType: PaymentType.CASH
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [newCust, setNewCust] = useState<Partial<Customer>>({
    name: '', 
    mobile: '', 
    email: '', 
    fatherName: '', 
    houseName: '', 
    note: '', 
    photo: '', 
    openingDue: 0, 
    openingDueDescription: '',
    area: AREAS[0]
  });

  const filteredSearch = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return (customers || []).filter(c => {
      const name = (c.name || '').toLowerCase();
      const mobile = (c.mobile || '').toLowerCase();
      return name.includes(term) || mobile.includes(term);
    }).slice(0, 5);
  }, [customers, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewCust({ ...newCust, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name || !newCust.mobile) {
      alert("নাম এবং মোবাইল নম্বর অবশ্যই দিতে হবে।");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const customer: Customer = {
        id: 'cust_' + Math.random().toString(36).substr(2, 9),
        name: newCust.name!,
        mobile: newCust.mobile!,
        email: newCust.email || '',
        fatherName: newCust.fatherName || '',
        houseName: newCust.houseName || '',
        note: newCust.note || '',
        photo: newCust.photo || '',
        openingDue: newCust.openingDue || 0,
        openingDueDescription: newCust.openingDueDescription || '',
        area: newCust.area || AREAS[0],
        auditHistory: []
      } as Customer;

      await onAddCustomer(customer);
      setFormData(prev => ({ ...prev, customerId: customer.id }));
      setSearchTerm(`${customer.name} (${customer.mobile})`);
      alert("নতুন কাস্টমার প্রোফাইল সফলভাবে তৈরি হয়েছে!");
    } catch (err: any) {
      console.error("Customer Save Error:", err);
      alert("কাস্টমার প্রোফাইল সেভ করতে সমস্যা হয়েছে: " + (err.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
        alert("কাস্টমার সিলেক্ট করুন।");
        return;
    }
    
    setIsSubmitting(true);
    try {
      const newSale: Sale = {
        id: 'sale_' + Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        shopId: formData.shopId,
        customerId: formData.customerId,
        description: formData.description,
        totalAmount: formData.totalAmount,
        paidAmount: formData.paidAmount,
        paymentType: formData.paymentType,
        dueAmount: formData.totalAmount - formData.paidAmount,
        items: []
      };
      
      await onAddSale(newSale);
      alert("বিক্রয় রেকর্ড সফলভাবে সেভ হয়েছে!");
      
      setFormData({ shopId: shops[0]?.id || '', customerId: '', description: '', totalAmount: 0, paidAmount: 0, paymentType: PaymentType.CASH });
      setSearchTerm('');
      if (onBack) onBack();
    } catch (err: any) {
      console.error("Sale Submit Error:", err);
      alert("বিক্রয় এন্ট্রি সেভ করতে সমস্যা হয়েছে।\nভুল: " + (err.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn pb-20">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            {onBack && (
              <button onClick={onBack} className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all">
                <i className="fas fa-arrow-left"></i>
              </button>
            )}
            <div>
              <h2 className="text-3xl font-black tracking-tight">Sales Entry</h2>
              <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">Generate Invoice & Alert Owner</p>
            </div>
          </div>
          <button onClick={onBack} className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-50 transition-all">
            Cancel
          </button>
        </div>

        <div className="p-10 space-y-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Customer (নাম বা মোবাইল)</label>
            <div className="relative" ref={resultsRef}>
              <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input 
                type="text" 
                placeholder="Search Existing Customer..." 
                className="w-full pl-14 p-5 rounded-3xl border-2 border-slate-50 bg-slate-50 font-black text-xl focus:border-indigo-500 transition-all shadow-inner"
                value={searchTerm}
                onChange={e => {setSearchTerm(e.target.value); setShowResults(true);}}
              />
              {showResults && filteredSearch.length > 0 && (
                <div className="absolute z-50 w-full bg-white shadow-2xl rounded-[2rem] border-2 mt-2 overflow-hidden border-indigo-100">
                  {filteredSearch.map(c => (
                    <button key={c.id} type="button" onClick={() => {setFormData({...formData, customerId: c.id}); setSearchTerm(`${c.name} (${c.mobile})`); setShowResults(false);}} className="w-full p-5 text-left hover:bg-indigo-50 border-b last:border-0 flex items-center gap-4">
                      <div className="h-12 w-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black overflow-hidden">
                         {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{c.mobile}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!formData.customerId && (
            <div className="bg-slate-50 p-10 rounded-[3rem] border-2 border-slate-100 space-y-8 animate-slideDown shadow-inner">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><i className="fas fa-user-plus"></i></div>
                 <h3 className="text-xl font-black text-slate-800 uppercase italic">Register New Customer Profile</h3>
              </div>

              <div className="flex flex-col md:flex-row gap-10 items-center">
                 <div className="flex flex-col items-center">
                    <div 
                      className="h-32 w-32 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 transition-all shadow-xl"
                      onClick={() => photoInputRef.current?.click()}
                    >
                       {newCust.photo ? <img src={newCust.photo} className="w-full h-full object-cover" /> : <i className="fas fa-camera text-slate-200 text-3xl"></i>}
                    </div>
                    <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-widest">Customer Photo</p>
                 </div>
                 <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <input className="w-full p-4 rounded-2xl bg-white border font-bold" placeholder="Customer Name *" value={newCust.name} onChange={e => setNewCust({...newCust, name: e.target.value})} />
                    <input className="w-full p-4 rounded-2xl bg-white border font-bold" placeholder="Mobile Number *" value={newCust.mobile} onChange={e => setNewCust({...newCust, mobile: e.target.value})} />
                    <input className="w-full p-4 rounded-2xl bg-white border font-bold" placeholder="Father's Name" value={newCust.fatherName} onChange={e => setNewCust({...newCust, fatherName: e.target.value})} />
                    <input className="w-full p-4 rounded-2xl bg-white border font-bold" placeholder="Email Address" value={newCust.email} onChange={e => setNewCust({...newCust, email: e.target.value})} />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Address</label>
                    <input className="w-full p-4 rounded-2xl bg-white border font-bold" placeholder="Village, House No, Area" value={newCust.houseName} onChange={e => setNewCust({...newCust, houseName: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Customer Description / Note</label>
                    <input className="w-full p-4 rounded-2xl bg-white border font-bold" placeholder="Any specific note about buyer" value={newCust.note} onChange={e => setNewCust({...newCust, note: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-rose-500 ml-1">Opening Due (বকেয়া থাকলে)</label>
                    <input type="number" className="w-full p-4 rounded-2xl bg-rose-50 border border-rose-100 font-black text-rose-600" value={newCust.openingDue} onChange={e => setNewCust({...newCust, openingDue: Number(e.target.value)})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Due Reason</label>
                    <input className="w-full p-4 rounded-2xl bg-white border font-bold" placeholder="Why this balance is pending?" value={newCust.openingDueDescription} onChange={e => setNewCust({...newCust, openingDueDescription: e.target.value})} />
                 </div>
              </div>

              <button 
                type="button" 
                onClick={handleQuickAdd}
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-xl shadow-2xl hover:bg-indigo-700 transition-all transform active:scale-95 disabled:opacity-50"
              >
                 {isSubmitting ? <i className="fas fa-spinner fa-spin mr-3"></i> : <i className="fas fa-check-circle mr-3"></i>}
                 Save & Select Customer
              </button>
            </div>
          )}

          {formData.customerId && (
            <form onSubmit={handleSubmit} className="space-y-8 animate-slideUp">
               <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-sm">
                        {customers.find(c => c.id === formData.customerId)?.photo ? <img src={customers.find(c => c.id === formData.customerId)?.photo} className="w-full h-full object-cover" /> : <i className="fas fa-user text-indigo-300"></i>}
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Selected Customer</p>
                        <p className="text-xl font-black text-slate-800">{customers.find(c => c.id === formData.customerId)?.name}</p>
                     </div>
                  </div>
                  <button type="button" onClick={() => setFormData({...formData, customerId: ''})} className="text-indigo-600 font-black text-xs uppercase underline">Change</button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items / Description</label>
                    <textarea 
                      required 
                      className="w-full p-5 rounded-[2rem] border-2 border-slate-50 bg-slate-50 font-bold h-40 focus:bg-white" 
                      placeholder="যেমন: ৩টি ফ্যান - ৪০০০ টাকা..." 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-6">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Target Shop</label>
                        <select className="w-full p-4 rounded-2xl border bg-white font-bold" value={formData.shopId} onChange={e => setFormData({...formData, shopId: e.target.value})}>
                          {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 uppercase">Payment Type</label>
                        <select className="w-full p-4 rounded-2xl border bg-white font-black" value={formData.paymentType} onChange={e => setFormData({...formData, paymentType: e.target.value as PaymentType})}>
                          {Object.values(PaymentType).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                     </div>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Total Bill Amount (৳)</label>
                    <input type="number" className="w-full p-6 rounded-[2rem] border-2 bg-indigo-50 font-black text-3xl text-indigo-700" value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Cash Paid (৳)</label>
                    <input type="number" className="w-full p-6 rounded-[2rem] border-2 bg-emerald-50 font-black text-3xl text-emerald-700" value={formData.paidAmount} onChange={e => setFormData({...formData, paidAmount: Number(e.target.value)})} />
                  </div>
               </div>

               <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black text-2xl shadow-2xl hover:bg-black transition-all flex items-center justify-center disabled:opacity-50">
                 {isSubmitting ? <i className="fas fa-spinner fa-spin mr-3"></i> : <i className="fas fa-print mr-3"></i>}
                 Complete Sale & Print
               </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesEntry;
