import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, Calendar, ArrowRight, Zap, CheckCircle2, Users, RefreshCw } from 'lucide-react';
import { getFeaturedVenues, getSportsCategories } from '../../api/venues';

// Design System Imports
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import VenueCard from '../../components/domain/VenueCard';
import SportIcon from '../../components/common/SportIcon';
import GooglePlacesAutocomplete from '../../components/common/GooglePlacesAutocomplete';
import communityApi from '../../api/communityApi';

export default function HomePage() {
  const navigate = useNavigate();

  // State Management
  const [banner, setBanner] = useState(null);
  const [venues, setVenues] = useState([]);
  const [sportsList, setSportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Search Form State
  const [searchSport, setSearchSport] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  // Fetch Featured Venues, Sports Categories & Home Banner
  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [data, sports, bannerRes] = await Promise.all([
        getFeaturedVenues(4),
        getSportsCategories(),
        communityApi.getBanner('HOME_PAGE').catch(() => null)
      ]);
      setVenues(Array.isArray(data) ? data : []);
      setSportsList(Array.isArray(sports) && sports.length > 0 ? sports : ['Pickleball', 'Cầu lông', 'Bóng đá', 'Quần vợt', 'Bóng chuyền', 'Bóng rổ']);
      if (bannerRes?.data) setBanner(bannerRes.data);
    } catch (err) {
      console.error("Failed to load featured venues or sports categories", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  // Search Submission Handler
  const handleHeroSearch = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (searchSport.trim()) params.append('sport', searchSport.trim());
    if (searchLocation.trim()) params.append('location', searchLocation.trim());
    
    navigate(`/search?${params.toString()}`);
  };

  const heroTitle = banner?.title || 'Đặt sân thể thao nhanh chóng, tiện lợi';
  const heroSubtitle = banner?.subtitle || 'Nền tảng đặt sân trực tuyến hàng đầu';
  const heroDesc = banner?.description || 'Nền tảng ứng dụng AI hiện đại nhất giúp bạn dễ dàng tìm kiếm sân trống, đặt lịch giữ chỗ và thanh toán nhanh chóng.';
  const heroBg = banner?.image_url || '/hero_bg.png';

  return (
    <div className="w-full bg-surface">
      {/* 1. HERO SECTION */}
      <section className="relative w-full h-[520px] bg-dark overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="SportHubAI Hero Background" className="w-full h-full object-cover opacity-90 transition-all duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/40 to-transparent"></div>
        </div>

        <div className="relative h-full flex flex-col justify-center items-center container mx-auto px-4 max-w-7xl z-10">
          <div className="text-center md:text-left w-full max-w-4xl">
            <Badge variant="warning" size="sm" className="mb-4" leftIcon={<Zap size={14} />}>
              {heroSubtitle}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-md">
              {heroTitle}
            </h1>
            <p className="text-base md:text-lg text-white/90 mb-10 max-w-2xl leading-relaxed">
              {heroDesc}
            </p>
          </div>

          {/* HERO SEARCH FORM */}
          <form
            onSubmit={handleHeroSearch}
            className="bg-surface rounded-2xl shadow-xl w-full max-w-5xl p-3 md:p-4 flex flex-col md:flex-row gap-3 items-center border border-border-subtle-medium"
          >
            {/* Sport Input */}
            <div className="flex-1 w-full px-3 py-1.5 border-b md:border-b-0 md:border-r border-border-subtle-medium">
              <label htmlFor="hero-search-sport" className="text-xs text-text-muted font-medium block mb-1">
                Môn thể thao
              </label>
              <div className="flex items-center text-gray-900">
                <Search size={18} className="text-accent-primary mr-2 flex-shrink-0" />
                <input
                  id="hero-search-sport"
                  type="text"
                  placeholder="Ví dụ: Pickleball, Cầu lông..."
                  value={searchSport}
                  onChange={(e) => setSearchSport(e.target.value)}
                  className="outline-none w-full bg-transparent text-sm placeholder:text-text-muted"
                />
              </div>
            </div>

            {/* Google Maps Location Autocomplete Input */}
            <div className="flex-1 w-full px-3 py-1.5 border-b md:border-b-0 md:border-r border-border-subtle-medium">
              <label htmlFor="hero-search-location" className="text-xs text-text-muted font-medium block mb-1">
                Địa điểm (Google Maps)
              </label>
              <GooglePlacesAutocomplete
                id="hero-search-location"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onSelectPlace={(place) => setSearchLocation(place.main_text || place.full_text)}
                placeholder="Thành phố, Quận hoặc vị trí..."
              />
            </div>

            {/* Schedule Slot */}
            {/* <div className="flex-1 w-full px-3 py-1.5">
              <label className="text-xs text-text-muted font-medium flex items-center mb-1">
                Thời gian
                <Badge variant="neutral" size="sm" className="ml-2 text-[10px] py-0 px-1.5">
                  Sắp ra mắt
                </Badge>
              </label>
              <div className="flex items-center text-text-muted cursor-not-allowed">
                <Calendar size={18} className="mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Chọn ngày & giờ"
                  disabled
                  className="outline-none w-full bg-transparent text-sm cursor-not-allowed"
                />
              </div>
            </div> */}

            {/* Submit CTA Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              leftIcon={<Search size={18} />}
              className="w-full md:w-auto min-w-[140px]"
            >
              Tìm ngay
            </Button>
          </form>
        </div>
      </section>

      {/* 2. EXPLORE CATEGORIES */}
      <section className="container mx-auto px-4 max-w-7xl py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Khám phá môn thể thao</h2>
            <p className="text-sm text-text-muted">Chọn bộ môn yêu thích để tìm sân phù hợp</p>
          </div>
          <Link to="/search">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={16} />}>
              Xem tất cả
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {sportsList.map((sport) => (
            <Link
              key={sport}
              to={`/search?sport=${encodeURIComponent(sport)}`}
              className="flex flex-col items-center justify-center p-6 border border-border-subtle-medium rounded-2xl hover:border-accent-primary hover:shadow-md transition-all bg-surface group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-accent-primary-light text-accent-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
                <SportIcon sport={sport} size={28} />
              </div>
              <span className="font-semibold text-gray-800 text-sm group-hover:text-accent-primary transition-colors text-center">
                {sport}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. PROMO BANNERS */}
      <section className="container mx-auto px-4 max-w-7xl pb-52">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[340px]">
          {/* Main Hero Promo Banner */}
          <div className="lg:col-span-2 relative rounded-3xl overflow-hidden shadow-sm border border-border-subtle-medium group">
            <img
              src="/promo_pickleball.png"
              alt="Khuyến mãi Pickleball"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-dark/90 via-dark/60 to-transparent"></div>
            <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-center">
              <Badge variant="rating" size="sm" className="w-max mb-4 font-bold tracking-wider uppercase">
                Mã: NEWBIE
              </Badge>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight max-w-md">
                Giảm 20% cho sân<br />Pickleball mới
              </h3>
              <p className="text-white/90 mb-8 max-w-sm text-sm">
                Khám phá các sân Pickleball mới khai trương trên hệ thống. Đặt nhanh giữ chỗ ngay!
              </p>
              <Link to="/search?sport=Pickleball">
                <Button variant="primary" size="lg" rightIcon={<Zap size={18} />}>
                  Đặt sân ngay
                </Button>
              </Link>
            </div>
          </div>

          {/* Side Ecosystem Banners */}
          <div className="flex flex-col gap-6">
            <div className="bg-status-info-bg rounded-3xl p-8 flex-1 flex flex-col justify-center relative overflow-hidden border border-status-info-bg">
              <div className="w-10 h-10 rounded-full bg-surface text-status-info-text flex items-center justify-center mb-4 shadow-sm">
                <Search size={20} />
              </div>
              <h4 className="font-bold text-xl text-gray-900 mb-2">Trợ lý SportHubAI</h4>
              <p className="text-sm text-text-muted mb-4">Đề xuất sân phù hợp dựa trên vị trí và lịch rảnh của bạn.</p>
              <Link to="/search" className="text-status-info-text font-semibold text-sm flex items-center hover:underline">
                Thử ngay <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>

            <div className="bg-dark text-white rounded-3xl p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-white/10 text-brand-orange flex items-center justify-center mb-4">
                <Users size={20} />
              </div>
              <h4 className="font-bold text-xl mb-2">Ghép kèo/Tìm trận đấu</h4>
              <p className="text-sm text-white/80 mb-4">Tìm đồng đội cùng trình độ ngay tại khu vực của bạn.</p>
              <Link to="/search" className="text-brand-orange font-semibold text-sm flex items-center hover:underline">
                Tìm kèo ngay <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED VENUES SECTION */}
      <section className="bg-surface-subtle py-16 border-t border-b border-border-subtle-medium">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Sân thể thao nổi bật</h2>
              <p className="text-sm text-text-muted">Các sân chất lượng cao được đánh giá tốt nhất</p>
            </div>
            <Link to="/search" className="hidden md:block">
              <Button variant="outline" size="sm" rightIcon={<ArrowRight size={16} />}>
                Xem tất cả
              </Button>
            </Link>
          </div>

          {/* LOADING STATE: 4 Skeleton Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((idx) => (
                <Card key={idx} padding="none" radius="lg" className="overflow-hidden">
                  <Skeleton variant="rectangular" height="200px" />
                  <div className="p-5 space-y-3">
                    <Skeleton variant="text" width="80%" height="1.25rem" />
                    <Skeleton variant="text" width="50%" height="0.875rem" />
                    <Skeleton variant="rounded" height="40px" />
                  </div>
                </Card>
              ))}
            </div>
          ) : error ? (
            /* ERROR STATE */
            <ErrorState
              title="Không thể tải danh sách sân nổi bật"
              description="Đã xảy ra sự cố khi kết nối đến hệ thống. Vui lòng kiểm tra lại đường truyền."
              action={
                <Button variant="primary" leftIcon={<RefreshCw size={16} />} onClick={fetchVenues}>
                  Thử lại
                </Button>
              }
            />
          ) : venues.length === 0 ? (
            /* EMPTY STATE */
            <EmptyState
              title="Chưa có sân thể thao nào"
              description="Hiện tại hệ thống chưa cập nhật danh sách sân nổi bật. Vui lòng quay lại sau."
              action={
                <Button variant="primary" onClick={() => navigate('/search')}>
                  Khám phá thêm sân
                </Button>
              }
            />
          ) : (
            /* FEATURED VENUES LIST USING VENUECARD DOMAIN COMPONENT */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {venues.map((venue) => (
                <VenueCard
                  key={venue.venue_id || venue.id}
                  venue={venue}
                  onBook={(v) => navigate(`/venues/${v.venue_id || v.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. ECOSYSTEM FEATURE HIGHLIGHT */}
      <section className="container mx-auto px-4 max-w-7xl py-24">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 w-full">
            <div className="relative rounded-3xl overflow-hidden shadow-lg border border-border-subtle-medium aspect-[4/3] lg:aspect-auto lg:h-[550px]">
              <img src="/badminton_smash.png" alt="SportHubAI Player" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex-1 space-y-8">
            <div>
              <Badge variant="info" size="sm" className="mb-3 uppercase font-bold tracking-wider">
                SportHubAI Ecosystem
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Cá nhân hóa trải nghiệm thể thao của bạn
              </h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-xl bg-status-info-bg text-status-info-text flex items-center justify-center flex-shrink-0 mr-4 mt-1">
                  <Search size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Đề xuất thông minh</h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    Dựa vào thói quen và vị trí của bạn, hệ thống AI tự động gợi ý những sân trống phù hợp nhất.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 rounded-xl bg-accent-primary-light text-accent-primary flex items-center justify-center flex-shrink-0 mr-4 mt-1">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Xác nhận tức thì</h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    Quản lý việc giữ chỗ qua hệ thống đồng bộ trực tuyến. Đảm bảo giữ đúng sân, đúng giờ.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 rounded-xl bg-brand-orange-light text-brand-orange-hover flex items-center justify-center flex-shrink-0 mr-4 mt-1">
                  <Users size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Kết nối đồng đội</h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    Hệ thống ghép kèo tự động tìm kiếm người chơi khác có cùng trình độ và khung giờ rảnh.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
