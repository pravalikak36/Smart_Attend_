import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Timetable({ teacher }) {
  const navigate = useNavigate();
  
  // 1. STATE
  const [timetableData, setTimetableData] = useState([]);
  const [holidayList, setHolidayList] = useState([]); 
  const [holidays, setHolidays] = useState(["2026-01-26", "2026-08-15", "2026-10-02"]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [mappingName, setMappingName] = useState(""); 
  const [isUploading, setIsUploading] = useState(false);
  
  const [showDotsMenu, setShowDotsMenu] = useState(false);
  const [activeLaunchMenu, setActiveLaunchMenu] = useState(null);

  // 2. PERSISTENCE
  useEffect(() => {
    if (teacher?.email) {
      const savedTimetable = localStorage.getItem(`timetable_${teacher.email}`);
      const savedHolidays = localStorage.getItem(`holidays_${teacher.email}`);
      const savedAutoHolidays = localStorage.getItem(`holiday_list_${teacher.email}`);
      const savedMapping = localStorage.getItem(`mapping_name_${teacher.email}`);
      
      if (savedTimetable) setTimetableData(JSON.parse(savedTimetable));
      if (savedHolidays) setHolidays(JSON.parse(savedHolidays));
      if (savedAutoHolidays) setHolidayList(JSON.parse(savedAutoHolidays));
      if (savedMapping) setMappingName(savedMapping);
    }
  }, [teacher?.email]);

  // 3. LOGIC & HANDLERS
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
            day: cols[0]?.trim(),
            time: cols[1]?.trim(),
            subject: cols[2]?.trim(),
            instructor: cols[3]?.trim(), 
            section: cols[4]?.trim(),    
            room: cols[5]?.trim() || "N/A" 
        };
      }).filter(item => item.day);
      setTimetableData(parsed);
      localStorage.setItem(`timetable_${teacher.email}`, JSON.stringify(parsed));
      setIsUploading(false);
    };
    reader.readAsText(file);
  };

  const handleLaunch = (type, item) => {
    const sub = encodeURIComponent(item.subject);
    const sec = encodeURIComponent(item.section);
    const path = type === 'attendance' ? '/attendance-hub' : '/assignments';
    
    navigate(`${path}?subject=${sub}&section=${sec}`);
    setActiveLaunchMenu(null);
  };

  const currentDayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date(selectedDate));
  const isAutoHoliday = holidayList.find(h => h.date === selectedDate);
  const isManualHoliday = holidays.includes(selectedDate);
  const isHoliday = isManualHoliday || isAutoHoliday;

  const myClasses = useMemo(() => {
    if (!mappingName) return [];
    return timetableData.filter(item => 
      item.instructor?.toLowerCase().includes(mappingName.toLowerCase()) && 
      item.day?.toLowerCase() === currentDayName.toLowerCase()
    );
  }, [timetableData, mappingName, currentDayName]);

  const toggleHoliday = () => {
    const updated = isManualHoliday 
      ? holidays.filter(h => h !== selectedDate)
      : [...holidays, selectedDate];
    setHolidays(updated);
    localStorage.setItem(`holidays_${teacher.email}`, JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-200 p-6 md:p-12 font-sans overflow-y-auto selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto">
        
        {/* TOP BAR */}
        <header className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6 relative">
          <div>
            <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Schedule Hub</p>
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4 italic">Timetable</h1>
            <input 
              type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#111622] border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-indigo-400 outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <button className="bg-white/5 border border-white/10 text-white px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-white group-hover:text-black transition-all shadow-2xl">
                {isUploading ? "Syncing..." : "↑ Import Master CSV"}
              </button>
            </div>

            <div className="relative">
              <button onClick={() => setShowDotsMenu(!showDotsMenu)} className="p-4 hover:bg-white/5 rounded-full transition-all flex flex-col gap-1">
                <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
              </button>
              {showDotsMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDotsMenu(false)} />
                  <div className="absolute right-0 mt-4 w-56 bg-[#161b29] border border-white/10 rounded-2xl shadow-3xl z-50 overflow-hidden">
                    <label className="block p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 cursor-pointer">
                      Upload Holiday List
                      <input type="file" className="hidden" />
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* IDENTITY BOX */}
        <div className="mb-16 p-8 bg-[#111622] rounded-[40px] border border-indigo-500/10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <h3 className="text-white font-black text-xs uppercase tracking-widest mb-2">Teacher Identification</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase leading-relaxed">Map CSV Name (e.g., "P. KIRAN")</p>
            </div>
            <input 
              type="text" value={mappingName} 
              onChange={(e) => { setMappingName(e.target.value); localStorage.setItem(`mapping_name_${teacher.email}`, e.target.value); }}
              placeholder="Map Name..." 
              className="w-full md:w-72 bg-[#06080f] border border-white/5 rounded-2xl p-5 text-white font-black uppercase text-xs tracking-[0.2em] focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* TIMELINE */}
        <div className="relative border-l border-white/5 ml-4 md:ml-12 pl-10 md:pl-20 py-4 space-y-12">
          {isHoliday ? (
            <div className="bg-[#111622] p-20 rounded-[55px] border border-rose-500/10 text-center shadow-3xl">
              <span className="text-6xl mb-6 block">🏖️</span>
              <h2 className="text-2xl font-black text-white uppercase italic">Campus Restricted</h2>
              <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-3">
                {isAutoHoliday ? isAutoHoliday.name : "Institutional Holiday"}
              </p>
            </div>
          ) : !mappingName ? (
            <div className="p-20 text-center border border-dashed border-white/10 rounded-[55px]">
              <p className="text-slate-700 font-black uppercase tracking-widest text-[11px]">Assign Name to View Schedule</p>
            </div>
          ) : myClasses.length === 0 ? (
            <div className="bg-[#111622]/40 p-20 rounded-[55px] border border-white/5 text-center">
              <h2 className="text-xl font-black text-slate-800 uppercase italic">Zero Sessions Detected</h2>
            </div>
          ) : (
            myClasses.map((item, index) => (
              <div key={index} className="relative group">
                <div className="absolute -left-[45px] md:-left-[85px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#06080f] border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
                <div className="flex flex-col md:flex-row md:items-center gap-10 bg-[#111622] p-10 rounded-[45px] border border-white/5 hover:border-indigo-500/40 transition-all duration-500 shadow-2xl">
                  <div className="md:w-32">
                    <p className="text-indigo-400 font-black text-3xl tracking-tighter">{item.time}</p>
                    <p className="text-slate-700 font-black text-[9px] uppercase tracking-[0.3em]">Period</p>
                  </div>
                  <div className="flex-1 border-l border-white/5 md:pl-12">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2 group-hover:text-indigo-400 transition-colors">{item.subject}</h3>
                    <div className="flex gap-4">
                      <span className="bg-white/[0.03] px-4 py-2 rounded-xl text-slate-500 font-black text-[9px] uppercase tracking-widest border border-white/5">Sec: {item.section}</span>
                      <span className="bg-indigo-500/5 px-4 py-2 rounded-xl text-indigo-500/60 font-black text-[9px] uppercase tracking-widest border border-indigo-500/5">Room: {item.room}</span>
                    </div>
                  </div>

                  {/* LAUNCH DROPDOWN */}
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveLaunchMenu(activeLaunchMenu === index ? null : index);
                      }}
                      className="bg-white text-black px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl relative z-50"
                    >
                      Launch
                    </button>
                    {activeLaunchMenu === index && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveLaunchMenu(null)} />
                        <div className="absolute right-0 mt-4 w-44 bg-[#1a1f2e] border border-white/10 rounded-2xl shadow-3xl z-50 overflow-hidden">
                          <button 
                            onClick={() => handleLaunch('attendance', item)} 
                            className="w-full text-left p-4 text-[9px] font-black uppercase text-slate-400 hover:bg-white/5 border-b border-white/5 transition-colors"
                          >
                            Attendance
                          </button>
                          <button 
                            onClick={() => handleLaunch('assignment', item)} 
                            className="w-full text-left p-4 text-[9px] font-black uppercase text-slate-400 hover:bg-white/5 border-b border-white/5 transition-colors"
                          >
                            Assignments
                          </button>
                          <button className="w-full text-left p-4 text-[9px] font-black uppercase text-slate-700 cursor-not-allowed">Marks Portal</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="mt-24 pt-10 border-t border-white/5 flex justify-center">
           <button onClick={toggleHoliday} className={`px-12 py-5 rounded-[22px] font-black text-[10px] uppercase tracking-[0.3em] transition-all border ${isManualHoliday ? 'border-indigo-500 text-indigo-500' : 'border-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white'}`}>
             {isManualHoliday ? "Undo Holiday" : "Mark Holiday"}
           </button>
        </footer>
      </div>
    </div>
  );
}