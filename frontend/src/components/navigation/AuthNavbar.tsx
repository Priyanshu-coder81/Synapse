import React from 'react';
import { Link } from 'react-router-dom';
import { Hexagon } from 'lucide-react';
import './AuthNavbar.css';

const AuthNavbar: React.FC = () => {
  return (
    <nav className="auth-navbar">
      <Link to="/" className="auth-navbar-brand">
        <Hexagon size={32} className="brand-icon" />
        <span className="brand-text">Synapse</span>
      </Link>
      <div className="auth-navbar-links">
        <Link to="/login" className="nav-btn-secondary">Log In</Link>
        <Link to="/register" className="nav-btn-primary">Sign Up</Link>
      </div>
    </nav>
  );
};

export default AuthNavbar;
