import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CharitiesPage from './pages/CharitiesPage';
import WinnerProofPage from './pages/WinnerProofPage';
import AdminPage from './pages/AdminPage';
import ErrorPage from './pages/ErrorPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/charities" element={<CharitiesPage />} />
          <Route path="/winner-proof" element={<WinnerProofPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/billing/success" element={<DashboardPage />} />
          <Route path="*" element={<ErrorPage message="Page not found" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
