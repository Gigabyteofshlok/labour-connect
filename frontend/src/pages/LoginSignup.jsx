// LOGIN & SIGNUP PANEL
// Renders secure registration and login components. Features role-specific forms
// (conditional inputs for Workers, Masons, and Contractors) and manages state routing.

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { 
  User, Mail, Lock, Phone, Wrench, Landmark, Briefcase, Sparkles, PlusCircle, AlertCircle
} from 'lucide-react';

const LoginSignup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { login, register, isAuthenticated, error, clearError, loading } = useAuthStore();

  const [isLogin, setIsLogin] = useState(true);
  
  // Basic Form parameters
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer'); // customer, worker, contractor
  const [avatarUrl, setAvatarUrl] = useState('');

  // Role conditional parameters
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  
  const AVAILABLE_SKILLS = [
    'Plumber', 'Electrician', 'Carpenter', 'Painter', 'Mason', 
    'AC Repair', 'Cleaner', 'Driver', 'Labour Helper', 'Construction Worker', 'Welding Worker'
  ];

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    clearError();
  }, [isAuthenticated, navigate]);

  const handleToggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAuthAction = async (e) => {
    e.preventDefault();
    clearError();

    try {
      if (isLogin) {
        await login(email, password);
        navigate('/dashboard');
      } else {
        const payload = {
          email,
          password,
          role,
          name,
          phone,
          avatar_url: avatarUrl || `https://images.unsplash.com/photo-${role === 'worker' ? '1507003211169-0a1dd7228f2d' : '1534528741775-53994a69daeb'}?w=150`,
          bio,
          address,
          company_name: companyName,
          experience_years: parseInt(experienceYears || 0),
          hourly_rate: parseFloat(hourlyRate || 0),
          skills: selectedSkills
        };
        await register(payload);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Authentication process failed:', err.message);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto py-12 flex flex-col justify-center gap-6">
      
      {/* Visual Form Panel Header */}
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold text-white">
          {isLogin ? 'Welcome Back!' : 'Join Labour Connect'}
        </h2>
        <p className="text-dark-300 text-sm">
          {isLogin ? 'Find nearby workers or log into your earnings portal.' : 'Create your secure workforce profile in 60 seconds.'}
        </p>
      </div>

      {/* CORE AUTH CONTAINER CARD */}
      <div className="glass-panel p-8 rounded-3xl border-white/10 flex flex-col gap-6 relative">
        
        {/* Toggle between Login & Register */}
        <div className="flex bg-dark-900 rounded-xl p-1 border border-white/5">
          <button 
            onClick={() => { setIsLogin(true); clearError(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${isLogin ? 'bg-brand-500 text-white shadow-glass-subtle' : 'text-dark-300 hover:text-white'}`}
          >
            Sign In
          </button>
          <button 
            onClick={() => { setIsLogin(false); clearError(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${!isLogin ? 'bg-brand-500 text-white shadow-glass-subtle' : 'text-dark-300 hover:text-white'}`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleAuthAction} className="flex flex-col gap-4 text-left">
          
          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-dark-200 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-dark-400" />
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-dark-200 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-dark-400" />
              <input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* ADDITIONAL FIELDS FOR REGISTRATION */}
          {!isLogin && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-col gap-4 overflow-hidden"
            >
              <div className="border-t border-white/5 my-2" />

              {/* Full name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dark-200 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-dark-400" />
                  <input 
                    type="text" 
                    required={!isLogin}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Rahul Verma"
                    className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Phone number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dark-200 uppercase tracking-wider">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-dark-400" />
                  <input 
                    type="tel" 
                    required={!isLogin}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+919999999901"
                    className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Avatar Image url */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dark-200 uppercase tracking-wider">Profile Photo URL (Optional)</label>
                <input 
                  type="text" 
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or leave blank"
                  className="w-full glass-input px-4 py-2.5 rounded-xl text-sm"
                />
              </div>

              {/* USER TYPE SELECTION */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dark-200 uppercase tracking-wider">I want to join as a:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'customer', label: 'Customer', icon: '🏠' },
                    { val: 'worker', label: 'Worker', icon: '🛠️' },
                    { val: 'contractor', label: 'Contractor', icon: '🏗️' }
                  ].map((rObj) => (
                    <button
                      key={rObj.val}
                      type="button"
                      onClick={() => setRole(rObj.val)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${role === rObj.val ? 'bg-brand-500/20 border-brand-500 text-brand-400' : 'bg-transparent border-white/10 text-dark-300 hover:border-white/20'}`}
                    >
                      <span className="text-lg">{rObj.icon}</span>
                      {rObj.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CONDITIONAL SUB-FORMS */}
              {role === 'customer' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-dark-200 uppercase tracking-wider">Home/Billing Address</label>
                    <textarea 
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Flat 402, Green Glen Layout, Pune, MH"
                      rows={2}
                      className="w-full glass-input px-4 py-2 rounded-xl text-sm resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-dark-200 uppercase tracking-wider">Tell us about your requirements</label>
                    <input 
                      type="text" 
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="e.g. apartment owner looking for plumbers..."
                      className="w-full glass-input px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}

              {role === 'contractor' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dark-200 uppercase tracking-wider">Company / Construction Agency Name</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-dark-400" />
                    <input 
                      type="text" 
                      required={role === 'contractor'}
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="Shivam Civil Contractors Ltd."
                      className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}

              {role === 'worker' && (
                <div className="flex flex-col gap-4">
                  
                  {/* Experience */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-dark-200 uppercase tracking-wider">Experience (Years)</label>
                      <input 
                        type="number" 
                        required={role === 'worker'}
                        value={experienceYears}
                        onChange={e => setExperienceYears(e.target.value)}
                        placeholder="5"
                        min="0"
                        className="w-full glass-input px-4 py-2.5 rounded-xl text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-dark-200 uppercase tracking-wider">Service Charge (₹/hr)</label>
                      <input 
                        type="number" 
                        required={role === 'worker'}
                        value={hourlyRate}
                        onChange={e => setHourlyRate(e.target.value)}
                        placeholder="250"
                        min="0"
                        className="w-full glass-input px-4 py-2.5 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-dark-200 uppercase tracking-wider">Select Skills (Cooperative Bookings)</label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_SKILLS.map((sk) => (
                        <button
                          key={sk}
                          type="button"
                          onClick={() => handleToggleSkill(sk)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${selectedSkills.includes(sk) ? 'bg-brand-500 border-brand-500 text-white' : 'bg-transparent border-white/10 text-dark-300 hover:border-white/20'}`}
                        >
                          {sk}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-dark-200 uppercase tracking-wider">Worker Short Description</label>
                    <textarea 
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Brief details about your skill specialty, tools owned..."
                      rows={2}
                      className="w-full glass-input px-4 py-2 rounded-xl text-sm resize-none"
                    />
                  </div>

                </div>
              )}

            </motion.div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl font-extrabold text-white bg-orange-gradient neon-glow-orange hover:opacity-95 transition-opacity flex items-center justify-center gap-2 text-sm shadow-glass"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In Securely' : 'Complete Registration'} <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

      </div>

    </div>
  );
};

export default LoginSignup;
