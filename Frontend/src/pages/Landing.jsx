import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Phone,
  Building,
  Layers,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Send,
  AlertCircle,
  Lock,
  Eye,
  CheckCheck,
  RotateCcw,
  Zap,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitEnquiry, checkBackendHealth } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

const PREVIEW_STAGES = [
  'enquiry',
  'spec_sheet',
  'design_sample',
  'approved',
  'production',
  'qc_passed',
  'dispatch',
  'delivered',
];

const QUESTION_ROTATIONS = [
  { label: 'order?', badge: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30' },
  { label: 'sample?', badge: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/30' },
  { label: 'dispatch?', badge: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30' },
  { label: 'QC proof?', badge: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30' },
];

const STAGE_REACTIONS = {
  enquiry: '📦 👍',
  spec_sheet: '📐 📝',
  design_sample: '✨ 👌',
  approved: '💰 🤝',
  production: '⚙️ 🔥',
  qc_passed: '🛡️ 💯',
  dispatch: '🚚 ⚡',
  delivered: '🎉 ⭐',
};

export default function Landing() {
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Enquiry form state
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    company_name: '',
    box_type: 'Mailer Box',
    quantity: 3000,
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [submitError, setSubmitError] = useState('');

  // Interactive WhatsApp phone preview stage selector & animation state
  const [previewStage, setPreviewStage] = useState('enquiry');
  const [isTyping, setIsTyping] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  // Big Text question rotation index
  const [questionIdx, setQuestionIdx] = useState(0);

  // Cycle question word every 2.8s
  useEffect(() => {
    const qTimer = setInterval(() => {
      setQuestionIdx((prev) => (prev + 1) % QUESTION_ROTATIONS.length);
    }, 2800);
    return () => clearInterval(qTimer);
  }, []);

  // Step stage navigation helpers
  const handleNextStage = () => {
    setPreviewStage((prev) => {
      const currentIndex = PREVIEW_STAGES.indexOf(prev);
      return PREVIEW_STAGES[(currentIndex + 1) % PREVIEW_STAGES.length];
    });
  };

  const handlePrevStage = () => {
    setPreviewStage((prev) => {
      const currentIndex = PREVIEW_STAGES.indexOf(prev);
      return PREVIEW_STAGES[(currentIndex - 1 + PREVIEW_STAGES.length) % PREVIEW_STAGES.length];
    });
  };

  // Auto-cycle through stages
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      handleNextStage();
    }, 4200);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  // Brief typing indicator & slide-down notification on stage transition
  useEffect(() => {
    setIsTyping(true);
    setShowNotification(true);

    const typingTimeout = setTimeout(() => {
      setIsTyping(false);
    }, 400);

    const notifTimeout = setTimeout(() => {
      setShowNotification(false);
    }, 2600);

    return () => {
      clearTimeout(typingTimeout);
      clearTimeout(notifTimeout);
    };
  }, [previewStage]);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth().then((res) => {
      setBackendStatus(res ? 'online' : 'offline');
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.customer_name.trim() || !formData.customer_phone.trim()) {
      setSubmitError('Please enter your name and WhatsApp phone number.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitEnquiry(formData);
      setSubmittedData({
        ...formData,
        enquiryId: res.enquiryId || 'ENQ-991',
      });
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {}
    } catch (err) {
      setSubmitError(err.message || 'Could not connect to backend server. Make sure port 5000 is running.');
    } finally {
      setSubmitting(false);
    }
  };

  const sampleMessages = {
    enquiry: {
      title: '1. Order Confirmed',
      recipient: 'Customer & Owner',
      text: `Hi ${formData.customer_name || 'Sanjay'}, your order #BX-2041 for ${Number(formData.quantity || 1000).toLocaleString()} ${formData.box_type} is confirmed. Track it anytime: https://boxshop.trackvriksha.in/track/BX-2041`,
    },
    spec_sheet: {
      title: '2. Spec Sheet Ready',
      recipient: 'Customer (Approval link)',
      text: `Your spec sheet and design for order #BX-2041 are ready. Ply: 5-Ply, 180 GSM Kraft. Please review and approve: https://boxshop.trackvriksha.in/spec/BX-2041`,
    },
    design_sample: {
      title: '3. Physical Sample Ready',
      recipient: 'Customer (Preview & approve)',
      text: `Design uploaded & sample #SMP-BX-2041 created on Shelf A-1. Preview & sign-off here: https://boxshop.trackvriksha.in/sample/BX-2041`,
    },
    approved: {
      title: '4. Order Approved & Scheduled',
      recipient: 'Owner & Production Head',
      text: `Order #BX-2041 approved by ${formData.customer_name || 'Sanjay'}. Advance ₹15,000 confirmed. Scheduled on corrugator Line 2.`,
    },
    production: {
      title: '5. In Production',
      recipient: 'Customer',
      text: `Good news! Order #BX-2041 has started printing & rotary die-cutting. Ready date: 10 Oct 2026.`,
    },
    qc_passed: {
      title: '6. QC 100% Passed',
      recipient: 'Owner & Customer (Photos)',
      text: `Order #BX-2041 passed 6-point QC check (Burst: 18 BF, Moisture: 7.2%). Verified photos: https://boxshop.trackvriksha.in/track/BX-2041`,
    },
    dispatch: {
      title: '7. Order Dispatched',
      recipient: 'Customer',
      text: `Order #BX-2041 loaded on vehicle Tata Ace (OD-02-X-4912). Driver phone: 9437188291. Live tracker: https://boxshop.trackvriksha.in/track/BX-2041`,
    },
    delivered: {
      title: '8. Delivered & Feedback',
      recipient: 'Customer',
      text: `Order #BX-2041 delivered successfully. Thank you for choosing Box Shop! Tell us how we did: https://boxshop.trackvriksha.in/review/BX-2041`,
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Top pilot status strip */}
      <div className="bg-emerald-100/70 dark:bg-gradient-to-r dark:from-emerald-950 dark:via-slate-900 dark:to-emerald-950 border-b border-emerald-300 dark:border-emerald-500/20 px-3 sm:px-4 py-2 text-xs text-slate-700 dark:text-slate-300 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-800 dark:text-emerald-400">PILOT:</span>
            <span className="line-clamp-1">Box Shop · Mancheswar Industrial Estate, Bhubaneswar</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] self-end sm:self-auto">
            <span className="text-slate-500 dark:text-slate-400">API:</span>
            {backendStatus === 'online' ? (
              <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-semibold bg-emerald-200/60 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-400 dark:border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-400 font-semibold bg-amber-200/60 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-400 dark:border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></span>
                Offline
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-bold shrink-0 group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">TrackVriksha</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-mono px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 hidden xs:inline">
                  WhatsApp-First
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Box Shop · Mancheswar IE</p>
            </div>
          </Link>

          {/* Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#how-it-works" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">How It Works</a>
            <a href="#eight-stages" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">8 Stages</a>
            <a href="#problems" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Why It Matters</a>
            <a href="#enquiry-form" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Get Instant Quote</a>
          </nav>

          {/* Desktop Right Actions: Theme Toggle + Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              to="/login"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              Login
            </Link>
            <a
              href="#enquiry-form"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95"
            >
              Get Quote
            </a>
          </div>

          {/* Mobile Action Bar: Theme Toggle + Hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Navigation Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in fade-in duration-150">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#eight-stages"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                8-Stage Movement
              </a>
              <a
                href="#problems"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                Why It Matters
              </a>
              <a
                href="#enquiry-form"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                Request Quotation
              </a>
            </nav>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-center font-bold text-xs border border-slate-200 dark:border-slate-800"
              >
                Staff Login
              </Link>
              <a
                href="#enquiry-form"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-emerald-500 text-slate-950 text-center font-bold text-xs shadow-md"
              >
                Get Quote
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="how-it-works" className="relative pt-8 sm:pt-12 pb-16 sm:pb-20 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 text-xs font-semibold shadow-sm hover:scale-105 transition-transform">
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Modern Order Tracking for Small Packaging Units</span>
              </div>

              {/* Big Animated Headline with Dynamic Question Rotator */}
              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] xl:text-[3.25rem] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                <span className="inline-flex items-baseline whitespace-nowrap justify-center lg:justify-start gap-1.5 sm:gap-2">
                  <span>"Where is that</span>
                  <span
                    key={questionIdx}
                    className={`inline-block font-mono px-2 sm:px-3 py-0.5 rounded-2xl border ${QUESTION_ROTATIONS[questionIdx].badge} animate-flip-in shadow-sm align-baseline`}
                  >
                    {QUESTION_ROTATIONS[questionIdx].label}
                  </span>
                  <span>"</span>
                </span>
                <span className="block mt-3 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 via-cyan-500 to-emerald-600 dark:from-emerald-400 dark:via-teal-300 dark:via-cyan-300 dark:to-emerald-400 animate-gradient-flow drop-shadow-sm font-extrabold relative">
                  The answer is already on your customer's WhatsApp.
                  {/* Subtle animated curved underline under WhatsApp */}
                  <svg className="hidden sm:block absolute -bottom-3 right-4 sm:right-10 w-48 sm:w-64 h-3 text-emerald-500/60 dark:text-emerald-400/60 overflow-visible" viewBox="0 0 250 12" fill="none">
                    <path d="M 3 9 Q 125 1, 247 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
                  </svg>
                </span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                A simple, mobile-first system where small factories track every box from enquiry to delivery. Both customer and factory owner receive automatic WhatsApp updates at every step.
              </p>

              {/* Quick Value Metrics with animated hover and accents */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 max-w-lg mx-auto lg:mx-0 text-left">
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-sm hover:border-emerald-400/50 hover:shadow-md transition-all group">
                  <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono group-hover:scale-105 transition-transform inline-block">1-Tap</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">Phone floor move</div>
                </div>
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-sm hover:border-teal-400/50 hover:shadow-md transition-all group">
                  <div className="text-base sm:text-lg font-bold text-teal-600 dark:text-teal-400 font-mono group-hover:scale-105 transition-transform inline-block">100%</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">WhatsApp delivery</div>
                </div>
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-sm hover:border-cyan-400/50 hover:shadow-md transition-all group">
                  <div className="text-base sm:text-lg font-bold text-cyan-600 dark:text-cyan-400 font-mono group-hover:scale-105 transition-transform inline-block">0 Calls</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">No repeat calls</div>
                </div>
              </div>

              <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <a
                  href="#enquiry-form"
                  className="w-full sm:w-auto px-6 sm:px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Request Custom Box Quotation</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="#eight-stages"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-800 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <span>Explore 8-Stage Movement</span>
                </a>
              </div>
            </div>

            {/* Right Hero: Live Interactive WhatsApp Smartphone Simulation */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              {/* Outer floating wrapper with ambient radial glow */}
              <div className="relative w-full max-w-[320px] sm:max-w-sm">
                {/* Glowing breathing halo */}
                <div className="absolute inset-0 -m-3 sm:-m-5 bg-gradient-to-tr from-emerald-500/25 via-teal-500/20 to-cyan-500/25 rounded-[48px] blur-2xl animate-pulse-halo pointer-events-none"></div>

                {/* Floating Micro-Badge Top Right */}
                <div className="absolute -top-3 sm:-top-4 -right-2 sm:-right-5 z-20 animate-float-badge-top hidden xs:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-emerald-300 dark:border-emerald-500/40 shadow-xl backdrop-blur-md text-[11px] font-bold text-slate-800 dark:text-slate-100 ring-1 ring-emerald-500/20 select-none">
                  <span className="flex h-2.5 w-2.5 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono">⚡ 0.8s WhatsApp Alert</span>
                </div>

                {/* Floating Micro-Badge Bottom Left */}
                <div className="absolute -bottom-3 sm:-bottom-4 -left-2 sm:-left-5 z-20 animate-float-badge-bottom hidden xs:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md text-[11px] font-semibold text-slate-800 dark:text-slate-200 ring-1 ring-slate-400/20 select-none">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>100% Quality Proof Photos</span>
                </div>

                {/* Smartphone Device Frame with Floating Levitation */}
                <div className="w-full bg-slate-950 border-4 border-slate-800 rounded-[36px] sm:rounded-[40px] shadow-2xl p-1 overflow-hidden relative ring-1 ring-emerald-500/40 animate-float-slow transition-transform hover:scale-[1.01] duration-300">
                  {/* Smartphone Speaker notch */}
                  <div className="w-20 sm:w-24 h-3.5 sm:h-4 bg-slate-900 rounded-full mx-auto my-1.5 flex items-center justify-center relative">
                    <div className="w-6 h-1 bg-slate-700 rounded-full"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800 absolute right-3"></div>
                  </div>

                  {/* Slide-down Push Notification Banner */}
                  {showNotification && (
                    <div
                      key={`notif-${previewStage}`}
                      className="absolute top-8 left-2.5 right-2.5 z-30 bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-notification-pop ring-1 ring-emerald-400/30"
                    >
                      <div className="w-7 h-7 rounded-xl bg-[#25D366] flex items-center justify-center text-white shrink-0 shadow-md">
                        <MessageCircle className="w-4 h-4 fill-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-emerald-400 flex items-center gap-1">
                            <span>WhatsApp</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">Just now</span>
                        </div>
                        <p className="text-[11px] text-slate-100 font-semibold truncate">
                          Box Shop: {sampleMessages[previewStage]?.title}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* WhatsApp Green Top Header */}
                  <div className="bg-[#075E54] p-3 text-white rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs shadow-inner">
                        BS
                      </div>
                      <div>
                        <div className="font-bold text-xs flex items-center gap-1">
                          <span>Box Shop · Mancheswar</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        </div>
                        <div className="text-[10px] text-emerald-200">Official WhatsApp Gateway</div>
                      </div>
                    </div>
                    <MessageCircle className="w-4 h-4 text-emerald-200" />
                  </div>

                  {/* Segmented Story Progress Bar (8 Stages) */}
                  <div className="bg-[#0b141a] px-3 pt-2 pb-1 flex gap-1 items-center border-b border-slate-900">
                    {PREVIEW_STAGES.map((sKey, idx) => {
                      const currIdx = PREVIEW_STAGES.indexOf(previewStage);
                      const isPassed = idx < currIdx;
                      const isCurrent = idx === currIdx;
                      return (
                        <div
                          key={sKey}
                          onClick={() => setPreviewStage(sKey)}
                          className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden cursor-pointer group"
                          title={`Stage ${idx + 1}: ${sKey.replace('_', ' ')}`}
                        >
                          <div
                            className={`h-full transition-all duration-300 ${
                              isPassed
                                ? 'bg-emerald-400 w-full'
                                : isCurrent
                                ? 'bg-emerald-400 w-full'
                                : 'w-0'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Stage Tab Selector with Prev/Next Controls */}
                  <div className="bg-[#0b141a] px-2 py-1.5 border-b border-slate-800 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevStage}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white shrink-0 cursor-pointer transition-colors"
                      title="Previous Stage"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-none text-[10px]">
                      {PREVIEW_STAGES.map((stageKey) => (
                        <button
                          key={stageKey}
                          onClick={() => setPreviewStage(stageKey)}
                          className={`px-2 py-0.5 rounded font-mono whitespace-nowrap cursor-pointer transition-all duration-200 ${
                            previewStage === stageKey
                              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/30 scale-105'
                              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {stageKey.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleNextStage}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white shrink-0 cursor-pointer transition-colors"
                      title="Next Stage"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Live Auto-Demo Status Bar */}
                  <div className="flex items-center justify-between px-3 py-1 bg-[#0b141a] text-[10px] text-slate-400 font-mono border-b border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Auto-Cycle: Stage {PREVIEW_STAGES.indexOf(previewStage) + 1} of 8</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                      className="flex items-center gap-1 text-[9px] uppercase px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
                      title={isAutoPlaying ? 'Pause Auto-cycle' : 'Resume Auto-cycle'}
                    >
                      {isAutoPlaying ? (
                        <>
                          <Pause className="w-2.5 h-2.5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-2.5 h-2.5" />
                          <span>Play</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* WhatsApp Chat Area */}
                  <div
                    className="bg-[#0b141a] p-3 min-h-[300px] sm:min-h-[320px] flex flex-col justify-between relative"
                    style={{
                      backgroundImage: `radial-gradient(#1f2c34 1px, transparent 1px)`,
                      backgroundSize: '16px 16px',
                    }}
                  >
                    <div className="text-center my-1">
                      <span className="bg-[#182229] text-slate-400 text-[9px] px-2 py-0.5 rounded uppercase font-medium shadow-sm">
                        Automated Trigger: {sampleMessages[previewStage]?.title}
                      </span>
                    </div>

                    {/* Active Message Content or Typing State */}
                    {isTyping ? (
                      /* Typing Indicator */
                      <div className="bg-[#202c33] text-slate-300 p-2.5 rounded-2xl rounded-bl-none text-xs border border-[#2a3942] w-fit flex items-center gap-2 shadow-md animate-in fade-in duration-100 my-auto">
                        <span className="text-[10px] text-emerald-400 font-mono">Box Shop is typing</span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-typing-dot-1"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-typing-dot-2"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-typing-dot-3"></span>
                        </span>
                      </div>
                    ) : (
                      /* Active WhatsApp Message Bubble with Pop-in Effect & Rich Card */
                      <div className="relative bg-[#202c33] text-slate-100 p-3 rounded-2xl rounded-bl-none text-xs border border-[#2a3942] shadow-md space-y-2 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>Box Shop Alert</span>
                          </span>
                          <span className="text-slate-400 text-[9px] font-mono">12:30 PM</span>
                        </div>

                        <p className="leading-relaxed whitespace-pre-wrap text-[11px] sm:text-xs">
                          {sampleMessages[previewStage]?.text}
                        </p>

                        {/* Stage-Specific Visual Interactive Widget */}
                        {previewStage === 'enquiry' && (
                          <div className="p-2 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex items-center justify-between">
                            <div>
                              <div className="text-[9px] text-emerald-400 font-mono">ORDER #BX-2041</div>
                              <div className="text-[11px] font-bold text-white">3,000 Mailer Boxes</div>
                            </div>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Confirmed</span>
                          </div>
                        )}

                        {previewStage === 'spec_sheet' && (
                          <div className="p-2 rounded-xl bg-slate-900/80 border border-teal-500/30 flex items-center justify-between">
                            <div>
                              <div className="text-[9px] text-teal-400 font-mono">SPECS: 5-PLY KRAFT</div>
                              <div className="text-[10px] text-slate-300">180 GSM · B-Flute · Die-Cut</div>
                            </div>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono">Sign-Off Ready</span>
                          </div>
                        )}

                        {previewStage === 'design_sample' && (
                          <div className="p-2 rounded-xl bg-slate-900/80 border border-purple-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">📦</span>
                              <div>
                                <div className="text-[10px] font-bold text-slate-200">Sample #SMP-2041</div>
                                <div className="text-[9px] text-purple-300 font-mono">Shelf A-1 · Ready to View</div>
                              </div>
                            </div>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">Approved</span>
                          </div>
                        )}

                        {previewStage === 'approved' && (
                          <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">💰</span>
                              <div>
                                <div className="text-[10px] font-bold text-emerald-300">Advance Paid: ₹15,000</div>
                                <div className="text-[9px] text-slate-400">Scheduled on Corrugator Line 2</div>
                              </div>
                            </div>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">Verified</span>
                          </div>
                        )}

                        {previewStage === 'production' && (
                          <div className="p-2 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-amber-300 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                Corrugator Line 2 Active
                              </span>
                              <span className="text-amber-400 font-mono text-[9px]">75% Complete</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                              <div className="bg-amber-400 h-full w-3/4 rounded-full animate-progress-stripe"></div>
                            </div>
                          </div>
                        )}

                        {previewStage === 'qc_passed' && (
                          <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-500/40 grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                            <div className="bg-slate-900/70 p-1.5 rounded text-center">
                              <div className="text-slate-400 text-[8px]">Burst Factor</div>
                              <div className="text-emerald-400 font-bold text-[10px]">18 BF (Pass ✓)</div>
                            </div>
                            <div className="bg-slate-900/70 p-1.5 rounded text-center">
                              <div className="text-slate-400 text-[8px]">Moisture Test</div>
                              <div className="text-emerald-400 font-bold text-[10px]">7.2% (Pass ✓)</div>
                            </div>
                          </div>
                        )}

                        {previewStage === 'dispatch' && (
                          <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="animate-truck-drive text-base">🚚</div>
                              <div>
                                <div className="text-[10px] font-bold text-blue-200">OD-02-X-4912 (Tata Ace)</div>
                                <div className="text-[9px] text-slate-400">Driver: 9437188291</div>
                              </div>
                            </div>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono animate-pulse">On Route</span>
                          </div>
                        )}

                        {previewStage === 'delivered' && (
                          <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-bold text-white flex items-center gap-1">
                                <span>⭐⭐⭐⭐⭐</span>
                                <span className="text-emerald-300">5.0</span>
                              </div>
                              <div className="text-[9px] text-slate-300">Received & Signed by Sanjay</div>
                            </div>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Delivered</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 text-[9px] text-slate-400 border-t border-slate-700/50">
                          <span>Recipient: <strong className="text-emerald-300">{sampleMessages[previewStage]?.recipient}</strong></span>
                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                        </div>

                        {/* Floating WhatsApp Reaction Bubble */}
                        <div
                          key={`reaction-${previewStage}`}
                          className="absolute -bottom-2 -right-1 bg-[#182229] border border-slate-700/80 rounded-full px-2 py-0.5 text-[10px] shadow-lg flex items-center gap-1 animate-reaction-pop select-none"
                        >
                          <span>{STAGE_REACTIONS[previewStage] || '👍'}</span>
                        </div>
                      </div>
                    )}

                    {/* Bottom hint */}
                    <div className="pt-2 text-center text-[10px] text-slate-500 font-mono">
                      {isAutoPlaying ? 'Auto-cycling stages · Click tab or arrows to inspect' : 'Paused · Click any stage or Play to resume'}
                    </div>
                  </div>

                  {/* Bottom Home indicator */}
                  <div className="py-1 bg-slate-950 flex justify-center">
                    <div className="w-20 h-1 bg-slate-700 rounded-full"></div>
                  </div>
                </div>

                {/* Levitating Shadow Below Phone */}
                <div className="w-44 sm:w-56 h-3.5 bg-emerald-500/20 dark:bg-emerald-400/15 rounded-full blur-md mx-auto mt-4 animate-shadow-breathe pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Core Problems We Solve (From Concept Brief) */}
      <section id="problems" className="py-16 bg-slate-100/70 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <h2 className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              The Real Problem in Small Manufacturing
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              "These are not bad people problems, they are NO-SYSTEM problems."
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
              Small factories in India run orders on phone calls, scattered chats, and paper registers. Here is what TrackVriksha fixes:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1 */}
            <div className="bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-3xl shadow-sm hover:border-emerald-500/40 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Order Status</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Customers call repeatedly because nobody updates them. With automated WhatsApp triggers at all 8 stages, the answer is already on their phone.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-3xl shadow-sm hover:border-emerald-500/40 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Spec Mismatch</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ply, GSM, board grade, or size agreed verbally leads to rejected consignments. We provide a digitized spec sheet with 1-tap customer sign-off.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-3xl shadow-sm hover:border-emerald-500/40 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20 flex items-center justify-center font-bold mb-4">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Zero Lost Samples</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Physical samples get misplaced in sample rooms, delaying launches for months. We assign each sample a unique ID and physical shelf code.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-3xl shadow-sm hover:border-emerald-500/40 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Proof of Quality (QC)</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                QC happens with no record or photos. In our system, pre-dispatch checklist and photos are logged and sent to customer and owner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The 8 Stages of Order Movement */}
      <section id="eight-stages" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Exact Workflow Engine
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              How Every Order Moves Through 8 Stages
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
              Each move is one tap on mobile by floor staff, automatically notifying the right person on WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                num: '1',
                stage: 'Enquiry',
                what: 'Customer, quantity, box type and deadline recorded; order ID created.',
                who: 'Customer, owner',
              },
              {
                num: '2',
                stage: 'Spec sheet',
                what: 'Ply, board grade, GSM, size, print and price written down digitally.',
                who: 'Customer (approval link)',
              },
              {
                num: '3',
                stage: 'Design & sample',
                what: 'Design uploaded, sample created with its own ID and shelf tracked.',
                who: 'Customer (preview + approve)',
              },
              {
                num: '4',
                stage: 'Approved',
                what: 'Customer signs off; 50% advance noted before floor scheduling.',
                who: 'Owner, production head',
              },
              {
                num: '5',
                stage: 'Production',
                what: 'Corrugation, printing, rotary die-cut, automatic folding-pasting.',
                who: 'Customer',
              },
              {
                num: '6',
                stage: 'QC Check',
                what: 'Checklist + photos. Note: QC fail automatically routes back to Production!',
                who: 'Owner, customer (photos)',
                special: 'QC fail ➔ Back to Prod',
              },
              {
                num: '7',
                stage: 'Dispatch',
                what: 'Ready for delivery or ready for counter pickup; vehicle & invoice added.',
                who: 'Customer',
              },
              {
                num: '8',
                stage: 'Delivered',
                what: 'Delivery confirmed; feedback rating and Google review link sent.',
                who: 'Customer',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 shadow-sm transition-all relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
                      {step.num}
                    </span>
                    {step.special && (
                      <span className="text-[10px] font-mono bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                        <RotateCcw className="w-2.5 h-2.5" />
                        {step.special}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{step.stage}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{step.what}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px]">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Who gets WhatsApp:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{step.who}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Website Visitor Enquiry Form (Connected to Backend MySQL) */}
      <section id="enquiry-form" className="py-16 sm:py-20 bg-slate-100/70 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 relative transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/30">
              Live Backend Connected Form
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
              Request a Custom Box Quote & Track on WhatsApp
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
              Fill the quick form below. Our factory team at Box Shop (Mancheswar) will prepare your spec sheet and message you on WhatsApp!
            </p>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-10 shadow-xl dark:shadow-2xl relative transition-colors">
            {submittedData ? (
              /* Success State */
              <div className="text-center py-6 sm:py-8 space-y-4">
                <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 sm:w-8 h-7 sm:h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Enquiry Received Successfully!</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  Thank you, <strong>{submittedData.customer_name}</strong>. Your enquiry for{' '}
                  <strong>{Number(submittedData.quantity).toLocaleString()} units</strong> of{' '}
                  <strong>{submittedData.box_type}</strong> has been stored in our factory database.
                </p>

                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 p-4 rounded-2xl max-w-sm mx-auto text-left text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Notification Queued:</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    Our sales team will send quotation link to <strong>+91 {submittedData.customer_phone}</strong>.
                  </p>
                </div>

                <button
                  onClick={() => setSubmittedData(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-white cursor-pointer mt-4 transition-colors"
                >
                  Submit Another Enquiry
                </button>
              </div>
            ) : (
              /* Actual Form */
              <form onSubmit={handleFormSubmit} className="space-y-5 sm:space-y-6">
                {submitError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      name="customer_name"
                      placeholder="e.g. Sanjay Patra"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* WhatsApp Phone */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      WhatsApp Mobile Number *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        name="customer_phone"
                        placeholder="98610 12345"
                        value={formData.customer_phone}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Company / Brand Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Company / Brand Name
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      placeholder="e.g. Kalinga Confectioneries"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      name="customer_email"
                      placeholder="name@company.com"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Box Type */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Packaging / Box Type
                    </label>
                    <select
                      name="box_type"
                      value={formData.box_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Mailer Box">Mailer Box (E-Commerce Folding)</option>
                      <option value="Master Carton">Master Outer Carton (Corrugated)</option>
                      <option value="Rigid Gift Box">Premium Rigid Gift Box</option>
                      <option value="Die-cut Box">Die-cut Counter Display Box</option>
                      <option value="Pizza Box">Food & Pizza Box</option>
                      <option value="Mono Carton">Mono Carton Packaging</option>
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Estimated Quantity (Units)
                    </label>
                    <input
                      type="number"
                      step="500"
                      min="500"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Message / Specifications */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Box Dimensions or Special Requirements (e.g. 10x8x4 inch, 5-ply, gold printing)
                  </label>
                  <textarea
                    rows={3}
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Provide any approximate size (Length x Width x Height), flute preference, or artwork requirements..."
                    className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Submit button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Instant WhatsApp notification sent to Box Shop team</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                  >
                    {submitting ? (
                      <span>Submitting to Database...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4 stroke-[2.5]" />
                        <span>Submit Enquiry to Factory</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-8 sm:py-10 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-slate-800 dark:text-slate-300">TrackVriksha</span>
            <span>· Product Concept by Inovriksha Tech</span>
          </div>
          <div>
            Pilot Factory: Box Shop, Mancheswar Industrial Estate, Bhubaneswar, Odisha
          </div>
        </div>
      </footer>
    </div>
  );
}
