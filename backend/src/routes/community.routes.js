'use strict';

const express = require('express');
const router = express.Router();
const CommunityService = require('../services/community.service');
const { authenticateJWT } = require('../middleware/auth.middleware');

// Public Feed: GET /api/v1/community/posts
router.get('/posts', async (req, res, next) => {
  try {
    const result = await CommunityService.getPosts(req.query);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Protected: Get user's upcoming confirmed bookings for pass-booking
router.get('/my-upcoming-bookings', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.user_id;
    const bookings = await CommunityService.getUserUpcomingBookings(userId);
    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
});

// Public: GET /api/v1/community/posts/:id
router.get('/posts/:id', async (req, res, next) => {
  try {
    const post = await CommunityService.getPostById(req.params.id);
    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
});

// Protected: Create new post
router.post('/posts', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.user_id;
    const post = await CommunityService.createPost(userId, req.body);
    res.status(201).json({
      success: true,
      data: post,
      message: 'Đăng bài thành công!',
    });
  } catch (error) {
    next(error);
  }
});

// Protected: Apply to join a post
router.post('/posts/:id/apply', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.user_id;
    const application = await CommunityService.applyPost(
      req.params.id,
      userId,
      req.body.message
    );
    res.status(201).json({
      success: true,
      data: application,
      message: 'Gửi yêu cầu gia nhập thành công!',
    });
  } catch (error) {
    next(error);
  }
});

// Protected: Accept/Reject application
router.put('/applications/:id/status', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.user_id;
    const application = await CommunityService.updateApplicationStatus(
      req.params.id,
      userId,
      req.body.status
    );
    res.json({
      success: true,
      data: application,
      message: 'Cập nhật trạng thái thành công!',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
