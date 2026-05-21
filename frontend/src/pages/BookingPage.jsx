// LIVE SERVICE TRACKING & CHAT PANEL
// Incorporates live status flow checkers, simulated GPS routing maps,
// OTP verification forms, and real-time polling chat interfaces.

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { 
  MapPin, Clock, ShieldCheck, CheckCircle2, MessageSquare, Send, Phone, User, Play, AlertTriangle, ArrowLeft, Navigation, Star, Camera, Upload
} from 'lucide-react';

const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, fetchWallet, socket } = useAuthStore();
  
  // Try to load booking passed from state, otherwise fall back to scanning history
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [chatMessages, setChatMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [mapState, setMapState] = useState('driving'); // driving, arrived, working, completed
  const [liveEta, setLiveEta] = useState(null);
  const [liveCoords, setLiveCoords] = useState(location.state?.booking ? { latitude: location.state.booking.latitude, longitude: location.state.booking.longitude } : null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [bookingPhotos, setBookingPhotos] = useState([]);  // before/after proof photos
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  
  const getAssetUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) return imagePath;
    const baseUrl = window.location.port === '3000' || window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
    return `${baseUrl}${imagePath}`;
  };
  
  const chatBottomRef = useRef(null);

  // Poll intervals
  useEffect(() => {
    if (!booking) {
      // If no booking was passed in router state, fetch the latest user bookings
      fetchLatestBooking();
    }
  }, []);

  useEffect(() => {
    if (booking) {
      fetchChatTranscript();
      fetchBookingPhotos();
      // Setup polling every 4.5 seconds for fallback chat sync
      const interval = setInterval(() => {
        fetchChatTranscript();
        fetchBookingStatus();
        fetchBookingPhotos();
      }, 4500);

      return () => clearInterval(interval);
    }
  }, [booking?.id]);

  // Socket-driven real-time en-route movement ticks and sync triggers
  useEffect(() => {
    if (!socket || !booking) return;

    const handleLocationTick = (data) => {
      if (data.bookingId !== booking.id) return;
      console.log('📡 [SOCKET-GPS] Live en-route coordinate tick:', data);
      
      setLiveCoords({ latitude: data.latitude, longitude: data.longitude });
      setLiveEta(data.eta);
      
      if (data.arrived) {
        setMapState('arrived');
      } else {
        setMapState('driving');
      }
    };

    const handleArrived = (data) => {
      if (data.bookingId !== booking.id) return;
      setMapState('arrived');
      setLiveEta(0);
    };

    const handleTypingIndicator = (data) => {
      if (data.bookingId !== booking.id) return;
      setIsOtherTyping(data.isTyping);
    };

    const handleSyncRefresh = (payload) => {
      if (payload.type === 'bookings') {
        fetchBookingStatus();
        fetchBookingPhotos();
      }
    };

    const handlePhotosUploaded = (data) => {
      if (data.bookingId === booking.id) {
        fetchBookingPhotos();
      }
    };

    socket.on('location-simulation-tick', handleLocationTick);
    socket.on('simulation-arrived', handleArrived);
    socket.on('typing-indicator', handleTypingIndicator);
    socket.on('db-sync-refresh', handleSyncRefresh);
    socket.on('booking-photos-uploaded', handlePhotosUploaded);

    return () => {
      socket.off('location-simulation-tick', handleLocationTick);
      socket.off('simulation-arrived', handleArrived);
      socket.off('typing-indicator', handleTypingIndicator);
      socket.off('db-sync-refresh', handleSyncRefresh);
      socket.off('booking-photos-uploaded', handlePhotosUploaded);
    };
  }, [socket, booking?.id]);

  useEffect(() => {
    // Scroll chat to bottom when messages load
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchLatestBooking = async () => {
    try {
      const res = await axios.get('/api/bookings/my');
      if (res.data.length > 0) {
        // Find the first booking that is not completed or cancelled, or fallback to first overall
        const active = res.data.find(b => ['pending', 'accepted', 'arrived', 'started'].includes(b.status)) || res.data[0];
        setBooking(active);
      }
    } catch (err) {
      console.error('Failed to load active booking:', err.message);
    }
  };

  const fetchBookingStatus = async () => {
    try {
      const res = await axios.get('/api/bookings/my');
      const updated = res.data.find(b => b.id === booking.id);
      if (updated) {
        setBooking(updated);
        // Adjust simulated map animation states
        if (updated.status === 'started') setMapState('working');
        else if (updated.status === 'completed') setMapState('completed');
        else if (updated.status === 'arrived') setMapState('arrived');
        else if (['accepted', 'on_the_way'].includes(updated.status)) setMapState('driving');
      }
    } catch (err) {
      console.warn('Sync booking status failed.');
    }
  };

  const fetchChatTranscript = async () => {
    if (!booking) return;
    try {
      const res = await axios.get('/api/chat/transcript', {
        params: { bookingId: booking.id }
      });
      setChatMessages(res.data);
    } catch (err) {
      console.warn('Failed to load chat transcript.');
    }
  };

  const fetchBookingPhotos = async () => {
    if (!booking) return;
    try {
      const res = await axios.get(`/api/photos/${booking.id}`);
      setBookingPhotos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // Photos not required, non-blocking
      setBookingPhotos([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !booking) return;

    // Determine who is receiving the message
    const receiverId = user.role === 'worker' 
      ? (booking.customer_id || booking.contractor_id) 
      : booking.worker_id;

    if (!receiverId) return;

    try {
      const res = await axios.post('/api/chat/message', {
        bookingId: booking.id,
        receiverId,
        message: typedMessage
      });
      setChatMessages([...chatMessages, { ...res.data, sender_name: user.name, sender_avatar: user.avatar_url }]);
      setTypedMessage('');
      
      // Instantly shut down typing indicator on submit
      if (socket) {
        socket.emit('typing-announce', {
          bookingId: booking.id,
          receiverId,
          isTyping: false
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err.message);
    }
  };

  const handleTyping = (e) => {
    setTypedMessage(e.target.value);
    if (!socket || !booking) return;

    const receiverId = user.role === 'worker' 
      ? (booking.customer_id || booking.contractor_id) 
      : booking.worker_id;

    if (!receiverId) return;

    socket.emit('typing-announce', {
      bookingId: booking.id,
      receiverId,
      isTyping: e.target.value.length > 0
    });
  };

  // Convert raw coordinates into visual SVG viewport percentage points
  const getMarkerPosition = () => {
    if (booking.status === 'started') return { top: '45%', left: '55%' };
    if (booking.status === 'completed') return { top: '40%', left: '65%' };
    if (mapState === 'arrived') return { top: '45%', left: '55%' };
    if (!liveCoords || !booking) return { top: '70%', left: '20%' };

    const destLat = parseFloat(booking.latitude || 18.5204);
    const destLng = parseFloat(booking.longitude || 73.8567);
    const currentLat = liveCoords.latitude;
    const currentLng = liveCoords.longitude;

    const latDiff = destLat - currentLat;
    const lngDiff = destLng - currentLng;

    // Center standard: 40% top and 65% left represents target destination
    const topPct = 40 + (latDiff * 3000);
    const leftPct = 65 - (lngDiff * 3000);

    const top = Math.max(12, Math.min(88, topPct)) + '%';
    const left = Math.max(12, Math.min(88, leftPct)) + '%';

    return { top, left };
  };

  const handleMarkArrived = async () => {
    if (!booking) return;
    setActionLoading(true);
    try {
      const res = await axios.post('/api/bookings/arrived', {
        bookingId: booking.id
      });
      alert(res.data.message || 'You have arrived at the location!');
      await fetchBookingStatus();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark arrival.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartJob = async () => {
    if (!otpInput || !booking) return;
    setActionLoading(true);

    try {
      await axios.post('/api/bookings/verify-otp', {
        bookingId: booking.id,
        otp: otpInput
      });
      await fetchBookingStatus();
      setOtpInput('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start job. Please verify the OTP.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    if (!booking) return;
    setActionLoading(true);

    try {
      await axios.post('/api/bookings/complete', {
        bookingId: booking.id
      });
      await fetchBookingStatus();
      await fetchWallet();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to finalize completion.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyCompletion = async () => {
    if (!booking) return;
    setActionLoading(true);
    try {
      await axios.post('/api/photos/verify', { bookingId: booking.id });
      await fetchBookingStatus();
      await fetchWallet();
    } catch (err) {
      alert(err.response?.data?.error || 'Verification failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoUpload = async (imageType, file) => {
    if (!file || !booking) return;
    setPhotoUploading(true);
    setPhotoUploadSuccess('');

    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const imageBase64 = ev.target.result;
          await axios.post('/api/photos/upload', {
            bookingId: booking.id,
            imageType,
            imageBase64
          });
          setPhotoUploadSuccess(`${imageType === 'before' ? 'Before' : 'After'} photo uploaded successfully!`);
          setTimeout(() => setPhotoUploadSuccess(''), 4000);
          await fetchBookingPhotos();
        } catch (err) {
          alert(err.response?.data?.error || 'Photo upload failed.');
        } finally {
          setPhotoUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setPhotoUploading(false);
      alert('Failed to read file.');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!booking) return;
    setActionLoading(true);

    try {
      await axios.post('/api/bookings/review', {
        bookingId: booking.id,
        revieweeId: booking.worker_id,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewSubmitted(true);
      alert('Thank you! Your rating and review have been posted successfully.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!booking) {
    return (
      <div className="glass-panel p-12 rounded-3xl text-center border-white/5 text-dark-400 flex flex-col items-center gap-4 max-w-lg mx-auto mt-12 text-left">
        <AlertTriangle className="w-12 h-12 text-brand-500" />
        <h2 className="text-xl font-bold text-white">No Active Booking Session</h2>
        <p className="text-xs text-dark-300">
          You do not have an active service booking under monitoring. Return to your dashboard to request plumbing, electrical, or masonry help.
        </p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-brand-500 text-white text-xs font-bold py-2.5 px-6 rounded-xl hover:bg-brand-600 transition-colors mt-2"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  // Helper variables
  const isWorker = user.role === 'worker';
  const otherPartyName = isWorker ? (booking.customer_name || 'Client') : (booking.worker_name || 'Assigned Specialist');
  const otherPartyAvatar = isWorker ? booking.customer_avatar : booking.worker_avatar;

  // Active steps layout
  const steps = [
    { label: 'Requested', done: ['pending', 'accepted', 'arrived', 'started', 'completed'].includes(booking.status) },
    { label: 'Accepted', done: ['accepted', 'arrived', 'started', 'completed'].includes(booking.status) },
    { label: 'Arrived', done: ['arrived', 'started', 'completed'].includes(booking.status) },
    { label: 'Started', done: ['started', 'completed'].includes(booking.status) },
    { label: 'Completed', done: ['completed'].includes(booking.status) }
  ];

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      
      {/* HEADER CONTROLS */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-xs text-dark-300 hover:text-white flex items-center gap-1 font-bold border border-white/5 bg-white/5 py-1.5 px-3 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </button>
        <div className="text-right text-xs">
          <span className="text-dark-400">Booking Reference: </span>
          <span className="font-bold text-white">#LC-{booking.id}</span>
        </div>
      </div>

      {/* STEPPERS TRACKING VIEW */}
      <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col text-left mr-auto">
          <h2 className="text-lg font-extrabold text-white capitalize">{booking.service_type} Booking Status</h2>
          <p className="text-xs text-dark-400">OTP Handshake secured work lifecycle.</p>
        </div>
        <div className="flex gap-2 items-center w-full md:w-auto overflow-x-auto py-2">
          {steps.map((st, idx) => (
            <React.Fragment key={st.label}>
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${st.done ? 'bg-brand-500 text-white neon-glow-orange' : 'bg-dark-900 border border-white/10 text-dark-400'}`}>
                  {st.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span className="text-[9px] font-bold text-dark-300 mt-1 uppercase tracking-wider">{st.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 w-8 md:w-12 shrink-0 ${st.done && steps[idx+1].done ? 'bg-brand-500' : 'bg-white/5'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* CORE INTERACTION MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1 & 2: LIVE SIMULATED GPS MAP & DETAILS */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* MOCK MAP COMPONENT */}
          <div className="glass-panel rounded-2xl border-white/5 h-80 overflow-hidden relative bg-[#13131a] p-4 flex flex-col justify-between">
            
            {/* Map Header details overlay */}
            <div className="z-10 flex justify-between items-center">
              <span className="bg-brand-500/10 border border-brand-500/15 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                <Navigation className="w-3.5 h-3.5" /> Live Tracking Active (Pune Area)
              </span>
              <span className="bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-dark-200">
                Lat: {(liveCoords?.latitude || booking.latitude).toFixed(4)} • Lng: {(liveCoords?.longitude || booking.longitude).toFixed(4)}
              </span>
            </div>

            {/* MOCK SVG MAP ROADS */}
            <div className="absolute inset-0 z-0 opacity-40">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="grad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ff5500" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#13131a" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="50%" cy="50%" r="35%" fill="url(#grad)" />
                {/* Simulated Roads */}
                <path d="M 0,150 L 800,150" stroke="#ffffff" strokeWidth="2" strokeDasharray="5,10" />
                <path d="M 0,220 L 800,180" stroke="#ffffff" strokeWidth="1.5" />
                <path d="M 300,0 L 300,400" stroke="#ffffff" strokeWidth="2" strokeDasharray="5,10" />
                <path d="M 450,0 L 410,400" stroke="#ffffff" strokeWidth="1.5" />
                <path d="M 100,50 L 700,350" stroke="#ffffff" strokeWidth="1" strokeDasharray="2,5" />
              </svg>
            </div>

            {/* MAP MARKERS (Client Home vs Worker moving) */}
            <div className="absolute inset-0 z-0 flex items-center justify-center">
              
              {/* CLIENT STATIONARY HOME ICON */}
              <div className="absolute top-[40%] left-[65%] flex flex-col items-center">
                <div className="bg-brand-500 text-white p-2 rounded-full ring-4 ring-brand-500/20">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold text-white bg-dark-950/80 px-2 py-0.5 rounded-md mt-1 border border-white/5 uppercase">Destination</span>
              </div>

              {/* WORKER MOVING CAR/SPECIALIST ICON */}
              {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                <motion.div 
                  className="absolute"
                  animate={getMarkerPosition()}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                >
                  <div className="flex flex-col items-center">
                    <div className="bg-green-500 text-white p-2 rounded-full ring-4 ring-green-500/20 pulse-active">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold text-green-400 bg-dark-950/80 px-2 py-0.5 rounded-md mt-1 border border-white/5 uppercase whitespace-nowrap">
                      {mapState === 'driving' 
                        ? `En Route ${liveEta !== null ? `(${liveEta}m)` : ''}` 
                        : 'Arrived'}
                    </span>
                  </div>
                </motion.div>
              )}

            </div>

            {/* Map footer directions overlay */}
            <div className="z-10 bg-dark-950/80 border border-white/5 p-3 rounded-xl flex items-center gap-3 backdrop-blur-sm">
              <MapPin className="w-5 h-5 text-brand-500 shrink-0" />
              <div className="flex flex-col text-left text-xs">
                <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Job Delivery Site</span>
                <span className="text-white font-semibold line-clamp-1">{booking.address}</span>
              </div>
            </div>

          </div>

          {/* SECURE HANDSHAKE / OTP ACTIONS PORTAL */}
          <div className="glass-panel p-6 rounded-2xl border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            
            {/* Left Column info */}
            <div className="flex-1 flex gap-3 text-left">
              <div className="bg-brand-500/10 p-3 rounded-xl text-brand-500 shrink-0 h-fit">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-white text-base">OTP Secured Work Handshake</h3>
                <p className="text-xs text-dark-300 mt-1">
                  We use secure 6-digit OTP codes to verify when a worker physically arrives at the job location and officially starts the project.
                </p>
              </div>
            </div>

            {/* Right Column conditional inputs */}
            <div className="shrink-0 w-full md:w-auto bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center">
              {booking.status === 'completed' ? (
                <div className="text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto" />
                  <p className="text-xs font-bold text-green-400 mt-1 uppercase">Job Settlement Closed</p>
                </div>
              ) : booking.status === 'cancelled' ? (
                <div className="text-center">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
                  <p className="text-xs font-bold text-red-400 mt-1 uppercase">Cancelled Session</p>
                </div>
              ) : isWorker ? (
                // Worker Controls
                booking.status === 'accepted' ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider text-center">En Route to Client's Location</span>
                    <button 
                      onClick={handleMarkArrived}
                      disabled={actionLoading}
                      className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-glass uppercase tracking-wider"
                    >
                      {actionLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MapPin className="w-4 h-4" />}
                      📍 I Have Arrived at Location
                    </button>
                  </div>
                ) : booking.status === 'arrived' ? (
                  <div className="flex flex-col gap-2 w-full">
                    <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider text-center">Ask client for Start OTP PIN</span>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        maxLength={6}
                        placeholder="Enter 6-digit PIN"
                        value={otpInput}
                        onChange={e => setOtpInput(e.target.value.replace(/\D/g,''))}
                        className="w-32 text-center text-xs font-bold glass-input py-2 rounded-xl"
                      />
                      <button 
                        onClick={handleStartJob}
                        disabled={actionLoading || otpInput.length < 6}
                        className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition-colors"
                      >
                        {actionLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        Verify & Start
                      </button>
                    </div>
                  </div>
                ) : booking.status === 'started' ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Active Work Timer Running...</span>
                    <button 
                      onClick={handleCompleteJob}
                      disabled={actionLoading}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-glass"
                    >
                      {actionLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Mark Work Completed
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto" />
                    <p className="text-xs font-bold text-green-400 mt-1 uppercase font-semibold">Job Settlement Completed</p>
                  </div>
                )
              ) : (
                // Client Controls (display the OTP)
                booking.status === 'accepted' ? (
                  <div className="text-center flex flex-col items-center">
                    <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Your Secure Start OTP PIN:</span>
                    <p className="text-3xl font-extrabold text-white tracking-widest mt-1 neon-text-orange">{booking.otp}</p>
                    <span className="text-[9px] text-brand-400 font-semibold mt-1 max-w-[150px]">Share this with the worker ONLY when they arrive.</span>
                  </div>
                ) : booking.status === 'arrived' ? (
                  <div className="text-center flex flex-col items-center">
                    <span className="text-[10px] text-green-400 font-extrabold uppercase tracking-wider animate-pulse flex items-center gap-1">📍 Specialist Has Arrived!</span>
                    <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider mt-1.5">Share this Start OTP PIN:</span>
                    <p className="text-3xl font-extrabold text-white tracking-widest mt-1 neon-text-orange">{booking.otp}</p>
                  </div>
                ) : (
                  <div className="text-center flex flex-col items-center">
                    <CheckCircle2 className="w-8 h-8 text-brand-500 mx-auto pulse-active" />
                    <p className="text-xs font-bold text-brand-400 mt-1.5 uppercase">Work In Progress</p>
                  </div>
                )
              )}
            </div>

          </div>

          {/* BOOKING PHOTO PROOF GALLERY */}
          {(bookingPhotos.length > 0 || (isWorker && booking.status === 'started')) && (
            <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-sm">📷 Work Proof Photo Gallery</h3>
                <span className="text-[10px] text-dark-400 font-bold">{bookingPhotos.length} photos uploaded</span>
              </div>
              
              {bookingPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {bookingPhotos.map((photo) => (
                    <div key={photo.id} className="relative rounded-xl overflow-hidden aspect-square border border-white/10">
                      <img 
                        src={getAssetUrl(photo.image_url)} 
                        alt={`${photo.image_type} work proof`}
                        className="w-full h-full object-cover"
                      />
                      <span className={`absolute top-2 left-2 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        photo.image_type === 'before' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'
                      }`}>
                        {photo.image_type}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Photo upload container for worker */}
              {isWorker && booking.status === 'started' && (
                <div className="bg-brand-500/5 border border-brand-500/20 p-3.5 rounded-xl flex flex-col gap-3 mt-2">
                  <p className="font-bold text-brand-400 text-[10px] uppercase tracking-wider text-left">📷 Upload Work Proof Photos</p>

                  {photoUploadSuccess && (
                    <p className="text-green-400 text-[10px] font-bold bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                      ✅ {photoUploadSuccess}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {/* Before photo upload */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-dark-400 text-[10px] font-bold uppercase tracking-wider text-left">Before Work</span>
                      <label
                        htmlFor={`before-photo-bp`}
                        className="flex flex-col items-center justify-center gap-1 py-3 border border-dashed border-yellow-500/40 rounded-xl cursor-pointer bg-yellow-500/5 hover:bg-yellow-500/10 transition-all text-center"
                      >
                        <Camera className="w-5 h-5 text-yellow-400 mx-auto" />
                        <span className="text-[9px] font-bold text-yellow-400 animate-pulse">Upload Before</span>
                      </label>
                      <input
                        id={`before-photo-bp`}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handlePhotoUpload('before', e.target.files[0]);
                          }
                        }}
                      />
                    </div>

                    {/* After photo upload */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-dark-400 text-[10px] font-bold uppercase tracking-wider text-left">After Work</span>
                      <label
                        htmlFor={`after-photo-bp`}
                        className="flex flex-col items-center justify-center gap-1 py-3 border border-dashed border-green-500/40 rounded-xl cursor-pointer bg-green-500/5 hover:bg-green-500/10 transition-all text-center"
                      >
                        {photoUploading ? (
                          <span className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto" />
                        ) : (
                          <Upload className="w-5 h-5 text-green-400 mx-auto" />
                        )}
                        <span className="text-[9px] font-bold text-green-400 animate-pulse">Upload After</span>
                      </label>
                      <input
                        id={`after-photo-bp`}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handlePhotoUpload('after', e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-dark-400 text-left">Upload before + after photos as proof. Client will verify to release payment.</p>
                </div>
              )}

              {/* Customer Verification Button */}
              {!isWorker && bookingPhotos.some(p => p.image_type === 'after') && booking.status !== 'completed' && (
                <div className="bg-green-500/5 border border-green-500/20 p-4 rounded-xl flex flex-col gap-3">
                  <p className="text-green-400 text-xs font-bold text-left">✅ Work photos submitted by the professional. Verify and approve to release payment.</p>
                  <button
                    onClick={handleVerifyCompletion}
                    disabled={actionLoading}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    {actionLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Verify Work & Release Payment
                  </button>
                </div>
              )}
            </div>
          )}

          {/* RATING & REVIEW PORTAL */}
          {booking.status === 'completed' && !isWorker && (
            <div className="glass-panel p-6 rounded-2xl border-brand-500/20 flex flex-col gap-4">
              <h3 className="font-bold text-white text-base">⭐ Rate & Review Your Specialist</h3>
              <p className="text-xs text-dark-300">Share your experience to help the community find trusted professionals.</p>

              {reviewSubmitted ? (
                <div className="bg-green-500/5 border border-green-500/25 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-400 shrink-0" />
                  <div className="text-left">
                    <h4 className="font-bold text-white text-xs">Review Submitted Successfully!</h4>
                    <p className="text-[10px] text-dark-300">Your rating of {reviewRating} stars has been recorded. Thank you for your feedback!</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="flex flex-col gap-4 text-xs">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-dark-400 font-bold uppercase tracking-wider text-left">Select Rating</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star className={`w-6 h-6 ${star <= reviewRating ? 'text-brand-500 fill-brand-500' : 'text-dark-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-dark-400 font-bold uppercase tracking-wider text-left">Write a Comment</span>
                    <textarea
                      placeholder="Share details of your experience (e.g. prompt arrival, excellent quality of work, clean cleanup)..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      className="glass-input p-3 rounded-xl w-full text-xs"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-4 rounded-xl transition-all"
                  >
                    {actionLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Submit Review & Rating'}
                  </button>
                </form>
              )}
            </div>
          ) }

          {/* FINANCIAL PROJECT OVERVIEW SUMMARY */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col border-r border-white/5">
              <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Total Contract Price</span>
              <span className="text-lg font-extrabold text-white mt-1">₹{Number(booking.total_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex flex-col md:border-r border-white/5">
              <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Hiring Model</span>
              <span className="text-sm font-extrabold text-brand-400 capitalize mt-1.5">{booking.booking_type} Dispatch</span>
            </div>
            <div className="flex flex-col border-r border-white/5">
              <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Payment Status</span>
              <span className={`text-[10px] font-extrabold capitalize w-fit px-2.5 py-0.5 rounded-full mx-auto mt-2 ${booking.payment_status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                {booking.payment_status}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Target Provider</span>
              <span className="text-xs font-bold text-white truncate max-w-[120px] mx-auto mt-2">
                {otherPartyName}
              </span>
            </div>
          </div>

        </div>

        {/* COLUMN 3: DIRECT CHAT MESSENGER VIEW */}
        <div className="glass-panel rounded-2xl border-white/5 flex flex-col h-[520px] overflow-hidden bg-dark-950/20 text-left">
          
          {/* Chat header */}
          <div className="bg-white/5 border-b border-white/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={otherPartyAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                alt="avatar" 
                className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" 
              />
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-white">{otherPartyName}</span>
                <span className="text-[10px] text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-active" /> Active In-App Chat</span>
              </div>
            </div>
            <a 
              href={`tel:${booking.customer_phone || booking.worker_phone || '9999999999'}`}
              className="p-2 bg-white/5 hover:bg-white/10 text-dark-200 hover:text-white rounded-lg transition-colors"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>

          {/* Transcript Scroll View */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            {chatMessages.length === 0 ? (
              <div className="my-auto text-center text-dark-400 text-xs flex flex-col items-center gap-2">
                <MessageSquare className="w-8 h-8 text-dark-500" />
                <p>No messages exchanged yet.</p>
                <p className="text-[10px] text-dark-500">Ask about site access details, tools, or location landmarks!</p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const myMsg = msg.sender_id === user.id;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[80%] ${myMsg ? 'ml-auto text-right items-end' : 'mr-auto text-left items-start'}`}
                  >
                    <span className="text-[9px] text-dark-400 mb-0.5 font-semibold">
                      {myMsg ? 'You' : msg.sender_name}
                    </span>
                    <div className={`p-2.5 rounded-2xl text-xs font-medium ${myMsg ? 'bg-brand-500 text-white rounded-tr-none' : 'bg-white/5 border border-white/5 text-white rounded-tl-none'}`}>
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            {isOtherTyping && (
              <div className="text-[10px] text-brand-400 italic mt-1 font-semibold animate-pulse">
                {otherPartyName} is typing...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Form input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-dark-950/40 border-t border-white/5 flex gap-2">
            <input 
              type="text" 
              placeholder="Type message..." 
              value={typedMessage}
              onChange={handleTyping}
              className="flex-1 glass-input px-4 py-2.5 rounded-xl text-xs"
            />
            <button 
              type="submit"
              className="bg-brand-500 text-white p-2.5 rounded-xl hover:bg-brand-600 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};

export default BookingPage;
