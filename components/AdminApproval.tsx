
import React, { useMemo, useState } from 'react';
import { AppData, EditRequest, EditStatus, UserRole, Sale, Customer } from '../types';
import { databaseService } from '../services/databaseService';

interface AdminApprovalProps {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
  currentUser: any;
  onBack?: () => void;
}

const AdminApproval: React.FC<AdminApprovalProps> = ({ data, onUpdateData, currentUser, onBack }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingRequests = useMemo(() => 
    (data.editRequests || []).filter(r => r.status === EditStatus.PENDING), 
    [data.editRequests]
  );

  const handleDecision = async (request: EditRequest, approve: boolean) => {
    setProcessingId(request.id);
    
    try {
      if (approve) {
        let targetEntity: any = null;
        
        if (request.entityType === 'SALE') {
          const sale = data.sales.find(s => s.id === request.entityId);
          if (sale) {
            // Merge existing sale with proposed changes
            const updatedTotal = request.newValue.totalAmount !== undefined ? request.newValue.totalAmount : sale.totalAmount;
            const updatedPaid = request.newValue.paidAmount !== undefined ? request.newValue.paidAmount : sale.paidAmount;
            
            targetEntity = {
              ...sale,
              date: request.newValue.date || sale.date,
              description: request.newValue.description || sale.description,
              totalAmount: updatedTotal,
              paidAmount: updatedPaid,
              dueAmount: updatedTotal - updatedPaid,
              editHistory: [...(sale.editHistory || []), {
                timestamp: new Date().toISOString(),
                field: request.field === 'ledger_entry' ? 'LEDGER_CORRECTION' : request.field,
                oldValue: request.oldValue,
                newValue: request.newValue,
                reason: request.reason,
                editedBy: request.requestedBy,
                approvedBy: currentUser.name 
              }]
            };
          }
        } else if (request.entityType === 'CUSTOMER') {
          const customer = data.customers.find(c => c.id === request.entityId);
          if (customer) {
            targetEntity = {
              ...customer,
              [request.field]: request.newValue,
              auditHistory: [...(customer.auditHistory || []), {
                timestamp: new Date().toISOString(),
                field: request.field,
                oldValue: request.oldValue,
                newValue: request.newValue,
                reason: request.reason,
                editedBy: request.requestedBy,
                approvedBy: currentUser.name
              }]
            };
          }
        }

        if (targetEntity) {
          await databaseService.approveEditRequest(request, currentUser.name, targetEntity);
          alert("সংশোধনী সফলভাবে অ্যাপ্রুভ এবং ইতিহাসে যুক্ত করা হয়েছে!");
        } else {
          alert("ভুল: মূল রেকর্ডটি পাওয়া যায়নি। সম্ভবত এটি আগে ডিলিট করা হয়েছে।");
        }
      } else {
        await databaseService.rejectEditRequest(request, currentUser.name);
        alert("রিকোয়েস্টটি রিজেক্ট করা হয়েছে।");
      }
    } catch (error: any) {
      console.error("Approval flow error:", error);
      alert("ডাটাবেস আপডেট করতে সমস্যা হয়েছে।\nভুল: " + (error.message || "Unknown Error"));
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('bn-BD');
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button onClick={onBack} className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
              <i className="fas fa-arrow-left"></i>
            </button>
          )}
          <div>
            <h2 className="text-2xl font-black text-slate-800 italic uppercase">Security Approvals</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
              Verify Managerial Edit Requests
            </p>
          </div>
        </div>
        <div className="h-14 w-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-xl shadow-indigo-100">
           {pendingRequests.length}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {pendingRequests.map(req => (
          <div key={req.id} className="bg-white p-10 rounded-[3rem] shadow-lg border border-slate-100 flex flex-col md:flex-row gap-10 items-start md:items-center relative overflow-hidden group">
             {processingId === req.id && (
               <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                  <i className="fas fa-spinner fa-spin text-3xl text-indigo-600"></i>
               </div>
             )}
             
             <div className="h-16 w-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 shrink-0">
                <i className={`fas ${req.entityType === 'SALE' ? 'fa-file-invoice' : 'fa-user-tag'} text-2xl`}></i>
             </div>
             
             <div className="flex-1 space-y-4 w-full">
                <div className="flex items-center space-x-3">
                   <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${req.entityType === 'SALE' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                     {req.entityType} Correction
                   </span>
                   <span className="text-[10px] font-bold text-slate-300">REQ_ID: {req.id.substr(0,8).toUpperCase()}</span>
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-800">Request from <span className="text-indigo-600">{req.requestedBy}</span></h3>
                   <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Submitted: {new Date(req.timestamp).toLocaleString('bn-BD')}</p>
                </div>

                {req.field === 'ledger_entry' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-rose-400 mb-2 italic">Current State</p>
                        <p className="text-xs font-bold text-slate-500">Date: {formatDate(req.oldValue.date)}</p>
                        <p className="text-xs font-bold text-slate-500">Total: ৳{req.oldValue.totalAmount}</p>
                        <p className="text-xs font-bold text-slate-500">Paid: ৳{req.oldValue.paidAmount}</p>
                        <p className="text-[10px] text-slate-400 mt-2 italic line-clamp-2">"{req.oldValue.description}"</p>
                     </div>
                     <div className="md:border-l md:pl-6 space-y-1 border-t md:border-t-0 pt-4 md:pt-0">
                        <p className="text-[10px] font-black uppercase text-emerald-500 mb-2 italic">Manager's Proposed Change</p>
                        <p className="text-xs font-black text-indigo-600">Date: {formatDate(req.newValue.date)}</p>
                        <p className="text-xs font-black text-slate-800">Total: ৳{req.newValue.totalAmount}</p>
                        <p className="text-xs font-black text-slate-800">Paid: ৳{req.newValue.paidAmount}</p>
                        <p className="text-[10px] text-slate-600 mt-2 font-bold italic line-clamp-2">"{req.newValue.description}"</p>
                     </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-rose-400 mb-1">Old Value</p>
                        <div className="font-black text-slate-500 italic truncate text-sm">
                           {typeof req.oldValue === 'string' && req.oldValue.startsWith('data:image') ? '[Profile Photo]' : (req.oldValue || 'None')}
                        </div>
                     </div>
                     <div className="md:border-l md:pl-6 space-y-1">
                        <p className="text-[10px] font-black uppercase text-emerald-500 mb-1">New Value</p>
                        <div className="font-black text-slate-800 text-sm">
                           {typeof req.newValue === 'string' && req.newValue.startsWith('data:image') ? '[New Profile Photo]' : (req.newValue || 'None')}
                        </div>
                     </div>
                  </div>
                )}

                <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100">
                   <p className="text-[10px] font-black uppercase text-rose-400 mb-1">Reason for correction:</p>
                   <p className="text-sm font-bold text-rose-900 leading-relaxed italic">"{req.reason}"</p>
                </div>
             </div>

             <div className="flex flex-col gap-3 w-full md:w-56 shrink-0">
                <button 
                  disabled={processingId === req.id}
                  onClick={() => handleDecision(req, true)} 
                  className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black shadow-xl hover:bg-emerald-600 transition-all transform active:scale-95 flex items-center justify-center text-xs uppercase"
                >
                   <i className="fas fa-check-double mr-2"></i> Approve Change
                </button>
                <button 
                  disabled={processingId === req.id}
                  onClick={() => handleDecision(req, false)} 
                  className="w-full py-5 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-rose-50 hover:text-rose-500 transition-all transform active:scale-95 flex items-center justify-center text-xs uppercase"
                >
                   <i className="fas fa-times-circle mr-2"></i> Reject Request
                </button>
             </div>
          </div>
        ))}

        {pendingRequests.length === 0 && (
          <div className="text-center py-32 bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
             <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <i className="fas fa-shield-check text-slate-200 text-4xl"></i>
             </div>
             <p className="text-slate-300 font-black uppercase tracking-[0.3em] italic text-sm">Clear • No Pending Approvals</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApproval;
