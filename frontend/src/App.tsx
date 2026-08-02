import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { PatientDashboardPage } from './pages/PatientDashboardPage';
import { DoctorAnalysisPage } from './pages/DoctorAnalysisPage';
import { ClinicManagementPage } from './pages/ClinicManagementPage';
import { GlobalAdminPage } from './pages/GlobalAdminPage';
import { NewScreeningPage } from './pages/NewScreeningPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
import { PatientHistoryPage } from './pages/PatientHistoryPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/patient" element={<PatientDashboardPage />} />
          <Route path="/patient/history" element={<PatientHistoryPage />} />
          <Route path="/doctor" element={<DoctorAnalysisPage />} />
          <Route path="/clinic" element={<ClinicManagementPage />} />
          <Route path="/admin" element={<GlobalAdminPage />} />
          <Route path="/upload" element={<NewScreeningPage />} />
          <Route path="/audit" element={<AdminAuditLogsPage />} />
          <Route path="*" element={<Navigate to="/doctor" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
