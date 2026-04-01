import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Assignments({ teacher }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const hasRedirected = useRef(false); // Ref to prevent re-triggering logic

  // --- STATES ---
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [view, setView] = useState('classes'); 
  const [assignments, setAssignments] = useState([]);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [grades, setGrades] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newTitle, setNewTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    if (teacher?.email) {
      const saved = localStorage.getItem(`classes_${teacher.email}`);
      if (saved) {
        const parsedClasses = JSON.parse(saved);
        setClasses(parsedClasses);
      }
    }
  }, [teacher, view]);

  // --- SMART REDIRECT & AUTO-CREATE LOGIC ---
  useEffect(() => {
    // We wait for classes to load from localStorage before checking
    if (classes.length > 0 && !hasRedirected.current) {
      const query = new URLSearchParams(window.location.search);
      const targetSubject = query.get('subject');
      const targetSection = query.get('section');

      if (targetSubject || targetSection) {
        // 1. Attempt to find the class
        const matchedClass = classes.find(c => 
          (targetSubject && c.sub?.toLowerCase() === targetSubject.toLowerCase()) || 
          (targetSection && c.name?.toLowerCase() === targetSection.toLowerCase())
        );

        if (matchedClass) {
          // SUCCESS: Go to the assignment list
          hasRedirected.current = true;
          setSelectedClass(matchedClass);
          setView('list');
          
          // Clear URL params for a clean UI
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          // FAILURE: Redirect to Dashboard to create the missing class
          hasRedirected.current = true;
          navigate(`/dashboard?autoCreate=true&sub=${targetSubject || ''}&name=${targetSection || ''}`, { replace: true });
        }
      }
    } else if (classes.length === 0 && !hasRedirected.current) {
        // Handle case where teacher has NO classes created yet but tries to launch
        const query = new URLSearchParams(window.location.search);
        if (query.get('subject')) {
             hasRedirected.current = true;
             navigate(`/dashboard?autoCreate=true&sub=${query.get('subject')}&name=${query.get('section') || ''}`, { replace: true });
        }
    }
  }, [classes, navigate]);

  useEffect(() => {
    if (selectedClass) {
      const saved = localStorage.getItem(`assignments_${selectedClass.id}`);
      setAssignments(saved ? JSON.parse(saved) : []);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (activeAssignment) {
      const saved = localStorage.getItem(`grades_${activeAssignment.id}`);
      setGrades(saved ? JSON.parse(saved) : {});
    }
  }, [activeAssignment]);

  // --- HANDLERS ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large for local sync (Max 2MB).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile({
        name: file.name,
        type: file.type,
        data: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCreateAssignment = () => {
    if (!newTitle || !dueDate) return;
    const newTask = { 
      id: Date.now(), 
      title: newTitle, 
      dueDate: dueDate, 
      dateCreated: new Date().toLocaleDateString(),
      attachment: selectedFile 
    };
    const updated = [...assignments, newTask];
    setAssignments(updated);
    localStorage.setItem(`assignments_${selectedClass.id}`, JSON.stringify(updated));
    
    setShowAddModal(false);
    setNewTitle(""); setDueDate(""); setSelectedFile(null);
  };

  const downloadFile = (fileObj) => {
    const link = document.createElement('a');
    link.href = fileObj.data;
    link.download = fileObj.name;
    link.click();
  };

  const sendWhatsApp = (student) => {
    const score = grades[student] || 0;
    const status = grades[`${student}_done`] ? "SUBMITTED" : "PENDING";
    const msg = `*ACADEMIC RECORD*%0AClass: ${selectedClass?.name}%0AAssignment: ${activeAssignment?.title}%0AStudent: ${student}%0AStatus: ${status}%0AScore: ${score}/100`;
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(6, 8, 15); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.text("ASSIGNMENT PERFORMANCE DATA", 14, 22);
    doc.setFontSize(9); doc.text(`${selectedClass?.name} | ${activeAssignment?.title}`, 14, 32);

    const rawStudents = selectedClass?.students || "";
    const list = Array.isArray(rawStudents) ? rawStudents : rawStudents.split(',').map(s => s.trim()).filter(s => s !== "");
    const tableRows = list.map((s, i) => [i + 1, s, grades[`${s}_done`] ? "Completed" : "Pending", `${grades[s] || 0}/100`]);

    autoTable(doc, {
      startY: 45,
      head: [['REF', 'STUDENT NAME', 'SUBMISSION', 'SCORE']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [6, 8, 15], textColor: [255, 255, 255], fontStyle: 'bold' }
    });
    doc.save(`${activeAssignment?.title}_Report.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-300 font-sans p-4 md:p-8 antialiased selection:bg-indigo-500/30">
      
      {/* 1. TOP NAV */}
      <nav className="w-full flex justify-between items-center bg-[#111622] border border-white/5 p-5 rounded-2xl mb-8 shadow-2xl">
        <div className="flex gap-4">
          <button 
            onClick={() => view === 'gradebook' ? setView('list') : setView('classes')}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'classes' ? 'opacity-20 pointer-events-none' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
          >
            ← Back
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Dashboard
          </button>
        </div>

        <div className="hidden md:block">
           <span className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500">Assignment Core</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Sync Active</span>
        </div>
      </nav>

      {/* 2. HEADER */}
      <header className="w-full text-center py-10 mb-10 border-b border-white/5">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase mb-4">
          {view === 'classes' ? 'Classroom' : view === 'list' ? 'Assignment   Tracker' : 'Gradebook'}
        </h1>
        {selectedClass && (
          <div className="flex justify-center items-center gap-4">
            <span className="bg-indigo-600/20 text-indigo-400 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">{selectedClass.name}</span>
            <span className="text-slate-600 font-black uppercase tracking-widest text-[10px]">{selectedClass.sub}</span>
          </div>
        )}
      </header>

      {/* 3. MAIN CONTENT GRID */}
      <main className="w-full max-w-[1500px] mx-auto">
        
        {/* VIEW: CLASSES */}
        {view === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {classes.map(c => (
              <div key={c.id} onClick={() => { setSelectedClass(c); setView('list'); }}
                className="bg-[#111622] p-10 rounded-[32px] border border-white/5 hover:border-indigo-500/50 hover:bg-[#161b2a] cursor-pointer transition-all flex flex-col justify-between min-h-[220px] group shadow-xl">
                <p className="text-slate-600 font-black text-[9px] uppercase tracking-widest">{c.sub}</p>
                <h3 className="text-3xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase">{c.name}</h3>
                <div className="text-[9px] font-black uppercase text-indigo-500/40 mt-4 tracking-widest">Select Class →</div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW: LIST */}
        {view === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div onClick={() => setShowAddModal(true)} 
              className="bg-transparent border-2 border-dashed border-white/10 p-10 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-white/5 transition-all min-h-[220px] group">
              <div className="w-10 h-10 bg-indigo-600/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-all">
                <span className="text-xl text-indigo-500 group-hover:text-white">+</span>
              </div>
              <span className="font-black text-[10px] uppercase tracking-widest text-slate-500 group-hover:text-white">Add New</span>
            </div>
            
            {assignments.map(a => (
              <div key={a.id} className="bg-[#111622] p-10 rounded-[32px] border border-white/5 hover:bg-[#161b2a] transition-all flex flex-col justify-between min-h-[220px] group border-l-4 border-l-indigo-600">
                <div className="cursor-pointer" onClick={() => { setActiveAssignment(a); setView('gradebook'); }}>
                  <p className="text-rose-500 font-black text-[9px] uppercase tracking-widest mb-1">Due: {a.dueDate}</p>
                  <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase leading-tight">{a.title}</h3>
                </div>
                
                <div className="flex justify-between items-center mt-6">
                  <span onClick={() => { setActiveAssignment(a); setView('gradebook'); }} className="text-[9px] font-black text-slate-600 uppercase tracking-widest cursor-pointer hover:text-white">View Grades</span>
                  {a.attachment && (
                    <button onClick={() => downloadFile(a.attachment)} className="bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase hover:bg-indigo-500 hover:text-white transition-all">
                      📎 Material
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW: GRADEBOOK */}
        {view === 'gradebook' && (
          <div className="w-full bg-[#111622] rounded-[40px] border border-white/5 shadow-3xl overflow-hidden">
            <div className="p-8 flex flex-col md:flex-row justify-between items-center border-b border-white/5 bg-white/[0.01] gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">{activeAssignment?.title}</h2>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Class Data Management</p>
                </div>
                <button onClick={exportPDF} className="bg-white text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-lg">Generate Report</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0b0f1a] text-[10px] font-black uppercase tracking-widest text-slate-600">
                  <tr>
                    <th className="p-8 border-b border-white/5">Candidate</th>
                    <th className="p-8 text-center border-b border-white/5">Status</th>
                    <th className="p-8 text-center border-b border-white/5">Score</th>
                    <th className="p-8 text-center border-b border-white/5">Push</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(() => {
                    const rawStudents = selectedClass?.students || "";
                    const list = Array.isArray(rawStudents) ? rawStudents : rawStudents.split(',').map(s => s.trim()).filter(s => s !== "");
                    return list.map((student, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="p-8 font-black text-lg text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{student}</td>
                        <td className="p-8">
                          <div className="flex items-center justify-center gap-3">
                            <input type="checkbox" checked={!!grades[`${student}_done`]} 
                              onChange={(e) => setGrades({...grades, [`${student}_done`]: e.target.checked})} 
                              className="w-5 h-5 rounded bg-slate-900 border-white/10 accent-indigo-600 cursor-pointer" />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${grades[`${student}_done`] ? 'text-emerald-500' : 'text-slate-700'}`}>
                              {grades[`${student}_done`] ? 'Done' : 'Pending'}
                            </span>
                          </div>
                        </td>
                        <td className="p-8 text-center">
                          <input type="number" placeholder="--" value={grades[student] || ""} 
                            onChange={(e) => setGrades({...grades, [student]: e.target.value})} 
                            className="bg-[#06080f] border border-white/10 rounded-xl p-3 w-20 text-center font-black text-white text-lg outline-none focus:border-indigo-600" />
                        </td>
                        <td className="p-8 text-center">
                          <button onClick={() => sendWhatsApp(student)} 
                            className="bg-emerald-500/10 text-emerald-500 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">
                            WhatsApp
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <div className="p-10 flex justify-center bg-[#0b0f1a] border-t border-white/5">
              <button onClick={() => { localStorage.setItem(`grades_${activeAssignment.id}`, JSON.stringify(grades)); alert("Database Synchronized."); }} 
                className="bg-indigo-600 text-white px-16 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-500 transition-all">
                Save All Changes
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: NEW ASSIGNMENT */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#06080f]/98 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-[#111622] w-full max-w-lg p-10 rounded-[40px] border border-white/10 shadow-3xl">
            <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter text-white border-b border-white/5 pb-6">New Assignment</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest ml-1">Task Title</label>
                <input placeholder="Ex: Unit Assessment 1" className="w-full bg-[#06080f] border border-white/10 rounded-2xl p-5 font-black text-lg outline-none text-white focus:border-indigo-600 transition-all" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest ml-1">Deadline</label>
                <input type="date" className="w-full bg-[#06080f] border border-white/10 rounded-2xl p-5 font-black text-white outline-none focus:border-indigo-600" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest ml-1">Attachment</label>
                <div onClick={() => fileInputRef.current.click()} className={`w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${selectedFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5 bg-[#06080f] hover:border-indigo-500/50'}`}>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  {selectedFile ? (
                    <span className="text-[10px] font-black text-emerald-400 uppercase">{selectedFile.name} ✓</span>
                  ) : (
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Click to Upload File</span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-10">
              <button onClick={() => { setShowAddModal(false); setSelectedFile(null); }} className="py-4 font-black text-slate-600 uppercase tracking-widest text-[9px] hover:text-white">Cancel</button>
              <button onClick={handleCreateAssignment} className="bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-indigo-600 hover:text-white transition-all">Create Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}