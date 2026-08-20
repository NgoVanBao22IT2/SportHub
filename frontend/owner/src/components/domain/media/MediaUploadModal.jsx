import React, { useState, useEffect } from 'react';
import { Upload, X, FileImage, CheckCircle, AlertCircle, RefreshCw, Plus, Sparkles } from 'lucide-react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';

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

export default function MediaUploadModal({
  isOpen = false,
  onClose,
  onSubmitUpload,
  initialCategory = 'VENUE',
  uploading = false
}) {
  const [uploadFiles, setUploadFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [category, setCategory] = useState(initialCategory);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('PUBLISHED');
  const [eventId, setEventId] = useState('');
  const [promotionId, setPromotionId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(Array.from(e.target.files));
    }
  };

  const handleFileSelection = (newFiles) => {
    setErrorMessage('');
    const valid = [];
    for (const f of newFiles) {
      if (f.size > 10 * 1024 * 1024) {
        setErrorMessage(`Tệp ${f.name} vượt quá dung lượng tối đa 10MB.`);
        continue;
      }
      valid.push({
        file: f,
        preview: URL.createObjectURL(f)
      });
    }
    setUploadFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (index) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (uploadFiles.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 file hình ảnh.');
      return;
    }

    const payload = {
      files: uploadFiles.map((item) => item.file),
      category,
      title,
      caption,
      altText,
      tags,
      status,
      eventId: category === 'EVENT' ? eventId : null,
      promotionId: category === 'PROMOTION' ? promotionId : null
    };

    onSubmitUpload && onSubmitUpload(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-surface rounded-2xl border border-border-subtle shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        {/* MODAL HEADER */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-subtle">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-accent-primary/10 text-accent-primary rounded-xl">
              <Upload size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Tải lên hình ảnh & Media</h2>
              <p className="text-xs text-text-muted">Kéo thả hoặc chọn nhiều hình ảnh từ máy tính</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-text-muted hover:text-gray-900 hover:bg-gray-200/60 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* DRAG & DROP ZONE */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 ${
              dragActive
                ? 'border-accent-primary bg-accent-primary/5 scale-[0.99]'
                : 'border-border-subtle hover:border-accent-primary/50 bg-surface-subtle/40'
            }`}
          >
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileChange}
              className="hidden"
              id="owner-media-upload-input"
            />
            <label htmlFor="owner-media-upload-input" className="cursor-pointer flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 text-accent-primary flex items-center justify-center mb-1">
                <FileImage size={24} />
              </div>
              <span className="text-sm font-bold text-gray-800">
                Kéo & thả hình ảnh vào đây
              </span>
              <span className="text-xs text-text-muted mt-0.5">
                hoặc <span className="text-accent-primary font-semibold underline">Chọn ảnh từ máy tính</span>
              </span>
              <span className="text-[11px] text-text-muted/80 mt-1">
                Hỗ trợ JPG, PNG, WEBP (Tối đa 10MB/tệp)
              </span>
            </label>
          </div>

          {/* PREVIEW FILES GRID */}
          {uploadFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                <span>Danh sách tệp đã chọn ({uploadFiles.length})</span>
                <button
                  type="button"
                  onClick={() => setUploadFiles([])}
                  className="text-rose-600 hover:underline text-[11px]"
                >
                  Xóa tất cả
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-border-subtle">
                {uploadFiles.map((item, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg bg-gray-200 overflow-hidden border border-border-subtle">
                    <img src={item.preview} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-rose-600 transition"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* METADATA FORM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-subtle">
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Danh mục ảnh <span className="text-rose-500">*</span>
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
                Trạng thái xuất bản
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary outline-none"
              >
                <option value="PUBLISHED">Công khai</option>
                <option value="DRAFT">Lưu nháp</option>
              </select>
            </div>

            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tiêu đề hình ảnh (không bắt buộc)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Sân cầu lông 01 - Không gian thoáng mát"
                className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary outline-none"
              />
            </div>

            {/* Caption / Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mô tả chi tiết
              </label>
              <textarea
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Mô tả về hình ảnh..."
                className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary outline-none"
              />
            </div>

            {/* Category specific fields */}
            {category === 'EVENT' && (
              <div className="sm:col-span-2 p-3 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1">
                  <Sparkles size={12} /> Thông tin sự kiện liên kết
                </span>
                <input
                  type="text"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  placeholder="Tên hoặc ID Sự kiện..."
                  className="w-full px-3 py-2 bg-surface border border-rose-200 rounded-xl text-xs text-gray-900 outline-none"
                />
              </div>
            )}
          </div>

          {/* ACTIONS FOOTER */}
          <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-2">
            <Button variant="ghost" size="md" onClick={onClose} disabled={uploading}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={uploadFiles.length === 0 || uploading}
              leftIcon={uploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
            >
              {uploading ? `Đang tải lên (${uploadFiles.length})...` : `Tải lên (${uploadFiles.length}) ảnh`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
