import React from 'react';
import { Eye, Edit2, Trash2, Star, UserCheck, Copy, HardDrive, Calendar, Check } from 'lucide-react';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';

import { getImageUrl } from '../../../utils/imageUrl';

export default function MediaList({
  items = [],
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onPreview,
  onEdit,
  onSetCover,
  onSetAvatar,
  onDelete,
  onCopyLink
}) {
  const isAllSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.image_id));

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
      case 'COVER': return <Badge variant="warning">ẢNH BÌA</Badge>;
      case 'AVATAR': return <Badge variant="info">AVATAR</Badge>;
      case 'VENUE': return <Badge variant="success">ẢNH SÂN</Badge>;
      case 'FACILITY': return <Badge variant="neutral">TIỆN ÍCH</Badge>;
      case 'EVENT': return <Badge variant="danger">SỰ KIỆN</Badge>;
      case 'PROMOTION': return <Badge variant="warning">KHUYẾN MÃI</Badge>;
      case 'TOURNAMENT': return <Badge variant="primary">GIẢI ĐẤU</Badge>;
      case 'COURSE': return <Badge variant="info">KHÓA HỌC</Badge>;
      default: return <Badge variant="neutral">KHÁC</Badge>;
    }
  };

  return (
    <div className="w-full bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-700 border-collapse">
          <thead>
            <tr className="bg-surface-subtle border-b border-border-subtle font-semibold text-text-muted">
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                  aria-label="Chọn tất cả hình ảnh"
                  className="w-4 h-4 text-accent-primary rounded border-border-subtle focus:ring-accent-primary cursor-pointer"
                />
              </th>
              <th className="p-3 min-w-[200px]">Hình ảnh & Tiêu đề</th>
              <th className="p-3">Danh mục</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Dung lượng</th>
              <th className="p-3">Ngày tải lên</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.image_id);
              const rawUrl = item.thumbnail_url || item.medium_url || item.image_url;
              const imageUrl = getImageUrl(rawUrl);

              return (
                <tr
                  key={item.image_id}
                  className={`hover:bg-surface-subtle/60 transition ${
                    isSelected ? 'bg-accent-primary/5' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect && onToggleSelect(item.image_id)}
                      aria-label={`Chọn hình ảnh ${item.title || 'chưa đặt tên'}`}
                      className="w-4 h-4 text-accent-primary rounded border-border-subtle focus:ring-accent-primary cursor-pointer"
                    />
                  </td>

                  {/* Thumbnail & Title */}
                  <td className="p-3">
                    <div
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => onPreview && onPreview(item)}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-border-subtle relative">
                        <img
                          src={imageUrl}
                          alt={item.title || 'Thumbnail'}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate group-hover:text-accent-primary transition">
                          {(item.title || 'Ảnh chưa đặt tên')
                            .replace(/AÌ[\s\S]?nh|AÌ‰nh/g, 'Ảnh')
                            .replace(/biÌ[\s\S]?a|biÌ€a/g, 'bìa')
                            .normalize('NFC')}
                        </div>
                        <div className="text-[11px] text-text-muted truncate max-w-[240px]">
                          {item.caption || item.alt_text || item.image_url}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {getCategoryBadge(item.image_type)}
                    </div>
                  </td>

                  {/* Status Badges */}
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {item.is_cover && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                          COVER
                        </span>
                      )}
                      {item.is_avatar && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                          AVATAR
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {item.status || 'PUBLISHED'}
                      </span>
                    </div>
                  </td>

                  {/* File Size */}
                  <td className="p-3 text-text-muted font-mono">
                    {formatFileSize(item.file_size)}
                  </td>

                  {/* Upload Date */}
                  <td className="p-3 text-text-muted">
                    {formatDate(item.created_at)}
                  </td>

                  {/* Action Buttons */}
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onPreview && onPreview(item)}
                        title="Xem phóng to"
                      >
                        <Eye size={14} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onEdit && onEdit(item)}
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={14} />
                      </Button>

                      {!item.is_cover && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onSetCover && onSetCover(item)}
                          title="Đặt làm ảnh bìa"
                          className="text-amber-600 hover:bg-amber-50"
                        >
                          <Star size={14} />
                        </Button>
                      )}

                      {!item.is_avatar && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onSetAvatar && onSetAvatar(item)}
                          title="Đặt làm ảnh đại diện"
                          className="text-indigo-600 hover:bg-indigo-50"
                        >
                          <UserCheck size={14} />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onDelete && onDelete(item)}
                        title="Xóa hình ảnh"
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
