import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { forgotPassword } from '../api/auth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError('Vui lòng nhập email.');
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      await forgotPassword(email.trim());
      // Always show generic success — prevent email enumeration
      setIsSubmitted(true);
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'EMAIL_REQUIRED') {
        setEmailError('Vui lòng nhập email.');
      } else {
        setApiError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-surface-subtle px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold italic text-2xl mx-auto mb-4">
            S
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu</h1>
          <p className="text-text-muted mt-1 text-sm">
            Nhập email đã đăng ký để nhận mã khôi phục mật khẩu.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-border-subtle-medium p-8">
          {isSubmitted ? (
            /* Success State — generic to prevent enumeration */
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-status-success mx-auto mb-3" />
              <h2 className="text-lg font-bold text-gray-900 mb-2">Kiểm tra hộp thư của bạn</h2>
              <p className="text-text-muted text-sm leading-relaxed">
                Nếu email{' '}
                <span className="font-semibold text-gray-700">{email}</span>{' '}
                tồn tại trong hệ thống, mã khôi phục sẽ được gửi đến hộp thư của bạn.
              </p>
              <p className="text-text-muted-light text-xs mt-3">
                Vui lòng kiểm tra cả thư mục Spam/Junk nếu không thấy email.
              </p>

              <div className="mt-6 space-y-2">
                <Link
                  to="/reset-password"
                  className="block w-full py-2.5 px-4 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg text-sm font-medium text-center transition-colors"
                >
                  Nhập mã khôi phục
                </Link>
                <button
                  type="button"
                  onClick={() => { setIsSubmitted(false); setEmail(''); }}
                  className="block w-full py-2.5 px-4 text-text-muted hover:text-gray-700 text-sm font-medium text-center transition-colors"
                >
                  Gửi lại mã
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* API Error */}
              {apiError && (
                <div className="p-3 bg-status-error-bg border border-status-error/30 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-status-error mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-status-error-text">{apiError}</span>
                </div>
              )}

              {/* Email */}
              <Input
                id="forgot-password-email"
                name="email"
                type="email"
                label="Email"
                placeholder="Nhập địa chỉ email đã đăng ký"
                value={email}
                onChange={handleChange}
                error={emailError}
                disabled={loading}
                required
                leftIcon={<Mail size={16} />}
                autoComplete="email"
              />

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading}
                size="lg"
                id="forgot-password-submit-btn"
              >
                {loading ? 'Đang gửi...' : 'Gửi mã khôi phục'}
              </Button>
            </form>
          )}

          {/* Navigation links */}
          <div className="mt-6 text-center text-sm text-text-muted space-y-1">
            <p>
              <Link to="/login" className="text-accent-primary hover:text-accent-primary-hover transition-colors">
                ← Quay lại đăng nhập
              </Link>
            </p>
            <p>
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-brand-orange hover:text-brand-orange-hover font-semibold transition-colors">
                Đăng ký
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
