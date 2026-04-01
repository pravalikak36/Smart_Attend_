import React from 'react';

export default function Navbar({ teacher }) {
  return (
    <header className="h-20 bg-[#0b0f1a]/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 px-8 flex items-center justify-between">
      <div>
        {/* Increased from 10px to 12px (text-xs) and adjusted tracking */}
        <h2 className="text-s font-black uppercase tracking-[0.4em] text-slate-500">
          Faculty Management
        </h2>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-right hidden md:block">
          {/* Increased from text-xs to text-sm for the name */}
          <p className="text-sm font-black text-white uppercase tracking-tight">
            {teacher?.name || 'Academic User'}
          </p>
          {/* Increased from 9px to 10px for the email */}
          <p className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-widest">
            {teacher?.email}
          </p>
        </div>
        
        {/* Profile Avatar */}
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white border border-white/10 shadow-lg shadow-indigo-500/10">
          {teacher?.email?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}