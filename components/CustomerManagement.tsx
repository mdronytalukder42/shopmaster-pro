
import React, { useState, useMemo, useRef } from 'react';
import { Customer, Sale, AppData, CompanySettings, UserRole, EditRequest, EditStatus, AuditEntry } from '../types';
import { AREAS } from '../constants';
import { databaseService } from '../services/databaseService';
import { notificationService } from '../services/notificationService';
import { smsService } from '../services/smsService';
import EditableWithAudit from './EditableWithAudit';

interface CustomerManagementProps {
  customers: Customer[];
  onAdd: (customer: Customer) => void;
  onUpdate?: (customer: Customer) => void;
  onDelete?: (id: string) => void;
  sales: Sale[];
  company?: CompanySettings;
  data: AppData;
  onViewLedger: (customerId: string) => void;
  onBack?: () => void;
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({ customers, onAdd, onUpdate, onDelete, sales, company, data, onViewLedger, onBack }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for adding new customer with all fields
  const [newCust, setNewCust] = useState<Partial<Customer>>({
    name: '', mobile: '', fatherName: '', houseName: '', area: AREAS[0], email: '', openingDue: 0, openingDueDescription: '', photo: '', note: ''
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);
  const currentUser = JSON.parse(localStorage.getItem('logged_in_user') || '{}');

  const getCustomerDue = (id: string) => {
    const cust = (customers || []).find(c => c.id === id);
    const shopSales = (sales || []).filter(s => s.customerId === id);
    return (cust?.openingDue || 0) + shopSales.reduce((acc, s) => acc + s.dueAmount, 0);
  };

  const filteredCustomers = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    return (customers || []).filter(c => {
      const name = (c.name || '').toLowerCase();
      const mobile = (c.mobile || '').toLowerCase();
      return name.includes(term) || mobile.includes(term);
    });
  }, [customers, searchTerm]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isEdit && editingCustomer) {
           handleProfileEditRequest(editingCustomer, 'photo', result, 'Profile photo updated');
        } else {
           setNewCust(prev => ({ ...prev, photo: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name || !newCust.mobile) {
      alert("নাম এবং মোবাইল নম্বর অবশ্যই দিন।");
      return;
    }

    const customer: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCust.name!,
      mobile: newCust.mobile!,
      area: newCust.area || AREAS[0],
      fatherName: newCust.fatherName || '',
      houseName: newCust.houseName || '',
      email: newCust.email || '',
      photo: newCust.photo || '',
      note: newCust.note || '',
      openingDue: newCust.openingDue || 0,
      openingDueDescription: newCust.openingDueDescription || '',
      auditHistory: []
    } as unknown as Customer;

    onAdd(customer);
    setShowAddForm(false);
    setNewCust({ name: '', mobile: '', fatherName: '', houseName: '', area: AREAS[0], email: '', openingDue: 0, openingDueDescription: '', photo: '', note: '' });
  };

  const handleProfileEditRequest = async (customer: Customer, field: string, newValue: any, reason: string) => {
    const oldVal = (customer as any)[field];
    
    if (currentUser.role === UserRole.OWNER) {
      if (onUpdate) {
        const updatedCustomer = { 
          ...customer, 
          [field]: newValue,
          auditHistory: [...(customer.auditHistory || []), {
             timestamp: new Date().toISOString(),
             field,
             oldValue: field === 'photo' ? '[Image Data]' : oldVal,
             newValue: field === 'photo' ? '[Image Data]' : newValue,
             reason,
             editedBy: currentUser.name,
             approvedBy: currentUser.name
          }]
        };
        onUpdate(updatedCustomer);
        setEditingCustomer(updatedCustomer);
        if (field !== 'photo') alert("তথ্য সরাসরি আপডেট করা হয়েছে।");
      }
    } else {
      const request: EditRequest = {
        id: `prof_req_${Math.random().toString(36).substr(2, 9)}`,
        entityType: 'CUSTOMER',
        entityId: customer.id,
        field,
        oldValue: field === 'photo' ? '[Image Data]' : oldVal,
        newValue: field === 'photo' ? '[Image Data]' : newValue,
        reason,
        requestedBy: currentUser.name || 'Manager',
        timestamp: new Date().toISOString(),
        status: EditStatus.PENDING
     };
      await databaseService.addEditRequest(request);
      alert("সংশোধনের রিকোয়েস্ট অ্যাডমিনকে পাঠানো হয়েছে।");
    }
  };

  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleString('bn-BD', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-6 items-center">
        {onBack && (
          <button onClick={onBack} className="h-14 w-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm shrink-0">
            <i className="fas fa-arrow-left"></i>
          </button>
        )}
        <div className="relative flex-1 w-full">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
          <input 
            type="text" 
            placeholder="Search by name or mobile..." 
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold focus:border-indigo-500 transition-all" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="w-full lg:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center"
        >
          <i className="fas fa-user-plus mr-2 text-sm"></i> New Customer
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCustomers.map(c => (
          <div key={c.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group relative">
             <div className="absolute top-8 right-8 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => setViewingCustomer(c)} className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white shadow-inner">
                   <i className="fas fa-eye text-xs"></i>
                </button>
                <button onClick={() => setEditingCustomer(c)} className="h-10 w-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white shadow-inner">
                   <i className="fas fa-user-pen text-xs"></i>
                </button>
                {onDelete && (
                  <button onClick={() => onDelete(c.id)} className="h-10 w-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white shadow-inner">
                    <i className="fas fa-trash-can text-xs"></i>
                  </button>
                )}
             </div>
             
             <div className="flex flex-col items-center text-center mb-8">
                <div className="h-20 w-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center overflow-hidden border-2 border-white shadow-xl mb-4">
                   {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <i className="fas fa-user text-indigo-200 text-3xl"></i>}
                </div>
                <h4 className="font-black text-slate-800 text-2xl tracking-tighter">{c.name}</h4>
                <p className="text-[10px] text-slate-400 font-black uppercase mt-1 italic">{c.area}</p>
             </div>

             <div className="space-y-4 py-6 border-y border-slate-50">
                <div className="flex justify-between items-center"><span className="text-[10px] text-slate-400 font-black uppercase">Phone</span><span className="font-black text-slate-700">{c.mobile}</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] text-slate-400 font-black uppercase">Balance Due</span><span className="font-black text-2xl text-rose-600 tracking-tighter">৳{getCustomerDue(c.id).toLocaleString()}</span></div>
             </div>

             <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => onViewLedger(c.id)}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all"
                >
                  Account Ledger
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* Profile Details & History Modal */}
      {viewingCustomer && (
         <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl animate-slideUp overflow-hidden max-h-[90vh] flex flex-col">
               <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center space-x-4">
                     <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center overflow-hidden">
                        {viewingCustomer.photo ? <img src={viewingCustomer.photo} className="w-full h-full object-cover" /> : <i className="fas fa-user"></i>}
                     </div>
                     <div>
                        <h3 className="text-xl font-black uppercase">{viewingCustomer.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{viewingCustomer.mobile}</p>
                     </div>
                  </div>
                  <button onClick={() => setViewingCustomer(null)} className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><i className="fas fa-times"></i></button>
               </div>
               
               <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1">
                  {/* Basic Info Cards */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Father's Name</p>
                        <p className="font-black text-slate-700">{viewingCustomer.fatherName || 'Not Provided'}</p>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Area / Market</p>
                        <p className="font-black text-slate-700">{viewingCustomer.area}</p>
                     </div>
                  </div>

                  {/* History Timeline */}
                  <div className="space-y-6">
                     <div className="flex items-center space-x-2 text-indigo-600">
                        <i className="fas fa-history"></i>
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Profile Edit History (সংশোধন ইতিহাস)</h4>
                     </div>
                     
                     <div className="space-y-6 relative pl-8 border-l-2 border-slate-100 ml-2">
                        {viewingCustomer.auditHistory && viewingCustomer.auditHistory.length > 0 ? (
                           viewingCustomer.auditHistory.map((history: AuditEntry, idx: number) => (
                              <div key={idx} className="relative">
                                 <div className="absolute -left-[41px] top-1 h-5 w-5 rounded-full bg-white border-4 border-indigo-500 shadow-sm z-10"></div>
                                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                       <div>
                                          <p className="text-xs font-black text-slate-800">Field: <span className="text-indigo-600 uppercase">{history.field}</span></p>
                                          <p className="text-[9px] text-slate-400 font-bold uppercase">{formatDateTime(history.timestamp)}</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[8px] font-black text-slate-400 uppercase">Edited By</p>
                                          <p className="text-[10px] font-black text-slate-800">{history.editedBy}</p>
                                          {history.approvedBy && <p className="text-[8px] text-emerald-500 font-bold uppercase">Appr: {history.approvedBy}</p>}
                                       </div>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-500 italic mb-3">"{history.reason}"</p>
                                    <div className="grid grid-cols-2 gap-4 text-[9px] font-black uppercase bg-white p-3 rounded-xl border border-slate-50">
                                       <div className="text-slate-400">Old: <span className="text-slate-600 truncate inline-block max-w-[100px]">{history.oldValue}</span></div>
                                       <div className="text-emerald-500">New: <span className="text-emerald-600 truncate inline-block max-w-[100px]">{history.newValue}</span></div>
                                    </div>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="text-center py-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                              <p className="text-[10px] font-black text-slate-300 uppercase italic">No history recorded yet</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Profile Edit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[500] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl animate-slideUp overflow-hidden max-h-[90vh] flex flex-col">
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                 <h3 className="text-xl font-black uppercase italic">Edit Customer Profile</h3>
                 <button onClick={() => setEditingCustomer(null)} className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><i className="fas fa-times"></i></button>
              </div>
              <div className="p-10 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                  <div className="flex flex-col items-center mb-6">
                    <div 
                      className="h-28 w-28 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer shadow-inner mb-3 group hover:border-indigo-400 transition-all"
                      onClick={() => editPhotoInputRef.current?.click()}
                    >
                       {editingCustomer.photo ? <img src={editingCustomer.photo} className="w-full h-full object-cover" /> : <i className="fas fa-camera text-slate-300 text-2xl"></i>}
                    </div>
                    <button type="button" onClick={() => editPhotoInputRef.current?.click()} className="text-[10px] font-black text-indigo-600 uppercase hover:underline tracking-widest">Update Profile Photo</button>
                    <input type="file" ref={editPhotoInputRef} className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} />
                  </div>

                  <EditableWithAudit label="Full Name" value={editingCustomer.name} onSave={(val, r) => handleProfileEditRequest(editingCustomer, 'name', val, r)} />
                  <EditableWithAudit label="Mobile Number" value={editingCustomer.mobile} onSave={(val, r) => handleProfileEditRequest(editingCustomer, 'mobile', val, r)} />
                  <EditableWithAudit label="Email" value={editingCustomer.email || ''} onSave={(val, r) => handleProfileEditRequest(editingCustomer, 'email', val, r)} />
                  <EditableWithAudit label="Father's Name" value={editingCustomer.fatherName || ''} onSave={(val, r) => handleProfileEditRequest(editingCustomer, 'fatherName', val, r)} />
                  <EditableWithAudit label="Address" value={editingCustomer.houseName || ''} onSave={(val, r) => handleProfileEditRequest(editingCustomer, 'houseName', val, r)} />
                  <EditableWithAudit label="Profile Note" type="textarea" value={editingCustomer.note || ''} onSave={(val, r) => handleProfileEditRequest(editingCustomer, 'note', val, r)} />
                  <EditableWithAudit label="Opening Due" type="number" value={editingCustomer.openingDue || 0} onSave={(val, r) => handleProfileEditRequest(editingCustomer, 'openingDue', val, r)} />
                  <EditableWithAudit label="Due Reason" value={editingCustomer.openingDueDescription || ''} onSave={(val, r) => handleProfileEditRequest(editingCustomer, 'openingDueDescription', val, r)} />

                  <div className="pt-6 border-t">
                    <button onClick={() => setEditingCustomer(null)} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs">Done Editing</button>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[600] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl animate-slideUp overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center shrink-0">
                <h3 className="text-xl font-black uppercase tracking-tight">Create Full Customer Profile</h3>
                <button onClick={() => setShowAddForm(false)} className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-10 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex flex-col items-center mb-6">
                  <div 
                    className="h-32 w-32 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer shadow-inner mb-3 hover:border-indigo-400 transition-all"
                    onClick={() => photoInputRef.current?.click()}
                  >
                     {newCust.photo ? <img src={newCust.photo} className="w-full h-full object-cover" /> : <i className="fas fa-camera text-slate-300 text-3xl"></i>}
                  </div>
                  <button type="button" onClick={() => photoInputRef.current?.click()} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Upload Profile Photo</button>
                  <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, false)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input required placeholder="Full Name *" className="p-4 rounded-2xl bg-slate-50 border font-bold" value={newCust.name} onChange={e => setNewCust({...newCust, name: e.target.value})} />
                  <input required placeholder="Mobile Number *" className="p-4 rounded-2xl bg-slate-50 border font-bold" value={newCust.mobile} onChange={e => setNewCust({...newCust, mobile: e.target.value})} />
                  <input placeholder="Father's Name" className="p-4 rounded-2xl bg-slate-50 border font-bold" value={newCust.fatherName} onChange={e => setNewCust({...newCust, fatherName: e.target.value})} />
                  <input placeholder="Email Address" className="p-4 rounded-2xl bg-slate-50 border font-bold" value={newCust.email} onChange={e => setNewCust({...newCust, email: e.target.value})} />
                  <div className="md:col-span-2">
                     <input placeholder="Address (Village, House, Area)" className="w-full p-4 rounded-2xl bg-slate-50 border font-bold" value={newCust.houseName} onChange={e => setNewCust({...newCust, houseName: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                     <textarea placeholder="Description / Note about customer" className="w-full p-4 rounded-2xl bg-slate-50 border font-bold h-24" value={newCust.note} onChange={e => setNewCust({...newCust, note: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-rose-500 uppercase ml-1">Opening Due (বকেয়া থাকলে)</label>
                    <input type="number" className="w-full p-4 rounded-2xl bg-rose-50 border border-rose-100 font-black text-rose-600" value={newCust.openingDue} onChange={e => setNewCust({...newCust, openingDue: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Due Reason</label>
                    <input placeholder="বকেয়ার কারণ (যেমন: আগের বছরের)" className="w-full p-4 rounded-2xl bg-slate-50 border font-bold" value={newCust.openingDueDescription} onChange={e => setNewCust({...newCust, openingDueDescription: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all transform active:scale-95">Create Full Profile</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
