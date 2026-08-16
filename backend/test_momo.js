require('dotenv').config();
const { sequelize, User, Court, Booking, Payment, PaymentIpnLog } = require('./src/models');
const PaymentService = require('./src/services/payment.service');
const MoMoUtils = require('./src/utils/momo');

async function runMoMoTest() {
  console.log('Starting MoMo Test...');
  await sequelize.sync({ force: true });
  
  const user = await User.create({ user_id: 'user1', email: 'test@test.com' });
  const court = await Court.create({ court_id: 'c1', court_name: 'Court 1' });

  // Create HOLDING booking
  const booking = await Booking.create({
    booking_id: 'b1',
    customer_user_id: user.user_id,
    court_id: court.court_id,
    booking_status: 'HOLDING',
    total_amount: 150000,
    booking_date: '2026-10-10',
    start_time: '10:00:00',
    end_time: '11:00:00',
    hold_expiry_at: new Date(Date.now() + 100000)
  });

  // 1. Test createPayment
  console.log('Testing createPayment...');
  const payment = await PaymentService.createPayment(user.user_id, {
    bookingId: booking.booking_id,
    paymentMethod: 'MOMO',
    amount: 150000,
    returnUrl: 'http://test.com'
  });
  console.log('Created Payment:', payment.payment_status); // INITIATED

  // 2. Simulate valid IPN Callback
  const secretKey = 'test_secret';
  process.env.MOMO_SECRET_KEY = secretKey;
  
  const payload = {
    partnerCode: 'TEST',
    orderId: payment.provider_order_id,
    requestId: payment.provider_request_id,
    amount: 150000,
    orderInfo: 'Test Order',
    orderType: 'momo_wallet',
    transId: 99999999,
    resultCode: 0,
    message: 'Success',
    responseTime: Date.now(),
    extraData: '',
    payType: 'web'
  };

  const rawSignature = `accessKey=default_access_key&amount=${payload.amount}&extraData=${payload.extraData}&message=${payload.message}&orderId=${payload.orderId}&orderInfo=${payload.orderInfo}&orderType=${payload.orderType}&partnerCode=${payload.partnerCode}&payType=${payload.payType}&requestId=${payload.requestId}&responseTime=${payload.responseTime}&resultCode=${payload.resultCode}&transId=${payload.transId}`;
  payload.signature = MoMoUtils.generateSignature(rawSignature, secretKey);

  console.log('Testing valid IPN Callback...');
  const result = await PaymentService.processIpnCallback(payload);
  console.log('Callback Result:', result);

  // Check state
  const updatedPayment = await Payment.findByPk(payment.payment_id);
  const updatedBooking = await Booking.findByPk(booking.booking_id);
  console.log('Payment Status after IPN:', updatedPayment.payment_status); // SUCCESS
  console.log('Booking Status after IPN:', updatedBooking.booking_status); // CONFIRMED

  // 3. Test duplicate IPN (Idempotency)
  console.log('Testing duplicate IPN Callback...');
  const result2 = await PaymentService.processIpnCallback(payload);
  console.log('Duplicate Callback Result:', result2);
  
  // 4. Test bad signature
  console.log('Testing bad signature IPN Callback...');
  const badPayload = { ...payload, amount: 200000 };
  try {
    await PaymentService.processIpnCallback(badPayload);
    console.log('FAIL: Bad signature accepted');
  } catch (err) {
    console.log('PASS: Bad signature rejected with', err.message);
  }

  process.exit(0);
}

runMoMoTest().catch(console.error);
