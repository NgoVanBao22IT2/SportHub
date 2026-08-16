import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  User,
  MessageSquare,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Send
} from 'lucide-react';
import { getOwnerReviewDetail, replyOwnerReview } from '../../api/owner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';

export default function OwnerReviewDetail() {
  const { reviewId } = useParams();

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [replyInput, setReplyInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchReviewDetail = useCallback(async () => {
    if (!reviewId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getOwnerReviewDetail(reviewId);
      if (res && res.data) {
        setReview(res.data);
        if (res.data.owner_reply) {
          setReplyInput(res.data.owner_reply);
        }
      }
    } catch (err) {
      console.error('Error fetching owner review detail:', err);
      setError(err.response?.data?.error?.message || err.message || 'Không thể tải chi tiết đánh giá.');
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    fetchReviewDetail();
  }, [fetchReviewDetail]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyInput.trim()) {
      showToast('⚠️ Vui lòng nhập nội dung phản hồi.');
      return;
    }

    try {
      setActionLoading(true);
      await replyOwnerReview(reviewId, replyInput.trim());
      showToast('Đã lưu phản hồi đánh giá!');
      fetchReviewDetail();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi lưu phản hồi'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Skeleton width="40px" height="40px" radius="xl" />
          <div className="space-y-2">
            <Skeleton width="220px" height="24px" />
            <Skeleton width="140px" height="14px" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="lg" radius="2xl" className="space-y-4">
            <Skeleton width="140px" height="20px" />
            <Skeleton width="100%" height="80px" radius="xl" />
          </Card>
          <Card padding="lg" radius="2xl" className="space-y-4">
            <Skeleton width="140px" height="20px" />
            <Skeleton width="100%" height="80px" radius="xl" />
          </Card>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <ErrorState
          title="Không tìm thấy đánh giá"
          description={error || 'Đánh giá này không tồn tại hoặc không thuộc quyền quản lý của bạn.'}
          onRetry={fetchReviewDetail}
        />
        <div className="mt-4 text-center">
          <Link to="/owner/reviews">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={16} />}>
              Quay lại danh sách đánh giá
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const custName = review.customer?.full_name || 'Khách đặt sân';
  const custEmail = review.customer?.email || 'N/A';
  const custPhone = review.customer?.phone_number || 'N/A';

  const courtName = review.court?.court_name || 'Sân con';
  const branchName = review.court?.branch?.branch_name || 'Chi nhánh chính';
  const venueName = review.court?.branch?.venue?.venue_name || 'Câu lạc bộ';
  const booking = review.booking || {};

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* TOAST FEEDBACK NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border-subtle-medium shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/owner/reviews">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={16} />} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Chi tiết đánh giá #{review.review_id?.substring(0, 8)}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Đánh giá lúc: {new Date(review.created_at || Date.now()).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex text-amber-500 font-bold text-sm bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            {review.rating} ★
          </div>
        </div>
      </div>

      {/* GRID DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* CARD 1: CUSTOMER INFO */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium space-y-4">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <User size={16} className="text-brand-orange" />
              Thông tin Người đánh giá
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-text-muted block">Họ và tên khách hàng:</span>
              <span className="font-bold text-gray-900 text-sm">{custName}</span>
            </div>

            <div>
              <span className="text-text-muted block">Số điện thoại:</span>
              <span className="font-semibold text-gray-900">{custPhone}</span>
            </div>

            <div>
              <span className="text-text-muted block">Email:</span>
              <span className="font-medium text-gray-700">{custEmail}</span>
            </div>
          </div>
        </Card>

        {/* CARD 2: VENUE & BOOKING INFO */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium space-y-4">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Building2 size={16} className="text-brand-orange" />
              Thông tin Sân & Booking liên quan
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-text-muted block">Câu lạc bộ & Sân:</span>
              <span className="font-bold text-gray-900">{venueName} • {courtName}</span>
            </div>

            {booking.booking_id && (
              <>
                <div>
                  <span className="text-text-muted block">Mã đơn đặt sân:</span>
                  <Link to={`/owner/bookings/${booking.booking_id}`} className="font-mono font-bold text-brand-orange hover:underline">
                    #{booking.booking_id}
                  </Link>
                </div>

                <div>
                  <span className="text-text-muted block">Ngày & Giờ sử dụng sân:</span>
                  <span className="font-semibold text-gray-900">
                    {booking.booking_date} ({booking.start_time?.substring(0, 5)} - {booking.end_time?.substring(0, 5)})
                  </span>
                </div>
              </>
            )}
          </div>
        </Card>

      </div>

      {/* CARD 3: REVIEW CONTENT & RATING */}
      <Card padding="lg" radius="2xl" className="border border-border-subtle-medium space-y-4">
        <div className="border-b border-border-subtle pb-3 flex justify-between items-center">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Star size={16} className="text-amber-500 fill-amber-500" />
            Nội dung nhận xét từ khách hàng
          </h2>

          <div className="flex text-amber-500">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                className={s <= review.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}
              />
            ))}
          </div>
        </div>

        <div className="bg-surface-subtle p-4 rounded-xl border border-border-subtle text-xs text-gray-900 font-medium leading-relaxed">
          "{review.comment || 'Khách hàng không để lại ý kiến bình luận.'}"
        </div>
      </Card>

      {/* CARD 4: OWNER REPLY FORM */}
      <Card padding="lg" radius="2xl" className="border border-border-subtle-medium space-y-4">
        <div className="border-b border-border-subtle pb-3">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <MessageSquare size={16} className="text-brand-orange" />
            Phản hồi của Chủ sân đối với nhận xét này
          </h2>
        </div>

        <form onSubmit={handleReplySubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-gray-900 block">Nội dung phản hồi:</label>
            <textarea
              rows={4}
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              placeholder="Cảm ơn bạn đã phản hồi dịch vụ tại sân..."
              className="w-full p-3 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 focus:border-brand-orange focus:outline-none text-xs"
              required
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            {review.owner_reply_at && (
              <span className="text-[11px] text-text-muted">
                Cập nhật lần cuối: {new Date(review.owner_reply_at).toLocaleString('vi-VN')}
              </span>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={actionLoading}
              leftIcon={<Send size={14} />}
              className="ml-auto"
            >
              {review.owner_reply ? 'Cập nhật phản hồi' : 'Lưu phản hồi'}
            </Button>
          </div>
        </form>
      </Card>

    </div>
  );
}
