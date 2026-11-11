import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp.jsx';
import VendorPanel from './VendorPanel.jsx';
import LoginPage from './LoginPage.jsx';
import AdminLoginPage from './AdminLoginPage.jsx';
import VendorRegisterPage from './VendorRegisterPage.jsx';
import './index.css';

// Intercept all API calls to attach JWT Bearer authorization header automatically
if (typeof window !== 'undefined' && !window.__hipro_fetch_intercepted__) {
  window.__hipro_fetch_intercepted__ = true;
  const originalFetch = window.fetch;
  window.fetch = async function (url, options = {}) {
    const token = localStorage.getItem('hipro_auth_token');
    if (token && typeof url === 'string' && (url.includes('/api/') || url.startsWith('/api'))) {
      const headers = new Headers(options.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      options = { ...options, headers };
    }
    return originalFetch(url, options);
  };
}

// Dedicated Admin Route (isolated from `/` and common `/admin` to prevent brute-force discovery)
const RAW_ADMIN_ROUTE = (import.meta.env.VITE_ADMIN_ROUTE || '/master-console').trim().toLowerCase();
const ADMIN_ROUTE = RAW_ADMIN_ROUTE.startsWith('/')
  ? (RAW_ADMIN_ROUTE.replace(/\/+$/, '') || '/master-console')
  : `/${RAW_ADMIN_ROUTE.replace(/\/+$/, '')}`;

const isAdminRouteMatch = (pathname, hash, search) => {
  const cleanPath = (pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
  const cleanHash = (hash || '').toLowerCase();
  const routeSlug = ADMIN_ROUTE.replace(/^\//, '');
  return (
    cleanPath === ADMIN_ROUTE ||
    cleanHash === `#${routeSlug}` ||
    search.includes(`redirect=${encodeURIComponent(ADMIN_ROUTE)}`) ||
    search.includes(`redirect=${ADMIN_ROUTE}`)
  );
};

function AppRoot() {
  const [authState, setAuthState] = useState(() => {
    if (typeof window === 'undefined') return { isAuthenticated: false, role: null };
    
    const token = localStorage.getItem('hipro_auth_token');
    const savedRole = localStorage.getItem('hipro_user_role');

    if (token && savedRole) {
      return { isAuthenticated: true, role: savedRole };
    }

    return { isAuthenticated: false, role: null };
  });

  // Determine portal by URL: `/` -> Vendor Portal (Default), `/register` -> Vendor Onboarding, `/master-console` -> Dedicated Admin Terminal
  const [targetPortal, setTargetPortal] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();

      if (isAdminRouteMatch(path, hash, search)) {
        if (search.includes('redirect=')) {
          try {
            window.history.replaceState(null, '', ADMIN_ROUTE);
          } catch (e) {}
        }
        return 'admin';
      }

      if (path.includes('/register') || hash.includes('register')) return 'register';
    }
    return 'vendor';
  });

  // Listen for navigation changes (popstate & hashchange)
  React.useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();

      if (isAdminRouteMatch(path, hash, search)) {
        setTargetPortal('admin');
      } else if (path.includes('/register') || hash.includes('register')) {
        setTargetPortal('register');
      } else {
        setTargetPortal('vendor');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigatePortal = (portal) => {
    if (typeof window !== 'undefined') {
      try {
        if (portal === 'register') window.history.pushState(null, '', '/register');
        else if (portal === 'admin') window.history.pushState(null, '', ADMIN_ROUTE);
        else window.history.pushState(null, '', '/');
      } catch (e) {}
    }
    setTargetPortal(portal);
  };

  const handleLoginSuccess = (role, data) => {
    setAuthState({
      isAuthenticated: true,
      role
    });
  };

  const handleLogout = (nextView = 'vendor') => {
    localStorage.removeItem('hipro_auth_token');
    localStorage.removeItem('hipro_user_role');
    localStorage.removeItem('hipro_user');
    localStorage.removeItem('hipro_vendor');
    if (typeof window !== 'undefined') {
      try {
        window.history.replaceState(null, '', nextView === 'admin' ? ADMIN_ROUTE : '/');
      } catch (e) {}
    }
    setAuthState({
      isAuthenticated: false,
      role: null
    });
    setTargetPortal(nextView);
  };

  // Dedicated Admin Route (`/master-console`)
  if (targetPortal === 'admin') {
    if (!authState.isAuthenticated || authState.role !== 'ADMIN') {
      return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
    }
    return (
      <AdminApp
        onSwitchToCustomerApp={() => {
          window.location.href = '/';
        }}
        onSwitchToVendor={() => {
          handleLogout('vendor');
        }}
        onLogout={() => handleLogout('admin')}
      />
    );
  }

  // Root & Vendor Routes (`/`, `/vendor`, `/login`, `/register`)
  if (!authState.isAuthenticated || authState.role !== 'VENDOR') {
    if (targetPortal === 'register') {
      return (
        <VendorRegisterPage
          onRegisterSuccess={handleLoginSuccess}
          onSwitchToLogin={() => navigatePortal('vendor')}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => navigatePortal('register')}
      />
    );
  }

  // Authenticated: Render Vendor & Operator Portal
  return (
    <VendorPanel
      onLogout={() => handleLogout('vendor')}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);
