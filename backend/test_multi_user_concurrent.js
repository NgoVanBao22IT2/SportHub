require('dotenv').config();
const { sequelize, User, Court, Branch, Venue, OperatingSchedule, Booking } = require('./src/models');
const AuthService = require('./src/services/auth.service');
const BookingService = require('./src/services/booking.service');
const OwnerService = require('./src/services/owner.service');
const AdminService = require('./src/services/admin.service');
const { generateAccessToken } = require('./src/utils/jwt');
const bcrypt = require('bcryptjs');

async function runMultiUserConcurrentTest() {
  console.log('====================================================');
  console.log('  SPORTHUB MULTI-USER CONCURRENT PARALLEL TEST SUITE');
  console.log('====================================================\n');

  // 1. Database Initialization
  console.log('1. Initializing isolated database state...');
  await sequelize.sync({ force: true });
  const hash = await bcrypt.hash('Password123!', 10);

  // 2. Create Users for 3 Roles (Admin, 2 Owners, 2 Customers)
  console.log('2. Creating multi-role user accounts...');
  const adminUser = await User.create({
    user_id: 'admin_1',
    email: 'admin@sporthub.ai',
    full_name: 'Super Admin',
    phone_number: '0900000001',
    password_hash: hash,
    primary_role: 'ADMIN',
    account_status: 'ACTIVE'
  });

  const ownerA = await User.create({
    user_id: 'owner_a',
    email: 'owner_a@sporthub.ai',
    full_name: 'Chủ Sân A',
    phone_number: '0900000002',
    password_hash: hash,
    primary_role: 'OWNER',
    account_status: 'ACTIVE'
  });

  const ownerB = await User.create({
    user_id: 'owner_b',
    email: 'owner_b@sporthub.ai',
    full_name: 'Chủ Sân B',
    phone_number: '0900000003',
    password_hash: hash,
    primary_role: 'OWNER',
    account_status: 'ACTIVE'
  });

  const customerA = await User.create({
    user_id: 'customer_a',
    email: 'customer_a@sporthub.ai',
    full_name: 'Khách Hàng A',
    phone_number: '0900000004',
    password_hash: hash,
    primary_role: 'CUSTOMER',
    account_status: 'ACTIVE'
  });

  const customerB = await User.create({
    user_id: 'customer_b',
    email: 'customer_b@sporthub.ai',
    full_name: 'Khách Hàng B',
    phone_number: '0900000005',
    password_hash: hash,
    primary_role: 'CUSTOMER',
    account_status: 'ACTIVE'
  });

  // 3. Create Venues, Branches, Courts
  console.log('3. Setting up Venues & Courts for Owner A and Owner B...');
  const venueA = await Venue.create({
    venue_id: 'venue_a',
    owner_user_id: ownerA.user_id,
    venue_name: 'Cụm Sân A (Badminton)',
    contact_phone: '0900000002',
    operating_status: 'APPROVED'
  });

  const branchA = await Branch.create({
    branch_id: 'branch_a',
    venue_id: venueA.venue_id,
    branch_name: 'Cơ Sở A',
    street_address: '123 Nguyễn Văn Cừ',
    ward_district_city: 'Quận 5, TP.HCM',
    branch_phone: '0900000002',
    branch_status: 'ACTIVE'
  });

  const courtA1 = await Court.create({
    court_id: 'court_a1',
    branch_id: branchA.branch_id,
    court_name: 'Sân A1',
    sport_category: 'Badminton',
    court_status: 'ACTIVE'
  });

  const venueB = await Venue.create({
    venue_id: 'venue_b',
    owner_user_id: ownerB.user_id,
    venue_name: 'Cụm Sân B (Pickleball)',
    contact_phone: '0900000003',
    operating_status: 'APPROVED'
  });

  const branchB = await Branch.create({
    branch_id: 'branch_b',
    venue_id: venueB.venue_id,
    branch_name: 'Cơ Sở B',
    street_address: '456 Lê Văn Sỹ',
    ward_district_city: 'Quận 3, TP.HCM',
    branch_phone: '0900000003',
    branch_status: 'ACTIVE'
  });

  const courtB1 = await Court.create({
    court_id: 'court_b1',
    branch_id: branchB.branch_id,
    court_name: 'Sân B1',
    sport_category: 'Pickleball',
    court_status: 'ACTIVE'
  });

  await OperatingSchedule.create({
    schedule_id: 'sched_a1',
    scope_target_type: 'VENUE',
    scope_target_id: venueA.venue_id,
    day_scope: 'EVERYDAY',
    opening_time: '06:00:00',
    closing_time: '23:00:00',
    base_hourly_price: 100000
  });

  await OperatingSchedule.create({
    schedule_id: 'sched_b1',
    scope_target_type: 'VENUE',
    scope_target_id: venueB.venue_id,
    day_scope: 'EVERYDAY',
    opening_time: '06:00:00',
    closing_time: '23:00:00',
    base_hourly_price: 120000
  });

  // 4. TEST 1: CONCURRENT REQUESTS FROM ADMIN, OWNER, AND CUSTOMER SIMULTANEOUSLY
  console.log('\n----------------------------------------------------');
  console.log('TEST 1: Simultaneous API Requests (Admin + Owner + Customer)');
  console.log('----------------------------------------------------');

  const adminPromise = AdminService.getDashboard();
  const ownerAPromise = OwnerService.getDashboard(ownerA.user_id);
  const ownerBPromise = OwnerService.getDashboard(ownerB.user_id);
  const customerPromise = BookingService.getUserBookings(customerA.user_id);

  const test1Results = await Promise.allSettled([adminPromise, ownerAPromise, ownerBPromise, customerPromise]);
  let test1Success = true;
  test1Results.forEach((res, i) => {
    const roleName = i === 0 ? 'ADMIN' : i === 1 ? 'OWNER A' : i === 2 ? 'OWNER B' : 'CUSTOMER A';
    if (res.status === 'fulfilled') {
      console.log(`[PASS] ${roleName} request executed successfully.`);
    } else {
      console.error(`[FAIL] ${roleName} request failed:`, res.reason);
      test1Success = false;
    }
  });

  // 5. TEST 2: OWNER DATA ISOLATION (Owner A cannot view Owner B's venue data)
  console.log('\n----------------------------------------------------');
  console.log('TEST 2: Owner Data Isolation Verification');
  console.log('----------------------------------------------------');

  const ownerABookings = await OwnerService.getBookings(ownerA.user_id, { venueId: venueA.venue_id });
  const ownerBBookingsAsOwnerA = await OwnerService.getBookings(ownerA.user_id, { venueId: venueB.venue_id });

  let test2Success = true;
  if (ownerBBookingsAsOwnerA.data.length === 0) {
    console.log('[PASS] Owner A queried Owner B venue_id -> Returned 0 records (Isolation enforced).');
  } else {
    console.error('[FAIL] Owner A was able to query Owner B data!');
    test2Success = false;
  }

  // 6. TEST 3: CUSTOMER DOUBLE BOOKING PREVENTION (Race condition test)
  console.log('\n----------------------------------------------------');
  console.log('TEST 3: Concurrent Double Booking Protection');
  console.log('----------------------------------------------------');

  const bookingPayload = {
    court_id: courtA1.court_id,
    booking_date: '2026-08-20',
    start_time: '18:00:00',
    end_time: '19:00:00'
  };

  console.log('Firing 2 simultaneous booking attempts for Court A1 (18:00 - 19:00)...');
  const reqCustA = BookingService.createBooking(customerA.user_id, bookingPayload);
  const reqCustB = BookingService.createBooking(customerB.user_id, bookingPayload);

  const doubleBookingResults = await Promise.allSettled([reqCustA, reqCustB]);
  let successCount = 0;
  let conflictCount = 0;

  doubleBookingResults.forEach((res, i) => {
    const custName = i === 0 ? 'Customer A' : 'Customer B';
    if (res.status === 'fulfilled') {
      successCount++;
      console.log(`[SUCCESS] ${custName} booked slot successfully. Booking ID: ${res.value.booking_id}`);
    } else {
      if (res.reason.statusCode === 409) {
        conflictCount++;
        console.log(`[PREVENTED] ${custName} booking attempt rejected with 409 Conflict: ${res.reason.message}`);
      } else {
        console.error(`[ERROR] ${custName} booking attempt failed unexpectedly:`, res.reason);
      }
    }
  });

  let test3Success = (successCount === 1 && conflictCount === 1);
  if (test3Success) {
    console.log('[PASS] Double Booking successfully prevented by Pessimistic Locking & Database Transaction!');
  } else {
    console.error('[FAIL] Concurrency protection failed for Double Booking!');
  }

  // 7. FINAL SUMMARY & VERIFICATION REPORT
  console.log('\n====================================================');
  console.log('  MULTI-USER CONCURRENT TEST RESULTS SUMMARY');
  console.log('====================================================');
  console.log(`Test 1 (Simultaneous Admin + Owner + Customer API Requests): ${test1Success ? 'PASS' : 'FAIL'}`);
  console.log(`Test 2 (Owner Data Isolation Enforcement)                : ${test2Success ? 'PASS' : 'FAIL'}`);
  console.log(`Test 3 (Double Booking Race Condition Prevention)        : ${test3Success ? 'PASS' : 'FAIL'}`);
  
  const allPassed = test1Success && test2Success && test3Success;
  console.log('----------------------------------------------------');
  console.log(`OVERALL MULTI-USER SYSTEM STATUS: ${allPassed ? 'ALL TESTS PASSED (PASS)' : 'FAILED'}`);
  console.log('====================================================\n');

  if (allPassed) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runMultiUserConcurrentTest().catch((err) => {
  console.error('Fatal Error during Multi-User Test execution:', err);
  process.exit(1);
});
