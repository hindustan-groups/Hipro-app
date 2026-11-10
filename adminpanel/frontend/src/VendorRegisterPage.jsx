import React, { useState, useEffect } from 'react';
import {
  Compass, Wrench, Phone, Mail, Building2, User,
  Lock, MapPin, Briefcase, ArrowRight, ShieldCheck,
  AlertCircle, CheckCircle2, ChevronRight, Sparkles,
  Award, Clock, Check, ChevronDown, Layers
} from 'lucide-react';

const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || 'https://app.hindustanprojects.in');

export default function VendorRegisterPage({ onRegisterSuccess, onSwitchToLogin }) {
  // Category Dropdown Selection: 'Adventure' vs 'Services'
  const [category, setCategory] = useState('Adventure');

  // Dynamic reference data (fetched from backend API — live All-India States & Cities)
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('');
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [specializations, setSpecializations] = useState([]);

  // Form Fields
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [customSpecialization, setCustomSpecialization] = useState('');
  const [experience, setExperience] = useState('3-5 Years');
  const [capacity, setCapacity] = useState('SMALL');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');

  // Document verification fields
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarFile, setAadhaarFile] = useState(null); // { file, preview, base64 }
  const [panNumber, setPanNumber] = useState('');
  const [panFile, setPanFile] = useState(null); // { file, preview, base64 }
  const [bankPassbookFile, setBankPassbookFile] = useState(null); // { file, preview, base64 }

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Fetch dynamic Indian states and specialization suggestions from the backend API
  useEffect(() => {
    let cancelled = false;
    const loadReferenceData = async () => {
      try {
        setStatesLoading(true);
        // Live Indian States & UTs API
        const statesRes = await fetch(`${API_BASE}/api/v1/locations/india/states`);
        const statesData = await statesRes.json();
        if (statesData.success && Array.isArray(statesData.states)) {
          if (!cancelled) setStates(statesData.states.map(s => s.name || s));
        }
      } catch (e) {
        console.warn('Failed to fetch Indian states from API:', e);
      } finally {
        if (!cancelled) setStatesLoading(false);
      }

      try {
        // Dynamic specialization suggestions from registered vendors
        const vendorsRes = await fetch(`${API_BASE}/api/v1/vendors`);
        const vendorsData = await vendorsRes.json();
        if (vendorsData.success && Array.isArray(vendorsData.vendors)) {
          const specs = [...new Set(vendorsData.vendors.map(v => v.specialization).filter(Boolean))];
          if (!cancelled) setSpecializations(specs);
        }
      } catch (e) {
        console.warn('Failed to fetch specializations:', e);
      }
    };
    loadReferenceData();
    return () => { cancelled = true; };
  }, []);

  // Fetch dynamic cities whenever the selected Indian State changes
  useEffect(() => {
    if (!selectedState) {
      setCities([]);
      setCity('');
      setCustomCity('');
      return;
    }

    let cancelled = false;
    const loadCitiesForState = async () => {
      try {
        setCitiesLoading(true);
        const res = await fetch(`${API_BASE}/api/v1/locations/india/cities?state=${encodeURIComponent(selectedState)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.cities)) {
          if (!cancelled) {
            setCities(data.cities);
            setCity('');
            setCustomCity('');
          }
        }
      } catch (e) {
        console.warn('Failed to fetch cities for state:', selectedState, e);
      } finally {
        if (!cancelled) setCitiesLoading(false);
      }
    };

    loadCitiesForState();
    return () => { cancelled = true; };
  }, [selectedState]);

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    setSpecialization('');
    setCustomSpecialization('');
  };

  // Convert a file to base64 data URL
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleDocumentChange = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file type (images and PDF)
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setError('Only JPG, PNG, WebP images and PDF files are allowed for documents.');
      return;
    }
    // Max 5 MB per document
    if (file.size > 5 * 1024 * 1024) {
      setError('Each document must be under 5 MB.');
      return;
    }
    const base64 = await fileToBase64(file);
    const preview = URL.createObjectURL(file);
    setError(null);
    if (field === 'aadhaar') {
      setAadhaarFile({ file, preview, base64 });
    } else if (field === 'pan') {
      setPanFile({ file, preview, base64 });
    } else if (field === 'bank') {
      setBankPassbookFile({ file, preview, base64 });
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter contact person name');
      return;
    }
    if (!businessName.trim()) {
      setError('Please enter your registered agency or business name');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your mobile phone number');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile number');
      return;
    }

    // State: must be selected from All-India states
    if (!selectedState.trim()) {
      setError('Please select your state in India');
      return;
    }

    // City: must be selected from state cities or entered as custom
    const finalCity = customCity.trim() || city.trim();
    if (!finalCity) {
      setError('Please select or specify your operational city');
      return;
    }

    // Specialization: selected from dynamic suggestions or custom free text
    const finalSpecialization = customSpecialization.trim() || specialization.trim();
    if (!finalSpecialization) {
      setError('Please select or enter your specialization');
      return;
    }

    // Security PIN is mandatory: 4-6 digits
    if (!passcode.trim()) {
      setError('Security PIN is required');
      return;
    }
    if (passcode.trim().length < 4 || passcode.trim().length > 6) {
      setError('Security PIN must be between 4 and 6 digits');
      return;
    }
    if (!/^\d+$/.test(passcode.trim())) {
      setError('Security PIN must contain only digits');
      return;
    }
    if (confirmPasscode.trim() && passcode.trim() !== confirmPasscode.trim()) {
      setError('Security PIN and Confirm PIN do not match');
      return;
    }

    // Aadhaar validation (12 digits) if provided
    const cleanAadhaar = aadhaarNumber.replace(/\s/g, '');
    if (cleanAadhaar && !/^\d{12}$/.test(cleanAadhaar)) {
      setError('Aadhaar number must be exactly 12 digits');
      return;
    }

    // PAN validation if provided
    const cleanPan = panNumber.trim().toUpperCase();
    if (cleanPan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      setError('Invalid PAN number format');
      return;
    }

    // Document uploads are optional — no validation required

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/vendor/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          businessName: businessName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          state: selectedState.trim(),
          city: finalCity,
          category,
          specialization: finalSpecialization,
          experience,
          capacity,
          passcode: passcode.trim(),
          aadhaarNumber: cleanAadhaar || undefined,
          panNumber: cleanPan || undefined,
          aadhaarFile: aadhaarFile?.base64 || undefined,
          panFile: panFile?.base64 || undefined,
          bankPassbookFile: bankPassbookFile?.base64 || undefined
        }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('hipro_auth_token', data.token);
        localStorage.setItem('hipro_user_role', 'VENDOR');
        localStorage.setItem('hipro_vendor', JSON.stringify(data.vendor));
        setSuccessMsg(`Welcome to Hipro! ${data.vendor?.businessName} registered successfully. Opening your dashboard...`);
        setTimeout(() => {
          if (onRegisterSuccess) {
            onRegisterSuccess('VENDOR', data);
          } else if (typeof window !== 'undefined') {
            window.location.hash = '#vendor';
          }
        }, 800);
      } else {
        setError(data.message || 'Registration failed. Please review your details and try again.');
      }
    } catch (err) {
      console.error('Registration network error:', err);
      setError('Unable to reach server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans antialiased relative selection:bg-red-500/30 selection:text-white">
      {/* Subtle Background Lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between max-w-4xl mx-auto w-full pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-red-500/25 border border-white/10">
            H
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-lg sm:text-xl text-white tracking-tight flex items-center gap-2">
              Hipro Partner Onboarding
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold border border-red-500/20">
                Partner Network
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Verified Vendor & Adventure Operator Registration</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 transition-all flex items-center gap-1.5"
        >
          <span>Existing Partner? Login</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Main Registration Card */}
      <main className="relative z-10 max-w-3xl mx-auto w-full my-8">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-2xl shadow-black/50">

          {/* Heading */}
          <div className="mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Grow Your Bookings & Revenue with Hipro</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
              Register as a Hipro Partner
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Select your category from the dropdown, fill in your business details, and receive verified customer leads and direct bookings.
            </p>
          </div>

          {/* Alert Banners */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* REGISTRATION FORM */}
          <form onSubmit={handleSubmit} noValidate className="space-y-6">

            {/* STEP 1: CATEGORY SELECTION DROPDOWN */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Step 1: Partner Category (Select from Dropdown) *
              </label>

              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  {category === 'Adventure' ? (
                    <Compass className="w-5 h-5 text-red-500" />
                  ) : (
                    <Wrench className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-bold transition-all appearance-none cursor-pointer shadow-xs"
                >
                  <option value="Adventure">🏔️ Adventure & Tourism Operator (Paragliding, Safari, River Rafting, Trekking)</option>
                  <option value="Services">🛠️ Home & Construction Contractor (Civil Work, Waterproofing, Painting, Interior)</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className={`w-2 h-2 rounded-full ${category === 'Adventure' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                <span>
                  {category === 'Adventure'
                    ? 'Targeted for adventure sports, flight operators, desert camps, and trekking expedition leaders.'
                    : 'Targeted for civil builders, waterproofing specialists, painters, and interior remodeling contractors.'}
                </span>
              </div>
            </div>

            {/* STEP 2: BUSINESS & CONTACT DETAILS */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                Step 2: Business & Contact Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact Person Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Contact Person Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Captain Arvind Negi"
                      className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Business / Operator Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Business / Agency Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder={category === 'Adventure' ? 'e.g. Himalayan Sky Gliders' : 'e.g. Shree Ram Waterproofing & Civil'}
                      className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mobile Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98290 88801"
                      className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all"
                      required
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Used as your partner login ID.</span>
                </div>

                {/* Business Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@agency.com"
                      className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">For receiving quotation updates.</span>
                </div>
              </div>
            </div>

            {/* STEP 3: OPERATING LOCATION (ALL-INDIA STATE & CITY API) & SPECIALIZATION */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Step 3: Operating Location (All-India Coverage) & Trade Specialization
                </label>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Pan-India Vendor Network</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Indian State Selection (Dynamic API) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    State (India) *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Indian State...</option>
                      {statesLoading ? (
                        <option disabled>Loading states from API...</option>
                      ) : (
                        states.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))
                      )}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {states.length > 0 ? `${states.length} States & UTs available` : 'Select your home state'}
                  </p>
                </div>

                {/* 2. City Selection in Selected State (Dynamic API) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Operating City *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={city}
                      onChange={(e) => { setCity(e.target.value); setCustomCity(''); }}
                      disabled={!selectedState || citiesLoading}
                      className="w-full pl-9 pr-8 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {!selectedState ? (
                        <option value="">First select State...</option>
                      ) : citiesLoading ? (
                        <option value="">Fetching cities from API...</option>
                      ) : cities.length === 0 ? (
                        <option value="">No cities found for {selectedState}</option>
                      ) : (
                        <>
                          <option value="">Select City ({cities.length} in {selectedState})...</option>
                          {cities.map((c) => {
                            const cName = c.name || c;
                            const isLive = c.isOperationalHub;
                            return (
                              <option key={cName} value={cName}>
                                {cName} {isLive ? '⭐ (Active Hub)' : ''}
                              </option>
                            );
                          })}
                        </>
                      )}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={customCity}
                    onChange={(e) => { setCustomCity(e.target.value); if (e.target.value) setCity(''); }}
                    placeholder="Or type city/town name (if not in list)"
                    className="w-full mt-2 px-3 py-2 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium"
                  />
                </div>

                {/* 3. Specialization Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Specialization Trade *
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select a specialization...</option>
                      {specializations.length === 0 ? (
                        <option disabled>Loading specializations...</option>
                      ) : (
                        specializations.map((spec) => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))
                      )}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={customSpecialization}
                    onChange={(e) => setCustomSpecialization(e.target.value)}
                    placeholder="Or enter your specific trade / activity"
                    className="w-full mt-2 px-3 py-2 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium"
                  />
                </div>

                {/* 4. Experience & Work Capacity */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Years of Experience
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all appearance-none cursor-pointer"
                    >
                      <option value="1-2 Years">1 - 2 Years</option>
                      <option value="3-5 Years">3 - 5 Years</option>
                      <option value="5-10 Years">5 - 10 Years</option>
                      <option value="10+ Years">10+ Years</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="relative">
                      <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all appearance-none cursor-pointer"
                      >
                        <option value="SMALL">Capacity: Small (up to 3 jobs)</option>
                        <option value="MEDIUM">Capacity: Medium (up to 8 jobs)</option>
                        <option value="LARGE">Capacity: Large (up to 20 jobs)</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3.5: DOCUMENT VERIFICATION */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                Step 3.5: Document Verification (Optional)
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                Upload clear copies of your identity and bank documents (optional). These are verified by the Super Admin before your account is activated.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Aadhaar Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    placeholder="1234 5678 9012"
                    maxLength="14"
                    className="w-full pl-3 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all"
                  />
                </div>

                {/* PAN Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    placeholder="ABCDE1234F"
                    maxLength="10"
                    className="w-full pl-3 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium uppercase transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {/* Aadhaar Document Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Aadhaar Document
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      onChange={(e) => handleDocumentChange(e, 'aadhaar')}
                      className="w-full pl-3 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all cursor-pointer"
                    />
                    {aadhaarFile && (
                      <div className="mt-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{aadhaarFile.file.name}</span>
                        <button
                          onClick={() => setAadhaarFile(null)}
                          className="text-[10px] text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* PAN Document Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    PAN Document
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      onChange={(e) => handleDocumentChange(e, 'pan')}
                      className="w-full pl-3 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all cursor-pointer"
                    />
                    {panFile && (
                      <div className="mt-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{panFile.file.name}</span>
                        <button
                          onClick={() => setPanFile(null)}
                          className="text-[10px] text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Passbook Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Bank Passbook
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      onChange={(e) => handleDocumentChange(e, 'bank')}
                      className="w-full pl-3 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all cursor-pointer"
                    />
                    {bankPassbookFile && (
                      <div className="mt-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{bankPassbookFile.file.name}</span>
                        <button
                          onClick={() => setBankPassbookFile(null)}
                          className="text-[10px] text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 4: ACCESS PIN */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                Step 4: Create Security PIN / Passcode
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Security PIN (4-6 digits) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Used to sign in to your vendor console.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm PIN *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPasscode}
                      onChange={(e) => setConfirmPasscode(e.target.value)}
                      placeholder="Re-enter PIN"
                      className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-medium transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms & Action */}
            <div className="pt-2">
              <div className="flex items-start gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  By registering, you agree to Hipro's Partner Terms of Service and Service Level Agreement. Your credentials are encrypted via TLS 1.3.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #DC2626 0%, #BE123C 100%)', boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Submit & Activate {category} Partner Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  Already have an active partner account? <span className="text-red-600 dark:text-red-400 font-bold underline">Sign in to Console →</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-4xl mx-auto w-full text-center text-xs text-slate-500 pt-4 border-t border-slate-800/60">
        <p>&copy; {new Date().getFullYear()} Hindustan Projects (Hipro). Verified Vendor & Adventure Operator Gateway.</p>
      </footer>
    </div>
  );
}
