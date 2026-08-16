import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, MapPin, Filter, X, RefreshCw, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { getFeaturedVenues, getSportsCategories } from '../api/venues';

// Design System Imports
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import VenueCard from '../components/domain/VenueCard';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State Management
  const [venues, setVenues] = useState([]);
  const [sportsList, setSportsList] = useState(['Tất cả']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Extract filter values from URL search parameters
  const selectedSport = searchParams.get('sport') || '';
  const selectedLocation = searchParams.get('location') || '';
  const searchQuery = searchParams.get('query') || '';
  const selectedSort = searchParams.get('sort') || 'default';

  // Local form inputs for Search Header
  const [inputQuery, setInputQuery] = useState(searchQuery);
  const [inputLocation, setInputLocation] = useState(selectedLocation);

  // Keep local input fields in sync when URL changes (e.g. Back/Forward button)
  useEffect(() => {
    setInputQuery(searchQuery);
    setInputLocation(selectedLocation);
  }, [searchQuery, selectedLocation]);

  // Fetch venue data & sports categories from API
  const fetchVenuesData = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [data, sports] = await Promise.all([
        getFeaturedVenues(3000),
        getSportsCategories()
      ]);
      setVenues(Array.isArray(data) ? data : []);
      if (Array.isArray(sports) && sports.length > 0) {
        setSportsList(['Tất cả', ...sports]);
      } else {
        setSportsList(['Tất cả', 'Pickleball', 'Cầu lông', 'Bóng đá', 'Quần vợt', 'Bóng chuyền', 'Bóng rổ']);
      }
    } catch (err) {
      console.error("Failed to load venues or sports for search", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenuesData();
  }, [fetchVenuesData]);

  // Update URL search parameters
  const updateParams = useCallback((newParams) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== 'Tất cả') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  // Submit Search Header Form
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    updateParams({
      query: inputQuery.trim(),
      location: inputLocation.trim(),
    });
  };

  // Select Sport Filter
  const handleSportSelect = (sport) => {
    updateParams({ sport: sport === 'Tất cả' ? '' : sport });
  };

  // Handle Sort Change
  const handleSortChange = (e) => {
    updateParams({ sort: e.target.value });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setInputQuery('');
    setInputLocation('');
    setSearchParams(new URLSearchParams());
    setIsMobileFilterOpen(false);
  };

  // Remove individual active filter chip
  const handleRemoveChip = (key) => {
    if (key === 'query') setInputQuery('');
    if (key === 'location') setInputLocation('');
    const params = new URLSearchParams(searchParams);
    params.delete(key);
    setSearchParams(params);
  };

  // Apply client-side filtering and sorting on fetched venue dataset
  const filteredVenues = useMemo(() => {
    if (!venues) return [];

    let result = [...venues];

    // 1. Filter by Sport Keyword (if selected)
    if (selectedSport && selectedSport !== 'Tất cả') {
      const sportLower = selectedSport.toLowerCase();
      result = result.filter(v => {
        const nameMatch = v.venue_name?.toLowerCase().includes(sportLower);
        const descMatch = v.venue_description?.toLowerCase().includes(sportLower);
        return nameMatch || descMatch;
      });
    }

    // 2. Filter by Location Text (if entered)
    if (selectedLocation) {
      const locLower = selectedLocation.toLowerCase();
      result = result.filter(v => {
        const branchLoc = v.branches && v.branches.length > 0
          ? `${v.branches[0].ward_district_city} ${v.branches[0].street_address}`.toLowerCase()
          : '';
        const locationProp = v.location?.toLowerCase() || '';
        return branchLoc.includes(locLower) || locationProp.includes(locLower);
      });
    }

    // 3. Filter by General Search Query
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      result = result.filter(v => {
        const nameMatch = v.venue_name?.toLowerCase().includes(queryLower);
        const descMatch = v.venue_description?.toLowerCase().includes(queryLower);
        return nameMatch || descMatch;
      });
    }

    // 4. Sorting
    if (selectedSort === 'rating') {
      result.sort((a, b) => (parseFloat(b.rating || 4.8) - parseFloat(a.rating || 4.8)));
    } else if (selectedSort === 'name') {
      result.sort((a, b) => (a.venue_name || '').localeCompare(b.venue_name || ''));
    }

    return result;
  }, [venues, selectedSport, selectedLocation, searchQuery, selectedSort]);

  // Check if any filter is active
  const hasActiveFilters = Boolean(selectedSport || selectedLocation || searchQuery || selectedSort !== 'default');

  return (
    <div className="w-full bg-surface-subtle min-h-screen pb-20">
      {/* 1. SEARCH HEADER HERO */}
      <section className="bg-dark text-white py-10 px-4 shadow-md border-b border-border-subtle-medium">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-6 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Tìm kiếm sân thể thao
            </h1>
            <p className="text-white/80 text-sm md:text-base">
              Khám phá và đặt lịch các câu lạc bộ thể thao uy tín hàng đầu
            </p>
          </div>

          {/* SEARCH CONTROLS FORM */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-surface text-gray-900 rounded-2xl shadow-xl p-3 flex flex-col md:flex-row gap-3 items-center border border-border-subtle-medium"
          >
            {/* Search Input */}
            <div className="flex-1 w-full px-3 py-1.5 border-b md:border-b-0 md:border-r border-border-subtle-medium">
              <label htmlFor="search-input-query" className="text-xs text-text-muted font-medium block mb-1">
                Tên sân hoặc từ khóa
              </label>
              <div className="flex items-center">
                <SearchIcon size={18} className="text-accent-primary mr-2 flex-shrink-0" />
                <input
                  id="search-input-query"
                  type="text"
                  placeholder="Ví dụ: Sân Cầu Lông ACE..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  className="outline-none w-full bg-transparent text-sm placeholder:text-text-muted"
                />
              </div>
            </div>

            {/* Location Input */}
            <div className="flex-1 w-full px-3 py-1.5 border-b md:border-b-0 md:border-r border-border-subtle-medium">
              <label htmlFor="search-input-location" className="text-xs text-text-muted font-medium block mb-1">
                Khu vực / Địa điểm
              </label>
              <div className="flex items-center">
                <MapPin size={18} className="text-accent-primary mr-2 flex-shrink-0" />
                <input
                  id="search-input-location"
                  type="text"
                  placeholder="Ví dụ: Quận 1, Bình Thạnh..."
                  value={inputLocation}
                  onChange={(e) => setInputLocation(e.target.value)}
                  className="outline-none w-full bg-transparent text-sm placeholder:text-text-muted"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              leftIcon={<SearchIcon size={18} />}
              className="w-full md:w-auto min-w-[140px]"
            >
              Tìm ngay
            </Button>
          </form>
        </div>
      </section>

      {/* MAIN CONTAINER */}
      <div className="container mx-auto px-4 max-w-7xl py-8">

        {/* MOBILE FILTER CONTROLS BAR */}
        <div className="flex lg:hidden items-center justify-between gap-3 mb-6 bg-surface p-3 rounded-xl border border-border-subtle-medium shadow-sm">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<SlidersHorizontal size={16} />}
            onClick={() => setIsMobileFilterOpen(true)}
          >
            Bộ lọc {hasActiveFilters && '(Đang dùng)'}
          </Button>

          {/* Sort Selector */}
          <div className="flex items-center text-xs text-text-muted gap-2">
            <ArrowUpDown size={14} />
            <select
              value={selectedSort}
              onChange={handleSortChange}
              className="bg-transparent font-semibold text-gray-900 outline-none cursor-pointer"
              aria-label="Sắp xếp danh sách"
            >
              <option value="default">Mặc định</option>
              <option value="rating">Đánh giá cao nhất</option>
              <option value="name">Tên sân A-Z</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* 2. SIDEBAR FILTER PANEL (DESKTOP) */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6 bg-surface p-6 rounded-2xl border border-border-subtle-medium shadow-sm sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle-medium">
              <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Filter size={18} className="text-accent-primary" />
                Bộ lọc tìm kiếm
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-brand-orange-hover hover:underline font-medium"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Môn thể thao Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900">Môn thể thao</h3>
              <div className="flex flex-col gap-1.5">
                {sportsList.map((sport) => {
                  const isSelected = (sport === 'Tất cả' && !selectedSport) || selectedSport === sport;
                  return (
                    <button
                      key={sport}
                      onClick={() => handleSportSelect(sport)}
                      className={[
                        'text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                        isSelected
                          ? 'bg-accent-primary-light text-accent-primary font-bold'
                          : 'text-text-muted hover:bg-surface-subtle hover:text-gray-900'
                      ].join(' ')}
                    >
                      <span>{sport}</span>
                      {isSelected && <Badge variant="success" size="sm" className="py-0 px-1.5 text-[10px]">Đã chọn</Badge>}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* MOBILE FILTER DRAWER MODAL */}
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-50 flex justify-end bg-dark/60 backdrop-blur-sm lg:hidden">
              <div className="w-full max-w-xs bg-surface h-full p-6 space-y-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-border-subtle-medium">
                    <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <Filter size={18} className="text-accent-primary" />
                      Bộ lọc
                    </h2>
                    <button
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="p-1 rounded-full text-text-muted hover:bg-surface-subtle"
                      aria-label="Đóng bộ lọc"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Sport Filter Options */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-900">Môn thể thao</h3>
                    <div className="flex flex-col gap-2">
                      {sportsList.map((sport) => {
                        const isSelected = (sport === 'Tất cả' && !selectedSport) || selectedSport === sport;
                        return (
                          <button
                            key={sport}
                            onClick={() => {
                              handleSportSelect(sport);
                              setIsMobileFilterOpen(false);
                            }}
                            className={[
                              'text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                              isSelected
                                ? 'bg-accent-primary-light text-accent-primary font-bold'
                                : 'text-text-muted hover:bg-surface-subtle'
                            ].join(' ')}
                          >
                            <span>{sport}</span>
                            {isSelected && <Badge variant="success" size="sm">✓</Badge>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-subtle-medium flex gap-3">
                  <Button variant="outline" size="md" fullWidth onClick={handleResetFilters}>
                    Xóa tất cả
                  </Button>
                  <Button variant="primary" size="md" fullWidth onClick={() => setIsMobileFilterOpen(false)}>
                    Áp dụng
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 3. RESULTS AREA (DESKTOP & MOBILE) */}
          <main className="lg:col-span-3 space-y-6">

            {/* RESULTS HEADER BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle-medium">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  Kết quả tìm kiếm
                </h2>
                <p className="text-sm text-text-muted mt-0.5">
                  {!loading && !error && (
                    <>Tìm thấy <span className="font-bold text-gray-900">{filteredVenues.length}</span> sân phù hợp</>
                  )}
                </p>
              </div>

              {/* Desktop Sort Control */}
              <div className="hidden lg:flex items-center gap-2 text-sm text-text-muted">
                <ArrowUpDown size={16} />
                <span>Sắp xếp:</span>
                <select
                  value={selectedSort}
                  onChange={handleSortChange}
                  className="bg-surface border border-border-subtle-medium rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                  aria-label="Sắp xếp danh sách sân"
                >
                  <option value="default">Mặc định</option>
                  <option value="rating">Đánh giá cao nhất</option>
                  <option value="name">Tên sân A-Z</option>
                </select>
              </div>
            </div>

            {/* ACTIVE FILTER CHIPS */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-text-muted font-medium">Đang lọc theo:</span>

                {selectedSport && (
                  <Badge variant="info" size="sm" className="gap-1">
                    Môn: {selectedSport}
                    <X
                      size={14}
                      className="cursor-pointer hover:text-status-error"
                      onClick={() => handleRemoveChip('sport')}
                      aria-label="Bỏ lọc môn thể thao"
                    />
                  </Badge>
                )}

                {selectedLocation && (
                  <Badge variant="info" size="sm" className="gap-1">
                    Khu vực: {selectedLocation}
                    <X
                      size={14}
                      className="cursor-pointer hover:text-status-error"
                      onClick={() => handleRemoveChip('location')}
                      aria-label="Bỏ lọc khu vực"
                    />
                  </Badge>
                )}

                {searchQuery && (
                  <Badge variant="info" size="sm" className="gap-1">
                    Từ khóa: "{searchQuery}"
                    <X
                      size={14}
                      className="cursor-pointer hover:text-status-error"
                      onClick={() => handleRemoveChip('query')}
                      aria-label="Bỏ lọc từ khóa"
                    />
                  </Badge>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-xs text-brand-orange-hover h-7 px-2"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            )}

            {/* LOADING STATE: 6 Skeleton Venue Cards */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <Card key={idx} padding="none" radius="lg" className="overflow-hidden">
                    <Skeleton variant="rectangular" height="190px" />
                    <div className="p-5 space-y-3">
                      <Skeleton variant="text" width="75%" height="1.25rem" />
                      <Skeleton variant="text" width="45%" height="0.875rem" />
                      <Skeleton variant="rounded" height="40px" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              /* ERROR STATE */
              <ErrorState
                title="Không thể tải danh sách sân"
                description="Đã xảy ra sự cố khi kết nối đến máy chủ. Vui lòng thử lại."
                action={
                  <Button variant="primary" leftIcon={<RefreshCw size={16} />} onClick={fetchVenuesData}>
                    Thử lại
                  </Button>
                }
              />
            ) : filteredVenues.length === 0 ? (
              /* EMPTY STATE */
              <EmptyState
                icon={<SearchIcon />}
                title="Không tìm thấy sân phù hợp"
                description="Thử thay đổi bộ lọc tìm kiếm hoặc thử từ khóa khác."
                action={
                  <Button variant="primary" onClick={handleResetFilters}>
                    Xóa bộ lọc
                  </Button>
                }
              />
            ) : (
              /* VENUE RESULTS GRID */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVenues.map((venue) => (
                  <VenueCard
                    key={venue.venue_id || venue.id}
                    venue={venue}
                    onBook={(targetVenue) => navigate(`/venues/${targetVenue.venue_id || targetVenue.id}`)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
