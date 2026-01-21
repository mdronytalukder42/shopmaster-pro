
import React, { useRef, useEffect } from 'react';
import { Sale, Customer, Shop, AuditEntry } from '../types';
import { pdfService } from '../services/pdfService';

interface InvoiceModalProps {
  sale: Sale;
  customer?: Customer;
  shop?: Shop;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, customer, shop, onClose }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleDownload = async () => {
    const filename = `Memo_${sale.id.substr(0, 8)}_${customer?.name || 'Cash'}`;
    await pdfService.generatePDF(invoiceRef.current!, filename);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleString('bn-BD', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const renderValueChange = (oldVal: any, newVal: any) => {
    if (typeof oldVal === 'object') {
      return (
        <div className="grid grid-cols-2 gap-4 text-[9px] font-black uppercase mt-1">
          <div className="text-slate-400">আগে: <span className="text-slate-600">৳{oldVal.totalAmount || '---'}</span></div>
          <div className="text-emerald-500">এখন: <span className="text-emerald-600">৳{newVal.totalAmount || '---'}</span></div>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-4 text-[9px] font-black uppercase mt-1">
        <div className="text-slate-400">আগে: <span className="text-slate-600">{oldVal || 'None'}</span></div>
        <div className="text-emerald-500">এখন: <span className="text-emerald-600">{newVal || 'None'}</span></div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[250] flex items-center justify-center p-4 cursor-zoom-out"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[95vh] relative cursor-default"
        onClick={e => e.stopPropagation()}
      >
        
        <div className="absolute top-0 left-0 right-0 z-[60] p-6 flex justify-between items-center pointer-events-none no-pdf">
          <button 
            onClick={onClose} 
            className="pointer-events-auto h-12 px-6 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 group"
          >
            <i className="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i>
            <span className="font-black uppercase text-[10px] tracking-widest">পিছনে যান (Back)</span>
          </button>
          
          <button 
            onClick={onClose} 
            className="pointer-events-auto h-12 w-12 bg-white text-slate-400 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 hover:text-rose-500 transition-all"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar pt-24 pb-8">
          <div ref={invoiceRef} className="p-12 space-y-10 bg-white">
            <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl no-pdf">
                  <i className="fas fa-cube text-3xl"></i>
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">{shop?.name || 'ShopMaster Business'}</h1>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 italic">Official Transaction Memo</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-5xl font-black text-slate-100 uppercase tracking-widest mb-4 opacity-30 select-none">MEMO</h2>
                <div className="space-y-1">
                   <p className="text-slate-400 font-black uppercase text-[10px]">Invoice No.</p>
                   <p className="text-slate-800 font-black text-lg">#{sale.id.substr(0,8).toUpperCase()}</p>
                   <p className="text-slate-500 font-bold text-xs">{new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Customer Details:</h3>
                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                   <p className="font-black text-slate-800 text-xl">{customer?.name || 'Cash Customer'}</p>
                   <p className="text-slate-600 font-bold text-sm">{customer?.mobile}</p>
                   <p className="text-slate-500 text-xs mt-1 italic">{customer?.houseName || customer?.area}</p>
                </div>
              </div>
              <div className="text-right space-y-3">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Transaction Summary:</h3>
                <div className="inline-flex flex-col items-end">
                  <span className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase mb-2 ${sale.dueAmount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {sale.dueAmount > 0 ? 'Payment Pending' : 'Payment Completed'}
                  </span>
                  <p className="text-slate-800 font-black text-lg italic tracking-tight">{sale.paymentType} Mode</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest">Product / Item Description</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest">Sub-Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-8 py-12 text-slate-700 font-bold text-lg whitespace-pre-wrap leading-relaxed border-b border-slate-50 min-h-[150px]">{sale.description}</td>
                    <td className="px-8 py-12 text-right font-black text-slate-900 text-4xl bg-slate-50/20 border-l border-slate-50 border-b border-slate-50">৳{sale.totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-end pt-6 gap-8">
              <div className="flex-1 text-slate-300 text-[9px] italic font-black uppercase tracking-widest">
                 Authorized computer generated memo from ShopMaster Intelligence Suite
              </div>
              <div className="w-full sm:w-80 space-y-4">
                <div className="flex justify-between items-center text-slate-400 font-bold text-xs uppercase px-2">
                  <span>Gross Total:</span>
                  <span className="text-slate-800 font-black">৳{sale.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-black text-xs uppercase border-b border-slate-100 pb-3 px-2">
                  <span>Received Cash:</span>
                  <span className="text-2xl">৳{sale.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center bg-rose-50 p-6 rounded-[2rem] border-2 border-dashed border-rose-100">
                  <span className="font-black text-rose-400 uppercase text-[10px] tracking-widest">Balance Due:</span>
                  <span className="text-4xl font-black text-rose-600 tracking-tighter">৳{sale.dueAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Detailed Audit History Timeline */}
            {sale.editHistory && sale.editHistory.length > 0 && (
              <div className="mt-12 pt-10 border-t-2 border-slate-50 space-y-6 no-print">
                <div className="flex items-center space-x-2 text-rose-500">
                  <i className="fas fa-history"></i>
                  <h4 className="text-[10px] font-black uppercase tracking-widest">সংশোধন ইতিহাস (Audit Timeline)</h4>
                </div>
                <div className="space-y-4">
                  {sale.editHistory.map((history: AuditEntry, idx: number) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative pl-10 overflow-hidden shadow-sm">
                       <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-300"></div>
                       <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-xs font-black text-slate-800">
                               অনুরোধ করেছেন: <span className="text-indigo-600">{history.editedBy}</span>
                            </p>
                            {history.approvedBy && (
                              <p className="text-[10px] font-black text-emerald-600 mt-0.5">
                                 অনুমোদন করেছেন: <span className="font-bold">{history.approvedBy}</span>
                              </p>
                            )}
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{formatDateTime(history.timestamp)}</p>
                          </div>
                          <span className="px-3 py-1 bg-white text-rose-500 text-[8px] font-black rounded-full uppercase border border-rose-100">Audit Log</span>
                       </div>
                       <div className="bg-white/50 p-3 rounded-xl border border-slate-100 mt-2">
                          <p className="text-[11px] font-bold text-slate-500 italic leading-relaxed">কারণ: "{history.reason}"</p>
                          {renderValueChange(history.oldValue, history.newValue)}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-12 text-center border-t-2 border-dashed border-slate-100">
              <p className="text-xs text-indigo-500 font-black uppercase tracking-[0.5em] italic">Thank You for Your Business</p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-900 flex justify-end space-x-4 no-pdf shrink-0">
          <button onClick={onClose} className="px-8 py-4 rounded-2xl font-black text-white/40 hover:text-white transition-colors uppercase text-[10px]">
            Close Voucher
          </button>
          <button 
            onClick={handleDownload} 
            className="px-12 py-4 rounded-2xl font-black bg-indigo-600 text-white shadow-2xl flex items-center transform hover:scale-105 transition-all uppercase text-[10px] tracking-widest"
          >
            <i className="fas fa-file-pdf mr-3"></i> Download Memo PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
