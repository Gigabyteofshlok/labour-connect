// MAIN ROUTING ARCHITECTURE
// Employs React Router v6. Restricts private pages to authorized users
// and loads a global unified glassmorphic Navbar and Footer.

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { 
  Wrench, Wallet, BookOpen, Landmark, User, Bell, LogOut, Menu, X, ShieldAlert 
} from 'lucide-react';

// Pages lazy-imports / mock routes (implemented below)
import LandingPage from './pages/LandingPage';
import LoginSignup from './pages/LoginSignup';
import CustomerDashboard from './pages/CustomerDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import ContractorDashboard from './pages/ContractorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BookingPage from './pages/BookingPage';
import WalletPage from './pages/WalletPage';
import GovSchemesPage from './pages/GovSchemesPage';
import FinancialLiteracyPage from './pages/FinancialLiteracyPage';
import AIAssistantWidget from './components/AIAssistantWidget';
import ErrorBoundary from './components/ErrorBoundary';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Automatic Dashboard Router Component
const DashboardRouter = () => {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'customer':
      return <CustomerDashboard />;
    case 'worker':
      return <WorkerDashboard />;
    case 'contractor':
      return <ContractorDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  const { isAuthenticated, user, logout, unreadCount, markNotificationsAsRead, notifications } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <ErrorBoundary>
      <Router>
      <div className="flex flex-col min-h-screen">
        
        {/* PREMIUM GLASSMORPHIC HEADER */}
        <header className="sticky top-0 z-50 bg-dark-950/80 backdrop-blur-md border-b border-white/5 py-4 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-brand-500 p-2 rounded-lg text-white neon-glow-orange group-hover:scale-105 transition-transform duration-300">
                <Wrench className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                LABOUR <span className="text-brand-500">CONNECT</span>
              </span>
            </Link>

            {/* Navigation links (Desktop) */}
            <nav className="hidden md:flex items-center gap-6">
              {isAuthenticated && (
                <>
                  <Link to="/dashboard" className="text-sm font-medium text-dark-200 hover:text-white transition-colors">Dashboard</Link>
                  <Link to="/wallet" className="text-sm font-medium text-dark-200 hover:text-white transition-colors flex items-center gap-1">
                    <Wallet className="w-4 h-4 text-brand-500" /> Wallet
                  </Link>
                </>
              )}
              <Link to="/schemes" className="text-sm font-medium text-dark-200 hover:text-white transition-colors flex items-center gap-1">
                <Landmark className="w-4 h-4 text-brand-500" /> Welfare Schemes
              </Link>
              <Link to="/literacy" className="text-sm font-medium text-dark-200 hover:text-white transition-colors flex items-center gap-1">
                <BookOpen className="w-4 h-4 text-brand-500" /> E-Learning
              </Link>
            </nav>

            {/* User Session Controller */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-4 relative">
                  
                  {/* Notifications alerts bell */}
                  <button 
                    onClick={() => {
                      setNotifDropdownOpen(!notifDropdownOpen);
                      markNotificationsAsRead();
                    }}
                    className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Bell className="w-5 h-5 text-dark-200 hover:text-white" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full pulse-active">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Panel */}
                  {notifDropdownOpen && (
                    <div className="absolute right-12 top-12 w-80 glass-panel rounded-xl p-3 text-sm z-50">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                        <span className="font-bold text-white">Alerts Inbox</span>
                        <button onClick={() => setNotifDropdownOpen(false)} className="text-xs text-brand-500 hover:underline">Close</button>
                      </div>
                      <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                        {notifications.length === 0 ? (
                          <div className="text-center py-4 text-dark-400">No new notifications.</div>
                        ) : (
                          notifications.slice(0, 5).map(n => (
                            <div key={n.id} className={`p-2 rounded-lg ${n.is_read ? 'bg-white/[0.02]' : 'bg-brand-500/10 border-l-2 border-brand-500'}`}>
                              <p className="font-bold text-white text-xs">{n.title}</p>
                              <p className="text-dark-300 text-[11px] mt-0.5">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Profile info tag */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                    <img 
                      src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                      alt="avatar" 
                      className="w-7 h-7 rounded-full object-cover border border-brand-500" 
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-white max-w-[80px] truncate">{user?.name}</span>
                      <span className="text-[10px] text-brand-500 capitalize">{user?.role}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="p-2 text-dark-300 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>

                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link 
                    to="/login" 
                    className="px-4 py-2 text-sm font-medium text-dark-100 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/login" 
                    className="px-4 py-2 text-sm font-bold text-white bg-orange-gradient rounded-lg neon-glow-orange hover:opacity-90 transition-opacity"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu trigger */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/5 rounded-lg text-dark-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </header>

        {/* MOBILE NAVIGATION OVERLAY */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-panel border-x-0 border-t-0 border-b border-white/5 flex flex-col p-4 gap-4 animate-fade-in z-40">
            {isAuthenticated && (
              <>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-white">Dashboard</Link>
                <Link to="/wallet" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-white flex items-center gap-2"><Wallet className="w-4 h-4" /> Wallet</Link>
              </>
            )}
            <Link to="/schemes" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-white flex items-center gap-2"><Landmark className="w-4 h-4" /> Welfare Schemes</Link>
            <Link to="/literacy" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-white flex items-center gap-2"><BookOpen className="w-4 h-4" /> E-Learning</Link>
            <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={user?.avatar_url} alt="avatar" className="w-9 h-9 rounded-full border border-brand-500 object-cover" />
                    <div>
                      <p className="text-sm font-bold text-white">{user?.name}</p>
                      <p className="text-xs text-brand-500 capitalize">{user?.role}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="p-2 bg-red-500/10 text-red-400 rounded-lg"><LogOut className="w-5 h-5" /></button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2.5 font-bold text-white bg-orange-gradient rounded-lg">Sign In / Register</Link>
              )}
            </div>
          </div>
        )}

        {/* MAIN BODY VIEW */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 animate-fade-in">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginSignup />} />
            <Route path="/register" element={<LoginSignup />} />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/booking" 
              element={
                <ProtectedRoute>
                  <BookingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/wallet" 
              element={
                <ProtectedRoute>
                  <WalletPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/schemes" 
              element={
                <ProtectedRoute>
                  <GovSchemesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/literacy" 
              element={
                <ProtectedRoute>
                  <FinancialLiteracyPage />
                </ProtectedRoute>
              } 
            />

            {/* Admin only route */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Fallback redirection */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* FLOATING BILINGUAL AI ADVISOR */}
        <AIAssistantWidget />

        {/* BRANDED FOOTER */}
        <footer className="bg-dark-950 border-t border-white/5 py-8 px-4 text-center mt-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-dark-400">
              © 2026 Labour Connect. Built with pride as a production-grade workforce ecosystem.
            </p>
            <div className="flex gap-4 text-xs text-dark-300">
              <Link to="/schemes" className="hover:text-brand-500">Multilingual Scheme Portal</Link>
              <span>•</span>
              <Link to="/literacy" className="hover:text-brand-500">UPI Fraud Safety Hub</Link>
            </div>
          </div>
        </footer>

      </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
