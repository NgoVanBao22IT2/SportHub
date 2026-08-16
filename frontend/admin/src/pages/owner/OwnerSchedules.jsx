import { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Building2,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  User,
  DollarSign
} from 'lucide-react';
import {
  getOwnerVenues,
  getVenueDailyAvailability,
  blockCourtSlot,
  unblockCourtSlot
} from '../../api/owner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import BlockSlotModal from '../../components/domain/BlockSlotModal';

export default function OwnerSchedules() {
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [matrixData, setMatrixData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Action states
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedSlotToBlock, setSelectedSlotToBlock] = useState(null);
  const [selectedCourtToBlock, setSelectedCourtToBlock] = useState(null);

  const [unblockConfirm, setUnblockConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch initial list of owner venues
  useEffect(() => {
    async function loadOwnerVenues() {
      try {
        const res = await getOwnerVenues();
        const vList = res?.data || res || [];
        setVenues(vList);
        if (vList.length > 0) {
          setSelectedVenueId(vList[0].venue_id);
        }
      } catch (err) {
        console.error('Error fetching owner venues for schedule:', err);
        setError('Không thể tải danh sách câu lạc bộ.');
      }
    }
    loadOwnerVenues();
  }, []);

  // Fetch schedule matrix when venueId or date changes
  const fetchScheduleMatrix = useCallback(async () => {
    if (!selectedVenueId || !selectedDate) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getVenueDailyAvailability(selectedVenueId, selectedDate);
      if (res && res.data) {
        setMatrixData(res.data);
      } else {
        setMatrixData(res);
      }
    } catch (err) {
      console.error('Error fetching schedule matrix:', err);
      setError(err.response?.data?.error?.message || err.message || 'Không thể tải lịch sân.');
    } finally {
      setLoading(false);
    }
  }, [selectedVenueId, selectedDate]);

  useEffect(() => {
    fetchScheduleMatrix();
  }, [fetchScheduleMatrix]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open Block Modal
  const handleOpenBlockModal = (court, slot) => {
    if (slot.status !== 'AVAILABLE') return;
    setSelectedCourtToBlock(court);
    setSelectedSlotToBlock(slot);
    setBlockModalOpen(true);
  };

  // Confirm Block Slot
  const handleConfirmBlock = async (blockPayload) => {
    try {
      setActionLoading(true);
      await blockCourtSlot(blockPayload);
      showToast('Đã khóa khung giờ thành công!');
      setBlockModalOpen(false);
      fetchScheduleMatrix();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Lỗi khi khóa khung giờ';
      showToast('⚠️ ' + msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Unblock Slot
  const handleConfirmUnblock = async (blockId) => {
    try {
      setActionLoading(true);
      await unblockCourtSlot(blockId);
      showToast('Đã mở khóa khung giờ!');
      setUnblockConfirm(null);
      fetchScheduleMatrix();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi mở khóa khung giờ'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border-subtle-medium shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="text-brand-orange" size={24} />
            Quản lý lịch sân & Khung giờ
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Theo dõi khung giờ trống, khóa/mở khóa sân và kiểm tra tình trạng đặt sân thực tế theo thời gian thực.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw size={14} />}
          onClick={fetchScheduleMatrix}
        >
          Làm mới
        </Button>
      </div>

      {/* FILTER BAR & STATUS LEGEND */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-surface p-4 rounded-2xl border border-border-subtle-medium">
          
          {/* Venue Selector */}
          <div className="flex-1 space-y-1">
            <label className="text-[11px] font-bold text-text-muted uppercase">Chọn câu lạc bộ:</label>
            <select
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:border-brand-orange focus:outline-none"
            >
              {venues.map((v) => (
                <option key={v.venue_id} value={v.venue_id}>
                  {v.venue_name} ({v.sport_type || 'Thể thao tổng hợp'})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-text-muted uppercase">Chọn ngày xem lịch:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:border-brand-orange focus:outline-none"
            />
          </div>

        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 bg-surface-subtle p-3 rounded-xl border border-border-subtle text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-gray-800">Có thể đặt (Khả dụng)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="font-semibold text-gray-800">Đã được đặt / Chờ duyệt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="font-semibold text-gray-800">Đã bị Chủ sân khóa (Blocked)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            <span className="font-semibold text-gray-800">Bảo trì / Ngoại giờ</span>
          </div>
        </div>
      </div>

      {/* DAILY SCHEDULE MATRIX */}
      <Card padding="none" radius="2xl" className="border border-border-subtle-medium overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 space-y-4">
            <Skeleton width="100%" height="40px" radius="xl" />
            <Skeleton width="100%" height="200px" radius="xl" />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState title="Lỗi tải ma trận lịch sân" description={error} onRetry={fetchScheduleMatrix} />
          </div>
        ) : matrixData && matrixData.courts && matrixData.courts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-subtle border-b border-border-subtle text-text-muted font-bold">
                <tr>
                  <th className="py-3 px-4 min-w-[140px] sticky left-0 bg-surface-subtle z-10 border-r border-border-subtle">
                    Khung giờ
                  </th>
                  {matrixData.courts.map((court) => (
                    <th key={court.court_id} className="py-3 px-4 min-w-[160px] text-center border-r border-border-subtle">
                      <p className="font-bold text-gray-900 text-sm">{court.court_name}</p>
                      <p className="text-[11px] text-brand-orange font-normal">{court.sport_category}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-surface">
                {(matrixData.time_slots || []).map((slot, sIdx) => (
                  <tr key={sIdx} className="hover:bg-surface-subtle/50 transition-colors">
                    
                    {/* Time Label Column */}
                    <td className="py-2.5 px-4 font-mono font-bold text-gray-900 bg-surface-subtle/80 sticky left-0 z-10 border-r border-border-subtle">
                      {slot.start_time?.substring(0, 5)} - {slot.end_time?.substring(0, 5)}
                    </td>

                    {/* Court Slots Cells */}
                    {matrixData.courts.map((court) => {
                      const courtSlot = court.slots && court.slots[sIdx];
                      if (!courtSlot) return <td key={court.court_id} className="p-2 border-r">N/A</td>;

                      const st = courtSlot.status;

                      let cellBg = 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200';
                      let labelText = 'Có thể đặt';
                      let isClickable = true;

                      if (st === 'BOOKED' || st === 'CONFIRMED' || st === 'HOLDING') {
                        cellBg = 'bg-amber-50 text-amber-900 border-amber-200 cursor-not-allowed';
                        labelText = 'Đã đặt';
                        isClickable = false;
                      } else if (st === 'BLOCKED' || st === 'EVENT') {
                        cellBg = 'bg-red-50 hover:bg-red-100 text-red-900 border-red-200';
                        labelText = courtSlot.reason || 'Đã khóa';
                        isClickable = true;
                      } else if (st === 'UNAVAILABLE') {
                        cellBg = 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed';
                        labelText = courtSlot.reason || 'Bảo trì';
                        isClickable = false;
                      }

                      return (
                        <td
                          key={court.court_id}
                          className="p-2 text-center border-r border-border-subtle"
                        >
                          <div
                            onClick={() => {
                              if (st === 'AVAILABLE') {
                                handleOpenBlockModal(court, courtSlot);
                              } else if (st === 'BLOCKED' || st === 'EVENT') {
                                setUnblockConfirm({ court, slot: courtSlot });
                              }
                            }}
                            className={[
                              'p-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all',
                              cellBg,
                              isClickable ? 'cursor-pointer shadow-2xs hover:scale-98' : ''
                            ].join(' ')}
                            title={courtSlot.reason || labelText}
                          >
                            <span className="font-bold">{labelText}</span>
                            {courtSlot.price && (
                              <span className="text-[10px] font-extrabold opacity-80 mt-0.5">
                                {parseFloat(courtSlot.price).toLocaleString('vi-VN')}đ
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-text-muted text-xs space-y-2">
            <Building2 size={36} className="mx-auto text-gray-300" />
            <p className="font-bold text-gray-900 text-sm">Chưa có sân con nào</p>
            <p>Vui lòng tạo sân con trong mục Quản lý Câu lạc bộ trước khi xem lịch.</p>
          </div>
        )}
      </Card>

      {/* BLOCK SLOT MODAL */}
      <BlockSlotModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        court={selectedCourtToBlock}
        date={selectedDate}
        slot={selectedSlotToBlock}
        onConfirmBlock={handleConfirmBlock}
        loading={actionLoading}
      />

      {/* UNBLOCK CONFIRM DIALOG */}
      {unblockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-sm rounded-2xl border border-border-subtle-medium shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-brand-orange">
              <Unlock size={24} />
              <h3 className="font-bold text-gray-900 text-base">Xác nhận mở khóa khung giờ</h3>
            </div>
            <p className="text-gray-700">
              Bạn có chắc chắn muốn mở khóa khung giờ <strong>{unblockConfirm.slot?.label}</strong> của <strong>{unblockConfirm.court?.court_name}</strong> không? Khung giờ sẽ trở lại trạng thái <strong>AVAILABLE</strong> cho khách hàng đặt sân.
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
              <Button variant="outline" size="sm" onClick={() => setUnblockConfirm(null)} disabled={actionLoading}>
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={actionLoading}
                onClick={() => handleConfirmUnblock(unblockConfirm.slot?.block_id || unblockConfirm.slot?.id)}
              >
                Mở khóa ngay
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
