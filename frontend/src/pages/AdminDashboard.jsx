// ADMIN PORTAL DASHBOARD PANEL
// Manages pending worker registrations, document verification workflows,
// and displays system analytics (role distribution, bookings tracking, financial volumes).

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Users, Check, X, ShieldAlert, Award, FileText, IndianRupee, Activity, CheckCircle, AlertCircle, TrendingUp
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: { customer: 0, worker: 0, contractor: 0, admin: 0 },
    bookings: { pending: 0, accepted: 0, started: 0, completed: 0, cancelled: 0 },
    processedVolume: 0.00
  });
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchPendingWorkers();
  }, []);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await axios.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to retrieve platform stats:', err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPendingWorkers = async () => {
    setLoadingWorkers(true);
    try {
      const res = await axios.get('/api/admin/pending');
      setPendingWorkers(res.data);
    } catch (err) {
      console.error('Failed to retrieve pending worker list:', err.message);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleVerify = async (workerId, approve) => {
    setActioningId(workerId);
    try {
      await axios.post('/api/admin/verify', { workerId, approve });
      await fetchPendingWorkers();
      await fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Verification action failed.');
    } finally {
      setActioningId(null);
    }
  };

  // Derived user metric calculations
  const totalUsers = Object.values(stats.users).reduce((a, b) => a + b, 0);
  const totalBookings = Object.values(stats.bookings).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full flex flex-col gap-8 text-left">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">System Administration</h1>
          <p className="text-dark-300 text-sm">Control worker verification audits, verify platform metrics, and monitor simulated money flows.</p>
        </div>
        <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 px-4 py-2 rounded-xl">
          <ShieldAlert className="w-5 h-5 text-brand-500 pulse-active" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Superadmin Mode Active</span>
        </div>
      </div>

      {/* METRIC GRID */}
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="glass-panel p-6 rounded-2xl border-white/5 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* STAT 1: TOTAL USERS */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-dark-400 uppercase tracking-wider">Total Platform Users</span>
              <span className="text-3xl font-extrabold text-white mt-1">{totalUsers}</span>
              <span className="text-[10px] text-dark-300 mt-1.5 flex items-center gap-1 font-semibold">
                <Users className="w-3 h-3 text-brand-500" /> {stats.users.worker} Workers • {stats.users.customer} Clients
              </span>
            </div>
            <div className="bg-brand-500/10 p-3 rounded-xl text-brand-500">
              <Users className="w-6 h-6 stroke-[2]" />
            </div>
          </div>

          {/* STAT 2: TOTAL TRANSACTIONS */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-dark-400 uppercase tracking-wider">Simulated Volume Payouts</span>
              <span className="text-3xl font-extrabold text-white mt-1">₹{stats.processedVolume.toLocaleString()}</span>
              <span className="text-[10px] text-green-400 mt-1.5 flex items-center gap-1 font-semibold">
                <TrendingUp className="w-3 h-3" /> Ledger Settlements Stable
              </span>
            </div>
            <div className="bg-green-500/10 p-3 rounded-xl text-green-400">
              <IndianRupee className="w-6 h-6 stroke-[2]" />
            </div>
          </div>

          {/* STAT 3: TOTAL ORDERS */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-dark-400 uppercase tracking-wider">Total Service Orders</span>
              <span className="text-3xl font-extrabold text-white mt-1">{totalBookings}</span>
              <span className="text-[10px] text-brand-500 mt-1.5 flex items-center gap-1 font-semibold animate-pulse">
                <Activity className="w-3 h-3" /> {stats.bookings.started} In Progress • {stats.bookings.completed} Done
              </span>
            </div>
            <div className="bg-brand-500/10 p-3 rounded-xl text-brand-400">
              <FileText className="w-6 h-6 stroke-[2]" />
            </div>
          </div>

          {/* STAT 4: COMPLETION RATE */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-dark-400 uppercase tracking-wider">Order Completion Success</span>
              <span className="text-3xl font-extrabold text-white mt-1">
                {totalBookings > 0 ? ((stats.bookings.completed / totalBookings) * 100).toFixed(0) : 100}%
              </span>
              <span className="text-[10px] text-green-400 mt-1.5 flex items-center gap-1 font-semibold">
                <CheckCircle className="w-3 h-3 text-green-400" /> Matches Industry Benchmarks
              </span>
            </div>
            <div className="bg-green-500/10 p-3 rounded-xl text-green-400">
              <CheckCircle className="w-6 h-6 stroke-[2]" />
            </div>
          </div>

        </div>
      )}

      {/* SYSTEM SECTION PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PENDING WORKERS APPROVAL MODULE */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Pending Document Approvals Queue ({pendingWorkers.length})
            </h2>
            <button 
              onClick={fetchPendingWorkers}
              className="text-xs text-brand-500 hover:underline font-bold"
            >
              Refresh Queue
            </button>
          </div>

          {loadingWorkers ? (
            <div className="glass-panel p-12 rounded-3xl border-white/5 text-center flex justify-center">
              <span className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pendingWorkers.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl text-center border-white/5 text-dark-400 flex flex-col items-center gap-3">
              <Award className="w-10 h-10 text-brand-400" />
              <p className="font-bold text-white">All Worker Audits Complete!</p>
              <p className="text-xs text-dark-500">There are no pending identity verifications in the administrative docket.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {pendingWorkers.map((w, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={w.user_id} 
                  className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center hover:border-brand-500/10 transition-colors"
                >
                  <div className="flex gap-4 items-start">
                    <img 
                      src={w.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                      alt="avatar" 
                      className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0 mt-1" 
                    />
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-white text-sm">{w.name}</h3>
                        <span className="text-[10px] bg-yellow-500/10 text-yellow-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Pending Audit</span>
                      </div>
                      <p className="text-xs text-dark-300 mt-1">
                        Skills: <span className="text-white font-semibold">{w.skills}</span> • Rate: <span className="text-white font-semibold">₹{w.hourly_rate}/hr</span>
                      </p>
                      <p className="text-xs text-dark-400 mt-1">
                        Email: {w.email} • Mobile: {w.phone}
                      </p>
                      <p className="text-xs text-dark-400">
                        Experience: {w.experience_years} years in field
                      </p>

                      {/* Mock Identity File link */}
                      <div className="mt-3.5 flex items-center gap-2">
                        <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Audit Documentation:</span>
                        <a 
                          href={w.identity_proof_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[11px] font-bold text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/10 px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors"
                        >
                          <FileText className="w-3 h-3" /> View Adhaar/Welfare ID Card
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* APPROVAL TRIGGERS */}
                  <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <button 
                      onClick={() => handleVerify(w.user_id, false)}
                      disabled={actioningId === w.user_id}
                      className="flex-1 md:flex-none bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                    <button 
                      onClick={() => handleVerify(w.user_id, true)}
                      disabled={actioningId === w.user_id}
                      className="flex-1 md:flex-none bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/10 font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Verify Profile
                    </button>
                  </div>

                </motion.div>
              ))}
            </div>
          )}

        </div>

        {/* METRICS SUMMARY & BREAKDOWN PANELS */}
        <div className="flex flex-col gap-6">
          
          {/* USER DISTRIBUTIONS */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col gap-4 text-left">
            <h3 className="font-bold text-white text-base">User Base Distribution</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Independent Labourers', count: stats.users.worker, total: totalUsers, color: 'bg-brand-500' },
                { label: 'Hiring Customers', count: stats.users.customer, total: totalUsers, color: 'bg-green-500' },
                { label: 'Workforce Contractors', count: stats.users.contractor, total: totalUsers, color: 'bg-blue-500' },
                { label: 'Administrative Overseers', count: stats.users.admin, total: totalUsers, color: 'bg-purple-500' }
              ].map(u => {
                const pct = totalUsers > 0 ? ((u.count / totalUsers) * 100) : 0;
                return (
                  <div key={u.label} className="text-xs">
                    <div className="flex justify-between font-medium text-dark-300 mb-1">
                      <span>{u.label}</span>
                      <span className="font-bold text-white">{u.count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-dark-900 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full ${u.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOOKINGS LIFECYCLE DYNAMICS */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col gap-4 text-left">
            <h3 className="font-bold text-white text-base">Booking Lifecycles</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Pending Response', count: stats.bookings.pending, color: 'bg-yellow-500' },
                { label: 'Accepted Orders', count: stats.bookings.accepted, color: 'bg-indigo-500' },
                { label: 'Actively In Progress', count: stats.bookings.started, color: 'bg-brand-500' },
                { label: 'Completed & Paid', count: stats.bookings.completed, color: 'bg-green-500' },
                { label: 'Cancelled Request', count: stats.bookings.cancelled, color: 'bg-red-500' }
              ].map(b => {
                const pct = totalBookings > 0 ? ((b.count / totalBookings) * 100) : 0;
                return (
                  <div key={b.label} className="text-xs">
                    <div className="flex justify-between font-medium text-dark-300 mb-1">
                      <span>{b.label}</span>
                      <span className="font-bold text-white">{b.count}</span>
                    </div>
                    <div className="w-full bg-dark-900 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full ${b.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FRAUD RISK ADVISORY */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 bg-brand-500/[0.02] border-brand-500/10 flex flex-col gap-3 text-left">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-brand-500 shrink-0" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Compliance Monitor</h4>
            </div>
            <p className="text-[11px] text-dark-300 leading-relaxed">
              Ensure regular random audits of Identity proofs. Flag any accounts that frequently fail OTP checks or report simulated bank payout disputes immediately.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
