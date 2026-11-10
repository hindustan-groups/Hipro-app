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

  // Determine portal by URL: /admin (Admin Terminal), /register (Vendor Onboarding), /login or /vendor (Vendor Portal)
  const [targetPortal, setTargetPortal] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();

      // If user navigated or was redirected with admin query
      if (search.includes('redirect=%2fadmin') || search.includes('redirect=/admin')) {
        try {
          window.history.replaceState(null, '', '/admin');
        } catch (e) {}
        return 'admin';
      }

      if (path.includes('/register') || hash.includes('register')) return 'register';
      if (path.includes('/admin') || hash.includes('admin')) return 'admin';
      if (path.includes('/vendor') || path.includes('/partner') || path.includes('/login')) return 'vendor';
    }
    return 'admin';
  });

  // Listen for navigation changes (popstate & hashchange)
  React.useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();

      if (search.includes('redirect=%2fadmin') || search.includes('redirect=/admin') || path.includes('/admin') || hash.includes('admin')) {
        setTargetPortal('admin');
      } else if (path.includes('/register') || hash.includes('register')) {
        setTargetPortal('register');
      } else if (path.includes('/vendor') || path.includes('/partner') || path.includes('/login')) {
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

  const handleLoginSuccess = (role, data) => {
    setAuthState({
      isAuthenticated: true,
      role
    });
  };

  const handleLogout = (nextView = 'admin') => {
    localStorage.removeItem('hipro_auth_token');
    localStorage.removeItem('hipro_user_role');
    localStorage.removeItem('hipro_user');
    localStorage.removeItem('hipro_vendor');
    window.location.hash = '';
    setAuthState({
      isAuthenticated: false,
      role: null
    });
    setTargetPortal(nextView);
  };

  // Unauthenticated routing:
  // 1. /admin URL -> Dedicated Master Admin Terminal (AdminLoginPage)
  // 2. /register URL -> Dedicated Vendor Onboarding (VendorRegisterPage)
  // 3. /login or /vendor -> Pure Vendor Login (LoginPage)
  if (!authState.isAuthenticated) {
    if (targetPortal === 'admin') {
      return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
    }
    if (targetPortal === 'register') {
      return (
        <VendorRegisterPage
          onRegisterSuccess={handleLoginSuccess}
          onSwitchToLogin={() => setTargetPortal('vendor')}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setTargetPortal('register')}
      />
    );
  }

  // Authenticated: Render Vendor & Operator Portal
  if (authState.role === 'VENDOR') {
    return (
      <VendorPanel
        onSwitchToSuperAdmin={() => {
          handleLogout('admin');
        }}
        onLogout={() => handleLogout('vendor')}
      />
    );
  }

  // Authenticated: Render Super Admin Console
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);
