import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AuthNavbar from '../components/navigation/AuthNavbar';
import { toast } from 'sonner';
import './Auth.css';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await axiosClient.post('/auth/register', { email, username, password });
      toast.success('Account created!', { description: 'You can now log in.' });
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed. Username or email might be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <AuthNavbar />
      <div className="auth-container">
        <div className="auth-card">
          <h2>Create an account</h2>
          
          {error && <div className="text-sm text-destructive font-semibold mb-4">{error}</div>}

          <form className="auth-form" onSubmit={handleRegister}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <Input 
                id="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[var(--input-bg)] border-white/5 text-white h-11 placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--brand)]"
              />
            </div>
            
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
              {loading ? 'Creating account...' : 'Continue'}
            </Button>
          </form>
          
          <div className="auth-footer">
            <Link to="/login">Already have an account?</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
