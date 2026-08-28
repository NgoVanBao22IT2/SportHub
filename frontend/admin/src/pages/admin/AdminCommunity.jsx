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
  Clock,
  UploadCloud,
  Image,
  Upload
} from 'lucide-react';
import { 
  getAdminCommunityPosts, 
  updateAdminCommunityPostStatus, 
  deleteAdminCommunityPost,
  getAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner
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

  // Banner State
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerPageKey, setBannerPageKey] = useState('EXPLORE_PAGE'); // EXPLORE_PAGE | HOME_PAGE
  const [activeBanner, setActiveBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    button_text: 'Đăng bài mới ngay',
    is_active: true,
  });
  const [savingBanner, setSavingBanner] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchBanner = async (targetKey = bannerPageKey) => {
    try {
      const res = await getAdminBanners(targetKey);
      if (res.data && res.data.length > 0) {
        const b = res.data[0];
        setActiveBanner(b);
        setBannerForm({
          title: b.title || '',
          subtitle: b.subtitle || '',
          description: b.description || '',
          image_url: b.image_url || '',
          button_text: b.button_text || (targetKey === 'HOME_PAGE' ? 'Tìm sân ngay' : 'Đăng bài mới ngay'),
          is_active: b.is_active ?? true,
        });
      } else {
        setActiveBanner(null);
        setBannerForm({
          title: targetKey === 'HOME_PAGE' ? 'Đặt sân thể thao nhanh chóng, tiện lợi' : 'Khám Phá & Kết Nối Thể Thao',
          subtitle: targetKey === 'HOME_PAGE' ? 'Nền tảng đặt sân trực tuyến hàng đầu' : 'SportHub Community Discovery Hub',
          description: targetKey === 'HOME_PAGE' ? 'Nền tảng ứng dụng AI hiện đại nhất giúp bạn dễ dàng tìm kiếm sân trống, đặt lịch giữ chỗ và thanh toán nhanh chóng.' : 'Tìm chân vãng lai ghép đội, nhượng lại vé pass sân nhanh chóng hoặc cáp kèo giao lưu đỉnh cao cùng hàng ngàn thể thao thủ tại địa phương.',
          image_url: targetKey === 'HOME_PAGE' ? '/hero_bg.png' : '',
          button_text: targetKey === 'HOME_PAGE' ? 'Tìm sân ngay' : 'Đăng bài mới ngay',
          is_active: true,
        });
      }
    } catch (err) {
      console.error('Failed to load banner for admin:', err);
      setActiveBanner(null);
      setBannerForm({
        title: targetKey === 'HOME_PAGE' ? 'Đặt sân thể thao nhanh chóng, tiện lợi' : 'Khám Phá & Kết Nối Thể Thao',
        subtitle: targetKey === 'HOME_PAGE' ? 'Nền tảng đặt sân trực tuyến hàng đầu' : 'SportHub Community Discovery Hub',
        description: targetKey === 'HOME_PAGE' ? 'Nền tảng ứng dụng AI hiện đại nhất giúp bạn dễ dàng tìm kiếm sân trống, đặt lịch giữ chỗ và thanh toán nhanh chóng.' : 'Tìm chân vãng lai ghép đội, nhượng lại vé pass sân nhanh chóng hoặc cáp kèo giao lưu đỉnh cao cùng hàng ngàn thể thao thủ tại địa phương.',
        image_url: targetKey === 'HOME_PAGE' ? '/hero_bg.png' : '',
        button_text: targetKey === 'HOME_PAGE' ? 'Tìm sân ngay' : 'Đăng bài mới ngay',
        is_active: true,
      });
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, selectedType, selectedStatus]);

  useEffect(() => {
    if (isBannerModalOpen) {
      setModalError(null);
      fetchBanner(bannerPageKey);
    }
  }, [bannerPageKey, isBannerModalOpen]);

  const handleBannerTabSwitch = (key) => {
    if (key === bannerPageKey) return;
    setModalError(null);
    setBannerPageKey(key);
  };

  const handleBannerImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.80);
        setBannerForm((prev) => ({ ...prev, image_url: compressedDataUrl }));
        setModalError(null);
      };
      img.onerror = () => {
        setModalError('Không thể đọc định dạng hình ảnh này. Vui lòng chọn ảnh khác!');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setModalError(null);
    try {
      setSavingBanner(true);
      if (activeBanner?.banner_id && activeBanner.banner_id !== 'default') {
        await updateAdminBanner(activeBanner.banner_id, { ...bannerForm, page_key: bannerPageKey });
      } else {
        await createAdminBanner({ ...bannerForm, page_key: bannerPageKey });
      }
      showToast(`Cập nhật Banner ${bannerPageKey === 'HOME_PAGE' ? 'Trang chủ' : 'Trang Khám phá'} thành công!`);
      setIsBannerModalOpen(false);
      fetchBanner(bannerPageKey);
    } catch (err) {
      setModalError('Lưu Banner thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingBanner(false);
    }
  };

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
      showToast('Không thể đổi trạng thái bài viết: ' + (err.response?.data?.message || err.message));
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
      showToast('Xóa bài viết thất bại: ' + (err.response?.data?.message || err.message));
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
          <h1 className="text-2xl font-bold">Quản Lý Bài Đăng Khám phá</h1>
          <p className="text-emerald-200 text-sm mt-1">
            Quản lý, duyệt nội dung và kiểm duyệt bài viết cộng đồng (Tuyển vãng lai, Pass sân, Khóa học thể thao)
          </p>
        </div>
        
        <div className="flex items-center space-x-3 self-start md:self-auto">
          <button
            onClick={() => { fetchBanner(bannerPageKey); setIsBannerModalOpen(true); }}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center space-x-2 text-sm"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Quản lý Banner</span>
          </button>

          <button
            onClick={() => { fetchPosts(); fetchBanner(); }}
            className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl border border-emerald-500/30 font-semibold text-sm transition-all flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className=" rounded-2xl p-4 shadow-sm border-b border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Post Type Selector */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
          <button
            onClick={() => { setSelectedType('ALL'); setPage(1); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedType === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-amber-400 hover:bg-slate-800 hover:text-amber-300'
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
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/60 text-amber-400 hover:bg-slate-800 hover:text-amber-300'
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
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
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
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </form>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-md">
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
                <tr className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/80">
                  <th className="py-4 px-6">Bài đăng / Banner</th>
                  <th className="py-4 px-6">Loại & Môn</th>
                  <th className="py-4 px-6">Tác giả (User)</th>
                  <th className="py-4 px-6">Thời gian & Địa điểm</th>
                  <th className="py-4 px-6">Chi phí / Giá</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Thao tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-xs text-slate-200">
                {posts.map((post) => {
                  const cfg = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.RECRUIT;
                  const TypeIcon = cfg.icon;
                  const coverImg = post.image_url || DEFAULT_SPORT_IMAGES[post.sport_type] || DEFAULT_SPORT_IMAGES['Cầu lông'];

                  return (
                    <tr key={post.post_id} className="hover:bg-slate-700/30 transition-colors">
                      {/* Title & Cover */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3 min-w-[240px]">
                          <img
                            src={coverImg}
                            alt={post.title}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0 shadow-xs"
                          />
                          <div>
                            <p className="font-bold text-white line-clamp-1 hover:text-emerald-600 transition-colors">
                              {post.title}
                            </p>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
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
                          <p className="text-xs text-slate-500 font-medium">Môn: <strong>{post.sport_type}</strong></p>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-white">{post.author?.full_name || 'Khách vãng lai'}</p>
                          <p className="text-xs text-slate-500">{post.author?.phone_number || post.contact_phone || 'N/A'}</p>
                        </div>
                      </td>

                      {/* Play Date & Location */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400 shrink-0" />
                            <span className='text-slate-400'>{post.play_date} ({post.start_time?.substring(0, 5) || 'N/A'})</span>
                          </div>
                          <div className="flex items-center max-w-[200px]">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-400 shrink-0" />
                            <span className="truncate text-slate-400">{post.venue?.venue_name || post.location_name || 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-bold text-emerald-400">
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

      {/* Admin Banner Management Modal */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4 shrink-0">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-gray-900">Quản lý Banner Hệ thống (Admin Control)</h2>
              </div>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="overflow-y-auto pr-2 space-y-5 flex-1 custom-scrollbar">

            {/* Page Selection Tabs */}
            <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl mb-4">
              <button
                type="button"
                onClick={() => handleBannerTabSwitch('EXPLORE_PAGE')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  bannerPageKey === 'EXPLORE_PAGE'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Banner Trang Khám Phá (/explore)</span>
              </button>

              <button
                type="button"
                onClick={() => handleBannerTabSwitch('HOME_PAGE')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  bannerPageKey === 'HOME_PAGE'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Banner Trang Chủ Customer (/)</span>
              </button>
            </div>

            {/* In-Modal Error Notification */}
            {modalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-semibold animate-in fade-in duration-200 mb-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{modalError}</span>
                </div>
                <button type="button" onClick={() => setModalError(null)} className="text-red-400 hover:text-red-600">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Live Banner Preview */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Xem trước giao diện Customer ({bannerPageKey === 'HOME_PAGE' ? 'Trang chủ /' : 'Trang Khám phá /explore'})
                </label>
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  Live Preview
                </span>
              </div>

              <div 
                className={`p-6 rounded-2xl shadow-inner relative overflow-hidden bg-cover bg-center transition-all duration-300 ${
                  bannerPageKey === 'HOME_PAGE'
                    ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white'
                    : 'bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white'
                }`}
                style={
                  bannerForm.image_url 
                    ? { 
                        backgroundImage: bannerPageKey === 'HOME_PAGE'
                          ? `linear-gradient(to right, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0.35) 100%), url(${bannerForm.image_url})`
                          : `linear-gradient(to right, rgba(4, 47, 38, 0.75) 0%, rgba(13, 148, 136, 0.35) 60%, rgba(6, 78, 59, 0.2) 100%), url(${bannerForm.image_url})`
                      } 
                    : {}
                }
              >
                <div className="space-y-2 relative z-10">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-md border border-white/10">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    <span>
                      {bannerForm.subtitle || (bannerPageKey === 'HOME_PAGE' ? 'Nền tảng đặt sân trực tuyến hàng đầu' : 'SportHub Community Discovery Hub')}
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight">
                    {bannerForm.title || (bannerPageKey === 'HOME_PAGE' ? 'Đặt sân thể thao nhanh chóng, tiện lợi' : 'Khám Phá & Kết Nối Thể Thao')}
                  </h3>
                  <p className="text-emerald-100 text-xs leading-relaxed max-w-xl">
                    {bannerForm.description || (bannerPageKey === 'HOME_PAGE' ? 'Nền tảng ứng dụng AI hiện đại nhất giúp bạn dễ dàng tìm kiếm sân trống, đặt lịch giữ chỗ...' : 'Tìm chân vãng lai ghép đội, nhượng lại vé pass sân nhanh chóng...')}
                  </p>
                  <div className="pt-2">
                    <span className="px-4 py-2 bg-brand-orange text-white font-bold text-xs rounded-xl shadow inline-block">
                      + {bannerForm.button_text || (bannerPageKey === 'HOME_PAGE' ? 'Tìm sân ngay' : 'Đăng bài mới ngay')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề Banner chính (*)</label>
                  <input
                    type="text"
                    required
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    placeholder={bannerPageKey === 'HOME_PAGE' ? 'Ví dụ: Đặt sân thể thao nhanh chóng, tiện lợi' : 'Ví dụ: Khám Phá & Kết Nối Thể Thao'}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Dòng chữ phụ Subtitle</label>
                  <input
                    type="text"
                    value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                    placeholder={bannerPageKey === 'HOME_PAGE' ? 'Ví dụ: Nền tảng đặt sân trực tuyến hàng đầu' : 'Ví dụ: SportHub Community Discovery Hub'}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nội dung mô tả chi tiết</label>
                <textarea
                  rows="3"
                  value={bannerForm.description}
                  onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                  placeholder={bannerPageKey === 'HOME_PAGE' ? 'Nhập đoạn mô tả giới thiệu cho Trang chủ...' : 'Nhập đoạn giới thiệu ngắn cho Trang Khám phá...'}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Upload Hình nền & Tên nút bấm */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Hình nền Banner (Upload Image từ máy tính)</label>
                  <div className="border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl p-4 transition-all bg-slate-50/50">
                    {bannerForm.image_url ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 overflow-hidden w-full sm:w-auto">
                          <img 
                            src={bannerForm.image_url} 
                            alt="Banner Preview" 
                            className="w-16 h-12 object-cover rounded-xl border border-gray-200 shadow-sm shrink-0" 
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">Ảnh nền đã chọn</p>
                            <p className="text-[11px] text-emerald-600 font-semibold truncate">Đã cập nhật trực tiếp lên Live Preview</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <label 
                            htmlFor="banner_image_file_input" 
                            className="px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-xl cursor-pointer transition-all border border-emerald-200 flex items-center space-x-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Đổi ảnh khác</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setBannerForm({ ...bannerForm, image_url: '' })}
                            className="px-3.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-xl transition-all border border-red-200 flex items-center space-x-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa ảnh</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label 
                        htmlFor="banner_image_file_input" 
                        className="flex flex-col items-center justify-center py-4 cursor-pointer group"
                      >
                        <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:scale-110 transition-all mb-2 shadow-sm">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">Tải ảnh lên từ máy tính (Upload Image)</span>
                        <span className="text-[11px] text-emerald-600 font-medium mt-0.5">Hỗ trợ mọi kích thước ảnh JPG, PNG, WEBP (Tự động nén tối ưu sắc nét)</span>
                      </label>
                    )}

                    <input 
                      type="file" 
                      id="banner_image_file_input" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleBannerImageUpload} 
                    />
                  </div>

                  {/* Secondary URL input */}
                  <div className="mt-2">
                    <input
                      type="text"
                      value={bannerForm.image_url}
                      onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                      placeholder="Hoặc dán URL link ảnh trực tiếp nếu có (https://...)"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-gray-600 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tên nút hành động (Button Text)</label>
                  <input
                    type="text"
                    value={bannerForm.button_text}
                    onChange={(e) => setBannerForm({ ...bannerForm, button_text: e.target.value })}
                    placeholder={bannerPageKey === 'HOME_PAGE' ? 'Ví dụ: Tìm sân ngay' : 'Ví dụ: Đăng bài mới ngay'}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="banner_active"
                  checked={bannerForm.is_active}
                  onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="banner_active" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                  Kích hoạt hiển thị Banner này trên {bannerPageKey === 'HOME_PAGE' ? 'Trang chủ Customer' : 'trang Khám phá Customer'}
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={savingBanner}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {savingBanner ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>💾 Lưu thay đổi Banner</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
