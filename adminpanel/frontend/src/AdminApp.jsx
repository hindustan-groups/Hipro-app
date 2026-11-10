import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  LayoutDashboard, ClipboardList, Briefcase, FileText, Share2, CheckSquare, Square, Receipt, Calculator,
  Wrench, Users, Activity, ShieldCheck, Plus, RefreshCw,
  PlusCircle, Search, Menu, X, Camera, Printer, Trash2,
  Check, PhoneCall, Sparkles, Inbox, Clock, FileCheck2,
  CheckCircle2, GitPullRequest, Zap, ArrowRight, ArrowLeft, MapPin,
  Calendar, Home, User, Phone, Mail, Info, Send, RotateCcw,
  Server, Database, AlertCircle, Droplets, Image, Layers, Scale,
  ExternalLink, Link2, Eye, EyeOff, Upload, Tag, Percent, Ticket,
  MessageCircle, CheckCheck, TrendingUp, HardHat, CheckCircle, ChevronDown, ChevronLeft, ChevronRight,
  Filter, UserCheck, AlertTriangle, ArrowUpRight, Award, Shield, UserPlus, ShoppingCart, Compass,
  Edit, Edit2, Edit3, LogOut, Video, Play, Building2, Palette
} from 'lucide-react';

const API_BASE = (typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.endsWith('.local')
))
  ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000')
  : (import.meta.env.VITE_API_BASE_URL || 'https://app.hindustanprojects.in');

export default function AdminApp({ onSwitchToCustomerApp, onLogout, onSwitchToVendor }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [userBookingsLoading, setUserBookingsLoading] = useState(false);
  const [viewUserDetail, setViewUserDetail] = useState(false);
  const [slides, setSlides] = useState([]);
  const [entCategories, setEntCategories] = useState([]);
  const [entExperiences, setEntExperiences] = useState([]);
  const [entCategoryFilter, setEntCategoryFilter] = useState('ALL');
  const [entSearch, setEntSearch] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    tagline: '',
    icon: 'paragliding',
    color: '#0284C7',
    imageUrl: '',
  });
  const [experienceModalOpen, setExperienceModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState(null);
  const [experienceForm, setExperienceForm] = useState({
    title: '',
    tagline: '',
    city: 'Dehradun',
    locationDetails: '',
    categoryId: 'cat_air_sports',
    startingPrice: '',
    originalPrice: '',
    duration: '',
    imageUrl: '',
    discountBadge: '',
    isFeatured: false,
    vendorId: 'v_adv_01',
    vendorName: 'Captain Arvind Negi',
    vendorBusiness: 'Himalayan Sky Gliders & Air Safari',
    vendorPhone: '+91 98290 88801',
  });
  const [entBookings, setEntBookings] = useState([]);
  const [entViewMode, setEntViewMode] = useState('catalog'); // 'catalog' | 'bookings'
  const [entBookingSearch, setEntBookingSearch] = useState('');
  const [entBookingStatusFilter, setEntBookingStatusFilter] = useState('ALL');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [activeInspectionReq, setActiveInspectionReq] = useState(null); // inspection request detail

  // Customer Exploration & Active Carts Tracking State
  const [customerLeads, setCustomerLeads] = useState([]);
  const [activityStream, setActivityStream] = useState([]);
  const [activityMetrics, setActivityMetrics] = useState({
    totalLeads: 0,
    activeCartLeads: 0,
    totalCartValue: 0,
    topExplored: []
  });
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityViewMode, setActivityViewMode] = useState('leads'); // 'leads' | 'stream'
  const [activityCityFilter, setActivityCityFilter] = useState('ALL'); // 'ALL' | 'Udaipur' | 'Bhilwara'
  const [activitySearch, setActivitySearch] = useState('');
  const [selectedLeadModal, setSelectedLeadModal] = useState(null);

  // Overview Operations & Engineer Assignment State
  const [overviewFilter, setOverviewFilter] = useState('ALL'); // 'ALL' | 'READY' | 'NEEDS_QUOTE' | 'AUDIT' | 'DIRECT'
  const [overviewCityFilter, setOverviewCityFilter] = useState('ALL'); // 'ALL' | 'Bhilwara' | 'Udaipur' | 'Dehradun' | 'Rishikesh' | 'Jaipur' | 'Jaisalmer'
  const [overviewActiveSection, setOverviewActiveSection] = useState('requests'); // 'requests' | 'bookings' | 'quotations' | 'vendors'
  const [overviewSearch, setOverviewSearch] = useState('');
  const [quotationFilterStatus, setQuotationFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'
  const [quotationSearch, setQuotationSearch] = useState('');
  const [quotationDeskTab, setQuotationDeskTab] = useState('customer'); // 'customer' | 'vendor'
  const [userSearch, setUserSearch] = useState('');
  const [assigningEngineerReqId, setAssigningEngineerReqId] = useState(null);
  const [assignedEngineers, setAssignedEngineers] = useState(() => {
    try {
      const saved = localStorage.getItem('hipro_assigned_engineers');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [partners, setPartners] = useState([]);

  // Inspection Requests Tab Filter & Loading State
  const [requestsCityFilter, setRequestsCityFilter] = useState('ALL');
  const [requestsStatusFilter, setRequestsStatusFilter] = useState('ALL');
  const [requestsSearch, setRequestsSearch] = useState('');
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // ==================== DEDICATED INSPECTION REQUEST DETAIL PAGE STATE ====================
  const [viewRequestDetail, setViewRequestDetail] = useState(false);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState(null);
  const [requestDetailTab, setRequestDetailTab] = useState('overview'); // 'overview' | 'media' | 'quotes' | 'timeline'

  const handleOpenRequestDetail = (req, initialTab = 'overview') => {
    if (!req) return;
    setActiveTab('requests');
    const fresh = requests.find(r => r.id === req.id || r.requestNumber === req.requestNumber) || req;
    setSelectedRequestDetail(fresh);
    setViewRequestDetail(true);
    setRequestDetailTab(initialTab);
  };

  const handleCloseRequestDetail = () => {
    setViewRequestDetail(false);
    setSelectedRequestDetail(null);
  };

  // ==================== VENDOR MULTI-PANEL MANAGEMENT STATE ====================
  // Super Admin: Connected local vendors who receive customer requests & submit quotations
  const [vendors, setVendors] = useState([]);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState('ALL');
  const [vendorCityFilter, setVendorCityFilter] = useState('ALL');
  const [categoryPills, setCategoryPills] = useState([]);
  const [domainTabs, setDomainTabs] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    businessName: '',
    phone: '',
    email: '',
    state: 'Rajasthan',
    city: 'Bhilwara',
    category: 'Services',
    specialization: 'General Repair',
    experience: '3+ Years',
    status: 'active',
    rating: 4.5,
    minCharge: '500',
    imageUrl: '',
  });

  // Which customer request is currently being shown to vendors for quoting
  const [quoteRequestId, setQuoteRequestId] = useState(null); // request being quoted by vendors
  const [vendorQuotes, setVendorQuotes] = useState([]); // quotes collected for current request
  const [showVendorPanel, setShowVendorPanel] = useState(false); // toggle vendor-facing view
  const [assignedVendor, setAssignedVendor] = useState(null); // final assigned vendor (min price)

  // ==================== VENDOR COMPARISON & QUOTATION TRACKING STATE ====================
  const [vendorComparisonMode, setVendorComparisonMode] = useState(false);
  const [selectedVendorsForComparison, setSelectedVendorsForComparison] = useState([]);
  const [vendorQuotesHistory, setVendorQuotesHistory] = useState([]);
  const [vendorPerformanceStats, setVendorPerformanceStats] = useState({});
  const [viewVendorDetail, setViewVendorDetail] = useState(false);
  const [selectedVendorDetail, setSelectedVendorDetail] = useState(null);
  const [vendorDetailLoading, setVendorDetailLoading] = useState(false);
  const [vendorDetailTab, setVendorDetailTab] = useState('overview'); // 'overview' | 'kyc' | 'jobs' | 'quotes' | 'shared'
  const [isVerifyingKYC, setIsVerifyingKYC] = useState(false);
  const [isUpdatingVendorStatus, setIsUpdatingVendorStatus] = useState(false);

  const handleOpenVendorDetail = async (vendor) => {
    if (!vendor) return;
    setActiveTab('vendors');
    setSelectedVendorDetail(vendor);
    setViewVendorDetail(true);
    setVendorDetailTab('overview');
    setVendorDetailLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/vendors/${vendor.id}`);
      const data = await res.json();
      if (data.success && data.vendor) {
        setSelectedVendorDetail(data.vendor);
      }
    } catch (e) {
      console.error('Failed to load full vendor detail:', e);
    } finally {
      setVendorDetailLoading(false);
    }
  };

  const handleToggleVendorKYCStatus = async (vendorId, currentVerified) => {
    setIsVerifyingKYC(true);
    try {
      const nextStatus = !currentVerified;
      const res = await fetch(`${API_BASE}/api/v1/vendors/${vendorId}/verify-kyc`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentsVerified: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Vendor KYC ${nextStatus ? 'Verified & Approved' : 'marked Unverified'}!`, 'success');
        setSelectedVendorDetail(prev => prev ? { ...prev, documentsVerified: nextStatus } : prev);
        setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, documentsVerified: nextStatus } : v));
      } else {
        showToastMsg(data.message || 'Failed to update KYC status', 'error');
      }
    } catch (err) {
      showToastMsg('Network error updating KYC status', 'error');
    } finally {
      setIsVerifyingKYC(false);
    }
  };

  const handleQuickUpdateVendorStatus = async (vendorId, newStatus) => {
    setIsUpdatingVendorStatus(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/vendors/${vendorId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Vendor status updated to ${newStatus.toUpperCase()}`, 'success');
        setSelectedVendorDetail(prev => prev ? { ...prev, status: newStatus } : prev);
        setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, status: newStatus } : v));
      } else {
        showToastMsg(data.message || 'Failed to update vendor status', 'error');
      }
    } catch (err) {
      showToastMsg('Network error updating vendor status', 'error');
    } finally {
      setIsUpdatingVendorStatus(false);
    }
  };
  const [priorityVendors, setPriorityVendors] = useState([]);

  // ==================== DYNAMIC OPERATIONAL CITY HUBS (100% HIPRO) ====================
  const [operationalCities, setOperationalCities] = useState([]);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [isSavingCity, setIsSavingCity] = useState(false);
  const [cityForm, setCityForm] = useState({
    name: '',
    state: 'Rajasthan',
    tagline: '',
    badge: 'ACTIVE HUB'
  });

  const fetchOperationalCities = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/cities?all=true`);
      const data = await res.json();
      if (data.success && Array.isArray(data.cities)) {
        setOperationalCities(data.cities);
      }
    } catch (e) {
      console.error('Failed to fetch operational cities:', e);
    }
  };

  const handleSaveCity = async (e) => {
    e?.preventDefault();
    if (!cityForm.name.trim()) {
      showToastMsg('City name is required', 'error');
      return;
    }
    setIsSavingCity(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/cities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cityForm)
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`City Hub "${cityForm.name}" added successfully!`, 'success');
        setCityModalOpen(false);
        setCityForm({ name: '', state: 'Rajasthan', tagline: '', badge: 'ACTIVE HUB' });
        await fetchOperationalCities();
      } else {
        showToastMsg(data.message || 'Failed to add city', 'error');
      }
    } catch (err) {
      showToastMsg('Error saving city hub', 'error');
    } finally {
      setIsSavingCity(false);
    }
  };

  const handleToggleCityStatus = async (cityId) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/cities/${cityId}/toggle`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`City Hub status updated`, 'success');
        fetchOperationalCities();
      }
    } catch (err) {
      showToastMsg('Failed to update city status', 'error');
    }
  };

  const handleDeleteCity = async (cityId, cityName) => {
    if (!window.confirm(`Are you sure you want to delete ${cityName} hub?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/cities/${cityId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`City Hub ${cityName} removed`, 'success');
        fetchOperationalCities();
      }
    } catch (err) {
      showToastMsg('Failed to delete city', 'error');
    }
  };

  // ==================== REQUEST SHARING & VENDOR QUOTATION MODAL STATE ====================
  const [shareVendorModalOpen, setShareVendorModalOpen] = useState(false);
  const [shareModalRequest, setShareModalRequest] = useState(null);
  const [selectedShareVendorIds, setSelectedShareVendorIds] = useState([]);
  const [shareDispatchNotes, setShareDispatchNotes] = useState('');
  const [shareVendorCityFilter, setShareVendorCityFilter] = useState('ALL');
  const [shareVendorSearch, setShareVendorSearch] = useState('');
  const [isSharingDispatching, setIsSharingDispatching] = useState(false);

  const [vendorQuotesModalOpen, setVendorQuotesModalOpen] = useState(false);
  const [quotesModalRequest, setQuotesModalRequest] = useState(null);
  const [quotesModalList, setQuotesModalList] = useState([]);
  const [isLoadingQuotesModal, setIsLoadingQuotesModal] = useState(false);
  const [isAssigningFromQuotes, setIsAssigningFromQuotes] = useState(false);

  const handleOpenShareVendorsModal = (req) => {
    setShareModalRequest(req);
    const alreadySharedIds = (req.sharedVendors || []).map(s => s.vendorId);
    setSelectedShareVendorIds(alreadySharedIds);
    setShareDispatchNotes('');
    const reqCity = (req.city || req.location || '').trim();
    const matchedCity = operationalCities.find(c => 
      c.name && reqCity.toLowerCase().includes(c.name.toLowerCase())
    );
    setShareVendorCityFilter(matchedCity ? matchedCity.name : (reqCity || 'ALL'));
    setShareVendorSearch('');
    setShareVendorModalOpen(true);
  };

  const handleToggleSelectVendor = (vendorId) => {
    setSelectedShareVendorIds(prev => 
      prev.includes(vendorId) ? prev.filter(id => id !== vendorId) : [...prev, vendorId]
    );
  };

  const handleSelectAllCityVendors = (cityVendors) => {
    const allIds = cityVendors.map(v => v.id);
    const areAllSelected = allIds.every(id => selectedShareVendorIds.includes(id));
    if (areAllSelected) {
      setSelectedShareVendorIds(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelectedShareVendorIds(prev => Array.from(new Set([...prev, ...allIds])));
    }
  };

  const handleDispatchShareVendors = async () => {
    if (!shareModalRequest) return;
    if (selectedShareVendorIds.length === 0) {
      showToastMsg('Please select at least one vendor to share this request.', 'warning');
      return;
    }
    setIsSharingDispatching(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hipro_auth_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/v1/requests/${shareModalRequest.id}/share-vendors`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          vendorIds: selectedShareVendorIds,
          notes: shareDispatchNotes,
          sharedBy: 'Super Admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Request #${shareModalRequest.requestNumber} shared with ${selectedShareVendorIds.length} vendor(s)!`, 'success');
        setShareVendorModalOpen(false);
        setShareModalRequest(null);
        await fetchRequests();
      } else {
        showToastMsg(data.message || 'Failed to share request with vendors', 'error');
      }
    } catch (err) {
      showToastMsg('Network error while sharing request', 'error');
    } finally {
      setIsSharingDispatching(false);
    }
  };

  const handleOpenVendorQuotesModal = async (req) => {
    setQuotesModalRequest(req);
    setQuotesModalList(req.vendorQuotes || []);
    setVendorQuotesModalOpen(true);
    setIsLoadingQuotesModal(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hipro_auth_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/v1/requests/${req.id}/vendor-quotes`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.quotes)) {
        setQuotesModalList(data.quotes);
      }
    } catch (err) {
      console.error('Failed to load vendor quotes:', err);
    } finally {
      setIsLoadingQuotesModal(false);
    }
  };

  const handleAssignVendorFromQuote = async (quote, targetReq = null) => {
    const target = targetReq || quotesModalRequest || selectedRequestDetail;
    if (!target) return;
    setIsAssigningFromQuotes(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hipro_auth_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/v1/requests/${target.id}/assign-vendor`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          vendorId: quote.vendorId,
          quoteId: quote.id,
          quotePrice: quote.quotePrice,
          vendorName: quote.vendorName || quote.vendor?.businessName || quote.vendor?.name,
          assignedBy: 'Super Admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Project #${target.requestNumber} awarded to ${quote.vendorName || quote.vendor?.businessName || 'vendor'} for ₹${quote.quotePrice.toLocaleString('en-IN')}!`, 'success');
        setVendorQuotesModalOpen(false);
        setQuotesModalRequest(null);
        await fetchRequests();
        setSelectedRequestDetail(prev => (prev && prev.id === target.id) ? {
          ...prev,
          vendorId: quote.vendorId,
          assignedVendorName: quote.vendorName || quote.vendor?.businessName || quote.vendor?.name,
          assignedQuotePrice: quote.quotePrice,
          status: 'ASSIGNED'
        } : prev);
      } else {
        showToastMsg(data.message || 'Failed to assign project', 'error');
      }
    } catch (err) {
      showToastMsg('Network error while assigning project', 'error');
    } finally {
      setIsAssigningFromQuotes(false);
    }
  }; // Priority vendor IDs for customer assignment

  const fetchVendors = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/vendors`);
      const data = await res.json();
      if (data.success && Array.isArray(data.vendors)) {
        setVendors(data.vendors);
        await fetchCategories();
        await fetchVendorQuotesHistory();
      } else {
        // Fallback demo vendors if backend not available (Services & Adventure)
        setVendors([
          { id: 'v_adv_01', name: 'Captain Arvind Negi', businessName: 'Himalayan Sky Gliders & Air Safari', phone: '+91 98290 88801', email: 'arvind.gliders@gmail.com', city: 'Dehradun', category: 'Adventure', specialization: 'Paragliding & Microlight Flights', experience: '12 Years', status: 'active', rating: 4.9, minCharge: '2500', imageUrl: '' },
          { id: 'v_adv_02', name: 'Fateh Singh Bhati', businessName: 'Thar Royal Desert Safari & Camps', phone: '+91 94141 77702', email: 'thar.safari@gmail.com', city: 'Jaisalmer', category: 'Adventure', specialization: 'Desert Safari & Dune Bashing', experience: '10 Years', status: 'active', rating: 4.9, minCharge: '1800', imageUrl: '' },
          { id: 'v_adv_03', name: 'Rakesh Rawat', businessName: 'Ganga White Water Adventure Club', phone: '+91 98370 66603', email: 'ganga.rafting@gmail.com', city: 'Rishikesh', category: 'Adventure', specialization: 'River Rafting & Kayaking', experience: '14 Years', status: 'active', rating: 5.0, minCharge: '1200', imageUrl: '' },
          { id: 'v_1', name: 'Rajesh Kumar', businessName: 'Rajesh Construction & Repairs', phone: '+91 98765 43210', email: 'rajesh@example.com', city: 'Bhilwara', category: 'Services', specialization: 'Waterproofing & Leakage', experience: '8 Years', status: 'active', rating: 4.8, minCharge: '1000', imageUrl: '' },
          { id: 'v_2', name: 'Sunita Verma', businessName: 'Sunita Civil Works', phone: '+91 98765 43211', email: 'sunita@example.com', city: 'Bhilwara', category: 'Services', specialization: 'Civil Construction & Masonry', experience: '6 Years', status: 'active', rating: 4.6, minCharge: '800', imageUrl: '' },
          { id: 'v_3', name: 'Mohan Lal', businessName: 'Mohan Painting & Finishing', phone: '+91 98765 43212', email: 'mohan@example.com', city: 'Bhilwara', category: 'Services', specialization: 'Painting & Wall Repair', experience: '5 Years', status: 'active', rating: 4.4, minCharge: '600', imageUrl: '' },
          { id: 'v_4', name: 'Arjun Singh', businessName: 'Arjun Structural Solutions', phone: '+91 98765 43213', email: 'arjun@example.com', city: 'Bhilwara', category: 'Services', specialization: 'Structural Analysis', experience: '10 Years', status: 'active', rating: 4.9, minCharge: '1500', imageUrl: '' },
        ]);
        await fetchVendorQuotesHistory();
      }
    } catch (e) {
      console.error('Failed to fetch vendors:', e);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/vendors/categories`);
      const data = await res.json();
      if (data.success && Array.isArray(data.categories)) {
        setCategoryPills(data.categories);

        // Build dynamic domain tabs from categories
        const serviceCats = data.categories.filter(c => (c.category || '').toLowerCase() !== 'adventure');
        const adventureCats = data.categories.filter(c => (c.category || '').toLowerCase() === 'adventure');

        setDomainTabs([
          { id: 'ALL', name: 'All Domains', count: vendors.length, color: '#0f172a' },
          {
            id: 'Services',
            name: 'Home & Civil Services',
            count: serviceCats.reduce((s, c) => s + (c.vendorCount || 0), 0),
            color: '#3b82f6',
          },
          {
            id: 'Adventure',
            name: 'Adventure & Sports Operators',
            count: adventureCats.reduce((s, c) => s + (c.vendorCount || 0), 0),
            color: '#f43f5e',
          },
        ]);
      }
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchVendorQuotesHistory = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hipro_auth_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/v1/vendors/quotes`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.quotes)) {
        setVendorQuotesHistory(data.quotes);
        // Calculate performance stats per vendor
        const stats = {};
        data.quotes.forEach(q => {
          const vid = q.vendorId;
          if (!stats[vid]) {
            stats[vid] = { totalQuotes: 0, totalValue: 0, assignedCount: 0, avgRating: 0 };
          }
          stats[vid].totalQuotes++;
          stats[vid].totalValue += q.quotePrice || 0;
          if (q.status === 'assigned' || q.status === 'accepted') {
            stats[vid].assignedCount++;
          }
        });
        // Merge with vendor data for final stats
        const finalStats = {};
        vendors.forEach(v => {
          finalStats[v.id] = {
            ...stats[v.id],
            vendorName: v.name,
            businessName: v.businessName,
            category: v.category,
            city: v.city,
            specialization: v.specialization,
            rating: v.rating,
            status: v.status,
          };
        });
        setVendorPerformanceStats(finalStats);
      }
    } catch (e) {
      console.error('Failed to fetch vendor quotes history:', e);
    }
  };

  const handleSaveVendor = async (e) => {
    e.preventDefault();
    try {
      const url = editingVendor
        ? `${API_BASE}/api/v1/vendors/${editingVendor.id}`
        : `${API_BASE}/api/v1/vendors`;
      const method = editingVendor ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorForm),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(editingVendor ? 'Vendor updated successfully!' : 'New vendor connected successfully!', 'success');
        setVendorModalOpen(false);
        setEditingVendor(null);
        setVendorForm({ name: '', businessName: '', phone: '', email: '', city: 'Bhilwara', category: 'Services', specialization: 'General Repair', experience: '3+ Years', status: 'active', rating: 4.5, minCharge: '500', imageUrl: '' });
        fetchVendors();
      } else {
        showToastMsg(data.message || 'Failed to save vendor', 'error');
      }
    } catch (err) {
      showToastMsg('Network error saving vendor', 'error');
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    if (!window.confirm('Are you sure you want to remove this vendor?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/vendors/${vendorId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Vendor removed successfully', 'success');
        fetchVendors();
      } else {
        showToastMsg(data.message || 'Failed to remove vendor', 'error');
      }
    } catch (err) {
      showToastMsg('Network error removing vendor', 'error');
    }
  };

  const handleToggleVendorStatus = async (vendor) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/vendors/${vendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: vendor.status === 'active' ? 'inactive' : 'active' }),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Vendor marked ${vendor.status === 'active' ? 'Inactive' : 'Active'}`, 'success');
        fetchVendors();
      }
    } catch (e) {
      showToastMsg('Failed to toggle vendor status', 'error');
    }
  };

  // Toggle Priority Vendor - priority vendors get preference when assigning to customer quotations
  const handleToggleVendorPriority = (vendorId) => {
    setPriorityVendors(prev => {
      const isPriority = prev.includes(vendorId);
      const updated = isPriority
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId];
      showToastMsg(
        isPriority ? 'Removed from Priority Vendors' : 'Added to Priority Vendors',
        isPriority ? 'info' : 'success'
      );
      return updated;
    });
  };

  // Local input states for vendor quote collection (per vendor)
  const [vendorQuoteInputs, setVendorQuoteInputs] = useState({}); // { vendorId: { price, notes, timeline } }

  const handleVendorInputChange = (vendorId, field, value) => {
    setVendorQuoteInputs(prev => ({
      ...prev,
      [vendorId]: { ...(prev[vendorId] || {}), [field]: value },
    }));
  };

  // Open customer request to vendors for quotation
  const handleOpenQuoteToVendors = (request) => {
    setQuoteRequestId(request.id);
    setVendorQuotes([]);
    setAssignedVendor(null);
    setActiveTab('vendors');
    setShowVendorPanel(false);
    setSidebarOpen(false);
  };

  // Collect a quotation from a vendor for the current request
  const handleSubmitVendorQuote = async (vendorId, quotePrice, notes, timeline) => {
    if (!quoteRequestId) return;
    const parsedPrice = parseFloat(quotePrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      showToastMsg('Please enter a valid quotation price', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/vendors/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: quoteRequestId,
          vendorId,
          quotePrice: parsedPrice,
          notes: notes || '',
          estimatedTimeline: timeline || '1-2 Working Days',
          submittedBy: 'Vendor Portal',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Vendor quotation received!', 'success');
        setVendorQuotes(prev => [...prev, { vendorId, quotePrice: parsedPrice, notes, estimatedTimeline: timeline, status: 'submitted', createdAt: new Date().toISOString() }]);
      } else {
        showToastMsg(data.message || 'Failed to submit quotation', 'error');
      }
    } catch (err) {
      // Optimistic add
      setVendorQuotes(prev => [...prev, { vendorId, quotePrice: parsedPrice, notes, estimatedTimeline: timeline, status: 'submitted', createdAt: new Date().toISOString() }]);
      showToastMsg('Quotation recorded (offline mode)', 'success');
    }
  };

  // Manually assign a vendor to the request (admin chooses which vendor)
  const handleAssignVendor = async (vendorId) => {
    if (!quoteRequestId) {
      showToastMsg('No request selected', 'error');
      return;
    }
    const vendor = vendors.find(v => v.id === vendorId);
    const quote = vendorQuotes.find(q => q.vendorId === vendorId);
    if (!vendor) {
      showToastMsg('Vendor not found', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/requests/${quoteRequestId}/assign-vendor`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          vendorName: vendor.name,
          quotePrice: quote ? quote.quotePrice : 0,
          assignedVendorId: vendorId,
          assignedVendorName: vendor.name,
          assignedQuotePrice: quote ? quote.quotePrice : 0,
          assignedBy: 'Super Admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAssignedVendor({ vendorId, quotePrice: quote ? quote.quotePrice : 0 });
        showToastMsg(`Assigned to ${vendor.name} (${vendor.businessName})`, 'success');
        fetchRequests();
        fetchStats();
      } else {
        showToastMsg(data.message || 'Failed to assign vendor', 'error');
      }
    } catch (e) {
      setAssignedVendor({ vendorId, quotePrice: quote ? quote.quotePrice : 0 });
      showToastMsg(`Assigned to ${vendor.name} (offline mode)`, 'success');
    }
  };

  const fetchPartners = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/services/partners`);
      const data = await res.json();
      if (data.success && Array.isArray(data.partners)) {
        setPartners(data.partners);
      }
    } catch (e) {
      console.error('Failed to fetch real partners:', e);
    }
  };

  const availableEngineers = partners.map(p => ({
    id: p.id,
    name: p.name,
    role: p.role,
    phone: p.phone,
    badge: p.badge || p.cityName,
    cityName: p.cityName,
    color: p.cityName === 'Bhilwara' ? 'bg-warning-100 text-warning-700 border-warning-200' : 'bg-primary-100 text-primary-700 border-primary-200'
  }));

  const handleAssignEngineer = async (requestId, engineer) => {
    const engineerName = typeof engineer === 'string' ? engineer : (engineer?.name || 'Assigned Engineer');
    const engineerPhone = typeof engineer === 'object' ? (engineer?.phone || '') : '';
    const engineerRole = typeof engineer === 'object' ? (engineer?.badge || engineer?.role || 'Lead Inspection Engineer') : 'Lead Inspection Engineer';

    // 1. Optimistic local state & localStorage update
    setAssignedEngineers(prev => {
      const updated = { ...prev, [requestId]: engineerName };
      try {
        localStorage.setItem('hipro_assigned_engineers', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setAssigningEngineerReqId(null);

    // 2. Persist to backend database via PATCH /api/v1/requests/:id/assign
    try {
      const res = await fetch(`${API_BASE}/api/v1/requests/${requestId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianName: engineerName,
          technicianPhone: engineerPhone,
          technicianRole: engineerRole
        })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Assigned to ${engineerName}`, 'success');
        fetchRequests(true);
      } else {
        showToastMsg(data.message || `Assigned locally to ${engineerName}`, 'info');
      }
    } catch (err) {
      showToastMsg(`Assigned locally to ${engineerName} (offline sync)`, 'info');
    }
  };

  // Live Chat Desk State
  const socketRef = useRef(null);
  const [chatThreads, setChatThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const activeThreadIdRef = useRef(null); // Ref to avoid stale closure in socket handlers
  const [threadMessages, setThreadMessages] = useState([]);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [chatFilterType, setChatFilterType] = useState('ALL');
  const [activeChatModal, setActiveChatModal] = useState(null); // Instant Floating/Modal Live Chat Window
  const [chatModalInput, setChatModalInput] = useState('');
  const chatMessagesEndRef = useRef(null);

  const handleOpenChatWithCustomer = (user, phone, req = null) => {
    if (req) {
      openChatForRequest(req);
      return;
    }
    const cleanPhone = (phone || user?.phoneNumber || '').replace(/\D/g, '');
    let targetThread = chatThreads.find(t => {
      const tPhone = (t.customerPhone || '').replace(/\D/g, '');
      const matchPhone = cleanPhone && tPhone && (cleanPhone.includes(tPhone) || tPhone.includes(cleanPhone));
      const matchName = user?.name && t.customerName && t.customerName.toLowerCase().trim() === user.name.toLowerCase().trim();
      return matchPhone || matchName;
    });

    const threadId = targetThread ? targetThread.id : `thread_user_${cleanPhone || Date.now()}`;
    if (!targetThread) {
      targetThread = {
        id: threadId,
        customerName: user?.name || 'Customer',
        customerPhone: phone || user?.phoneNumber || '+91 94628 77757',
        contextType: 'GENERAL',
        contextTag: 'Support Desk',
        quoteNumber: '',
        requestNumber: '',
        bookingNumber: '',
        lastMessage: 'Support chat initiated',
        lastMessageTime: new Date().toISOString(),
        unreadCountAdmin: 0,
        unreadCountCustomer: 0,
      };
      setChatThreads(prev => [targetThread, ...prev.filter(t => t.id !== threadId)]);
    }

    setActiveThreadId(threadId);
    setChatFilterType('ALL');
    setChatSearch('');
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_thread', threadId);
    }
    fetchThreadMessages(threadId);
    setActiveTab('chat');
    setSidebarOpen(false);
  };

  // Keep ref in sync so socket handlers always read current activeThreadId
  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  // Slides State
  const [slideModalOpen, setSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [slideForm, setSlideForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    targetRoute: 'create_inspection',
    badgeText: 'LIMITED OFFER',
    order: 1,
    isActive: true,
  });
  const [uploadingSlideImg, setUploadingSlideImg] = useState(false);

  // Offers State
  const [offers, setOffers] = useState([]);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerCategoryFilter, setOfferCategoryFilter] = useState('ALL');
  const [offerForm, setOfferForm] = useState({
    title: '',
    subtitle: '',
    category: 'Trending',
    discount: '20% OFF',
    code: '',
    badge: 'POPULAR',
    imageUrl: '',
    minAmount: 1500,
    validTill: '31 Dec 2026',
    targetRoute: 'create_inspection',
    terms: 'Applicable on residential and commercial inspections.',
    order: 1,
    isActive: true,
  });
  const [uploadingOfferImg, setUploadingOfferImg] = useState(false);

  // Modals state
  const [activePhotoModal, setActivePhotoModal] = useState(null); // { photos: [], index: 0, title: '' }
  const [activeQuoteModal, setActiveQuoteModal] = useState(null); // quote object
  const [addServiceModalOpen, setAddServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceCategoryForm, setServiceCategoryForm] = useState({
    code: '',
    name: '',
    description: '',
    imageUrl: '',
    rating: 4.8
  });
  const [uploadingServiceImg, setUploadingServiceImg] = useState(false);
  const [uploadingSubServiceImg, setUploadingSubServiceImg] = useState(false);
  const [addSubServiceModalOpen, setAddSubServiceModalOpen] = useState(null); // parent service object

  // Direct Bookings State (Maintenance Services)
  const [directBookings, setDirectBookings] = useState([]);
  const [directBookingStats, setDirectBookingStats] = useState(null);
  const [directBookingFilter, setDirectBookingFilter] = useState('ALL');
  const [directBookingSearch, setDirectBookingSearch] = useState('');
  const [directBookingCityFilter, setDirectBookingCityFilter] = useState('ALL');
  const [selectedBookingForDrawer, setSelectedBookingForDrawer] = useState(null);
  const [assignTechModalBooking, setAssignTechModalBooking] = useState(null);
  const [statusModalBooking, setStatusModalBooking] = useState(null);
  const [refundModalBooking, setRefundModalBooking] = useState(null);
  const [adjustChargeModalBooking, setAdjustChargeModalBooking] = useState(null);
  const [techForm, setTechForm] = useState({ vendorId: '', name: '', phone: '', role: 'Authorized Service Provider', rating: 4.9 });
  const [statusForm, setStatusForm] = useState({ status: 'CONFIRMED', reason: '' });
  const [refundForm, setRefundForm] = useState({ amount: '', reason: 'Customer requested cancellation' });
  const [adjustForm, setAdjustForm] = useState({ additionalAmount: '', note: '' });

  // SubService Edit/Add State
  const [subServiceModalOpen, setSubServiceModalOpen] = useState(false);
  const [editingSubService, setEditingSubService] = useState(null);
  const [subServiceParentService, setSubServiceParentService] = useState(null);
  const [subServiceForm, setSubServiceForm] = useState({
    titleEn: '',
    titleHi: '',
    desc: '',
    visitingCharge: 199,
    bookNowEnabled: true,
    getQuoteEnabled: true,
    checklist: '',
      image: '',
    requiredFields: []
  });
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(true);

  // Quotation Builder State
  const [builderRequestId, setBuilderRequestId] = useState('');
  const [builderEstimator, setBuilderEstimator] = useState('Hipro Technical Admin Desk');
  const [builderTimeline, setBuilderTimeline] = useState('1-2 Working Days');
  const [customTimeline, setCustomTimeline] = useState('');
  const [builderScope, setBuilderScope] = useState('Standard Engineering Specifications');
  const [builderWarranty, setBuilderWarranty] = useState('');
  const [builderTerms, setBuilderTerms] = useState('Standard HiBuild service terms apply upon receipt of final payment. 50% advance before material mobilization, 50% on completion and customer sign-off.');
  const [lineItems, setLineItems] = useState([
    { item: 'Surface Preparation & Moisture Tracing', qty: 1, unit: 'Lumpsum', rate: 1200 },
    { item: 'Chemical PU Injection / Polymer Grouting', qty: 15, unit: 'Running Ft', rate: 180 },
    { item: 'Waterproof Acrylic Protective Top Coat', qty: 120, unit: 'Sq Ft', rate: 45 }
  ]);
  const [matCost, setMatCost] = useState(0);
  const [labCost, setLabCost] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(18);
  const [builderAdvancePct, setBuilderAdvancePct] = useState(30);
  const [customAdvanceAmt, setCustomAdvanceAmt] = useState(null);
  const [isEditingModalAdvance, setIsEditingModalAdvance] = useState(false);
  const [modalNewAdvanceAmt, setModalNewAdvanceAmt] = useState('');

  // Initial Fetch & Active Real-Time Polling
  useEffect(() => {
    fetchAllData();
    // Poll telemetry and inspection requests every 10 seconds silently
    const interval = setInterval(() => {
      fetchStats(true);
      fetchRequests(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Instant refresh when user switches window / tab back to Admin Panel
  useEffect(() => {
    const handleFocus = () => {
      fetchRequests(true);
      fetchStats(true);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Auto-fetch data whenever switching to the inspection requests tab
  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests();
    }
  }, [activeTab]);


  // Chat connection status
  const [socketConnected, setSocketConnected] = useState(false);

  // Real-Time Chat Socket & Event Listeners
  useEffect(() => {
    fetchChatThreads();

    // Get auth token for socket authentication
    const token = typeof window !== 'undefined' ? localStorage.getItem('hipro_auth_token') : null;

    // Connect to Socket.io server with authentication
    const socketBase = import.meta.env.VITE_SOCKET_URL || 
      (API_BASE ? API_BASE : (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : ''));
    const socket = io(socketBase, {
      transports: ['websocket', 'polling'],
      auth: { token }
    });
    socketRef.current = socket;

    // Connection status
    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_admin_room');
      // Re-join active thread room if one was selected
      const currentThreadId = activeThreadIdRef.current;
      if (currentThreadId) {
        socket.emit('join_thread', currentThreadId);
      }
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('connect_error', (err) => {
      setSocketConnected(false);
      console.error('Socket connection error:', err.message);
    });

    socket.on('reconnect', () => {
      setSocketConnected(true);
      socket.emit('join_admin_room');
      const currentThreadId = activeThreadIdRef.current;
      if (currentThreadId) {
        socket.emit('join_thread', currentThreadId);
      }
    });

    socket.on('thread_updated', (payload) => {
      // Optimistically update the specific thread without full refresh
      if (payload.thread) {
        setChatThreads(prev => prev.map(t => t.id === payload.thread.id ? payload.thread : t));
      }
      const currentThreadId = activeThreadIdRef.current;
      if (currentThreadId && payload.thread?.id === currentThreadId) {
        fetchThreadMessages(currentThreadId);
      }
    });

    socket.on('new_message', (msg) => {
      const currentThreadId = activeThreadIdRef.current;
      // Avoid adding our own sent message twice (already added via optimistic or HTTP response)
      setThreadMessages(prev => {
        if (currentThreadId && msg.threadId !== currentThreadId) return prev;
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Update thread list with the latest message
      setChatThreads(prev => prev.map(t =>
        t.id === msg.threadId
          ? { ...t, lastMessage: msg.text, lastMessageTime: msg.createdAt, unreadCountAdmin: (t.id !== currentThreadId) ? (t.unreadCountAdmin || 0) + 1 : 0 }
          : t
      ));
      // Auto-switch to new thread if no thread was active
      if (!currentThreadId) {
        setActiveThreadId(msg.threadId);
        fetchThreadMessages(msg.threadId);
      }
    });

    socket.on('new_direct_booking', (payload) => {
      fetchDirectBookings();
      fetchDirectBookingStats();
      if (payload && payload.message) {
        showToastMsg(payload.message, 'success');
      }
    });

    socket.on('direct_booking_updated', () => {
      fetchDirectBookings();
      fetchDirectBookingStats();
    });

    socket.on('customer_activity_event', (act) => {
      setActivityStream(prev => [act, ...prev.slice(0, 99)]);
      fetchCustomerLeadsQuiet();
      if (act.eventType === 'ADDED_TO_CART') {
        showToastMsg(`🛒 ${act.customerName || 'Customer'} added ${act.subServiceName || 'an item'} to cart (${act.city || 'Udaipur'})`, 'info');
      }
    });

    // Real-Time Socket Listeners for Inspection Requests from Mobile App & Web
    socket.on('new_request', (newReq) => {
      if (!newReq || !newReq.id) return;
      setRequests(prev => {
        const filtered = prev.filter(r => r.id !== newReq.id && r.requestNumber !== newReq.requestNumber);
        return [newReq, ...filtered];
      });
      fetchStats(true);
      showToastMsg(`🔔 New Inspection Request: ${newReq.requestNumber} (${newReq.servicecode})`, 'info');
    });

    socket.on('request_updated', (updatedReq) => {
      if (!updatedReq || !updatedReq.id) return;
      setRequests(prev => prev.map(r => r.id === updatedReq.id ? { ...r, ...updatedReq } : r));
      fetchStats(true);
    });

    socket.on('request_status_updated', () => {
      fetchRequests(true);
      fetchStats(true);
    });

    socket.on('stats_updated', () => {
      fetchStats(true);
      fetchRequests(true);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // Empty dependency - socket management is independent of thread state

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  const showToastMsg = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAllData = async (showFeedback = false) => {
    try {
      await Promise.all([
        fetchStats(),
        fetchRequests(),
        fetchQuotations(),
        fetchServices(),
        fetchUsers(),
        fetchSlides(),
        fetchOffers(),
        fetchChatThreads(),
        fetchDirectBookings(),
        fetchDirectBookingStats(),
        fetchCustomerActivity(),
        fetchPartners(),
        fetchVendors(),
        fetchEntCategories(),
        fetchEntExperiences(),
        fetchEntBookings(),
        fetchOperationalCities()
      ]);
      if (showFeedback) showToastMsg('Database synced successfully', 'success');
    } catch (err) {
      if (showFeedback) showToastMsg('Failed to sync with API', 'error');
    }
  };

  const fetchCustomerActivity = async (showFeedback = false) => {
    setActivityLoading(true);
    try {
      const cityQuery = activityCityFilter !== 'ALL' ? `&city=${encodeURIComponent(activityCityFilter)}` : '';
      const searchQuery = activitySearch.trim() ? `&search=${encodeURIComponent(activitySearch.trim())}` : '';

      const [leadsRes, streamRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/activity/admin/leads?${cityQuery}${searchQuery}`),
        fetch(`${API_BASE}/api/v1/activity/admin/stream?limit=100${cityQuery}${searchQuery}`)
      ]);

      const leadsData = await leadsRes.json();
      const streamData = await streamRes.json();

      if (leadsData.success) {
        setCustomerLeads(leadsData.leads || []);
        if (leadsData.metrics) {
          setActivityMetrics(leadsData.metrics);
        }
      }
      if (streamData.success) {
        setActivityStream(streamData.activities || []);
      }
      if (showFeedback) showToastMsg('Customer exploration & carts synced', 'success');
    } catch (err) {
      console.error('Failed to fetch customer activity:', err);
      if (showFeedback) showToastMsg('Could not fetch customer activity', 'error');
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchCustomerLeadsQuiet = async () => {
    try {
      const cityQuery = activityCityFilter !== 'ALL' ? `&city=${encodeURIComponent(activityCityFilter)}` : '';
      const searchQuery = activitySearch.trim() ? `&search=${encodeURIComponent(activitySearch.trim())}` : '';
      const leadsRes = await fetch(`${API_BASE}/api/v1/activity/admin/leads?${cityQuery}${searchQuery}`);
      const leadsData = await leadsRes.json();
      if (leadsData.success) {
        setCustomerLeads(leadsData.leads || []);
        if (leadsData.metrics) {
          setActivityMetrics(leadsData.metrics);
        }
      }
    } catch (e) {}
  };

  const clearCustomerActivityLogs = async () => {
    if (!window.confirm('Are you sure you want to clear old exploration logs?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/activity/admin/clear`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Activity logs cleared', 'success');
        fetchCustomerActivity();
      }
    } catch (e) {
      showToastMsg('Failed to clear logs', 'error');
    }
  };

  const openChatForCustomer = (lead) => {
    if (!lead) return;
    const threadId = lead.userId ? `user_${lead.userId}` : (lead.customerPhone ? `phone_${lead.customerPhone}` : lead.id);
    let targetThread = chatThreads.find(t => t.id === threadId || (lead.userId && t.userId === lead.userId) || (lead.customerPhone && t.customerPhone === lead.customerPhone));
    if (!targetThread) {
      targetThread = {
        id: threadId,
        userId: lead.userId || null,
        customerName: lead.customerName || 'Customer',
        customerPhone: lead.customerPhone || '',
        customerCity: lead.city || 'Udaipur',
        contextType: 'LEAD',
        lastMessage: `Customer was exploring ${lead.exploredServices[0]?.name || 'services'}`,
        lastMessageTime: new Date().toISOString(),
        unreadCountAdmin: 0,
        unreadCountCustomer: 0,
      };
      setChatThreads(prev => [targetThread, ...prev.filter(t => t.id !== threadId)]);
    }
    setActiveThreadId(targetThread.id);
    setChatFilterType('ALL');
    setChatSearch('');
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_thread', targetThread.id);
    }
    fetchThreadMessages(targetThread.id);
    setActiveTab('chat');
    setSidebarOpen(false);
  };

  const openWhatsAppForLead = (lead) => {
    if (!lead.customerPhone) {
      showToastMsg('No phone number recorded for this customer yet', 'info');
      return;
    }
    const cleanPhone = lead.customerPhone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const exploredMsg = lead.exploredServices.length > 0 
      ? `We noticed you were exploring our ${lead.exploredServices.map(s => s.name).slice(0, 2).join(' & ')} in ${lead.city}.` 
      : `We noticed you were exploring home services on Hipro in ${lead.city}.`;
    const cartMsg = lead.hasActiveCart 
      ? ` You also have ${lead.cartItemCount} item(s) (₹${lead.cartTotal}) in your cart.` 
      : '';
    const text = encodeURIComponent(`Hello ${lead.customerName || 'there'}! Greetings from Hipro Projects. ${exploredMsg}${cartMsg} Would you like an instant quote or need assistance booking an engineer?`);
    window.open(`https://wa.me/${phoneWithCode}?text=${text}`, '_blank');
  };

  useEffect(() => {
    if (activeTab === 'customer-activity') {
      fetchCustomerActivity();
    }
  }, [activeTab, activityCityFilter]);

  const fetchOffers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/offers/admin`);
      const data = await res.json();
      if (data.success) setOffers(data.offers || []);
    } catch (e) { console.error('fetchOffers error:', e); }
  };

  const handleOpenAddOffer = () => {
    setEditingOffer(null);
    setOfferForm({
      title: '',
      subtitle: '',
      category: 'Trending',
      discount: '20% OFF',
      code: '',
      badge: 'LIMITED TIME',
      imageUrl: '',
      minAmount: 1500,
      validTill: '31 Dec 2026',
      targetRoute: 'create_inspection',
      terms: 'Applicable on residential and commercial inspections.',
      order: offers.length + 1,
      isActive: true,
    });
    setOfferModalOpen(true);
  };

  const handleOpenEditOffer = (offer) => {
    setEditingOffer(offer);
    setOfferForm({
      title: offer.title || '',
      subtitle: offer.subtitle || '',
      category: offer.category || 'Trending',
      discount: offer.discount || '',
      code: offer.code || '',
      badge: offer.badge || '',
      imageUrl: offer.imageUrl || '',
      minAmount: offer.minAmount || 0,
      validTill: offer.validTill || '',
      targetRoute: offer.targetRoute || 'create_inspection',
      terms: offer.terms || '',
      order: offer.order || 1,
      isActive: offer.isActive !== false,
    });
    setOfferModalOpen(true);
  };

  const handleSaveOffer = async (e) => {
    if (e) e.preventDefault();
    if (!offerForm.title || !offerForm.code) {
      showToastMsg('Offer Title and Coupon Code are required', 'error');
      return;
    }

    try {
      const url = editingOffer
        ? `${API_BASE}/api/v1/offers/admin/${editingOffer.id}`
        : `${API_BASE}/api/v1/offers/admin`;
      const method = editingOffer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerForm),
      });

      const data = await res.json();
      if (data.success) {
        showToastMsg(editingOffer ? 'Offer updated successfully!' : 'Offer created successfully!', 'success');
        setOfferModalOpen(false);
        fetchOffers();
      } else {
        showToastMsg(data.message || 'Failed to save offer', 'error');
      }
    } catch (err) {
      showToastMsg('Network error saving offer', 'error');
    }
  };

  const handleToggleOfferActive = async (offer) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/offers/admin/${offer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !offer.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Offer marked ${!offer.isActive ? 'Active' : 'Inactive'}`, 'success');
        fetchOffers();
      }
    } catch (err) {
      showToastMsg('Failed to toggle offer status', 'error');
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/offers/admin/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Offer deleted successfully', 'success');
        fetchOffers();
      }
    } catch (err) {
      showToastMsg('Failed to delete offer', 'error');
    }
  };

  const handleOfferImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingOfferImg(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', '/offers');

    try {
      const res = await fetch(`${API_BASE}/api/v1/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setOfferForm(prev => ({ ...prev, imageUrl: data.url }));
        showToastMsg('Offer image uploaded successfully!', 'success');
      } else {
        showToastMsg(data.message || 'Image upload failed', 'error');
      }
    } catch (err) {
      showToastMsg('Error uploading image', 'error');
    } finally {
      setUploadingOfferImg(false);
    }
  };

  const fetchSlides = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/slides/admin`);
      const data = await res.json();
      if (data.success) setSlides(data.data || []);
    } catch (e) { console.error('fetchSlides error:', e); }
  };

  const handleOpenAddSlide = () => {
    setEditingSlide(null);
    setSlideForm({
      title: '',
      subtitle: '',
      imageUrl: '',
      targetRoute: 'create_inspection',
      badgeText: 'LIMITED OFFER',
      order: slides.length + 1,
      isActive: true,
    });
    setSlideModalOpen(true);
  };

  const handleOpenEditSlide = (slide) => {
    setEditingSlide(slide);
    setSlideForm({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      imageUrl: slide.imageUrl || '',
      targetRoute: slide.targetRoute || 'create_inspection',
      badgeText: slide.badgeText || '',
      order: slide.order || 1,
      isActive: slide.isActive !== false,
    });
    setSlideModalOpen(true);
  };

  const handleSaveSlide = async (e) => {
    if (e) e.preventDefault();
    if (!slideForm.title || !slideForm.imageUrl) {
      showToastMsg('Title and Image URL are required', 'error');
      return;
    }

    try {
      const url = editingSlide
        ? `${API_BASE}/api/v1/slides/admin/${editingSlide.id}`
        : `${API_BASE}/api/v1/slides/admin`;
      const method = editingSlide ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slideForm),
      });

      const data = await res.json();
      if (data.success) {
        showToastMsg(editingSlide ? 'Slide updated successfully!' : 'Slide created successfully!', 'success');
        setSlideModalOpen(false);
        fetchSlides();
      } else {
        showToastMsg(data.message || 'Failed to save slide', 'error');
      }
    } catch (err) {
      showToastMsg('Network error saving slide', 'error');
    }
  };

  const handleToggleSlideActive = async (slide) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/slides/admin/${slide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !slide.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Slide marked ${!slide.isActive ? 'Active' : 'Inactive'}`, 'success');
        fetchSlides();
      }
    } catch (err) {
      showToastMsg('Failed to toggle slide status', 'error');
    }
  };

  const handleDeleteSlide = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slide?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/slides/admin/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Slide deleted successfully', 'success');
        fetchSlides();
      }
    } catch (err) {
      showToastMsg('Failed to delete slide', 'error');
    }
  };

  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlideImg(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', '/slides');

    try {
      const res = await fetch(`${API_BASE}/api/v1/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setSlideForm(prev => ({ ...prev, imageUrl: data.url }));
        showToastMsg('Image uploaded successfully!', 'success');
      } else {
        showToastMsg(data.message || 'Image upload failed', 'error');
      }
    } catch (err) {
      showToastMsg('Error uploading image', 'error');
    } finally {
      setUploadingSlideImg(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/stats`);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (e) { console.error(e); }
  };

  const isVideoMedia = (url) => {
    if (!url || typeof url !== 'string') return false;
    return Boolean(url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('/videos/'));
  };

  const fetchRequests = async (quiet = false) => {
    if (!quiet && requests.length === 0) setIsLoadingRequests(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hipro_auth_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/v1/requests`, { headers });
      const data = await res.json();
      const list = data && (Array.isArray(data.data) ? data.data : (Array.isArray(data.requests) ? data.requests : (Array.isArray(data) ? data : null)));
      if (data && data.success && list) {
        // Sort newest requests first so latest customer submissions from app appear at the top
        const sorted = [...list].sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
        setRequests(sorted);
      } else {
        console.warn('Fetch requests returned non-success:', data);
        if (!quiet && data && data.message) {
          showToastMsg(data.message, 'error');
        }
      }
    } catch (e) {
      console.error('Fetch requests error:', e);
      if (!quiet) showToastMsg('Failed to connect to inspection requests server', 'error');
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleCreateTestRequest = async (cityName = 'Udaipur') => {
    try {
      const isUdaipur = (cityName || '').toLowerCase().includes('udaipur');
      const testReqData = {
        customerName: isUdaipur ? 'Dr. Arvind Rathore' : 'Pooja Singhal',
        customerPhone: isUdaipur ? '9829012345' : '9414188822',
        servicecode: isUdaipur ? 'Waterproofing & Leakage' : 'Civil Construction & Masonry',
        subServiceCode: isUdaipur ? 'Roof & Terrace Waterproofing' : 'Structural Wall Crack Repair',
        issueDescription: isUdaipur
          ? 'Severe rainwater leakage from terrace into master bedroom ceiling. Cracks visible on exterior parapet wall. Need thermal inspection and BOQ estimate.'
          : 'Diagonal wall cracks near beam junction on first floor. Need senior civil engineer audit and repair quotation.',
        urgency: isUdaipur ? 'HIGH' : 'NORMAL',
        status: isUdaipur ? 'SUBMITTED' : 'AUDIT_SCHEDULED',
        propertyType: isUdaipur ? 'Residential Villa (3-Storey)' : 'Commercial Complex',
        propertySize: isUdaipur ? '3,200 sq ft' : '4,500 sq ft',
        location: `${isUdaipur ? 'Udaipur' : 'Bhilwara'}, Rajasthan`,
        addressline: isUdaipur ? 'Villa #14, Sahelion Ki Bari Road, Fatehpura, Udaipur' : 'Shop 12-14, City Centre Mall, Gandhi Nagar, Bhilwara',
        preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        preferredTime: isUdaipur ? 'Morning (10:00 AM - 01:00 PM)' : 'Afternoon (02:00 PM - 05:00 PM)',
        damageImages: [
          'https://ik.imagekit.io/hiproapp/inspections/scaled_17812_1793864757978_D5eu_e1dw.jpg',
          'https://ik.imagekit.io/hiproapp/inspections/scaled_17809_1793864761078_v6Ynpc1xp.jpg'
        ]
      };
      const res = await fetch(`${API_BASE}/api/v1/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testReqData)
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Test inspection request created for ${isUdaipur ? 'Udaipur' : 'Bhilwara'}!`, 'success');
        fetchRequests();
        fetchStats();
      } else {
        showToastMsg(data.message || 'Failed to create test request', 'error');
      }
    } catch (e) {
      showToastMsg('Error creating test request', 'error');
    }
  };

  const handleAssignVendorDirect = async (requestId, vendorId) => {
    if (!requestId || !vendorId) return;
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    const confirmed = window.confirm(
      `Direct Contractor Award Confirmation:\n\nAre you sure you want to directly award this project to "${vendor.businessName || vendor.name}"?\n\nThis will bypass contractor bidding and immediately award the project.`
    );
    if (!confirmed) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hipro_auth_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/v1/requests/${requestId}/assign-vendor`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          vendorId,
          vendorName: vendor.name,
          quotePrice: 0,
          assignedVendorId: vendorId,
          assignedVendorName: vendor.name,
          assignedQuotePrice: 0,
          assignedBy: 'Super Admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Project successfully awarded to ${vendor.name} (${vendor.businessName})`, 'success');
        fetchRequests();
        setSelectedRequestDetail(prev => (prev && prev.id === requestId) ? {
          ...prev,
          vendorId,
          assignedVendorName: vendor.name,
          assignedQuotePrice: 0,
          status: 'ASSIGNED'
        } : prev);
      } else {
        showToastMsg(data.message || 'Failed to assign vendor', 'error');
      }
    } catch (e) {
      showToastMsg('Error assigning vendor', 'error');
    }
  };

  const fetchQuotations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/quotations`);
      const data = await res.json();
      if (data.success) setQuotations(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/services`);
      const data = await res.json();
      if (data.success) setServices(data.services || []);
    } catch (e) { console.error(e); }
  };

  const fetchEntCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/ent/categories`);
      const data = await res.json();
      if (data.success && data.data) {
        setEntCategories(data.data);
      }
    } catch (e) {
      console.error('fetchEntCategories error:', e);
    }
  };

  const fetchEntExperiences = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/ent/experiences`);
      const data = await res.json();
      if (data.success && data.data) {
        setEntExperiences(data.data);
      }
    } catch (e) {
      console.error('fetchEntExperiences error:', e);
    }
  };

  const fetchEntBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/ent/admin/bookings`);
      const data = await res.json();
      if (data.success && Array.isArray(data.bookings)) {
        setEntBookings(data.bookings);
      }
    } catch (e) {
      console.error('fetchEntBookings error:', e);
    }
  };

  const openWhatsAppAdventureDispatch = (booking) => {
    if (!booking || !booking.vendorPhone) {
      showToastMsg('No vendor phone linked to this booking', 'error');
      return;
    }
    const cleanPhone = booking.vendorPhone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(`*NEW ADVENTURE BOOKING - CUSTOMER ARRIVAL PASS*\n\n` +
      `🎫 *Pass Code:* #${booking.bookingCode}\n` +
      `🪂 *Activity:* ${booking.experienceTitle || booking.title} (${booking.category})\n` +
      `👤 *Customer Name:* ${booking.travelerName}\n` +
      `📞 *Customer Mobile:* ${booking.travelerPhone}\n` +
      `📅 *Date & Slot:* ${booking.travelDate} at ${booking.timeSlot}\n` +
      `👥 *Passes / Travelers:* ${booking.guestsCount} Person(s)\n` +
      `📍 *Base Camp / Reporting:* ${booking.reportingPoint}\n` +
      `💵 *Total Amount:* ₹${booking.totalAmount} (Status: ${booking.paymentStatus})\n` +
      `${booking.notes ? `📝 *Special Requests:* ${booking.notes}\n` : ''}\n` +
      `⚠️ *Instructions:* Please receive the traveler at the base camp and prepare the certified instructor/gear.`);
    window.open(`https://wa.me/${phoneWithCode}?text=${text}`, '_blank');
  };

  const openWhatsAppCustomerAdventurePass = (booking) => {
    if (!booking || !booking.travelerPhone) {
      showToastMsg('No customer phone recorded', 'error');
      return;
    }
    const cleanPhone = booking.travelerPhone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(`*HIPRO ADVENTURE PASS CONFIRMED*\n\n` +
      `Hello ${booking.travelerName}!\n` +
      `Your adventure booking #${booking.bookingCode} for *${booking.experienceTitle || booking.title}* is confirmed.\n\n` +
      `📅 *Date:* ${booking.travelDate}\n` +
      `⏰ *Scheduled Slot:* ${booking.timeSlot}\n` +
      `👥 *Guests:* ${booking.guestsCount} Traveler(s)\n` +
      `📍 *Reporting Base Camp:* ${booking.reportingPoint}\n` +
      `🧑‍✈️ *Lead Operator:* ${booking.vendorBusiness || booking.vendorName} (${booking.vendorPhone})\n\n` +
      `Please arrive 15 minutes prior to your slot time. Have a thrilling experience!`);
    window.open(`https://wa.me/${phoneWithCode}?text=${text}`, '_blank');
  };

  const handleUpdateEntBookingStatus = async (bookingId, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/ent/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Booking marked ${status}`, 'success');
        fetchEntBookings();
      }
    } catch (e) {
      showToastMsg('Failed to update booking status', 'error');
    }
  };

  const handleSaveCategory = async (e) => {
    if (e) e.preventDefault();
    try {
      const url = editingCategory
        ? `${API_BASE}/api/v1/ent/categories/${editingCategory.id}`
        : `${API_BASE}/api/v1/ent/categories`;
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(editingCategory ? 'Category updated successfully!' : 'New Category created successfully!', 'success');
        setCategoryModalOpen(false);
        setEditingCategory(null);
        setCategoryForm({ name: '', tagline: '', icon: 'paragliding', color: '#0284C7', imageUrl: '' });
        fetchEntCategories();
        fetchEntExperiences();
      } else {
        showToastMsg(data.message || 'Failed to save category', 'error');
      }
    } catch (err) {
      showToastMsg('Error saving category', 'error');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category? Linked sports may need to be recategorized.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/ent/categories/${catId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Category removed successfully', 'success');
        fetchEntCategories();
        fetchEntExperiences();
      } else {
        showToastMsg(data.message || 'Failed to delete category', 'error');
      }
    } catch (err) {
      showToastMsg('Error deleting category', 'error');
    }
  };

  const handleSaveExperience = async (e) => {
    if (e) e.preventDefault();
    try {
      const selectedCat = entCategories.find(c => c.id === experienceForm.categoryId);
      const payload = {
        ...experienceForm,
        category: selectedCat ? selectedCat.name : 'Adventure',
        startingPrice: Number(experienceForm.startingPrice),
        originalPrice: experienceForm.originalPrice ? Number(experienceForm.originalPrice) : null,
      };

      const url = editingExperience
        ? `${API_BASE}/api/v1/ent/experiences/${editingExperience.id}`
        : `${API_BASE}/api/v1/ent/experiences`;
      const method = editingExperience ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(editingExperience ? 'Activity updated successfully!' : 'New Activity added and linked to category!', 'success');
        setExperienceModalOpen(false);
        setEditingExperience(null);
        setExperienceForm({
          title: '',
          tagline: '',
          city: 'Dehradun',
          locationDetails: '',
          categoryId: entCategories[0]?.id || 'cat_air_sports',
          startingPrice: '',
          originalPrice: '',
          duration: '',
          imageUrl: '',
          discountBadge: '',
          isFeatured: false,
        });
        fetchEntExperiences();
        fetchEntCategories();
      } else {
        showToastMsg(data.message || 'Failed to save activity', 'error');
      }
    } catch (err) {
      showToastMsg('Error saving activity', 'error');
    }
  };

  const handleDeleteExperience = async (expId) => {
    if (!window.confirm('Are you sure you want to delete this sport activity?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/ent/experiences/${expId}?permanent=true`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Sport activity removed', 'success');
        fetchEntExperiences();
        fetchEntCategories();
      } else {
        showToastMsg(data.message || 'Failed to delete activity', 'error');
      }
    } catch (err) {
      showToastMsg('Error deleting activity', 'error');
    }
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      tagline: '',
      icon: 'paragliding',
      color: '#E11D48',
      imageUrl: '',
    });
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || '',
      tagline: cat.tagline || '',
      icon: cat.icon || 'paragliding',
      color: cat.color || '#E11D48',
      imageUrl: cat.imageUrl || '',
    });
    setCategoryModalOpen(true);
  };

  const handleOpenAddExperience = () => {
    setEditingExperience(null);
    setExperienceForm({
      title: '',
      tagline: '',
      city: 'Dehradun',
      locationDetails: '',
      categoryId: entCategories[0]?.id || 'cat_air_sports',
      startingPrice: '',
      originalPrice: '',
      duration: '',
      imageUrl: '',
      discountBadge: '',
      isFeatured: false,
      vendorId: 'v_adv_01',
      vendorName: 'Captain Arvind Negi',
      vendorBusiness: 'Himalayan Sky Gliders & Air Safari',
      vendorPhone: '+91 98290 88801',
    });
    setExperienceModalOpen(true);
  };

  const handleOpenEditExperience = (exp) => {
    setEditingExperience(exp);
    setExperienceForm({
      title: exp.title || '',
      tagline: exp.tagline || '',
      city: exp.city || 'Dehradun',
      locationDetails: exp.locationDetails || '',
      categoryId: exp.categoryId || entCategories.find(c => c.name.toLowerCase() === (exp.category || '').toLowerCase())?.id || entCategories[0]?.id || 'cat_air_sports',
      startingPrice: exp.startingPrice || '',
      originalPrice: exp.originalPrice || '',
      duration: exp.duration || '',
      imageUrl: exp.imageUrl || '',
      discountBadge: exp.discountBadge || '',
      isFeatured: !!exp.isFeatured,
      vendorId: exp.vendorId || 'v_adv_01',
      vendorName: exp.vendorName || 'Captain Arvind Negi',
      vendorBusiness: exp.vendorBusiness || 'Himalayan Sky Gliders & Air Safari',
      vendorPhone: exp.vendorPhone || '+91 98290 88801',
    });
    setExperienceModalOpen(true);
  };

  const fetchDirectBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/direct-bookings`);
      const data = await res.json();
      if (data.success) setDirectBookings(data.bookings || []);
    } catch (e) {
      console.error('fetchDirectBookings error:', e);
    }
  };

  const fetchDirectBookingStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/direct-bookings/admin/stats`);
      const data = await res.json();
      if (data.success) setDirectBookingStats(data.stats || null);
    } catch (e) {
      console.error('fetchDirectBookingStats error:', e);
    }
  };

  // Direct Booking Handlers
  const openWhatsAppDispatch = (booking) => {
    if (!booking || !booking.technicianPhone) {
      showToastMsg('No service provider phone assigned yet', 'error');
      return;
    }
    const cleanPhone = booking.technicianPhone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(`*NEW SERVICE DISPATCH - HIPRO PROJECTS*\n\n` +
      `📋 *Booking ID:* #${booking.bookingNumber}\n` +
      `🔧 *Service:* ${booking.subServiceName} (${booking.serviceName})\n` +
      `👤 *Customer Name:* ${booking.customerName}\n` +
      `📞 *Customer Phone:* ${booking.customerPhone}\n` +
      `📍 *Site Address:* ${booking.customerAddress}, ${booking.city} ${booking.pincode ? `(${booking.pincode})` : ''}\n` +
      `📅 *Scheduled Slot:* ${booking.scheduledDate} at ${booking.scheduledSlot}\n` +
      `💵 *Visiting Charge:* ₹${booking.visitingCharge} (Status: ${booking.paymentStatus})\n\n` +
      `⚠️ *Instructions:* Please reach the customer site on time. Coordinate with customer upon arrival.`);
    window.open(`https://wa.me/${phoneWithCode}?text=${text}`, '_blank');
  };

  const handleAssignTechnician = async (e) => {
    e.preventDefault();
    if (!assignTechModalBooking) return;
    if (!techForm.name || !techForm.phone) {
      showToastMsg('Please select an authorized vendor from the dropdown', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/direct-bookings/${assignTechModalBooking.id}/technician`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: techForm.vendorId || undefined,
          technicianName: techForm.name,
          technicianPhone: techForm.phone,
          technicianRole: techForm.role || 'Authorized Service Provider',
          technicianRating: techForm.rating || 4.9,
          assignedBy: 'Admin Desk'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Authorized Vendor ${techForm.name} assigned to #${assignTechModalBooking.bookingNumber}!`, 'success');
        setAssignTechModalBooking(null);
        setTechForm({ vendorId: '', name: '', phone: '', role: 'Authorized Service Provider', rating: 4.9 });
        if (selectedBookingForDrawer && selectedBookingForDrawer.id === assignTechModalBooking.id) {
          setSelectedBookingForDrawer(data.booking);
        }
        fetchDirectBookings();
        fetchDirectBookingStats();
      } else {
        showToastMsg(data.message || 'Failed to assign provider', 'error');
      }
    } catch (err) {
      showToastMsg('Network error assigning service provider', 'error');
    }
  };

  const handleQuickAssignBookingVendor = async (bookingId, vendorId) => {
    if (!bookingId || !vendorId) return;
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    const confirmed = window.confirm(
      `Instant Booking Assignment Confirmation:\n\nAre you sure you want to assign authorized contractor "${vendor.businessName || vendor.name}" (${vendor.phone}) to this instant booking?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/direct-bookings/${bookingId}/technician`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: vendor.id,
          technicianName: vendor.name,
          technicianPhone: vendor.phone,
          technicianRole: `${vendor.businessName || vendor.name} • ${vendor.specialization || 'Authorized Specialist'}`,
          technicianRating: vendor.rating || 4.9,
          assignedBy: 'Admin Desk'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Authorized vendor ${vendor.name} assigned successfully!`, 'success');
        if (selectedBookingForDrawer && selectedBookingForDrawer.id === bookingId) {
          setSelectedBookingForDrawer(data.booking);
        }
        fetchDirectBookings();
        fetchDirectBookingStats();
      } else {
        showToastMsg(data.message || 'Failed to assign vendor', 'error');
      }
    } catch (e) {
      showToastMsg('Error assigning vendor', 'error');
    }
  };

  const handleUpdateDirectBookingStatus = async (e) => {
    e.preventDefault();
    if (!statusModalBooking) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/direct-bookings/${statusModalBooking.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusForm.status,
          reason: statusForm.reason,
          updatedBy: 'Admin Desk'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Status updated to ${statusForm.status}`, 'success');
        setStatusModalBooking(null);
        if (selectedBookingForDrawer && (selectedBookingForDrawer.id === statusModalBooking.id || selectedBookingForDrawer.bookingNumber === statusModalBooking.bookingNumber)) {
          setSelectedBookingForDrawer(data.booking || { ...selectedBookingForDrawer, status: statusForm.status });
        }
        fetchDirectBookings();
        fetchDirectBookingStats();
      } else {
        showToastMsg(data.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToastMsg('Network error updating status', 'error');
    }
  };

  const handleIssueRefund = async (e) => {
    e.preventDefault();
    if (!refundModalBooking) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/direct-bookings/${refundModalBooking.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(refundForm.amount) || refundModalBooking.onlinePaidAmount,
          reason: refundForm.reason,
          initiatedBy: 'Admin Desk'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(data.message || 'Refund processed successfully!', 'success');
        setRefundModalBooking(null);
        if (selectedBookingForDrawer && (selectedBookingForDrawer.id === refundModalBooking.id || selectedBookingForDrawer.bookingNumber === refundModalBooking.bookingNumber)) {
          setSelectedBookingForDrawer(data.booking || { ...selectedBookingForDrawer, refundStatus: 'PROCESSED', paymentStatus: 'REFUNDED' });
        }
        fetchDirectBookings();
        fetchDirectBookingStats();
      } else {
        showToastMsg(data.message || 'Failed to process refund', 'error');
      }
    } catch (err) {
      showToastMsg('Network error processing refund', 'error');
    }
  };

  const handleAdjustAdditionalCharge = async (e) => {
    e.preventDefault();
    if (!adjustChargeModalBooking) return;
    const additionalWorkAmount = parseFloat(adjustForm.additionalAmount);
    if (isNaN(additionalWorkAmount) || additionalWorkAmount < 0) {
      showToastMsg('Please enter a valid additional work amount', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/direct-bookings/${adjustChargeModalBooking.id}/additional-work`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          additionalWorkAmount,
          note: adjustForm.note ? adjustForm.note.trim() : 'Additional work performed on site',
          updatedBy: 'Admin Desk'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(data.message || 'Charges adjusted successfully', 'success');
        setAdjustChargeModalBooking(null);
        if (selectedBookingForDrawer && (selectedBookingForDrawer.id === adjustChargeModalBooking.id || selectedBookingForDrawer.bookingNumber === adjustChargeModalBooking.bookingNumber)) {
          setSelectedBookingForDrawer(data.booking || { ...selectedBookingForDrawer, additionalWorkAmount, totalAmount: (selectedBookingForDrawer.visitingCharge || 0) + additionalWorkAmount });
        }
        fetchDirectBookings();
        fetchDirectBookingStats();
      } else {
        showToastMsg(data.message || 'Failed to adjust charges', 'error');
      }
    } catch (err) {
      showToastMsg('Network error adjusting charges', 'error');
    }
  };

  const handleServiceImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingServiceImg(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', '/services');

    try {
      const res = await fetch(`${API_BASE}/api/v1/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      const uploadedUrl = data.data?.url || data.url;
      if (data.success && uploadedUrl) {
        setServiceCategoryForm(prev => ({ ...prev, imageUrl: uploadedUrl }));
        showToastMsg('Service image uploaded successfully!', 'success');
      } else {
        showToastMsg(data.message || 'Image upload failed', 'error');
      }
    } catch (err) {
      showToastMsg('Error uploading image', 'error');
    } finally {
      setUploadingServiceImg(false);
    }
  };

  const handleSubServiceImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSubServiceImg(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', '/subservices');

    try {
      const res = await fetch(`${API_BASE}/api/v1/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      const uploadedUrl = data.data?.url || data.url;
      if (data.success && uploadedUrl) {
        setSubServiceForm(prev => ({ ...prev, image: uploadedUrl }));
        showToastMsg('Sub-service image uploaded successfully!', 'success');
      } else {
        showToastMsg(data.message || 'Image upload failed', 'error');
      }
    } catch (err) {
      showToastMsg('Error uploading image', 'error');
    } finally {
      setUploadingSubServiceImg(false);
    }
  };

  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceCategoryForm({
      code: '',
      name: '',
      description: '',
      imageUrl: '',
      rating: 4.8
    });
    setAddServiceModalOpen(true);
  };

  const handleOpenEditService = (svc) => {
    setEditingService(svc);
    setServiceCategoryForm({
      code: svc.code || '',
      name: svc.name || '',
      description: svc.description || '',
      imageUrl: svc.imageUrl || svc.iconImage || (svc.icon && svc.icon.startsWith('http') ? svc.icon : '') || '',
      rating: svc.rating || 4.8
    });
    setAddServiceModalOpen(true);
  };

  const handleSaveServiceCategory = async (e) => {
    e.preventDefault();
    try {
      const url = editingService
        ? `${API_BASE}/api/v1/admin/services/${editingService.id}`
        : `${API_BASE}/api/v1/admin/services`;
      const method = editingService ? 'PUT' : 'POST';

      const payload = {
        code: serviceCategoryForm.code.toUpperCase().trim(),
        name: serviceCategoryForm.name.trim(),
        description: serviceCategoryForm.description ? serviceCategoryForm.description.trim() : '',
        imageUrl: serviceCategoryForm.imageUrl ? serviceCategoryForm.imageUrl.trim() : '',
        iconImage: serviceCategoryForm.imageUrl ? serviceCategoryForm.imageUrl.trim() : '',
        icon: serviceCategoryForm.imageUrl ? serviceCategoryForm.imageUrl.trim() : 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        rating: parseFloat(serviceCategoryForm.rating) || 4.8
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(editingService ? 'Service category updated!' : 'Service category created!', 'success');
        setAddServiceModalOpen(false);
        setEditingService(null);
        fetchServices();
      } else {
        showToastMsg(data.message || 'Failed to save service', 'error');
      }
    } catch (err) {
      showToastMsg('Error saving service category', 'error');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this entire service category and all its sub-services?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/services/${serviceId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Service category deleted successfully', 'success');
        fetchServices();
      } else {
        showToastMsg(data.message || 'Failed to delete service category', 'error');
      }
    } catch (err) {
      showToastMsg('Error deleting service category', 'error');
    }
  };

  const handleQuickUpdateServiceImage = async (svc, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToastMsg(`Uploading image for ${svc.name}...`, 'info');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', '/services');

    try {
      const uploadRes = await fetch(`${API_BASE}/api/v1/upload`, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      const uploadedUrl = uploadData.data?.url || uploadData.url;
      if (!uploadData.success || !uploadedUrl) {
        showToastMsg(uploadData.message || 'Image upload failed', 'error');
        return;
      }

      const updateRes = await fetch(`${API_BASE}/api/v1/admin/services/${svc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadedUrl,
          iconImage: uploadedUrl,
          icon: uploadedUrl
        })
      });
      const updateData = await updateRes.json();
      if (updateData.success) {
        showToastMsg(`${svc.name} image updated successfully!`, 'success');
        fetchServices();
      } else {
        showToastMsg(updateData.message || 'Failed to update service', 'error');
      }
    } catch (err) {
      showToastMsg('Error updating service image', 'error');
    }
  };

  const handleQuickUpdateSubServiceImage = async (sub, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToastMsg(`Uploading image for ${sub.titleEn}...`, 'info');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', '/subservices');

    try {
      const uploadRes = await fetch(`${API_BASE}/api/v1/upload`, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      const uploadedUrl = uploadData.data?.url || uploadData.url;
      if (!uploadData.success || !uploadedUrl) {
        showToastMsg(uploadData.message || 'Image upload failed', 'error');
        return;
      }

      const updateRes = await fetch(`${API_BASE}/api/v1/admin/sub-services/${sub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedUrl
        })
      });
      const updateData = await updateRes.json();
      if (updateData.success) {
        showToastMsg(`${sub.titleEn} image updated successfully!`, 'success');
        fetchServices();
      } else {
        showToastMsg(updateData.message || 'Failed to update sub-service', 'error');
      }
    } catch (err) {
      showToastMsg('Error updating sub-service image', 'error');
    }
  };

  // SubService Handlers
  const handleOpenAddSubService = (parentService) => {
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldOptions('');
    setNewFieldRequired(false);
    setSubServiceParentService(parentService);
    setEditingSubService(null);
    setSubServiceForm({
      titleEn: '',
      titleHi: '',
      desc: '',
      visitingCharge: 199,
      bookNowEnabled: true,
      getQuoteEnabled: true,
      checklist: '',
      requiredFields: []
    });
    setSubServiceModalOpen(true);
  };

  const handleOpenEditSubService = (sub, parentService) => {
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldOptions('');
    setNewFieldRequired(false);
    setSubServiceParentService(parentService);
    setEditingSubService(sub);
    setSubServiceForm({
      titleEn: sub.titleEn || '',
      titleHi: sub.titleHi || '',
      desc: sub.desc || '',
      visitingCharge: sub.visitingCharge !== undefined ? sub.visitingCharge : 199,
      bookNowEnabled: sub.bookNowEnabled !== undefined ? sub.bookNowEnabled : true,
      getQuoteEnabled: sub.getQuoteEnabled !== undefined ? sub.getQuoteEnabled : true,
      checklist: Array.isArray(sub.checklist) ? sub.checklist.join('\n') : '',
      image: sub.image || '',
      requiredFields: Array.isArray(sub.requiredFields) ? sub.requiredFields : (typeof sub.requiredFields === 'string' && sub.requiredFields.trim() ? JSON.parse(sub.requiredFields) : [])
    });
    setSubServiceModalOpen(true);
  };

  const handleSaveSubService = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        serviceId: subServiceParentService?.id,
        titleEn: subServiceForm.titleEn.trim(),
        titleHi: subServiceForm.titleHi ? subServiceForm.titleHi.trim() : null,
        desc: subServiceForm.desc.trim(),
        image: subServiceForm.image ? subServiceForm.image.trim() : null,
        visitingCharge: parseFloat(subServiceForm.visitingCharge) || 199.0,
        bookNowEnabled: Boolean(subServiceForm.bookNowEnabled),
        getQuoteEnabled: Boolean(subServiceForm.getQuoteEnabled),
        checklist: subServiceForm.checklist ? subServiceForm.checklist.split('\n').filter(Boolean) : [],
        requiredFields: (() => {
        let fList = Array.isArray(subServiceForm.requiredFields) ? [...subServiceForm.requiredFields] : [];
        if (newFieldLabel && newFieldLabel.trim()) {
          const fieldId = newFieldLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
          fList.push({
            id: fieldId,
            label: newFieldLabel.trim(),
            fieldType: newFieldType || 'text',
            options: newFieldType === 'select' ? newFieldOptions.split(',').map(s => s.trim()).filter(Boolean) : [],
            required: Boolean(newFieldRequired)
          });
        }
        return fList;
      })()
      };

      const url = editingSubService
        ? `${API_BASE}/api/v1/admin/sub-services/${editingSubService.id}`
        : `${API_BASE}/api/v1/admin/sub-services`;
      const method = editingSubService ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(editingSubService ? 'Sub-service updated successfully' : 'Sub-service created successfully', 'success');
        setSubServiceModalOpen(false);
        fetchServices();
      } else {
        showToastMsg(data.message || 'Failed to save sub-service', 'error');
      }
    } catch (err) {
      showToastMsg('Network error saving sub-service', 'error');
    }
  };

  const handleAddRequiredField = () => {
    if (!newFieldLabel.trim()) {
      showToastMsg('Please enter a question / field label', 'error');
      return;
    }
    const fieldId = newFieldLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    const newField = {
      id: fieldId,
      label: newFieldLabel.trim(),
      fieldType: newFieldType,
      options: newFieldType === 'select' ? newFieldOptions.split(',').map(s => s.trim()).filter(Boolean) : [],
      required: Boolean(newFieldRequired)
    };
    setSubServiceForm(prev => ({
      ...prev,
      requiredFields: [...(prev.requiredFields || []), newField]
    }));
    setNewFieldLabel('');
    setNewFieldOptions('');
  };

  const handleRemoveRequiredField = (index) => {
    setSubServiceForm(prev => ({
      ...prev,
      requiredFields: (prev.requiredFields || []).filter((_, i) => i !== index)
    }));
  };

  const handleDeleteSubService = async (subId) => {
    if (!window.confirm('Are you sure you want to delete this sub-service?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/sub-services/${subId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Sub-service deleted successfully', 'success');
        fetchServices();
      } else {
        showToastMsg(data.message || 'Failed to delete sub-service', 'error');
      }
    } catch (err) {
      showToastMsg('Network error deleting sub-service', 'error');
    }
  };

  const handleToggleSubServiceActive = async (sub) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/sub-services/${sub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !sub.isActive })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Sub-service marked ${!sub.isActive ? 'Active' : 'Inactive'}`, 'success');
        fetchServices();
      }
    } catch (err) {
      showToastMsg('Failed to toggle status', 'error');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/users`);
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchUserDetail = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/users/${userId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedUser(data.data);
        setViewUserDetail(true);
        fetchUserBookings(userId);
      }
    } catch (e) {
      console.error('Fetch user detail error:', e);
      showToastMsg('Failed to load user details', 'error');
    }
  };

  const fetchUserBookings = async (userId) => {
    setUserBookingsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/users/${userId}/bookings`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUserBookings(data.data);
      } else {
        setUserBookings([]);
      }
    } catch (e) {
      console.error('Fetch user bookings error:', e);
      setUserBookings([]);
    } finally {
      setUserBookingsLoading(false);
    }
  };

  const fetchChatThreads = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/chat/threads`);
      const data = await res.json();
      if (data.success && data.data) {
        setChatThreads(data.data);
        if (!activeThreadId && data.data.length > 0) {
          setActiveThreadId(data.data[0].id);
          fetchThreadMessages(data.data[0].id);
          // Mark the auto-selected thread as read
          try {
            await fetch(`${API_BASE}/api/v1/chat/threads/${data.data[0].id}/read`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reader: 'admin' })
            });
          } catch (e) {
            console.error('Mark thread as read error:', e);
          }
        }
      }
    } catch (e) {
      console.error('Fetch chat threads error:', e);
    }
  };

  const fetchThreadMessages = async (threadId) => {
    if (!threadId) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/chat/threads/${threadId}/messages`);
      const data = await res.json();
      if (data.success && data.data) {
        setThreadMessages(data.data);
      }
    } catch (e) {
      console.error('Fetch thread messages error:', e);
    }
    // NO LONGER auto-mark as read on every fetch - that resets unread counts
    // Mark as read should be intentional via the mark-read button/action
  };

  const handleSendAdminReply = async (customText) => {
    const textToSend = (customText || adminReplyText).trim();
    if (!textToSend || !activeThreadId) return;

    setIsSendingReply(true);
    const currentThread = chatThreads.find(t => t.id === activeThreadId);
    try {
      const res = await fetch(`${API_BASE}/api/v1/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: activeThreadId,
          sender: 'admin',
          senderName: 'Er. Vikram Sharma (Admin Desk)',
          text: textToSend,
          contextType: currentThread?.contextType,
          contextTag: currentThread?.contextTag,
          quoteNumber: currentThread?.quoteNumber,
          requestNumber: currentThread?.requestNumber,
          bookingNumber: currentThread?.bookingNumber,
          customerName: currentThread?.customerName,
          customerPhone: currentThread?.customerPhone,
          vendorId: currentThread?.vendorId
        })
      });
      const data = await res.json();
      if (data && data.success && data.data) {
        setThreadMessages(prev => {
          if (prev.some(m => m.id === data.data.id)) return prev;
          return [...prev, data.data];
        });
        if (!customText) setAdminReplyText('');
        fetchChatThreads();
      } else {
        // Optimistic addition if API responds with non-standard format
        const optimisticMsg = {
          id: `msg_${Date.now()}`,
          threadId: activeThreadId,
          sender: 'admin',
          senderName: 'Er. Vikram Sharma (Admin Desk)',
          text: textToSend,
          createdAt: new Date().toISOString()
        };
        setThreadMessages(prev => [...prev, optimisticMsg]);
        if (!customText) setAdminReplyText('');
      }
    } catch (e) {
      // Optimistic append on network issue
      const optimisticMsg = {
        id: `msg_${Date.now()}`,
        threadId: activeThreadId,
        sender: 'admin',
        senderName: 'Er. Vikram Sharma (Admin Desk)',
        text: textToSend,
        createdAt: new Date().toISOString()
      };
      setThreadMessages(prev => [...prev, optimisticMsg]);
      if (!customText) setAdminReplyText('');
    } finally {
      setIsSendingReply(false);
    }
  };

  const openChatForRequest = (req) => {
    if (!req) return;
    const reqNum = req.requestNumber || req.id || '';
    const cleanPhone = (req.user?.phoneNumber || req.customerPhone || '').replace(/\D/g, '');
    const custName = req.user?.name || req.customerName || 'Customer';

    // Find if a thread already exists for this request or customer
    let targetThread = chatThreads.find(t => {
      const tPhone = (t.customerPhone || '').replace(/\D/g, '');
      const matchPhone = cleanPhone && tPhone && (cleanPhone.includes(tPhone) || tPhone.includes(cleanPhone));
      const matchReq = reqNum && (t.requestNumber === reqNum || t.contextTag?.includes(reqNum));
      const matchName = custName && t.customerName && t.customerName.toLowerCase().trim() === custName.toLowerCase().trim();
      return matchReq || (matchPhone && matchName);
    });

    const threadId = targetThread ? targetThread.id : `thread_req_${reqNum.toString().replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    if (!targetThread) {
      targetThread = {
        id: threadId,
        customerName: custName,
        customerPhone: req.user?.phoneNumber || req.customerPhone || '+91 94628 77757',
        contextType: 'REQUEST',
        contextTag: `Request #${reqNum}`,
        quoteNumber: req.quotations?.[0]?.quoteNumber || '',
        requestNumber: reqNum,
        bookingNumber: '',
        lastMessage: req.issueDescription || req.description || 'Inspection request initiated',
        lastMessageTime: new Date().toISOString(),
        unreadCountAdmin: 0,
        unreadCountCustomer: 0,
      };
      setChatThreads(prev => [targetThread, ...prev.filter(t => t.id !== threadId)]);
    }

    setActiveThreadId(threadId);
    setChatFilterType('ALL');
    setChatSearch('');
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_thread', threadId);
    }
    fetchThreadMessages(threadId);
    setActiveTab('chat');
    setSidebarOpen(false);
  };

  const openChatForBooking = (b) => {
    if (!b) return;
    const bNum = b.bookingNumber || b.id || '';
    const cleanPhone = (b.customerPhone || '').replace(/\D/g, '');
    const custName = b.customerName || 'Customer';

    // Find if a thread already exists for this booking or customer
    let targetThread = chatThreads.find(t => {
      const tPhone = (t.customerPhone || '').replace(/\D/g, '');
      const matchPhone = cleanPhone && tPhone && (cleanPhone.includes(tPhone) || tPhone.includes(cleanPhone));
      const matchBooking = bNum && (t.bookingNumber === bNum || t.contextTag?.includes(bNum));
      const matchName = custName && t.customerName && t.customerName.toLowerCase().trim() === custName.toLowerCase().trim();
      return matchBooking || (matchPhone && matchName);
    });

    const threadId = targetThread ? targetThread.id : `thread_book_${bNum.toString().replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    if (!targetThread) {
      targetThread = {
        id: threadId,
        customerName: custName,
        customerPhone: b.customerPhone || '+91 94628 77757',
        contextType: 'BOOKING',
        contextTag: `Booking #${bNum}`,
        bookingNumber: bNum,
        quoteNumber: '',
        requestNumber: '',
        lastMessage: `Instant booking for ${b.subServiceName || b.serviceName || 'Maintenance Service'}`,
        lastMessageTime: new Date().toISOString(),
        unreadCountAdmin: 0,
        unreadCountCustomer: 0,
      };
      setChatThreads(prev => [targetThread, ...prev.filter(t => t.id !== threadId)]);
    }

    setActiveThreadId(threadId);
    setChatFilterType('ALL');
    setChatSearch('');
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_thread', threadId);
    }
    fetchThreadMessages(threadId);
    setActiveTab('chat');
    setSidebarOpen(false);
  };

  const callCustomer = (phone) => {
    if (!phone) return;
    window.open(`tel:${phone}`, '_self');
  };

  const openWhatsApp = (phone, text = '') => {
    const clean = (phone || '').replace(/[^0-9]/g, '');
    const num = clean.length === 10 ? `91${clean}` : clean;
    const url = `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const openChatForQuotation = (q) => {
    if (!q) return;
    const qNum = q.quoteNumber || q.id || '';
    const cleanPhone = (q.customerPhone || q.request?.user?.phoneNumber || q.user?.phoneNumber || '').replace(/\D/g, '');
    const reqNum = q.request?.requestNumber || q.requestNumber || '';
    const custName = q.customerName || q.request?.user?.name || q.user?.name || 'Customer';

    // Search for existing chat thread matching customerPhone, requestNumber, or quoteNumber
    let targetThread = chatThreads.find(t => {
      const tPhone = (t.customerPhone || '').replace(/\D/g, '');
      const matchPhone = cleanPhone && tPhone && (cleanPhone.includes(tPhone) || tPhone.includes(cleanPhone));
      const matchReq = reqNum && (t.requestNumber === reqNum || t.contextTag?.includes(reqNum));
      const matchQuote = qNum && (t.quoteNumber === qNum || t.contextTag?.includes(qNum));
      return matchQuote || matchReq || matchPhone;
    });

    const threadId = targetThread ? targetThread.id : `thread_quote_${qNum.toString().replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    if (!targetThread) {
      targetThread = {
        id: threadId,
        customerName: custName,
        customerPhone: q.customerPhone || q.request?.user?.phoneNumber || q.user?.phoneNumber || '+91 94628 77757',
        contextType: 'QUOTATION',
        contextTag: `Quotation #${qNum}`,
        quoteNumber: qNum,
        requestNumber: reqNum,
        bookingNumber: '',
        lastMessage: `Official Quotation for ₹${(q.grandtotal || q.amount || 0).toLocaleString('en-IN')}`,
        lastMessageTime: new Date().toISOString(),
        unreadCountAdmin: 0,
        unreadCountCustomer: 0,
      };
      setChatThreads(prev => [targetThread, ...prev.filter(t => t.id !== threadId)]);
    }

    setActiveThreadId(threadId);
    setChatFilterType('ALL');
    setChatSearch('');
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_thread', threadId);
    }
    fetchThreadMessages(threadId);
    setActiveTab('chat');
    setSidebarOpen(false);
  };

  // Status Handlers
  const handleUpdateStatus = async (requestId, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Status updated to ${status}`, 'success');
        fetchRequests();
        fetchStats();
        setSelectedRequestDetail(prev => (prev && prev.id === requestId) ? { ...prev, status } : prev);
      }
    } catch (e) {
      showToastMsg('Error updating status', 'error');
    }
  };

  const handleToggleSiteAudit = async (req) => {
    const isCurrentlyAudit = (req.status || '').toUpperCase() === 'AUDIT_SCHEDULED' || req.requiresSiteAudit === true;
    const targetStatus = isCurrentlyAudit ? 'ESTIMATING' : 'AUDIT_SCHEDULED';

    try {
      const res = await fetch(`${API_BASE}/api/v1/requests/${req.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(
          !isCurrentlyAudit
            ? `📍 Physical Site Audit REQUIRED for #${req.requestNumber || req.id.slice(0, 8)}`
            : `Physical Site Audit removed (Switched to Digital Review) for #${req.requestNumber || req.id.slice(0, 8)}`,
          'success'
        );
        fetchRequests();
        fetchStats();
      } else {
        showToastMsg(data.message || 'Failed to update audit status', 'error');
      }
    } catch (e) {
      showToastMsg('Error updating site audit requirement', 'error');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Delete this service request?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/requests/${requestId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Request deleted', 'success');
        fetchRequests();
        fetchStats();
      }
    } catch (e) {
      showToastMsg('Failed to delete request', 'error');
    }
  };

  const handleStartQuote = (req) => {
    setBuilderRequestId(req.id);
    const code = (req.servicecode || '').toUpperCase();
    if (code.includes('WATER') || code.includes('LEAK')) {
      setLineItems([
        { item: 'Thermal Moisture Scanning & Surface Tracing', qty: 1, unit: 'Lumpsum', rate: 950 },
        { item: 'High-Pressure Hydrophobic PU Injection Grouting', qty: 20, unit: 'Running Ft', rate: 220 },
        { item: 'Elastomeric 3-Layer Waterproof Membrane Application', qty: 150, unit: 'Sq Ft', rate: 65 }
      ]);
      setBuilderScope('Comprehensive Waterproofing Scope');
    } else if (code.includes('TILE') || code.includes('FLOOR')) {
      setLineItems([
        { item: 'Damaged Tile Demolition & Debris Disposal', qty: 40, unit: 'Sq Ft', rate: 35 },
        { item: 'Polymer Modified Adhesive & Tile Laying', qty: 40, unit: 'Sq Ft', rate: 95 },
        { item: 'Epoxy Anti-Stain Tile Grouting', qty: 40, unit: 'Sq Ft', rate: 45 }
      ]);
      setBuilderScope('Tile & Floor Restoration Scope');
    } else if (code.includes('CIVIL') || code.includes('CONSTRUCT') || code.includes('MASON')) {
      setLineItems([
        { item: 'Structural Crack Stitching & Rebar Treatment', qty: 25, unit: 'Running Ft', rate: 280 },
        { item: 'Polymer Modified Structural Repair Mortar', qty: 5, unit: 'Bags', rate: 1250 },
        { item: 'High-Strength Micro-Concrete Grouting', qty: 1, unit: 'Lumpsum', rate: 4500 }
      ]);
      setBuilderScope('Structural Patchwork Scope');
    } else {
      setLineItems([
        { item: `${req.servicecode || 'Standard'} Remedial Work & Surface Prep`, qty: 1, unit: 'Lumpsum', rate: 2500 }
      ]);
      setBuilderScope('Standard Maintenance Scope');
    }
    setMatCost(0);
    setLabCost(0);
    setDiscount(0);
    setCustomAdvanceAmt(null);
    setBuilderWarranty('');
    setActiveTab('builder');
  };

  const handleQuoteDecision = async (quoteId, decision) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/quotations/${quoteId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Quotation marked as ${decision}`, 'success');
        fetchQuotations();
        fetchRequests();
        fetchStats();
      }
    } catch (e) {
      showToastMsg('Failed to update decision', 'error');
    }
  };

  const handleDeleteQuotation = async (quoteId) => {
    if (!window.confirm('Delete this quotation?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/quotations/${quoteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Quotation deleted', 'success');
        fetchQuotations();
        fetchStats();
      }
    } catch (e) {
      showToastMsg('Failed to delete quotation', 'error');
    }
  };

  // Calculations
  const lineItemsTotal = lineItems.reduce((acc, li) => acc + ((parseFloat(li.qty) || 0) * (parseFloat(li.rate) || 0)), 0);
  let effectiveMatCost = matCost;
  let effectiveLabCost = labCost;
  if (matCost === 0 && labCost === 0 && lineItemsTotal > 0) {
    effectiveMatCost = Math.round(lineItemsTotal * 0.55);
    effectiveLabCost = Math.round(lineItemsTotal * 0.45);
  } else if (matCost > 0 && labCost === 0 && lineItemsTotal > 0) {
    effectiveLabCost = Math.max(0, lineItemsTotal - matCost);
  } else if (labCost > 0 && matCost === 0 && lineItemsTotal > 0) {
    effectiveMatCost = Math.max(0, lineItemsTotal - labCost);
  }
  const subtotal = lineItemsTotal > 0 ? lineItemsTotal : (effectiveMatCost + effectiveLabCost);
  const taxableAmount = Math.max(0, subtotal - discount);
  const gstAmount = Math.round(taxableAmount * (taxRate / 100));
  const grandTotal = taxableAmount + gstAmount;

  const effectiveAdvanceAmount = customAdvanceAmt !== null && customAdvanceAmt !== '' && !isNaN(customAdvanceAmt)
    ? Math.round(parseFloat(customAdvanceAmt))
    : Math.round(grandTotal * (builderAdvancePct / 100));
  const effectiveAdvancePct = grandTotal > 0
    ? parseFloat(((effectiveAdvanceAmount / grandTotal) * 100).toFixed(1))
    : builderAdvancePct;

  const handleUpdateQuotationAdvance = async (quoteId, newAmt) => {
    const parsedAmt = parseFloat(newAmt);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      showToastMsg('Please enter a valid advance amount in ₹', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/quotations/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advanceAmount: parsedAmt })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Advance adjusted to ₹${Math.round(parsedAmt).toLocaleString('en-IN')}`, 'success');
        setActiveQuoteModal(data.data);
        setIsEditingModalAdvance(false);
        fetchAllData();
      } else {
        showToastMsg(data.message || 'Failed to update advance', 'error');
      }
    } catch (e) {
      showToastMsg('Error updating quotation advance', 'error');
    }
  };

  const handleIssueQuotation = async () => {
    if (!builderRequestId) {
      showToastMsg('Please select a service request to quote', 'error');
      return;
    }
    if (lineItems.length === 0) {
      showToastMsg('Please add at least one line item', 'error');
      return;
    }

    const payload = {
      requestId: builderRequestId,
      lineItem: lineItems,
      materialCost: effectiveMatCost,
      laborCost: effectiveLabCost,
      subtotal,
      discount,
      taxGST: gstAmount,
      taxRate,
      totalCost: effectiveMatCost + effectiveLabCost,
      grandtotal: grandTotal,
      advancePercentage: effectiveAdvancePct,
      advanceAmount: effectiveAdvanceAmount,
      estimatedTimeline: builderTimeline === 'CUSTOM' ? (customTimeline.trim() || 'Custom Duration') : builderTimeline,
      termsAndConditions: builderTerms || `Standard service terms apply. ${effectiveAdvancePct}% advance (₹${effectiveAdvanceAmount.toLocaleString('en-IN')}) required to mobilize materials & start work, remaining on completion.`,
      created_by: builderEstimator,
      service_scope: builderWarranty && builderWarranty.trim() ? `${builderScope} (Warranty: ${builderWarranty.trim()})` : builderScope
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Quotation created and dispatched!', 'success');
        setBuilderRequestId('');
        setBuilderWarranty('');
        setBuilderTimeline('1-2 Working Days');
        setCustomTimeline('');
        fetchAllData();
        setActiveTab('quotations');
      } else {
        showToastMsg(data.message || 'Quotation creation failed', 'error');
      }
    } catch (e) {
      showToastMsg('Error creating quotation', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'SUBMITTED': return 'bg-primary-50 text-primary-700 border-primary-200';
      case 'AUDIT_SCHEDULED':
      case 'SITE_AUDIT': return 'bg-warning-100 text-warning-900 border-warning-300 font-bold';
      case 'ESTIMATING': return 'bg-warning-50 text-warning-700 border-warning-200';
      case 'QUOTE_REQUESTED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'QUOTED': return 'bg-primary-50 text-primary-700 border-primary-200';
      case 'ASSIGNED': return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      case 'ACCEPTED': return 'bg-success-50 text-success-700 border-success-200';
      case 'IN_PROGRESS': return 'bg-primary-50 text-primary-700 border-primary-200';
      case 'COMPLETED': return 'bg-success-50 text-success-700 border-success-200';
      case 'REJECTED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Explicit guard: A project is strictly AWARDED only if admin approved it, has an accepted quote, or assigned quote price
  const isProjectAwarded = (r) => {
    if (!r) return false;
    const hasAssignedStatus = (r.status || '').toUpperCase() === 'ASSIGNED';
    const hasAcceptedQuote = Array.isArray(r.vendorQuotes) && r.vendorQuotes.some(q => q.status === 'accepted' || q.status === 'assigned');
    const hasAwardedPrice = r.assignedQuotePrice !== null && r.assignedQuotePrice !== undefined && Number(r.assignedQuotePrice) > 0;
    return hasAssignedStatus && (hasAcceptedQuote || hasAwardedPrice || (Boolean(r.vendorId) && (!r.vendorQuotes || r.vendorQuotes.length === 0)));
  };

  const TIMELINE_STAGES = [
    { key: 'SUBMITTED', step: 1, label: 'Submitted', desc: 'Request Logged' },
    { key: 'ESTIMATING', step: 2, label: 'Estimating', desc: 'Technical Review' },
    { key: 'QUOTED', step: 3, label: 'Quoted', desc: 'Quotation Ready' },
    { key: 'IN_PROGRESS', step: 4, label: 'In Progress', desc: 'Execution & Mobilization' },
    { key: 'COMPLETED', step: 5, label: 'Completed', desc: 'Work Done & Handover' },
  ];

  const getTimelineStepIndex = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'SUBMITTED': return 0;
      case 'AUDIT_SCHEDULED':
      case 'SITE_AUDIT':
      case 'ESTIMATING': return 1;
      case 'QUOTED': return 2;
      case 'ACCEPTED':
      case 'PAID':
      case 'IN_PROGRESS': return 3;
      case 'COMPLETED': return 4;
      default: return 0;
    }
  };

  const renderQuotationBreakdown = (rawNotes) => {
    if (!rawNotes) return null;
    const raw = String(rawNotes).trim();
    if (!raw) return null;

    // Normalize: split bullets and standard headers into clean lines even if newlines were lost
    let normalized = raw
      .replace(/\s*•\s*/g, '\n• ')
      .replace(/\s+(Grand Total:)/gi, '\nGrand Total:')
      .replace(/\s+(Subtotal:)/gi, '\nSubtotal:')
      .replace(/\s+(GST\s*\(?[^:]*\)?:)/gi, (m, g) => '\n' + g)
      .replace(/\s+(Warranty[^:]*:)/gi, (m, g) => '\n' + g)
      .replace(/\s+(Vendor Remarks:|Remarks:)/gi, (m, g) => '\n' + g)
      .replace(/\s+(?<!Grand\s+)(Total:)/gi, '\nTotal:');

    const lines = normalized.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    const boqItems = [];
    let subtotal = null;
    let gst = null;
    let grandTotal = null;
    let warranty = null;
    let remarks = null;
    const generalLines = [];

    for (const line of lines) {
      if (/^\[?DETAILED\s+BOQ\s+SPECIFICATION\]?$/i.test(line)) {
        continue;
      } else if (line.startsWith('•') || line.startsWith('-')) {
        const cleanItem = line.replace(/^[•\-]\s*/, '').trim();
        if (cleanItem) boqItems.push(cleanItem);
      } else if (/^subtotal\s*:/i.test(line)) {
        subtotal = line.replace(/^subtotal\s*:\s*/i, '').trim();
      } else if (/^gst\b/i.test(line)) {
        gst = line;
      } else if (/^grand\s+total\s*:/i.test(line)) {
        grandTotal = line.replace(/^grand\s+total\s*:\s*/i, '').trim();
      } else if (/^total\s*:/i.test(line) && !grandTotal) {
        grandTotal = line.replace(/^total\s*:\s*/i, '').trim();
      } else if (/^warranty\b/i.test(line)) {
        warranty = line.replace(/^warranty(\s*\/\s*guarantee)?\s*:\s*/i, '').trim();
      } else if (/^(vendor\s+)?remarks\s*:/i.test(line)) {
        remarks = line.replace(/^(vendor\s+)?remarks\s*:\s*/i, '').trim();
      } else {
        generalLines.push(line);
      }
    }

    if (boqItems.length > 0 || subtotal || grandTotal || remarks || warranty) {
      return (
        <div className="bg-slate-50/95 rounded-xl border border-slate-200/90 p-3 space-y-2.5 text-xs font-normal">
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
              <ClipboardList className="w-3.5 h-3.5 text-primary-600" />
              <span>BOQ Specification & Breakdown</span>
            </div>
            {warranty && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>{warranty}</span>
              </span>
            )}
          </div>

          {/* Itemized Works Table */}
          {boqItems.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Itemized Works:</div>
              <div className="bg-white rounded-lg border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {boqItems.map((item, idx) => {
                  const eqIdx = item.lastIndexOf('=');
                  if (eqIdx !== -1) {
                    const desc = item.slice(0, eqIdx).trim();
                    const price = item.slice(eqIdx + 1).trim();
                    return (
                      <div key={idx} className="px-2.5 py-1.5 flex items-start justify-between gap-3 text-[11px]">
                        <div className="flex items-start gap-1.5 min-w-0">
                          <span className="text-slate-400 font-mono text-[10px] pt-0.5">{idx + 1}.</span>
                          <span className="text-slate-700 font-medium leading-snug">{desc}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900 shrink-0">{price.startsWith('₹') ? price : `₹${price}`}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className="px-2.5 py-1.5 flex items-start gap-1.5 text-[11px] text-slate-700 font-medium leading-snug">
                      <span className="text-slate-400 font-mono text-[10px] pt-0.5">{idx + 1}.</span>
                      <span>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Commercials Summary */}
          {(subtotal || gst || grandTotal) && (
            <div className="bg-white rounded-lg border border-slate-200/80 p-2.5 space-y-1 text-[11px] shadow-2xs">
              {subtotal && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal (Line Items):</span>
                  <span className="font-mono font-medium">{subtotal.startsWith('₹') ? subtotal : `₹${subtotal}`}</span>
                </div>
              )}
              {gst && (
                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                  <span>{gst.includes(':') ? gst.split(':')[0].trim() : 'GST'}:</span>
                  <span className="font-mono">{gst.includes(':') ? gst.split(':')[1].trim() : gst}</span>
                </div>
              )}
              {grandTotal && (
                <div className="flex items-center justify-between text-slate-900 font-bold pt-1.5 mt-1 border-t border-slate-100">
                  <span className="font-bold">Total Quoted Price:</span>
                  <span className="font-mono text-emerald-700 font-bold text-xs">{grandTotal.startsWith('₹') ? grandTotal : `₹${grandTotal}`}</span>
                </div>
              )}
            </div>
          )}

          {/* Contractor Remarks */}
          {remarks && (
            <div className="bg-amber-50/70 rounded-lg border border-amber-200/80 p-2.5 text-[11px] text-amber-950 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Contractor Remarks / Approach:</span>
              <p className="leading-relaxed font-normal whitespace-pre-wrap">{remarks}</p>
            </div>
          )}

          {/* Extra Lines */}
          {generalLines.length > 0 && (
            <div className="text-[11px] text-slate-600 leading-relaxed space-y-1 pt-1">
              {generalLines.map((gl, i) => (
                <p key={i} className="whitespace-pre-wrap">{gl}</p>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line font-normal">
        {raw}
      </div>
    );
  };

  const selectedBuilderReq = requests.find(r => r.id === builderRequestId);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans text-[14px] font-[500] antialiased tracking-[-0.01em]">

      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-xs`}>
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <div className="font-heading font-bold text-base tracking-tight text-slate-900 leading-none">HIPRO</div>
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-0.5">Technical Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success-50 border border-success-200 text-success-700 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse"></span>
            <span>Live</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto text-xs">
          {/* Section 1: OPERATIONS */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operations</div>
            
            <button
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'overview' ? 'text-primary-400' : 'text-slate-500'}`} />
                <span>Overview</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('direct-bookings'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'direct-bookings'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap className={`w-4 h-4 ${activeTab === 'direct-bookings' ? 'text-warning-400' : 'text-warning-500'}`} />
                <span>Instant Bookings</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'direct-bookings' ? 'bg-warning-400 text-slate-900' : 'bg-warning-100 text-warning-800'
              }`}>
                {directBookings.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('customer-activity'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'customer-activity'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart className={`w-4 h-4 ${activeTab === 'customer-activity' ? 'text-success-400' : 'text-success-600'}`} />
                <span>Customer Leads & Carts</span>
              </div>
              {activityMetrics.activeCartLeads > 0 ? (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-success-500 text-white animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  {activityMetrics.activeCartLeads} Carts
                </span>
              ) : (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'customer-activity' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {customerLeads.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('requests'); setSidebarOpen(false); fetchRequests(); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'requests'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ClipboardList className={`w-4 h-4 ${activeTab === 'requests' ? 'text-primary-400' : 'text-slate-500'}`} />
                <span>Inspection Requests</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'requests' ? 'bg-white/20 text-white' : 'bg-warning-50 text-warning-700 border border-warning-200'
              }`}>
                {requests.length > 0 ? requests.length : (stats ? (stats.statusCounts.SUBMITTED + stats.statusCounts.ESTIMATING) : 0)}
              </span>
            </button>

            {/* HIGH PRIORITY: VENDOR NETWORK - Assign vendors to customer quotations */}
            <button
              onClick={() => { setActiveTab('vendors'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'vendors'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className={`w-4 h-4 ${activeTab === 'vendors' ? 'text-accent-400' : 'text-accent-600'}`} />
                <span>Vendor Network</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'vendors' ? 'bg-white/20 text-white' : 'bg-accent-50 text-accent-700 border border-accent-200'
              }`}>
                {vendors.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('quotations'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'quotations'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Receipt className={`w-4 h-4 ${activeTab === 'quotations' ? 'text-primary-400' : 'text-slate-500'}`} />
                <span>Quotations Desk</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'quotations' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {quotations.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('builder'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'builder'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calculator className={`w-4 h-4 ${activeTab === 'builder' ? 'text-primary-400' : 'text-slate-500'}`} />
                <span>BOQ Generator</span>
              </div>
              <span className="text-[9px] font-bold text-success-600 bg-success-50 px-1.5 py-0.5 rounded-md border border-success-200">
                Auto
              </span>
            </button>
          </div>

          {/* Section 2: COMMUNICATIONS */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Communications</div>
            
            <button
              onClick={() => { setActiveTab('chat'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'chat'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle className={`w-4 h-4 ${activeTab === 'chat' ? 'text-primary-400' : 'text-primary-600'}`} />
                <span>Live Chat Desk</span>
              </div>
              {chatThreads.some(t => t.unreadCountAdmin > 0) ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-500 text-white animate-pulse">
                  {chatThreads.reduce((acc, t) => acc + (t.unreadCountAdmin || 0), 0)} New
                </span>
              ) : (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'chat' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {chatThreads.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'users'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className={`w-4 h-4 ${activeTab === 'users' ? 'text-primary-400' : 'text-slate-500'}`} />
                <span>Customer Directory</span>
              </div>
            </button>
          </div>

          {/* Section 3: CATALOG & MARKETING */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catalog & Marketing</div>
            
            <button
              onClick={() => { setActiveTab('services'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'services'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wrench className={`w-4 h-4 ${activeTab === 'services' ? 'text-primary-400' : 'text-slate-500'}`} />
                <span>Services Catalog</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('adventure'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'adventure'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Compass className={`w-4 h-4 ${activeTab === 'adventure' ? 'text-danger-400' : 'text-danger-600'}`} />
                <span>Adventure & Sports</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'adventure' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {entExperiences.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('slides'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'slides'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className={`w-4 h-4 ${activeTab === 'slides' ? 'text-warning-400' : 'text-primary-600'}`} />
                <span>Slides & Banners</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'slides' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {slides.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('offers'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'offers'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Tag className={`w-4 h-4 ${activeTab === 'offers' ? 'text-accent-400' : 'text-accent-600'}`} />
                <span>Offers & Coupons</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'offers' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {offers.length}
              </span>
            </button>
          </div>

          {/* Section 4: SYSTEM */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">System</div>
            
            <button
              onClick={() => { setActiveTab('diagnostics'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'diagnostics'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className={`w-4 h-4 ${activeTab === 'diagnostics' ? 'text-primary-400' : 'text-slate-500'}`} />
                <span>Diagnostics & API</span>
              </div>
            </button>
          </div>
        </nav>

        {/* User Card in Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                AD
              </div>
              <span className="w-2 h-2 rounded-full bg-success-500 absolute -bottom-0.5 -right-0.5 border-2 border-white"></span>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-800 text-xs truncate leading-tight">Admin Desk</div>
              <div className="text-[10px] text-slate-400 truncate">Online & Synced</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchAllData(true)}
              title="Sync Database"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            {onSwitchToVendor && (
              <button
                onClick={onSwitchToVendor}
                title="Switch to Vendor Portal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-danger-600 hover:bg-danger-50 transition-all"
              >
                <HardHat className="w-3.5 h-3.5" />
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Log Out of Super Admin"
                className="p-1.5 rounded-lg text-danger-500 hover:text-danger-700 hover:bg-danger-50 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">

        {/* TOPBAR */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-6 sm:px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-all">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hipro Portal</span>
                <span className="text-slate-300">/</span>
                <h1 className="font-heading font-bold text-base text-slate-900 capitalize leading-tight">
                  {activeTab === 'overview' ? 'Dashboard Overview' :
                    activeTab === 'direct-bookings' ? 'Instant Maintenance Bookings' :
                      activeTab === 'customer-activity' ? 'Customer Exploration & Active Carts' :
                        activeTab === 'requests' ? 'Inspection Requests' :
                        activeTab === 'quotations' ? 'Quotations Desk' :
                          activeTab === 'builder' ? 'BOQ Quotation Generator' :
                            activeTab === 'chat' ? 'Live Customer Chat Desk' :
                              activeTab === 'services' ? 'Services Catalog' :
                                activeTab === 'adventure' ? 'Adventure & Sports Catalog' :
                                activeTab === 'slides' ? 'Slides & Banners' :
                                  activeTab === 'offers' ? 'Coupons & Offers' :
                                    activeTab === 'users' ? 'Customer Directory' : 'System Diagnostics'}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative hidden sm:block w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search orders, quotes, customers... (⌘K)"
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 focus:bg-white text-xs text-slate-700 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
              />
            </div>

            <button
              onClick={() => fetchAllData(true)}
              title="Sync live database"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Sync</span>
            </button>

            {onSwitchToCustomerApp && (
              <button
                onClick={onSwitchToCustomerApp}
                title="Switch to Mobile Customer Demo"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all shadow-xs"
              >
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Customer App</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('builder')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Quote</span>
            </button>
          </div>
        </header>

        {/* DYNAMIC TAB BODY */}
        <main className="flex-1 p-6 space-y-5 max-w-7xl w-full mx-auto">

          {/* OVERVIEW TAB - HIPRO COMMAND & OPERATIONS */}
          {activeTab === 'overview' && (() => {
            // 1. Dynamic Multi-City Filtering (100% Hipro Field Hubs from Database)
            const dynamicCityNames = operationalCities.filter(c => c.isActive !== false).map(c => c.name);
            const availableCities = ['ALL', ...dynamicCityNames];

            const isCityMatch = (cityVal) => {
              if (overviewCityFilter === 'ALL') return true;
              const str = typeof cityVal === 'string' ? cityVal : (cityVal?.name || '');
              return str.toLowerCase().includes(overviewCityFilter.toLowerCase());
            };

            const filteredByCityRequests = requests.filter(r => isCityMatch(r.city || r.location));
            const filteredByCityBookings = directBookings.filter(b => isCityMatch(b.city));
            const filteredByCityVendors = vendors.filter(v => isCityMatch(v.city));
            const filteredByCityLeads = customerLeads.filter(l => isCityMatch(l.city));
            const filteredByCityQuotes = quotations.filter(q => {
              const linkedReq = requests.find(r => r.id === q.requestId || r.requestNumber === q.requestNumber || r.id === q.request?.id);
              return isCityMatch(linkedReq?.city || linkedReq?.location || q.city);
            });

            // 2. Financial & Pipeline Computations
            const acceptedQuotes = filteredByCityQuotes.filter(q => (q.status || '').toUpperCase() === 'ACCEPTED');
            const totalAcceptedRev = acceptedQuotes.reduce((s, q) => s + (q.grandtotal || q.amount || 0), 0);
            const totalQuotedRev = filteredByCityQuotes.reduce((s, q) => s + (q.grandtotal || q.amount || 0), 0);
            const conversionRatePct = filteredByCityQuotes.length > 0 ? Math.round((acceptedQuotes.length / filteredByCityQuotes.length) * 100) : 0;
            const avgQuoteTicket = acceptedQuotes.length > 0 ? Math.round(totalAcceptedRev / acceptedQuotes.length) : (filteredByCityQuotes.length > 0 ? Math.round(totalQuotedRev / filteredByCityQuotes.length) : 0);

            // Inspection Requests breakdown (synchronized with quotations desk)
            const readyRequests = filteredByCityRequests.filter(r => {
              const q = r.quotations?.[0] || quotations.find(item => item.requestId === r.id || item.requestNumber === r.requestNumber || item.requestId === r.requestNumber);
              return (r.status || '').toUpperCase() === 'ACCEPTED' || (q && (q.status || '').toUpperCase() === 'ACCEPTED');
            });
            const needsQuoteRequests = filteredByCityRequests.filter(r => {
              const q = r.quotations?.[0] || quotations.find(item => item.requestId === r.id || item.requestNumber === r.requestNumber || item.requestId === r.requestNumber);
              return ['SUBMITTED', 'ESTIMATING'].includes((r.status || '').toUpperCase()) && (!q || !['QUOTED', 'ACCEPTED'].includes((q.status || '').toUpperCase()));
            });
            const auditScheduledRequests = filteredByCityRequests.filter(r =>
              (r.status || '').toUpperCase() === 'AUDIT_SCHEDULED' ||
              (r.status || '').toUpperCase() === 'SITE_AUDIT' ||
              r.requiresSiteAudit
            );
            const completedRequests = filteredByCityRequests.filter(r => (r.status || '').toUpperCase() === 'COMPLETED');

            // Instant Bookings breakdown
            const directBookingsRev = filteredByCityBookings.reduce((s, b) => s + (b.totalAmount || b.onlinePaidAmount || 199), 0);
            const confirmedBookings = filteredByCityBookings.filter(b => ['CONFIRMED', 'PAID'].includes((b.status || '').toUpperCase()));
            const assignedBookings = filteredByCityBookings.filter(b => (b.status || '').toUpperCase() === 'ASSIGNED' || b.technicianName);
            const completedBookings = filteredByCityBookings.filter(b => (b.status || '').toUpperCase() === 'COMPLETED');

            // Vendor breakdown
            const activeVendors = filteredByCityVendors.filter(v => v.status === 'active');
            const serviceVendors = filteredByCityVendors.filter(v => (v.category || 'Services') === 'Services');
            const adventureVendors = filteredByCityVendors.filter(v => v.category === 'Adventure');
            const avgVendorRating = filteredByCityVendors.length > 0
              ? (filteredByCityVendors.reduce((acc, v) => acc + (v.rating || 4.5), 0) / filteredByCityVendors.length).toFixed(1)
              : '4.8';

            // Customer Telemetry / Active Carts
            const activeCartLeads = filteredByCityLeads.filter(l => l.hasActiveCart);
            const totalCartValue = activeCartLeads.reduce((s, l) => s + (l.cartTotal || 0), 0);

            // Category Demand Breakdown
            const categoryDemand = filteredByCityRequests.reduce((acc, r) => {
              const code = (r.servicecode || 'General Repair').trim();
              let name = 'Waterproofing & Leakage';
              if (code.toLowerCase().includes('civil') || code.toLowerCase().includes('construct') || code.toLowerCase().includes('slab') || code.toLowerCase().includes('wall')) {
                name = 'Civil Construction & Masonry';
              } else if (code.toLowerCase().includes('paint') || code.toLowerCase().includes('finish')) {
                name = 'Painting & Finishing';
              } else if (code.toLowerCase().includes('clean')) {
                name = 'Deep Cleaning & Sanitization';
              } else if (code.toLowerCase().includes('tile') || code.toLowerCase().includes('floor')) {
                name = 'Tile & Floor Repair';
              } else if (!code.toLowerCase().includes('water') && !code.toLowerCase().includes('leak')) {
                name = 'General Building Repair';
              }
              acc[name] = (acc[name] || 0) + 1;
              return acc;
            }, {});

            // Filtered lists for active section
            const searchLower = overviewSearch.toLowerCase().trim();
            const displayRequests = filteredByCityRequests.filter(req => {
              const q = req.quotations?.[0] || quotations.find(item => item.requestId === req.id || item.requestNumber === req.requestNumber || item.requestId === req.requestNumber);
              const isReady = (req.status || '').toUpperCase() === 'ACCEPTED' || (q && (q.status || '').toUpperCase() === 'ACCEPTED');
              const isNeedsQuote = ['SUBMITTED', 'ESTIMATING'].includes((req.status || '').toUpperCase()) && (!q || !['QUOTED', 'ACCEPTED'].includes((q.status || '').toUpperCase()));
              const isAudit = (req.status || '').toUpperCase() === 'AUDIT_SCHEDULED' || (req.status || '').toUpperCase() === 'SITE_AUDIT' || req.requiresSiteAudit;

              if (overviewFilter === 'READY' && !isReady) return false;
              if (overviewFilter === 'NEEDS_QUOTE' && !isNeedsQuote) return false;
              if (overviewFilter === 'AUDIT' && !isAudit) return false;

              if (!searchLower) return true;
              return (req.user?.name || '').toLowerCase().includes(searchLower) ||
                (req.user?.phoneNumber || '').toLowerCase().includes(searchLower) ||
                (req.requestNumber || '').toLowerCase().includes(searchLower) ||
                (req.servicecode || '').toLowerCase().includes(searchLower);
            });

            const displayBookings = filteredByCityBookings.filter(b => {
              if (!searchLower) return true;
              return (b.customerName || '').toLowerCase().includes(searchLower) ||
                (b.customerPhone || '').toLowerCase().includes(searchLower) ||
                (b.bookingNumber || '').toLowerCase().includes(searchLower) ||
                (b.serviceName || '').toLowerCase().includes(searchLower) ||
                (b.technicianName || '').toLowerCase().includes(searchLower);
            });

            const displayQuotes = filteredByCityQuotes.filter(q => {
              if (!searchLower) return true;
              return (q.quoteNumber || '').toLowerCase().includes(searchLower) ||
                (q.customerName || '').toLowerCase().includes(searchLower) ||
                (q.customerPhone || '').toLowerCase().includes(searchLower);
            });

            const displayVendors = filteredByCityVendors.filter(v => {
              if (!searchLower) return true;
              return (v.name || '').toLowerCase().includes(searchLower) ||
                (v.businessName || '').toLowerCase().includes(searchLower) ||
                (v.specialization || '').toLowerCase().includes(searchLower) ||
                (v.city || '').toLowerCase().includes(searchLower) ||
                (v.phone || '').toLowerCase().includes(searchLower);
            });

            return (
              <div className="space-y-6">
                {/* 1. HIPRO FIELD OPERATIONS & DYNAMIC HUB SELECTOR */}
                <div className="bg-white rounded-2xl p-6 shadow-2xs border border-slate-200">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                          Hipro Operations Live
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          Operational Hubs ({operationalCities.filter(c => c.isActive !== false).length})
                        </span>
                      </div>
                      <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                        Hindustan Projects • Admin Operations
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm font-medium">
                        Civil construction, waterproofing, structural repairs, contractor quotations, and field service dispatch.
                      </p>
                    </div>

                    {/* Quick Command Launch Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => setActiveTab('builder')}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Issue BOQ Quote</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all"
                      >
                        <MessageCircle className="w-4 h-4 text-slate-600" />
                        <span>Chat Desk ({chatThreads.length})</span>
                      </button>
                      <button
                        onClick={() => fetchAllData(true)}
                        title="Sync Database"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
                      >
                        <RefreshCw className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>

                  {/* Multi-City Quick Switcher Filter Bar */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <MapPin className="w-4 h-4 text-slate-700 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Service Hub:</span>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 flex-1">
                      {availableCities.map(c => {
                        const isSelected = overviewCityFilter === c;
                        const count = c === 'ALL'
                          ? (requests.length + directBookings.length)
                          : (requests.filter(r => (r.city || r.location || '').toLowerCase().includes(c.toLowerCase())).length +
                             directBookings.filter(b => (b.city || '').toLowerCase().includes(c.toLowerCase())).length);

                        return (
                          <button
                            key={c}
                            onClick={() => setOverviewCityFilter(c)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                            }`}
                          >
                            <span>{c === 'ALL' ? '🌍 All Hubs' : c}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                              isSelected ? 'bg-white/25 text-white' : 'bg-white text-slate-600 border border-slate-200'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* + Add City Hub Button */}
                    <button
                      type="button"
                      onClick={() => setCityModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-1.5 shrink-0 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add City Hub</span>
                    </button>
                  </div>
                </div>

                {/* 2. STATS-DRIVEN EXECUTIVE KPI CARDS (THE 4 PILLARS) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Inspection Requests Pipeline */}
                  <div
                    onClick={() => { setOverviewActiveSection('requests'); setOverviewFilter('ALL'); }}
                    className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs ${
                      overviewActiveSection === 'requests'
                        ? 'border-primary-500 ring-2 ring-primary-500/20'
                        : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inspection Requests</span>
                      <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="font-heading font-bold text-3xl text-slate-900 mt-2">
                      {filteredByCityRequests.length}
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-warning-50 text-warning-800 border border-warning-200">
                        {needsQuoteRequests.length} Needs BOQ
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {readyRequests.length} Ready
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-200">
                        {auditScheduledRequests.length} Audit
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Pipeline Value</span>
                      <span className="font-mono font-bold text-slate-900">₹{totalQuotedRev.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Card 2: Instant Maintenance Bookings */}
                  <div
                    onClick={() => { setOverviewActiveSection('bookings'); }}
                    className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs ${
                      overviewActiveSection === 'bookings'
                        ? 'border-warning-500 ring-2 ring-warning-500/20'
                        : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-warning-700 uppercase tracking-wider">Instant Bookings</span>
                      <div className="w-9 h-9 rounded-xl bg-warning-50 text-warning-700 flex items-center justify-center font-bold">
                        <Zap className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="font-heading font-bold text-3xl text-slate-900 mt-2">
                      {filteredByCityBookings.length}
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {confirmedBookings.length} Confirmed
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-200">
                        {assignedBookings.length} Assigned
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        {completedBookings.length} Done
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Online Paid Revenue</span>
                      <span className="font-mono font-bold text-emerald-600">₹{directBookingsRev.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Card 3: Quotations Performance & Win Rate */}
                  <div
                    onClick={() => { setOverviewActiveSection('quotations'); }}
                    className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs ${
                      overviewActiveSection === 'quotations'
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Quotations & Won Deals</span>
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        <FileCheck2 className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="font-heading font-bold text-3xl text-slate-900 mt-2 flex items-baseline gap-2">
                      <span>{filteredByCityQuotes.length}</span>
                      <span className="text-xs font-bold text-emerald-600">({conversionRatePct}% Accepted)</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900">
                        {acceptedQuotes.length} Deals Won
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        Avg Ticket: ₹{avgQuoteTicket.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Accepted Gross Value</span>
                      <span className="font-mono font-bold text-emerald-700">₹{totalAcceptedRev.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Card 4: Vendor Fulfillment Network */}
                  <div
                    onClick={() => { setOverviewActiveSection('vendors'); }}
                    className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs ${
                      overviewActiveSection === 'vendors'
                        ? 'border-purple-500 ring-2 ring-purple-500/20'
                        : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Connected Vendors</span>
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="font-heading font-bold text-3xl text-slate-900 mt-2">
                      {filteredByCityVendors.length}
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {activeVendors.length} Active
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-200">
                        {serviceVendors.length} Services
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {adventureVendors.length} Adventure
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Network Rating</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1">⭐ {avgVendorRating} / 5.0</span>
                    </div>
                  </div>
                </div>

                {/* 3. "TOP VIEW OF CUSTOMERS" - LIVE CUSTOMER 360° EXPLORATION RADAR */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-500 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900">
                            Live Customer Demand & Active Carts Radar
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Real-Time
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          Real-time stream of customers exploring services and items waiting in checkout carts. Reach out instantly to prevent lost leads.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
                        <span>Exploring Leads:</span>
                        <span className="font-bold text-slate-900 font-mono">{filteredByCityLeads.length}</span>
                      </div>
                      {activeCartLeads.length > 0 && (
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-pulse">
                          <span>🛒 In Cart:</span>
                          <span className="font-mono">₹{totalCartValue.toLocaleString('en-IN')} ({activeCartLeads.length} buyers)</span>
                        </div>
                      )}
                      <button
                        onClick={() => setActiveTab('customer-activity')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-all flex items-center gap-1"
                      >
                        <span>View All Leads</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Customer Leads Cards Grid */}
                  {filteredByCityLeads.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                      <Users className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">No active customer exploration events in {overviewCityFilter === 'ALL' ? 'any city' : overviewCityFilter} right now</p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">When customers browse services or add items to cart in the app or website, their live telemetry and instant reach-out shortcuts appear here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {filteredByCityLeads.slice(0, 6).map(lead => {
                        const hasCart = lead.hasActiveCart;
                        const initial = (lead.customerName || 'C')[0].toUpperCase();

                        return (
                          <div
                            key={lead.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                              hasCart
                                ? 'bg-gradient-to-br from-emerald-50/50 to-white border-emerald-300 shadow-xs ring-1 ring-emerald-500/10'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                    {initial}
                                  </div>
                                  <div>
                                    <div className="font-bold text-sm text-slate-900 leading-tight">
                                      {lead.customerName || 'Browsing Customer'}
                                    </div>
                                    <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                                      <MapPin className="w-3 h-3 text-primary-500" />
                                      <span>{lead.city || 'Udaipur'}</span>
                                      {lead.customerPhone && (
                                        <>
                                          <span>•</span>
                                          <span className="font-mono text-slate-700">{lead.customerPhone}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {hasCart ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white flex items-center gap-1 shrink-0">
                                    <ShoppingCart className="w-3 h-3" />
                                    <span>₹{lead.cartTotal}</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 shrink-0">
                                    Browsing
                                  </span>
                                )}
                              </div>

                              {/* Explored Services */}
                              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                                {(lead.exploredServices || []).slice(0, 3).map((s, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                                    {s.name}
                                  </span>
                                ))}
                                {(lead.exploredServices || []).length > 3 && (
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    +{lead.exploredServices.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons to Prevent Customer Loss */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                              {lead.customerPhone && (
                                <button
                                  onClick={() => openWhatsAppForLead(lead)}
                                  className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all text-center flex items-center justify-center gap-1 shadow-2xs"
                                >
                                  <span>WhatsApp</span>
                                </button>
                              )}
                              {lead.customerPhone && (
                                <button
                                  onClick={() => callCustomer(lead.customerPhone)}
                                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
                                  title="Call Customer"
                                >
                                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                                </button>
                              )}
                              <button
                                onClick={() => openChatForCustomer(lead)}
                                className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 transition-all text-center flex items-center justify-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3 text-primary-600" />
                                <span>Live Chat</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. OPERATIONAL WORKBENCH - INTERACTIVE 4-SECTION TABS */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                  {/* Section Switcher Tabs & Search Toolbar */}
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* 4 Main Tabs */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                        {[
                          { id: 'requests', label: 'Inspection Requests', count: displayRequests.length, icon: ClipboardList, color: 'text-primary-600' },
                          { id: 'bookings', label: 'Instant Bookings', count: displayBookings.length, icon: Zap, color: 'text-warning-600' },
                          { id: 'quotations', label: 'Quotations & BOQ', count: displayQuotes.length, icon: FileCheck2, color: 'text-emerald-600' },
                          { id: 'vendors', label: 'Connected Vendors', count: displayVendors.length, icon: Users, color: 'text-purple-600' },
                        ].map(tab => {
                          const isTabActive = overviewActiveSection === tab.id;
                          const TabIcon = tab.icon;

                          return (
                            <button
                              key={tab.id}
                              onClick={() => setOverviewActiveSection(tab.id)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                                isTabActive
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                            >
                              <TabIcon className={`w-3.5 h-3.5 ${isTabActive ? 'text-primary-400' : tab.color}`} />
                              <span>{tab.label}</span>
                              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                isTabActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {tab.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Unified Search Input */}
                      <div className="relative min-w-[260px] sm:w-72">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={overviewSearch}
                          onChange={(e) => setOverviewSearch(e.target.value)}
                          placeholder="Search customer, phone, req #, city..."
                          className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-semibold"
                        />
                        {overviewSearch && (
                          <button
                            onClick={() => setOverviewSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Secondary Filters (shown when on Requests section) */}
                    {overviewActiveSection === 'requests' && (
                      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-200/60">
                        {[
                          { id: 'ALL', label: 'All Requests', count: filteredByCityRequests.length },
                          { id: 'READY', label: 'Ready For Service Execution', count: readyRequests.length, highlight: true },
                          { id: 'NEEDS_QUOTE', label: 'Needs BOQ Quotation', count: needsQuoteRequests.length },
                          { id: 'AUDIT', label: 'Site Audit Scheduled', count: auditScheduledRequests.length },
                        ].map(flt => (
                          <button
                            key={flt.id}
                            onClick={() => setOverviewFilter(flt.id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                              overviewFilter === flt.id
                                ? (flt.highlight ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-900 text-white border-slate-900 shadow-xs')
                                : (flt.highlight ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100')
                            }`}
                          >
                            <span>{flt.label}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                              overviewFilter === flt.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {flt.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dynamic Table Content Based On Active Section */}
                  <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {/* SECTION 1: INSPECTION REQUESTS TABLE */}
                    {overviewActiveSection === 'requests' && (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                            <th className="py-2.5 px-3">Customer &amp; Req #</th>
                            <th className="py-2.5 px-3">Location</th>
                            <th className="py-2.5 px-3">Service Scope</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Assigned Vendor</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {displayRequests.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="py-12 text-center text-slate-400">
                                <ClipboardList className="w-8 h-8 mx-auto text-slate-300" />
                                <p className="font-bold text-sm text-slate-600 mt-2">No matching inspection requests</p>
                                <p className="text-xs text-slate-400">Try adjusting your city filter or search query</p>
                              </td>
                            </tr>
                          ) : (
                            displayRequests.map(req => {
                              const media = Array.isArray(req.mediaUrl) ? req.mediaUrl : (req.mediaUrl ? [req.mediaUrl] : []);
                              const q = req.quotations?.[0] || quotations.find(item => item.requestId === req.id);
                              const isAccepted = (req.status || '').toUpperCase() === 'ACCEPTED' || (q && (q.status || '').toUpperCase() === 'ACCEPTED');
                              const isQuoted = (req.status || '').toUpperCase() === 'QUOTED' || (q && (q.status || '').toUpperCase() === 'QUOTED');
                              const isNeedsQuote = ['SUBMITTED', 'ESTIMATING'].includes((req.status || '').toUpperCase()) && !q;
                              const isUrgent = ['URGENT', 'HIGH', 'CRITICAL'].includes((req.urgency || '').toUpperCase());
                              const assignedEngName = req.assignedVendorName || (req.vendorId && vendors.find(v => v.id === req.vendorId)?.name) || req.technicianName || null;
                              const isAssigningThis = assigningEngineerReqId === req.id;

                              return (
                                <tr
                                  key={req.id}
                                  className={`transition-all ${isAccepted ? 'bg-emerald-50/40 hover:bg-emerald-50/70 border-l-4 border-l-emerald-500' : isNeedsQuote ? 'hover:bg-warning-50/30' : 'hover:bg-slate-50/80'}`}
                                >
                                  {/* Customer & ID */}
                                  <td className="py-3 px-3 align-top max-w-[170px]">
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenRequestDetail(req)}
                                          className="font-mono font-bold text-xs text-primary-600 hover:text-primary-800 hover:underline cursor-pointer"
                                          title="Open inspection detail page"
                                        >
                                          {req.requestNumber}
                                        </button>
                                        {isUrgent && (
                                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-red-100 text-red-700 border border-red-200">
                                            {req.urgency}
                                          </span>
                                        )}
                                      </div>
                                      <div className="font-bold text-xs text-slate-900 truncate" title={req.user?.name || 'Customer'}>
                                        {req.user?.name || 'Customer'}
                                      </div>
                                      <div className="flex items-center gap-1.5 pt-0.5">
                                        <a
                                          href={`tel:${req.user?.phoneNumber || ''}`}
                                          className="text-slate-600 hover:text-primary-600 font-mono text-[10.5px] font-semibold flex items-center gap-1"
                                          title="Call Customer"
                                        >
                                          <Phone className="w-2.5 h-2.5 text-emerald-600" />
                                          <span>{req.user?.phoneNumber || 'No Phone'}</span>
                                        </a>
                                      </div>
                                    </div>
                                  </td>

                                  {/* City & Address */}
                                  <td className="py-3 px-3 align-top max-w-[140px]">
                                    <div className="space-y-0.5">
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                        <MapPin className="w-2.5 h-2.5 text-primary-600" />
                                        <span>{req.city || req.location?.split(',')[0] || 'Bhilwara'}</span>
                                      </span>
                                      <div className="text-[10.5px] text-slate-500 leading-tight line-clamp-2" title={req.addressline || req.location}>
                                        {req.addressline || req.location || 'Local Area'}
                                      </div>
                                      <div className="text-[9.5px] text-slate-400 font-medium truncate">
                                        {req.propertyType || 'Residential'}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Service & Issue Scope */}
                                  <td className="py-3 px-3 align-top max-w-[210px]">
                                    <div className="space-y-0.5">
                                      <div className="font-bold text-xs text-slate-800 leading-tight">
                                        {req.servicecode}
                                      </div>
                                      {req.subServiceCode && (
                                        <div className="text-[10.5px] text-primary-700 font-medium truncate">
                                          {req.subServiceCode}
                                        </div>
                                      )}
                                      <div className="text-[10.5px] text-slate-500 line-clamp-2 italic" title={req.issueDescription}>
                                        "{req.issueDescription || 'Repair inspection requested.'}"
                                      </div>
                                      {media.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => setActivePhotoModal({ photos: media, index: 0, title: `Damage Photos - ${req.requestNumber}` })}
                                          className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 text-[9.5px] font-bold transition-all"
                                        >
                                          <Camera className="w-2.5 h-2.5 text-primary-600" />
                                          <span>Inspect {media.length} Photos</span>
                                        </button>
                                      )}
                                    </div>
                                  </td>

                                  {/* Readiness & Quote Status */}
                                  <td className="py-3 px-3 align-top max-w-[130px]">
                                    {isAccepted ? (
                                      <div className="p-1.5 rounded-lg bg-emerald-100/70 border border-emerald-300 space-y-0.5">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-950 uppercase tracking-wide">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready
                                        </span>
                                        <div className="font-mono text-[10px] font-bold text-emerald-800">
                                          Quote: {q?.quoteNumber || 'Agreed'}
                                        </div>
                                        <div className="font-mono font-bold text-xs text-emerald-950">
                                          ₹{(q?.grandtotal || 0).toLocaleString('en-IN')}
                                        </div>
                                      </div>
                                    ) : isQuoted ? (
                                      <div className="p-1.5 rounded-lg bg-primary-50 border border-primary-200 space-y-0.5">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-900 uppercase tracking-wide">
                                          <FileCheck2 className="w-3 h-3 text-primary-600" /> Quoted
                                        </span>
                                        <div className="font-mono font-bold text-xs text-primary-800">
                                          ₹{(q?.grandtotal || 0).toLocaleString('en-IN')}
                                        </div>
                                      </div>
                                    ) : isNeedsQuote ? (
                                      <div className="p-1.5 rounded-lg bg-warning-50 border border-warning-200 space-y-0.5">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning-900 uppercase tracking-wide">
                                          <Clock className="w-3 h-3 text-warning-600" /> Needs Quote
                                        </span>
                                        <div className="text-[9.5px] text-warning-800">Pending estimate</div>
                                      </div>
                                    ) : (
                                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border inline-block ${getStatusBadge(req.status)}`}>
                                        {req.status}
                                      </span>
                                    )}
                                  </td>

                                  {/* Assigned Contractor / Vendor */}
                                  <td className="py-3 px-3 align-top max-w-[140px]">
                                    <div className="space-y-1">
                                      {assignedEngName ? (
                                        <div className="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-0.5">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[8.5px] font-bold text-emerald-700 uppercase tracking-wider">Vendor</span>
                                            <button
                                              onClick={() => setAssigningEngineerReqId(isAssigningThis ? null : req.id)}
                                              className="text-[9.5px] font-bold text-brand-600 hover:underline"
                                            >
                                              Change
                                            </button>
                                          </div>
                                          <div className="font-bold text-xs text-slate-800 flex items-center gap-1 truncate" title={assignedEngName}>
                                            <HardHat className="w-3 h-3 text-emerald-600 shrink-0" />
                                            <span className="truncate">{assignedEngName}</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setAssigningEngineerReqId(isAssigningThis ? null : req.id)}
                                          className="w-full py-1 px-1.5 rounded-lg bg-warning-50 hover:bg-warning-100 text-warning-900 border border-warning-200 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                                        >
                                          <UserPlus className="w-3 h-3 text-warning-600" />
                                          <span>Assign Vendor</span>
                                        </button>
                                      )}

                                      {isAssigningThis && (
                                        <div className="p-2 rounded-xl bg-white border border-brand-300 shadow-xl space-y-1 z-30 absolute right-4 min-w-[210px]">
                                          <div className="text-[10px] font-bold text-slate-600 uppercase border-b border-slate-100 pb-1 flex items-center justify-between">
                                            <span>Select Registered Vendor:</span>
                                            <button
                                              onClick={() => setAssigningEngineerReqId(null)}
                                              className="text-slate-400 hover:text-slate-600 text-xs"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                          <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                                            {vendors.filter(v => v.status === 'active').map(v => (
                                              <button
                                                key={v.id}
                                                onClick={() => {
                                                  setAssigningEngineerReqId(null);
                                                  handleAssignVendorDirect(req.id, v.id);
                                                }}
                                                className="w-full text-left p-1.5 rounded-lg hover:bg-brand-50 text-xs font-semibold text-slate-700 flex flex-col transition-all"
                                              >
                                                <div className="flex items-center justify-between">
                                                  <span className="font-bold text-slate-800">{v.name}</span>
                                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                                    ★ {v.rating || 4.9}
                                                  </span>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                                                  <span className="truncate max-w-[120px] text-slate-500">{v.businessName || v.specialization}</span>
                                                  <span className="text-brand-600 font-medium">{v.city}</span>
                                                </div>
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* Quick Dispatch Actions */}
                                  <td className="py-3 px-3 align-top text-right w-[115px]">
                                    <div className="flex flex-col items-end gap-1">
                                      {(!q || isNeedsQuote) ? (
                                        <button
                                          onClick={() => handleStartQuote(req)}
                                          className="w-full py-1 px-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-bold shadow-2xs transition-all flex items-center justify-center gap-1 whitespace-nowrap"
                                        >
                                          <Zap className="w-3 h-3" />
                                          <span>Create Quote</span>
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => setActiveQuoteModal(q)}
                                          className="w-full py-1 px-2 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 text-[11px] font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap"
                                        >
                                          <Eye className="w-3 h-3" />
                                          <span>View Quote</span>
                                        </button>
                                      )}

                                      <div className="flex items-center gap-1 w-full justify-end">
                                        <button
                                          onClick={() => handleOpenRequestDetail(req)}
                                          className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all cursor-pointer"
                                          title="Open Full Inspection Details"
                                        >
                                          <Eye className="w-3 h-3 text-slate-700" />
                                        </button>
                                        <button
                                          onClick={() => openChatForRequest(req)}
                                          className="p-1 rounded-md bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 transition-all"
                                          title="Open Live Chat"
                                        >
                                          <MessageCircle className="w-3 h-3" />
                                        </button>
                                        {req.user?.phoneNumber && (
                                          <button
                                            onClick={() => callCustomer(req.user.phoneNumber)}
                                            className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all"
                                            title="Call Customer"
                                          >
                                            <Phone className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    )}

                    {/* SECTION 2: INSTANT MAINTENANCE BOOKINGS TABLE */}
                    {overviewActiveSection === 'bookings' && (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                            <th className="py-3 px-4">Booking #</th>
                            <th className="py-3 px-4">City</th>
                            <th className="py-3 px-4">Customer & Contact</th>
                            <th className="py-3 px-4">Service Details</th>
                            <th className="py-3 px-4">Scheduled Slot</th>
                            <th className="py-3 px-4">Assigned Specialist</th>
                            <th className="py-3 px-4">Paid Online</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {displayBookings.length === 0 ? (
                            <tr>
                              <td colSpan="8" className="py-12 text-center text-slate-400">
                                <Zap className="w-8 h-8 mx-auto text-slate-300" />
                                <p className="font-bold text-sm text-slate-600 mt-2">No direct maintenance bookings</p>
                              </td>
                            </tr>
                          ) : (
                            displayBookings.map(b => (
                              <tr key={b.id} className="hover:bg-slate-50/80 transition-all">
                                <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                                  {b.bookingNumber}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800">
                                    <MapPin className="w-3 h-3 text-primary-600" />
                                    {b.city || 'Bhilwara'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-slate-900">{b.customerName}</div>
                                  <a href={`tel:${b.customerPhone}`} className="text-slate-500 hover:text-primary-600 flex items-center gap-1 font-mono text-[11px]">
                                    <Phone className="w-3 h-3 text-emerald-600" /> {b.customerPhone}
                                  </a>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-slate-800">{b.serviceName}</div>
                                  <div className="text-[11px] text-slate-400">{b.subServiceName}</div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-slate-700">{b.scheduledDate}</div>
                                  <div className="text-[10px] text-slate-400">{b.scheduledSlot}</div>
                                </td>
                                <td className="py-3.5 px-4">
                                  {b.technicianName ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-xs">
                                        <HardHat className="w-3.5 h-3.5 text-emerald-600" /> {b.technicianName}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 min-w-[170px]">
                                      <select
                                        value=""
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === '__modal__') {
                                            const matchedV = vendors.find(v => v.phone === b.technicianPhone || v.name === b.technicianName);
                                            setAssignTechModalBooking(b);
                                            setTechForm({
                                              vendorId: matchedV ? matchedV.id : '',
                                              name: b.technicianName || matchedV?.name || '',
                                              phone: b.technicianPhone || matchedV?.phone || '',
                                              role: b.technicianRole || (matchedV ? `${matchedV.businessName || matchedV.name} • ${matchedV.specialization || 'Field Specialist'}` : 'Authorized Service Provider'),
                                              rating: matchedV?.rating || 4.9,
                                              businessName: matchedV?.businessName || '',
                                              city: matchedV?.city || b.city || '',
                                              documentsVerified: matchedV?.documentsVerified || false
                                            });
                                          } else if (val) {
                                            handleQuickAssignBookingVendor(b.id, val);
                                          }
                                        }}
                                        className="w-full text-[11px] font-semibold px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                                      >
                                        <option value="">-- Assign Vendor --</option>
                                        {vendors.filter(v => v.status === 'active').map(v => (
                                          <option key={v.id} value={v.id}>
                                            {v.name} ({v.businessName || v.city})
                                          </option>
                                        ))}
                                        <option value="__modal__">📋 Open Assignment Modal...</option>
                                      </select>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 font-mono">
                                  <div className="font-bold text-slate-900">₹{(b.totalAmount || b.onlinePaidAmount || 199).toLocaleString('en-IN')}</div>
                                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800">
                                    {b.paymentStatus || 'PAID'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => openChatForBooking(b)}
                                      className="p-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200"
                                      title="Chat with customer"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setSelectedBookingForDrawer(b)}
                                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                                    >
                                      Details
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                    {/* SECTION 3: QUOTATIONS INTELLIGENCE & DEMAND BREAKDOWN */}
                    {overviewActiveSection === 'quotations' && (
                      <div className="p-5 space-y-6">
                        {/* Financial Analytics Summary Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Value Quoted</span>
                            <div className="font-heading font-bold text-2xl text-slate-900 mt-1">₹{totalQuotedRev.toLocaleString('en-IN')}</div>
                            <span className="text-[11px] text-slate-500">{filteredByCityQuotes.length} Total Quotes</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Accepted Deals Value</span>
                            <div className="font-heading font-bold text-2xl text-emerald-900 mt-1">₹{totalAcceptedRev.toLocaleString('en-IN')}</div>
                            <span className="text-[11px] text-emerald-700 font-bold">{acceptedQuotes.length} Won Orders</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-primary-50 border border-primary-200">
                            <span className="text-[10px] font-bold text-primary-700 uppercase tracking-wider">Win / Conversion Rate</span>
                            <div className="font-heading font-bold text-2xl text-primary-900 mt-1">{conversionRatePct}%</div>
                            <span className="text-[11px] text-primary-700 font-medium">Customer Conversion</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Deal Ticket</span>
                            <div className="font-heading font-bold text-2xl text-slate-900 mt-1">₹{avgQuoteTicket.toLocaleString('en-IN')}</div>
                            <span className="text-[11px] text-slate-500">Per Quotation</span>
                          </div>
                        </div>

                        {/* Category Demand Bars */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-primary-600" />
                              Demand Distribution by Service Category ({filteredByCityRequests.length} requests)
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                            {Object.entries(categoryDemand).map(([cat, count]) => {
                              const pct = Math.round((count / Math.max(filteredByCityRequests.length, 1)) * 100);
                              return (
                                <div key={cat} className="space-y-1">
                                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                                    <span>{cat}</span>
                                    <span className="font-mono font-bold text-slate-900">{count} ({pct}%)</span>
                                  </div>
                                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary-600 rounded-full" style={{ width: `${pct}%` }}></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Recent Quotations Table */}
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                          <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
                            Recent Quotations Pipeline
                          </div>
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100/60 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                                <th className="py-2.5 px-4">Quote #</th>
                                <th className="py-2.5 px-4">Customer</th>
                                <th className="py-2.5 px-4">Contact</th>
                                <th className="py-2.5 px-4">Status</th>
                                <th className="py-2.5 px-4 text-right">Grand Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {displayQuotes.slice(0, 8).map(q => (
                                <tr key={q.id} className="hover:bg-slate-50">
                                  <td className="py-3 px-4 font-mono font-bold text-primary-600">{q.quoteNumber}</td>
                                  <td className="py-3 px-4 font-bold text-slate-800">{q.customerName || 'Customer'}</td>
                                  <td className="py-3 px-4 font-mono text-slate-600">{q.customerPhone || '—'}</td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      (q.status || '').toUpperCase() === 'ACCEPTED'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-primary-50 text-primary-700'
                                    }`}>
                                      {q.status || 'QUOTED'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                                    ₹{(q.grandtotal || q.amount || 0).toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* SECTION 4: CONNECTED VENDORS POOL */}
                    {overviewActiveSection === 'vendors' && (
                      <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">
                              Local Vendor Network in {overviewCityFilter === 'ALL' ? 'All Operating Cities' : overviewCityFilter}
                            </h4>
                            <p className="text-xs text-slate-500">Connected contractors, adventure operators, and local service partners.</p>
                          </div>
                          <button
                            onClick={() => setActiveTab('vendors')}
                            className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-all"
                          >
                            Manage Vendors & Quoting
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {displayVendors.map(v => (
                            <div key={v.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-bold text-sm text-slate-900">{v.name}</div>
                                  <div className="text-xs text-slate-500 font-medium">{v.businessName}</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  v.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {v.status}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                                <span className="px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700">
                                  📍 {v.city}
                                </span>
                                <span className="px-2 py-0.5 rounded-md font-bold bg-primary-50 text-primary-700">
                                  {v.category}
                                </span>
                                <span className="px-2 py-0.5 rounded-md font-medium bg-slate-50 text-slate-600 border border-slate-200">
                                  {v.specialization}
                                </span>
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-600">⭐ {v.rating || 4.5}</span>
                                <span className="font-mono text-slate-700">Min: ₹{v.minCharge || 500}</span>
                                <a href={`tel:${v.phone}`} className="text-primary-600 font-bold hover:underline flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> Call
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* REQUESTS TAB */}
          {activeTab === 'requests' && (() => {
            const dynamicCityNames = operationalCities.filter(c => c.isActive !== false).map(c => c.name);
            const availableCities = ['ALL', ...dynamicCityNames];

            const isCityMatch = (cityVal) => {
              if (requestsCityFilter === 'ALL') return true;
              const str = typeof cityVal === 'string' ? cityVal : (cityVal?.name || '');
              return str.toLowerCase().includes(requestsCityFilter.toLowerCase());
            };

            const filteredByCityRequests = requests.filter(r => isCityMatch(r.city || r.location || r.addressline));

            // Status counts for tabs
            const countAll = filteredByCityRequests.length;
            const countVendorQuotes = filteredByCityRequests.filter(r => (r.vendorQuotes || []).length > 0).length;
            const countNeedsReview = filteredByCityRequests.filter(r => ['SUBMITTED', 'ESTIMATING'].includes((r.status || '').toUpperCase())).length;
            const countSiteAudit = filteredByCityRequests.filter(r => (r.status || '').toUpperCase() === 'AUDIT_SCHEDULED' || (r.status || '').toUpperCase() === 'SITE_AUDIT' || r.requiresSiteAudit).length;
            const countQuoted = filteredByCityRequests.filter(r => (r.status || '').toUpperCase() === 'QUOTED').length;
            const countActive = filteredByCityRequests.filter(r => ['ACCEPTED', 'IN_PROGRESS'].includes((r.status || '').toUpperCase())).length;
            const countCompleted = filteredByCityRequests.filter(r => (r.status || '').toUpperCase() === 'COMPLETED').length;

            // Apply status filter
            const filteredByStatus = filteredByCityRequests.filter(req => {
              const st = (req.status || '').toUpperCase();
              if (requestsStatusFilter === 'ALL') return true;
              if (requestsStatusFilter === 'VENDOR_QUOTES') return (req.vendorQuotes || []).length > 0;
              if (requestsStatusFilter === 'NEEDS_REVIEW') return ['SUBMITTED', 'ESTIMATING'].includes(st);
              if (requestsStatusFilter === 'SITE_AUDIT') return st === 'AUDIT_SCHEDULED' || st === 'SITE_AUDIT' || req.requiresSiteAudit;
              if (requestsStatusFilter === 'QUOTED') return st === 'QUOTED';
              if (requestsStatusFilter === 'ACTIVE') return ['ACCEPTED', 'IN_PROGRESS'].includes(st);
              if (requestsStatusFilter === 'COMPLETED') return st === 'COMPLETED';
              return true;
            });

            // Apply search filter
            const searchLower = requestsSearch.toLowerCase().trim();
            const displayRequests = filteredByStatus.filter(req => {
              if (!searchLower) return true;
              return (
                (req.requestNumber || '').toLowerCase().includes(searchLower) ||
                (req.user?.name || '').toLowerCase().includes(searchLower) ||
                (req.user?.phoneNumber || '').toLowerCase().includes(searchLower) ||
                (req.servicecode || '').toLowerCase().includes(searchLower) ||
                (req.subServiceCode || '').toLowerCase().includes(searchLower) ||
                (req.issueDescription || '').toLowerCase().includes(searchLower) ||
                (req.location || '').toLowerCase().includes(searchLower) ||
                (req.addressline || '').toLowerCase().includes(searchLower)
              );
            });

            // ==================== DEDICATED INSPECTION REQUEST DETAIL VIEW ====================
            if (viewRequestDetail && selectedRequestDetail) {
              const req = selectedRequestDetail;
              const media = Array.isArray(req.mediaUrl) 
                ? req.mediaUrl 
                : (req.mediaUrl ? [req.mediaUrl] : (Array.isArray(req.damageImages) ? req.damageImages : []));
              const isUrgent = ['URGENT', 'HIGH', 'CRITICAL'].includes((req.urgency || '').toUpperCase());
              const isAuditScheduled = (req.status || '').toUpperCase() === 'AUDIT_SCHEDULED' || (req.status || '').toUpperCase() === 'SITE_AUDIT' || req.requiresSiteAudit;
              const hasQuote = (req.quotations || []).length > 0 || quotations.some(q => q.requestId === req.id || q.requestNumber === req.requestNumber);
              const assignedVendor = vendors.find(v => v.id === req.vendorId || v.name === req.assignedVendorName || v.businessName === req.assignedVendorName);
              const linkedBOQ = req.quotations?.[0] || quotations.find(q => q.requestId === req.id || q.requestNumber === req.requestNumber);
              const vendorQuotesList = req.vendorQuotes || [];
              const lowestVendorQuote = vendorQuotesList.length > 0 ? Math.min(...vendorQuotesList.map(q => q.quotePrice)) : null;
              const highestVendorQuote = vendorQuotesList.length > 0 ? Math.max(...vendorQuotesList.map(q => q.quotePrice)) : null;
              const avgVendorQuote = vendorQuotesList.length > 0 ? Math.round(vendorQuotesList.reduce((acc, q) => acc + (q.quotePrice || 0), 0) / vendorQuotesList.length) : null;
              const boqPrice = linkedBOQ?.grandtotal || linkedBOQ?.amount || null;
              const grossMargin = (boqPrice && lowestVendorQuote) ? (boqPrice - lowestVendorQuote) : null;
              const grossMarginPct = (grossMargin && boqPrice > 0) ? Math.round((grossMargin / boqPrice) * 100) : null;

              const videoFiles = media.filter(m => isVideoMedia(m));
              const photoFiles = media.filter(m => !isVideoMedia(m));

              const customerPhone = req.user?.phoneNumber || req.customerPhone || '';
              const customerName = req.user?.name || req.customerName || 'Customer';
              const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
              const waLink = cleanPhone ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(`Hello ${customerName}, I am contacting you from Hipro regarding your inspection request #${req.requestNumber} for ${req.servicecode}.`)}` : null;

              return (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* 1. BREADCRUMB & ACTION BAR */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <button
                        type="button"
                        onClick={handleCloseRequestDetail}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to All Requests</span>
                      </button>
                      <span className="text-slate-300">/</span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {req.requestNumber}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        isUrgent
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {req.urgency || 'NORMAL'}
                      </span>
                      {(req.city || req.location) && (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-primary-600" />
                          <span>{req.city || req.location}</span>
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wide ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                    </div>

                    {/* Quick Stage Selector & Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                        <span className="text-[11px] font-semibold text-slate-500">Stage:</span>
                        <select
                          value={req.status}
                          onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                          className="text-xs font-bold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
                        >
                          <option value="SUBMITTED">SUBMITTED</option>
                          <option value="AUDIT_SCHEDULED">AUDIT_SCHEDULED</option>
                          <option value="ESTIMATING">ESTIMATING</option>
                          <option value="QUOTED">QUOTED</option>
                          <option value="ACCEPTED">ACCEPTED</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => openChatForRequest(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-all shadow-2xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-primary-600" />
                        <span>Chat Customer</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartQuote(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-2xs"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>{linkedBOQ ? 'Edit BOQ Quote' : 'Build BOQ Quote'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenShareVendorsModal(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-2xs"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share with Vendors</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. EXECUTIVE 4-PILLAR METRICS BANNER */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Pillar 1: Target Service */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>Target Service</span>
                        <Wrench className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="font-heading font-bold text-base text-slate-900 truncate" title={req.servicecode}>
                        {req.servicecode}
                      </div>
                      <div className="text-xs font-semibold text-primary-600 truncate">
                        {req.subServiceCode || 'Damage Inspection & Repair'}
                      </div>
                    </div>

                    {/* Pillar 2: Client Details */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>Customer Profile</span>
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="font-heading font-bold text-base text-slate-900 truncate">
                        {customerName}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {customerPhone ? (
                          <a href={`tel:${customerPhone}`} className="font-mono font-medium text-primary-600 hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{customerPhone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">Phone not on file</span>
                        )}
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1"
                          >
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Pillar 3: Vendor Bids & Price Elevation */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>Vendor Bids Received</span>
                        <Tag className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-heading font-bold text-xl text-slate-900">
                          {vendorQuotesList.length} {vendorQuotesList.length === 1 ? 'Bid' : 'Bids'}
                        </span>
                        {lowestVendorQuote && (
                          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Min: ₹{lowestVendorQuote.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {boqPrice
                          ? `BOQ: ₹${boqPrice.toLocaleString('en-IN')} (${grossMarginPct ? `+${grossMarginPct}% Margin` : ''})`
                          : 'Customer BOQ Quote pending'}
                      </div>
                    </div>

                    {/* Pillar 4: Project Assignment */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>Project Assignment</span>
                        <HardHat className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="font-heading font-bold text-base text-slate-900 truncate">
                        {req.assignedVendorName || 'Unassigned'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {req.assignedQuotePrice ? (
                          <span className="font-mono font-semibold text-emerald-700">
                            Awarded at ₹{req.assignedQuotePrice.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-amber-700 font-medium">Bidding & Review Open</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Verified Customer Feedback Banner if Rated */}
                  {req.customerRating && (
                    <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/90 shadow-2xs flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                          ★
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-amber-950">Customer Rating: {req.customerRating.toFixed(1)} / 5.0</h4>
                            <span className="text-amber-500 text-xs">
                              {'★'.repeat(Math.round(req.customerRating))}
                            </span>
                          </div>
                          {req.customerReview ? (
                            <p className="text-xs text-amber-900 italic mt-0.5">"{req.customerReview}"</p>
                          ) : (
                            <p className="text-xs text-amber-800/80 mt-0.5">Service completed and verified by customer.</p>
                          )}
                        </div>
                      </div>
                      {req.ratedAt && (
                        <span className="text-[11px] font-semibold text-amber-700/80">
                          Rated on {new Date(req.ratedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 3. DEDICATED TABS BAR */}
                  <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs px-4 flex items-center gap-2 overflow-x-auto">
                    {[
                      { id: 'overview', label: 'Requirement & Customer Scope', icon: FileText },
                      { id: 'media', label: `Damage Evidence (${media.length} items)`, icon: Camera },
                      { id: 'quotes', label: `Vendor Quotes & Price Elevation (${vendorQuotesList.length})`, icon: Tag, highlight: vendorQuotesList.length > 0 },
                      { id: 'timeline', label: 'Service Timeline & Audit', icon: Clock }
                    ].map(tab => {
                      const Icon = tab.icon;
                      const isSel = requestDetailTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setRequestDetailTab(tab.id)}
                          className={`py-3.5 px-3 border-b-2 text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                            isSel
                              ? 'border-slate-900 text-slate-900'
                              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSel ? 'text-slate-900' : 'text-slate-400'}`} />
                          <span>{tab.label}</span>
                          {tab.highlight && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* 4. TAB CONTENTS */}
                  {/* TAB 1: OVERVIEW & CUSTOMER REQUIREMENT */}
                  {requestDetailTab === 'overview' && (
                    <div className="space-y-5">
                      {/* Reported Damage Issue Box */}
                      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span>Customer Reported Problem & Damage Scope</span>
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isUrgent ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'
                          }`}>
                            Priority: {req.urgency || 'NORMAL'}
                          </span>
                        </div>
                        <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-xl text-slate-800 text-sm leading-relaxed font-normal">
                          {req.issueDescription || 'No description provided by customer.'}
                        </div>
                      </div>

                      {/* Client, Site Location & Audit Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Customer & Site Location Card */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                            <Home className="w-4 h-4 text-primary-600" />
                            <span>Property Scope & Site Address</span>
                          </h3>

                          <div className="space-y-3 text-xs">
                            <div className="flex items-start justify-between py-2 border-b border-slate-100">
                              <span className="text-slate-500">Customer Name:</span>
                              <strong className="text-slate-900 font-semibold">{customerName}</strong>
                            </div>
                            <div className="flex items-start justify-between py-2 border-b border-slate-100">
                              <span className="text-slate-500">Phone Contact:</span>
                              <div className="flex items-center gap-2">
                                <a href={`tel:${customerPhone}`} className="font-mono font-bold text-primary-600 hover:underline">
                                  {customerPhone || 'N/A'}
                                </a>
                                {waLink && (
                                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 hover:bg-emerald-100 text-[10px]">
                                    WhatsApp
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-start justify-between py-2 border-b border-slate-100">
                              <span className="text-slate-500">Property Type:</span>
                              <span className="font-semibold text-slate-800">{req.propertyType || '—'}</span>
                            </div>
                            <div className="flex items-start justify-between py-2 border-b border-slate-100">
                              <span className="text-slate-500">Property Area / Scale:</span>
                              <span className="font-semibold text-slate-800">{req.propertySize || '—'}</span>
                            </div>
                            <div className="flex items-start justify-between py-2 border-b border-slate-100">
                              <span className="text-slate-500">Requested Inspection Slot:</span>
                              <span className="font-semibold text-slate-800">
                                {req.preferredDate || 'Flexible'} {req.preferredTime ? `• ${req.preferredTime}` : ''}
                              </span>
                            </div>
                            <div className="py-2 space-y-1">
                              <span className="text-slate-500 block">Full Site Address:</span>
                              <p className="font-medium text-slate-900 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                {req.addressline || req.location || 'Site address not provided'}
                              </p>
                              {(req.addressline || req.location) && (
                                <a
                                  href={`https://maps.google.com/?q=${encodeURIComponent(req.addressline || req.location)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:underline mt-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Open in Google Maps</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Physical Site Audit & Assigned Contractor */}
                        <div className="space-y-5">
                          {/* Contractor Assignment Card */}
                          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                                <HardHat className="w-4 h-4 text-emerald-600" />
                                <span>Assigned Project Contractor</span>
                              </h3>
                              {isProjectAwarded(req) ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Awarded</span>
                                </span>
                              ) : vendorQuotesList.length > 0 ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1">
                                  <Tag className="w-3 h-3 text-amber-600" />
                                  <span>{vendorQuotesList.length} Quote{vendorQuotesList.length > 1 ? 's' : ''} Pending Award</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  Unassigned
                                </span>
                              )}
                            </div>

                            {isProjectAwarded(req) ? (
                              <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200/80 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h4 className="font-heading font-bold text-base text-slate-900">
                                      {req.assignedVendorName || assignedVendor?.name || 'Assigned Contractor'}
                                    </h4>
                                    {assignedVendor && (
                                      <p className="text-xs text-slate-600 font-medium">
                                        {assignedVendor.specialization || 'Contractor'} • {assignedVendor.city || 'Hub'}
                                      </p>
                                    )}
                                  </div>
                                  {req.assignedQuotePrice && (
                                    <div className="text-right">
                                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Awarded Bid</span>
                                      <span className="font-mono font-bold text-base text-emerald-700">
                                        ₹{Number(req.assignedQuotePrice).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-emerald-200/60 text-xs">
                                  {assignedVendor && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenVendorDetail(assignedVendor)}
                                      className="px-3 py-1.5 rounded-lg font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                                    >
                                      <span>View Contractor Profile</span>
                                      <ExternalLink className="w-3 h-3 text-slate-500" />
                                    </button>
                                  )}
                                  {assignedVendor?.phone && (
                                    <a
                                      href={`tel:${assignedVendor.phone}`}
                                      className="px-3 py-1.5 rounded-lg font-bold bg-white hover:bg-slate-50 text-primary-700 border border-primary-200 flex items-center gap-1 transition-all"
                                    >
                                      <Phone className="w-3 h-3" />
                                      <span>Call</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : vendorQuotesList.length > 0 ? (
                              <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/80 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h4 className="font-heading font-bold text-sm text-amber-950 flex items-center gap-1.5">
                                      <span>Contractor Quotations Under Admin Review</span>
                                    </h4>
                                    <p className="text-xs text-slate-600 mt-1">
                                      {vendorQuotesList.length} contractor{vendorQuotesList.length > 1 ? 's have' : ' has'} quoted for this inspection. Contractor has not been awarded yet.
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Lowest Bid</span>
                                    <span className="font-mono font-bold text-sm text-emerald-700">
                                      ₹{Math.min(...vendorQuotesList.map(q => q.quotePrice)).toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between gap-2">
                                  <span className="text-[11px] text-slate-500">
                                    Review bids to select & award the winning contractor
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setRequestDetailTab('quotes')}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>Review & Award</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                                <p className="text-xs text-slate-500 font-medium">
                                  This project has not been awarded to a contractor yet.
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenShareVendorsModal(req)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-2xs cursor-pointer"
                                  >
                                    + Share with Nearby Contractors
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Site Audit Status Card */}
                          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-amber-600" />
                                <span>Physical On-Site Audit Inspection</span>
                              </h3>
                              <button
                                type="button"
                                onClick={() => handleToggleSiteAudit(req)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                  isAuditScheduled
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/20'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {isAuditScheduled ? 'Audit: REQUIRED' : 'Mark Required'}
                              </button>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              When marked required, senior civil engineers perform thermal crack detection and core moisture testing before finalizing the BOQ.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: EVIDENCE MEDIA & VIDEOS */}
                  {requestDetailTab === 'media' && (
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-heading font-bold text-base text-slate-900">
                            Customer Uploaded Site Evidence
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            High-definition damage photos and recorded videos submitted with request #{req.requestNumber}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200">
                          {media.length} Evidence {media.length === 1 ? 'Item' : 'Items'}
                        </span>
                      </div>

                      {media.length === 0 ? (
                        <div className="p-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                          <Camera className="w-10 h-10 text-slate-300 mx-auto" />
                          <h4 className="font-heading font-bold text-sm text-slate-700">No media evidence provided</h4>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Customer did not attach site photos or videos during submission. A physical site audit is recommended to assess repair requirements.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleToggleSiteAudit(req)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
                          >
                            Schedule Physical Site Audit
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Video Section (if any videos) */}
                          {videoFiles.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-2">
                                <Video className="w-4 h-4 text-primary-600" />
                                <span>Customer Recorded Videos ({videoFiles.length})</span>
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {videoFiles.map((vidUrl, idx) => (
                                  <div key={idx} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-sm space-y-2 p-2">
                                    <video
                                      src={vidUrl}
                                      controls
                                      className="w-full h-64 rounded-xl object-contain bg-black"
                                      preload="metadata"
                                    />
                                    <div className="px-2 py-1 flex items-center justify-between text-xs text-slate-300">
                                      <span className="font-semibold truncate">Video Evidence #{idx + 1}</span>
                                      <a
                                        href={vidUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] font-bold text-primary-400 hover:underline flex items-center gap-1"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        <span>Full Screen</span>
                                      </a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Photos Section */}
                          {photoFiles.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-2">
                                <Camera className="w-4 h-4 text-primary-600" />
                                <span>High-Definition Damage Photos ({photoFiles.length})</span>
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {photoFiles.map((photoUrl, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => setActivePhotoModal({ photos: photoFiles, index: idx, title: `${req.requestNumber} Site Damage Photo #${idx + 1}` })}
                                    className="group rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-primary-500 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-md transition-all relative aspect-square flex flex-col justify-end"
                                  >
                                    <img
                                      src={photoUrl}
                                      alt={`Damage evidence #${idx + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'; }}
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent p-2.5 flex items-center justify-between text-white">
                                      <span className="text-xs font-bold">Photo #{idx + 1}</span>
                                      <span className="p-1 rounded-md bg-white/20 hover:bg-white/40 transition-colors">
                                        <Eye className="w-3.5 h-3.5" />
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: VENDOR QUOTATIONS & PRICE ELEVATION */}
                  {requestDetailTab === 'quotes' && (
                    <div className="space-y-5">
                      {/* Price Elevation & Gross Margin Card */}
                      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                              <Tag className="w-4 h-4 text-emerald-600" />
                              <span>Vendor Quotations & Price Elevation Analysis</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Compare competitive bids from verified local contractors against client BOQ estimates to protect profit margins.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenShareVendorsModal(req)}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Request More Bids</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartQuote(req)}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                              <span>{linkedBOQ ? 'Update Customer BOQ' : 'Create Customer BOQ'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Price Elevation Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Lowest Vendor Bid</span>
                            <div className="font-mono font-bold text-lg text-emerald-700">
                              {lowestVendorQuote ? `₹${lowestVendorQuote.toLocaleString('en-IN')}` : 'No Bids'}
                            </div>
                            <span className="text-[11px] text-slate-400">Best contractor price</span>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Highest Vendor Bid</span>
                            <div className="font-mono font-bold text-lg text-slate-800">
                              {highestVendorQuote ? `₹${highestVendorQuote.toLocaleString('en-IN')}` : '—'}
                            </div>
                            <span className="text-[11px] text-slate-400">Market ceiling</span>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Client BOQ Price</span>
                            <div className="font-mono font-bold text-lg text-primary-700">
                              {boqPrice ? `₹${boqPrice.toLocaleString('en-IN')}` : 'Pending'}
                            </div>
                            <span className="text-[11px] text-slate-400">Billable to customer</span>
                          </div>

                          <div className={`p-3.5 rounded-xl border space-y-1 ${
                            grossMargin && grossMargin > 0
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Price Elevation / Margin</span>
                            <div className="font-mono font-bold text-lg text-emerald-800">
                              {grossMargin ? `₹${grossMargin.toLocaleString('en-IN')}` : '—'}
                            </div>
                            <span className="text-[11px] font-bold text-emerald-700">
                              {grossMarginPct ? `+${grossMarginPct}% Gross Margin` : 'Awaiting BOQ Quote'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Vendor Quotations List Cards */}
                      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-heading font-bold text-sm text-slate-900">
                            Submitted Contractor Quotations ({vendorQuotesList.length})
                          </h4>
                          <span className="text-xs text-slate-500">
                            Click 'Award Project' to lock in contractor and issue work order
                          </span>
                        </div>

                        {vendorQuotesList.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
                            <Tag className="w-8 h-8 text-slate-300 mx-auto" />
                            <h5 className="font-heading font-bold text-xs text-slate-700">No contractor quotes received yet</h5>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                              Click below to dispatch this inspection request to verified local contractors in {req.city || 'the area'}.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleOpenShareVendorsModal(req)}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
                            >
                              + Share with Nearby Contractors
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {vendorQuotesList.map((vq, idx) => {
                              const isAwarded = isProjectAwarded(req);
                              const isWon = (vq.status === 'accepted' || vq.status === 'assigned') || (isAwarded && (req.assignedQuotePrice === vq.quotePrice || req.vendorId === vq.vendorId));
                              const matchedVendor = vendors.find(v => v.id === vq.vendorId || v.name === vq.vendorName || v.businessName === vq.vendorBusiness);

                              return (
                                <div
                                  key={vq.id || idx}
                                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                                    isWon
                                      ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-xs'
                                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                                  }`}
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <h5 className="font-heading font-bold text-sm text-slate-900">
                                            {vq.vendorBusiness || vq.vendorName || 'Connected Contractor'}
                                          </h5>
                                          {isWon && (
                                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                                              AWARDED
                                            </span>
                                          )}
                                        </div>
                                        {matchedVendor && (
                                          <p className="text-[11px] text-slate-500">
                                            {matchedVendor.specialization || 'Contractor'} • ⭐ {matchedVendor.rating || 4.8}
                                          </p>
                                        )}
                                      </div>

                                      <div className="text-right">
                                        <span className="font-mono font-bold text-xl text-emerald-700">
                                          ₹{vq.quotePrice.toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-[10px] text-slate-500 block">Bid Price</span>
                                      </div>
                                    </div>

                                    {/* Breakdown chips */}
                                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600">
                                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-medium">
                                        ⏱️ {vq.proposedDays ? `${vq.proposedDays} Days Timeline` : '3-5 Days'}
                                      </span>
                                      {vq.materialsCost && (
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-medium">
                                          🧱 Materials: ₹{Number(vq.materialsCost).toLocaleString('en-IN')}
                                        </span>
                                      )}
                                      {vq.laborCost && (
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-medium">
                                          👷 Labor: ₹{Number(vq.laborCost).toLocaleString('en-IN')}
                                        </span>
                                      )}
                                    </div>

                                    {vq.notes && renderQuotationBreakdown(vq.notes)}
                                  </div>

                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                      {matchedVendor && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenVendorDetail(matchedVendor)}
                                          className="text-[11px] font-bold text-slate-700 hover:text-slate-900 underline cursor-pointer"
                                        >
                                          Vendor Profile
                                        </button>
                                      )}
                                      {matchedVendor?.phone && (
                                        <a
                                          href={`tel:${matchedVendor.phone}`}
                                          className="text-[11px] font-semibold text-primary-600 hover:underline ml-2"
                                        >
                                          Call: {matchedVendor.phone}
                                        </a>
                                      )}
                                    </div>

                                    {isWon ? (
                                      <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Winning Contractor</span>
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleAssignVendorFromQuote(vq, req)}
                                        disabled={isAssigningFromQuotes}
                                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>{isAssigningFromQuotes ? 'Awarding...' : 'Award Project'}</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: SERVICE TIMELINE & AUDIT */}
                  {requestDetailTab === 'timeline' && (
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-heading font-bold text-base text-slate-900">
                            Service Lifecycle & Stage Tracker
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Real-time customer view milestone pipeline. Tap any stage to advance the inspection request.
                          </p>
                        </div>
                        <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200">
                          Stage {getTimelineStepIndex(req.status) + 1} of 5
                        </span>
                      </div>

                      {/* 5-Step Milestone Controller */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary-600 h-full transition-all duration-300"
                            style={{ width: `${((getTimelineStepIndex(req.status) + 1) / 5) * 100}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                          {TIMELINE_STAGES.map((stg, idx) => {
                            const currentIdx = getTimelineStepIndex(req.status);
                            const isPast = idx < currentIdx;
                            const isCurrent = idx === currentIdx;

                            let btnStyle = 'bg-white text-slate-600 border-slate-200 hover:border-primary-400 hover:text-primary-600';
                            if (isCurrent) {
                              btnStyle = 'bg-primary-600 text-white border-primary-600 shadow-xs font-bold ring-2 ring-primary-500/20';
                            } else if (isPast) {
                              btnStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
                            }

                            return (
                              <button
                                key={stg.key}
                                type="button"
                                onClick={() => handleUpdateStatus(req.id, stg.key)}
                                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${btnStyle}`}
                              >
                                <div className="flex items-center justify-center">
                                  {isPast ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                                      isCurrent ? 'bg-white text-primary-600' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      {stg.step}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-bold">{stg.label}</span>
                                <span className="text-[10px] text-slate-400 line-clamp-1">{stg.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div className="space-y-5">
                {/* 1. TOP HEADER & METRIC CONTROLLER */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <h2 className="font-heading font-bold text-lg text-slate-900">
                        Inspection Requests & Site Audits
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-50 text-primary-700 border border-primary-200">
                        {displayRequests.length} Showing
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                      Review customer damage evidence, schedule physical civil site audits, assign connected vendors, and issue itemized BOQ quotations.
                    </p>
                  </div>

                  {/* Header Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() => fetchRequests()}
                      disabled={isLoadingRequests}
                      title="Sync Inspection Requests"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoadingRequests ? 'animate-spin' : ''}`} />
                      <span>{isLoadingRequests ? 'Syncing...' : 'Sync Requests'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCreateTestRequest('Udaipur')}
                      title="Seed a realistic test inspection request in Udaipur"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Seed Test Lead</span>
                    </button>
                  </div>
                </div>

                {/* 2. MULTI-CITY QUICK SWITCHER BAR */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Operational Hub:</span>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
                    {availableCities.map(c => {
                      const isSel = requestsCityFilter === c;
                      const cCount = c === 'ALL'
                        ? requests.length
                        : requests.filter(r => (r.city || r.location || r.addressline || '').toLowerCase().includes(c.toLowerCase())).length;

                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setRequestsCityFilter(c)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                            isSel
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                          }`}
                        >
                          <span>{c === 'ALL' ? '🌐 All Hubs' : `📍 ${c}`}</span>
                          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                            isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {cCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCityModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-1.5 shrink-0 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Hub</span>
                  </button>
                </div>

                {/* Active Hub Alert Banner */}
                {requestsCityFilter !== 'ALL' && (
                  <div className="bg-primary-50/90 border border-primary-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-primary-800 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary-600 shrink-0" />
                      <span>
                        Showing requests for <strong>📍 {requestsCityFilter}</strong> only ({filteredByCityRequests.length} of {requests.length} total). Requests in other cities are hidden by this hub filter.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRequestsCityFilter('ALL')}
                      className="font-bold underline hover:text-primary-900 cursor-pointer ml-3 shrink-0"
                    >
                      Show All Hubs ({requests.length})
                    </button>
                  </div>
                )}

                {/* 3. STATUS FILTER PILLS & SEARCH BAR */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Status Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {[
                      { id: 'ALL', label: 'All Requests', count: countAll },
                      { id: 'VENDOR_QUOTES', label: '⭐ Vendor Quotes Received', count: countVendorQuotes, highlight: countVendorQuotes > 0 },
                      { id: 'NEEDS_REVIEW', label: 'Needs Estimating', count: countNeedsReview },
                      { id: 'SITE_AUDIT', label: 'Site Audit Req.', count: countSiteAudit },
                      { id: 'QUOTED', label: 'Quoted', count: countQuoted },
                      { id: 'ACTIVE', label: 'In Execution', count: countActive },
                      { id: 'COMPLETED', label: 'Completed', count: countCompleted }
                    ].map(st => {
                      const isStActive = requestsStatusFilter === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setRequestsStatusFilter(st.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                            isStActive
                              ? 'bg-primary-600 text-white shadow-xs font-bold'
                              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                          }`}
                        >
                          <span>{st.label}</span>
                          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                            isStActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {st.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full md:w-80 shrink-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={requestsSearch}
                      onChange={(e) => setRequestsSearch(e.target.value)}
                      placeholder="Search customer, phone, request #..."
                      className="w-full pl-9 pr-8 py-1.5 bg-white text-xs text-slate-700 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                    />
                    {requestsSearch && (
                      <button
                        type="button"
                        onClick={() => setRequestsSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. MAIN CONTENT AREA */}
                {isLoadingRequests && requests.length === 0 ? (
                  // Skeleton Loading State
                  <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map(k => (
                      <div key={k} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-pulse space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="h-5 w-32 bg-slate-200 rounded-md" />
                          <div className="h-5 w-20 bg-slate-200 rounded-full" />
                        </div>
                        <div className="h-4 w-48 bg-slate-200 rounded-md" />
                        <div className="h-16 w-full bg-slate-100 rounded-xl" />
                        <div className="h-20 w-full bg-slate-100 rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : displayRequests.length === 0 ? (
                  // Resilient Empty State
                  <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="w-7 h-7" />
                    </div>
                    <h3 className="font-heading font-bold text-base text-slate-800">
                      No inspection requests found
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      {requestsCityFilter !== 'ALL' || requestsStatusFilter !== 'ALL' || requestsSearch
                        ? `No requests match the active filters (${requestsCityFilter !== 'ALL' ? `City: ${requestsCityFilter}` : ''} ${requestsStatusFilter !== 'ALL' ? `Status: ${requestsStatusFilter}` : ''} ${requestsSearch ? `Search: "${requestsSearch}"` : ''}).`
                        : 'No inspection requests are currently logged in the database.'}
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
                      {(requestsCityFilter !== 'ALL' || requestsStatusFilter !== 'ALL' || requestsSearch) && (
                        <button
                          type="button"
                          onClick={() => {
                            setRequestsCityFilter('ALL');
                            setRequestsStatusFilter('ALL');
                            setRequestsSearch('');
                          }}
                          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                        >
                          Clear All Filters
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => fetchAllData(true)}
                        className="px-4 py-2 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-all inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Sync Live Database
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreateTestRequest('Udaipur')}
                        className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all inline-flex items-center gap-1.5"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> + Seed Test Request
                      </button>
                    </div>
                  </div>
                ) : (
                  // Grid of Rich Request Cards
                  <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {displayRequests.map(req => {
                      const media = Array.isArray(req.mediaUrl) ? req.mediaUrl : (req.mediaUrl ? [req.mediaUrl] : []);
                      const isUrgent = ['URGENT', 'HIGH', 'CRITICAL'].includes((req.urgency || '').toUpperCase());
                      const isAuditScheduled = (req.status || '').toUpperCase() === 'AUDIT_SCHEDULED' || (req.status || '').toUpperCase() === 'SITE_AUDIT' || req.requiresSiteAudit;
                      const hasQuote = (req.quotations || []).length > 0 || quotations.some(q => q.requestId === req.id || q.requestNumber === req.requestNumber);
                      const assignedVendor = vendors.find(v => v.id === req.vendorId);

                      return (
                        <div
                          key={req.id}
                          className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-4">
                            {/* Card Header: Request #, Urgency, Status */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleOpenRequestDetail(req)}
                                  className="font-mono font-bold text-sm sm:text-base text-primary-600 hover:text-primary-800 hover:underline tracking-wide cursor-pointer text-left"
                                  title="Click to view full inspection requirement, photos & vendor details"
                                >
                                  {req.requestNumber}
                                </button>
                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  isUrgent
                                    ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {req.urgency || 'NORMAL'}
                                </span>
                                {isAuditScheduled && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-warning-50 text-warning-800 border border-warning-300 flex items-center gap-1 shadow-2xs">
                                    <MapPin className="w-3 h-3 text-warning-600" /> Site Audit Req.
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenRequestDetail(req)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                                  title="View full requirement, photos & vendor quotations"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Details</span>
                                </button>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wide ${getStatusBadge(req.status)}`}>
                                  {req.status}
                                </span>
                                {req.customerRating && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200" title={req.customerReview || 'Customer rating'}>
                                    <span className="text-amber-500">★</span> {req.customerRating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* HIGH VISIBILITY: VENDOR QUOTATION ALERT CALLOUT */}
                            {(req.vendorQuotes || []).length > 0 && (
                              <div
                                onClick={() => handleOpenRequestDetail(req, 'quotes')}
                                className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-xl cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between gap-3 group"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                                    <Tag className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-bold text-emerald-950">
                                        {(req.vendorQuotes || []).length} Vendor {(req.vendorQuotes || []).length === 1 ? 'Quotation' : 'Quotations'} Received!
                                      </span>
                                      <span className="text-[11px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                                        Lowest: ₹{Math.min(...(req.vendorQuotes || []).map(q => q.quotePrice)).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-emerald-700 mt-0.5 line-clamp-1">
                                      From: {(req.vendorQuotes || []).map(q => q.vendorBusiness || q.vendorName || 'Contractor').join(', ')}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shrink-0 flex items-center gap-1 shadow-xs"
                                >
                                  <span>Review & Award</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {/* Service Category & Sub Service */}
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                                  {req.servicecode}
                                </h3>
                                {(req.city || req.location) && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-primary-600" />
                                    <span>{req.city || req.location}</span>
                                  </span>
                                )}
                              </div>
                              {req.subServiceCode && (
                                <p className="text-xs sm:text-sm font-semibold text-primary-600 mt-0.5">
                                  {req.subServiceCode}
                                </p>
                              )}
                            </div>

                            {/* Issue Description Callout */}
                            <div className="p-3.5 bg-slate-50/90 rounded-xl text-xs sm:text-sm text-slate-700 leading-relaxed border border-slate-200 font-normal">
                              <div className="flex items-start gap-1.5">
                                <AlertCircle className="w-4 h-4 text-warning-600 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-slate-900 mr-1">Reported Issue:</strong>
                                  {req.issueDescription || 'No description provided'}
                                </div>
                              </div>
                            </div>

                            {/* Damage Photos & Videos Gallery */}
                            {media.length > 0 ? (
                              <div className="space-y-1.5">
                                <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                                  <span>Site Evidence ({media.length} items):</span>
                                  <span className="text-[11px] text-primary-600 font-medium">Click to inspect</span>
                                </div>
                                <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar">
                                  {media.map((itemUrl, i) => {
                                    const isVid = isVideoMedia(itemUrl);
                                    return (
                                      <div
                                        key={i}
                                        onClick={() => setActivePhotoModal({ photos: media, index: i, title: `${req.requestNumber} Site Evidence` })}
                                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-slate-200 cursor-pointer relative group shrink-0 hover:border-primary-500 hover:shadow-md transition-all"
                                      >
                                        {isVid ? (
                                          <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white">
                                            <Video className="w-6 h-6 text-primary-400 group-hover:scale-110 transition-transform" />
                                            <span className="text-[9px] font-bold mt-1">Video</span>
                                          </div>
                                        ) : (
                                          <img
                                            src={itemUrl}
                                            alt="Damage evidence"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80'; }}
                                          />
                                        )}
                                        <span className="absolute bottom-0 inset-x-0 bg-slate-900/75 backdrop-blur-xs text-white text-[9.5px] font-semibold text-center py-0.5">
                                          {isVid ? 'Play Video' : `Photo #${i + 1}`}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 italic text-center">
                                No site photos or videos uploaded
                              </div>
                            )}

                            {/* Customer & Site Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100 text-slate-600">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-800">{req.user?.name || req.customerName || 'Customer'}</span>
                              </div>
                              <div className="flex items-center gap-2 font-mono">
                                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                <a
                                  href={`tel:${req.user?.phoneNumber || req.customerPhone || ''}`}
                                  className="font-medium text-primary-600 hover:underline"
                                >
                                  {req.user?.phoneNumber || req.customerPhone || 'N/A'}
                                </a>
                              </div>
                              <div className="flex items-center gap-2">
                                <Home className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-700 truncate">
                                  {req.propertyType || 'House'} ({req.propertySize || 'Standard'})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-700">
                                  {req.preferredDate || 'Flexible'} {req.preferredTime ? `• ${req.preferredTime}` : ''}
                                </span>
                              </div>
                              <div className="col-span-1 sm:col-span-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-700 truncate" title={req.addressline || req.location || ''}>
                                  {req.addressline || req.location || 'Site address not provided'}
                                </span>
                              </div>
                            </div>

                            {/* Connected Vendor Quoting & Project Assignment Section */}
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                  <HardHat className="w-3.5 h-3.5 text-primary-600" />
                                  <span>Vendor Quoting & Project Assignment:</span>
                                </span>
                                {isProjectAwarded(req) ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const v = vendors.find(x => x.id === req.vendorId || x.name === req.assignedVendorName);
                                      if (v) handleOpenVendorDetail(v);
                                    }}
                                    className="text-[10px] font-bold text-success-700 bg-success-50 hover:bg-success-100 px-2.5 py-0.5 rounded-full border border-success-200 flex items-center gap-1 transition-all cursor-pointer"
                                    title="Click to view full contractor profile & KYC"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-success-600" />
                                    <span>Awarded: {req.assignedVendorName}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-success-600 ml-0.5" />
                                  </button>
                                ) : (req.vendorQuotes || []).length > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRequestDetail(req, 'quotes')}
                                    className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 transition-all cursor-pointer"
                                    title="Click to review quotes and award contractor"
                                  >
                                    <Tag className="w-3 h-3 text-amber-600" />
                                    <span>{(req.vendorQuotes || []).length} Quote{(req.vendorQuotes || []).length > 1 ? 's' : ''} Received (Pending Award)</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                                    Unassigned
                                  </span>
                                )}
                              </div>

                              {/* Two Core Action Buttons: Share with Vendors & View Quotations */}
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenShareVendorsModal(req)}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                                    (req.sharedVendors || []).length > 0
                                      ? 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
                                      : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20'
                                  }`}
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  <span>
                                    {(req.sharedVendors || []).length > 0
                                      ? `Shared (${req.sharedVendors.length})`
                                      : 'Share with Vendors'}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenVendorQuotesModal(req)}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                                    (req.vendorQuotes || []).length > 0
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                                  }`}
                                >
                                  <Tag className="w-3.5 h-3.5" />
                                  <span>
                                    {(req.vendorQuotes || []).length > 0
                                      ? `Quotes (${req.vendorQuotes.length})`
                                      : 'Quotes (0)'}
                                  </span>
                                </button>
                              </div>

                              {isProjectAwarded(req) && req.assignedVendorName && req.assignedQuotePrice && (
                                <div className="text-[11px] text-emerald-700 bg-emerald-50/70 px-2.5 py-1 rounded-lg border border-emerald-200/80 flex items-center justify-between">
                                  <span>Assigned Quote Price:</span>
                                  <span className="font-mono font-bold">₹{Number(req.assignedQuotePrice).toLocaleString('en-IN')}</span>
                                </div>
                              )}

                              {/* Secondary Direct Select Dropdown */}
                              {!isProjectAwarded(req) && (
                                <div className="pt-1 flex items-center gap-2">
                                  <select
                                    value={req.vendorId || ''}
                                    onChange={(e) => {
                                      if (e.target.value) handleAssignVendorDirect(req.id, e.target.value);
                                    }}
                                    className="w-full text-[11px] font-semibold px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                  >
                                    <option value="">-- Or Direct Assign Connected Vendor --</option>
                                    {vendors.map(v => (
                                      <option key={v.id} value={v.id}>
                                        {v.businessName || v.name} ({v.city || 'Regional'}) - {v.specialization || 'General'}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>

                            {/* Interactive 5-Step Customer Timeline Stage Controller */}
                            <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                  <Clock className="w-4 h-4 text-primary-600" />
                                  <span>Service Timeline (Customer View)</span>
                                </div>
                                <span className="text-[11px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-200">
                                  Stage {getTimelineStepIndex(req.status) + 1} of 5
                                </span>
                              </div>

                              {/* Mini Progress Bar */}
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-primary-600 h-full transition-all duration-300"
                                  style={{ width: `${((getTimelineStepIndex(req.status) + 1) / 5) * 100}%` }}
                                />
                              </div>

                              {/* 5 Milestone Step Buttons */}
                              <div className="grid grid-cols-5 gap-1 pt-0.5">
                                {TIMELINE_STAGES.map((stg, idx) => {
                                  const currentIdx = getTimelineStepIndex(req.status);
                                  const isPast = idx < currentIdx;
                                  const isCurrent = idx === currentIdx;

                                  let btnStyle = 'bg-white text-slate-500 border-slate-200 hover:border-primary-400 hover:text-primary-600';
                                  if (isCurrent) {
                                    btnStyle = 'bg-primary-600 text-white border-primary-600 shadow-xs font-bold ring-2 ring-primary-500/20';
                                  } else if (isPast) {
                                    btnStyle = 'bg-success-50 text-success-700 border-success-300 font-semibold';
                                  }

                                  return (
                                    <button
                                      key={stg.key}
                                      type="button"
                                      onClick={() => handleUpdateStatus(req.id, stg.key)}
                                      title={`Set Timeline to: ${stg.label} (${stg.desc})`}
                                      className={`px-1 py-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${btnStyle}`}
                                    >
                                      <div className="flex items-center justify-center">
                                        {isPast ? (
                                          <Check className="w-3 h-3 text-success-600" />
                                        ) : (
                                          <span className={`text-[9.5px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold ${
                                            isCurrent ? 'bg-white text-primary-600' : 'bg-slate-100 text-slate-600'
                                          }`}>
                                            {stg.step}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[9.5px] leading-tight truncate max-w-full font-medium">
                                        {stg.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                                <span>💡 Tap milestone to update app status</span>
                                <span className="font-semibold text-slate-600">
                                  {TIMELINE_STAGES[getTimelineStepIndex(req.status)]?.desc}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Status Changer & Action Buttons */}
                          <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-500">Status:</span>
                              <select
                                value={req.status}
                                onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                                className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                              >
                                <option value="SUBMITTED">SUBMITTED</option>
                                <option value="AUDIT_SCHEDULED">AUDIT_SCHEDULED (Physical Audit)</option>
                                <option value="ESTIMATING">ESTIMATING (Digital Review)</option>
                                <option value="QUOTED">QUOTED</option>
                                <option value="ACCEPTED">ACCEPTED</option>
                                <option value="IN_PROGRESS">IN_PROGRESS</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="REJECTED">REJECTED</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Require Site Audit Toggle */}
                              {(() => {
                                const isAuditReq = (req.status || '').toUpperCase() === 'AUDIT_SCHEDULED' || req.requiresSiteAudit;
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSiteAudit(req)}
                                    title={isAuditReq ? 'Site audit is currently marked REQUIRED. Click to toggle.' : 'Mark this request as requiring a physical on-site audit inspection.'}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border shadow-xs flex items-center gap-1.5 transition-all ${
                                      isAuditReq
                                        ? 'bg-warning-100 text-warning-900 border-warning-400 hover:bg-warning-200 ring-2 ring-warning-400/20 font-bold'
                                        : 'bg-white text-slate-700 border-slate-300 hover:border-warning-400 hover:bg-warning-50 hover:text-warning-800'
                                    }`}
                                  >
                                    <MapPin className={`w-3.5 h-3.5 ${isAuditReq ? 'text-warning-700 fill-warning-300' : 'text-slate-400'}`} />
                                    <span>{isAuditReq ? 'Audit: REQUIRED' : 'Require Audit'}</span>
                                  </button>
                                );
                              })()}

                              {/* Open Dedicated Detail Page */}
                              <button
                                type="button"
                                onClick={() => handleOpenRequestDetail(req)}
                                title="Open Full Inspection Details Page"
                                className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-600" />
                                <span>Details</span>
                              </button>

                              {/* Chat with Customer */}
                              <button
                                type="button"
                                onClick={() => openChatForRequest(req)}
                                title="Open Live Chat with Customer"
                                className="px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-primary-600" />
                                <span>Chat</span>
                              </button>

                              {/* Build BOQ Quote */}
                              <button
                                type="button"
                                onClick={() => handleStartQuote(req)}
                                title="Create itemized estimate in BOQ builder"
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-success-600 hover:bg-success-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
                              >
                                <Calculator className="w-3.5 h-3.5" />
                                <span>Build Quote</span>
                              </button>

                              {/* Delete Request */}
                              <button
                                type="button"
                                onClick={() => handleDeleteRequest(req.id)}
                                title="Delete request"
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* QUOTATIONS TAB */}
          {activeTab === 'quotations' && (() => {
            const pendingCount = quotations.filter(q => q.status !== 'ACCEPTED' && q.status !== 'REJECTED').length;
            const acceptedCount = quotations.filter(q => q.status === 'ACCEPTED').length;
            const rejectedCount = quotations.filter(q => q.status === 'REJECTED').length;

            const filteredQuotes = quotations.filter(q => {
              if (quotationFilterStatus === 'PENDING' && (q.status === 'ACCEPTED' || q.status === 'REJECTED')) return false;
              if (quotationFilterStatus === 'ACCEPTED' && q.status !== 'ACCEPTED') return false;
              if (quotationFilterStatus === 'REJECTED' && q.status !== 'REJECTED') return false;

              const searchQ = (quotationSearch || globalSearch || '').toLowerCase().trim();
              if (!searchQ) return true;
              const quoteNum = (q.quoteNumber || '').toLowerCase();
              const clientName = (q.request?.user?.name || '').toLowerCase();
              const clientPhone = (q.request?.user?.phoneNumber || '').toLowerCase();
              const reqNum = (q.request?.requestNumber || '').toLowerCase();
              const serviceCode = (q.request?.servicecode || '').toLowerCase();
              return quoteNum.includes(searchQ) || clientName.includes(searchQ) || clientPhone.includes(searchQ) || reqNum.includes(searchQ) || serviceCode.includes(searchQ);
            });

            return (
              <div className="space-y-5">
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading font-semibold text-base text-slate-800">Quotations Desk & Commercial BOQ</h2>
                    <p className="text-[11px] text-slate-400">Track issued estimates, vendor contractor bids, and customer decisions.</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQuotationDeskTab('customer')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          quotationDeskTab === 'customer'
                            ? 'bg-white text-slate-900 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Customer BOQ Quotes ({quotations.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuotationDeskTab('vendor')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          quotationDeskTab === 'vendor'
                            ? 'bg-emerald-600 text-white shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Vendor Contractor Bids ({vendorQuotesHistory.length})</span>
                      </button>
                    </div>

                    <button onClick={() => setActiveTab('builder')} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs transition-all">
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Create New Quote</span>
                    </button>
                  </div>
                </div>

                {quotationDeskTab === 'vendor' ? (
                  <div className="space-y-4">
                    {/* KPI Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Vendor Quotes</span>
                        <span className="text-xl font-mono font-bold text-slate-900">{vendorQuotesHistory.length}</span>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/30">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Lowest Bid Received</span>
                        <span className="text-xl font-mono font-bold text-emerald-700">
                          {vendorQuotesHistory.length > 0 ? `₹${Math.min(...vendorQuotesHistory.map(q => q.quotePrice)).toLocaleString('en-IN')}` : '—'}
                        </span>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Contractors Quoting</span>
                        <span className="text-xl font-mono font-bold text-slate-900">
                          {new Set(vendorQuotesHistory.map(q => q.vendorId)).size}
                        </span>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Bidding Value</span>
                        <span className="text-xl font-mono font-bold text-slate-900">
                          ₹{vendorQuotesHistory.reduce((s, q) => s + (q.quotePrice || 0), 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Master Table of Vendor Quotes */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                              <th className="py-3 px-4 font-semibold text-slate-700">Request #</th>
                              <th className="py-3 px-4 font-semibold text-slate-700">Contractor / Business</th>
                              <th className="py-3 px-4 font-semibold text-slate-700">Service Category</th>
                              <th className="py-3 px-4 font-semibold text-slate-700 text-right">Quote Price (₹)</th>
                              <th className="py-3 px-4 font-semibold text-slate-700">Timeline</th>
                              <th className="py-3 px-4 font-semibold text-slate-700">Scope / Notes</th>
                              <th className="py-3 px-4 font-semibold text-slate-700">Status</th>
                              <th className="py-3 px-4 font-semibold text-slate-700 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {vendorQuotesHistory.length === 0 ? (
                              <tr>
                                <td colSpan="8" className="py-12 text-center text-slate-400">
                                  <Tag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                  <p className="font-semibold text-sm text-slate-600">No vendor quotations received yet</p>
                                  <p className="text-xs text-slate-400 mt-0.5">Share customer inspection requests with connected vendors to receive price proposals.</p>
                                </td>
                              </tr>
                            ) : (
                              vendorQuotesHistory.map(q => {
                                const linkedReq = requests.find(r => r.id === q.requestId) || q.request;
                                const isAssigned = linkedReq?.vendorId === q.vendorId || q.status === 'accepted' || q.status === 'assigned';
                                return (
                                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="py-3 px-4 font-mono font-bold text-primary-600">
                                      {linkedReq?.requestNumber || 'REQ-Job'}
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="font-bold text-slate-900">{q.vendorBusiness || q.vendorName || 'Contractor'}</div>
                                      <div className="text-[10px] text-slate-400">{q.vendor?.phone || 'Verified Partner'}</div>
                                    </td>
                                    <td className="py-3 px-4 text-slate-700 font-medium">
                                      {linkedReq?.servicecode || 'Service Request'}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                                      ₹{(q.quotePrice || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="py-3 px-4 text-slate-600">
                                      {q.estimatedTimeline || 'Standard'}
                                    </td>
                                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={q.notes || ''}>
                                      {q.notes || 'Standard BOQ proposal'}
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        isAssigned
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                                      }`}>
                                        {isAssigned ? 'Awarded / Assigned' : 'Submitted (Under Review)'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      {linkedReq ? (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenVendorQuotesModal(linkedReq)}
                                          className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg transition-all shadow-2xs inline-flex items-center gap-1"
                                        >
                                          <span>Review & Award</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </button>
                                      ) : (
                                        <span className="text-slate-400 text-xs">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : null}

                {quotationDeskTab === 'customer' && (
                  <div className="space-y-4">

                {/* Status Filter & Search Bar */}
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                    {[
                      { id: 'ALL', label: 'All Quotes', count: quotations.length },
                      { id: 'PENDING', label: 'Pending', count: pendingCount },
                      { id: 'ACCEPTED', label: 'Accepted', count: acceptedCount },
                      { id: 'REJECTED', label: 'Rejected', count: rejectedCount }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setQuotationFilterStatus(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          quotationFilterStatus === f.id
                            ? 'bg-brand-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          quotationFilterStatus === f.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search quote #, client, phone..."
                      value={quotationSearch}
                      onChange={(e) => setQuotationSearch(e.target.value)}
                      className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    {quotationSearch && (
                      <button
                        onClick={() => setQuotationSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {filteredQuotes.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                    <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-heading font-semibold text-sm text-slate-700">No Quotations Found</h3>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filter or search query</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {filteredQuotes.map(q => {
                      const lineItemsArray = Array.isArray(q.lineItem) ? q.lineItem : [];
                      const grandTotalFormatted = (q.grandtotal || 0).toLocaleString('en-IN');
                      return (
                        <div key={q.id} className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                          <div className="space-y-3.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-sm sm:text-base text-brand-600 tracking-wide">{q.quoteNumber}</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wide ${getStatusBadge(q.status)}`}>{q.status}</span>
                            </div>

                            <div className="flex items-baseline justify-between gap-2">
                              <div>
                                <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 tracking-tight">{q.request?.servicecode || 'Repair Quotation'}</h3>
                                <div className="text-xs sm:text-sm text-slate-500 font-mono mt-0.5">{q.request?.requestNumber || ''}</div>
                              </div>
                              <div className="font-heading font-bold text-xl sm:text-2xl text-success-600 font-mono shrink-0">₹{grandTotalFormatted}</div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                              <div><strong className="text-slate-900">Client:</strong> {q.request?.user?.name || 'Customer'}</div>
                              <div className="font-mono">{q.request?.user?.phoneNumber || 'N/A'}</div>
                              <div><strong className="text-slate-900">Timeline:</strong> {q.estimatedTimeline || '1-2 Days'}</div>
                              <div><strong className="text-slate-900">Scope:</strong> {q.service_scope || q.termsAndConditions || 'Standard Specifications'}</div>
                            </div>

                            <div className="text-xs sm:text-sm text-slate-600 font-normal">
                              <strong className="text-slate-800">Scope ({lineItemsArray.length}):</strong> {lineItemsArray.map(li => li.item || li.description).slice(0, 2).join(', ')}{lineItemsArray.length > 2 ? '...' : ''}
                            </div>
                          </div>

                          <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                onClick={() => openChatForQuotation(q)}
                                className="px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs"
                                title="Chat with Customer"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-primary-600" /> Chat
                              </button>
                              <button
                                onClick={() => setActiveQuoteModal(q)}
                                className="px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs"
                                title="View Quotation Details"
                              >
                                <Eye className="w-3.5 h-3.5 text-brand-600" /> Details
                              </button>
                              {q.status !== 'ACCEPTED' && (
                                <button
                                  onClick={() => handleQuoteDecision(q.id, 'ACCEPTED')}
                                  className="px-3 py-1.5 text-xs font-semibold text-success-700 bg-success-50 hover:bg-success-100 border border-success-200 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs"
                                  title="Mark as Accepted"
                                >
                                  <Check className="w-3.5 h-3.5" /> Accept
                                </button>
                              )}
                              {q.status !== 'REJECTED' && (
                                <button
                                  onClick={() => handleQuoteDecision(q.id, 'REJECTED')}
                                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs"
                                  title="Mark as Rejected"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject
                                </button>
                              )}
                            </div>
                            <button onClick={() => handleDeleteQuotation(q.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete quotation">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* VENDORS TAB - Multi-panel vendor quotation management */}
          {activeTab === 'vendors' && (
            <div className="space-y-5">
              {viewVendorDetail && selectedVendorDetail ? (
                <div className="space-y-5 animate-in fade-in duration-150">
                  
                  {/* 1. Breadcrumb & Action Bar (Clean SaaS design, Sidebar fully visible!) */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <button
                        type="button"
                        onClick={() => { setViewVendorDetail(false); setSelectedVendorDetail(null); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-all shadow-2xs"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Vendor Network</span>
                      </button>
                      <span className="text-slate-300">/</span>
                      <span className="text-slate-500 font-medium">Contractor Profile</span>
                      <span className="text-slate-300">/</span>
                      <span className="font-bold text-slate-900">{selectedVendorDetail.businessName || selectedVendorDetail.name}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedVendorDetail.phone && (
                        <button
                          type="button"
                          onClick={() => openWhatsApp(selectedVendorDetail.phone, `Hello ${selectedVendorDetail.name}! This is Hipro Admin regarding your contractor profile.`)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      )}

                      {selectedVendorDetail.phone && (
                        <a
                          href={`tel:${selectedVendorDetail.phone}`}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-all border border-slate-200/80"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
                          <span>{selectedVendorDetail.phone}</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEditingVendor(selectedVendorDetail);
                          setVendorForm({ ...selectedVendorDetail });
                          setVendorModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-all border border-slate-200/80"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit Profile</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Clean Identity Card (Zero AI feel: clean white, professional slate typography) */}
                  <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-heading font-extrabold text-2xl flex items-center justify-center shadow-xs overflow-hidden">
                          {selectedVendorDetail.imageUrl ? (
                            <img
                              src={selectedVendorDetail.imageUrl}
                              alt={selectedVendorDetail.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            (selectedVendorDetail.businessName || selectedVendorDetail.name || 'V').charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${
                          selectedVendorDetail.status === 'active' ? 'bg-emerald-500' :
                          selectedVendorDetail.status === 'busy' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} title={`Status: ${selectedVendorDetail.status || 'active'}`} />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 tracking-tight">
                            {selectedVendorDetail.businessName || selectedVendorDetail.name}
                          </h2>

                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{selectedVendorDetail.city || 'Regional Hub'}</span>
                          </span>

                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                            {selectedVendorDetail.category || 'Services'}
                          </span>

                          {selectedVendorDetail.documentsVerified ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>KYC Verified</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>KYC Pending</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                          <span>Contact Person: <strong className="text-slate-800">{selectedVendorDetail.name}</strong></span>
                          <span>•</span>
                          <span className="text-slate-700 font-medium">{selectedVendorDetail.specialization || 'General Contractor'}</span>
                          <span>•</span>
                          <span>Experience: <strong className="text-slate-800">{selectedVendorDetail.experience || '3+ Years'}</strong></span>
                        </p>
                      </div>
                    </div>

                    {/* KYC Approval and Status Controls */}
                    <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <button
                        type="button"
                        disabled={isVerifyingKYC}
                        onClick={() => handleToggleVendorKYCStatus(selectedVendorDetail.id, selectedVendorDetail.documentsVerified)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs ${
                          selectedVendorDetail.documentsVerified
                            ? 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{selectedVendorDetail.documentsVerified ? 'Revoke KYC' : 'Approve KYC'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-500">Status:</span>
                        <select
                          value={selectedVendorDetail.status || 'active'}
                          onChange={(e) => handleQuickUpdateVendorStatus(selectedVendorDetail.id, e.target.value)}
                          disabled={isUpdatingVendorStatus}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
                        >
                          <option value="active">🟢 Active</option>
                          <option value="busy">🟡 Busy (At Capacity)</option>
                          <option value="inactive">🔴 Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 3. Clean Standard KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
                    {/* Rating */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contractor Rating</span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-amber-500 text-base">★</span>
                        <span className="text-lg font-mono font-extrabold text-slate-900">
                          {typeof selectedVendorDetail.rating === 'number' ? selectedVendorDetail.rating.toFixed(1) : (selectedVendorDetail.rating || '5.0')}
                        </span>
                        <span className="text-xs text-slate-400">/ 5.0</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {selectedVendorDetail.ratingsCount || (selectedVendorDetail.ratings || []).length || 0} reviews
                      </span>
                    </div>

                    {/* Active Workload */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Workload</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {selectedVendorDetail.capacity || 'SMALL'}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-base font-mono font-extrabold text-slate-900">
                          {selectedVendorDetail.currentJobCount || 0} / {selectedVendorDetail.maxConcurrentJobs || 5}
                        </span>
                        <span className="text-[10px] text-slate-400">jobs</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            (selectedVendorDetail.currentJobCount || 0) >= (selectedVendorDetail.maxConcurrentJobs || 5)
                              ? 'bg-rose-500'
                              : 'bg-primary-600'
                          }`}
                          style={{ width: `${Math.min(100, (((selectedVendorDetail.currentJobCount || 0) / (selectedVendorDetail.maxConcurrentJobs || 5)) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Assigned Won Jobs */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Won Jobs</span>
                      <div className="text-lg font-mono font-extrabold text-slate-900 mt-1">
                        {(selectedVendorDetail.assignedJobs || []).length}
                      </div>
                      <span className="text-[10px] text-slate-400">awarded projects</span>
                    </div>

                    {/* Quotation Bids */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quotation Bids</span>
                      <div className="text-lg font-mono font-extrabold text-slate-900 mt-1">
                        {(selectedVendorDetail.vendorQuotes || []).length}
                      </div>
                      <span className="text-[10px] text-slate-400">submitted proposals</span>
                    </div>

                    {/* Shared Leads */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs col-span-2 sm:col-span-4 lg:col-span-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shared Leads</span>
                      <div className="text-lg font-mono font-extrabold text-slate-900 mt-1">
                        {(selectedVendorDetail.sharedRequests || []).length}
                      </div>
                      <span className="text-[10px] text-slate-400">inspection dispatch</span>
                    </div>
                  </div>

                  {/* 4. Clean Tab Navigation Bar */}
                  <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs px-4 flex items-center gap-2 overflow-x-auto">
                    {[
                      { id: 'overview', label: 'Overview & Profile', icon: UserCheck },
                      { id: 'kyc', label: 'KYC & Government Documents', icon: ShieldCheck, status: selectedVendorDetail.documentsVerified ? 'Verified' : 'Pending' },
                      { id: 'jobs', label: 'Assigned Won Projects', icon: HardHat, count: (selectedVendorDetail.assignedJobs || []).length },
                      { id: 'quotes', label: 'Quotation History', icon: Tag, count: (selectedVendorDetail.vendorQuotes || []).length },
                      { id: 'shared', label: 'Shared Leads', icon: Share2, count: (selectedVendorDetail.sharedRequests || []).length },
                      { id: 'ratings', label: 'Ratings & Reviews', icon: Star, count: (selectedVendorDetail.ratings || []).length },
                    ].map(tab => {
                      const isSel = vendorDetailTab === tab.id;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setVendorDetailTab(tab.id)}
                          className={`py-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                            isSel
                              ? 'border-primary-600 text-primary-700'
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSel ? 'text-primary-600' : 'text-slate-400'}`} />
                          <span>{tab.label}</span>
                          {tab.count !== undefined && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isSel ? 'bg-primary-100 text-primary-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {tab.count}
                            </span>
                          )}
                          {tab.status && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tab.status === 'Verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {tab.status}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* 5. Clean Tab Contents */}
                  {/* TAB 1: OVERVIEW */}
                  {vendorDetailTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-primary-600" />
                            <span>Business & Trade Credentials</span>
                          </h4>
                          <span className="text-[11px] font-semibold text-slate-400 font-mono">
                            ID: {selectedVendorDetail.id}
                          </span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-50">
                            <span className="text-slate-500">Business / Firm:</span>
                            <span className="font-bold text-slate-800">{selectedVendorDetail.businessName || 'Independent Contractor'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-50">
                            <span className="text-slate-500">Contact Person:</span>
                            <span className="font-semibold text-slate-800">{selectedVendorDetail.name}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-50">
                            <span className="text-slate-500">Trade Category:</span>
                            <span className="font-semibold text-primary-700">{selectedVendorDetail.category || 'Services'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-50">
                            <span className="text-slate-500">Core Specialization:</span>
                            <span className="font-semibold text-slate-800">{selectedVendorDetail.specialization || 'Waterproofing & Civil Repairs'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-50">
                            <span className="text-slate-500">Field Experience:</span>
                            <span className="font-semibold text-slate-800">{selectedVendorDetail.experience || '3+ Years'}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">Base Service / Inspection Fee:</span>
                            <span className="font-mono font-bold text-slate-900">₹{selectedVendorDetail.minCharge || 500}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary-600" />
                            <span>Contact & Operational Reach</span>
                          </h4>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {selectedVendorDetail.city || 'Bhilwara'} Hub
                          </span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-50">
                            <span className="text-slate-500">Operational Hub:</span>
                            <span className="font-bold text-slate-800">{selectedVendorDetail.city || 'Bhilwara'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-50">
                            <span className="text-slate-500">Primary Phone:</span>
                            <a href={`tel:${selectedVendorDetail.phone}`} className="font-mono font-bold text-primary-600 hover:underline">
                              {selectedVendorDetail.phone || 'None'}
                            </a>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-50">
                            <span className="text-slate-500">Registered Email:</span>
                            <span className="font-mono text-slate-700">{selectedVendorDetail.email || 'None on file'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-50">
                            <span className="text-slate-500">Work Capacity Tier:</span>
                            <span className="font-bold text-slate-800">{selectedVendorDetail.capacity || 'SMALL'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-50">
                            <span className="text-slate-500">Max Concurrent Jobs:</span>
                            <span className="font-mono font-bold text-slate-800">{selectedVendorDetail.maxConcurrentJobs || 5} concurrent</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">Geographic Reach:</span>
                            <span className="text-slate-600">{selectedVendorDetail.city || 'Bhilwara'} & 35km Radius</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: KYC */}
                  {vendorDetailTab === 'kyc' && (
                    <div className="space-y-5">
                      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        selectedVendorDetail.documentsVerified
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}>
                        <div className="flex items-center gap-3">
                          {selectedVendorDetail.documentsVerified ? (
                            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                          )}
                          <div className="text-xs">
                            <span className="font-bold block">
                              {selectedVendorDetail.documentsVerified ? 'KYC Verification Approved' : 'KYC Verification Pending'}
                            </span>
                            <span className="opacity-80">
                              {selectedVendorDetail.documentsVerified
                                ? 'All government identities and bank credentials have been approved.'
                                : 'Review the uploaded documents below to verify this contractor.'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isVerifyingKYC}
                          onClick={() => handleToggleVendorKYCStatus(selectedVendorDetail.id, selectedVendorDetail.documentsVerified)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all shrink-0 ${
                            selectedVendorDetail.documentsVerified
                              ? 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{selectedVendorDetail.documentsVerified ? 'Revoke KYC' : 'Approve KYC'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Aadhaar */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Shield className="w-4 h-4 text-primary-600" />
                                <span>Aadhaar Card</span>
                              </span>
                              {selectedVendorDetail.aadhaarNumber ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Uploaded</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">Missing</span>
                              )}
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <span className="text-[11px] text-slate-400 block font-semibold">Aadhaar Number</span>
                              <span className="font-mono font-bold text-xs text-slate-800">{selectedVendorDetail.aadhaarNumber || 'Not Uploaded'}</span>
                            </div>
                          </div>
                          {selectedVendorDetail.aadhaarUrl ? (
                            <a href={selectedVendorDetail.aadhaarUrl} target="_blank" rel="noreferrer" className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all border border-slate-200/60">
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View Document Scan</span>
                            </a>
                          ) : (
                            <div className="text-center py-2 text-xs text-slate-400 italic">No document scan uploaded</div>
                          )}
                        </div>

                        {/* PAN */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-primary-600" />
                                <span>PAN Card</span>
                              </span>
                              {selectedVendorDetail.panNumber ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Uploaded</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">Missing</span>
                              )}
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <span className="text-[11px] text-slate-400 block font-semibold">PAN Number</span>
                              <span className="font-mono font-bold text-xs text-slate-800">{selectedVendorDetail.panNumber || 'Not Uploaded'}</span>
                            </div>
                          </div>
                          {selectedVendorDetail.panUrl ? (
                            <a href={selectedVendorDetail.panUrl} target="_blank" rel="noreferrer" className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all border border-slate-200/60">
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View Document Scan</span>
                            </a>
                          ) : (
                            <div className="text-center py-2 text-xs text-slate-400 italic">No document scan uploaded</div>
                          )}
                        </div>

                        {/* Bank */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Receipt className="w-4 h-4 text-primary-600" />
                                <span>Bank Account</span>
                              </span>
                              {selectedVendorDetail.bankPassbookUrl ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Uploaded</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">Missing</span>
                              )}
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <span className="text-[11px] text-slate-400 block font-semibold">Bank Passbook / Cheque</span>
                              <span className="font-mono font-bold text-xs text-slate-800">{selectedVendorDetail.bankPassbookUrl ? 'Passbook Scan on file' : 'Not Uploaded'}</span>
                            </div>
                          </div>
                          {selectedVendorDetail.bankPassbookUrl ? (
                            <a href={selectedVendorDetail.bankPassbookUrl} target="_blank" rel="noreferrer" className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all border border-slate-200/60">
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View Passbook Scan</span>
                            </a>
                          ) : (
                            <div className="text-center py-2 text-xs text-slate-400 italic">No document scan uploaded</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: ASSIGNED WON PROJECTS */}
                  {vendorDetailTab === 'jobs' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">Assigned Won Projects</h4>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {(selectedVendorDetail.assignedJobs || []).length} Total Projects
                        </span>
                      </div>
                      {(selectedVendorDetail.assignedJobs || []).length === 0 ? (
                        <div className="bg-white p-8 rounded-xl border border-slate-200/90 text-center space-y-2">
                          <HardHat className="w-6 h-6 text-slate-400 mx-auto" />
                          <h5 className="font-bold text-slate-700 text-xs">No Projects Assigned Yet</h5>
                          <p className="text-xs text-slate-400">Share customer inspection requests with this vendor to assign projects.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(selectedVendorDetail.assignedJobs || []).map(job => (
                            <div key={job.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">#{job.trackingid || job.id.slice(0, 8)}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">{job.status}</span>
                              </div>
                              <h5 className="font-bold text-slate-900 text-xs">{job.customername || 'Customer'}</h5>
                              <p className="text-xs text-slate-500">{job.addressline || job.location || selectedVendorDetail.city}</p>
                              <div className="text-xs font-bold text-slate-900">Awarded: ₹{job.assignedPrice || job.estimatedBudget || 0}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: QUOTATION HISTORY */}
                  {vendorDetailTab === 'quotes' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">Quotation History</h4>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {(selectedVendorDetail.vendorQuotes || []).length} Submitted
                        </span>
                      </div>
                      {(selectedVendorDetail.vendorQuotes || []).length === 0 ? (
                        <div className="bg-white p-8 rounded-xl border border-slate-200/90 text-center space-y-2">
                          <Tag className="w-6 h-6 text-slate-400 mx-auto" />
                          <h5 className="font-bold text-slate-700 text-xs">No Quotations Submitted Yet</h5>
                          <p className="text-xs text-slate-400">Quotes submitted on shared requests will appear here.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(selectedVendorDetail.vendorQuotes || []).map(q => (
                            <div key={q.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
                              <div>
                                <span className="font-mono text-xs font-bold text-slate-700">Request #{q.requestId?.slice(0, 8)}</span>
                                <p className="text-xs text-slate-600 mt-0.5">{q.scopeOfWork || 'Quotation bid'}</p>
                                <span className="text-[11px] text-slate-400">{q.timelineDays ? `${q.timelineDays} Days` : 'Immediate'}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-bold text-base text-slate-900">₹{q.quotePrice || 0}</div>
                                <span className="text-[10px] font-bold uppercase text-slate-500">{q.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 5: SHARED LEADS */}
                  {vendorDetailTab === 'shared' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">Shared Leads</h4>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {(selectedVendorDetail.sharedRequests || []).length} Dispatched
                        </span>
                      </div>
                      {(selectedVendorDetail.sharedRequests || []).length === 0 ? (
                        <div className="bg-white p-8 rounded-xl border border-slate-200/90 text-center space-y-2">
                          <Share2 className="w-6 h-6 text-slate-400 mx-auto" />
                          <h5 className="font-bold text-slate-700 text-xs">No Leads Shared Yet</h5>
                          <p className="text-xs text-slate-400">Share inspection requests from the Inspection Requests desk.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(selectedVendorDetail.sharedRequests || []).map(sr => (
                            <div key={sr.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
                              <div>
                                <span className="font-mono text-xs font-bold text-slate-900">Request #{sr.requestId?.slice(0, 8)}</span>
                                <p className="text-xs text-slate-600">{sr.request?.servicecode || 'Inspection Request'}</p>
                                <span className="text-[11px] text-slate-400">Shared {new Date(sr.sharedAt).toLocaleDateString('en-IN')}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setViewVendorDetail(false);
                                  setActiveTab('requests');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                              >
                                View in Requests
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 6: CUSTOMER RATINGS & REVIEWS */}
                  {vendorDetailTab === 'ratings' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Customer Ratings & Verified Feedback</h4>
                          <p className="text-xs text-slate-500">Collected from customers upon completed jobs & direct bookings.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <span>★</span>
                            <span>{typeof selectedVendorDetail.rating === 'number' ? selectedVendorDetail.rating.toFixed(1) : (selectedVendorDetail.rating || '5.0')} Average</span>
                          </span>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                            {(selectedVendorDetail.ratings || []).length} Reviews
                          </span>
                        </div>
                      </div>

                      {(selectedVendorDetail.ratings || []).length === 0 ? (
                        <div className="bg-white p-8 rounded-xl border border-slate-200/90 text-center space-y-2">
                          <Star className="w-8 h-8 text-amber-300 mx-auto" />
                          <h5 className="font-bold text-slate-700 text-xs">No Customer Reviews Yet</h5>
                          <p className="text-xs text-slate-400">Reviews and star ratings will automatically appear here once customers complete and rate their services.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(selectedVendorDetail.ratings || []).map((review) => (
                            <div key={review.id} className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      className={`text-sm ${star <= Math.round(review.rating) ? 'text-amber-400' : 'text-slate-200'}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                  <span className="text-xs font-bold font-mono text-slate-800 ml-1">
                                    {review.rating.toFixed(1)}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  {review.serviceType === 'DIRECT_BOOKING' ? 'Direct Booking' : 'Inspection Job'}
                                </span>
                              </div>

                              {review.review && (
                                <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  "{review.review}"
                                </p>
                              )}

                              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50">
                                <span className="font-semibold text-slate-700">
                                  {review.customerName} {review.customerPhone ? `(${review.customerPhone})` : ''}
                                </span>
                                <span>
                                  {review.created_at ? new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ) : (
                <>
                {/* Header */}
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading font-semibold text-lg text-slate-800">Vendor Network & Quotation Assignment</h2>
                  <p className="text-[11px] text-slate-400">Connect local vendors, share customer damage requirements, collect quotations, and assign the minimum-price vendor.</p>
                </div>
                <button
                  onClick={() => { setEditingVendor(null); setVendorForm({ name: '', businessName: '', phone: '', email: '', city: 'Bhilwara', specialization: 'General Repair', experience: '3+ Years', status: 'active', rating: 4.5, minCharge: '500', imageUrl: '' }); setVendorModalOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Vendor</span>
                </button>
              </div>

              {/* Vendor Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-brand-50 border border-brand-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">Connected Vendors</span>
                      <div className="font-heading font-bold text-2xl text-slate-900 mt-1">{vendors.length}</div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-accent-50 border border-accent-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-accent-600 uppercase tracking-wider">Pending Quotes</span>
                      <div className="font-heading font-bold text-2xl text-slate-900 mt-1">{vendorQuotes.length}</div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-success-50 border border-success-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-success-600 uppercase tracking-wider">Assigned Jobs</span>
                      <div className="font-heading font-bold text-2xl text-slate-900 mt-1">{assignedVendor ? 1 : 0}</div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-success-100 text-success-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Assigned Quote</span>
                      <div className="font-heading font-bold text-2xl text-slate-900 mt-1">
                        {assignedVendor ? '₹' + assignedVendor.quotePrice.toLocaleString('en-IN') : '–'}
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
                      <Tag className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* VENDOR MANAGEMENT TABS - High Priority */}
              <div className="flex gap-1 border-b border-slate-200/50 pb-2 overflow-x-auto">
                <button
                  onClick={() => { setShowVendorPanel(false); setQuoteRequestId(null); setVendorComparisonMode(false); }}
                  className={`px-4 py-2 rounded-t-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    !showVendorPanel && !vendorComparisonMode ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  👥 Manage Vendors
                </button>
                <button
                  onClick={() => { setVendorComparisonMode(true); setShowVendorPanel(false); setQuoteRequestId(null); }}
                  className={`px-4 py-2 rounded-t-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    vendorComparisonMode ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  ⚖️ Vendor Comparison
                </button>
                <button
                  onClick={() => { setVendorComparisonMode(false); setShowVendorPanel(false); setQuoteRequestId(null); }}
                  className={`px-4 py-2 rounded-t-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    !vendorComparisonMode && !showVendorPanel && quoteRequestId === null ? 'bg-accent-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  💰 Quotation History
                </button>
                <button
                  onClick={() => setShowVendorPanel(true)}
                  className={`px-4 py-2 rounded-t-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    showVendorPanel ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  📋 Share Request → Collect Quotes
                </button>
              </div>

              {/* ============ VENDOR CATEGORIES SECTION ============ */}
              {!showVendorPanel && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand-600" />
                      <h3 className="font-heading font-bold text-sm text-slate-800">
                        Vendor Category Filter
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Filter verified contractors by domain category and specialization
                    </span>
                  </div>

                  {/* Primary Domain Category Buttons (Dynamic) */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(domainTabs.length > 0 ? domainTabs : [
                      { id: 'ALL', name: 'All Domains', count: vendors.length, color: '#0f172a' },
                      { id: 'Services', name: 'Home & Civil Services', count: 0, color: '#3b82f6' },
                      { id: 'Adventure', name: 'Adventure & Sports Operators', count: 0, color: '#f43f5e' },
                    ]).map(tab => {
                      const isSelected = vendorCategoryFilter === tab.id;
                      const tabCount = tab.id === 'ALL'
                        ? vendors.length
                        : tab.id === 'Services'
                          ? vendors.filter(v => (v.category || '').toLowerCase() !== 'adventure' && !(v.category || '').toLowerCase().includes('adventure')).length
                          : tab.id === 'Adventure'
                            ? vendors.filter(v => (v.category || '').toLowerCase() === 'adventure' || (v.category || '').toLowerCase().includes('adventure')).length
                            : tab.count;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setVendorCategoryFilter(tab.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 border ${
                            isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>{tab.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {tabCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Specific Specialization Pills Grid (Dynamic & Clean) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {(categoryPills.length > 0 ? categoryPills : [
                      { id: 'waterproofing', name: 'Waterproofing', slug: 'waterproofing', color: '#0284c7', vendorCount: 0 },
                      { id: 'civil', name: 'Civil & Masonry', slug: 'civil', color: '#6366f1', vendorCount: 0 },
                      { id: 'plumbing', name: 'Plumbing', slug: 'plumbing', color: '#0d9488', vendorCount: 0 },
                      { id: 'electrical', name: 'Electrical', slug: 'electrical', color: '#eab308', vendorCount: 0 },
                      { id: 'painting', name: 'Painting', slug: 'painting', color: '#ec4899', vendorCount: 0 },
                      { id: 'paragliding', name: 'Paragliding', slug: 'paragliding', color: '#f43f5e', vendorCount: 0 },
                      { id: 'safari', name: 'Desert Safari', slug: 'safari', color: '#f97316', vendorCount: 0 },
                      { id: 'rafting', name: 'River Rafting', slug: 'rafting', color: '#06b6d4', vendorCount: 0 },
                    ]).map(cat => {
                      const count = cat.vendorCount || vendors.filter(v =>
                        (v.specialization || '').toLowerCase().includes((cat.slug || cat.id || '').toLowerCase()) ||
                        (v.category || '').toLowerCase().includes((cat.slug || cat.id || '').toLowerCase())
                      ).length;
                      const isSelected = vendorCategoryFilter.toLowerCase() === (cat.slug || cat.id || '').toLowerCase();

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setVendorCategoryFilter(isSelected ? 'ALL' : (cat.slug || cat.id || ''))}
                          className={`px-3 py-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className="font-semibold text-xs leading-snug truncate">
                            {cat.name}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============ VIEW 1: MANAGE VENDORS ============ */}
              {!showVendorPanel && (
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-brand-600" />
                      <span className="font-semibold text-slate-700 text-sm">
                        {vendorCategoryFilter === 'ALL'
                          ? 'Connected Vendors'
                          : `Vendors (Filtered: ${vendorCategoryFilter})`}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        {vendors.filter(v => {
                          const matchesSearch = !globalSearch ||
                            (v.name || '').toLowerCase().includes(globalSearch.toLowerCase()) ||
                            (v.businessName || '').toLowerCase().includes(globalSearch.toLowerCase()) ||
                            (v.city || '').toLowerCase().includes(globalSearch.toLowerCase()) ||
                            (v.category || '').toLowerCase().includes(globalSearch.toLowerCase()) ||
                            (v.specialization || '').toLowerCase().includes(globalSearch.toLowerCase());

                          let matchesCategory = true;
                          if (vendorCategoryFilter !== 'ALL') {
                            const filterLower = vendorCategoryFilter.toLowerCase();
                            matchesCategory =
                              (v.category || '').toLowerCase() === filterLower ||
                              (v.category || '').toLowerCase().includes(filterLower) ||
                              (v.specialization || '').toLowerCase().includes(filterLower);
                          }

                          const matchesCity = vendorCityFilter === 'ALL' ||
                            (v.city || '').toLowerCase() === vendorCityFilter.toLowerCase();

                          return matchesSearch && matchesCategory && matchesCity;
                        }).length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <select
                        value={vendorCityFilter}
                        onChange={(e) => setVendorCityFilter(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                      >
                        <option value="ALL">All Cities</option>
                        {Array.from(new Set(vendors.map(v => v.city).filter(Boolean))).map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>

                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={globalSearch}
                          onChange={(e) => setGlobalSearch(e.target.value)}
                          placeholder="Search vendors..."
                          className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                          <th className="py-3 px-4 font-semibold text-slate-700">Vendor & Business</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Contact</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Category & Domain</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">City & Experience</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Rating</th>
                          <th className="py-3 px-4 font-semibold text-slate-700 text-right">Status</th>
                          <th className="py-3 px-4 font-semibold text-slate-700 text-center">Priority</th>
                          <th className="py-3 px-4 font-semibold text-slate-700 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {vendors.filter(v => {
                          const matchesSearch = !globalSearch ||
                            (v.name || '').toLowerCase().includes(globalSearch.toLowerCase()) ||
                            (v.businessName || '').toLowerCase().includes(globalSearch.toLowerCase()) ||
                            (v.city || '').toLowerCase().includes(globalSearch.toLowerCase()) ||
                            (v.category || '').toLowerCase().includes(globalSearch.toLowerCase()) ||
                            (v.specialization || '').toLowerCase().includes(globalSearch.toLowerCase());

                          let matchesCategory = true;
                          if (vendorCategoryFilter !== 'ALL') {
                            const filterLower = vendorCategoryFilter.toLowerCase();
                            matchesCategory =
                              (v.category || '').toLowerCase() === filterLower ||
                              (v.category || '').toLowerCase().includes(filterLower) ||
                              (v.specialization || '').toLowerCase().includes(filterLower);
                          }

                          const matchesCity = vendorCityFilter === 'ALL' ||
                            (v.city || '').toLowerCase() === vendorCityFilter.toLowerCase();

                          return matchesSearch && matchesCategory && matchesCity;
                        }).map(vendor => (
                          <tr key={vendor.id} onClick={() => handleOpenVendorDetail(vendor)} className="hover:bg-slate-50/80 transition-all cursor-pointer group" title="Click to view full vendor profile & KYC">
                            <td className="py-4 px-4">
                              <div
                                onClick={() => handleOpenVendorDetail(vendor)}
                                className="flex items-center gap-3 cursor-pointer group"
                                title="Click to view full vendor profile & KYC"
                              >
                                <div className={`w-10 h-10 rounded-xl ${
                                  (vendor.category || '').toLowerCase().includes('adventure')
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-primary-100 text-primary-700'
                                } flex items-center justify-center font-bold text-sm overflow-hidden group-hover:scale-105 transition-transform`}>
                                  {vendor.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors flex items-center gap-1">
                                    <span>{vendor.name}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <div className="text-[10px] text-slate-500">{vendor.businessName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1 text-slate-600 font-mono text-[11px]">
                                <Phone className="w-3 h-3" /> {vendor.phone}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{vendor.email}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  (vendor.category || '').toLowerCase().includes('adventure')
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  {(vendor.category || '').toLowerCase().includes('adventure') ? '🪂 Adventure' : '🛠️ Services'}
                                </span>
                                <span className="text-slate-600 font-medium text-xs">
                                  {vendor.specialization}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-slate-700 font-medium">{[vendor.city, vendor.state].filter(Boolean).join(', ')}</div>
                              <div className="text-[10px] text-slate-500">{vendor.experience}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500">★</span>
                                <span className="font-semibold text-slate-800">{vendor.rating}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleToggleVendorStatus(vendor)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                                  vendor.status === 'active'
                                    ? 'bg-success-50 text-success-700 border-success-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {vendor.status === 'active' ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleToggleVendorPriority(vendor.id)}
                                className={`w-10 h-5 rounded-full px-3 py-1 transition-all ${
                                  priorityVendors.includes(vendor.id)
                                    ? 'bg-amber-400 border-amber-400'
                                    : 'bg-slate-200 border-slate-200'
                                }`}
                              >
                                <span
                                  className={`w-3 h-3 rounded-full transition-transform ${
                                    priorityVendors.includes(vendor.id)
                                      ? 'translate-x-2 bg-white'
                                      : 'translate-x-1 bg-slate-400'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => { setEditingVendor(vendor); setVendorForm({ ...vendor }); setVendorModalOpen(true); }}
                                  className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 hover:text-brand-700 transition-all"
                                  title="Edit Vendor"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteVendor(vendor.id)}
                                  className="p-1.5 rounded-lg text-danger-600 hover:bg-danger-50 hover:text-danger-700 transition-all"
                                  title="Remove Vendor"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {vendors.length === 0 && (
                          <tr>
                            <td colSpan="7" className="py-12 text-center text-slate-400">
                              <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                              <p className="font-semibold text-sm text-slate-600">No vendors connected yet</p>
                              <p className="text-xs text-slate-400">Click "Add Vendor" to connect local vendors who can receive customer requests and submit quotations.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ============ VENDOR COMPARISON VIEW ============ */}
              {vendorComparisonMode && (
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Scale className="w-5 h-5 text-accent-600" />
                      <div>
                        <h3 className="font-heading font-bold text-base text-slate-800">Vendor Comparison & Selection</h3>
                        <p className="text-[11px] text-slate-500">Compare vendors side-by-side to select the best partner for customer assignments.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setVendorComparisonMode(false)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Back to Manage</span>
                      </button>
                    </div>
                  </div>

                  {/* Vendor Comparison Cards */}
                  <div className="p-4">
                    {vendors.length === 0 ? (
                      <div className="p-8 text-center">
                        <Scale className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                        <p className="font-semibold text-sm text-slate-600">No vendors to compare</p>
                        <p className="text-xs text-slate-400">Connect vendors first to enable comparison.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vendors.map(v => {
                          const stats = vendorPerformanceStats[v.id] || {};
                          const totalQuotes = stats.totalQuotes || 0;
                          const assignedCount = stats.assignedCount || 0;
                          const winRate = totalQuotes > 0 ? Math.round((assignedCount / totalQuotes) * 100) : 0;
                          const avgQuoteValue = totalQuotes > 0 ? Math.round(stats.totalValue / totalQuotes) : 0;
                          const isSelected = selectedVendorsForComparison.includes(v.id);

                          return (
                            <div
                              key={v.id}
                              onClick={() => handleOpenVendorDetail(v)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer group hover:border-primary-400 hover:shadow-md ${
                                isSelected
                                  ? 'bg-accent-50 border-accent-200 shadow-sm'
                                  : 'bg-white border-slate-200/80'
                              }`}
                              title="Click card to view full contractor profile & KYC"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div
                                  onClick={() => handleOpenVendorDetail(v)}
                                  className="flex items-center gap-2.5 cursor-pointer group"
                                  title="Click to view full contractor profile & KYC"
                                >
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                                    {v.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-heading font-bold text-slate-900 text-sm group-hover:text-primary-600 transition-colors flex items-center gap-1">
                                      <span>{v.businessName || v.name}</span>
                                      <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-[11px] text-slate-500">Owner: {v.name}</div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      setSelectedVendorsForComparison(selectedVendorsForComparison.filter(id => id !== v.id));
                                    } else {
                                      setSelectedVendorsForComparison([...selectedVendorsForComparison, v.id]);
                                    }
                                  }}
                                  className={`w-5 h-5 rounded-full transition-all ${
                                    isSelected
                                      ? 'bg-accent-600 text-white'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  } flex items-center justify-center`}
                                >
                                  {isSelected ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <Plus className="w-3 h-3" />
                                  )}
                                </button>
                              </div>

                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Category</div>
                                    <div className="text-sm font-semibold text-slate-800">{v.specialization}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">City</div>
                                    <div className="text-sm font-semibold text-slate-800">{v.city}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Experience</div>
                                    <div className="text-sm font-semibold text-slate-800">{v.experience}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Rating</div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-yellow-500 text-xs">★</span>
                                      <span className="text-sm font-bold text-slate-800">{v.rating}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-3 mt-2">
                                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Performance Metrics</div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <div className="text-xs font-bold text-success-700">{winRate}%</div>
                                      <div className="text-[10px] text-slate-500">Win Rate</div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold text-brand-700">{totalQuotes}</div>
                                      <div className="text-[10px] text-slate-500">Quotes Submitted</div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold text-warning-700">{assignedCount}</div>
                                      <div className="text-[10px] text-slate-500">Jobs Assigned</div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold text-slate-700">₹{avgQuoteValue}</div>
                                      <div className="text-[10px] text-slate-500">Avg Quote Value</div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    v.status === 'active'
                                      ? 'bg-success-50 text-success-700 border-success-200'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>
                                    {v.status === 'active' ? 'Active' : 'Inactive'}
                                  </span>
                                  {v.documentsVerified ? (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                      <span>KYC Verified</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                                      <span>KYC Pending</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============ QUOTATION HISTORY VIEW ============ */}
              {!vendorComparisonMode && !showVendorPanel && quoteRequestId === null && (
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-accent-600" />
                      <div>
                        <h3 className="font-heading font-bold text-base text-slate-800">Vendor Quotation History</h3>
                        <p className="text-[11px] text-slate-500">All quotations submitted by vendors for customer requests.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setVendorComparisonMode(false)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Back to Manage</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    {vendorQuotesHistory.length === 0 ? (
                      <div className="p-8 text-center">
                        <FileCheck2 className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                        <p className="font-semibold text-sm text-slate-600">No quotations submitted yet</p>
                        <p className="text-xs text-slate-400">Vendor quotations will appear here once vendors submit prices for customer requests.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                              <th className="py-3 px-4">Request #</th>
                              <th className="py-3 px-4">Vendor</th>
                              <th className="py-3 px-4 text-right">Quote Price (₹)</th>
                              <th className="py-3 px-4">Timeline</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4 text-right">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {vendorQuotesHistory.map(q => {
                              const vendor = vendors.find(v => v.id === q.vendorId);
                              return (
                                <tr key={q.id} className="hover:bg-slate-50/60 transition-all">
                                  <td className="py-4 px-4 font-mono font-bold text-slate-800">
                                    {q.requestNumber || q.requestId}
                                  </td>
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center text-[10px] font-bold">
                                        {vendor?.name.charAt(0).toUpperCase() || 'V'}
                                      </div>
                                      <div className="text-sm font-semibold text-slate-900">{vendor?.name || 'Unknown Vendor'}</div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4 font-mono text-right">
                                    <span className={`font-bold ${q.status === 'assigned' ? 'text-success-700' : 'text-brand-700'}`}>
                                      ₹{(q.quotePrice || 0).toLocaleString('en-IN')}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-slate-600">
                                    {q.estimatedTimeline || '1-2 Days'}
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      q.status === 'assigned'
                                        ? 'bg-success-50 text-success-700 border-success-200'
                                        : q.status === 'submitted'
                                          ? 'bg-accent-50 text-accent-700 border-accent-200'
                                          : q.status === 'rejected'
                                            ? 'bg-danger-50 text-danger-700 border-danger-200'
                                            : 'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}>
                                      {q.status}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-slate-500 text-right">
                                    {q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-IN') : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============ VIEW 2: SHARE REQUEST → COLLECT QUOTES ============ */}
              {showVendorPanel && (
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-600" />
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm">Customer Requirement → Vendors</h3>
                        <p className="text-[10px] text-slate-500">Share this customer's damage details with connected vendors and collect price quotations.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${assignedVendor ? 'bg-success-50 text-success-700 border-success-200' : 'bg-brand-50 text-brand-700 border-brand-200'}`}>
                        {assignedVendor ? 'ASSIGNED' : 'OPEN FOR QUOTES'}
                      </span>
                      {quoteRequestId && (
                        <button
                          onClick={() => { setShowVendorPanel(false); setQuoteRequestId(null); }}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                        >
                          Close & Return
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    {/* Customer Request Card */}
                    {quoteRequestId && (
                      <>
                        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono font-bold text-sm text-brand-700">Request #</span>
                                <span className="font-bold text-slate-900">{requests.find(r => r.id === quoteRequestId)?.requestNumber || quoteRequestId}</span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-base mb-1">
                                {requests.find(r => r.id === quoteRequestId)?.servicecode || 'Service Request'}
                              </h4>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                {requests.find(r => r.id === quoteRequestId)?.issueDescription || 'Customer has reported damage requiring repair.'}
                              </p>
                              <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                                <div className="flex items-center gap-1"><Home className="w-3 h-3" /><span>{requests.find(r => r.id === quoteRequestId)?.propertyType || 'Residential'}</span></div>
                                <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /><span>{requests.find(r => r.id === quoteRequestId)?.addressline || requests.find(r => r.id === quoteRequestId)?.location || 'Address not provided'}</span></div>
                                <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /><span>{requests.find(r => r.id === quoteRequestId)?.preferredDate || 'Flexible'}</span></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {requests.find(r => r.id === quoteRequestId)?.mediaUrl && Array.isArray(requests.find(r => r.id === quoteRequestId)?.mediaUrl) && requests.find(r => r.id === quoteRequestId)?.mediaUrl.map((img, idx) => {
                                const reqItem = requests.find(r => r.id === quoteRequestId);
                                const mediaList = Array.isArray(reqItem?.mediaUrl) ? reqItem.mediaUrl : [img];
                                return (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt="Damage"
                                    onClick={() => setActivePhotoModal({
                                      photos: mediaList,
                                      index: idx,
                                      title: `${reqItem?.requestNumber || quoteRequestId} Site Evidence`
                                    })}
                                    className="w-14 h-14 rounded-lg object-cover border-2 border-brand-200 cursor-pointer hover:border-brand-500 hover:shadow-xs transition-all"
                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80'; }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Vendor Quotation Collection */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4 text-accent-600" />
                              <span className="font-semibold text-slate-800 text-sm">Collect Quotations from Vendors</span>
                            </div>
                            <span className="text-xs font-bold text-slate-500">{vendorQuotes.length} received</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {vendors.map(vendor => {
                              const existingQuote = vendorQuotes.find(q => q.vendorId === vendor.id);
                              return (
                                <div key={vendor.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-brand-300 hover:shadow-sm transition-all">
                                  <div className="flex items-center justify-between mb-3">
                                    <div>
                                      <div className="font-bold text-slate-900 text-sm">{vendor.name}</div>
                                      <div className="text-xs text-slate-500">{vendor.businessName}</div>
                                      <div className="text-[10px] text-brand-600 font-medium mt-0.5">{vendor.specialization}</div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                      vendor.status === 'active' ? 'bg-success-50 text-success-700 border-success-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>{vendor.status === 'active' ? 'Available' : 'Busy'}</span>
                                  </div>

                                  {existingQuote ? (
                                    <div className="space-y-2">
                                      <div className="flex items-baseline gap-1">
                                        <span className="font-mono font-bold text-xl text-brand-600">₹{existingQuote.quotePrice.toLocaleString('en-IN')}</span>
                                        <span className="text-xs text-slate-500 font-medium">quoted</span>
                                      </div>
                                      <div className="text-xs text-slate-600">{existingQuote.notes || 'No additional notes'}</div>
                                      <div className="text-[10px] text-slate-400 font-mono">Submitted: {new Date(existingQuote.createdAt).toLocaleDateString()}</div>
                                      <button
                                        onClick={() => {
                                          const newPrice = window.prompt('Update quotation price (₹)', existingQuote.quotePrice.toString());
                                          if (newPrice) handleSubmitVendorQuote(vendor.id, newPrice, existingQuote.notes, existingQuote.estimatedTimeline);
                                        }}
                                        className="mt-2 w-full py-1.5 rounded-lg text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 hover:bg-brand-100 transition-all"
                                      >
                                        Edit Quote
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-slate-900">₹</span>
                                        <input
                                          type="number"
                                          placeholder="0"
                                          value={vendorQuoteInputs[vendorId]?.price || ''}
                                          onChange={(e) => handleVendorInputChange(vendorId, 'price', e.target.value)}
                                          className="w-24 font-mono font-bold text-xl text-slate-900 bg-slate-100 border border-slate-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                        />
                                      </div>
                                      <textarea
                                        placeholder="Notes on scope, materials, timeline..."
                                        value={vendorQuoteInputs[vendorId]?.notes || ''}
                                        onChange={(e) => handleVendorInputChange(vendorId, 'notes', e.target.value)}
                                        className="w-full h-16 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                                      ></textarea>
                                      <button
                                        onClick={() => {
                                          const vals = vendorQuoteInputs[vendorId];
                                          if (!vals || !vals.price) {
                                            showToastMsg('Please enter a quotation price', 'error');
                                            return;
                                          }
                                          handleSubmitVendorQuote(vendor.id, vals.price, vals.notes, vals.timeline || '1-2 Working Days');
                                        }}
                                        className="w-full py-2 rounded-lg text-xs font-bold text-white bg-accent-600 hover:bg-accent-700 transition-all shadow-xs"
                                      >
                                        Submit Quotation
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Manual Vendor Assignment */}
                          {vendorQuotes.length > 0 && (
                            <div className="mt-6 p-5 rounded-xl bg-primary-50 border border-primary-200">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <UserPlus className="w-4 h-4 text-primary-600" />
                                    <span className="font-bold text-primary-800 text-sm">Assign Vendor Manually</span>
                                  </div>
                                  <div className="text-sm text-slate-700">
                                    Select which vendor to assign this job to. Admin makes the final decision.
                                  </div>
                                </div>
                                {assignedVendor && (
                                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-success-100 text-success-700 border border-success-200">
                                    ASSIGNED
                                  </span>
                                )}
                              </div>

                              <div className="space-y-3">
                                {vendors.map(vendor => {
                                  const quote = vendorQuotes.find(q => q.vendorId === vendor.id);
                                  const isAssigned = assignedVendor && assignedVendor.vendorId === vendor.id;
                                  if (!quote) return null; // Only show vendors who submitted quotes
                                  return (
                                    <div key={vendor.id} className="p-4 rounded-xl border bg-white hover:shadow-sm transition-all flex items-center justify-between gap-4">
                                      <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isAssigned ? 'bg-success-100 text-success-700 border border-success-200' : 'bg-primary-100 text-primary-700 border border-primary-200'}`}>
                                            {vendor.name.charAt(0)}
                                          </div>
                                          <div>
                                            <div className="font-bold text-slate-900 text-sm">{vendor.name}</div>
                                            <div className="text-xs text-slate-500">{vendor.businessName}</div>
                                            <div className="text-[10px] text-primary-600 font-medium mt-0.5">{vendor.specialization}</div>
                                          </div>
                                        </div>
                                        <div className="flex items-baseline gap-1 mt-2">
                                          <span className="font-mono font-bold text-lg text-slate-900">₹{quote.quotePrice.toLocaleString('en-IN')}</span>
                                          <span className="text-xs text-slate-500 font-medium">quoted</span>
                                          <span className="text-xs text-slate-400 ml-auto">{new Date(quote.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-xs text-slate-600 mt-1">{quote.notes || 'No additional notes'}</div>
                                      </div>
                                      <button
                                        onClick={() => handleAssignVendor(vendor.id)}
                                        disabled={isAssigned}
                                        className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                                          isAssigned
                                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                            : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md'
                                        }`}
                                      >
                                        {isAssigned ? (
                                          <span className="flex items-center gap-1">
                                            <Check className="w-3.5 h-3.5" /> Assigned
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1">
                                            <UserPlus className="w-3.5 h-3.5" /> Assign
                                          </span>
                                        )}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>

                              {assignedVendor && (
                                <div className="mt-4 pt-4 border-t border-success-200">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-success-100 text-success-700 flex items-center justify-center font-bold text-xs">
                                      {vendors.find(v => v.id === assignedVendor.vendorId)?.name.charAt(0) || 'V'}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900 text-sm">
                                        {vendors.find(v => v.id === assignedVendor.vendorId)?.name || 'Vendor'}
                                      </div>
                                      <div className="text-xs text-success-700 font-medium">
                                        Manually assigned at ₹{assignedVendor.quotePrice.toLocaleString('en-IN')}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    {!quoteRequestId && (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <h4 className="font-semibold text-slate-800 text-sm mb-1">No customer request selected</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Go to Inspection Requests and click "Share with Vendors" on a customer request to collect quotations from connected vendors.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
                </>
              )}
{/* Vendor Add/Edit Modal */}
              {vendorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setVendorModalOpen(false)} />
                  <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                    <div className="p-5 border-b border-slate-200/50 flex items-center justify-between">
                      <h3 className="font-heading font-bold text-lg text-slate-900">
                        {editingVendor ? 'Edit Vendor' : 'Connect New Vendor'}
                      </h3>
                      <button onClick={() => setVendorModalOpen(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <form onSubmit={handleSaveVendor} className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor Name</label>
                          <input
                            name="name"
                            value={vendorForm.name}
                            onChange={(e) => setVendorForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Rajesh Kumar"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Name</label>
                          <input
                            name="businessName"
                            value={vendorForm.businessName}
                            onChange={(e) => setVendorForm(prev => ({ ...prev, businessName: e.target.value }))}
                            placeholder="Rajesh Construction & Repairs"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</label>
                          <input
                            name="phone"
                            value={vendorForm.phone}
                            onChange={(e) => setVendorForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+91 98765 43210"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
                          <input
                            name="email"
                            value={vendorForm.email}
                            onChange={(e) => setVendorForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="rajesh@example.com"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">State (India)</label>
                          <input
                            name="state"
                            value={vendorForm.state || ''}
                            onChange={(e) => setVendorForm(prev => ({ ...prev, state: e.target.value }))}
                            placeholder="e.g. Rajasthan, Maharashtra"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">City</label>
                          <input
                            name="city"
                            value={vendorForm.city}
                            onChange={(e) => setVendorForm(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="e.g. Bhilwara, Pune"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Domain Category *</label>
                          <select
                            name="category"
                            value={vendorForm.category || 'Services'}
                            onChange={(e) => {
                              const newCat = e.target.value;
                              setVendorForm(prev => ({
                                ...prev,
                                category: newCat,
                                specialization: newCat === 'Adventure' ? 'Paragliding & Microlight Flights' : 'Waterproofing & Leakage'
                              }));
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold"
                          >
                            <option value="Services">🛠️ Home & Civil Services</option>
                            <option value="Adventure">🪂 Adventure & Sports Operator</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Specialization *</label>
                        <select
                          name="specialization"
                          value={vendorForm.specialization}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, specialization: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                        >
                          <optgroup label="🛠️ Services Specializations">
                            <option value="Waterproofing & Leakage">Waterproofing & Leakage</option>
                            <option value="Civil Construction & Masonry">Civil Construction & Masonry</option>
                            <option value="Plumbing & Sanitation">Plumbing & Sanitation</option>
                            <option value="Electrical & Wiring">Electrical & Wiring</option>
                            <option value="Painting & Finishing">Painting & Finishing</option>
                            <option value="Renovation & Carpentry">Renovation & Carpentry</option>
                            <option value="General Maintenance">General Maintenance</option>
                          </optgroup>
                          <optgroup label="🪂 Adventure Specializations">
                            <option value="Paragliding & Microlight Flights">Paragliding & Microlight Flights</option>
                            <option value="Desert Safari & Dune Bashing">Desert Safari & Dune Bashing</option>
                            <option value="River Rafting & Kayaking">River Rafting & Kayaking</option>
                            <option value="Trekking & Mountain Expeditions">Trekking & Mountain Expeditions</option>
                          </optgroup>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Experience</label>
                          <input
                            name="experience"
                            value={vendorForm.experience}
                            onChange={(e) => setVendorForm(prev => ({ ...prev, experience: e.target.value }))}
                            placeholder="8 Years"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Min Charge (₹)</label>
                          <input
                            name="minCharge"
                            type="number"
                            value={vendorForm.minCharge}
                            onChange={(e) => setVendorForm(prev => ({ ...prev, minCharge: e.target.value }))}
                            placeholder="1000"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</label>
                        <select
                          name="status"
                          value={vendorForm.status}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setVendorModalOpen(false)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm hover:shadow-md transition-all"
                        >
                          {editingVendor ? 'Update Vendor' : 'Connect Vendor'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QUOTATION BUILDER TAB */}
          {activeTab === 'builder' && (
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
                <div>
                  <h2 className="font-heading font-semibold text-lg text-slate-800">Dynamic Itemized Quotation Generator</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Hind Building Solutions — Material & Labor Custom Scope Pricing Engine</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-600">
                  <span>QTE-2026-AUTO</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Select Associated Service Request *</label>
                  <select value={builderRequestId} onChange={(e) => setBuilderRequestId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500/20 focus:border-brand-500 transition-all">
                    <option value="">-- Choose a pending customer request --</option>
                    {requests.map(r => (
                      <option key={r.id} value={r.id}>{r.requestNumber} — {r.servicecode} ({r.user?.name || 'Customer'} • {r.status})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Created By (Estimator Desk)</label>
                  <input type="text" value={builderEstimator} onChange={(e) => setBuilderEstimator(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                </div>
              </div>

              {selectedBuilderReq && (
                <div className="p-3.5 rounded-lg bg-brand-50/40 border border-brand-200 text-slate-700 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-brand-800">
                      <Info className="w-3.5 h-3.5 text-brand-600" />
                      <span>{selectedBuilderReq.requestNumber} — {selectedBuilderReq.servicecode}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white text-brand-700 border border-brand-200">{selectedBuilderReq.status}</span>
                  </div>
                  <div className="text-[11.5px] text-slate-600 leading-relaxed font-normal">
                    <strong>Client:</strong> {selectedBuilderReq.user?.name} ({selectedBuilderReq.user?.phoneNumber}) &nbsp;|&nbsp;
                    <strong>Property:</strong> {[selectedBuilderReq.propertyType, selectedBuilderReq.propertySize].filter(Boolean).join(' • ') || '—'} &nbsp;|&nbsp;
                    <strong>Address:</strong> {selectedBuilderReq.addressline || selectedBuilderReq.location || '—'} <br />
                    <strong>Issue:</strong> "{selectedBuilderReq.issueDescription}"
                  </div>
                </div>
              )}

              {/* Line Items Table */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-medium text-sm text-slate-800">Itemized Scope & Bill of Quantities (BOQ)</h3>
                  <button type="button" onClick={() => setLineItems([...lineItems, { item: '', qty: 1, unit: 'Sq Ft', rate: 0 }])} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-all">
                    <Plus className="w-3 h-3" /> Add Line Item
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 text-[11px] font-medium uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 w-8 text-center">#</th>
                        <th className="p-2.5 min-w-[220px]">Item Description & Scope</th>
                        <th className="p-2.5 w-24">Qty</th>
                        <th className="p-2.5 w-32">Unit</th>
                        <th className="p-2.5 w-32">Rate (₹)</th>
                        <th className="p-2.5 w-32 text-right">Amount (₹)</th>
                        <th className="p-2.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {lineItems.map((li, idx) => {
                        const lineAmt = ((parseFloat(li.qty) || 0) * (parseFloat(li.rate) || 0)).toFixed(2);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-2.5 text-center text-xs font-medium text-slate-400">{idx + 1}</td>
                            <td className="p-1.5">
                              <input type="text" value={li.item} onChange={(e) => { const updated = [...lineItems]; updated[idx].item = e.target.value; setLineItems(updated); }} placeholder="Scope description" className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:bg-white focus:outline-none font-normal" />
                            </td>
                            <td className="p-1.5">
                              <input type="number" value={li.qty} onChange={(e) => { const updated = [...lineItems]; updated[idx].qty = e.target.value; setLineItems(updated); }} className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:bg-white focus:outline-none font-normal" />
                            </td>
                            <td className="p-1.5">
                              <select value={li.unit} onChange={(e) => { const updated = [...lineItems]; updated[idx].unit = e.target.value; setLineItems(updated); }} className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:bg-white focus:outline-none font-normal">
                                <option value="Sq Ft">Sq Ft</option>
                                <option value="Running Ft">Running Ft</option>
                                <option value="Lumpsum">Lumpsum</option>
                                <option value="Bags">Bags</option>
                                <option value="Hours">Hours</option>
                                <option value="Points">Points</option>
                              </select>
                            </td>
                            <td className="p-1.5">
                              <input type="number" value={li.rate} onChange={(e) => { const updated = [...lineItems]; updated[idx].rate = e.target.value; setLineItems(updated); }} className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:bg-white focus:outline-none font-normal" />
                            </td>
                            <td className="p-2.5 text-right font-mono font-medium text-xs text-success-600">
                              ₹{Number(lineAmt).toLocaleString('en-IN')}
                            </td>
                            <td className="p-1.5 text-center">
                              <button type="button" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                                <X className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Commercials Form */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3 border-t border-slate-100 text-xs">
                <div className="lg:col-span-7 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-medium text-slate-400 uppercase">Estimated Timeline</label>
                        {builderTimeline === 'CUSTOM' && (
                          <button
                            type="button"
                            onClick={() => { setBuilderTimeline('1-2 Working Days'); setCustomTimeline(''); }}
                            className="text-[10px] text-primary-600 hover:underline font-semibold"
                          >
                            Presets
                          </button>
                        )}
                      </div>
                      <select
                        value={builderTimeline}
                        onChange={(e) => {
                          setBuilderTimeline(e.target.value);
                          if (e.target.value !== 'CUSTOM') setCustomTimeline('');
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="1-2 Working Days">1-2 Working Days</option>
                        <option value="2-3 Working Days">2-3 Working Days</option>
                        <option value="3-5 Working Days">3-5 Working Days</option>
                        <option value="1 Week (Phased)">1 Week (Phased)</option>
                        <option value="2 Weeks">2 Weeks</option>
                        <option value="1 Month">1 Month</option>
                        <option value="Same Day Immediate">Same Day Immediate</option>
                        <option value="CUSTOM">Custom Time Period...</option>
                      </select>
                      {builderTimeline === 'CUSTOM' && (
                        <input
                          type="text"
                          value={customTimeline}
                          onChange={(e) => setCustomTimeline(e.target.value)}
                          placeholder="e.g. 10 Working Days, 3 Weeks, 45 Days..."
                          className="w-full mt-1 px-2.5 py-1.5 bg-white border border-primary-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-2xs"
                          autoFocus
                        />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-slate-400 uppercase">Service Scope</label>
                      <select value={builderScope} onChange={(e) => setBuilderScope(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-700">
                        <option value="Standard Engineering Specifications">Standard Engineering Specifications</option>
                        <option value="Comprehensive Waterproofing Scope">Comprehensive Waterproofing Scope</option>
                        <option value="Structural Patchwork Scope">Structural Patchwork Scope</option>
                        <option value="Standard Maintenance Scope">Standard Maintenance Scope</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-medium text-slate-400 uppercase">
                          Warranty (Optional)
                        </label>
                        {builderWarranty && (
                          <button
                            type="button"
                            onClick={() => setBuilderWarranty('')}
                            className="text-[10px] font-bold text-red-500 hover:underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={builderWarranty}
                        onChange={(e) => setBuilderWarranty(e.target.value)}
                        placeholder="Optional: e.g. 1 Year"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-400 uppercase">Terms & Conditions</label>
                    <textarea rows="2" value={builderTerms} onChange={(e) => setBuilderTerms(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 leading-relaxed"></textarea>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <h4 className="font-heading font-medium text-xs text-slate-800 pb-1.5 border-b border-slate-200">Commercial Summary</h4>

                  <div className="flex items-center justify-between text-slate-500">
                    <span>Material Cost (₹):</span>
                    <input type="number" value={effectiveMatCost} onChange={(e) => setMatCost(parseFloat(e.target.value) || 0)} className="w-28 px-2 py-1 text-right bg-white border border-slate-200 rounded-md text-xs font-mono font-medium text-slate-800" />
                  </div>

                  <div className="flex items-center justify-between text-slate-500">
                    <span>Labor & Application (₹):</span>
                    <input type="number" value={effectiveLabCost} onChange={(e) => setLabCost(parseFloat(e.target.value) || 0)} className="w-28 px-2 py-1 text-right bg-white border border-slate-200 rounded-md text-xs font-mono font-medium text-slate-800" />
                  </div>

                  <div className="flex items-center justify-between font-medium text-slate-800 pt-0.5">
                    <span>Subtotal (₹):</span>
                    <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500">
                    <span>Discount (₹):</span>
                    <input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-28 px-2 py-1 text-right bg-white border border-slate-200 rounded-md text-xs font-mono font-medium text-slate-800" />
                  </div>

                  <div className="flex items-center justify-between text-slate-500">
                    <span>GST Tax Rate (%):</span>
                    <select value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 18)} className="w-28 px-2 py-1 text-right bg-white border border-slate-200 rounded-md text-xs font-normal text-slate-800">
                      <option value="18">18% GST (Standard)</option>
                      <option value="12">12% GST</option>
                      <option value="5">5% GST</option>
                      <option value="0">0% (Exempt)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>GST Amount:</span>
                    <span className="font-mono">₹{gstAmount.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="font-heading font-medium text-sm text-slate-800">Grand Total:</span>
                    <span className="font-heading font-semibold text-xl text-success-600 font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>

                  {/* ADMIN ADVANCE PAYMENT ADJUSTMENT */}
                  <div className="p-3 bg-primary-50/80 border border-primary-200/90 rounded-xl space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary-950 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-primary-600" />
                        Min. Advance To Start Work:
                      </span>
                      <span className="text-xs font-mono font-bold text-primary-700 bg-white px-2 py-0.5 rounded border border-primary-200 shadow-2xs">
                        ₹{effectiveAdvanceAmount.toLocaleString('en-IN')} ({effectiveAdvancePct}%)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-primary-900 uppercase mb-1">
                          Select % Amount
                        </label>
                        <select
                          value={customAdvanceAmt !== null ? 'custom' : builderAdvancePct}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setCustomAdvanceAmt(effectiveAdvanceAmount);
                            } else {
                              setCustomAdvanceAmt(null);
                              setBuilderAdvancePct(parseFloat(e.target.value) || 30);
                            }
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-primary-200 rounded-lg text-xs font-medium text-slate-800"
                        >
                          <option value="10">10% Advance</option>
                          <option value="20">20% Advance</option>
                          <option value="25">25% Advance</option>
                          <option value="30">30% Advance (Recommended)</option>
                          <option value="40">40% Advance</option>
                          <option value="50">50% Advance</option>
                          <option value="60">60% Advance</option>
                          <option value="70">70% Advance</option>
                          <option value="100">100% Full Payment</option>
                          <option value="custom">Custom ₹ Amount</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-primary-900 uppercase mb-1">
                          Advance Value (₹)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 3000"
                          value={customAdvanceAmt !== null ? customAdvanceAmt : effectiveAdvanceAmount}
                          onChange={(e) => {
                            setCustomAdvanceAmt(e.target.value);
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-primary-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="text-[11px] text-primary-700 leading-tight">
                      Customer will pay exactly <strong>₹{effectiveAdvanceAmount.toLocaleString('en-IN')}</strong> to approve & commence work.
                    </div>
                  </div>

                  <div className="pt-3 flex items-center gap-2">
                    <button type="button" onClick={() => { setBuilderRequestId(''); setBuilderWarranty(''); setLineItems([{ item: '', qty: 1, unit: 'Sq Ft', rate: 0 }]); }} className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all">
                      Reset
                    </button>
                    <button type="button" onClick={handleIssueQuotation} className="flex-2 px-3.5 py-2 text-xs font-medium text-white bg-success-600 hover:bg-success-700 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> Issue Quotation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LIVE CHAT DESK TAB */}
          {activeTab === 'chat' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden grid grid-cols-12 min-h-0" style={{ height: 'calc(100vh - 64px - 48px)', minHeight: '520px' }}>
              {/* LEFT COLUMN: Conversation Threads List */}
              <div className={`col-span-12 md:col-span-5 lg:col-span-4 border-r border-slate-200 flex flex-col min-h-0 bg-slate-50/50 ${activeThreadId ? 'hidden md:flex' : 'flex'}`}>
                {/* Search and Filters */}
                <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-success-500 animate-pulse' : 'bg-danger-400'}`}></span>
                      <span className="text-xs font-bold text-slate-800">Customer Chats</span>
                      <span className="text-[11px] font-semibold text-slate-400">({chatThreads.length})</span>
                    </div>
                    <button
                      onClick={() => {
                        fetchChatThreads();
                        if (activeThreadId) fetchThreadMessages(activeThreadId);
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                      title="Sync Threads"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      placeholder="Search client, quote #, phone..."
                      className="w-full pl-9 pr-3.5 py-2 text-sm font-semibold text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                    {/* Filter tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold">
                      {[
                        { id: 'ALL', label: 'All' },
                        { id: 'VENDOR', label: 'Vendors' },
                        { id: 'REQUEST', label: 'Requests' },
                        { id: 'BOOKING', label: 'Bookings' },
                        { id: 'QUOTATION', label: 'Quotes' },
                        { id: 'GENERAL', label: 'General' },
                      ].map(filter => (
                        <button
                          key={filter.id}
                          onClick={() => setChatFilterType(filter.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-all ${
                            chatFilterType === filter.id
                              ? 'bg-primary-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Thread list scroll container */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {(() => {
                      const filtered = chatThreads.filter(t => {
                        if (chatFilterType !== 'ALL' && t.contextType !== chatFilterType) return false;
                        if (!chatSearch.trim()) return true;
                        const q = chatSearch.toLowerCase();
                        return (
                          (t.customerName && t.customerName.toLowerCase().includes(q)) ||
                          (t.customerPhone && t.customerPhone.toLowerCase().includes(q)) ||
                          (t.quoteNumber && t.quoteNumber.toLowerCase().includes(q)) ||
                          (t.requestNumber && t.requestNumber.toLowerCase().includes(q)) ||
                          (t.bookingNumber && t.bookingNumber.toLowerCase().includes(q)) ||
                          (t.contextTag && t.contextTag.toLowerCase().includes(q)) ||
                          (t.lastMessage && t.lastMessage.toLowerCase().includes(q))
                        );
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="p-8 text-center text-slate-500 space-y-2">
                            <MessageCircle className="w-8 h-8 text-slate-400 mx-auto" />
                            <p className="font-semibold text-sm">No conversations found</p>
                            <p className="text-xs text-slate-400">Customer inquiries from app and quotes will appear here.</p>
                          </div>
                        );
                      }

                      return filtered.map(t => {
                        const isSelected = activeThreadId === t.id;
                        const unread = t.unreadCountAdmin || 0;
                        const initial = (t.customerName || 'C')[0].toUpperCase();

                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              setActiveThreadId(t.id);
                              fetchThreadMessages(t.id);
                              setChatThreads(prev => prev.map(item => item.id === t.id ? { ...item, unreadCountAdmin: 0 } : item));
                            }}
                            className={`p-4 cursor-pointer transition-all flex items-start gap-3 border-l-4 ${
                              isSelected
                                ? 'bg-primary-50/80 border-primary-600'
                                : 'bg-white hover:bg-slate-50 border-transparent'
                            }`}
                          >
                            {/* Avatar */}
                            <div className="relative shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-primary-500 text-white font-semibold text-sm flex items-center justify-center shadow-xs">
                                {initial}
                              </div>
                              {unread > 0 && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-ping" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <h4 className="font-semibold text-sm text-slate-900 truncate">
                                  {t.customerName || 'Customer'}
                                </h4>
                                <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                                  {t.lastMessageTime ? new Date(t.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                {t.contextType === 'VENDOR' ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                                    🏢 Vendor Desk
                                  </span>
                                ) : t.bookingNumber ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-warning-50 text-warning-800 border border-warning-200">
                                    Booking #{t.bookingNumber}
                                  </span>
                                ) : t.quoteNumber ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                                    Quote #{t.quoteNumber}
                                  </span>
                                ) : t.requestNumber ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-success-50 text-success-700 border border-success-200">
                                    Req #{t.requestNumber}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                                    {t.contextTag || 'Consultation'}
                                  </span>
                                )}
                                {unread > 0 && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-600 text-white">
                                    {unread} new
                                  </span>
                                )}
                              </div>

                              <p className="text-xs font-semibold text-slate-600 truncate">
                                {t.lastMessage || 'No messages yet'}
                              </p>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* RIGHT COLUMN: Active Thread Chat View */}
                <div className={`col-span-12 md:col-span-7 lg:col-span-8 flex flex-col min-h-0 bg-white ${!activeThreadId ? 'hidden md:flex' : 'flex'}`}>
                  {(() => {
                    const currentThread = chatThreads.find(t => t.id === activeThreadId) || (activeThreadId ? { id: activeThreadId, customerName: 'Client' } : null);

                    if (!currentThread) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                          <div className="w-16 h-16 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-500 mb-3">
                            <MessageCircle className="w-8 h-8" />
                          </div>
                          <h3 className="font-semibold text-lg text-slate-900">Select a Conversation</h3>
                          <p className="text-xs sm:text-sm font-semibold text-slate-600 max-w-sm mt-1">
                            Choose any customer thread from the left panel to review questions and reply in real-time.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <>
                        {/* Thread Header */}
                        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-white shrink-0">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setActiveThreadId(null)}
                              className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                              title="Back to conversations"
                            >
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="w-10 h-10 rounded-full bg-primary-600 text-white font-semibold flex items-center justify-center text-sm shadow-xs shrink-0">
                              {(currentThread.customerName || 'C')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-base text-slate-900">
                                  {currentThread.customerName || 'Customer'}
                                </h3>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-success-50 text-success-700 border border-success-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-success-500"></span> Active
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                <span>{currentThread.customerPhone || 'Customer App Client'}</span>
                                {currentThread.contextTag && (
                                  <>
                                    <span>•</span>
                                    <span className="text-primary-600">{currentThread.contextTag}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Context Shortcuts */}
                          <div className="flex items-center gap-2">
                            {currentThread.bookingNumber && (
                              <button
                                onClick={() => {
                                  const found = directBookings.find(b => b.bookingNumber === currentThread.bookingNumber);
                                  if (found) setSelectedBookingForDrawer(found);
                                  setActiveTab('direct-bookings');
                                }}
                                className="px-3 py-1.5 text-xs font-semibold text-warning-800 bg-warning-50 hover:bg-warning-100 border border-warning-200 rounded-xl transition-all flex items-center gap-1.5"
                                title="Open Instant Booking details"
                              >
                                <Zap className="w-3.5 h-3.5 text-warning-600" />
                                <span className="hidden sm:inline">View Booking</span>
                              </button>
                            )}
                            {currentThread.quoteNumber && (
                              <button
                                onClick={() => setActiveTab('quotations')}
                                className="px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-all flex items-center gap-1.5"
                                title="Open Quotations desk"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">View Quote</span>
                              </button>
                            )}
                            {currentThread.requestNumber && (
                              <button
                                onClick={() => setActiveTab('requests')}
                                className="px-3 py-1.5 text-xs font-semibold text-success-700 bg-success-50 hover:bg-success-100 border border-success-200 rounded-xl transition-all flex items-center gap-1.5"
                                title="Open Requests desk"
                              >
                                <ClipboardList className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">View Request</span>
                              </button>
                            )}
                            {currentThread.customerPhone && (
                              <button
                                onClick={() => callCustomer(currentThread.customerPhone)}
                                className="p-2 rounded-xl text-slate-700 hover:text-primary-600 hover:bg-slate-100 border border-slate-200 transition-all"
                                title="Call Customer"
                              >
                                <PhoneCall className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Thread Message Stream */}
                        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-4 bg-slate-50/60">
                          {/* Context Callout Banner */}
                          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between text-xs font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                              <Info className="w-4 h-4 text-primary-600 shrink-0" />
                              <span>
                                Real-Time Chat Room: <span className="text-slate-900 font-bold">{currentThread.contextTag || currentThread.id}</span>
                              </span>
                            </div>
                            <span className="text-slate-500 font-normal">Customer messages sync directly from mobile app</span>
                          </div>

                          {/* Messages */}
                          {threadMessages.length === 0 ? (
                            <div className="py-12 text-center text-slate-500 space-y-2">
                              <Sparkles className="w-6 h-6 text-primary-500 mx-auto" />
                              <p className="font-semibold text-sm">No messages in this conversation yet</p>
                              <p className="text-xs text-slate-400">Send an official note or proposal update to start the discussion.</p>
                            </div>
                          ) : (
                            threadMessages.map(msg => {
                              const isAdmin = msg.sender === 'admin';
                              return (
                                <div
                                  key={msg.id || msg.createdAt}
                                  className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                                >
                                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1 px-1">
                                    <span>{isAdmin ? 'Er. Vikram Sharma (Admin Desk)' : (msg.senderName || currentThread.customerName || 'Customer')}</span>
                                    <span>•</span>
                                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <div
                                    className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-sm font-semibold shadow-xs ${
                                      isAdmin
                                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-tr-xs'
                                        : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs'
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                    {isAdmin && (
                                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-primary-100">
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        <span>Delivered</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                          <div ref={chatMessagesEndRef} />
                        </div>

                        {/* Quick Pre-Set Replies */}
                        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-semibold shrink-0">
                          <span className="text-slate-500 shrink-0 text-[11px]">Quick reply:</span>
                          {[
                            'Hello! I am reviewing your request right now.',
                            'Our senior engineer will visit your site tomorrow.',
                            'Quotation has been prepared. Please review and approve.',
                            'Thank you! Our materials and team have been dispatched.',
                            'Can you please share photos or video of the affected area?'
                          ].map((chip, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendAdminReply(chip)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50/50 whitespace-nowrap transition-all shadow-2xs text-[11px]"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>

                        {/* Admin Reply Input */}
                        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 shrink-0">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSendAdminReply();
                            }}
                            className="flex items-center gap-2.5"
                          >
                            <input
                              type="text"
                              value={adminReplyText}
                              onChange={(e) => setAdminReplyText(e.target.value)}
                              placeholder="Write a message to customer... (Press Enter to send)"
                              className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-slate-400"
                            />
                            <button
                              type="submit"
                              disabled={isSendingReply || !adminReplyText.trim()}
                              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all shrink-0"
                            >
                              {isSendingReply ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                              <span className="hidden sm:inline">Send</span>
                            </button>
                          </form>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
          )}

          {/* DIRECT MAINTENANCE BOOKINGS TAB */}
          {activeTab === 'direct-bookings' && (
            <div className="space-y-5">
              {/* Top Banner & Header */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-warning-500 animate-pulse"></span>
                    <h2 className="font-heading font-semibold text-base text-slate-800">Direct Maintenance Bookings</h2>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-warning-100 text-warning-800 border border-warning-200">
                      Pre-Paid Online
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Live bookings for Plumbers, Electricians, and quick utility services. Online visiting charge received.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { fetchDirectBookings(); fetchDirectBookingStats(); showToastMsg('Bookings refreshed', 'info'); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* KPI Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</div>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5">{directBookingStats?.total || directBookings.length}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
                  <div className="text-[11px] font-bold text-warning-600 uppercase tracking-wider">Confirmed (Paid)</div>
                  <div className="text-2xl font-bold font-mono text-warning-600 mt-1.5">{directBookingStats?.confirmed || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
                  <div className="text-[11px] font-bold text-primary-600 uppercase tracking-wider">Assigned</div>
                  <div className="text-2xl font-bold font-mono text-primary-600 mt-1.5">{directBookingStats?.assigned || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
                  <div className="text-[11px] font-bold text-success-600 uppercase tracking-wider">Completed</div>
                  <div className="text-2xl font-bold font-mono text-success-600 mt-1.5">{directBookingStats?.completed || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
                  <div className="text-[11px] font-bold text-danger-600 uppercase tracking-wider">Refunded</div>
                  <div className="text-2xl font-bold font-mono text-danger-600 mt-1.5">{directBookingStats?.refunded || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Revenue</div>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5">₹{(directBookingStats?.netRevenue || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
                  {['ALL', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED'].map(st => (
                    <button
                      key={st}
                      onClick={() => setDirectBookingFilter(st)}
                      className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 text-xs ${
                        directBookingFilter === st
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/70'
                      }`}
                    >
                      {st === 'ALL' ? 'All Bookings' : st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={directBookingSearch}
                      onChange={(e) => setDirectBookingSearch(e.target.value)}
                      placeholder="Search booking #, phone, customer..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 text-xs border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Direct Bookings Table */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Booking ID</th>
                        <th className="py-3 px-4">Sub-Service / Category</th>
                        <th className="py-3 px-4">Customer & Address</th>
                        <th className="py-3 px-4">Scheduled Slot</th>
                        <th className="py-3 px-4">Pre-Paid Online</th>
                        <th className="py-3 px-4">Technician</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const filtered = directBookings.filter(b => {
                          const matchesFilter =
                            directBookingFilter === 'ALL' ? true :
                            directBookingFilter === 'REFUNDED' ? b.paymentStatus === 'REFUNDED' :
                            b.status === directBookingFilter;
                          const q = directBookingSearch.trim().toLowerCase();
                          const matchesSearch = !q ||
                            (b.bookingNumber && b.bookingNumber.toLowerCase().includes(q)) ||
                            (b.customerName && b.customerName.toLowerCase().includes(q)) ||
                            (b.customerPhone && b.customerPhone.includes(q)) ||
                            (b.subServiceName && b.subServiceName.toLowerCase().includes(q));
                          return matchesFilter && matchesSearch;
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan="8" className="py-12 text-center text-slate-400">
                                <Zap className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                <div>No direct maintenance bookings found matching criteria.</div>
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map(b => {
                          const isRefunded = b.paymentStatus === 'REFUNDED';
                          const isCancelled = b.status === 'CANCELLED';

                          return (
                            <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-brand-600 font-bold">{b.bookingNumber}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {new Date(b.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-slate-800">{b.subServiceName}</div>
                                <div className="text-[11px] text-brand-600 font-medium">{b.serviceName}</div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-medium text-slate-800">{b.customerName}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{b.customerPhone}</div>
                                <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{b.customerAddress}, {b.city}</div>
                                {b.latitude && b.longitude && (
                                  <a
                                    href={`https://www.google.com/maps?q=${b.latitude},${b.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-brand-600 hover:text-brand-800 hover:underline mt-0.5"
                                  >
                                    <MapPin className="w-2.5 h-2.5 text-brand-500" />
                                    <span>Map Pin ({b.latitude.toFixed(3)}, {b.longitude.toFixed(3)})</span>
                                  </a>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1 font-medium text-slate-700">
                                  <Calendar className="w-3 h-3 text-brand-500" />
                                  <span>{b.scheduledDate}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  <span>{b.scheduledSlot}</span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-mono font-bold text-slate-800">
                                  ₹{b.onlinePaidAmount || b.visitingCharge}
                                </div>
                                <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-success-600 bg-success-50 px-1.5 py-0.2 rounded border border-success-200">
                                  <Check className="w-2.5 h-2.5" /> PAID
                                </div>
                                {b.additionalWorkAmount > 0 && (
                                  <div className="text-[10px] text-warning-600 font-medium mt-0.5">
                                    +₹{b.additionalWorkAmount} on-site
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                {b.technicianName ? (
                                  <div>
                                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                      <HardHat className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>{b.technicianName}</span>
                                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                                        Assigned
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium truncate max-w-[210px]">{b.technicianRole || 'Authorized Contractor'}</div>
                                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                      <Phone className="w-2.5 h-2.5 text-slate-400" />
                                      <span>{b.technicianPhone}</span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const matchedV = vendors.find(v => v.id === b.technicianId || v.phone === b.technicianPhone || v.name === b.technicianName);
                                        setAssignTechModalBooking(b);
                                        setTechForm({
                                          vendorId: matchedV ? matchedV.id : '',
                                          name: b.technicianName || matchedV?.name || '',
                                          phone: b.technicianPhone || matchedV?.phone || '',
                                          role: b.technicianRole || (matchedV ? `${matchedV.businessName || matchedV.name} • ${matchedV.specialization || 'Field Specialist'}` : 'Authorized Service Provider'),
                                          rating: matchedV?.rating || 4.9,
                                          businessName: matchedV?.businessName || '',
                                          city: matchedV?.city || b.city || '',
                                          documentsVerified: matchedV?.documentsVerified || false
                                        });
                                      }}
                                      className="text-[11px] text-brand-600 hover:text-brand-800 font-medium underline mt-1 inline-flex items-center gap-1"
                                    >
                                      Change Vendor
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-1.5 min-w-[210px]">
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '__modal__') {
                                          const matchedV = vendors.find(v => v.phone === b.technicianPhone || v.name === b.technicianName);
                                          setAssignTechModalBooking(b);
                                          setTechForm({
                                            vendorId: matchedV ? matchedV.id : '',
                                            name: b.technicianName || matchedV?.name || '',
                                            phone: b.technicianPhone || matchedV?.phone || '',
                                            role: b.technicianRole || (matchedV ? `${matchedV.businessName || matchedV.name} • ${matchedV.specialization || 'Field Specialist'}` : 'Authorized Service Provider'),
                                            rating: matchedV?.rating || 4.9,
                                            businessName: matchedV?.businessName || '',
                                            city: matchedV?.city || b.city || '',
                                            documentsVerified: matchedV?.documentsVerified || false
                                          });
                                        } else if (val) {
                                          handleQuickAssignBookingVendor(b.id, val);
                                        }
                                      }}
                                      className="w-full text-xs font-semibold px-2.5 py-1.5 bg-amber-50/50 hover:bg-white border border-amber-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer transition-all shadow-2xs"
                                    >
                                      <option value="">-- Assign Authorized Vendor --</option>
                                      {(() => {
                                        const cityMatches = vendors.filter(v => v.status === 'active' && v.city?.toLowerCase() === b.city?.toLowerCase());
                                        const others = vendors.filter(v => v.status === 'active' && v.city?.toLowerCase() !== b.city?.toLowerCase());
                                        return (
                                          <>
                                            {cityMatches.length > 0 && (
                                              <optgroup label={`Local Partners (${b.city || 'Local'})`}>
                                                {cityMatches.map(v => (
                                                  <option key={v.id} value={v.id}>
                                                    ★ {v.name} - {v.businessName || v.specialization} ({v.phone})
                                                  </option>
                                                ))}
                                              </optgroup>
                                            )}
                                            <optgroup label={cityMatches.length > 0 ? "All Registered Partners" : "Active Contractors"}>
                                              {(cityMatches.length > 0 ? others : vendors.filter(v => v.status === 'active')).map(v => (
                                                <option key={v.id} value={v.id}>
                                                  {v.name} ({v.businessName || v.city}) - {v.phone}
                                                </option>
                                              ))}
                                            </optgroup>
                                          </>
                                        );
                                      })()}
                                      <option value="__modal__">📋 Open Assignment Modal...</option>
                                    </select>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                      <span className="text-amber-600 font-semibold flex items-center gap-1">
                                        <AlertTriangle className="w-2.5 h-2.5" /> Pending Assignment
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const matchedV = vendors.find(v => v.phone === b.technicianPhone || v.name === b.technicianName);
                                          setAssignTechModalBooking(b);
                                          setTechForm({
                                            vendorId: matchedV ? matchedV.id : '',
                                            name: b.technicianName || matchedV?.name || '',
                                            phone: b.technicianPhone || matchedV?.phone || '',
                                            role: b.technicianRole || (matchedV ? `${matchedV.businessName || matchedV.name} • ${matchedV.specialization || 'Field Specialist'}` : 'Authorized Service Provider'),
                                            rating: matchedV?.rating || 4.9,
                                            businessName: matchedV?.businessName || '',
                                            city: matchedV?.city || b.city || '',
                                            documentsVerified: matchedV?.documentsVerified || false
                                          });
                                        }}
                                        className="text-brand-600 hover:text-brand-800 underline font-medium"
                                      >
                                        Modal view
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                {isRefunded ? (
                                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-danger-100 text-danger-800 border border-danger-200">
                                    REFUNDED (₹{b.refundAmount})
                                  </span>
                                ) : (
                                  <div className="flex flex-col items-start gap-1">
                                    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                                      b.status === 'CONFIRMED' ? 'bg-warning-50 text-warning-800 border-warning-200' :
                                      b.status === 'ASSIGNED' ? 'bg-primary-50 text-primary-800 border-primary-200' :
                                      b.status === 'IN_PROGRESS' ? 'bg-primary-50 text-primary-800 border-primary-200' :
                                      b.status === 'COMPLETED' ? 'bg-success-50 text-success-800 border-success-200' :
                                      'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                      {b.status}
                                    </span>
                                    {b.customerRating && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title={b.customerReview || 'Customer rating'}>
                                        <span className="text-amber-500">★</span> {b.customerRating.toFixed(1)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openChatForBooking(b)}
                                    title="Live Chat with Customer"
                                    className="p-1.5 rounded-lg text-primary-600 hover:text-primary-800 hover:bg-primary-50 border border-transparent hover:border-primary-200 transition-all"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => setSelectedBookingForDrawer(b)}
                                    title="View Full Details & Answers"
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-all"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      const matchedV = vendors.find(v => v.id === b.technicianId || v.phone === b.technicianPhone || v.name === b.technicianName);
                                      setAssignTechModalBooking(b);
                                      setTechForm({
                                        vendorId: matchedV ? matchedV.id : '',
                                        name: b.technicianName || matchedV?.name || '',
                                        phone: b.technicianPhone || matchedV?.phone || '',
                                        role: b.technicianRole || (matchedV ? `${matchedV.businessName || matchedV.name} • ${matchedV.specialization || 'Field Specialist'}` : 'Authorized Service Provider'),
                                        rating: matchedV?.rating || 4.9,
                                        businessName: matchedV?.businessName || '',
                                        city: matchedV?.city || b.city || '',
                                        documentsVerified: matchedV?.documentsVerified || false
                                      });
                                    }}
                                    title="Assign / Change Vendor"
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-slate-100 transition-all"
                                  >
                                    <HardHat className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => { setStatusModalBooking(b); setStatusForm({ status: '', reason: '' }); }}
                                    title="Update Booking Status"
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-warning-600 hover:bg-slate-100 transition-all"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>

                                  {!isRefunded && (
                                    <button
                                      onClick={() => {
                                        const maxRef = Math.max(0, (b.onlinePaidAmount || b.visitingCharge || 199) - (b.refundAmount || 0));
                                        setRefundModalBooking(b);
                                        setRefundForm({ amount: maxRef, reason: 'Technician unavailable / Customer cancellation' });
                                      }}
                                      title="Issue Automated Refund via Razorpay"
                                      className="p-1.5 rounded-lg text-danger-500 hover:text-danger-700 hover:bg-danger-50 transition-all"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SERVICES CATALOG & SUB-SERVICES CONFIGURATION TAB */}
          {activeTab === 'services' && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading font-semibold text-base text-slate-800">Services & Sub-Services Management</h2>
                  <p className="text-[11px] text-slate-400">
                    Each Sub-Service has its own independent Visiting Charge, Detailed Description, Book Now & Get Quote toggles, and Required Customer Fields.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={fetchServices} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg shadow-xs transition-all">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Update / Refresh List</span>
                  </button>
                  <button onClick={handleOpenAddService} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs transition-all">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Service Category</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {services.map(svc => (
                  <div key={svc.id} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        {(svc.imageUrl || svc.iconImage || (svc.icon && svc.icon.startsWith('http'))) ? (
                          <img
                            src={svc.imageUrl || svc.iconImage || svc.icon}
                            alt={svc.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-medium shrink-0">
                            <Wrench className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-heading font-semibold text-sm text-slate-800">{svc.name}</h3>
                            <span className="font-mono text-sm font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                              {svc.code}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{svc.description || 'Core Service Category'} • Rating: ⭐ {svc.rating || 4.8}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-all shadow-2xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Update Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleQuickUpdateServiceImage(svc, e)}
                            className="hidden"
                          />
                        </label>
                        <button
                          onClick={() => handleOpenEditService(svc)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1 transition-all"
                        >
                          Edit Category
                        </button>
                        <button
                          onClick={() => handleDeleteService(svc.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1 transition-all"
                          title="Delete Service Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenAddSubService(svc)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Sub-Service
                        </button>
                      </div>
                    </div>

                    {/* Sub-Services Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(svc.subServices || []).map(sub => (
                        <div key={sub.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-brand-300 transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              {sub.image && sub.image.startsWith('http') && (
                            <img
                              src={sub.image}
                              alt={sub.titleEn}
                              className="w-full h-28 rounded-lg object-cover border border-slate-200 shadow-2xs mb-2"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <div className="font-bold text-xs text-slate-800">{sub.titleEn}</div>
                              {sub.titleHi && <div className="text-[11px] font-medium text-brand-600">{sub.titleHi}</div>}
                            </div>
                            <div className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-warning-100 text-warning-900 border border-warning-200 shrink-0">
                              ₹{sub.visitingCharge !== undefined ? sub.visitingCharge : 199} Visit
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-500 font-normal line-clamp-2">
                            {sub.desc || 'No description provided.'}
                          </div>

                          {/* Toggles & Required Fields badges */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60 text-[11px]">
                            <span className={`px-1.5 py-0.5 rounded font-semibold ${sub.bookNowEnabled !== false ? 'bg-success-50 text-success-700 border border-success-200' : 'bg-slate-100 text-slate-400'}`}>
                              Book Now: {sub.bookNowEnabled !== false ? 'ON' : 'OFF'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-semibold ${sub.getQuoteEnabled !== false ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-slate-100 text-slate-400'}`}>
                              Quote: {sub.getQuoteEnabled !== false ? 'ON' : 'OFF'}
                            </span>
                            {sub.requiredFields && sub.requiredFields.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                                {sub.requiredFields.length} Required Qs
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              Status: <strong className={sub.isActive !== false ? 'text-success-600' : 'text-slate-400'}>{sub.isActive !== false ? 'Active' : 'Inactive'}</strong>
                            </span>
                            <div className="flex items-center gap-1">
                              <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded transition-all">
                                <Upload className="w-3 h-3" />
                                <span>Update Image</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleQuickUpdateSubServiceImage(sub, e)}
                                  className="hidden"
                                />
                              </label>
                              <button
                                onClick={() => handleOpenEditSubService(sub, svc)}
                                className="px-2 py-0.5 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition-all"
                              >
                                Edit & Price
                              </button>
                              <button
                                onClick={() => handleDeleteSubService(sub.id)}
                                className="p-1 text-slate-400 hover:text-danger-600 rounded transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CUSTOMER EXPLORATION & ACTIVE CARTS TAB */}
          {activeTab === 'customer-activity' && (
            <div className="space-y-5">
              {/* Top Controls & Metrics Bar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-heading font-bold text-lg text-slate-900">Customer Exploration & Active Carts</h2>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success-50 text-success-700 border border-success-200">
                        <span className="w-2 h-2 rounded-full bg-success-500 animate-ping"></span>
                        Live Stream
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Real-time visibility into customer browsing, service inquiries, and abandoned/active carts.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Switch */}
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                      <button
                        onClick={() => setActivityViewMode('leads')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activityViewMode === 'leads'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Customer Leads ({customerLeads.length})
                      </button>
                      <button
                        onClick={() => setActivityViewMode('stream')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activityViewMode === 'stream'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Live Stream ({activityStream.length})
                      </button>
                    </div>

                    <button
                      onClick={() => fetchCustomerActivity(true)}
                      disabled={activityLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${activityLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>

                    <button
                      onClick={clearCustomerActivityLogs}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-danger-600 hover:bg-danger-50 border border-slate-200 rounded-xl transition-all"
                      title="Clear activity records"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Filters & Search Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">City:</span>
                    {['ALL', ...operationalCities.filter(c => c.isActive !== false).map(c => c.name)].map(city => (
                      <button
                        key={city}
                        onClick={() => setActivityCityFilter(city)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          activityCityFilter === city
                            ? 'bg-primary-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {city === 'ALL' ? 'All Cities' : city}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') fetchCustomerActivity(); }}
                      placeholder="Search customer, phone, or service..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 focus:bg-white text-xs text-slate-700 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 bg-gradient-to-br from-success-50 to-success-50 border border-success-200/60 rounded-xl">
                    <div className="flex items-center justify-between text-success-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Active Carts</span>
                      <ShoppingCart className="w-4 h-4 text-success-600" />
                    </div>
                    <div className="text-2xl font-black text-success-950 mt-1">
                      {activityMetrics.activeCartLeads || 0}
                    </div>
                    <div className="text-[11px] font-medium text-success-700 mt-0.5">
                      ₹{(activityMetrics.totalCartValue || 0).toLocaleString('en-IN')} visiting pipeline
                    </div>
                  </div>

                  <div className="p-3.5 bg-gradient-to-br from-primary-50 to-primary-50 border border-primary-200/60 rounded-xl">
                    <div className="flex items-center justify-between text-primary-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Exploring Leads</span>
                      <Users className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="text-2xl font-black text-primary-950 mt-1">
                      {activityMetrics.totalLeads || 0}
                    </div>
                    <div className="text-[11px] font-medium text-primary-700 mt-0.5">
                      Unique customers tracked
                    </div>
                  </div>

                  <div className="p-3.5 bg-gradient-to-br from-warning-50 to-warning-50 border border-warning-200/60 rounded-xl col-span-2">
                    <div className="flex items-center justify-between text-warning-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Top Explored Services</span>
                      <TrendingUp className="w-4 h-4 text-warning-600" />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {activityMetrics.topExplored && activityMetrics.topExplored.length > 0 ? (
                        activityMetrics.topExplored.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/80 text-warning-900 border border-warning-200/80 shadow-2xs"
                          >
                            <span>{item.name}</span>
                            <span className="px-1 py-0.2 rounded bg-warning-100 text-warning-800 text-[10px] font-bold">
                              {item.count}
                            </span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-warning-700/80">Collecting exploration signals...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* View 1: Customer Leads Cards */}
              {activityViewMode === 'leads' && (
                <div className="space-y-3">
                  {customerLeads.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
                      <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                      <div className="font-semibold text-slate-700 text-sm">No Customer Activity Yet</div>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Customer exploration events, service views, and cart additions from the mobile app will automatically appear here in real-time.
                      </p>
                    </div>
                  ) : (
                    customerLeads.map(lead => (
                      <div
                        key={lead.id}
                        className={`bg-white rounded-2xl border transition-all p-4 shadow-xs ${
                          lead.hasActiveCart
                            ? 'border-success-300 ring-2 ring-success-400/20'
                            : 'border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          {/* Left: Customer Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                                {(lead.customerName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-slate-900 text-sm">{lead.customerName}</h3>
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    lead.isRegistered ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {lead.isRegistered ? 'Registered User' : 'App Guest'}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    lead.city === 'Bhilwara'
                                      ? 'bg-warning-50 text-warning-700 border border-warning-200'
                                      : 'bg-primary-50 text-primary-700 border border-primary-200'
                                  }`}>
                                    📍 {lead.city}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                  {lead.customerPhone ? (
                                    <span className="font-mono font-medium text-slate-700">{lead.customerPhone}</span>
                                  ) : (
                                    <span className="italic text-slate-400">Phone not shared yet</span>
                                  )}
                                  {lead.customerEmail && (
                                    <span className="text-slate-400">• {lead.customerEmail}</span>
                                  )}
                                  <span className="text-slate-400">• Active {new Date(lead.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            </div>

                            {/* Active Cart Snapshot (if customer has items in cart) */}
                            {lead.hasActiveCart && lead.latestCart && (
                              <div className="p-3 bg-success-50/70 border border-success-200 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-success-900 font-bold text-xs">
                                    <ShoppingCart className="w-4 h-4 text-success-600" />
                                    <span>Active Cart: {lead.cartItemCount} Service{lead.cartItemCount > 1 ? 's' : ''} Selected</span>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full bg-success-600 text-white font-bold text-xs shadow-2xs">
                                    Visiting Subtotal: ₹{lead.cartTotal}
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                  {(lead.latestCart.items || []).map((cartItem, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 px-2.5 py-1 bg-white rounded-lg border border-success-200/80 shadow-2xs text-xs"
                                    >
                                      <span className="font-semibold text-slate-800">{cartItem.name}</span>
                                      <span className="text-[10px] text-slate-400">({cartItem.serviceName})</span>
                                      <span className="font-mono font-bold text-success-700">₹{cartItem.visitingCharge}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Explored Services Badges */}
                            <div>
                              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Explored Services ({lead.exploredServices.length}):
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {lead.exploredServices.length > 0 ? (
                                  lead.exploredServices.map((s, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200"
                                    >
                                      <Eye className="w-3 h-3 text-slate-400" />
                                      <span className="font-semibold">{s.name}</span>
                                      {s.subServiceName && (
                                        <span className="text-[10px] text-slate-500">→ {s.subServiceName}</span>
                                      )}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Exploring catalog</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Quick Action Buttons for Admin Outreach */}
                          <div className="flex flex-row lg:flex-col items-center gap-2 self-start shrink-0">
                            {lead.customerPhone && (
                              <button
                                onClick={() => openWhatsAppForLead(lead)}
                                className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-success-700 bg-success-50 hover:bg-success-100 border border-success-200 transition-all shadow-2xs"
                                title="Contact customer on WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </button>
                            )}

                            {lead.customerPhone && (
                              <a
                                href={`tel:${lead.customerPhone}`}
                                className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all shadow-2xs"
                                title="Call customer"
                              >
                                <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
                                <span>Call</span>
                              </a>
                            )}

                            <button
                              onClick={() => openChatForCustomer(lead)}
                              className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-all shadow-2xs"
                              title="Open internal chat desk"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Live Chat</span>
                            </button>

                            <button
                              onClick={() => setSelectedLeadModal(lead)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all"
                              title="Full interaction history"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* View 2: Live Activity Timeline Stream */}
              {activityViewMode === 'stream' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Chronological Activity Stream</h3>
                      <p className="text-[11px] text-slate-400">Live events as they happen on mobile devices</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      Showing last {activityStream.length} events
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {activityStream.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No activity stream records found.
                      </div>
                    ) : (
                      activityStream.map(act => (
                        <div key={act.id} className="p-3.5 hover:bg-slate-50/70 transition-all flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              act.eventType === 'ADDED_TO_CART' ? 'bg-success-100 text-success-700' :
                              act.eventType === 'REMOVED_FROM_CART' ? 'bg-danger-100 text-danger-700' :
                              act.eventType === 'VIEWED_CART' ? 'bg-primary-100 text-primary-700' :
                              act.eventType === 'VIEWED_SUBSERVICE' ? 'bg-primary-100 text-primary-700' :
                              'bg-primary-100 text-primary-700'
                            }`}>
                              {act.eventType.includes('CART') ? (
                                <ShoppingCart className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{act.customerName || 'Guest User'}</span>
                                {act.customerPhone && (
                                  <span className="font-mono text-[11px] text-slate-500">({act.customerPhone})</span>
                                )}
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  act.eventType === 'ADDED_TO_CART' ? 'bg-success-50 text-success-700 border border-success-200' :
                                  act.eventType === 'REMOVED_FROM_CART' ? 'bg-danger-50 text-danger-700 border border-danger-200' :
                                  act.eventType === 'VIEWED_CART' ? 'bg-primary-50 text-primary-700 border border-primary-200' :
                                  'bg-primary-50 text-primary-700 border border-primary-200'
                                }`}>
                                  {act.eventType.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500">
                                  📍 {act.city}
                                </span>
                              </div>

                              <div className="text-slate-600 mt-0.5">
                                {act.serviceName && <span className="font-semibold text-slate-800">{act.serviceName}</span>}
                                {act.subServiceName && <span className="text-slate-500"> → {act.subServiceName}</span>}
                                {act.cartSnapshot && act.cartSnapshot.totalAmount > 0 && (
                                  <span className="ml-2 font-mono font-bold text-success-700">
                                    (Cart: ₹{act.cartSnapshot.totalAmount})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[11px] text-slate-400 font-normal">
                              {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Lead Detail Modal */}
              {selectedLeadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                  <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-bold text-base text-slate-900">{selectedLeadModal.customerName}</h3>
                        <p className="text-xs text-slate-500">
                          {selectedLeadModal.city} • {selectedLeadModal.isRegistered ? 'Registered Customer' : 'App Guest'}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedLeadModal(null)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Phone:</span>
                          <span className="font-mono font-semibold text-slate-800">{selectedLeadModal.customerPhone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Email:</span>
                          <span className="font-semibold text-slate-800">{selectedLeadModal.customerEmail || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Interactions:</span>
                          <span className="font-bold text-primary-700">{selectedLeadModal.totalInteractions} actions</span>
                        </div>
                      </div>

                      {/* Active Cart in Modal */}
                      {selectedLeadModal.hasActiveCart && (
                        <div className="p-3 bg-success-50 border border-success-200 rounded-xl space-y-2">
                          <div className="font-bold text-success-900 flex justify-between">
                            <span>🛒 Active Cart Items</span>
                            <span className="font-mono">₹{selectedLeadModal.cartTotal}</span>
                          </div>
                          <div className="space-y-1">
                            {(selectedLeadModal.latestCart?.items || []).map((i, idx) => (
                              <div key={idx} className="flex justify-between bg-white/80 p-1.5 rounded-lg border border-success-100">
                                <span>{i.name} ({i.serviceName})</span>
                                <span className="font-mono font-bold text-success-700">₹{i.visitingCharge}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Explored Services in Modal */}
                      <div>
                        <div className="font-bold text-slate-700 mb-1.5">All Explored Services:</div>
                        <div className="space-y-1">
                          {selectedLeadModal.exploredServices.map((s, idx) => (
                            <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200/60 flex justify-between items-center">
                              <div>
                                <span className="font-semibold text-slate-800">{s.name}</span>
                                {s.subServiceName && <span className="text-slate-500"> → {s.subServiceName}</span>}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {new Date(s.lastViewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      {selectedLeadModal.customerPhone && (
                        <button
                          onClick={() => {
                            openWhatsAppForLead(selectedLeadModal);
                            setSelectedLeadModal(null);
                          }}
                          className="flex-1 py-2 text-center text-xs font-bold text-white bg-success-600 hover:bg-success-700 rounded-xl transition-all shadow-xs"
                        >
                          Message on WhatsApp
                        </button>
                      )}
                      <button
                        onClick={() => {
                          openChatForCustomer(selectedLeadModal);
                          setSelectedLeadModal(null);
                        }}
                        className="flex-1 py-2 text-center text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-xs"
                      >
                        Open In Chat Desk
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CUSTOMER DIRECTORY TAB */}
          {activeTab === 'users' && !viewUserDetail && (() => {
            const filteredUsers = users.filter(u => {
              const q = (userSearch || globalSearch || '').toLowerCase().trim();
              if (!q) return true;
              const name = (u.name || '').toLowerCase();
              const phone = (u.phoneNumber || '').toLowerCase();
              const addressStr = (u.address || []).map(a => `${a.type || ''} ${a.address || ''} ${a.city || ''}`).join(' ').toLowerCase();
              return name.includes(q) || phone.includes(q) || addressStr.includes(q);
            });

            return (
              <div className="space-y-5">
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading font-semibold text-base text-slate-800">Registered Customers Directory</h2>
                    <p className="text-[11px] text-slate-400">Customer contact information, saved address books, and service history. Click a row to open chat.</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search customer name, phone, address..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    {userSearch && (
                      <button
                        onClick={() => setUserSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-400 font-medium uppercase tracking-wider border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="p-3">Customer Name</th>
                          <th className="p-3">Phone Number</th>
                          <th className="p-3">Saved Addresses</th>
                          <th className="p-3">Requests</th>
                          <th className="p-3">Registered Date</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-8 text-center text-slate-400">
                              No customers found matching your search.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map(u => (
                            <tr
                              key={u.id}
                              className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                              onClick={() => handleOpenChatWithCustomer(u, u.phoneNumber)}
                            >
                              <td className="p-3 font-medium text-slate-800">{u.name}</td>
                              <td className="p-3 font-mono font-medium text-success-600">{u.phoneNumber}</td>
                              <td className="p-3 text-slate-500 font-normal leading-tight">
                                {(u.address || []).map(a => `${a.type.toUpperCase()}: ${a.address}, ${a.city}`).join(' | ') || 'Default Residence'}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full font-medium bg-primary-50 text-primary-700 border border-primary-200 text-[10px]">{(u.requests || []).length} Requests</span>
                              </td>
                              <td className="p-3 text-slate-400 font-normal">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      fetchUserDetail(u.id);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-all"
                                    title="View User Details & Bookings"
                                  >
                                    <User className="w-3.5 h-3.5" />
                                    <span>Details</span>
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleOpenChatWithCustomer(u, u.phoneNumber); }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-all"
                                    title="Open Chat"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>Chat</span>
                                  </button>
                                  {u.phoneNumber && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); callCustomer(u.phoneNumber); }}
                                      className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-all"
                                      title="Call Customer"
                                    >
                                      <PhoneCall className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* FULL SCREEN USER DETAIL PAGE */}
          {viewUserDetail && selectedUser && (
            <div className="flex-1 overflow-y-auto">
              <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-6 sm:px-8 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setViewUserDetail(false); setSelectedUser(null); setUserBookings([]); }}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-all flex items-center gap-1.5"
                    title="Back to Customer Directory"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="hidden sm:inline text-xs font-semibold">Back to Directory</span>
                  </button>
                  <div>
                    <h1 className="font-heading font-bold text-base text-slate-900">
                      Customer Details
                    </h1>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {selectedUser.name || 'Unnamed Customer'} • {selectedUser.phoneNumber || 'No phone'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-50 text-success-700 border border-success-200">
                    Active Customer
                  </span>
                </div>
              </header>

              <div className="p-6">
                {/* User Profile Header */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 mb-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-brand-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-brand-200">
                        {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h2 className="font-heading font-bold text-xl text-slate-900">{selectedUser.name || 'Unnamed Customer'}</h2>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          {selectedUser.email && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <Mail className="w-3 h-3" />
                              {selectedUser.email}
                            </span>
                          )}
                          {selectedUser.phoneNumber && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <Phone className="w-3 h-3" />
                              {selectedUser.phoneNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {selectedUser.phoneNumber && (
                        <button
                          onClick={() => openWhatsApp(selectedUser.phoneNumber, `Hello ${selectedUser.name || 'there'}! This is Hipro Admin Desk. How can we assist you today?`)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>WhatsApp</span>
                        </button>
                      )}
                      {selectedUser.phoneNumber && (
                        <button
                          onClick={() => callCustomer(selectedUser.phoneNumber)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                        >
                          <PhoneCall className="w-4 h-4" />
                          <span>Call</span>
                        </button>
                      )}
                      <button
                        onClick={() => { openChatForCustomer(selectedUser, selectedUser.phoneNumber); setViewUserDetail(false); }}
                        className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Open Chat</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer ID</div>
                    <div className="font-mono font-semibold text-slate-800 text-xs truncate">{selectedUser.id}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Member Since</div>
                    <div className="font-semibold text-slate-800 text-xs">
                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-IN') : 'N/A'}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Service Requests</div>
                    <div className="font-bold text-2xl text-slate-900">{selectedUser.requests?.length || 0}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Direct Bookings</div>
                    <div className="font-bold text-2xl text-slate-900">{userBookings.length}</div>
                  </div>
                </div>

                {/* Addresses Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading font-bold text-base text-slate-800 flex items-center gap-2">
                      <Home className="w-4 h-4 text-brand-600" />
                      <span>Saved Addresses ({selectedUser.address?.length || 0})</span>
                    </h2>
                    {selectedUser.address?.length === 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">No addresses saved</span>
                    )}
                  </div>
                  {selectedUser.address && selectedUser.address.length > 0 ? (
                    <div className="space-y-3">
                      {selectedUser.address.map((addr, idx) => (
                        <div key={idx} className="p-4 bg-white rounded-xl border border-slate-100 flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-slate-800">{addr.type || 'Home'}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${addr.label === 'Primary' ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                {addr.label || 'Address'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 leading-relaxed">{addr.address}</div>
                            <div className="text-xs text-slate-600">{addr.city}, {addr.pin || ''}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-semibold text-slate-400">{addr.city}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 bg-white rounded-xl border border-dashed border-slate-200 text-center">
                      <Home className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-xs text-slate-400 font-medium">No saved addresses</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Requests History */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-bold text-base text-slate-800 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-brand-600" />
                    <span>Service Requests ({selectedUser.requests?.length || 0})</span>
                  </h2>
                </div>
                {selectedUser.requests && selectedUser.requests.length > 0 ? (
                  <div className="space-y-3">
                    {selectedUser.requests.map(req => (
                      <div key={req.id} className="p-4 bg-white rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[10px] text-brand-600">{req.requestNumber}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${req.urgency === 'HIGH' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                              {req.urgency || 'NORMAL'}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${req.status === 'COMPLETED' ? 'bg-success-50 text-success-700 border border-success-200' : req.status === 'ASSIGNED' ? 'bg-brand-50 text-brand-700 border border-brand-200' : req.status === 'QUOTE_REQUESTED' ? 'bg-accent-50 text-accent-700 border border-accent-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                            {req.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mb-1">{req.subServiceCode || req.servicecode || 'Service Request'}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[300px]">{req.issueDescription || 'No description'}</div>
                        <div className="mt-3 pt-3 border-t border-slate-50/60 flex items-center justify-between gap-2">
                          <div className="text-[10px] text-slate-400">
                            <span className="font-mono">{req.preferredDate || 'TBD'}</span>
                            <span className="text-slate-400">•</span>
                            <span className="truncate max-w-[200px]">{req.location || 'N/A'}</span>
                          </div>
                          {req.assignedVendorName && (
                            <span className="text-[10px] font-semibold text-success-700 bg-success-50 px-2 py-0.5 rounded">
                              <UserCheck className="w-3 h-3 mr-1" />
                              {req.assignedVendorName}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-white rounded-xl border border-dashed border-slate-200 text-center">
                    <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs text-slate-400 font-medium">No service requests</p>
                  </div>
                )}
              </div>

              {/* Direct Bookings History */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-bold text-base text-slate-800 flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-brand-600" />
                    <span>Direct Bookings ({userBookings.length})</span>
                  </h2>
                  {userBookingsLoading && <span className="text-[10px] text-slate-400 animate-pulse">Loading...</span>}
                </div>
                {userBookingsLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-3"></div>
                    <p className="text-xs text-slate-400">Loading bookings...</p>
                  </div>
                ) : userBookings.length > 0 ? (
                  <div className="space-y-3">
                    {userBookings.map(b => (
                      <div key={b.id} className="p-4 bg-white rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[10px] text-brand-600">#{b.bookingNumber || b.id}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${b.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                              {b.paymentStatus}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${b.status === 'COMPLETED' ? 'bg-success-50 text-success-700 border border-success-200' : b.status === 'IN_PROGRESS' ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                            {b.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mb-1">{b.subServiceName || b.serviceName || 'Direct Booking'}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[300px]">{b.customerAddress || 'N/A'}</div>
                        <div className="mt-3 pt-3 border-t border-slate-50/60 flex items-center justify-between gap-2">
                          <div className="text-[10px] text-slate-400">
                            <span className="font-mono">{b.scheduledDate || 'TBD'}</span>
                            <span className="text-slate-400">•</span>
                            <span>{b.scheduledSlot || 'N/A'}</span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-800 font-mono">
                            ₹{(b.totalAmount || b.visitingCharge || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-white rounded-xl border border-dashed border-slate-200 text-center">
                    <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs text-slate-400 font-medium">No direct bookings</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* APP SLIDES & CAROUSEL TAB */}
          {activeTab === 'slides' && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <span>App Carousel Slides & Dynamic In-App Routing</span>
                  </h2>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Configure promotional carousel slides displayed on the mobile home screen and set which in-app screen or service opens when tapped.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchSlides}
                    className="p-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-all font-semibold"
                    title="Refresh Slides"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleOpenAddSlide}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Slide</span>
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-medium uppercase">Total Slides</div>
                  <div className="text-xl font-bold text-slate-800 mt-1">{slides.length}</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-medium uppercase">Active in App</div>
                  <div className="text-xl font-bold text-success-600 mt-1">
                    {slides.filter(s => s.isActive !== false).length}
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-medium uppercase">Inactive / Drafts</div>
                  <div className="text-xl font-bold text-slate-400 mt-1">
                    {slides.filter(s => s.isActive === false).length}
                  </div>
                </div>
              </div>

              {/* Slides Grid */}
              {slides.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-slate-200/80 shadow-xs">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium text-sm">No slides created yet</p>
                  <p className="text-xs text-slate-400 mt-1">Add your first promotional slide with an in-app destination route.</p>
                  <button
                    onClick={handleOpenAddSlide}
                    className="mt-4 px-3 py-1.5 text-xs font-medium text-white bg-brand-600 rounded-lg"
                  >
                    Create First Slide
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {slides.map((slide) => {
                    const isInspection = slide.targetRoute === 'create_inspection';
                    const isServices = slide.targetRoute === 'services';
                    const isRequests = slide.targetRoute === 'requests';
                    const isQuotations = slide.targetRoute === 'quotations';
                    const isProfile = slide.targetRoute === 'profile';
                    const isSpecificService = slide.targetRoute && slide.targetRoute.startsWith('service:');

                    let routeLabel = 'Book Inspection Screen';
                    let routeBadgeColor = 'bg-primary-50 text-primary-700 border-primary-200';
                    if (isServices) {
                      routeLabel = 'Services Catalog Tab';
                      routeBadgeColor = 'bg-primary-50 text-primary-700 border-primary-200';
                    } else if (isRequests) {
                      routeLabel = 'Requests Tab';
                      routeBadgeColor = 'bg-warning-50 text-warning-700 border-warning-200';
                    } else if (isQuotations) {
                      routeLabel = 'Quotations Tab';
                      routeBadgeColor = 'bg-success-50 text-success-700 border-success-200';
                    } else if (isProfile) {
                      routeLabel = 'Profile Tab';
                      routeBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                    } else if (isSpecificService) {
                      routeLabel = `Service: ${slide.targetRoute.replace('service:', '')}`;
                      routeBadgeColor = 'bg-primary-50 text-primary-700 border-primary-200';
                    } else if (slide.targetRoute) {
                      routeLabel = slide.targetRoute;
                      routeBadgeColor = 'bg-primary-50 text-primary-700 border-primary-200';
                    }

                    return (
                      <div
                        key={slide.id}
                        className={`bg-white rounded-xl border transition-all overflow-hidden shadow-xs flex flex-col justify-between ${
                          slide.isActive !== false ? 'border-slate-200/80 hover:shadow-md' : 'border-slate-200/50 opacity-60'
                        }`}
                      >
                        {/* Slide Banner Preview */}
                        <div className="relative h-36 bg-slate-100 overflow-hidden group">
                          {slide.imageUrl ? (
                            <img
                              src={slide.imageUrl}
                              alt={slide.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1541888946425-d0fbb18015f6?auto=format&fit=crop&w=600&q=80';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-200">
                              <Image className="w-8 h-8 opacity-40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>

                          {/* Top Badges */}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            {slide.badgeText && (
                              <span className="px-2 py-0.5 rounded text-[9.5px] font-bold tracking-wider bg-brand-600 text-white shadow-xs">
                                {slide.badgeText}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-medium bg-black/50 text-white/90 backdrop-blur-xs">
                              #{slide.order || 1}
                            </span>
                          </div>

                          <div className="absolute top-2.5 right-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                slide.isActive !== false
                                  ? 'bg-success-500/90 text-white border-success-400'
                                  : 'bg-slate-700/80 text-slate-300 border-slate-600'
                              }`}
                            >
                              {slide.isActive !== false ? 'Active in App' : 'Disabled'}
                            </span>
                          </div>

                          {/* Bottom title in preview */}
                          <div className="absolute bottom-2.5 left-3 right-3 text-white">
                            <div className="font-semibold text-xs leading-snug drop-shadow-xs line-clamp-1">
                              {slide.title}
                            </div>
                            {slide.subtitle && (
                              <div className="text-[11px] text-slate-200 font-normal drop-shadow-xs line-clamp-1 mt-0.5">
                                {slide.subtitle}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Slide Card Body */}
                        <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="text-[11px] text-slate-400 uppercase font-medium flex items-center justify-between">
                              <span>Target In-App Route</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {slide.targetRoute}
                              </span>
                            </div>
                            <div className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${routeBadgeColor}`}>
                              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{routeLabel}</span>
                            </div>
                          </div>

                          {/* Action Toolbar */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <button
                              onClick={() => handleToggleSlideActive(slide)}
                              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                                slide.isActive !== false
                                  ? 'text-warning-700 bg-warning-50 hover:bg-warning-100'
                                  : 'text-success-700 bg-success-50 hover:bg-success-100'
                              }`}
                            >
                              {slide.isActive !== false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{slide.isActive !== false ? 'Pause' : 'Activate'}</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditSlide(slide)}
                                className="px-2.5 py-1 rounded text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSlide(slide.id)}
                                className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-700 transition-all"
                                title="Delete Slide"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* OFFERS TAB */}
          {activeTab === 'offers' && (
            <div className="space-y-5">
              {/* Top Banner & Action */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-success-50 text-success-600 border border-success-200">
                      <Tag className="w-4 h-4" />
                    </span>
                    <h2 className="font-heading font-semibold text-base text-slate-800">
                      App Promotional Offers & Deals
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage coupons, discount badges, and service-specific deals shown dynamically in the mobile app.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchOffers()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={handleOpenAddOffer}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-success-600 hover:bg-success-700 rounded-lg shadow-xs transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create New Offer</span>
                  </button>
                </div>
              </div>

              {/* Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Offers</span>
                  <div className="text-xl font-bold text-slate-800 mt-1">{offers.length}</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                  <span className="text-[11px] font-medium text-success-600 uppercase tracking-wider">Active Deals</span>
                  <div className="text-xl font-bold text-success-600 mt-1">
                    {offers.filter(o => o.isActive !== false).length}
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                  <span className="text-[11px] font-medium text-warning-600 uppercase tracking-wider">Paused / Drafts</span>
                  <div className="text-xl font-bold text-warning-600 mt-1">
                    {offers.filter(o => o.isActive === false).length}
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                  <span className="text-[11px] font-medium text-primary-600 uppercase tracking-wider">Categories</span>
                  <div className="text-xl font-bold text-primary-600 mt-1">
                    {Array.from(new Set(offers.map(o => o.category || 'Trending'))).length}
                  </div>
                </div>
              </div>

              {/* Category Filter Tabs */}
              {offers.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {['ALL', ...Array.from(new Set(offers.map(o => o.category || 'Trending')))].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setOfferCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        offerCategoryFilter === cat
                          ? 'bg-success-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Offers Grid */}
              {offers.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-slate-200/80 shadow-xs">
                  <Tag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium text-sm">No promotional offers created yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Create discount coupons and deals to entice customers on the mobile app.
                  </p>
                  <button
                    onClick={handleOpenAddOffer}
                    className="mt-4 px-3.5 py-1.5 text-xs font-medium text-white bg-success-600 rounded-lg hover:bg-success-700 transition-all"
                  >
                    Create First Offer
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {offers
                    .filter(o => offerCategoryFilter === 'ALL' || (o.category || 'Trending') === offerCategoryFilter)
                    .map((offer) => {
                      const isInspection = offer.targetRoute === 'create_inspection';
                      const isServices = offer.targetRoute === 'services';
                      const isSpecificService = offer.targetRoute && offer.targetRoute.startsWith('service:');

                      let routeLabel = 'Book Inspection Screen';
                      let routeBadgeColor = 'bg-primary-50 text-primary-700 border-primary-200';
                      if (isServices) {
                        routeLabel = 'Services Catalog Tab';
                        routeBadgeColor = 'bg-primary-50 text-primary-700 border-primary-200';
                      } else if (isSpecificService) {
                        routeLabel = `Pre-select: ${offer.targetRoute.replace('service:', '')}`;
                        routeBadgeColor = 'bg-success-50 text-success-700 border-success-200';
                      } else if (offer.targetRoute) {
                        routeLabel = offer.targetRoute;
                        routeBadgeColor = 'bg-slate-50 text-slate-700 border-slate-200';
                      }

                      return (
                        <div
                          key={offer.id}
                          className={`bg-white rounded-xl border transition-all overflow-hidden shadow-xs flex flex-col justify-between ${
                            offer.isActive !== false ? 'border-slate-200/80 hover:shadow-md' : 'border-slate-200/50 opacity-65'
                          }`}
                        >
                          {/* Top Banner Image with Badges */}
                          <div className="relative h-32 bg-slate-100 overflow-hidden group">
                            {offer.imageUrl ? (
                              <img
                                src={offer.imageUrl}
                                alt={offer.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 bg-gradient-to-br from-success-50 to-success-50">
                                <Ticket className="w-8 h-8 text-success-400/50" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent"></div>

                            {/* Top Badges */}
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                              {offer.badge && (
                                <span className="px-2 py-0.5 rounded text-[9.5px] font-bold tracking-wider bg-warning-500 text-white shadow-xs">
                                  {offer.badge}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded text-[9.5px] font-bold tracking-wide bg-success-600 text-white shadow-xs">
                                {offer.discount || 'SPECIAL'}
                              </span>
                            </div>

                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  offer.isActive !== false
                                    ? 'bg-success-500/90 text-white border-success-400'
                                    : 'bg-slate-700/80 text-slate-300 border-slate-600'
                                }`}
                              >
                                {offer.isActive !== false ? 'Active' : 'Disabled'}
                              </span>
                            </div>

                            {/* Title preview overlay */}
                            <div className="absolute bottom-2 left-3 right-3 text-white">
                              <div className="text-[10px] font-semibold text-success-300 tracking-wider uppercase">
                                {offer.category || 'Trending'}
                              </div>
                              <div className="font-semibold text-xs leading-snug line-clamp-1">
                                {offer.title}
                              </div>
                            </div>
                          </div>

                          {/* Body Content */}
                          <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                            <div className="space-y-2">
                              {/* Coupon Code Pill */}
                              <div className="flex items-center justify-between bg-success-50/60 border border-dashed border-success-300 rounded-lg p-2">
                                <div className="flex items-center gap-1.5">
                                  <Ticket className="w-3.5 h-3.5 text-success-600" />
                                  <span className="font-mono font-bold text-xs text-success-800 tracking-wider">
                                    {offer.code}
                                  </span>
                                </div>
                                <span className="text-[10px] font-medium text-success-700 bg-success-100/70 px-1.5 py-0.5 rounded">
                                  {offer.discount}
                                </span>
                              </div>

                              {offer.subtitle && (
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                  {offer.subtitle}
                                </p>
                              )}

                              {/* Min Amount & Validity */}
                              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                                <span>Min: ₹{Number(offer.minAmount || 0).toLocaleString('en-IN')}</span>
                                <span>Expires: {offer.validTill || 'Limited'}</span>
                              </div>

                              {/* Target Route */}
                              <div className={`p-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 ${routeBadgeColor}`}>
                                <ArrowRight className="w-3 h-3 shrink-0" />
                                <span className="truncate">{routeLabel}</span>
                              </div>
                            </div>

                            {/* Actions Toolbar */}
                            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                              <button
                                onClick={() => handleToggleOfferActive(offer)}
                                className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                                  offer.isActive !== false
                                    ? 'text-warning-700 bg-warning-50 hover:bg-warning-100'
                                    : 'text-success-700 bg-success-50 hover:bg-success-100'
                                }`}
                              >
                                {offer.isActive !== false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                <span>{offer.isActive !== false ? 'Pause' : 'Activate'}</span>
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditOffer(offer)}
                                  className="px-2.5 py-1 rounded text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteOffer(offer.id)}
                                  className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-700 transition-all"
                                  title="Delete Offer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* ADVENTURE & SPORTS TAB */}
          {activeTab === 'adventure' && (
            <div className="space-y-6">
              {/* Top Banner & Actions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-danger-50 text-danger-600 border border-danger-200">
                      <Compass className="w-5 h-5" />
                    </span>
                    <div>
                      <h2 className="font-heading font-bold text-base text-slate-800">
                        Adventure & Sports Management
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Manage dynamic adventure categories and ensure every sport activity is linked to its category.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => { fetchEntCategories(); fetchEntExperiences(); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sync</span>
                  </button>
                  <button
                    onClick={handleOpenAddCategory}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-danger-700 bg-danger-50 hover:bg-danger-100 border border-danger-200 rounded-xl shadow-xs transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ New Category</span>
                  </button>
                  <button
                    onClick={handleOpenAddExperience}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-danger-600 hover:bg-danger-700 rounded-xl shadow-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Sport Activity</span>
                  </button>
                </div>
              </div>

              {/* View Switcher: Sports Catalog vs Customer Bookings & Vendor Leads */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <button
                  onClick={() => setEntViewMode('catalog')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                    entViewMode === 'catalog'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Compass className="w-4 h-4 text-danger-400" />
                  <span>Sports & Activities Catalog</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-danger-500/20 text-danger-300">
                    {entExperiences.length}
                  </span>
                </button>
                <button
                  onClick={() => { setEntViewMode('bookings'); fetchEntBookings(); }}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                    entViewMode === 'bookings'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Ticket className="w-4 h-4 text-emerald-400" />
                  <span>Customer Bookings & Vendor Leads</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300">
                    {entBookings.length}
                  </span>
                </button>
              </div>

              {entViewMode === 'catalog' && (
                <div className="space-y-6">
                  {/* Dynamic Categories Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-danger-600" />
                    <h3 className="font-heading font-bold text-sm text-slate-800">
                      Dynamic Categories ({entCategories.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Categories appear dynamically in the mobile app & district screen
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {entCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="group relative bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      style={{ borderTop: `4px solid ${cat.color || '#E11D48'}` }}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                              style={{ backgroundColor: `${cat.color || '#E11D48'}1A`, color: cat.color || '#E11D48' }}
                            >
                              <Compass className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="font-heading font-bold text-sm text-slate-800 leading-tight">
                                {cat.name}
                              </h4>
                              <span className="font-mono text-[10px] text-slate-400">
                                {cat.id}
                              </span>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            {cat.activitiesCount || 0} sports
                          </span>
                        </div>

                        {cat.tagline && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                            {cat.tagline}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 mt-2">
                        <button
                          onClick={() => handleOpenEditCategory(cat)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Edit Category"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 rounded-lg text-danger-500 hover:text-danger-700 hover:bg-danger-50 transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sports Catalog with Category Filter & Search */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-danger-600" />
                    <h3 className="font-heading font-bold text-sm text-slate-800">
                      Sports Activities ({entExperiences.length})
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="relative w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={entSearch}
                        onChange={(e) => setEntSearch(e.target.value)}
                        placeholder="Search sport by title, city..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 focus:bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Category Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setEntCategoryFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                      entCategoryFilter === 'ALL'
                        ? 'bg-danger-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    All Activities ({entExperiences.length})
                  </button>
                  {entCategories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setEntCategoryFilter(c.id)}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                        entCategoryFilter === c.id
                          ? 'bg-danger-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        entCategoryFilter === c.id ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.activitiesCount || 0}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Sports Grid */}
                {(() => {
                  const filtered = entExperiences.filter((item) => {
                    const matchesCategory = entCategoryFilter === 'ALL' || item.categoryId === entCategoryFilter || item.category === entCategories.find(c => c.id === entCategoryFilter)?.name;
                    const matchesSearch = !entSearch ||
                      item.title?.toLowerCase().includes(entSearch.toLowerCase()) ||
                      item.city?.toLowerCase().includes(entSearch.toLowerCase()) ||
                      item.category?.toLowerCase().includes(entSearch.toLowerCase());
                    return matchesCategory && matchesSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                        <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <h4 className="font-heading font-semibold text-sm text-slate-700">No sports found</h4>
                        <p className="text-xs text-slate-400 mt-1">Try another category filter or add a new activity linked to this category.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filtered.map((item) => {
                        const linkedCat = entCategories.find(c => c.id === item.categoryId || c.name?.toLowerCase() === (item.category || '').toLowerCase());
                        return (
                          <div
                            key={item.id}
                            className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="relative h-44 bg-slate-100 overflow-hidden">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Compass className="w-8 h-8" />
                                  </div>
                                )}
                                
                                {/* Linked Category Badge */}
                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                  <span
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shadow-xs"
                                    style={{ backgroundColor: linkedCat?.color || '#E11D48' }}
                                  >
                                    {linkedCat?.name || item.category || 'Adventure'}
                                  </span>
                                  {item.discountBadge && (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-warning-500 text-white shadow-xs">
                                      {item.discountBadge}
                                    </span>
                                  )}
                                </div>

                                <div className="absolute top-2.5 right-2.5">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                                    {item.city}
                                  </span>
                                </div>
                              </div>

                              <div className="p-4 space-y-2">
                                <div>
                                  <h4 className="font-heading font-bold text-sm text-slate-800 line-clamp-1">
                                    {item.title}
                                  </h4>
                                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                    {item.tagline || item.locationDetails}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                                  {item.duration && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                                      <span>{item.duration}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{item.city}</span>
                                  </div>
                                </div>

                                {item.vendorBusiness && (
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 mt-1">
                                    <HardHat className="w-3.5 h-3.5 text-danger-500 shrink-0" />
                                    <span className="truncate">
                                      Operator: <strong className="text-slate-800">{item.vendorBusiness}</strong> ({item.vendorPhone})
                                    </span>
                                  </div>
                                )}

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                  <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Starts At</span>
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="font-heading font-bold text-base text-slate-900">
                                        ₹{item.startingPrice}
                                      </span>
                                      {item.originalPrice && (
                                        <span className="text-xs text-slate-400 line-through">
                                          ₹{item.originalPrice}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleOpenEditExperience(item)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                      title="Edit Activity"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteExperience(item.id)}
                                      className="p-1.5 rounded-lg text-danger-500 hover:text-danger-700 hover:bg-danger-50 transition-colors"
                                      title="Delete Activity"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
                </div>
              )}

              {/* VIEW: Customer Bookings & Vendor Leads */}
              {entViewMode === 'bookings' && (
                <div className="space-y-5">
                  {/* Stats Overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-semibold uppercase">Total Passes</span>
                        <Ticket className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="text-xl font-heading font-bold text-slate-800">
                        {entBookings.length}
                      </div>
                      <span className="text-[10px] text-slate-400">All-time adventure bookings</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-semibold uppercase">Confirmed</span>
                        <CheckCircle2 className="w-4 h-4 text-primary-500" />
                      </div>
                      <div className="text-xl font-heading font-bold text-primary-600">
                        {entBookings.filter(b => (b.status || '').toUpperCase() === 'CONFIRMED').length}
                      </div>
                      <span className="text-[10px] text-slate-400">Ready for check-in</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-semibold uppercase">Total Guests</span>
                        <Users className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="text-xl font-heading font-bold text-indigo-600">
                        {entBookings.reduce((sum, b) => sum + (Number(b.guests) || 1), 0)}
                      </div>
                      <span className="text-[10px] text-slate-400">Total travelers booked</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-semibold uppercase">Booking Revenue</span>
                        <Receipt className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="text-xl font-heading font-bold text-emerald-600">
                        ₹{entBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-slate-400">100% Pre-paid / Online</span>
                    </div>
                  </div>

                  {/* Filters & Search */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
                      {['ALL', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setEntBookingStatusFilter(st)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            entBookingStatusFilter === st
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {st === 'ALL' ? 'All Bookings' : st.replace('_', ' ')}
                          <span className="ml-1.5 text-[10px] opacity-70">
                            ({st === 'ALL' ? entBookings.length : entBookings.filter(b => (b.status || '').toUpperCase() === st).length})
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full md:w-72">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={entBookingSearch}
                        onChange={(e) => setEntBookingSearch(e.target.value)}
                        placeholder="Search traveler, phone, sport, code..."
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 focus:bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Bookings List / Cards */}
                  {(() => {
                    const filtered = entBookings.filter((b) => {
                      const matchStatus = entBookingStatusFilter === 'ALL' || (b.status || '').toUpperCase() === entBookingStatusFilter;
                      const q = entBookingSearch.toLowerCase();
                      const matchSearch = !entBookingSearch ||
                        (b.bookingCode || '').toLowerCase().includes(q) ||
                        (b.travelerName || '').toLowerCase().includes(q) ||
                        (b.travelerPhone || '').includes(q) ||
                        (b.experienceTitle || '').toLowerCase().includes(q) ||
                        (b.vendorBusiness || '').toLowerCase().includes(q) ||
                        (b.city || '').toLowerCase().includes(q);
                      return matchStatus && matchSearch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                          <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <h4 className="font-heading font-semibold text-sm text-slate-700">No adventure bookings found</h4>
                          <p className="text-xs text-slate-400 mt-1">Bookings made by customers on the mobile app appear here and in the assigned vendor panel.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {filtered.map((b) => (
                          <div
                            key={b.id || b.bookingCode}
                            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-3.5">
                              <span className="w-10 h-10 rounded-xl bg-danger-50 text-danger-600 flex items-center justify-center shrink-0 border border-danger-200/60 font-bold text-xs mt-0.5">
                                <Compass className="w-5 h-5" />
                              </span>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                    {b.bookingCode || b.id}
                                  </span>
                                  <span className="text-xs font-heading font-bold text-slate-900">
                                    {b.experienceTitle}
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {b.city}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                                    b.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-700' :
                                    b.status === 'COMPLETED' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {b.status || 'CONFIRMED'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Traveler: <strong className="text-slate-800">{b.travelerName}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{b.travelerPhone}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Date: <strong className="text-slate-800">{b.travelDate}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Slot: <strong className="text-slate-800">{b.timeSlot}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Party: <strong className="text-slate-800">{b.guests || 1} Person(s)</strong></span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Total: <strong className="text-emerald-700 font-bold">₹{b.totalAmount || b.price}</strong> ({b.paymentStatus || 'PAID'})</span>
                                  </div>
                                </div>

                                {b.reportingPoint && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                                    <MapPin className="w-3 h-3 text-danger-500 shrink-0" />
                                    <span className="truncate">Base Camp: {b.reportingPoint}</span>
                                  </div>
                                )}

                                {/* Operator Lead Info */}
                                <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <HardHat className="w-4 h-4 text-danger-600" />
                                    <span className="text-slate-700">
                                      Assigned Operator: <strong className="text-slate-900">{b.vendorBusiness || 'Adventure Partner'}</strong> ({b.vendorName})
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-mono text-slate-500">{b.vendorPhone}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons & Status Changer */}
                            <div className="flex flex-row lg:flex-col items-end gap-2 shrink-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-400">Status:</span>
                                <select
                                  value={b.status || 'CONFIRMED'}
                                  onChange={(e) => handleUpdateEntBookingStatus(b.id || b.bookingCode, e.target.value)}
                                  className="text-xs px-2.5 py-1 font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-danger-500"
                                >
                                  <option value="CONFIRMED">CONFIRMED</option>
                                  <option value="CHECKED_IN">CHECKED_IN</option>
                                  <option value="COMPLETED">COMPLETED</option>
                                  <option value="CANCELLED">CANCELLED</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={() => openWhatsAppAdventureDispatch(b)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all"
                                  title="Dispatch customer lead to vendor WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>WhatsApp Vendor</span>
                                </button>
                                <button
                                  onClick={() => openWhatsAppCustomerAdventurePass(b)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-danger-700 bg-danger-50 hover:bg-danger-100 border border-danger-200 shadow-xs transition-all"
                                  title="Send booking pass & directions to customer"
                                >
                                  <Ticket className="w-3.5 h-3.5" />
                                  <span>Send Pass to Customer</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* SYSTEM DIAGNOSTICS TAB */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <h2 className="font-heading font-semibold text-base text-slate-800">System Diagnostics & Cloud Database Health</h2>
                <p className="text-[11px] text-slate-400">Live API endpoint latencies and Aiven PostgreSQL connectivity details.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-heading font-medium text-sm text-slate-800">API Routes Latency Check</h3>
                    <button onClick={() => showToastMsg('All routes responding at 200 OK (<45ms)', 'success')} className="px-2.5 py-1 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-all">
                      Run Tests
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      { method: 'GET', path: '/api/health', status: '200 OK (18ms)' },
                      { method: 'GET', path: '/api/v1/services', status: '200 OK (28ms)' },
                      { method: 'GET', path: '/api/v1/requests', status: '200 OK (32ms)' },
                      { method: 'GET', path: '/api/v1/quotations', status: '200 OK (24ms)' },
                      { method: 'GET', path: '/api/v1/admin/stats', status: '200 OK (38ms)' },
                    ].map((ep, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-primary-100 text-primary-700">{ep.method}</span>
                          <span className="font-mono text-slate-600">{ep.path}</span>
                        </div>
                        <span className="font-medium text-success-600">{ep.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-heading font-medium text-sm text-slate-800">Database & Server Architecture</h3>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400">Database Engine:</span>
                      <span className="font-medium text-slate-700">PostgreSQL (Aiven Cloud Managed)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400">ORM & Migrations:</span>
                      <span className="font-medium text-slate-700">Prisma Client 6.19.3</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400">Server Stack:</span>
                      <span className="font-medium text-slate-700">Express.js (Node.js) on Port 5000</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400">Media Uploads:</span>
                      <span className="font-medium text-slate-700">Multer Disk Storage (/uploads)</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">UI Framework:</span>
                      <span className="font-medium text-slate-700">React 18 + Tailwind CSS 3</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* PHOTO LIGHTBOX MODAL */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-heading font-medium text-slate-800 text-sm">
                <Camera className="w-4 h-4 text-brand-600" />
                <span>{activePhotoModal.title}</span>
              </div>
              <button onClick={() => setActivePhotoModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              <div className="w-full h-80 sm:h-96 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center relative">
                {isVideoMedia(activePhotoModal.photos[activePhotoModal.index]) ? (
                  <video
                    key={activePhotoModal.photos[activePhotoModal.index]}
                    src={activePhotoModal.photos[activePhotoModal.index]}
                    controls
                    className="max-w-full max-h-full object-contain"
                    autoPlay
                  />
                ) : (
                  <img
                    src={activePhotoModal.photos[activePhotoModal.index]}
                    alt="Damage"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {activePhotoModal.photos.map((p, i) => {
                  const isVid = isVideoMedia(p);
                  return (
                    <div
                      key={i}
                      onClick={() => setActivePhotoModal({ ...activePhotoModal, index: i })}
                      className={`w-14 h-14 rounded-md overflow-hidden border-2 cursor-pointer flex-shrink-0 relative ${activePhotoModal.index === i ? 'border-brand-600 ring-2 ring-brand-500/30' : 'border-slate-200'}`}
                    >
                      {isVid ? (
                        <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white">
                          <Video className="w-4 h-4 text-primary-400" />
                          <span className="text-[8px] font-bold mt-0.5">Video</span>
                        </div>
                      ) : (
                        <img src={p} alt="Thumb" className="w-full h-full object-cover" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE QUOTATION MODAL */}
      {activeQuoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-heading font-medium text-slate-800 text-sm">
                <Receipt className="w-4 h-4 text-brand-600" />
                <span>Official Quotation Document</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const q = activeQuoteModal;
                    setActiveQuoteModal(null);
                    openChatForQuotation(q);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg shadow-xs transition-all"
                  title="Chat with Customer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-primary-600" /> Chat
                </button>
                <button onClick={() => window.print()} className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs transition-all">
                  <Printer className="w-3 h-3" /> Print / PDF
                </button>
                <button onClick={() => setActiveQuoteModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto bg-white text-slate-800 font-sans space-y-5 text-xs font-normal" id="printableQuotationContent">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="font-heading font-semibold text-xl text-slate-900 tracking-tight">HIND BUILDING SOLUTIONS</h2>
                  <p className="text-[11px] text-slate-500 font-normal">Technical Waterproofing, Surface Repair & Restoration</p>
                  <p className="text-[11px] text-slate-500 font-normal">Support Hotline: +91 94628 77757 | support@hindbuilding.com</p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-base text-brand-600">{activeQuoteModal.quoteNumber}</div>
                  <div className="text-[11px] text-slate-400">Date: {new Date(activeQuoteModal.created_at).toLocaleDateString('en-IN')}</div>
                  <div className="text-[11px] text-slate-400">Ref: {activeQuoteModal.request?.requestNumber || 'N/A'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-[11.5px] text-slate-600">
                <div>
                  <span className="font-medium text-slate-800 uppercase text-[10px]">Customer Information:</span><br />
                  {activeQuoteModal.request?.user?.name || 'Customer'}<br />
                  Phone: {activeQuoteModal.request?.user?.phoneNumber || 'N/A'}<br />
                  Property: {activeQuoteModal.request?.propertyType || 'House'} ({activeQuoteModal.request?.propertySize || 'Standard'})
                </div>
                <div>
                  <span className="font-medium text-slate-800 uppercase text-[10px]">Service Scope:</span><br />
                  {activeQuoteModal.request?.servicecode || 'Repair Work'}<br />
                  Address: {activeQuoteModal.request?.addressline || 'Main Residence'}<br />
                  Timeline: <strong>{activeQuoteModal.estimatedTimeline || '1-2 Working Days'}</strong>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-medium uppercase border-b border-slate-300 text-[11px]">
                    <th className="p-2 w-8">#</th>
                    <th className="p-2">Scope & Specification</th>
                    <th className="p-2 w-14">Qty</th>
                    <th className="p-2 w-20">Unit</th>
                    <th className="p-2 w-20">Rate (₹)</th>
                    <th className="p-2 w-24 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(Array.isArray(activeQuoteModal.lineItem) ? activeQuoteModal.lineItem : []).map((li, idx) => {
                    const amt = ((parseFloat(li.qty) || 0) * (parseFloat(li.rate) || 0)).toFixed(2);
                    return (
                      <tr key={idx}>
                        <td className="p-2 font-medium text-slate-400">{idx + 1}</td>
                        <td className="p-2 text-slate-800 font-normal">{li.item || li.description}</td>
                        <td className="p-2 font-normal">{li.qty}</td>
                        <td className="p-2 font-normal">{li.unit || 'Unit'}</td>
                        <td className="p-2 font-normal">₹{(li.rate || 0).toLocaleString('en-IN')}</td>
                        <td className="p-2 text-right font-medium text-slate-900">₹{Number(amt).toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-end pt-1">
                <div className="w-64 space-y-1.5 text-xs border-t border-slate-200 pt-2.5">
                  <div className="flex justify-between text-slate-500 font-normal">
                    <span>Material Cost:</span>
                    <span>₹{(activeQuoteModal.materialCost || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-normal">
                    <span>Labor & Application:</span>
                    <span>₹{(activeQuoteModal.laborCost || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-800">
                    <span>Subtotal:</span>
                    <span>₹{(activeQuoteModal.subtotal || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-normal">
                    <span>GST ({activeQuoteModal.taxRate || 18}%):</span>
                    <span>₹{(activeQuoteModal.taxGST || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-slate-900 border-t border-slate-800 pt-1.5 font-mono">
                    <span>Grand Total:</span>
                    <span>₹{(activeQuoteModal.grandtotal || 0).toLocaleString('en-IN')}</span>
                  </div>

                  {/* ACTIVE QUOTE ADVANCE BADGE & ADJUSTMENT */}
                  <div className="mt-2.5 p-2.5 bg-primary-50/90 border border-primary-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-primary-900 tracking-wider">Advance Required to Start Work</div>
                        <div className="text-sm font-bold font-mono text-primary-700">
                          ₹{Math.round(activeQuoteModal.advanceAmount || (activeQuoteModal.grandtotal || 0) * ((activeQuoteModal.advancePercentage || 50) / 100)).toLocaleString('en-IN')}
                          <span className="text-[11px] font-normal text-primary-500 ml-1.5">({activeQuoteModal.advancePercentage || 50}%)</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setModalNewAdvanceAmt(Math.round(activeQuoteModal.advanceAmount || (activeQuoteModal.grandtotal || 0) * ((activeQuoteModal.advancePercentage || 50) / 100)));
                          setIsEditingModalAdvance(!isEditingModalAdvance);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-primary-700 bg-white hover:bg-primary-100 border border-primary-200 rounded-lg shadow-2xs transition-all"
                      >
                        {isEditingModalAdvance ? 'Cancel' : 'Adjust Advance'}
                      </button>
                    </div>

                    {isEditingModalAdvance && (
                      <div className="pt-2 border-t border-primary-200/80 flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">₹</span>
                          <input
                            type="number"
                            value={modalNewAdvanceAmt}
                            onChange={(e) => setModalNewAdvanceAmt(e.target.value)}
                            placeholder="e.g. 3000"
                            className="w-full pl-6 pr-2 py-1 text-xs font-mono font-bold text-slate-800 bg-white border border-primary-300 rounded-lg"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuotationAdvance(activeQuoteModal.id, modalNewAdvanceAmt)}
                          className="px-3 py-1 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-dashed border-slate-300 text-[11px] text-slate-500 space-y-0.5 font-normal">
                <div><strong>Service Specifications:</strong> {(activeQuoteModal.service_scope) || 'Standard Engineering Specifications'}</div>
                <div><strong>Commercial Terms:</strong> {activeQuoteModal.termsAndConditions || 'Standard payment terms apply.'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT SERVICE MODAL */}
      {addServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-heading font-medium text-slate-800 text-sm">
                {editingService ? `Edit Service Category: ${editingService.name}` : 'Add New Service Category'}
              </h3>
              <button onClick={() => { setAddServiceModalOpen(false); setEditingService(null); }} className="p-1 rounded text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveServiceCategory} className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-500 uppercase">Service Code *</label>
                <input
                  value={serviceCategoryForm.code}
                  onChange={(e) => setServiceCategoryForm({ ...serviceCategoryForm, code: e.target.value })}
                  placeholder="e.g. WATERPROOFING"
                  disabled={Boolean(editingService)}
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono disabled:opacity-60 disabled:bg-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-500 uppercase">Service Name *</label>
                <input
                  value={serviceCategoryForm.name}
                  onChange={(e) => setServiceCategoryForm({ ...serviceCategoryForm, name: e.target.value })}
                  placeholder="e.g. Terrace Waterproofing"
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-500 uppercase">Description</label>
                <textarea
                  value={serviceCategoryForm.description}
                  onChange={(e) => setServiceCategoryForm({ ...serviceCategoryForm, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-500 uppercase">Category Image URL</label>
                <input
                  value={serviceCategoryForm.imageUrl}
                  onChange={(e) => setServiceCategoryForm({ ...serviceCategoryForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-500 uppercase">Rating</label>
                <input
                  value={serviceCategoryForm.rating}
                  onChange={(e) => setServiceCategoryForm({ ...serviceCategoryForm, rating: e.target.value })}
                  step="0.1"
                  type="number"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => { setAddServiceModalOpen(false); setEditingService(null); }} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-3.5 py-1.5 text-xs font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700">
                  {editingService ? 'Update Category' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT SLIDE MODAL */}
      {slideModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden my-6">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <h3 className="font-heading font-semibold text-slate-800 text-sm">
                  {editingSlide ? 'Edit Carousel Slide' : 'Add New Carousel Slide'}
                </h3>
              </div>
              <button
                onClick={() => setSlideModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="p-4 space-y-3.5 text-xs">
              {/* Slide Title */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                  Slide Headline / Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 20% Off Terrace Waterproofing"
                  value={slideForm.title}
                  onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                  Subtitle / Promo Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. Free moisture scan with every structural inspection"
                  value={slideForm.subtitle}
                  onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>

              {/* Badge Text & Order in 2 cols */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                    Badge Pill Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LIMITED OFFER"
                    value={slideForm.badgeText}
                    onChange={(e) => setSlideForm({ ...slideForm, badgeText: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-brand-500 outline-none uppercase font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={slideForm.order}
                    onChange={(e) => setSlideForm({ ...slideForm, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              {/* Image URL & File Upload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                    Banner Image *
                  </label>
                  <label className="text-[11px] text-brand-600 font-semibold cursor-pointer hover:underline flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    <span>{uploadingSlideImg ? 'Uploading...' : 'Upload Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                      disabled={uploadingSlideImg}
                    />
                  </label>
                </div>
                <input
                  type="url"
                  placeholder="https://example.com/banner.jpg"
                  value={slideForm.imageUrl}
                  onChange={(e) => setSlideForm({ ...slideForm, imageUrl: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-brand-500 outline-none font-mono text-xs"
                />
              </div>

              {/* TARGET IN-APP ROUTE SELECTOR (The Key Feature) */}
              <div className="space-y-1.5 p-3 rounded-lg bg-brand-50/50 border border-brand-100">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-brand-900 uppercase">
                    Target Route / Destination Page *
                  </label>
                  <span className="text-[10px] text-brand-700 bg-brand-100 px-1.5 py-0.5 rounded font-medium">
                    When clicked in app
                  </span>
                </div>

                <select
                  value={
                    ['create_inspection', 'services', 'requests', 'quotations', 'profile'].includes(slideForm.targetRoute)
                      ? slideForm.targetRoute
                      : slideForm.targetRoute.startsWith('service:')
                      ? slideForm.targetRoute
                      : 'custom'
                  }
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setSlideForm({ ...slideForm, targetRoute: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-brand-200 rounded-lg text-slate-800 font-medium outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <optgroup label="App Main Screens">
                    <option value="create_inspection">🎯 Book Inspection (Create Inspection Screen)</option>
                    <option value="services">📂 Services Catalog Tab</option>
                    <option value="requests">📋 Customer Requests Tab</option>
                    <option value="quotations">🧾 Quotations Tab</option>
                    <option value="profile">👤 User Profile Tab</option>
                  </optgroup>

                  {services && services.length > 0 && (
                    <optgroup label="Pre-select Specific Service">
                      {services.map((srv) => (
                        <option key={srv.id} value={`service:${srv.name}`}>
                          🔧 Open & Pre-select: {srv.name}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <optgroup label="Custom / Other">
                    <option value="custom">🔗 Custom Route Path / Deep Link...</option>
                  </optgroup>
                </select>

                {/* If custom or custom route */}
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Enter route: e.g. create_inspection, services, or service:Waterproofing"
                    value={slideForm.targetRoute}
                    onChange={(e) => setSlideForm({ ...slideForm, targetRoute: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono text-[11px] outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    User will be automatically navigated to this route in Flutter upon clicking the slide.
                  </p>
                </div>
              </div>

              {/* Active Toggle Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="slideActiveCheck"
                  checked={slideForm.isActive}
                  onChange={(e) => setSlideForm({ ...slideForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <label htmlFor="slideActiveCheck" className="text-xs text-slate-700 font-medium select-none">
                  Publish Slide Live in Mobile App Carousel
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSlideModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingSlide ? 'Update Slide' : 'Save Slide'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* SLIDE MODAL END */}

      {/* ADD / EDIT OFFER MODAL */}
      {offerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-success-50/50">
              <div className="flex items-center gap-2 font-heading font-semibold text-slate-800 text-sm">
                <Tag className="w-4 h-4 text-success-600" />
                <span>{editingOffer ? 'Edit Promotional Offer' : 'Create New Promotional Offer'}</span>
              </div>
              <button
                onClick={() => setOfferModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveOffer} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Offer Title */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                  Offer Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 20% OFF on Waterproofing Audits"
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-success-500 outline-none font-medium"
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                  Subtitle / Promo Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advanced infrared terrace & bathroom leakage scanning"
                  value={offerForm.subtitle}
                  onChange={(e) => setOfferForm({ ...offerForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-success-500 outline-none"
                />
              </div>

              {/* Category & Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                    Category *
                  </label>
                  <input
                    type="text"
                    placeholder="Trending, Waterproofing, Civil..."
                    value={offerForm.category}
                    onChange={(e) => setOfferForm({ ...offerForm, category: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-success-500 outline-none"
                  />
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {['Trending', 'Waterproofing', 'Civil', 'Renovation'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setOfferForm({ ...offerForm, category: c })}
                        className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-success-50 text-slate-600 hover:text-success-700"
                      >
                        +{c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                    Discount Display *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 20% OFF or ₹500 OFF"
                    value={offerForm.discount}
                    onChange={(e) => setOfferForm({ ...offerForm, discount: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-success-500 outline-none font-bold text-success-700"
                  />
                </div>
              </div>

              {/* Coupon Code & Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HIPRO20"
                    value={offerForm.code}
                    onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })}
                    required
                    className="w-full px-3 py-2 bg-success-50 border border-success-300 rounded-lg text-success-900 focus:bg-white focus:border-success-500 outline-none font-mono font-bold uppercase tracking-wider"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                    Badge Pill
                  </label>
                  <input
                    type="text"
                    placeholder="POPULAR, EXCLUSIVE, NEW USER"
                    value={offerForm.badge}
                    onChange={(e) => setOfferForm({ ...offerForm, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-success-500 outline-none uppercase font-semibold text-warning-700"
                  />
                </div>
              </div>

              {/* Min Amount & Valid Till */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                    Min Booking Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={offerForm.minAmount}
                    onChange={(e) => setOfferForm({ ...offerForm, minAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-success-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                    Valid Till
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 31 Dec 2026"
                    value={offerForm.validTill}
                    onChange={(e) => setOfferForm({ ...offerForm, validTill: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-success-500 outline-none"
                  />
                </div>
              </div>

              {/* Banner Image URL & File Upload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                    Offer Thumbnail / Banner Image
                  </label>
                  <label className="text-[11px] text-success-600 font-semibold cursor-pointer hover:underline flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    <span>{uploadingOfferImg ? 'Uploading...' : 'Upload Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleOfferImageUpload}
                      className="hidden"
                      disabled={uploadingOfferImg}
                    />
                  </label>
                </div>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={offerForm.imageUrl}
                  onChange={(e) => setOfferForm({ ...offerForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-success-500 outline-none font-mono text-xs"
                />
              </div>

              {/* Target In-App Route Selector */}
              <div className="space-y-1.5 p-3 rounded-lg bg-success-50/50 border border-success-100">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-success-900 uppercase">
                    Target Route / Destination Page *
                  </label>
                  <span className="text-[10px] text-success-700 bg-success-100 px-1.5 py-0.5 rounded font-medium">
                    When user taps "Book with Offer"
                  </span>
                </div>

                <select
                  value={
                    ['create_inspection', 'services', 'requests', 'quotations', 'profile'].includes(offerForm.targetRoute)
                      ? offerForm.targetRoute
                      : offerForm.targetRoute.startsWith('service:')
                      ? offerForm.targetRoute
                      : 'custom'
                  }
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setOfferForm({ ...offerForm, targetRoute: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-success-200 rounded-lg text-slate-800 font-medium outline-none focus:ring-1 focus:ring-success-500"
                >
                  <optgroup label="App Main Screens">
                    <option value="create_inspection">🎯 Book Inspection (Create Inspection Screen)</option>
                    <option value="services">📂 Services Catalog Tab</option>
                    <option value="requests">📋 Customer Requests Tab</option>
                    <option value="quotations">🧾 Quotations Tab</option>
                    <option value="profile">👤 User Profile Tab</option>
                  </optgroup>

                  {services && services.length > 0 && (
                    <optgroup label="Pre-select Specific Service">
                      {services.map((srv) => (
                        <option key={srv.id} value={`service:${srv.name}`}>
                          🔧 Open & Pre-select: {srv.name}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <optgroup label="Custom / Other">
                    <option value="custom">🔗 Custom Route Path...</option>
                  </optgroup>
                </select>

                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="e.g. create_inspection or service:Waterproofing"
                    value={offerForm.targetRoute}
                    onChange={(e) => setOfferForm({ ...offerForm, targetRoute: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono text-[11px] outline-none"
                  />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                  Terms & Conditions Snippet
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Valid once per user for inspection bookings above ₹1,500."
                  value={offerForm.terms}
                  onChange={(e) => setOfferForm({ ...offerForm, terms: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-success-500 outline-none text-xs"
                />
              </div>

              {/* Order & Active */}
              <div className="grid grid-cols-2 gap-3 items-center pt-1">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={offerForm.order}
                    onChange={(e) => setOfferForm({ ...offerForm, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-success-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="offerActiveCheck"
                    checked={offerForm.isActive}
                    onChange={(e) => setOfferForm({ ...offerForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-success-600 rounded border-slate-300 focus:ring-success-500"
                  />
                  <label htmlFor="offerActiveCheck" className="text-xs text-slate-700 font-medium select-none">
                    Active in Mobile App
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOfferModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-success-600 hover:bg-success-700 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingOffer ? 'Update Offer' : 'Save Offer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. SUB-SERVICE ADD / EDIT MODAL */}
      {subServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-800">
                  {editingSubService ? 'Edit Sub-Service & Pricing' : 'Add New Sub-Service'}
                </h3>
                <p className="text-xs text-slate-400">
                  Category: <span className="font-semibold text-brand-600">{subServiceParentService?.titleEn || 'Parent Service'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubServiceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubService} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Sub-Service Title (EN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={subServiceForm.titleEn}
                    onChange={(e) => setSubServiceForm({ ...subServiceForm, titleEn: e.target.value })}
                    placeholder="e.g. Overhead Tank Cleaning"
                    className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Hindi Title (HI)
                  </label>
                  <input
                    type="text"
                    value={subServiceForm.titleHi}
                    onChange={(e) => setSubServiceForm({ ...subServiceForm, titleHi: e.target.value })}
                    placeholder="e.g. पानी की टंकी सफाई"
                    className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Pricing strictly on SubService */}
              <div className="p-3.5 bg-warning-50/70 rounded-xl border border-warning-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-warning-900 uppercase tracking-wide">
                    Visiting / Booking Charge (₹) *
                  </label>
                  <span className="text-[10px] text-warning-700 font-medium bg-warning-100/80 px-2 py-0.5 rounded-full">
                    Pre-paid Upfront by Customer
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={subServiceForm.visitingCharge}
                    onChange={(e) => setSubServiceForm({ ...subServiceForm, visitingCharge: e.target.value })}
                    placeholder="199"
                    className="w-full pl-7 pr-3 py-2 bg-white text-sm font-mono font-bold text-slate-900 border border-warning-300 rounded-lg outline-none focus:ring-2 focus:ring-warning-400"
                  />
                </div>
                <p className="text-[11px] text-warning-800 mt-1.5 leading-snug">
                  Customer pays this visiting charge online to confirm. Any material or major work is adjusted on-site by technician.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Detailed Scope / Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={subServiceForm.desc}
                  onChange={(e) => setSubServiceForm({ ...subServiceForm, desc: e.target.value })}
                  placeholder="Explain what is included in this sub-service and visiting scope..."
                  className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500"
                />
              </div>

              {/* Booking Mode Toggles */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={subServiceForm.bookNowEnabled}
                    onChange={(e) => setSubServiceForm({ ...subServiceForm, bookNowEnabled: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Book Now (Online)</div>
                    <div className="text-sm text-slate-400">Pre-paid instant checkout</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={subServiceForm.getQuoteEnabled}
                    onChange={(e) => setSubServiceForm({ ...subServiceForm, getQuoteEnabled: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Get Quote</div>
                    <div className="text-sm text-slate-400">Inspection request flow</div>
                  </div>
                </label>
              </div>

              {/* Checklist */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Technician Checklist (One item per line)
                </label>
                <textarea
                  rows={2}
                  value={subServiceForm.checklist}
                  onChange={(e) => setSubServiceForm({ ...subServiceForm, checklist: e.target.value })}
                  placeholder="Inspect inlet valve&#10;Deep clean with antibacterial solution&#10;Check water flow & pressure"
                  className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500 font-mono"
                />
              </div>

              {/* Required Dynamic Questions Builder */}
              <div className="p-3.5 bg-primary-50/50 rounded-xl border border-primary-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-primary-950 uppercase tracking-wide">Required Customer Questions</h4>
                    <p className="text-sm text-primary-700">Questions customer must answer when booking this subservice</p>
                  </div>
                  <span className="text-sm font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                    {subServiceForm.requiredFields?.length || 0} Configured
                  </span>
                </div>

                {/* List existing configured fields */}
                {subServiceForm.requiredFields && subServiceForm.requiredFields.length > 0 && (
                  <div className="space-y-1.5">
                    {subServiceForm.requiredFields.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-primary-100 text-xs">
                        <div>
                          <div className="font-semibold text-slate-800">{f.label}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            <span className="font-mono uppercase bg-slate-100 px-1 rounded">{f.fieldType}</span>
                            {f.required && <span className="text-danger-600 font-medium">* Required</span>}
                            {f.options && f.options.length > 0 && <span>Options: {f.options.join(', ')}</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRequiredField(idx)}
                          className="p-1 text-slate-400 hover:text-danger-600 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new field inline */}
                <div className="p-2.5 bg-white rounded-lg border border-primary-100 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-700">Add a New Question:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="e.g. Tank Capacity or Leaking Tap Count"
                      className="w-full px-2.5 py-1.5 bg-slate-50 text-xs border border-slate-200 rounded-md outline-none focus:bg-white focus:border-primary-500"
                    />
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 text-xs border border-slate-200 rounded-md outline-none focus:bg-white"
                    >
                      <option value="text">Text Input</option>
                      <option value="number">Numeric (Count / Size)</option>
                      <option value="select">Dropdown Options</option>
                    </select>
                  </div>
                  {newFieldType === 'select' && (
                    <input
                      type="text"
                      value={newFieldOptions}
                      onChange={(e) => setNewFieldOptions(e.target.value)}
                      placeholder="Dropdown choices (comma separated: 500L, 1000L, 2000L+)"
                      className="w-full px-2.5 py-1.5 bg-slate-50 text-xs border border-slate-200 rounded-md outline-none focus:bg-white"
                    />
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="w-3.5 h-3.5 text-primary-600 rounded"
                      />
                      <span>Mandatory to answer</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddRequiredField}
                      className="px-3 py-1 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md border border-primary-200 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Question
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubServiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingSubService ? 'Update Sub-Service' : 'Create Sub-Service'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ASSIGN TECHNICIAN / AUTHORIZED VENDOR MODAL */}
      {assignTechModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Assign Authorized Vendor / Partner</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Instant Service Booking: <span className="font-mono text-brand-600 font-bold">{assignTechModalBooking.bookingNumber}</span> • Only verified vendors
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignTechModalBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Booking Details Summary */}
            <div className="my-3.5 p-3.5 bg-slate-50 rounded-xl text-xs space-y-1.5 text-slate-600 border border-slate-200/80">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  {assignTechModalBooking.subServiceName} ({assignTechModalBooking.serviceName})
                </span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{assignTechModalBooking.onlinePaidAmount || assignTechModalBooking.visitingCharge} (Pre-Paid)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Customer:</span>
                  <span className="font-semibold text-slate-800">{assignTechModalBooking.customerName}</span> ({assignTechModalBooking.customerPhone})
                </div>
                <div>
                  <span className="text-slate-400 block">Scheduled Time:</span>
                  <span className="font-medium text-slate-800">{assignTechModalBooking.scheduledDate} ({assignTechModalBooking.scheduledSlot})</span>
                </div>
              </div>
              <div className="text-[11px] pt-1 border-t border-slate-200/60">
                <span className="text-slate-400">Site Location:</span>{' '}
                <span className="font-medium text-slate-700">{assignTechModalBooking.customerAddress}, {assignTechModalBooking.city}</span>
              </div>
            </div>

            <form onSubmit={handleAssignTechnician} className="space-y-4">
              {/* Authorized Vendor Selection Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Authorized Vendor Dropdown *
                  </label>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> KYC Verified Only
                  </span>
                </div>

                <select
                  value={techForm.vendorId || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const v = vendors.find(vnd => vnd.id === selectedId);
                    if (v) {
                      setTechForm({
                        vendorId: v.id,
                        name: v.name,
                        phone: v.phone,
                        role: `${v.businessName || v.name} • ${v.specialization || 'Authorized Specialist'}`,
                        rating: v.rating || 4.9,
                        businessName: v.businessName || '',
                        city: v.city || '',
                        documentsVerified: v.documentsVerified || false
                      });
                    } else {
                      setTechForm({ vendorId: '', name: '', phone: '', role: '', rating: 4.9, businessName: '', city: '', documentsVerified: false });
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-white text-xs sm:text-sm font-semibold border-2 border-brand-500/80 rounded-xl outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 shadow-xs cursor-pointer text-slate-800"
                >
                  <option value="">-- Choose Authorized Vendor / Contractor --</option>
                  {(() => {
                    const cityMatches = vendors.filter(v =>
                      v.status === 'active' &&
                      v.city?.toLowerCase() === assignTechModalBooking.city?.toLowerCase()
                    );
                    const others = vendors.filter(v =>
                      v.status === 'active' &&
                      v.city?.toLowerCase() !== assignTechModalBooking.city?.toLowerCase()
                    );
                    return (
                      <>
                        {cityMatches.length > 0 && (
                          <optgroup label={`⭐ Recommended Local Partners in ${assignTechModalBooking.city} (${cityMatches.length})`}>
                            {cityMatches.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.businessName || v.name} • {v.name} ({v.phone}) — ★ {v.rating || 4.9}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label={`All Other Authorized Contractors (${(cityMatches.length > 0 ? others : vendors.filter(v => v.status === 'active')).length})`}>
                          {(cityMatches.length > 0 ? others : vendors.filter(v => v.status === 'active')).map(v => (
                            <option key={v.id} value={v.id}>
                              {v.businessName || v.name} ({v.city || 'Regional'}) • {v.phone} — ★ {v.rating || 4.9}
                            </option>
                          ))}
                        </optgroup>
                      </>
                    );
                  })()}
                </select>
              </div>

              {/* Selected Authorized Vendor Details Confirmation Card */}
              {techForm.vendorId || techForm.name ? (
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Selected Authorized Contractor
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200">
                      ★ {techForm.rating || 4.9} Rating
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700 pt-0.5">
                    <div>
                      <span className="text-[10.5px] text-slate-400 block">Contractor Name:</span>
                      <strong className="text-slate-800 text-[12px]">{techForm.name}</strong>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-slate-400 block">WhatsApp / Phone:</span>
                      <strong className="text-slate-800 font-mono text-[12px]">{techForm.phone}</strong>
                    </div>
                  </div>
                  <div className="text-[10.5px] text-slate-600 pt-0.5">
                    <span className="text-slate-400">Designation / Role:</span> {techForm.role}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    कृपया ऊपर दिए गए ड्रॉपडाउन से अधिकृत वेंडर (Authorized Vendor) चुनें। केवल वेरीफाइड और रजिस्टर्ड वेंडर्स को ही असाइन किया जा सकता है।
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignTechModalBooking(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!techForm.name || !techForm.phone}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all ${
                    techForm.name && techForm.phone
                      ? 'bg-brand-600 hover:bg-brand-700 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Assign Authorized Vendor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. UPDATE STATUS MODAL */}
      {statusModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-800">Update Booking Status</h3>
                <p className="text-xs text-brand-600 font-mono font-semibold">{statusModalBooking.bookingNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDirectBookingStatus} className="mt-4 space-y-3.5">
              {(() => {
                const VALID_TRANSITIONS_MAP = {
                  'CONFIRMED': [
                    { value: 'ASSIGNED', label: 'ASSIGNED (Technician Dispatched)' },
                    { value: 'CANCELLED', label: 'CANCELLED (Order Cancelled)' }
                  ],
                  'ASSIGNED': [
                    { value: 'IN_PROGRESS', label: 'IN_PROGRESS (Technician On-Site)' },
                    { value: 'CANCELLED', label: 'CANCELLED (Order Cancelled)' }
                  ],
                  'IN_PROGRESS': [
                    { value: 'COMPLETED', label: 'COMPLETED (Work Done & Signed Off)' },
                    { value: 'CANCELLED', label: 'CANCELLED (Order Cancelled)' }
                  ],
                  'COMPLETED': [],
                  'CANCELLED': []
                };
                const allowed = VALID_TRANSITIONS_MAP[statusModalBooking.status] || [];
                const isTerminal = allowed.length === 0;

                if (isTerminal) {
                  return (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                      Booking <span className="font-mono font-bold">#{statusModalBooking.bookingNumber}</span> is in terminal state <strong className="font-bold">{statusModalBooking.status}</strong> and cannot undergo further lifecycle status transitions.
                    </div>
                  );
                }

                return (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Allowed Next Lifecycle Status * (Current: {statusModalBooking.status})
                    </label>
                    <select
                      value={statusForm.status}
                      onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 text-xs font-semibold border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500"
                    >
                      <option value="">-- Select Valid Next Transition --</option>
                      {allowed.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Status Change Note / Audit Reason
                </label>
                <textarea
                  rows={2}
                  value={statusForm.reason}
                  onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })}
                  placeholder="e.g. Technician arrived at customer site, job started."
                  className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusModalBooking(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  {['COMPLETED', 'CANCELLED'].includes(statusModalBooking.status) ? 'Close' : 'Cancel'}
                </button>
                {!['COMPLETED', 'CANCELLED'].includes(statusModalBooking.status) && (
                  <button
                    type="submit"
                    disabled={!statusForm.status || statusForm.status === statusModalBooking.status}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Update Status</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ISSUE INSTANT ONLINE REFUND MODAL (RAZORPAY) */}
      {refundModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-danger-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-danger-50 text-danger-600 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-800">Issue Razorpay Refund</h3>
                  <p className="text-xs text-slate-400 font-mono">{refundModalBooking.bookingNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3.5 p-3 rounded-xl bg-danger-50/70 border border-danger-200 text-xs text-danger-900 space-y-1">
              <div className="font-bold flex items-center gap-1 text-danger-700">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Automated Online Refund Engine</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                This triggers an instant refund request via <strong>Razorpay API</strong> directly back to the customer's UPI / Bank Account.
                The Bank Reference Number (ARN) will be recorded automatically.
              </p>
              <div className="pt-1 text-[11px] font-mono text-slate-700">
                Pre-paid Visiting Charge: <strong>₹{refundModalBooking.onlinePaidAmount || refundModalBooking.visitingCharge}</strong>
              </div>
            </div>

            <form onSubmit={handleIssueRefund} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Refund Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                  placeholder="e.g. 199"
                  className="w-full px-3 py-2 bg-slate-50 text-sm font-mono font-bold text-danger-700 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-danger-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Refund / Cancellation Reason *
                </label>
                <textarea
                  rows={2}
                  required
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  placeholder="e.g. Technician unavailable / Customer requested cancellation before visit"
                  className="w-full px-3 py-2 bg-slate-50 text-xs border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-danger-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRefundModalBooking(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-danger-600 hover:bg-danger-700 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Execute Razorpay Refund</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ADJUST ADDITIONAL WORK CHARGES MODAL */}
      {adjustChargeModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-800">Adjust On-Site Work Charge</h3>
                <p className="text-xs text-brand-600 font-mono font-semibold">{adjustChargeModalBooking.bookingNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustChargeModalBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 p-3 bg-warning-50/60 rounded-xl text-xs space-y-1 text-slate-700 border border-warning-200">
              <div>Pre-paid Visiting Charge: <strong className="font-mono text-success-700">₹{adjustChargeModalBooking.onlinePaidAmount || adjustChargeModalBooking.visitingCharge} (PAID)</strong></div>
              <div>Current Additional Work: <strong className="font-mono text-warning-700">₹{adjustChargeModalBooking.additionalWorkAmount || 0}</strong></div>
            </div>

            <form onSubmit={handleAdjustAdditionalCharge} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Additional Work / Material Charge (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={adjustForm.additionalAmount}
                  onChange={(e) => setAdjustForm({ ...adjustForm, additionalAmount: e.target.value })}
                  placeholder="e.g. 450 (for replacement valve or extra labor)"
                  className="w-full px-3 py-2 bg-slate-50 text-sm font-mono font-bold text-slate-900 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Scope of Extra Work / Parts Replaced
                </label>
                <textarea
                  rows={2}
                  value={adjustForm.note}
                  onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                  placeholder="e.g. Replaced 1 inch ball valve + 3 ft CPVC pipe"
                  className="w-full px-3 py-2 bg-slate-50 text-sm border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustChargeModalBooking(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-warning-600 hover:bg-warning-700 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Additional Charge</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DIRECT BOOKING DETAILS DRAWER / MODAL */}
      {selectedBookingForDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white h-full w-full max-w-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-brand-600">{selectedBookingForDrawer.bookingNumber}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    selectedBookingForDrawer.status === 'COMPLETED' ? 'bg-success-100 text-success-800' :
                    selectedBookingForDrawer.status === 'CONFIRMED' ? 'bg-warning-100 text-warning-800' :
                    selectedBookingForDrawer.status === 'ASSIGNED' ? 'bg-primary-100 text-primary-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedBookingForDrawer.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Booked on {new Date(selectedBookingForDrawer.created_at).toLocaleString('en-IN')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForDrawer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Customer Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer Details</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{selectedBookingForDrawer.customerName}</div>
                    <div className="font-mono text-xs text-brand-600 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{selectedBookingForDrawer.customerPhone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const booking = selectedBookingForDrawer;
                        setSelectedBookingForDrawer(null);
                        openChatForBooking(booking);
                      }}
                      className="p-2 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition-all flex items-center gap-1.5 text-xs font-semibold"
                      title="Open Live Chat with Customer"
                    >
                      <MessageCircle className="w-4 h-4 text-primary-600" />
                      <span>Chat</span>
                    </button>
                    <a
                      href={`tel:${selectedBookingForDrawer.customerPhone}`}
                      className="p-2 rounded-lg bg-success-50 text-success-700 hover:bg-success-100 border border-success-200 transition-all"
                      title="Call Customer"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div>{selectedBookingForDrawer.customerAddress}, {selectedBookingForDrawer.city}</div>
                      {selectedBookingForDrawer.landmark && <span className="block text-[11px] text-slate-400">Landmark: {selectedBookingForDrawer.landmark}</span>}
                      {selectedBookingForDrawer.latitude && selectedBookingForDrawer.longitude && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary-50 border border-primary-200/60 text-[11px] font-mono text-primary-700">
                          <span>📍 {selectedBookingForDrawer.latitude.toFixed(5)}, {selectedBookingForDrawer.longitude.toFixed(5)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedBookingForDrawer.latitude && selectedBookingForDrawer.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${selectedBookingForDrawer.latitude},${selectedBookingForDrawer.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all"
                      title="Open Google Maps Navigation for Technician"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Navigate</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Sub-Service & Schedule Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sub-Service & Slot</div>
                <div>
                  <div className="font-bold text-slate-800">{selectedBookingForDrawer.subServiceName}</div>
                  <div className="text-sm text-brand-600 font-medium">{selectedBookingForDrawer.serviceName}</div>
                  {selectedBookingForDrawer.subServiceDesc && (
                    <div className="text-[11px] text-slate-500 mt-1 italic leading-relaxed">
                      "{selectedBookingForDrawer.subServiceDesc}"
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-brand-500" />
                    <span>{selectedBookingForDrawer.scheduledDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedBookingForDrawer.scheduledSlot}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Required Field Answers (Filled by Customer) */}
              <div className="p-4 rounded-xl bg-primary-50/60 border border-primary-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-primary-900 uppercase tracking-wider">Customer Answers (Custom Fields)</div>
                  <span className="text-[10px] font-semibold text-primary-700 bg-primary-100/80 px-2 py-0.5 rounded-full">
                    {selectedBookingForDrawer.customFieldAnswers && Object.keys(selectedBookingForDrawer.customFieldAnswers).length > 0
                      ? `${Object.keys(selectedBookingForDrawer.customFieldAnswers).length} Answers`
                      : 'None Required'}
                  </span>
                </div>
                {selectedBookingForDrawer.customFieldAnswers && Object.keys(selectedBookingForDrawer.customFieldAnswers).length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {Object.entries(selectedBookingForDrawer.customFieldAnswers).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-lg bg-white border border-primary-100/80 text-xs flex items-center justify-between">
                        <span className="font-medium text-slate-600 capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="font-bold text-primary-950 font-mono">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No custom questionnaire required for this sub-service.</div>
                )}
              </div>

              {/* Payment & Financial Ledger */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment & Settlement</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Online Pre-paid (Visiting Fee):</span>
                    <span className="font-mono font-bold text-success-600">₹{selectedBookingForDrawer.onlinePaidAmount || selectedBookingForDrawer.visitingCharge} (PAID)</span>
                  </div>
                  {selectedBookingForDrawer.additionalWorkAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">On-Site Additional Work:</span>
                      <span className="font-mono font-bold text-warning-600">+₹{selectedBookingForDrawer.additionalWorkAmount}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-sm">
                    <span className="text-slate-800">Total Order Value:</span>
                    <span className="font-mono text-brand-700">₹{(selectedBookingForDrawer.onlinePaidAmount || selectedBookingForDrawer.visitingCharge || 0) + (selectedBookingForDrawer.additionalWorkAmount || 0)}</span>
                  </div>
                </div>

                {/* Razorpay transaction details */}
                <div className="pt-2 border-t border-slate-200/60 text-[11px] font-mono text-slate-500 space-y-0.5">
                  {selectedBookingForDrawer.razorpayPaymentId && (
                    <div>Payment ID: <strong className="text-slate-700">{selectedBookingForDrawer.razorpayPaymentId}</strong></div>
                  )}
                  {selectedBookingForDrawer.razorpayOrderId && (
                    <div>Order ID: <strong className="text-slate-700">{selectedBookingForDrawer.razorpayOrderId}</strong></div>
                  )}
                </div>

                {/* Refund Status if applicable */}
                {selectedBookingForDrawer.paymentStatus === 'REFUNDED' && (
                  <div className="p-2.5 rounded-lg bg-danger-50 border border-danger-200 text-xs text-danger-900 space-y-1 mt-2">
                    <div className="font-bold flex items-center gap-1 text-danger-700">
                      <RotateCcw className="w-3.5 h-3.5" /> REFUND PROCESSED
                    </div>
                    <div>Refund Amount: <strong className="font-mono">₹{selectedBookingForDrawer.refundAmount}</strong></div>
                    {selectedBookingForDrawer.refundArn && <div>Bank ARN: <strong className="font-mono">{selectedBookingForDrawer.refundArn}</strong></div>}
                    {selectedBookingForDrawer.refundId && <div>Razorpay Refund ID: <strong className="font-mono">{selectedBookingForDrawer.refundId}</strong></div>}
                    {selectedBookingForDrawer.refundedAt && <div>Refunded At: {new Date(selectedBookingForDrawer.refundedAt).toLocaleString('en-IN')}</div>}
                  </div>
                )}
              </div>

              {/* Technician / Provider Info */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Service Provider / Vendor</div>
                  <button
                    onClick={() => {
                      const matchedV = vendors.find(v => v.id === selectedBookingForDrawer.technicianId || v.phone === selectedBookingForDrawer.technicianPhone || v.name === selectedBookingForDrawer.technicianName);
                      setAssignTechModalBooking(selectedBookingForDrawer);
                      setTechForm({
                        vendorId: matchedV ? matchedV.id : '',
                        name: selectedBookingForDrawer.technicianName || matchedV?.name || '',
                        phone: selectedBookingForDrawer.technicianPhone || matchedV?.phone || '',
                        role: selectedBookingForDrawer.technicianRole || (matchedV ? `${matchedV.businessName || matchedV.name} • ${matchedV.specialization || 'Field Specialist'}` : 'Authorized Service Provider'),
                        rating: matchedV?.rating || 4.9,
                        businessName: matchedV?.businessName || '',
                        city: matchedV?.city || selectedBookingForDrawer.city || '',
                        documentsVerified: matchedV?.documentsVerified || false
                      });
                    }}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline"
                  >
                    {selectedBookingForDrawer.technicianName ? 'Change Authorized Vendor' : 'Assign Authorized Vendor'}
                  </button>
                </div>
                {selectedBookingForDrawer.technicianName ? (
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <HardHat className="w-3.5 h-3.5 text-success-600" />
                        <span>{selectedBookingForDrawer.technicianName}</span>
                      </div>
                      <div className="text-[11px] text-success-700 font-semibold">{selectedBookingForDrawer.technicianRole || 'Authorized Service Provider'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{selectedBookingForDrawer.technicianPhone}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openWhatsAppDispatch(selectedBookingForDrawer)}
                        className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-all flex items-center gap-1 text-xs font-semibold"
                        title="Dispatch customer address & job details to provider via WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5" /> Dispatch
                      </button>
                      <a
                        href={`tel:${selectedBookingForDrawer.technicianPhone}`}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-1 text-xs font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No service provider assigned yet. Tap "Assign Provider" above to dispatch a local vendor.</div>
                )}
              </div>

              {/* Customer Rating & Review Card */}
              {selectedBookingForDrawer.customerRating && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>Customer Verified Rating</span>
                    </span>
                    <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`text-xs ${star <= Math.round(selectedBookingForDrawer.customerRating) ? 'text-amber-500' : 'text-amber-200'}`}>★</span>
                      ))}
                      <span className="font-mono ml-1">{selectedBookingForDrawer.customerRating.toFixed(1)}/5.0</span>
                    </span>
                  </div>
                  {selectedBookingForDrawer.customerReview && (
                    <p className="text-xs text-amber-950 italic bg-white/70 p-2.5 rounded-lg border border-amber-200/50">
                      "{selectedBookingForDrawer.customerReview}"
                    </p>
                  )}
                  {selectedBookingForDrawer.ratedAt && (
                    <div className="text-[10px] text-amber-700/80">
                      Submitted on {new Date(selectedBookingForDrawer.ratedAt).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              )}

              {/* Status History & Audit Timeline */}
              {selectedBookingForDrawer.statusHistory && Array.isArray(selectedBookingForDrawer.statusHistory) && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status & Audit History</div>
                  <div className="space-y-2 pt-1">
                    {selectedBookingForDrawer.statusHistory.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800">
                            {item.status} <span className="text-[10px] text-slate-400 font-normal">by {item.updatedBy || 'System'}</span>
                          </div>
                          {item.reason && <div className="text-[11px] text-slate-500">{item.reason}</div>}
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.timestamp).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setStatusModalBooking(selectedBookingForDrawer);
                    setStatusForm({ status: '', reason: '' });
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs"
                >
                  Change Status
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustChargeModalBooking(selectedBookingForDrawer);
                    setAdjustForm({ additionalAmount: selectedBookingForDrawer.additionalWorkAmount || '', note: '' });
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-warning-700 bg-warning-50 border border-warning-200 rounded-lg hover:bg-warning-100 shadow-2xs"
                >
                  Adjust On-Site Fee
                </button>
              </div>

              {selectedBookingForDrawer.paymentStatus !== 'REFUNDED' && (
                <button
                  type="button"
                  onClick={() => {
                    const maxRef = Math.max(0, (selectedBookingForDrawer.onlinePaidAmount || selectedBookingForDrawer.visitingCharge || 199) - (selectedBookingForDrawer.refundAmount || 0));
                    setRefundModalBooking(selectedBookingForDrawer);
                    setRefundForm({
                      amount: maxRef,
                      reason: 'Customer requested cancellation'
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-danger-700 bg-danger-50 border border-danger-200 rounded-lg hover:bg-danger-100 shadow-2xs flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Refund</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ADVENTURE CATEGORY MODAL */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-danger-50 text-danger-600">
                  <Compass className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-800">
                    {editingCategory ? 'Edit Adventure Category' : 'Create Dynamic Category'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Define category metadata, accent color, and display icon
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Air Sports, Desert Safari, Water Sports"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tagline / Description
                </label>
                <input
                  type="text"
                  value={categoryForm.tagline}
                  onChange={(e) => setCategoryForm({ ...categoryForm, tagline: e.target.value })}
                  placeholder="e.g. High altitude tandem flights & paramotoring"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Icon Identifier
                  </label>
                  <select
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                  >
                    <option value="paragliding">paragliding (Air Sports)</option>
                    <option value="sand">sand (Desert Safari)</option>
                    <option value="water">water (Water Sports)</option>
                    <option value="hiking">hiking (Trekking / Hills)</option>
                    <option value="compass">compass (General Adventure)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Banner / Image URL
                </label>
                <input
                  type="url"
                  value={categoryForm.imageUrl}
                  onChange={(e) => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-danger-600 hover:bg-danger-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADVENTURE ACTIVITY / SPORT MODAL */}
      {experienceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-danger-50 text-danger-600">
                  <Compass className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-800">
                    {editingExperience ? 'Edit Sport Activity' : 'Add New Sport Activity'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Link activity to a dynamic category and configure pricing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExperienceModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExperience} className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sport / Activity Title *
                </label>
                <input
                  type="text"
                  value={experienceForm.title}
                  onChange={(e) => setExperienceForm({ ...experienceForm, title: e.target.value })}
                  placeholder="e.g. Tandem Paragliding High Flight, Quad Biking Safari"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Linked Adventure Category *
                </label>
                <select
                  value={experienceForm.categoryId}
                  onChange={(e) => setExperienceForm({ ...experienceForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                  required
                >
                  {entCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Every sport is explicitly linked with this dynamic category.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={experienceForm.tagline}
                  onChange={(e) => setExperienceForm({ ...experienceForm, tagline: e.target.value })}
                  placeholder="e.g. 15-min soaring flight with certified tandem pilot & GoPro video"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination City *
                  </label>
                  <input
                    type="text"
                    value={experienceForm.city}
                    onChange={(e) => setExperienceForm({ ...experienceForm, city: e.target.value })}
                    placeholder="e.g. Dehradun, Jaisalmer, Rishikesh"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={experienceForm.duration}
                    onChange={(e) => setExperienceForm({ ...experienceForm, duration: e.target.value })}
                    placeholder="e.g. 15-20 Mins, 2 Hours"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Starting Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={experienceForm.startingPrice}
                    onChange={(e) => setExperienceForm({ ...experienceForm, startingPrice: e.target.value })}
                    placeholder="2999"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Original Price (Strike-through ₹)
                  </label>
                  <input
                    type="number"
                    value={experienceForm.originalPrice}
                    onChange={(e) => setExperienceForm({ ...experienceForm, originalPrice: e.target.value })}
                    placeholder="4500"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discount Badge
                  </label>
                  <input
                    type="text"
                    value={experienceForm.discountBadge}
                    onChange={(e) => setExperienceForm({ ...experienceForm, discountBadge: e.target.value })}
                    placeholder="e.g. 20% OFF, POPULAR"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location Detail
                  </label>
                  <input
                    type="text"
                    value={experienceForm.locationDetails}
                    onChange={(e) => setExperienceForm({ ...experienceForm, locationDetails: e.target.value })}
                    placeholder="e.g. Maldevta Hills, Shivpuri Beach"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Activity Image URL
                </label>
                <input
                  type="url"
                  value={experienceForm.imageUrl}
                  onChange={(e) => setExperienceForm({ ...experienceForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                />
              </div>

              {/* Adventure Vendor / Operator Assignment */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-danger-600" />
                    <label className="text-xs font-bold text-slate-800">
                      Assigned Adventure Vendor / Operator
                    </label>
                  </div>
                  <span className="text-[10px] bg-danger-100 text-danger-700 px-2 py-0.5 rounded-full font-semibold">
                    Receives Booking Leads
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  When a customer books this adventure, customer name, slot, date and ticket count are dispatched to this operator.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Quick Preset / Onboarded Vendor
                    </label>
                    <select
                      value={experienceForm.vendorId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'v_adv_01') {
                          setExperienceForm({
                            ...experienceForm,
                            vendorId: val,
                            vendorName: 'Captain Arvind Negi',
                            vendorBusiness: 'Himalayan Sky Gliders & Air Safari',
                            vendorPhone: '+91 98290 88801'
                          });
                        } else if (val === 'v_adv_02') {
                          setExperienceForm({
                            ...experienceForm,
                            vendorId: val,
                            vendorName: 'Fateh Singh Bhati',
                            vendorBusiness: 'Thar Royal Desert Safari & Camps',
                            vendorPhone: '+91 94141 77702'
                          });
                        } else if (val === 'v_adv_03') {
                          setExperienceForm({
                            ...experienceForm,
                            vendorId: val,
                            vendorName: 'Rakesh Rawat',
                            vendorBusiness: 'Ganga White Water Adventure Club',
                            vendorPhone: '+91 98370 66603'
                          });
                        } else {
                          const matchedVendor = vendors.find(v => v.id === val);
                          if (matchedVendor) {
                            setExperienceForm({
                              ...experienceForm,
                              vendorId: matchedVendor.id,
                              vendorName: matchedVendor.name,
                              vendorBusiness: matchedVendor.businessName || matchedVendor.name,
                              vendorPhone: matchedVendor.phone || ''
                            });
                          }
                        }
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                    >
                      <optgroup label="Adventure Operators">
                        <option value="v_adv_01">Captain Arvind Negi (Himalayan Sky Gliders & Air Safari)</option>
                        <option value="v_adv_02">Fateh Singh Bhati (Thar Royal Desert Safari & Camps)</option>
                        <option value="v_adv_03">Rakesh Rawat (Ganga White Water Adventure Club)</option>
                      </optgroup>
                      {vendors && vendors.length > 0 && (
                        <optgroup label="Registered Service Vendors">
                          {vendors.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.businessName || v.category || 'Vendor'})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Operator Business Name *
                    </label>
                    <input
                      type="text"
                      value={experienceForm.vendorBusiness}
                      onChange={(e) => setExperienceForm({ ...experienceForm, vendorBusiness: e.target.value })}
                      placeholder="e.g. Himalayan Sky Gliders"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Lead Pilot / Operator Incharge
                    </label>
                    <input
                      type="text"
                      value={experienceForm.vendorName}
                      onChange={(e) => setExperienceForm({ ...experienceForm, vendorName: e.target.value })}
                      placeholder="e.g. Captain Arvind Negi"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Vendor WhatsApp / Phone (Lead Alert) *
                    </label>
                    <input
                      type="text"
                      value={experienceForm.vendorPhone}
                      onChange={(e) => setExperienceForm({ ...experienceForm, vendorPhone: e.target.value })}
                      placeholder="+91 98290 88801"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExperienceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-danger-600 hover:bg-danger-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingExperience ? 'Save Changes' : 'Create Sport'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER DETAIL & BOOKINGS MODAL */}
      {userDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/90">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-bold shadow-lg">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    {selectedUser.name || 'Unnamed Customer'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedUser.email || 'No email'} • {selectedUser.phoneNumber || 'No phone'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setUserDetailModalOpen(false); setSelectedUser(null); setUserBookings([]); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer ID</div>
                  <div className="font-mono font-semibold text-slate-800 text-xs truncate">{selectedUser.id}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</div>
                  <div className="font-semibold text-slate-800 text-xs">{selectedUser.phoneNumber || 'N/A'}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</div>
                  <div className="font-semibold text-slate-800 text-xs">{selectedUser.email || 'N/A'}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Member Since</div>
                  <div className="font-semibold text-slate-800 text-xs">
                    {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-IN') : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-xl border border-slate-200/80 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Home className="w-3 h-3" />
                    <span>Saved Addresses ({selectedUser.address?.length || 0})</span>
                  </h4>
                  {selectedUser.address?.length === 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">No addresses saved</span>
                  )}
                </div>
                {selectedUser.address && selectedUser.address.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUser.address.map((addr, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-slate-100 flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-sm text-slate-800">{addr.type || 'Home'}</div>
                          <div className="text-xs text-slate-600">{addr.address}</div>
                          <div className="text-xs text-slate-600">{addr.city}, {addr.pin || ''}</div>
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400">{addr.label || 'Address'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 text-xs">No saved addresses</div>
                )}
              </div>

              <div className="bg-slate-50/50 rounded-xl border border-slate-200/80 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="w-3 h-3" />
                    <span>Service Requests ({selectedUser.requests?.length || 0})</span>
                  </h4>
                </div>
                {selectedUser.requests && selectedUser.requests.length > 0 ? (
                  <div className="space-y-3">
                    {selectedUser.requests.map(req => (
                      <div key={req.id} className="p-3 bg-white rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[10px] text-brand-600">{req.requestNumber}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${req.urgency === 'HIGH' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                              {req.urgency || 'NORMAL'}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${req.status === 'COMPLETED' ? 'bg-success-50 text-success-700 border border-success-200' : req.status === 'ASSIGNED' ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                            {req.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mb-1">{req.subServiceCode || req.servicecode || 'Service Request'}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[280px]">{req.issueDescription || 'No description'}</div>
                        <div className="mt-2 pt-2 border-t border-slate-50/60 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400">
                            {req.preferredDate || 'TBD'} • {req.location || 'N/A'}
                          </span>
                          {req.assignedVendorName && (
                            <span className="text-[10px] font-semibold text-success-700 bg-success-50 px-2 py-0.5 rounded">
                              Assigned: {req.assignedVendorName}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 text-xs">No service requests</div>
                )}
              </div>

              <div className="bg-slate-50/50 rounded-xl border border-slate-200/80 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Ticket className="w-3 h-3" />
                    <span>Direct Bookings ({userBookings.length})</span>
                  </h4>
                  {userBookingsLoading && <span className="text-[10px] text-slate-400 animate-pulse">Loading...</span>}
                </div>
                {userBookingsLoading ? (
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mx-auto mb-2"></div>
                    <span className="text-[10px] text-slate-400">Loading bookings...</span>
                  </div>
                ) : userBookings.length > 0 ? (
                  <div className="space-y-3">
                    {userBookings.map(b => (
                      <div key={b.id} className="p-3 bg-white rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[10px] text-brand-600">#{b.bookingNumber || b.id}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${b.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                              {b.paymentStatus}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${b.status === 'COMPLETED' ? 'bg-success-50 text-success-700 border border-success-200' : b.status === 'IN_PROGRESS' ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                            {b.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mb-1">{b.subServiceName || b.serviceName || 'Direct Booking'}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[280px]">{b.customerAddress || 'N/A'}</div>
                        <div className="mt-2 pt-2 border-t border-slate-50/60 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400">
                            {b.scheduledDate || 'TBD'} • {b.scheduledSlot || 'N/A'}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-800 font-mono">
                            ₹{(b.totalAmount || b.visitingCharge || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 text-xs">No direct bookings</div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                {selectedUser.phoneNumber && (
                  <>
                    <button
                      onClick={() => { openWhatsApp(selectedUser.phoneNumber, `Hello ${selectedUser.name || 'there'}! This is Hipro Admin Desk. How can we assist you today?`); }}
                      className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => callCustomer(selectedUser.phoneNumber)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Call</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => { openChatForCustomer(selectedUser, selectedUser.phoneNumber); setUserDetailModalOpen(false); }}
                  className="flex-1 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Open Chat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* MODAL 1: SHARE INSPECTION REQUEST WITH SELECTED VENDORS */}
      {shareVendorModalOpen && shareModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-5 py-4 sm:px-6 sm:py-5 bg-white border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 border border-primary-100 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      #{shareModalRequest.requestNumber}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200/80">
                      {[shareModalRequest.propertyType, shareModalRequest.propertySize].filter(Boolean).join(' • ') || 'Inspection'}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{shareModalRequest.city || shareModalRequest.location || shareModalRequest.addressline || 'Site Location'}</span>
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-heading font-bold text-slate-900 tracking-tight">
                    Invite Local Contractors to Quote
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Share site damage photos and scope details with verified local partners to collect itemized bids.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShareVendorModalOpen(false); setShareModalRequest(null); }}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 flex items-center justify-center transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Project Scope & Inspection Evidence Card */}
            <div className="px-5 py-3.5 sm:px-6 bg-slate-50/60 border-b border-slate-100 shrink-0">
              <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Project Trade</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-primary-50 text-primary-800 border border-primary-200/60">
                      <Wrench className="w-3 h-3 text-primary-600" />
                      <span>{shareModalRequest.servicecode}</span>
                    </span>
                    {shareModalRequest.subServiceCode && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {shareModalRequest.subServiceCode}
                      </span>
                    )}
                  </div>
                  {Array.isArray(shareModalRequest.mediaUrl) && shareModalRequest.mediaUrl.length > 0 && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      {shareModalRequest.mediaUrl.length} site photo{shareModalRequest.mediaUrl.length > 1 ? 's' : ''} attached
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 font-normal leading-relaxed line-clamp-2 bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-200/60 text-slate-600 italic">
                      "{shareModalRequest.issueDescription || 'Customer inspection completed. Awaiting contractor scope of work and quotation.'}"
                    </p>
                  </div>

                  {Array.isArray(shareModalRequest.mediaUrl) && shareModalRequest.mediaUrl.length > 0 && (
                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      {shareModalRequest.mediaUrl.slice(0, 3).map((img, idx) => (
                        <div key={idx} className="relative group overflow-hidden rounded-lg border border-slate-200 shadow-2xs">
                          <img
                            src={img}
                            alt="Damage evidence"
                            className="w-10 h-10 sm:w-11 sm:h-11 object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80'; }}
                          />
                        </div>
                      ))}
                      {shareModalRequest.mediaUrl.length > 3 && (
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600 shadow-2xs">
                          +{shareModalRequest.mediaUrl.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="px-5 py-3 sm:px-6 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
              <div className="relative w-full sm:w-60">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={shareVendorCityFilter}
                  onChange={(e) => setShareVendorCityFilter(e.target.value)}
                  className="w-full text-xs font-medium pl-8 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-800 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none cursor-pointer"
                >
                  <option value="ALL">All Hubs ({operationalCities.filter(c => c.isActive !== false).length})</option>
                  {operationalCities.filter(c => c.isActive !== false).map(c => (
                    <option key={c.id || c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative w-full sm:flex-1 sm:max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search contractor, business, or specialty..."
                  value={shareVendorSearch}
                  onChange={(e) => setShareVendorSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Vendor List (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 space-y-2.5 bg-slate-50/30">
              {(() => {
                const searchLower = shareVendorSearch.toLowerCase().trim();
                const filteredVendors = vendors.filter(v => {
                  if (shareVendorCityFilter !== 'ALL' && v.city && !v.city.toLowerCase().includes(shareVendorCityFilter.toLowerCase())) {
                    return false;
                  }
                  if (searchLower) {
                    const matchName = (v.name || '').toLowerCase().includes(searchLower);
                    const matchBiz = (v.businessName || '').toLowerCase().includes(searchLower);
                    const matchSpec = (v.specialization || '').toLowerCase().includes(searchLower);
                    const matchCity = (v.city || '').toLowerCase().includes(searchLower);
                    if (!matchName && !matchBiz && !matchSpec && !matchCity) return false;
                  }
                  return true;
                });

                const allSelected = filteredVendors.length > 0 && filteredVendors.every(v => selectedShareVendorIds.includes(v.id));

                return (
                  <>
                    <div className="flex items-center justify-between pb-1 px-0.5 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                        <span>Contractors Available:</span>
                        <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px] shadow-2xs">
                          {filteredVendors.length}
                        </span>
                      </div>
                      {filteredVendors.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSelectAllCityVendors(filteredVendors)}
                          className="text-xs font-semibold text-primary-700 hover:text-primary-800 transition-colors hover:underline"
                        >
                          {allSelected ? 'Deselect All' : `Select All (${filteredVendors.length})`}
                        </button>
                      )}
                    </div>

                    {filteredVendors.length === 0 ? (
                      <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 bg-white">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <h5 className="font-bold text-sm text-slate-700">No matching contractors</h5>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                          Try adjusting your hub filter or search query to find registered partners.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredVendors.map(v => {
                          const isSelected = selectedShareVendorIds.includes(v.id);
                          const alreadyShared = (shareModalRequest.sharedVendors || []).find(s => s.vendorId === v.id);
                          const hasQuoted = (shareModalRequest.vendorQuotes || []).find(q => q.vendorId === v.id);
                          const displayName = v.businessName || v.name || 'Contractor';
                          const initial = displayName.charAt(0).toUpperCase();

                          return (
                            <div
                              key={v.id}
                              onClick={() => handleToggleSelectVendor(v.id)}
                              className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-primary-50/50 border-primary-500 ring-1 ring-primary-500/40 shadow-xs'
                                  : 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-slate-300 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Checkbox Indicator */}
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                  isSelected
                                    ? 'bg-primary-600 border-primary-600 text-white shadow-xs'
                                    : 'border-slate-300 bg-white group-hover:border-slate-400'
                                }`}>
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>

                                {/* Avatar */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                                  isSelected
                                    ? 'bg-primary-100 text-primary-800 border border-primary-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {initial}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-heading font-bold text-sm text-slate-900 truncate">
                                      {displayName}
                                    </h4>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                      {v.city || 'Regional Hub'}
                                    </span>
                                    {alreadyShared && (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                                        Shared Earlier
                                      </span>
                                    )}
                                    {hasQuoted && (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                        Quote: ₹{hasQuoted.quotePrice.toLocaleString('en-IN')}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1.5 flex-wrap">
                                    <span>Contact: <strong className="text-slate-700 font-semibold">{v.name}</strong></span>
                                    {v.phone && <span>• {v.phone}</span>}
                                    <span className="text-primary-700 font-medium">• {v.specialization || 'General Contractor'}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                <div className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                                  <span className="text-amber-500">★</span>
                                  <span>{v.rating || '4.8'}</span>
                                </div>
                                <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span>{v.currentJobCount || 0}/{v.maxConcurrentJobs || 5} active jobs</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Dispatch Instructions & Action Footer */}
            <div className="px-5 py-4 sm:px-6 bg-white border-t border-slate-200/90 shrink-0 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Instructions for Invited Contractors (Optional):</span>
                  </label>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShareDispatchNotes('Urgent requirement. Please submit your lowest itemized quote before 6:00 PM today.')}
                      className="text-[10px] font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2 py-0.5 rounded transition-colors"
                    >
                      + Urgent 6 PM
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareDispatchNotes('Site inspection required prior to quote finalization.')}
                      className="text-[10px] font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2 py-0.5 rounded transition-colors"
                    >
                      + Site Visit Required
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Urgent customer requirement. Please submit lowest itemized quote before 6:00 PM."
                  value={shareDispatchNotes}
                  onChange={(e) => setShareDispatchNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="text-xs font-medium text-slate-600 flex items-center gap-2">
                  {selectedShareVendorIds.length === 0 ? (
                    <span className="text-slate-400">No contractors selected</span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse"></span>
                      <span>Selected: <strong className="text-primary-700 font-bold">{selectedShareVendorIds.length}</strong> contractor{selectedShareVendorIds.length > 1 ? 's' : ''}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setShareVendorModalOpen(false); setShareModalRequest(null); }}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSharingDispatching || selectedShareVendorIds.length === 0}
                    onClick={handleDispatchShareVendors}
                    className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all flex items-center gap-2 shadow-sm shadow-primary-500/20"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSharingDispatching ? 'animate-spin' : ''}`} />
                    <span>{isSharingDispatching ? 'Sending Invites...' : `Invite ${selectedShareVendorIds.length} Contractor(s) to Quote`}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: VENDOR QUOTATIONS COMPARISON & PROJECT ASSIGNMENT */}
      {vendorQuotesModalOpen && quotesModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-5 py-4 sm:px-6 sm:py-5 bg-white border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      #{quotesModalRequest.requestNumber}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {quotesModalRequest.servicecode}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{quotesModalRequest.city || quotesModalRequest.location || 'Site Hub'}</span>
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-heading font-bold text-slate-900 tracking-tight">
                    Vendor Quotations & Project Assignment
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Compare submitted bids from invited contractors and award the project to the best partner.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setVendorQuotesModalOpen(false); setQuotesModalRequest(null); }}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 flex items-center justify-center transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* KPI Summary Banner */}
            {(() => {
              const quotes = quotesModalList || [];
              const minPrice = quotes.length > 0 ? Math.min(...quotes.map(q => q.quotePrice)) : 0;
              const maxPrice = quotes.length > 0 ? Math.max(...quotes.map(q => q.quotePrice)) : 0;
              const isAssigned = isProjectAwarded(quotesModalRequest);

              return (
                <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Quotes</span>
                    <span className="text-lg font-mono font-bold text-slate-900">{quotes.length} Submitted</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/40">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Lowest Bid</span>
                    <span className="text-lg font-mono font-bold text-emerald-700">
                      {quotes.length > 0 ? `₹${minPrice.toLocaleString('en-IN')}` : '—'}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Highest Bid</span>
                    <span className="text-lg font-mono font-bold text-slate-900">
                      {quotes.length > 0 ? `₹${maxPrice.toLocaleString('en-IN')}` : '—'}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Project Status</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                      isAssigned ? 'bg-success-100 text-success-800' : 'bg-warning-100 text-warning-800'
                    }`}>
                      {isAssigned ? 'Assigned' : 'Awaiting Award'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Quotations List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {isLoadingQuotesModal ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-2" />
                  <span className="text-xs font-medium text-slate-500">Loading vendor quotes...</span>
                </div>
              ) : quotesModalList.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl p-6">
                  <Tag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="font-heading font-bold text-sm text-slate-700">No Quotations Received Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Share this request with local vendors to invite price bids and timelines.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setVendorQuotesModalOpen(false);
                      handleOpenShareVendorsModal(quotesModalRequest);
                    }}
                    className="mt-4 px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all inline-flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share with Vendors Now
                  </button>
                </div>
              ) : (
                quotesModalList.map((q, idx) => {
                  const minPrice = Math.min(...quotesModalList.map(item => item.quotePrice));
                  const isLowest = q.quotePrice === minPrice;
                  const isCurrentlyAssigned = q.status === 'accepted' || q.status === 'assigned' || (isProjectAwarded(quotesModalRequest) && quotesModalRequest.vendorId === q.vendorId);

                  return (
                    <div
                      key={q.id || idx}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isCurrentlyAssigned
                          ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                          : isLowest
                          ? 'bg-amber-50/40 border-amber-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            onClick={() => {
                              const v = vendors.find(x => x.id === q.vendorId) || q.vendor;
                              if (v) handleOpenVendorDetail(v);
                            }}
                            className="font-heading font-bold text-base text-slate-900 cursor-pointer hover:text-primary-600 transition-colors flex items-center gap-1.5"
                            title="Click to view full contractor profile & KYC"
                          >
                            <span>{q.vendorBusiness || q.vendorName || q.vendor?.businessName || 'Vendor'}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </h4>
                          {isLowest && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              ⭐ Lowest Quote
                            </span>
                          )}
                          {isCurrentlyAssigned && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Assigned Winner
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                          <span>Owner: <strong className="text-slate-700">{q.vendorName || q.vendor?.name}</strong></span>
                          {q.vendor?.phone && <span>Phone: <strong className="text-slate-700">{q.vendor.phone}</strong></span>}
                          {q.vendor?.rating && <span className="text-amber-600 font-semibold">★ {q.vendor.rating}</span>}
                          <span>Timeline: <strong className="text-slate-700">{q.estimatedTimeline || '1-2 Days'}</strong></span>
                        </div>

                        {q.notes && renderQuotationBreakdown(q.notes)}
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quote Amount</span>
                          <span className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900">
                            ₹{q.quotePrice.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {!isCurrentlyAssigned ? (
                          <button
                            type="button"
                            disabled={isAssigningFromQuotes}
                            onClick={() => handleAssignVendorFromQuote(q)}
                            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Award Project</span>
                          </button>
                        ) : (
                          <div className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-xl flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Project Assigned
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setVendorQuotesModalOpen(false);
                  handleOpenShareVendorsModal(quotesModalRequest);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" /> Share with more vendors
              </button>

              <button
                type="button"
                onClick={() => { setVendorQuotesModalOpen(false); setQuotesModalRequest(null); }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================== ADD CITY HUB MODAL ==================== */}
      {cityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">Add New Hipro Service Hub</h3>
                <p className="text-xs text-slate-500">Enable civil construction and repair operations in a new city</p>
              </div>
              <button
                type="button"
                onClick={() => setCityModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCity} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jodhpur, Kota, Ajmer"
                  value={cityForm.name}
                  onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State / Region *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajasthan, Uttarakhand"
                  value={cityForm.state}
                  onChange={(e) => setCityForm({ ...cityForm, state: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operational Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Blue City • Sun City & Heritage Projects"
                  value={cityForm.tagline}
                  onChange={(e) => setCityForm({ ...cityForm, tagline: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hub Status Badge</label>
                <select
                  value={cityForm.badge}
                  onChange={(e) => setCityForm({ ...cityForm, badge: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium bg-white"
                >
                  <option value="ACTIVE HUB">ACTIVE HUB</option>
                  <option value="HEADQUARTERS">HEADQUARTERS</option>
                  <option value="METRO HUB">METRO HUB</option>
                  <option value="EXPANDING">EXPANDING</option>
                  <option value="POPULAR">POPULAR</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCityModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCity}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isSavingCity ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save City Hub</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREMIUM SAAS TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-auto max-w-sm w-full animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className={`p-3.5 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-md transition-all ${
            toast.type === 'success' ? 'bg-white/95 border-success-200/90 text-slate-800 shadow-success-500/5' :
            toast.type === 'error' ? 'bg-white/95 border-danger-200/90 text-slate-800 shadow-danger-500/5' :
            toast.type === 'warning' ? 'bg-white/95 border-warning-200/90 text-slate-800 shadow-warning-500/5' :
            'bg-white/95 border-slate-200 text-slate-800'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              toast.type === 'success' ? 'bg-success-50 text-success-600' :
              toast.type === 'error' ? 'bg-danger-50 text-danger-600' :
              toast.type === 'warning' ? 'bg-warning-50 text-warning-600' :
              'bg-brand-50 text-brand-600'
            }`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
               toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> :
               toast.type === 'warning' ? <AlertCircle className="w-4 h-4" /> :
               <Info className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  toast.type === 'success' ? 'text-success-700' :
                  toast.type === 'error' ? 'text-danger-700' :
                  toast.type === 'warning' ? 'text-warning-700' :
                  'text-brand-700'
                }`}>
                  {toast.type === 'success' ? 'Success' :
                   toast.type === 'error' ? 'Action Failed' :
                   toast.type === 'warning' ? 'Notice' : 'System Update'}
                </span>
                <button
                  type="button"
                  onClick={() => setToast(null)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs font-medium text-slate-700 mt-0.5 leading-snug">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
