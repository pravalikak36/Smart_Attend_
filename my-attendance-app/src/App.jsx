// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Assignments from './pages/Assignments'; 
import AttendanceHub from './pages/AttendanceHub';
import Attendance from './pages/Attendance';
import Login from './pages/Login'; 
import Timetable from './pages/Timetable'; // IMPORTED TIMETABLE

function App() {
  const [teacherData, setTeacherData] = useState(() => {
    const saved = localStorage.getItem('active_teacher');
    return saved ? JSON.parse(saved) : null;
  });

  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (teacherData?.email) {
      const savedData = localStorage.getItem(`classes_${teacherData.email}`);
      setClasses(savedData ? JSON.parse(savedData) : []);
    }
  }, [teacherData?.email]);

  const handleLogin = (userData) => {
    setTeacherData(userData);
    localStorage.setItem('active_teacher', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setTeacherData(null);
    localStorage.removeItem('active_teacher');
  };

  const addClass = (newClass) => {
    if (!teacherData?.email) return;
    const teacherKey = `classes_${teacherData.email}`;
    const classWithId = { ...newClass, id: Date.now().toString() };
    const updated = [...classes, classWithId];
    setClasses(updated);
    localStorage.setItem(teacherKey, JSON.stringify(updated));
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-[#06080f] selection:bg-indigo-500/30">
        {/* Only show Sidebar if teacher is logged in */}
        {teacherData && <Sidebar onLogout={handleLogout} />}

        <div className={`flex-1 flex flex-col transition-all duration-300 ${teacherData ? 'ml-20' : 'ml-0'}`}>
          {/* Only show Navbar if teacher is logged in */}
          {teacherData && <Navbar teacher={teacherData} />}

          <main className="flex-1">
            <Routes>
              {/* Auth Route */}
              <Route path="/login" element={!teacherData ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                teacherData ? (
                  <Dashboard 
                    teacher={teacherData} 
                    classes={classes} 
                    addClass={addClass} 
                    setClasses={setClasses} 
                    handleLogout={handleLogout} 
                  />
                ) : <Navigate to="/login" />
              } />
              
              <Route path="/assignments" element={teacherData ? <Assignments teacher={teacherData} /> : <Navigate to="/login" />} />
              <Route path="/attendance-hub" element={teacherData ? <AttendanceHub classes={classes} /> : <Navigate to="/login" />} />
              <Route path="/attendance/:classId" element={teacherData ? <Attendance /> : <Navigate to="/login" />} />
              
              {/* TIMETABLE ROUTE ADDED HERE */}
              <Route path="/timetable" element={teacherData ? <Timetable teacher={teacherData} /> : <Navigate to="/login" />} />

              {/* Redirects */}
              <Route path="/" element={<Navigate to={teacherData ? "/dashboard" : "/login"} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;