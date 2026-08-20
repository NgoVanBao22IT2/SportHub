import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Shield, CheckCircle2, RefreshCw, Calendar, ArrowLeft, Lock, LogOut, Building2, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { getCurrentUserProfile, logoutUser } from '../api/auth';
import { getMyOwnerRegistration } from '../api/ownerRegistration';

// Design System Imports
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

function OwnerRegistrationCard() {
  const navigate = useNavigate();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOwnerRegistration()
      .then((data) => setRegistration(data))
      .catch((err) => console.error('Failed to fetch registration status:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card padding="md" radius="xl" className="border border-border-subtle-medium shadow-sm">
        <Skeleton variant="text" width="50%" height="1.5rem" />
        <Skeleton variant="rectangular" height="80px" radius="lg" className="mt-3" />
      </Card>
    );
  }

  const isPending = registration?.status === 'PENDING';
  const isApproved = registration?.status === 'APPROVED';
  const isRejected = registration?.status === 'REJECTED';

  return (
    <Card padding="md" radius="xl" className="border border-orange-200 bg-gradient-to-br from-orange-50/50 via-white to-orange-50/20 space-y-4 shadow-sm">
      <Card.Header className="pb-3 border-b border-orange-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold">
            <Building2 size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Đăng ký kinh doanh sân</h3>
            <p className="text-xs text-text-muted">Đưa cụm sân thể thao của bạn lên nền tảng SportHub</p>
          </div>
        </div>

        {isPending && (
          <Badge variant="warning" size="sm" className="font-extrabold flex items-center gap-1">
            <Clock size={12} /> Chờ duyệt
          </Badge>
        )}
        {isApproved && (
          <Badge variant="success" size="sm" className="font-extrabold flex items-center gap-1">
            <CheckCircle2 size={12} /> Đã duyệt
          </Badge>
        )}
        {isRejected && (
          <Badge variant="error" size="sm" className="font-extrabold flex items-center gap-1">
            <AlertTriangle size={12} /> Chưa duyệt
          </Badge>
        )}
      </Card.Header>

      <Card.Body className="space-y-3 pt-1">
        {!registration || registration.status === 'CANCELLED' ? (
          <div>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              Bạn đang sở hữu hoặc quản lý cụm sân thể thao? Đăng ký ngay để mở rộng tệp khách hàng và tiếp nhận lịch đặt sân tự động.
            </p>
            <div className="mt-4 flex justify-end">
              <Button
                variant="primary"
                size="md"
                rightIcon={<ChevronRight size={16} />}
                onClick={() => navigate('/owner-registration')}
              >
                Đăng ký kinh doanh ngay
              </Button>
            </div>
          </div>
        ) : isPending ? (
          <div className="space-y-3">
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                🟡 Hồ sơ đăng ký đang chờ ADMIN xét duyệt
              </p>
              <p>Tên cơ sở: <strong className="text-gray-900">{registration.business_name}</strong></p>
              <p>Ngày nộp: <span className="font-semibold">{new Date(registration.created_at).toLocaleDateString('vi-VN')}</span></p>
              <p className="text-[11px] text-amber-700 italic">Hệ thống sẽ cập nhật trạng thái ngay khi Admin phê duyệt.</p>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/owner-registration')}
              >
                Xem chi tiết hồ sơ
              </Button>
            </div>
          </div>
        ) : isApproved ? (
          <div className="space-y-3">
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                🟢 Chúc mừng! Hồ sơ của bạn đã được phê duyệt thành công.
              </p>
              <p>Tài khoản của bạn đã được nâng cấp thành **Chủ sân (OWNER)**.</p>
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="md"
                rightIcon={<ChevronRight size={16} />}
                onClick={() => navigate('/owner/dashboard')}
              >
                Truy cập Owner Portal
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1.5">
              <p className="font-bold text-rose-800 flex items-center gap-1.5">
                🔴 Hồ sơ chưa được phê duyệt
              </p>
              {registration.admin_note && (
                <p>Lý do từ chối: <span className="font-bold italic text-rose-900">"{registration.admin_note}"</span></p>
              )}
              <p className="text-[11px] text-rose-700">Bạn có thể chỉnh sửa thông tin và nộp lại hồ sơ mới.</p>
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/owner-registration')}
              >
                Đăng ký lại hồ sơ
              </Button>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default function Profile() {
  const navigate = useNavigate();

  // State Management
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState(null);

  // Fetch Authenticated User Profile from Backend API
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setErrorInfo(null);

      const response = await getCurrentUserProfile();
      const userData = response?.data || response?.user || response;
      setProfile(userData);
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      const status = err.response?.status;
      if (status === 401) {
        setErrorInfo({ code: 401, title: 'Yêu cầu đăng nhập', description: 'Vui lòng đăng nhập để xem và quản lý thông tin tài khoản cá nhân của bạn.' });
      } else if (status === 403) {
        setErrorInfo({ code: 403, title: 'Không có quyền truy cập', description: 'Tài khoản của bạn không có quyền xem dữ liệu tài khoản này.' });
      } else if (status === 429) {
        setErrorInfo({ code: 429, title: 'Hệ thống quá tải', description: 'Hệ thống đang tiếp nhận quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.' });
      } else {
        setErrorInfo({ code: status || 500, title: 'Không thể tải thông tin cá nhân', description: 'Đã xảy ra sự cố khi truy xuất dữ liệu tài khoản từ hệ thống máy chủ.' });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 401 Unauthorized State
  if (errorInfo?.code === 401) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <EmptyState
          title={errorInfo.title}
          description={errorInfo.description}
          action={
            <Button variant="primary" onClick={() => navigate('/login')}>
              Đăng nhập ngay
            </Button>
          }
        />
      </div>
    );
  }

  // Error State
  if (errorInfo) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <ErrorState
          title={errorInfo.title}
          description={errorInfo.description}
          action={
            <Button variant="primary" leftIcon={<RefreshCw size={16} />} onClick={fetchProfile}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  // Formatting helpers
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US';

  const roleLabel = profile?.primary_role === 'ADMIN' ? 'Quản trị viên' : profile?.primary_role === 'OWNER' ? 'Chủ sân' : 'Khách hàng';
  const statusLabel = profile?.account_status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khóa';
  const joinedDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('vi-VN') : 'Chưa cập nhật';

  return (
    <div className="w-full bg-surface-subtle min-h-screen pb-20">
      {/* HEADER & BREADCRUMB */}
      <section className="bg-surface border-b border-border-subtle-medium py-8 px-4">
        <div className="container mx-auto max-w-5xl space-y-4">
          {/* <div className="flex items-center text-xs text-text-muted gap-2">
            <Link to="/" className="hover:text-accent-primary">Trang chủ</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Hồ sơ cá nhân</span>
          </div> */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <User size={28} className="text-accent-primary" />
                Hồ sơ cá nhân
              </h1>
              {/* <p className="text-sm text-text-muted mt-1">
                Thông tin tài khoản đã xác thực từ hệ thống SportHub
              </p> */}
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => navigate(-1)}
            >
              Quay lại
            </Button>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <div className="container mx-auto px-4 max-w-5xl py-8">
        
        {/* LOADING SKELETON STATE */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card padding="md" radius="xl" className="space-y-4">
                <Skeleton variant="circular" width="96px" height="96px" className="mx-auto" />
                <Skeleton variant="text" width="70%" height="1.5rem" className="mx-auto" />
                <Skeleton variant="text" width="40%" height="1rem" className="mx-auto" />
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Card padding="md" radius="xl" className="space-y-4">
                <Skeleton variant="text" width="40%" height="1.5rem" />
                <Skeleton variant="rectangular" height="48px" radius="lg" />
                <Skeleton variant="rectangular" height="48px" radius="lg" />
                <Skeleton variant="rectangular" height="48px" radius="lg" />
              </Card>
            </div>
          </div>
        ) : (
          /* PROFILE DETAILS GRID */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* LEFT PROFILE SUMMARY CARD */}
            <Card padding="md" radius="xl" className="border border-border-subtle-medium text-center space-y-4 shadow-sm">
              <div className="w-24 h-24 rounded-full bg-accent-primary-light text-accent-primary font-bold text-3xl flex items-center justify-center mx-auto border-2 border-accent-primary">
                {initials}
              </div>

              <div className="space-y-1">
                <h2 className="font-bold text-xl text-gray-900">
                  {profile?.full_name || 'Người dùng SportHub'}
                </h2>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Badge variant="info" size="sm" className="font-semibold">
                    {roleLabel}
                  </Badge>
                  <Badge variant={profile?.account_status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                    {statusLabel}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t border-border-subtle text-xs text-text-muted space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Shield size={14} className="text-accent-primary" /> Mã tài khoản:</span>
                  <span className="font-mono text-gray-900 font-bold">{profile?.user_id?.substring(0, 8)}...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Calendar size={14} className="text-accent-primary" /> Ngày tham gia:</span>
                  <span className="text-gray-900 font-semibold">{joinedDate}</span>
                </div>
                {profile?.email_verified_at && (
                  <div className="flex items-center justify-between text-status-success">
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Trạng thái Email:</span>
                    <span className="font-semibold">Đã xác minh</span>
                  </div>
                )}
              </div>
            </Card>

            {/* RIGHT ACCURATE PROFILE DETAILS FORM */}
            <div className="lg:col-span-2 space-y-6">
              <Card padding="md" radius="xl" className="border border-border-subtle-medium space-y-6 shadow-sm">
                <Card.Header className="pb-3 border-b border-border-subtle-medium flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <User size={20} className="text-accent-primary" />
                    Thông tin chi tiết
                  </h3>
                  {/* <Badge variant="default" size="sm">
                    Backend Verified
                  </Badge> */}
                </Card.Header>

                <Card.Body className="space-y-4">
                  <div>
                    <label htmlFor="profile-fullname" className="text-xs font-bold text-gray-900 block mb-1">
                      Họ và tên *
                    </label>
                    <div className="relative">
                      <input
                        id="profile-fullname"
                        type="text"
                        readOnly
                        value={profile?.full_name || ''}
                        className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface-subtle text-gray-900 text-sm font-medium focus:outline-none cursor-not-allowed"
                      />
                      <User size={16} className="absolute right-3.5 top-3 text-text-muted" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="profile-email" className="text-xs font-bold text-gray-900 block mb-1">
                      Địa chỉ Email *
                    </label>
                    <div className="relative">
                      <input
                        id="profile-email"
                        type="email"
                        readOnly
                        value={profile?.email || ''}
                        className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface-subtle text-gray-900 text-sm font-medium focus:outline-none cursor-not-allowed"
                      />
                      <Mail size={16} className="absolute right-3.5 top-3 text-text-muted" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="profile-phone" className="text-xs font-bold text-gray-900 block mb-1">
                      Số điện thoại *
                    </label>
                    <div className="relative">
                      <input
                        id="profile-phone"
                        type="tel"
                        readOnly
                        value={profile?.phone_number || 'Chưa cập nhật'}
                        className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface-subtle text-gray-900 text-sm font-medium focus:outline-none cursor-not-allowed"
                      />
                      <Phone size={16} className="absolute right-3.5 top-3 text-text-muted" />
                    </div>
                  </div>

                  {/* BACKEND UPDATE CAPACITY NOTICE */}
                  <div role="alert" className="p-4 bg-surface-subtle rounded-xl border border-border-subtle-medium text-xs text-text-muted space-y-1">
                    <p className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Lock size={14} className="text-accent-primary" />
                      Thông báo bảo mật tài khoản:
                    </p>
                    <p>
                      Thông tin hồ sơ cá nhân được xác thực và bảo mật trực tiếp theo chuẩn an toàn từ hệ thống SportHub. Để thay đổi Email hoặc Số điện thoại, vui lòng liên hệ bộ phận hỗ trợ khách hàng.
                    </p>
                  </div>
                </Card.Body>

                <Card.Footer className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    leftIcon={<RefreshCw size={16} />}
                    onClick={fetchProfile}
                  >
                    Làm mới thông tin
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => navigate('/my-bookings')}
                  >
                    Xem lịch sử đặt sân
                  </Button>
                  <Button
                    variant="destructive"
                    size="md"
                    fullWidth
                    leftIcon={<LogOut size={16} />}
                    onClick={async () => {
                      await logoutUser();
                      navigate('/');
                    }}
                  >
                    Đăng xuất
                  </Button>
                </Card.Footer>
              </Card>

              {/* OWNER REGISTRATION SECTION (CUSTOMER ONLY) */}
              {profile?.primary_role === 'CUSTOMER' && (
                <OwnerRegistrationCard />
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
