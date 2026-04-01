import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function MarksPortal({ teacher }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // URL Params for Routing
  const selectedClassName = searchParams.get('name');
  const selectedSubject = searchParams.get('sub');

  // State
  const [dashboardClasses, setDashboardClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [tests, setTests] = useState([{ id: 'test1', name: 'Test 01', max: 50 }]);
  const [marksData, setMarksData] = useState({});

  // 1. Fetch Classes from Dashboard Storage
  useEffect(() => {
    if (teacher?.email) {
      const saved = localStorage.getItem(`classes_${teacher.email}`);
      if (saved) setDashboardClasses(JSON.parse(saved));
    }
  }, [teacher]);

  // 2. Sync Selected Class Data
  useEffect(() => {
    if (selectedClassName && selectedSubject) {
      const activeClass = dashboardClasses.find(
        c => c.name === selectedClassName && c.sub === selectedSubject
      );
      
      // Extract Students from Dashboard String
      if (activeClass && activeClass.students) {
        const studentArray = activeClass.students.split(', ').map(name => ({ name }));
        setStudents(studentArray);
      }

      // Load existing marks for this specific Class+Subject
      const savedMarks = localStorage.getItem(`marks_${selectedSubject}_${selectedClassName}`);
      if (savedMarks) {
        const { tests: sTests, marks: sMarks } = JSON.parse(savedMarks);
        setTests(sTests);
        setMarksData(sMarks);
      }
    }
  }, [selectedClassName, selectedSubject, dashboardClasses]);

  // --- CORE LOGIC ---

  const addTest = () => {
    const newNum = tests.length + 1;
    const newTest = { id: `test${newNum}`, name: `Test 0${newNum}`, max: 50 };
    const updatedTests = [...tests, newTest];
    setTests(updatedTests);
    saveToStorage(updatedTests, marksData);
  };

  const updateMark = (studentName, testId, value) => {
    const newMarks = {
      ...marksData,
      [studentName]: { ...(marksData[studentName] || {}), [testId]: value }
    };
    setMarksData(newMarks);
    saveToStorage(tests, newMarks);
  };

  const saveToStorage = (currTests, currMarks) => {
    localStorage.setItem(`marks_${selectedSubject}_${selectedClassName}`, JSON.stringify({
      tests: currTests,
      marks: currMarks
    }));
  };

  // --- FEATURES ---

  // Calculate Class Average for the Chart
  const classAverage = useMemo(() => {
    if (students.length === 0) return 0;
    let scoreSum = 0;
    let maxPossibleSum = 0;

    students.forEach(s => {
      tests.forEach(t => {
        const score = parseFloat(marksData[s.name]?.[t.id] || 0);
        scoreSum += score;
        maxPossibleSum += parseFloat(t.max);
      });
    });

    return maxPossibleSum > 0 ? ((scoreSum / maxPossibleSum) * 100).toFixed(1) : 0;
  }, [students, tests, marksData]);

  // WhatsApp Top 3 Report
  const sendWhatsAppReport = () => {
    const lastTest = tests[tests.length - 1];
    const sorted = [...students].sort((a, b) => 
      (parseFloat(marksData[b.name]?.[lastTest.id]) || 0) - (parseFloat(marksData[a.name]?.[lastTest.id]) || 0)
    ).slice(0, 3);

    const message = `🏆 *TOP 3 ACHIEVERS* %0A*Subject:* ${selectedSubject} %0A*Class:* ${selectedClassName} %0A%0A` +
      `🥇 1st: ${sorted[0]?.name || '-'} (${marksData[sorted[0]?.name]?.[lastTest.id] || 0}/${lastTest.max})%0A` +
      `🥈 2nd: ${sorted[1]?.name || '-'} (${marksData[sorted[1]?.name]?.[lastTest.id] || 0}/${lastTest.max})%0A` +
      `🥉 3rd: ${sorted[2]?.name || '-'} (${marksData[sorted[2]?.name]?.[lastTest.id] || 0}/${lastTest.max})`;
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // PDF Generation
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Marksheet: ${selectedSubject} (${selectedClassName})`, 14, 20);
    
    const headers = [['Student Name', ...tests.map(t => t.name)]];
    const body = students.map(s => [
      s.name, 
      ...tests.map(t => marksData[s.name]?.[t.id] || '0')
    ]);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 30,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229] } // Indigo-600
    });

    doc.save(`${selectedSubject}_${selectedClassName}.pdf`);
  };

  // --- VIEW 1: SELECTION SCREEN ---
  if (!selectedClassName || !selectedSubject) {
    return (
      <div className="min-h-screen bg-[#06080f] text-white p-12 font-sans">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-16 border-b border-white/5 pb-8">
            <div>
              <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Marks Portal</p>
              <h2 className="text-2xl font-black uppercase tracking-tight">Select Classroom</h2>
            </div>
          </header>

          <h1 className="text-[10vw] font-black uppercase tracking-tighter text-center mb-20 opacity-10 italic select-none">CLASSROOM</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {dashboardClasses.length > 0 ? dashboardClasses.map((cls, idx) => (
              <div 
                key={idx} 
                onClick={() => setSearchParams({ name: cls.name, sub: cls.sub })}
                className="group bg-[#111622] border border-white/5 p-10 rounded-[40px] cursor-pointer hover:border-indigo-500/50 transition-all active:scale-95"
              >
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 group-hover:text-indigo-400">{cls.sub}</p>
                <h3 className="text-3xl font-black uppercase italic mb-8 tracking-tighter">{cls.name}</h3>
                <div className="flex items-center gap-2 text-indigo-500 text-[10px] font-black uppercase">
                  Enter Marksheet <span className="group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-[40px]">
                <p className="text-slate-600 font-black uppercase text-xs tracking-[0.3em]">No Classes Loaded from Dashboard</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: MARKS ENTRY ---
  return (
    <div className="min-h-screen bg-[#06080f] p-6 md:p-12 text-white font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
          <div>
            <button onClick={() => setSearchParams({})} className="text-indigo-500 font-black text-[10px] uppercase tracking-widest mb-4 hover:opacity-70 transition-all">
              ← Change Class
            </button>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter">
              {selectedSubject} <span className="text-indigo-500 not-italic">/</span> {selectedClassName}
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button onClick={addTest} className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
              + New Test
            </button>
            <button onClick={generatePDF} className="bg-white text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
              Download PDF
            </button>
            <button onClick={sendWhatsAppReport} className="bg-emerald-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20">
              WhatsApp Top 3
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* DATA TABLE */}
          <div className="lg:col-span-2 bg-[#111622] rounded-[45px] border border-white/5 p-8 md:p-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="pb-8 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Student Name</th>
                    {tests.map(t => (
                      <th key={t.id} className="pb-8 text-center text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                        {t.name} <br/>
                        <span className="text-[8px] text-indigo-500/50">Max: {t.max}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.map((s, sIdx) => (
                    <tr key={sIdx} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-6 text-sm font-bold uppercase tracking-tight">{s.name}</td>
                      {tests.map(t => (
                        <td key={t.id} className="py-6 text-center">
                          <input 
                            type="number" 
                            value={marksData[s.name]?.[t.id] || ''}
                            onChange={(e) => updateMark(s.name, t.id, e.target.value)}
                            placeholder="0"
                            className="bg-[#06080f] border border-white/10 w-16 h-12 rounded-xl text-center text-xs font-black outline-none focus:border-indigo-500 transition-all placeholder:text-slate-800" 
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ANALYTICS SIDEBAR */}
          <div className="space-y-8">
            <div className="bg-[#111622] rounded-[45px] border border-white/5 p-10 flex flex-col items-center">
              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mb-12">Performance</h3>
              
              {/* PIE CHART (CSS Circle) */}
              <div className="relative w-52 h-52 rounded-full flex items-center justify-center border-[14px] border-white/5 shadow-inner">
                 <div 
                    className="absolute inset-[-14px] rounded-full border-[14px] border-indigo-600 transition-all duration-1000"
                    style={{ clipPath: `inset(${100 - classAverage}% 0 0 0)` }}
                 ></div>
                 <div className="text-center z-10">
                    <span className="text-5xl font-black italic tracking-tighter">{classAverage}%</span>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Average</p>
                 </div>
              </div>

              <div className="mt-12 w-full grid grid-cols-2 gap-4">
                 <div className="bg-[#06080f] p-5 rounded-3xl border border-white/5 text-center">
                    <p className="text-slate-500 text-[8px] font-black uppercase mb-1">Students</p>
                    <p className="text-xl font-black">{students.length}</p>
                 </div>
                 <div className="bg-[#06080f] p-5 rounded-3xl border border-white/5 text-center">
                    <p className="text-slate-500 text-[8px] font-black uppercase mb-1">Tests</p>
                    <p className="text-xl font-black">{tests.length}</p>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}