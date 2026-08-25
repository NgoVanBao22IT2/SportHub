import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Search, 
  Filter, 
  Trash2, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Users,
  Ticket,
  UserCheck,
  Swords,
  GraduationCap,
  Sparkles,
  RefreshCw,
  ExternalLink,
  MapPin,
  Calendar,
  Clock
} from 'lucide-react';
import { 
  getAdminCommunityPosts, 
  updateAdminCommunityPostStatus, 
  deleteAdminCommunityPost 
} from '../../api/admin';

const POST_TYPE_CONFIG = {
  RECRUIT: { label: 'Tuyển vãng lai', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Users },
  PASS_BOOKING: { label: 'Pass sân', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: Ticket },
  FIND_SLOT: { label: 'Tìm slot', bg: 'bg-blue-100 text-blue-800 border-blue-200', icon: UserCheck },
  CHALLENGE: { label: 'Cáp kèo', bg: 'bg-purple-100 text-purple-800 border-purple-200', icon: Swords },
  COURSE: { label: 'Khóa học', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: GraduationCap },
};

const DEFAULT_SPORT_IMAGES = {
  'Cầu lông': 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&auto=format&fit=crop&q=80',
  'Pickleball': 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=400&auto=format&fit=crop&q=80',
  'Bóng đá': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&auto=format&fit=crop&q=80',
  'Tennis': 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400&auto=format&fit=crop&q=80',
  'Bóng rổ': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&auto=format&fit=crop&q=80',
};

export default function AdminCommunity() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminCommunityPosts({
        page,
        limit: 20,
        post_type: selectedType,
        status: selectedStatus,
        search: searchQuery
      });
      setPosts(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      console.error('Failed to load community posts:', err);
      setError('Khai thác danh sách bài đăng thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, selectedType, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const handleStatusToggle = async (postId, currentStatus) => {
    const nextStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      await updateAdminCommunityPostStatus(postId, nextStatus);
      showToast(`Đã chuyển trạng thái bài đăng thành ${nextStatus === 'OPEN' ? 'Đang mở (OPEN)' : 'Đã đóng (CLOSED)'}`);
      fetchPosts();
    } catch (err) {
      alert('Không thể đổi trạng thái bài viết: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này khỏi hệ thống không? Hành động này không thể hoàn tác.')) {
      return;
    }
    try {
      await deleteAdminCommunityPost(postId);
      showToast('Đã xóa bài viết khỏi hệ thống thành công');
      fetchPosts();
    } catch (err) {
      alert('Xóa bài viết thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const formatPrice = (post) => {
    if (post.post_type === 'PASS_BOOKING') {
      return post.pass_price ? `${parseInt(post.pass_price).toLocaleString()}đ` : 'Miễn phí';
    }
    return post.price_per_slot && parseFloat(post.price_per_slot) > 0 
      ? `${parseInt(post.price_per_slot).toLocaleString()}đ` 
      : 'Miễn phí / Chia đều';
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold mb-1">
            <Compass className="w-4 h-4" />
            <span>ADMIN COMMUNITY CONTROL PANEL</span>
          </div>
          <h1 className="text-2xl font-bold">Quản lý Bài đăng Khám phá</h1>
          <p className="text-emerald-200 text-sm mt-1">
            Quản lý, duyệt nội dung và kiểm duyệt bài viết cộng đồng (Tuyển vãng lai, Pass sân, Khóa học thể thao)
          </p>
        </div>
        
        <button
          onClick={fetchPosts}
          className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl border border-emerald-500/30 font-semibold text-sm transition-all flex items-center space-x-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Post Type Selector */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
          <button
            onClick={() => { setSelectedType('ALL'); setPage(1); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedType === 'ALL'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất cả loại bài
          </button>
          {Object.entries(POST_TYPE_CONFIG).map(([type, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button
                key={type}
                onClick={() => { setSelectedType(type); setPage(1); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  selectedType === type
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Filter & Search */}
        <div className="flex items-center space-x-3 w-full lg:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="OPEN">Đang mở (OPEN)</option>
            <option value="FULL">Đã đủ (FULL)</option>
            <option value="CLOSED">Đã đóng (CLOSED)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="relative flex-1 lg:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài viết..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </form>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-sm">Đang tải danh sách bài đăng từ máy chủ...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Compass className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-gray-700">Không tìm thấy bài đăng nào</p>
            <p className="text-xs text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Bài đăng / Banner</th>
                  <th className="py-4 px-6">Loại & Môn</th>
                  <th className="py-4 px-6">Tác giả (User)</th>
                  <th className="py-4 px-6">Thời gian & Địa điểm</th>
                  <th className="py-4 px-6">Chi phí / Giá</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Thao tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post) => {
                  const cfg = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.RECRUIT;
                  const TypeIcon = cfg.icon;
                  const coverImg = post.image_url || DEFAULT_SPORT_IMAGES[post.sport_type] || DEFAULT_SPORT_IMAGES['Cầu lông'];

                  return (
                    <tr key={post.post_id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Title & Cover */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3 min-w-[240px]">
                          <img
                            src={coverImg}
                            alt={post.title}
                            className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0 shadow-xs"
                          />
                          <div>
                            <p className="font-bold text-gray-900 line-clamp-1 hover:text-emerald-600 transition-colors">
                              {post.title}
                            </p>
                            <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                              {post.content || 'Không có mô tả chi tiết'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Post Type & Sport */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.bg}`}>
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {cfg.label}
                          </span>
                          <p className="text-xs text-gray-500 font-medium">Môn: <strong>{post.sport_type}</strong></p>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-gray-900">{post.author?.full_name || 'Khách vãng lai'}</p>
                          <p className="text-xs text-gray-400">{post.author?.phone_number || post.contact_phone || 'N/A'}</p>
                        </div>
                      </td>

                      {/* Play Date & Location */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                            <span>{post.play_date} ({post.start_time?.substring(0, 5) || 'N/A'})</span>
                          </div>
                          <div className="flex items-center max-w-[200px]">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                            <span className="truncate">{post.venue?.venue_name || post.location_name || 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-bold text-emerald-700">
                          {formatPrice(post)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {post.status === 'OPEN' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Đang mở (OPEN)
                          </span>
                        ) : post.status === 'FULL' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Đã đủ slot (FULL)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                            <XCircle className="w-3 h-3 mr-1 text-gray-400" />
                            {post.status}
                          </span>
                        )}
                      </td>

                      {/* Admin Actions */}
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Status Toggle Button */}
                          <button
                            onClick={() => handleStatusToggle(post.post_id, post.status)}
                            className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                              post.status === 'OPEN'
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            title={post.status === 'OPEN' ? 'Đóng bài viết' : 'Mở lại bài viết'}
                          >
                            {post.status === 'OPEN' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeletePost(post.post_id)}
                            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                            title="Xóa bài viết vĩnh viễn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
