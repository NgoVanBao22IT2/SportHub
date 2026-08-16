require('dotenv').config();
const { sequelize, User, Court, Branch, Venue, OperatingSchedule } = require('./src/models');
const BookingService = require('./src/services/booking.service');

async function runConcurrencyTest() {
  console.log('Starting Concurrency Test...');

  // 1. Sync DB & Setup Mock Data
  await sequelize.sync({ force: true });
  
  const owner = await User.create({ user_id: 'owner1', email: 'owner@test.com', full_name: 'Own', phone_number: '1', password_hash: 'h', primary_role: 'OWNER' });
  const user = await User.create({ user_id: 'user1', email: 'user@test.com', full_name: 'Usr', phone_number: '2', password_hash: 'h', primary_role: 'CUSTOMER' });
  
  const venue = await Venue.create({ venue_id: 'v1', owner_user_id: owner.user_id, venue_name: 'Test Venue', contact_phone: '123456789', operating_status: 'APPROVED' });
  const branch = await Branch.create({ branch_id: 'b1', venue_id: venue.venue_id, branch_name: 'Branch 1', street_address: '1', ward_district_city: '1', branch_phone: '1', operating_status: 'APPROVED' });
  const court = await Court.create({ court_id: 'c1', branch_id: branch.branch_id, court_name: 'Court 1', sport_category: 'Badminton', court_status: 'ACTIVE' });

  await OperatingSchedule.create({
    schedule_id: 'sched1',
    scope_target_type: 'COURT',
    scope_target_id: court.court_id,
    day_scope: 'WEEKDAY',
    opening_time: '08:00:00',
    closing_time: '22:00:00',
    base_hourly_price: 100000
  });

  const payload = {
    court_id: court.court_id,
    booking_date: '2026-10-10',
    start_time: '10:00:00',
    end_time: '11:00:00'
  };

  // 2. Fire Concurrent Requests
  console.log('Firing 2 simultaneous booking creation requests...');
  
  // Create two concurrent promises
  const req1 = BookingService.createBooking(user.user_id, payload);
  const req2 = BookingService.createBooking(user.user_id, payload);

  const results = await Promise.allSettled([req1, req2]);

  let successCount = 0;
  let conflictCount = 0;

  results.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      successCount++;
      console.log(`Request ${i + 1} Succeeded: Created Booking ID ${res.value.booking_id}`);
    } else {
      if (res.reason.statusCode === 409) {
        conflictCount++;
        console.log(`Request ${i + 1} Failed with Conflict: ${res.reason.message}`);
      } else {
        console.error(`Request ${i + 1} Failed unexpectedly:`, res.reason);
      }
    }
  });

  console.log(`\nSuccess Count: ${successCount}`);
  console.log(`Conflict Count: ${conflictCount}`);

  if (successCount === 1 && conflictCount === 1) {
    console.log('PASS: Double Booking prevented successfully by transaction lock!');
  } else {
    console.error('FAIL: Concurrency protection failed.');
  }

  process.exit(0);
}

runConcurrencyTest().catch(console.error);
