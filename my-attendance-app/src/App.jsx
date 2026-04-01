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
import Timetable from './pages/Timetable'; 
import MarksPortal from './pages/MarksPortal';
import Profile from './pages/Profile'; // 1. IMPORT PROFILE PAGE

function App() {
  const [teacherData, setTeacherData] = useState(() => {
    const saved = localStorage.getItem('active_teacher');
    return saved ? JSON.parse(saved) : null;
  });

  const [classes, setClasses] = useState([]);

  // 2. SYNC TEACHER NAME FROM PROFILE ON LOAD
  useEffect(() => {
    if (teacherData?.email) {
      const savedProfile = localStorage.getItem(`profile_v1_${teacherData.email}`);
      if (savedProfile) {
        const profileData = JSON.parse(savedProfile);
        // Update teacherData state if the profile name is different
        if (profileData.name && profileData.name !== teacherData.name) {
          const updatedTeacher = { ...teacherData, name: profileData.name };
          setTeacherData(updatedTeacher);
          localStorage.setItem('active_teacher', JSON.stringify(updatedTeacher));
        }
      }

      const savedClasses = localStorage.getItem(`classes_${teacherData.email}`);
      setClasses(savedClasses ? JSON.parse(savedClasses) : []);
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

  // 3. CALLBACK TO UPDATE TEACHER DATA WHEN PROFILE CHANGES
  const handleUpdateProfile = (updatedProfile) => {
    const updatedTeacher = { ...teacherData, name: updatedProfile.name };
    setTeacherData(updatedTeacher);
    localStorage.setItem('active_teacher', JSON.stringify(updatedTeacher));
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
        {teacherData && <Sidebar teacher={teacherData} onLogout={handleLogout} />}

        <div className={`flex-1 flex flex-col transition-all duration-300 ${teacherData ? 'ml-20' : 'ml-0'}`}>
          {teacherData && <Navbar teacher={teacherData} />}

          <main className="flex-1">
            <Routes>
              <Route path="/login" element={!teacherData ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
              
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
              
              <Route path="/timetable" element={teacherData ? <Timetable teacher={teacherData} /> : <Navigate to="/login" />} />
              <Route path="/marks-portal" element={teacherData ? <MarksPortal teacher={teacherData} /> : <Navigate to="/login" />} />

              {/* 4. ADD PROFILE ROUTE */}
              <Route path="/profile" element={
                teacherData ? (
                  <Profile teacher={teacherData} onUpdateProfile={handleUpdateProfile} />
                ) : <Navigate to="/login" />
              } />

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