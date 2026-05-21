// LABOUR CONNECT REAL-TIME WEBSOCKET COORDINATOR
// Manages Socket.io server connection handshakes, online worker maps,
// transient alerts, booking lifecycle events, and en-route GPS simulation.

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';

let io = null;
const userSockets = new Map(); // Maps user_id -> socket.id

// Simulated active routes intervals store (bookingId -> IntervalObject)
const activeSimulations = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  console.log('🔌 [SOCKET.IO] Real-time WebSocket server successfully initialized.');

  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      console.warn('⚠️ [SOCKET.IO] Connection attempt rejected: Missing auth token.');
      return next(new Error('Authentication failed: Missing token.'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      console.warn(`⚠️ [SOCKET.IO] Connection rejected: Invalid JWT token - ${err.message}`);
      return next(new Error('Authentication failed: Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const userRole = socket.user.role;
    const userName = socket.user.name;

    console.log(`🔌 [SOCKET.IO] Client connected: ${userName} (${userRole}) | Socket ID: ${socket.id}`);
    
    // Register socket
    userSockets.set(userId, socket.id);
    socket.join(`user:${userId}`);

    // Join role-specific channels
    if (userRole === 'worker') {
      socket.join('workers-channel');
    } else if (userRole === 'customer') {
      socket.join('customers-channel');
    } else if (userRole === 'contractor') {
      socket.join('contractors-channel');
    }

    // Handle high-frequency worker GPS location updates
    socket.on('worker-location-update', (data) => {
      const { latitude, longitude, status } = data;
      if (!latitude || !longitude) return;

      // Broadcast to all customers watching the map
      io.to('customers-channel').emit('nearby-worker-gps', {
        workerId: userId,
        name: userName,
        latitude,
        longitude,
        status: status || 'online',
        updatedAt: new Date()
      });
    });

    // Handle worker status changes
    socket.on('worker-status-announce', (data) => {
      const { status } = data;
      io.to('customers-channel').emit('nearby-worker-status-changed', {
        workerId: userId,
        status
      });
    });

    // Chat typing indicators
    socket.on('typing-announce', (data) => {
      const { bookingId, receiverId, isTyping } = data;
      io.to(`user:${receiverId}`).emit('typing-indicator', {
        bookingId,
        senderId: userId,
        isTyping
      });
    });

    // Reconnection recovery request
    socket.on('reconnect-recovery', (data) => {
      const { lastAckTime } = data;
      console.log(`🔌 [SOCKET.IO] Recovery request received from: ${userName}. Last Sync: ${lastAckTime}`);
      socket.emit('reconnect-recovery-success', {
        status: 'recovered',
        serverTime: new Date()
      });
    });

    // Worker manually broadcasts they are en-route
    socket.on('worker-en-route', (data) => {
      const { bookingId, customerId } = data;
      io.to(`user:${customerId}`).emit('worker-en-route-update', {
        bookingId,
        workerId: userId,
        workerName: userName
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [SOCKET.IO] Client disconnected: ${userName} | Socket ID: ${socket.id}`);
      userSockets.delete(userId);
    });
  });

  return io;
};

// ─────────────────────────────────────────
// HELPER: Emit directly to a user room
// ─────────────────────────────────────────
const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

// ─────────────────────────────────────────
// BOOKING PING → Worker receives new request
// ─────────────────────────────────────────
const sendBookingPing = (workerId, bookingData) => {
  if (!io) return false;
  const socketId = userSockets.get(workerId);
  
  console.log(`🔔 [SOCKET.IO] Dispatching booking ping to worker: ${workerId} (Socket: ${socketId || 'offline'})`);
  
  if (socketId) {
    io.to(socketId).emit('booking-ping', bookingData);
    return true;
  } else {
    // Fallback broadcast to all workers channel
    io.to('workers-channel').emit('booking-ping-broadcast', { ...bookingData, targetWorkerId: workerId });
    return false;
  }
};

// ─────────────────────────────────────────
// DIRECT NOTIFICATION PUSH
// ─────────────────────────────────────────
const sendNotificationAlert = (userId, alertData) => {
  if (!io) return;
  emitToUser(userId, 'notification-alert', alertData);
};

// ─────────────────────────────────────────
// GPS EN-ROUTE SIMULATION
// ─────────────────────────────────────────
const startEnRouteSimulation = (bookingId, workerId, customerCoords) => {
  if (!io) return;

  stopEnRouteSimulation(bookingId);

  console.log(`🧭 [SIMULATOR] Starting GPS simulation for Booking: ${bookingId}`);

  let currentLat = customerCoords.latitude + 0.008 + (Math.random() - 0.5) * 0.003;
  let currentLng = customerCoords.longitude - 0.006 + (Math.random() - 0.5) * 0.003;

  const destLat = customerCoords.latitude;
  const destLng = customerCoords.longitude;

  const totalSteps = 8;
  let step = 0;

  const latStep = (destLat - currentLat) / totalSteps;
  const lngStep = (destLng - currentLng) / totalSteps;

  const simInterval = setInterval(() => {
    step++;

    currentLat += latStep;
    currentLng += lngStep;

    const remainingSteps = totalSteps - step;
    const etaMinutes = Math.max(1, Math.round(remainingSteps * 1.5));

    io.emit('location-simulation-tick', {
      bookingId,
      workerId,
      latitude: parseFloat(currentLat.toFixed(6)),
      longitude: parseFloat(currentLng.toFixed(6)),
      eta: etaMinutes,
      arrived: step >= totalSteps
    });

    console.log(`🧭 [SIMULATOR] Step ${step}/${totalSteps} for booking ${bookingId} | ETA: ${etaMinutes}m`);

    if (step >= totalSteps) {
      clearInterval(simInterval);
      activeSimulations.delete(bookingId);
      console.log(`🧭 [SIMULATOR] Arrived for Booking: ${bookingId}`);
      io.emit('simulation-arrived', { bookingId });
    }
  }, 3000);

  activeSimulations.set(bookingId, simInterval);
};

const stopEnRouteSimulation = (bookingId) => {
  const interval = activeSimulations.get(bookingId);
  if (interval) {
    clearInterval(interval);
    activeSimulations.delete(bookingId);
    console.log(`🧭 [SIMULATOR] Cleared simulation for Booking: ${bookingId}`);
  }
};

module.exports = {
  initSocket,
  emitToUser,
  sendBookingPing,
  sendNotificationAlert,
  startEnRouteSimulation,
  stopEnRouteSimulation
};
