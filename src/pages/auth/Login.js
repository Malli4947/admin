import  { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useTheme } from '../../Context/ThemeContext';
import logo from '../../assets/Logo.jpeg';
import './Login.css';
import api from '../../Utils/api';

export default function Login() {
  const { login }           = useAuth();
  const { toggle, isDark }  = useTheme();
  const navigate            = useNavigate();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const CREDS = [
    { label: 'Admin',       email: 'admin@primepro.in', password: 'Admin@123',  role: 'admin',      name: 'Admin', id: 'u3' },
    { label: 'Super Admin', email: 'super@primepro.in', password: 'Super@123',  role: 'superadmin', name: 'Super Admin',   id: 'u4' },
  ];




const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const res = await api.post('/auth/admin/login', {
      email: form.email,
      password: form.password
    });
    localStorage.setItem('pp_admin_token', res.token);
    login(res.token, res.user);
    navigate('/dashboard');
  } catch (err) {
    setError(err.message || 'Login failed');
  }

  setLoading(false);
};

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg__circle login-bg__circle--1" />
        <div className="login-bg__circle login-bg__circle--2" />
        <div className="login-bg__grid" />
      </div>

      <button className="login-theme-btn" onClick={toggle} title="Toggle theme">
        {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>

      <div className="login-wrap">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo__img-wrap">
            <img src={logo} alt="Prime Pro Projects" className="login-logo__img" />
          </div>
          <div className="login-badge">Admin Portal</div>
        </div>

        {/* Card */}
        <div className="login-card card a-up">
          <div className="login-card__header">
            <div className="login-card__header-icon">🔐</div>
            <div>
              <h1 className="login-card__title">Welcome back</h1>
              <p className="login-card__sub">Sign in to your admin dashboard</p>
            </div>
          </div>

          {error && <div className="login-error"><span>⚠️</span> {error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" required className="form-input" placeholder="admin@primepro.in"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" required className="form-input" placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} autoComplete="current-password" />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg login-submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in…</> : '🔐 Sign In to Admin'}
            </button>
          </form>

          <div className="login-demo">
            <p className="login-demo__title">Quick access — click to fill</p>
            <div className="login-demo__cards">
              {CREDS.map(c => (
                <button key={c.email} className="login-demo__card" type="button"
                  onClick={() => setForm({ email: c.email, password: c.password })}>
                  <span className="login-demo__card-role">{c.label}</span>
                  <span className="login-demo__card-email">{c.email}</span>
                  <span className="login-demo__card-pass">{c.password}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="login-footer">© 2025 Prime Pro Projects. All rights reserved.</p>
      </div>
    </div>
  );
}