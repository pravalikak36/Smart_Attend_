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
        setStudents(activeClass.students.split(',').map(name => ({ name: name.trim() })));
      }

      const key = `marks_v5_${teacher.email}_${selectedSubject}_${selectedClassName}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const { tests: sTests, marks: sMarks } = JSON.parse(saved);
        setTests(sTests || [{ id: 'test1', name: 'TEST 01', max: 100 }]);
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
    const next = tests.length > 0 ? Math.max(...tests.map(t => parseInt(t.id.replace('test', '')) || 0)) + 1 : 1;
    const updated = [...tests, { id: `test${next}`, name: `TEST 0${next}`, max: 100 }];
    setTests(updated);
    save(updated, marksData);
  };

  const deleteTest = (id) => {
    if (window.confirm("Delete this test?")) {
      const updatedTests = tests.filter(t => t.id !== id);
      const updatedMarks = { ...marksData };
      Object.keys(updatedMarks).forEach(s => { if (updatedMarks[s]) delete updatedMarks[s][id]; });
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

  const topRankers = useMemo(() => {
    return [...students]
      .map(s => ({ name: s.name, pct: getPercentage(s.name, reportFocus) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  }, [students, marksData, reportFocus, tests]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`${selectedSubject?.toUpperCase()} - ${selectedClassName}`, 14, 20);
    autoTable(doc, {
      head: [['STUDENT', ...tests.map(t => t.name), 'AVG %']],
      body: students.map(s => [s.name, ...tests.map(t => marksData[s.name]?.[t.id] || '-'), getPercentage(s.name, 'overall').toFixed(1) + '%']),
      startY: 30,
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save(`${selectedClassName}_Report.pdf`);
  };

  const shareWhatsApp = () => {
    const msg = `🚀 *RANKING: ${selectedClassName} (${reportFocus === 'overall' ? 'Cumulative' : reportFocus})*%0A1. ${topRankers[0]?.name} (${topRankers[0]?.pct.toFixed(1)}%)%0A2. ${topRankers[1]?.name} (${topRankers[1]?.pct.toFixed(1)}%)%0A3. ${topRankers[2]?.name} (${topRankers[2]?.pct.toFixed(1)}%)`;
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  if (!selectedClassName) {
    return (
      <div className="min-h-screen bg-[#06080f] text-slate-200 p-6 md:p-12 font-sans">
        <div className="max-w-5xl mx-auto">
          <header className="mb-16">
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic">Select Class</h1>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardClasses.map((cls, i) => (
              <div key={i} onClick={() => setSearchParams({ name: cls.name, sub: cls.sub })}
                className="group bg-[#111622] border border-white/5 p-8 rounded-[35px] cursor-pointer hover:border-indigo-500/50 transition-all duration-300">
                <p className="text-indigo-400 font-black text-[10px] tracking-[0.3em] uppercase mb-4">{cls.sub}</p>
                <h3 className="text-2xl font-black text-white uppercase group-hover:text-indigo-400">{cls.name}</h3>
                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-6">
                   <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{cls.students?.split(',').length || 0} Students</span>
                   <div className="text-white">→</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080f] text-white p-6 md:p-12 font-sans">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-16 gap-10">
          <div>
            <button onClick={() => setSearchParams({})} className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400 transition-all mb-6 border border-white/5">← Switch Class</button>
            <h1 className="text-6xl font-black tracking-tighter uppercase">{selectedSubject} <span className="text-white/20">{selectedClassName}</span></h1>
          </div>
          <div className="flex flex-wrap gap-4 bg-white/[0.02] p-4 rounded-[30px] border border-white/5 items-center">
            <select value={reportFocus} onChange={(e) => setReportFocus(e.target.value)}
              className="bg-[#0b0f1a] text-white font-black text-xs uppercase px-6 py-4 rounded-2xl border border-white/10 outline-none">
              <option value="overall">Cumulative Analysis</option>
              {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button onClick={addTest} className="h-14 px-8 rounded-2xl border border-white/10 text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all">+ Test</button>
            <button onClick={exportPDF} className="h-14 px-8 rounded-2xl bg-indigo-600 text-[10px] font-black uppercase shadow-lg">PDF</button>
            <button onClick={shareWhatsApp} className="h-14 px-8 rounded-2xl bg-emerald-600 text-[10px] font-black uppercase shadow-lg">WhatsApp</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* MAIN TABLE */}
          <div className="lg:col-span-8 bg-white/[0.02] border border-white/5 rounded-[50px] p-8 h-[800px] flex flex-col">
            <div className="overflow-auto custom-scrollbar flex-1">
              <table className="w-full border-separate border-spacing-y-4">
                <thead className="sticky top-0 bg-[#06080f] z-20">
                  <tr>
                    <th className="pb-4 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">Student</th>
                    {tests.map(t => (
                      <th key={t.id} className="pb-4 text-center min-w-[120px] relative group">
                        <button onClick={() => deleteTest(t.id)} className="absolute -top-1 right-0 text-red-500/30 hover:text-red-500 text-lg">×</button>
                        <span className="text-[10px] font-black text-white/40 uppercase">{t.name}</span>
                        <input type="number" value={t.max} onChange={(e) => updateMax(t.id, e.target.value)}
                          className="block mx-auto bg-transparent border-none w-12 text-[12px] font-black text-indigo-400 text-center outline-none" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={i}>
                      <td className="text-2xl font-black uppercase tracking-tighter text-white/80">{s.name}</td>
                      {tests.map(t => (
                        <td key={t.id} className="text-center">
                          <input type="number" value={marksData[s.name]?.[t.id] || ''}
                            onChange={(e) => updateMark(s.name, t.id, e.target.value)}
                            className="bg-[#0b0f1a] border border-white/5 w-20 h-14 rounded-xl text-center font-black text-lg focus:border-indigo-500 transition-all outline-none" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-[800px]">
            {/* PIE CHART SECTION */}
            <div className="flex-[1.4] bg-white/[0.03] border border-white/10 rounded-[50px] p-10 flex flex-col items-center justify-start pt-12 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-10 left-10 text-left">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Analytics</h3>
                <h2 className="text-xl font-black uppercase text-white">Efficiency</h2>
              </div>
              
              <div className="relative flex items-center justify-center mt-6">
                <svg className="w-56 h-56 transform -rotate-90">
                  <circle cx="112" cy="112" r="95" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                  <circle cx="112" cy="112" r="95" stroke="currentColor" strokeWidth="10" fill="transparent" 
                    strokeDasharray={597} strokeDashoffset={597 - (597 * Math.min(classAvg, 100)) / 100}
                    className="text-indigo-500 transition-all duration-1000 ease-out" strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-white tracking-tighter leading-none">{classAvg}%</span>
                  <p className="text-[8px] font-black uppercase text-white/20 tracking-[0.3em] mt-1">Class Avg</p>
                </div>
              </div>
            </div>

            {/* LEADERBOARD */}
            <div className="flex-1 bg-[#111622] border border-white/5 rounded-[45px] p-8 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Leaderboard</h3>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full font-black uppercase">
                  {reportFocus === 'overall' ? 'Total' : reportFocus}
                </span>
              </div>
              <div className="space-y-3">
                {topRankers.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/[0.03] p-4 rounded-2xl border border-white/5 hover:bg-indigo-600 group transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black 
                        ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-slate-300 text-black' : 'bg-orange-700 text-white'}`}>
                        {idx + 1}
                      </div>
                      <span className="text-sm font-black uppercase tracking-tight group-hover:text-white">{r.name || '---'}</span>
                    </div>
                    <span className="text-sm font-black text-indigo-400 group-hover:text-white">{r.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK STATS */}
            <div className="bg-indigo-600 rounded-[35px] py-6 flex items-center justify-around shadow-xl shadow-indigo-900/20">
              <div className="text-center">
                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Students</p>
                <p className="text-3xl font-black">{students.length}</p>
              </div>
              <div className="w-[1px] h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Tests</p>
                <p className="text-3xl font-black">{tests.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
      `}} />
    </div>
  );
}