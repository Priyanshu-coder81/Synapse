import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/useAuthStore';
import AuthNavbar from '../components/navigation/AuthNavbar';
import './Auth.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await axiosClient.post('/auth/login', { username, password });
      
      const { accessToken, refreshToken, userId } = res.data;
      setAuth(username, userId || username, accessToken, refreshToken);
      
      navigate('/channels/@me');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid username or password.');
    }
  };

  return (
    <div className="auth-wrapper">
      <AuthNavbar />
      <div className="auth-container">
        <div className="auth-card">
          <h2>Welcome back!</h2>
          <p className="subtitle">We're so excited to see you again!</p>
          
          {error && <div style={{ color: 'var(--button-danger)', fontSize: '13px', marginBottom: '16px', fontWeight: 'bold' }}>{error}</div>}
          
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
    </div>
  );
};

export default Login;
