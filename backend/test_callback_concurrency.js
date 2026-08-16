require('dotenv').config();
const { sequelize, User, Court, Booking, Payment, PaymentIpnLog, BookingStatusHistory } = require('./src/models');
const PaymentService = require('./src/services/payment.service');
const MoMoUtils = require('./src/utils/momo');
const { v4: uuidv4 } = require('uuid');

async function runConcurrencyTest() {
  console.log('--- CONCURRENT CALLBACK TEST ---');
  await sequelize.sync({ force: true });
  
  const user = await User.create({ user_id: 'user1', email: 'test_conc@test.com' });
  const court = await Court.create({ court_id: 'c1', court_name: 'Court Conc' });

  const booking = await Booking.create({
    booking_id: uuidv4(),
    customer_user_id: user.user_id,
    court_id: court.court_id,
    booking_status: 'HOLDING',
    total_amount: 500000,
    booking_date: '2026-10-10',
    start_time: '14:00:00',
    end_time: '15:00:00',
    hold_expiry_at: new Date(Date.now() + 100000)
  });

  const payment = await PaymentService.createPayment(user.user_id, {
    bookingId: booking.booking_id,
    paymentMethod: 'MOMO',
    amount: 500000,
    returnUrl: 'http://test.com'
  });

  // Prepare identical callback payload
  const secretKey = 'test_secret_key_123';
  process.env.MOMO_SECRET_KEY = secretKey;
  process.env.MOMO_ACCESS_KEY = 'test_access_key';
  
  const payload = {
    amount: 500000,
    extraData: '',
    message: 'Success',
    orderId: payment.provider_order_id,
    orderInfo: 'Test Concurrency',
    orderType: 'momo_wallet',
    partnerCode: 'TEST',
    requestId: payment.provider_request_id,
    responseTime: Date.now(),
    resultCode: 0,
    transId: 88888888
  };

  const rawExpected = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${payload.amount}&extraData=${payload.extraData}&message=${payload.message}&orderId=${payload.orderId}&orderInfo=${payload.orderInfo}&orderType=${payload.orderType}&partnerCode=${payload.partnerCode}&requestId=${payload.requestId}&responseTime=${payload.responseTime}&resultCode=${payload.resultCode}&transId=${payload.transId}`;
  
  payload.signature = MoMoUtils.generateSignature(rawExpected, secretKey);

  // Fire 2 concurrent identical callbacks
  console.log('Firing 2 identical concurrent callbacks...');
  const promises = [
    PaymentService.processIpnCallback(payload),
    PaymentService.processIpnCallback(payload)
  ];

  const results = await Promise.allSettled(promises);
  console.log('Results:', results.map(r => r.status)); // Should both be fulfilled returning 200 OK

  // Verification
  const updatedPayment = await Payment.findByPk(payment.payment_id);
  const updatedBooking = await Booking.findByPk(booking.booking_id);
  const ipnLogs = await PaymentIpnLog.findAll({ where: { payment_id: payment.payment_id } });
  const statusHistory = await BookingStatusHistory.findAll({ where: { booking_id: booking.booking_id } });

  console.log('Final Payment Status:', updatedPayment.payment_status); // SUCCESS
  console.log('Final Booking Status:', updatedBooking.booking_status); // CONFIRMED
  
  const processedLogs = ipnLogs.filter(l => l.processing_status === 'PROCESSED');
  const duplicateLogs = ipnLogs.filter(l => l.processing_status === 'DUPLICATE_IGNORED');
  
  console.log(`IPN Logs PROCESSED: ${processedLogs.length}`); // Expected: 1
  console.log(`IPN Logs DUPLICATE_IGNORED: ${duplicateLogs.length}`); // Expected: 1
  
  const confirmedHistory = statusHistory.filter(h => h.to_status === 'CONFIRMED');
  console.log(`Booking Status History 'CONFIRMED' transitions: ${confirmedHistory.length}`); // Expected: 1

  if (processedLogs.length === 1 && duplicateLogs.length === 1 && confirmedHistory.length === 1 && updatedPayment.payment_status === 'SUCCESS') {
    console.log('CONCURRENT CALLBACK TEST: PASS');
  } else {
    console.log('CONCURRENT CALLBACK TEST: FAIL');
  }
  
  process.exit(0);
}

runConcurrencyTest().catch(console.error);
