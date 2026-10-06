import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MessageCircle,
  Truck,
  ShieldCheck,
  Layers,
  ArrowRight,
  LogOut,
  Users,
  RotateCcw,
  Sparkles,
  Search,
  Check,
  X,
  UserCheck,
  Crown,
  FileText,
  Send,
  Calendar,
  Inbox,
} from 'lucide-react';
import {
  fetchOrders,
  createFactoryOrder,
  advanceOrderStage,
  submitQCInspection,
  submitDispatch,
  broadcastDelay,
} from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

// 8 Stages definition matching the project brief
const STAGES = [
  { id: 'all', label: 'All Orders' },
  { id: 'enquiry', label: '1. Enquiry' },
  { id: 'spec_sheet', label: '2. Spec Sheet' },
  { id: 'design_sample', label: '3. Sample' },
  { id: 'approved', label: '4. Approved' },
  { id: 'production', label: '5. Production' },
  { id: 'qc', label: '6. QC Check' },
  { id: 'dispatch', label: '7. Dispatch' },
  { id: 'delivered', label: '8. Delivered' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('trackvriksha_token');
  const [currentUser, setCurrentUser] = useState(null);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedStage, setSelectedStage] = useState('all');

  // Enquiries State
  const [enquiries, setEnquiries] = useState([]);

  // Modals state
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showQCModal, setShowQCModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);

  // Latest WhatsApp Notification Banner
  const [latestNotification, setLatestNotification] = useState(null);

  // New Order Form State
  const [newOrderForm, setNewOrderForm] = useState({
    customer_name: '',
    customer_phone: '',
    company_name: '',
    customer_email: '',
    box_type: 'Mailer Box',
    quantity: 3000,
    estimated_delivery_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    unit_price: 22,
    ply: '3-Ply',
  });
  const [creatingOrder, setCreatingOrder] = useState(false);

  // QC Form State
  const [qcForm, setQcForm] = useState({
    dimensionAccuracy: true,
    burstingStrength: true,
    moistureCheck: true,
    printRegistration: true,
    glueAdhesion: true,
    barcodeScan: true,
    status: 'Passed', // 'Passed' or 'Failed'
    fail_reason: 'Glue flap delamination on side joint',
    notes: 'Burst factor 18 BF verified. Moisture content 7.2%.',
  });

  // Dispatch Form State
  const [dispatchForm, setDispatchForm] = useState({
    mode: 'delivery',
    vehicle: 'Tata Ace (OD-02-X-4912)',
    driver_phone: '9437188291',
    tracking_no: 'MNCH-OD-2026',
  });

  // Delay Form State
  const [delayForm, setDelayForm] = useState({
    new_expected_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    delay_reason: 'Kraft paper reel shipment delayed from mill',
  });

  const loadData = async () => {
    try {
      setLoadingOrders(true);
      const ordersRes = await fetchOrders(token);
      if (ordersRes.success) setOrders(ordersRes.data || []);

      const enqRes = await fetch('http://localhost:5000/api/enquiries');
      const enqData = await enqRes.json();
      if (enqData.success) setEnquiries(enqData.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('trackvriksha_user');
    if (!token || !savedUser) {
      navigate('/login');
      return;
    }
    setCurrentUser(JSON.parse(savedUser));
    loadData();
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('trackvriksha_token');
    localStorage.removeItem('trackvriksha_user');
    navigate('/login');
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const permissions = currentUser.permissions || [];
  const canCreateOrder = isAdmin || permissions.includes('create_order');
  const canDoQC = isAdmin || permissions.includes('qc_check');
  const canDispatch = isAdmin || permissions.includes('dispatch_ops');

  // Deduplicate orders defensively by id to guarantee zero React key collisions
  const uniqueOrders = Array.from(new Map(orders.map((item) => [item.id, item])).values());

  // Filter orders
  const filteredOrders = uniqueOrders.filter((o) => {
    if (selectedStage === 'all') return true;
    return o.current_stage === selectedStage;
  });

  // Handle Create Order
  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreatingOrder(true);
      const res = await createFactoryOrder(newOrderForm, token);
      setShowNewOrderModal(false);
      setLatestNotification(res.whatsAppNotification);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to create order');
    } finally {
      setCreatingOrder(false);
    }
  };

  // Handle 1-Tap Advance Stage
  const handleAdvance = async (order) => {
    // If order is at QC stage, open QC modal
    if (order.current_stage === 'qc') {
      setActiveOrder(order);
      setShowQCModal(true);
      return;
    }

    // If order is at dispatch stage and NOT yet dispatched, open Dispatch modal
    if (order.current_stage === 'dispatch' && !order.dispatch_id) {
      setActiveOrder(order);
      setDispatchForm({
        mode: order.dispatch_mode || 'delivery',
        vehicle: order.dispatch_vehicle || 'Tata Ace (OD-02-X-4912)',
        driver_phone: '9437188291',
        tracking_no: order.dispatch_tracking_no || `MNCH-${order.id}`,
      });
      setShowDispatchModal(true);
      return;
    }

    try {
      const res = await advanceOrderStage(order.id, {}, token);
      setLatestNotification(res.whatsAppNotification);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to advance stage');
    }
  };

  // Handle Submit QC
  const handleQCSubmit = async (status) => {
    if (!activeOrder) return;
    try {
      const res = await submitQCInspection(
        activeOrder.id,
        {
          checklist: {
            dimensionAccuracy: qcForm.dimensionAccuracy,
            burstingStrength: qcForm.burstingStrength,
            moistureCheck: qcForm.moistureCheck,
            printRegistration: qcForm.printRegistration,
            glueAdhesion: qcForm.glueAdhesion,
            barcodeScan: qcForm.barcodeScan,
          },
          status,
          fail_reason: qcForm.fail_reason,
          notes: qcForm.notes,
        },
        token
      );
      setShowQCModal(false);
      setLatestNotification(res.whatsAppNotification);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to process QC');
    }
  };

  // Handle Submit Dispatch
  const handleDispatchSubmit = async (e, markDelivered = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!activeOrder) return;
    try {
      const res = await submitDispatch(
        activeOrder.id,
        { ...dispatchForm, mark_delivered: markDelivered },
        token
      );
      setShowDispatchModal(false);
      setLatestNotification(res.whatsAppNotification);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to process dispatch');
    }
  };

  // Handle Broadcast Delay
  const handleDelaySubmit = async (e) => {
    e.preventDefault();
    if (!activeOrder) return;
    try {
      const res = await broadcastDelay(activeOrder.id, delayForm, token);
      setShowDelayModal(false);
      setLatestNotification(res.whatsAppNotification);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to send delay alert');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <header className="bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              to="/"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-bold shrink-0 hover:scale-105 transition-transform"
            >
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">TrackVriksha</span>
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 uppercase font-semibold">
                  Console
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Box Shop · Mancheswar IE, Bhubaneswar</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Profile Badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-950 px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              {isAdmin ? <Crown className="w-3.5 h-3.5 text-amber-500" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              <div className="hidden xs:block">
                <span className="font-bold text-slate-900 dark:text-white block leading-tight text-[11px] sm:text-xs">{currentUser.name}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono capitalize">{currentUser.role}</span>
              </div>
            </div>

            {/* Admin Staff Management Button */}
            {isAdmin && (
              <Link
                to="/admin/staff"
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-amber-100/70 hover:bg-amber-200/80 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-xs font-semibold cursor-pointer transition-all shrink-0"
                title="Manage Staff & Roles"
              >
                <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="hidden md:inline">Staff</span>
              </Link>
            )}

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* New Order Button */}
            {canCreateOrder && (
              <button
                onClick={() => setShowNewOrderModal(true)}
                className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="hidden xs:inline">New Order</span>
              </button>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Live WhatsApp Notification Banner */}
        {latestNotification && (
          <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md dark:shadow-lg animate-in fade-in transition-colors">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  WhatsApp Auto-Notification Triggered ({latestNotification.recipient})
                </span>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1 italic">"{latestNotification.message}"</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={latestNotification.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00a884] hover:bg-[#06cf9c] text-white font-bold text-[11px] shadow-sm active:scale-95"
              >
                <span>Open in WhatsApp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setLatestNotification(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 8-Stage Filter Stepper Bar */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl overflow-x-auto scrollbar-none flex gap-1 shadow-sm transition-colors">
          {STAGES.map((s) => {
            const isSelected = selectedStage === s.id;
            const count =
              s.id === 'all'
                ? uniqueOrders.length
                : uniqueOrders.filter((o) => o.current_stage === s.id).length;

            return (
              <button
                key={s.id}
                onClick={() => setSelectedStage(s.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span>{s.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isSelected
                      ? 'bg-slate-950 text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Orders Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Factory Orders ({filteredOrders.length})
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
              Auto-sync with WhatsApp logs & floor machines
            </span>
          </div>

          {loadingOrders ? (
            <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading orders from MySQL...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-3 shadow-sm transition-colors">
              <Package className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Orders in this Stage</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Create a new order to begin tracking it through the 8 stages with automated WhatsApp alerts.
              </p>
              {canCreateOrder && (
                <button
                  onClick={() => setShowNewOrderModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer shadow-md active:scale-95"
                >
                  Create First Order
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => {
                const isDelayed = order.is_delayed;
                const nextStageIndex = STAGES.findIndex((s) => s.id === order.current_stage) + 1;
                const nextStage = STAGES[nextStageIndex] || null;

                return (
                  <div
                    key={order.id}
                    className={`bg-white dark:bg-slate-900/90 border rounded-3xl p-5 space-y-4 flex flex-col justify-between transition-all hover:border-slate-400 dark:hover:border-slate-700 shadow-sm dark:shadow-lg ${
                      isDelayed
                        ? 'border-red-300 dark:border-red-500/40 bg-gradient-to-b from-red-50 to-white dark:from-red-950/20 dark:to-slate-900'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Top Row: Order ID, Stage Badge, Delay Alert */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                            #{order.id}
                          </span>
                          <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {order.current_stage.replace('_', ' ')}
                          </span>
                          {isDelayed && (
                            <span className="text-[10px] font-mono font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded-full border border-red-300 dark:border-red-500/40 animate-pulse">
                              Delayed
                            </span>
                          )}
                        </div>

                        {/* Customer Tracking link */}
                        <Link
                          to={`/track/${order.id}`}
                          target="_blank"
                          title="View Customer WhatsApp Tracking Link"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {/* Product Name & Customer Details */}
                      <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">{order.product_name}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {order.customer_name} • <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">+91 {order.customer_phone}</span>
                      </p>

                      {/* Specs snippet */}
                      <div className="bg-slate-50 dark:bg-slate-950/70 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 my-3 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                          <span>
                            {order.ply || '3-Ply'} • {order.box_type}
                          </span>
                          <strong className="text-slate-900 dark:text-white font-mono">{Number(order.quantity || 1000).toLocaleString()} pcs</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Est. Delivery:</span>
                          <span className={isDelayed ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-700 dark:text-slate-300 font-mono'}>
                            {new Date(order.estimated_delivery_date || order.target_deadline).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>

                        {/* Dispatch Information pill if recorded */}
                        {order.dispatch_id && (
                          <div className="flex items-center justify-between text-[11px] pt-1.5 mt-1 border-t border-slate-200 dark:border-slate-800 text-cyan-700 dark:text-cyan-300">
                            <span className="flex items-center gap-1 font-mono">
                              <Truck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                              <span>{order.dispatch_mode === 'pickup' ? 'Counter Pickup' : (order.dispatch_vehicle || 'Vehicle Delivery')}</span>
                            </span>
                            {order.current_stage === 'dispatch' && (
                              <button
                                onClick={() => {
                                  setActiveOrder(order);
                                  setDispatchForm({
                                    mode: order.dispatch_mode || 'delivery',
                                    vehicle: order.dispatch_vehicle || 'Tata Ace (OD-02-X-4912)',
                                    driver_phone: '9437188291',
                                    tracking_no: order.dispatch_tracking_no || `MNCH-${order.id}`,
                                  });
                                  setShowDispatchModal(true);
                                }}
                                className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer font-semibold"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      {/* Proactive Delay Broadcast Button */}
                      <button
                        onClick={() => {
                          setActiveOrder(order);
                          setShowDelayModal(true);
                        }}
                        title="Broadcast Delay Alert to Customer"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                      </button>

                      {/* 1-Tap Advance Stage Button */}
                      {order.current_stage !== 'delivered' && nextStage ? (
                        <button
                          onClick={() => handleAdvance(order)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95 ${
                            order.current_stage === 'qc'
                              ? 'bg-rose-500 hover:bg-rose-400 text-white'
                              : order.current_stage === 'dispatch' && order.dispatch_id
                              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          }`}
                        >
                          <span>
                            {order.current_stage === 'qc'
                              ? 'Inspect QC'
                              : order.current_stage === 'dispatch'
                              ? (order.dispatch_id ? '➔ Mark Delivered' : 'Dispatch')
                              : `➔ ${nextStage.label.split('. ')[1]}`}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Delivered</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Incoming Website Enquiries Table */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Incoming Website Enquiries</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Leads from the landing page ready to be converted into live orders</p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
              {enquiries.length} Enquiries
            </span>
          </div>

          {enquiries.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">No visitor leads submitted yet.</div>
          ) : (
            <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
              <table className="w-full text-left text-xs min-w-[550px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px]">
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">WhatsApp Phone</th>
                    <th className="pb-3">Box Type</th>
                    <th className="pb-3">Quantity</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {enquiries.map((enq) => (
                    <tr key={enq.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">{enq.customer_name}</td>
                      <td className="py-3 font-mono text-emerald-700 dark:text-emerald-400 font-semibold">+91 {enq.customer_phone}</td>
                      <td className="py-3">{enq.box_type}</td>
                      <td className="py-3 font-mono font-bold">{Number(enq.quantity).toLocaleString()} pcs</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            setNewOrderForm({
                              ...newOrderForm,
                              customer_name: enq.customer_name,
                              customer_phone: enq.customer_phone,
                              box_type: enq.box_type || 'Mailer Box',
                              quantity: enq.quantity || 3000,
                            });
                            setShowNewOrderModal(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-[11px] font-bold cursor-pointer transition-colors active:scale-95"
                        >
                          Convert to Order
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL 1: Create New Order */}
        {showNewOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Factory Order</h3>
                </div>
                <button onClick={() => setShowNewOrderModal(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrderSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sanjay Patra"
                    value={newOrderForm.customer_name}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, customer_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">WhatsApp Phone (+91) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="98610 12345"
                      value={newOrderForm.customer_phone}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customer_phone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Estimated Delivery Date *</label>
                    <input
                      type="date"
                      required
                      value={newOrderForm.estimated_delivery_date}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, estimated_delivery_date: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Box Type</label>
                    <select
                      value={newOrderForm.box_type}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, box_type: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Mailer Box">Mailer Box (E-Commerce)</option>
                      <option value="Master Carton">Master Outer Carton</option>
                      <option value="Rigid Gift Box">Rigid Sweet / Gift Box</option>
                      <option value="Die-cut Box">Die-cut Display Box</option>
                      <option value="Pizza Box">Pizza / Food Box</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Quantity (Units)</label>
                    <input
                      type="number"
                      min="500"
                      step="500"
                      required
                      value={newOrderForm.quantity}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, quantity: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/20 p-3 rounded-2xl text-[11px] text-emerald-800 dark:text-emerald-300">
                  ✨ Creating this order will automatically dispatch the <strong>Stage 1 (Enquiry) WhatsApp update</strong> with estimated delivery date to the customer and owner.
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewOrderModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingOrder}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer shadow-md active:scale-95"
                  >
                    {creatingOrder ? 'Booking...' : 'Book Order & Send WhatsApp'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: QC Inspection (Checklist + Photo Proof + Fail Loop) */}
        {showQCModal && activeOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Quality Control (QC) Studio</h3>
                </div>
                <button onClick={() => setShowQCModal(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs space-y-3">
                <p className="text-slate-600 dark:text-slate-300">
                  Order <strong>#{activeOrder.id}</strong> ({activeOrder.product_name}). Complete the fixed 6-point checklist before release:
                </p>

                {/* Checklist */}
                <div className="space-y-2">
                  {[
                    { key: 'dimensionAccuracy', label: 'Dimension accuracy (L × W × H ± 2mm)' },
                    { key: 'burstingStrength', label: 'Bursting strength & GSM verified' },
                    { key: 'moistureCheck', label: 'Moisture content < 10% (dry)' },
                    { key: 'printRegistration', label: 'Print registration & ink fidelity' },
                    { key: 'glueAdhesion', label: 'Glue joint / stitch tensile pull test' },
                    { key: 'barcodeScan', label: 'Barcode / QR code readability test' },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      onClick={() => setQcForm({ ...qcForm, [key]: !qcForm[key] })}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        qcForm[key]
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${qcForm[key] ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-700'}`} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Defect Description for Rejection */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Defect Reason (Only if rejecting back to Production):
                  </label>
                  <input
                    type="text"
                    value={qcForm.fail_reason}
                    onChange={(e) => setQcForm({ ...qcForm, fail_reason: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Dual Decision Actions */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleQCSubmit('Failed')}
                    className="px-4 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Fail ➔ Back to Prod</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQCSubmit('Passed')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Pass QC ➔ Dispatch</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: Dispatch (Delivery vs Self-Pickup) */}
        {showDispatchModal && activeOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-5 sm:p-6 space-y-4 text-slate-900 dark:text-white transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                  <Truck className="w-5 h-5" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Dispatch Order #{activeOrder.id}</h3>
                </div>
                <button onClick={() => setShowDispatchModal(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDispatchSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Dispatch Mode *</label>
                  <select
                    value={dispatchForm.mode}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, mode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="delivery">Delivery (Vehicle / Courier)</option>
                    <option value="pickup">Self-Pickup (Factory Counter)</option>
                  </select>
                </div>

                {dispatchForm.mode === 'delivery' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Vehicle / Courier Name</label>
                      <input
                        type="text"
                        value={dispatchForm.vehicle}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, vehicle: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Driver Phone (+91)</label>
                      <input
                        type="tel"
                        value={dispatchForm.driver_phone}
                        onChange={(e) => setDispatchForm({ ...dispatchForm, driver_phone: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 space-y-1">
                    <p className="text-slate-900 dark:text-white font-medium">Pickup Address:</p>
                    <p>Box Shop, Shed 42-B, Sector A, Mancheswar IE, Bhubaneswar</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Timings: 9:30 AM - 6:30 PM (Mon-Sat)</p>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDispatchModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDispatchSubmit(e, true)}
                    className="px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-bold cursor-pointer active:scale-95"
                  >
                    Dispatch & Mark Delivered
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer shadow-md active:scale-95"
                  >
                    Dispatch & Send WhatsApp
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: Delay Alert Broadcast */}
        {showDelayModal && activeOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-5 sm:p-6 space-y-4 text-slate-900 dark:text-white transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-red-600 dark:text-red-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Broadcast Delay Alert</h3>
                </div>
                <button onClick={() => setShowDelayModal(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDelaySubmit} className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Notify <strong>{activeOrder.customer_name}</strong> on WhatsApp proactively before they ask "Order kahan hai?".
                </p>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">New Expected Ready Date *</label>
                  <input
                    type="date"
                    required
                    value={delayForm.new_expected_date}
                    onChange={(e) => setDelayForm({ ...delayForm, new_expected_date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Reason for Delay</label>
                  <select
                    value={delayForm.delay_reason}
                    onChange={(e) => setDelayForm({ ...delayForm, delay_reason: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Kraft paper reel shipment delayed from mill">
                      Kraft paper reel shipment delayed from mill
                    </option>
                    <option value="Corrugator line maintenance & repair">
                      Corrugator line maintenance & repair
                    </option>
                    <option value="Customer requested die-line alteration">
                      Customer requested die-line alteration
                    </option>
                    <option value="Monsoon high moisture slowed down board drying">
                      Monsoon high moisture slowed down board drying
                    </option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDelayModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold cursor-pointer active:scale-95"
                  >
                    Broadcast WhatsApp Delay Notice
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
