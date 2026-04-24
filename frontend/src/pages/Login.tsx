import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/useAuthStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AuthNavbar from '../components/navigation/AuthNavbar';
import { toast } from 'sonner';
import './Auth.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await axiosClient.post('/auth/login', { username, password });
      
      const { accessToken, refreshToken, userId, email } = res.data;
      setAuth(username, userId || username, accessToken, refreshToken, email || '');
      
      toast.success(`Welcome back, ${username}!`);
      navigate('/channels/@me');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <AuthNavbar />
      <div className="auth-container">
        <div className="auth-card">
          <h2>Welcome back!</h2>
          <p className="subtitle">We're so excited to see you again!</p>
          
          {error && <div className="text-sm text-destructive font-semibold mb-4">{error}</div>}
          
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <Input 
                id="username"
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-[var(--input-bg)] border-white/5 text-white h-11 placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--brand)]"
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <Input 
                id="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[var(--input-bg)] border-white/5 text-white h-11 placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--brand)]"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-11 mt-2 bg-gradient-to-r from-[var(--brand)] to-[#7c6cf0] text-white font-semibold text-base hover:shadow-[0_0_20px_rgba(88,101,242,0.3)] hover:-translate-y-0.5 transition-all"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
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
