import React, { useState, useEffect } from 'react';
import { X, Users, Ticket, UserCheck, Swords, GraduationCap, Calendar, Clock, MapPin, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import communityApi from '../../../api/communityApi';

const POST_TYPES = [
  {
    type: 'RECRUIT',
    title: 'Tuyển vãng lai',
    desc: 'Nhóm bạn đang thiếu người chơi trong buổi đánh',
    icon: Users,
    color: 'emerald',
  },
  {
    type: 'PASS_BOOKING',
    title: 'Pass sân / Nhượng lại vé',
    desc: 'Bận việc đột xuất cần nhượng lại lịch đặt sân',
    icon: Ticket,
    color: 'amber',
  },
  {
    type: 'FIND_SLOT',
    title: 'Tìm slot vãng lai',
    desc: 'Bạn rảnh rỗi muốn tìm nhóm/sân để giao lưu',
    icon: UserCheck,
    color: 'blue',
  },
  {
    type: 'CHALLENGE',
    title: 'Cáp kèo giao lưu',
    desc: 'Đội hình của bạn muốn tìm đối thủ thi đấu',
    icon: Swords,
    color: 'purple',
  },
  {
    type: 'COURSE',
    title: 'Khóa học thể thao',
    desc: 'Tuyển học viên / Huấn luyện viên mở lớp đào tạo',
    icon: GraduationCap,
    color: 'indigo',
  },
];

export default function CreatePostModal({ isOpen, onClose, onSuccess }) {
  const [postType, setPostType] = useState('RECRUIT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sportType, setSportType] = useState('Cầu lông');
  const [playDate, setPlayDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [skillLevel, setSkillLevel] = useState('ALL');
  const [slotsNeeded, setSlotsNeeded] = useState(2);
  const [pricePerSlot, setPricePerSlot] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [passPrice, setPassPrice] = useState('');
  const [locationName, setLocationName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactZalo, setContactZalo] = useState('');

  // Pass Booking selection state
  const [myBookings, setMyBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    if (isOpen && postType === 'PASS_BOOKING') {
      fetchMyBookings();
    }
  }, [isOpen, postType]);

  const fetchMyBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await communityApi.getMyUpcomingBookings();
      setMyBookings(res.data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleSelectBooking = (b) => {
    setSelectedBookingId(b.booking_id);
    setTitle(`Pass sân ${b.court_name} tại ${b.venue_name}`);
    setPlayDate(b.booking_date);
    setStartTime(b.start_time ? String(b.start_time).substring(0, 5) : '18:00');
    setEndTime(b.end_time ? String(b.end_time).substring(0, 5) : '20:00');
    setLocationName(`${b.venue_name} - ${b.address}`);
    setOriginalPrice(b.total_amount);
    setPassPrice(Math.round(b.total_amount * 0.7)); // Default 30% discount suggestion
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        post_type: postType,
        title: title || `${POST_TYPES.find((t) => t.type === postType)?.title} - ${sportType}`,
        content,
        sport_type: sportType,
        play_date: playDate,
        start_time: startTime,
        end_time: endTime,
        skill_level: skillLevel,
        slots_needed: parseInt(slotsNeeded) || 1,
        price_per_slot: pricePerSlot ? parseFloat(pricePerSlot) : 0,
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        pass_price: passPrice ? parseFloat(passPrice) : null,
        location_name: locationName,
        image_url: imageUrl,
        booking_id: postType === 'PASS_BOOKING' ? selectedBookingId : null,
        contact_phone: contactPhone,
        contact_zalo: contactZalo,
      };

      await communityApi.createPost(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể tạo bài đăng');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8 border border-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Đăng bài Khám phá mới</h2>
              <p className="text-xs text-gray-500">Kết nối ngay với cộng đồng thể thao SportHub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">1. Chọn mục đích bài đăng</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {POST_TYPES.map((item) => {
                const Icon = item.icon;
                const isSelected = postType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setPostType(item.type);
                      setError(null);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start space-x-3 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>
                      <p className="text-xs text-gray-500 leading-snug mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* If PASS_BOOKING -> Select from User's Confirmed Bookings */}
          {postType === 'PASS_BOOKING' && (
            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-amber-900 flex items-center">
                  <Ticket className="w-4 h-4 mr-1.5 text-amber-600" />
                  Chọn suất đặt sân của bạn để Pass (Xác thực 100%)
                </label>
              </div>

              {loadingBookings ? (
                <div className="text-xs text-amber-700 py-2">Đang tải lịch đặt sân của bạn...</div>
              ) : myBookings.length === 0 ? (
                <div className="text-xs text-amber-700 bg-white p-3 rounded-xl border border-amber-200">
                  Bạn hiện chưa có lịch đặt sân hợp lệ nào sắp tới. Bạn vẫn có thể điền thông tin sân bên dưới thủ công.
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {myBookings.map((b) => {
                    const isSelected = selectedBookingId === b.booking_id;
                    return (
                      <div
                        key={b.booking_id}
                        onClick={() => handleSelectBooking(b)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-white border-amber-500 shadow-sm font-semibold'
                            : 'bg-white/80 border-amber-200 hover:bg-white'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-amber-950">{b.venue_name} - {b.court_name}</div>
                          <div className="text-gray-500 mt-0.5">
                            📅 {b.booking_date} | ⏰ {String(b.start_time).substring(0, 5)} - {String(b.end_time).substring(0, 5)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-amber-700 font-bold block">{parseInt(b.total_amount).toLocaleString()}đ</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 inline-block mt-1" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tiêu đề bài viết *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Tìm 2 chân vãng lai trình độ trung bình sân Xíu Xíu tối nay"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Môn thể thao</label>
                <select
                  value={sportType}
                  onChange={(e) => setSportType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Cầu lông">Cầu lông</option>
                  <option value="Pickleball">Pickleball</option>
                  <option value="Bóng đá">Bóng đá</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Bóng rổ">Bóng rổ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Yêu cầu trình độ</label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="ALL">Mọi trình độ (Giao lưu vui vẻ)</option>
                  <option value="BEGINNER">Mới chơi / Nhập môn</option>
                  <option value="INTERMEDIATE">Trung bình (Yếu / Khá)</option>
                  <option value="ADVANCED">Khá / Nâng cao (Cần kèo cứng)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày chơi *</label>
                <input
                  type="date"
                  value={playDate}
                  onChange={(e) => setPlayDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Giờ bắt đầu</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Giờ kết thúc</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tên sân / Địa điểm</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ví dụ: CLB Cầu Lông Hải Châu, 123 Nguyễn Văn Linh"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Hình ảnh đính kèm (URL hình ảnh / Để trống sẽ tự nhận ảnh đẹp của môn thể thao)</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Dán link hình ảnh (https://...) hoặc để trống"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Pricing fields depending on type */}
            {postType === 'PASS_BOOKING' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Giá gốc (VNĐ)</label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="180000"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Giá Pass lại (VNĐ) *</label>
                  <input
                    type="number"
                    value={passPrice}
                    onChange={(e) => setPassPrice(e.target.value)}
                    placeholder="120000"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 font-bold text-amber-600 outline-none"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Số lượng slot (Người cần tuyển)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={slotsNeeded}
                    onChange={(e) => setSlotsNeeded(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Chi phí / Slot (VNĐ)</label>
                  <input
                    type="number"
                    value={pricePerSlot}
                    onChange={(e) => setPricePerSlot(e.target.value)}
                    placeholder="Nhập 0 nếu miễn phí / chia đều"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="0905xxxxxx"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Số Zalo liên hệ</label>
                <input
                  type="text"
                  value={contactZalo}
                  onChange={(e) => setContactZalo(e.target.value)}
                  placeholder="0905xxxxxx"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nội dung chi tiết / Ghi chú</label>
              <textarea
                rows="3"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập thêm lời nhắn, yêu cầu đặc biệt hoặc thông tin bổ sung cho bài viết..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              ></textarea>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Đang đăng...' : 'Đăng bài ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
