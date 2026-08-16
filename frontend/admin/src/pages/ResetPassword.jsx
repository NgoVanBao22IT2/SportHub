import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { resetPassword } from '../api/auth';

// Design System Imports
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract query parameters if accessed via email link (?email=user@example.com&token=123456)
  const queryEmail = searchParams.get('email') || '';
  const queryToken = searchParams.get('token') || searchParams.get('resetToken') || '';

  // Form State
  const [email, setEmail] = useState(queryEmail);
  const [resetToken, setResetToken] = useState(queryToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI Visibility States
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status States
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [backendError, setBackendError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto pre-fill if query parameters update
  useEffect(() => {
    if (queryEmail) setEmail(queryEmail);
    if (queryToken) setResetToken(queryToken);
  }, [queryEmail, queryToken]);

  // Frontend Validation Handler
  const validateForm = () => {
    const errors = {};

    if (!email || !email.trim()) {
      errors.email = 'Vui lòng nhập email.';
    }

    if (!resetToken || !resetToken.trim()) {
      errors.resetToken = 'Vui lòng nhập mã xác nhận.';
    }

    if (!newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng nhập xác nhận mật khẩu.';
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setBackendError('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await resetPassword({
        email: email.trim(),
        resetToken: resetToken.trim(),
        newPassword,
      });

      // Clear password fields for security
      setNewPassword('');
      setConfirmPassword('');
      setIsSuccess(true);
    } catch (err) {
      console.error('Failed to reset password', err);
      const code = err.response?.data?.code;
      const message = err.response?.data?.message;

      if (code === 'INVALID_RESET_TOKEN' || code === 'EXPIRED_TOKEN') {
        setBackendError('Mã khôi phục không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.');
      } else if (code === 'INVALID_PASSWORD') {
        setFieldErrors((prev) => ({ ...prev, newPassword: 'Mật khẩu phải có ít nhất 6 ký tự.' }));
      } else {
        setBackendError(message || 'Đã xảy ra lỗi khi đặt lại mật khẩu. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full bg-surface-subtle min-h-screen py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">

        {/* LOGO & TITLE HEADER */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded-lg">
            <span className="text-2xl font-black tracking-tight text-gray-900">
              Sport<span className="text-brand-orange">Hub</span><span className="text-accent-primary">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {isSuccess ? 'Đặt lại mật khẩu thành công' : 'Đặt lại mật khẩu'}
          </h1>
          <p className="text-sm text-text-muted">
            {isSuccess
              ? 'Tài khoản của bạn đã được cập nhật mật khẩu mới.'
              : 'Nhập mã xác nhận và mật khẩu mới để khôi phục tài khoản.'}
          </p>
        </div>

        {/* CARD CONTAINER */}
        <Card padding="lg" radius="xl" className="border border-border-subtle-medium shadow-md">
          {isSuccess ? (
            /* STATE 5 — SUCCESS STATE */
            <div className="text-center space-y-6 py-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  Mật khẩu của bạn đã được thay đổi thành công. Bạn có thể đăng nhập ngay bằng mật khẩu mới.
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate('/login')}
              >
                Đăng nhập ngay
              </Button>
            </div>
          ) : (
            /* FORM STATES (INITIAL / VALIDATION ERROR / LOADING / BACKEND ERROR) */
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              
              {/* BACKEND ERROR ALERT */}
              {backendError && (
                <div role="alert" className="p-3.5 bg-status-danger-bg border border-status-danger-text/20 rounded-xl text-status-danger-text text-sm flex items-start gap-2.5">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{backendError}</span>
                </div>
              )}

              {/* EMAIL FIELD */}
              <Input
                label="Địa chỉ Email"
                type="email"
                name="email"
                placeholder="vd: user@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                disabled={loading}
                required
                error={fieldErrors.email}
                leftIcon={<Mail size={18} />}
              />

              {/* RESET TOKEN / CODE FIELD */}
              <Input
                label="Mã xác nhận (Reset Token)"
                type="text"
                name="resetToken"
                placeholder="Nhập mã xác nhận từ email"
                value={resetToken}
                onChange={(e) => {
                  setResetToken(e.target.value);
                  if (fieldErrors.resetToken) setFieldErrors((prev) => ({ ...prev, resetToken: undefined }));
                }}
                disabled={loading}
                required
                error={fieldErrors.resetToken}
                leftIcon={<KeyRound size={18} />}
              />

              {/* NEW PASSWORD FIELD */}
              <Input
                label="Mật khẩu mới"
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                placeholder="Tối thiểu 6 ký tự"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (fieldErrors.newPassword) setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
                }}
                disabled={loading}
                required
                error={fieldErrors.newPassword}
                leftIcon={<Lock size={18} />}
                rightIcon={
                  <button
                    type="button"
                    aria-label={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiển thị mật khẩu mới'}
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="text-text-muted hover:text-gray-700 focus:outline-none p-1 rounded"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {/* CONFIRM PASSWORD FIELD */}
              <Input
                label="Xác nhận mật khẩu mới"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                disabled={loading}
                required
                error={fieldErrors.confirmPassword}
                leftIcon={<Lock size={18} />}
                rightIcon={
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiển thị xác nhận mật khẩu'}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="text-text-muted hover:text-gray-700 focus:outline-none p-1 rounded"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                className="mt-2"
              >
                {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </Button>

              {/* BACK TO LOGIN LINK */}
              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-semibold text-brand-orange hover:text-brand-orange-hover gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
                >
                  <ArrowLeft size={14} />
                  <span>Quay lại đăng nhập</span>
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
}
