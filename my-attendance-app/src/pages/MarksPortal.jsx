import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function MarksPortal({ teacher }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subject = searchParams.get('subject');
  const section = searchParams.get('section');

  // State
  const [students, setStudents] = useState([]);
  const [tests, setTests] = useState([{ id: 'test1', name: 'Test 01', max: 50 }]);
  const [marksData, setMarksData] = useState({}); 
  const [selectedChartTest, setSelectedChartTest] = useState('overall'); // 'overall' or 'testId'
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedStudents = localStorage.getItem(`students_${section}`);
    const savedPortal = localStorage.getItem(`portal_${subject}_${section}`);
    if (savedStudents) setStudents(JSON.parse(savedStudents));
    if (savedPortal) {
      const { tests: sTests, marks: sMarks } = JSON.parse(savedPortal);
      setTests(sTests);
      setMarksData(sMarks);
    }
  }, [subject, section]);

  // ANALYTICS LOGIC (Filters based on Dropdown)
  const stats = useMemo(() => {
    const total = students.length;
    if (total === 0) return { pass: 0, fail: 0, perc: 0 };
    
    let passCount = 0;
    students.forEach(s => {
      let score = 0;
      let maxPossible = 0;

      if (selectedChartTest === 'overall') {
        // Average of ALL tests
        const rowMarks = tests.map(t => marksData[s.id]?.[t.id] || 0);
        score = rowMarks.reduce((a, b) => a + b, 0) / (tests.length || 1);
        maxPossible = 50; // Standardized max
      } else {
        // Specific Test Score
        score = marksData[s.id]?.[selectedChartTest] || 0;
        maxPossible = tests.find(t => t.id === selectedChartTest)?.max || 50;
      }

      if (score >= (maxPossible * 0.7)) passCount++; // 70% Passing Threshold
    });

    return { 
      pass: passCount, 
      fail: total - passCount, 
      perc: Math.round((passCount / total) * 100) 
    };
  }, [students, marksData, tests, selectedChartTest]);

  const saveAll = () => {
    localStorage.setItem(`portal_${subject}_${section}`, JSON.stringify({ tests, marks: marksData }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-200 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
          <div>
            <button onClick={() => navigate(-1)} className="text-[10px] font-black uppercase text-indigo-500 mb-2 block tracking-widest">← Return</button>
            <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter italic">{subject}</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Marks Registry • Sec {section}</p>
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => setTests([...tests, { id: `test${tests.length+1}`, name: `Test 0${tests.length+1}`, max: 50 }])} className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-[9px] font-black uppercase hover:bg-white hover:text-black transition-all">+ Add Test</button>
            <button onClick={saveAll} className={`px-8 py-4 rounded-2xl text-[9px] font-black uppercase transition-all shadow-xl ${isSaved ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
              {isSaved ? "Saved ✓" : "Save Entries"}
            </button>
          </div>
        </div>

        {/* PIE CHART WITH FILTER SELECTOR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#111622] p-8 rounded-[40px] border border-white/5 flex flex-col md:flex-row items-center gap-10 col-span-3 shadow-2xl relative overflow-hidden">
            
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -z-10" />

            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-28 h-28 transform -rotate-90 transition-transform duration-700">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#1f2937" strokeWidth="4" />
                <circle 
                  cx="18" cy="18" r="16" fill="none" stroke="#6366f1" strokeWidth="4" 
                  strokeDasharray={`${stats.perc}, 100`} 
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-in-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white font-black text-lg leading-none">{stats.perc}%</span>
                <span className="text-[7px] text-slate-500 font-bold uppercase">Pass Rate</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-black text-sm uppercase tracking-tighter">Performance Analysis</h3>
                
                {/* THE SELECTOR */}
                <select 
                  value={selectedChartTest}
                  onChange={(e) => setSelectedChartTest(e.target.value)}
                  className="bg-[#06080f] border border-white/10 rounded-xl px-4 py-2 text-[9px] font-black uppercase text-indigo-400 outline-none"
                >
                  <option value="overall">Overall Average</option>
                  {tests.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-10">
                <div>
                  <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Status: Success</p>
                  <p className="text-white font-black text-xl">{stats.pass} <span className="text-[10px] text-slate-600 uppercase">Students</span></p>
                </div>
                <div className="border-l border-white/5 pl-10">
                  <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Status: Critical</p>
                  <p className="text-rose-500 font-black text-xl">{stats.fail} <span className="text-[10px] text-slate-600 uppercase">Students</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MARKS TABLE */}
        <div className="bg-[#111622] rounded-[45px] border border-white/5 overflow-x-auto shadow-3xl">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white/5">
                <th className="p-8 text-[10px] font-black uppercase text-slate-500 tracking-widest sticky left-0 bg-[#111622] z-10">Student Profile</th>
                {tests.map(t => (
                  <th key={t.id} className="p-8 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">{t.name}</th>
                ))}
                <th className="p-8 text-[10px] font-black uppercase text-indigo-500 tracking-widest text-center">Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.map((student) => {
                const rowMarks = tests.map(t => marksData[student.id]?.[t.id] || 0);
                const avg = (rowMarks.reduce((a, b) => a + b, 0) / (tests.length || 1)).toFixed(1);
                
                return (
                  <tr key={student.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="p-8 sticky left-0 bg-[#111622] group-hover:bg-[#161b29] z-10">
                      <p className="text-white font-black uppercase text-sm group-hover:text-indigo-400">{student.name}</p>
                      <p className="text-slate-600 font-bold text-[9px] uppercase">{student.id}</p>
                    </td>
                    {tests.map(t => (
                      <td key={t.id} className="p-8 text-center">
                        <input 
                          type="number" max={t.max}
                          value={marksData[student.id]?.[t.id] || ""}
                          onChange={(e) => {
                            setMarksData({...marksData, [student.id]: {...(marksData[student.id] || {}), [t.id]: parseInt(e.target.value) || 0}});
                            setIsSaved(false);
                          }}
                          className="w-16 bg-[#06080f] border border-white/10 rounded-xl p-2 text-center text-white font-black text-xs focus:border-indigo-500 outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-8 text-center font-black text-xs text-indigo-400">{avg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}