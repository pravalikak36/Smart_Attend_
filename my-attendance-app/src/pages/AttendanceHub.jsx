import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AttendanceHub({ classes = [], setClasses }) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false); // Prevents double-creation in StrictMode

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const subject = query.get('subject');
    const section = query.get('section');

    if (subject && section && !hasProcessed.current) {
      hasProcessed.current = true;

      // 1. Check if class already exists in your state
      const existingClass = classes.find(
        (c) => c.name === section && c.sub === subject
      );

      if (existingClass) {
        // 2. SKIP: If it exists, go straight to marking attendance
        navigate(`/attendance/${existingClass.id}`, { replace: true });
      } else {
        // 3. AUTO-CREATE: If not found, build a new class object
        const newClass = {
          id: Date.now().toString(), // Unique ID
          name: section,             // e.g., "CSE-A"
          sub: subject,              // e.g., "DBMS"
          studentCount: 0,           // Default
          createdAt: new Date().toISOString()
        };

        // Update the global classes state
        setClasses((prev) => [...prev, newClass]);

        // 4. REDIRECT: Go straight to the newly created class
        navigate(`/attendance/${newClass.id}`, { replace: true });
      }
    }
  }, [location, classes, navigate, setClasses]);

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-200 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto mt-10">
        
        {/* HEADER */}
        <header className="mb-12 pb-8 border-b border-white/5">
          <p className="text-indigo-500 text-[11px] font-black uppercase tracking-[0.4em] mb-3">Roll Call</p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
            Processing Session...
          </h1>
        </header>

        {/* FALLBACK UI: Only shows if someone clicks Attendance Hub manually without a class launch */}
        <div className="grid grid-cols-1 gap-4">
          {classes.map((c) => (
            <div 
              key={c.id}
              onClick={() => navigate(`/attendance/${c.id}`)}
              className="group bg-[#111622] p-8 rounded-[30px] border border-white/5 cursor-pointer hover:border-indigo-500/40 transition-all flex items-center justify-between"
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
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <span className="text-lg font-bold">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}