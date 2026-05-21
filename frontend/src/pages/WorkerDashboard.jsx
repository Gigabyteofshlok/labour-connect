// WORKER DASHBOARD PANEL
// Mobile-first layouts displaying availability toggles, simulated GPS transmitters,
// accept/reject dispatch cards, historical earnings logs, and cooperative cooperatives.

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, WifiOff, MapPin, TrendingUp, CheckCircle, BookOpen, Landmark, Navigation, Users, AlertCircle, Camera, Upload
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const { user, fetchMe, wallet, fetchWallet, socket } = useAuthStore();

  const [status, setStatus] = useState(user?.status || 'offline');
  const [gpsMode, setGpsMode] = useState('simulated'); // 'simulated' | 'real'
  const [lat, setLat] = useState('18.5204');
  const [lng, setLng] = useState('73.8567');
  
  const [bookings, setBookings] = useState([]);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [stats, setStats] = useState({ totalEarnings: 0, jobsCount: 0, monthlyHistory: [] });
  const [loading, setLoading] = useState(false);

  // Cooperative states
  const [coopGroups, setCoopGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [coopLoading, setCoopLoading] = useState(false);

  // Photo upload states
  const [photoUploadBookingId, setPhotoUploadBookingId] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState('');
  const photoBeforeRef = React.useRef(null);
  const photoAfterRef = React.useRef(null);

  // Web Geolocation watch state and throttling refs
  const watchIdRef = React.useRef(null);
  const lastLocationEmitTime = React.useRef(0);
  const lastLocationCoords = React.useRef(null);

  // Web Audio Context refs for synthesised dual-tone siren
  const audioCtxRef = React.useRef(null);
  const oscillatorRef = React.useRef(null);
  const lfoRef = React.useRef(null);

  useEffect(() => {
    fetchBookings();
    fetchStats();
    fetchCooperativeGroups();
    fetchWallet();
  }, [status]);

  // Unlock AudioContext on initial interaction
  const unlockAudioContext = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass && !audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch (err) {
      console.warn('Failed to unlock Web Audio context:', err.message);
    }
  };

  // Synthesise high-pitch ambulance/police dual-tone siren alarm
  const startSiren = () => {
    try {
      unlockAudioContext();
      if (!audioCtxRef.current) return;
      if (oscillatorRef.current) return; // Siren already sounding

      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);

      // Low Frequency Oscillator for shifting pitch between 880Hz and 440Hz cyclic pitch shift
      lfo.frequency.value = 2; // Speed of frequency oscillations
      lfoGain.gain.value = 220; // Amplitude of shift (+/- 220Hz)

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gainNode.gain.setValueAtTime(0.18, ctx.currentTime); // LOUD siren alarm but pleasant volume

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      lfo.start();
      osc.start();

      oscillatorRef.current = osc;
      lfoRef.current = lfo;
      console.log('🚨 [SIREN] Alarm synthesised and sounding successfully.');
    } catch (err) {
      console.warn('Failed to play synthesised audio alarm:', err.message);
    }
  };

  // Stop siren playback
  const stopSiren = () => {
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      if (lfoRef.current) {
        lfoRef.current.stop();
        lfoRef.current.disconnect();
        lfoRef.current = null;
      }
      console.log('🚨 [SIREN] Siren alarm stopped.');
    } catch (err) {
      console.warn('Failed to terminate siren nodes:', err.message);
    }
  };

  // Distance calculator helper in meters
  const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Radius of Earth in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Instant Real-Time Booking dispatch pings listener
  useEffect(() => {
    if (!socket) return;

    const handleBookingPing = (data) => {
      console.log('🔔 [SOCKET.IO] Incoming booking ping received:', data);
      const isTargeted = data && (data.worker_id === user?.id || data.targetWorkerId === user?.id);
      if (isTargeted) {
        setIncomingRequest(data);
        startSiren();
      }
    };

    socket.on('booking-ping', handleBookingPing);
    socket.on('booking-ping-broadcast', handleBookingPing);

    return () => {
      socket.off('booking-ping', handleBookingPing);
      socket.off('booking-ping-broadcast', handleBookingPing);
      stopSiren();
    };
  }, [socket, user]);

  // Geolocation and Simulation handler
  useEffect(() => {
    if (status !== 'online') {
      // Clear GPS listeners on offline
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (gpsMode === 'real') {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser. Reverting to Simulation mode.');
        setGpsMode('simulated');
        return;
      }

      console.log('📡 [GPS] Engaging watchPosition geolocation tracking...');
      
      const successHandler = (position) => {
        const { latitude, longitude } = position.coords;
        const now = Date.now();
        const elapsed = now - lastLocationEmitTime.current;
        
        let shouldEmit = false;
        
        if (lastLocationEmitTime.current === 0) {
          shouldEmit = true; // First tick
        } else {
          const metersMoved = lastLocationCoords.current
            ? getDistanceMeters(lastLocationCoords.current.latitude, lastLocationCoords.current.longitude, latitude, longitude)
            : Infinity;
          
          // Throttling constraint: at least 3 seconds or moved 5 meters
          if (elapsed >= 3000 || metersMoved >= 5) {
            shouldEmit = true;
          }
        }

        if (shouldEmit) {
          console.log(`📡 [GPS] Location emission triggered: Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`);
          setLat(latitude.toFixed(6));
          setLng(longitude.toFixed(6));

          // Emit location over transient websocket engine
          if (socket && socket.connected) {
            socket.emit('worker-location-update', {
              latitude,
              longitude,
              status: 'online'
            });
          }

          // Persist location in backend (throttled database update)
          axios.put('/api/workers/location', { latitude, longitude })
            .catch(err => console.warn('Failed to update live DB coordinates:', err.message));

          // Update refs
          lastLocationEmitTime.current = now;
          lastLocationCoords.current = { latitude, longitude };
        }
      };

      const errorHandler = (err) => {
        console.error('📡 [GPS] watchPosition failed:', err.message);
        alert(`GPS error (${err.message}). Falling back to simulated track.`);
        setGpsMode('simulated');
      };

      watchIdRef.current = navigator.geolocation.watchPosition(successHandler, errorHandler, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    } else {
      // Simulated GPS mode centered around Pune (with slight drift simulation)
      console.log('📡 [GPS SIMULATED] Engaging drift coordinate generator...');
      
      const driftInterval = setInterval(() => {
        setLat(prevLat => {
          const lVal = parseFloat(prevLat) + (Math.random() - 0.5) * 0.00015;
          setLng(prevLng => {
            const lnVal = parseFloat(prevLng) + (Math.random() - 0.5) * 0.00015;
            
            // Emit simulated tick to websocket engine
            if (socket && socket.connected) {
              socket.emit('worker-location-update', {
                latitude: lVal,
                longitude: lnVal,
                status: 'online'
              });
            }

            // Sync with backend API
            axios.put('/api/workers/location', { latitude: lVal, longitude: lnVal })
              .catch(err => console.warn('Failed to update simulated DB coordinates:', err.message));

            return lnVal.toFixed(6);
          });
          return lVal.toFixed(6);
        });
      }, 3000); // 3 seconds interval matches throttling requirements

      return () => {
        clearInterval(driftInterval);
      };
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [gpsMode, status, socket]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get('/api/bookings/my');
      setBookings(res.data);
    } catch (err) {
      console.error('Failed to load bookings:', err.message);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/wallet/analytics');
      setStats(res.data);
    } catch (err) {
      console.warn('Failed to load earnings stats.');
    }
  };

  const fetchCooperativeGroups = async () => {
    try {
      const res = await axios.get('/api/groups');
      setCoopGroups(res.data);
    } catch (err) {
      console.warn('Failed to load cooperative groups.');
    }
  };

  const toggleAvailability = async () => {
    unlockAudioContext();
    const nextStatus = status === 'online' ? 'offline' : 'online';
    setLoading(true);

    try {
      await axios.put('/api/workers/status', { status: nextStatus });
      setStatus(nextStatus);
      await fetchMe();
    } catch (err) {
      alert('Failed to update availability status.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransmitGPS = async (e) => {
    e.preventDefault();
    unlockAudioContext();
    try {
      await axios.put('/api/workers/location', { latitude: lat, longitude: lng });
      // Emit to Socket.io directly on manual coordinate push
      if (socket && socket.connected) {
        socket.emit('worker-location-update', {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          status: 'online'
        });
      }
      alert('GPS Signal Transmitted successfully. Customers can locate you at these coordinates.');
    } catch (err) {
      alert('Failed to transmit location.');
    }
  };

  const handleRespondToBooking = async (bookingId, response, bookingObj) => {
    stopSiren();
    try {
      await axios.post('/api/bookings/respond', {
        bookingId,
        response
      });

      alert(`Job ${response === 'accept' ? 'accepted' : 'declined'} successfully.`);
      await fetchBookings();
      
      if (response === 'accept') {
        setStatus('busy');
        const acceptedBookingObj = bookingObj ? { ...bookingObj, status: 'accepted' } : { id: bookingId, status: 'accepted' };
        navigate('/booking', { state: { booking: acceptedBookingObj } });
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to respond to booking.');
    }
  };

  const handleDispatchResponse = async (response) => {
    if (!incomingRequest) return;
    await handleRespondToBooking(incomingRequest.id, response, incomingRequest);
    setIncomingRequest(null);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName) return;
    setCoopLoading(true);

    try {
      await axios.post('/api/groups/create', { name: newGroupName, description: newGroupDesc });
      setNewGroupName('');
      setNewGroupDesc('');
      await fetchCooperativeGroups();
      await fetchMe();
      alert('Cooperative team formed successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to form team.');
    } finally {
      setCoopLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await axios.post('/api/groups/join', { groupId });
      await fetchCooperativeGroups();
      await fetchMe();
      alert('Joined team successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to join group.');
    }
  };

  // Upload a before or after photo for a job
  const handlePhotoUpload = async (bookingId, imageType, file) => {
    if (!file) return;
    setPhotoUploading(true);
    setPhotoUploadSuccess('');

    try {
      // Convert file to base64 for API upload
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const imageBase64 = ev.target.result;
          await axios.post('/api/photos/upload', {
            bookingId,
            imageType,
            imageBase64
          });
          setPhotoUploadSuccess(`${imageType === 'before' ? 'Before' : 'After'} photo uploaded successfully!`);
          setTimeout(() => setPhotoUploadSuccess(''), 4000);
          await fetchBookings();
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

  // Simulated chart data
  const chartData = stats.monthlyHistory.length > 0
    ? stats.monthlyHistory.map(h => ({ name: new Date(h.month).toLocaleDateString(undefined, { month: 'short' }), amount: parseFloat(h.amount) }))
    : [
        { name: 'Jan', amount: 3200 },
        { name: 'Feb', amount: 4800 },
        { name: 'Mar', amount: 3900 },
        { name: 'Apr', amount: 5100 },
        { name: 'May', amount: stats.totalEarnings || 6000 }
      ];

  return (
    <div className="w-full flex flex-col gap-8 text-left">
      
      {/* MOBILE-FIRST FLOATING INCOMING DISPATCH BANNER */}
      <AnimatePresence>
        {incomingRequest && (
          <div className="fixed inset-0 bg-dark-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel max-w-sm w-full p-6 rounded-3xl border-brand-500 border-2 bg-brand-500/10 text-center flex flex-col gap-5 neon-glow-orange"
            >
              <div className="flex flex-col items-center gap-2">
                <span className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center text-2xl text-white pulse-active">🛎️</span>
                <h3 className="font-extrabold text-white text-xl">Incoming Booking Request!</h3>
                <p className="text-xs text-dark-300">New job booking matching your skill set nearby.</p>
              </div>

              {/* Job summary */}
              <div className="bg-dark-950/60 p-4 rounded-xl border border-white/5 flex flex-col gap-2.5 text-xs text-left">
                <div className="flex justify-between"><span className="text-dark-400">Service Category</span><span className="text-white font-bold">{incomingRequest.service_type}</span></div>
                <div className="flex justify-between"><span className="text-dark-400">Client Address</span><span className="text-white font-bold max-w-[150px] truncate">{incomingRequest.address}</span></div>
                <div className="border-t border-white/5 my-1" />
                <div className="flex justify-between text-sm"><span className="font-bold text-white">Estimated Earnings</span><span className="font-extrabold text-brand-400">₹{incomingRequest.total_amount}</span></div>
              </div>

              <div className="flex gap-3 mt-1.5">
                <button 
                  onClick={() => handleDispatchResponse('reject')}
                  className="flex-1 py-3 bg-red-500/20 text-red-400 border border-red-500/20 font-bold rounded-xl text-xs hover:bg-red-500 hover:text-white transition-all"
                >
                  Decline Job
                </button>
                <button 
                  onClick={() => handleDispatchResponse('accept')}
                  className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl text-xs hover:opacity-95 transition-opacity shadow-glass"
                >
                  Accept & Go
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <img src={user?.avatar_url} alt="avatar" className="w-14 h-14 rounded-full border border-brand-500 object-cover" />
          <div className="text-left">
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-1.5">
              {user?.full_name || user?.name || 'Skilled Professional'} 
              {user?.verified && <CheckCircle className="w-5 h-5 text-blue-500 fill-current" />}
            </h1>
            <p className="text-dark-300 text-xs mt-0.5">Rating: {user?.rating || 5.0}★ • Experience: {user?.experience_years || 0} years</p>
            {user?.skills && Array.isArray(user.skills) && user.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {user.skills.map((s, idx) => (
                  <span key={idx} className="text-[9px] bg-brand-500/10 border border-brand-500/20 text-brand-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">{s}</span>
                ))}
              </div>
            )}
            {user?.bio && <p className="text-dark-400 text-xs mt-2.5 max-w-lg leading-relaxed bg-white/5 p-2 rounded-xl border border-white/5">{user.bio}</p>}
          </div>
        </div>

        {/* Online Toggle button */}
        <button
          onClick={toggleAvailability}
          disabled={loading}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-extrabold text-sm transition-all duration-300 ${status === 'online' ? 'bg-green-500 text-white neon-glow-green' : 'bg-white/5 border border-white/10 text-dark-300 hover:bg-white/10'}`}
        >
          {status === 'online' ? (
            <>
              <Wifi className="w-5 h-5 pulse-active" /> Ready / Online
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5" /> Off Duty / Offline
            </>
          )}
        </button>
      </div>

      {/* CORE WORKER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Earning cards & statistics charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-dark-400">Simulated Wallet Balance</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">₹{Number(wallet?.balance || 0).toFixed(2)}</h2>
            </div>
            <div className="glass-panel p-5 rounded-2xl border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-dark-400">Total Credits Earned</span>
              <h2 className="text-2xl font-extrabold text-green-400 mt-1">₹{Number(stats.totalEarnings || 0).toFixed(2)}</h2>
            </div>
            <div className="glass-panel p-5 rounded-2xl border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-dark-400">Completed Service Bookings</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">{stats.jobsCount || 0} jobs</h2>
            </div>
          </div>

          {/* Earnings progress chart */}
          <div className="glass-panel p-6 rounded-3xl border-white/5 flex flex-col gap-4 text-left">
            <div>
              <h3 className="font-bold text-white text-base">Simulated Earning Analytics</h3>
              <p className="text-dark-400 text-xs">Tracking monthly payouts across completed bookings.</p>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="#5a5a6e" fontSize={10} />
                  <Tooltip contentStyle={{ background: '#181820', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <Line type="monotone" dataKey="amount" stroke="#eb791a" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ACTIVE BOOKINGS/JOBS LOG */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col gap-4">
            <h3 className="font-bold text-white text-base">Service Jobs Log</h3>
            <div className="flex flex-col gap-3">
              {bookings.length === 0 ? (
                <div className="text-center py-6 text-dark-400 text-xs">Your job request history logs are empty.</div>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="p-3 bg-dark-900 border border-white/5 rounded-xl flex flex-col gap-3 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-1">
                        <h4 className="font-bold text-white">{b.service_type} Work</h4>
                        <p className="text-[10px] text-dark-300">{b.address}</p>
                        {b.scheduled_time && b.booking_type === 'scheduled' && (
                          <p className="text-[10px] text-indigo-400 font-bold">📅 Scheduled: {new Date(b.scheduled_time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        )}
                        {b.booking_type === 'emergency' && (
                          <p className="text-[10px] text-red-400 font-bold">🚨 SOS Emergency</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-bold text-brand-400">₹{Number(b.total_amount || 0).toFixed(2)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${b.status === 'completed' ? 'bg-green-500/10 text-green-400' : b.status === 'started' ? 'bg-brand-500/10 text-brand-400 pulse-active' : 'bg-yellow-500/10 text-yellow-400'}`}>
                          {b.status}
                        </span>
                      </div>
                    </div>

                    {/* PHOTO UPLOAD PANEL for started jobs */}
                    {b.status === 'started' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-brand-500/5 border border-brand-500/20 p-3.5 rounded-xl flex flex-col gap-3"
                      >
                        <p className="font-bold text-brand-400 text-[10px] uppercase tracking-wider">📷 Upload Work Proof Photos</p>

                        {photoUploadSuccess && photoUploadBookingId === b.id && (
                          <p className="text-green-400 text-[10px] font-bold bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                            ✅ {photoUploadSuccess}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          {/* Before photo upload */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-dark-400 text-[10px] font-bold uppercase tracking-wider">Before Work</label>
                            <label
                              htmlFor={`before-photo-${b.id}`}
                              className="flex flex-col items-center justify-center gap-1 py-3 border border-dashed border-yellow-500/40 rounded-xl cursor-pointer bg-yellow-500/5 hover:bg-yellow-500/10 transition-all"
                            >
                              <Camera className="w-5 h-5 text-yellow-400" />
                              <span className="text-[9px] font-bold text-yellow-400">Upload Before</span>
                            </label>
                            <input
                              id={`before-photo-${b.id}`}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setPhotoUploadBookingId(b.id);
                                  handlePhotoUpload(b.id, 'before', e.target.files[0]);
                                }
                              }}
                            />
                          </div>

                          {/* After photo upload */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-dark-400 text-[10px] font-bold uppercase tracking-wider">After Work</label>
                            <label
                              htmlFor={`after-photo-${b.id}`}
                              className="flex flex-col items-center justify-center gap-1 py-3 border border-dashed border-green-500/40 rounded-xl cursor-pointer bg-green-500/5 hover:bg-green-500/10 transition-all"
                            >
                              {photoUploading && photoUploadBookingId === b.id ? (
                                <span className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Upload className="w-5 h-5 text-green-400" />
                              )}
                              <span className="text-[9px] font-bold text-green-400">Upload After</span>
                            </label>
                            <input
                              id={`after-photo-${b.id}`}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setPhotoUploadBookingId(b.id);
                                  handlePhotoUpload(b.id, 'after', e.target.files[0]);
                                }
                              }}
                            />
                          </div>
                        </div>

                        <p className="text-[9px] text-dark-400">Upload before + after photos to submit work proof. Customer will verify to confirm payment.</p>
                      </motion.div>
                    )}

                    {/* Action buttons based on booking status */}
                    <div className="flex gap-2 mt-2 pt-2 border-t border-white/5 justify-end">
                      {b.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRespondToBooking(b.id, 'reject', b)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/20 font-bold hover:bg-red-500 hover:text-white transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRespondToBooking(b.id, 'accept', b)}
                            className="px-3 py-1.5 rounded-lg bg-green-500 text-white font-bold hover:opacity-90 transition-opacity"
                          >
                            Accept Job
                          </button>
                        </>
                      )}
                      {b.status !== 'completed' && b.status !== 'cancelled' && b.status !== 'pending' && (
                        <button
                          type="button"
                          onClick={() => navigate('/booking', { state: { booking: b } })}
                          className="px-3 py-1.5 rounded-lg bg-brand-500/20 border border-brand-500/20 text-brand-400 font-extrabold hover:bg-brand-500 hover:text-white transition-all flex items-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Track & Update Status
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: GPS Simulators & Cooperative team builder */}
        <div className="flex flex-col gap-6">
          
          {/* GPS SIGNAL TRANSMITTER */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-500" />
                <h3 className="font-bold text-white text-base">GPS Location System</h3>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${gpsMode === 'real' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-brand-500/20 text-brand-400 border border-brand-500/30'}`}>
                {gpsMode}
              </span>
            </div>
            <p className="text-xs text-dark-300">
              Transmit coordinates to allow customers to discover and track you in real-time.
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-dark-400 font-bold">GPS Tracking Mode</label>
              <select
                value={gpsMode}
                onChange={(e) => {
                  unlockAudioContext();
                  setGpsMode(e.target.value);
                }}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs bg-dark-900 border border-white/5 text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="simulated">Pune Simulated Drift (Mock Fallback)</option>
                <option value="real">Real Geolocation (watchPosition)</option>
              </select>
            </div>
            
            <form onSubmit={handleTransmitGPS} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-dark-400 font-bold">Latitude</span>
                  <input
                    type="text"
                    value={lat}
                    disabled={gpsMode === 'real'}
                    onChange={e => setLat(e.target.value)}
                    className="glass-input px-3 py-1.5 rounded-lg disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-dark-400 font-bold">Longitude</span>
                  <input
                    type="text"
                    value={lng}
                    disabled={gpsMode === 'real'}
                    onChange={e => setLng(e.target.value)}
                    className="glass-input px-3 py-1.5 rounded-lg disabled:opacity-50"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={gpsMode === 'real'}
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-dark-850 disabled:text-dark-400 text-white font-bold rounded-xl text-xs transition-all uppercase tracking-wider"
              >
                {gpsMode === 'real' ? 'Real Geolocation Active' : 'Transmit Live Coordinates'}
              </button>
            </form>
          </div>

          {/* COOPERATIVE SQUAD/LABOUR GROUP BUILDER */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-500" />
              <h3 className="font-bold text-white text-base">Cooperative Groups</h3>
            </div>

            {user?.group_id ? (
              <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-xs text-left">
                <p className="font-bold text-white">Cooperative Status: Active</p>
                <p className="text-dark-300 mt-1">You are currently registered in Shivaji Construction cooperative. All joint contractor bookings will be split equally among members.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-xs">
                <p className="text-dark-300">Join a cooperative to complete massive projects together and split earnings equally.</p>
                
                {/* Form to create */}
                <form onSubmit={handleCreateGroup} className="flex flex-col gap-2 pt-2 border-t border-white/5">
                  <span className="font-bold text-white text-left">Start a New Cooperative</span>
                  <input 
                    type="text" 
                    placeholder="e.g. Shivaji Builders Group" 
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    className="glass-input px-3 py-1.5 rounded-lg"
                  />
                  <input 
                    type="text" 
                    placeholder="Cooperative description..." 
                    value={newGroupDesc}
                    onChange={e => setNewGroupDesc(e.target.value)}
                    className="glass-input px-3 py-1.5 rounded-lg"
                  />
                  <button type="submit" disabled={coopLoading} className="w-full py-2 bg-brand-500 text-white font-bold rounded-lg mt-1">
                    {coopLoading ? 'Creating...' : 'Form Team Cooperative'}
                  </button>
                </form>

                {/* List available groups to join */}
                <div className="flex flex-col gap-2 pt-2 border-t border-white/5 text-left">
                  <span className="font-bold text-white">Join Existing Squad</span>
                  {coopGroups.length === 0 ? (
                    <span className="text-dark-400">No squads active to join.</span>
                  ) : (
                    coopGroups.map(g => (
                      <div key={g.id} className="p-2.5 bg-dark-900 border border-white/5 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">{g.name}</p>
                          <p className="text-[10px] text-dark-400">{g.description || 'Cooperative group'}</p>
                        </div>
                        <button 
                          onClick={() => handleJoinGroup(g.id)}
                          className="bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded"
                        >
                          Join
                        </button>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default WorkerDashboard;
