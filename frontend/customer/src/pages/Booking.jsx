import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, ArrowRight, ArrowLeft, Check, ShieldCheck, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { getVenueById } from '../api/venues';
import { getVenueDailyAvailability, checkCourtAvailability } from '../api/availability';

// Design System Imports
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const venueId = searchParams.get('venueId') || searchParams.get('venue') || searchParams.get('id');
  const initialCourtId = searchParams.get('courtId');

  // State Management
  const [venue, setVenue] = useState(null);
  const [courts, setCourts] = useState([]);
  const [timeSlotsList, setTimeSlotsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Selection States
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  
  // Real Availability & Pricing State
  const [slotAvailabilityMap, setSlotAvailabilityMap] = useState({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [revalidating, setRevalidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Generate Next 7 Days list
  const getNextSevenDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const isoDate = date.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : `Thứ ${date.getDay() === 0 ? 'CN' : date.getDay() + 1}`;
      const dayFormatted = `${date.getDate()}/${date.getMonth() + 1}`;
      days.push({ isoDate, dayName, dayFormatted });
    }
    return days;
  };

  const availableDates = getNextSevenDays();

  // Initialize default date
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0].isoDate);
    }
  }, [availableDates, selectedDate]);

  // Fetch Venue Details & Courts from API with Ownership Verification
  const fetchVenueData = useCallback(async () => {
    if (!venueId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(false);
      const data = await getVenueById(venueId);
      setVenue(data);

      if (data && data.branches && data.branches.length > 0 && data.branches[0].courts) {
        const activeCourts = data.branches[0].courts.filter(c => c.court_status === 'ACTIVE' || !c.court_status);
        setCourts(activeCourts);

        // TASK 04.02D-07: Validate Court Ownership
        if (initialCourtId) {
          const matchedCourt = activeCourts.find(c => (c.court_id || c.id) === initialCourtId);
          if (matchedCourt) {
            setSelectedCourt(matchedCourt);
          } else {
            setValidationError('Sân con chỉ định không thuộc về câu lạc bộ này. Đã chọn sân mặc định.');
            if (activeCourts.length > 0) setSelectedCourt(activeCourts[0]);
          }
        } else if (activeCourts.length > 0) {
          setSelectedCourt(activeCourts[0]);
        }
      } else {
        setCourts([]);
      }
    } catch (err) {
      console.error("Failed to load venue details", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [venueId, initialCourtId]);

  useEffect(() => {
    fetchVenueData();
  }, [fetchVenueData]);

  // Fetch Real Availability for time slots dynamically from Backend
  const fetchRealAvailability = useCallback(async () => {
    if (!venueId || !selectedDate) return;

    try {
      setCheckingAvailability(true);
      const res = await getVenueDailyAvailability(venueId, selectedDate);
      if (res && res.status === 'success' && res.data) {
        const rawSlots = res.data.time_slots || [];
        const formattedSlots = rawSlots.map(s => ({
          start: s.start_time,
          end: s.end_time,
          label: s.label
        }));
        setTimeSlotsList(formattedSlots);

        const targetCourtId = selectedCourt ? (selectedCourt.court_id || selectedCourt.id) : null;
        const courtData = (res.data.courts || []).find(c => c.court_id === targetCourtId);

        const newMap = {};
        if (courtData && courtData.slots) {
          courtData.slots.forEach(slot => {
            newMap[slot.start_time] = {
              available: slot.status === 'AVAILABLE',
              price: slot.price,
              reason: slot.reason
            };
          });
        }
        setSlotAvailabilityMap(newMap);
      } else {
        setTimeSlotsList([]);
        setSlotAvailabilityMap({});
      }
    } catch (err) {
      console.error("Failed to check slot availability", err);
      setTimeSlotsList([]);
      setSlotAvailabilityMap({});
    } finally {
      setCheckingAvailability(false);
    }
  }, [venueId, selectedCourt, selectedDate]);

  useEffect(() => {
    fetchRealAvailability();
  }, [fetchRealAvailability]);

  // Revalidate Slot Availability before Proceeding to Checkout
  const handleProceedToCheckout = async () => {
    if (revalidating) return;
    setValidationError('');

    if (!selectedCourt && courts.length > 0) {
      setValidationError('Vui lòng chọn sân con trước khi tiếp tục.');
      return;
    }

    if (!selectedDate) {
      setValidationError('Vui lòng chọn ngày đặt lịch.');
      return;
    }

    if (!selectedTimeSlot) {
      setValidationError('Vui lòng chọn khung giờ đặt sân.');
      return;
    }

    const courtId = selectedCourt?.court_id || selectedCourt?.id || '';

    try {
      setRevalidating(true);
      // Revalidate selected slot against Backend API before navigating
      let isStillAvailable = false;
      try {
        const res = await checkCourtAvailability(courtId, selectedDate, selectedTimeSlot.start, selectedTimeSlot.end);
        if (res && res.data && res.data.is_available === true) {
          isStillAvailable = true;
        }
      } catch (err) {
        console.error("Revalidation API failure", err);
        isStillAvailable = false;
      }

      if (!isStillAvailable) {
        setValidationError('Khung giờ này vừa được người khác đặt hoặc đã ngưng phục vụ. Vui lòng chọn khung giờ khác.');
        fetchRealAvailability(); // Refresh list
        setSelectedTimeSlot(null);
        return;
      }

      // Build URL search params for Checkout (Only navigation context IDs, NO untrusted financial state)
      const params = new URLSearchParams();
      params.set('venueId', venueId);
      if (courtId) params.set('courtId', courtId);
      params.set('date', selectedDate);
      params.set('startTime', selectedTimeSlot.start);
      params.set('endTime', selectedTimeSlot.end);
      params.set('label', selectedTimeSlot.label);

      navigate(`/checkout?${params.toString()}`);
    } catch (err) {
      console.error("Revalidation error", err);
      setValidationError('Không thể xác thực khung giờ với hệ thống. Vui lòng kiểm tra lại đường truyền.');
    } finally {
      setRevalidating(false);
    }
  };

  // Missing Venue Context
  if (!venueId) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <EmptyState
          title="Chưa chọn sân thể thao"
          description="Vui lòng chọn câu lạc bộ thể thao trước khi thực hiện quy trình đặt lịch giữ sân."
          action={
            <Button variant="primary" onClick={() => navigate('/search')}>
              Khám phá danh sách sân
            </Button>
          }
        />
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="container mx-auto px-4 max-w-6xl py-12 space-y-6">
        <Skeleton variant="text" width="40%" height="2rem" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card padding="md"><Skeleton variant="rectangular" height="120px" /></Card>
            <Card padding="md"><Skeleton variant="rectangular" height="180px" /></Card>
          </div>
          <div className="lg:col-span-1">
            <Card padding="md"><Skeleton variant="rectangular" height="260px" /></Card>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <ErrorState
          title="Không thể tải thông tin đặt lịch"
          description="Đã xảy ra sự cố khi kết nối đến hệ thống. Vui lòng thử lại."
          action={
            <Button variant="primary" leftIcon={<RefreshCw size={16} />} onClick={fetchVenueData}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  // // Location string
  // const locationStr = venue?.branches && venue.branches.length > 0
  //   ? `${venue.branches[0].ward_district_city || ''}, ${venue.branches[0].street_address || ''}`
  //   : "Chưa cập nhật địa chỉ";

  // const selectedSlotData = selectedTimeSlot ? slotAvailabilityMap[selectedTimeSlot.start] : null;
  // const currentPrice = selectedSlotData?.price;

  // return (
  //   <div className="w-full bg-surface-subtle min-h-screen pb-20">
  //     {/* BREADCRUMB & HEADER */}
  //     <section className="bg-surface border-b border-border-subtle-medium py-6 px-4">
  //       <div className="container mx-auto max-w-6xl">
  //         <div className="flex items-center text-xs text-text-muted gap-2 mb-3">
  //           <Link to="/" className="hover:text-accent-primary">Trang chủ</Link>
  //           <span>/</span>
  //           <Link to="/search" className="hover:text-accent-primary">Tìm sân</Link>
  //           <span>/</span>
  //           <span className="text-gray-900 font-medium truncate">{venue?.venue_name}</span>
  //         </div>

  //         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  //           <div>
  //             <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
  //               Đặt lịch sân thể thao
  //             </h1>
  //             <p className="text-sm text-text-muted mt-1">
  //               Chọn ngày, sân con và khung giờ kiểm tra trạng thái thực tế 
  //             </p>
  //           </div>
  //           <Button
  //             variant="outline"
  //             size="sm"
  //             leftIcon={<ArrowLeft size={16} />}
  //             onClick={() => navigate(-1)}
  //           >
  //             Quay lại
  //           </Button>
  //         </div>
  //       </div>
  //     </section>

  //     {/* MAIN CONTENT */}
  //     <div className="container mx-auto px-4 max-w-6xl py-8">
  //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
  //         {/* LEFT CONFIGURATION COLUMN */}
  //         <div className="lg:col-span-2 space-y-6">
            
  //           {/* VENUE SUMMARY CARD */}
  //           <Card padding="md" radius="xl" className="border border-border-subtle-medium">
  //             <div className="flex items-start gap-4">
  //               <div className="w-20 h-20 rounded-xl bg-accent-primary-light text-accent-primary font-bold text-xl flex items-center justify-center flex-shrink-0 border border-accent-primary-light">
  //                 {venue?.venue_name?.substring(0, 3).toUpperCase() || 'VEN'}
  //               </div>
  //               <div className="space-y-1">
  //                 <Badge variant="info" size="sm" className="mb-1">
  //                   Xác nhận hệ thống
  //                 </Badge>
  //                 <h2 className="font-bold text-xl text-gray-900 leading-snug">
  //                   {venue?.venue_name}
  //                 </h2>
  //                 <div className="flex items-center text-xs text-text-muted">
  //                   <MapPin size={14} className="mr-1 flex-shrink-0" />
  //                   <span>{locationStr}</span>
  //                 </div>
  //               </div>
  //             </div>
  //           </Card>

  //           {/* DATE SELECTOR */}
  //           <Card padding="md" radius="xl" className="border border-border-subtle-medium space-y-4">
  //             <Card.Header>
  //               <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
  //                 <Calendar size={18} className="text-accent-primary" />
  //                 1. Chọn ngày đặt lịch
  //               </h3>
  //             </Card.Header>
  //             <Card.Body>
  //               <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
  //                 {availableDates.map((item) => {
  //                   const isSelected = selectedDate === item.isoDate;
  //                   return (
  //                     <button
  //                       key={item.isoDate}
  //                       onClick={() => setSelectedDate(item.isoDate)}
  //                       className={[
  //                         'flex flex-col items-center justify-center px-4 py-3 rounded-xl border text-center transition-all min-w-[85px] min-h-[44px]',
  //                         isSelected
  //                           ? 'bg-brand-orange text-white border-brand-orange shadow-md font-bold'
  //                           : 'bg-surface text-gray-900 border-border-subtle-medium hover:border-brand-orange/50 hover:bg-surface-subtle'
  //                       ].join(' ')}
  //                     >
  //                       <span className="text-xs opacity-90">{item.dayName}</span>
  //                       <span className="text-sm font-bold mt-0.5">{item.dayFormatted}</span>
  //                     </button>
  //                   );
  //                 })}
  //               </div>
  //             </Card.Body>
  //           </Card>

  //           {/* COURT SELECTOR */}
  //           <Card padding="md" radius="xl" className="border border-border-subtle-medium space-y-4">
  //             <Card.Header>
  //               <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
  //                 <ShieldCheck size={18} className="text-accent-primary" />
  //                 2. Chọn sân con
  //               </h3>
  //             </Card.Header>
  //             <Card.Body>
  //               {courts.length === 0 ? (
  //                 <EmptyState
  //                   size="sm"
  //                   title="Chưa có thông tin sân con"
  //                   description="Hệ thống chưa cung cấp danh sách sân con cho câu lạc bộ này."
  //                 />
  //               ) : (
  //                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
  //                   {courts.map((court) => {
  //                     const courtId = court.court_id || court.id;
  //                     const courtName = court.court_name || court.name || 'Sân tiêu chuẩn';
  //                     const isSelected = selectedCourt && (selectedCourt.court_id || selectedCourt.id) === courtId;

  //                     return (
  //                       <button
  //                         key={courtId}
  //                         onClick={() => setSelectedCourt(court)}
  //                         className={[
  //                           'p-3.5 rounded-xl border text-left transition-all min-h-[44px] flex items-center justify-between',
  //                           isSelected
  //                             ? 'bg-accent-primary-light text-accent-primary border-accent-primary font-bold shadow-sm'
  //                             : 'bg-surface text-gray-900 border-border-subtle-medium hover:border-accent-primary/50'
  //                         ].join(' ')}
  //                       >
  //                         <div>
  //                           <p className="text-sm font-semibold">{courtName}</p>
  //                           <p className="text-[11px] text-text-muted mt-0.5">Tiêu chuẩn thi đấu</p>
  //                         </div>
  //                         {isSelected && <Check size={16} className="text-accent-primary" />}
  //                       </button>
  //                     );
  //                   })}
  //                 </div>
  //               )}
  //             </Card.Body>
  //           </Card>

  //           {/* TIME SLOT SELECTOR (LIVE BACKEND AVAILABILITY) */}
  //           <Card padding="md" radius="xl" className="border border-border-subtle-medium space-y-4">
  //             <Card.Header className="flex justify-between items-center">
  //               <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
  //                 <Clock size={18} className="text-accent-primary" />
  //                 3. Chọn khung giờ 
  //               </h3>
  //               {checkingAvailability && (
  //                 <div className="flex items-center text-xs text-text-muted gap-1">
  //                   <Loader2 size={14} className="animate-spin text-accent-primary" />
  //                   <span>Đang xác thực...</span>
  //                 </div>
  //               )}
  //             </Card.Header>
  //             <Card.Body>
  //               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
  //                 {timeSlotsList.map((slot) => {
  //                   const slotData = slotAvailabilityMap[slot.start];
  //                   // NO FAKE AVAILABILITY: If API hasn't loaded or returned false, disable slot!
  //                   const isAvailable = slotData ? Boolean(slotData.available) : false;
  //                   const price = slotData?.price;
  //                   const isSelected = selectedTimeSlot?.start === slot.start;

  //                   return (
  //                     <button
  //                       key={slot.start}
  //                       disabled={!isAvailable}
  //                       onClick={() => setSelectedTimeSlot(slot)}
  //                       className={[
  //                         'p-3 rounded-xl border text-center transition-all min-h-[44px] flex flex-col items-center justify-center relative',
  //                         !isAvailable
  //                           ? 'bg-surface-muted text-text-muted border-border-subtle cursor-not-allowed opacity-50'
  //                           : isSelected
  //                           ? 'bg-brand-orange text-white border-brand-orange shadow-md font-bold'
  //                           : 'bg-surface text-gray-900 border-border-subtle-medium hover:border-brand-orange/50 hover:bg-surface-subtle'
  //                       ].join(' ')}
  //                     >
  //                       <span className="text-sm font-semibold">{slot.label}</span>
  //                       <span className="text-[11px] mt-0.5 opacity-90">
  //                         {isAvailable && price ? `${price.toLocaleString('vi-VN')}đ` : (slotData?.reason || 'Không khả dụng')}
  //                       </span>
  //                     </button>
  //                   );
  //                 })}
  //               </div>
  //             </Card.Body>
  //           </Card>
  //         </div>

  //         {/* STICKY SUMMARY COLUMN */}
  //         <div className="lg:col-span-1 sticky top-24 space-y-4">
  //           <Card padding="md" radius="xl" className="border border-border-subtle-medium shadow-md">
  //             <Card.Header className="pb-3 border-b border-border-subtle-medium mb-4">
  //               <h3 className="font-bold text-gray-900 text-lg">
  //                 Tóm tắt đặt lịch
  //               </h3>
  //             </Card.Header>

  //             <Card.Body className="space-y-4 text-sm">
  //               <div className="space-y-2">
  //                 <div className="flex justify-between text-text-muted">
  //                   <span>Địa điểm:</span>
  //                   <span className="font-semibold text-gray-900 text-right truncate max-w-[150px]">
  //                     {venue?.venue_name}
  //                   </span>
  //                 </div>

  //                 <div className="flex justify-between text-text-muted">
  //                   <span>Sân con:</span>
  //                   <span className="font-semibold text-gray-900">
  //                     {selectedCourt ? (selectedCourt.court_name || selectedCourt.name || 'Sân tiêu chuẩn') : 'Chưa chọn'}
  //                   </span>
  //                 </div>

  //                 <div className="flex justify-between text-text-muted">
  //                   <span>Ngày đặt:</span>
  //                   <span className="font-semibold text-gray-900">
  //                     {selectedDate || 'Chưa chọn'}
  //                   </span>
  //                 </div>

  //                 <div className="flex justify-between text-text-muted">
  //                   <span>Khung giờ:</span>
  //                   <span className="font-semibold text-gray-900">
  //                     {selectedTimeSlot ? selectedTimeSlot.label : 'Chưa chọn'}
  //                   </span>
  //                 </div>

  //                 <div className="flex justify-between text-text-muted">
  //                   <span>Thời lượng:</span>
  //                   <span className="font-semibold text-gray-900">1 giờ</span>
  //                 </div>
  //               </div>

  //               <div className="pt-4 border-t border-border-subtle-medium flex justify-between items-center">
  //                 <span className="font-bold text-gray-900">Tạm tính:</span>
  //                 <span className="text-xl font-bold text-brand-orange">
  //                   {selectedTimeSlot && currentPrice ? `${currentPrice.toLocaleString('vi-VN')}đ` : 'Theo báo giá sân'}
  //                 </span>
  //               </div>

  //               {validationError && (
  //                 <div role="alert" className="p-3 bg-status-error-bg text-status-error-text text-xs rounded-lg flex items-center gap-2">
  //                   <AlertCircle size={16} className="flex-shrink-0 text-status-error" />
  //                   <span>{validationError}</span>
  //                 </div>
  //               )}
  //             </Card.Body>

  //             <Card.Footer className="pt-4">
  //               <Button
  //                 variant="primary"
  //                 size="lg"
  //                 fullWidth
  //                 loading={revalidating}
  //                 rightIcon={<ArrowRight size={18} />}
  //                 onClick={handleProceedToCheckout}
  //               >
  //                 Tiếp tục thanh toán
  //               </Button>
  //             </Card.Footer>
  //           </Card>
  //         </div>

  //       </div>
  //     </div>
  //   </div>
  // );
}
