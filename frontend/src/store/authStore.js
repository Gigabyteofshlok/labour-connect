// GLOBAL STATE MANAGEMENT STORE
// Built with Zustand. Controls JWT authentication, wallet balance states, alerts,
// role redirects, socket.io client connections, and an offline operation queue.
// Interacts with the backend via Axios endpoints.

import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

// Add global authorization token to Axios requests
const setupAxiosAuth = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('lc_token') || null,
  isAuthenticated: !!localStorage.getItem('lc_token'),
  loading: false,
  error: null,
  wallet: { balance: 0.00 },
  notifications: [],
  unreadCount: 0,
  socket: null,
  realtimeChannels: null,
  offlineCount: JSON.parse(localStorage.getItem('lc_offline_queue') || '[]').length,

  // Initialize store (check token, fetch user, balance, notifications and set up sockets/realtime)
  init: async () => {
    const { token, fetchMe, fetchWallet, fetchNotifications, initSocket, initRealtimeSync } = get();
    if (token) {
      setupAxiosAuth(token);
      await fetchMe();
      await fetchWallet();
      await fetchNotifications();
      initSocket();
      initRealtimeSync();
    }

    // Set up offline network state listeners
    window.addEventListener('online', () => {
      console.log('🔌 [NETWORK] Browser back online. Flushing queued mutations...');
      get().flushOfflineQueue();
    });
  },

  // Initialize WebSocket Session and fallback listeners
  initSocket: () => {
    const { token, socket, isAuthenticated } = get();
    if (!isAuthenticated || !token) return;
    if (socket) return; // Keep existing session

    const socketUrl =
     window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : 'https://labour-connect-backend.onrender.com';

    console.log(`🔌 [SOCKET.IO] Connecting to WebSocket channel: ${socketUrl}`);

    const newSocket = io(socketUrl, {
      auth: { token },
      reconnectionAttempts: 15,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5
    });

    newSocket.on('connect', () => {
      console.log('🔌 [SOCKET.IO] WebSocket handshake connected successfully.');
      // Reconnection handshake and recovery check
      newSocket.emit('reconnect-recovery', { lastAckTime: new Date() });
    });

    newSocket.on('reconnect-recovery-success', (data) => {
      console.log('🔌 [SOCKET.IO] Reconnect recovery confirmed by server:', data);
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('🔌 [SOCKET.IO] Socket session disconnected. Reason:', reason);
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      console.log(`🔌 [SOCKET.IO] Attempting reconnect connection recovery (${attempt}/15)...`);
    });

    // Listen for transient database synchronization refresh pings from backend simulator fallback
    newSocket.on('db-sync-refresh', (payload) => {
      console.log('🔄 [SOCKET-FALLBACK] Simulated DB update payload received:', payload);
      if (payload.type === 'wallet') get().fetchWallet();
      if (payload.type === 'notifications') get().fetchNotifications();
    });

    set({ socket: newSocket });
  },

  // Initialize Supabase Realtime / Fallback Sync Engine
  initRealtimeSync: () => {
    const { user, socket } = get();
    if (!user) return;

    import('../config/supabase').then(({ supabase }) => {
      if (supabase) {
        console.log('🔌 [SUPABASE] Initiating live database synchronizations...');

        // Subscribe to live wallet changes
        const walletChannel = supabase
          .channel(`wallet-sync:${user.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` },
            (payload) => {
              console.log('🔄 [SUPABASE] Real-time wallet synced:', payload.new);
              if (payload.new) {
                set({ wallet: { balance: payload.new.balance } });
              }
            }
          )
          .subscribe();

        // Subscribe to live notification alerts
        const alertsChannel = supabase
          .channel(`alerts-sync:${user.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
            (payload) => {
              console.log('🔄 [SUPABASE] Real-time notification synced:', payload.new);
              get().fetchNotifications();
            }
          )
          .subscribe();

        // Subscribe to live booking changes
        const bookingsChannel = supabase
          .channel(`bookings-sync:${user.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'bookings' },
            (payload) => {
              console.log('🔄 [SUPABASE] Real-time booking updated:', payload.new);
              if (payload.new && (payload.new.worker_id === user.id || payload.new.customer_id === user.id)) {
                get().fetchNotifications();
              }
            }
          )
          .subscribe();

        set({ realtimeChannels: [walletChannel, alertsChannel, bookingsChannel] });
      } else {
        console.log('🔌 [SIMULATOR] Supabase unavailable. Fully reliant on Socket.io transient DB sync loop.');
      }
    });
  },

  // Disconnect WebSocket Session
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  // Disconnect Supabase channels
  disconnectRealtimeSync: () => {
    const { realtimeChannels } = get();
    if (realtimeChannels) {
      realtimeChannels.forEach(ch => ch.unsubscribe());
      set({ realtimeChannels: null });
    }
  },

  // Log in user
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('lc_token', token);
      setupAxiosAuth(token);

      set({ 
        token, 
        user, 
        isAuthenticated: true, 
        loading: false 
      });

      // Synchronize financial data and alerts
      await get().fetchWallet();
      await get().fetchNotifications();
      get().initSocket();
      get().initRealtimeSync();

      return user;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to authenticate. Check credentials.';
      set({ error: errMsg, loading: false });
      throw new Error(errMsg);
    }
  },

  // Register a new user
  register: async (formData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post('/api/auth/register', formData);
      const { token, user } = response.data;

      localStorage.setItem('lc_token', token);
      setupAxiosAuth(token);

      set({ 
        token, 
        user, 
        isAuthenticated: true, 
        loading: false 
      });

      await get().fetchWallet();
      await get().fetchNotifications();
      get().initSocket();
      get().initRealtimeSync();

      return user;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration failed. Check inputs.';
      set({ error: errMsg, loading: false });
      throw new Error(errMsg);
    }
  },

  // Log out session
  logout: () => {
    localStorage.removeItem('lc_token');
    setupAxiosAuth(null);
    get().disconnectSocket();
    get().disconnectRealtimeSync();
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false,
      wallet: { balance: 0.00 },
      notifications: [],
      unreadCount: 0
    });
  },

  // Fetch logged in profile details
  fetchMe: async () => {
    try {
      const response = await axios.get('/api/auth/me');
      set({ user: response.data });
    } catch (err) {
      // Clear expired credentials
      get().logout();
    }
  },

  // Synchronize wallet balances
  fetchWallet: async () => {
    if (!get().isAuthenticated) return;
    try {
      const response = await axios.get('/api/wallet');
      set({ wallet: response.data });
    } catch (err) {
      console.warn('Failed to sync wallet data.');
    }
  },

  // Deposit simulated funds (UPI)
  depositFunds: async (amount, method) => {
    try {
      const response = await axios.post('/api/wallet/deposit', { amount, paymentMethod: method });
      set({ wallet: { balance: response.data.balance } });
      await get().fetchNotifications();
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to complete deposit simulation.');
    }
  },

  // Fetch user alerts
  fetchNotifications: async () => {
    if (!get().isAuthenticated) return;
    try {
      const response = await axios.get('/api/chat/alerts');
      const notifications = response.data;
      const unreadCount = notifications.filter(n => !n.is_read).length;
      set({ notifications, unreadCount });
    } catch (err) {
      console.warn('Failed to load notifications.');
    }
  },

  // Mark all notifications read
  markNotificationsAsRead: async () => {
    if (!get().isAuthenticated) return;
    try {
      await axios.put('/api/chat/alerts/read');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));
    } catch (err) {
      console.warn('Failed to update alert markers.');
    }
  },

  // Queue mutations for offline capability
  queueOfflineMutation: (url, method, data) => {
    const queue = JSON.parse(localStorage.getItem('lc_offline_queue') || '[]');
    const id = Math.random().toString(36).substr(2, 9);
    queue.push({ id, url, method, data, timestamp: new Date() });
    localStorage.setItem('lc_offline_queue', JSON.stringify(queue));
    set({ offlineCount: queue.length });
    console.warn(`📴 [OFFLINE QUEUE] Action queued: ${method} ${url}`);
  },

  // Process and flush offline queued items when back online
  flushOfflineQueue: async () => {
    if (!navigator.onLine) return;
    const queue = JSON.parse(localStorage.getItem('lc_offline_queue') || '[]');
    if (queue.length === 0) return;

    console.log(`🔌 [OFFLINE QUEUE] Synchronizing ${queue.length} pending operations...`);
    let remaining = [...queue];

    for (const item of queue) {
      try {
        if (item.method === 'POST') {
          await axios.post(item.url, item.data);
        } else if (item.method === 'PUT') {
          await axios.put(item.url, item.data);
        }
        remaining = remaining.filter(i => i.id !== item.id);
        localStorage.setItem('lc_offline_queue', JSON.stringify(remaining));
      } catch (err) {
        console.error(`❌ [OFFLINE QUEUE] Sync fail for item ${item.id}:`, err.message);
        if (!err.response) {
          // A real network failure happened, abort loop and try again later
          break;
        }
        // If it's a 4xx error, it's malformed, so remove from queue to prevent block
        remaining = remaining.filter(i => i.id !== item.id);
        localStorage.setItem('lc_offline_queue', JSON.stringify(remaining));
      }
    }
    set({ offlineCount: remaining.length });
  },

  // Utility to clear errors
  clearError: () => set({ error: null })
}));
