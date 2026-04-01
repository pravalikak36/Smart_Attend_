import React, { useState } from 'react';

export default function Dashboard({ teacher, classes, addClass, setClasses, handleLogout }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassInput, setNewClassInput] = useState({ name: '', sub: '' });
  const [editingClass, setEditingClass] = useState(null);
  const [studentList, setStudentList] = useState("");

  React.useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('autoCreate') === 'true') {
      // 1. Open the modal
      setIsModalOpen(true);
      
      // 2. Pre-fill the inputs with the missing class details from the URL
      setNewClassInput({
        name: query.get('name') || '',
        sub: query.get('sub') || ''
      });

      // 3. Clean the URL so it doesn't pop up again if the user refreshes
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newClassInput.name) return;
    addClass({
      name: newClassInput.name,
      sub: newClassInput.sub,
      students: "", 
      studentCount: 0
    });
    setIsModalOpen(false);
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
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row justify-between items-end mb-12 pb-8 border-b border-white/5 gap-8">
          <div className="flex flex-col items-start">
            <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.4em] mb-3">Teacher Hub</p>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-6">
              Welcome, {teacher?.name || 'Teacher'}
            </h1>
            
            {/* LOGOUT BUTTON - POSITIONED IN THE SAME PLACE */}
            <button 
              onClick={handleLogout} 
              className="bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-rose-600/20 shadow-lg shadow-rose-900/10 active:scale-95"
            >
              Log Out
            </button>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-indigo-600/20 active:scale-95"
          >
            + Add a Class
          </button>
        </header>

        {/* CLASS CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.length === 0 ? (
            <div className="col-span-full py-28 text-center border-2 border-dashed border-white/5 rounded-[45px] text-slate-700 font-black uppercase tracking-[0.3em]">
              No classes created yet
            </div>
          ) : (
            classes.map((c) => (
              <div 
                key={c.id} 
                className="group bg-[#111622] p-8 rounded-[40px] border border-white/5 relative overflow-hidden transition-all hover:border-indigo-500/30"
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-black tracking-tighter uppercase text-white leading-tight truncate pr-4">
                      {c.name}
                    </h2>
                    <button 
                      onClick={() => {
                        setEditingClass(c);
                        setStudentList(c.students ? c.students.split(', ').join('\n') : "");
                      }}
                      className="shrink-0 bg-white/5 hover:bg-white/10 text-indigo-400 text-[9px] font-black px-4 py-2 rounded-xl transition-all border border-indigo-500/20 uppercase tracking-widest"
                    >
                      Edit List
                    </button>
                  </div>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-10">
                    {c.sub || "General Subject"}
                  </p>
                  
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

      {/* POPUP: SET UP CLASS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <form 
            onSubmit={handleCreate} 
            className="bg-[#111622] p-10 rounded-[45px] border border-white/10 w-full max-w-md shadow-3xl"
          >
            <h3 className="text-2xl font-black text-white uppercase mb-8 tracking-tighter">Set Up Class</h3>
            <div className="space-y-4 mb-10">
              <input 
                className="w-full bg-[#06080f] border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-indigo-500 transition-all font-bold placeholder:text-slate-700"
                placeholder="Class Name (e.g. 10th Grade)"
                value={newClassInput.name}
                onChange={e => setNewClassInput({...newClassInput, name: e.target.value})}
              />
              <input 
                className="w-full bg-[#06080f] border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-indigo-500 transition-all font-bold placeholder:text-slate-700"
                placeholder="Subject (e.g. Physics)"
                value={newClassInput.sub}
                onChange={e => setNewClassInput({...newClassInput, sub: e.target.value})}
              />
            </div>
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors"
              >
                Go Back
              </button>
              <button 
                type="submit" 
                className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
              >
                Create Now
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
              Edit Student List: {editingClass.name}
            </h3>
            <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-8">
              Type one name per line
            </p>
            
            <textarea 
              className="w-full bg-[#06080f] border border-white/10 rounded-3xl p-7 text-white mb-8 h-72 outline-none focus:border-indigo-500 transition-all resize-none font-bold custom-scrollbar placeholder:text-slate-800"
              value={studentList}
              onChange={e => setStudentList(e.target.value)}
              placeholder="Full Name 1&#10;Full Name 2&#10;Full Name 3..."
            />
            
            <div className="flex gap-4">
              <button 
                onClick={() => setEditingClass(null)} 
                className="flex-1 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors"
              >
                Discard
              </button>
              <button 
                onClick={handleSaveStudents} 
                className="flex-1 bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
              >
                Save List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}