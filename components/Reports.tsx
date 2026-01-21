
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppData, Sale, UserRole, EditStatus, EditRequest, AuditEntry, Customer } from '../types';
import InvoiceModal from './InvoiceModal';
import { databaseService } from '../services/databaseService';
import { notificationService } from '../services/notificationService';
import { pdfService } from '../services/pdfService';

interface ReportsProps {
  data: AppData;
  onUpdateSale: (sale: Sale) => void;
  onDeleteSale: (id: string) => void;
  onBack?: () => void;
  initialCustomerId?: string;
}

const Reports: React.FC<ReportsProps> = ({ data, onUpdateSale, onDeleteSale, onBack, initialCustomerId = 'ALL' }) => {
  const [selectedShopId, setSelectedShopId] = useState<string>('ALL');
  const [reportType, setReportType] = useState<'DAILY' | 'RANGE'>('RANGE');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [correctionSale, setCorrectionSale] = useState<Sale | null>(null);
  const [correctionData, setCorrectionData] = useState({ date: '', totalAmount: 0, paidAmount: 0, description: '', reason: '' });
  const [emailLoading, setEmailLoading] = useState<string | null>(null);
  
  const ledgerTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCustomerId !== 'ALL') {
      setSelectedCustomerId(initialCustomerId);
      setReportType('RANGE');
    }
  }, [initialCustomerId]);

  const currentUser = JSON.parse(localStorage.getItem('logged_in_user') || '{}');

  const handleManualEmail = async (sale: Sale) => {
    const customer = data.customers.find(c => c.id === sale.customerId);
    const shop = data.shops.find(s => s.id === sale.shopId);
    
    if (!customer?.email) {
      alert("কাস্টমারের ইমেইল অ্যাড্রেস দেওয়া নেই। কাস্টমার প্রোফাইল থেকে ইমেইল যোগ করুন।");
      return;
    }
    
    setEmailLoading(sale.id);
    const result = await notificationService.sendSaleInvoice(sale, customer, shop!);
    setEmailLoading(null);
    
    if (result && result.success === false) {
      alert("ইমেইল পাঠানো সম্ভব হয়নি। ব্যাকএন্ড সার্ভার এবং অ্যাপ পাসওয়ার্ড চেক করুন।");
    } else {
      alert(`${customer.name}-এর ইমেইলে ইনভয়েস পাঠানো হয়েছে।`);
    }
  };

  const handleDownloadLedger = async () => {
    if (ledgerTableRef.current) {
      const custName = selectedCustomerId === 'ALL' ? 'All_Customers' : ((data.customers || []).find(c => c.id === selectedCustomerId)?.name || 'Account');
      await pdfService.generatePDF(ledgerTableRef.current, `Statement_${custName}_${startDate}_to_${endDate}`);
    }
  };

  const filteredSales = useMemo(() => {
    return (data.sales || []).filter(s => {
      const saleDateObj = new Date(s.date);
      const saleDateOnly = s.date.split('T')[0];
      let dateMatch = false;

      if (reportType === 'DAILY') {
        dateMatch = saleDateOnly === reportDate;
      } else {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        const saleTime = saleDateObj.getTime();
        dateMatch = saleTime >= start && saleTime <= end;
      }

      const shopMatch = selectedShopId === 'ALL' || s.shopId === selectedShopId;
      const customerMatch = selectedCustomerId === 'ALL' || s.customerId === selectedCustomerId;
      
      const textSearch = (searchQuery || '').toLowerCase();
      const customer = (data.customers || []).find(c => c.id === s.customerId);
      const searchMatch = !searchQuery || 
        (customer?.name || '').toLowerCase().includes(textSearch) || 
        (customer?.mobile || '').includes(textSearch) || 
        (s.description || '').toLowerCase().includes(textSearch);

      return dateMatch && shopMatch && customerMatch && searchMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, reportDate, reportType, startDate, endDate, selectedShopId, selectedCustomerId, searchQuery]);

  const totals = useMemo(() => {
    return filteredSales.reduce((acc, s) => ({
      bill: acc.bill + (s.totalAmount || 0),
      cash: acc.cash + (s.paidAmount || 0),
      due: acc.due + (s.dueAmount || 0)
    }), { bill: 0, cash: 0, due: 0 });
  }, [filteredSales]);

  const initiateCorrection = (sale: Sale) => {
    setCorrectionSale(sale);
    setCorrectionData({
      date: sale.date.split('T')[0],
      totalAmount: sale.totalAmount,
      paidAmount: sale.paidAmount,
      description: sale.description,
      reason: ''
    });
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionSale) return;
    const newDateStr = `${correctionData.date}T12:00:00.000Z`;

    const request: EditRequest = {
      id: `led_req_${Math.random().toString(36).substr(2, 9)}`,
      entityType: 'SALE',
      entityId: correctionSale.id,
      field: 'ledger_entry',
      oldValue: { date: correctionSale.date, totalAmount: correctionSale.totalAmount, paidAmount: correctionSale.paidAmount, description: correctionSale.description },
      newValue: { date: newDateStr, totalAmount: correctionData.totalAmount, paidAmount: correctionData.paidAmount, description: correctionData.description },
      reason: correctionData.reason,
      requestedBy: currentUser.name,
      timestamp: new Date().toISOString(),
      status: EditStatus.PENDING
    };

    if (currentUser.role === UserRole.OWNER) {
      onUpdateSale({
        ...correctionSale,
        date: newDateStr,
        totalAmount: correctionData.totalAmount,
        paidAmount: correctionData.paidAmount,
        dueAmount: correctionData.totalAmount - correctionData.paidAmount,
        description: correctionData.description,
        editHistory: [...(correctionSale.editHistory || []), {
          timestamp: new Date().toISOString(),
          field: 'Direct Edit',
          oldValue: { totalAmount: correctionSale.totalAmount },
          newValue: { totalAmount: correctionData.totalAmount },
          reason: correctionData.reason,
          editedBy: currentUser.name
        }]
      });
      alert("সরাসরি সংশোধন করা হয়েছে।");
    } else {
      await databaseService.addEditRequest(request);
      alert("রিকোয়েস্ট অ্যাডমিনকে পাঠানো হয়েছে।");
    }
    setCorrectionSale(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 no-print flex flex-col md:flex-row gap-6 items-center">
         {onBack && (
            <button onClick={onBack} className="h-14 w-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
               <i className="fas fa-arrow-left"></i>
            </button>
         )}
         <div className="relative flex-1 w-full">
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input type="text" placeholder="Search ledger..." className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold focus:border-indigo-500 transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
         </div>
         <button onClick={handleDownloadLedger} className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all">
            <i className="fas fa-file-pdf mr-2"></i> Download Statement
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
         <select className="w-full p-4 rounded-2xl bg-white border-2 border-slate-100 font-black" value={selectedShopId} onChange={e => setSelectedShopId(e.target.value)}>
            <option value="ALL">All Shops</option>
            {data.shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
         </select>
         <select className="w-full p-4 rounded-2xl bg-white border-2 border-slate-100 font-black" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
            <option value="ALL">All Customers</option>
            {data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
         </select>
         <input type="date" className="w-full p-4 rounded-2xl bg-white border-2 border-slate-100 font-black" value={startDate} onChange={e => setStartDate(e.target.value)} />
         <input type="date" className="w-full p-4 rounded-2xl bg-white border-2 border-slate-100 font-black" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>

      <div ref={ledgerTableRef} className="bg-white rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden printable-area">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] uppercase font-black text-left">
              <th className="p-8">Timeline</th>
              <th className="p-8">Customer</th>
              <th className="p-8 text-right">Bill</th>
              <th className="p-8 text-right">Cash</th>
              <th className="p-8 text-right">Due</th>
              <th className="p-8 text-center no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSales.map(s => {
              const customer = data.customers.find(c => c.id === s.customerId);
              const isEdited = s.editHistory && s.editHistory.length > 0;
              return (
                <tr key={s.id} className="hover:bg-slate-50 transition-all group">
                  <td className="p-8 relative">
                    {isEdited && (
                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" title="This record has been edited"></div>
                    )}
                    <p className="font-black text-slate-800">{new Date(s.date).toLocaleDateString()}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">
                       {new Date(s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       {isEdited && <span className="ml-2 text-rose-500 italic"><i className="fas fa-pen-nib mr-1"></i>EDITED</span>}
                    </p>
                  </td>
                  <td className="p-8">
                    <p className="font-black text-slate-800">{customer?.name || 'Cash Customer'}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{customer?.mobile}</p>
                  </td>
                  <td className="p-8 text-right font-black text-slate-800 text-lg">৳{s.totalAmount.toLocaleString()}</td>
                  <td className="p-8 text-right font-black text-emerald-600 text-lg">৳{s.paidAmount.toLocaleString()}</td>
                  <td className="p-8 text-right font-black text-rose-500 text-lg">৳{s.dueAmount.toLocaleString()}</td>
                  <td className="p-8 text-center no-print">
                    <div className="flex items-center justify-center space-x-2">
                       <button onClick={() => setSelectedSale(s)} className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white" title="Memo">
                          <i className="fas fa-file-invoice"></i>
                       </button>
                       <button 
                         onClick={() => handleManualEmail(s)} 
                         disabled={emailLoading === s.id}
                         className={`h-10 w-10 ${customer?.email ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-slate-50 text-slate-300 cursor-not-allowed'} rounded-xl flex items-center justify-center transition-all`} 
                         title="Email Invoice"
                       >
                          {emailLoading === s.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-envelope"></i>}
                       </button>
                       <button onClick={() => initiateCorrection(s)} className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center hover:bg-amber-600 hover:text-white" title="Edit">
                          <i className="fas fa-edit"></i>
                       </button>
                       <button onClick={() => onDeleteSale(s.id)} className="h-10 w-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white" title="Delete">
                          <i className="fas fa-trash-can"></i>
                       </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-900 text-white">
            <tr className="font-black text-lg">
              <td colSpan={2} className="p-8 text-right uppercase tracking-widest text-xs opacity-50">Grand Totals:</td>
              <td className="p-8 text-right">৳{totals.bill.toLocaleString()}</td>
              <td className="p-8 text-right text-emerald-400">৳{totals.cash.toLocaleString()}</td>
              <td className="p-8 text-right text-rose-400">৳{totals.due.toLocaleString()}</td>
              <td className="p-8"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {correctionSale && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[400] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl animate-slideUp overflow-hidden p-10">
            <h3 className="text-2xl font-black mb-6">Edit Transaction</h3>
            <div className="space-y-4">
               <input type="date" className="w-full p-4 rounded-2xl bg-slate-50 border-2" value={correctionData.date} onChange={e => setCorrectionData({...correctionData, date: e.target.value})} />
               <input type="number" placeholder="Total" className="w-full p-4 rounded-2xl bg-slate-50 border-2" value={correctionData.totalAmount} onChange={e => setCorrectionData({...correctionData, totalAmount: Number(e.target.value)})} />
               <input type="number" placeholder="Paid" className="w-full p-4 rounded-2xl bg-emerald-50 border-2" value={correctionData.paidAmount} onChange={e => setCorrectionData({...correctionData, paidAmount: Number(e.target.value)})} />
               <textarea className="w-full p-4 rounded-2xl bg-slate-50 border-2" value={correctionData.description} onChange={e => setCorrectionData({...correctionData, description: e.target.value})} />
               <textarea required placeholder="Reason" className="w-full p-4 rounded-2xl bg-rose-50 border-2 border-rose-100" value={correctionData.reason} onChange={e => setCorrectionData({...correctionData, reason: e.target.value})} />
               <div className="flex gap-4">
                  <button onClick={handleCorrectionSubmit} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black">Apply Correction</button>
                  <button onClick={() => setCorrectionSale(null)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black">Cancel</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {selectedSale && (
        <InvoiceModal 
          sale={selectedSale} 
          customer={data.customers.find(c => c.id === selectedSale.customerId)}
          shop={data.shops.find(s => s.id === selectedSale.shopId)}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
};

export default Reports;
