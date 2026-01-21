
import React, { useState } from 'react';

interface EditableWithAuditProps {
  label: string;
  value: any;
  type?: 'text' | 'number' | 'textarea';
  onSave: (newValue: any, reason: string) => Promise<void>;
  isLoading?: boolean;
}

const EditableWithAudit: React.FC<EditableWithAuditProps> = ({ label, value, type = 'text', onSave, isLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (tempValue === value) {
      setIsEditing(false);
      return;
    }
    if (!reason.trim()) {
      alert("অনুগ্রহ করে এই পরিবর্তনের কারণটি উল্লেখ করুন।");
      return;
    }

    setSaving(true);
    try {
      await onSave(tempValue, reason);
      setIsEditing(false);
      setReason('');
    } finally {
      setSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="group relative bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center transition-all hover:bg-white hover:shadow-md">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-lg font-black text-slate-800">
            {type === 'number' ? `৳${Number(value).toLocaleString()}` : value}
          </p>
        </div>
        <button 
          onClick={() => { setTempValue(value); setIsEditing(true); }}
          className="h-10 w-10 bg-white text-slate-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white shadow-sm border"
        >
          <i className="fas fa-pencil text-xs"></i>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-[2rem] border-2 border-indigo-100 shadow-2xl animate-fadeIn space-y-4">
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs font-black text-indigo-600 uppercase tracking-tighter">{label} এডিট করছেন</p>
        <button onClick={() => setIsEditing(false)} className="text-slate-300 hover:text-rose-500"><i className="fas fa-times"></i></button>
      </div>
      
      {type === 'textarea' ? (
        <textarea 
          className="w-full p-4 rounded-xl border-2 border-slate-100 font-bold h-24"
          value={tempValue}
          onChange={e => setTempValue(e.target.value)}
          autoFocus
        />
      ) : (
        <input 
          type={type}
          className="w-full p-4 rounded-xl border-2 border-slate-100 font-black text-xl text-slate-800"
          value={tempValue}
          onChange={e => setTempValue(type === 'number' ? Number(e.target.value) : e.target.value)}
          autoFocus
        />
      )}

      <div className="space-y-1">
        <label className="text-[10px] font-black text-rose-500 uppercase ml-1">সংশোধনের কারণ (আবশ্যক)</label>
        <textarea 
          placeholder="কেন এডিট করছেন? যেমন: কাস্টমার ভুল বলেছে..." 
          className="w-full p-4 rounded-xl bg-rose-50/30 border border-rose-100 font-bold h-20 text-sm text-rose-900 placeholder-rose-200"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button 
          disabled={saving}
          onClick={handleSave}
          className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase shadow-lg shadow-slate-200"
        >
          {saving ? <i className="fas fa-spinner fa-spin"></i> : 'Update & Notify Admin'}
        </button>
        <button 
          onClick={() => setIsEditing(false)}
          className="px-6 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-xs uppercase"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditableWithAudit;
