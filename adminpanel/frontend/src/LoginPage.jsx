import React, { useState } from 'react';
import {
  HardHat, Lock, Phone, ArrowRight,
  Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2,
  Compass, Wrench, ChevronDown, UserPlus, LogIn
} from 'lucide-react';

const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || 'https://app.hindustanprojects.in');

export default function LoginPage({ onLoginSuccess, onSwitchToRegister }) {
  // Vendor category selection: 'Adventure' vs 'Services'
  const [vendorCategory, setVendorCategory] = useState('Adventure');

  // Vendor login form states
  const [vendorContact, setVendorContact] = useState('');
  const [vendorPasscode, setVendorPasscode] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleLoginComplete = (role, data) => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        if (redirect && redirect.startsWith('/')) {
          window.history.replaceState(null, '', redirect);
        }
      } catch (e) {
        // ignore url parsing errors
      }
    }
    if (onLoginSuccess) onLoginSuccess(role, data);
  };

  const handleVendorLogin = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    if (!vendorContact.trim()) {
      setError('Please enter your registered mobile number or email.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/vendor/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: vendorContact.trim(),
          email: vendorContact.trim(),
          passcode: vendorPasscode.trim(),
          category: vendorCategory
        }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('hipro_auth_token', data.token);
        localStorage.setItem('hipro_user_role', 'VENDOR');
        localStorage.setItem('hipro_vendor', JSON.stringify(data.vendor));
        setSuccessMsg(`Welcome, ${data.vendor?.businessName || data.vendor?.name}! Opening ${data.vendor?.category || vendorCategory} portal...`);
        setTimeout(() => {
          handleLoginComplete('VENDOR', data);
        }, 500);
      } else {
        setError(data.message || 'Access Denied: Unregistered contact or invalid credentials.');
      }
    } catch (err) {
      console.error('Vendor login error:', err);
      setError('Connection failed: Unable to reach authentication server. Please ensure server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans antialiased relative overflow-hidden select-none">
      {/* Background Subtle Accent Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between max-w-4xl mx-auto w-full pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-red-500/20 border border-white/10">
            H
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-lg text-white tracking-tight leading-none flex items-center gap-2">
              Hipro Partner Access
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                Encrypted Portal
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Service & Adventure Operator Gateway</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Verified Partner Access Active</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 max-w-md mx-auto w-full my-auto py-6">
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-2xl shadow-black/40">

          {/* Heading */}
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-red-500/10 border border-red-500/20 text-red-500">
              <HardHat className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">
              Vendor & Operator Login
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sign in to manage your bookings, quotes, and customer requests.
            </p>
          </div>

          {/* Category Dropdown */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Partner Category *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {vendorCategory === 'Adventure' ? (
                  <Compass className="w-4 h-4 text-red-500" />
                ) : (
                  <Wrench className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <select
                value={vendorCategory}
                onChange={(e) => {
                  setVendorCategory(e.target.value);
                  setError(null);
                }}
                className="w-full pl-9 pr-8 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-bold transition-all appearance-none cursor-pointer"
              >
                <option value="Adventure">🏔️ Adventure & Tourism Operator (Safari, Paragliding, Raft)</option>
                <option value="Services">🛠️ Home & Construction Services (Civil, Waterproof, Paint)</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Status Alert Banners */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VENDOR SIGN IN FORM */}
          <form onSubmit={handleVendorLogin} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Registered Mobile Number or Email *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={vendorContact}
                  onChange={(e) => setVendorContact(e.target.value)}
                  placeholder="e.g. +91 98290 88801 or partner@hipro.in"
                  className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Security PIN / Passcode
                </label>
                <span className="text-[10px] text-slate-400">Required: 4-6 digits</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={vendorPasscode}
                  onChange={(e) => setVendorPasscode(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 rounded-xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #DC2626 0%, #BE123C 100%)', boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)' }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Access {vendorCategory} Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-4">
              <button
                type="button"
                onClick={() => {
                  if (onSwitchToRegister) {
                    onSwitchToRegister();
                  } else if (typeof window !== 'undefined') {
                    window.location.hash = '#register';
                  }
                }}
                className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold flex items-center justify-center gap-1.5 mx-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New operator or contractor? Register here →</span>
              </button>
            </div>
          </form>

          {/* Footer status inside card */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>TLS 1.3 / Strict RBAC</span>
            </span>

            <span className="text-slate-400 font-mono text-[10px]">
              {vendorCategory} Portal
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-4xl mx-auto w-full text-center text-xs text-slate-500 pt-4">
        <p>&copy; {new Date().getFullYear()} Hindustan Projects (Hipro). Unauthorized access attempts are monitored and logged.</p>
      </footer>
    </div>
  );
}
