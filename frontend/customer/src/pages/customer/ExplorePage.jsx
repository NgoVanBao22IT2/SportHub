import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Ticket, 
  UserCheck, 
  Swords, 
  GraduationCap,
  ShieldCheck, 
  TrendingUp, 
  Info,
  RefreshCw,
  Flame
} from 'lucide-react';
import communityApi from '../../api/communityApi';
import PostCard from '../../components/domain/community/PostCard';
import CreatePostModal from '../../components/domain/community/CreatePostModal';
import ApplyPostModal from '../../components/domain/community/ApplyPostModal';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const FILTER_TABS = [
  { key: 'ALL', label: '🔥 Tất cả bài đăng', icon: Flame },
  { key: 'RECRUIT', label: '👥 Tuyển vãng lai', icon: Users },
  { key: 'PASS_BOOKING', label: '🎟️ Pass sân / Vé nhượng', icon: Ticket },
  { key: 'FIND_SLOT', label: '🙋‍♂️ Tìm slot chơi', icon: UserCheck },
  { key: 'CHALLENGE', label: '🏆 Cáp kèo giao lưu', icon: Swords },
  { key: 'COURSE', label: '🎓 Khóa học thể thao', icon: GraduationCap },
];

const SPORT_OPTIONS = ['ALL', 'Cầu lông', 'Pickleball', 'Bóng đá', 'Tennis', 'Bóng rổ'];

export default function ExplorePage() {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPostToApply, setSelectedPostToApply] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, [activeTab, selectedSport]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {
        post_type: activeTab,
        sport_type: selectedSport,
        search: searchTerm,
      };
      const res = await communityApi.getPosts(params);
      setPosts(res.data?.posts || []);
      setTotalCount(res.data?.total || 0);
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleOpenCreateModal = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsCreateOpen(true);
  };

  const handleApplyClick = (post) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedPostToApply(post);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Hero Banner Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white py-12 px-4 shadow-inner relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-md border border-white/10 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>SportHub Community Discovery Hub</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Khám Phá & Kết Nối Thể Thao
            </h1>
            <p className="text-emerald-100 text-sm max-w-2xl leading-relaxed">
              Tìm chân vãng lai ghép đội, nhượng lại vé pass sân nhanh chóng hoặc cáp kèo giao lưu đỉnh cao cùng hàng ngàn thể thao thủ tại địa phương.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-6 py-3.5 bg-brand-orange hover:bg-orange-400 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center space-x-2 shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Đăng bài mới ngay</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        {/* Search & Sport Filters Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="w-full lg:w-96 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tiêu đề, tên sân, khu vực..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </form>

          {/* Sport Selector Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
            <span className="text-xs font-semibold text-gray-500 flex items-center mr-1 shrink-0">
              <Filter className="w-3.5 h-3.5 mr-1" /> Môn:
            </span>
            {SPORT_OPTIONS.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  selectedSport === sport
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sport === 'ALL' ? 'Tất cả môn' : sport}
              </button>
            ))}

            <button
              onClick={fetchPosts}
              className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors shrink-0 ml-2"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-gray-200/80">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all shrink-0 flex items-center space-x-2 ${
                  isActive
                    ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200 ring-2 ring-emerald-500/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Layout: 70% Feed + 30% Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed Column (70%) */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-16 bg-gray-100 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Chưa có bài đăng phù hợp</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Hiện chưa có bài đăng nào trong phân mục này. Hãy trở thành người đầu tiên đăng bài để tìm đối thủ hoặc nhượng vé nhé!
                </p>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow transition-all"
                >
                  Tạo bài đăng ngay
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1 text-xs text-gray-500">
                  <span>Hiển thị <strong>{posts.length}</strong> bài đăng</span>
                  <span>Sắp xếp: Mới nhất</span>
                </div>
                {posts.map((post) => (
                  <PostCard
                    key={post.post_id}
                    post={post}
                    onApply={handleApplyClick}
                    currentUserId={currentUser?.user_id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Right Column (30%) */}
          <div className="space-y-6">
            {/* Quick Stats Widget */}
            <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
              <div className="flex items-center space-x-2 text-emerald-300 text-xs font-semibold mb-3">
                <TrendingUp className="w-4 h-4" />
                <span>Thống kê cộng đồng</span>
              </div>
              <h4 className="text-xl font-extrabold mb-4">Sôi động hôm nay</h4>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                  <span className="text-2xl font-black text-amber-300">{totalCount || 42}</span>
                  <span className="text-[11px] text-emerald-100 block mt-0.5">Kèo đang mở</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                  <span className="text-2xl font-black text-emerald-300">100%</span>
                  <span className="text-[11px] text-emerald-100 block mt-0.5">Vé Pass xác thực</span>
                </div>
              </div>
            </div>

            {/* Safe Transaction Guideline Widget */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
              <div className="flex items-center space-x-2 text-amber-600 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Mẹo giao dịch & An toàn</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-2 leading-relaxed">
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>Ưu tiên mua vé Pass sân có nhãn <strong>"Vé đặt xác thực"</strong> được kiểm duyệt bởi SportHub.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>Liên hệ trực tiếp với chủ sân hoặc trao đổi rõ ràng qua SĐT/Zalo trước khi chuyển cọc.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>Không chuyển khoản 100% số tiền cho các bài viết không rõ nguồn gốc.</span>
                </li>
              </ul>
            </div>

            {/* Community Guidelines Widget */}
            <div className="bg-slate-100/70 rounded-3xl p-5 border border-slate-200 text-xs text-gray-500 space-y-2">
              <div className="flex items-center space-x-1.5 font-bold text-gray-700">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>Nội quy Khám phá</span>
              </div>
              <p>Vui lòng cư xử văn minh, tôn trọng đối thủ và tuân thủ đúng giờ chơi sau khi đã đăng ký tham gia slot.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          fetchPosts();
        }}
      />

      {/* Apply / Join Modal */}
      <ApplyPostModal
        isOpen={!!selectedPostToApply}
        onClose={() => setSelectedPostToApply(null)}
        post={selectedPostToApply}
        onSuccess={() => {
          fetchPosts();
        }}
      />
    </div>
  );
}
