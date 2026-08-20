import React, { useState, useEffect, useRef } from 'react';
import { Edit2, X, Save, RefreshCw, Upload, Camera, RotateCcw, FileImage, CheckCircle } from 'lucide-react';
import Button from '../../ui/Button';
import { getImageUrl } from '../../../utils/imageUrl';

const CATEGORY_OPTIONS = [
  { id: 'VENUE', label: 'Ảnh sân & Không gian' },
  { id: 'COVER', label: 'Ảnh bìa (Cover)' },
  { id: 'AVATAR', label: 'Ảnh đại diện (Avatar)' },
  { id: 'FACILITY', label: 'Ảnh tiện ích' },
  { id: 'EVENT', label: 'Ảnh sự kiện' },
  { id: 'PROMOTION', label: 'Ảnh khuyến mãi' },
  { id: 'TOURNAMENT', label: 'Ảnh giải đấu' },
  { id: 'COURSE', label: 'Ảnh khóa học' },
  { id: 'OTHER', label: 'Khác' }
];

export default function MediaEditModal({
  item,
  isOpen = false,
  onClose,
  onSubmitEdit,
  saving = false
}) {
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('VENUE');
  const [status, setStatus] = useState('PUBLISHED');
  const [eventId, setEventId] = useState('');
  const [promotionId, setPromotionId] = useState('');

  // Image File Replacement state
  const [replacementFile, setReplacementFile] = useState(null);
  const [replacementPreview, setReplacementPreview] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setCaption(item.caption || '');
      setAltText(item.alt_text || '');
      setTags(item.tags || '');
      setCategory(item.image_type || 'VENUE');
      setStatus(item.status || 'PUBLISHED');
      setEventId(item.event_id || '');
      setPromotionId(item.promotion_id || '');
      setReplacementFile(null);
      setReplacementPreview('');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('Tệp hình ảnh vượt quá dung lượng tối đa 10MB.');
        return;
      }
      setReplacementFile(file);
      setReplacementPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveReplacement = () => {
    setReplacementFile(null);
    setReplacementPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (replacementFile) {
      // Send FormData for image file replacement
      const formData = new FormData();
      formData.append('image', replacementFile);
      formData.append('title', title);
      formData.append('caption', caption);
      formData.append('alt_text', altText);
      formData.append('tags', tags);
      formData.append('image_type', category);
      formData.append('status', status);
      if (eventId) formData.append('event_id', eventId);
      if (promotionId) formData.append('promotion_id', promotionId);

      onSubmitEdit && onSubmitEdit(item.image_id, formData);
    } else {
      // Send plain object for metadata update
      const payload = {
        title,
        caption,
        alt_text: altText,
        tags,
        image_type: category,
        status,
        event_id: eventId || null,
        promotion_id: promotionId || null
      };
      onSubmitEdit && onSubmitEdit(item.image_id, payload);
    }
  };

  const rawUrl = item.thumbnail_url || item.medium_url || item.image_url;
  const currentImageUrl = getImageUrl(rawUrl);
  const displayPreviewUrl = replacementPreview || currentImageUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-surface rounded-2xl border border-border-subtle shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        {/* MODAL HEADER */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-subtle">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-accent-primary/10 text-accent-primary rounded-xl">
              <Edit2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Chỉnh sửa thông tin & Thay đổi tệp ảnh</h2>
              <p className="text-xs text-text-muted">Cập nhật tiêu đề, danh mục hoặc tải lên ảnh thay thế</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-text-muted hover:text-gray-900 hover:bg-gray-200/60 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY FORM */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* IMAGE PREVIEW & FILE REPLACEMENT SECTION */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-border-subtle space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Camera size={15} className="text-accent-primary" /> Tệp hình ảnh hiển thị
              </span>
              {replacementFile && (
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle size={11} /> Đã chọn ảnh thay thế
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview Thumbnail */}
              <div className="w-24 h-24 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0 border border-border-subtle shadow-xs relative group">
                <img
                  src={displayPreviewUrl}
                  alt="Edit preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=300&auto=format&fit=crop';
                  }}
                />
              </div>

              {/* Action Buttons for Image Replacement */}
              <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                  id="owner-media-replace-input"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor="owner-media-replace-input">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      leftIcon={<Upload size={14} />}
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white border-gray-300 hover:bg-gray-100"
                    >
                      {replacementFile ? 'Chọn tệp khác' : 'Tải lên ảnh mới thay thế'}
                    </Button>
                  </label>

                  {replacementFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      leftIcon={<RotateCcw size={14} />}
                      onClick={handleRemoveReplacement}
                      className="text-rose-600 hover:bg-rose-50"
                    >
                      Khôi phục ảnh cũ
                    </Button>
                  )}
                </div>

                <p className="text-[11px] text-text-muted">
                  {replacementFile
                    ? `Tệp mới: ${replacementFile.name} (${(replacementFile.size / 1024).toFixed(1)} KB)`
                    : 'Nhấp để chọn tệp hình ảnh mới thay thế ảnh hiện tại nếu cần.'}
                </p>
              </div>
            </div>
          </div>

          {/* METADATA FIELDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Danh mục <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary outline-none"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary outline-none"
              >
                <option value="PUBLISHED">Công khai </option>
                <option value="DRAFT">Lưu nháp </option>
                <option value="ARCHIVED">Lưu trữ </option>
              </select>
            </div>

            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tiêu đề
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề hình ảnh..."
                className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary outline-none"
              />
            </div>

            {/* Caption */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Nhập mô tả chi tiết..."
                className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary outline-none"
              />
            </div>

            {/* Tags */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="san-cau-long, hall-a, vip"
                className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary outline-none"
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-2">
            <Button variant="ghost" size="md" onClick={onClose} disabled={saving}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={saving}
              leftIcon={saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            >
              {saving ? 'Đang lưu...' : replacementFile ? 'Cập nhật & Thay tệp ảnh' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
