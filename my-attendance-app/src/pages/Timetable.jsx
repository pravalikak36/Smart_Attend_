import React, { useState, useEffect, useMemo } from 'react';

export default function Timetable({ teacher }) {
  const [timetableData, setTimetableData] = useState([]);
  const [holidays, setHolidays] = useState(["2026-01-26", "2026-08-15", "2026-10-02"]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [mappingName, setMappingName] = useState(""); 
  const [uploadStatus, setUploadStatus] = useState(null); // To show "Uploaded!"

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadStatus("Processing...");
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n').filter(row => row.trim() !== "");
      const dataRows = rows.slice(1); 
      
      const parsed = dataRows.map(row => {
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
      setUploadStatus("✅ Uploaded Successfully!");
      
      // Clear status after 3 seconds
      setTimeout(() => setUploadStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  // Correct Day Logic
  const currentDayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date(selectedDate));
  
  const myClasses = useMemo(() => {
    if (!mappingName || !timetableData.length) return [];
    return timetableData.filter(item => 
      item.instructor?.toLowerCase().includes(mappingName.toLowerCase()) && 
      item.day?.toLowerCase() === currentDayName.toLowerCase()
    );
  }, [timetableData, mappingName, currentDayName, selectedDate]);

  const isHoliday = holidays.includes(selectedDate);

  const toggleHoliday = () => {
    const updated = isHoliday 
      ? holidays.filter(h => h !== selectedDate)
      : [...holidays, selectedDate];
    setHolidays(updated);
    localStorage.setItem(`holidays_${teacher.email}`, JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-200 p-6 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        
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

          <div className="flex flex-col items-end gap-3">
            <div className="relative group">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <button className="bg-white/5 border border-white/10 text-white px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-white group-hover:text-black transition-all duration-500">
                ↑ Import Master CSV
              </button>
            </div>
            {uploadStatus && <p className="text-emerald-400 text-[9px] font-black uppercase tracking-widest animate-pulse">{uploadStatus}</p>}
          </div>
        </header>

        <div className="mb-16 p-8 bg-[#111622] rounded-[40px] border border-indigo-500/10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <h3 className="text-white font-black text-xs uppercase tracking-widest mb-2">Teacher Identification</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase leading-relaxed">Enter your name exactly as it appears in the teacher column.</p>
            </div>
            <input 
              type="text"
              value={mappingName}
              onChange={(e) => {
                setMappingName(e.target.value);
                localStorage.setItem(`mapping_name_${teacher.email}`, e.target.value);
              }}
              placeholder="e.g. P. KIRAN"
              className="w-full md:w-72 bg-[#06080f] border border-white/5 rounded-2xl p-5 text-white font-black uppercase text-xs tracking-[0.2em] focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="relative border-l border-white/5 ml-4 md:ml-12 pl-10 md:pl-20 py-4 space-y-12">
          {isHoliday ? (
            <div className="bg-rose-500/5 p-20 rounded-[55px] border border-rose-500/20 text-center">
              <span className="text-5xl mb-4 block">🏖️</span>
              <h2 className="text-xl font-black text-rose-500 uppercase italic">Campus Holiday</h2>
            </div>
          ) : !mappingName ? (
            <div className="p-16 text-center border border-dashed border-white/10 rounded-[55px]">
              <p className="text-slate-700 font-black uppercase text-[10px] tracking-widest">Enter Mapping Name to Unlock Schedule</p>
            </div>
          ) : myClasses.length === 0 ? (
            <div className="p-16 text-center bg-white/[0.02] border border-white/5 rounded-[55px]">
              <p className="text-slate-600 font-black uppercase text-[10px] tracking-widest">No classes found for {currentDayName}</p>
            </div>
          ) : (
            myClasses.map((item, index) => (
              <div key={index} className="relative group animate-in fade-in slide-in-from-left duration-500">
                <div className="absolute -left-[45px] md:-left-[85px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#06080f] border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
                <div className="flex flex-col md:flex-row md:items-center gap-10 bg-[#111622] p-10 rounded-[45px] border border-white/5 hover:border-indigo-500/40 transition-all duration-500">
                  <div className="md:w-32 text-center md:text-left">
                    <p className="text-indigo-400 font-black text-2xl tracking-tighter">{item.time}</p>
                    <p className="text-slate-700 font-black text-[8px] uppercase tracking-widest">Duration</p>
                  </div>
                  <div className="flex-1 border-l border-white/5 md:pl-12">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">{item.subject}</h3>
                    <div className="flex gap-3">
                      <span className="bg-white/5 px-3 py-1 rounded-lg text-slate-400 font-black text-[9px] uppercase border border-white/5">Section: {item.section}</span>
                      <span className="bg-indigo-500/10 px-3 py-1 rounded-lg text-indigo-400 font-black text-[9px] uppercase border border-indigo-500/10">Room: {item.room}</span>
                    </div>
                  </div>
                  <button className="bg-white text-black px-6 py-3 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-500 hover:text-white transition-all">Launch</button>
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="mt-20 flex justify-center">
           <button onClick={toggleHoliday} className={`px-10 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border ${isHoliday ? 'bg-indigo-600 text-white border-indigo-600' : 'text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white'}`}>
             {isHoliday ? "Remove Holiday" : "Set as Holiday"}
           </button>
        </footer>
      </div>
    </div>
  );
}