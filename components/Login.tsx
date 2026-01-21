
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { User, UserRole } from '../types';
import { databaseService } from '../services/databaseService';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPortal, setSelectedPortal] = useState<'NONE' | UserRole>('NONE');

  // Specific UIDs provided by user
  const ADMIN_UID = '3caa914e-8616-45e8-9dbb-a1edb625175c';
  const MANAGER_UID = 'd101e329-74f4-4ea4-8d5f-0139abf00fe1';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const sbUser = data.user;
      if (!sbUser) throw new Error("No user found");

      // Determine role strictly based on provided UIDs or fallback to existing profile
      let profile = await databaseService.getUserProfile(sbUser.id);
      
      let determinedRole: UserRole | null = null;
      if (sbUser.id === ADMIN_UID) determinedRole = UserRole.OWNER;
      else if (sbUser.id === MANAGER_UID) determinedRole = UserRole.MANAGER;

      if (!profile) {
        // If no profile exists, create one using the determined role or default to Manager
        const role = determinedRole || UserRole.MANAGER;
        profile = {
          id: sbUser.id,
          name: sbUser.user_metadata?.full_name || (role === UserRole.OWNER ? 'Admin Owner' : 'Shop Manager'),
          role: role,
          email: sbUser.email || email
        };
        await databaseService.updateUserProfile(sbUser.id, profile);
      } else if (determinedRole && profile.role !== determinedRole) {
        // Sync role if it changed or needs enforcement based on UID
        profile.role = determinedRole;
        await databaseService.updateUserProfile(sbUser.id, profile as User);
      }

      // Final check: Does the user's role match the selected portal?
      if (profile?.role !== selectedPortal) {
        setError(`আপনি ${selectedPortal} পোর্টালে লগইন করার চেষ্টা করছেন কিন্তু আপনার অ্যাকাউন্টটি একটি ${profile?.role} অ্যাকাউন্ট।`);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      onLogin(profile as User);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'লগইন করতে সমস্যা হচ্ছে। সঠিক ইমেইল এবং পাসওয়ার্ড দিন।');
    } finally {
      setLoading(false);
    }
  };

  if (selectedPortal === 'NONE') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-12 animate-fadeIn">
           <div className="h-20 w-20 bg-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
              <i className="fas fa-cube text-white text-4xl"></i>
           </div>
           <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">ANOWER TELECOM</h1>
           <p className="text-slate-500 font-bold mt-2 uppercase tracking-[0.2em] text-[10px]">Shop Management Suite (Supabase Cloud)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl animate-slideUp">
          <button 
            onClick={() => setSelectedPortal(UserRole.OWNER)}
            className="group relative bg-slate-900 p-12 rounded-[3rem] border-2 border-slate-800 hover:border-indigo-500 transition-all text-left overflow-hidden shadow-2xl"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/20 transition-all"></div>
            <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-indigo-600/20">
               <i className="fas fa-user-shield text-white text-2xl"></i>
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic">Admin Portal</h3>
            <p className="text-slate-400 mt-2 font-medium leading-relaxed">মালিক বা অ্যাডমিন একাউন্টের জন্য। এখান থেকে সব শপ এবং রিপোর্ট নিয়ন্ত্রণ করা যায়।</p>
            <div className="mt-8 flex items-center text-indigo-400 font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform">
               Enter as Owner <i className="fas fa-arrow-right ml-2"></i>
            </div>
          </button>

          <button 
            onClick={() => setSelectedPortal(UserRole.MANAGER)}
            className="group relative bg-slate-900 p-12 rounded-[3rem] border-2 border-slate-800 hover:border-emerald-500 transition-all text-left overflow-hidden shadow-2xl"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 bg-emerald-600/10 rounded-full blur-3xl group-hover:bg-emerald-600/20 transition-all"></div>
            <div className="h-16 w-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-emerald-600/20">
               <i className="fas fa-shop text-white text-2xl"></i>
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic">Manager Portal</h3>
            <p className="text-slate-400 mt-2 font-medium leading-relaxed">শপ ম্যানেজারদের জন্য। ডেইলি সেলস এন্ট্রি এবং ক্লোজিং করার জন্য এখানে প্রবেশ করুন।</p>
            <div className="mt-8 flex items-center text-emerald-400 font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform">
               Enter as Manager <i className="fas fa-arrow-right ml-2"></i>
            </div>
          </button>
        </div>
        
        <p className="mt-12 text-slate-600 text-[10px] font-black uppercase tracking-widest">Powered by Supabase Security • Project: ANOWER TELECOM</p>
      </div>
    );
  }

  const themeColor = selectedPortal === UserRole.OWNER ? 'indigo' : 'emerald';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn border border-slate-800">
        <div className={`p-10 text-center text-white relative ${themeColor === 'indigo' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
           <button 
             onClick={() => setSelectedPortal('NONE')}
             className="absolute left-6 top-10 h-10 w-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
           >
              <i className="fas fa-arrow-left"></i>
           </button>
           <div className="h-16 w-16 bg-white rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg">
              <i className={`fas ${selectedPortal === UserRole.OWNER ? 'fa-user-shield text-indigo-600' : 'fa-shop text-emerald-600'} text-3xl`}></i>
           </div>
           <h1 className="text-3xl font-black tracking-tight uppercase italic">{selectedPortal} Login</h1>
        </div>

        <div className="p-10">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-rose-700 text-[10px] font-bold rounded-lg mb-4">
                <i className="fas fa-exclamation-circle mr-2"></i> {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <input 
                type="email"
                placeholder="name@example.com"
                className={`w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-${themeColor}-500 font-bold transition-all`}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <input 
                type="password"
                placeholder="••••••••"
                className={`w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-${themeColor}-500 font-bold transition-all`}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full ${themeColor === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white py-5 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center transform active:scale-95`}
            >
              {loading ? <i className="fas fa-spinner fa-spin mr-3"></i> : <i className="fas fa-lock-open mr-3"></i>}
              Secure Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
