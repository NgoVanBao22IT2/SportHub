import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

// Map backend error codes to Vietnamese user-facing messages
const ERROR_MESSAGES = {
  EMAIL_REQUIRED: 'Vui lòng nhập email.',
  INVALID_PASSWORD: 'Vui lòng nhập mật khẩu.',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác.',
  ACCOUNT_UNVERIFIED: 'Tài khoản của bạn chưa được xác thực email.',
  ACCOUNT_SUSPENDED: 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ hỗ trợ.',
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { saveSession } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // Message from register/verify-otp redirect
  const successMessage = location.state?.successMessage || '';
  const prefillEmail = location.state?.email || '';

  // Pre-fill email if coming from register flow
  useState(() => {
    if (prefillEmail) setForm((f) => ({ ...f, email: prefillEmail }));
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((fe) => ({ ...fe, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const errors = {};
    if (!form.email.trim()) errors.email = 'Vui lòng nhập email.';
    if (!form.password) errors.password = 'Vui lòng nhập mật khẩu.';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const res = await login({ email: form.email.trim(), password: form.password });
      const { accessToken, refreshToken, user } = res.data;

      saveSession(accessToken, refreshToken, user);

      // Determine default destination based on user primary_role
      const userRole = (user?.primary_role || user?.role || '').toUpperCase();
      let defaultDestination = '/';
      if (userRole === 'ADMIN') {
        defaultDestination = '/admin/dashboard';
      } else if (userRole === 'OWNER') {
        defaultDestination = '/owner/dashboard';
      }

      // Navigate to intended destination or role default
      const from = location.state?.from || defaultDestination;
      navigate(from, { replace: true });
    } catch (err) {
      const code = err.response?.data?.code;
      const msg = ERROR_MESSAGES[code] || err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';

      if (code === 'ACCOUNT_UNVERIFIED') {
        setApiError(msg);
        // Offer redirect to verify-otp
        setTimeout(() => {
          navigate(`/verify-otp?email=${encodeURIComponent(form.email.trim())}`);
        }, 2000);
      } else {
        setApiError(msg);
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
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-white font-bold italic text-2xl mx-auto mb-4">
              <img src="/logo-badminton.png" alt="logo" className=" w-10 h-15 " />
          </div>
          <h1 className="text-2xl font-bold text-accent-primary">Đăng nhập</h1>
          <p className="text-text-muted mt-1 text-sm">Chào mừng bạn trở lại SportHub!</p>
        </div>

        {/* Success message from register flow */}
        {successMessage && (
          <div className="mb-4 p-3 bg-status-success-bg border border-status-success rounded-lg flex items-start gap-2">
            <span className="text-status-success-text text-sm">{successMessage}</span>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-border-subtle-medium p-8">
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
              id="login-email"
              name="email"
              type="email"
              label="Email"
              placeholder="Nhập địa chỉ email"
              value={form.email}
              onChange={handleChange}
              error={fieldErrors.email}
              disabled={loading}
              required
              leftIcon={<Mail size={16} />}
              autoComplete="email"
            />

            {/* Password */}
            <div className="relative">
              <Input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Mật khẩu"
                placeholder="Nhập mật khẩu"
                value={form.password}
                onChange={handleChange}
                error={fieldErrors.password}
                disabled={loading}
                required
                leftIcon={<Lock size={16} />}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-[38px] text-text-muted hover:text-gray-700 transition-colors"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end -mt-1">
              <Link
                to="/forgot-password"
                className="text-xs text-accent-primary hover:text-accent-primary-hover font-medium transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
              size="lg"
              id="login-submit-btn"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-text-muted mt-6">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="text-accent-primary hover:text-brand-orange-hover font-semibold transition-colors"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
