'use strict';

const nodemailer = require('nodemailer');

/**
 * Email Service Implementation using Nodemailer & Gmail SMTP
 * Isolates email delivery logic from authentication core services
 */
class EmailService {
  constructor() {
    this.transporter = null;
  }

  getTransporter() {
    if (!this.transporter) {
      const host = process.env.SMTP_HOST || 'smtp.gmail.com';
      const port = Number(process.env.SMTP_PORT) || 587;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (!user || !pass) {
        const err = new Error('SMTP configuration is incomplete. SMTP_USER and SMTP_PASS environment variables are required.');
        err.statusCode = 500;
        err.code = 'SMTP_CONFIG_ERROR';
        throw err;
      }

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
    }

    return this.transporter;
  }

  /**
   * Verify SMTP connection status without exposing secrets in logs
   */
  async verifyConnection() {
    const transporter = this.getTransporter();
    await transporter.verify();
    return true;
  }

  /**
   * Send OTP Verification code email
   */
  async sendOTP(email, otpCode, purpose = 'REGISTRATION') {
    const transporter = this.getTransporter();
    const from = process.env.FROM_EMAIL || `"SportHubAI" <${process.env.SMTP_USER}>`;

    const mailOptions = {
      from,
      to: email,
      subject: `[SportHubAI] Mã xác minh ${purpose === 'REGISTRATION' ? 'đăng ký tài khoản' : 'xác thực'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #ea580c; text-align: center; font-size: 24px; margin-bottom: 8px;">SportHubAI</h2>
          <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 0;">Hệ Thống Đặt Lịch & Quản Lý Sân Thể Thao Trực Tuyến</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #334155; font-size: 15px;">Xin chào,</p>
          <p style="color: #334155; font-size: 15px;">Mã xác nhận (OTP) của bạn cho thao tác <strong>${purpose}</strong> là:</p>
          <div style="background-color: #fff7ed; border: 1px dashed #fdba74; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #ea580c; margin: 20px 0; border-radius: 8px;">
            ${otpCode}
          </div>
          <p style="color: #64748b; font-size: 13px;">Mã xác nhận có hiệu lực trong vòng <strong>10 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai để đảm bảo an toàn tài khoản.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Email này được gửi tự động từ hệ thống SportHubAI. Vui lòng không phản hồi trực tiếp email này.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  }

  /**
   * Send Password Reset token email
   */
  async sendPasswordResetLink(email, resetToken) {
    const transporter = this.getTransporter();
    const from = process.env.FROM_EMAIL || `"SportHubAI Support" <${process.env.SMTP_USER}>`;

    const mailOptions = {
      from,
      to: email,
      subject: '[SportHubAI] Yêu cầu đặt lại mật khẩu tài khoản',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #ea580c; text-align: center; font-size: 24px; margin-bottom: 8px;">SportHubAI</h2>
          <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 0;">Hệ Thống Đặt Lịch & Quản Lý Sân Thể Thao Trực Tuyến</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #334155; font-size: 15px;">Xin chào,</p>
          <p style="color: #334155; font-size: 15px;">Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản SportHubAI của bạn.</p>
          <p style="color: #334155; font-size: 15px;">Mã khôi phục mật khẩu (Reset Token) của bạn là:</p>
          <div style="background-color: #fff7ed; border: 1px dashed #fdba74; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #ea580c; margin: 20px 0; border-radius: 8px;">
            ${resetToken}
          </div>
          <p style="color: #64748b; font-size: 13px;">Mã xác nhận có hiệu lực trong vòng <strong>15 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai để đảm bảo an toàn tài khoản.</p>
          <p style="color: #64748b; font-size: 13px;">Nếu bạn không thực hiện yêu cầu này, xin vui lòng bỏ qua email này. Mật khẩu của bạn sẽ giữ nguyên không thay đổi.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Email này được gửi tự động từ hệ thống SportHubAI. Vui lòng không phản hồi trực tiếp email này.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  }
}

module.exports = new EmailService();
