import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  Plus,
  RefreshCw,
  MapPin,
  Phone,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { getOwnerVenues } from '../../api/owner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';

export default function OwnerVenues() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOwnerVenues();
      if (res && res.data) {
        setVenues(res.data);
      } else if (Array.isArray(res)) {
        setVenues(res);
      }
    } catch (err) {
      console.error('Error fetching owner venues:', err);
      setError(err.message || 'Không thể tải danh sách câu lạc bộ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  // Filter venues
  const filteredVenues = venues.filter((v) => {
    const matchesSearch =
      (v.venue_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.venue_description || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'APPROVED') return matchesSearch && v.operating_status === 'APPROVED';
    if (statusFilter === 'PENDING') return matchesSearch && v.operating_status === 'PENDING';
    return matchesSearch;
  });

  return (
    <div className="space-y-6">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border-subtle-medium shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-brand-orange" size={24} />
            Câu lạc bộ của tôi
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Quản lý danh sách các cơ sở, chi nhánh và sân thể thao do bạn làm chủ sở hữu.
          </p>
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

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Tìm kiếm tên câu lạc bộ hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
            size="sm"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:border-brand-orange focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="APPROVED">Đang hoạt động</option>
            <option value="PENDING">Chờ duyệt</option>
          </select>
        </div>
      </div>

      {/* VENUE CARDS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} padding="md" radius="2xl" className="space-y-4">
              <Skeleton width="100%" height="120px" radius="xl" />
              <Skeleton width="60%" height="20px" />
              <Skeleton width="40%" height="14px" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="py-8">
          <ErrorState title="Lỗi tải danh sách câu lạc bộ" description={error} onRetry={fetchVenues} />
        </div>
      ) : filteredVenues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((v) => {
            const totalCourts = (v.branches || []).reduce((sum, b) => sum + (b.courts || []).length, 0);
            const branchCount = (v.branches || []).length;
            const isApproved = v.operating_status === 'APPROVED';

            return (
              <Card
                key={v.venue_id}
                padding="none"
                radius="2xl"
                className="border border-border-subtle-medium overflow-hidden bg-surface hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-bold text-gray-900 text-base line-clamp-1">{v.venue_name}</h2>
                      <p className="text-xs text-brand-orange font-bold mt-0.5">
                        {v.sport_type || 'Thể thao tổng hợp'}
                      </p>
                    </div>
                    <Badge variant={isApproved ? 'success' : 'warning'} size="xs">
                      {isApproved ? 'HOẠT ĐỘNG' : 'CHỜ DUYỆT'}
                    </Badge>
                  </div>

                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                    {v.venue_description || 'Cơ sở sân thể thao đạt tiêu chuẩn cao cấp.'}
                  </p>

                  <div className="pt-2 border-t border-border-subtle grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-text-muted block text-[11px]">Số chi nhánh:</span>
                      <span className="font-bold text-gray-900">{branchCount} cơ sở</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[11px]">Tổng số sân con:</span>
                      <span className="font-extrabold text-brand-orange">{totalCourts} sân</span>
                    </div>
                  </div>

                  {v.contact_phone && (
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      <Phone size={13} className="text-brand-orange" />
                      <span>{v.contact_phone}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-surface-subtle border-t border-border-subtle flex items-center justify-between">
                  <span className="text-[11px] font-mono text-text-muted">ID: #{v.venue_id?.substring(0, 8)}</span>
                  <Link to={`/owner/venues/${v.venue_id}`}>
                    <Button variant="primary" size="sm" rightIcon={<ChevronRight size={14} />}>
                      Quản lý chi tiết
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-text-muted text-xs space-y-2 bg-surface rounded-2xl border border-border-subtle-medium">
          <Building2 size={36} className="mx-auto text-gray-300" />
          <p className="font-bold text-gray-900 text-sm">Bạn chưa khởi tạo câu lạc bộ nào</p>
          <p>Danh sách câu lạc bộ của bạn sẽ xuất hiện tại đây.</p>
        </div>
      )}

    </div>
  );
}
