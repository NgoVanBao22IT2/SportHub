import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Star, MessageSquare, ShieldCheck, CheckCircle2, CornerDownRight, RefreshCw, Sparkles } from 'lucide-react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import EmptyState from '../../ui/EmptyState';
import ErrorState from '../../ui/ErrorState';
import Skeleton from '../../ui/Skeleton';
import ReviewModal from './ReviewModal';
import { getVenueReviews, getVenueReviewEligibility } from '../../../api/reviews';
import { useAuth } from '../../../context/AuthContext';

export default function VenueReviewsTab({ venueId, venueName, onSummaryChange }) {
  const { isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Keep stable ref to onSummaryChange to break infinite re-render cycles
  const onSummaryChangeRef = useRef(onSummaryChange);
  useEffect(() => {
    onSummaryChangeRef.current = onSummaryChange;
  }, [onSummaryChange]);

  // Filters & Sorting
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  // Review Eligibility State
  const [eligibility, setEligibility] = useState({ canReview: false, reason: null });
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch reviews from API
  const fetchReviews = useCallback(async (page = 1) => {
    if (!venueId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getVenueReviews(venueId, {
        page,
        limit: 10,
        sort: sortOrder,
        rating: selectedRatingFilter || undefined
      });

      setReviews(res.data || []);
      if (res.summary) {
        setSummary(res.summary);
        if (onSummaryChangeRef.current) {
          onSummaryChangeRef.current(res.summary);
        }
      }
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      console.error('Error fetching venue reviews:', err);
      setError('Không thể tải danh sách đánh giá từ máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [venueId, sortOrder, selectedRatingFilter]);

  // Fetch eligibility if logged in
  const checkEligibility = useCallback(async () => {
    if (!isAuthenticated || !venueId) {
      setEligibility({ canReview: false, reason: 'UNAUTHENTICATED' });
      return;
    }
    try {
      setEligibilityLoading(true);
      const res = await getVenueReviewEligibility(venueId);
      setEligibility(res.data || { canReview: false });
    } catch (err) {
      console.error('Error checking review eligibility:', err);
      setEligibility({ canReview: false });
    } finally {
      setEligibilityLoading(false);
    }
  }, [isAuthenticated, venueId]);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  const handleReviewSuccess = () => {
    fetchReviews(1);
    checkEligibility();
  };

  const totalReviewsCount = summary.totalReviews || 0;
  const avgRatingNum = Number(summary.averageRating) || 0;

  return (
    <div className="space-y-6">
      {/* 1. REVIEW SUMMARY & KPI OVERVIEW CARD */}
      <Card radius="2xl" padding="lg" className="border border-border-subtle-medium bg-surface shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: Big Average Score */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-surface-subtle rounded-2xl border border-border-subtle">
            <div className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
              {avgRatingNum > 0 ? avgRatingNum.toFixed(1) : 'Chưa có'}
            </div>
            <div className="flex items-center gap-1 my-2 text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={20}
                  className={s <= Math.round(avgRatingNum) ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}
                />
              ))}
            </div>
            <p className="text-xs text-text-muted">
              Dựa trên <strong>{totalReviewsCount}</strong> lượt đánh giá từ khách hoàn thành lịch chơi
            </p>
          </div>

          {/* Middle Column: Star Breakdown Bars */}
          <div className="md:col-span-5 space-y-1.5 px-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution?.[star] || 0;
              const percent = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-10 font-bold text-gray-700 flex items-center gap-0.5">
                    {star} <Star size={12} className="fill-amber-500 text-amber-500" />
                  </span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-text-muted font-mono">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Right Column: CTA Action */}
          <div className="md:col-span-3 flex flex-col items-center md:items-end justify-center text-center md:text-right p-2 space-y-3">
            {isAuthenticated ? (
              eligibility.canReview ? (
                <div className="space-y-2 w-full">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>Đủ điều kiện đánh giá</span>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full shadow-md"
                    leftIcon={<Star size={16} className="fill-current" />}
                    onClick={() => setIsModalOpen(true)}
                  >
                    Đánh giá sân ngay
                  </Button>
                </div>
              ) : eligibility.reason === 'ALL_BOOKINGS_REVIEWED' ? (
                <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle text-xs text-text-muted">
                  <CheckCircle2 size={20} className="text-emerald-600 mx-auto mb-1" />
                  <span>Bạn đã đánh giá các đơn đặt sân đã hoàn thành tại đây.</span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle text-xs text-text-muted space-y-1">
                  <ShieldCheck size={20} className="text-accent-primary mx-auto mb-1" />
                  <p className="font-semibold text-gray-800">Đánh giá sau khi hoàn thành</p>
                  <p className="text-[11px]">Chỉ người chơi đã đặt sân và hoàn tất giờ chơi mới có thể gửi đánh giá.</p>
                </div>
              )
            ) : (
              <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle text-xs text-text-muted space-y-1">
                <Sparkles size={20} className="text-amber-500 mx-auto mb-1" />
                <p className="font-semibold text-gray-800">Đăng nhập để đánh giá</p>
                <p className="text-[11px]">Dành cho khách hàng có đơn đặt sân đã hoàn tất tại cơ sở này.</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 2. REVIEWS FILTER & SORT TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Rating Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedRatingFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedRatingFilter === ''
                ? 'bg-brand-orange text-white shadow-xs'
                : 'bg-surface border border-border-subtle text-gray-700 hover:bg-gray-50'
            }`}
          >
            Tất cả ({totalReviewsCount})
          </button>
          {[5, 4, 3, 2, 1].map((star) => {
            const starCount = summary.distribution?.[star] || 0;
            const isSelected = selectedRatingFilter === String(star);
            return (
              <button
                key={star}
                onClick={() => setSelectedRatingFilter(isSelected ? '' : String(star))}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-surface border border-border-subtle text-gray-700 hover:bg-gray-50'
                }`}
              >
                {star} <Star size={11} className={isSelected ? 'fill-white text-white' : 'fill-amber-500 text-amber-500'} />
                <span className="text-[11px] opacity-80">({starCount})</span>
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted">Sắp xếp:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-1.5 bg-surface border border-border-subtle rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none cursor-pointer"
          >
            <option value="newest">Mới nhất</option>
            <option value="highest">Đánh giá cao nhất</option>
            <option value="lowest">Đánh giá thấp nhất</option>
          </select>
        </div>
      </div>

      {/* 3. REVIEWS LIST */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} radius="xl" padding="md" className="border border-border-subtle space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" width="40px" height="40px" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton variant="text" width="30%" height="1rem" />
                  <Skeleton variant="text" width="20%" height="0.75rem" />
                </div>
              </div>
              <Skeleton variant="text" width="90%" height="1rem" />
              <Skeleton variant="text" width="60%" height="1rem" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Không thể tải đánh giá"
          description={error}
          action={
            <Button variant="primary" leftIcon={<RefreshCw size={15} />} onClick={() => fetchReviews(1)}>
              Thử lại
            </Button>
          }
        />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={36} className="text-gray-400" />}
          title="Chưa có đánh giá nào"
          description={
            selectedRatingFilter
              ? `Chưa có đánh giá nào mức ${selectedRatingFilter} sao.`
              : 'Hãy là người đầu tiên chia sẻ trải nghiệm thực tế về câu lạc bộ này.'
          }
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const customerName = rev.customer?.full_name || 'Khách hàng';
            const initial = customerName.charAt(0).toUpperCase();
            const courtName = rev.court?.court_name || 'Sân thể thao';
            const dateStr = rev.created_at ? new Date(rev.created_at).toLocaleDateString('vi-VN') : '';

            return (
              <Card
                key={rev.review_id}
                radius="2xl"
                padding="lg"
                className="border border-border-subtle-medium bg-surface space-y-3 hover:border-gray-300 transition shadow-2xs"
              >
                {/* Header: User & Rating */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-orange to-amber-500 text-white font-bold flex items-center justify-center shadow-xs">
                      {initial}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 leading-snug">{customerName}</h4>
                      <p className="text-[11px] text-text-muted flex items-center gap-1.5 mt-0.5">
                        <ShieldCheck size={13} className="text-accent-primary" />
                        <span>{courtName}</span>
                        {dateStr && <span>• {dateStr}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        className={s <= rev.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-200'}
                      />
                    ))}
                  </div>
                </div>

                {/* Comment Text */}
                {rev.comment && (
                  <p className="text-xs sm:text-sm text-gray-800 leading-relaxed pl-1">
                    "{rev.comment}"
                  </p>
                )}

                {/* Owner Reply Bubble */}
                {rev.owner_reply && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                    <div className="flex items-center justify-between text-amber-900 font-bold">
                      <span className="flex items-center gap-1.5">
                        <CornerDownRight size={14} className="text-brand-orange" />
                        Phản hồi từ Chủ sân:
                      </span>
                      {rev.owner_reply_at && (
                        <span className="text-[10px] text-amber-700 font-normal">
                          {new Date(rev.owner_reply_at).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 pl-4 italic leading-relaxed">
                      "{rev.owner_reply}"
                    </p>
                  </div>
                )}
              </Card>
            );
          })}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="pt-4 flex items-center justify-between text-xs text-text-muted border-t border-border-subtle">
              <span>
                Trang {pagination.page} / {pagination.totalPages} ({pagination.totalItems} đánh giá)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => fetchReviews(pagination.page - 1)}
                >
                  Trang trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => fetchReviews(pagination.page + 1)}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REVIEW MODAL */}
      {isModalOpen && (
        <ReviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          bookingId={eligibility.bookingId}
          venueName={venueName}
          courtName={eligibility.courtName}
          bookingDate={eligibility.bookingDate}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
