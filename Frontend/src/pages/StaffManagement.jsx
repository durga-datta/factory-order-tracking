import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  Users,
  Shield,
  Check,
  X,
  Lock,
  Mail,
  Phone,
  User,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Crown,
} from 'lucide-react';
import { fetchStaffList, appointStaff, updateStaffMember } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

const AVAILABLE_PERMISSIONS = [
  { key: 'create_order', label: 'Create Orders', desc: 'Can take enquiry from customer and generate Order ID' },
  { key: 'update_spec', label: 'Spec Sheet', desc: 'Can fill technical box ply, GSM, dimensions & price' },
  { key: 'manage_sample', label: 'Sample Tracker', desc: 'Can assign unique Sample IDs and shelf location' },
  { key: 'approve_order', label: 'Approve & Advance', desc: 'Can mark sign-off and confirm 50% advance payment' },
  { key: 'production_ops', label: 'Floor Operations', desc: 'Can advance jobs through corrugation, print, die-cut' },
  { key: 'qc_check', label: 'Quality Control (QC)', desc: 'Can run 6-point checklist & upload proof photos' },
  { key: 'dispatch_ops', label: 'Dispatch & Delivery', desc: 'Can route order for delivery vehicle or counter pickup' },
];

export default function StaffManagement() {
  const token = localStorage.getItem('trackvriksha_token');
  const currentUser = JSON.parse(localStorage.getItem('trackvriksha_user') || '{}');

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New staff form state
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    permissions: ['create_order', 'update_spec', 'production_ops'],
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await fetchStaffList(token);
      setStaffList(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleTogglePermissionInForm = (permKey) => {
    setNewStaff((prev) => {
      const exists = prev.permissions.includes(permKey);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permKey)
          : [...prev.permissions, permKey],
      };
    });
  };

  const handleAppointSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newStaff.name || !newStaff.email || !newStaff.password || !newStaff.phone) {
      setFormError('Please fill in all employee fields.');
      return;
    }

    try {
      setFormSubmitting(true);
      await appointStaff(newStaff, token);
      setShowAddModal(false);
      setNewStaff({
        name: '',
        email: '',
        phone: '',
        password: '',
        permissions: ['create_order', 'update_spec', 'production_ops'],
      });
      await loadStaff();
    } catch (err) {
      setFormError(err.message || 'Could not appoint employee');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (staffMember) => {
    const newStatus = staffMember.status === 'active' ? 'inactive' : 'active';
    try {
      await updateStaffMember(staffMember.id, { status: newStatus }, token);
      await loadStaff();
    } catch (err) {
      alert(err.message || 'Failed to update employee status');
    }
  };

  const handleToggleStaffPerm = async (staffMember, permKey) => {
    const currentPerms = staffMember.permissions || [];
    const updatedPerms = currentPerms.includes(permKey)
      ? currentPerms.filter((p) => p !== permKey)
      : [...currentPerms, permKey];

    try {
      await updateStaffMember(staffMember.id, { permissions: updatedPerms }, token);
      await loadStaff();
    } catch (err) {
      alert(err.message || 'Failed to update permission');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans p-4 sm:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="p-2 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Staff & Permissions Hub</h1>
              <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Admin
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Appoint factory floor workers, estimators, and QC inspectors. Configure authorized capabilities.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <ThemeToggle />
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Appoint Employee</span>
            </button>
          </div>
        </div>

        {/* Staff Table / Cards */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading staff directory...</div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 rounded-2xl text-xs">
            {error}
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 shadow-sm">
            <Users className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Employees Appointed Yet</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              As Factory Admin, you can add your staff members and grant them permissions to create orders, update specs, or perform QC.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
            >
              Appoint First Employee
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {staffList.map((member) => (
              <div
                key={member.id}
                className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 hover:border-slate-400 dark:hover:border-slate-700 shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm border border-slate-200 dark:border-slate-700 shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {member.email} • +91 {member.phone}
                      </p>
                    </div>
                  </div>

                  {/* Active / Inactive switch */}
                  <button
                    onClick={() => handleToggleStatus(member)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold cursor-pointer transition-all border shrink-0 ${
                      member.status === 'active'
                        ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                        : 'bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-300 dark:border-red-500/30'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <span>{member.status.toUpperCase()}</span>
                  </button>
                </div>

                {/* Granular Permission Badges with 1-Click Toggle */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="block text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Authorized Capabilities (Click to toggle):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_PERMISSIONS.map((perm) => {
                      const hasPerm = (member.permissions || []).includes(perm.key);
                      return (
                        <button
                          key={perm.key}
                          onClick={() => handleToggleStaffPerm(member, perm.key)}
                          title={perm.desc}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border flex items-center gap-1 active:scale-95 ${
                            hasPerm
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                              : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${hasPerm ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-700'}`}></span>
                          <span>{perm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Appoint New Employee */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Appoint New Employee</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs rounded-xl">
                  {formError}
                </div>
              )}

              <form onSubmit={handleAppointSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Employee Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amit Kumar (Floor Staff)"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="amit@boxshop.com"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Phone (+91) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="98610 99881"
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Assign password (e.g. Staff@123)"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Permissions checkboxes */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono mb-2">
                    Assign Capabilities:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AVAILABLE_PERMISSIONS.map((perm) => {
                      const isChecked = newStaff.permissions.includes(perm.key);
                      return (
                        <div
                          key={perm.key}
                          onClick={() => handleTogglePermissionInForm(perm.key)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2 ${
                            isChecked
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500/60 text-emerald-900 dark:text-emerald-200'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                              isChecked
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-[11px] font-medium">{perm.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md active:scale-95"
                  >
                    {formSubmitting ? 'Appointing...' : 'Appoint Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
