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

  // 2. PERSISTENCE & CLOCK
  useEffect(() => {
    if (teacher?.email) {
      const savedTimetable = localStorage.getItem(`timetable_${teacher.email}`);
      const savedMapping = localStorage.getItem(`mapping_name_${teacher.email}`);
      const savedHolidays = localStorage.getItem(`holidays_${teacher.email}`);
      
      if (savedTimetable) setTimetableData(JSON.parse(savedTimetable));
      if (savedMapping) setMappingName(savedMapping);
      if (savedHolidays) setHolidayList(JSON.parse(savedHolidays));
    }
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [teacher?.email]);

  // 3. UTILITIES
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

  // 4. FILTERING & TICKER LOGIC
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

  // 5. FILE HANDLERS
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
      alert("Holidays Updated");
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-200 p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6 relative">
          <div>
            <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Schedule Hub</p>
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4 italic">Timetable</h1>
            
            <div className="flex flex-col gap-3">
              <input 
                type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                className="w-fit bg-[#111622] border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-indigo-400 outline-none"
              />
              {sessionStatus ? (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${sessionStatus.type === 'LIVE' ? 'bg-rose-500 animate-ping shadow-[0_0_8px_#f43f5e]' : 'bg-indigo-500 shadow-[0_0_8px_#6366f1]'}`}></div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${sessionStatus.type === 'LIVE' ? 'text-rose-400' : 'text-slate-400'}`}>
                    {sessionStatus.type === 'LIVE' ? 'Live Now: ' : 'Next: '}
                    <span className="text-white">{sessionStatus.subject}</span>
                    {sessionStatus.type === 'NEXT' && <span className="text-indigo-400 ml-1">({sessionStatus.countdown} min)</span>}
                  </p>
                </div>
              ) : (
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 italic">
                   {myClasses.length > 0 ? "Daily Schedule View" : "No upcoming sessions today"}
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
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDotsMenu(!showDotsMenu); }} 
                className="p-4 hover:bg-white/5 rounded-full flex flex-col gap-1 relative z-[80]"
              >
                <div className="w-1 h-1 bg-slate-500 rounded-full" /><div className="w-1 h-1 bg-slate-500 rounded-full" /><div className="w-1 h-1 bg-slate-500 rounded-full" />
              </button>

              {showDotsMenu && (
                <>
                  <div className="fixed inset-0 z-[75]" onClick={() => setShowDotsMenu(false)} />
                  <div className="absolute right-0 mt-4 w-56 bg-[#161b29] border border-white/10 rounded-2xl shadow-3xl z-[80] overflow-hidden">
                    <label className="w-full text-left p-4 text-[10px] font-black uppercase text-slate-400 hover:bg-white/5 border-b border-white/5 cursor-pointer block">
                      Upload Holiday List
                      <input type="file" accept=".csv" onChange={handleHolidayUpload} className="hidden" />
                    </label>
                    <button onClick={() => { generatePDF(); setShowDotsMenu(false); }} className="w-full text-left p-4 text-[10px] font-black uppercase text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">
                      Download PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* IDENTITY BOX */}
        <div className="mb-16 p-8 bg-[#111622] rounded-[40px] border border-indigo-500/10 shadow-2xl flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h3 className="text-white font-black text-xs uppercase mb-1">Teacher Identity</h3>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Match your name in the CSV</p>
          </div>
          <input 
            type="text" value={mappingName} 
            onChange={(e) => { setMappingName(e.target.value.toUpperCase()); localStorage.setItem(`mapping_name_${teacher.email}`, e.target.value.toUpperCase()); }}
            placeholder="E.G. P. KIRAN" 
            className="w-full md:w-72 bg-[#06080f] border border-white/5 rounded-2xl p-5 text-white font-black uppercase text-xs focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        {/* TIMELINE */}
        <div className="relative border-l border-white/5 ml-4 md:ml-12 pl-10 md:pl-20 py-4 space-y-12">
          {currentHoliday ? (
            <div className="bg-[#111622] p-20 rounded-[55px] border border-rose-500/10 text-center shadow-3xl">
              <span className="text-6xl mb-6 block">🏖️</span>
              <h2 className="text-2xl font-black text-white uppercase italic">{currentHoliday.name || "Restricted Day"}</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase mt-2 tracking-widest">Campus Closed</p>
            </div>
          ) : myClasses.length === 0 ? (
            <div className="bg-[#111622]/40 p-20 rounded-[55px] border border-white/5 text-center">
              <h2 className="text-xl font-black text-slate-800 uppercase italic">Zero Sessions Detected</h2>
            </div>
          ) : (
            myClasses.map((item, index) => (
              <div key={index} className="relative group">
                <div className="absolute -left-[45px] md:-left-[85px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#06080f] border-2 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]" />
                <div className="flex flex-col md:flex-row md:items-center gap-10 bg-[#111622] p-10 rounded-[45px] border border-white/5 hover:border-indigo-500/40 transition-all shadow-2xl relative">
                  <div className="md:w-32">
                    <p className="text-indigo-400 font-black text-3xl tracking-tighter">{item.time}</p>
                    <p className="text-slate-700 font-black text-[9px] uppercase">Period</p>
                  </div>
                  <div className="flex-1 border-l border-white/5 md:pl-12">
                    <h3 className="text-2xl font-black text-white uppercase group-hover:text-indigo-400 transition-colors">{item.subject}</h3>
                    <div className="flex gap-4">
                      <span className="text-slate-500 font-black text-[9px] uppercase tracking-widest">Sec: {item.section}</span>
                      <span className="text-indigo-500/60 font-black text-[9px] uppercase tracking-widest">Room: {item.room}</span>
                    </div>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveLaunchMenu(activeLaunchMenu === index ? null : index); }}
                      className="bg-white text-black px-8 py-4 rounded-2xl text-[9px] font-black uppercase hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2 min-w-[120px] justify-center"
                    >
                      Launch <span>{activeLaunchMenu === index ? '▲' : '▼'}</span>
                    </button>

                    {activeLaunchMenu === index && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveLaunchMenu(null)} />
                        <div className="absolute right-0 mt-4 w-52 bg-[#161b29] border border-white/10 rounded-2xl shadow-3xl z-50 overflow-hidden">
                          <button onClick={() => navigate(`/attendance-hub?subject=${item.subject}&section=${item.section}`)} className="w-full text-left p-4 text-[9px] font-black uppercase text-white hover:bg-indigo-600 border-b border-white/5">
                            Attendance
                          </button>
                          <button onClick={() => navigate(`/assignments?subject=${item.subject}&section=${item.section}`)} className="w-full text-left p-4 text-[9px] font-black uppercase text-slate-400 hover:bg-white/10 border-b border-white/5">
                            Assignments
                          </button>
                          <button onClick={() => navigate(`/marks-entry?subject=${item.subject}&section=${item.section}`)} className="w-full text-left p-4 text-[9px] font-black uppercase text-indigo-400 hover:bg-white/10">
                            Internal / Oral Marks
                          </button>
                        </div>
                      </>
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