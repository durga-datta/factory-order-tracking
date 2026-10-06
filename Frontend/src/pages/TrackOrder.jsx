import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  Truck,
  MessageCircle,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  CheckCheck,
} from 'lucide-react';
import { fetchPublicTracking } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

const STAGES = [
  { id: 'enquiry', label: '1. Enquiry' },
  { id: 'spec_sheet', label: '2. Spec Sheet' },
  { id: 'design_sample', label: '3. Design & Sample' },
  { id: 'approved', label: '4. Approved' },
  { id: 'production', label: '5. Production' },
  { id: 'qc', label: '6. QC Check' },
  { id: 'dispatch', label: '7. Dispatch' },
  { id: 'delivered', label: '8. Delivered' },
];

export default function TrackOrder() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPublicTracking(orderId)
      .then((res) => {
        if (res.success) {
          setOrder(res.data);
        } else {
          setError(res.message || 'Order not found');
        }
      })
      .catch((err) => setError(err.message || 'Failed to load tracking data'))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 transition-colors">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Loading Order #{orderId} status...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 transition-colors">
        <div className="text-center max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Order Not Found</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">{error || 'Please verify the Order ID from your WhatsApp message.'}</p>
          <Link to="/" className="inline-block mt-3 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
            &larr; Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex((s) => s.id === order.current_stage);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white pb-12 transition-colors duration-200">
      {/* Top Banner */}
      <div className="bg-[#075E54] text-white px-3 sm:px-6 py-2.5 text-xs flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="line-clamp-1">Official WhatsApp Tracking · <strong>Box Shop (Mancheswar IE)</strong></span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle className="bg-emerald-800/80 hover:bg-emerald-700/80 border-emerald-600/40 text-white" />
          <Link to="/" className="text-[11px] text-emerald-200 hover:text-white underline">
            Home
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6 sm:pt-8 space-y-5 sm:space-y-6">
        {/* Order Header Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md dark:shadow-xl space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-300 dark:border-emerald-500/30">
                  ORDER #{order.id}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                  {order.current_stage.replace('_', ' ')}
                </span>
                {order.is_delayed && (
                  <span className="text-[10px] font-mono font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded-full border border-red-300 dark:border-red-500/40 animate-pulse">
                    Delayed
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">{order.product_name}</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Client: <strong className="text-slate-800 dark:text-slate-200">{order.customer_name}</strong> • Quantity:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{Number(order.quantity || 1000).toLocaleString()} units</strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Estimated Ready Date</span>
              <div className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center sm:justify-end gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{new Date(order.estimated_delivery_date || order.target_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* 8-Stage Progress Stepper */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono mb-4">
              Live Stage Progress ({currentStageIndex + 1} of 8)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STAGES.map((s, idx) => {
                const isPassed = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div
                    key={s.id}
                    className={`p-3 rounded-2xl border text-xs flex flex-col justify-between transition-all ${
                      isCurrent
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-white ring-1 ring-emerald-500/40 shadow-md'
                        : isPassed
                        ? 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-900 text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">0{idx + 1}</span>
                      {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                      {isCurrent && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>}
                    </div>
                    <span className="font-bold truncate">{s.label.split('. ')[1]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Spec Sheet Verification (If Stage >= 2) */}
        {order.specSheet && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md dark:shadow-xl space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Manufacturing Specifications</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Verified Board Grade
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-mono">Dimensions</span>
                <strong className="text-slate-900 dark:text-white mt-1 block font-mono">
                  {order.specSheet.length}" × {order.specSheet.width}" × {order.specSheet.height}"
                </strong>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-mono">Ply & Flute</span>
                <strong className="text-slate-900 dark:text-white mt-1 block">
                  {order.specSheet.ply} ({order.specSheet.flute_type || 'E-Flute'})
                </strong>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-mono">Printing Process</span>
                <strong className="text-slate-900 dark:text-white mt-1 block">{order.specSheet.print_type}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Quality Control Photos (If QC passed) */}
        {order.qc && order.qc.status === 'Passed' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md dark:shadow-xl space-y-3 transition-colors">
            <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400">
              <ShieldCheck className="w-4 h-4" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quality Assurance & Photo Proof</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              100% pre-dispatch inspection completed by {order.qc.inspector_name || 'QC Inspector'}.
            </p>
          </div>
        )}

        {/* Direct Contact Button */}
        <div className="text-center pt-2">
          <a
            href="https://wa.me/919861012345?text=Hello%20Box%20Shop,%20inquiry%20regarding%20my%20order"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#00a884] hover:bg-[#06cf9c] text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat Directly with Factory on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
