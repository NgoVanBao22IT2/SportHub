import { useState, useEffect } from 'react';
import { Tag, Plus, CheckCircle2, AlertCircle, RefreshCw, Shield, Coffee, Wifi, Car, Zap, Lock, Utensils } from 'lucide-react';
import { getOwnerVenues, getOwnerFacilities, assignOwnerFacility, removeOwnerFacility } from '../../api/owner';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function OwnerServices() {
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [allFacilities, setAllFacilities] = useState([]);
  const [assignedFacilityIds, setAssignedFacilityIds] = useState(new Set());

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'success' });

  // 1. Fetch Owner's Venues
  const fetchVenues = async () => {
    try {
      setLoading(true);
      const res = await getOwnerVenues();
      const venueList = res.data || res || [];
      setVenues(venueList);

      if (venueList.length > 0) {
        const defaultVenue = venueList[0];
        setSelectedVenueId(defaultVenue.venue_id);
        const assignedIds = new Set((defaultVenue.facilities || []).map((f) => f.facility_id));
        setAssignedFacilityIds(assignedIds);
      }
    } catch (err) {
      console.error('Failed to fetch owner venues:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Platform Facilities
  const fetchFacilities = async () => {
    try {
      const res = await getOwnerFacilities();
      setAllFacilities(res.data || res || []);
    } catch (err) {
      console.error('Failed to fetch facilities:', err);
    }
  };

  useEffect(() => {
    fetchVenues();
    fetchFacilities();
  }, []);

  const handleVenueChange = (e) => {
    const vId = e.target.value;
    setSelectedVenueId(vId);
    const targetVenue = venues.find((v) => v.venue_id === vId);
    if (targetVenue) {
      const assignedIds = new Set((targetVenue.facilities || []).map((f) => f.facility_id));
      setAssignedFacilityIds(assignedIds);
    }
  };

  const handleToggleFacility = async (facilityId) => {
    if (!selectedVenueId) return;

    const isAssigned = assignedFacilityIds.has(facilityId);

    try {
      setActionLoadingId(facilityId);
      if (isAssigned) {
        await removeOwnerFacility(selectedVenueId, facilityId);
        setAssignedFacilityIds((prev) => {
          const next = new Set(prev);
          next.delete(facilityId);
          return next;
        });
      } else {
        await assignOwnerFacility(selectedVenueId, { facility_id: facilityId });
        setAssignedFacilityIds((prev) => new Set(prev).add(facilityId));
      }
      // Refresh venues list to update in-memory objects
      const res = await getOwnerVenues();
      setVenues(res.data || res || []);
    } catch (err) {
      console.error('Failed to update facility assignment:', err);
      setNoticeModal({
        open: true,
        title: 'Thao tác thất bại',
        message: err.response?.data?.message || 'Không thể cập nhật tiện ích cho cụm sân.',
        type: 'error'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Tag className="text-brand-orange" size={26} />
            Quản lý Tiện Ích & Dịch Vụ Cụm Sân
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Bật/Tắt các dịch vụ đi kèm và tiện ích (Wifi, Đèn chiếu sáng, Căn tin, Thuê vợt...) cho cụm sân của bạn.
          </p>
        </div>
      </div>

      {/* VENUE SELECTOR */}
      <Card padding="md" radius="xl" className="border border-border-subtle-medium shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <label className="text-xs font-bold text-gray-900 shrink-0">Chọn cụm sân áp dụng:</label>
            <select
              value={selectedVenueId}
              onChange={handleVenueChange}
              className="w-full sm:w-80 px-4 py-2 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:outline-none focus:border-brand-orange"
            >
              {venues.map((v) => (
                <option key={v.venue_id} value={v.venue_id}>
                  🏬 {v.venue_name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={fetchVenues}
          >
            Làm mới
          </Button>
        </div>
      </Card>

      {/* FACILITIES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-text-muted text-xs">
            Đang nạp danh sách tiện ích từ MySQL...
          </div>
        ) : allFacilities.length === 0 ? (
          <div className="col-span-full py-12 text-center text-text-muted text-xs">
            Chưa có danh mục tiện ích nào trên hệ thống.
          </div>
        ) : (
          allFacilities.map((fac) => {
            const isAssigned = assignedFacilityIds.has(fac.facility_id);
            const isLoading = actionLoadingId === fac.facility_id;

            return (
              <Card
                key={fac.facility_id}
                padding="md"
                radius="xl"
                className={[
                  'border transition-all duration-200 flex items-center justify-between gap-3 shadow-xs',
                  isAssigned
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-border-subtle-medium bg-surface'
                ].join(' ')}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                    isAssigned ? 'bg-emerald-500 text-white' : 'bg-surface-subtle text-text-muted'
                  }`}>
                    <Tag size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-xs truncate">{fac.facility_name}</h3>
                    <p className="text-[11px] text-text-muted truncate">{fac.facility_icon || 'Dịch vụ tiện ích'}</p>
                  </div>
                </div>

                <Button
                  variant={isAssigned ? 'primary' : 'outline'}
                  size="sm"
                  disabled={isLoading}
                  onClick={() => handleToggleFacility(fac.facility_id)}
                >
                  {isLoading ? '...' : isAssigned ? '✓ Bật' : '+ Thêm'}
                </Button>
              </Card>
            );
          })
        )}
      </div>

      {/* NOTICE MODAL */}
      {noticeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-border-subtle-medium">
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold">
              {noticeModal.type === 'success' ? (
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertCircle size={28} />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">{noticeModal.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{noticeModal.message}</p>
            </div>

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
