// CUSTOMER DASHBOARD PANEL
// Integrates a radial spatial search panel, interactive service catalog cards,
// simulated map visualizer, active booking monitors, and review portals.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { 
  Search, Star, Navigation, MapPin, Calendar, Clock, AlertTriangle, ShieldCheck, CheckCircle2, MessageSquare, Phone
} from 'lucide-react';

const SERVICES = [
  { name: 'Plumber', icon: '🚰' },
  { name: 'Electrician', icon: '⚡' },
  { name: 'Carpenter', icon: '🪚' },
  { name: 'Mason', icon: '🧱' },
  { name: 'AC Repair', icon: '❄️' },
  { name: 'Cleaner', icon: '🧹' },
  { name: 'Driver', icon: '🚗' },
  { name: 'Labour Helper', icon: '💪' },
  { name: 'Construction Worker', icon: '🏗️' },
  { name: 'Welding Worker', icon: '🔥' }
];

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, wallet, fetchWallet, socket } = useAuthStore();

  const [selectedService, setSelectedService] = useState('Plumber');
  const [workers, setWorkers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Search options
  const [address, setAddress] = useState(user?.address || 'Pune, Maharashtra');
  const [bookingType, setBookingType] = useState('instant'); // instant, scheduled, emergency
  const [maxDistance, setMaxDistance] = useState(10);
  const [selectedWorkerForBook, setSelectedWorkerForBook] = useState(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  // Discovery Tab and Shop States
  const [activeTab, setActiveTab] = useState('workers'); // workers or shops
  const [shops, setShops] = useState([]);
  const [shopCategory, setShopCategory] = useState('');
  const [shopLoading, setShopLoading] = useState(false);

  // Review states
  const [reviewWorker, setReviewWorker] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Search Coordinates (Standard Pune center fallback)
  const centerLat = 18.5204;
  const centerLng = 73.8567;

  useEffect(() => {
    fetchWorkers();
    fetchBookings();
    fetchWallet();
  }, [selectedService, maxDistance]);

  useEffect(() => {
    if (user?.address) {
      setAddress(user.address);
    }
  }, [user?.address]);

  useEffect(() => {
    if (activeTab === 'shops') {
      fetchShops();
    }
  }, [activeTab, shopCategory, maxDistance]);

  // Socket-driven real-time coordination handlers
  useEffect(() => {
    if (!socket) return;

    const handleNearbyWorkerGps = (data) => {
      console.log('📡 [CUSTOMER-GPS] Live coordinates tick received for provider:', data);
      setWorkers(prevWorkers => {
        const exists = prevWorkers.some(w => w.user_id === data.workerId);
        if (!exists) return prevWorkers; // Only update existing in radius
        
        return prevWorkers.map(w => {
          if (w.user_id === data.workerId) {
            const distance = Math.sqrt(
              Math.pow(data.latitude - centerLat, 2) + 
              Math.pow(data.longitude - centerLng, 2)
            ) * 111.32;
            
            return {
              ...w,
              latitude: data.latitude,
              longitude: data.longitude,
              distance
            };
          }
          return w;
        });
      });
    };

    const handleNearbyWorkerStatus = (data) => {
      console.log('📡 [CUSTOMER-STATUS] Status update received:', data);
      if (data.status === 'offline' || data.status === 'busy') {
        setWorkers(prevWorkers => prevWorkers.filter(w => w.user_id !== data.workerId));
      } else {
        fetchWorkers();
      }
    };

    const handleDbSync = (payload) => {
      console.log('🔄 [CUSTOMER-SYNC] DB auto-refresh payload:', payload);
      if (payload.type === 'bookings') fetchBookings();
      if (payload.type === 'wallet') fetchWallet();
    };

    socket.on('nearby-worker-gps', handleNearbyWorkerGps);
    socket.on('nearby-worker-status-changed', handleNearbyWorkerStatus);
    socket.on('db-sync-refresh', handleDbSync);

    return () => {
      socket.off('nearby-worker-gps', handleNearbyWorkerGps);
      socket.off('nearby-worker-status-changed', handleNearbyWorkerStatus);
      socket.off('db-sync-refresh', handleDbSync);
    };
  }, [socket]);

  const fetchShops = async () => {
    setShopLoading(true);
    try {
      const res = await axios.get('/api/shops/nearby', {
        params: {
          latitude: centerLat,
          longitude: centerLng,
          category: shopCategory || undefined,
          maxDistance
        }
      });
      setShops(res.data);
    } catch (err) {
      console.error('Failed to load nearby shops:', err.message);
    } finally {
      setShopLoading(false);
    }
  };

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/workers/nearby', {
        params: {
          latitude: centerLat,
          longitude: centerLng,
          skill: selectedService,
          maxDistance
        }
      });
      setWorkers(res.data);
    } catch (err) {
      console.error('Failed to load nearby workers:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get('/api/bookings/my');
      setBookings(res.data);
    } catch (err) {
      console.error('Failed to load bookings:', err.message);
    }
  };

  const handleBooking = async () => {
    if (!selectedWorkerForBook) return;
    
    // Validate scheduled booking
    if (bookingType === 'scheduled' && (!scheduledDate || !scheduledTime)) {
      alert('Please select both a date and time for your scheduled booking.');
      return;
    }
    
    setBookingLoading(true);

    try {
      const rate = parseFloat(selectedWorkerForBook.hourly_rate);
      const total = rate * 2; // Assume 2 hour minimum service callout fee
      
      let scheduled_time = null;
      if (bookingType === 'scheduled' && scheduledDate && scheduledTime) {
        scheduled_time = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      }

      const payload = {
        worker_id: selectedWorkerForBook.user_id,
        service_type: selectedService,
        booking_type: bookingType,
        scheduled_time,
        total_amount: bookingType === 'emergency' ? total * 1.5 : total, // SOS surcharge
        latitude: centerLat,
        longitude: centerLng,
        address,
        notes: bookingNotes || undefined
      };

      const res = await axios.post('/api/bookings/create', payload);
      
      // Clear selections and reload
      setSelectedWorkerForBook(null);
      setScheduledDate('');
      setScheduledTime('');
      setBookingNotes('');
      await fetchBookings();
      await fetchWallet();

      // Automatically redirect to tracking page
      navigate('/booking', { state: { booking: res.data.booking } });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to request booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewWorker) return;

    try {
      await axios.post('/api/bookings/review', {
        bookingId: reviewWorker.id,
        revieweeId: reviewWorker.worker_id,
        rating: reviewRating,
        comment: reviewComment
      });

      setReviewWorker(null);
      setReviewComment('');
      await fetchBookings();
    } catch (err) {
      alert('Failed to submit review.');
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 text-left">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Book a Service Provider</h1>
          <p className="text-dark-300 text-sm">Select a category to scan online verified professionals nearby.</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-3">
          <MapPin className="w-5 h-5 text-brand-500 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Search Coordinate Center</span>
            <input 
              type="text" 
              value={address} 
              onChange={e => setAddress(e.target.value)}
              className="text-xs font-bold text-white bg-transparent border-0 focus:ring-0 p-0 outline-none w-48 truncate"
            />
          </div>
        </div>
      </div>

      {/* CORE ACTION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Service Pickers & Worker discovery list */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Services Category List */}
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((s) => (
              <button
                key={s.name}
                onClick={() => setSelectedService(s.name)}
                className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${selectedService === s.name ? 'bg-brand-500 border-brand-500 text-white neon-glow-orange shadow-glass' : 'bg-white/5 border-white/5 text-dark-200 hover:border-white/10'}`}
              >
                <span className="text-base">{s.icon}</span>
                {s.name}
              </button>
            ))}
          </div>

          {/* Search radius slider */}
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-4 border-white/5">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Search Radius Limit:</span>
            <div className="flex-1 flex items-center gap-3">
              <input 
                type="range" 
                min="2" 
                max="25" 
                value={maxDistance}
                onChange={e => setMaxDistance(parseInt(e.target.value))}
                className="w-full h-1.5 bg-dark-900 rounded-lg appearance-none cursor-pointer accent-brand-500" 
              />
              <span className="text-xs font-extrabold text-brand-400 shrink-0">{maxDistance} KM</span>
            </div>
          </div>

          {/* TABS CONTROLS */}
          <div className="flex border-b border-white/5 my-2">
            <button
              onClick={() => setActiveTab('workers')}
              className={`py-2.5 px-6 font-bold text-xs transition-all border-b-2 uppercase tracking-wider ${activeTab === 'workers' ? 'border-brand-500 text-brand-400' : 'border-transparent text-dark-300 hover:text-white'}`}
            >
              Verified Workers Nearby ({workers.length})
            </button>
            <button
              onClick={() => setActiveTab('shops')}
              className={`py-2.5 px-6 font-bold text-xs transition-all border-b-2 uppercase tracking-wider ${activeTab === 'shops' ? 'border-brand-500 text-brand-400' : 'border-transparent text-dark-300 hover:text-white'}`}
            >
              Material & Service Shops ({shops.length})
            </button>
          </div>

          {activeTab === 'workers' ? (
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Online {selectedService}s Found Nearby
              </h3>

              {loading ? (
                <div className="flex justify-center py-12"><span className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : workers.length === 0 ? (
                <div className="glass-panel p-12 rounded-3xl text-center border-white/5 text-dark-400 flex flex-col items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-brand-400" />
                  <p>No active {selectedService}s found within {maxDistance}km distance.</p>
                  <p className="text-xs text-dark-500">Tip: Increase the search radius or toggle other services.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workers.map((w) => (
                    <div key={w.user_id} className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col gap-4 hover:border-brand-500/20 transition-all duration-300">
                      <div className="flex gap-4">
                        <img src={w.avatar_url} alt="avatar" className="w-12 h-12 rounded-full border border-white/10 object-cover shrink-0" />
                        <div className="flex-1 text-left flex flex-col">
                          <h4 className="text-sm font-bold text-white">{w.name}</h4>
                          <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-bold w-fit mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-active" /> Active Nearby
                          </span>
                          <p className="text-xs text-dark-300 mt-2 line-clamp-2">{w.bio || 'Professional and highly experienced handler.'}</p>
                        </div>
                      </div>

                      {/* Today's Booking Schedule & Availability */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs flex flex-col gap-2">
                        <span className="text-[10px] text-dark-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-brand-400" /> Today's Schedule
                        </span>
                        {w.active_bookings && w.active_bookings.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {w.active_bookings.map((booking) => {
                              const startStr = new Date(booking.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                              const endStr = new Date(booking.end_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                              return (
                                <div key={booking.id} className="flex flex-col gap-1 text-white/90 bg-white/5 p-2 rounded-lg border border-white/5 text-left">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-brand-400">Booked: {booking.formatted}</span>
                                    <span className="text-[9px] bg-brand-500/20 border border-brand-500/20 px-2 py-0.5 rounded text-brand-400 font-bold uppercase">{booking.service_type}</span>
                                  </div>
                                  <span className="text-[10px] text-green-400 font-semibold italic">
                                    * Free before {startStr} and after {endStr}.
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-green-400 font-bold flex items-center gap-1.5 bg-green-500/5 border border-green-500/10 p-2 rounded-lg">
                            <CheckCircle2 className="w-4 h-4" /> ✅ Fully Free Today
                          </span>
                        )}
                      </div>

                      {/* Stats & rating grid */}
                      <div className="grid grid-cols-3 gap-2 border-t border-b border-white/5 py-3 text-center text-xs">
                        <div>
                          <p className="text-dark-400 font-medium">Hourly Charge</p>
                          <p className="text-white font-extrabold mt-0.5">₹{w.hourly_rate}</p>
                        </div>
                        <div>
                          <p className="text-dark-400 font-medium">Ratings</p>
                          <p className="text-brand-400 font-extrabold mt-0.5 flex items-center justify-center gap-0.5"><Star className="w-3.5 h-3.5 fill-current" /> {w.rating}</p>
                        </div>
                        <div>
                          <p className="text-dark-400 font-medium">Jobs Done</p>
                          <p className="text-white font-extrabold mt-0.5">{w.completed_jobs_count} completed</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-xs mt-1">
                        <span className="text-dark-300 flex items-center gap-1"><Navigation className="w-3.5 h-3.5 text-brand-500" /> {w.distance.toFixed(1)} km away</span>
                        <button 
                          onClick={() => setSelectedWorkerForBook(w)}
                          className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-xl transition-colors shrink-0"
                        >
                          Select Worker
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              
              {/* Shops category filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShopCategory('')}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition-all ${shopCategory === '' ? 'bg-brand-500 border-brand-500 text-white neon-glow-orange shadow-glass' : 'bg-white/5 border-white/5 text-dark-200 hover:border-white/10'}`}
                >
                  All Categories
                </button>
                {['Hardware', 'Plumbing', 'Electrical', 'Material Supplier'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setShopCategory(cat)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition-all ${shopCategory === cat ? 'bg-brand-500 border-brand-500 text-white neon-glow-orange shadow-glass' : 'bg-white/5 border-white/5 text-dark-200 hover:border-white/10'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {shopLoading ? (
                <div className="flex justify-center py-12"><span className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : shops.length === 0 ? (
                <div className="glass-panel p-12 rounded-3xl text-center border-white/5 text-dark-400 flex flex-col items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-brand-400" />
                  <p>No service & material shops found within {maxDistance}km radius.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shops.map((s) => (
                    <div key={s.id} className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col gap-4 hover:border-brand-500/20 transition-all duration-300">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/15 flex items-center justify-center text-xl shrink-0">
                          {s.category === 'Hardware' ? '🛠️' : s.category === 'Electrical' ? '💡' : s.category === 'Plumbing' ? '🔧' : '🧱'}
                        </div>
                        <div className="flex-1 text-left flex flex-col">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-sm font-bold text-white leading-tight">{s.name}</h4>
                            <span className="text-[9px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded-full font-bold uppercase shrink-0">{s.category}</span>
                          </div>
                          <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-bold w-fit mt-1.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-active" /> Open Now
                          </span>
                          <p className="text-xs text-dark-300 mt-2 line-clamp-1">{s.address}</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 border-t border-b border-white/5 py-3 text-center text-xs">
                        <div>
                          <p className="text-dark-400 font-medium">Ratings</p>
                          <p className="text-brand-400 font-extrabold mt-0.5 flex items-center justify-center gap-0.5"><Star className="w-3.5 h-3.5 fill-current" /> {s.rating}</p>
                        </div>
                        <div>
                          <p className="text-dark-400 font-medium">Distance</p>
                          <p className="text-white font-extrabold mt-0.5">{s.distance.toFixed(1)} km</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-xs mt-1">
                        <a 
                          href={`tel:${s.phone}`}
                          className="text-dark-300 hover:text-white flex items-center gap-1.5 font-bold border border-white/5 hover:border-white/10 bg-white/5 px-3 py-2 rounded-xl transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-brand-400" /> {s.phone}
                        </a>
                        <button 
                          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`, '_blank')}
                          className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-xl transition-colors shrink-0"
                        >
                          Get Directions
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Booking confirmations, active trackers & history logs */}
        <div className="flex flex-col gap-6">

          {/* CUSTOMER PROFILE SNAPSHOT */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={user?.avatar_url || user?.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                alt="avatar" 
                className="w-12 h-12 rounded-full border border-brand-500 object-cover shrink-0" 
              />
              <div className="text-left flex-1 min-w-0">
                <h3 className="font-extrabold text-white text-base truncate">{user?.full_name || user?.name || 'Customer'}</h3>
                <span className="text-[9px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Customer Profile</span>
              </div>
            </div>
            
            <div className="border-t border-white/5 my-0.5" />
            
            <div className="flex flex-col gap-2 text-xs text-dark-300">
              <div className="flex justify-between items-start gap-2">
                <span className="text-dark-400 shrink-0 font-medium">Home Location:</span>
                <span className="text-white text-right font-semibold break-words">{user?.address || 'No address set'}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-dark-400 shrink-0 font-medium">Phone Contact:</span>
                <span className="text-white font-semibold">{user?.phone || 'No phone set'}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-dark-400 shrink-0 font-medium">Email Account:</span>
                <span className="text-white font-semibold truncate max-w-[150px]">{user?.email || 'No email set'}</span>
              </div>
            </div>
          </div>
          
          {/* WALLET SNAPSHOT */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col gap-3">
            <span className="text-xs font-bold text-dark-400 uppercase tracking-wider">Simulated Wallet Status</span>
            <div className="flex justify-between items-center">
              <p className="text-2xl font-extrabold text-white">₹{Number(wallet?.balance || 0).toFixed(2)}</p>
              <button 
                onClick={() => navigate('/wallet')}
                className="text-xs font-bold text-brand-400 hover:underline bg-brand-500/10 px-3 py-1.5 rounded-lg border border-brand-500/10"
              >
                Add Mock Funds
              </button>
            </div>
          </div>

          {/* ACTIVE BOOKINGS SELECTOR DIALOG */}
          {selectedWorkerForBook && (
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`glass-panel p-6 rounded-2xl flex flex-col gap-4 text-left ${bookingType === 'emergency' ? 'border-red-500/30 bg-red-500/5' : 'border-brand-500/20 bg-brand-500/5'}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">Booking Confirmation</h3>
                {bookingType === 'emergency' && (
                  <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">🚨 SOS Emergency</span>
                )}
              </div>
              <p className="text-xs text-dark-300">Requesting <strong className="text-white">{selectedService}</strong> from <strong className="text-brand-400">{selectedWorkerForBook.name}</strong>.</p>
              
              {/* Selector options */}
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-dark-400">Worker Hourly Cost</span>
                  <span className="text-white font-bold">₹{Number(selectedWorkerForBook.hourly_rate || 0).toFixed(0)}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">{bookingType === 'emergency' ? 'SOS Emergency Callout (2hrs + 50% surge)' : 'Callout Minimum (2hrs)'}</span>
                  <span className="text-white font-bold">₹{bookingType === 'emergency' ? (Number(selectedWorkerForBook.hourly_rate || 0) * 3).toFixed(0) : (Number(selectedWorkerForBook.hourly_rate || 0) * 2).toFixed(0)}</span>
                </div>
                <div className="border-t border-white/5 my-1" />
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-white">Project Total</span>
                  <span className={`font-extrabold ${bookingType === 'emergency' ? 'text-red-400' : 'text-brand-400'}`}>₹{bookingType === 'emergency' ? (Number(selectedWorkerForBook.hourly_rate || 0) * 3).toFixed(0) : (Number(selectedWorkerForBook.hourly_rate || 0) * 2).toFixed(0)}</span>
                </div>
              </div>

              {/* Booking type toggles */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'instant', label: '⚡ Instant', color: 'brand' },
                  { id: 'scheduled', label: '📅 Schedule', color: 'indigo' },
                  { id: 'emergency', label: '🚨 SOS', color: 'red' }
                ].map(bT => (
                  <button
                    key={bT.id}
                    type="button"
                    onClick={() => setBookingType(bT.id)}
                    className={`py-2 rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                      bookingType === bT.id 
                        ? bT.id === 'emergency' 
                          ? 'bg-red-500 border-red-500 text-white' 
                          : 'bg-brand-500 border-brand-500 text-white' 
                        : 'bg-transparent border-white/10 text-dark-200'
                    }`}
                  >
                    {bT.label}
                  </button>
                ))}
              </div>

              {/* Scheduled booking date/time pickers */}
              {bookingType === 'scheduled' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex flex-col gap-3 bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-xl text-xs"
                >
                  <p className="text-indigo-400 font-bold">📅 Schedule Date & Time</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-dark-400 font-bold uppercase tracking-wider text-[10px]">Date</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={scheduledDate}
                        onChange={e => setScheduledDate(e.target.value)}
                        className="glass-input px-3 py-2 rounded-xl text-[11px] focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-dark-400 font-bold uppercase tracking-wider text-[10px]">Time</label>
                      <input
                        type="time"
                        required
                        value={scheduledTime}
                        onChange={e => setScheduledTime(e.target.value)}
                        className="glass-input px-3 py-2 rounded-xl text-[11px] focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-dark-400 font-bold uppercase tracking-wider text-[10px]">Notes (Optional)</label>
                    <textarea
                      value={bookingNotes}
                      onChange={e => setBookingNotes(e.target.value)}
                      placeholder="e.g. Please bring pipe fittings for 3/4 inch pipes..."
                      rows={2}
                      className="glass-input px-3 py-2 rounded-xl text-[11px] resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {/* SOS emergency info */}
              {bookingType === 'emergency' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-[10px] text-red-400 font-bold"
                >
                  🚨 Emergency mode: 50% surge pricing applies. Worker will be alerted with HIGH PRIORITY alarm. Response expected within 15 minutes.
                </motion.div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedWorkerForBook(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-dark-200 text-xs font-bold hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBooking}
                  disabled={bookingLoading}
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 ${bookingType === 'emergency' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-gradient neon-glow-orange'}`}
                >
                  {bookingLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : bookingType === 'emergency' ? '🚨 Confirm SOS Request' : 'Confirm Booking'}
                </button>
              </div>

            </motion.div>
          )}

          {/* ACTIVE BOOKINGS LIST */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col gap-4">
            <h3 className="font-bold text-white text-base">Booking Tracking ({bookings.length})</h3>
            
            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
              {bookings.length === 0 ? (
                <div className="text-center py-6 text-dark-400 text-xs">No service booking history logs found.</div>
              ) : (
                bookings.map((b) => (
                  <div 
                    key={b.id} 
                    className="p-3 bg-dark-900 border border-white/5 rounded-xl flex flex-col gap-2.5 text-xs hover:border-white/10 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{b.service_type} Request</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${b.status === 'completed' ? 'bg-green-500/10 text-green-400' : b.status === 'started' ? 'bg-brand-500/10 text-brand-400 pulse-active' : 'bg-yellow-500/10 text-yellow-400'}`}>
                        {b.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-dark-300">Total Price: ₹{b.total_amount}</span>
                      <span className="text-dark-400">{new Date(b.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="border-t border-white/5 my-1" />

                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        {b.worker_avatar && <img src={b.worker_avatar} alt="avatar" className="w-5.5 h-5.5 rounded-full object-cover" />}
                        <span className="font-bold text-white text-[11px] truncate">{b.worker_name || 'Assigned Worker'}</span>
                      </div>

                      {/* CTA Actions */}
                      <div className="flex gap-1.5">
                        {b.status !== 'completed' && b.status !== 'cancelled' && (
                          <button 
                            onClick={() => navigate('/booking', { state: { booking: b } })}
                            className="bg-brand-500/20 border border-brand-500/20 text-brand-400 font-extrabold px-2.5 py-1 rounded-md text-[10px] hover:bg-brand-500 hover:text-white transition-all flex items-center gap-1"
                          >
                            <Navigation className="w-3 h-3" /> Track live
                          </button>
                        )}
                        {b.status === 'completed' && (
                          <button 
                            onClick={() => setReviewWorker(b)}
                            className="bg-white/5 text-white font-bold px-2.5 py-1 rounded-md text-[10px] hover:bg-white/10 transition-colors flex items-center gap-1"
                          >
                            <Star className="w-3 h-3 text-brand-400 fill-current" /> Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* RATING & REVIEW FORM PORTAL OVERLAY */}
      {reviewWorker && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel p-6 rounded-3xl border-white/10 max-w-sm w-full flex flex-col gap-4 text-left"
          >
            <h3 className="font-extrabold text-white text-lg">Leave a Rating</h3>
            <p className="text-xs text-dark-300">Rate your completed {reviewWorker.service_type} work with **{reviewWorker.worker_name}**.</p>
            
            <form onSubmit={submitReview} className="flex flex-col gap-4">
              
              {/* Star selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dark-200 uppercase tracking-wider">Select Stars</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 rounded hover:bg-white/5"
                    >
                      <Star className={`w-8 h-8 ${star <= reviewRating ? 'text-brand-400 fill-current' : 'text-dark-400'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dark-200 uppercase tracking-wider">Review Comments</label>
                <textarea
                  required
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="e.g. Excellent service! Highly skilled plumber..."
                  rows={3}
                  className="w-full glass-input px-4 py-2 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="flex gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setReviewWorker(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-dark-100 text-xs font-bold hover:bg-white/5 transition-colors"
                >
                  Close
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-gradient text-white text-xs font-bold neon-glow-orange hover:opacity-95 transition-opacity"
                >
                  Submit Review
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default CustomerDashboard;
