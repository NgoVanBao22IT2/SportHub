'use strict';

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:5173', // Admin Frontend
  'http://localhost:5174', // Owner Frontend
  'http://localhost:5175', // Customer Frontend
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Dev fallback
    }
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

// Mount Venue Discovery & Venue Management Routes
const venueRoutes = require('./routes/venue.routes');
const venueSearchRoutes = require('./routes/venue-search.routes');

app.use('/api/v1', venueSearchRoutes); // public GET /venues
app.use('/api/v1', venueRoutes); // protected POST/PUT/DELETE /venues

// (Admin Operations moved up)

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(err.statusCode || 500).json({
    success: false,
    code: err.code || 'SERVER_ERROR',
    message: err.message || 'Internal Server Error'
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
