import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, ShieldCheck, Users, Landmark, Flame, Compass, ArrowRight, Star,
  Smartphone, ShieldAlert, BadgeInfo, CheckCircle, ChevronDown, ChevronUp, Globe, Sparkles
} from 'lucide-react';

const SERVICES = [
  { name: 'Plumber', desc: 'Pipe leak repairs, bathroom fittings, standard fixtures.', icon: '🚰', category: 'Skilled' },
  { name: 'Electrician', desc: 'Switchboards, fuse board wiring, short circuits.', icon: '⚡', category: 'Skilled' },
  { name: 'Carpenter', desc: 'Wood repair, furniture assembly, hinges.', icon: '🪚', category: 'Skilled' },
  { name: 'Mason', desc: 'Brickwork, concrete pouring, plaster repairs.', icon: '🧱', category: 'Civil' },
  { name: 'AC Repair', desc: 'Split installations, gas refilling, deep cleaning.', icon: '❄️', category: 'Technician' },
  { name: 'Cleaner', desc: 'Disinfection, home sanitizing, water tank cleanup.', icon: '🧹', category: 'Unskilled' },
  { name: 'Driver', desc: 'Valet drivers, heavy vehicle loaders, taxi runs.', icon: '🚗', category: 'Logistics' },
  { name: 'Labour Helper', desc: 'Loading & unloading, sand shifts, clearing debris.', icon: '💪', category: 'Unskilled' },
  { name: 'Construction Worker', desc: 'Scaffolding, brick lifts, basic civil helper.', icon: '🏗️', category: 'Civil' },
  { name: 'Welding Worker', desc: 'Iron gates, fabrication work, lock welds.', icon: '🔥', category: 'Technician' }
];

const LOCALIZED_CONTENT = {
  en: {
    welfareTitle: "Welfare & Financial Empowerment",
    welfareSubtitle: "Bridge the gap with direct government schemes, accidental insurances, and digital safety training.",
    card1Title: "e-Shram Registration",
    card1Desc: "Access to ₹2 Lakh accident coverage, direct financial aid during crises, and integrated old-age pension schemes.",
    card2Title: "Ayushman Bharat (PM-JAY)",
    card2Desc: "Cashless secondary & tertiary hospital treatment up to ₹5 Lakh/year for your entire family.",
    card3Title: "UPI Fraud Protection",
    card3Desc: "Learn key safety procedures: Never enter your UPI PIN or scan QR codes to receive payments from anyone.",
    badge: "Welfare Portal"
  },
  hi: {
    welfareTitle: "कल्याण एवं वित्तीय सशक्तिकरण",
    welfareSubtitle: "सीधे सरकारी योजनाओं, दुर्घटना बीमा और डिजिटल साक्षरता के साथ अंतर को पाटें।",
    card1Title: "ई-श्रम पंजीकरण",
    card1Desc: "₹2 लाख का दुर्घटना बीमा, संकट के समय सीधी वित्तीय सहायता, और एकीकृत वृद्धावस्था पेंशन योजना का लाभ उठाएं।",
    card2Title: "आयुष्मान भारत (PM-JAY)",
    card2Desc: "आपके पूरे परिवार के लिए प्रति वर्ष ₹5 लाख तक का कैशलेस माध्यमिक और तृतीयक अस्पताल उपचार।",
    card3Title: "UPI धोखाधड़ी से सुरक्षा",
    card3Desc: "महत्वपूर्ण सुरक्षा नियम: किसी से भी भुगतान प्राप्त करने के लिए कभी भी अपना UPI पिन दर्ज न करें और न ही QR कोड स्कैन करें।",
    badge: "कल्याण पोर्टल"
  },
  mr: {
    welfareTitle: "कल्याण आणि आर्थिक सक्षमीकरण",
    welfareSubtitle: "थेट सरकारी योजना, अपघात विमा आणि डिजिटल साक्षरतेसह प्रगतीची दरी सांधा.",
    card1Title: "ई-श्रम नोंदणी",
    card1Desc: "₹२ लाखांचे अपघात विमा कवच, संकटकाळात थेट आर्थिक मदत आणि वृद्धापकाळ पेन्शन योजनांचा थेट लाभ घ्या.",
    card2Title: "आयुष्मान भारत (PM-JAY)",
    card2Desc: "तुमच्या संपूर्ण कुटुंबासाठी दरवर्षी ₹५ लाखांपर्यंतचे मोफत आणि कॅशलेस वैद्यकीय उपचार.",
    card3Title: "UPI फसवणुकीपासून संरक्षण",
    card3Desc: "महत्त्वाचे नियम: कोणाकडूनही पैसे मिळवण्यासाठी कधीही तुमचा UPI पिन टाकू नका किंवा QR कोड स्कॅन करू नका.",
    badge: "कल्याण पोर्टल"
  }
};

const FAQ_ITEMS = [
  {
    q: "How does the direct radial booking system work?",
    a: "Our advanced spatial search indexes workers in active grids. When a customer makes a request, nearby workers' mobile clients receive real-time notifications with audio sirens, enabling instant dispatch and precise GPS tracking."
  },
  {
    q: "What are cooperative labour groups?",
    a: "Workers can link their profiles to form cooperative groups under a designated group leader. When contractors book the group for major civil projects, booking revenues are split equally and deposited directly into cooperative members' wallets."
  },
  {
    q: "How are secure wallet payments processed?",
    a: "Every user gets a secure simulated digital wallet. Customers pre-fund their wallets via simulated UPI handshakes. Once the job OTP is verified and the worker completes the task, funds transfer instantly with zero commission leakages."
  },
  {
    q: "Is registration free for both customers and workers?",
    a: "Yes, Labour Connect is entirely free to join. We aim to protect unorganized daily earners from middlemen fees, while offering builders and families a transparent, verified, and reliable workforce directory."
  }
];

const LandingPage = () => {
  const [lang, setLang] = useState('en');
  const [activeFaq, setActiveFaq] = useState(null);
  
  // Real-time telemetry rolling stats simulation
  const [onlineCount, setOnlineCount] = useState(142);
  const [jobsCompleted, setJobsCompleted] = useState(12840);
  const [activeUnions, setActiveUnions] = useState(48);

  useEffect(() => {
    const statInterval = setInterval(() => {
      // Simulate workers clocking in/out or completing tasks live
      setOnlineCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
      setJobsCompleted(prev => prev + (Math.random() > 0.6 ? 1 : 0));
      if (Math.random() > 0.95) {
        setActiveUnions(prev => prev + 1);
      }
    }, 4000);

    return () => clearInterval(statInterval);
  }, []);

  const t = LOCALIZED_CONTENT[lang];

  return (
    <div className="w-full flex flex-col gap-20 py-8 relative overflow-hidden">
      
      {/* Dynamic custom keyframe styles */}
      <style>{`
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ping-glow {
          0% { transform: scale(0.85); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0.9; }
          100% { transform: scale(0.85); opacity: 0.4; }
        }
        .radar-sweep-line {
          transform-origin: 150px 150px;
          animation: radar-sweep 5s linear infinite;
        }
        .worker-ping {
          animation: ping-glow 2.5s infinite ease-in-out;
        }
        .neon-glow-orange {
          box-shadow: 0 0 20px rgba(235, 121, 26, 0.45);
        }
        .neon-glow-green {
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
        }
        .glass-card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card-hover:hover {
          border-color: rgba(235, 121, 26, 0.3);
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-4px);
        }
      `}</style>

      {/* HERO SECTION */}
      <section className="relative w-full flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* Vibrant color backdrops */}
        <div className="absolute top-[-50px] left-[-50px] w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] -z-20 pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] -z-20 pointer-events-none" />

        {/* Hero Left Content */}
        <div className="flex flex-col text-left gap-6 lg:max-w-2xl">
          
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-semibold w-fit shadow-md shadow-brand-500/5"
          >
            <Flame className="w-3.5 h-3.5 fill-current text-orange-500 animate-pulse" /> 
            <span>FAST • HYBRID REAL-TIME ENGINE</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08] lg:text-left"
          >
            Empowering India's <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-orange-500 to-brand-600">
              Workforce Ecosystem
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-dark-300 leading-relaxed max-w-xl"
          >
            A high-fidelity digital workforce platform similar to Uber, Rapido, and Urban Company. Instantly hire verified skilled/unskilled workers or dispatch complete cooperative labour squads with secure wallet-driven payments.
          </motion.p>

          {/* Core Interactive Action Links */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 mt-2"
          >
            <Link 
              to="/login" 
              className="px-6 py-4 rounded-xl font-extrabold text-white bg-orange-gradient hover:opacity-95 active:scale-95 transition-all duration-200 flex items-center gap-2 neon-glow-orange text-sm sm:text-base"
            >
              Get Started Now <ArrowRight className="w-5 h-5 text-white" />
            </Link>
            
            <Link 
              to="/schemes" 
              className="px-6 py-4 rounded-xl font-bold text-white bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 active:scale-95 transition-all duration-200 text-sm sm:text-base"
            >
              Welfare Eligibility
            </Link>
          </motion.div>

          {/* Quick rolling numbers banner */}
          <div className="grid grid-cols-3 gap-6 border-t border-white/5 pt-8 mt-6 text-left max-w-md">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">4.9★</p>
              <p className="text-xs text-dark-400 mt-1">Average Rating</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-brand-400 tracking-tight transition-all duration-300">
                {jobsCompleted.toLocaleString()}
              </p>
              <p className="text-xs text-dark-400 mt-1">Bookings Filled</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {activeUnions}+
              </p>
              <p className="text-xs text-dark-400 mt-1">Cooperative Teams</p>
            </div>
          </div>

        </div>

        {/* Hero Right - HIGH FIDELITY ACTIVE RADAL SCAN PANEL */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative lg:max-w-md w-full glass-panel rounded-3xl p-6 border-white/10 flex flex-col gap-6 shadow-2xl shadow-black/60"
        >
          
          {/* Pulsing online status telemetry header */}
          <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 pulse-active neon-glow-green" />
              <p className="text-xs font-bold text-white">
                <span className="text-emerald-400 font-extrabold">{onlineCount}</span> Active Workers Nearby
              </p>
            </div>
            <span className="text-[10px] bg-brand-500/20 text-brand-400 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Live Pune GPS
            </span>
          </div>

          {/* ACTIVE RADAL SCAN CANVAS */}
          <div className="relative w-full aspect-square bg-[#0f0f18] rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center">
            
            {/* Concentric circular grid lines */}
            <div className="absolute w-[85%] aspect-square border border-white/[0.03] rounded-full" />
            <div className="absolute w-[60%] aspect-square border border-white/[0.04] rounded-full" />
            <div className="absolute w-[35%] aspect-square border border-white/[0.05] rounded-full" />
            
            {/* Crosshair grid lines */}
            <div className="absolute w-full h-[1px] bg-white/[0.03]" />
            <div className="absolute h-full w-[1px] bg-white/[0.03]" />

            {/* Radar scanner sweep */}
            <svg className="absolute w-full h-full inset-0 pointer-events-none" viewBox="0 0 300 300">
              <defs>
                <linearGradient id="radarSweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#eb791a" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#eb791a" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#eb791a" stopOpacity="0" />
                </linearGradient>
              </defs>
              <g className="radar-sweep-line">
                <path d="M150,150 L150,0 A150,150 0 0,1 256,44 Z" fill="url(#radarSweepGrad)" />
                <line x1="150" y1="150" x2="150" y2="0" stroke="#eb791a" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            </svg>

            {/* Center beacon pin */}
            <div className="absolute w-4 h-4 bg-brand-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg shadow-brand-500/50 z-20">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>

            {/* Live blinks of simulated nearby workers */}
            <div className="absolute top-[32%] left-[28%] z-10 flex flex-col items-center group cursor-pointer">
              <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white worker-ping neon-glow-green" />
              <div className="absolute bottom-5 bg-dark-950/90 text-[10px] font-bold text-white px-2 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Ramesh (Plumber) • 250m
              </div>
            </div>

            <div className="absolute top-[24%] right-[25%] z-10 flex flex-col items-center group cursor-pointer">
              <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white worker-ping neon-glow-green" />
              <div className="absolute bottom-5 bg-dark-950/90 text-[10px] font-bold text-white px-2 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Amit (Electrician) • 310m
              </div>
            </div>

            <div className="absolute bottom-[30%] right-[32%] z-10 flex flex-col items-center group cursor-pointer">
              <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white worker-ping neon-glow-green" />
              <div className="absolute bottom-5 bg-dark-950/90 text-[10px] font-bold text-white px-2 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Sanjay (Mason) • 420m
              </div>
            </div>

            <div className="absolute bottom-[20%] left-[20%] z-10 flex flex-col items-center group cursor-pointer">
              <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white worker-ping neon-glow-green" />
              <div className="absolute bottom-5 bg-dark-950/90 text-[10px] font-bold text-white px-2 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Anil (AC Repair) • 580m
              </div>
            </div>

            {/* Sweep sweeping simulation info label */}
            <span className="absolute bottom-3 right-3 text-[10px] font-mono text-dark-400 bg-black/60 px-2 py-1 rounded border border-white/5">
              RADAR GAIN: 85%
            </span>
          </div>

          <div className="text-left">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-500 animate-spin" /> High Precision Booking System
            </h4>
            <p className="text-xs text-dark-300 mt-1">
              Interactive map links clients and workers with synthesis alarms, location-throttled routing, and OTP security guards.
            </p>
          </div>

        </motion.div>

      </section>

      {/* CORE FEATURES EXPLANATION */}
      <section className="w-full flex flex-col gap-12 text-center mt-6">
        
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Comprehensive Digital Ecosystem
          </h2>
          <p className="text-dark-300 max-w-xl mx-auto text-sm sm:text-base">
            Solving real infrastructure challenges of the Indian unorganized labour sector through robust PWA structures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center gap-4 text-center border-white/5 glass-card-hover">
            <div className="bg-brand-500/10 p-4 rounded-2xl text-brand-400 border border-brand-500/20 shadow-md">
              <Zap className="w-7 h-7 text-brand-500" />
            </div>
            <h3 className="font-extrabold text-white text-lg tracking-tight">Instant Radial Dispatch</h3>
            <p className="text-dark-300 text-sm leading-relaxed">
              Find and dispatch nearby workers using actual coordinates. Worker phones trigger loud synthesized alarms bypassing media network delays.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center gap-4 text-center border-white/5 glass-card-hover">
            <div className="bg-emerald-500/10 p-4 rounded-2xl text-emerald-400 border border-emerald-500/20 shadow-md">
              <Users className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="font-extrabold text-white text-lg tracking-tight">Labour Unions & Teams</h3>
            <p className="text-dark-300 text-sm leading-relaxed">
              Workers can assemble cooperative unions (plumbers, masons, builders). Builders hire entire teams in a single transaction with equal payout splits.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center gap-4 text-center border-white/5 glass-card-hover">
            <div className="bg-orange-500/10 p-4 rounded-2xl text-orange-400 border border-orange-500/20 shadow-md">
              <Landmark className="w-7 h-7 text-orange-400" />
            </div>
            <h3 className="font-extrabold text-white text-lg tracking-tight">Welfare & Literacy Hub</h3>
            <p className="text-dark-300 text-sm leading-relaxed">
              Equipped with a multilingual checker for welfare schemes (e-Shram, PM-JAY, PM-SYM) and interactive digital literacy modules on UPI fraud safety.
            </p>
          </div>

        </div>
      </section>

      {/* COOPERATIVES DEMONSTRATION SECTION */}
      <section className="w-full flex flex-col lg:flex-row items-center justify-between gap-12 bg-white/[0.01] border border-white/5 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col text-left gap-4 lg:max-w-xl">
          <span className="text-xs font-extrabold tracking-widest text-brand-500 uppercase">Cooperative Power</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Empower Co-Op Labour Teams
          </h2>
          <p className="text-dark-300 text-sm sm:text-base leading-relaxed">
            Unorganized workers face issues bidding for major projects. On Labour Connect, masons, painters, and helpers can form a <strong>Labour Cooperative Group</strong>. 
          </p>
          <p className="text-dark-300 text-sm sm:text-base leading-relaxed">
            Contractors or private builders hire the complete team in one click. Payment is held in secure project escrow and split equally into members' digital wallets upon completion.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-white">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Automated Escrow Splits
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-white">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Peer Attendance Tracking
            </div>
          </div>
        </div>

        {/* Visual Showcase Box representing a Group card */}
        <div className="w-full lg:max-w-md glass-panel p-6 rounded-2xl border-white/10 text-left">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded font-extrabold uppercase">Active Union</span>
              <h3 className="font-extrabold text-white text-lg mt-1.5">Shivaji Construction Team</h3>
              <p className="text-xs text-dark-300">Cooperative ID: g1111111-1111...</p>
            </div>
            <div className="flex items-center gap-1 text-sm font-extrabold text-brand-400">
              <Star className="w-4 h-4 fill-current text-brand-500" /> 4.80
            </div>
          </div>

          <p className="text-xs text-dark-200 leading-relaxed mb-4 border-b border-white/5 pb-4">
            Premier team of 3 skilled masons and construction helpers for civil and contract works. Equipped with concrete tools.
          </p>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Squad Members</span>
            <div className="flex items-center justify-between p-2 bg-dark-900 rounded-lg border border-white/5">
              <div className="flex items-center gap-2">
                <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80" alt="Sanjay" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                <div>
                  <h4 className="text-xs font-bold text-white">Sanjay Yadav</h4>
                  <p className="text-[9px] text-brand-500">Group Leader • Mason</p>
                </div>
              </div>
              <span className="text-[10px] bg-brand-500/15 text-brand-400 px-2 py-0.5 rounded font-bold">₹180/hr</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-dark-900 rounded-lg border border-white/5">
              <div className="flex items-center gap-2">
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80" alt="Ramesh" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                <div>
                  <h4 className="text-xs font-bold text-white">Ramesh Prasad</h4>
                  <p className="text-[9px] text-dark-400">Cooperative Partner • Plumber</p>
                </div>
              </div>
              <span className="text-[10px] bg-brand-500/15 text-brand-400 px-2 py-0.5 rounded font-bold">₹250/hr</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATEFUL MULTILINGUAL WELFARE BENEFITS SECTION */}
      <section className="w-full flex flex-col gap-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="text-left">
            <div className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 animate-pulse" /> {t.badge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t.welfareTitle}
            </h2>
            <p className="text-dark-300 max-w-xl mt-2 text-sm sm:text-base leading-relaxed">
              {t.welfareSubtitle}
            </p>
          </div>

          {/* Bilingual / Trilingual language selection buttons */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shadow-lg shadow-black/40">
            {[
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिन्दी' },
              { code: 'mr', label: 'मराठी' }
            ].map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${lang === l.code ? 'bg-orange-gradient text-white shadow-md' : 'text-dark-300 hover:text-white'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Welfare and Literacy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          <div className="glass-panel p-6 rounded-2xl border-white/5 flex flex-col justify-between gap-4 glass-card-hover relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col gap-3">
              <span className="text-[10px] bg-brand-500/20 text-brand-400 font-extrabold px-2.5 py-1 rounded-md w-fit uppercase tracking-wider">Government Scheme</span>
              <h3 className="font-extrabold text-white text-lg">{t.card1Title}</h3>
              <p className="text-xs sm:text-sm text-dark-300 leading-relaxed">{t.card1Desc}</p>
            </div>
            <Link to="/schemes" className="text-xs font-bold text-brand-400 hover:text-brand-500 flex items-center gap-1 group mt-2">
              Apply via Direct Portal <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-white/5 flex flex-col justify-between gap-4 glass-card-hover relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col gap-3">
              <span className="text-[10px] bg-brand-500/20 text-brand-400 font-extrabold px-2.5 py-1 rounded-md w-fit uppercase tracking-wider">Health Security</span>
              <h3 className="font-extrabold text-white text-lg">{t.card2Title}</h3>
              <p className="text-xs sm:text-sm text-dark-300 leading-relaxed">{t.card2Desc}</p>
            </div>
            <Link to="/schemes" className="text-xs font-bold text-brand-400 hover:text-brand-500 flex items-center gap-1 group mt-2">
              Check Family Eligibility <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-white/5 flex flex-col justify-between gap-4 glass-card-hover relative overflow-hidden bg-brand-500/[0.02]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col gap-3">
              <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/20 font-extrabold px-2.5 py-1 rounded-md w-fit uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-red-500 animate-bounce" /> Safety Critical
              </span>
              <h3 className="font-extrabold text-white text-lg">{t.card3Title}</h3>
              <p className="text-xs sm:text-sm text-dark-300 leading-relaxed">{t.card3Desc}</p>
            </div>
            <Link to="/literacy" className="text-xs font-bold text-brand-400 hover:text-brand-500 flex items-center gap-1 group mt-2">
              Start Safety Training <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </section>

      {/* SERVICE LISTINGS GRID */}
      <section className="w-full flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="text-left">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Discover On-Demand Professions</h2>
            <p className="text-dark-300 text-sm">Top verified local experts ready for instant callout bookings.</p>
          </div>
          <Link to="/login" className="text-brand-500 font-bold text-sm flex items-center gap-1 hover:underline">
            View All Services <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {SERVICES.map((s, idx) => (
            <div 
              key={idx} 
              className="glass-panel p-5 rounded-xl flex flex-col text-left gap-3 border-white/5 hover:border-brand-500/25 group hover:scale-[1.02] transition-all duration-300"
            >
              <div className="text-3xl group-hover:scale-110 transition-transform duration-300">{s.icon}</div>
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">{s.category}</span>
                <h4 className="font-extrabold text-white text-base mt-2">{s.name}</h4>
                <p className="text-xs text-dark-300 mt-1 line-clamp-2 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DYNAMIC FAQ ACCORDION SECTION */}
      <section className="w-full flex flex-col gap-10 max-w-4xl mx-auto">
        
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h2>
          <p className="text-dark-300 text-sm sm:text-base mt-2">
            Have questions about Labour Connect? Learn how the mechanics operate.
          </p>
        </div>

        <div className="flex flex-col gap-4 text-left">
          {FAQ_ITEMS.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className="glass-panel rounded-xl border border-white/5 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-white hover:bg-white/[0.02] transition-colors text-left"
                >
                  <span className="font-extrabold text-sm sm:text-base">{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-brand-500" /> : <ChevronDown className="w-5 h-5 text-dark-400" />}
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-dark-300 leading-relaxed border-t border-white/5">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ARCHITECTS OF LABOUR CONNECT */}
      <section className="w-full flex flex-col gap-12 text-center mt-4">
        
        <div className="flex flex-col gap-3">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold w-fit tracking-wider uppercase"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-500 fill-current animate-pulse" />
            <span>The Engineering Team</span>
          </motion.div>
          
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Meet the Architects of <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-orange-500 to-brand-600">
              Labour Connect
            </span>
          </h2>
          <p className="text-dark-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            The visionary full-stack engineering cohort behind Pune's leading real-time digital daily-wage booking engine, secure digital wallets, and welfare systems.
          </p>
        </div>

        {/* Premium Grid: Centered wrapping grid */}
        <div className="flex flex-wrap justify-center gap-8 mt-6 max-w-6xl mx-auto w-full px-4">
          {[
            {
              name: "SHLOK SANTOSH KULKARNI",
              role: "System Architect & Realtime Lead",
              linkedin: "https://www.linkedin.com/in/shlokkulkarniai/",
              initials: "SK",
              gradient: "from-orange-500/20 to-amber-600/20 text-orange-400 border-orange-500/30",
              initialsGrad: "from-orange-500 to-amber-600",
              desc: "Lead Architect of real-time engines, Socket.io channels, core state machines, secure digital wallets, atomic ledgers, production server deployments, and overall system integration."
            },
            {
              name: "YASH SANTOSH MANE",
              role: "Fullstack & Realtime Support",
              linkedin: "https://www.linkedin.com/in/yash-mane-100ym/",
              initials: "YM",
              gradient: "from-emerald-500/20 to-teal-600/20 text-emerald-400 border-emerald-500/30",
              initialsGrad: "from-emerald-500 to-teal-600",
              desc: "Polished customer & worker interactive dashboards, styled the real-time en-route visual notifications, built dynamic progress indicators, and resolved client-side responsive grids."
            },
            {
              name: "PARTH GANESH PARDESHI",
              role: "Database & Security Engineer",
              linkedin: "https://www.linkedin.com/in/parth-asg-pardeshi?utm_source=share_via&utm_content=profile&utm_medium=member_android",
              initials: "PP",
              gradient: "from-blue-500/20 to-indigo-600/20 text-blue-400 border-blue-500/30",
              initialsGrad: "from-blue-500 to-indigo-600",
              desc: "Managed Supabase storage instances, optimized PostgreSQL database queries, checked row security authentication limits, and constructed complete relational database ER models."
            },
            {
              name: "SIDDHANT KIRAN KUMBHAR",
              role: "UI/UX & PPT Designer",
              linkedin: "https://www.linkedin.com/in/siddhant-kumbhar77?utm_source=share_via&utm_content=profile&utm_medium=member_android",
              initials: "SK",
              gradient: "from-purple-500/20 to-pink-600/20 text-purple-400 border-purple-500/30",
              initialsGrad: "from-purple-500 to-pink-600",
              desc: "Designed landing page visuals, loaded clean skeletal indicators, optimized overall glassmorphism CSS, and crafted the high-end project presentation slide blueprints."
            },
            {
              name: "ATHRAVA RAMESH NAVALE",
              role: "Research + QA + Documentation",
              linkedin: "https://www.linkedin.com/in/atharva-navale-9ab807346?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
              initials: "AN",
              gradient: "from-cyan-500/20 to-blue-600/20 text-cyan-400 border-cyan-500/30",
              initialsGrad: "from-cyan-500 to-blue-600",
              desc: "Composed the research paper study, indexed academic citations, compiled user flow diagnostics, logged system errors, and recorded comprehensive lifecycle video demonstrations."
            }
          ].map((dev, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1.5rem)] xl:w-[350px] glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between gap-5 relative overflow-hidden group hover:border-brand-500/25 hover:scale-[1.02] hover:bg-white/[0.03] transition-all duration-300 shadow-xl"
            >
              {/* Top ambient colored background glow */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${dev.initialsGrad} opacity-[0.03] blur-xl rounded-full group-hover:scale-150 transition-transform duration-500`} />

              <div className="flex flex-col gap-4 text-left">
                
                {/* Header card with initial badge and linkedin button */}
                <div className="flex justify-between items-center">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${dev.initialsGrad} flex items-center justify-center text-white text-base font-black shadow-lg shadow-black/30`}>
                    {dev.initials}
                  </div>
                  
                  <a 
                    href={dev.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-[#0077b5] text-dark-300 hover:text-white border border-white/5 transition-all duration-300 shadow-md group/link"
                    title="Connect on LinkedIn"
                  >
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover/link:scale-115" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                </div>

                {/* Name & Role */}
                <div>
                  <h3 className="font-extrabold text-white text-base tracking-tight group-hover:text-brand-400 transition-colors duration-300 font-sans">
                    {dev.name}
                  </h3>
                  
                  <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${dev.gradient} mt-1.5`}>
                    {dev.role}
                  </span>
                </div>

                {/* Role Description */}
                <p className="text-xs text-dark-300 leading-relaxed min-h-[96px]">
                  {dev.desc}
                </p>

              </div>

              {/* Action Link to LinkedIn */}
              <div className="border-t border-white/5 pt-4 text-left">
                <a 
                  href={dev.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors group/btn"
                >
                  View Profile <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </a>
              </div>

            </motion.div>
          ))}
        </div>
      </section>

      {/* CLOSING CALL TO ACTION */}
      <section className="w-full relative glass-panel rounded-3xl p-8 sm:p-12 border-white/10 text-center flex flex-col items-center gap-6 shadow-2xl shadow-black/80 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center justify-center p-3 bg-brand-500/15 rounded-full text-brand-500 border border-brand-500/35 mb-2 shadow-lg animate-bounce">
          <Sparkles className="w-6 h-6" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Join the Future of Digital Workforce matching
        </h2>
        <p className="text-dark-300 max-w-xl text-sm sm:text-base leading-relaxed">
          Whether you are a customer looking for home support, a builder looking for daily helper cooperative unions, or a worker seeking commission-free direct bookings, register today!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2 w-full sm:w-auto">
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 font-extrabold text-sm text-white bg-orange-gradient hover:opacity-95 active:scale-95 rounded-xl transition-all duration-200 neon-glow-orange flex items-center justify-center gap-2"
          >
            Create Your Profile
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 font-bold text-sm text-white bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            Sign In to Dashboard
          </Link>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
