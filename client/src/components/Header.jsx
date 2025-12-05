import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import './Header.css';

const Header = () => {
  const { user, logout, isAuthenticated, isManager } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <div className="header-content">
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="logo" onClick={closeMenu}>
          <h1>Draft</h1>
        </Link>

        <nav className={`nav ${menuOpen ? 'open' : ''}`}>
          <Link to="/restaurants" className="nav-link" onClick={closeMenu}>
            Restaurants
          </Link>

          {isManager && (
            <Link to="/manager/tabs" className="nav-link" onClick={closeMenu}>
              Tabs
            </Link>
          )}

          {isAuthenticated ? (
            <>
              <Link to="/profile" className="nav-link" onClick={closeMenu}>
                Profile
              </Link>
              <span className="user-greeting">
                Welcome, {user?.first_name}
              </span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={closeMenu}>
                Login
              </Link>
              <Link to="/signup" className="nav-link" onClick={closeMenu}>
                Sign Up
              </Link>
            </>
          )}
        </nav>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
};

export default Header;