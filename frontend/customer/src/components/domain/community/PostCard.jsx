import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Ticket, 
  UserCheck, 
  Swords, 
  GraduationCap,
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Phone, 
  MessageCircle, 
  Sparkles,
  DollarSign,
  Pencil,
  Trash2,
  X,
  Share2,
  Info,
  Eye,
  Plus
} from 'lucide-react';
import { getImageUrl } from '../../../utils/imageUrl';
import communityApi from '../../../api/communityApi';

const POST_TYPE_CONFIG = {
  EVENTS: {
    label: 'Sự kiện & Ưu đãi sân',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: Sparkles,
    actionText: 'Xem chi tiết sự kiện',
    color: 'orange'
  },
  PROMOTION: {
    label: 'Chương trình Ưu đãi',
    badgeBg: 'bg-red-100 text-red-800 border-red-300',
    icon: Sparkles,
    actionText: 'Xem thông tin ưu đãi',
    color: 'red'
  },
  RECRUIT: {
    label: 'Tuyển vãng lai',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: Users,
    actionText: 'Gia nhập ngay',
    color: 'emerald'
  },
  PASS_BOOKING: {
    label: 'Pass sân / Nhượng vé',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: Ticket,
    actionText: 'Nhận suất pass',
    color: 'amber'
  },
  FIND_SLOT: {
    label: 'Tìm slot vãng lai',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: UserCheck,
    actionText: 'Tham gia',
    color: 'blue'
  },
  CHALLENGE: {
    label: 'Cáp kèo giao lưu',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: Swords,
    actionText: 'Nhận kèo đấu',
    color: 'purple'
  },
  COURSE: {
    label: 'Khóa học thể thao',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: GraduationCap,
    actionText: 'Đăng ký tư vấn',
    color: 'indigo'
  }
};

const SKILL_LEVEL_LABEL = {
  ALL: 'Mọi trình độ',
  BEGINNER: 'Mới chơi',
  INTERMEDIATE: 'Trung bình (Yếu/Khá)',
  ADVANCED: 'Khá / Nâng cao'
};

const DEFAULT_SPORT_IMAGES = {
  'Cầu lông': 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
  'Pickleball': 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=800&auto=format&fit=crop&q=80',
  'Bóng đá': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
  'Tennis': 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&auto=format&fit=crop&q=80',
  'Bóng rổ': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
};

const getPostImage = (post) => {
  if (post.image_url) return getImageUrl(post.image_url);
  if (post.venue?.images?.[0]?.image_url) return getImageUrl(post.venue.images[0].image_url);
  return DEFAULT_SPORT_IMAGES[post.sport_type] || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80';
};

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
};

const formatDateToYYYYMMDD = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.includes('T')) {
      return trimmed.split('T')[0];
    }
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          return `${year}-${month}-${day}`;
        }
      }
    }
  }

  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (_) {}

  return String(dateVal);
};

export default function PostCard({ post, onApply, onEdit, onDelete, currentUserId }) {
  const navigate = useNavigate();
  const [showContactModal, setShowContactModal] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const config = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.RECRUIT;
  const TypeIcon = config.icon;

  const isAuthor = currentUserId && post.user_id === currentUserId;
  const isFull = post.status === 'FULL' || post.slots_joined >= post.slots_needed;
  const isClosed = post.status === 'CLOSED' || post.status === 'CANCELLED';

  const formatPrice = (val) => {
    if (!val || parseFloat(val) === 0) return 'Chia đều';
    return `${parseInt(val).toLocaleString('vi-VN')}đ`;
  };

  const cardImage = getPostImage(post);

  // Render Alobo Event Ticket Card ONLY if post is a genuine Ticket Event
  const isTicketJson = post.excerpt && typeof post.excerpt === 'string' && post.excerpt.trim().startsWith('{');
  const isTicketCard = post.is_ticket_event || (post.is_venue_event && isTicketJson && post.content_type !== 'PROMOTION');

  if (isTicketCard) {
    const rawPost = post.raw_post || post;
    let eventMeta = {};
    if (post.excerpt && typeof post.excerpt === 'string' && post.excerpt.trim().startsWith('{')) {
      try {
        eventMeta = JSON.parse(post.excerpt);
      } catch (_) {}
    }

    const playDate = eventMeta.play_date || post.play_date || (rawPost.start_at ? rawPost.start_at.split('T')[0] : '');
    const startTime = eventMeta.start_time || (rawPost.start_at ? rawPost.start_at.split('T')[1]?.substring(0, 5) : '20:00');
    const endTime = eventMeta.end_time || (rawPost.end_at ? rawPost.end_at.split('T')[1]?.substring(0, 5) : '23:00');
    const courtName = eventMeta.court_name || rawPost.court_name || post.location_name || 'Sân 1';
    const skillLevel = eventMeta.skill_level || post.discount_info || '1.5 -> 2.0';
    const ticketPrice = Number(eventMeta.ticket_price !== undefined ? eventMeta.ticket_price : (post.fee_amount || post.price_per_slot || 70000));
    const maxParticipants = Number(eventMeta.max_participants || post.max_participants || 8);
    const joinedCount = Number(post.joined_count !== undefined ? post.joined_count : (eventMeta.joined_count || 1));
    const noteText = eventMeta.note || post.note || 'bao gồm 1 nước 1 trứng 1 chuối';
    const codeStr = eventMeta.code || post.code || (post.post_id || post.id || '').substring(0, 5) || '37dbc';
    const coverImg = cardImage || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500&auto=format&fit=crop&q=60';
    const slug = post.slug || rawPost.slug;

    const formatEventDateDisplay = (dateStr) => {
      if (!dateStr) return '18/09';
      try {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}`;
        }
      } catch (_) {}
      return dateStr;
    };

    const isClosedTicket = post.status === 'CLOSED' || post.status === 'ARCHIVED' || joinedCount >= maxParticipants;
    const badgeText = isClosedTicket ? (joinedCount >= maxParticipants ? 'ĐÃ HẾT VÉ' : 'ĐÃ ĐÓNG VÉ') : 'Còn 45:23:05';
    const detailUrl = slug ? `/posts/${slug}` : `/posts/detail`;

    return (
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group">
        {/* TOP RIGHT DIAGONAL IMAGE BANNER */}
        <div className="absolute top-0 right-0 w-52 h-36 overflow-hidden rounded-tr-2xl pointer-events-none z-0">
          <img
            src={coverImg}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            style={{ clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0% 100%)' }}
          />
        </div>

        {/* TOP RIGHT FLOATING SHARE BUTTON */}
        <button
          type="button"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: post.title || 'Sự kiện xé vé', url: window.location.origin + detailUrl });
            } else {
              navigator.clipboard.writeText(window.location.origin + detailUrl);
              alert('Đã sao chép liên kết sự kiện!');
            }
          }}
          className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-white/95 shadow-md flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all hover:scale-105 border border-gray-100 cursor-pointer"
          title="Chia sẻ sự kiện"
        >
          <Share2 size={14} />
        </button>

        {/* MAIN CARD CONTENT */}
        <div className="p-4 relative z-10 space-y-3">
          {/* TOP BADGES ROW */}
          <div className="flex items-center gap-1.5 flex-wrap max-w-[calc(100%-38px)]">
            {/* Countdown / Closed Badge */}
            {isClosedTicket ? (
              <span className="bg-gray-200 text-gray-700 rounded-full text-[11px] font-bold px-2.5 py-0.5 inline-flex items-center gap-1 shadow-xs">
                <Clock size={12} className="text-gray-500 shrink-0" />
                <span>{badgeText}</span>
              </span>
            ) : (
              <span className="bg-blue-600 text-white rounded-full text-[11px] font-extrabold px-2.5 py-0.5 inline-flex items-center gap-1 shadow-xs">
                <Clock size={12} className="text-white shrink-0" />
                <span>{badgeText}</span>
              </span>
            )}

            {/* Purple Outline Ticket Badge */}
            <span className="bg-purple-50 text-purple-600 border border-purple-300 rounded-full text-[11px] font-bold px-2.5 py-0.5 inline-flex items-center gap-1">
              <Ticket size={12} className="text-purple-600 shrink-0" />
              <span>Xé vé</span>
            </span>

            {/* Gray Hashtag Code */}
            <span className="bg-gray-100 text-gray-600 rounded-md text-[11px] font-mono font-medium px-2 py-0.5">
              #{codeStr}
            </span>
          </div>

          {/* MIDDLE DETAILS ROW: TIME BOX + INFO */}
          <div className="flex items-stretch gap-3 pt-1">
            {/* LEFT: TIME & DATE BOX */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl px-2.5 py-2 flex flex-col items-center justify-center min-w-[72px] shrink-0 text-center">
              <span className="text-blue-700 font-extrabold text-sm leading-none">{startTime}</span>
              <span className="text-blue-300 text-[10px] my-0.5 font-light">|</span>
              <span className="text-blue-700 font-extrabold text-sm leading-none">{endTime}</span>

              <div className="w-full border-t border-blue-200/70 my-1.5" />

              <div className="flex items-center gap-1 text-blue-600 font-bold text-xs">
                <Calendar size={12} className="text-blue-500 shrink-0" />
                <span>{formatEventDateDisplay(playDate)}</span>
              </div>
            </div>

            {/* RIGHT: TITLE, LEVEL, COURT, PRICE */}
            <div className="flex-1 space-y-1.5 pr-16 sm:pr-20">
              {/* Title */}
              <h4 
                onClick={() => navigate(detailUrl)}
                className="font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-1 hover:text-blue-600 transition-colors cursor-pointer"
              >
                {post.title}
              </h4>

              {/* Skill Level & Location */}
              <div className="flex items-center gap-2 flex-wrap">
                {skillLevel && (
                  <span className="bg-blue-500 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                    <span>{skillLevel}</span>
                  </span>
                )}
                {courtName && (
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    <MapPin size={13} className="text-emerald-600 shrink-0" />
                    <span>{courtName}</span>
                  </span>
                )}
              </div>

              {/* Price Row */}
              <div className="pt-0.5 flex items-baseline gap-1">
                <span className="text-amber-600 font-extrabold text-lg leading-none">
                  {ticketPrice.toLocaleString('vi-VN')} <span className="underline">đ</span>
                </span>
                <span className="text-xs text-gray-500 font-normal">/ vé</span>
              </div>
            </div>
          </div>

          {/* AMENITIES / INCLUDED NOTE CALLOUT BOX */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-amber-900 font-medium">
            <Info size={14} className="text-amber-600 shrink-0" />
            <span className="line-clamp-1">{noteText}</span>
          </div>
        </div>

        {/* TICKET STUB DASHED DIVIDER & HALF-CIRCLE NOTCHES */}
        <div className="relative w-full">
          <div className="border-b border-dashed border-gray-200" />
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-50/60 rounded-full border-r border-gray-200 z-10" />
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-50/60 rounded-full border-l border-gray-200 z-10" />
        </div>

        {/* PROGRESS & PARTICIPANTS SECTION */}
        <div className="p-4 pt-3 space-y-3">
          <div className="space-y-1.5">
            {/* Left green badge for joined count */}
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs px-2.5 py-0.5 rounded-full inline-block">
              {joinedCount}/{maxParticipants}
            </span>

            {/* Thin Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, ((joinedCount / maxParticipants) * 100))}%`
                }}
              />
            </div>
          </div>

          {/* DASHED DIVIDER ABOVE FOOTER */}
          <div className="border-b border-dashed border-gray-200 pt-1" />

          {/* BOTTOM ACTION BUTTONS */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => navigate(detailUrl)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors border-none cursor-pointer"
            >
              <Eye size={14} className="text-gray-500" />
              <span className="text-gray-500">Xem chi tiết</span>
            </button>

            {isClosedTicket ? (
              <button
                type="button"
                disabled
                className="bg-gray-100 border border-gray-200 text-gray-400 rounded-xl px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-80"
              >
                <Plus size={14} className="text-gray-400" />
                <span>{joinedCount >= maxParticipants ? 'Hết vé' : 'Đã đóng vé'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(detailUrl)}
                className="bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-500 hover:border-emerald-600 rounded-full px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={14} className="text-emerald-600" />
                <span>Mua vé</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  const validExcerpt = post.excerpt && !post.excerpt.trim().startsWith('{') ? post.excerpt : '';
  const cleanContentText = stripHtml(post.content || validExcerpt);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-all p-5 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Cover Image Banner */}
        <div className="relative w-full h-48 sm:h-72 rounded-2xl overflow-hidden mb-4 bg-slate-100 border border-gray-100">
          <img
            src={cardImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>

          {/* Badge Overlay */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-md ${config.badgeBg}`}>
              <TypeIcon className="w-3.5 h-3.5 mr-1" />
              {config.label}
            </span>
          </div>

          {post.post_type === 'PASS_BOOKING' && post.booking_id && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Vé xác thực
              </span>
            </div>
          )}

          {/* Location Badge on Image */}
          <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-semibold flex items-center drop-shadow-md">
            <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-400 shrink-0" />
            <span className="truncate">{post.venue?.venue_name || post.location_name || 'Đang cập nhật vị trí'}</span>
          </div>
        </div>

        {/* Header: Author Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700 text-sm overflow-hidden shrink-0">
              {post.author?.avatar_url ? (
                <img src={getImageUrl(post.author.avatar_url)} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                post.author?.full_name?.charAt(0) || 'U'
              )}
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-sm flex items-center gap-1.5 leading-tight">
                {post.author?.full_name || 'Thành viên SportHub'}
                {post.is_venue_event && (
                  <span className="text-[10px] font-extrabold bg-brand-orange/15 text-brand-orange border border-brand-orange/30 px-2 py-0.5 rounded-full">
                    🏢 CHỦ SÂN
                  </span>
                )}
              </span>
              <span className="text-[11px] text-gray-400">
                {new Date(post.created_at || Date.now()).toLocaleDateString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Post Title */}
        <h3 className="font-bold text-lg text-gray-900 mb-2 hover:text-emerald-600 transition-colors">
          {post.title}
        </h3>

        {/* PROMO / DISCOUNT BADGE FOR VENUE EVENTS */}
        {post.is_venue_event && (post.promo_code || post.discount_info) && (
          <div className="my-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-semibold flex items-center justify-between shadow-xs">
            <span>🎁 {post.discount_info || 'Ưu đãi đặc biệt từ sân'}</span>
            {post.promo_code && <span className="bg-amber-200 px-2 py-0.5 rounded-lg font-mono font-extrabold text-amber-900">Mã: {post.promo_code}</span>}
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3 text-sm text-gray-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <div className="flex items-center text-gray-700">
            <Calendar className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
            <span className="font-medium">
              {formatDateToYYYYMMDD(post.play_date || post.start_at || post.created_at)}
            </span>
          </div>

          <div className="flex items-center text-gray-700">
            <Clock className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
            <span>
              {post.start_time
                ? `${post.start_time.substring(0, 5)}${post.end_time ? ' - ' + post.end_time.substring(0, 5) : ''}`
                : (post.start_at
                  ? `${new Date(post.start_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}${post.end_at ? ' - ' + new Date(post.end_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}`
                  : (post.discount_info || 'Áp dụng cả ngày'))}
            </span>
          </div>

          <div className="flex items-center text-gray-700 col-span-1 sm:col-span-2">
            <MapPin className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
            <span className="truncate">{post.venue?.venue_name || post.location_name || 'Đang cập nhật vị trí'}</span>
          </div>

          <div className="flex items-center text-gray-700">
            <Sparkles className="w-4 h-4 mr-2 text-amber-500 shrink-0" />
            <span>Môn: <strong>{post.sport_type}</strong></span>
          </div>

          <div className="flex items-center text-gray-700">
            <Users className="w-4 h-4 mr-2 text-blue-500 shrink-0" />
            <span>Trình độ: <strong>{SKILL_LEVEL_LABEL[post.skill_level] || post.skill_level}</strong></span>
          </div>
        </div>

        {/* Content / Note */}
        {cleanContentText && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed italic">
            "{cleanContentText}"
          </p>
        )}

        {/* Slot Progress Bar (for RECRUIT or PASS_BOOKING) */}
        {/* {post.post_type !== 'FIND_SLOT' && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 font-medium mb-1">
              <span>Thành viên tham gia</span>
              <span className="text-emerald-700 font-bold">{post.slots_joined} / {post.slots_needed} slot</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (post.slots_joined / post.slots_needed) * 100)}%` }}
              ></div>
            </div>
          </div>
        )} */}
      </div>

      {/* Footer / Price & Action */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-2">
        <div>
          {post.post_type === 'PASS_BOOKING' ? (
            <div>
              <span className="text-xs text-gray-400 line-through mr-2">
                {post.original_price ? `${parseInt(post.original_price).toLocaleString()}đ` : ''}
              </span>
              <span className="text-lg font-bold text-amber-600">
                {formatPrice(post.pass_price || post.price_per_slot)}
              </span>
            </div>
          ) : (
            <div>
              <span className="text-xs text-gray-500 block">Chi phí:</span>
              <span className="text-base font-bold text-emerald-700">
                {formatPrice(post.price_per_slot)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200/60"
            title="Xem thông tin liên hệ"
          >
            <Phone className="w-4 h-4" />
          </button>

          {post.applications && post.applications.length > 0 && (
            <button
              type="button"
              onClick={() => setShowApplicantsModal(true)}
              className="relative p-2.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200/80 flex items-center gap-1.5"
              title="Danh sách người đăng ký tham gia"
            >
              <UserCheck className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-extrabold text-amber-800">
                {post.applications.length}
              </span>
              {post.applications.some(a => a.status === 'PENDING') && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              )}
              {post.applications.some(a => a.status === 'PENDING') && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
              )}
            </button>
          )}

          {isAuthor ? (
            <div className="flex items-center space-x-1.5">
              {onEdit && (
                <button
                  onClick={() => onEdit(post)}
                  className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 border border-blue-200"
                  title="Chỉnh sửa bài đăng"
                >
                  <Pencil className="w-3.5 h-3.5" /> 
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(post)}
                  className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 border border-rose-200"
                  title="Xóa bài đăng"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 
                </button>
              )}
            </div>
          ) : isClosed || isFull ? (
            <span className="px-4 py-2 bg-gray-100 text-gray-400 text-xs font-semibold rounded-xl">
              {isFull ? 'Đã đủ slot' : 'Đã đóng'}
            </span>
          ) : (
            <button
              onClick={() => onApply(post)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center"
            >
              {config.actionText}
            </button>
          )}
        </div>
      </div>

      {/* Contact Information Card Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-20 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative border border-gray-100 space-y-3.5 text-left max-h-[78vh] sm:max-h-[82vh] overflow-y-auto mb-8">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-base">
              <Phone className="w-5 h-5 text-emerald-600" />
              <span>Thông tin liên hệ</span>
            </div>

            {/* Post Image */}
            <div className="w-full h-36 sm:h-44 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
              <img
                src={cardImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Post Title */}
            {/* <h4 className="font-bold text-base text-gray-900 line-clamp-2 leading-snug">
              {post.title}
            </h4> */}

            {/* Author Name */}
            <div className="flex items-center space-x-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base overflow-hidden shrink-0 border border-emerald-200">
                {post.author?.avatar_url ? (
                  <img src={getImageUrl(post.author.avatar_url)} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  post.author?.full_name?.charAt(0) || 'U'
                )}
              </div>
              <div>
                {/* <span className="text-[11px] text-gray-400 font-medium block">Tác giả bài đăng:</span> */}
                <span className="font-bold text-gray-900 text-sm">
                  {post.author?.full_name || 'Thành viên SportHub'}
                </span>
              </div>
            </div>

            {/* Contact Information (Phone & Zalo) */}
            <div className="space-y-2.5 pt-1">
              {/* Phone Number */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-800 font-medium block">Số điện thoại:</span>
                    <span className="text-sm font-extrabold text-emerald-950 font-mono tracking-wide">
                      {post.contact_phone || 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Zalo Number */}
              <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-xl font-extrabold text-xs shadow-xs">
                    Zalo
                  </div>
                  <div>
                    <span className="text-[11px] text-blue-800 font-medium block">Số Zalo:</span>
                    <span className="text-sm font-extrabold text-blue-950 font-mono tracking-wide">
                      {post.contact_zalo || post.contact_phone || 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applicants List Modal */}
      {showApplicantsModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-20 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative border border-gray-100 space-y-4 text-left max-h-[78vh] sm:max-h-[82vh] overflow-y-auto mb-8">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowApplicantsModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-base">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <span>Danh sách người đăng ký ({post.applications?.length || 0})</span>
            </div>

            {/* <p className="text-xs text-gray-500">
              Dưới đây là danh sách thành viên đã đăng ký tham gia bài viết <strong>"{post.title}"</strong>.
            </p> */}

            {/* Applications List */}
            <div className="space-y-3">
              {post.applications && post.applications.length > 0 ? (
                post.applications.map((app) => (
                  <div key={app.application_id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                          {app.applicant?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-sm block leading-tight">
                            {app.applicant?.full_name || 'Người chơi'}
                          </span>
                          {app.applicant?.phone_number && (
                            <span className="text-[11px] text-gray-500 font-mono">
                              SĐT: {app.applicant.phone_number}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        app.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {app.status === 'ACCEPTED' ? '✓ Đã đồng ý' : app.status === 'REJECTED' ? '✕ Đã từ chối' : ' Chờ duyệt'}
                      </span>
                    </div>

                    {app.message && (
                      <div className="text-xs text-gray-600 bg-white p-2.5 rounded-xl border border-gray-100 italic">
                        "{app.message}"
                      </div>
                    )}

                    {/* Author Actions if PENDING and isAuthor */}
                    {isAuthor && app.status === 'PENDING' && (
                      <div className="flex items-center justify-end space-x-2 pt-1 border-t border-gray-100">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={async () => {
                            setActionLoading(true);
                            try {
                              await communityApi.updateApplicationStatus(app.application_id, 'REJECTED');
                              app.status = 'REJECTED';
                              if (onApply) onApply(null);
                            } catch (err) {
                              console.error('Error rejecting app:', err);
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl transition-colors border border-rose-200 disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={async () => {
                            setActionLoading(true);
                            try {
                              await communityApi.updateApplicationStatus(app.application_id, 'ACCEPTED');
                              app.status = 'ACCEPTED';
                              post.slots_joined = (post.slots_joined || 0) + 1;
                              if (onApply) onApply(null);
                            } catch (err) {
                              console.error('Error accepting app:', err);
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          className="px-4 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                        >
                          Đồng ý
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-gray-500">
                  Chưa có ai đăng ký tham gia bài đăng này.
                </div>
              )}
            </div>

            {/* Close Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowApplicantsModal(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
