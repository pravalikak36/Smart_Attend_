import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ onLogout }) {
  const location = useLocation();
  
  const menuItems = [
  { 
    name: 'Dashboard', 
    path: '/dashboard', 
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' 
  },
  { 
    name: 'Attendance', 
    path: '/attendance-hub', // CHANGED THIS
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' 
  },
  { 
    name: 'Assignments', 
    path: '/assignments', 
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' 
  },
];

  return (
    // Sidebar.jsx snippet
    <aside className="fixed left-0 top-0 h-screen w-20 hover:w-64 bg-[#111622] border-r border-white/5 transition-all duration-300 z-50 group flex flex-col overflow-hidden">
      <div className="p-6 mb-10">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex-shrink-0 flex items-center justify-center font-black text-white">S</div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 space-y-4">
        {menuItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path}
            className={`flex items-center p-4 rounded-2xl transition-all ${
              location.pathname === item.path 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
              : 'text-slate-500 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
            </svg>
            <span className="ml-4 font-black uppercase tracking-widest text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {item.name}
            </span>
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={onLogout}
          className="w-full flex items-center p-4 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
        >
          <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="ml-4 font-black uppercase tracking-widest text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Secure Logout
          </span>
        </button>
      </div>
    </aside>
  );
}