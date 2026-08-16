import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { verifyOTP } from '../api/auth';
import Button from '../components/ui/Button';

const ERROR_MESSAGES = {
  INVALID_OTP: 'Mã OTP không hợp lệ hoặc đã hết hạn.',
  EXPIRED_OTP: 'Mã OTP đã hết hạn. Vui lòng đăng ký lại.',
  INCORRECT_OTP: 'Mã OTP không chính xác. Vui lòng thử lại.',
};

const OTP_LENGTH = 6;

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const emailFromQuery = searchParams.get('email') || '';
  const successMessage = location.state?.successMessage || '';

  const [email] = useState(emailFromQuery);
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setApiError('');

    // Auto-advance to next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (value && newDigits.every((d) => d !== '') && index === OTP_LENGTH - 1) {
      submitOTP(newDigits.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newDigits = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { newDigits[i] = ch; });
    setDigits(newDigits);
    // Focus last filled or last
    const lastIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastIdx]?.focus();
    if (pasted.length === OTP_LENGTH) {
      submitOTP(pasted);
    }
  };

  const submitOTP = async (code) => {
    if (!email) {
      setApiError('Không tìm thấy email. Vui lòng đăng ký lại.');
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      await verifyOTP({ email, otpCode: code, purpose: 'REGISTRATION' });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login', {
          state: {
            successMessage: 'Xác thực email thành công! Bạn có thể đăng nhập ngay.',
            email,
          },
        });
      }, 2000);
    } catch (err) {
      const code_err = err.response?.data?.code;
      const msg = ERROR_MESSAGES[code_err] || err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      setApiError(msg);
      // Reset digits on error
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < OTP_LENGTH) {
      setApiError('Vui lòng nhập đủ 6 chữ số OTP.');
      return;
    }
    submitOTP(code);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-surface-subtle px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold italic text-2xl mx-auto mb-4">
            S
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Xác thực Email</h1>
          <p className="text-text-muted mt-1 text-sm">
            Nhập mã OTP 6 chữ số được gửi đến{' '}
            <span className="font-semibold text-gray-700">{email || 'email của bạn'}</span>
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-border-subtle-medium p-8">
          {isSuccess ? (
            /* Success State */
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-status-success mx-auto mb-3" />
              <h2 className="text-lg font-bold text-gray-900 mb-2">Xác thực thành công!</h2>
              <p className="text-text-muted text-sm">Đang chuyển hướng đến trang đăng nhập...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Success message from register */}
              {successMessage && (
                <div className="mb-5 p-3 bg-status-success-bg border border-status-success/30 rounded-lg flex items-start gap-2">
                  <Mail size={16} className="text-status-success-text mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-status-success-text">{successMessage}</span>
                </div>
              )}

              {/* API Error */}
              {apiError && (
                <div className="mb-5 p-3 bg-status-error-bg border border-status-error/30 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-status-error mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-status-error-text">{apiError}</span>
                </div>
              )}

              {/* OTP Input Boxes */}
              <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    id={`otp-digit-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={loading}
                    className={[
                      'w-12 h-14 text-center text-xl font-bold rounded-lg border-2 transition-all duration-200',
                      'focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20',
                      digit ? 'border-brand-orange bg-brand-orange-light text-gray-900' : 'border-border-subtle-medium bg-white text-gray-900',
                      loading ? 'opacity-60 cursor-not-allowed' : '',
                    ].filter(Boolean).join(' ')}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading || digits.some((d) => d === '')}
                size="lg"
                id="verify-otp-submit-btn"
              >
                {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
              </Button>

              {/* Back to register */}
              <div className="mt-4 text-center text-sm text-text-muted">
                <span>Chưa nhận được mã? </span>
                <Link
                  to="/register"
                  className="text-brand-orange hover:text-brand-orange-hover font-semibold transition-colors"
                >
                  Đăng ký lại
                </Link>
              </div>

              {/* Note about resend */}
              <p className="mt-3 text-xs text-text-muted-light text-center">
                * Backend hiện chưa hỗ trợ resend OTP. Nếu mã hết hạn, vui lòng đăng ký lại.
              </p>
            </form>
          )}
        </div>

        <p className="text-center mt-4 text-sm text-text-muted">
          <Link to="/login" className="text-accent-primary hover:text-accent-primary-hover transition-colors">
            ← Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
