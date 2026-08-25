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
  DollarSign
} from 'lucide-react';
import { getImageUrl } from '../../../utils/imageUrl';

const POST_TYPE_CONFIG = {
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
    actionText: 'Mời vào nhóm',
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

export default function PostCard({ post, onApply, currentUserId }) {
  const config = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.RECRUIT;
  const TypeIcon = config.icon;

  const isAuthor = currentUserId && post.user_id === currentUserId;
  const isFull = post.status === 'FULL' || post.slots_joined >= post.slots_needed;
  const isClosed = post.status === 'CLOSED' || post.status === 'CANCELLED';

  const formatPrice = (val) => {
    if (!val || parseFloat(val) === 0) return 'Miễn phí / Chia đều';
    return `${parseInt(val).toLocaleString('vi-VN')}đ`;
  };

  const cardImage = getPostImage(post);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-all p-5 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Cover Image Banner */}
        <div className="relative w-full h-48 sm:h-52 rounded-2xl overflow-hidden mb-4 bg-slate-100 border border-gray-100">
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
              <span className="font-semibold text-gray-900 text-sm block leading-tight">{post.author?.full_name || 'Thành viên SportHub'}</span>
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

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3 text-sm text-gray-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <div className="flex items-center text-gray-700">
            <Calendar className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
            <span className="font-medium">{post.play_date}</span>
          </div>

          {(post.start_time || post.end_time) && (
            <div className="flex items-center text-gray-700">
              <Clock className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
              <span>{post.start_time?.substring(0, 5)} - {post.end_time?.substring(0, 5)}</span>
            </div>
          )}

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
        {post.content && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed italic">
            "{post.content}"
          </p>
        )}

        {/* Slot Progress Bar (for RECRUIT or PASS_BOOKING) */}
        {post.post_type !== 'FIND_SLOT' && (
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
        )}
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
          {post.contact_phone && (
            <a
              href={`tel:${post.contact_phone}`}
              className="p-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              title="Gọi điện"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}

          {isAuthor ? (
            <span className="px-4 py-2 bg-gray-100 text-gray-500 text-xs font-semibold rounded-xl">
              Bài của bạn
            </span>
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
    </div>
  );
}
