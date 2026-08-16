import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Phone,
  Star,
  Heart,
  Calendar,
  Check,
  RefreshCw,
  Info,
  Lock,
  ArrowRight
} from 'lucide-react';
import { getVenueById } from '../../api/venues';
import { getVenueDailyAvailability } from '../../api/availability';
import { addFavorite } from '../../api/favorites';

// Design System Imports
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

export default function VisualBooking() {
  const { id: venueId } = useParams();
  const navigate = useNavigate();

  // Primary Data States
  const [venue, setVenue] = useState(null);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [loadingVenue, setLoadingVenue] = useState(true);
  const [loadingGrid, setLoadingGrid] = useState(true);
  const [error, setError] = useState(false);
  const [favPending, setFavPending] = useState(false);
  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'info' });

  // Date Filter State (Default to today ISO format YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Selected Slots State: Map of `${court_id}___${start_time}` -> slot detail
  const [selectedSlotsMap, setSelectedSlotsMap] = useState({});

  // 1. Generate Next 14 Days List for quick bar
  const availableDates = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const isoDate = date.toISOString().split('T')[0];

      const dayOfWeek = date.getDay();
      const dayName = i === 0
        ? 'Hôm nay'
        : i === 1
          ? 'Ngày mai'
          : dayOfWeek === 0
            ? 'Chủ Nhật'
            : `Thứ ${dayOfWeek + 1}`;

      const dayFormatted = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

      days.push({ isoDate, dayName, dayFormatted });
    }
    return days;
  }, []);

  // 2. Fetch Venue Basic Details
  const fetchVenueInfo = useCallback(async () => {
    if (!venueId) return;
    try {
      setLoadingVenue(true);
      setError(false);
      const data = await getVenueById(venueId);
      setVenue(data);
    } catch (err) {
      console.error("Failed to fetch venue details for booking flow", err);
      setError(true);
    } finally {
      setLoadingVenue(false);
    }
  }, [venueId]);

  useEffect(() => {
    fetchVenueInfo();
  }, [fetchVenueInfo]);

  // 3. Fetch Daily Schedule Matrix Availability
  const fetchGridAvailability = useCallback(async () => {
    if (!venueId || !selectedDate) return;
    try {
      setLoadingGrid(true);
      const res = await getVenueDailyAvailability(venueId, selectedDate);
      if (res && res.status === 'success' && res.data) {
        setAvailabilityData(res.data);
      } else {
        setAvailabilityData(null);
      }
    } catch (err) {
      console.error("Failed to fetch daily venue availability matrix", err);
    } finally {
      setLoadingGrid(false);
    }
  }, [venueId, selectedDate]);

  useEffect(() => {
    fetchGridAvailability();
  }, [fetchGridAvailability]);

  // Time Slots list from Availability API (NO FAKE FALLBACK GENERATION)
  const timeSlots = useMemo(() => {
    return availabilityData?.time_slots ?? [];
  }, [availabilityData]);

  const courtsList = useMemo(() => {
    if (!availabilityData || !availabilityData.courts) return [];
    return availabilityData.courts;
  }, [availabilityData]);

  // Handle Slot Click Toggle Selection
  const toggleSlotSelection = (court, slot) => {
    if (slot.status !== 'AVAILABLE') return;

    const key = `${court.court_id}___${slot.start_time}`;
    setSelectedSlotsMap((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = {
          court_id: court.court_id,
          court_name: court.court_name,
          sport_category: court.sport_category,
          booking_date: selectedDate,
          start_time: slot.start_time,
          end_time: slot.end_time,
          label: slot.label,
          price: slot.price || 0
        };
      }
      return next;
    });
  };

  // Calculate Selected Totals
  const selectedSlotsList = useMemo(() => Object.values(selectedSlotsMap), [selectedSlotsMap]);
  const totalSelectedCount = selectedSlotsList.length;
  const totalHours = totalSelectedCount * 1; // Each slot is 30 minutes (0.5 hour)

  const totalAmount = useMemo(() => {
    return selectedSlotsList.reduce((sum, slot) => sum + (slot.price || 0), 0);
  }, [selectedSlotsList]);

  // Format Selected Time Interval for Footer
  const formattedTimeInterval = useMemo(() => {
    if (selectedSlotsList.length === 0) return '';
    const sorted = [...selectedSlotsList].sort((a, b) => a.start_time.localeCompare(b.start_time));
    const earliest = sorted[0].start_time.substring(0, 5);
    const latest = sorted[sorted.length - 1].end_time.substring(0, 5);
    return `${earliest} - ${latest}`;
  }, [selectedSlotsList]);

  // Navigate to Checkout
  const handleProceedToCheckout = () => {
    if (totalSelectedCount === 0) return;

    navigate('/checkout', {
      state: {
        venueId,
        venueName: venue?.venue_name,
        date: selectedDate,
        sportCategory: selectedSlotsList[0]?.sport_category || 'Thể thao',
        selectedSlots: selectedSlotsList,
        totalAmount,
        totalHours
      }
    });
  };

  // Extract Address
  const locationStr = venue?.branches && venue.branches.length > 0
    ? `${venue.branches[0].street_address || ''}, ${venue.branches[0].ward_district_city || ''}`
    : "Địa chỉ đang cập nhật";

  // Operating Hours display string
  const operatingHoursStr = venue?.operating_hours
    || (availabilityData?.time_slots && availabilityData.time_slots.length > 0
      ? `${availabilityData.time_slots[0].start_time.substring(0, 5)} - ${availabilityData.time_slots[availabilityData.time_slots.length - 1].end_time.substring(0, 5)}`
      : 'Theo lịch hoạt động sân');

  // Render Loading State
  if (loadingVenue) {
    return (
      <div className="w-full bg-surface-subtle min-h-screen pb-32">
        <Skeleton variant="rectangular" height="300px" />
        <div className="container mx-auto max-w-6xl px-4 -mt-20 relative z-10 space-y-6">
          <Skeleton variant="rounded" height="140px" />
          <Skeleton variant="rectangular" height="400px" />
        </div>
      </div>
    );
  }

  // Render Error State
  if (error || !venue) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <ErrorState
          title="Không thể tải lịch sân thể thao"
          description="Đã có lỗi xảy ra khi truy xuất thông tin câu lạc bộ. Vui lòng kiểm tra lại đường truyền."
          action={
            <Button variant="primary" leftIcon={<RefreshCw size={16} />} onClick={fetchVenueInfo}>
              Thử lại
            </Button>
          }
          secondaryAction={
            <Button variant="outline" onClick={() => navigate('/search')}>
              Khám phá sân khác
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen pb-16 font-sans">

      {/* 1. HERO BANNER */}
      <section className="w-full h-[220px] md:h-[280px] relative bg-dark">
        <img
          src="/venue_hero.png"
          alt={`${venue.venue_name} Hero`}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-transparent to-transparent"></div>
      </section>

      {/* 2. OVERLAPPING VENUE CARD (MATCHING UX REFERENCE) */}
      <section className="container mx-auto px-4 max-w-6xl -mt-24 md:-mt-28 relative z-10">
        <Card radius="2xl" padding="lg" className="shadow-xl border border-border-subtle-medium bg-surface">
          <div className="flex flex-col md:flex-row gap-6 items-start justify-between">

            {/* Left: Venue Logo & Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full md:w-auto">
              {/* Venue Logo Thumbnail */}
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-2 border-border-subtle-medium bg-white shadow-sm flex items-center justify-center p-3 flex-shrink-0 overflow-hidden">
                <div className="w-full h-full border-2 border-primary/20 rounded-xl flex flex-col items-center justify-center bg-surface-subtle">
                  <span className="font-extrabold text-2xl text-primary tracking-tight">
                    {venue.venue_name ? venue.venue_name.substring(0, 3).toUpperCase() : 'ACE'}
                  </span>
                  <span className="text-[9px] font-bold text-brand-orange uppercase tracking-wider mt-0.5">BADMINTON</span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="rating" size="sm" leftIcon={<Star size={12} className="fill-current text-amber-500" />}>
                    4.8
                  </Badge>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">
                  {venue.venue_name}
                </h1>

                <div className="space-y-1 text-xs md:text-sm text-text-muted">
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-gray-400 shrink-0" />
                    <span>{locationStr}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-gray-400 shrink-0" />
                    <span>{operatingHoursStr}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={15} className="text-gray-400 shrink-0" />
                    <span>{venue.contact_phone || 'Chưa cập nhật SĐT'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-col gap-3 w-full md:w-48 shrink-0 pt-2 md:pt-0">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<Calendar size={18} />}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white shadow-md font-bold"
              >
                Đặt lịch
              </Button>
              <Button
                variant="outline"
                size="md"
                fullWidth
                disabled={favPending}
                leftIcon={<Heart size={18} className="text-accent-primary" />}
                onClick={async () => {
                  if (favPending) return;
                  try {
                    setFavPending(true);
                    await addFavorite(venueId);
                    setNoticeModal({ open: true, title: 'Danh sách yêu thích', message: 'Đã thêm sân vào danh sách yêu thích thành công.', type: 'success' });
                  } catch (err) {
                    setNoticeModal({ open: true, title: 'Đã tồn tại', message: 'Sân này đã có trong danh sách yêu thích của bạn.', type: 'info' });
                  } finally {
                    setFavPending(false);
                  }
                }}
                className="border-accent-primary text-accent-primary hover:bg-accent-primary-light font-semibold"
              >
                Yêu thích
              </Button>
            </div>

          </div>
        </Card>
      </section>

      {/* 3. CALENDAR CONTROLS, LEGEND & DATE SELECTOR */}
      <section className="container mx-auto px-4 max-w-6xl mt-6 space-y-4">

        {/* Status Legend Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border-subtle-medium shadow-xs">

          {/* Status Color Badges */}
          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-gray-300 bg-white shadow-xs"></span>
              <span>Trống</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[#ef4444]"></span>
              <span>Đã đặt</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[#6b7280]"></span>
              <span>Khoá</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[#70385c]"></span>
              <span>Sự kiện</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-accent-primary"></span>
              <span>Đang chọn</span>
            </div>
          </div>

          {/* Price List Link & Date Picker Input */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setNoticeModal({ open: true, title: 'Bảng giá tham khảo', message: 'Bảng giá cơ bản: 60.000đ - 120.000đ / 30 phút tuỳ khung giờ.', type: 'info' })}
              className="text-brand-orange font-bold hover:underline"
            >
              Xem sân & bảng giá
            </button>

            <div className="flex items-center gap-2 bg-surface-subtle px-3 py-1.5 rounded-lg border border-border-subtle-medium text-gray-800 font-bold">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    setSelectedSlotsMap({});
                  }
                }}
                className="bg-transparent border-none text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Quick Date Chips Bar */}
        {/* <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {availableDates.map((day) => {
            const isSelected = selectedDate === day.isoDate;
            return (
              <button
                key={day.isoDate}
                onClick={() => {
                  setSelectedDate(day.isoDate);
                  setSelectedSlotsMap({});
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-accent-primary text-white border-accent-primary shadow-xs'
                    : 'bg-surface hover:bg-surface-subtle text-gray-700 border-border-subtle-medium'
                }`}
              >
                {day.dayName} ({day.dayFormatted})
              </button>
            );
          })}
        </div> */}

        {/* Notice Banner */}
        <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-center gap-2 shadow-xs">
          <Info size={16} className="text-amber-600 shrink-0" />
          <span>
            <strong>Lưu ý:</strong> Mọi yêu cầu đặt lịch cố định vui lòng liên hệ hotline: <strong className="text-amber-900">{venue.contact_phone || 'Chưa cập nhật SĐT'}</strong> để được hỗ trợ tốt nhất.
          </span>
        </div>

      </section>

      {/* 4. TIMELINE MATRIX GRID TABLE (MATCHING UX REFERENCE) */}
      <section className="container mx-auto px-4 max-w-6xl mt-6 space-y-4">
        <Card radius="2xl" padding="none" className="border border-border-subtle-medium shadow-md bg-surface overflow-hidden">

          {loadingGrid ? (
            <div className="p-12 space-y-4 text-center">
              <Skeleton variant="text" width="200px" className="mx-auto" />
              <Skeleton variant="rectangular" height="300px" />
            </div>
          ) : (courtsList.length === 0 || timeSlots.length === 0) ? (
            <div className="p-12">
              <EmptyState
                title="Hiện chưa có sân hoặc khung giờ khả dụng"
                description="Hệ thống chưa tìm thấy sân hoặc khung giờ phục vụ cho ngày đã chọn. Vui lòng chọn ngày khác."
              />
            </div>
          ) : (
            <div className="overflow-x-auto w-full relative max-h-[600px] overflow-y-auto">

              <table className="w-full text-left border-collapse min-w-[1200px]">
                {/* Table Header: Time Slots */}
                <thead className="bg-[#e0f2fe]/60 sticky top-0 z-20 shadow-xs border-b border-border-subtle-medium">
                  <tr>
                    {/* Fixed Court Header Cell */}
                    <th className="p-3 text-xs font-bold text-gray-800 w-36 min-w-[140px] bg-[#dbeafe] sticky left-0 z-30 border-r border-border-subtle-medium shadow-xs">
                      Sân / Giờ
                    </th>

                    {/* Time Slot Columns */}
                    {timeSlots.map((slot) => (
                      <th
                        key={slot.start_time}
                        className="p-2 text-[11px] font-bold text-gray-700 text-center border-r border-border-subtle-medium min-w-[70px] select-none"
                      >
                        <div>{slot.start_time.substring(0, 5)}</div>
                        <div className="text-[10px] text-gray-500 font-normal">{slot.end_time.substring(0, 5)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body: Court Rows */}
                <tbody className="divide-y divide-border-subtle">
                  {courtsList.map((court) => (
                    <tr key={court.court_id} className="hover:bg-surface-subtle/50 transition-colors">

                      {/* Court Name Left Cell (Sticky Left) */}
                      <td className="p-3 text-xs font-bold text-gray-900 bg-surface sticky left-0 z-10 border-r border-border-subtle-medium shadow-xs truncate">
                        {court.court_name}
                      </td>

                      {/* Timeline Slots Cells */}
                      {court.slots.map((slot) => {
                        const slotKey = `${court.court_id}___${slot.start_time}`;
                        const isSelected = Boolean(selectedSlotsMap[slotKey]);

                        // Cell Base Style
                        let cellClass = "p-2 border-r border-b border-border-subtle transition-all duration-150 relative h-12 text-center text-[10px] select-none ";
                        let titleText = `${court.court_name} | ${slot.label}`;

                        // 1. AVAILABLE (Trống - Trắng)
                        if (slot.status === 'AVAILABLE') {
                          if (isSelected) {
                            // 2. SELECTED (Đang chọn - Cam)
                            cellClass += "bg-accent-primary text-white cursor-pointer shadow-inner font-bold";
                            titleText += ` | Đang chọn (${slot.price ? slot.price.toLocaleString('vi-VN') + 'đ' : '0đ'})`;
                          } else {
                            cellClass += "bg-white hover:bg-emerald-100/70 text-transparent hover:text-emerald-900 cursor-pointer";
                            titleText += ` | Còn trống (${slot.price ? slot.price.toLocaleString('vi-VN') + 'đ' : '0đ'})`;
                          }
                        }
                        // 3. BOOKED (Đã đặt - Đỏ)
                        else if (slot.status === 'BOOKED') {
                          cellClass += "bg-[#ef4444] text-white cursor-not-allowed opacity-90";
                          titleText += " | Đã được đặt";
                        }
                        // 4. LOCKED (Khoá - Xám)
                        else if (slot.status === 'BLOCKED') {
                          cellClass += "bg-[#6b7280] text-white cursor-not-allowed opacity-90";
                          titleText += ` | Khoá: ${slot.reason || 'Bảo trì'}`;
                        }
                        // 5. EVENT (Sự kiện - Tím / Plum)
                        else if (slot.status === 'EVENT') {
                          cellClass += "bg-[#70385c] text-white cursor-not-allowed opacity-95";
                          titleText += ` | Sự kiện: ${slot.reason || 'Đặc biệt'}`;
                        }
                        // 6. DISABLED / UNAVAILABLE (Xám tối)
                        else {
                          cellClass += "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60";
                          titleText += ` | ${slot.reason || 'Ngoài giờ'}`;
                        }

                        return (
                          <td
                            key={slot.start_time}
                            onClick={() => toggleSlotSelection(court, slot)}
                            className={cellClass}
                            title={titleText}
                          >
                            {/* Render Checkmark if Selected */}
                            {isSelected && (
                              <div className="flex items-center justify-center h-full">
                                <Check size={14} strokeWidth={3} className="text-white drop-shadow-xs" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}

        </Card>

        {/* 5. BOOKING SUMMARY BAR (PLACED DIRECTLY BELOW THE MATRIX TABLE) */}
        <div className="bg-accent-primary text-white rounded-2xl p-4 md:p-5 shadow-lg border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4 mt-4">

          {/* Left Details */}
          <div className="space-y-0.5 w-full md:w-auto">
            <div className="text-[11px] text-cyan-100 font-medium tracking-wide">
              Thời gian chọn
            </div>

            <div className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-4">
              <span>Tổng giờ: <strong className="text-amber-300 font-extrabold">{totalHours}h</strong></span>
              {formattedTimeInterval && (
                <span className="text-xs font-normal text-cyan-100 hidden sm:inline">
                  ({formattedTimeInterval})
                </span>
              )}
            </div>

            <div className="text-xs text-cyan-100">
              Tạm tính
            </div>

            <div className="text-xl md:text-2xl font-extrabold text-white leading-none">
              Tổng tiền: <strong className="text-amber-300 font-extrabold">{totalAmount.toLocaleString('vi-VN')}đ</strong>
            </div>
          </div>

          {/* Right CTA Button */}
          <div className="w-full md:w-auto flex justify-end">
            <Button
              variant="primary"
              size="lg"
              disabled={totalSelectedCount === 0}
              onClick={handleProceedToCheckout}
              rightIcon={<ArrowRight size={18} />}
              className={`w-full md:w-auto px-8 py-3.5 rounded-xl font-extrabold text-base shadow-md transition-all ${totalSelectedCount > 0
                  ? 'bg-brand-orange hover:bg-brand-orange-hover text-white scale-105'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-70'
                }`}
            >
              TIẾP THEO
            </Button>
          </div>

        </div>
      </section>

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
  );
}
