
import React, { useState, useRef } from 'react';
import { CompanySettings } from '../types';
import { notificationService } from '../services/notificationService';

interface CompanySettingsProps {
  company: CompanySettings;
  onUpdate: (c: CompanySettings) => void;
  onBack?: () => void;
}

const CompanySettingsPage: React.FC<CompanySettingsProps> = ({ company, onUpdate, onBack }) => {
  const [formData, setFormData] = useState<CompanySettings>({
    ...company,
    adminEmail: company.adminEmail || "mdronytalukder42@gmail.com"
  });
  const logoRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, logo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdate(formData);
    alert('সেটিংস সফলভাবে আপডেট করা হয়েছে!');
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn pb-20">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button onClick={onBack} className="h-12 w-12 bg-white text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
              <i className="fas fa-arrow-left"></i>
            </button>
          )}
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Business Config</h1>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl space-y-10">
         <div className="flex flex-col items-center border-b pb-10">
            <div 
              className="h-32 w-32 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer shadow-inner mb-4 hover:border-indigo-400 transition-all"
              onClick={() => logoRef.current?.click()}
            >
               {formData.logo ? <img src={formData.logo} className="w-full h-full object-contain" /> : <i className="fas fa-cloud-arrow-up text-slate-300 text-3xl"></i>}
            </div>
            <button type="button" onClick={() => logoRef.current?.click()} className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:underline">Upload Company Logo</button>
            <input type="file" ref={logoRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Identity (Name)</label>
               <input className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-slate-50 font-black text-xl text-slate-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Alert Email</label>
               <input className="w-full p-5 rounded-2xl bg-indigo-50 border-2 border-indigo-50 font-black text-xl text-indigo-700" value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} />
            </div>
            <div className="md:col-span-2 space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Headquarters Address</label>
               <textarea className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-slate-50 font-bold h-24" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
         </div>

         <div className="pt-6">
            <button onClick={handleSave} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl shadow-2xl hover:bg-black transition-all transform active:scale-95">
              Save Business Profile
            </button>
         </div>
      </div>
    </div>
  );
};

export default CompanySettingsPage;
