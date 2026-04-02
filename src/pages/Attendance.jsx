import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Attendance() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [currentClassName, setCurrentClassName] = useState("");
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- NEW: LOCK STATE ---
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('classes_'));
    let foundClass = null;

    allKeys.forEach(key => {
      const classes = JSON.parse(localStorage.getItem(key));
      if (classes) {
        const match = classes.find(c => c.id.toString() === classId);
        if (match) foundClass = match;
      }
    });

    if (foundClass) {
      setCurrentClassName(foundClass.name);
      setSubject(foundClass.sub || "");
      
      const storageKey = `attendance_${classId}_${date}`;
      const lockKey = `lock_${classId}_${date}`; // Store lock status
      
      const savedAttendance = localStorage.getItem(storageKey);
      const savedLockStatus = localStorage.getItem(lockKey);

      // Set lock status from storage
      setIsLocked(savedLockStatus === 'true');

      if (savedAttendance) {
        setStudents(JSON.parse(savedAttendance));
      } else if (foundClass.students) {
        const rawList = Array.isArray(foundClass.students) 
          ? foundClass.students 
          : foundClass.students.split(',').map(s => s.trim()).filter(s => s !== "");

        const studentObjects = rawList.map((name, index) => ({
          id: `stu-${index}-${Date.now()}`, 
          name: name,
          enrollment: `STU-${index + 101}`,
          status: 'Present' 
        }));
        setStudents(studentObjects);
      }
    } else {
      navigate('/attendance-hub');
    }
  }, [classId, date, navigate]);

  // --- NEW: HANDLE LOCK/UNLOCK ---
  const handleSaveAndLock = () => {
    setIsLocked(true);
    localStorage.setItem(`lock_${classId}_${date}`, 'true');
    // Final save of data
    localStorage.setItem(`attendance_${classId}_${date}`, JSON.stringify(students));
  };

  const handleEnableEdit = () => {
    setIsLocked(false);
    localStorage.setItem(`lock_${classId}_${date}`, 'false');
  };
    
  const toggleStatus = (id, newStatus) => {
    if (isLocked) return; // Prevent change if locked
    const updatedStudents = students.map(s => 
      s.id === id ? { ...s, status: newStatus } : s
    );
    setStudents(updatedStudents);
    localStorage.setItem(`attendance_${classId}_${date}`, JSON.stringify(updatedStudents));
  };
    
  const markAllPresent = () => {
    if (isLocked) return;
    const updatedStudents = students.map(s => ({...s, status: 'Present'}));
    setStudents(updatedStudents);
    localStorage.setItem(`attendance_${classId}_${date}`, JSON.stringify(updatedStudents));
  };

  // Export functions (unchanged)
  const exportToExcel = () => {
    if (students.length === 0) return alert("No student data to export.");
    const excelData = students.map((s, i) => ({ "Sr No.": i + 1, "Student Name": s.name, "Enrollment ID": s.enrollment, "Attendance Status": s.status, "Date": date }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance_Report");
    XLSX.writeFile(wb, `${currentClassName}_${date}.xlsx`);
  };

  const exportToPDF = () => {
    if (students.length === 0) return alert("No student data to export.");
    const doc = new jsPDF();
    doc.setFillColor(6, 8, 15); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); 
    doc.text(`ATTENDANCE: ${currentClassName}`, 14, 22);
    doc.setFontSize(9); 
    doc.text(`Subject: ${subject} | Date: ${date}`, 14, 32);
    autoTable(doc, { startY: 45, head: [['#', 'STUDENT NAME', 'ENROLLMENT', 'STATUS']], body: students.map((s, i) => [i + 1, s.name, s.enrollment, s.status]), theme: 'striped', headStyles: { fillColor: [6, 8, 15], textColor: [255, 255, 255], fontStyle: 'bold' } });
    doc.save(`${currentClassName}_Report_${date}.pdf`);
  };

  const sendWhatsApp = () => {
    const absent = students.filter(s => s.status === 'Absent');
    let rawMsg = `*Attendance Report: ${currentClassName || "ISE"}*\n*Subject:* ${subject || "N/A"}\n*Date:* ${date}\n\n*Total Absent (${absent.length}):*\n`;
    if (absent.length === 0) rawMsg += `All students are present!`;
    else absent.forEach((s, i) => rawMsg += `${i + 1}. ${s.name}\n`);
    window.open(`https://wa.me/?text=${encodeURIComponent(rawMsg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-200 p-6 md:p-10 font-sans antialiased">
      <div className="max-w-4xl mx-auto mt-10">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 pb-8 border-b border-white/5 gap-6">
          <div className="relative">
            <button onClick={() => navigate('/attendance-hub')} className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 mb-6 flex items-center gap-2">← All Classes</button>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none italic">{currentClassName || "Session"}</h1>
            <p className="text-indigo-500 text-[11px] font-black uppercase tracking-[0.4em] mt-3">{subject || "General Study"}</p>
          </div>
          
          <div className="bg-indigo-600 px-10 py-5 rounded-[24px] shadow-2xl shadow-indigo-600/20 text-center min-w-[200px]">
            <p className="text-indigo-100 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Students Present</p>
            <h2 className="text-4xl font-black text-white tracking-tighter">
              {students.filter(s => s.status === 'Present').length}
              <span className="text-lg text-indigo-200/60 font-medium ml-2">/ {students.length}</span>
            </h2>
          </div>
        </header>

        {/* --- CONTROL BAR --- */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 bg-[#111622] p-6 rounded-[30px] border border-white/5">
          <div className="flex items-center gap-3">
             <div className={`w-3 h-3 rounded-full ${isLocked ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
               Status: {isLocked ? 'Locked (Final)' : 'Editing Mode'}
             </span>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            {isLocked ? (
              <button 
                onClick={handleEnableEdit}
                className="flex-1 sm:flex-none px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all"
              >
                🔓 Unlock / Edit
              </button>
            ) : (
              <button 
                onClick={handleSaveAndLock}
                className="flex-1 sm:flex-none px-8 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
              >
                🔒 Save Changes
              </button>
            )}
          </div>
        </div>

        {/* --- FILTERS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">Search Students</label>
            <input type="text" placeholder="Filter students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#111622] border border-white/5 rounded-2xl p-4 text-white outline-none font-bold focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">Session Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#111622] border border-white/5 rounded-2xl p-4 text-white font-bold outline-none cursor-pointer" />
          </div>
        </div>

        {/* --- ROSTER TABLE --- */}
        <div className={`bg-[#111622]/50 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl backdrop-blur-xl ${isLocked ? 'opacity-80' : ''}`}>
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h3 className="font-black text-white uppercase tracking-widest text-[11px]">Attendance Roster</h3>
            {!isLocked && (
              <button onClick={markAllPresent} className="text-[9px] font-black uppercase px-6 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-400/20 rounded-xl hover:bg-emerald-500 hover:text-white transition-all">Mark All Present</button>
            )}
          </div>

          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
            {students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((student) => (
              <div key={student.id} className="flex flex-col sm:flex-row items-center justify-between p-8 hover:bg-white/[0.02] transition-colors gap-8">
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-black text-white text-2xl tracking-tighter uppercase italic">{student.name}</h4>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{student.enrollment}</p>
                </div>
                
                <div className={`flex bg-[#06080f] p-1.5 rounded-2xl border border-white/5 w-full sm:w-auto ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}>
                  <button 
                    disabled={isLocked}
                    onClick={() => toggleStatus(student.id, 'Present')} 
                    className={`flex-1 sm:px-12 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${student.status === 'Present' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-600 hover:text-slate-400"}`}
                  >Present</button>
                  <button 
                    disabled={isLocked}
                    onClick={() => toggleStatus(student.id, 'Absent')} 
                    className={`flex-1 sm:px-12 py-3.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${student.status === 'Absent' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-slate-600 hover:text-slate-400"}`}
                  >Absent</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- EXPORTS --- */}
        <footer className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 mb-10">
          <button onClick={sendWhatsApp} className="bg-[#111622] border border-emerald-500/10 text-emerald-400/70 hover:bg-emerald-500 hover:text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">WhatsApp Alert</button>
          <button onClick={exportToPDF} className="bg-[#111622] border border-rose-500/10 text-rose-400/70 hover:bg-rose-500 hover:text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">PDF Report</button>
          <button onClick={exportToExcel} className="bg-[#111622] border border-indigo-500/10 text-indigo-400/70 hover:bg-indigo-500 hover:text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Excel Export</button>
          <button onClick={() => window.print()} className="bg-[#111622] border border-white/10 text-slate-500 hover:bg-white/10 hover:text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Print</button>
        </footer>
      </div>
    </div>
  );
}