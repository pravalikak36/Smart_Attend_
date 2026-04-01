import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AttendanceHub({ classes = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false); // Prevents loop in StrictMode

  // --- SMART REDIRECT & AUTO-CREATE LOGIC ---
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const targetSubject = query.get('subject');
    const targetSection = query.get('section');

    // Only run if a subject is being passed from the Timetable
    if (targetSubject && !hasRedirected.current) {
      
      // 1. Try to find the class in the existing list
      const matchedClass = classes.find(c => 
        c.sub?.toLowerCase() === targetSubject.toLowerCase() || 
        c.name?.toLowerCase() === (targetSection?.toLowerCase() || targetSubject.toLowerCase())
      );

      if (matchedClass) {
        // SUCCESS: Direct hit, go to marking page
        hasRedirected.current = true;
        navigate(`/attendance/${matchedClass.id}`, { replace: true });
      } else {
        // FAILURE: No class exists yet. Redirect to Dashboard to create it.
        hasRedirected.current = true;
        // We pass the subject and section to the dashboard auto-filler
        navigate(`/dashboard?autoCreate=true&sub=${targetSubject}&name=${targetSection || ''}`, { replace: true });
      }
    }
  }, [location, classes, navigate]);

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-200 p-6 md:p-10 font-sans selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto mt-10">
        
        <header className="mb-12 pb-8 border-b border-white/5">
          <p className="text-indigo-500 text-[11px] font-black uppercase tracking-[0.4em] mb-3">Roll Call</p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
            {location.search ? "Verifying Session..." : "Select Classroom"}
          </h1>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {classes.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[40px] text-slate-700 font-black uppercase tracking-widest">
              No classes found. Add one to Dashboard.
            </div>
          ) : (
            classes.map((c) => (
              <div 
                key={c.id}
                onClick={() => navigate(`/attendance/${c.id}`)}
                className="group bg-[#111622] p-6 md:p-8 rounded-[30px] border border-white/5 cursor-pointer hover:border-indigo-500/40 transition-all flex items-center justify-between shadow-xl"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-black text-xl">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase group-hover:text-indigo-400 transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                      {c.sub || 'General Studies'}
                    </p>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                  <span className="text-lg font-bold">→</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}