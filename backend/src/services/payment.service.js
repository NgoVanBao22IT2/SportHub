const { v4: uuidv4 } = require('uuid');
const { 
  sequelize, 
  Booking, 
  Payment, 
  PaymentIpnLog, 
  RefundTransaction,
  BookingStatusHistory
} = require('../models');
const MoMoUtils = require('../utils/momo');
const { Op } = require('sequelize');

class PaymentService {
  /**
   * 10.02 Initialize Payment
   */
  static async createPayment(userId, payload) {
    const { bookingId, paymentMethod, amount, returnUrl } = payload;

    // Normalize Payment Method
    const methodUpper = (paymentMethod || 'MOMO').toUpperCase();
    if (!['MOMO', 'BANK_TRANSFER', 'CASH'].includes(methodUpper)) {
      const err = new Error('Unsupported payment method');
      err.statusCode = 400;
      throw err;
    }

    const transaction = await sequelize.transaction();
    try {
      // 1. Lock the booking to prevent concurrent payment creation
      const booking = await Booking.findOne({
        where: { booking_id: bookingId },
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!booking) {
        const err = new Error('Booking not found');
        err.statusCode = 404;
        err.code = 'PAYMENT_BOOKING_NOT_FOUND';
        throw err;
      }

      // 2. Authorize (allow if booking customer matches or if booking is guest)
      if (booking.customer_user_id && booking.customer_user_id !== userId) {
        const err = new Error('Forbidden');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }

      // 3. Check Booking Status & Expiry (BR-BOOK-003)
      if (!['HOLDING', 'PAYMENT_PENDING', 'PAYMENT_FAILED'].includes(booking.booking_status)) {
        const err = new Error('Booking is not in a payable state');
        err.statusCode = 400;
        err.code = 'PAYMENT_BOOKING_EXPIRED';
        throw err;
      }

      // 10 min hold check:
      if (booking.hold_expiry_at && new Date() > new Date(booking.hold_expiry_at)) {
        booking.booking_status = 'EXPIRED';
        await booking.save({ transaction });
        const err = new Error('Booking hold expired');
        err.statusCode = 400;
        err.code = 'PAYMENT_BOOKING_EXPIRED';
        throw err;
      }

      // 4. Server-Authoritative Amount
      const serverAmount = parseFloat(booking.total_amount);
      if (amount && serverAmount !== parseFloat(amount)) {
        const err = new Error('Amount mismatch');
        err.statusCode = 400;
        err.code = 'PAYMENT_AMOUNT_MISMATCH';
        throw err;
      }

      // 5. Check existing successful payments
      const existingSuccess = await Payment.findOne({
        where: { booking_id: bookingId, payment_status: 'SUCCESS' },
        transaction
      });

      if (existingSuccess) {
        const err = new Error('Booking is already paid');
        err.statusCode = 409;
        throw err;
      }

      // 6. Create Payment Record (INITIATED)
      const paymentId = uuidv4();
      const orderId = paymentId;
      const requestId = 'req_' + Date.now();

      let payUrl = null;
      if (methodUpper === 'MOMO') {
        const momoRes = await MoMoUtils.createPaymentRequest({
          amount: Math.round(serverAmount),
          orderId,
          orderInfo: `Thanh toan dat san SportHub #${bookingId.substring(0, 8)}`,
          requestId,
          redirectUrl: returnUrl || process.env.MOMO_REDIRECT_URL || 'http://localhost:5173/checkout'
        });
        payUrl = momoRes.payUrl || momoRes.deeplink || `https://payment.momo.vn/v2/gateway/pay?orderId=${orderId}`;
      } else {
        payUrl = `/checkout?paymentId=${paymentId}&status=bank_instructions`;
      }

      const payment = await Payment.create({
        payment_id: paymentId,
        booking_id: bookingId,
        user_id: userId,
        payment_method: methodUpper,
        amount: serverAmount,
        currency: 'VND',
        payment_status: 'INITIATED',
        provider_order_id: orderId,
        provider_request_id: requestId,
        pay_url: payUrl
      }, { transaction });

      // Transition booking to PAYMENT_PENDING
      booking.booking_status = 'PAYMENT_PENDING';
      await booking.save({ transaction });

      // Audit transition
      await BookingStatusHistory.create({
        history_id: uuidv4(),
        booking_id: bookingId,
        from_status: booking.booking_status,
        to_status: 'PAYMENT_PENDING',
        changed_by_user_id: userId,
        change_reason: `Payment Intent Created (${methodUpper})`
      }, { transaction });

      await transaction.commit();
      return payment;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 10.03 MoMo IPN Callback
   */
  static async processIpnCallback(payload) {
    const {
      partnerCode, orderId, requestId, amount, orderInfo,
      orderType, transId, resultCode, message, responseTime,
      extraData, signature, payType
    } = payload;

    const secretKey = process.env.MOMO_SECRET_KEY || 'default_secret_key_for_test';
    const accessKey = process.env.MOMO_ACCESS_KEY || 'default_access_key';

    // Verify Signature
    const payloadForSign = {
      accessKey, amount, extraData: extraData || '', message, orderId, orderInfo,
      orderType, partnerCode, payType: payType || '', requestId, responseTime,
      resultCode, transId
    };

    const isSignatureValid = MoMoUtils.verifyIpnSignature(payloadForSign, secretKey, signature);
    
    if (!isSignatureValid) {
      // Log invalid signature attempt asynchronously (fire and forget for this audit)
      PaymentIpnLog.create({
        ipn_id: uuidv4(),
        provider_order_id: orderId,
        provider_trans_id: String(transId),
        provider_request_id: requestId,
        result_code: resultCode,
        signature: signature || '',
        signature_verified: false,
        raw_payload: JSON.stringify(payload),
        processing_status: 'INVALID_SIGNATURE'
      }).catch(console.error);

      const err = new Error('Invalid signature');
      err.statusCode = 400;
      err.code = 'PAYMENT_SIGNATURE_INVALID';
      throw err;
    }

    const transaction = await sequelize.transaction();
    try {
      // 1. Locate and Lock Payment First
      const payment = await Payment.findOne({
        where: { provider_order_id: orderId },
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!payment) {
        await transaction.rollback();
        return { resultCode: 0, message: "Confirmed" };
      }

      // 2. Validate provider identifiers and amount
      if (parseFloat(payment.amount) !== parseFloat(amount)) {
        await transaction.rollback();
        const err = new Error('Amount mismatch');
        err.statusCode = 400;
        err.code = 'PAYMENT_AMOUNT_MISMATCH';
        throw err;
      }

      // 3. Detect Duplicate / Idempotency Check inside lock
      const existingIpn = await PaymentIpnLog.findOne({
        where: { 
          provider_trans_id: String(transId),
          processing_status: 'PROCESSED'
        },
        transaction
      });

      if (existingIpn) {
        await PaymentIpnLog.create({
          ipn_id: uuidv4(),
          payment_id: payment.payment_id,
          provider_order_id: orderId,
          provider_trans_id: String(transId),
          provider_request_id: requestId,
          result_code: resultCode,
          signature: signature,
          signature_verified: true,
          raw_payload: JSON.stringify(payload),
          processing_status: 'DUPLICATE_IGNORED'
        }, { transaction });
        await transaction.commit();
        return { resultCode: 0, message: "Confirmed" };
      }

      // Check if Payment is already in Terminal State from a DIFFERENT transId
      if (['SUCCESS', 'FAILED', 'EXPIRED', 'REFUNDED'].includes(payment.payment_status)) {
        await transaction.rollback();
        return { resultCode: 0, message: "Confirmed" };
      }

      // 4. Update Payment State
      const isSuccess = resultCode === 0;
      payment.payment_status = isSuccess ? 'SUCCESS' : 'FAILED';
      payment.provider_trans_id = String(transId);
      payment.result_code = resultCode;
      payment.result_message = message;
      
      if (isSuccess) payment.paid_at = new Date();
      else payment.failed_at = new Date();

      await payment.save({ transaction });

      // 5. Update Booking State Atomically
      const booking = await Booking.findOne({
        where: { booking_id: payment.booking_id },
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (booking) {
        const oldStatus = booking.booking_status;
        booking.booking_status = isSuccess ? 'WAITING_OWNER_CONFIRMATION' : 'PAYMENT_FAILED';
        await booking.save({ transaction });

        await BookingStatusHistory.create({
          history_id: uuidv4(),
          booking_id: booking.booking_id,
          from_status: oldStatus,
          to_status: booking.booking_status,
          changed_by_user_id: null,
          change_reason: `IPN Callback - ${isSuccess ? 'Payment Success, Waiting Owner Confirmation' : 'Payment Failed'}`
        }, { transaction });
      }

      // 6. Log IPN
      await PaymentIpnLog.create({
        ipn_id: uuidv4(),
        payment_id: payment.payment_id,
        provider_order_id: orderId,
        provider_trans_id: String(transId),
        provider_request_id: requestId,
        result_code: resultCode,
        signature: signature,
        signature_verified: true,
        raw_payload: JSON.stringify(payload),
        processing_status: 'PROCESSED'
      }, { transaction });

      await transaction.commit();
      return { resultCode: 0, message: "Confirmed" };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 10.05 Get Payment Status
   */
  static async getPaymentStatus(userId, paymentId, userRole) {
    const payment = await Payment.findOne({
      where: { payment_id: paymentId },
      include: [{ model: Booking, as: 'booking' }]
    });

    if (!payment) {
      const err = new Error('Payment not found');
      err.statusCode = 404;
      err.code = 'PAYMENT_NOT_FOUND';
      throw err;
    }

    // RBAC
    if (userRole === 'CUSTOMER' && payment.user_id !== userId) {
      const err = new Error('Forbidden');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }
    // Note: Owners/Admins would be allowed to view it

    return payment;
  }

  /**
   * 10.06 Refund Payment
   */
  static async refundPayment(userId, paymentId, reason) {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      const err = new Error('Payment not found');
      err.statusCode = 404;
      err.code = 'PAYMENT_NOT_FOUND';
      throw err;
    }

    // Only SUCCESS payments can be refunded
    if (payment.payment_status !== 'SUCCESS') {
      const err = new Error('Payment not eligible for refund');
      err.statusCode = 400;
      err.code = 'PAYMENT_NOT_ELIGIBLE_FOR_REFUND';
      throw err;
    }

    // Call external provider (Mock) OUTSIDE of DB transaction
    // If external provider fails: throw 502 Bad Gateway
    // This maintains External Transaction Consistency: DB is not locked during network IO,
    // and DB is not left in a half-state if network fails.
    let providerRefundTransId;
    try {
      // Mock network call
      providerRefundTransId = 'mock_momo_refund_' + Date.now();
    } catch (networkError) {
      const err = new Error('Refund failed at provider');
      err.statusCode = 502;
      err.code = 'PAYMENT_REFUND_PROVIDER_FAILED';
      throw err;
    }

    const transaction = await sequelize.transaction();
    try {
      // Re-fetch with lock
      const lockedPayment = await Payment.findOne({
        where: { payment_id: paymentId },
        lock: transaction.LOCK.UPDATE,
        transaction
      });
      
      if (lockedPayment.payment_status !== 'SUCCESS') {
        // State changed during network call
        await transaction.rollback();
        const err = new Error('Payment state changed, refund aborted');
        err.statusCode = 409;
        throw err;
      }

      const refundId = uuidv4();
      const refundAmount = parseFloat(lockedPayment.amount);

      await RefundTransaction.create({
        refund_id: refundId,
        payment_id: paymentId,
        booking_id: lockedPayment.booking_id,
        refund_amount: refundAmount,
        currency: 'VND',
        refund_reason: reason,
        refund_status: 'SUCCESS',
        provider_refund_trans_id: providerRefundTransId,
        requested_by_user_id: userId,
        refunded_at: new Date()
      }, { transaction });

      // Transition Payment to REFUNDED
      lockedPayment.payment_status = 'REFUNDED';
      lockedPayment.refunded_at = new Date();
      await lockedPayment.save({ transaction });

      // Transition Booking to CANCELLED
      const booking = await Booking.findOne({
        where: { booking_id: lockedPayment.booking_id },
        lock: transaction.LOCK.UPDATE,
        transaction
      });
      
      const oldStatus = booking.booking_status;
      booking.booking_status = 'CANCELLED';
      booking.cancellation_reason = reason;
      booking.cancelled_by_user_id = userId;
      booking.cancelled_at = new Date();
      await booking.save({ transaction });

      await BookingStatusHistory.create({
        history_id: uuidv4(),
        booking_id: booking.booking_id,
        from_status: oldStatus,
        to_status: 'CANCELLED',
        changed_by_user_id: userId,
        change_reason: 'Refund Processed'
      }, { transaction });

      await transaction.commit();
      
      return {
        refundId,
        paymentId,
        amount: refundAmount,
        currency: 'VND',
        status: 'REFUNDED',
        refundedAt: lockedPayment.refunded_at
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get Payment by ID with full booking details
   */
  static async getPaymentById(paymentId) {
    const { Court, Branch, Venue } = require('../models');
    const payment = await Payment.findOne({
      where: { payment_id: paymentId },
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [
            {
              model: Court,
              as: 'court',
              include: [
                {
                  model: Branch,
                  as: 'branch',
                  include: [{ model: Venue, as: 'venue' }]
                }
              ]
            }
          ]
        }
      ]
    });

    if (!payment) {
      const err = new Error('Payment transaction not found');
      err.statusCode = 404;
      throw err;
    }

    return payment;
  }

  /**
   * Upload Payment Proof Image
   */
  static async uploadProof(paymentId, userId, proofUrl) {
    const payment = await Payment.findOne({ where: { payment_id: paymentId } });
    if (!payment) {
      const err = new Error('Payment transaction not found');
      err.statusCode = 404;
      throw err;
    }

    const booking = await Booking.findOne({ where: { booking_id: payment.booking_id } });
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    booking.payment_proof_url = proofUrl;
    if (booking.booking_status === 'PAYMENT_PENDING' || booking.booking_status === 'HOLDING') {
      booking.booking_status = 'WAITING_OWNER_CONFIRMATION';
    }
    await booking.save();

    return { payment, booking };
  }
}

module.exports = PaymentService;
