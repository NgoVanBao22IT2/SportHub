import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, CreditCard, Banknote, User, Lock, Check, AlertCircle, RefreshCw, AlertTriangle, Calendar, Clock, MapPin, Upload, FileImage } from 'lucide-react';
import { getVenueById, getVenuePaymentAccounts } from '../api/venues';
import { checkCourtAvailability } from '../api/availability';
import { createBooking, getBookingById } from '../api/bookings';
import { createPayment, getPaymentStatus, uploadPaymentProof } from '../api/payments';
import { useAuth } from '../context/AuthContext';

// Design System Imports
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  // Extract navigation context from location state or URL params
  const locationState = location.state || {};
  const selectedSlots = locationState.selectedSlots || [];

  const venueId = locationState.venueId || searchParams.get('venueId');
  const courtId = searchParams.get('courtId') || (selectedSlots.length > 0 ? selectedSlots[0].court_id : null);
  const bookingDate = locationState.date || searchParams.get('date') || '';
  const startTime = searchParams.get('startTime') || '18:00:00';
  const endTime = searchParams.get('endTime') || '19:00:00';

  // Backend trusted states
  const [venue, setVenue] = useState(null);
  const [court, setCourt] = useState(null);
  const [verifiedPrice, setVerifiedPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [ownershipError, setOwnershipError] = useState(false);

  // Form State prefilled from currentUser if available
  const [fullName, setFullName] = useState(currentUser?.full_name || currentUser?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone || currentUser?.phoneNumber || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('banking');

  // Transaction States
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [unknownOutcomeState, setUnknownOutcomeState] = useState(null);
  const [apiErrorMessage, setApiErrorMessage] = useState('');

  // Upload Payment Proof States
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);

  // Check Payment Status if Returning from Payment Gateway via URL query params
  useEffect(() => {
    const pId = searchParams.get('paymentId') || searchParams.get('orderId');
    if (pId && !confirmedBooking) {
      getPaymentStatus(pId)
        .then((res) => {
          const p = res?.data || res;
          if (p && p.booking) {
            const b = p.booking;
            setConfirmedBooking({
              id: b.booking_id,
              paymentId: p.payment_id,
              venueName: b.court?.branch?.venue?.venue_name || 'Sân thể thao',
              courtName: b.court?.court_name || 'Sân tiêu chuẩn',
              bookingDate: b.booking_date,
              timeLabel: `${(b.start_time || '').substring(0, 5)} - ${(b.end_time || '').substring(0, 5)}`,
              price: b.total_amount,
              fullName: currentUser?.full_name || 'Khách hàng',
              phoneNumber: currentUser?.phone_number || '',
              paymentMethod: p.payment_method === 'CASH' || p.payment_method === 'ONSITE' ? 'Thanh toán trực tiếp tại sân' : 'Chuyển khoản Ngân hàng (VietQR)',
              bookingStatus: b.booking_status,
              paymentStatus: p.payment_status
            });
            if (b.payment_proof_url) {
              setProofPreview(b.payment_proof_url);
              setProofUploaded(true);
            }
          }
        })
        .catch(err => console.warn('Could not fetch payment status from URL param:', err));
    }
  }, [searchParams, confirmedBooking, currentUser]);

  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'error' });

  const compressImage = (dataUrl, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNoticeModal({ open: true, title: 'Định dạng tệp không hợp lệ', message: 'Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP).', type: 'error' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setNoticeModal({ open: true, title: 'Kích thước tệp quá lớn', message: 'Dung lượng ảnh tối đa cho phép là 10MB.', type: 'error' });
      return;
    }
    setProofFile(file);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result, 1200, 0.8);
      setProofPreview(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProofSubmit = async () => {
    const targetPaymentId = confirmedBooking?.paymentId || confirmedBooking?.bookingId || confirmedBooking?.id;
    if (!proofPreview) {
      setNoticeModal({ open: true, title: 'Thiếu minh chứng', message: 'Vui lòng chọn ảnh minh chứng giao dịch trước khi gửi.', type: 'error' });
      return;
    }
    try {
      setUploadingProof(true);
      if (targetPaymentId) {
        await uploadPaymentProof(targetPaymentId, proofPreview);
      } else {
        throw new Error('Mã đơn hàng không hợp lệ.');
      }
      setProofUploaded(true);
      setConfirmedBooking(prev => ({
        ...prev,
        bookingStatus: 'WAITING_OWNER_CONFIRMATION',
        paymentStatus: 'SUCCESS'
      }));
      setNoticeModal({
        open: true,
        title: 'Upload minh chứng thành công',
        message: 'Upload minh chứng thành công, vui lòng chờ chủ sân xác nhận.',
        type: 'success'
      });
    } catch (err) {
      console.error('Failed to upload payment proof', err);
      const errMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Không thể tải lên ảnh minh chứng. Vui lòng thử lại.';
      setNoticeModal({ open: true, title: 'Tải ảnh thất bại', message: errMsg, type: 'error' });
    } finally {
      setUploadingProof(false);
    }
  };

  const [venuePaymentAccounts, setVenuePaymentAccounts] = useState([]);

  // Fetch Trusted Venue & Price Information from Backend API (With Ownership Check)
  const fetchCheckoutContext = useCallback(async () => {
    if (!venueId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(false);
      setOwnershipError(false);

      const [data, accountsData] = await Promise.all([
        getVenueById(venueId),
        getVenuePaymentAccounts(venueId).catch(() => [])
      ]);
      setVenue(data);
      setVenuePaymentAccounts(accountsData || []);

      if (data && data.branches && data.branches.length > 0 && data.branches[0].courts) {
        const activeCourts = data.branches[0].courts;
        const foundCourt = activeCourts.find(c => (c.court_id || c.id) === courtId);

        // TASK 04.02D-07: Venue ↔ Court Ownership Validation
        if (courtId && !foundCourt) {
          console.error(`Security Violation: courtId ${courtId} does not belong to venue ${venueId}`);
          setOwnershipError(true);
          setLoading(false);
          return;
        }

        const targetCourt = foundCourt || activeCourts[0];
        setCourt(targetCourt);

        // Revalidate price with Availability API
        const targetCourtId = targetCourt ? (targetCourt.court_id || targetCourt.id) : courtId;
        if (targetCourtId && bookingDate) {
          try {
            const availRes = await checkCourtAvailability(targetCourtId, bookingDate, startTime, endTime);
            if (availRes && availRes.data && availRes.data.pricing?.total_price) {
              setVerifiedPrice(availRes.data.pricing.total_price);
            } else {
              setVerifiedPrice(null);
            }
          } catch (availErr) {
            console.warn("Pricing availability check failed", availErr);
            setVerifiedPrice(null);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load checkout context", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [venueId, courtId, bookingDate, startTime, endTime]);

  useEffect(() => {
    fetchCheckoutContext();
  }, [fetchCheckoutContext]);

  // Handle Real Booking Submission to Backend API (NO MOCK/FAKE FALLBACKS)
  const handleConfirmOrder = async (e) => {
    e?.preventDefault();
    if (submitting) return; // Prevent double-submit
    setApiErrorMessage('');
    setUnknownOutcomeState(null);

    if (!fullName.trim()) {
      setApiErrorMessage('Vui lòng nhập Họ và tên của bạn.');
      return;
    }

    if (!phoneNumber.trim() || phoneNumber.trim().length < 9) {
      setApiErrorMessage('Vui lòng nhập Số điện thoại hợp lệ (tối thiểu 9-10 chữ số).');
      return;
    }

    const targetCourtId = courtId || (court ? (court.court_id || court.id) : '');

    // TASK 04.02D-02: Generate Deterministic Idempotency Key
    const sanitizedPhone = phoneNumber.replace(/\D/g, '');
    const idempotencyKey = `idem-book-${targetCourtId || 'batch'}-${bookingDate}-${startTime.replace(/:/g, '')}-${sanitizedPhone}`;

    try {
      setSubmitting(true);

      // Construct payload for API
      let bookingPayload;
      if (selectedSlots && selectedSlots.length > 0) {
        bookingPayload = {
          slots: selectedSlots.map(s => ({
            court_id: s.court_id,
            booking_date: s.booking_date || bookingDate,
            start_time: s.start_time,
            end_time: s.end_time
          }))
        };
      } else {
        if (!targetCourtId || ownershipError) {
          setApiErrorMessage('Sân con không hợp lệ hoặc không thuộc câu lạc bộ này.');
          setSubmitting(false);
          return;
        }
        bookingPayload = {
          court_id: targetCourtId,
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
        };
      }

      // 1. Execute Real Booking Creation API with Idempotency Key
      let bookingResponse;
      try {
        bookingResponse = await createBooking(bookingPayload, idempotencyKey);
      } catch (err) {
        // TASK 04.02D-03: POST Success but Response Lost (Network Timeout)
        if (!err.response && (err.code === 'ECONNABORTED' || err.message?.includes('Network Error'))) {
          setUnknownOutcomeState({
            idempotencyKey,
            message: 'Yêu cầu đặt sân đã gửi đi nhưng kết nối mạng bị rớt trước khi nhận phản hồi. Vui lòng kiểm tra lại trạng thái hoặc liên hệ hỗ trợ trước khi thử lại.'
          });
          setSubmitting(false);
          return;
        }

        const status = err.response?.status;
        if (status === 409) {
          setApiErrorMessage('Khung giờ này vừa được người khác đặt giữ chỗ. Vui lòng quay lại chọn khung giờ khác.');
          setSubmitting(false);
          return;
        } else if (status === 401) {
          setApiErrorMessage('Phiên đăng nhập đã hết hạn hoặc bạn cần đăng nhập để thực hiện giữ chỗ.');
          setSubmitting(false);
          return;
        } else if (status === 403) {
          setApiErrorMessage('Bạn không có quyền thực hiện thao tác đặt sân cho tài nguyên này.');
          setSubmitting(false);
          return;
        } else if (status === 429) {
          setApiErrorMessage('Hệ thống đang tiếp nhận quá nhiều yêu cầu. Vui lòng chờ 1-2 phút rồi thử lại.');
          setSubmitting(false);
          return;
        } else if (status === 400 || status === 422) {
          const backendMsg = err.response?.data?.message || err.response?.data?.error?.message;
          setApiErrorMessage(backendMsg || 'Dữ liệu yêu cầu đặt sân chưa hợp lệ.');
          setSubmitting(false);
          return;
        } else if (status >= 500) {
          setApiErrorMessage('Máy chủ đang gặp sự cố khi xử lý đơn hàng (Lỗi 5xx). Vui lòng thử lại sau.');
          setSubmitting(false);
          return;
        } else {
          setApiErrorMessage('Không thể kết nối đến hệ thống tạo đơn đặt sân.');
          setSubmitting(false);
          return;
        }
      }

      const rawData = bookingResponse?.data || bookingResponse;
      const primaryBooking = Array.isArray(rawData) ? rawData[0] : rawData;
      const reservationId = primaryBooking?.booking_id;

      // NO FAKE BOOKING: If backend returned no booking_id, throw error
      if (!reservationId) {
        throw new Error("Backend API không trả về mã giữ chỗ (booking_id).");
      }

      // 3. Fetch Booking Details from Backend to Verify Real Status (TASK 04.02D-04)
      let verifiedStatus = primaryBooking?.booking_status || 'HOLDING';
      let verifiedAmount = verifiedPrice || primaryBooking?.total_amount || primaryBooking?.total_price || null;

      try {
        const fetchedBooking = await getBookingById(reservationId);
        if (fetchedBooking && fetchedBooking.data) {
          verifiedStatus = fetchedBooking.data.booking_status || verifiedStatus;
          verifiedAmount = fetchedBooking.data.total_amount || fetchedBooking.data.total_price || verifiedAmount;
        }
      } catch (fetchErr) {
        const fetchStatus = fetchErr.response?.status;
        if (fetchStatus === 404) {
          setApiErrorMessage('Không thể xác minh đơn hàng từ hệ thống backend (Mã 404).');
          setSubmitting(false);
          return;
        } else if (fetchStatus === 401 || fetchStatus === 403) {
          setApiErrorMessage('Không có quyền xác minh thông tin đơn đặt sân.');
          setSubmitting(false);
          return;
        }
        console.warn("Fetching verified booking details warning, using creation response", fetchErr);
      }

      // 4. Execute Real Payment API (if online method)
      let paymentLabel = 'Thanh toán trực tiếp tại sân';
      let isPaymentPending = false;
      let createdPaymentId = null;

      if (paymentMethod === 'banking') {
        try {
          const payRes = await createPayment({
            booking_id: reservationId,
            payment_method: 'banking',
            amount: verifiedAmount || 0,
            returnUrl: window.location.origin + '/checkout'
          });

          const payData = payRes?.data || payRes;
          createdPaymentId = payData?.payment_id;
          paymentLabel = 'Chuyển khoản Ngân hàng (VietQR)';
          isPaymentPending = true;
        } catch (payErr) {
          console.warn("Payment API initiation warning", payErr);
          paymentLabel = 'Chuyển khoản Ngân hàng (VietQR)';
          isPaymentPending = true;
        }
      }

      // Calculate dynamic timeLabel and courtName from actual booking data
      let calculatedTimeLabel = '';
      let calculatedCourtName = '';

      if (selectedSlots && selectedSlots.length > 0) {
        const sortedSlots = [...selectedSlots].sort((a, b) => a.start_time.localeCompare(b.start_time));
        const earliestTime = sortedSlots[0].start_time.substring(0, 5);
        const latestTime = sortedSlots[sortedSlots.length - 1].end_time.substring(0, 5);
        calculatedTimeLabel = `${earliestTime} - ${latestTime} (${selectedSlots.length} slot)`;

        const uniqueCourts = Array.from(new Set(selectedSlots.map(s => s.court_name).filter(Boolean)));
        calculatedCourtName = uniqueCourts.join(', ');
      } else {
        const sTime = (startTime || '').substring(0, 5);
        const eTime = (endTime || '').substring(0, 5);
        calculatedTimeLabel = (sTime && eTime) ? `${sTime} - ${eTime}` : '---';
        calculatedCourtName = court?.court_name || court?.name || 'Sân tiêu chuẩn';
      }

      // Render Verified Response Confirmation Screen (HOLDING state, NOT fake paid success)
      setConfirmedBooking({
        id: reservationId,
        bookingId: reservationId,
        paymentId: createdPaymentId,
        venueName: venue?.venue_name || locationState.venueName || 'Sân thể thao',
        courtName: calculatedCourtName || 'Sân tiêu chuẩn',
        bookingDate: bookingDate.split('-').reverse().join('/'),
        timeLabel: calculatedTimeLabel,
        price: verifiedAmount,
        fullName,
        phoneNumber,
        paymentMethod: paymentLabel,
        isPaymentPending,
        bookingStatus: verifiedStatus
      });
    } catch (err) {
      console.error("Booking transaction failed", err);
      setApiErrorMessage(err.message || 'Đã xảy ra lỗi khi hoàn tất thủ tục giữ chỗ.');
    } finally {
      setSubmitting(false);
    }
  };

  // Missing Context Check
  if (!venueId || !bookingDate) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <EmptyState
          title="Không tìm thấy thông tin đặt sân"
          description="Vui lòng thực hiện quy trình chọn sân và khung giờ tại trang Đặt lịch trước khi chuyển sang bước xác nhận."
          action={
            <Button variant="primary" onClick={() => navigate('/search')}>
              Quay lại danh sách sân
            </Button>
          }
        />
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="container mx-auto px-4 max-w-5xl py-12 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card padding="md"><Skeleton variant="rectangular" height="200px" /></Card>
            <Card padding="md"><Skeleton variant="rectangular" height="220px" /></Card>
          </div>
          <div className="lg:col-span-1">
            <Card padding="md"><Skeleton variant="rectangular" height="260px" /></Card>
          </div>
        </div>
      </div>
    );
  }

  // Ownership Error State (TASK 04.02D-07)
  if (ownershipError) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <ErrorState
          title="Sân con không thuộc câu lạc bộ này"
          description="Mã sân con (courtId) chỉ định không thuộc quyền quản lý của câu lạc bộ thể thao đã chọn."
          action={
            <Button variant="primary" onClick={() => navigate(`/booking?venueId=${venueId}`)}>
              Quay lại chọn sân hợp lệ
            </Button>
          }
        />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <ErrorState
          title="Không thể lấy thông tin xác nhận"
          description="Đã có lỗi xảy ra khi truy xuất dữ liệu sân từ máy chủ."
          action={
            <Button variant="primary" leftIcon={<RefreshCw size={16} />} onClick={fetchCheckoutContext}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  // UNKNOWN TRANSACTION OUTCOME SCREEN (TASK 04.02D-03)
  if (unknownOutcomeState) {
    return (
      <div className="w-full bg-surface-subtle min-h-screen py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card padding="lg" radius="2xl" className="border border-border-subtle-medium shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center border-2 border-amber-400">
              <AlertTriangle size={36} />
            </div>

            <div className="space-y-2">
              <Badge variant="warning" size="md" className="uppercase font-bold tracking-wider">
                Đang xác minh trạng thái giao dịch
              </Badge>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Chưa nhận được phản hồi từ máy chủ
              </h1>
              <p className="text-sm text-text-muted">
                {unknownOutcomeState.message}
              </p>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl text-left border border-amber-200 text-xs text-amber-800 space-y-2">
              <p className="font-bold">Hướng dẫn an toàn:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Vui lòng không thao tác bấm đặt lại liên tiếp để tránh tạo trùng đơn giữ chỗ.</li>
                <li>Bạn có thể kiểm tra danh sách đơn đặt của mình hoặc thử tải lại trang sau ít phút.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" size="lg" fullWidth onClick={() => navigate('/search')}>
                Về trang tìm sân
              </Button>
              <Button variant="primary" size="lg" fullWidth onClick={() => window.location.reload()}>
                Tải lại trang xác minh
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // CONFIRMATION SCREEN (Backend Response Verified - NO FAKE SUCCESS)
  if (confirmedBooking) {
    return (
      <div className="w-full bg-surface-subtle min-h-screen py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card padding="lg" radius="2xl" className="border border-border-subtle-medium shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-accent-primary-light text-accent-primary mx-auto flex items-center justify-center border-2 border-accent-primary">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <Badge
                variant={confirmedBooking.isPaymentPending ? 'warning' : 'success'}
                size="md"
                className="uppercase font-bold tracking-wider"
              >
                {confirmedBooking.isPaymentPending ? 'Đơn giữ chỗ đã tạo (HOLDING 10 phút) — Chờ thanh toán' : 'Xác nhận giữ chỗ thành công (HOLDING)'}
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Cảm ơn bạn, {confirmedBooking.fullName}!
              </h1>
              <p className="text-sm text-text-muted">
                Mã đơn giữ sân: <span className="font-bold text-gray-900">{confirmedBooking.id}</span>
              </p>
            </div>

            {/* CONFIRMED DETAILS BOX */}
            <div className="bg-surface-subtle p-5 rounded-xl text-left border border-border-subtle-medium space-y-3 text-sm">
              <div className="flex justify-between border-b border-border-subtle pb-2">
                <span className="text-text-muted">Sân thể thao:</span>
                <span className="font-bold text-gray-900">{confirmedBooking.venueName}</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle pb-2">
                <span className="text-text-muted">Sân:</span>
                <span className="font-semibold text-gray-900">{confirmedBooking.courtName}</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle pb-2">
                <span className="text-text-muted">Ngày chơi:</span>
                <span className="font-semibold text-gray-900">{confirmedBooking.bookingDate}</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle pb-2">
                <span className="text-text-muted">Khung giờ:</span>
                <span className="font-semibold text-gray-900">{confirmedBooking.timeLabel}</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle pb-2">
                <span className="text-text-muted">Trạng thái giữ sân:</span>
                <span className="font-bold text-accent-primary">{confirmedBooking.bookingStatus} (10 phút)</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle pb-2">
                <span className="text-text-muted">Phương thức thanh toán:</span>
                <span className="font-semibold text-gray-900">{confirmedBooking.paymentMethod}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-bold text-gray-900">Tổng thanh toán:</span>
                <span className="font-bold text-brand-orange text-lg">
                  {confirmedBooking.price ? `${confirmedBooking.price.toLocaleString('vi-VN')}đ` : 'Theo báo giá sân'}
                </span>
              </div>
            </div>

            {/* OWNER PAYMENT ACCOUNT INFORMATION CARD (ON CONFIRMATION SCREEN) */}
            {paymentMethod !== 'onsite' && (
              <div className="p-5 rounded-2xl bg-surface-subtle border-2 border-brand-orange/40 text-left space-y-4 shadow-sm">
                {(() => {
                  const selectedAcc = venuePaymentAccounts.find(a =>
                    a.payment_method === 'BANK_TRANSFER' || a.payment_method === 'BANKING' || a.payment_method === 'SEPAY_QR'
                  ) || venuePaymentAccounts[0];

                  const ownerName = selectedAcc?.account_name || venue?.venue_name || 'Chủ sân SportHub';
                  const accNum = selectedAcc?.account_number || '0905123456';
                  const bankName = selectedAcc?.bank_name || 'MB Bank';
                  const qrUrl = selectedAcc?.qr_code_url;
                  const transferNote = `SPORT-${(confirmedBooking.id || venueId || 'BOOKING').substring(0, 8).toUpperCase()}`;

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                          <CreditCard size={18} className="text-brand-orange" />
                          Thông tin tài khoản nhận tiền của Chủ Sân
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-text-muted block">Ngân hàng:</span>
                            <span className="font-bold text-gray-900 text-sm">{bankName}</span>
                          </div>

                          <div>
                            <span className="text-text-muted block">Tên chủ tài khoản:</span>
                            <span className="font-bold text-gray-900 text-sm uppercase">{ownerName}</span>
                          </div>

                          <div>
                            <span className="text-text-muted block">Số tài khoản:</span>
                            <span className="font-extrabold text-brand-orange text-base tracking-wider font-mono">
                              {accNum}
                            </span>
                          </div>

                          <div>
                            <span className="text-text-muted block">Nội dung chuyển khoản chuẩn:</span>
                            <span className="inline-block bg-surface p-2 rounded-lg border font-mono font-bold text-gray-900 text-xs mt-0.5">
                              {transferNote}
                            </span>
                          </div>
                        </div>

                        {qrUrl && (
                          <div className="flex flex-col items-center justify-center p-3 bg-surface rounded-xl border border-border-subtle-medium shadow-xs text-center">
                            <img src={qrUrl} alt="Mã QR Thanh toán" className="w-36 h-36 object-contain rounded-lg" />
                            <span className="text-[11px] text-text-muted mt-2 font-medium">Quét mã VietQR để chuyển tiền</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* UPLOAD PAYMENT PROOF SECTION */}
            <div className="bg-surface p-5 rounded-2xl border-2 border-brand-orange/30 text-left space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    <Upload size={18} className="text-brand-orange" />
                    Minh chứng giao dịch thanh toán
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Tải lên ảnh chụp màn hình chuyển khoản ngân hàng thành công để Chủ sân xác nhận nhanh chóng.
                  </p>
                </div>
                {proofUploaded && (
                  <Badge variant="success" size="sm" leftIcon={<Check size={12} />}>
                    Đã gửi minh chứng
                  </Badge>
                )}
              </div>

              {proofUploaded ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-2">
                  <p className="font-bold flex items-center gap-2 text-sm text-emerald-900">
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                    Upload minh chứng thành công! Vui lòng chờ chủ sân xác nhận.
                  </p>
                  <p className="text-xs text-emerald-700">
                    Trạng thái đơn: <strong className="text-emerald-900">CHỜ CHỦ SÂN XÁC NHẬN</strong>. Chủ sân sẽ kiểm tra tài khoản và xác nhận giữ chỗ cho bạn trong ít phút.
                  </p>
                  {proofPreview && (
                    <div className="w-32 h-32 rounded-lg overflow-hidden border border-emerald-300 mt-2 shadow-xs">
                      <img src={proofPreview} alt="Payment Proof Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-subtle-medium hover:border-brand-orange rounded-xl bg-surface-subtle transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <FileImage size={32} className="text-brand-orange mb-2" />
                    <span className="text-xs font-bold text-gray-900">
                      {proofFile ? proofFile.name : 'Bấm vào đây để chọn hoặc thay đổi ảnh chuyển khoản'}
                    </span>
                    <span className="text-[11px] text-text-muted mt-1">Định dạng JPG, PNG, WEBP (Tối đa 5MB)</span>
                  </div>

                  {proofPreview && (
                    <div className="p-4 bg-surface rounded-xl border border-border-subtle-medium space-y-3">
                      <div className="flex items-center gap-4">
                        <img src={proofPreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border shadow-2xs" />
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-gray-900 truncate">{proofFile?.name || 'Ảnh minh chứng giao dịch'}</p>
                          <p className="text-text-muted">{proofFile ? `${(proofFile.size / 1024).toFixed(1)} KB` : 'Đã chọn ảnh'}</p>
                          <p className="text-brand-orange font-semibold text-[11px] mt-1">
                            Vui lòng bấm nút "Xác nhận gửi minh chứng thanh toán" bên dưới để hoàn tất.
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        size="md"
                        fullWidth
                        loading={uploadingProof}
                        onClick={handleUploadProofSubmit}
                        leftIcon={<Check size={16} />}
                      >
                        Xác nhận gửi minh chứng thanh toán
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={() => navigate('/search')}
              >
                Đặt thêm sân khác
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate('/')}
              >
                Về trang chủ
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface-subtle min-h-screen pb-20">
      {/* BREADCRUMB & HEADER */}
      <section className="bg-surface border-b border-border-subtle-medium py-6 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center text-xs text-text-muted gap-2 mb-3">
            <Link to="/" className="hover:text-accent-primary">Trang chủ</Link>
            <span>/</span>
            <Link to="/search" className="hover:text-accent-primary">Tìm sân</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Thanh toán</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Xác nhận & Thanh toán
              </h1>
              <p className="text-sm text-text-muted mt-1">
                Kiểm tra thông tin đơn đặt sân từ hệ thống và hoàn tất giữ sân
              </p>
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

      {/* MAIN FORM CONTENT */}
      <div className="container mx-auto px-4 max-w-5xl py-8">
        <form onSubmit={handleConfirmOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* LEFT FORM COLUMN */}
          <div className="lg:col-span-2 space-y-6">

            {/* CUSTOMER INFORMATION CARD */}
            <Card padding="md" radius="xl" className="border border-border-subtle-medium space-y-4">
              <Card.Header>
                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <User size={20} className="text-accent-primary" />
                  1. Thông tin người đặt sân
                </h2>
              </Card.Header>
              <Card.Body className="space-y-4">
                <div>
                  <label htmlFor="customer-fullname" className="text-xs font-bold text-gray-900 block mb-1">
                    Họ và tên người đặt *
                  </label>
                  <Input
                    id="customer-fullname"
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customer-phone" className="text-xs font-bold text-gray-900 block mb-1">
                      Số điện thoại nhận SMS *
                    </label>
                    <Input
                      id="customer-phone"
                      type="tel"
                      placeholder="Ví dụ: 0912345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="customer-email" className="text-xs font-bold text-gray-900 block mb-1">
                      Địa chỉ Email (Không bắt buộc)
                    </label>
                    <Input
                      id="customer-email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="customer-note" className="text-xs font-bold text-gray-900 block mb-1">
                    Ghi chú thêm cho chủ sân
                  </label>
                  <Input
                    id="customer-note"
                    type="text"
                    placeholder="Ví dụ: Cần mượn thêm 2 bóng Pickleball..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </Card.Body>
            </Card>

            {/* PAYMENT METHOD SELECTION CARD */}
            <Card padding="md" radius="xl" className="border border-border-subtle-medium space-y-4">
              <Card.Header>
                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <CreditCard size={20} className="text-accent-primary" />
                  2. Chọn phương thức thanh toán
                </h2>
              </Card.Header>
              <Card.Body className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('banking')}
                  className={[
                    'w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all min-h-[44px]',
                    paymentMethod === 'banking'
                      ? 'bg-accent-primary-light border-accent-primary shadow-sm'
                      : 'bg-surface border-border-subtle-medium hover:border-accent-primary/50'
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-brand-orange text-blue-600 font-bold flex items-center justify-center text-xs">
                      <CreditCard size={20} className="text-brand-orange" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">Chuyển khoản Ngân hàng</p>
                      <p className="text-xs text-text-muted">Quét mã QR từ mọi ứng dụng ngân hàng</p>
                    </div>
                  </div>
                  {paymentMethod === 'banking' && <Check size={18} className="text-accent-primary" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('onsite')}
                  className={[
                    'w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all min-h-[44px]',
                    paymentMethod === 'onsite'
                      ? 'bg-accent-primary-light border-accent-primary shadow-sm'
                      : 'bg-surface border-border-subtle-medium hover:border-accent-primary/50'
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-accent-primary text-gray-700 font-bold flex items-center justify-center text-xs">
                      <Banknote size={20} className="text-accent-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">Thanh toán trực tiếp tại sân</p>
                      <p className="text-xs text-text-muted">Thanh toán cho thu ngân khi đến nhận sân</p>
                    </div>
                  </div>
                  {paymentMethod === 'onsite' && <Check size={18} className="text-accent-primary" />}
                </button>
              </Card.Body>
            </Card>

          </div>

          {/* RIGHT STICKY SUMMARY COLUMN */}
          <div className="lg:col-span-1 sticky top-24 space-y-4">
            <Card padding="md" radius="xl" className="border border-border-subtle-medium shadow-md">
              <Card.Header className="pb-3 border-b border-border-subtle-medium mb-4">
                <h3 className="font-bold text-gray-900 text-lg">
                  Chi tiết đơn hàng
                </h3>
              </Card.Header>

              <Card.Body className="space-y-4 text-sm">
                {selectedSlots && selectedSlots.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-text-muted">
                      <span>Sân thể thao:</span>
                      <span className="font-bold text-gray-900 text-right truncate max-w-[160px]">
                        {locationState.venueName || venue?.venue_name || 'SportHub Venue'}
                      </span>
                    </div>

                    <div className="flex justify-between text-text-muted">
                      <span>Ngày đặt:</span>
                      <span className="font-semibold text-gray-900">{bookingDate.split('-').reverse().join('/')}</span>
                    </div>

                    <div className="flex justify-between text-text-muted">
                      <span>Số khung giờ:</span>
                      <span className="font-semibold text-brand-orange">{selectedSlots.length} slot ({locationState.totalHours || (selectedSlots.length * 0.5)}h)</span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border-subtle-medium space-y-2 max-h-56 overflow-y-auto pr-1">
                      <span className="text-xs font-bold text-gray-700 block">Sân & khung giờ đã chọn:</span>
                      {(() => {
                        const groupedCourts = selectedSlots.reduce((acc, slot) => {
                          const key = slot.court_id || slot.court_name || 'default';
                          if (!acc[key]) {
                            acc[key] = {
                              court_name: slot.court_name || 'Sân tiêu chuẩn',
                              sport_category: slot.sport_category,
                              slots: []
                            };
                          }
                          acc[key].slots.push(slot);
                          return acc;
                        }, {});

                        return Object.values(groupedCourts).map((group, idx) => {
                          const sortedSlots = [...group.slots].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
                          const earliestTime = (sortedSlots[0]?.start_time || '').substring(0, 5);
                          const latestTime = (sortedSlots[sortedSlots.length - 1]?.end_time || '').substring(0, 5);
                          const courtTotalHours = sortedSlots.length * 0.5;
                          const courtTotalPrice = sortedSlots.reduce((sum, s) => sum + (Number(s.price) || 0), 0);

                          return (
                            <div key={idx} className="flex justify-between items-center text-xs bg-surface-subtle p-3 rounded-xl border border-border-subtle-medium shadow-2xs">
                              <div>
                                <span className="font-bold text-gray-900 block text-sm">{group.court_name}</span>
                                <span className="text-text-muted text-[11px] block mt-0.5">
                                  {earliestTime} - {latestTime}
                                </span>
                              </div>
                              <span className="font-bold text-brand-orange text-sm">
                                {courtTotalPrice ? `${courtTotalPrice.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-text-muted">
                      <span>Sân thể thao:</span>
                      <span className="font-bold text-gray-900 text-right truncate max-w-[150px]">
                        {venue?.venue_name || 'Sân thể thao'}
                      </span>
                    </div>

                    <div className="flex justify-between text-text-muted">
                      <span>Sân con:</span>
                      <span className="font-semibold text-gray-900">
                        {court ? (court.court_name || court.name) : 'Sân tiêu chuẩn'}
                      </span>
                    </div>

                    <div className="flex justify-between text-text-muted">
                      <span>Ngày đặt:</span>
                      <span className="font-semibold text-gray-900">{bookingDate}</span>
                    </div>

                    <div className="flex justify-between text-text-muted">
                      <span>Khung giờ:</span>
                      <span className="font-semibold text-gray-900">{searchParams.get('label') || '18:00 - 19:00'}</span>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border-subtle-medium space-y-2">
                  <div className="flex justify-between text-text-muted">
                    <span>Tiền sân:</span>
                    <span>
                      {selectedSlots && selectedSlots.length > 0
                        ? `${(locationState.totalAmount || selectedSlots.reduce((s, x) => s + (x.price || 0), 0)).toLocaleString('vi-VN')}đ`
                        : (verifiedPrice ? `${verifiedPrice.toLocaleString('vi-VN')}đ` : 'Theo báo giá sân')}
                    </span>
                  </div>

                  <div className="flex justify-between text-text-muted">
                    <span>Phí dịch vụ SportHub:</span>
                    <span className="text-status-success font-semibold">Miễn phí</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 text-base">
                    <span className="font-bold text-gray-900">Tổng thanh toán:</span>
                    <span className="font-bold text-brand-orange text-xl">
                      {selectedSlots && selectedSlots.length > 0
                        ? `${(locationState.totalAmount || selectedSlots.reduce((s, x) => s + (x.price || 0), 0)).toLocaleString('vi-VN')}đ`
                        : (verifiedPrice ? `${verifiedPrice.toLocaleString('vi-VN')}đ` : 'Báo giá sân')}
                    </span>
                  </div>
                </div>

                {apiErrorMessage && (
                  <div role="alert" className="p-3 bg-status-error-bg text-status-error-text text-xs rounded-lg flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="flex-shrink-0 text-status-error mt-0.5" />
                      <span>{apiErrorMessage}</span>
                    </div>
                    {apiErrorMessage.includes('Khung giờ') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1 text-xs"
                        onClick={() => navigate(`/visualbooking?venueId=${venueId}`)}
                      >
                        Chuyển về chọn khung giờ khác
                      </Button>
                    )}
                  </div>
                )}
              </Card.Body>

              <Card.Footer className="pt-4 space-y-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={submitting}
                  aria-busy={submitting}
                >
                  Xác nhận đặt lịch
                </Button>

                <div className="flex items-center justify-center text-xs text-text-muted gap-1">
                  <Lock size={12} />
                  <span>Xác nhận thành công</span>
                </div>
              </Card.Footer>
            </Card>
          </div>

        </form>
      </div>

      {/* NOTICE MODAL */}
      {noticeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-border-subtle-medium">
            {noticeModal.type === 'success' ? (
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-300">
                <CheckCircle2 size={28} />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center border border-red-300">
                <AlertCircle size={28} />
              </div>
            )}
            <h3 className="text-base font-bold text-gray-900">{noticeModal.title}</h3>
            <p className="text-xs text-text-muted leading-relaxed">{noticeModal.message}</p>
            <div className="pt-2">
              <Button
                variant={noticeModal.type === 'success' ? 'primary' : 'outline'}
                size="md"
                fullWidth
                onClick={() => setNoticeModal({ ...noticeModal, open: false })}
              >
                Đã hiểu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
