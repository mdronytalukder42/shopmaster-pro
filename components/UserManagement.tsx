
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface UserManagementProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  // Fix: Added missing onBack prop
  onBack?: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUsers, onBack }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({ name: '', email: '', password: '', role: UserRole.MANAGER });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) return;
    
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUser.name!,
      email: newUser.email!,
      password: newUser.password!,
      role: newUser.role || UserRole.MANAGER
    };

    onUpdateUsers([...users, user]);
    setShowAddForm(false);
    setNewUser({ name: '', email: '', password: '', role: UserRole.MANAGER });
    alert('User created successfully!');
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1) {
      alert("At least one admin must remain.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this user?")) {
      onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        {/* Fix: Added back button UI */}
        <div className="flex items-center space-x-4">
          {onBack && (
            <button onClick={onBack} className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
              <i className="fas fa-arrow-left"></i>
            </button>
          )}
          <div>
             <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Staff & Roles</h2>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Manage team access and passwords</p>
          </div>
        </div>
        <button onClick={() => setShowAddForm(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg">
           <i className="fas fa-plus mr-2"></i> Add New User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(u => (
          <div key={u.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
             <div className="flex items-center space-x-4 mb-6">
                <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">
                   {u.photo ? <img src={u.photo} className="w-full h-full object-cover rounded-2xl" /> : u.name.charAt(0)}
                </div>
                <div>
                   <h4 className="font-black text-slate-800 text-lg">{u.name}</h4>
                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === UserRole.OWNER ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {u.role}
                   </span>
                </div>
             </div>
             <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-xs">
                   <span className="text-slate-400 font-bold uppercase">Email:</span>
                   <span className="font-black text-slate-700">{u.email}</span>
                </div>
                <div className="flex justify-between text-xs">
                   <span className="text-slate-400 font-bold uppercase">Password:</span>
                   <span className="font-black text-slate-700">••••••••</span>
                </div>
             </div>
             <div className="mt-6 pt-4 border-t flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => deleteUser(u.id)} className="text-rose-500 text-xs font-black uppercase hover:underline">
                   Delete Account
                </button>
             </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-slideUp overflow-hidden">
              <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                 <h3 className="text-2xl font-black">Add New User</h3>
                 <button onClick={() => setShowAddForm(false)} className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center"><i className="fas fa-times"></i></button>
              </div>
              <form onSubmit={handleAddUser} className="p-10 space-y-5">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Name</label>
                    <input required className="w-full p-4 rounded-2xl border font-bold bg-white" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email / Username</label>
                    <input required className="w-full p-4 rounded-2xl border font-bold bg-white" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Account Password</label>
                    <input required type="password" placeholder="Set a password" className="w-full p-4 rounded-2xl border font-bold bg-white" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">User Role</label>
                    <select className="w-full p-4 rounded-2xl border font-bold bg-white" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                       <option value={UserRole.MANAGER}>MANAGER (Staff)</option>
                       <option value={UserRole.OWNER}>OWNER (Admin)</option>
                    </select>
                 </div>
                 <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 mt-4">Create Account</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
