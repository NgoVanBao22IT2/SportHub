'use strict';

const express = require('express');
const router = express.Router();
const venueSearchController = require('../controllers/venue-search.controller');

// ==========================================
// PUBLIC SEARCH & DISCOVERY ROUTES (PHASE 07)
// ==========================================
router.get('/venues', venueSearchController.searchVenues);
router.get('/sports', venueSearchController.getSportsCategories);
router.get('/venues/:venueId', venueSearchController.getVenueDetails);
router.get('/venues/:venueId/similar', venueSearchController.getSimilarVenues);

module.exports = router;
