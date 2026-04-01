import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ teacher }) {
  const location = useLocation();
  const [userData, setUserData] = useState({ 
    name: teacher?.name || 'Academic User', 
    avatar: null 
  });

  // This is the "Magic" part: It runs every time you change pages 
  // to make sure the photo stays updated!
  useEffect(() => {
    if (teacher?.email) {
      const saved = localStorage.getItem(`profile_v1_${teacher.email}`);
      if (saved) {
        setUserData(JSON.parse(saved));
      } else {
        setUserData({ name: teacher.name, avatar: null });
      }
    }
  }, [teacher, location.pathname]); // location.pathname ensures it updates when you navigate

  return (
    <header className="h-20 bg-[#0b0f1a]/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 px-8 flex items-center justify-between">
      <div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
          Faculty Management
        </h2>
      </div>
      
      <Link to="/profile" className="flex items-center gap-6 group cursor-pointer">
        <div className="text-right hidden md:block">
          <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">
            {userData.name}
          </p>
          <p className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-widest">
            {teacher?.email}
          </p>
        </div>
        
        {/* Profile Avatar Logic */}
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white border border-white/10 shadow-lg shadow-indigo-500/10 overflow-hidden transition-all group-hover:scale-105">
          {/* IF IMAGE EXISTS, SHOW IMAGE. ELSE SHOW LETTER */}
          {userData.avatar ? (
            <img 
              src={userData.avatar} 
              className="w-full h-full object-cover" 
              alt="Profile" 
            />
          ) : (
            <span>{userData.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>
      </Link>
    </header>
  );
}