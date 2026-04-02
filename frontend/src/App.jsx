import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import AdminPage from './pages/AdminPage';
import CharitiesPage from './pages/CharitiesPage';
import DashboardPage from './pages/DashboardPage';
import ErrorPage from './pages/ErrorPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WinnerProofPage from './pages/WinnerProofPage';

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
