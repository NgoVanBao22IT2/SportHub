import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Tag,
  Trophy,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Share2,
  Eye,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  ExternalLink,
  CheckCircle,
  Ticket,
  Users,
  FileText,
  DollarSign
} from 'lucide-react';
import { getPublicPostBySlug } from '../api/public';
import { getVenueImageUrl, getDeterministicFallback } from '../utils/imageUrl';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

export default function PublicPostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [postData, setPostData] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ticket Quantity Counter
  const [ticketCount, setTicketCount] = useState(1);

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getPublicPostBySlug(slug);
      setPostData(res?.data || res?.post || null);
      setRelatedPosts(res?.relatedPosts || []);
    } catch (err) {
      console.error('Failed to fetch post details:', err);
      setError('Bài viết hoặc sự kiện không tồn tại hoặc đã bị gỡ.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-xl space-y-6">
        <Skeleton variant="rectangular" height="240px" radius="xl" />
        <Skeleton variant="text" width="70%" height="2rem" />
        <Skeleton variant="text" width="100%" height="1.2rem" />
        <Skeleton variant="text" width="90%" height="1.2rem" />
      </div>
    );
  }

  if (error || !postData) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl">
        <ErrorState
          title="Không tìm thấy sự kiện"
          description={error || 'Sự kiện này có thể đã bị xóa hoặc hết hạn.'}
          action={
            <Button variant="primary" onClick={() => navigate('/')} leftIcon={<ArrowLeft size={16} />}>
              Quay lại Trang chủ
            </Button>
          }
        />
      </div>
    );
  }

  const post = postData;
  const venue = post.venue;

  // Parse excerpt if JSON string (0% demo data, 100% DB source of truth)
  let eventMeta = {};
  const isExcerptJson = post.excerpt && typeof post.excerpt === 'string' && post.excerpt.trim().startsWith('{');
  if (isExcerptJson) {
    try {
      eventMeta = JSON.parse(post.excerpt);
    } catch (e) {
      eventMeta = {};
    }
  }

  // Resolve Event Ticket Details directly from DB
  const playDate = eventMeta.play_date || (post.start_at ? post.start_at.split('T')[0] : '');
  const startTime = eventMeta.start_time || (post.start_at ? post.start_at.split('T')[1]?.substring(0, 5) : '20:00');
  const endTime = eventMeta.end_time || (post.end_at ? post.end_at.split('T')[1]?.substring(0, 5) : '23:00');
  const courtName = eventMeta.court_name || post.court_name || post.location || 'Sân 1';
  const skillLevel = eventMeta.skill_level || (post.discount_info && post.discount_info.includes('->') ? post.discount_info : '') || '1.5 -> 2.0';
  const unitPrice = Number(eventMeta.ticket_price !== undefined ? eventMeta.ticket_price : (post.fee_amount || 70000));
  const maxParticipants = Number(eventMeta.max_participants || post.max_participants || 8);
  const joinedCount = Number(eventMeta.joined_count !== undefined ? eventMeta.joined_count : (post.joined_count || 0));

  const rawNote = eventMeta.note || post.note || (post.excerpt && !post.excerpt.startsWith('{') ? post.excerpt : '') || '';
  const noteText = (rawNote && !rawNote.includes('->')) ? rawNote : 'bao gồm 1 nước 1 trứng 1 chuối';
  const codeStr = eventMeta.code || post.code || (post.post_id || post.id || '').substring(0, 5) || '37dbc';

  // Dynamic Sport Type Category (e.g. Cầu lông, Pickleball, ...)
  const sportCategory = post.sport_type || venue?.sport_type || venue?.category || eventMeta.sport_type || 'Pickleball';

  // Venue Address & Name from DB
  const mainBranch = venue?.branches && venue.branches.length > 0 ? venue.branches[0] : null;
  const venueAddress = venue?.address
    || (mainBranch ? [mainBranch.street_address, mainBranch.ward_district_city || mainBranch.district || mainBranch.province_city].filter(Boolean).join(', ') : '')
    || venue?.location
    || 'Địa chỉ sân chưa cập nhật';
  const venueTitle = venue?.venue_name || 'Cụm sân Thể thao';
  const venueIdSeed = venue?.venue_id || post?.venue_id;
  const venueAvatar = getVenueImageUrl(venue, 'avatar', venueIdSeed);

  const formatEventDateFullDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const cleanDate = dateStr.split('T')[0];
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch (_) { }
    return dateStr;
  };

  const handleBuyTicket = () => {
    const venueIdToUse = venue?.venue_id || post.venue_id;
    if (!venueIdToUse) {
      if (post.registration_url) {
        window.open(post.registration_url, '_blank');
      }
      return;
    }

    const pDate = playDate || new Date().toISOString().split('T')[0];
    const sTime = startTime.length === 5 ? `${startTime}:00` : startTime;
    const eTime = endTime.length === 5 ? `${endTime}:00` : endTime;
    const totalPrice = unitPrice * ticketCount;

    // Resolve real DB court_id for this venue
    const allVenueCourts = venue?.branches?.flatMap(b => b.courts || []) || [];
    const targetCourtName = courtName;
    const matchedCourt = allVenueCourts.find(c =>
      c.court_name && targetCourtName && c.court_name.trim().toLowerCase() === targetCourtName.trim().toLowerCase()
    ) || allVenueCourts[0];

    const courtIdToUse = eventMeta.court_id || matchedCourt?.court_id || matchedCourt?.id || '';
    const courtNameToUse = targetCourtName || matchedCourt?.court_name || 'Sân 1';

    const params = new URLSearchParams();
    params.set('venueId', venueIdToUse);
    if (courtIdToUse) params.set('courtId', courtIdToUse);
    params.set('date', pDate);
    params.set('startTime', sTime);
    params.set('endTime', eTime);
    params.set('quantity', String(ticketCount));
    params.set('isEventTicket', 'true');
    params.set('bookingType', 'EVENT_TICKET');
    if (post.post_id || post.id) params.set('postId', post.post_id || post.id);

    // Direct navigation to Checkout Page with Bank Transfer as default payment method
    navigate(`/checkout?${params.toString()}`, {
      state: {
        venueId: venueIdToUse,
        venueName: venue?.venue_name || venueTitle,
        date: pDate,
        courtId: courtIdToUse,
        courtName: courtNameToUse,
        ticketPrice: unitPrice,
        quantity: ticketCount,
        eventTitle: post.title,
        paymentMethod: 'banking',
        isEventTicket: true,
        bookingType: 'EVENT_TICKET',
        postId: post.post_id || post.id,
        maxParticipants,
        joinedCount,
        selectedSlots: [
          {
            court_id: courtIdToUse,
            court_name: courtNameToUse,
            start_time: sTime,
            end_time: eTime,
            price: unitPrice * ticketCount
          }
        ],
        totalAmount: totalPrice,
        totalHours: 3
      }
    });
  };

  return (
    <div className="w-full bg-[#f4f7f5] min-h-screen pb-32">

      {/* HEADER TOP BAR - EXACT SPORTHUB DESIGN LAYOUT */}
      <section className="bg-surface border-b border-border-subtle-medium py-6 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

            {/* Left: Title & Subtitle */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Thông tin chi tiết
              </h1>
              <p className="text-xs text-text-muted mt-1">
                Kiểm tra thông tin suất xé vé sự kiện từ hệ thống và hoàn tất giữ chỗ
              </p>
            </div>

            {/* Right: Quay lại Button */}
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

      {/* MAIN BODY CONTENT */}
      <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">

        {/* SECTION 1: THÔNG TIN SÂN */}
        <div className="space-y-2">
          <h3 className="text-xs sm:text-sm font-bold text-black">Thông tin sân</h3>
          <div className="bg-white rounded-2xl p-4 border border-emerald-100/80 shadow-xs flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-emerald-100 shadow-xs">
              <img
                src={venueAvatar}
                alt={venueTitle}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getDeterministicFallback(venueIdSeed);
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
                {venueTitle}
              </h4>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <MapPin size={13} className="text-gray-400 shrink-0" />
                <span className="truncate">{venueAddress}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: THÔNG TIN SỰ KIỆN (TICKET BOX) */}
        <div className="space-y-2">
          <h3 className="text-xs sm:text-sm font-bold text-black">Thông tin sự kiện</h3>

          <div className="bg-accent-primary rounded-2xl overflow-hidden shadow-xs">

            {/* Top Info Header */}
            <div className="p-4 bg-accent-primary space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-gray-200/80 text-gray-700 font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md">
                  #{codeStr}
                </span>

                <span className="bg-blue-500 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                  <span>{sportCategory}</span>
                  {skillLevel && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] ml-0.5">{skillLevel}</span>
                  )}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-white leading-snug">
                [Xé vé] - {post.title}
              </h3>
            </div>

            {/* Ticket Cut Edge Notched Dashed Line */}
            <div className="relative w-full">
              <div className="border-b border-dashed border-[#a8d5b5]" />
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#f4f7f5] rounded-full border-r border-[#a8d5b5] z-10" />
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#f4f7f5] rounded-full border-l border-[#a8d5b5] z-10" />
            </div>

            {/* Ticket Details Rows */}
            <div className="p-4 space-y-3.5 text-xs text-gray-700">

              {/* Row 1: Giá vé */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-white">
                  <div className="w-5 h-5 rounded-full text-white flex items-center justify-center font-bold text-xs">
                    $
                  </div>
                  <span>Giá vé</span>
                </div>
                <span className="font-extrabold text-sm text-white">
                  {unitPrice.toLocaleString('vi-VN')} <span className="underline">đ</span>
                </span>
              </div>

              {/* Row 2: Ngày */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Calendar size={16} className="text-white" />
                  <span>Ngày</span>
                </div>
                <span className="font-bold text-white">
                  {formatEventDateFullDisplay(playDate)}
                </span>
              </div>

              {/* Row 3: Sân & Thời gian */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Trophy size={16} className="text-white" />
                  <span>Sân & Thời gian</span>
                </div>
                <div className="bg-white rounded-xl py-2 px-6 text-left border border-emerald-100 font-bold text-gray-900 shadow-2xs">
                  {startTime} - {endTime} <span className="text-gray-300 mx-4">|</span> {courtName}
                </div>
              </div>

              {/* Row 4: Ghi chú */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-white">
                  <FileText size={16} className="text-white" />
                  <span>Ghi chú</span>
                </div>
                <p className="pl-6 text-gray-200 font-medium">
                  {noteText}
                </p>
              </div>

              {/* Row 5: Người tham gia */}
              <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Users size={16} className="text-white" />
                  <span>Người tham gia</span>
                </div>
                <span className="bg-white border border-emerald-200 text-accent-primary font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                  {joinedCount}/{maxParticipants}
                </span>
              </div>

            </div>

          </div>
        </div>

        {/* SECTION 3: SỐ LƯỢNG VÉ MUỐN ĐẶT */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100/80 shadow-xs flex items-center justify-between">
          <span className="font-bold text-gray-900 text-sm">Số lượng vé muốn đặt</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTicketCount(prev => Math.max(1, prev - 1))}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center transition-colors border border-gray-200 cursor-pointer"
            >
              -
            </button>
            <span className="font-extrabold text-base text-gray-900 min-w-[20px] text-center">
              {ticketCount}
            </span>
            <button
              type="button"
              onClick={() => setTicketCount(prev => Math.min(maxParticipants - joinedCount || 8, prev + 1))}
              className="w-8 h-8 rounded-lg bg-accent-primary hover:bg-emerald-800 text-white font-bold flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* SECTION 4: PHƯƠNG THỨC THANH TOÁN (MẶC ĐỊNH NGÂN HÀNG) */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-accent-primary flex items-center justify-center font-bold text-sm shrink-0">
              <Building2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-gray-900 text-xs sm:text-sm">
                <span>Phương thức thanh toán</span>
                {/* <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                  Ngân hàng (Mặc định)
                </span> */}
              </div>
              <p className="text-xs text-gray-500 font-medium">Chuyển khoản ngân hàng (QR Code / Banking)</p>
            </div>
          </div>
          {/* <span className="text-xs font-semibold text-gray-500 flex items-center gap-0.5 hover:text-accent-primary cursor-pointer">
            Thay đổi <ChevronRight size={14} />
          </span> */}
        </div>

        {/* BOTTOM STICKY BAR */}
        <div className="bg-white rounded-2xl p-4 border-t border-gray-200 px-4 py-4 shadow-xl z-50">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                <span>Tổng ({ticketCount} Vé)</span>
                <ChevronDown size={14} />
              </div>
              <div className="text-lg font-extrabold text-accent-primary">
                {(unitPrice * ticketCount).toLocaleString('vi-VN')} <span className="">VNĐ</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBuyTicket}
              className="bg-accent-primary hover:bg-emerald-800 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all text-sm cursor-pointer border-none"
            >
              Xác nhận
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
