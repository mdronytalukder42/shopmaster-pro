
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, UserRole } from '../types';
import { databaseService } from '../services/databaseService';

interface ChatProps {
  currentUser: User;
  messages: ChatMessage[];
  onBack?: () => void;
}

const Chat: React.FC<ChatProps> = ({ currentUser, messages, onBack }) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    await databaseService.addChatMessage(newMessage);
    setInputText('');
  };

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-fadeIn">
      {/* Header */}
      <div className="bg-indigo-600 p-8 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button onClick={onBack} className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all">
              <i className="fas fa-arrow-left"></i>
            </button>
          )}
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight italic">Support Chat</h2>
            <div className="flex items-center text-[10px] font-bold text-indigo-100 uppercase mt-0.5">
              <span className="h-2 w-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
              Connected to Admin
            </div>
          </div>
        </div>
        <div className="flex -space-x-2">
           <div className="h-10 w-10 rounded-full border-2 border-indigo-600 bg-white flex items-center justify-center text-indigo-600 text-xs font-black">A</div>
           <div className="h-10 w-10 rounded-full border-2 border-indigo-600 bg-indigo-200 flex items-center justify-center text-indigo-800 text-xs font-black">M</div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/50"
      >
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.id;
          const showSender = idx === 0 || messages[idx-1].senderId !== msg.senderId;

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && showSender && (
                <p className="text-[9px] font-black text-slate-400 uppercase ml-3 mb-1">{msg.senderName} ({msg.senderRole})</p>
              )}
              <div className={`
                max-w-[80%] px-6 py-4 rounded-[2rem] shadow-sm text-sm font-medium leading-relaxed
                ${isMe 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}
              `}>
                {msg.text}
              </div>
              <p className="text-[8px] font-bold text-slate-300 mt-1 uppercase">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
             <i className="fas fa-comments text-5xl mb-4 opacity-20"></i>
             <p className="font-black uppercase tracking-widest text-[10px]">No messages yet. Start a conversation!</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-100 flex gap-4 shrink-0">
        <input 
          type="text" 
          placeholder="Type your message here..."
          className="flex-1 px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
        <button 
          type="submit"
          className="h-14 w-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-indigo-700 transition-all transform active:scale-95"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default Chat;
