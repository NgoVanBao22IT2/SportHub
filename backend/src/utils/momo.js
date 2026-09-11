'use strict';

class MoMoUtils {
  static async createPaymentRequest() {
    return { payUrl: null, deeplink: null };
  }

  static verifyIpnSignature() {
    return true;
  }
}

module.exports = MoMoUtils;
