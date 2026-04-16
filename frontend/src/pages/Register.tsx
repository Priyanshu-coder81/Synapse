import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import './Auth.css';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await axiosClient.post('/auth/register', { email, username, password });
      // Redirect to login after successful registration
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed. Username or email might be taken.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create an account</h2>
        
        {error && <div style={{ color: 'var(--button-danger)', fontSize: '13px', marginBottom: '16px', fontWeight: 'bold' }}>{error}</div>}

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input 
              id="email"
              type="email" 
              className="text-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
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
            Continue
          </button>
        </form>
        
        <div className="auth-footer">
          <Link to="/login">Already have an account?</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
