import React, { useState } from 'react';
import {
  Shield, Lock, Mail, ArrowRight, Eye, EyeOff,
  ShieldCheck, AlertCircle, CheckCircle2, Server, Terminal
} from 'lucide-react';

const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || 'https://app.hindustanprojects.in');

export default function AdminLoginPage({ onLoginSuccess }) {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleAdminSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    if (!adminEmail.trim()) {
      setError('Please provide your administrator email address');
      return;
    }
    if (!adminPassword.trim()) {
      setError('Please enter your master administrator password');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail.trim(),
          password: adminPassword
        }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('hipro_auth_token', data.token);
        localStorage.setItem('hipro_user_role', 'ADMIN');
        localStorage.setItem('hipro_user', JSON.stringify(data.user));
        setSuccessMsg('Master authentication verified. Initializing Super Admin Console...');
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess('ADMIN', data);
          } else if (typeof window !== 'undefined') {
            window.location.hash = '#admin';
          }
        }, 600);
      } else {
        setError(data.message || 'Access Denied: Invalid administrator credentials.');
      }
    } catch (err) {
      console.error('Admin login network error:', err);
      setError('Authentication server unreachable. Please verify backend is running on port 6000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans antialiased relative selection:bg-blue-600/30">
      {/* Background Subtle Tech Ambient Gradients */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between max-w-4xl mx-auto w-full pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/25 border border-white/10">
            H
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-lg text-white tracking-tight leading-none flex items-center gap-2">
              Hipro Super Admin Console
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                Level 4 Clearance
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Core System Infrastructure & Management Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="hidden sm:inline font-mono text-[11px]">ADMIN-PORTAL</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-black/60">

          {/* Heading */}
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="font-heading font-extrabold text-xl text-white tracking-tight">
              Master Admin Access
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Restricted to authorized system administrators only. All sessions are cryptographically logged.
            </p>
          </div>

          {/* Alert Banners */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Master Administrator Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@hipro.in"
                  className="w-full pl-9 pr-3 py-2.5 text-xs text-white bg-slate-800/80 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 font-medium transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Master Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-xs text-white bg-slate-800/80 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 rounded-xl font-bold text-xs text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)' }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Authenticate Master Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer security tag */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>TLS 1.3 / Master RBAC</span>
            </span>

            <span className="text-slate-400 font-mono text-[10px]">
              IP Protected
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-4xl mx-auto w-full text-center text-xs text-slate-500 pt-4 border-t border-slate-800/60">
        <p>&copy; {new Date().getFullYear()} Hindustan Projects (Hipro). Unauthorized access attempts are monitored and logged.</p>
      </footer>
    </div>
  );
}
