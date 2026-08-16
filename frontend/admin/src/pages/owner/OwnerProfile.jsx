import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Bell,
  HelpCircle,
  LogOut,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Building2,
  Calendar,
  Save,
  Key,
  ShieldCheck,
  Info,
  ExternalLink
} from 'lucide-react';
import { getOwnerProfile, updateOwnerProfile, changeOwnerPassword } from '../../api/owner';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';

export default function OwnerProfile() {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({ totalVenues: 0, totalCourts: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit profile form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [updateProfileLoading, setUpdateProfileLoading] = useState(false);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // Notification Preferences toggles state
  const [notifPreferences, setNotifPreferences] = useState({
    bookingAlerts: true,
    paymentAlerts: true,
    reviewAlerts: true,
    systemAlerts: true
  });

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOwnerProfile();

      if (res && res.data) {
        setProfileData(res.data);
        setFullName(res.data.full_name || '');
        setPhoneNumber(res.data.phone_number || '');
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching owner profile:', err);
      setError(err.response?.data?.error?.message || err.message || 'Không thể tải thông tin hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle Edit Profile Submission
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('⚠️ Vui lòng nhập Họ và tên.');
      return;
    }
    if (!phoneNumber.trim()) {
      showToast('⚠️ Vui lòng nhập Số điện thoại.');
      return;
    }

    try {
      setUpdateProfileLoading(true);
      await updateOwnerProfile({
        full_name: fullName,
        phone_number: phoneNumber
      });

      showToast('Cập nhật hồ sơ cá nhân thành công!');
      setIsEditingProfile(false);
      fetchProfile();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi cập nhật hồ sơ'));
    } finally {
      setUpdateProfileLoading(false);
    }
  };

  // Handle Change Password Submission
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('⚠️ Vui lòng nhập đầy đủ các trường mật khẩu.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('⚠️ Mật khẩu mới và mật khẩu xác nhận không trùng khớp.');
      return;
    }
    if (newPassword.length < 6) {
      showToast('⚠️ Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    try {
      setChangePasswordLoading(true);
      await changeOwnerPassword({
        currentPassword,
        newPassword,
        confirmPassword
      });

      showToast('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Mật khẩu hiện tại không chính xác'));
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton width="220px" height="28px" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="lg" radius="2xl" className="space-y-4">
            <Skeleton width="80px" height="80px" radius="full" className="mx-auto" />
            <Skeleton width="120px" height="20px" className="mx-auto" />
          </Card>
          <Card padding="lg" radius="2xl" className="md:col-span-2 space-y-4">
            <Skeleton width="100%" height="200px" radius="xl" />
          </Card>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <ErrorState
          title="Không thể tải hồ sơ Chủ sân"
          description={error || 'Đã có lỗi xảy ra khi kết nối máy chủ.'}
          onRetry={fetchProfile}
        />
      </div>
    );
  }

  const initialLetter = (profileData.full_name || 'Owner').charAt(0).toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* TOAST FEEDBACK NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex items-center justify-between bg-surface p-6 rounded-2xl border border-border-subtle-medium shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="text-brand-orange" size={24} />
            Hồ sơ Chủ sân & Cài đặt hệ thống
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Quản lý thông tin tài khoản cá nhân, bảo mật mật khẩu và tùy chỉnh trải nghiệm quản trị.
          </p>
        </div>
      </div>

      {/* MAIN TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: AVATAR & QUICK STATS CARD */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium bg-surface text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-brand-orange text-white text-3xl font-extrabold flex items-center justify-center mx-auto shadow-md border-4 border-surface">
            {initialLetter}
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900">{profileData.full_name}</h2>
            <p className="text-xs text-text-muted">{profileData.email}</p>
            <div className="mt-2 inline-block">
              <Badge variant="warning" size="sm">CHỦ SÂN (OWNER)</Badge>
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle grid grid-cols-2 gap-2 text-xs">
            <div className="bg-surface-subtle p-3 rounded-xl border border-border-subtle">
              <span className="text-[10px] text-text-muted font-bold block uppercase">Câu lạc bộ</span>
              <span className="text-base font-extrabold text-gray-900">{stats.totalVenues}</span>
            </div>
            <div className="bg-surface-subtle p-3 rounded-xl border border-border-subtle">
              <span className="text-[10px] text-text-muted font-bold block uppercase">Sân con</span>
              <span className="text-base font-extrabold text-gray-900">{stats.totalCourts}</span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-text-muted flex items-center justify-center gap-1">
            <Calendar size={13} />
            Tham gia: {new Date(profileData.created_at || Date.now()).toLocaleDateString('vi-VN')}
          </div>
        </Card>

        {/* RIGHT COLUMN: PERSONAL INFO & FORM */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium bg-surface lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <User size={16} className="text-brand-orange" />
              Thông tin Cá nhân
            </h2>

            {!isEditingProfile ? (
              <Button
                variant="outline"
                size="xs"
                onClick={() => setIsEditingProfile(true)}
              >
                Chỉnh sửa thông tin
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setIsEditingProfile(false);
                  setFullName(profileData.full_name || '');
                  setPhoneNumber(profileData.phone_number || '');
                }}
              >
                Hủy bỏ
              </Button>
            )}
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-gray-900 block">Họ và tên: <span className="text-red-500">*</span></label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-900 block">Số điện thoại: <span className="text-red-500">*</span></label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="09xxxxxxxx"
                  leftIcon={<Phone size={14} />}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="primary" size="sm" type="submit" loading={updateProfileLoading} leftIcon={<Save size={14} />}>
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-border-subtle">
                <span className="text-text-muted">Họ và tên:</span>
                <span className="font-bold text-gray-900">{profileData.full_name}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-border-subtle">
                <span className="text-text-muted">Địa chỉ Email:</span>
                <span className="font-medium text-gray-800">{profileData.email}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-border-subtle">
                <span className="text-text-muted">Số điện thoại:</span>
                <span className="font-bold text-gray-900">{profileData.phone_number}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-border-subtle">
                <span className="text-text-muted">Trạng thái tài khoản:</span>
                <Badge variant="success" size="xs">ACTIVE (Đang hoạt động)</Badge>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-text-muted">Mã định danh User ID:</span>
                <span className="font-mono text-[11px] text-gray-600">{profileData.user_id}</span>
              </div>
            </div>
          )}
        </Card>

      </div>

      {/* SECURITY: CHANGE PASSWORD CARD */}
      <Card padding="lg" radius="2xl" className="border border-border-subtle-medium bg-surface space-y-4">
        <div className="border-b border-border-subtle pb-3">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Lock size={16} className="text-brand-orange" />
            Đổi mật khẩu tài khoản
          </h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-xl">
          <div className="space-y-1.5">
            <label className="font-bold text-gray-900 block">Mật khẩu hiện tại: <span className="text-red-500">*</span></label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Key size={14} />}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-gray-900 block">Mật khẩu mới: <span className="text-red-500">*</span></label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                leftIcon={<Lock size={14} />}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-900 block">Xác nhận mật khẩu mới: <span className="text-red-500">*</span></label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                leftIcon={<ShieldCheck size={14} />}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={changePasswordLoading}
            leftIcon={<Key size={14} />}
          >
            Đổi mật khẩu ngay
          </Button>
        </form>
      </Card>

      {/* NOTIFICATION PREFERENCES & SYSTEM INFO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* NOTIFICATION PREFERENCES */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium bg-surface space-y-4">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Bell size={16} className="text-brand-orange" />
              Cài đặt Nhận thông báo
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { key: 'bookingAlerts', label: 'Thông báo đơn đặt sân mới', desc: 'Nhận thông báo khi người chơi vừa tạo booking' },
              { key: 'paymentAlerts', label: 'Thông báo giao dịch thanh toán', desc: 'Nhận thông báo khi khách gửi ảnh minh chứng chuyển khoản' },
              { key: 'reviewAlerts', label: 'Thông báo nhận xét & đánh giá', desc: 'Nhận thông báo khi có bình luận mới từ khách hàng' },
              { key: 'systemAlerts', label: 'Cảnh báo hệ thống & Bảo trì', desc: 'Cập nhật tình trạng bảo trì sân và hệ thống SportHubAI' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                <div>
                  <p className="font-bold text-gray-900">{item.label}</p>
                  <p className="text-[11px] text-text-muted">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPreferences[item.key]}
                  onChange={(e) => setNotifPreferences({ ...notifPreferences, [item.key]: e.target.checked })}
                  className="w-4 h-4 text-brand-orange focus:ring-brand-orange rounded cursor-pointer"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* SUPPORT & SYSTEM INFO */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium bg-surface space-y-4">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <HelpCircle size={16} className="text-brand-orange" />
              Hỗ trợ & Thông tin Hệ thống
            </h2>
          </div>

          <div className="space-y-2 text-xs">
            <a
              href="mailto:support@sporthubai.vn"
              className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle hover:bg-gray-200 transition-colors font-semibold text-gray-900"
            >
              <span>Trung tâm hỗ trợ kỹ thuật (support@sporthubai.vn)</span>
              <ExternalLink size={14} />
            </a>

            <div className="p-3 rounded-xl bg-surface-subtle space-y-1">
              <p className="font-bold text-gray-900">Nền tảng SportHubAI Booking</p>
              <p className="text-[11px] text-text-muted">Phiên bản: v1.4.0-production (React + Node.js MySQL)</p>
            </div>
          </div>

          <div className="pt-2 border-t border-border-subtle">
            <Button
              variant="danger"
              size="sm"
              leftIcon={<LogOut size={16} />}
              onClick={handleLogout}
              className="w-full justify-center"
            >
              Đăng xuất khỏi hệ thống
            </Button>
          </div>
        </Card>

      </div>

    </div>
  );
}
