import React from 'react';
import { Upload, Plus, Star, UserCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import Button from '../../ui/Button';

export default function MediaQuickActions({
  hasCover = false,
  hasAvatar = false,
  onOpenUpload,
  onSelectCategory
}) {
  const isMissingCoverOrAvatar = !hasCover || !hasAvatar;

  return (
    <div className="space-y-4">
      {/* Missing Cover / Avatar Alert Banners */}
      {isMissingCoverOrAvatar && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {!hasCover && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">Chưa có ảnh bìa </h4>
                  <p className="text-[11px] text-amber-700">Ảnh bìa giúp thu hút khách hàng khi tìm kiếm sân.</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="xs"
                className="bg-white text-amber-800 border-amber-300 hover:bg-amber-100 flex-shrink-0"
                onClick={() => onSelectCategory && onSelectCategory('COVER')}
              >
                Thiết lập ngay
              </Button>
            </div>
          )}

          {!hasAvatar && (
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={18} className="text-indigo-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">Chưa có ảnh đại diện</h4>
                  <p className="text-[11px] text-indigo-700">Tải logo/ảnh đại diện để đại diện thương hiệu venue.</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="xs"
                className="bg-white text-indigo-800 border-indigo-300 hover:bg-indigo-100 flex-shrink-0"
                onClick={() => onSelectCategory && onSelectCategory('AVATAR')}
              >
                Thiết lập ngay
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Quick Action Toolbar */}
      <div className="p-3 bg-surface border border-border-subtle rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 px-2">
          <span>Thao tác nhanh:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="xs"
            leftIcon={<Upload size={14} />}
            onClick={() => onOpenUpload && onOpenUpload('VENUE')}
          >
            Tải ảnh sân
          </Button>

          <Button
            variant="secondary"
            size="xs"
            leftIcon={<Plus size={14} />}
            onClick={() => onOpenUpload && onOpenUpload('MULTI')}
          >
            Tải nhiều ảnh cùng lúc
          </Button>

          <Button
            variant="outline"
            size="xs"
            leftIcon={<Star size={14} className="text-amber-500" />}
            onClick={() => onOpenUpload && onOpenUpload('COVER')}
          >
            Tải ảnh bìa mới
          </Button>

          <Button
            variant="outline"
            size="xs"
            leftIcon={<UserCheck size={14} className="text-indigo-500" />}
            onClick={() => onOpenUpload && onOpenUpload('AVATAR')}
          >
            Tải ảnh đại diện mới
          </Button>
        </div>
      </div>
    </div>
  );
}
