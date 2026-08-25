'use strict';

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');

const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

// Request ID & Correlation Tracking Middleware
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// LAN IP — configurable via LOCAL_NETWORK_IP in backend .env (default: auto-detected 192.168.1.99)
const LAN_IP = process.env.LOCAL_NETWORK_IP || '192.168.1.99';

const allowedOrigins = [
  'http://localhost:5173', // Admin Frontend (local)
  'http://localhost:5174', // Owner Frontend (local)
  'http://localhost:5175', // Customer Frontend (local)
  'http://localhost:8080', // Gateway Server (local)
  'http://localhost:3000', // Backend (local)
  // LAN IP origins — allows devices on the same Wi-Fi/LAN to access the app
  `http://${LAN_IP}:5173`, // Admin Frontend (LAN)
  `http://${LAN_IP}:5174`, // Owner Frontend (LAN)
  `http://${LAN_IP}:5175`, // Customer Frontend (LAN)
  `http://${LAN_IP}:8080`, // Gateway Server (LAN)
  `http://${LAN_IP}:3000`, // Backend (LAN)
];

// Checks if origin is a valid ngrok domain (any subdomain of ngrok-free.app or ngrok.io)
const isNgrokOrigin = (origin) => {
  if (!origin) return false;
  return /^https?:\/\/[a-zA-Z0-9-]+\.(ngrok-free\.app|ngrok\.io|ngrok\.dev)(:\d+)?$/.test(origin);
};

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    // Allow localhost origins
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    // Allow any ngrok tunnel domain (handles rotating URLs automatically)
    if (isNgrokOrigin(origin)) return callback(null, true);
    // Dev fallback: allow all (remove in production)
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Mount Auth API Routes
app.use('/api/v1/auth', authRoutes);

// Mount Admin Operations (Must be before generic /api/v1 to avoid catching middleware)
const adminRoutes = require('./routes/admin.routes');
app.use('/api/v1/admin', adminRoutes);

// Mount Public Availability & Pricing Engine
const availabilityRoutes = require('./routes/availability.routes');
app.use('/api/v1/availability', availabilityRoutes);

// Mount Booking Engine
const bookingRoutes = require('./routes/booking.routes');
app.use('/api/v1/bookings', bookingRoutes);

// Mount Payment Integration
const paymentRoutes = require('./routes/payment.routes');
app.use('/api/v1/payments', paymentRoutes);

// Mount Owner Operations
const slotBlockingRoutes = require('./routes/slot-blocking.routes');
const ownerAggregateRoutes = require('./routes/owner.routes');
app.use('/api/v1/owner', slotBlockingRoutes);
app.use('/api/v1/owner', ownerAggregateRoutes);

// Mount Favorite Venues Operations
const favoriteRoutes = require('./routes/favorite.routes');
app.use('/api/v1/favorites', favoriteRoutes);

// Mount Public Media & Content Routes
const publicRoutes = require('./routes/public.routes');
app.use('/api/v1/public', publicRoutes);

// Mount Owner Registration Routes
const ownerRegistrationRoutes = require('./routes/owner-registration.routes');
app.use('/api/v1/owner-registrations', ownerRegistrationRoutes);

// Mount Notifications & Reviews & Discovery Routes
const notificationRoutes = require('./routes/notification.routes');
const reviewRoutes = require('./routes/review.routes');
const venueSearchRoutes = require('./routes/venue-search.routes');
const venueRoutes = require('./routes/venue.routes');

app.use('/api/v1/notifications', notificationRoutes); // user notifications API routes
app.use('/api/v1', reviewRoutes); // reviews & rating API routes
app.use('/api/v1', venueSearchRoutes); // public GET /venues
app.use('/api/v1', venueRoutes); // protected POST/PUT/DELETE /venues

// (Admin Operations moved up)

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[Global Error] [${req.id || 'N/A'}]`, err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    code: err.code || 'SERVER_ERROR',
    message: err.message || 'Internal Server Error',
    requestId: req.id
  });
});

if (require.main === module) {
  const db = require('./models');
  const ownerRegistrationService = require('./services/owner-registration.service');

  db.sequelize.sync().then(async () => {
    console.log('[SportHubAI DB] All models synchronized with MySQL');
    await ownerRegistrationService.syncApprovedRegistrationsToVenues();
  }).catch((err) => {
    console.error('[SportHubAI DB Sync Error]', err);
  });

  app.listen(PORT, () => {
    console.log(`[SportHubAI Backend] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}
module.exports = app;
