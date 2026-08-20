'use strict';

const assert = require('assert');
const crypto = require('crypto');
const models = require('../models');
const ReviewService = require('../services/review.service');
const { generateAccessToken } = require('../utils/jwt');

async function runReviewTestSuite() {
  console.log('🚀 Starting Review & Rating End-to-End Test Suite...\n');

  let testUserA = null;
  let testUserB = null;
  let testOwner = null;
  let testVenue = null;
  let testBranch = null;
  let testCourt = null;
  let testBookingCompleted = null;
  let testBookingPending = null;
  let testBookingCancelled = null;
  let createdReviewId = null;

  try {
    // 1. Setup Test Fixtures
    console.log('--- Setting up test fixtures in MySQL Database ---');
    const uIdA = crypto.randomUUID();
    const uIdB = crypto.randomUUID();
    const ownerId = crypto.randomUUID();
    const vId = crypto.randomUUID();
    const brId = crypto.randomUUID();
    const cId = crypto.randomUUID();

    testUserA = await models.User.create({
      user_id: uIdA,
      email: `test_customer_a_${Date.now()}@sporthub.vn`,
      full_name: 'Nguyễn Văn Test A',
      phone_number: '0901111111',
      password_hash: '$2a$10$abcdefg1234567890dummyhash',
      primary_role: 'CUSTOMER',
      account_status: 'ACTIVE'
    });

    testUserB = await models.User.create({
      user_id: uIdB,
      email: `test_customer_b_${Date.now()}@sporthub.vn`,
      full_name: 'Trần Thị Test B',
      phone_number: '0902222222',
      password_hash: '$2a$10$abcdefg1234567890dummyhash',
      primary_role: 'CUSTOMER',
      account_status: 'ACTIVE'
    });

    testOwner = await models.User.create({
      user_id: ownerId,
      email: `test_owner_${Date.now()}@sporthub.vn`,
      full_name: 'Chủ Sân Test Owner',
      phone_number: '0903333333',
      password_hash: '$2a$10$abcdefg1234567890dummyhash',
      primary_role: 'OWNER',
      account_status: 'ACTIVE'
    });

    testVenue = await models.Venue.create({
      venue_id: vId,
      owner_user_id: ownerId,
      venue_name: 'SportHub Test Badminton Arena',
      contact_phone: '0903333333',
      operating_status: 'APPROVED'
    });

    testBranch = await models.Branch.create({
      branch_id: brId,
      venue_id: vId,
      branch_name: 'Cơ sở chính Test',
      street_address: '123 Đường Test',
      ward_district_city: 'Đà Nẵng',
      branch_phone: '0903333333',
      branch_status: 'ACTIVE'
    });

    testCourt = await models.Court.create({
      court_id: cId,
      branch_id: brId,
      court_name: 'Sân VIP 01 Test',
      sport_category: 'Cầu lông',
      court_status: 'ACTIVE'
    });

    const bCompletedId = crypto.randomUUID();
    testBookingCompleted = await models.Booking.create({
      booking_id: bCompletedId,
      customer_user_id: uIdA,
      court_id: cId,
      booking_date: '2026-08-18',
      start_time: '18:00:00',
      end_time: '19:00:00',
      total_amount: 120000.00,
      currency: 'VND',
      booking_source: 'ONLINE_CUSTOMER',
      booking_status: 'COMPLETED'
    });

    const bHoldingId = crypto.randomUUID();
    testBookingPending = await models.Booking.create({
      booking_id: bHoldingId,
      customer_user_id: uIdA,
      court_id: cId,
      booking_date: '2026-08-25',
      start_time: '18:00:00',
      end_time: '19:00:00',
      total_amount: 120000.00,
      currency: 'VND',
      booking_source: 'ONLINE_CUSTOMER',
      booking_status: 'HOLDING'
    });

    const bCancelledId = crypto.randomUUID();
    testBookingCancelled = await models.Booking.create({
      booking_id: bCancelledId,
      customer_user_id: uIdA,
      court_id: cId,
      booking_date: '2026-08-19',
      start_time: '18:00:00',
      end_time: '19:00:00',
      total_amount: 120000.00,
      currency: 'VND',
      booking_source: 'ONLINE_CUSTOMER',
      booking_status: 'CANCELLED'
    });

    console.log('✅ Test fixtures successfully established in database.\n');

    // CASE 01: User not logged in (null userId) checking eligibility
    console.log('🧪 Testing CASE 01: Unauthenticated user checking eligibility');
    const eligNull = await ReviewService.checkVenueReviewEligibility(null, testVenue.venue_id);
    assert.strictEqual(eligNull.canReview, false, 'Unauthenticated user must not be eligible');
    console.log('  -> PASS: Unauthenticated user denied review eligibility');

    // CASE 02: User B logged in but has no booking at test venue
    console.log('🧪 Testing CASE 02: User B with no bookings checking eligibility');
    const eligB = await ReviewService.checkVenueReviewEligibility(testUserB.user_id, testVenue.venue_id);
    assert.strictEqual(eligB.canReview, false, 'User B without bookings must not be eligible');
    console.log('  -> PASS: User without booking denied review eligibility');

    // CASE 03: Booking PENDING -> cannot review
    console.log('🧪 Testing CASE 03: Booking with status PENDING cannot be reviewed');
    const checkPending = await ReviewService.canUserReviewBooking(testUserA.user_id, testBookingPending.booking_id);
    assert.strictEqual(checkPending.allowed, false, 'Pending booking must not be reviewable');
    assert.strictEqual(checkPending.statusCode, 403);
    console.log('  -> PASS: Pending booking rejected with 403 Forbidden');

    // CASE 04: Booking CANCELLED -> cannot review
    console.log('🧪 Testing CASE 04: Booking with status CANCELLED cannot be reviewed');
    const checkCancelled = await ReviewService.canUserReviewBooking(testUserA.user_id, testBookingCancelled.booking_id);
    assert.strictEqual(checkCancelled.allowed, false, 'Cancelled booking must not be reviewable');
    assert.strictEqual(checkCancelled.statusCode, 403);
    console.log('  -> PASS: Cancelled booking rejected with 403 Forbidden');

    // CASE 05: Booking COMPLETED -> Eligible to review
    console.log('🧪 Testing CASE 05: Booking with status COMPLETED is eligible to review');
    const checkCompleted = await ReviewService.canUserReviewBooking(testUserA.user_id, testBookingCompleted.booking_id);
    assert.strictEqual(checkCompleted.allowed, true, 'Completed booking must be reviewable');
    console.log('  -> PASS: Completed booking allowed for review');

    // CASE 08: User B trying to review User A completed booking -> 403 Forbidden
    console.log('🧪 Testing CASE 08: User B attempts to review User A completed booking');
    const checkSpoof = await ReviewService.canUserReviewBooking(testUserB.user_id, testBookingCompleted.booking_id);
    assert.strictEqual(checkSpoof.allowed, false, 'Spoofed user must not be allowed');
    assert.strictEqual(checkSpoof.statusCode, 403);
    console.log('  -> PASS: Ownership violation blocked with 403 Forbidden');

    // CASE 06: Create Review for COMPLETED booking -> SUCCESS (201)
    console.log('🧪 Testing CASE 06: Create Review with rating 5 stars and valid comment');
    const reviewData = await ReviewService.createReview(testUserA.user_id, {
      bookingId: testBookingCompleted.booking_id,
      rating: 5,
      comment: 'Sân cầu lông tuyệt vời, mặt thảm chuẩn thi đấu, ánh sáng chống chói rất tốt!'
    });
    assert.ok(reviewData.review_id, 'Review ID must be generated');
    assert.strictEqual(reviewData.rating, 5);
    assert.strictEqual(reviewData.venue_id, testVenue.venue_id);
    assert.strictEqual(reviewData.court_id, testCourt.court_id);
    createdReviewId = reviewData.review_id;
    console.log('  -> PASS: Review created successfully in DB (Review ID: ' + createdReviewId + ')');

    // CASE 07: Duplicate review on same booking -> 409 Conflict
    console.log('🧪 Testing CASE 07: Duplicate review on same booking returns 409 Conflict');
    let duplicateFailedAsExpected = false;
    try {
      await ReviewService.createReview(testUserA.user_id, {
        bookingId: testBookingCompleted.booking_id,
        rating: 4,
        comment: 'Cố tình đánh giá lần hai.'
      });
    } catch (err) {
      if (err.statusCode === 409 || err.code === 'ALREADY_REVIEWED') {
        duplicateFailedAsExpected = true;
      }
    }
    assert.strictEqual(duplicateFailedAsExpected, true, 'Duplicate review must throw 409 Conflict');
    console.log('  -> PASS: Duplicate review rejected with 409 Conflict');

    // CASE 14 & 15: Rating Aggregation & Venue Reviews List
    console.log('🧪 Testing CASE 14 & 15: Real rating calculation and reviews retrieval');
    const venueReviews = await ReviewService.getVenueReviews(testVenue.venue_id, { page: 1, limit: 10 });
    assert.strictEqual(venueReviews.summary.totalReviews, 1);
    assert.strictEqual(venueReviews.summary.averageRating, 5);
    assert.strictEqual(venueReviews.summary.distribution[5], 1);
    assert.strictEqual(venueReviews.reviews.length, 1);
    assert.strictEqual(venueReviews.reviews[0].customer.full_name, 'Nguyễn Văn Test A');
    console.log('  -> PASS: Rating aggregated accurately (Average: ' + venueReviews.summary.averageRating + '★, Count: ' + venueReviews.summary.totalReviews + ')');

    // CASE 16: Owner Reply to Review
    console.log('🧪 Testing CASE 16: Owner replies to customer review');
    const repliedReview = await ReviewService.replyOwnerReview(testOwner.user_id, createdReviewId, 'Cảm ơn bạn đã trải nghiệm và đánh giá tích cực!');
    assert.strictEqual(repliedReview.owner_reply, 'Cảm ơn bạn đã trải nghiệm và đánh giá tích cực!');
    assert.ok(repliedReview.owner_reply_at);
    console.log('  -> PASS: Owner reply saved successfully');

    // Notification Check: Verify owner notification was created
    console.log('🧪 Testing Notification: Owner receives NEW_REVIEW notification');
    const notif = await models.Notification.findOne({
      where: {
        recipient_user_id: testOwner.user_id,
        entity_id: createdReviewId
      }
    });
    assert.ok(notif, 'Owner must receive notification for new review');
    assert.strictEqual(notif.notification_type, 'NEW_REVIEW');
    console.log('  -> PASS: Owner notification verified');

    console.log('\n========================================');
    console.log('🎉 ALL REVIEW TESTS PASSED SUCCESSFULLY!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Test Suite Failed:', error);
    process.exitCode = 1;
  } finally {
    // Cleanup fixtures
    try {
      if (createdReviewId) await models.Review.destroy({ where: { review_id: createdReviewId } });
      if (testBookingCompleted) await models.Booking.destroy({ where: { booking_id: testBookingCompleted.booking_id } });
      if (testBookingPending) await models.Booking.destroy({ where: { booking_id: testBookingPending.booking_id } });
      if (testBookingCancelled) await models.Booking.destroy({ where: { booking_id: testBookingCancelled.booking_id } });
      if (testCourt) await models.Court.destroy({ where: { court_id: testCourt.court_id } });
      if (testBranch) await models.Branch.destroy({ where: { branch_id: testBranch.branch_id } });
      if (testVenue) await models.Venue.destroy({ where: { venue_id: testVenue.venue_id } });
      if (testUserA) await models.User.destroy({ where: { user_id: testUserA.user_id } });
      if (testUserB) await models.User.destroy({ where: { user_id: testUserB.user_id } });
      if (testOwner) {
        await models.Notification.destroy({ where: { recipient_user_id: testOwner.user_id } });
        await models.User.destroy({ where: { user_id: testOwner.user_id } });
      }
      console.log('🧹 Test fixtures cleaned up from database.');
    } catch (e) {
      console.warn('Notice: Cleanup warning:', e.message);
    }
  }
}

runReviewTestSuite().then(() => process.exit(process.exitCode || 0));
