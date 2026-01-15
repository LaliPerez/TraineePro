
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeTraining from './pages/EmployeeTraining';
import { Company, Training, Assignment, Attendance, Instructor } from './types';

const App: React.FC = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('trainerpro_admin_auth') === 'true';
  });

  const [instructor, setInstructor] = useState<Instructor | null>(() => {
    const saved = localStorage.getItem('trainerpro_instructor');
    return saved ? JSON.parse(saved) : null;
  });

  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem('trainerpro_companies');
    return saved ? JSON.parse(saved) : [];
  });

  const [trainings, setTrainings] = useState<Training[]>(() => {
    const saved = localStorage.getItem('trainerpro_trainings');
    return saved ? JSON.parse(saved) : [];
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('trainerpro_assignments');
    return saved ? JSON.parse(saved) : [];
  });

  const [attendances, setAttendances] = useState<Attendance[]>(() => {
    const saved = localStorage.getItem('trainerpro_attendances');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('trainerpro_instructor', JSON.stringify(instructor));
    localStorage.setItem('trainerpro_companies', JSON.stringify(companies));
    localStorage.setItem('trainerpro_trainings', JSON.stringify(trainings));
    localStorage.setItem('trainerpro_assignments', JSON.stringify(assignments));
    localStorage.setItem('trainerpro_attendances', JSON.stringify(attendances));
  }, [instructor, companies, trainings, assignments, attendances]);

  const loginAdmin = (remember: boolean) => {
    setIsAdminAuthenticated(true);
    if (remember) {
      localStorage.setItem('trainerpro_admin_auth', 'true');
    }
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('trainerpro_admin_auth');
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors duration-300">
        <Routes>
          <Route 
            path="/login" 
            element={isAdminAuthenticated ? <Navigate to="/dashboard" /> : <AdminLogin onLogin={loginAdmin} />} 
          />
          <Route 
            path="/dashboard/*" 
            element={
              isAdminAuthenticated ? (
                <AdminDashboard 
                  instructor={instructor}
                  setInstructor={setInstructor}
                  companies={companies}
                  setCompanies={setCompanies}
                  trainings={trainings}
                  setTrainings={setTrainings}
                  assignments={assignments}
                  setAssignments={setAssignments}
                  attendances={attendances}
                  setAttendances={setAttendances}
                  onLogout={logoutAdmin}
                />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/training/:trainingId/:companyId" 
            element={
              <EmployeeTraining 
                trainings={trainings}
                companies={companies}
                instructor={instructor}
                onComplete={(attendance) => setAttendances(prev => [...prev, attendance])}
              />
            } 
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
