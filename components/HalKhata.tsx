
import React, { useState, useMemo, useRef } from 'react';
import { AppData, Customer, Sale } from '../types';
import { smsService } from '../services/smsService';
import { pdfService } from '../services/pdfService';

interface HalKhataProps {
  data: AppData;
  onSessionAdd: (session: any) => void;
  onBack?: () => void;
}

const HalKhata: React.FC<HalKhataProps> = ({ data, onSessionAdd, onBack }) => {
  const [eventDate, setEventDate] = useState('');
  const [customMsg, setCustomMsg] = useState('সম্মানিত গ্রাহক, হালখাতার টাকা দয়া করে নির্দিষ্ট সময়ে পরিশোধ করে নতুন খাতা খোলার জন্য অনুরোধ করা হলো।');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [currentCustomerName, setCurrentCustomerName] = useState('');
  const dueListRef = useRef<HTMLDivElement>(null);

  const customersWithDue = useMemo(() => {
    return data.customers.filter(c => {
      const custSales = data.sales.filter(s => s.customerId === c.id);
      const totalDue = (c.openingDue || 0) + custSales.reduce((acc, s) => acc + s.dueAmount, 0);
      return totalDue > 0;
    }).sort((a, b) => {
      const dueA = (a.openingDue || 0) + data.sales.filter(s => s.customerId === a.id).reduce((acc, s) => acc + s.dueAmount, 0);
      const dueB = (b.openingDue || 0) + data.sales.filter(s => s.customerId === b.id).reduce((acc, s) => acc + s.dueAmount, 0);
      return dueB - dueA;
    });
  }, [data]);

  const handleBroadcast = async () => {
    if (!eventDate || customersWithDue.length === 0) {
      alert("তারিখ সিলেক্ট করুন এবং কাস্টমার লিস্ট চেক করুন।");
      return;
    }
    const confirm = window.confirm(`${customersWithDue.length} জন বকেয়া কাস্টমারকে কি মেসেজ পাঠাতে চান?`);
    if (!confirm) return;
    
    setIsBroadcasting(true);
    setBroadcastProgress(0);
    
    for (let i = 0; i < customersWithDue.length; i++) {
      const customer = customersWithDue[i];
      setCurrentCustomerName(customer.name);
      
      const due = (customer.openingDue || 0) + data.sales.filter(s => s.customerId === customer.id).reduce((acc, s) => acc + s.dueAmount, 0);
      
      // Construct final personalized message
      const finalMsg = `${customMsg}\nবকেয়া টাকার পরিমাণ: ৳${due.toLocaleString()}\nতারিখ: ${eventDate}\nইতি, ${data.company?.name || 'ShopMaster'}`;
      
      // Use Invitation method from SMS service
      await smsService.sendHalKhataInvitation(
        customer.name, 
        customer.mobile, 
        data.company?.name || 'ShopMaster', 
        eventDate, 
        finalMsg
      );
      
      setBroadcastProgress(Math.round(((i + 1) / customersWithDue.length) * 100));
      // Small delay to prevent blocking the UI thread and simulate network
      await new Promise(r => setTimeout(r, 800));
    }
    
    onSessionAdd({ id: Math.random().toString(36).substr(2, 9), eventDate, message: customMsg, createdAt: new Date().toISOString(), status: 'COMPLETED' });
    setIsBroadcasting(false);
    setCurrentCustomerName('');
    alert('অভিনন্দন! সবার কাছে বকেয়া টাকার হিসাবসহ মেসেজ পৌঁছে গেছে।');
  };

  const handleDownloadDueList = async () => {
    if (dueListRef.current) {
      await pdfService.generatePDF(dueListRef.current, `Due_Balance_Sheet_${new Date().toLocaleDateString()}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden no-print">
         <div className="relative z-10 space-y-8">
            <div className="flex items-center space-x-4">
               {onBack && (
                  <button onClick={onBack} className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md hover:bg-white/30 transition-all">
                     <i className="fas fa-arrow-left"></i>
                  </button>
               )}
               <h2 className="text-4xl font-black flex items-center">
                  <i className="fas fa-calendar-star mr-4"></i> হালখাতা সিস্টেম (Invitations)
               </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest opacity-80">Event Date (হালখাতার তারিখ)</label>
                    <input type="date" className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white font-bold" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest opacity-80">Custom SMS Message (আপনার মেসেজ)</label>
                    <textarea className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 h-32 font-bold" value={customMsg} onChange={e => setCustomMsg(e.target.value)} />
                  </div>
               </div>
               <div className="flex flex-col justify-end">
                  <div className="bg-white/10 p-6 rounded-3xl border border-white/20 mb-6">
                     <p className="text-[10px] font-black uppercase mb-2 text-indigo-200">Real-time SMS Preview (নমুনা):</p>
                     <p className="italic text-sm leading-relaxed">
                        "সম্মানিত [গ্রাহক],<br/>
                        {customMsg}<br/>
                        বকেয়া টাকার পরিমাণ: ৳[বকেয়া]<br/>
                        তারিখ: {eventDate || '[তারিখ]'}<br/>
                        ইতি - {data.company?.name || 'ShopMaster'}"
                     </p>
                  </div>
                  <button onClick={handleBroadcast} disabled={isBroadcasting || !eventDate} className="w-full bg-indigo-500 text-white px-10 py-5 rounded-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center justify-center text-xl disabled:opacity-50">
                    {isBroadcasting ? (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center mb-1">
                           <i className="fas fa-spinner fa-spin mr-3"></i> Sending to {currentCustomerName}...
                        </div>
                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-400 transition-all duration-500" style={{width: `${broadcastProgress}%`}}></div>
                        </div>
                      </div>
                    ) : (
                      <><i className="fas fa-paper-plane mr-3"></i> Broadcast Invitations</>
                    )}
                  </button>
               </div>
            </div>
         </div>
      </div>

      <div ref={dueListRef} className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-50 printable-area bg-white">
         <div className="flex justify-between items-center mb-8 no-print">
            <h3 className="text-2xl font-black text-slate-800">Due Customers List (বকেয়া তালিকা)</h3>
            <button onClick={handleDownloadDueList} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-xs shadow-lg"><i className="fas fa-file-pdf mr-2"></i> Download PDF</button>
         </div>
         
         <div className="overflow-x-auto bg-white">
            <table className="w-full">
               <thead>
                  <tr className="bg-slate-50 text-left text-[10px] font-black uppercase text-slate-400 border-b">
                     <th className="px-6 py-4">Serial</th>
                     <th className="px-6 py-4">Customer Name</th>
                     <th className="px-6 py-4">Mobile Number</th>
                     <th className="px-6 py-4">Area / Village</th>
                     <th className="px-6 py-4 text-right">Total Baki (৳)</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {customersWithDue.map((c, idx) => {
                     const due = (c.openingDue || 0) + data.sales.filter(s => s.customerId === c.id).reduce((acc, s) => acc + s.dueAmount, 0);
                     return (
                        <tr key={c.id} className="hover:bg-indigo-50/30 transition-all">
                           <td className="px-6 py-4 font-bold text-slate-400">{idx + 1}</td>
                           <td className="px-6 py-4 font-black text-slate-800">{c.name}</td>
                           <td className="px-6 py-4 font-medium text-slate-500">{c.mobile}</td>
                           <td className="px-6 py-4 font-medium text-slate-500 italic">{c.area}</td>
                           <td className="px-6 py-4 text-right font-black text-rose-600 text-lg">৳{due.toLocaleString()}</td>
                        </tr>
                     );
                  })}
                  {customersWithDue.length === 0 && <tr><td colSpan={5} className="text-center py-20 text-slate-400 italic">No customers with due balances found.</td></tr>}
               </tbody>
            </table>
         </div>

         <div className="mt-12 flex justify-between items-center border-t pt-10 bg-white">
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">ShopMaster Automated Report</p>
            <div className="text-right">
               <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">Total Outstanding Due</p>
               <p className="text-4xl font-black text-indigo-700">৳{customersWithDue.reduce((acc, c) => acc + ((c.openingDue || 0) + data.sales.filter(s => s.customerId === c.id).reduce((acc, s) => acc + s.dueAmount, 0)), 0).toLocaleString()}</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default HalKhata;
