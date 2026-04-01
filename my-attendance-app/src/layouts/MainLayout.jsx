import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

/**
 * MainLayout Component
 * This is the parent wrapper for all private routes.
 * It ensures the Sidebar is always visible while the 
 * {Outlet} renders the specific page (Dashboard, Attendance, etc.)
 */
export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-[#0b0f1a] text-white font-sans selection:bg-indigo-500/30">
      
      {/* FIXED SIDEBAR: Stays on the left at all times */}
      <Sidebar />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* ml-72 matches the width of the sidebar (w-72). 
            This prevents the content from being hidden behind the sidebar.
        */}
        <main className="flex-1 ml-72 p-6 md:p-12 lg:p-16">
          
          {/* THE OUTLET: This is where React Router injects your pages */}
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>

        </main>

        {/* Optional: Global Footer inside the content area */}
        <footer className="ml-72 p-6 border-t border-white/5 text-center">
          <p className="text-[10px] font-mono text-slate-700 uppercase tracking-[0.5em]">
            EduFlow Pro System v1.0
          </p>
        </footer>
      </div>
    </div>
  );
}