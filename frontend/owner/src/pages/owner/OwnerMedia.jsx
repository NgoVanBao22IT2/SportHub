import { useState, useEffect, useCallback } from 'react';
import {
  Image,
  Upload,
  Search,
  RefreshCw,
  Trash2,
  Star,
  CheckCircle,
  X,
  Plus,
  ArrowUpDown,
  Edit2,
  FileImage,
  Sparkles,
  Info,
  Building2
} from 'lucide-react';
import {
  getOwnerVenues,
  getOwnerVenueMedia,
  uploadOwnerMedia,
  updateOwnerMedia,
  deleteOwnerMedia,
  setOwnerCoverImage,
  setOwnerAvatarImage,
  reorderOwnerMedia
} from '../../api/owner';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

const IMAGE_TYPES = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'COVER', label: 'Ảnh bìa (Cover)' },
  { id: 'AVATAR', label: 'Ảnh đại diện (Avatar)' },
  { id: 'VENUE', label: 'Ảnh sân & Không gian' },
  { id: 'FACILITY', label: 'Ảnh tiện ích' },
  { id: 'EVENT', label: 'Ảnh sự kiện' },
  { id: 'PROMOTION', label: 'Ảnh khuyến mãi' },
  { id: 'TOURNAMENT', label: 'Ảnh giải đấu' },
  { id: 'COURSE', label: 'Ảnh khóa học' },
  { id: 'OTHER', label: 'Các ảnh khác' }
];

export default function OwnerMedia() {
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [loadingVenues, setLoadingVenues] = useState(true);

  const [mediaList, setMediaList] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadCategory, setUploadCategory] = useState('VENUE');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadAltText, setUploadAltText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Edit Modal State
  const [editingImage, setEditingImage] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editAltText, setEditAltText] = useState('');
  const [editType, setEditType] = useState('VENUE');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Confirm Modal State
  const [deletingImage, setDeletingImage] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Notice Modal State
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

  // 2. Fetch Media List for selected venue
  const fetchMedia = useCallback(async () => {
    if (!selectedVenueId) return;

    try {
      setLoadingMedia(true);
      setError(null);

      const params = {
        image_type: activeCategory,
        search: searchQuery
      };

      const res = await getOwnerVenueMedia(selectedVenueId, params);
      setMediaList(res?.data || []);
    } catch (err) {
      console.error('Failed to fetch venue media gallery:', err);
      setError('Không thể tải thư viện hình ảnh. Vui lòng thử lại.');
    } finally {
      setLoadingMedia(false);
    }
  }, [selectedVenueId, activeCategory, searchQuery]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Handle Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(Array.from(e.target.files));
    }
  };

  const handleFileSelection = (newFiles) => {
    const valid = [];
    for (const f of newFiles) {
      if (f.size > 10 * 1024 * 1024) {
        setNoticeModal({ open: true, title: 'Dung lượng quá lớn', message: `Tệp ${f.name} vượt quá dung lượng tối đa 10MB.`, type: 'error' });
        continue;
      }
      valid.push({
        file: f,
        preview: URL.createObjectURL(f)
      });
    }
    setUploadFiles(prev => [...prev, ...valid]);
  };

  const removeUploadFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Submit Upload
  const handleUploadSubmit = async () => {
    if (uploadFiles.length === 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      uploadFiles.forEach(item => {
        formData.append('images', item.file);
      });
      formData.append('image_type', uploadCategory);
      formData.append('title', uploadTitle);
      formData.append('caption', uploadCaption);
      formData.append('alt_text', uploadAltText);

      await uploadOwnerMedia(selectedVenueId, formData);
      setNoticeModal({ open: true, title: 'Thành công', message: `Đã tải lên ${uploadFiles.length} hình ảnh thành công.`, type: 'success' });

      // Reset Form & Close
      setIsUploadOpen(false);
      setUploadFiles([]);
      setUploadTitle('');
      setUploadCaption('');
      setUploadAltText('');
      fetchMedia();
    } catch (err) {
      console.error('Failed to upload media:', err);
      const msg = err.response?.data?.error?.message || 'Tải ảnh lên thất bại. Vui lòng kiểm tra định dạng và thử lại.';
      setNoticeModal({ open: true, title: 'Tải ảnh thất bại', message: msg, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // Set Cover Image
  const handleSetCover = async (image) => {
    try {
      await setOwnerCoverImage(image.image_id);
      setNoticeModal({ open: true, title: 'Thành công', message: 'Đã thiết lập ảnh làm Ảnh Bìa (Cover) của sân.', type: 'success' });
      fetchMedia();
    } catch (err) {
      console.error('Failed to set cover image:', err);
      setNoticeModal({ open: true, title: 'Thao tác thất bại', message: 'Không thể đặt ảnh làm ảnh bìa.', type: 'error' });
    }
  };

  // Set Avatar Image
  const handleSetAvatar = async (image) => {
    try {
      await setOwnerAvatarImage(image.image_id);
      setNoticeModal({ open: true, title: 'Thành công', message: 'Đã thiết lập ảnh làm Ảnh Đại Diện (Avatar) của sân.', type: 'success' });
      fetchMedia();
    } catch (err) {
      console.error('Failed to set avatar image:', err);
      setNoticeModal({ open: true, title: 'Thao tác thất bại', message: 'Không thể đặt ảnh làm ảnh đại diện.', type: 'error' });
    }
  };

  // Open Edit Modal
  const openEditModal = (image) => {
    setEditingImage(image);
    setEditTitle(image.title || '');
    setEditCaption(image.caption || '');
    setEditAltText(image.alt_text || '');
    setEditType(image.image_type || 'VENUE');
  };

  // Save Edit Metadata
  const handleSaveEdit = async () => {
    if (!editingImage) return;

    try {
      setSavingEdit(true);
      await updateOwnerMedia(editingImage.image_id, {
        title: editTitle,
        caption: editCaption,
        alt_text: editAltText,
        image_type: editType
      });

      setNoticeModal({ open: true, title: 'Thành công', message: 'Đã cập nhật thông tin hình ảnh.', type: 'success' });
      setEditingImage(null);
      fetchMedia();
    } catch (err) {
      console.error('Failed to update image info:', err);
      setNoticeModal({ open: true, title: 'Lỗi cập nhật', message: 'Không thể lưu thay đổi.', type: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deletingImage) return;

    try {
      setDeleting(true);
      await deleteOwnerMedia(deletingImage.image_id);
      setNoticeModal({ open: true, title: 'Thành công', message: 'Đã xóa hình ảnh khỏi thư viện.', type: 'success' });
      setDeletingImage(null);
      fetchMedia();
    } catch (err) {
      console.error('Failed to delete image:', err);
      setNoticeModal({ open: true, title: 'Thao tác thất bại', message: 'Không thể xóa hình ảnh này.', type: 'error' });
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
            <Image className="text-brand-orange" size={28} />
            Quản lý Thư viện Hình ảnh & Media
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Tải lên, tổ chức danh mục hình ảnh và thiết lập ảnh bìa/ảnh đại diện ấn tượng cho sân thể thao của bạn.
          </p>
        </div>

        {/* VENUE SELECTOR DROPDOWN & UPLOAD BUTTON */}
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
            onClick={() => setIsUploadOpen(true)}
          >
            Tải ảnh mới
          </Button>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="bg-surface p-4 rounded-2xl border border-border-subtle-medium space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          {/* CATEGORY SCROLL BAR */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-none">
            {IMAGE_TYPES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'bg-brand-orange text-white font-bold shadow-xs'
                      : 'bg-surface-subtle text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* SEARCH INPUT */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-3 text-text-muted" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-surface-subtle border border-border-subtle-medium rounded-xl focus:outline-none focus:border-brand-orange"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-text-muted hover:text-gray-900"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MEDIA GALLERY GRID */}
      {loadingMedia ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} radius="xl" className="overflow-hidden p-0 border border-border-subtle-medium">
              <Skeleton variant="rectangular" height="180px" />
              <div className="p-3 space-y-2">
                <Skeleton variant="text" width="75%" height="1rem" />
                <Skeleton variant="text" width="40%" height="0.8rem" />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Lỗi nạp hình ảnh"
          description={error}
          action={
            <Button variant="outline" size="sm" onClick={fetchMedia} leftIcon={<RefreshCw size={14} />}>
              Thử lại
            </Button>
          }
        />
      ) : mediaList.length === 0 ? (
        <EmptyState
          title="Chưa có hình ảnh nào"
          description="Chưa có ảnh trong danh mục này. Hãy tải lên ảnh đẹp mắt để thu hút khách hàng đặt sân."
          action={
            <Button variant="primary" size="sm" leftIcon={<Upload size={14} />} onClick={() => setIsUploadOpen(true)}>
              Tải ảnh ngay
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {mediaList.map((img) => {
            const displayUrl = img.medium_url || img.image_url;
            return (
              <div
                key={img.image_id}
                className="group relative bg-surface rounded-2xl border border-border-subtle-medium overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* IMAGE THUMBNAIL */}
                <div className="relative aspect-4/3 bg-gray-100 overflow-hidden">
                  <img
                    src={displayUrl}
                    alt={img.alt_text || img.title || 'Venue image'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* BADGES */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
                    {img.is_cover && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-brand-orange text-white shadow-xs">
                        ẢNH BÌA (COVER)
                      </span>
                    )}
                    {img.is_avatar && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-accent-primary text-white shadow-xs">
                        ẢNH ĐẠI DIỆN
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-dark/70 text-white backdrop-blur-xs">
                      {img.image_type}
                    </span>
                  </div>

                  {/* HOVER QUICK ACTIONS */}
                  <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 backdrop-blur-xs">
                    {!img.is_cover && (
                      <button
                        onClick={() => handleSetCover(img)}
                        className="px-2.5 py-1.5 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg text-[11px] font-semibold transition-colors shadow-sm"
                        title="Đặt làm Ảnh bìa của Sân"
                      >
                        Đặt Ảnh Bìa
                      </button>
                    )}
                    {!img.is_avatar && (
                      <button
                        onClick={() => handleSetAvatar(img)}
                        className="px-2.5 py-1.5 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-lg text-[11px] font-semibold transition-colors shadow-sm"
                        title="Đặt làm Ảnh đại diện của Sân"
                      >
                        Đặt Avatar
                      </button>
                    )}
                  </div>
                </div>

                {/* CARD BODY */}
                <div className="p-3.5 space-y-1.5">
                  <h4 className="text-xs font-bold text-gray-900 truncate" title={img.title || 'Hình ảnh sân'}>
                    {img.title || 'Hình ảnh sân'}
                  </h4>
                  {img.caption && (
                    <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                      {img.caption}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-text-muted pt-1 border-t border-gray-100">
                    <span>{img.file_size ? `${(img.file_size / 1024).toFixed(0)} KB` : 'WebP'}</span>
                    <span>{new Date(img.created_at || Date.now()).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                {/* CARD ACTIONS FOOTER */}
                <div className="px-3.5 py-2 bg-surface-subtle border-t border-border-subtle-medium flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(img)}
                    className="p-1.5 text-text-muted hover:text-brand-orange rounded-lg hover:bg-surface transition-colors"
                    title="Chỉnh sửa thông tin"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeletingImage(img)}
                    className="p-1.5 text-text-muted hover:text-status-error rounded-lg hover:bg-surface transition-colors"
                    title="Xóa hình ảnh"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-border-subtle-medium max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle-medium pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Upload size={18} className="text-brand-orange" />
                Tải lên Hình ảnh mới
              </h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-text-muted hover:text-gray-900">
                <X size={18} />
              </button>
            </div>

            {/* DRAG AND DROP ZONE */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                dragActive ? 'border-brand-orange bg-brand-orange/5' : 'border-gray-300 hover:border-brand-orange/60 bg-surface-subtle'
              }`}
            >
              <FileImage size={36} className="mx-auto text-brand-orange mb-2" />
              <p className="text-xs font-semibold text-gray-800">
                Kéo thả nhiều ảnh vào đây hoặc{' '}
                <label className="text-brand-orange cursor-pointer hover:underline">
                  bấm để chọn file
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-[11px] text-text-muted mt-1">
                Định dạng hỗ trợ: JPG, PNG, WEBP (Tối đa 10MB mỗi file)
              </p>
            </div>

            {/* PREVIEW FILES LIST */}
            {uploadFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-900">Đã chọn ({uploadFiles.length} file):</p>
                <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 bg-surface-subtle rounded-xl border border-gray-200">
                  {uploadFiles.map((item, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-300 aspect-square">
                      <img src={item.preview} alt="preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeUploadFile(idx)}
                        className="absolute top-1 right-1 bg-dark/70 text-white rounded-full p-0.5 hover:bg-status-error"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FORM INPUTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Loại danh mục ảnh</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full text-xs bg-surface-subtle border border-border-subtle-medium rounded-xl p-2.5 focus:outline-none focus:border-brand-orange"
                >
                  {IMAGE_TYPES.filter(t => t.id !== 'ALL').map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Tiêu đề ảnh (tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Sân cầu lông số 1"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full text-xs bg-surface-subtle border border-border-subtle-medium rounded-xl p-2.5 focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">Ghi chú / Mô tả ngắn</label>
              <textarea
                rows={2}
                placeholder="Ví dụ: Mặt thảm thảm PVC chống trượt đạt tiêu chuẩn thi đấu..."
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                className="w-full text-xs bg-surface-subtle border border-border-subtle-medium rounded-xl p-2.5 focus:outline-none focus:border-brand-orange"
              />
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle-medium">
              <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(false)} disabled={uploading}>
                Hủy
              </Button>

              <Button
                variant="primary"
                size="sm"
                loading={uploading}
                disabled={uploadFiles.length === 0}
                onClick={handleUploadSubmit}
                leftIcon={<Upload size={14} />}
              >
                Xác nhận Tải lên
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-border-subtle-medium">
            <div className="flex items-center justify-between border-b border-border-subtle-medium pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Edit2 size={16} className="text-brand-orange" />
                Chỉnh sửa thông tin hình ảnh
              </h3>
              <button onClick={() => setEditingImage(null)} className="text-text-muted hover:text-gray-900">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Danh mục ảnh</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full text-xs bg-surface-subtle border border-border-subtle-medium rounded-xl p-2.5 focus:outline-none focus:border-brand-orange"
                >
                  {IMAGE_TYPES.filter(t => t.id !== 'ALL').map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Tiêu đề ảnh</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs bg-surface-subtle border border-border-subtle-medium rounded-xl p-2.5 focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">Mô tả / Caption</label>
                <textarea
                  rows={2}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full text-xs bg-surface-subtle border border-border-subtle-medium rounded-xl p-2.5 focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle-medium">
              <Button variant="outline" size="sm" onClick={() => setEditingImage(null)} disabled={savingEdit}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" loading={savingEdit} onClick={handleSaveEdit}>
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deletingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-border-subtle-medium">
            <Trash2 size={32} className="mx-auto text-status-error" />
            <h3 className="text-base font-bold text-gray-900">Xác nhận xóa hình ảnh?</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Bạn có chắc chắn muốn xóa hình ảnh này khỏi thư viện? Thao tác này sẽ xóa vĩnh viễn file trên hệ thống.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingImage(null)} disabled={deleting}>
                Hủy
              </Button>
              <Button variant="danger" size="sm" loading={deleting} onClick={handleDeleteConfirm}>
                Xóa ngay
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
