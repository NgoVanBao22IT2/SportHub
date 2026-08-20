import React, { useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  UserCheck,
  Edit2,
  Trash2,
  Calendar,
  HardDrive,
  User,
  Tag,
  Copy,
  ExternalLink,
  Info
} from 'lucide-react';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';

import { getImageUrl } from '../../../utils/imageUrl';

export default function MediaPreviewLightbox({
  item,
  items = [],
  isOpen = false,
  onClose,
  onPrev,
  onNext,
  onSetCover,
  onSetAvatar,
  onEdit,
  onDelete,
  onCopyLink
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose && onClose();
      if (e.key === 'ArrowLeft') onPrev && onPrev();
      if (e.key === 'ArrowRight') onNext && onNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onPrev, onNext]);

  if (!isOpen || !item) return null;

  const currentIndex = items.findIndex((i) => i.image_id === item.image_id);
  const totalCount = items.length;

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN');
  };

  const rawUrl = item.large_url || item.original_url || item.image_url;
  const fullImageUrl = getImageUrl(rawUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-6 overflow-hidden">
      {/* TOP BAR / CLOSE BUTTON */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        {totalCount > 1 && (
          <span className="text-xs font-semibold text-white/70 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
            {currentIndex + 1} / {totalCount}
          </span>
        )}
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          title="Đóng (ESC)"
        >
          <X size={20} />
        </button>
      </div>

      {/* PREVIOUS BUTTON */}
      {totalCount > 1 && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          title="Ảnh trước (Mũi tên trái)"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* NEXT BUTTON */}
      {totalCount > 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          title="Ảnh sau (Mũi tên phải)"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* MAIN CONTAINER */}
      <div className="w-full h-full max-w-6xl flex flex-col md:flex-row bg-surface rounded-2xl overflow-hidden shadow-2xl border border-white/10 my-auto">
        {/* LEFT: IMAGE VIEWPORT */}
        <div className="flex-1 bg-black/95 flex items-center justify-center relative p-4 overflow-hidden min-h-[300px] md:min-h-[500px]">
          <img
            src={fullImageUrl}
            alt={item.alt_text || item.title || 'Full Image'}
            className="max-w-full max-h-full object-contain transition duration-200"
          />
        </div>

        {/* RIGHT: METADATA & ACTIONS SIDEBAR */}
        <div className="w-full md:w-80 lg:w-96 bg-surface border-t md:border-t-0 md:border-l border-border-subtle p-5 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4">
            {/* Header & Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {item.is_cover && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1">
                    <Star size={10} className="fill-current" /> Ảnh Bìa
                  </span>
                )}
                {item.is_avatar && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white flex items-center gap-1">
                    <UserCheck size={10} /> Avatar
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                  {item.image_type || 'VENUE'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                  {item.status || 'PUBLISHED'}
                </span>
              </div>

              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {item.title || 'Ảnh chưa đặt tên'}
              </h2>
              {item.caption && (
                <p className="text-xs text-text-muted leading-relaxed">
                  {item.caption}
                </p>
              )}
            </div>

            {/* Metadata Detail List */}
            <div className="p-3 bg-surface-subtle border border-border-subtle rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-700">
                <span className="text-text-muted flex items-center gap-1">
                  <HardDrive size={13} /> Dung lượng:
                </span>
                <span className="font-semibold">{formatFileSize(item.file_size)}</span>
              </div>

              <div className="flex items-center justify-between text-gray-700">
                <span className="text-text-muted flex items-center gap-1">
                  <Calendar size={13} /> Ngày tải lên:
                </span>
                <span className="font-medium">{formatDate(item.created_at)}</span>
              </div>

              {item.mime_type && (
                <div className="flex items-center justify-between text-gray-700">
                  <span className="text-text-muted">Định dạng:</span>
                  <span className="font-mono uppercase">{item.mime_type.replace('image/', '')}</span>
                </div>
              )}

              {item.tags && (
                <div className="pt-1 border-t border-border-subtle">
                  <span className="text-text-muted flex items-center gap-1 mb-1">
                    <Tag size={12} /> Tags:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.split(',').map((tag, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-white border border-border-subtle rounded-md text-[10px] text-gray-700">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS FOOTER */}
          <div className="space-y-2 pt-4 border-t border-border-subtle">
            {!item.is_cover && (
              <Button
                variant="outline"
                size="sm"
                fullWidth
                leftIcon={<Star size={16} className="text-amber-500" />}
                onClick={() => onSetCover && onSetCover(item)}
              >
                Đặt làm Ảnh Bìa 
              </Button>
            )}

            {!item.is_avatar && (
              <Button
                variant="outline"
                size="sm"
                fullWidth
                leftIcon={<UserCheck size={16} className="text-indigo-500" />}
                onClick={() => onSetAvatar && onSetAvatar(item)}
              >
                Đặt làm Ảnh Đại Diện 
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Edit2 size={14} />}
                onClick={() => onEdit && onEdit(item)}
              >
                Chỉnh sửa
              </Button>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<Copy size={14} />}
                onClick={() => onCopyLink && onCopyLink(item.image_url)}
              >
                Copy Link
              </Button>
            </div>

            <Button
              variant="danger"
              size="sm"
              fullWidth
              leftIcon={<Trash2 size={14} />}
              onClick={() => onDelete && onDelete(item)}
              className="mt-2"
            >
              Xóa hình ảnh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
