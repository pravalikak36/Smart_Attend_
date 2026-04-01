import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Timetable({ teacher }) {
  const navigate = useNavigate();
  
  // 1. STATE
  const [timetableData, setTimetableData] = useState([]);
  const [holidayList, setHolidayList] = useState([]); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [mappingName, setMappingName] = useState(""); 
  const [isUploading, setIsUploading] = useState(false);
  const [showDotsMenu, setShowDotsMenu] = useState(false);
  const [activeLaunchMenu, setActiveLaunchMenu] = useState(null); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [successMsg, setSuccessMsg] = useState("");
  
  // This state pulls directly from the same key your Dashboard uses
  const [dashboardClasses, setDashboardClasses] = useState([]);

  // 2. PERSISTENCE & CLOCK
  useEffect(() => {
    if (teacher?.email) {
      const savedTimetable = localStorage.getItem(`timetable_${teacher.email}`);
      const savedMapping = localStorage.getItem(`mapping_name_${teacher.email}`);
      const savedHolidays = localStorage.getItem(`holidays_${teacher.email}`);
      const savedDashboard = localStorage.getItem(`classes_${teacher.email}`);
      
      if (savedTimetable) setTimetableData(JSON.parse(savedTimetable));
      if (savedMapping) setMappingName(savedMapping);
      if (savedHolidays) setHolidayList(JSON.parse(savedHolidays));
      if (savedDashboard) setDashboardClasses(JSON.parse(savedDashboard));
    }
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [teacher?.email]);

  // 3. UTILITIES
  const triggerSuccess = (text) => {
    setSuccessMsg(text);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    try {
      const cleanTime = timeStr.trim().toUpperCase();
      const isPM = cleanTime.includes('PM');
      const isAM = cleanTime.includes('AM');
      let [time] = cleanTime.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
      return (hours * 60) + (minutes || 0);
    } catch (e) { return 0; }
  };

  const generatePDF = () => {
    if (myClasses.length === 0) return alert("No classes to export");
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${mappingName} - ${currentDayName} Schedule`, 14, 20);
    autoTable(doc, {
      head: [["Time", "Subject", "Section", "Room"]],
      body: myClasses.map(i => [i.time, i.subject, i.section, i.room]),
      startY: 30,
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save(`${mappingName}_Schedule.pdf`);
  };

  // 4. SMART REDIRECT LOGIC
  const handleSmartRedirect = (subject, section, targetPath) => {
    // 1. Check if the class exists in your Dashboard storage
    const classExists = dashboardClasses.some(
      c => c.name?.trim().toLowerCase() === section?.trim().toLowerCase() && 
           c.sub?.trim().toLowerCase() === subject?.trim().toLowerCase()
    );

    if (classExists) {
      // 2. EXIST: Open the specific tool (Attendance/Marks/etc)
      navigate(`${targetPath}?subject=${encodeURIComponent(subject)}&section=${encodeURIComponent(section)}`);
    } else {
      // 3. NOT EXIST: Open Dashboard AND trigger the "Add Class" flow
      // The 'openAddModal=true' flag tells the Dashboard to show the popup immediately
      navigate(`/dashboard?name=${encodeURIComponent(section)}&sub=${encodeURIComponent(subject)}&openAddModal=true`);
    }
    setActiveLaunchMenu(null);
  };

  // 5. FILTERING & TICKER
  const currentDayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date(selectedDate));
  const currentHoliday = holidayList.find(h => h.date === selectedDate);
  
  const myClasses = useMemo(() => {
    if (!mappingName) return [];
    return timetableData.filter(item => 
      item.instructor?.toLowerCase().includes(mappingName.toLowerCase()) && 
      item.day?.toLowerCase() === currentDayName.toLowerCase()
    );
  }, [timetableData, mappingName, currentDayName]);

  const sessionStatus = useMemo(() => {
    if (myClasses.length === 0 || currentHoliday) return null;
    const now = new Date();
    const nowTotal = (now.getHours() * 60) + now.getMinutes();
    const isToday = selectedDate === now.toISOString().split('T')[0];

    const schedule = myClasses.map(c => {
      const parts = c.time.split('-');
      return {
        ...c,
        start: parseTimeToMinutes(parts[0]),
        end: parts[1] ? parseTimeToMinutes(parts[1]) : parseTimeToMinutes(parts[0]) + 50
      };
    }).sort((a, b) => a.start - b.start);

    if (isToday) {
      const current = schedule.find(c => nowTotal >= c.start && nowTotal < c.end);
      if (current) return { type: 'LIVE', ...current };
      const next = schedule.find(c => c.start > nowTotal);
      if (next) return { type: 'NEXT', ...next, countdown: next.start - nowTotal };
    }
    return null;
  }, [myClasses, currentTime, selectedDate, currentHoliday]);

  // 6. FILE HANDLERS
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const rows = event.target.result.split('\n').filter(row => row.trim() !== "").slice(1);
      const parsed = rows.map(row => {
        const cols = row.split(',');
        return {
          day: cols[0]?.trim(), time: cols[1]?.trim(), subject: cols[2]?.trim(),
          instructor: cols[3]?.trim(), section: cols[4]?.trim(), room: cols[5]?.trim() || "N/A" 
        };
      }).filter(item => item.day);
      setTimetableData(parsed);
      localStorage.setItem(`timetable_${teacher.email}`, JSON.stringify(parsed));
      setIsUploading(false);
      triggerSuccess("Timetable CSV uploaded successfully!");
    };
    reader.readAsText(file);
  };

  const handleHolidayUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const rows = event.target.result.split('\n').filter(row => row.trim() !== "").slice(1);
      const parsed = rows.map(row => {
        const [date, name] = row.split(',');
        return { date: date?.trim(), name: name?.trim() };
      });
      setHolidayList(parsed);
      localStorage.setItem(`holidays_${teacher.email}`, JSON.stringify(parsed));
      setShowDotsMenu(false);
      triggerSuccess("Holiday List updated successfully!");
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-200 p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      
      {/* SUCCESS TOAST */}
      {successMsg && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-bounce">
          ✓ {successMsg}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6 relative">
          <div>
            <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Schedule Hub</p>
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4 italic">Timetable</h1>
            
            <div className="flex flex-col gap-3">
              <input 
                type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                className="w-fit bg-[#111622] border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-indigo-400 outline-none cursor-pointer"
              />
              {sessionStatus ? (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${sessionStatus.type === 'LIVE' ? 'bg-rose-500 animate-ping' : 'bg-indigo-500'}`}></div>
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    {sessionStatus.type === 'LIVE' ? 'Live Now: ' : 'Next: '}
                    <span className="text-white">{sessionStatus.subject}</span>
                  </p>
                </div>
              ) : (
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 italic">
                   {myClasses.length > 0 ? "Daily Schedule View" : "No sessions"}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <div className="relative group">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <button className="bg-white/5 border border-white/10 text-white px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-white group-hover:text-black transition-all">
                {isUploading ? "Syncing..." : "↑ Import CSV"}
              </button>
            </div>

            <div className="relative">
              <button onClick={() => setShowDotsMenu(!showDotsMenu)} className="p-4 hover:bg-white/5 rounded-full flex flex-col gap-1 relative z-[80]">
                <div className="w-1 h-1 bg-slate-500 rounded-full" /><div className="w-1 h-1 bg-slate-500 rounded-full" /><div className="w-1 h-1 bg-slate-500 rounded-full" />
              </button>
              {showDotsMenu && (
                <div className="absolute right-0 mt-4 w-56 bg-[#161b29] border border-white/10 rounded-2xl shadow-3xl z-[80] overflow-hidden">
                  <label className="w-full text-left p-4 text-[10px] font-black uppercase text-slate-400 hover:bg-white/5 border-b border-white/5 cursor-pointer block">
                    Holiday List
                    <input type="file" accept=".csv" onChange={handleHolidayUpload} className="hidden" />
                  </label>
                  <button onClick={generatePDF} className="w-full text-left p-4 text-[10px] font-black uppercase text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* IDENTITY BOX */}
        <div className="mb-16 p-8 bg-[#111622] rounded-[40px] border border-indigo-500/10 shadow-2xl flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h3 className="text-white font-black text-xs uppercase mb-1">Teacher Identity</h3>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Match your name in CSV</p>
          </div>
          <input 
            type="text" value={mappingName} 
            onChange={(e) => { setMappingName(e.target.value.toUpperCase()); localStorage.setItem(`mapping_name_${teacher.email}`, e.target.value.toUpperCase()); }}
            placeholder="E.G. P. KIRAN" 
            className="w-full md:w-72 bg-[#06080f] border border-white/5 rounded-2xl p-5 text-white font-black uppercase text-xs outline-none"
          />
        </div>

        {/* TIMELINE */}
        <div className="relative border-l border-white/5 ml-4 md:ml-12 pl-10 md:pl-20 py-4 space-y-12">
          {currentHoliday ? (
            <div className="bg-[#111622] p-20 rounded-[55px] border border-rose-500/10 text-center">
              <h2 className="text-2xl font-black text-white uppercase italic">{currentHoliday.name}</h2>
            </div>
          ) : (
            myClasses.map((item, index) => (
              <div key={index} className="relative group">
                <div className="absolute -left-[45px] md:-left-[85px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#06080f] border-2 border-indigo-500" />
                <div className="flex flex-col md:flex-row md:items-center gap-10 bg-[#111622] p-10 rounded-[45px] border border-white/5 hover:border-indigo-500/40 transition-all shadow-2xl relative">
                  <div className="md:w-32">
                    <p className="text-indigo-400 font-black text-3xl tracking-tighter">{item.time}</p>
                  </div>
                  <div className="flex-1 border-l border-white/5 md:pl-12">
                    <h3 className="text-2xl font-black text-white uppercase">{item.subject}</h3>
                    <span className="text-slate-500 font-black text-[9px] uppercase tracking-widest">Sec: {item.section} | Room: {item.room}</span>
                  </div>
                  <div className="relative">
                    <button onClick={() => setActiveLaunchMenu(activeLaunchMenu === index ? null : index)} className="bg-white text-black px-8 py-4 rounded-2xl text-[9px] font-black uppercase hover:bg-indigo-500 hover:text-white transition-all shadow-lg">
                      Launch {activeLaunchMenu === index ? '▲' : '▼'}
                    </button>
                    {activeLaunchMenu === index && (
                      <div className="absolute right-0 mt-4 w-52 bg-[#161b29] border border-white/10 rounded-2xl shadow-3xl z-50 overflow-hidden">
                        {['/attendance-hub', '/assignments', '/marks-entry'].map((path, i) => (
                          <button 
                            key={i}
                            onClick={() => handleSmartRedirect(item.subject, item.section, path)} 
                            className="w-full text-left p-4 text-[9px] font-black uppercase text-white hover:bg-indigo-600 border-b border-white/5"
                          >
                            {path.replace('/', '').replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    )}
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