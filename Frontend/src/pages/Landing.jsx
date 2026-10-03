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
  ChevronRight,
  Send,
  AlertCircle,
  Lock,
  Eye,
  CheckCheck,
  RotateCcw,
  Zap,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitEnquiry, checkBackendHealth } from '../services/api';

export default function Landing() {
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  
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

  // Interactive WhatsApp phone preview stage selector
  const [previewStage, setPreviewStage] = useState('enquiry');

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
      text: `Hi ${formData.customer_name || 'Sanjay'}, your order #BX-2041 for ${formData.quantity.toLocaleString()} ${formData.box_type} is confirmed. Track it anytime: https://boxshop.trackvriksha.in/track/BX-2041`,
    },
    spec_sheet: {
      title: '2. Spec Sheet Ready',
      recipient: 'Customer (Approval link)',
      text: `Your spec sheet and design for order #BX-2041 are ready. Ply: 5-Ply, 180 GSM Kraft. Please review and approve: https://boxshop.trackvriksha.in/spec/BX-2041`,
    },
    design_sample: {
      title: '3. Design & Sample',
      recipient: 'Customer (Preview & approve)',
      text: `Physical sample #SMP-BX-141 for order #BX-2041 is ready for your inspection! Preview here: https://boxshop.trackvriksha.in/sample/SMP-141`,
    },
    approved: {
      title: '4. Spec Approved',
      recipient: 'Owner, Production Head',
      text: `Order #BX-2041 approved by ${formData.customer_name || 'Customer'}. Advance 50% noted. Production floor scheduling initiated.`,
    },
    production: {
      title: '5. In Production',
      recipient: 'Customer',
      text: `Good news! Order #BX-2041 is now in production on Corrugator Line A. Expected ready date: 10 Oct 2026.`,
    },
    qc: {
      title: '6. QC Passed (Photos)',
      recipient: 'Owner, Customer (Photos)',
      text: `Order #BX-2041 passed quality check with 100% score! Verified QC photos: https://boxshop.trackvriksha.in/qc/BX-2041`,
    },
    dispatch: {
      title: '7. Dispatched',
      recipient: 'Customer',
      text: `Order #BX-2041 has been dispatched via Tata Ace (OD-02-X-4912), Tracking: MNCH-8821. Invoice: https://boxshop.trackvriksha.in/inv/BX-2041`,
    },
    delivered: {
      title: '8. Delivered',
      recipient: 'Customer',
      text: `Order #BX-2041 delivered successfully. Thank you for choosing Box Shop! Tell us how we did: https://boxshop.trackvriksha.in/review/BX-2041`,
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top pilot status strip */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/20 px-4 py-2 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-400">PILOT:</span>
            <span>Box Shop · Corrugated & Gift Box Maker, Mancheswar Industrial Estate, Bhubaneswar</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-slate-400">Backend API:</span>
            {backendStatus === 'online' ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Port 5000 Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Backend Offline (Run: node index.js)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-bold">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white">TrackVriksha</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  WhatsApp-First SaaS
                </span>
              </div>
              <p className="text-xs text-slate-400">Box Shop · Mancheswar Industrial Estate</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</a>
            <a href="#eight-stages" className="hover:text-emerald-400 transition-colors">8 Stages</a>
            <a href="#problems" className="hover:text-emerald-400 transition-colors">Why It Matters</a>
            <a href="#enquiry-form" className="hover:text-emerald-400 transition-colors">Get Instant Quote</a>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-bold text-xs transition-all"
            >
              Staff & Admin Login
            </Link>
            <a
              href="#enquiry-form"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95"
            >
              Raise Order Enquiry
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Modern Order Tracking for Small Factories & Packaging Plants</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                "Where is that order?"
                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  The answer is already on your customer's WhatsApp.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                A simple, mobile-first software where small factories track every order from enquiry to delivery. Both customer and factory owner receive automatic WhatsApp updates at every step.
              </p>

              {/* Quick Value Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg mx-auto lg:mx-0 text-left">
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
                  <div className="text-lg font-bold text-emerald-400 font-mono">1-Tap</div>
                  <div className="text-[11px] text-slate-400">Phone floor move</div>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
                  <div className="text-lg font-bold text-teal-400 font-mono">100%</div>
                  <div className="text-[11px] text-slate-400">WhatsApp delivery</div>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
                  <div className="text-lg font-bold text-cyan-400 font-mono">0 Calls</div>
                  <div className="text-[11px] text-slate-400">No repeat inquiries</div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href="#enquiry-form"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 group"
                >
                  <span>Request Custom Box Quotation</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="#eight-stages"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <span>View 8 Stages</span>
                </a>
              </div>
            </div>

            {/* Right Hero: Live Interactive WhatsApp Smartphone Simulation */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm bg-slate-950 border-4 border-slate-800 rounded-[40px] shadow-2xl p-1 overflow-hidden relative ring-1 ring-emerald-500/20">
                {/* Smartphone Speaker notch */}
                <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto my-1.5 flex items-center justify-center">
                  <div className="w-6 h-1 bg-slate-700 rounded-full"></div>
                </div>

                {/* WhatsApp Green Top Header */}
                <div className="bg-[#075E54] p-3 text-white rounded-t-3xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs">
                      BS
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1">
                        <span>Box Shop · Mancheswar</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      </div>
                      <div className="text-[10px] text-emerald-200">Official WhatsApp Gateway</div>
                    </div>
                  </div>
                  <MessageCircle className="w-4 h-4 text-emerald-200" />
                </div>

                {/* Interactive Stage Tab Selector inside simulator */}
                <div className="bg-[#0b141a] px-2 py-1.5 border-b border-slate-800 flex gap-1 overflow-x-auto scrollbar-none text-[10px]">
                  {Object.keys(sampleMessages).map((stageKey) => (
                    <button
                      key={stageKey}
                      onClick={() => setPreviewStage(stageKey)}
                      className={`px-2 py-0.5 rounded font-mono whitespace-nowrap cursor-pointer transition-all ${
                        previewStage === stageKey
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {stageKey.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {/* WhatsApp Chat Area */}
                <div
                  className="bg-[#0b141a] p-3 min-h-[300px] flex flex-col justify-between"
                  style={{
                    backgroundImage: `radial-gradient(#1f2c34 1px, transparent 1px)`,
                    backgroundSize: '16px 16px',
                  }}
                >
                  <div className="text-center my-1">
                    <span className="bg-[#182229] text-slate-400 text-[9px] px-2 py-0.5 rounded uppercase font-medium">
                      Automated Trigger: {sampleMessages[previewStage]?.title}
                    </span>
                  </div>

                  {/* Active Message Bubble */}
                  <div className="bg-[#202c33] text-slate-100 p-3 rounded-2xl rounded-bl-none text-xs border border-[#2a3942] shadow-md space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold">
                      <span>Box Shop Alert</span>
                      <span className="text-slate-400 text-[9px] font-mono">12:30 PM</span>
                    </div>

                    <p className="leading-relaxed whitespace-pre-wrap">
                      {sampleMessages[previewStage]?.text}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[9px] text-slate-400 border-t border-slate-700/50">
                      <span>Who gets it: <strong className="text-emerald-300">{sampleMessages[previewStage]?.recipient}</strong></span>
                      <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                    </div>
                  </div>

                  {/* Home bar */}
                  <div className="pt-2 text-center text-[10px] text-slate-500 font-mono">
                    Tap stage tabs above to test real-time triggers
                  </div>
                </div>

                {/* Bottom Home indicator */}
                <div className="py-1 bg-slate-950 flex justify-center">
                  <div className="w-20 h-1 bg-slate-700 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Core Problems We Solve (From Concept Brief) */}
      <section id="problems" className="py-16 bg-slate-900/60 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              The Real Problem in Small Manufacturing
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              "These are not bad people problems, they are NO-SYSTEM problems."
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Small factories in India run orders on phone calls, scattered chats, and paper registers. Here is what TrackVriksha fixes:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-slate-950/70 border border-slate-800 p-6 rounded-3xl hover:border-emerald-500/40 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Order Status</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Customers call repeatedly because nobody updates them. With automated WhatsApp triggers at all 8 stages, the answer is already on their phone.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-950/70 border border-slate-800 p-6 rounded-3xl hover:border-emerald-500/40 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Spec Mismatch</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ply, GSM, board grade, or size agreed verbally leads to rejected consignments. We provide a digitized spec sheet with 1-tap customer sign-off.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-950/70 border border-slate-800 p-6 rounded-3xl hover:border-emerald-500/40 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center font-bold mb-4">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Zero Lost Samples</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Physical samples get misplaced in sample rooms, delaying launches for months. We assign each sample a unique ID and physical shelf code.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-950/70 border border-slate-800 p-6 rounded-3xl hover:border-emerald-500/40 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Proof of Quality (QC)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                QC happens with no record or photos. In our system, pre-dispatch checklist and photos are logged and sent to customer and owner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The 8 Stages of Order Movement (From Uploaded Photos) */}
      <section id="eight-stages" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Exact Workflow Engine
            </h2>
            <p className="text-3xl font-black text-white mt-1">
              How Every Order Moves Through 8 Stages
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Each move is one tap on a basic Android phone by floor staff, automatically notifying the right person on WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                num: '1',
                stage: 'Enquiry',
                what: 'Customer, quantity, box type and deadline recorded; order ID created.',
                who: 'Customer, owner',
                color: 'sky',
              },
              {
                num: '2',
                stage: 'Spec sheet',
                what: 'Ply, board grade, GSM, size, print and price written down digitally.',
                who: 'Customer (approval link)',
                color: 'indigo',
              },
              {
                num: '3',
                stage: 'Design & sample',
                what: 'Design uploaded, sample created with its own ID and shelf tracked.',
                who: 'Customer (preview + approve)',
                color: 'violet',
              },
              {
                num: '4',
                stage: 'Approved',
                what: 'Customer signs off; 50% advance noted before floor scheduling.',
                who: 'Owner, production head',
                color: 'amber',
              },
              {
                num: '5',
                stage: 'Production',
                what: 'Corrugation, printing, rotary die-cut, automatic folding-pasting.',
                who: 'Customer',
                color: 'orange',
              },
              {
                num: '6',
                stage: 'QC Check',
                what: 'Checklist + photos. Note: QC fail automatically routes back to Production!',
                who: 'Owner, customer (photos)',
                color: 'rose',
                special: 'QC fail ➔ Back to Prod',
              },
              {
                num: '7',
                stage: 'Dispatch',
                what: 'Ready for delivery or ready for counter pickup; vehicle & invoice added.',
                who: 'Customer',
                color: 'cyan',
              },
              {
                num: '8',
                stage: 'Delivered',
                what: 'Delivery confirmed; feedback rating and Google review link sent.',
                who: 'Customer',
                color: 'emerald',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-800 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
                      {step.num}
                    </span>
                    {step.special && (
                      <span className="text-[10px] font-mono bg-red-950 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <RotateCcw className="w-2.5 h-2.5" />
                        {step.special}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white">{step.stage}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{step.what}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Who gets WhatsApp:</span>
                  <span className="text-emerald-400 font-medium">{step.who}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Website Visitor Enquiry Form (Connected to Backend MySQL) */}
      <section id="enquiry-form" className="py-20 bg-slate-900/60 border-t border-slate-800 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              Live Backend Connected Form
            </span>
            <h2 className="text-3xl font-black text-white mt-3">
              Request a Custom Box Quote & Track on WhatsApp
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Fill the quick form below. Our factory team at Box Shop (Mancheswar) will prepare your spec sheet and message you on WhatsApp!
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
            {submittedData ? (
              /* Success State */
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Enquiry Received Successfully!</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Thank you, <strong>{submittedData.customer_name}</strong>. Your enquiry for{' '}
                  <strong>{submittedData.quantity.toLocaleString()} units</strong> of{' '}
                  <strong>{submittedData.box_type}</strong> has been stored in our factory database.
                </p>

                <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl max-w-sm mx-auto text-left text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Notification Queued:</span>
                  </div>
                  <p className="text-slate-300">
                    Our sales team will send quotation link to <strong>+91 {submittedData.customer_phone}</strong>.
                  </p>
                </div>

                <button
                  onClick={() => setSubmittedData(null)}
                  className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer mt-4"
                >
                  Submit Another Enquiry
                </button>
              </div>
            ) : (
              /* Actual Form */
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {submitError && (
                  <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      name="customer_name"
                      placeholder="e.g. Sanjay Patra"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* WhatsApp Phone */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      WhatsApp Mobile Number *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        name="customer_phone"
                        placeholder="98610 12345"
                        value={formData.customer_phone}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Company / Brand Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Company / Brand Name
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      placeholder="e.g. Kalinga Confectioneries"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      name="customer_email"
                      placeholder="name@company.com"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Box Type */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Packaging / Box Type
                    </label>
                    <select
                      name="box_type"
                      value={formData.box_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
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
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Estimated Quantity (Units)
                    </label>
                    <input
                      type="number"
                      step="500"
                      min="500"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Message / Specifications */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Box Dimensions or Special Requirements (e.g. 10x8x4 inch, 5-ply, gold printing)
                  </label>
                  <textarea
                    rows={3}
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Provide any approximate size (Length x Width x Height), flute preference, or artwork requirements..."
                    className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Instant WhatsApp notification sent to Box Shop team</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
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
      <footer className="border-t border-slate-900 bg-slate-950 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-slate-300">TrackVriksha</span>
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
