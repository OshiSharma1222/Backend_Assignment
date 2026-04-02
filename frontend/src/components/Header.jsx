import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header>
      <div className="shell">
        <nav className="nav-wrap">
          <Link to="/" className="brand" onClick={handleNavClick}>GolfCharity</Link>
          
          <button 
            className={`menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
            {user ? (
              <>
                <span style={{ padding: '12px' }}>Hi, {user.full_name.split(' ')[0]}</span>
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={handleNavClick}>Admin</Link>
                )}
                <Link to="/dashboard" onClick={handleNavClick}>Dashboard</Link>
                <Link to="/charities" onClick={handleNavClick}>Charities</Link>
                <button onClick={handleLogout} className="ghost">Logout</button>
              </>
            ) : (
              <>
                <Link to="/" onClick={handleNavClick}>Home</Link>
                <Link to="/charities" onClick={handleNavClick}>Charities</Link>
                <Link to="/login" className="btn" onClick={handleNavClick}>Login</Link>
                <Link to="/register" className="ghost" onClick={handleNavClick}>Register</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
