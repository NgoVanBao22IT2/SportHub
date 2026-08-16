import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User, Phone, Mail, MapPin, Trophy, ArrowLeft, Send, Clock, CheckCircle2, AlertTriangle, XCircle, ChevronDown } from 'lucide-react';
import { getMyOwnerRegistration, createOwnerRegistration, cancelMyOwnerRegistration } from '../../api/ownerRegistration';
import { getCurrentUserProfile } from '../../api/auth';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

const PROVINCES_LIST = [
  'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Bình Dương', 'Đồng Nai', 'Bà Rịa - Vũng Tàu', 'Khánh Hòa', 'Lâm Đồng',
  'Thừa Thiên Huế', 'Quảng Nam', 'Quảng Ninh', 'Kiên Giang', 'An Giang',
  'Tây Ninh', 'Long An', 'Bến Tre', 'Tiền Giang', 'Thái Nguyên',
  'Bắc Ninh', 'Nam Định', 'Thanh Hóa', 'Nghệ An', 'Gia Lai',
  'Đắc Lắk', 'Bình Thuận', 'Bình Định', 'Vĩnh Long', 'Cà Mau', 'Tỉnh khác'
];

function CustomCitySelect({ value, onChange, error }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (city) => {
    onChange({ target: { name: 'city_province', value: city } });
    setOpen(false);
  };

  return (
    <div className="relative">
      <label htmlFor="city_province" className="text-xs font-bold text-gray-900 block mb-1">
        Tỉnh / Thành phố *
      </label>
      <button
        id="city_province"
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-sm font-medium focus:outline-none focus:border-brand-orange flex items-center justify-between text-left shadow-xs"
      >
        <span>{value || 'Chọn Tỉnh / Thành phố'}</span>
        <ChevronDown size={18} className={`text-text-muted transition-transform duration-200 ${open ? 'rotate-180 text-brand-orange' : ''}`} />
      </button>

      {open && (
        <>
          {/* Backdrop to close on click outside */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* FLOATING MENU ALWAYS OPENING DOWNWARDS */}
          <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto py-1 divide-y divide-gray-100">
            {PROVINCES_LIST.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => handleSelect(city)}
                className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between ${
                  value === city
                    ? 'bg-orange-50 text-brand-orange font-bold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{city}</span>
                {value === city && <CheckCircle2 size={14} className="text-brand-orange" />}
              </button>
            ))}
          </div>
        </>
      )}

      {error && (
        <p className="text-[11px] text-rose-500 font-bold mt-1">{error}</p>
      )}
    </div>
  );
}

export default function OwnerRegistrationPage() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [existingReg, setExistingReg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [apiError, setApiError] = useState('');

  const [form, setForm] = useState({
    business_name: '',
    business_type: 'Cơ sở tư nhân',
    representative_name: '',
    phone_number: '',
    email: '',
    street_address: '',
    city_province: 'TP. Hồ Chí Minh',
    district: '',
    ward: '',
    sport_categories: 'Cầu lông, Pickleball',
    estimated_courts: 4,
    description: ''
  });

  const [errors, setErrors] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, regData] = await Promise.all([
        getCurrentUserProfile(),
        getMyOwnerRegistration()
      ]);

      const user = userRes?.data || userRes;
      setCurrentUser(user);
      setExistingReg(regData);

      // Pre-fill user details if available
      if (user) {
        setForm((f) => ({
          ...f,
          representative_name: user.full_name || '',
          phone_number: user.phone_number || '',
          email: user.email || ''
        }));
      }
    } catch (err) {
      console.error('Failed to load registration data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((errs) => ({ ...errs, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.business_name.trim()) errs.business_name = 'Vui lòng nhập tên cơ sở / câu lạc bộ';
    if (!form.representative_name.trim()) errs.representative_name = 'Vui lòng nhập họ tên người đại diện';
    if (!form.phone_number.trim()) errs.phone_number = 'Vui lòng nhập số điện thoại liên hệ';
    if (!form.email.trim()) errs.email = 'Vui lòng nhập địa chỉ email';
    if (!form.street_address.trim()) errs.street_address = 'Vui lòng nhập địa chỉ số nhà / tên đường';
    if (!form.city_province.trim()) errs.city_province = 'Vui lòng chọn Tỉnh / Thành phố';
    if (!form.district.trim()) errs.district = 'Vui lòng nhập Quận / Huyện';
    if (!form.ward.trim()) errs.ward = 'Vui lòng nhập Phường / Xã';
    return errs;
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setApiError('');
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);
      setShowConfirmModal(false);
      await createOwnerRegistration(form);
      await fetchData();
    } catch (err) {
      console.error('Failed to submit owner registration:', err);
      setApiError(err.response?.data?.message || 'Không thể gửi hồ sơ đăng ký. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'error' });

  const handleCancelSubmit = async (regId) => {
    try {
      setLoading(true);
      await cancelMyOwnerRegistration(regId);
      setCancelConfirmId(null);
      setNoticeModal({ open: true, title: 'Đã hủy hồ sơ', message: 'Hồ sơ đăng ký kinh doanh của bạn đã được hủy thành công.', type: 'info' });
      await fetchData();
    } catch (err) {
      console.error('Failed to cancel registration:', err);
      setNoticeModal({ open: true, title: 'Thao tác thất bại', message: err.response?.data?.message || 'Không thể hủy hồ sơ đăng ký.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl text-center space-y-3">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-text-muted">Đang nạp thông tin hồ sơ đăng ký...</p>
      </div>
    );
  }

  // STATUS VIEW IF ALREADY HAS AN APPLICATION
  const isPending = existingReg?.status === 'PENDING';
  const isApproved = existingReg?.status === 'APPROVED';

  return (
    <div className="w-full bg-surface-subtle min-h-screen pb-20">
      {/* HEADER & BREADCRUMB */}
      <section className="bg-surface border-b border-border-subtle-medium py-8 px-4">
        <div className="container mx-auto max-w-4xl space-y-4">
          <div className="flex items-center text-xs text-text-muted gap-2">
            <Link to="/" className="hover:text-accent-primary">Trang chủ</Link>
            <span>/</span>
            <Link to="/profile" className="hover:text-accent-primary">Hồ sơ cá nhân</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Đăng ký kinh doanh sân</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 size={28} className="text-brand-orange" />
                Đăng ký kinh doanh sân thể thao
              </h1>
              <p className="text-sm text-text-muted mt-1">
                Gửi hồ sơ kinh doanh để đưa cụm sân của bạn lên hệ thống SportHub
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => navigate('/profile')}
            >
              Quay lại Hồ sơ
            </Button>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <div className="container mx-auto px-4 max-w-4xl py-8">
        {/* CASE 1: PENDING APPLICATION STATUS VIEW */}
        {isPending && (
          <Card padding="lg" radius="xl" className="border border-amber-300 bg-amber-50/40 space-y-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                <Clock size={24} />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-amber-900">Hồ sơ đăng ký của bạn đang được xét duyệt</h2>
                  <Badge variant="warning" size="md">ĐANG CHỜ ADMIN DỰỆT</Badge>
                </div>
                <p className="text-xs text-amber-800">
                  Hồ sơ đã được gửi thành công vào ngày <strong className="text-gray-900">{new Date(existingReg.created_at).toLocaleString('vi-VN')}</strong>. Bạn sẽ nhận được thông báo ngay sau khi Ban quản trị hoàn tất xét duyệt.
                </p>
              </div>
            </div>

            {/* DETAILS PREVIEW TABLE */}
            <div className="p-4 bg-white rounded-2xl border border-amber-200/80 space-y-3 text-xs">
              <h3 className="font-bold text-gray-900 text-sm pb-2 border-b border-gray-100 flex items-center gap-1.5">
                <Building2 size={16} className="text-brand-orange" /> Chi tiết hồ sơ đã nộp
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
                <p><span className="text-text-muted">Tên cơ sở:</span> <strong className="text-gray-900">{existingReg.business_name}</strong></p>
                <p><span className="text-text-muted">Loại hình kinh doanh:</span> <strong className="text-gray-900">{existingReg.business_type}</strong></p>
                <p><span className="text-text-muted">Người đại diện:</span> <strong className="text-gray-900">{existingReg.representative_name}</strong></p>
                <p><span className="text-text-muted">SĐT liên hệ:</span> <strong className="text-gray-900">{existingReg.phone_number}</strong></p>
                <p><span className="text-text-muted">Email liên hệ:</span> <strong className="text-gray-900">{existingReg.email}</strong></p>
                <p><span className="text-text-muted">Bộ môn:</span> <strong className="text-gray-900">{existingReg.sport_categories}</strong></p>
                <p className="md:col-span-2"><span className="text-text-muted">Địa chỉ cơ sở:</span> <strong className="text-gray-900">{existingReg.street_address}, {existingReg.ward}, {existingReg.district}, {existingReg.city_province}</strong></p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="destructive"
                size="md"
                onClick={() => setCancelConfirmId(existingReg.registration_id)}
              >
                Hủy hồ sơ đăng ký này
              </Button>
            </div>
          </Card>
        )}

        {/* CASE 2: APPROVED APPLICATION STATUS VIEW */}
        {isApproved && (
          <Card padding="lg" radius="xl" className="border border-emerald-300 bg-emerald-50/40 space-y-6 shadow-md text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold mx-auto shadow-lg">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-2xl font-extrabold text-emerald-900">Chúc mừng! Hồ sơ đã được phê duyệt</h2>
              <p className="text-sm text-emerald-800">
                Tài khoản của bạn đã được nâng cấp chính thức thành **Chủ sân (OWNER)**. Bây giờ bạn có thể truy cập hệ thống Owner Portal để thêm cụm sân và quản lý lịch sân.
              </p>
            </div>

            <div className="pt-4 flex justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/owner/dashboard')}
              >
                Vào trang quản lý sân (Owner Portal)
              </Button>
            </div>
          </Card>
        )}

        {/* CASE 3: REGISTRATION FORM (NEW APPLICATION OR RE-SUBMIT AFTER REJECTION/CANCELLATION) */}
        {!isPending && !isApproved && (
          <form onSubmit={handlePreSubmit} className="space-y-8">
            {/* REJECTION REASON BANNER IF PREVIOUS REJECTED */}
            {existingReg?.status === 'REJECTED' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900 space-y-1">
                  <p className="font-bold text-rose-800">🔴 Hồ sơ trước đó đã bị từ chối xét duyệt</p>
                  {existingReg.admin_note && (
                    <p>Lý do từ chối: <span className="font-bold italic text-rose-950">"{existingReg.admin_note}"</span></p>
                  )}
                  <p className="text-rose-700">Vui lòng điều chỉnh lại thông tin bên dưới và bấm gửi lại hồ sơ.</p>
                </div>
              </div>
            )}

            {/* API ERROR DISPLAY */}
            {apiError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-medium">
                ⚠️ {apiError}
              </div>
            )}

            {/* SECTION 1: BUSINESS INFO */}
            <Card padding="md" radius="xl" className="border border-border-subtle-medium space-y-6 shadow-sm">
              <Card.Header className="pb-3 border-b border-border-subtle-medium">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Building2 size={20} className="text-brand-orange" />
                  1. Thông tin cơ sở kinh doanh sân
                </h3>
              </Card.Header>

              <Card.Body className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    id="business_name"
                    name="business_name"
                    label="Tên cụm sân / cơ sở thể thao *"
                    placeholder="VD: Cụm Sân Cầu Lông SportHub Tân Bình"
                    value={form.business_name}
                    onChange={handleChange}
                    error={errors.business_name}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">Loại hình cơ sở *</label>
                  <select
                    name="business_type"
                    value={form.business_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-sm font-medium focus:outline-none focus:border-brand-orange"
                  >
                    <option value="Cơ sở tư nhân">Cơ sở kinh doanh tư nhân</option>
                    <option value="Công ty TNHH">Công ty TNHH / Doanh nghiệp</option>
                    <option value="Câu lạc bộ thể thao">Câu lạc bộ thể thao</option>
                    <option value="Trung tâm TDTT">Trung tâm Thể dục Thể thao</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">Các bộ môn thể thao có tại sân *</label>
                  <input
                    type="text"
                    name="sport_categories"
                    value={form.sport_categories}
                    onChange={handleChange}
                    placeholder="VD: Cầu lông, Pickleball, Bóng đá"
                    className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-sm font-medium focus:outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">Số lượng sân con dự kiến</label>
                  <input
                    type="number"
                    name="estimated_courts"
                    min={1}
                    max={100}
                    value={form.estimated_courts}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-sm font-medium focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </Card.Body>
            </Card>

            {/* SECTION 2: REPRESENTATIVE CONTACT INFO */}
            <Card padding="md" radius="xl" className="border border-border-subtle-medium space-y-6 shadow-sm">
              <Card.Header className="pb-3 border-b border-border-subtle-medium">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <User size={20} className="text-brand-orange" />
                  2. Thông tin người đại diện liên hệ
                </h3>
              </Card.Header>

              <Card.Body className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    id="representative_name"
                    name="representative_name"
                    label="Họ và tên người đại diện *"
                    value={form.representative_name}
                    onChange={handleChange}
                    error={errors.representative_name}
                    required
                  />
                </div>

                <div>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    label="Số điện thoại liên hệ *"
                    value={form.phone_number}
                    onChange={handleChange}
                    error={errors.phone_number}
                    required
                  />
                </div>

                <div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    label="Email liên hệ *"
                    value={form.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                  />
                </div>
              </Card.Body>
            </Card>

            {/* SECTION 3: ADDRESS */}
            <Card padding="md" radius="xl" className="border border-border-subtle-medium space-y-6 shadow-sm">
              <Card.Header className="pb-3 border-b border-border-subtle-medium">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <MapPin size={20} className="text-brand-orange" />
                  3. Địa chỉ cơ sở kinh doanh
                </h3>
              </Card.Header>

              <Card.Body className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <Input
                    id="street_address"
                    name="street_address"
                    label="Địa chỉ số nhà, tên đường *"
                    placeholder="VD: 120/45 Lý Thường Kiệt"
                    value={form.street_address}
                    onChange={handleChange}
                    error={errors.street_address}
                    required
                  />
                </div>

                <div>
                  <Input
                    id="ward"
                    name="ward"
                    label="Phường / Xã *"
                    placeholder="VD: Phường 15"
                    value={form.ward}
                    onChange={handleChange}
                    error={errors.ward}
                    required
                  />
                </div>

                <div>
                  <Input
                    id="district"
                    name="district"
                    label="Quận / Huyện *"
                    placeholder="VD: Quận Tân Bình"
                    value={form.district}
                    onChange={handleChange}
                    error={errors.district}
                    required
                  />
                </div>

                <CustomCitySelect
                  value={form.city_province}
                  onChange={handleChange}
                  error={errors.city_province}
                />

                <div className="md:col-span-3">
                  <label className="text-xs font-bold text-gray-900 block mb-1">Mô tả thêm về cơ sở (Giờ mở cửa, tiện ích...)</label>
                  <textarea
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Nhập ghi chú hoặc thông tin bổ sung..."
                    className="w-full p-3 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-sm focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </Card.Body>
            </Card>

            {/* SUBMIT BUTTON */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate('/profile')}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={submitting}
                rightIcon={<Send size={18} />}
              >
                {submitting ? 'Đang gửi hồ sơ...' : 'Gửi hồ sơ đăng ký'}
              </Button>
            </div>
          </form>
        )}

        {/* CONFIRMATION MODAL */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
            <div className="bg-surface rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-border-subtle-medium">
              <h3 className="text-lg font-bold text-gray-900">Xác nhận gửi hồ sơ đăng ký kinh doanh</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Sau khi gửi, hồ sơ sẽ được chuyển tới Ban quản trị hệ thống **SportHubAI** để kiểm tra và phê duyệt. Bạn có chắc chắn muốn nộp hồ sơ này?
              </p>
              <div className="pt-4 flex justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Kiểm tra lại
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmSubmit}
                >
                  Xác nhận gửi hồ sơ
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CANCEL CONFIRM MODAL */}
        {cancelConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
            <div className="bg-surface rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-border-subtle-medium">
              <h3 className="text-base font-bold text-gray-900">Xác nhận hủy hồ sơ</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Bạn có chắc chắn muốn hủy hồ sơ đăng ký kinh doanh này? Thao tác này sẽ xóa hồ sơ hiện tại.
              </p>
              <div className="pt-2 flex gap-2">
                <Button variant="outline" size="md" fullWidth onClick={() => setCancelConfirmId(null)}>
                  Hủy bỏ
                </Button>
                <Button variant="destructive" size="md" fullWidth onClick={() => handleCancelSubmit(cancelConfirmId)}>
                  Hủy hồ sơ
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* NOTICE MODAL */}
        {noticeModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
            <div className="bg-surface rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-border-subtle-medium">
              <h3 className="text-base font-bold text-gray-900">{noticeModal.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{noticeModal.message}</p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => setNoticeModal({ ...noticeModal, open: false })}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
