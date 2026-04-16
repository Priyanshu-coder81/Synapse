import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login for now
    console.log('Logging in...', { username, password });
    navigate('/');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome back!</h2>
        <p className="subtitle">We're so excited to see you again!</p>
        
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input 
              id="username"
              type="text" 
              className="text-input" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              className="text-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
            Log In
          </button>
        </form>
        
        <div className="auth-footer">
          Need an account? 
          <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
