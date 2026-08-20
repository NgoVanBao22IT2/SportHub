import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  MessageSquare,
  Search,
  RefreshCw,
  ChevronRight,
  Filter,
  CheckCircle2,
  User,
  Building2,
  Calendar,
  ThumbsUp
} from 'lucide-react';
import { getOwnerReviews, getOwnerVenues, replyOwnerReview } from '../../api/owner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import ReviewReplyModal from '../../components/domain/ReviewReplyModal';

export default function OwnerReviews() {
  const [reviews, setReviews] = useState([]);
  const [kpis, setKpis] = useState({
    totalReviews: 0,
    averageRating: 0,
    starCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    starDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [selectedVenueId, setSelectedVenueId] = useState('ALL');
  const [selectedRating, setSelectedRating] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('NEWEST');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Reply Modal state
  const [replyModalReview, setReplyModalReview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch Venues list
  useEffect(() => {
    async function loadVenues() {
      try {
        const res = await getOwnerVenues();
        const vList = res?.data || res || [];
        setVenues(vList);
      } catch (err) {
        console.error('Error fetching venues for review filter:', err);
      }
    }
    loadVenues();
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOwnerReviews({
        page: meta.page,
        limit: meta.limit,
        venueId: selectedVenueId === 'ALL' ? undefined : selectedVenueId,
        rating: selectedRating === 'ALL' ? undefined : selectedRating,
        sort: sortOrder,
        search: activeSearch
      });

      if (res && res.data) {
        setReviews(res.data);
        if (res.kpis) setKpis(res.kpis);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err) {
      console.error('Error fetching owner reviews:', err);
      setError(err.response?.data?.error?.message || err.message || 'Không thể tải danh sách đánh giá.');
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, selectedVenueId, selectedRating, sortOrder, activeSearch]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setMeta((m) => ({ ...m, page: 1 }));
    setActiveSearch(searchQuery);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Submit Reply Handler
  const handleReplySubmit = async (reviewId, replyContent) => {
    try {
      setActionLoading(true);
      await replyOwnerReview(reviewId, replyContent);
      showToast('Đã gửi phản hồi thành công!');
      setReplyModalReview(null);
      fetchReviews();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi phản hồi đánh giá'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* TOAST FEEDBACK NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border-subtle-medium shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="text-amber-500 fill-amber-500" size={24} />
            Quản lý Đánh giá & Nhận xét khách hàng
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Lắng nghe ý kiến của người chơi, phản hồi ý kiến phản ánh để nâng cao chất lượng sân.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw size={14} />}
          onClick={fetchReviews}
        >
          Làm mới
        </Button>
      </div>

      {/* KPI METRICS & STAR DISTRIBUTION CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* AVERAGE RATING KPI CARD */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium bg-surface flex flex-col justify-center items-center text-center space-y-2">
          <span className="text-text-muted text-xs font-bold uppercase tracking-wider">Đánh giá trung bình</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-gray-900">{kpis.averageRating}</span>
            <span className="text-amber-500 font-extrabold text-2xl">/ 5 ★</span>
          </div>

          <div className="flex gap-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={18}
                className={s <= Math.round(kpis.averageRating) ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}
              />
            ))}
          </div>
          <p className="text-xs text-text-muted">Dựa trên {kpis.totalReviews} lượt đánh giá thực tế từ khách đặt sân</p>
        </Card>

        {/* STAR DISTRIBUTION BREAKDOWN CARD */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium bg-surface lg:col-span-2 space-y-2">
          <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2">Phân bổ số sao đánh giá</h3>

          <div className="space-y-1.5 text-xs">
            {[5, 4, 3, 2, 1].map((s) => {
              const count = kpis.starCounts[s] || 0;
              const pct = kpis.starDistribution[s] || 0;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="font-bold text-gray-700 w-8 flex items-center gap-1">
                    {s} <Star size={12} className="fill-amber-500 text-amber-500 inline" />
                  </span>

                  <div className="flex-1 h-2.5 bg-surface-subtle rounded-full overflow-hidden border border-border-subtle">
                    <div style={{ width: `${pct}%` }} className="h-full bg-amber-400 rounded-full" />
                  </div>

                  <span className="text-text-muted text-[11px] w-20 text-right">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <Input
            placeholder="Tìm theo Tên khách, SĐT, Tên sân, Nội dung đánh giá..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
            size="sm"
            inputClassName="h-[38px] rounded-xl text-xs border-border-subtle-medium"

          />
          <Button 
          type="submit" 
          variant="primary" 
          size="sm"
          className="h-[38px] px-4 whitespace-nowrap text-xs font-bold rounded-xl shrink-0 flex items-center justify-center"

          >Tìm kiếm</Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <select
            value={selectedVenueId}
            onChange={(e) => setSelectedVenueId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:border-brand-orange focus:outline-none"
          >
            <option value="ALL">Tất cả câu lạc bộ</option>
            {venues.map((v) => (
              <option key={v.venue_id} value={v.venue_id}>{v.venue_name}</option>
            ))}
          </select>

          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:border-brand-orange focus:outline-none"
          >
            <option value="ALL">Tất cả số sao</option>
            <option value="5">5 Sao ★★★★★</option>
            <option value="4">4 Sao ★★★★☆</option>
            <option value="3">3 Sao ★★★☆☆</option>
            <option value="2">2 Sao ★★☆☆☆</option>
            <option value="1">1 Sao ★☆☆☆☆</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:border-brand-orange focus:outline-none"
          >
            <option value="NEWEST">Mới nhất</option>
            <option value="OLDEST">Cũ nhất</option>
            <option value="RATING_HIGH_LOW">Rating: Cao đến Thấp</option>
            <option value="RATING_LOW_HIGH">Rating: Thấp đến Cao</option>
          </select>
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} padding="lg" radius="2xl" className="space-y-3">
                <Skeleton width="180px" height="20px" />
                <Skeleton width="100%" height="40px" radius="xl" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card padding="lg" radius="2xl">
            <ErrorState title="Lỗi tải đánh giá" description={error} onRetry={fetchReviews} />
          </Card>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((r) => {
              const custName = r.customer?.full_name || 'Khách đặt sân';
              const custPhone = r.customer?.phone_number || '';
              const courtName = r.court?.court_name || 'Sân con';
              const venueName = r.court?.branch?.venue?.venue_name || 'Câu lạc bộ';

              return (
                <Card key={r.review_id} padding="lg" radius="2xl" className="border border-border-subtle-medium bg-surface space-y-3">
                  
                  {/* Review Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-orange/10 text-brand-orange font-extrabold flex items-center justify-center text-sm border border-brand-orange/20">
                        {custName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{custName}</p>
                        <p className="text-[11px] text-text-muted">{custPhone} • {venueName} ({courtName})</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={s <= r.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-text-muted">
                        {new Date(r.created_at || Date.now()).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  {/* Review Comment Content */}
                  <div className="text-xs text-gray-800 space-y-1">
                    <p className="leading-relaxed text-gray-900 font-medium">
                      "{r.comment || 'Khách hàng đánh giá không kèm bình luận.'}"
                    </p>
                  </div>

                  {/* Owner Response Box */}
                  {r.owner_reply ? (
                    <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-amber-900 font-bold">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare size={13} className="text-brand-orange" />
                          Phản hồi của Chủ sân:
                        </span>
                        <span className="text-[10px] text-amber-700 font-normal">
                          {r.owner_reply_at ? new Date(r.owner_reply_at).toLocaleDateString('vi-VN') : ''}
                        </span>
                      </div>
                      <p className="text-amber-950 font-medium">{r.owner_reply}</p>
                    </div>
                  ) : null}

                  {/* Review Actions Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
                    <span className="text-text-muted text-[11px]">
                      Mã đánh giá: <span className="font-mono">#{r.review_id?.substring(0, 8)}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {!r.owner_reply && (
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<MessageSquare size={14} />}
                          onClick={() => setReplyModalReview(r)}
                        >
                          Trả lời đánh giá
                        </Button>
                      )}

                      <Link to={`/owner/reviews/${r.review_id}`}>
                        <Button variant="ghost" size="xs" rightIcon={<ChevronRight size={14} />}>
                          Xem chi tiết
                        </Button>
                      </Link>
                    </div>
                  </div>

                </Card>
              );
            })}

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border-subtle-medium text-xs">
                <span className="text-text-muted">Trang {meta.page} / {meta.totalPages}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page <= 1}
                    onClick={() => setMeta((m) => ({ ...m, page: Math.max(1, m.page - 1) }))}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setMeta((m) => ({ ...m, page: Math.min(meta.totalPages, m.page + 1) }))}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card padding="lg" radius="2xl" className="text-center py-12 text-text-muted space-y-2">
            <Star size={36} className="mx-auto text-gray-300" />
            <p className="font-bold text-gray-900 text-sm">Chưa có đánh giá nào</p>
            <p className="text-xs">Đánh giá và nhận xét từ khách hàng sẽ xuất hiện tại đây.</p>
          </Card>
        )}
      </div>

      {/* REPLY MODAL */}
      <ReviewReplyModal
        isOpen={Boolean(replyModalReview)}
        onClose={() => setReplyModalReview(null)}
        review={replyModalReview}
        onSubmitReply={handleReplySubmit}
        loading={actionLoading}
      />

    </div>
  );
}
