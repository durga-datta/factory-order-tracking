import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Users,
  LogOut,
  Crown,
  UserCheck,
  Clock,
  Layers,
  ShieldCheck,
  Truck,
  MessageCircle,
  Plus,
  ArrowRight,
  Inbox,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('trackvriksha_token');
  const [currentUser, setCurrentUser] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('trackvriksha_user');
    if (!token || !savedUser) {
      navigate('/login');
      return;
    }
    setCurrentUser(JSON.parse(savedUser));

    // Fetch incoming website visitor enquiries from MySQL backend
    fetch('http://localhost:5000/api/enquiries')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEnquiries(data.data || []);
        }
      })
      .catch((err) => console.error('Error loading enquiries:', err))
      .finally(() => setLoadingEnquiries(false));
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('trackvriksha_token');
    localStorage.removeItem('trackvriksha_user');
    navigate('/login');
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const permissions = currentUser.permissions || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-bold">
              <Package className="w-6 h-6" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white">TrackVriksha</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-semibold">
                  Factory Console
                </span>
              </div>
              <p className="text-xs text-slate-400">Box Shop · Mancheswar Industrial Estate, Bhubaneswar</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile Badge */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              {isAdmin ? (
                <Crown className="w-4 h-4 text-amber-400" />
              ) : (
                <UserCheck className="w-4 h-4 text-emerald-400" />
              )}
              <div>
                <span className="font-bold text-white block leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400 font-mono capitalize">{currentUser.role}</span>
              </div>
            </div>

            {/* Admin Staff Management Button */}
            {isAdmin && (
              <Link
                to="/admin/staff"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-all"
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span>Manage Staff & Roles</span>
              </Link>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Role & Permissions Banner for Staff */}
        {!isAdmin && (
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-white">Employee Role Access:</span>
              <p className="text-slate-400 mt-0.5">Your factory permissions granted by the Administrator.</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {permissions.map((p) => (
                <span key={p} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                  {p.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs font-medium text-slate-400 uppercase font-mono block">Website Leads</span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{enquiries.length}</div>
            <span className="text-[11px] text-slate-500">From public landing page</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs font-medium text-slate-400 uppercase font-mono block">Live Factory Orders</span>
            <div className="text-2xl font-black text-white font-mono mt-1">0</div>
            <span className="text-[11px] text-slate-500">8 stages pipeline</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs font-medium text-slate-400 uppercase font-mono block">QC Checked</span>
            <div className="text-2xl font-black text-rose-400 font-mono mt-1">0</div>
            <span className="text-[11px] text-slate-500">With photo verification</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs font-medium text-slate-400 uppercase font-mono block">WhatsApp Notifications</span>
            <div className="text-2xl font-black text-teal-400 font-mono mt-1">100%</div>
            <span className="text-[11px] text-slate-500">Automated triggers</span>
          </div>
        </div>

        {/* Section 1: Incoming Website Enquiries (From Public Form) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Incoming Website Enquiries & Quotes</h3>
                <p className="text-xs text-slate-400">Visitors requesting custom box quotations from the landing page</p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
              {enquiries.length} Enquiries
            </span>
          </div>

          {loadingEnquiries ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading enquiries from MySQL...</div>
          ) : enquiries.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No enquiries submitted yet. Fill the public quote form on the landing page to test!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">WhatsApp Phone</th>
                    <th className="pb-3 font-semibold">Packaging Type</th>
                    <th className="pb-3 font-semibold">Quantity</th>
                    <th className="pb-3 font-semibold">Notes / Specs</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {enquiries.map((enq) => (
                    <tr key={enq.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-medium text-white">
                        {enq.customer_name}
                        {enq.company_name && (
                          <span className="block text-[10px] text-slate-400">{enq.company_name}</span>
                        )}
                      </td>
                      <td className="py-3 font-mono text-emerald-400">+91 {enq.customer_phone}</td>
                      <td className="py-3 font-medium text-white">{enq.box_type}</td>
                      <td className="py-3 font-mono font-bold text-slate-200">{enq.quantity?.toLocaleString()} pcs</td>
                      <td className="py-3 text-slate-400 max-w-xs truncate">{enq.message || 'Standard inquiry'}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono capitalize">
                          {enq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
