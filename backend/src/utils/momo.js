const crypto = require('crypto');

class MoMoUtils {
  /**
   * Generates HMAC-SHA256 signature for MoMo API requests/IPNs.
   * Following the standard MoMo canonical string format.
   */
  static generateSignature(rawSignature, secretKey) {
    return crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');
  }

  /**
   * Verify IPN signature
   */
  static verifyIpnSignature(payload, secretKey, expectedSignature) {
    const {
      amount, extraData, message, orderId, orderInfo,
      orderType, partnerCode, requestId, responseTime,
      resultCode, transId
    } = payload;
    
    const accessKey = process.env.MOMO_ACCESS_KEY || 'default_access_key';

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    
    const computedSignature = MoMoUtils.generateSignature(rawSignature, secretKey);
    
    if (!expectedSignature) return false;

    // Constant time comparison
    try {
      const computedBuffer = Buffer.from(computedSignature, 'utf8');
      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      
      if (computedBuffer.length !== expectedBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(computedBuffer, expectedBuffer);
    } catch (e) {
      return false;
    }
  }

  /**
   * Send Payment Request to MoMo Sandbox/Production Gateway API
   */
  static async createPaymentRequest(params) {
    const axios = require('axios');
    const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO_TEST';
    const accessKey = process.env.MOMO_ACCESS_KEY || 'TEST_ACCESS_KEY';
    const secretKey = process.env.MOMO_SECRET_KEY || 'TEST_SECRET_KEY';
    const endpoint = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
    const redirectUrl = params.redirectUrl || process.env.MOMO_REDIRECT_URL || 'http://localhost:5173/checkout';
    const ipnUrl = params.ipnUrl || process.env.MOMO_IPN_URL || 'http://localhost:3000/api/v1/payments/momo/ipn';
    
    const requestType = "captureWallet";
    const extraData = params.extraData || "";
    const orderGroupInfo = "";
    const autoCapture = true;
    const lang = "vi";

    const rawSignature = `accessKey=${accessKey}&amount=${params.amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${params.orderId}&orderInfo=${params.orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${params.requestId}&requestType=${requestType}`;
    const signature = MoMoUtils.generateSignature(rawSignature, secretKey);

    const requestBody = {
      partnerCode,
      partnerName: "SportHubAI",
      storeId: "SportHubStore",
      requestId: params.requestId,
      amount: params.amount,
      orderId: params.orderId,
      orderInfo: params.orderInfo,
      redirectUrl,
      ipnUrl,
      lang,
      requestType,
      autoCapture,
      extraData,
      orderGroupInfo,
      signature
    };

    try {
      const response = await axios.post(endpoint, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      return response.data;
    } catch (err) {
      console.warn("MoMo Sandbox API Call Notice:", err.message);
      // Return structured response for test/sandbox fallback handling
      return {
        resultCode: 99,
        message: err.response?.data?.message || err.message,
        payUrl: redirectUrl + `?orderId=${params.orderId}&resultCode=0&message=Sandbox_Mock_Pay`
      };
    }
  }
}

module.exports = MoMoUtils;
