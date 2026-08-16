import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { register } from '../api/auth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ERROR_MESSAGES = {
  EMAIL_REQUIRED: 'Vui lòng nhập email.',
  FULL_NAME_REQUIRED: 'Vui lòng nhập họ và tên.',
  PHONE_NUMBER_REQUIRED: 'Vui lòng nhập số điện thoại.',
  INVALID_PASSWORD: 'Mật khẩu phải có ít nhất 6 ký tự.',
  EMAIL_DUPLICATE: 'Email này đã được đăng ký. Vui lòng sử dụng email khác.',
};

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((fe) => ({ ...fe, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const errors = {};
    if (!form.full_name.trim()) errors.full_name = 'Vui lòng nhập họ và tên.';
    if (!form.email.trim()) errors.email = 'Vui lòng nhập email.';
    if (!form.phone_number.trim()) errors.phone_number = 'Vui lòng nhập số điện thoại.';
    if (!form.password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    } else if (form.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }
    if (!form.confirmPassword) {
      errors.confirmPassword = 'Vui lòng nhập xác nhận mật khẩu.';
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }
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
      await register({
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
      });

      // Navigate to verify OTP with success message
      navigate(`/verify-otp?email=${encodeURIComponent(form.email.trim())}`, {
        state: {
          successMessage: 'Đăng ký thành công! Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
        },
      });
    } catch (err) {
      const code = err.response?.data?.code;
      const msg = ERROR_MESSAGES[code] || err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      setApiError(msg);
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
          <h1 className="text-2xl font-bold text-accent-primary">Tạo tài khoản</h1>
          <p className="text-text-muted mt-1 text-sm">Tham gia SportHub ngay hôm nay!</p>
        </div>

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

            {/* Full Name */}
            <Input
              id="register-full-name"
              name="full_name"
              type="text"
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={form.full_name}
              onChange={handleChange}
              error={fieldErrors.full_name}
              disabled={loading}
              required
              leftIcon={<User size={16} />}
              autoComplete="name"
            />

            {/* Email */}
            <Input
              id="register-email"
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

            {/* Phone */}
            <Input
              id="register-phone"
              name="phone_number"
              type="tel"
              label="Số điện thoại"
              placeholder="09xxxxxxxx"
              value={form.phone_number}
              onChange={handleChange}
              error={fieldErrors.phone_number}
              disabled={loading}
              required
              leftIcon={<Phone size={16} />}
              autoComplete="tel"
            />

            {/* Password */}
            <div className="relative">
              <Input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Mật khẩu"
                placeholder="Ít nhất 6 ký tự"
                value={form.password}
                onChange={handleChange}
                error={fieldErrors.password}
                disabled={loading}
                required
                leftIcon={<Lock size={16} />}
                helperText={!fieldErrors.password ? 'Tối thiểu 6 ký tự' : undefined}
                autoComplete="new-password"
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

            {/* Confirm Password */}
            <div className="relative">
              <Input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu"
                value={form.confirmPassword}
                onChange={handleChange}
                error={fieldErrors.confirmPassword}
                disabled={loading}
                required
                leftIcon={<Lock size={16} />}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-[38px] text-text-muted hover:text-gray-700 transition-colors"
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
              size="lg"
              id="register-submit-btn"
            >
              {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
            </Button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-text-muted mt-6">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="text-accent-primary hover:text-brand-orange-hover font-semibold transition-colors"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
