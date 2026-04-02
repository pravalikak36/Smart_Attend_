import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Added for smart redirect

export default function Dashboard({ teacher, classes, addClass, setClasses, handleLogout }) {
  const location = useLocation(); // Initialize location listener
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassInput, setNewClassInput] = useState({ name: '', sub: '' });
  const [editingClass, setEditingClass] = useState(null); 
  const [editingClassDetails, setEditingClassDetails] = useState(null); 
  const [studentList, setStudentList] = useState("");
  const [displayName, setDisplayName] = useState(teacher?.name || 'Teacher');

  // --- NEW: SMART REDIRECT LISTENER ---
  // This checks if we arrived here from the Timetable with an "Add Class" instruction
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpen = params.get('openAddModal') === 'true';
    const autoName = params.get('name');
    const autoSub = params.get('sub');

    if (shouldOpen) {
      setNewClassInput({ 
        name: autoName ? decodeURIComponent(autoName) : '', 
        sub: autoSub ? decodeURIComponent(autoSub) : '' 
      });
      setEditingClassDetails(null); // Ensure we are adding a new class, not editing
      setIsModalOpen(true);
    }
  }, [location]);

  useEffect(() => {
    const savedProfile = localStorage.getItem(`profile_v1_${teacher?.email}`);
    if (savedProfile) {
      const data = JSON.parse(savedProfile);
      if (data.name) setDisplayName(data.name);
    } else {
      setDisplayName(teacher?.name || 'Teacher');
    }
  }, [teacher?.email, teacher?.name]);

  const deleteClass = (id) => {
    if (window.confirm("Are you sure you want to delete this class? All attendance data will be lost.")) {
      const updatedClasses = classes.filter(c => c.id !== id);
      setClasses(updatedClasses);
      localStorage.setItem(`classes_${teacher.email}`, JSON.stringify(updatedClasses));
    }
  };

  const handleSaveClassDetails = (e) => {
    e.preventDefault();
    if (!newClassInput.name) return;

    if (editingClassDetails) {
      const updatedClasses = classes.map(c => 
        c.id === editingClassDetails.id 
          ? { ...c, name: newClassInput.name, sub: newClassInput.sub } 
          : c
      );
      setClasses(updatedClasses);
      localStorage.setItem(`classes_${teacher.email}`, JSON.stringify(updatedClasses));
    } else {
      addClass({
        name: newClassInput.name,
        sub: newClassInput.sub,
        students: "", 
        studentCount: 0
      });
    }
    
    setIsModalOpen(false);
    setEditingClassDetails(null);
    setNewClassInput({ name: '', sub: '' });
  };

  const handleSaveStudents = () => {
    const cleanedNames = studentList.split('\n')
      .map(name => name.trim())
      .filter(name => name !== "")
      .join(', ');

    const updatedClasses = classes.map(c => 
      c.id === editingClass.id ? { 
        ...c, 
        students: cleanedNames, 
        studentCount: cleanedNames.split(', ').filter(n => n !== "").length 
      } : c
    );
    
    setClasses(updatedClasses); 
    localStorage.setItem(`classes_${teacher.email}`, JSON.stringify(updatedClasses));
    setEditingClass(null);
    setStudentList("");
  };

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-200 p-6 md:p-10 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto px-6">
        
        <header className="flex flex-col md:flex-row justify-between items-end mb-12 pb-8 border-b border-white/5 gap-8">
          <div className="flex flex-col items-start">
            <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.4em] mb-3">Teacher Hub</p>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-6">
              Welcome, {displayName}
            </h1>
            <button onClick={handleLogout} className="bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-rose-600/20 shadow-lg shadow-rose-900/10 active:scale-95">
              Log Out
            </button>
          </div>
          
          <button onClick={() => { setEditingClassDetails(null); setNewClassInput({name:'', sub:''}); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-indigo-600/20 active:scale-95">
            + Add a Class
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.length === 0 ? (
            <div className="col-span-full py-28 text-center border-2 border-dashed border-white/5 rounded-[45px] text-slate-700 font-black uppercase tracking-[0.3em]">
              No classes created yet
            </div>
          ) : (
            classes.map((c) => (
              <div key={c.id} className="group bg-[#111622] p-8 rounded-[40px] border border-white/5 relative overflow-hidden transition-all hover:border-indigo-500/30">
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-black tracking-tighter uppercase text-white leading-tight truncate pr-4">
                      {c.name}
                    </h2>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => {
                          setEditingClassDetails(c);
                          setNewClassInput({ name: c.name, sub: c.sub });
                          setIsModalOpen(true);
                        }}
                        className="bg-white/5 hover:bg-white/10 text-slate-400 p-2 rounded-lg border border-white/5 transition-all"
                        title="Edit Class Name"
                      >
                        ✎
                      </button>
                      <button 
                        onClick={() => deleteClass(c.id)}
                        className="bg-rose-500/5 hover:bg-rose-500/20 text-rose-500 p-2 rounded-lg border border-rose-500/10 transition-all"
                        title="Delete Class"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-6">
                    {c.sub || "General Subject"}
                  </p>

                  <button 
                    onClick={() => {
                      setEditingClass(c);
                      setStudentList(c.students ? c.students.split(', ').join('\n') : "");
                    }}
                    className="w-full bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white text-[9px] font-black py-4 rounded-2xl transition-all border border-indigo-500/20 uppercase tracking-[0.2em] mb-6"
                  >
                    Manage List
                  </button>
                  
                  <div className="mt-auto pt-5 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      {c.studentCount || 0} Students
                    </span>
                    <div className="w-2 h-2 rounded-full bg-indigo-500/40 animate-pulse" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* POPUP: SET UP / EDIT CLASS DETAILS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <form onSubmit={handleSaveClassDetails} className="bg-[#111622] p-10 rounded-[45px] border border-white/10 w-full max-w-md shadow-3xl">
            <h3 className="text-2xl font-black text-white uppercase mb-8 tracking-tighter">
              {editingClassDetails ? "Update Class" : "Set Up Class"}
            </h3>
            <div className="space-y-4 mb-10">
              <input 
                className="w-full bg-[#06080f] border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-indigo-500 transition-all font-bold placeholder:text-slate-700"
                placeholder="Class Name (e.g. 10th Grade)"
                value={newClassInput.name}
                onChange={e => setNewClassInput({...newClassInput, name: e.target.value})}
                required
              />
              <input 
                className="w-full bg-[#06080f] border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-indigo-500 transition-all font-bold placeholder:text-slate-700"
                placeholder="Subject (e.g. Physics)"
                value={newClassInput.sub}
                onChange={e => setNewClassInput({...newClassInput, sub: e.target.value})}
                required
              />
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => { setIsModalOpen(false); setEditingClassDetails(null); }} className="flex-1 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">
                Cancel
              </button>
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">
                {editingClassDetails ? "Save Changes" : "Create Now"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP: EDIT STUDENT LIST */}
      {editingClass && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111622] p-10 rounded-[45px] border border-white/10 w-full max-w-lg shadow-3xl">
            <h3 className="text-2xl font-black text-white uppercase mb-2 tracking-tighter">
              Roster: {editingClass.name}
            </h3>
            <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-8">Type one name per line</p>
            <textarea 
              className="w-full bg-[#06080f] border border-white/10 rounded-3xl p-7 text-white mb-8 h-72 outline-none focus:border-indigo-500 transition-all resize-none font-bold custom-scrollbar placeholder:text-slate-800" 
              value={studentList} 
              onChange={e => setStudentList(e.target.value)} 
              placeholder="Full Name 1&#10;Full Name 2..." 
            />
            <div className="flex gap-4">
              <button onClick={() => setEditingClass(null)} className="flex-1 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Discard</button>
              <button onClick={handleSaveStudents} className="flex-1 bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">Save List</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}