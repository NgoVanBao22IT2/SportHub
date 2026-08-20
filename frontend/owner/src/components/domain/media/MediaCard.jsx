import React, { useState } from 'react';
import {
  Eye,
  Edit2,
  Trash2,
  Star,
  UserCheck,
  MoreVertical,
  Check,
  Copy,
  Calendar,
  HardDrive,
  Sparkles,
  Tag
} from 'lucide-react';
import Badge from '../../ui/Badge';
import { getImageUrl, FALLBACK_SPORT_IMAGE } from '../../../utils/imageUrl';

export default function MediaCard({
  item,
  isSelected = false,
  onToggleSelect,
  onPreview,
  onEdit,
  onSetCover,
  onSetAvatar,
  onDelete,
  onCopyLink
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryBadge = (type) => {
    switch (type) {
      case 'COVER':
        return <Badge variant="warning">ẢNH BÌA</Badge>;
      case 'AVATAR':
        return <Badge variant="info">ẢNH ĐẠI DIỆN</Badge>;
      case 'VENUE':
        return <Badge variant="success">ẢNH SÂN</Badge>;
      case 'FACILITY':
        return <Badge variant="neutral">TIỆN ÍCH</Badge>;
      case 'EVENT':
        return <Badge variant="danger">SỰ KIỆN</Badge>;
      case 'PROMOTION':
        return <Badge variant="warning">KHUYẾN MÃI</Badge>;
      case 'TOURNAMENT':
        return <Badge variant="primary">GIẢI ĐẤU</Badge>;
      case 'COURSE':
        return <Badge variant="info">KHÓA HỌC</Badge>;
      default:
        return <Badge variant="neutral">KHÁC</Badge>;
    }
  };

  const rawUrl = item.thumbnail_url || item.medium_url || item.image_url;
  const initialUrl = getImageUrl(rawUrl);
  const [currentSrc, setCurrentSrc] = useState(initialUrl);

  React.useEffect(() => {
    setCurrentSrc(getImageUrl(item.thumbnail_url || item.medium_url || item.image_url));
    setImgError(false);
  }, [item]);

  const handleImageError = () => {
    if (currentSrc !== FALLBACK_SPORT_IMAGE) {
      setCurrentSrc(FALLBACK_SPORT_IMAGE);
    } else {
      setImgError(true);
    }
  };

  return (
    <div
      className={`group relative bg-surface border rounded-2xl overflow-hidden transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col ${
        isSelected
          ? 'border-accent-primary ring-2 ring-accent-primary/20'
          : 'border-border-subtle hover:border-gray-300'
      }`}
    >
      {/* 1. IMAGE CONTAINER WITH ASPECT RATIO */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden cursor-pointer" onClick={() => onPreview && onPreview(item)}>
        {!imgError ? (
          <img
            src={currentSrc}
            alt={item.alt_text || item.title || 'Media Image'}
            loading="lazy"
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-4 text-center">
            <span className="text-2xl font-bold mb-1">🖼️</span>
            <span className="text-xs">Không thể tải ảnh</span>
          </div>
        )}

        {/* TOP OVERLAY BADGES */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10 pointer-events-none">
          {item.is_cover && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
              <Star size={10} className="fill-current" /> BÌA
            </span>
          )}
          {item.is_avatar && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-xs">
              <UserCheck size={10} /> AVATAR
            </span>
          )}
          {item.status === 'DRAFT' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-800/80 text-white shadow-xs backdrop-blur-xs">
              DRAFT
            </span>
          )}
          {item.status === 'ARCHIVED' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
              ARCHIVED
            </span>
          )}
        </div>

        {/* CHECKBOX MULTI-SELECT HANDLE */}
        <div
          className="absolute top-2.5 right-2.5 z-20 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect && onToggleSelect(item.image_id);
          }}
        >
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition border ${
              isSelected
                ? 'bg-accent-primary border-accent-primary text-white shadow-xs'
                : 'bg-black/30 backdrop-blur-xs border-white/40 text-transparent hover:bg-black/50'
            }`}
          >
            <Check size={14} className="stroke-[3]" />
          </div>
        </div>

        {/* HOVER ACTION OVERLAY BUTTONS */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-4 pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview && onPreview(item);
            }}
            className="p-2 rounded-xl bg-white/90 hover:bg-white text-gray-800 shadow-sm transition hover:scale-110"
            title="Xem phóng to (Preview)"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit && onEdit(item);
            }}
            className="p-2 rounded-xl bg-white/90 hover:bg-white text-gray-800 shadow-sm transition hover:scale-110"
            title="Chỉnh sửa thông tin"
          >
            <Edit2 size={16} />
          </button>
          {!item.is_cover && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetCover && onSetCover(item);
              }}
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition hover:scale-110"
              title="Đặt làm Ảnh Bìa"
            >
              <Star size={16} />
            </button>
          )}
          {!item.is_avatar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetAvatar && onSetAvatar(item);
              }}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition hover:scale-110"
              title="Đặt làm Ảnh Đại Diện"
            >
              <UserCheck size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. CARD CONTENT AREA */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-1">
            <h3
              className="text-xs font-bold text-gray-900 truncate hover:text-accent-primary cursor-pointer"
              onClick={() => onPreview && onPreview(item)}
              title={item.title || 'Không có tên'}
            >
              {item.title || 'Ảnh chưa đặt tên'}
            </h3>

            {/* CONTEXT MENU (⋮) */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-lg text-text-muted hover:text-gray-900 hover:bg-gray-100 transition"
              >
                <MoreVertical size={14} />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-44 bg-surface border border-border-subtle rounded-xl shadow-lg z-40 py-1 text-xs">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onPreview && onPreview(item);
                      }}
                      className="w-full px-3 py-2 text-left text-gray-700 hover:bg-surface-subtle flex items-center gap-2"
                    >
                      <Eye size={14} /> Xem chi tiết
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit && onEdit(item);
                      }}
                      className="w-full px-3 py-2 text-left text-gray-700 hover:bg-surface-subtle flex items-center gap-2"
                    >
                      <Edit2 size={14} /> Chỉnh sửa
                    </button>
                    {!item.is_cover && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onSetCover && onSetCover(item);
                        }}
                        className="w-full px-3 py-2 text-left text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                      >
                        <Star size={14} /> Đặt làm ảnh bìa
                      </button>
                    )}
                    {!item.is_avatar && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onSetAvatar && onSetAvatar(item);
                        }}
                        className="w-full px-3 py-2 text-left text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
                      >
                        <UserCheck size={14} /> Đặt làm ảnh đại diện
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onCopyLink && onCopyLink(item.image_url);
                      }}
                      className="w-full px-3 py-2 text-left text-gray-700 hover:bg-surface-subtle flex items-center gap-2"
                    >
                      <Copy size={14} /> Sao chép link ảnh
                    </button>
                    <div className="border-t border-border-subtle my-1" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete && onDelete(item);
                      }}
                      className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <Trash2 size={14} /> Xóa hình ảnh
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {getCategoryBadge(item.image_type)}
          </div>
        </div>

        {/* METADATA FOOTER */}
        <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border-subtle">
          <span className="flex items-center gap-1">
            <HardDrive size={11} /> {formatFileSize(item.file_size)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={11} /> {formatDate(item.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
