import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function MarksPortal({ teacher }) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const selectedClassName = searchParams.get('name');
  const selectedSubject = searchParams.get('sub');

  const [dashboardClasses, setDashboardClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [tests, setTests] = useState([{ id: 'test1', name: 'TEST 01', max: 100 }]);
  const [marksData, setMarksData] = useState({});
  const [reportFocus, setReportFocus] = useState('overall');

  useEffect(() => {
    if (teacher?.email) {
      const saved = localStorage.getItem(`classes_${teacher.email}`);
      if (saved) setDashboardClasses(JSON.parse(saved));
    }
  }, [teacher]);

  useEffect(() => {
    if (selectedClassName && selectedSubject) {
      const activeClass = dashboardClasses.find(c => c.name === selectedClassName && c.sub === selectedSubject);
      if (activeClass && activeClass.students) {
        setStudents(activeClass.students.split(', ').map(name => ({ name: name.trim() })));
      }

      const key = `marks_v5_${teacher.email}_${selectedSubject}_${selectedClassName}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const { tests: sTests, marks: sMarks } = JSON.parse(saved);
        setTests(sTests);
        setMarksData(sMarks || {});
      } else {
        setTests([{ id: 'test1', name: 'TEST 01', max: 100 }]);
        setMarksData({});
      }
    }
  }, [selectedClassName, selectedSubject, dashboardClasses, teacher.email]);

  const save = (t, m) => {
    const key = `marks_v5_${teacher.email}_${selectedSubject}_${selectedClassName}`;
    localStorage.setItem(key, JSON.stringify({ tests: t, marks: m }));
  };

  const addTest = () => {
    const next = tests.length > 0 ? Math.max(...tests.map(t => parseInt(t.id.replace('test', '')))) + 1 : 1;
    const updated = [...tests, { id: `test${next}`, name: `TEST 0${next}`, max: 100 }];
    setTests(updated);
    save(updated, marksData);
  };

  const deleteTest = (id) => {
    if (window.confirm("Delete this test and all its marks?")) {
      const updatedTests = tests.filter(t => t.id !== id);
      // Clean up marks data for that test
      const updatedMarks = { ...marksData };
      Object.keys(updatedMarks).forEach(student => {
        delete updatedMarks[student][id];
      });
      
      setTests(updatedTests);
      setMarksData(updatedMarks);
      if (reportFocus === id) setReportFocus('overall');
      save(updatedTests, updatedMarks);
    }
  };

  const updateMax = (id, val) => {
    const updated = tests.map(t => t.id === id ? { ...t, max: val || 0 } : t);
    setTests(updated);
    save(updated, marksData);
  };

  const updateMark = (sName, tId, val) => {
    const updatedMarks = { ...marksData, [sName]: { ...(marksData[sName] || {}), [tId]: val } };
    setMarksData(updatedMarks);
    save(tests, updatedMarks);
  };

  const getPercentage = (studentName, mode) => {
    if (mode === 'overall') {
      let totalObtained = 0, totalMax = 0;
      tests.forEach(t => {
        totalObtained += parseFloat(marksData[studentName]?.[t.id] || 0);
        totalMax += parseFloat(t.max || 0);
      });
      return totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    }
    const score = parseFloat(marksData[studentName]?.[mode] || 0);
    const max = tests.find(t => t.id === mode)?.max || 100;
    return max > 0 ? (score / max) * 100 : 0;
  };

  const classAvg = useMemo(() => {
    if (!students.length || tests.length === 0) return 0;
    const sum = students.reduce((acc, s) => acc + getPercentage(s.name, reportFocus), 0);
    return (sum / students.length).toFixed(1);
  }, [students, tests, marksData, reportFocus]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`${selectedSubject.toUpperCase()} - ${selectedClassName}`, 14, 20);
    autoTable(doc, {
      head: [['STUDENT', ...tests.map(t => t.name), 'AVG %']],
      body: students.map(s => [s.name, ...tests.map(t => marksData[s.name]?.[t.id] || '-'), getPercentage(s.name, 'overall').toFixed(1) + '%']),
      startY: 30,
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save(`${selectedClassName}_Report.pdf`);
  };

  const shareWhatsApp = () => {
    const sorted = [...students].sort((a, b) => getPercentage(b.name, reportFocus) - getPercentage(a.name, reportFocus)).slice(0, 3);
    const msg = `🚀 *RANKING: ${selectedClassName}* %0A1. ${sorted[0]?.name} (${getPercentage(sorted[0]?.name, reportFocus).toFixed(1)}%)%0A2. ${sorted[1]?.name} (${getPercentage(sorted[1]?.name, reportFocus).toFixed(1)}%)%0A3. ${sorted[2]?.name} (${getPercentage(sorted[2]?.name, reportFocus).toFixed(1)}%)`;
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  if (!selectedClassName) {
    return (
      <div className="min-h-screen bg-[#06080f] text-white p-12 flex flex-col items-center justify-start overflow-hidden">
        <div className="w-full max-w-6xl mt-20">
          <div className="text-center mb-16">
             <p className="text-indigo-500 font-black text-xs tracking-[0.6em] uppercase mb-4">Classroom marks portal</p>
             <h2 className="text-6xl font-black uppercase tracking-tighter">Select Classroom</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-h-[65vh] overflow-y-auto pr-4 custom-scrollbar">
            {dashboardClasses.map((cls, i) => (
              <div key={i} onClick={() => setSearchParams({ name: cls.name, sub: cls.sub })}
                className="group bg-white/[0.03] border border-white/5 p-12 rounded-[50px] cursor-pointer hover:bg-indigo-600 transition-all duration-500">
                <span className="text-indigo-400 font-black text-xs tracking-[0.4em] group-hover:text-white/70 uppercase">{cls.sub}</span>
                <h3 className="text-5xl font-black uppercase mt-6 mb-8 tracking-tighter leading-tight">{cls.name}</h3>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest group-hover:text-white">Enter Marksheet →</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080f] text-white p-8 md:p-16 font-sans overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-20 gap-10">
          <div className="space-y-4">
            <button onClick={() => setSearchParams({})} className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400 transition-all border border-white/5">
              ← Switch Class
            </button>
            <h1 className="text-8xl font-black tracking-tighter uppercase leading-none">
              {selectedSubject}<span className="inline-block w-8"></span><span className="text-white/20">{selectedClassName}</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-4 items-center bg-white/[0.02] p-4 rounded-[30px] border border-white/5">
            <select value={reportFocus} onChange={(e) => setReportFocus(e.target.value)}
              className="bg-[#0b0f1a] text-white font-black text-xs uppercase px-8 py-4 rounded-2xl border border-white/10 outline-none cursor-pointer">
              <option value="overall">Cumulative Analysis</option>
              {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button onClick={addTest} className="h-14 px-8 rounded-2xl border border-white/10 text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all">+ Test</button>
            <button onClick={exportPDF} className="h-14 px-8 rounded-2xl bg-indigo-600 text-[10px] font-black uppercase shadow-lg">PDF</button>
            <button onClick={shareWhatsApp} className="h-14 px-8 rounded-2xl bg-emerald-600 text-[10px] font-black uppercase shadow-lg">WhatsApp</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* MARKS TABLE */}
          <div className="lg:col-span-8 bg-white/[0.02] border border-white/5 rounded-[60px] p-10 flex flex-col h-[750px]">
            <div className="overflow-auto custom-scrollbar pr-4">
              <table className="w-full border-separate border-spacing-y-6">
                <thead className="sticky top-0 bg-[#06080f] z-20">
                  <tr>
                    <th className="pb-6 text-left text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">Student Name</th>
                    {tests.map(t => (
                      <th key={t.id} className="pb-6 text-center min-w-[140px] group/th relative">
                        {/* DELETE TEST BUTTON */}
                        <button onClick={() => deleteTest(t.id)} className="absolute -top-2 right-0 text-red-500/40 hover:text-red-500 font-black text-lg p-2 transition-all">×</button>
                        
                        <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">{t.name}</span>
                        <div className="mt-2 flex items-center justify-center gap-1">
                           <span className="text-[10px] font-black text-indigo-500 uppercase">MAX:</span>
                           <input type="number" value={t.max} onChange={(e) => updateMax(t.id, e.target.value)}
                             className="bg-transparent border-none w-12 text-[14px] font-black text-center text-indigo-400 outline-none" />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={i}>
                      <td className="py-4 text-3xl font-black uppercase tracking-tighter text-white/80">
                        {s.name}
                      </td>
                      {tests.map(t => (
                        <td key={t.id} className="text-center">
                          <input type="number" value={marksData[s.name]?.[t.id] || ''}
                            onChange={(e) => updateMark(s.name, t.id, e.target.value)}
                            className="bg-[#0b0f1a] border border-white/5 w-24 h-16 rounded-2xl text-center font-black text-xl focus:border-indigo-500 transition-all"
                            placeholder="-" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        {/* CLASS EFFICIENCY SIDEBAR */}
        <div className="lg:col-span-4 h-[750px] flex flex-col gap-6">
        <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-[48px] p-10 flex flex-col items-center justify-between relative overflow-hidden backdrop-blur-xl shadow-2xl">
            {/* Subtle Background Glow to add depth */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px]" />
            
            <div className="w-full text-left">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-400 mb-2">Metrics Analysis</h3>
            <h2 className="text-2xl font-extrabold uppercase tracking-tight text-white">Efficiency</h2>
            </div>

            {/* REFINED PROGRESS RING (Non-childish version) */}
            <div className="relative inline-flex items-center justify-center">
            <svg className="w-64 h-64 transform -rotate-90">
                <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/[0.05]" />
                <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={691} 
                strokeDashoffset={691 - (691 * Math.min(classAvg, 100)) / 100}
                className="text-indigo-500 transition-all duration-1000 ease-in-out" 
                strokeLinecap="round" 
                style={{ filter: 'drop-shadow(0 0 12px rgba(99, 102, 241, 0.4))' }}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-7xl font-extrabold tracking-tighter text-white leading-none">{classAvg}%</span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/30 mt-4">Avg Score</span>
            </div>
            </div>

            {/* REFINED SCOPE BADGE */}
            <div className="w-full bg-white/[0.05] border border-white/5 p-6 rounded-[30px] flex items-center justify-between">
            <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-1">Current Scope</p>
                <p className="text-sm font-bold text-indigo-400 uppercase tracking-wide">
                {reportFocus === 'overall' ? 'Total Cumulative' : reportFocus}
                </p>
            </div>
            <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-pulse" />
            </div>
        </div>

        {/* BOTTOM QUICK STATS (To balance the height) */}
        <div className="bg-indigo-600 rounded-[40px] p-8 flex items-center justify-between shadow-xl shadow-indigo-900/20">
            <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Students</p>
                <p className="text-3xl font-extrabold text-white">{students.length}</p>
            </div>
            <div className="h-10 w-[1px] bg-white/20" />
            <div className="text-right">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Tests</p>
                <p className="text-3xl font-extrabold text-white">{tests.length}</p>
            </div>
        </div>
        </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
      `}} />
        </div>
      </div>
    </div>
  );
}