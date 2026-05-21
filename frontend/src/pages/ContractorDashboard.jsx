// CONTRACTOR WORKSPACE & DASHBOARD PANEL
// Implements civil project organizers, team recruitment hubs, attendance tracking grids,
// bulk wallets processing, and workforce analytics charts.

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { 
  Plus, Users, Award, ShieldAlert, PlusCircle, CheckCircle, Navigation, Calendar, ClipboardList
} from 'lucide-react';

const ContractorDashboard = () => {
  const { user, wallet, fetchWallet } = useAuthStore();

  const [groups, setGroups] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // Scaffolding forms
  const [roleReq, setRoleReq] = useState('Mason');
  const [teamName, setTeamName] = useState('Shivam Civil Projects Site C');
  const [budget, setBudget] = useState('4500');
  const [address, setAddress] = useState('Metropolis Center A, Pune, MH');

  // Attendance state tracking
  const [activeAttendanceBooking, setActiveAttendanceBooking] = useState(null);
  const [attendanceSheet, setAttendanceSheet] = useState([]);
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchGroups();
    fetchWorkers();
    fetchBookings();
    fetchWallet();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get('/api/groups');
      setGroups(res.data);
    } catch (err) {
      console.warn('Failed to load cooperatives.');
    }
  };

  const fetchWorkers = async () => {
    try {
      // Fetch online workers
      const res = await axios.get('/api/workers/nearby', {
        params: { latitude: 18.5204, longitude: 73.8567, maxDistance: 25 }
      });
      setWorkers(res.data);
    } catch (err) {
      console.warn('Failed to load workers list.');
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get('/api/bookings/my');
      setBookings(res.data);
    } catch (err) {
      console.warn('Failed to load contractor booking log.');
    }
  };

  const handlePostHiring = async (e) => {
    e.preventDefault();
    if (!budget || !address) return;

    try {
      // Find an online worker matching the requested role to send booking request
      const worker = workers.find(w => w.skills.includes(roleReq));
      if (!worker) {
        alert(`No online ${roleReq}s found. Try searching for other skills (Mason, Plumber, Painter).`);
        return;
      }

      await axios.post('/api/bookings/create', {
        worker_id: worker.user_id,
        service_type: roleReq,
        booking_type: 'scheduled',
        total_amount: parseFloat(budget),
        address
      });

      setBudget('');
      await fetchBookings();
      await fetchWallet();
      alert('Workforce request dispatched successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to dispatch workforce booking.');
    }
  };

  const handleHireGroup = async (group) => {
    try {
      const amt = 2500.00; // Standard team daily project cost

      await axios.post('/api/bookings/create', {
        group_id: group.id,
        service_type: 'Construction Worker',
        booking_type: 'scheduled',
        total_amount: amt,
        address: 'Shivam Highway Project Site B, Pune'
      });

      await fetchBookings();
      await fetchWallet();
      alert(`Cooperative team '${group.name}' hired! Waiting for leader acceptance.`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to hire cooperative.');
    }
  };

  const handleOpenAttendance = async (booking) => {
    setActiveAttendanceBooking(booking);
    // Fetch logs if exists
    try {
      const res = await axios.get('/api/groups/attendance', { params: { bookingId: booking.id } });
      setAttendanceSheet(res.data);
    } catch (err) {
      setAttendanceSheet([]);
    }
  };

  const handleLogAttendanceStatus = async (workerId, status) => {
    if (!activeAttendanceBooking) return;

    try {
      await axios.post('/api/groups/attendance', {
        bookingId: activeAttendanceBooking.id,
        workerId,
        date: attDate,
        status
      });

      // Reload
      const res = await axios.get('/api/groups/attendance', { params: { bookingId: activeAttendanceBooking.id } });
      setAttendanceSheet(res.data);
      alert('Attendance status logged successfully.');
    } catch (err) {
      alert('Failed to log attendance.');
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 text-left">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Contractor Control Panel</h1>
          <p className="text-dark-300 text-sm">Post projects, recruit team cooperatives, track logs and batch-pay workers.</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl flex flex-col text-right">
          <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Simulated Capital</span>
          <span className="text-xl font-extrabold text-brand-400 mt-0.5">₹{wallet?.balance || 0.00}</span>
        </div>
      </div>

      {/* CORE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT TWO COLUMNS: Post jobs + Cooperatives listings */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Post workforce request */}
          <div className="glass-panel p-6 rounded-3xl border-white/5">
            <h3 className="text-lg font-bold text-white mb-4">Post Dynamic Workforce Requirement</h3>
            
            <form onSubmit={handlePostHiring} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-dark-300 font-bold">Project Name / Site Address</label>
                <input 
                  type="text" 
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-dark-300 font-bold">Select Role Skill Needed</label>
                <select 
                  value={roleReq}
                  onChange={e => setRoleReq(e.target.value)}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs"
                >
                  <option value="Mason">Mason (Civil Masonry)</option>
                  <option value="Plumber">Plumbing Expert</option>
                  <option value="Painter">Painter / Decorator</option>
                  <option value="Electrician">Licensed Electrician</option>
                  <option value="AC Repair">AC Mechanic</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-dark-300 font-bold">Total Work Budget (₹)</label>
                <input 
                  type="number" 
                  value={budget} 
                  onChange={e => setBudget(e.target.value)}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-dark-300 font-bold">Job Site Coordinates / City location</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="glass-input px-3.5 py-2.5 rounded-xl text-xs" 
                />
              </div>

              <button 
                type="submit" 
                className="md:col-span-2 py-3 bg-orange-gradient text-white font-extrabold rounded-xl text-xs neon-glow-orange mt-2 flex items-center justify-center gap-1 shadow-glass"
              >
                <Plus className="w-4 h-4" /> Dispatch Mass Workforce Order
              </button>
            </form>
          </div>

          {/* HIRE COOPERATIVE LABOUR GROUPS */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">Hiring Cooperative Labour Groups</h3>
            
            {groups.length === 0 ? (
              <div className="glass-panel p-8 text-center text-dark-400 text-xs rounded-2xl border-white/5">No active cooperatives online currently.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((g) => (
                  <div key={g.id} className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col gap-3.5 text-left hover:border-brand-500/20 transition-all duration-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-white text-base">{g.name}</h4>
                        <p className="text-xs text-dark-300 mt-1">{g.description || 'All-round civil construction squad.'}</p>
                      </div>
                      <span className="text-xs font-bold text-brand-400 flex items-center gap-0.5"><Award className="w-4 h-4" /> {g.rating}</span>
                    </div>

                    <div className="flex justify-between text-xs border-t border-white/5 pt-3">
                      <span className="text-dark-400">Total Workforce Size</span>
                      <span className="text-white font-bold">{g.member_count} active workers</span>
                    </div>

                    <button 
                      onClick={() => handleHireGroup(g)}
                      className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-colors mt-1"
                    >
                      Hire Entire Team (₹2500/day)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Ongoing bookings, attendance tracker sheets */}
        <div className="flex flex-col gap-6">

          {/* CONTRACTOR PROFILE SNAPSHOT */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={user?.avatar_url || user?.profile_image || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80'} 
                alt="avatar" 
                className="w-12 h-12 rounded-full border border-brand-500 object-cover shrink-0" 
              />
              <div className="text-left flex-1 min-w-0">
                <h3 className="font-extrabold text-white text-base truncate">{user?.full_name || user?.name || 'Contractor'}</h3>
                <span className="text-[9px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Enterprise Contractor</span>
              </div>
            </div>
            
            <div className="border-t border-white/5 my-0.5" />
            
            <div className="flex flex-col gap-2 text-xs text-dark-300">
              <div className="flex justify-between items-center gap-2">
                <span className="text-dark-400 shrink-0 font-medium">Company Name:</span>
                <span className="text-white font-semibold truncate max-w-[150px]">{user?.company_name || 'Independent Enterprise'}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-dark-400 shrink-0 font-medium">Active Sites:</span>
                <span className="text-brand-400 font-extrabold">{user?.projects_count || 0} Projects</span>
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
          
          {/* BOOKINGS LIST */}
          <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col gap-4">
            <h3 className="font-bold text-white text-base">Active Site Projects ({bookings.length})</h3>
            
            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
              {bookings.length === 0 ? (
                <div className="text-center py-6 text-dark-400 text-xs">No active contract bookings.</div>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="p-3 bg-dark-900 border border-white/5 rounded-xl text-xs flex flex-col gap-2.5">
                    <div className="flex justify-between">
                      <span className="font-bold text-white">{b.service_type} Squad</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${b.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                        {b.status}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-dark-300">Daily cost: ₹{b.total_amount}</span>
                      <span className="text-dark-400">{b.address}</span>
                    </div>

                    <div className="border-t border-white/5 my-1" />

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenAttendance(b)}
                        className="flex-1 py-1.5 bg-brand-500/15 border border-brand-500/10 text-brand-400 hover:bg-brand-500 hover:text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                      >
                        <ClipboardList className="w-3 h-3" /> Log Daily Attendance
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ATTENDANCE SHEET SYSTEM OVERLAY/DRAWER */}
          {activeAttendanceBooking && (
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel p-5 rounded-2xl border-brand-500/20 bg-brand-500/5 flex flex-col gap-4 text-left"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-white text-base">Attendance Roster</h4>
                <button onClick={() => setActiveAttendanceBooking(null)} className="text-xs text-brand-500 hover:underline">Close</button>
              </div>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-dark-300">Set Log Date:</span>
                  <input 
                    type="date" 
                    value={attDate} 
                    onChange={e => setAttDate(e.target.value)}
                    className="glass-input px-2.5 py-1 rounded-lg text-[11px]" 
                  />
                </div>

                <div className="border-t border-white/5 my-1" />

                {/* Worker check boxes */}
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                  {/* Since worker_id is assigned directly, show single worker, or show cooperative members if booking is group */}
                  {activeAttendanceBooking.worker_id ? (
                    <div className="flex justify-between items-center p-2 bg-dark-900 border border-white/5 rounded-lg">
                      <span className="font-bold text-white">{activeAttendanceBooking.worker_name || 'Assigned Worker'}</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleLogAttendanceStatus(activeAttendanceBooking.worker_id, 'present')} className="bg-green-500 text-white text-[9px] font-bold px-2 py-1 rounded">Present</button>
                        <button onClick={() => handleLogAttendanceStatus(activeAttendanceBooking.worker_id, 'absent')} className="bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded">Absent</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-dark-400">Cooperative squad loading... Check logs directly.</div>
                  )}
                </div>

                {/* Attendance histories */}
                <div className="mt-3">
                  <span className="font-bold text-white">Daily Logs</span>
                  <div className="flex flex-col gap-1.5 mt-2">
                    {attendanceSheet.length === 0 ? (
                      <span className="text-dark-400 text-[10px]">No logs recorded for this booking.</span>
                    ) : (
                      attendanceSheet.map((a, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] p-1.5 bg-dark-950 rounded">
                          <span className="text-dark-300">{a.worker_name} ({a.date})</span>
                          <span className={`font-bold ${a.status === 'present' ? 'text-green-400' : 'text-red-400'}`}>{a.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </div>

      </div>

    </div>
  );
};

export default ContractorDashboard;
