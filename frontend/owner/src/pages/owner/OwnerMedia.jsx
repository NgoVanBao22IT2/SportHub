import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import {
  getOwnerVenues,
  getOwnerVenueMedia,
  getOwnerMediaStats,
  uploadOwnerMedia,
  updateOwnerMedia,
  deleteOwnerMedia,
  bulkDeleteOwnerMedia,
  bulkUpdateOwnerMedia,
  setOwnerCoverImage,
  setOwnerAvatarImage,
  reorderOwnerMedia
} from '../../api/owner';

// Design System & Utility Components
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

// Domain Subcomponents
import MediaHeader from '../../components/domain/media/MediaHeader';
import MediaStats from '../../components/domain/media/MediaStats';
import MediaQuickActions from '../../components/domain/media/MediaQuickActions';
import MediaCategoryTabs from '../../components/domain/media/MediaCategoryTabs';
import MediaFilters from '../../components/domain/media/MediaFilters';
import MediaCard from '../../components/domain/media/MediaCard';
import MediaList from '../../components/domain/media/MediaList';
import MediaUploadModal from '../../components/domain/media/MediaUploadModal';
import MediaPreviewLightbox from '../../components/domain/media/MediaPreviewLightbox';
import MediaEditModal from '../../components/domain/media/MediaEditModal';
import MediaBulkActionBar from '../../components/domain/media/MediaBulkActionBar';

export default function OwnerMedia() {
  // 1. VENUES STATE
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [loadingVenues, setLoadingVenues] = useState(true);

  // 2. MEDIA LIST & PAGINATION STATE
  const [mediaList, setMediaList] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [errorMedia, setErrorMedia] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 24, total: 0, totalPages: 1 });

  // 3. STATS STATE
  const [mediaStats, setMediaStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(true);

  // 4. FILTER & SEARCH STATE
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // 5. BULK SELECTION STATE
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // 6. MODAL STATES
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('VENUE');
  const [uploading, setUploading] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [lightboxItem, setLightboxItem] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Notice & Confirm Dialog State
  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null, type: 'warning' });

  // Debounce search timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Owner Venues
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

  // Fetch Media Stats
  const fetchStats = useCallback(async () => {
    if (!selectedVenueId) return;
    try {
      setLoadingStats(true);
      const res = await getOwnerMediaStats(selectedVenueId);
      setMediaStats(res?.data || {});
    } catch (err) {
      console.error('Failed to fetch media stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [selectedVenueId]);

  // Fetch Media List
  const fetchMedia = useCallback(async (pageTarget = 1) => {
    if (!selectedVenueId) return;

    try {
      setLoadingMedia(true);
      setErrorMedia(null);

      const params = {
        page: pageTarget,
        limit: pagination.limit,
        image_type: activeCategory,
        status: statusFilter,
        search: debouncedSearch,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder
      };

      const res = await getOwnerVenueMedia(selectedVenueId, params);
      setMediaList(res?.data || []);
      if (res?.meta) {
        setPagination(res.meta);
      }
    } catch (err) {
      console.error('Failed to fetch venue media gallery:', err);
      setErrorMedia('Không thể tải thư viện hình ảnh. Vui lòng thử lại.');
    } finally {
      setLoadingMedia(false);
    }
  }, [selectedVenueId, activeCategory, statusFilter, debouncedSearch, dateFrom, dateTo, sortBy, sortOrder, pagination.limit]);

  useEffect(() => {
    if (selectedVenueId) {
      fetchStats();
      fetchMedia(1);
      setSelectedIds([]);
    }
  }, [selectedVenueId, activeCategory, statusFilter, debouncedSearch, dateFrom, dateTo, sortBy, sortOrder, fetchStats, fetchMedia]);

  // Reset Filters
  const handleResetFilters = () => {
    setActiveCategory('ALL');
    setSearchQuery('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setSortBy('created_at');
    setSortOrder('DESC');
  };

  // Selection Handlers
  const handleToggleSelect = (imageId) => {
    setSelectedIds((prev) =>
      prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(mediaList.map((i) => i.image_id));
    } else {
      setSelectedIds([]);
    }
  };

  // 1. Upload Submit Handler
  const handleUploadSubmit = async (payload) => {
    try {
      setUploading(true);
      const formData = new FormData();
      payload.files.forEach((file) => formData.append('images', file));
      formData.append('image_type', payload.category);
      if (payload.title) formData.append('title', payload.title);
      if (payload.caption) formData.append('caption', payload.caption);
      if (payload.altText) formData.append('alt_text', payload.altText);
      if (payload.tags) formData.append('tags', payload.tags);
      if (payload.status) formData.append('status', payload.status);
      if (payload.eventId) formData.append('event_id', payload.eventId);
      if (payload.promotionId) formData.append('promotion_id', payload.promotionId);

      await uploadOwnerMedia(selectedVenueId, formData);

      setNoticeModal({
        open: true,
        title: 'Tải ảnh thành công',
        message: `Đã tải lên ${payload.files.length} hình ảnh thành công.`,
        type: 'success'
      });

      setIsUploadOpen(false);
      setActiveCategory('ALL');
      fetchStats();
      fetchMedia(1);
    } catch (err) {
      console.error('Failed to upload media:', err);
      setNoticeModal({
        open: true,
        title: 'Tải ảnh thất bại',
        message: err.response?.data?.error?.message || 'Có lỗi xảy ra trong quá trình tải tệp.',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  // 2. Set Cover Handler
  const handleSetCover = (item) => {
    setConfirmModal({
      open: true,
      title: 'Xác nhận thay đổi Ảnh bìa',
      message: `Ảnh bìa hiện tại của venue sẽ được thay thế bằng ảnh "${item.title || 'này'}". Bạn có chắc chắn muốn thực hiện?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await setOwnerCoverImage(item.image_id);
          setNoticeModal({
            open: true,
            title: 'Thành công',
            message: 'Đã thiết lập làm Ảnh bìa (Cover) của sân thành công.',
            type: 'success'
          });
          fetchStats();
          fetchMedia(pagination.page);
        } catch (err) {
          console.error('Set cover error:', err);
          setNoticeModal({
            open: true,
            title: 'Lỗi',
            message: 'Không thể thiết lập ảnh bìa. Vui lòng thử lại.',
            type: 'error'
          });
        }
      }
    });
  };

  // 3. Set Avatar Handler
  const handleSetAvatar = (item) => {
    setConfirmModal({
      open: true,
      title: 'Xác nhận thay đổi Ảnh đại diện',
      message: `Ảnh đại diện hiện tại sẽ được thay thế bằng ảnh "${item.title || 'này'}". Bạn có chắc chắn muốn thực hiện?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await setOwnerAvatarImage(item.image_id);
          setNoticeModal({
            open: true,
            title: 'Thành công',
            message: 'Đã thiết lập làm Ảnh đại diện (Avatar) của sân thành công.',
            type: 'success'
          });
          fetchStats();
          fetchMedia(pagination.page);
        } catch (err) {
          console.error('Set avatar error:', err);
          setNoticeModal({
            open: true,
            title: 'Lỗi',
            message: 'Không thể thiết lập ảnh đại diện. Vui lòng thử lại.',
            type: 'error'
          });
        }
      }
    });
  };

  // 4. Edit Submit Handler
  const handleEditSubmit = async (imageId, payload) => {
    try {
      setSavingEdit(true);
      await updateOwnerMedia(imageId, payload);
      setNoticeModal({
        open: true,
        title: 'Cập nhật thành công',
        message: 'Đã cập nhật thông tin hình ảnh thành công.',
        type: 'success'
      });
      setIsEditOpen(false);
      setEditingItem(null);
      fetchStats();
      fetchMedia(pagination.page);
    } catch (err) {
      console.error('Failed to update media:', err);
      setNoticeModal({
        open: true,
        title: 'Lỗi cập nhật',
        message: 'Không thể cập nhật thông tin hình ảnh. Vui lòng thử lại.',
        type: 'error'
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // 5. Delete Single Image Handler
  const handleDeleteItem = (item) => {
    const isCoverOrAvatar = item.is_cover || item.is_avatar;
    const warningMsg = isCoverOrAvatar
      ? ` ⚠️ CHÚ Ý: Ảnh này hiện đang làm ${item.is_cover ? 'Ảnh bìa' : 'Ảnh đại diện'} của venue!`
      : '';

    setConfirmModal({
      open: true,
      title: 'Xác nhận xóa hình ảnh',
      message: `Bạn có chắc muốn xóa hình ảnh "${item.title || 'này'}"? Hành động này không thể hoàn tác.${warningMsg}`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteOwnerMedia(item.image_id);
          setNoticeModal({
            open: true,
            title: 'Đã xóa',
            message: 'Đã xóa hình ảnh thành công.',
            type: 'success'
          });
          if (isLightboxOpen) setIsLightboxOpen(false);
          fetchStats();
          fetchMedia(pagination.page);
        } catch (err) {
          console.error('Delete media error:', err);
          setNoticeModal({
            open: true,
            title: 'Lỗi xóa ảnh',
            message: 'Không thể xóa hình ảnh. Vui lòng thử lại.',
            type: 'error'
          });
        }
      }
    });
  };

  // 6. Bulk Delete Handler
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;

    setConfirmModal({
      open: true,
      title: `Xác nhận xóa ${selectedIds.length} hình ảnh`,
      message: `Bạn có chắc muốn xóa hàng loạt ${selectedIds.length} hình ảnh đã chọn? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          setBulkActionLoading(true);
          await bulkDeleteOwnerMedia(selectedVenueId, selectedIds);
          setNoticeModal({
            open: true,
            title: 'Xóa hàng loạt thành công',
            message: `Đã xóa ${selectedIds.length} hình ảnh.`,
            type: 'success'
          });
          setSelectedIds([]);
          fetchStats();
          fetchMedia(1);
        } catch (err) {
          console.error('Bulk delete error:', err);
          setNoticeModal({
            open: true,
            title: 'Lỗi xóa hàng loạt',
            message: 'Không thể thực hiện xóa hàng loạt. Vui lòng thử lại.',
            type: 'error'
          });
        } finally {
          setBulkActionLoading(false);
        }
      }
    });
  };

  // 7. Bulk Update Category Handler
  const handleBulkUpdateCategory = async (newCategory) => {
    if (selectedIds.length === 0) return;
    try {
      setBulkActionLoading(true);
      await bulkUpdateOwnerMedia(selectedVenueId, selectedIds, { category: newCategory });
      setNoticeModal({
        open: true,
        title: 'Cập nhật danh mục thành công',
        message: `Đã chuyển ${selectedIds.length} ảnh sang danh mục mới.`,
        type: 'success'
      });
      setSelectedIds([]);
      fetchStats();
      fetchMedia(pagination.page);
    } catch (err) {
      console.error('Bulk category update error:', err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // 8. Bulk Update Status Handler
  const handleBulkUpdateStatus = async (newStatus) => {
    if (selectedIds.length === 0) return;
    try {
      setBulkActionLoading(true);
      await bulkUpdateOwnerMedia(selectedVenueId, selectedIds, { status: newStatus });
      setNoticeModal({
        open: true,
        title: 'Cập nhật trạng thái thành công',
        message: `Đã cập nhật trạng thái xuất bản cho ${selectedIds.length} ảnh.`,
        type: 'success'
      });
      setSelectedIds([]);
      fetchStats();
      fetchMedia(pagination.page);
    } catch (err) {
      console.error('Bulk status update error:', err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Copy Link helper
  const handleCopyLink = (url) => {
    if (url) {
      navigator.clipboard.writeText(url);
      setNoticeModal({
        open: true,
        title: 'Đã sao chép',
        message: 'Đã sao chép đường dẫn hình ảnh vào bộ nhớ tạm.',
        type: 'success'
      });
    }
  };

  // Lightbox Navigation Handlers
  const handleNextLightbox = () => {
    if (!lightboxItem || mediaList.length === 0) return;
    const currentIndex = mediaList.findIndex((i) => i.image_id === lightboxItem.image_id);
    const nextIndex = (currentIndex + 1) % mediaList.length;
    setLightboxItem(mediaList[nextIndex]);
  };

  const handlePrevLightbox = () => {
    if (!lightboxItem || mediaList.length === 0) return;
    const currentIndex = mediaList.findIndex((i) => i.image_id === lightboxItem.image_id);
    const prevIndex = (currentIndex - 1 + mediaList.length) % mediaList.length;
    setLightboxItem(mediaList[prevIndex]);
  };

  return (
    <div className="w-full space-y-6 pb-24">
      {/* 1. TOP HEADER & VENUE SELECTOR */}
      <MediaHeader
        venues={venues}
        selectedVenueId={selectedVenueId}
        onSelectVenue={setSelectedVenueId}
        onOpenUpload={() => {
          setUploadCategory('VENUE');
          setIsUploadOpen(true);
        }}
        loadingVenues={loadingVenues}
      />

      {/* 2. SUMMARY / STATISTICS CARDS */}
      <MediaStats stats={mediaStats} loading={loadingStats} />

      {/* 3. QUICK ACTIONS & ALERTS */}
      <MediaQuickActions
        hasCover={mediaStats.hasCover}
        hasAvatar={mediaStats.hasAvatar}
        onOpenUpload={(cat) => {
          setUploadCategory(cat === 'MULTI' ? 'VENUE' : cat);
          setIsUploadOpen(true);
        }}
        onSelectCategory={(cat) => {
          setUploadCategory(cat);
          setIsUploadOpen(true);
        }}
      />

      {/* 4. CATEGORY TABS WITH COUNTERS */}
      <MediaCategoryTabs
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        stats={mediaStats}
      />

      {/* 5. FILTERS BAR & VIEW MODE */}
      <MediaFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onResetFilters={handleResetFilters}
      />

      {/* 6. MEDIA CONTENT AREA (GRID / LIST / LOADING / EMPTY / ERROR) */}
      <div>
        {loadingMedia ? (
          // Skeleton Grid Loading
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="p-2 space-y-2">
                <Skeleton variant="rectangular" height="140px" className="rounded-xl" />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="40%" />
              </Card>
            ))}
          </div>
        ) : errorMedia ? (
          // Error State
          <div className="py-12">
            <ErrorState
              title="Không thể tải thư viện hình ảnh"
              description={errorMedia}
              action={
                <Button variant="primary" leftIcon={<RefreshCw size={16} />} onClick={() => fetchMedia(pagination.page)}>
                  Thử lại
                </Button>
              }
            />
          </div>
        ) : mediaList.length === 0 ? (
          // Empty State
          <div className="py-12 bg-surface border border-border-subtle rounded-2xl">
            <EmptyState
              icon={<ImageIcon size={48} className="text-text-muted/60" />}
              title="Chưa có hình ảnh"
              description="Thêm hình ảnh để khách hàng có thể tìm hiểu chi tiết về không gian và chất lượng sân của bạn."
              action={
                <Button
                  variant="primary"
                  leftIcon={<Plus size={16} />}
                  onClick={() => {
                    setUploadCategory('VENUE');
                    setIsUploadOpen(true);
                  }}
                >
                  + Tải ảnh đầu tiên
                </Button>
              }
            />
          </div>
        ) : (
          // Media Grid or List View
          <div>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {mediaList.map((item) => (
                  <MediaCard
                    key={item.image_id}
                    item={item}
                    isSelected={selectedIds.includes(item.image_id)}
                    onToggleSelect={handleToggleSelect}
                    onPreview={(it) => {
                      setLightboxItem(it);
                      setIsLightboxOpen(true);
                    }}
                    onEdit={(it) => {
                      setEditingItem(it);
                      setIsEditOpen(true);
                    }}
                    onSetCover={handleSetCover}
                    onSetAvatar={handleSetAvatar}
                    onDelete={handleDeleteItem}
                    onCopyLink={handleCopyLink}
                  />
                ))}
              </div>
            ) : (
              <MediaList
                items={mediaList}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onPreview={(it) => {
                  setLightboxItem(it);
                  setIsLightboxOpen(true);
                }}
                onEdit={(it) => {
                  setEditingItem(it);
                  setIsEditOpen(true);
                }}
                onSetCover={handleSetCover}
                onSetAvatar={handleSetAvatar}
                onDelete={handleDeleteItem}
                onCopyLink={handleCopyLink}
              />
            )}

            {/* 7. PAGINATION CONTROL BAR */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-surface border border-border-subtle rounded-2xl shadow-2xs">
                <span className="text-xs text-text-muted">
                  Hiển thị {(pagination.page - 1) * pagination.limit + 1} –{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} trên tổng số{' '}
                  <strong className="text-gray-900">{pagination.total}</strong> media
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    leftIcon={<ChevronLeft size={14} />}
                    disabled={pagination.page <= 1}
                    onClick={() => fetchMedia(pagination.page - 1)}
                  >
                    Trang trước
                  </Button>

                  <div className="flex items-center gap-1 px-2">
                    {[...Array(pagination.totalPages)].map((_, idx) => {
                      const p = idx + 1;
                      if (
                        p === 1 ||
                        p === pagination.totalPages ||
                        (p >= pagination.page - 1 && p <= pagination.page + 1)
                      ) {
                        return (
                          <button
                            key={p}
                            onClick={() => fetchMedia(p)}
                            className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                              pagination.page === p
                                ? 'bg-accent-primary text-white shadow-2xs'
                                : 'text-text-muted hover:bg-gray-100'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      }
                      if (p === pagination.page - 2 || p === pagination.page + 2) {
                        return <span key={p} className="text-xs text-text-muted">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="xs"
                    rightIcon={<ChevronRight size={14} />}
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchMedia(pagination.page + 1)}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 8. STICKY BULK ACTION BAR */}
      <MediaBulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkDelete={handleBulkDelete}
        onBulkUpdateCategory={handleBulkUpdateCategory}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        loading={bulkActionLoading}
      />

      {/* 9. MODALS */}
      {/* Upload Modal */}
      <MediaUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSubmitUpload={handleUploadSubmit}
        initialCategory={uploadCategory}
        uploading={uploading}
      />

      {/* Edit Modal */}
      <MediaEditModal
        item={editingItem}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingItem(null);
        }}
        onSubmitEdit={handleEditSubmit}
        saving={savingEdit}
      />

      {/* Lightbox Modal */}
      <MediaPreviewLightbox
        item={lightboxItem}
        items={mediaList}
        isOpen={isLightboxOpen}
        onClose={() => {
          setIsLightboxOpen(false);
          setLightboxItem(null);
        }}
        onPrev={handlePrevLightbox}
        onNext={handleNextLightbox}
        onSetCover={handleSetCover}
        onSetAvatar={handleSetAvatar}
        onEdit={(it) => {
          setIsLightboxOpen(false);
          setEditingItem(it);
          setIsEditOpen(true);
        }}
        onDelete={handleDeleteItem}
        onCopyLink={handleCopyLink}
      />

      {/* Confirmation Dialog */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl border border-border-subtle shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  confirmModal.type === 'danger'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-bold text-gray-900">{confirmModal.title}</h3>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
              >
                Hủy
              </Button>
              <Button
                variant={confirmModal.type === 'danger' ? 'danger' : 'primary'}
                size="sm"
                onClick={() => {
                  setConfirmModal((prev) => ({ ...prev, open: false }));
                  confirmModal.onConfirm && confirmModal.onConfirm();
                }}
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notice Toast Modal */}
      {noticeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl border border-border-subtle shadow-xl w-full max-w-sm p-5 space-y-3 text-center animate-in fade-in zoom-in duration-150">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center text-xl bg-accent-primary/10 text-accent-primary">
              {noticeModal.type === 'success' ? '✅' : noticeModal.type === 'error' ? '❌' : 'ℹ️'}
            </div>
            <h3 className="text-sm font-bold text-gray-900">{noticeModal.title}</h3>
            <p className="text-xs text-text-muted">{noticeModal.message}</p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => setNoticeModal((prev) => ({ ...prev, open: false }))}
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
