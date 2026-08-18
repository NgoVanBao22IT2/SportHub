import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Archive,
  Send,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Tag,
  Trophy,
  GraduationCap,
  Sparkles,
  Megaphone,
  X,
  Image,
  Building2,
  Bold,
  Italic,
  List,
  Heading,
  Link as LinkIcon
} from 'lucide-react';
import {
  getOwnerVenues,
  getOwnerPosts,
  createOwnerPost,
  updateOwnerPost,
  deleteOwnerPost,
  publishOwnerPost,
  archiveOwnerPost,
  getOwnerVenueMedia
} from '../../api/owner';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

const CONTENT_TYPES = [
  { id: 'ALL', label: 'Tất cả', icon: FileText },
  { id: 'POST', label: 'Tin tức & Bài viết', icon: FileText },
  { id: 'PROMOTION', label: 'Chương trình Khuyến mãi', icon: Tag },
  { id: 'EVENT', label: 'Sự kiện Thể thao', icon: Calendar },
  { id: 'TOURNAMENT', label: 'Giải đấu', icon: Trophy },
  { id: 'COURSE', label: 'Khóa học Huấn luyện', icon: GraduationCap },
  { id: 'ANNOUNCEMENT', label: 'Thông báo Sân', icon: Megaphone }
];

const STATUS_FILTERS = [
  { id: 'ALL', label: 'Tất cả trạng thái' },
  { id: 'PUBLISHED', label: 'Đã xuất bản' },
  { id: 'DRAFT', label: 'Bản nháp' },
  { id: 'ARCHIVED', label: 'Đã lưu trữ' }
];

export default function OwnerPosts() {
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [loadingVenues, setLoadingVenues] = useState(true);

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState(null);

  const [activeType, setActiveType] = useState('ALL');
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Media Selector Modal State for Cover Image
  const [venueImages, setVenueImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);

  // Post Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('POST');
  const [coverImageId, setCoverImageId] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [location, setLocation] = useState('');
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState('');
  const [instructor, setInstructor] = useState('');
  const [contactHotline, setContactHotline] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [savingPost, setSavingPost] = useState(false);

  // Delete & View Modal States
  const [deletingPost, setDeletingPost] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewingPost, setViewingPost] = useState(null);

  // Notice Modal
  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'info' });

  // 1. Fetch Owner Venues
  const fetchVenues = useCallback(async () => {
    try {
      setLoadingVenues(true);
      const res = await getOwnerVenues();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setVenues(list);
      if (list.length > 0) {
        setSelectedVenueId(list[0].venue_id);
      }
    } catch (err) {
      console.error('Failed to fetch owner venues:', err);
    } finally {
      setLoadingVenues(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  // 2. Fetch Posts List
  const fetchPosts = useCallback(async () => {
    if (!selectedVenueId) return;

    try {
      setLoadingPosts(true);
      setError(null);

      const params = {
        content_type: activeType,
        status: activeStatus,
        search: searchQuery
      };

      const res = await getOwnerPosts(selectedVenueId, params);
      setPosts(res?.data || []);
    } catch (err) {
      console.error('Failed to fetch venue posts:', err);
      setError('Không thể nạp danh sách bài viết & sự kiện.');
    } finally {
      setLoadingPosts(false);
    }
  }, [selectedVenueId, activeType, activeStatus, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Fetch venue images for cover image selector
  const fetchVenueMediaForSelector = async () => {
    if (!selectedVenueId) return;
    try {
      setLoadingImages(true);
      const res = await getOwnerVenueMedia(selectedVenueId, { limit: 50 });
      setVenueImages(res?.data || []);
    } catch (err) {
      console.error('Failed to fetch venue media for selector:', err);
    } finally {
      setLoadingImages(false);
    }
  };

  // Open Create Post Modal
  const openCreateModal = () => {
    setEditingPostId(null);
    setTitle('');
    setExcerpt('');
    setContent('');
    setContentType('POST');
    setCoverImageId('');
    setCoverImageUrl('');
    setStatus('DRAFT');
    setStartAt('');
    setEndAt('');
    setLocation('');
    setRegistrationUrl('');
    setMaxParticipants('');
    setFeeAmount('');
    setPromoCode('');
    setDiscountInfo('');
    setInstructor('');
    setContactHotline('');
    setIsFeatured(false);
    setIsEditorOpen(true);
  };

  // Open Edit Post Modal
  const openEditModal = (post) => {
    setEditingPostId(post.post_id);
    setTitle(post.title || '');
    setExcerpt(post.excerpt || '');
    setContent(post.content || '');
    setContentType(post.content_type || 'POST');
    setCoverImageId(post.cover_image_id || '');
    setCoverImageUrl(post.cover_image_url || post.cover_image?.image_url || '');
    setStatus(post.status || 'DRAFT');
    setStartAt(post.start_at ? new Date(post.start_at).toISOString().slice(0, 16) : '');
    setEndAt(post.end_at ? new Date(post.end_at).toISOString().slice(0, 16) : '');
    setLocation(post.location || '');
    setRegistrationUrl(post.registration_url || '');
    setMaxParticipants(post.max_participants || '');
    setFeeAmount(post.fee_amount || '');
    setPromoCode(post.promo_code || '');
    setDiscountInfo(post.discount_info || '');
    setInstructor(post.instructor || '');
    setContactHotline(post.contact_hotline || '');
    setIsFeatured(!!post.is_featured);
    setIsEditorOpen(true);
  };

  // Rich Text Formatting Helper
  const applyFormat = (tag, wrapper = '') => {
    if (tag === 'b') setContent(prev => prev + ' <b>văn bản in đậm</b> ');
    else if (tag === 'i') setContent(prev => prev + ' <i>văn bản in nghiêng</i> ');
    else if (tag === 'h3') setContent(prev => prev + '\n<h3>Tiêu đề phụ</h3>\n');
    else if (tag === 'ul') setContent(prev => prev + '\n<ul>\n  <li>Ý thứ 1</li>\n  <li>Ý thứ 2</li>\n</ul>\n');
    else if (tag === 'a') setContent(prev => prev + ' <a href="https://" target="_blank">Liên kết</a> ');
  };

  // Handle Save Post Form
  const handleSavePost = async () => {
    if (!title.trim()) {
      setNoticeModal({ open: true, title: 'Thiếu thông tin', message: 'Vui lòng nhập tiêu đề bài viết / sự kiện.', type: 'error' });
      return;
    }

    try {
      setSavingPost(true);
      const payload = {
        title,
        excerpt,
        content,
        content_type: contentType,
        cover_image_id: coverImageId || null,
        cover_image_url: coverImageUrl || null,
        status,
        start_at: startAt || null,
        end_at: endAt || null,
        location: location || null,
        registration_url: registrationUrl || null,
        max_participants: maxParticipants ? parseInt(maxParticipants, 10) : null,
        fee_amount: feeAmount ? parseFloat(feeAmount) : 0,
        promo_code: promoCode || null,
        discount_info: discountInfo || null,
        instructor: instructor || null,
        contact_hotline: contactHotline || null,
        is_featured: isFeatured
      };

      if (editingPostId) {
        await updateOwnerPost(editingPostId, payload);
        setNoticeModal({ open: true, title: 'Thành công', message: 'Đã cập nhật bài viết / sự kiện thành công.', type: 'success' });
      } else {
        await createOwnerPost(selectedVenueId, payload);
        setNoticeModal({ open: true, title: 'Thành công', message: 'Đã tạo mới bài viết / sự kiện thành công.', type: 'success' });
      }

      setIsEditorOpen(false);
      fetchPosts();
    } catch (err) {
      console.error('Failed to save post:', err);
      const msg = err.response?.data?.error?.message || 'Lưu bài viết thất bại. Vui lòng kiểm tra lại thông tin.';
      setNoticeModal({ open: true, title: 'Lỗi', message: msg, type: 'error' });
    } finally {
      setSavingPost(false);
    }
  };

  // Quick Action Publish
  const handlePublish = async (postId) => {
    try {
      await publishOwnerPost(postId);
      setNoticeModal({ open: true, title: 'Thành công', message: 'Đã xuất bản bài viết công khai trên trang Khách hàng.', type: 'success' });
      fetchPosts();
    } catch (err) {
      console.error('Failed to publish post:', err);
      setNoticeModal({ open: true, title: 'Thao tác thất bại', message: 'Không thể xuất bản bài viết.', type: 'error' });
    }
  };

  // Quick Action Archive
  const handleArchive = async (postId) => {
    try {
      await archiveOwnerPost(postId);
      setNoticeModal({ open: true, title: 'Thành công', message: 'Đã lưu trữ bài viết thành công.', type: 'success' });
      fetchPosts();
    } catch (err) {
      console.error('Failed to archive post:', err);
      setNoticeModal({ open: true, title: 'Thao tác thất bại', message: 'Không thể lưu trữ bài viết.', type: 'error' });
    }
  };

  // Delete Post Confirm
  const handleDeletePost = async () => {
    if (!deletingPost) return;

    try {
      setDeleting(true);
      await deleteOwnerPost(deletingPost.post_id);
      setNoticeModal({ open: true, title: 'Thành công', message: 'Đã xóa bài viết thành công.', type: 'success' });
      setDeletingPost(null);
      fetchPosts();
    } catch (err) {
      console.error('Failed to delete post:', err);
      setNoticeModal({ open: true, title: 'Thao tác thất bại', message: 'Không thể xóa bài viết.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border-subtle-medium shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-brand-orange" size={28} />
            Quản lý Bài viết, Tin tức & Sự kiện
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Đăng tin tức, chương trình khuyến mãi, giải đấu và các khóa học thể thao thu hút khách hàng đến sân.
          </p>
        </div>

        {/* VENUE SELECTOR & CREATE BUTTON */}
        <div className="flex items-center gap-3">
          {venues.length > 0 && (
            <div className="relative">
              <select
                value={selectedVenueId}
                onChange={(e) => setSelectedVenueId(e.target.value)}
                className="appearance-none bg-surface-subtle text-gray-900 text-xs font-semibold pl-3 pr-8 py-2.5 rounded-xl border border-border-subtle-medium focus:outline-none focus:border-brand-orange"
              >
                {venues.map((v) => (
                  <option key={v.venue_id} value={v.venue_id}>
                    {v.venue_name}
                  </option>
                ))}
              </select>
              <Building2 size={14} className="absolute right-2.5 top-3 text-text-muted pointer-events-none" />
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
            onClick={openCreateModal}
          >
            Tạo nội dung mới
          </Button>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="bg-surface p-4 rounded-2xl border border-border-subtle-medium space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          {/* TYPE FILTER BAR */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto scrollbar-none">
            {CONTENT_TYPES.map((type) => {
              const active = activeType === type.id;
              const IconComp = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setActiveType(type.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'bg-brand-orange text-white font-bold shadow-xs'
                      : 'bg-surface-subtle text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <IconComp size={14} />
                  {type.label}
                </button>
              );
            })}
          </div>

          {/* STATUS SELECTOR & SEARCH INPUT */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <select
              value={activeStatus}
              onChange={(e) => setActiveStatus(e.target.value)}
              className="text-xs font-medium bg-surface-subtle border border-border-subtle-medium rounded-xl px-3 py-2 focus:outline-none focus:border-brand-orange"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            <div className="relative flex-1 lg:w-56">
              <Search size={14} className="absolute left-3 top-2.5 text-text-muted" />
              <input
                type="text"
                placeholder="Tìm bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-surface-subtle border border-border-subtle-medium rounded-xl focus:outline-none focus:border-brand-orange"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-text-muted">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* POSTS LIST GRID / CARDS */}
      {loadingPosts ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} radius="xl" className="p-4 border border-border-subtle-medium space-y-3">
              <Skeleton variant="text" width="60%" height="1.5rem" />
              <Skeleton variant="text" width="90%" height="1rem" />
              <Skeleton variant="rectangular" height="40px" radius="lg" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Lỗi nạp danh sách"
          description={error}
          action={
            <Button variant="outline" size="sm" onClick={fetchPosts} leftIcon={<RefreshCw size={14} />}>
              Thử lại
            </Button>
          }
        />
      ) : posts.length === 0 ? (
        <EmptyState
          title="Chưa có bài viết hay sự kiện nào"
          description="Tạo các tin tức khuyến mãi, giải đấu giao lưu để quảng bá sân thể thao của bạn đến hàng ngàn người chơi."
          action={
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreateModal}>
              Tạo bài viết đầu tiên
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const coverUrl = post.cover_image_url || post.cover_image?.medium_url || post.cover_image?.image_url;

            return (
              <Card
                key={post.post_id}
                radius="xl"
                padding="md"
                className="border border-border-subtle-medium hover:border-brand-orange/50 transition-all flex flex-col md:flex-row justify-between gap-4 bg-surface"
              >
                {/* COVER THUMBNAIL */}
                {coverUrl && (
                  <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={coverUrl} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* CONTENT MAIN INFO */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* TYPE BADGE */}
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-brand-orange/10 text-brand-orange">
                      {post.content_type}
                    </span>

                    {/* STATUS BADGE */}
                    {post.status === 'PUBLISHED' && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-status-success/15 text-status-success">
                        ĐÃ XUẤT BẢN
                      </span>
                    )}
                    {post.status === 'DRAFT' && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-200 text-gray-700">
                        BẢN NHÁP
                      </span>
                    )}
                    {post.status === 'ARCHIVED' && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800">
                        ĐÃ LƯU TRỮ
                      </span>
                    )}

                    {post.is_featured && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-100 text-purple-700 flex items-center gap-1">
                        <Sparkles size={10} /> NỔI BẬT
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-gray-900 hover:text-brand-orange transition-colors">
                    {post.title}
                  </h3>

                  {post.excerpt && (
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}

                  {/* EVENT METADATA */}
                  {(post.start_at || post.location) && (
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-600 pt-1">
                      {post.start_at && (
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-brand-orange" />
                          {new Date(post.start_at).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                      {post.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-accent-primary" />
                          {post.location}
                        </span>
                      )}
                      {post.contact_hotline && (
                        <span className="flex items-center gap-1">
                          <Phone size={13} className="text-status-success" />
                          {post.contact_hotline}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="text-[10px] text-text-muted pt-1">
                    Đăng ngày: {new Date(post.created_at || Date.now()).toLocaleDateString('vi-VN')} • Lượt xem: {post.view_count || 0}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex md:flex-col items-center justify-end gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4">
                  {post.status === 'DRAFT' && (
                    <Button
                      variant="primary"
                      size="xs"
                      fullWidth
                      leftIcon={<Send size={12} />}
                      onClick={() => handlePublish(post.post_id)}
                    >
                      Xuất bản
                    </Button>
                  )}

                  {post.status === 'PUBLISHED' && (
                    <Button
                      variant="outline"
                      size="xs"
                      fullWidth
                      leftIcon={<Archive size={12} />}
                      onClick={() => handleArchive(post.post_id)}
                    >
                      Lưu trữ
                    </Button>
                  )}

                  <div className="flex items-center gap-1.5 w-full justify-end">
                    <button
                      onClick={() => setViewingPost(post)}
                      className="p-1.5 text-text-muted hover:text-gray-900 rounded-lg hover:bg-surface-subtle"
                      title="Xem trước"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => openEditModal(post)}
                      className="p-1.5 text-text-muted hover:text-brand-orange rounded-lg hover:bg-surface-subtle"
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setDeletingPost(post)}
                      className="p-1.5 text-text-muted hover:text-status-error rounded-lg hover:bg-surface-subtle"
                      title="Xóa bài viết"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT POST MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-border-subtle-medium max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle-medium pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-brand-orange" />
                {editingPostId ? 'Chỉnh sửa Nội dung' : 'Tạo Bài viết / Sự kiện mới'}
              </h3>
              <button onClick={() => setIsEditorOpen(false)} className="text-text-muted hover:text-gray-900">
                <X size={18} />
              </button>
            </div>

            {/* DYNAMIC FORM */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">Loại nội dung (*)</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full text-xs font-medium bg-surface-subtle border border-border-subtle-medium rounded-xl p-2.5 focus:outline-none focus:border-brand-orange"
                  >
                    {CONTENT_TYPES.filter(t => t.id !== 'ALL').map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">Trạng thái xuất bản</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-xs font-medium bg-surface-subtle border border-border-subtle-medium rounded-xl p-2.5 focus:outline-none focus:border-brand-orange"
                  >
                    <option value="DRAFT">Bản nháp (Draft)</option>
                    <option value="PUBLISHED">Xuất bản công khai (Published)</option>
                    <option value="ARCHIVED">Lưu trữ (Archived)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Tiêu đề bài viết / sự kiện (*)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: GIẢI CẦU LÔNG MỞ RỘNG SPORT HUB OPEN 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs font-bold bg-surface-subtle border border-border-subtle-medium rounded-xl p-2.5 focus:outline-none focus:border-brand-orange"
                />
              </div>

              {/* COVER IMAGE SELECTOR */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Ảnh bìa (Cover Image)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="URL ảnh hoặc chọn từ thư viện media..."
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="flex-1 text-xs bg-surface-subtle border border-border-subtle-medium rounded-xl p-2.5 focus:outline-none focus:border-brand-orange"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Image size={14} />}
                    onClick={() => {
                      fetchVenueMediaForSelector();
                      setIsMediaSelectorOpen(true);
                    }}
                  >
                    Chọn từ Thư viện
                  </Button>
                </div>
              </div>

              {/* EXCERPT MÔ TẢ NGẮN */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Tóm tắt ngắn (Excerpt)</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả ngắn gọn hiển thị trên thẻ xem trước..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full text-xs bg-surface-subtle border border-border-subtle-medium rounded-xl p-2.5 focus:outline-none focus:border-brand-orange"
                />
              </div>

              {/* DYNAMIC FIELDS PER CONTENT TYPE */}
              {(contentType === 'EVENT' || contentType === 'TOURNAMENT' || contentType === 'COURSE') && (
                <div className="p-4 bg-brand-orange/5 border border-brand-orange/20 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-brand-orange flex items-center gap-1.5">
                    <Calendar size={14} /> Thông tin Thời gian & Địa điểm Tổ chức
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-800 mb-1">Thời gian bắt đầu</label>
                      <input
                        type="datetime-local"
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                        className="w-full text-xs bg-surface border border-gray-300 rounded-xl p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-800 mb-1">Thời gian kết thúc</label>
                      <input
                        type="datetime-local"
                        value={endAt}
                        onChange={(e) => setEndAt(e.target.value)}
                        className="w-full text-xs bg-surface border border-gray-300 rounded-xl p-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-800 mb-1">Địa điểm / Chi nhánh</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Cơ sở 1 - Đà Nẵng"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full text-xs bg-surface border border-gray-300 rounded-xl p-2 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-800 mb-1">Hotline Đăng ký / Hỗ trợ</label>
                      <input
                        type="text"
                        placeholder="0900000999"
                        value={contactHotline}
                        onChange={(e) => setContactHotline(e.target.value)}
                        className="w-full text-xs bg-surface border border-gray-300 rounded-xl p-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-800 mb-1">Link Đăng ký Online</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={registrationUrl}
                        onChange={(e) => setRegistrationUrl(e.target.value)}
                        className="w-full text-xs bg-surface border border-gray-300 rounded-xl p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-800 mb-1">Giới hạn số người</label>
                      <input
                        type="number"
                        placeholder="32"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(e.target.value)}
                        className="w-full text-xs bg-surface border border-gray-300 rounded-xl p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-800 mb-1">Lệ phí / Học phí (đ)</label>
                      <input
                        type="number"
                        placeholder="150000"
                        value={feeAmount}
                        onChange={(e) => setFeeAmount(e.target.value)}
                        className="w-full text-xs bg-surface border border-gray-300 rounded-xl p-2 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {contentType === 'PROMOTION' && (
                <div className="p-4 bg-accent-primary/5 border border-accent-primary/20 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-accent-primary flex items-center gap-1.5">
                    <Tag size={14} /> Chi tiết Ưu đãi Khuyến mãi
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-800 mb-1">Mã giảm giá (Promo Code)</label>
                      <input
                        type="text"
                        placeholder="SUMMER2026"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="w-full text-xs font-bold bg-surface border border-gray-300 rounded-xl p-2 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-800 mb-1">Mức giảm / Ưu đãi</label>
                      <input
                        type="text"
                        placeholder="Giảm 20% khung giờ 17h-20h"
                        value={discountInfo}
                        onChange={(e) => setDiscountInfo(e.target.value)}
                        className="w-full text-xs bg-surface border border-gray-300 rounded-xl p-2 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* RICH FORMATTING CONTENT TOOLBAR & TEXTAREA */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-800">Nội dung chi tiết (Rich Content)</label>
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                    <button type="button" onClick={() => applyFormat('b')} className="p-1 hover:bg-white rounded text-gray-700" title="In đậm">
                      <Bold size={13} />
                    </button>
                    <button type="button" onClick={() => applyFormat('i')} className="p-1 hover:bg-white rounded text-gray-700" title="In nghiêng">
                      <Italic size={13} />
                    </button>
                    <button type="button" onClick={() => applyFormat('h3')} className="p-1 hover:bg-white rounded text-gray-700" title="Tiêu đề phụ">
                      <Heading size={13} />
                    </button>
                    <button type="button" onClick={() => applyFormat('ul')} className="p-1 hover:bg-white rounded text-gray-700" title="Danh sách">
                      <List size={13} />
                    </button>
                    <button type="button" onClick={() => applyFormat('a')} className="p-1 hover:bg-white rounded text-gray-700" title="Chèn đường dẫn">
                      <LinkIcon size={13} />
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  placeholder="Soạn thảo nội dung bài viết chi tiết..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs bg-surface-subtle border border-border-subtle-medium rounded-xl p-3 focus:outline-none focus:border-brand-orange font-mono"
                />
              </div>

              {/* FEATURED TOGGLE */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeaturedCheck"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-brand-orange focus:ring-brand-orange"
                />
                <label htmlFor="isFeaturedCheck" className="text-xs font-semibold text-gray-800 cursor-pointer">
                  Đánh dấu là Bài viết / Sự kiện NỔI BẬT (Hiển thị trang chủ)
                </label>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle-medium">
              <Button variant="outline" size="sm" onClick={() => setIsEditorOpen(false)} disabled={savingPost}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" loading={savingPost} onClick={handleSavePost}>
                {editingPostId ? 'Lưu cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA SELECTOR MODAL FOR COVER IMAGE */}
      {isMediaSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-border-subtle-medium max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-gray-900">Chọn ảnh bìa từ Thư viện Sân</h3>
              <button onClick={() => setIsMediaSelectorOpen(false)} className="text-text-muted">
                <X size={16} />
              </button>
            </div>

            {loadingImages ? (
              <p className="text-xs text-text-muted py-8 text-center">Đang nạp thư viện ảnh...</p>
            ) : venueImages.length === 0 ? (
              <p className="text-xs text-text-muted py-8 text-center">Thư viện ảnh của sân chưa có dữ liệu.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {venueImages.map((img) => (
                  <div
                    key={img.image_id}
                    onClick={() => {
                      setCoverImageId(img.image_id);
                      setCoverImageUrl(img.medium_url || img.image_url);
                      setIsMediaSelectorOpen(false);
                    }}
                    className="cursor-pointer border-2 rounded-xl overflow-hidden aspect-video hover:border-brand-orange transition-all"
                  >
                    <img src={img.thumbnail_url || img.image_url} alt={img.title} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEWING PREVIEW MODAL */}
      {viewingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-border-subtle-medium max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs font-bold bg-brand-orange/10 text-brand-orange px-2.5 py-1 rounded-lg">
                {viewingPost.content_type}
              </span>
              <button onClick={() => setViewingPost(null)} className="text-text-muted">
                <X size={18} />
              </button>
            </div>

            <h2 className="text-xl font-bold text-gray-900">{viewingPost.title}</h2>

            {viewingPost.cover_image_url && (
              <img src={viewingPost.cover_image_url} alt={viewingPost.title} className="w-full h-56 object-cover rounded-xl" />
            )}

            <div
              className="text-xs text-gray-800 leading-relaxed prose max-w-none"
              dangerouslySetInnerHTML={{ __html: viewingPost.content || viewingPost.excerpt || 'Chưa có nội dung.' }}
            />

            <div className="pt-3 border-t flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingPost(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deletingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-border-subtle-medium">
            <Trash2 size={32} className="mx-auto text-status-error" />
            <h3 className="text-base font-bold text-gray-900">Xóa bài viết / sự kiện?</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Bạn có chắc chắn muốn xóa bài viết "{deletingPost.title}"?
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingPost(null)} disabled={deleting}>
                Hủy
              </Button>
              <Button variant="danger" size="sm" loading={deleting} onClick={handleDeletePost}>
                Xóa vĩnh viễn
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* NOTICE MODAL */}
      {noticeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-border-subtle-medium">
            <h3 className="text-base font-bold text-gray-900">{noticeModal.title}</h3>
            <p className="text-xs text-text-muted leading-relaxed">{noticeModal.message}</p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => setNoticeModal({ ...noticeModal, open: false })}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
