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
import SportIcon from '../components/common/SportIcon';
import GooglePlacesAutocomplete from '../components/common/GooglePlacesAutocomplete';
import Pagination from '../components/ui/Pagination';

const ITEMS_PER_PAGE = 21;

/**
 * Normalizes Vietnamese text by removing accents, punctuation, and extra whitespace
 */
const removeVietnameseTones = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Strips common administrative prefixes (Thành phố, Tỉnh, Quận, Huyện, Phường, Việt Nam, etc.)
 */
const cleanLocationString = (str) => {
  if (!str) return '';
  let norm = removeVietnameseTones(str);
  const stopWords = ['thanh pho', 'tp', 'tinh', 'quan', 'huyen', 'thi xa', 'phuong', 'xa', 'viet nam', 'vn'];
  stopWords.forEach((w) => {
    norm = norm.replace(new RegExp(`\\b${w}\\b`, 'gi'), ' ');
  });
  return norm.replace(/\s+/g, ' ').trim();
};

/**
 * Returns sport keywords and synonyms
 */
const getSportSynonyms = (sport) => {
  const norm = removeVietnameseTones(sport);
  if (!norm || norm === 'tat ca') return [];

  if (norm.includes('cau long') || norm.includes('badminton')) {
    return ['cau long', 'badminton'];
  }
  if (norm.includes('pickleball') || norm.includes('pickle')) {
    return ['pickleball', 'pickle'];
  }
  if (norm.includes('bong da') || norm.includes('football') || norm.includes('soccer') || norm.includes('futsal')) {
    return ['bong da', 'football', 'soccer', 'futsal', 'san co'];
  }
  if (norm.includes('tennis') || norm.includes('quan vot')) {
    return ['tennis', 'quan vot'];
  }
  if (norm.includes('bong ro') || norm.includes('basketball')) {
    return ['bong ro', 'basketball'];
  }
  if (norm.includes('golf')) {
    return ['golf'];
  }
  if (norm.includes('bong chuyen') || norm.includes('volleyball')) {
    return ['bong chuyen', 'volleyball'];
  }
  if (norm.includes('boi') || norm.includes('swim')) {
    return ['boi', 'swim', 'be boi'];
  }
  if (norm.includes('bong ban') || norm.includes('ping pong') || norm.includes('table tennis')) {
    return ['bong ban', 'ping pong', 'table tennis'];
  }
  if (norm.includes('bida') || norm.includes('billiard') || norm.includes('pool')) {
    return ['bida', 'billiard', 'pool'];
  }
  if (norm.includes('gym') || norm.includes('fitness') || norm.includes('the hinh')) {
    return ['gym', 'fitness', 'the hinh'];
  }
  return [norm];
};

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State Management
  const [venues, setVenues] = useState([]);
  const [sportsList, setSportsList] = useState(['Tất cả']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Extract filter and pagination values from URL search parameters
  const selectedSport = searchParams.get('sport') || '';
  const selectedLocation = searchParams.get('location') || '';
  const searchQuery = searchParams.get('query') || '';
  const selectedSort = searchParams.get('sort') || 'default';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  // Local form inputs for Search Header
  const [inputQuery, setInputQuery] = useState(searchQuery);
  const [inputLocation, setInputLocation] = useState(selectedLocation);

  // Keep local input fields in sync when URL changes (e.g. Back/Forward button)
  useEffect(() => {
    setInputQuery(selectedSport || searchQuery || '');
    setInputLocation(selectedLocation);
  }, [searchQuery, selectedSport, selectedLocation]);

  // Derive active sport category (either explicit selectedSport or detected from query)
  const activeSport = useMemo(() => {
    if (selectedSport && selectedSport !== 'Tất cả') return selectedSport;
    if (searchQuery) {
      const normQ = removeVietnameseTones(searchQuery);
      const matched = sportsList.find((s) => {
        if (s === 'Tất cả') return false;
        const syns = getSportSynonyms(s);
        return syns.some((syn) => syn === normQ || normQ === removeVietnameseTones(s));
      });
      if (matched) return matched;
    }
    return '';
  }, [selectedSport, searchQuery, sportsList]);

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

  // Update URL search parameters (auto resets page to 1 when changing filters)
  const updateParams = useCallback((newParams) => {
    const params = new URLSearchParams(searchParams);
    if (!('page' in newParams)) {
      params.delete('page');
    }
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== 'Tất cả') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  // Page change handler
  const handlePageChange = (newPage) => {
    updateParams({ page: newPage > 1 ? newPage.toString() : '' });
    window.scrollTo({ top: 260, behavior: 'smooth' });
  };

  // Submit Search Header Form
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const rawQuery = inputQuery.trim();
    const normQ = removeVietnameseTones(rawQuery);

    // If query matches a sport category name, set sport parameter directly
    const matchedSport = sportsList.find((s) => {
      if (s === 'Tất cả') return false;
      const syns = getSportSynonyms(s);
      return syns.some((syn) => syn === normQ || normQ === removeVietnameseTones(s));
    });

    if (matchedSport) {
      updateParams({
        sport: matchedSport,
        query: '',
        location: inputLocation.trim(),
      });
    } else {
      updateParams({
        query: rawQuery,
        sport: '',
        location: inputLocation.trim(),
      });
    }
  };

  // Select Sport Filter
  const handleSportSelect = (sport) => {
    if (sport === 'Tất cả') {
      updateParams({ sport: '', query: '' });
      setInputQuery('');
    } else {
      updateParams({ sport: sport, query: '' });
      setInputQuery(sport);
    }
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
    if (key === 'query' || key === 'sport') setInputQuery('');
    if (key === 'location') setInputLocation('');
    const params = new URLSearchParams(searchParams);
    params.delete(key);
    setSearchParams(params);
  };

  // Apply intelligent client-side filtering and sorting on fetched venue dataset
  const filteredVenues = useMemo(() => {
    if (!venues) return [];

    let result = [...venues];

    // 1. Filter by Sport Keyword (with bilingual synonyms & court types)
    if (activeSport && activeSport !== 'Tất cả') {
      const synonyms = getSportSynonyms(activeSport);
      if (synonyms.length > 0) {
        result = result.filter((v) => {
          const venueCorpus = [
            v.venue_name,
            v.venue_description,
            v.sport_categories,
            v.sport_category,
            ...(Array.isArray(v.branches) ? v.branches.flatMap(b => [
              b.branch_name,
              ...(Array.isArray(b.courts) ? b.courts.map(c => c.sport_category) : [])
            ]) : []),
            ...(Array.isArray(v.courts) ? v.courts.map(c => c.sport_category) : [])
          ].filter(Boolean).map(removeVietnameseTones).join(' ');

          return synonyms.some((kw) => venueCorpus.includes(kw));
        });
      }
    }

    // 2. Filter by Location Text (Strictly checks address & branch fields, not venue name)
    if (selectedLocation && selectedLocation.trim()) {
      const cleanLoc = cleanLocationString(selectedLocation);
      const commaParts = selectedLocation
        .split(',')
        .map(cleanLocationString)
        .filter((p) => p.length >= 3);

      if (cleanLoc) {
        result = result.filter((v) => {
          // Build location corpus strictly from address fields
          const branchAddressStr = Array.isArray(v.branches)
            ? v.branches.map((b) => `${b.branch_name || ''} ${b.ward_district_city || ''} ${b.street_address || ''}`).join(' ')
            : '';
          const venueAddressCorpus = removeVietnameseTones(`${v.location || ''} ${branchAddressStr}`);

          if (!venueAddressCorpus || venueAddressCorpus === 'viet nam') return false;

          // 1. Direct whole-phrase match (e.g. "da nang", "ha noi", "quan 1")
          if (venueAddressCorpus.includes(cleanLoc)) return true;

          // 2. City abbreviations & aliases
          if ((cleanLoc === 'ho chi minh' || cleanLoc === 'hcm' || cleanLoc === 'sai gon') &&
              (venueAddressCorpus.includes('ho chi minh') || venueAddressCorpus.includes('hcm') || venueAddressCorpus.includes('sai gon'))) {
            return true;
          }
          if ((cleanLoc === 'ha noi' || cleanLoc === 'hn') &&
              (venueAddressCorpus.includes('ha noi') || venueAddressCorpus.includes('hn'))) {
            return true;
          }
          if ((cleanLoc === 'da nang' || cleanLoc === 'danang') &&
              (venueAddressCorpus.includes('da nang') || venueAddressCorpus.includes('danang'))) {
            return true;
          }

          // 3. Comma-separated parts (e.g. ["hai chau", "da nang"])
          if (commaParts.length > 0 && commaParts.some((part) => venueAddressCorpus.includes(part))) {
            return true;
          }

          return false;
        });
      }
    }

    // 3. Filter by General Search Query (if not purely sport name)
    if (searchQuery && !activeSport) {
      const normQuery = removeVietnameseTones(searchQuery);
      const queryTokens = normQuery.split(' ').filter((t) => t.length >= 2);

      result = result.filter((v) => {
        const branchLocs = Array.isArray(v.branches)
          ? v.branches.map((b) => `${b.branch_name} ${b.ward_district_city} ${b.street_address}`).join(' ')
          : '';
        const searchCorpus = removeVietnameseTones(`${v.venue_name || ''} ${v.venue_description || ''} ${v.location || ''} ${branchLocs}`);

        return searchCorpus.includes(normQuery) || (queryTokens.length > 0 && queryTokens.every((tok) => searchCorpus.includes(tok)));
      });
    }

    // 4. Sorting
    if (selectedSort === 'rating') {
      result.sort((a, b) => parseFloat(b.average_rating || b.rating || 4.8) - parseFloat(a.average_rating || a.rating || 4.8));
    } else if (selectedSort === 'name') {
      result.sort((a, b) => (a.venue_name || '').localeCompare(b.venue_name || '', 'vi'));
    }

    return result;
  }, [venues, activeSport, selectedLocation, searchQuery, selectedSort]);

  // Total pages and paginated slice of 21 venues
  const totalPages = Math.ceil(filteredVenues.length / ITEMS_PER_PAGE);

  const paginatedVenues = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVenues.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredVenues, currentPage]);

  // Check if any filter is active
  const hasActiveFilters = Boolean(activeSport || selectedLocation || (searchQuery && !activeSport) || selectedSort !== 'default');

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
                Tên sân hoặc môn thể thao
              </label>
              <div className="flex items-center">
                <SearchIcon size={18} className="text-accent-primary mr-2 flex-shrink-0" />
                <input
                  id="search-input-query"
                  type="text"
                  placeholder="Ví dụ: Cầu lông, Pickleball, Sân ACE..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  className="outline-none w-full bg-transparent text-sm placeholder:text-text-muted font-medium"
                />
              </div>
            </div>

            {/* Location Input with Google Maps */}
            <div className="flex-1 w-full px-3 py-1.5 border-b md:border-b-0 md:border-r border-border-subtle-medium">
              <label htmlFor="search-input-location" className="text-xs text-text-muted font-medium block mb-1">
                Khu vực / Địa điểm (Google Maps)
              </label>
              <GooglePlacesAutocomplete
                id="search-input-location"
                value={inputLocation}
                onChange={(e) => setInputLocation(e.target.value)}
                onSelectPlace={(place) => setInputLocation(place.main_text || place.full_text)}
                placeholder="Ví dụ: Quận 1, Hải Châu, Cầu Giấy..."
              />
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
                  className="text-xs text-brand-orange-hover hover:underline font-medium cursor-pointer"
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
                  const isSelected = (sport === 'Tất cả' && !activeSport) || activeSport === sport;
                  return (
                    <button
                      key={sport}
                      onClick={() => handleSportSelect(sport)}
                      className={[
                        'text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group cursor-pointer',
                        isSelected
                          ? 'bg-accent-primary-light text-accent-primary font-bold'
                          : 'text-text-muted hover:bg-surface-subtle hover:text-gray-900'
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-2.5">
                        <SportIcon
                          sport={sport}
                          size={18}
                          className={isSelected ? 'text-accent-primary' : 'text-gray-400 group-hover:text-gray-600'}
                        />
                        <span>{sport}</span>
                      </div>
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
                        const isSelected = (sport === 'Tất cả' && !activeSport) || activeSport === sport;
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
                            <div className="flex items-center gap-2.5">
                              <SportIcon
                                sport={sport}
                                size={18}
                                className={isSelected ? 'text-accent-primary' : 'text-gray-400'}
                              />
                              <span>{sport}</span>
                            </div>
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

                {activeSport && (
                  <Badge variant="info" size="sm" className="gap-1">
                    Môn: {activeSport}
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

                {searchQuery && !activeSport && (
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
              /* VENUE RESULTS GRID & PAGINATION */
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedVenues.map((venue) => (
                    <VenueCard
                      key={venue.venue_id || venue.id}
                      venue={venue}
                      onBook={(targetVenue) => navigate(`/venues/${targetVenue.venue_id || targetVenue.id}`)}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredVenues.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
