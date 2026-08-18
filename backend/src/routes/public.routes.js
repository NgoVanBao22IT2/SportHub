'use strict';

const express = require('express');
const router = express.Router();
const MediaController = require('../controllers/media.controller');
const PostController = require('../controllers/post.controller');

// Public Media Gallery API
router.get('/venues/:venueId/media', MediaController.getPublicVenueMedia);

// Public Posts & Events API
router.get('/venues/:venueId/posts', PostController.getPublicVenuePosts);
router.get('/posts/:slug', PostController.getPublicPostBySlug);
router.get('/featured-events', PostController.getPublicFeaturedEvents);

module.exports = router;
