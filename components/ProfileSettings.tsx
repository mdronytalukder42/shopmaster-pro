
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { supabase } from '../supabase';

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

const ProfileSettings: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({ ...user });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      // 1. Update Supabase Auth Profile
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: formData.name },
        password: newPassword || undefined
      });

      if (authError) throw authError;

      if (newPassword && newPassword !== confirmPassword) {
        throw new Error("পাসওয়ার্ড মেলেনি!");
      }

      // 2. Update Firestore/DB profile
      onUpdate(formData);
      setMsg({ text: 'প্রোফাইল সফলভাবে আপডেট হয়েছে!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      setMsg({ text: err.message || 'আপডেট করতে সমস্যা হয়েছে।', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-slideUp">
      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-indigo-600 p-10 text-white flex justify-between items-center">
           <div>
              <h2 className="text-3xl font-black">User Profile</h2>
              <p className="text-indigo-100 mt-2 font-bold uppercase text-xs tracking-widest">Supabase Cloud Management</p>
           </div>
           <div className="h-24 w-24 bg-white/20 rounded-3xl backdrop-blur-md flex items-center justify-center border-2 border-white/30 overflow-hidden shadow-2xl">
              {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <span className="text-4xl font-black">{formData.name.charAt(0)}</span>}
           </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
           {msg.text && (
             <div className={`p-4 rounded-2xl text-sm font-bold flex items-center ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500' : 'bg-rose-50 text-rose-700 border-l-4 border-rose-500'}`}>
                <i className={`fas ${msg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-3`}></i>
                {msg.text}
             </div>
           )}

           <div className="flex flex-col items-center">
              <button type="button" onClick={() => photoInputRef.current?.click()} className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                 <i className="fas fa-camera mr-2"></i> প্রোফাইল ছবি পরিবর্তন
              </button>
              <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Name</label>
                 <input className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email</label>
                 <input readOnly className="w-full p-4 rounded-2xl bg-slate-100 border border-slate-200 font-bold text-slate-400 cursor-not-allowed" value={formData.email} />
              </div>
           </div>

           <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
              <div className="flex items-center space-x-2 text-indigo-600 mb-2">
                 <i className="fas fa-key text-sm"></i>
                 <h4 className="text-xs font-black uppercase tracking-widest">Update Security</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input type="password" placeholder="New Password" className="w-full p-4 rounded-2xl border border-slate-200 font-bold" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                 <input type="password" placeholder="Confirm Password" className="w-full p-4 rounded-2xl border border-slate-200 font-bold" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
           </div>

           <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all transform active:scale-95 flex items-center justify-center">
              {loading ? <i className="fas fa-spinner fa-spin mr-3"></i> : <i className="fas fa-save mr-3"></i>}
              Update Configuration
           </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
