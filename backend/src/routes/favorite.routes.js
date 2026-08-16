'use strict';

const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');

router.use(authenticateJWT);

router.get('/', favoriteController.getFavorites);
router.post('/', favoriteController.addFavorite);
router.delete('/:venueId', favoriteController.removeFavorite);

module.exports = router;
