import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  LayoutDashboard, ClipboardList, Receipt, Calculator,
  Wrench, Users, Activity, ShieldCheck, Plus, RefreshCw,
  PlusCircle, Search, Menu, X, Camera, Video, Printer, Trash2,
  Check, PhoneCall, Sparkles, Inbox, Clock, FileCheck2,
  CheckCircle2, GitPullRequest, Zap, ArrowRight, ArrowLeft, MapPin,
  Calendar, Home, User, Phone, Info, Send, RotateCcw,
  Server, Database, AlertCircle, Droplets, Image, Layers, Maximize,
  ExternalLink, Link2, Eye, EyeOff, Upload, Tag, Percent, Ticket,
  MessageCircle, CheckCheck, TrendingUp, HardHat, CheckCircle, ChevronDown,
  Filter, UserCheck, AlertTriangle, ArrowUpRight, Award, Shield, UserPlus, ShoppingCart, Compass,
  Edit, Edit2, Edit3, LogOut, CreditCard, Banknote, Briefcase
} from 'lucide-react';

const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || 'https://app.hindustanprojects.in');

export default function VendorPanel({ onSwitchToSuperAdmin, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [vendorRequests, setVendorRequests] = useState([]);
  const [vendorQuotes, setVendorQuotes] = useState([]);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [activePhotoModal, setActivePhotoModal] = useState(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quotingRequestId, setQuotingRequestId] = useState(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteTimeline, setQuoteTimeline] = useState('1-2 Working Days');

  // ==================== QUOTATION & BOQ BUILDER STATE ====================
  const [builderRequestId, setBuilderRequestId] = useState('');
  const [builderMode, setBuilderMode] = useState('boq'); // 'boq' | 'lumpsum'
  const [builderLineItems, setBuilderLineItems] = useState([
    { item: 'Surface Inspection, Deep Cleaning & Primer Base', qty: 120, unit: 'Sq Ft', rate: 25 },
    { item: 'High-Performance Waterproof Chemical Coating (2 Coats)', qty: 120, unit: 'Sq Ft', rate: 65 },
    { item: 'Skilled Labour, Scaffolding & Site Clean-Up', qty: 1, unit: 'Lump Sum', rate: 2500 }
  ]);
  const [builderGstRate, setBuilderGstRate] = useState(18);
  const [builderWarranty, setBuilderWarranty] = useState('');
  const [builderTimeline, setBuilderTimeline] = useState('3-5 Working Days');
  const [builderNotes, setBuilderNotes] = useState('');
  const [builderCustomPrice, setBuilderCustomPrice] = useState('');
  const [isSubmittingBuilderQuote, setIsSubmittingBuilderQuote] = useState(false);

  const builderLineItemsTotal = builderLineItems.reduce((acc, li) => {
    return acc + ((parseFloat(li.qty) || 0) * (parseFloat(li.rate) || 0));
  }, 0);

  const effectiveBuilderSubtotal = builderMode === 'boq'
    ? builderLineItemsTotal
    : (parseFloat(builderCustomPrice) || 0);

  const builderTaxAmount = builderGstRate > 0
    ? Math.round(effectiveBuilderSubtotal * (builderGstRate / 100))
    : 0;

  const builderGrandTotal = effectiveBuilderSubtotal + builderTaxAmount;

  const selectedBuilderRequest = vendorRequests.find(r => r.id === builderRequestId) || null;

  // Read authenticated partner profile from localStorage
  const registeredVendor = (() => {
    try {
      const saved = localStorage.getItem('hipro_vendor');
      if (saved) {
        const v = JSON.parse(saved);
        if (v && (v.name || v.businessName)) {
          return {
            id: v.id || null,
            name: v.name || null,
            businessName: v.businessName || v.name || null,
            phone: v.phone || null,
            email: v.email || null,
            city: v.city || null,
            category: (v.category && v.category.toLowerCase().includes('adventure')) ? 'Adventure' : 'Services',
            specialization: v.specialization || null,
            experience: v.experience || null,
            status: v.status || null,
            rating: v.rating || null,
            minCharge: v.minCharge || null
          };
        }
      }
    } catch (e) {}
    return null;
  })();

  // Build dynamic vendor list: registered profile first, then all vendors from backend
  const availableVendors = React.useMemo(() => {
    const fetched = vendors.filter(v =>
      !registeredVendor || (v.id !== registeredVendor.id && v.phone !== registeredVendor.phone)
    );
    return registeredVendor ? [registeredVendor, ...fetched] : fetched;
  }, [vendors, registeredVendor]);

  const [selectedVendorId, setSelectedVendorId] = useState(() => {
    if (registeredVendor && registeredVendor.id) return registeredVendor.id;
    return vendors[0]?.id || null;
  });

  const vendorProfile = availableVendors.find(v => v.id === selectedVendorId) || registeredVendor || availableVendors[0] || null;
  const isAdventure = !!vendorProfile && (vendorProfile.category || '').toLowerCase().includes('adventure');

  // Guard: render loading state until vendor profile is available
  if (!vendorProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-sm text-slate-600">Loading your partner profile...</p>
        </div>
      </div>
    );
  }

  const [adventureBookings, setAdventureBookings] = useState([]);
  const [adventureSearch, setAdventureSearch] = useState('');
  const [adventureStatusFilter, setAdventureStatusFilter] = useState('ALL');

  // ==================== REAL-TIME SUPER ADMIN CHAT STATE ====================
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatMessagesEndRef = useRef(null);
  const vendorSocketRef = useRef(null);

  const fetchVendorChatMessages = async (tId) => {
    const thread = tId || (vendorProfile?.id ? `thread_vendor_${vendorProfile.id}` : null);
    if (!thread) return;
    try {
      setChatLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/chat/threads/${thread}/messages`);
      const data = await res.json();
      if (data.success && data.data) {
        setChatMessages(data.data);
      }
    } catch (e) {
      console.error('Fetch vendor chat messages error:', e);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (!vendorProfile?.id) return;
    const currentThreadId = `thread_vendor_${vendorProfile.id}`;
    fetchVendorChatMessages(currentThreadId);

    const socketBase = import.meta.env.VITE_SOCKET_URL || 
      (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : (import.meta.env.VITE_API_BASE_URL || 'https://app.hindustanprojects.in'));

    const token = typeof window !== 'undefined' ? localStorage.getItem('hipro_auth_token') : null;
    const socket = io(socketBase, {
      transports: ['websocket', 'polling'],
      auth: { token, role: 'vendor', vendorId: vendorProfile.id }
    });
    vendorSocketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_thread', currentThreadId);
    });

    socket.on('new_message', (msg) => {
      if (msg.threadId === currentThreadId) {
        setChatMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return () => {
      socket.disconnect();
      vendorSocketRef.current = null;
    };
  }, [vendorProfile?.id]);

  useEffect(() => {
    if (activeTab === 'support') {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleSendVendorMessage = async (e) => {
    if (e) e.preventDefault();
    const text = chatInputText.trim();
    if (!text || !vendorProfile?.id || isSendingChat) return;

    const currentThreadId = `thread_vendor_${vendorProfile.id}`;
    setIsSendingChat(true);
    setChatInputText('');

    try {
      const res = await fetch(`${API_BASE}/api/v1/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: currentThreadId,
          sender: 'vendor',
          senderName: vendorProfile.businessName || vendorProfile.name,
          customerName: vendorProfile.businessName || vendorProfile.name,
          customerPhone: vendorProfile.phone || '',
          contextType: 'VENDOR',
          contextTag: `${vendorProfile.businessName || vendorProfile.name} (Vendor Desk)`,
          vendorId: vendorProfile.id,
          text
        })
      });
      const data = await res.json();
      if (data && data.success && data.data) {
        setChatMessages(prev => {
          if (prev.some(m => m.id === data.data.id)) return prev;
          return [...prev, data.data];
        });
      }
    } catch (err) {
      console.error('Send vendor message error:', err);
    } finally {
      setIsSendingChat(false);
    }
  };

  const showToastMsg = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchVendors = async () => {
    try {
      setVendorsLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/vendors`);
      const data = await res.json();
      if (data.success && Array.isArray(data.vendors)) {
        setVendors(data.vendors);
        if (!selectedVendorId) {
          setSelectedVendorId(registeredVendor ? registeredVendor.id : data.vendors[0]?.id || null);
        }
      }
    } catch (e) {
      console.error('fetchVendors error:', e);
    } finally {
      setVendorsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (!selectedVendorId) return;
    fetchVendorData();
    fetchAdventureBookings();
  }, [selectedVendorId]);

  useEffect(() => {
    if (isAdventure && (activeTab === 'requests' || activeTab === 'quotes' || activeTab === 'assigned')) {
      setActiveTab('adventure');
    } else if (!isAdventure && activeTab === 'adventure') {
      setActiveTab('requests');
    }
  }, [selectedVendorId, isAdventure]);

  const fetchAdventureBookings = async () => {
    if (!selectedVendorId) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/ent/vendor/bookings?vendorId=${selectedVendorId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.bookings)) {
        setAdventureBookings(data.bookings);
        return;
      }
    } catch (e) {
      console.warn('API error, loading bookings for operator:', e);
    }
    setAdventureBookings([]);
  };

  const handleUpdateAdventureStatus = async (bookingId, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/ent/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Booking marked as ${status}`, 'success');
        fetchAdventureBookings();
      } else {
        showToastMsg(data.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToastMsg('Error updating booking status', 'error');
    }
  };

  const openWhatsAppTraveler = (booking) => {
    const cleanPhone = (booking.travelerPhone || '').replace(/\D/g, '');
    const msg = encodeURIComponent(
      `👋 *Hello ${booking.travelerName}!* \n\n` +
      `This is *${vendorProfile.name}* from *${vendorProfile.businessName}*.\n` +
      `We have received your confirmed booking for:\n` +
      `🎯 *Activity:* ${booking.experienceTitle}\n` +
      `🎫 *Booking Pass:* ${booking.bookingCode || booking.id}\n` +
      `📅 *Date:* ${booking.travelDate}\n` +
      `⏰ *Scheduled Slot:* ${booking.timeSlot}\n` +
      `👥 *Travelers:* ${booking.guests || 1} Person(s)\n` +
      `📍 *Reporting Base Camp:* ${booking.reportingPoint || 'Base Camp Reception'}\n\n` +
      `Please arrive 15 minutes before your slot with a valid Govt ID. Contact us at ${vendorProfile.phone} if you need directions or assistance. We look forward to hosting your adventure!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const fetchVendorData = async () => {
    try {
      await Promise.all([
        fetchVendorRequests(),
        fetchVendorQuotes(),
        fetchAssignedJobs(),
        fetchAdventureBookings(),
      ]);
    } catch (e) {
      console.error('Failed to fetch vendor data:', e);
    }
  };

  const fetchVendorRequests = async () => {
    if (!vendorProfile) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hipro_auth_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/v1/vendors/requests?vendorId=${vendorProfile.id}&city=${encodeURIComponent(vendorProfile.city || '')}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        setVendorRequests(data.requests);
      } else {
        setVendorRequests([]);
      }
    } catch (e) {
      console.error('fetchVendorRequests error:', e);
      setVendorRequests([]);
    }
  };

  const fetchVendorQuotes = async () => {
    if (!vendorProfile) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hipro_auth_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/v1/vendors/my-quotes?vendorId=${vendorProfile.id}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.quotes)) {
        setVendorQuotes(data.quotes);
      } else {
        setVendorQuotes([]);
      }
    } catch (e) {
      console.error('fetchVendorQuotes error:', e);
      setVendorQuotes([]);
    }
  };

  const fetchAssignedJobs = async () => {
    if (!vendorProfile) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hipro_auth_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/v1/vendors/my-jobs?vendorId=${vendorProfile.id}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        setAssignedJobs(data.jobs);
      } else {
        setAssignedJobs([]);
      }
    } catch (e) {
      console.error('fetchAssignedJobs error:', e);
      setAssignedJobs([]);
    }
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (!quotingRequestId) return;
    const price = parseFloat(quotePrice);
    if (isNaN(price) || price <= 0) {
      showToastMsg('Please enter a valid quotation price', 'error');
      return;
    }
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hipro_auth_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/v1/vendors/quotes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          requestId: quotingRequestId,
          vendorId: vendorProfile.id,
          vendorName: vendorProfile.name,
          vendorBusiness: vendorProfile.businessName,
          quotePrice: price,
          notes: quoteNotes,
          estimatedTimeline: quoteTimeline,
          submittedBy: vendorProfile.businessName || vendorProfile.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Quotation submitted successfully!', 'success');
        setQuoteModalOpen(false);
        setQuotingRequestId(null);
        setQuotePrice('');
        setQuoteNotes('');
        setQuoteTimeline('1-2 Working Days');
        fetchVendorRequests();
        fetchVendorQuotes();
      } else {
        showToastMsg(data.message || 'Failed to submit quotation', 'error');
      }
    } catch (err) {
      showToastMsg('Network error submitting quotation', 'error');
    }
  };

  const handleOpenQuote = (request) => {
    setQuotingRequestId(request.id);
    setQuotePrice('');
    setQuoteNotes('');
    setQuoteTimeline('1-2 Working Days');
    setQuoteModalOpen(true);
  };

  // ==================== QUOTATION BUILDER HANDLERS ====================
  const handleStartBuildingQuote = (req) => {
    setBuilderRequestId(req.id);
    const serviceName = (req.servicecode || '').toLowerCase();
    const area = parseFloat(req.propertySize) || 120;

    if (serviceName.includes('waterproof')) {
      setBuilderLineItems([
        { item: 'Polymer Injection Grouting for Structural Cracks', qty: Math.max(1, Math.round(area * 0.1)), unit: 'Nos', rate: 450 },
        { item: 'Elastomeric Waterproof Membrane (2 Coats)', qty: area, unit: 'Sq Ft', rate: 65 },
        { item: 'Surface Grinding, Cleaning & Mesh Reinforcement', qty: area, unit: 'Sq Ft', rate: 25 },
        { item: 'Skilled Waterproofing Labour & Clean-up', qty: 1, unit: 'Lump Sum', rate: 3000 }
      ]);
      setBuilderWarranty('');
      setBuilderTimeline('3-5 Working Days');
    } else if (serviceName.includes('paint')) {
      setBuilderLineItems([
        { item: 'Surface Scraping, Putty Base & Primer Application', qty: area, unit: 'Sq Ft', rate: 20 },
        { item: 'Premium Weatherproof Emulsion / Wall Paint', qty: area, unit: 'Sq Ft', rate: 35 },
        { item: 'Tape Masking, Scaffolding & Site Cleanup', qty: 1, unit: 'Lump Sum', rate: 2000 }
      ]);
      setBuilderWarranty('');
      setBuilderTimeline('4-6 Working Days');
    } else {
      setBuilderLineItems([
        { item: `${req.servicecode || 'Repair'} - Primary Scope & Surface Treatment`, qty: area, unit: 'Sq Ft', rate: 45 },
        { item: 'High-Durability Raw Materials & Chemical Fixings', qty: 1, unit: 'Lump Sum', rate: 2500 },
        { item: 'Execution Labour & Supervised Handover', qty: 1, unit: 'Lump Sum', rate: 2000 }
      ]);
      setBuilderWarranty('');
      setBuilderTimeline('2-3 Working Days');
    }
    setActiveTab('builder');
  };

  const handleAddLineItem = () => {
    setBuilderLineItems(prev => [
      ...prev,
      { item: '', qty: 1, unit: 'Sq Ft', rate: 0 }
    ]);
  };

  const handleRemoveLineItem = (index) => {
    setBuilderLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (index, field, value) => {
    setBuilderLineItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmitBuilderQuote = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!builderRequestId) {
      showToastMsg('Please select a customer service request to quote on', 'error');
      return;
    }
    if (builderGrandTotal <= 0) {
      showToastMsg('Quotation total must be greater than ₹0', 'error');
      return;
    }

    setIsSubmittingBuilderQuote(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hipro_auth_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const lineItemsSummary = builderLineItems
        .filter(li => li.item && li.item.trim())
        .map(li => `• ${li.item} (${li.qty} ${li.unit} @ ₹${li.rate}) = ₹${(parseFloat(li.qty) || 0) * (parseFloat(li.rate) || 0)}`)
        .join('\n');

      const formattedNotes = [
        `[DETAILED BOQ SPECIFICATION]`,
        lineItemsSummary || 'Standard Scope of Work',
        `Subtotal: ₹${effectiveBuilderSubtotal.toLocaleString('en-IN')}`,
        builderGstRate > 0 ? `GST (${builderGstRate}%): ₹${builderTaxAmount.toLocaleString('en-IN')}` : 'GST: Exempted/Inclusive',
        `Grand Total: ₹${builderGrandTotal.toLocaleString('en-IN')}`,
        builderWarranty && builderWarranty.trim() ? `Warranty / Guarantee: ${builderWarranty.trim()}` : null,
        builderNotes ? `Vendor Remarks: ${builderNotes}` : ''
      ].filter(Boolean).join('\n');

      const payload = {
        requestId: builderRequestId,
        vendorId: vendorProfile.id,
        vendorName: vendorProfile.name,
        vendorBusiness: vendorProfile.businessName,
        quotePrice: builderGrandTotal,
        notes: formattedNotes,
        estimatedTimeline: builderTimeline,
        submittedBy: vendorProfile.businessName || vendorProfile.name
      };

      const res = await fetch(`${API_BASE}/api/v1/vendors/quotes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        showToastMsg(`Quotation of ₹${builderGrandTotal.toLocaleString('en-IN')} submitted successfully!`, 'success');
        await fetchVendorRequests();
        await fetchVendorQuotes();
        setActiveTab('quotes');
      } else {
        showToastMsg(data.message || 'Failed to submit quotation', 'error');
      }
    } catch (err) {
      console.error('Submit quote error:', err);
      showToastMsg('Network error submitting quotation', 'error');
    } finally {
      setIsSubmittingBuilderQuote(false);
    }
  };

  const isVideoMedia = (url) => {
    if (!url || typeof url !== 'string') return false;
    return Boolean(url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('/videos/'));
  };

  const handleOpenPhotos = (photos, initialIndex = 0, title = 'Site Evidence') => {
    const list = Array.isArray(photos) ? photos : (photos ? [photos] : []);
    if (list.length === 0) return;
    setActivePhotoModal({
      photos: list,
      index: initialIndex >= 0 && initialIndex < list.length ? initialIndex : 0,
      title: title || 'Site Evidence'
    });
  };

  const getStatusColor = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'QUOTE_REQUESTED': return 'bg-brand-50 text-brand-700 border-brand-200';
      case 'QUOTED': return 'bg-accent-50 text-accent-700 border-accent-200';
      case 'ASSIGNED': return 'bg-success-50 text-success-700 border-success-200';
      case 'IN_PROGRESS': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'COMPLETED': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans text-[14px] font-[500] antialiased tracking-[-0.01em]">

      {/* SIDEBAR - VENDOR PANEL */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-xs`}>
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent-600 text-white flex items-center justify-center shadow-sm">
              <HardHat className="w-5 h-5 text-accent-100" />
            </div>
            <div>
              <div className="font-heading font-bold text-base tracking-tight text-slate-900 leading-none">VENDOR</div>
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-0.5">Partner Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success-50 border border-success-200 text-success-700 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse"></span>
            <span>Online</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto text-xs">
          {/* ADVENTURE & SPORTS OPERATOR MENU */}
          {isAdventure ? (
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center justify-between">
                <span>Adventure Operations</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              </div>

              <button
                onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-rose-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Compass className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-rose-600'}`} />
                  <span>Operator Dashboard</span>
                </div>
              </button>

              <button
                onClick={() => { setActiveTab('adventure'); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                  activeTab === 'adventure'
                    ? 'bg-rose-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Ticket className={`w-4 h-4 ${activeTab === 'adventure' ? 'text-white' : 'text-rose-600'}`} />
                  <span>Adventure Passes & Leads</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'adventure' ? 'bg-white/30 text-white' : 'bg-rose-100 text-rose-700'
                }`}>
                  {adventureBookings.length}
                </span>
              </button>
            </div>
          ) : (
            /* HOME & CIVIL SERVICES CONTRACTOR MENU */
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Service Operations
              </div>

              <button
                onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-brand-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-500'}`} />
                  <span>Service Dashboard</span>
                </div>
              </button>

              <button
                onClick={() => { setActiveTab('requests'); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                  activeTab === 'requests'
                    ? 'bg-brand-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList className={`w-4 h-4 ${activeTab === 'requests' ? 'text-white' : 'text-slate-500'}`} />
                  <span>Customer Requests</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'requests' ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {vendorRequests.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('builder'); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                  activeTab === 'builder'
                    ? 'bg-brand-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calculator className={`w-4 h-4 ${activeTab === 'builder' ? 'text-white' : 'text-slate-500'}`} />
                  <span>Build Quotation</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                  activeTab === 'builder' ? 'bg-white/30 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  BOQ
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('quotes'); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                  activeTab === 'quotes'
                    ? 'bg-brand-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className={`w-4 h-4 ${activeTab === 'quotes' ? 'text-white' : 'text-slate-500'}`} />
                  <span>My Quotations</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'quotes' ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {vendorQuotes.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('assigned'); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                  activeTab === 'assigned'
                    ? 'bg-brand-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase className={`w-4 h-4 ${activeTab === 'assigned' ? 'text-white' : 'text-slate-500'}`} />
                  <span>Assigned Jobs</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'assigned' ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {assignedJobs.length}
                </span>
              </button>
            </div>
          )}

          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Support</div>
            <button
              onClick={() => { setActiveTab('support'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                activeTab === 'support'
                  ? (isAdventure ? 'bg-rose-600 text-white font-semibold shadow-xs' : 'bg-brand-600 text-white font-semibold shadow-xs')
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle className={`w-4 h-4 ${activeTab === 'support' ? 'text-white' : 'text-slate-500'}`} />
                <span>Chat with Super Admin</span>
              </div>
            </button>
          </div>
        </nav>

        <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <div className={`w-8 h-8 rounded-xl ${isAdventure ? 'bg-rose-600' : 'bg-accent-600'} text-white flex items-center justify-center font-bold text-xs shadow-xs`}>
                {vendorProfile.name.charAt(0)}
              </div>
              <span className="w-2 h-2 rounded-full bg-success-500 absolute -bottom-0.5 -right-0.5 border-2 border-white"></span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-bold text-slate-800 text-xs truncate leading-tight">{vendorProfile.name}</div>
                {vendorProfile.capacity && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${vendorProfile.capacity === 'LARGE' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : vendorProfile.capacity === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                    {vendorProfile.capacity}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 truncate">{vendorProfile.businessName}</div>
              <div className="text-[9px] text-slate-500 truncate">
                {vendorProfile.currentJobCount}/{vendorProfile.maxConcurrentJobs} active jobs
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onSwitchToSuperAdmin && (
              <button
                onClick={onSwitchToSuperAdmin}
                title="Switch to Super Admin"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Log Out of Vendor Portal"
                className="p-1.5 rounded-lg text-danger-500 hover:text-danger-700 hover:bg-danger-50 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-6 sm:px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-all">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isAdventure ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {isAdventure ? 'Adventure & Sports Operator' : 'Service Contractor'}
                </span>
                <span className="text-slate-300">/</span>
                <h1 className="font-heading font-bold text-base text-slate-900 capitalize leading-tight">
                  {activeTab === 'dashboard' ? (isAdventure ? 'Operator Dashboard' : 'Service Dashboard') :
                    activeTab === 'requests' ? 'Customer Requests' :
                    activeTab === 'quotes' ? 'My Quotations' :
                    activeTab === 'assigned' ? 'Assigned Jobs' :
                    activeTab === 'adventure' ? 'Adventure Bookings & Passes' : 'Support Desk'}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 pl-2 hidden lg:inline">Active Vendor:</span>
              <select
                value={selectedVendorId}
                onChange={(e) => {
                  setSelectedVendorId(e.target.value);
                  const found = availableVendors.find(v => v.id === e.target.value);
                  showToastMsg(`Switched to ${found?.name} (${found?.category})`, 'info');
                }}
                className="text-xs font-semibold text-slate-800 bg-white px-2.5 py-1 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-xs"
              >
                {registeredVendor && (
                  <optgroup label="⭐ My Registered Partner Profile">
                    <option value={registeredVendor.id}>
                      {registeredVendor.name} ({registeredVendor.businessName}) [Your Profile]
                    </option>
                  </optgroup>
                )}
                <optgroup label="🪂 Adventure & Sports Operators">
                  {availableVendors.filter(v => v.id !== registeredVendor?.id && v.category === 'Adventure').map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.businessName})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🛠️ Home & Civil Services Providers">
                  {availableVendors.filter(v => v.id !== registeredVendor?.id && v.category !== 'Adventure').map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.businessName})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <button
              onClick={() => { fetchVendorData(); fetchAdventureBookings(); }}
              title="Refresh data"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-5 max-w-7xl w-full mx-auto">

          {/* ADVENTURE OPERATOR DASHBOARD TAB */}
          {activeTab === 'dashboard' && isAdventure && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent p-6 rounded-2xl border border-rose-200 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                      <Compass className="w-3.5 h-3.5 text-rose-600" />
                      <span>Authorized Adventure & Sports Operator</span>
                    </div>
                    <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                      Welcome back, {vendorProfile.name}
                    </h2>
                    <p className="text-slate-600 text-sm font-normal mt-1 max-w-2xl">
                      You are connected as the licensed operator for <span className="font-bold text-slate-900">{vendorProfile.businessName}</span>. Manage traveler passes, monitor guest check-ins, and prepare base camp dispatches.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activity Category</div>
                      <div className="font-bold text-slate-900">{vendorProfile.specialization}</div>
                    </div>
                    <div className="text-right hidden sm:block bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base Camp</div>
                      <div className="font-bold text-slate-900">{vendorProfile.city}</div>
                    </div>
                    <div className="text-right hidden sm:block bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operator Rating</div>
                      <div className="font-bold text-amber-600 flex items-center justify-end gap-1">
                        <span>★</span>
                        <span>{vendorProfile.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adventure KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Assigned Passes</span>
                    <Ticket className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="font-heading font-bold text-2xl text-slate-900 mt-2">{adventureBookings.length}</div>
                  <div className="text-[10px] text-rose-600 font-medium mt-1">Total bookings assigned</div>
                </div>
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Confirmed Arrivals</span>
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="font-heading font-bold text-2xl text-slate-900 mt-2">
                    {adventureBookings.filter(b => (b.status || '').toUpperCase() === 'CONFIRMED').length}
                  </div>
                  <div className="text-[10px] text-blue-600 font-medium mt-1">Awaiting base camp arrival</div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Travelers</span>
                    <Users className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="font-heading font-bold text-2xl text-slate-900 mt-2">
                    {adventureBookings.reduce((sum, b) => sum + (Number(b.guests) || 1), 0)}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-1">Scheduled guests count</div>
                </div>
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Booking Revenue</span>
                    <Banknote className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="font-heading font-bold text-2xl text-slate-900 mt-2">
                    ₹{adventureBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-amber-600 font-medium mt-1">Total confirmed pass value</div>
                </div>
              </div>

              {/* Quick Actions & Adventure Operations */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
                  <h3 className="font-heading font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-rose-500" />
                    <span>Operator Quick Actions</span>
                  </h3>
                  <div className="space-y-2.5">
                    <button
                      onClick={() => { setActiveTab('adventure'); }}
                      className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-between transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        <span>View Customer Passes & Leads</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setActiveTab('adventure'); }}
                      className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>Check-In Arrived Guests</span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => { setActiveTab('support'); }}
                      className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                        <span>Chat with Super Admin Desk</span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
                  <h3 className="font-heading font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-rose-500" />
                    <span>Operator Profile</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Business / Club</span>
                      <span className="text-xs font-semibold text-slate-800">{vendorProfile.businessName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Experience Type</span>
                      <span className="text-xs font-semibold text-slate-800">{vendorProfile.specialization}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Base Camp / City</span>
                      <span className="text-xs font-semibold text-slate-800">{vendorProfile.city}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Emergency Contact</span>
                      <span className="text-xs font-semibold text-slate-800 font-mono">{vendorProfile.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Base Pass Rate</span>
                      <span className="text-xs font-semibold text-slate-800">₹{vendorProfile.minCharge} / person</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
                  <h3 className="font-heading font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-500" />
                    <span>How Adventure Operations Work</span>
                  </h3>
                  <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold flex-shrink-0 flex items-center justify-center mt-0.5">1</span>
                      <span><strong className="text-slate-800">Traveler Books Online:</strong> Customer selects your adventure activity, slot time, and completes advance payment.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold flex-shrink-0 flex items-center justify-center mt-0.5">2</span>
                      <span><strong className="text-slate-800">Direct Lead Dispatch:</strong> Booking details (guest count, slot time, traveler phone) are dispatched instantly to your console.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold flex-shrink-0 flex items-center justify-center mt-0.5">3</span>
                      <span><strong className="text-slate-800">Base Camp Check-in:</strong> Verify traveler booking pass upon arrival and dispatch activity safely.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HOME & CIVIL SERVICES CONTRACTOR DASHBOARD TAB */}
          {activeTab === 'dashboard' && !isAdventure && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                      <HardHat className="w-3.5 h-3.5 text-blue-600" />
                      <span>Certified Service Contractor</span>
                    </div>
                    <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Welcome back, {vendorProfile.name}</h2>
                    <p className="text-slate-500 text-sm font-normal">
                      You are connected as a verified contractor for <span className="font-bold text-slate-800">{vendorProfile.businessName}</span>. View customer repair requests, submit quotations, and get assigned jobs.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Specialization</div>
                      <div className="font-bold text-slate-900">{vendorProfile.specialization}</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Experience</div>
                      <div className="font-bold text-slate-900">{vendorProfile.experience}</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rating</div>
                      <div className="font-bold text-slate-900">{vendorProfile.rating} ★</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-brand-50 border border-brand-200">
                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">Requests Received</span>
                  <div className="font-heading font-bold text-2xl text-slate-900 mt-2">{vendorRequests.length}</div>
                  <div className="text-[10px] text-brand-600 font-medium mt-1">Pending your quotation</div>
                </div>
                <div className="p-4 rounded-xl bg-accent-50 border border-accent-200">
                  <span className="text-[10px] font-bold text-accent-600 uppercase tracking-wider">Quotes Submitted</span>
                  <div className="font-heading font-bold text-2xl text-slate-900 mt-2">{vendorQuotes.length}</div>
                  <div className="text-[10px] text-accent-600 font-medium mt-1">Awaiting customer decision</div>
                </div>
                <div className="p-4 rounded-xl bg-success-50 border border-success-200">
                  <span className="text-[10px] font-bold text-success-600 uppercase tracking-wider">Jobs Assigned</span>
                  <div className="font-heading font-bold text-2xl text-slate-900 mt-2">{assignedJobs.length}</div>
                  <div className="text-[10px] text-success-600 font-medium mt-1">Minimum price winner</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Total Quote Value</span>
                  <div className="font-heading font-bold text-2xl text-slate-900 mt-2">
                    ₹{vendorQuotes.reduce((s, q) => s + (q.quotePrice || 0), 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-600 font-medium mt-1">All submitted quotes</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
                  <h3 className="font-heading font-bold text-sm text-slate-900 mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => { setActiveTab('builder'); }}
                      className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-between transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        <span>Build New Quotation (BOQ)</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setActiveTab('requests'); }}
                      className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-between transition-all shadow-xs"
                    >
                      <span>View Customer Requests</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setActiveTab('quotes'); }}
                      className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
                    >
                      <span>Review My Quotations</span>
                      <FileCheck2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setActiveTab('assigned'); }}
                      className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
                    >
                      <span>Check Assigned Jobs</span>
                      <Briefcase className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
                  <h3 className="font-heading font-bold text-sm text-slate-900 mb-4">Vendor Profile</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Business Name</span>
                      <span className="text-xs font-semibold text-slate-800">{vendorProfile.businessName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Specialization</span>
                      <span className="text-xs font-semibold text-slate-800">{vendorProfile.specialization}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">City</span>
                      <span className="text-xs font-semibold text-slate-800">{vendorProfile.city}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Contact</span>
                      <span className="text-xs font-semibold text-slate-800">{vendorProfile.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Min Charge</span>
                      <span className="text-xs font-semibold text-slate-800">₹{vendorProfile.minCharge}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
                  <h3 className="font-heading font-bold text-sm text-slate-900 mb-4">How It Works</h3>
                  <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 text-[10px] font-bold flex-shrink-0 flex items-center justify-center mt-0.5">1</span>
                      <span>Super Admin shares a customer repair request with damage photos and address.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 text-[10px] font-bold flex-shrink-0 flex items-center justify-center mt-0.5">2</span>
                      <span>Review the requirement and submit your quotation price.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 text-[10px] font-bold flex-shrink-0 flex items-center justify-center mt-0.5">3</span>
                      <span>The Super Admin <span className="font-bold text-success-700">manually assigns</span> the job to a vendor.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REQUESTS TAB */}
          {activeTab === 'requests' && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading font-semibold text-base text-slate-800">Customer Requests Shared with You</h2>
                  <p className="text-[11px] text-slate-400">Review damage requirements and submit your quotation for each request.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {vendorRequests.map(req => {
                  const alreadyQuoted = req.hasQuoted || !!req.myQuote || vendorQuotes.some(q => q.requestId === req.id);
                  const media = Array.isArray(req.mediaUrl) ? req.mediaUrl : (req.mediaUrl ? [req.mediaUrl] : []);
                  return (
                    <div key={req.id} className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-sm sm:text-base text-brand-600 tracking-wide">{req.requestNumber}</span>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${req.urgency === 'HIGH' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                              {req.urgency || 'NORMAL'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(req.status)}`}>{req.status}</span>
                          </div>
                          {alreadyQuoted && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success-100 text-success-700 border border-success-200">
                              Quoted
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 tracking-tight">{req.servicecode}</h3>
                          {req.subServiceCode && <p className="text-xs sm:text-sm font-semibold text-brand-600 mt-0.5">{req.subServiceCode}</p>}
                        </div>

                        <div className="p-3.5 sm:p-4 bg-slate-50/90 rounded-xl text-sm text-slate-700 leading-relaxed border border-slate-200 font-normal">
                          <span className="font-bold text-slate-900">Customer Requirement:</span> {req.issueDescription}
                        </div>

                        {media.length > 0 ? (
                          <div className="space-y-1.5">
                            <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                              <span>Site Evidence ({media.length} items):</span>
                              <span className="text-[11px] text-brand-600 font-medium">Click to inspect</span>
                            </div>
                            <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar">
                              {media.map((itemUrl, i) => {
                                const isVid = isVideoMedia(itemUrl);
                                return (
                                  <div
                                    key={i}
                                    onClick={() => handleOpenPhotos(media, i, `${req.requestNumber ? `${req.requestNumber} ` : ''}Site Evidence`)}
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-slate-200 cursor-pointer relative group shrink-0 hover:border-brand-500 hover:shadow-md transition-all"
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
                          <div className="p-3 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-xs sm:text-sm text-slate-400 italic">No site photos or videos uploaded</div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm pt-3 border-t border-slate-100 text-slate-600">
                          <div className="flex items-center gap-2"><Home className="w-4 h-4 text-slate-400 shrink-0" /><span className="font-medium text-slate-700">{req.propertyType || 'Property'}</span></div>
                          <div className="flex items-center gap-2"><Maximize className="w-4 h-4 text-slate-400 shrink-0" /><span className="font-bold text-slate-800">{req.propertySize || '—'} Sq Ft</span></div>
                          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400 shrink-0" /><span className="font-medium text-slate-700">{req.preferredDate || 'Flexible'}</span></div>
                        </div>
                      </div>

                      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                        {!alreadyQuoted ? (
                          <div className="flex items-center gap-2 w-full">
                            <button
                              onClick={() => handleStartBuildingQuote(req)}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
                            >
                              <Calculator className="w-3.5 h-3.5" /> Build BOQ Quote
                            </button>
                            <button
                              onClick={() => handleOpenQuote(req)}
                              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1"
                              title="Quick Lump-Sum Quotation"
                            >
                              Quick
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Quote: ₹{(req.myQuote?.quotePrice || vendorQuotes.find(q => q.requestId === req.id)?.quotePrice || 0).toLocaleString('en-IN')}
                            </span>
                            <button
                              onClick={() => setActiveTab('quotes')}
                              className="text-xs text-brand-600 hover:underline font-semibold"
                            >
                              View in Quotes →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {vendorRequests.length === 0 && (
                  <div className="col-span-full py-16 text-center">
                    <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-4" />
                    <p className="font-semibold text-sm text-slate-600">No customer requests shared yet</p>
                    <p className="text-xs text-slate-400">The Super Admin will share customer repair requests with you here. Once shared, you can view damage photos, requirements, and submit quotations.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BUILD QUOTATION (BOQ) TAB */}
          {activeTab === 'builder' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 1. Header & Mode Switcher */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-heading font-bold text-lg text-slate-900">Build Quotation & BOQ Specification</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Vendor Desk
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Create itemized Bill of Quantities (BOQ), material and labour estimates, and submit your official quote.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
                  <button
                    type="button"
                    onClick={() => setBuilderMode('boq')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      builderMode === 'boq'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Itemized BOQ Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuilderMode('lumpsum')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      builderMode === 'lumpsum'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Quick Lump-Sum Mode
                  </button>
                </div>
              </div>

              {/* 2. Step 1: Select Service Request */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                    <h3 className="font-heading font-bold text-sm text-slate-900">Select Customer Service Request to Quote On</h3>
                  </div>
                  {builderRequestId && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Request Selected
                    </span>
                  )}
                </div>

                {selectedBuilderRequest ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-brand-200 relative">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-brand-600">{selectedBuilderRequest.requestNumber}</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-brand-100 text-brand-800">
                            {selectedBuilderRequest.servicecode}
                          </span>
                          {selectedBuilderRequest.subServiceCode && (
                            <span className="text-xs text-slate-600 font-medium">({selectedBuilderRequest.subServiceCode})</span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(selectedBuilderRequest.status)}`}>
                            {selectedBuilderRequest.status}
                          </span>
                          {selectedBuilderRequest.urgency === 'HIGH' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Urgent</span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 font-normal leading-relaxed">
                          <strong className="text-slate-900">Customer Issue:</strong> {selectedBuilderRequest.issueDescription}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200/80">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Property</span>
                            <span className="font-medium text-slate-800">{selectedBuilderRequest.propertyType || 'Villa/Flat'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Area Size</span>
                            <span className="font-medium text-slate-800">{selectedBuilderRequest.propertySize || '150'} Sq Ft</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Location</span>
                            <span className="font-medium text-slate-800">{selectedBuilderRequest.location || selectedBuilderRequest.addressline || 'Local City'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Preferred Date</span>
                            <span className="font-medium text-slate-800">{selectedBuilderRequest.preferredDate || 'Flexible'}</span>
                          </div>
                        </div>

                        {selectedBuilderRequest.mediaUrl && (Array.isArray(selectedBuilderRequest.mediaUrl) ? selectedBuilderRequest.mediaUrl : [selectedBuilderRequest.mediaUrl]).filter(Boolean).length > 0 && (
                          <div className="pt-2">
                            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Inspection Photos:</span>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {(Array.isArray(selectedBuilderRequest.mediaUrl) ? selectedBuilderRequest.mediaUrl : [selectedBuilderRequest.mediaUrl]).filter(Boolean).map((img, i) => {
                                const mediaList = (Array.isArray(selectedBuilderRequest.mediaUrl) ? selectedBuilderRequest.mediaUrl : [selectedBuilderRequest.mediaUrl]).filter(Boolean);
                                return (
                                  <div
                                    key={i}
                                    onClick={() => handleOpenPhotos(
                                      mediaList,
                                      i,
                                      `${selectedBuilderRequest.requestNumber ? `${selectedBuilderRequest.requestNumber} ` : ''}Site Evidence`
                                    )}
                                    className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:border-brand-500 shrink-0 relative bg-slate-100"
                                  >
                                    {isVideoMedia(img) ? (
                                      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white">
                                        <Video className="w-5 h-5 text-brand-400" />
                                        <span className="text-[9px] font-bold mt-0.5">Video</span>
                                      </div>
                                    ) : (
                                      <img
                                        src={img}
                                        alt="Damage inspection"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80'; }}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setBuilderRequestId('')}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
                        >
                          Change Request
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      Choose an open customer request from your city ({vendorProfile?.city || 'Hub'}) to start building your quote:
                    </p>
                    {vendorRequests.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                        {vendorRequests.map(r => {
                          const isQuoted = r.hasQuoted || vendorQuotes.some(q => q.requestId === r.id);
                          return (
                            <div
                              key={r.id}
                              onClick={() => handleStartBuildingQuote(r)}
                              className="p-3.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-sm cursor-pointer transition-all bg-white flex flex-col justify-between space-y-2 group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-xs text-brand-600">{r.requestNumber}</span>
                                {isQuoted ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Quoted</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Select →</span>
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">{r.servicecode}</h4>
                                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{r.issueDescription || 'Repair inspection'}</p>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                                <span>{r.propertySize ? `${r.propertySize} Sq Ft` : (r.propertyType || 'Villa')}</span>
                                <span className="text-slate-600 font-medium">{r.location || r.city || 'Local'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <ClipboardList className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-xs text-slate-600 font-medium">No open customer requests currently available in your hub.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">As soon as customers book inspections or Super Admin shares requests, they will appear here.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Step 2: Line Items & BOQ Specification */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                    <h3 className="font-heading font-bold text-sm text-slate-900">
                      {builderMode === 'boq' ? 'Itemized Scope of Work & BOQ Line Items' : 'Quick Quotation Amount'}
                    </h3>
                  </div>

                  {builderMode === 'boq' && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400 font-medium mr-1">Trade Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setBuilderLineItems([
                            { item: 'Polymer Crack Injection Grouting', qty: 10, unit: 'Nos', rate: 450 },
                            { item: 'Elastomeric Waterproof Coating (2 Coats)', qty: 250, unit: 'Sq Ft', rate: 65 },
                            { item: 'Fibre Glass Mesh Reinforcement', qty: 250, unit: 'Sq Ft', rate: 20 },
                            { item: 'Surface Cleaning, Grinding & Debris Disposal', qty: 1, unit: 'Lump Sum', rate: 2500 }
                          ]);
                        }}
                        className="px-2.5 py-1 text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                      >
                        Waterproofing
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBuilderLineItems([
                            { item: 'Wall Scraping, Primer & Double Putty', qty: 300, unit: 'Sq Ft', rate: 22 },
                            { item: 'Premium Weather-Shield Emulsion (2 Coats)', qty: 300, unit: 'Sq Ft', rate: 38 },
                            { item: 'Scaffolding, Masking & Final Cleanup', qty: 1, unit: 'Lump Sum', rate: 2000 }
                          ]);
                        }}
                        className="px-2.5 py-1 text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                      >
                        Painting
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBuilderLineItems([
                            { item: 'Structural Brick Masonry & Plastering', qty: 150, unit: 'Sq Ft', rate: 75 },
                            { item: 'Cement & High-Strength Concrete Mix', qty: 1, unit: 'Lump Sum', rate: 3500 },
                            { item: 'Skilled Mason Labour & Material Handling', qty: 1, unit: 'Lump Sum', rate: 4000 }
                          ]);
                        }}
                        className="px-2.5 py-1 text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                      >
                        Civil / Masonry
                      </button>
                    </div>
                  )}
                </div>

                {builderMode === 'boq' ? (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                            <th className="py-2.5 px-3 font-semibold text-slate-700">Scope Item / Description</th>
                            <th className="py-2.5 px-3 font-semibold text-slate-700 w-24">Qty</th>
                            <th className="py-2.5 px-3 font-semibold text-slate-700 w-28">Unit</th>
                            <th className="py-2.5 px-3 font-semibold text-slate-700 w-28">Rate (₹)</th>
                            <th className="py-2.5 px-3 font-semibold text-slate-700 text-right w-28">Total (₹)</th>
                            <th className="py-2.5 px-2 w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {builderLineItems.map((li, idx) => {
                            const lineTotal = (parseFloat(li.qty) || 0) * (parseFloat(li.rate) || 0);
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={li.item}
                                    onChange={(e) => handleUpdateLineItem(idx, 'item', e.target.value)}
                                    placeholder="e.g. 2 Coats Elastomeric Coating"
                                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value={li.qty}
                                    onChange={(e) => handleUpdateLineItem(idx, 'qty', e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <select
                                    value={li.unit}
                                    onChange={(e) => handleUpdateLineItem(idx, 'unit', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                                  >
                                    <option value="Sq Ft">Sq Ft</option>
                                    <option value="Rft">Running Ft</option>
                                    <option value="Lump Sum">Lump Sum</option>
                                    <option value="Nos">Nos / Units</option>
                                    <option value="Hours">Hours</option>
                                    <option value="Days">Days</option>
                                    <option value="Bags">Bags</option>
                                    <option value="Ltrs">Ltrs</option>
                                  </select>
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value={li.rate}
                                    onChange={(e) => handleUpdateLineItem(idx, 'rate', e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                                  />
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                                  ₹{lineTotal.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  {builderLineItems.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveLineItem(idx)}
                                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                      title="Remove Line Item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={handleAddLineItem}
                        className="px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-all inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Scope Item
                      </button>
                      <div className="text-xs text-slate-600">
                        Line Items Subtotal: <strong className="font-mono text-sm text-slate-900">₹{builderLineItemsTotal.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-md space-y-3">
                    <label className="block text-xs font-semibold text-slate-700">
                      Total Quotation Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">₹</span>
                      <input
                        type="number"
                        min="1"
                        value={builderCustomPrice}
                        onChange={(e) => setBuilderCustomPrice(e.target.value)}
                        placeholder="e.g. 12500"
                        className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">Enter a single consolidated package amount for this repair job.</p>
                  </div>
                )}
              </div>

              {/* 4. Step 3: Terms, Taxes & Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                    <h3 className="font-heading font-bold text-sm text-slate-900">Execution Timeline & Warranty</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Estimated Completion Timeline
                      </label>
                      <select
                        value={builderTimeline}
                        onChange={(e) => setBuilderTimeline(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="1-2 Working Days">1-2 Working Days (Express)</option>
                        <option value="3-5 Working Days">3-5 Working Days (Standard)</option>
                        <option value="1 Week">1 Week</option>
                        <option value="1-2 Weeks">1-2 Weeks</option>
                        <option value="2-3 Weeks">2-3 Weeks</option>
                        <option value="1 Month">1 Month (Major Structural)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <span>Warranty / Guarantee</span>
                          <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Optional</span>
                        </label>
                        {builderWarranty && (
                          <button
                            type="button"
                            onClick={() => setBuilderWarranty('')}
                            className="text-[10px] font-bold text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={builderWarranty}
                        onChange={(e) => setBuilderWarranty(e.target.value)}
                        placeholder="Optional: e.g. 1 Year Leakproof Guarantee (leave blank if none)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">Quick options:</span>
                        {[
                          'No Warranty',
                          '6 Months Guarantee',
                          '1 Year Warranty',
                          '3 Years Warranty',
                          '5 Years Guarantee'
                        ].map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setBuilderWarranty(preset === 'No Warranty' ? '' : preset)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                              (preset === 'No Warranty' && !builderWarranty) || builderWarranty === preset
                                ? 'bg-brand-50 border-brand-300 text-brand-700 font-bold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Applicable Tax / GST
                      </label>
                      <select
                        value={builderGstRate}
                        onChange={(e) => setBuilderGstRate(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value={18}>18% GST (Standard Services / Works Contract)</option>
                        <option value={12}>12% GST (Composite Works)</option>
                        <option value={5}>5% GST (Concessional)</option>
                        <option value={0}>0% GST (Inclusive / Composition / Exempt)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                    <h3 className="font-heading font-bold text-sm text-slate-900">Technical Approach & Remarks</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Notes / Scope Clarification for Super Admin & Customer
                    </label>
                    <textarea
                      rows={5}
                      value={builderNotes}
                      onChange={(e) => setBuilderNotes(e.target.value)}
                      placeholder="e.g. Quotation includes Dr. Fixit chemical waterproofing, surface grinding, primer coat and scaffolding. Debris will be cleared upon handover."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 leading-relaxed font-normal"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Summary & Submission Card */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Final Quotation Commercials</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-mono font-bold tracking-tight">₹{builderGrandTotal.toLocaleString('en-IN')}</span>
                    {builderGstRate > 0 && (
                      <span className="text-xs text-slate-300">
                        (₹{effectiveBuilderSubtotal.toLocaleString('en-IN')} + ₹{builderTaxAmount.toLocaleString('en-IN')} GST)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap pt-1">
                    <span>Timeline: <strong>{builderTimeline}</strong></span>
                    <span>•</span>
                    <span>
                      Warranty: {builderWarranty ? (
                        <strong className="text-emerald-300">{builderWarranty}</strong>
                      ) : (
                        <span className="text-slate-400 font-normal">None (Optional)</span>
                      )}
                    </span>
                    <span>•</span>
                    <span>Quoting Vendor: <strong>{vendorProfile.businessName || vendorProfile.name}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBuilderRequestId('');
                      setBuilderCustomPrice('');
                      setBuilderNotes('');
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition-all"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingBuilderQuote || !builderRequestId || builderGrandTotal <= 0}
                    onClick={handleSubmitBuilderQuote}
                    className="px-6 py-3 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {isSubmittingBuilderQuote ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting Quotation...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Official Quotation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QUOTATIONS TAB */}
          {activeTab === 'quotes' && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading font-semibold text-base text-slate-800">My Submitted Quotations</h2>
                  <p className="text-[11px] text-slate-400">Track quotations you have submitted to customers via Super Admin.</p>
                </div>
                <button
                  onClick={() => setActiveTab('builder')}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Build New Quotation
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                        <th className="py-3 px-4 font-semibold text-slate-700">Request #</th>
                        <th className="py-3 px-4 font-semibold text-slate-700">Customer</th>
                        <th className="py-3 px-4 font-semibold text-slate-700">Service</th>
                        <th className="py-3 px-4 font-semibold text-slate-700 text-right">Your Quote (₹)</th>
                        <th className="py-3 px-4 font-semibold text-slate-700">Timeline</th>
                        <th className="py-3 px-4 font-semibold text-slate-700 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vendorQuotes.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-400">
                            <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <p className="font-semibold text-sm text-slate-600">No quotations submitted yet</p>
                            <p className="text-xs text-slate-400">Go to Customer Requests and submit your first quotation.</p>
                          </td>
                        </tr>
                      ) : (
                        vendorQuotes.map(q => (
                          <tr key={q.id} className="hover:bg-slate-50/80 transition-all">
                            <td className="py-4 px-4 font-mono font-bold text-slate-800">{q.requestNumber || q.requestId}</td>
                            <td className="py-4 px-4 font-medium text-slate-900">{q.customerName || 'Customer'}</td>
                            <td className="py-4 px-4 text-slate-700">{q.serviceName || 'Repair Service'}</td>
                            <td className="py-4 px-4 font-mono text-right">
                              <span className={`font-bold ${q.status === 'ASSIGNED' ? 'text-success-700' : 'text-brand-700'}`}>
                                ₹{(q.quotePrice || 0).toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-600">{q.estimatedTimeline || '1-2 Days'}</td>
                            <td className="py-4 px-4 text-right">
                              <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-bold border ${getStatusColor(q.status)}`}>{q.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ASSIGNED JOBS TAB */}
          {activeTab === 'assigned' && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading font-semibold text-base text-slate-800">Assigned Jobs</h2>
                  <p className="text-[11px] text-slate-400">Jobs assigned to you by the Super Admin.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {assignedJobs.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-white rounded-xl border border-slate-200/80 shadow-xs">
                    <Award className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <p className="font-semibold text-sm text-slate-600">No assigned jobs yet</p>
                    <p className="text-xs text-slate-400">When the Super Admin assigns a job to you, it will appear here.</p>
                  </div>
                ) : (
                  assignedJobs.map(job => (
                    <div key={job.id} className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-success-100 text-success-700 border border-success-200 mb-2 inline-block">Assigned</span>
                          <h3 className="font-heading font-bold text-base text-slate-900">{job.serviceName || 'Repair Job'}</h3>
                          <div className="text-xs sm:text-sm text-slate-500 font-mono mt-0.5">Request #{job.requestNumber || job.requestId}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-xl text-success-700">₹{(job.quotePrice || 0).toLocaleString('en-IN')}</div>
                          <div className="text-[10px] text-success-600 font-medium">Assigned Price</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-slate-400" /><span className="text-sm text-slate-700">{job.customerName || 'Customer'}</span></div>
                        <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /><span className="text-sm text-slate-700 truncate">{job.addressline || 'Address to be confirmed'}</span></div>
                        <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /><a href={`tel:${job.customerPhone || ''}`} className="text-sm text-slate-700 font-medium">{job.customerPhone || 'N/A'}</a></div>
                        <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" /><span className="text-sm text-slate-700">{job.preferredDate || 'TBD'}</span></div>
                      </div>
                      <div className="mt-5 pt-4 border-t border-slate-100">
                        <button
                          className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Contact Customer to Start Work</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SUPPORT TAB - REAL-TIME SUPER ADMIN CHAT */}
          {activeTab === 'support' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading font-semibold text-base text-slate-800 flex items-center gap-2">
                    <MessageCircle className={`w-5 h-5 ${isAdventure ? 'text-rose-600' : 'text-brand-600'}`} />
                    <span>{isAdventure ? 'Adventure Operations Desk' : 'Vendor Partner Support Desk'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live direct communication between {vendorProfile.businessName || vendorProfile.name} and Super Admin Technical Desk.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchVendorChatMessages()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${chatLoading ? 'animate-spin text-brand-600' : 'text-slate-500'}`} />
                  <span>Refresh Chat</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[620px] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      <Shield className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {isAdventure ? 'Hipro Adventure Central Control Desk' : 'Hipro Super Admin Operations Desk'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Official Partner Dispatch • Room: {`thread_vendor_${vendorProfile.id}`}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Admin Online
                  </span>
                </div>

                {/* Message Stream */}
                <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-slate-50/70 space-y-3.5">
                  {/* Pinned Welcome Greeting */}
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200/90 text-slate-800 p-3.5 rounded-2xl rounded-tl-xs text-xs max-w-[85%] sm:max-w-[75%] shadow-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Shield className="w-3 h-3 text-emerald-600" />
                        <span>Hipro Official Desk</span>
                      </div>
                      <p className="leading-relaxed">
                        Hello <strong>{vendorProfile.name}</strong>! Welcome to the Super Admin Desk for <strong>{vendorProfile.businessName}</strong>. You can message us here anytime regarding customer job allocations, BOQ quote clarification, site inspections, or payments.
                      </p>
                    </div>
                  </div>

                  {/* Real-time Dynamic Messages */}
                  {chatMessages.map(msg => {
                    const isFromVendor = msg.sender === 'vendor';
                    return (
                      <div
                        key={msg.id || msg.createdAt}
                        className={`flex flex-col ${isFromVendor ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 mb-1 px-1">
                          <span>{isFromVendor ? 'You (Partner Desk)' : (msg.senderName || 'Super Admin Desk')}</span>
                          <span>•</span>
                          <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                        </div>
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm font-medium shadow-xs ${
                            isFromVendor
                              ? (isAdventure ? 'bg-rose-600 text-white rounded-tr-xs' : 'bg-brand-600 text-white rounded-tr-xs')
                              : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                          {isFromVendor && (
                            <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-white/80">
                              <CheckCheck className="w-3 h-3" />
                              <span>Delivered to Admin</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="p-3 sm:p-4 bg-white border-t border-slate-200/80 shrink-0">
                  <form onSubmit={handleSendVendorMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      placeholder={isAdventure ? "Message Adventure Central Desk..." : "Message Super Admin Technical Desk..."}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                      disabled={isSendingChat}
                    />
                    <button
                      type="submit"
                      disabled={isSendingChat || !chatInputText.trim()}
                      className={`px-4 py-2.5 rounded-xl ${
                        isAdventure
                          ? 'bg-rose-600 hover:bg-rose-700'
                          : 'bg-brand-600 hover:bg-brand-700'
                      } disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0`}
                    >
                      {isSendingChat ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ADVENTURE & SPORTS PASSES TAB */}
          {activeTab === 'adventure' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-danger-50 text-danger-600 border border-danger-200">
                    <Compass className="w-6 h-6" />
                  </span>
                  <div>
                    <h2 className="font-heading font-bold text-base text-slate-800">
                      Adventure Passes & Customer Leads
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Real-time traveler bookings for {vendorProfile.businessName}. Dispatch directions and check travelers in upon arrival.
                    </p>
                  </div>
                </div>

                <button
                  onClick={fetchAdventureBookings}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sync Passes</span>
                </button>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-semibold uppercase">Total Passes</span>
                    <Ticket className="w-4 h-4 text-danger-500" />
                  </div>
                  <div className="text-xl font-heading font-bold text-slate-800">
                    {adventureBookings.length}
                  </div>
                  <span className="text-[10px] text-slate-400">Assigned bookings</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-semibold uppercase">Confirmed</span>
                    <CheckCircle2 className="w-4 h-4 text-primary-500" />
                  </div>
                  <div className="text-xl font-heading font-bold text-primary-600">
                    {adventureBookings.filter(b => (b.status || '').toUpperCase() === 'CONFIRMED').length}
                  </div>
                  <span className="text-[10px] text-slate-400">Awaiting arrival</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-semibold uppercase">Checked-In</span>
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xl font-heading font-bold text-emerald-600">
                    {adventureBookings.filter(b => (b.status || '').toUpperCase() === 'CHECKED_IN' || (b.status || '').toUpperCase() === 'COMPLETED').length}
                  </div>
                  <span className="text-[10px] text-slate-400">At base camp / done</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-semibold uppercase">Total Guests</span>
                    <Users className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-xl font-heading font-bold text-indigo-600">
                    {adventureBookings.reduce((sum, b) => sum + (Number(b.guests) || 1), 0)}
                  </div>
                  <span className="text-[10px] text-slate-400">Travelers count</span>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
                  {['ALL', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setAdventureStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        adventureStatusFilter === st
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'ALL' ? 'All Leads' : st.replace('_', ' ')}
                      <span className="ml-1.5 text-[10px] opacity-70">
                        ({st === 'ALL' ? adventureBookings.length : adventureBookings.filter(b => (b.status || '').toUpperCase() === st).length})
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adventureSearch}
                    onChange={(e) => setAdventureSearch(e.target.value)}
                    placeholder="Search traveler, phone, pass code..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 focus:bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-500 font-medium"
                  />
                </div>
              </div>

              {/* Bookings List */}
              {(() => {
                const filtered = adventureBookings.filter((b) => {
                  const matchStatus = adventureStatusFilter === 'ALL' || (b.status || '').toUpperCase() === adventureStatusFilter;
                  const q = adventureSearch.toLowerCase();
                  const matchSearch = !adventureSearch ||
                    (b.bookingCode || '').toLowerCase().includes(q) ||
                    (b.travelerName || '').toLowerCase().includes(q) ||
                    (b.travelerPhone || '').includes(q) ||
                    (b.experienceTitle || '').toLowerCase().includes(q);
                  return matchStatus && matchSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                      <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <h4 className="font-heading font-semibold text-sm text-slate-700">No adventure passes found</h4>
                      <p className="text-xs text-slate-400 mt-1">Customer adventure bookings assigned to your operator profile will appear here with customer contact, time slot and check-in options.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filtered.map((b) => (
                      <div
                        key={b.id || b.bookingCode}
                        className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <span className="w-12 h-12 rounded-2xl bg-danger-50 text-danger-600 flex items-center justify-center shrink-0 border border-danger-200 font-bold text-sm">
                            <Compass className="w-6 h-6" />
                          </span>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                                {b.bookingCode || b.id}
                              </span>
                              <h3 className="font-heading font-bold text-sm text-slate-900">
                                {b.experienceTitle}
                              </h3>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                                b.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-700' :
                                b.status === 'COMPLETED' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {b.status || 'CONFIRMED'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-xs text-slate-600 pt-1">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" />
                                <span>Customer: <strong className="text-slate-900 font-semibold">{b.travelerName}</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span>Mobile: <strong className="text-slate-900 font-semibold">{b.travelerPhone}</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span>Date: <strong className="text-slate-900 font-semibold">{b.travelDate}</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span>Slot: <strong className="text-slate-900 font-semibold">{b.timeSlot}</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span>Party: <strong className="text-slate-900 font-semibold">{b.guests || 1} Travelers</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-slate-400" />
                                <span>Amount: <strong className="text-emerald-700 font-bold">₹{b.totalAmount || b.price}</strong> ({b.paymentStatus || 'PAID'})</span>
                              </div>
                            </div>

                            {b.reportingPoint && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                                <MapPin className="w-3.5 h-3.5 text-danger-500 shrink-0" />
                                <span>Base Camp: {b.reportingPoint}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Direct Vendor Actions */}
                        <div className="flex flex-row lg:flex-col items-end gap-2 shrink-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">Status:</span>
                            <select
                              value={b.status || 'CONFIRMED'}
                              onChange={(e) => handleUpdateAdventureStatus(b.id || b.bookingCode, e.target.value)}
                              className="text-xs px-2.5 py-1 font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-danger-500"
                            >
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="CHECKED_IN">CHECKED_IN</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <a
                              href={`tel:${b.travelerPhone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
                            >
                              <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
                              <span>Call</span>
                            </a>
                            <button
                              onClick={() => openWhatsAppTraveler(b)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp Details</span>
                            </button>
                            {b.status !== 'CHECKED_IN' && b.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleUpdateAdventureStatus(b.id || b.bookingCode, 'CHECKED_IN')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-all"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Check-In</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
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

      {/* Quotation Submission Modal */}
      {quoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setQuoteModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-200/50 flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-slate-900">Submit Quotation</h3>
              <button onClick={() => setQuoteModalOpen(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitQuote} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quotation Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">₹</span>
                  <input
                    type="number"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    placeholder="e.g. 8500"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes / Scope Details</label>
                <textarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Describe your approach, materials, warranty..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated Timeline</label>
                <select
                  value={quoteTimeline}
                  onChange={(e) => setQuoteTimeline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="1-2 Working Days">1-2 Working Days</option>
                  <option value="3-5 Working Days">3-5 Working Days</option>
                  <option value="1 Week">1 Week</option>
                  <option value="2 Weeks">2 Weeks</option>
                </select>
              </div>
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  <span className="text-sm font-semibold text-slate-800">Customer Address:</span>
                </div>
                <p className="text-xs text-slate-600">
                  {vendorRequests.find(r => r.id === quotingRequestId)?.addressline || 'Address will be shared upon assignment'}
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm hover:shadow-md transition-all"
                >
                  Submit Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border transform transition-all duration-300 ${
          toast.type === 'success' ? 'bg-success-50 text-success-800 border-success-200' :
          toast.type === 'error' ? 'bg-danger-50 text-danger-800 border-danger-200' :
          'bg-brand-50 text-brand-800 border-brand-200'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
            {toast.type === 'info' && <Info className="w-4 h-4" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
