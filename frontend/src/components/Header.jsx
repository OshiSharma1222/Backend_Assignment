import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="shell">
      <nav className="nav-wrap">
        <Link to="/" className="brand">GolfCharity</Link>
        <div className="nav-links">
          {user ? (
            <>
              <span>Hi, {user.full_name}</span>
              {user.role === 'admin' && <Link to="/admin">Admin</Link>}
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/charities">Charities</Link>
              <button onClick={handleLogout} className="ghost">Logout</button>
            </>
          ) : (
            <>
              <Link to="/">Home</Link>
              <Link to="/charities">Charities</Link>
              <Link to="/login" className="btn">Login</Link>
              <Link to="/register" className="ghost">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
