import React, { useState, useEffect, useMemo } from 'react';

export default function Timetable({ teacher }) {
  // 1. STATE: Data & UI control
  const [timetableData, setTimetableData] = useState([]);
  const [holidays, setHolidays] = useState(["2026-01-26", "2026-08-15", "2026-10-02"]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [mappingName, setMappingName] = useState(""); 
  const [isUploading, setIsUploading] = useState(false);

  // 2. PERSISTENCE: Load from LocalStorage on mount
  useEffect(() => {
    if (teacher?.email) {
      const savedTimetable = localStorage.getItem(`timetable_${teacher.email}`);
      const savedHolidays = localStorage.getItem(`holidays_${teacher.email}`);
      const savedMapping = localStorage.getItem(`mapping_name_${teacher.email}`);
      
      if (savedTimetable) setTimetableData(JSON.parse(savedTimetable));
      if (savedHolidays) setHolidays(JSON.parse(savedHolidays));
      if (savedMapping) setMappingName(savedMapping);
    }
  }, [teacher?.email]);

  // 3. LOGIC: Parse CSV into usable objects
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n').filter(row => row.trim() !== "");
      const dataRows = rows.slice(1); // Remove CSV Header
      
      const parsed = dataRows.map(row => {
        const cols = row.split(',');
        return {
          day: cols[0]?.trim(),
          time: cols[1]?.trim(),
          subject: cols[2]?.trim(),
          section: cols[3]?.trim(),
          instructor: cols[4]?.trim()
        };
      }).filter(item => item.day);

      setTimetableData(parsed);
      localStorage.setItem(`timetable_${teacher.email}`, JSON.stringify(parsed));
      setIsUploading(false);
    };
    reader.readAsText(file);
  };

  // 4. ANALYTICS: Filter by Day and Teacher Mapping
  const currentDayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date(selectedDate));
  
  const myClasses = useMemo(() => {
    if (!mappingName) return [];
    return timetableData.filter(item => 
      item.instructor?.toLowerCase().includes(mappingName.toLowerCase()) && 
      item.day?.toLowerCase() === currentDayName.toLowerCase()
    );
  }, [timetableData, mappingName, currentDayName]);

  const isHoliday = holidays.includes(selectedDate);

  const toggleHoliday = () => {
    const updated = isHoliday 
      ? holidays.filter(h => h !== selectedDate)
      : [...holidays, selectedDate];
    setHolidays(updated);
    localStorage.setItem(`holidays_${teacher.email}`, JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-200 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* TOP BAR: Title & CSV Upload */}
        <header className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6">
          <div>
            <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Schedule Hub</p>
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">Timetable</h1>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#111622] border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-indigo-400 outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-xl"
            />
          </div>

          <div className="relative group">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <button className="bg-white/5 border border-white/10 text-white px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-white group-hover:text-black transition-all duration-500 shadow-2xl">
              {isUploading ? "Syncing..." : "↑ Import Master CSV"}
            </button>
          </div>
        </header>

        {/* IDENTITY BOX: Mapping input */}
        <div className="mb-16 p-8 bg-[#111622] rounded-[40px] border border-indigo-500/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl rounded-full" />
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <h3 className="text-white font-black text-xs uppercase tracking-widest mb-2">Teacher Identification</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase leading-relaxed">
                Type your name as it appears in the CSV (e.g., "S. Pravalika"). This filters the master file for your specific classes.
              </p>
            </div>
            <input 
              type="text"
              value={mappingName}
              onChange={(e) => {
                setMappingName(e.target.value);
                localStorage.setItem(`mapping_name_${teacher.email}`, e.target.value);
              }}
              placeholder="Map CSV Name..."
              className="w-full md:w-72 bg-[#06080f] border border-white/5 rounded-2xl p-5 text-white font-black uppercase text-xs tracking-[0.2em] focus:border-indigo-500 outline-none transition-all placeholder:text-slate-800 shadow-inner"
            />
          </div>
        </div>

        {/* MAIN TIMELINE */}
        <div className="relative border-l border-white/5 ml-4 md:ml-12 pl-10 md:pl-20 py-4 space-y-12">
          
          {isHoliday ? (
            <div className="bg-[#111622] p-20 rounded-[55px] border border-rose-500/10 text-center shadow-3xl">
              <span className="text-6xl mb-6 block drop-shadow-[0_0_20px_rgba(244,63,94,0.3)]">🏖️</span>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Campus Restricted</h2>
              <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-3">Date marked as institutional holiday</p>
            </div>
          ) : !mappingName ? (
            <div className="p-20 text-center border border-dashed border-white/10 rounded-[55px]">
              <p className="text-slate-700 font-black uppercase tracking-widest text-[11px] animate-pulse">Assign Mapping Name to View Schedule</p>
            </div>
          ) : myClasses.length === 0 ? (
            <div className="bg-[#111622]/40 p-20 rounded-[55px] border border-white/5 text-center">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Zero Sessions Detected</h2>
              <p className="text-slate-900 text-[10px] font-bold uppercase tracking-widest mt-2">No data found for this date in the CSV</p>
            </div>
          ) : (
            myClasses.map((item, index) => (
              <div key={index} className="relative group">
                {/* Glowing Timeline Connector */}
                <div className="absolute -left-[45px] md:-left-[85px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#06080f] border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] group-hover:scale-150 transition-all duration-500" />
                
                <div className="flex flex-col md:flex-row md:items-center gap-10 bg-[#111622] p-10 rounded-[45px] border border-white/5 hover:border-indigo-500/40 transition-all duration-500 shadow-2xl group-hover:-translate-y-1">
                  <div className="md:w-32">
                    <p className="text-indigo-400 font-black text-3xl tracking-tighter mb-1">{item.time}</p>
                    <p className="text-slate-700 font-black text-[9px] uppercase tracking-[0.3em]">Start Period</p>
                  </div>
                  
                  <div className="flex-1 border-l border-white/5 md:pl-12">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2 group-hover:text-indigo-400 transition-colors">{item.subject}</h3>
                    <div className="flex flex-wrap gap-5">
                      <span className="bg-white/[0.03] px-4 py-2 rounded-xl text-slate-500 font-black text-[9px] uppercase tracking-widest border border-white/5">Section: {item.section}</span>
                      <span className="bg-indigo-500/5 px-4 py-2 rounded-xl text-indigo-500/60 font-black text-[9px] uppercase tracking-widest border border-indigo-500/5">Lecture Hall</span>
                    </div>
                  </div>

                  <button className="bg-white text-black px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-indigo-600 hover:text-white shadow-xl active:scale-95">
                    Launch Hub
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* BOTTOM TOGGLE */}
        <footer className="mt-24 pt-10 border-t border-white/5 flex justify-center">
           <button 
             onClick={toggleHoliday}
             className={`px-12 py-5 rounded-[22px] font-black text-[10px] uppercase tracking-[0.3em] transition-all border ${isHoliday ? 'border-indigo-500 text-indigo-500 bg-indigo-500/5' : 'border-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white shadow-lg shadow-rose-500/5'}`}
           >
             {isHoliday ? "Undo Holiday Status" : "Mark as Campus Holiday"}
           </button>
        </footer>
      </div>
    </div>
  );
}