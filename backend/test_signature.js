const crypto = require('crypto');
const MoMoUtils = require('./src/utils/momo');

function runSignatureTest() {
  console.log('--- SIGNATURE TEST ---');
  
  const secretKey = 'test_secret_key_123';
  process.env.MOMO_ACCESS_KEY = 'test_access_key';
  
  // Known good payload corresponding to the fields in the contract
  const payload = {
    amount: 200000,
    extraData: 'custom_data_here',
    message: 'Successful.',
    orderId: 'pay_9876543210fedcba',
    orderInfo: 'Thanh toan dat san SportHubAI',
    orderType: 'momo_wallet',
    partnerCode: 'MOMO_SPORTHUB',
    requestId: 'req_momo_123456789',
    responseTime: 1723131135000,
    resultCode: 0,
    transId: 2456789012
  };
  
  // Hand-calculate the EXPECTED signature according to the strict MoMo V2 canonical string
  const rawExpected = `accessKey=test_access_key&amount=200000&extraData=custom_data_here&message=Successful.&orderId=pay_9876543210fedcba&orderInfo=Thanh toan dat san SportHubAI&orderType=momo_wallet&partnerCode=MOMO_SPORTHUB&requestId=req_momo_123456789&responseTime=1723131135000&resultCode=0&transId=2456789012`;
  
  const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawExpected)
      .digest('hex');
      
  console.log(`EXPECTED SIGNATURE: ${expectedSignature}`);
  
  // 1. Valid Signature
  const isValid = MoMoUtils.verifyIpnSignature(payload, secretKey, expectedSignature);
  console.log(`valid signature:\n${isValid ? 'ACCEPT' : 'REJECT'}`);
  
  // 2. Tampered Amount
  const tamperedAmount = { ...payload, amount: 999999 };
  const isAmountValid = MoMoUtils.verifyIpnSignature(tamperedAmount, secretKey, expectedSignature);
  console.log(`tampered amount:\n${isAmountValid ? 'ACCEPT' : 'REJECT'}`);

  // 3. Tampered OrderId
  const tamperedOrder = { ...payload, orderId: 'pay_hacked' };
  const isOrderValid = MoMoUtils.verifyIpnSignature(tamperedOrder, secretKey, expectedSignature);
  console.log(`tampered orderId:\n${isOrderValid ? 'ACCEPT' : 'REJECT'}`);

  // 4. Tampered RequestId
  const tamperedRequest = { ...payload, requestId: 'req_hacked' };
  const isRequestValid = MoMoUtils.verifyIpnSignature(tamperedRequest, secretKey, expectedSignature);
  console.log(`tampered requestId:\n${isRequestValid ? 'ACCEPT' : 'REJECT'}`);

  // 5. Tampered resultCode
  const tamperedResult = { ...payload, resultCode: 99 };
  const isResultValid = MoMoUtils.verifyIpnSignature(tamperedResult, secretKey, expectedSignature);
  console.log(`tampered resultCode:\n${isResultValid ? 'ACCEPT' : 'REJECT'}`);

  // 6. Tampered transId
  const tamperedTrans = { ...payload, transId: 9999999999 };
  const isTransValid = MoMoUtils.verifyIpnSignature(tamperedTrans, secretKey, expectedSignature);
  console.log(`tampered transId:\n${isTransValid ? 'ACCEPT' : 'REJECT'}`);

  // 7. Missing signature
  const isMissingValid = MoMoUtils.verifyIpnSignature(payload, secretKey, undefined);
  console.log(`missing signature:\n${isMissingValid ? 'ACCEPT' : 'REJECT'}`);

  // 8. Empty signature
  const isEmptyValid = MoMoUtils.verifyIpnSignature(payload, secretKey, '');
  console.log(`empty signature:\n${isEmptyValid ? 'ACCEPT' : 'REJECT'}`);
  
}

runSignatureTest();
