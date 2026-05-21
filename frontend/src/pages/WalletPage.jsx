// MOCK DIGITAL WALLET & TRANSACTION LEDGER PANEL
// Renders digital balance cards, deposit processors, and interactive ledgers.

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { 
  Wallet, ArrowDownLeft, ArrowUpRight, PlusCircle, CheckCircle2, AlertCircle, RefreshCw, Landmark, CreditCard, ShieldCheck, HelpCircle, TrendingUp, TrendingDown
} from 'lucide-react';

// Safe number helper — prevents toFixed TypeError from string/null/undefined values
const safeNum = (val) => Number(val || 0);

// Loading skeleton shimmer block
const SkeletonBlock = ({ className = '' }) => (
  <div className={`bg-white/5 rounded-xl animate-pulse ${className}`} />
);

const WalletPage = () => {
  const { user, wallet, fetchWallet, depositFunds } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState({ totalEarnings: 0, jobsCount: 0, monthlyHistory: [] });
  const [loading, setLoading] = useState(true);
  
  // Deposit simulation form state
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // UPI, Mock Card, Netbanking
  const [depositLoading, setDepositLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      await fetchWallet();
      await fetchTransactions();
      if (user?.role === 'worker') {
        await fetchEarningsAnalytics();
      }
    } catch (err) {
      console.error('Failed to load financial records:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('/api/wallet/transactions');
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Could not sync transactions ledger.');
      setTransactions([]);
    }
  };

  const fetchEarningsAnalytics = async () => {
    try {
      const res = await axios.get('/api/wallet/analytics');
      setAnalytics({
        totalEarnings: safeNum(res.data?.totalEarnings),
        jobsCount: safeNum(res.data?.jobsCount),
        monthlyHistory: res.data?.monthlyHistory || []
      });
    } catch (err) {
      console.warn('Could not load earnings metrics.');
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please supply a valid amount greater than zero.');
      return;
    }

    setDepositLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await depositFunds(amt, paymentMethod);
      setSuccessMsg(`₹${amt.toFixed(2)} successfully top-up simulated! Added to your ledger.`);
      setDepositAmount('');
      await fetchTransactions();
      if (user?.role === 'worker') {
        await fetchEarningsAnalytics();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Deposit simulation failed.');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleQuickPreset = (val) => {
    setDepositAmount(val.toString());
  };

  const isWorker = user?.role === 'worker';
  const currentBalance = safeNum(wallet?.balance);

  // Total credits vs debits from transactions
  const totalCredits = transactions.filter(tx => tx.type === 'credit' || tx.type === 'deposit').reduce((sum, tx) => sum + safeNum(tx.amount), 0);
  const totalDebits = transactions.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + safeNum(tx.amount), 0);

  return (
    <div className="w-full flex flex-col gap-8 text-left">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Digital Banking Wallet</h1>
          <p className="text-dark-300 text-sm">Simulate electronic topups, inspect project credits/debits, and check earnings audits.</p>
        </div>
        <button 
          onClick={loadWalletData}
          className="text-xs text-dark-300 hover:text-white flex items-center gap-1 font-bold border border-white/5 bg-white/5 py-2 px-4 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Balance
        </button>
      </div>

      {/* CORE WALLET OVERVIEW & DEPOSIT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMN 1: DIGITAL CARD & BALANCE STATS */}
        <div className="flex flex-col gap-6">
          
          {/* PREMIUM DIGITAL CARD */}
          {loading ? (
            <SkeletonBlock className="h-48 rounded-3xl" />
          ) : (
            <div className="relative h-48 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-brand-600 to-orange-500 p-6 flex flex-col justify-between text-white neon-glow-orange">
              {/* Card Background Overlay */}
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
                <Wallet className="w-64 h-64" />
              </div>
              
              <div className="flex justify-between items-start z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-white/70">Labour Connect Ledger</span>
                  <span className="text-sm font-bold mt-1">UPI Smart Debit Account</span>
                </div>
                <span className="text-xs bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full font-bold uppercase">Mock Mode</span>
              </div>

              <div className="z-10 text-left">
                <span className="text-[10px] text-white/70 font-semibold block">Total Available Balance</span>
                <span className="text-3xl font-extrabold mt-1 block">₹{currentBalance.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center z-10 text-xs border-t border-white/10 pt-4 mt-2">
                <span className="font-semibold tracking-widest uppercase">
                  {(user?.full_name || user?.name || 'User').toUpperCase()}
                </span>
                <span className="text-[10px] uppercase font-bold text-white/80">
                  Role: {user?.role || 'N/A'}
                </span>
              </div>
            </div>
          )}

          {/* QUICK STATS SUMMARY */}
          {loading ? (
            <SkeletonBlock className="h-32 rounded-2xl" />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-panel p-4 rounded-2xl border-white/5 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-green-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-dark-400">Total In</span>
                </div>
                <p className="text-base font-extrabold text-green-400">₹{totalCredits.toFixed(2)}</p>
              </div>
              <div className="glass-panel p-4 rounded-2xl border-white/5 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-red-400">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-dark-400">Total Out</span>
                </div>
                <p className="text-base font-extrabold text-red-400">₹{totalDebits.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* WORKER EARNING SUMMARY STATISTICS */}
          {isWorker && (
            loading ? (
              <SkeletonBlock className="h-36 rounded-2xl" />
            ) : (
              <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col gap-4 text-left">
                <h3 className="font-bold text-white text-base">Worker Earnings Snapshot</h3>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-xl text-center">
                    <span className="text-dark-400 font-medium">All-time Revenue</span>
                    <p className="text-lg font-extrabold text-green-400 mt-1">₹{safeNum(analytics.totalEarnings).toFixed(2)}</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-xl text-center">
                    <span className="text-dark-400 font-medium">Paid Projects</span>
                    <p className="text-lg font-extrabold text-brand-400 mt-1">{safeNum(analytics.jobsCount)} completed</p>
                  </div>
                </div>

                <div className="bg-brand-500/5 border border-brand-500/10 p-3.5 rounded-xl flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-brand-400 shrink-0" />
                  <p className="text-[10px] text-dark-300 leading-relaxed">
                    Earnings are automatically credited upon OTP project completion. Co-op squads split payouts equally.
                  </p>
                </div>
              </div>
            )
          )}

        </div>

        {/* COLUMN 2: DEPOSIT SIMULATION MODULE */}
        <div className="lg:col-span-2">
          
          <div className="glass-panel p-6 rounded-3xl border-white/5 h-full flex flex-col justify-between text-left">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-brand-500" /> Simulate Top-up Deposit
              </h3>
              <p className="text-xs text-dark-300 mt-1">
                Enter simulated payments to test booking flows. Real credit cards are NOT required.
              </p>

              {/* Status messages */}
              <AnimatePresence>
                {successMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="mt-4 bg-green-500/10 border border-green-500/25 p-3.5 rounded-xl flex items-center gap-2.5 text-green-400 text-xs font-bold"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="mt-4 bg-red-500/10 border border-red-500/25 p-3.5 rounded-xl flex items-center gap-2.5 text-red-400 text-xs font-bold"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Presets and entry */}
              <form onSubmit={handleDepositSubmit} className="mt-6 flex flex-col gap-4 text-xs">
                
                {/* Method selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-dark-200 uppercase tracking-wider">Simulated Gateway</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'UPI', label: 'UPI QR Pay', icon: <Landmark className="w-4 h-4" /> },
                      { id: 'Mock Card', label: 'Mock Card', icon: <CreditCard className="w-4 h-4" /> },
                      { id: 'Netbanking', label: 'Net Bank', icon: <Landmark className="w-4 h-4" /> }
                    ].map(pm => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${paymentMethod === pm.id ? 'bg-brand-500 border-brand-500 text-white shadow-glass' : 'bg-transparent border-white/10 text-dark-200'}`}
                      >
                        {pm.icon}
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount presets */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-dark-200 uppercase tracking-wider">Select Preset Amount</label>
                  <div className="flex gap-2 flex-wrap">
                    {[500, 1000, 2000, 5000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuickPreset(val)}
                        className={`py-1.5 px-3.5 border rounded-lg font-bold transition-all ${depositAmount === String(val) ? 'bg-brand-500/20 border-brand-500 text-brand-400' : 'bg-white/5 border-white/10 hover:border-white/20 text-white'}`}
                      >
                        + ₹{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount input */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-dark-200 uppercase tracking-wider">Enter Custom Amount (₹)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    placeholder="e.g. 1500" 
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    className="w-full glass-input px-4 py-3 rounded-xl font-bold"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={depositLoading}
                  className="mt-2 w-full py-3 rounded-xl bg-orange-gradient font-bold text-white neon-glow-orange flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  {depositLoading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      Add Simulated Money
                    </>
                  )}
                </button>

              </form>
            </div>

            {/* Safety tag */}
            <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-center gap-2 text-dark-400 text-[10px] font-semibold text-center w-full">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span>Sandbox payments ledger secured by local JWT authorization keys.</span>
            </div>

          </div>

        </div>

      </div>

      {/* CHRONOLOGICAL TRANSACTION HISTORY LEDGER */}
      <div className="glass-panel p-6 rounded-3xl border-white/5 flex flex-col gap-5 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Full Transaction Audit Ledger</h3>
          <span className="text-xs text-dark-400 font-bold">{transactions.length} records</span>
        </div>
        
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map(i => (
              <SkeletonBlock key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-dark-400 text-xs flex flex-col items-center gap-3">
            <Wallet className="w-10 h-10 text-dark-600" />
            <p>No transaction records found. Try adding simulated funds above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 pb-2 text-dark-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">Transaction ID</th>
                  <th className="py-3 px-2">Reference</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Description</th>
                  <th className="py-3 px-2">Amount</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isDebit = tx.type === 'debit';
                  const isDeposit = tx.type === 'deposit';
                  const txAmount = safeNum(tx.amount);
                  
                  return (
                    <tr 
                      key={tx.id} 
                      className="border-b border-white/5 hover:bg-white/[0.015] transition-colors"
                    >
                      <td className="py-3 px-2 font-mono font-bold text-white text-[11px]">#TX-{String(tx.id).substring(0, 8)}</td>
                      <td className="py-3 px-2 font-mono text-dark-300 text-[11px]">
                        {tx.booking_id ? `#BK-${String(tx.booking_id).substring(0, 8)}` : 'Direct Topup'}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 w-fit ${isDebit ? 'bg-red-500/10 text-red-400' : isDeposit ? 'bg-indigo-500/10 text-indigo-400' : 'bg-green-500/10 text-green-400'}`}>
                          {isDebit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-dark-200 font-medium max-w-[180px] truncate">
                        {tx.description || (isDebit ? 'Service Payment' : isDeposit ? 'Wallet Topup' : 'Job Credit')}
                      </td>
                      <td className={`py-3 px-2 font-extrabold text-sm ${isDebit ? 'text-red-400' : 'text-green-400'}`}>
                        {isDebit ? '-' : '+'} ₹{txAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${tx.status === 'completed' || !tx.status ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                          {tx.status || 'completed'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-dark-400 text-[11px]">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString('en-IN', { 
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                        }) : 'N/A'}
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
  );
};

export default WalletPage;
