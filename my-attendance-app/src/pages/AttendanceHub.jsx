import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AttendanceHub({ classes }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-200 p-6 md:p-10 font-sans selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto mt-10">
        
        {/* HEADER */}
        <header className="mb-12 pb-8 border-b border-white/5">
          <p className="text-indigo-500 text-[11px] font-black uppercase tracking-[0.4em] mb-3">Roll Call</p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
            Select Classroom
          </h1>
        </header>

        {/* SELECTION GRID */}
        <div className="grid grid-cols-1 gap-4">
          {classes.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[40px] text-slate-700 font-black uppercase tracking-widest">
              No classes found. Create one in the Dashboard.
            </div>
          ) : (
            classes.map((c) => (
              <div 
                key={c.id}
                onClick={() => navigate(`/attendance/${c.id}`)}
                className="group bg-[#111622] p-6 md:p-8 rounded-[30px] border border-white/5 cursor-pointer hover:border-indigo-500/40 transition-all flex items-center justify-between relative overflow-hidden"
              >
                {/* Subtle Hover Glow */}
                <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10 flex items-center gap-6">
                  {/* Initial Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase group-hover:text-indigo-400 transition-colors leading-tight">
                      {c.name}
                    </h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                      {c.sub || 'General Studies'}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-8">
                  <div className="hidden md:block text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Roster</p>
                    <p className="text-white font-black text-sm">{c.studentCount || 0} Students</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                    <span className="text-lg font-bold">→</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}