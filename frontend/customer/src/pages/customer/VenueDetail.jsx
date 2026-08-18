import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Phone, Heart, Calendar, Star, CheckCircle2, Navigation, Image as ImageIcon, LayoutGrid, RefreshCw, ArrowRight, User } from 'lucide-react';
import { getVenueById, getSimilarVenues, getVenueImages } from '../../api/venues';
import { getPublicVenuePosts } from '../../api/public';
import { addFavorite } from '../../api/favorites';

// Design System Imports
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import Tabs from '../../components/ui/Tabs';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import VenueCard from '../../components/domain/VenueCard';
import BookingModal from '../../components/domain/BookingModal';

export default function VenueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [venue, setVenue] = useState(null);
  const [similarVenues, setSimilarVenues] = useState([]);
  const [venueImages, setVenueImages] = useState([]);
  const [venuePosts, setVenuePosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('Thông tin');
  const [favPending, setFavPending] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'error' });

  const fetchVenueDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await getVenueById(id);
      setVenue(data);

      if (Array.isArray(data?.images) && data.images.length > 0) {
        setVenueImages(data.images);
      }

      // Fetch public venue posts / events
      try {
        const postsRes = await getPublicVenuePosts(id);
        setVenuePosts(postsRes?.data || []);
      } catch (e) {}

      // Fetch similar venues from real DB API
      const similar = await getSimilarVenues(id);
      setSimilarVenues(similar || []);
    } catch (err) {
      console.error("Failed to load venue details", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVenueDetails();
  }, [fetchVenueDetails]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="w-full bg-surface pb-20">
        <Skeleton variant="rectangular" height="360px" />
        <div className="container mx-auto px-4 max-w-5xl -mt-20 relative z-10">
          <Card radius="2xl" className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Skeleton variant="rounded" width="140px" height="140px" className="-mt-12" />
              <div className="flex-1 space-y-3 w-full">
                <Skeleton variant="text" width="30%" />
                <Skeleton variant="text" width="60%" height="2rem" />
                <Skeleton variant="text" width="40%" />
              </div>
              <div className="w-full md:w-48 space-y-2">
                <Skeleton variant="rounded" height="44px" />
                <Skeleton variant="rounded" height="44px" />
              </div>
            </div>
          </Card>
          <div className="mt-8 space-y-4">
            <Skeleton variant="rounded" height="48px" />
            <Skeleton variant="rectangular" height="240px" />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <ErrorState
          title="Không thể tải chi tiết sân thể thao"
          description="Đã có lỗi xảy ra trong quá trình truy xuất dữ liệu sân từ máy chủ. Vui lòng kiểm tra lại kết nối."
          action={
            <Button variant="primary" leftIcon={<RefreshCw size={16} />} onClick={fetchVenueDetails}>
              Thử lại
            </Button>
          }
          secondaryAction={
            <Button variant="outline" onClick={() => navigate('/')}>
              Về trang chủ
            </Button>
          }
        />
      </div>
    );
  }

  // Empty State (Venue Not Found)
  if (!venue) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <EmptyState
          title="Không tìm thấy thông tin sân"
          description="Sân thể thao bạn tìm kiếm không tồn tại hoặc đã ngừng hoạt động."
          action={
            <Button variant="primary" onClick={() => navigate('/')}>
              Khám phá sân khác
            </Button>
          }
        />
      </div>
    );
  }

  // Location string extraction from real DB branch
  const mainBranch = venue.branches && venue.branches.length > 0 ? venue.branches[0] : null;
  const locationStr = mainBranch
    ? `${mainBranch.street_address || ''}, ${mainBranch.ward_district_city || ''}`
    : "Chưa cập nhật địa chỉ";

  // Facilities list from Database
  const facilitiesList = venue.facilities || [];

  // Extract primary sport category from venue's courts or sport_type
  const primarySportCategory = (
    (venue.branches && venue.branches[0]?.courts && venue.branches[0]?.courts[0]?.sport_category) ||
    (venue.sport_type && Array.isArray(venue.sport_type) ? venue.sport_type[0] : venue.sport_type) ||
    'Pickleball'
  );

  // Sport-specific high-quality fallback image pools
  const SPORT_FALLBACK_POOLS = {
    'Bóng đá': [
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=1200&auto=format&fit=crop"
    ],
    'Tennis': [
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1530915534664-4ac6423ca938?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?q=80&w=1200&auto=format&fit=crop"
    ],
    'Cầu lông': [
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1521537634581-0dced2efa2a3?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1613918108466-292b78a8ef95?q=80&w=1200&auto=format&fit=crop"
    ],
    'Pickleball': [
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=1200&auto=format&fit=crop"
    ],
    'Default': [
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop"
    ]
  };

  const defaultFallbackImages = SPORT_FALLBACK_POOLS[primarySportCategory] || SPORT_FALLBACK_POOLS['Default'];
  const defaultFallbackImage = defaultFallbackImages[0];

  // Gallery Photos list from Database / Dataset
  const rawPhotos = (venueImages && venueImages.length > 0 ? venueImages : (venue.images || []));
  const galleryPhotos = rawPhotos.map((img, idx) => {
    const url = typeof img === 'string' ? img : img?.image_url;
    if (!url || url.includes('m-files.alobo.vn')) {
      return defaultFallbackImages[idx % defaultFallbackImages.length];
    }
    return url;
  }).filter(Boolean);

  if (galleryPhotos.length === 0) {
    galleryPhotos.push(...defaultFallbackImages);
  }

  const heroImage = galleryPhotos[0];

  // Real Geo Coordinates for Google Maps Navigation
  let mapCoordinates = null;
  if (mainBranch && mainBranch.geo_coordinates) {
    try {
      mapCoordinates = typeof mainBranch.geo_coordinates === 'string'
        ? JSON.parse(mainBranch.geo_coordinates)
        : mainBranch.geo_coordinates;
    } catch (e) {}
  }

  const mapDirectionsUrl = mapCoordinates && mapCoordinates.lat && mapCoordinates.lng
    ? `https://www.google.com/maps/search/?api=1&query=${mapCoordinates.lat},${mapCoordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.venue_name + ' ' + locationStr)}`;

  const reviewsList = venue.reviews || [];

  return (
    <div className="w-full bg-surface-subtle pb-20">
      {/* 1. HERO BANNER */}
      <section className="w-full h-[300px] md:h-[380px] relative bg-dark">
        <img
          src={heroImage}
          alt={`${venue.venue_name} Hero`}
          className="w-full h-full object-cover opacity-80"
          onError={(e) => { e.currentTarget.src = defaultFallbackImage; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark/60 via-transparent to-transparent"></div>
      </section>

      {/* 2. OVERLAPPING INFO CARD */}
      <section className="container mx-auto px-4 max-w-5xl -mt-24 relative z-10">
        <Card radius="2xl" padding="lg" className="shadow-lg border border-border-subtle-medium bg-surface">
          <div className="flex flex-col md:flex-row gap-6 items-start">

            {/* Venue Avatar / Logo */}
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl border border-border-subtle-medium shadow-sm bg-surface flex items-center justify-center flex-shrink-0 p-2 overflow-hidden -mt-14 md:-mt-0 relative">
              <div className="w-full h-full border border-accent-primary-light rounded-xl flex items-center justify-center font-bold text-2xl text-accent-primary bg-surface-subtle shadow-inner">
                {venue.venue_name.substring(0, 3).toUpperCase()}
              </div>
            </div>

            {/* Venue Metadata */}
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center gap-2">
                {venue.average_rating ? (
                  <Badge variant="rating" size="sm" leftIcon={<Star size={12} className="fill-current text-brand-orange-hover" />}>
                    {venue.average_rating} <span className="font-normal opacity-75 ml-0.5">({venue.review_count || 0} đánh giá)</span>
                  </Badge>
                ) : (
                  <Badge variant="rating" size="sm">
                    Chưa có đánh giá
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {venue.venue_name}
              </h1>

              <div className="space-y-2 text-sm text-text-muted pt-1">
                <div className="flex items-start">
                  <MapPin size={16} className="mr-2 mt-0.5 text-text-muted flex-shrink-0" />
                  <span>{locationStr}</span>
                </div>
                <div className="flex items-center">
                  <Clock size={16} className="mr-2 text-text-muted flex-shrink-0" />
                  <span>{venue.opening_hours_text || 'Chưa cập nhật giờ hoạt động'}</span>
                </div>
                <div className="flex items-center">
                  <Phone size={16} className="mr-2 text-text-muted flex-shrink-0" />
                  <span>{venue.contact_phone || 'Chưa cập nhật SĐT'}</span>
                </div>
              </div>
            </div>

            {/* Booking & Favorite Action Buttons */}
            <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[200px] pt-2 md:pt-0">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<Calendar size={18} />}
                onClick={() => setIsBookingModalOpen(true)}
              >
                Đặt lịch
              </Button>
              <Button
                variant="outline"
                size="md"
                fullWidth
                disabled={favPending}
                aria-busy={favPending}
                leftIcon={<Heart size={18} />}
                aria-label="Thêm sân vào danh sách yêu thích"
                onClick={async () => {
                  if (favPending) return;
                  try {
                    setFavPending(true);
                    await addFavorite(id);
                    setNoticeModal({ open: true, title: 'Danh sách yêu thích', message: 'Đã thêm vào danh sách yêu thích thành công.', type: 'success' });
                  } catch (err) {
                    console.error("Failed to add favorite", err);
                    const status = err.response?.status;
                    if (status === 401) {
                      setNoticeModal({ open: true, title: 'Yêu cầu đăng nhập', message: 'Vui lòng đăng nhập để sử dụng danh sách yêu thích.', type: 'error' });
                    } else if (status === 409) {
                      setNoticeModal({ open: true, title: 'Đã tồn tại', message: 'Sân này đã có trong danh sách yêu thích của bạn.', type: 'info' });
                    } else {
                      setNoticeModal({ open: true, title: 'Thông báo', message: 'Tính năng danh sách yêu thích hiện chưa khả dụng trên máy chủ.', type: 'error' });
                    }
                  } finally {
                    setFavPending(false);
                  }
                }}
              >
                Yêu thích
              </Button>
            </div>

          </div>
        </Card>
      </section>

      {/* 3. TABS NAVIGATION & CONTENT */}
      <section className="container mx-auto px-4 max-w-5xl mt-8">
        <Tabs activeTab={activeTab} onChange={setActiveTab} variant="line" size="md">
          <Tabs.List className="mb-8">
            <Tabs.Tab value="Thông tin">Thông tin</Tabs.Tab>
            <Tabs.Tab value="Hình ảnh">Hình ảnh ({galleryPhotos.length})</Tabs.Tab>
            <Tabs.Tab value="Tin tức & Sự kiện">Tin tức & Sự kiện ({venuePosts.length})</Tabs.Tab>
            <Tabs.Tab value="Dịch vụ">Dịch vụ</Tabs.Tab>
            <Tabs.Tab value="Điều khoản & quy định">Điều khoản & quy định</Tabs.Tab>
            <Tabs.Tab value="Đánh giá">Đánh giá ({venue.review_count || 0})</Tabs.Tab>
          </Tabs.List>

          {/* TAB 1: THÔNG TIN */}
          <Tabs.Panel value="Thông tin">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Giới thiệu */}
                <Card radius="xl" padding="md" className="border border-border-subtle-medium">
                  <Card.Header className="mb-3">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center">
                      <span className="w-6 h-6 rounded-full bg-status-info-bg text-status-info-text flex items-center justify-center mr-2 text-xs font-bold">i</span>
                      Giới thiệu sân
                    </h3>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-text-muted text-sm leading-relaxed whitespace-pre-line">
                      {venue.venue_description || "Chưa cập nhật mô tả cho câu lạc bộ này."}
                    </p>
                  </Card.Body>
                </Card>

                {/* Dịch vụ & Tiện ích */}
                <Card radius="xl" padding="md" className="border border-border-subtle-medium">
                  <Card.Header className="mb-3">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center">
                      <span className="w-6 h-6 rounded-full bg-brand-orange-light text-brand-orange-hover flex items-center justify-center mr-2 text-xs font-bold">★</span>
                      Dịch vụ & Tiện ích
                    </h3>
                  </Card.Header>
                  <Card.Body>
                    {facilitiesList.length === 0 ? (
                      <p className="text-xs text-text-muted italic">Chưa có thông tin dịch vụ & tiện ích từ cơ sở dữ liệu.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                        {facilitiesList.map((facility, idx) => (
                          <div key={idx} className="flex items-center text-sm text-gray-800">
                            <CheckCircle2 size={18} className="text-accent-primary mr-2.5 flex-shrink-0" />
                            <span>{facility.facility_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>

              {/* Vị trí địa lý (Map Section) */}
              <div className="lg:col-span-1">
                <Card radius="xl" padding="md" className="border border-border-subtle-medium sticky top-24">
                  <Card.Header className="mb-3">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center">
                      <span className="w-6 h-6 rounded-full bg-accent-primary-light text-accent-primary flex items-center justify-center mr-2 text-xs font-bold">📍</span>
                      Vị trí địa lý
                    </h3>
                  </Card.Header>
                  <Card.Body>
                    <div className="w-full aspect-square bg-surface-subtle rounded-xl relative overflow-hidden flex flex-col items-center justify-center border border-border-subtle p-4 text-center">
                      <MapPin size={36} className="text-brand-orange mb-2" />
                      <p className="font-bold text-xs text-gray-900 line-clamp-2">{venue.venue_name}</p>
                      <p className="text-[11px] text-text-muted mt-1 line-clamp-2">{locationStr}</p>
                      
                      {mapCoordinates && (
                        <p className="text-[10px] font-mono text-gray-500 mt-2">
                          Tọa độ: {mapCoordinates.lat}, {mapCoordinates.lng}
                        </p>
                      )}

                      <a
                        href={mapDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 w-full"
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          leftIcon={<Navigation size={14} />}
                        >
                          Chỉ đường trên Google Maps
                        </Button>
                      </a>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
          </Tabs.Panel>

          {/* TAB 2: HÌNH ẢNH (BENTO GALLERY) */}
          <Tabs.Panel value="Hình ảnh">
            <Card radius="xl" padding="md" className="border border-border-subtle-medium space-y-6">
              <Card.Header className="mb-2">
                <h3 className="font-bold text-gray-900 text-lg flex items-center">
                  <span className="w-8 h-8 rounded-lg bg-status-info-bg text-status-info-text flex items-center justify-center mr-3">
                    <ImageIcon size={18} />
                  </span>
                  Thư viện hình ảnh ({galleryPhotos.length})
                </h3>
              </Card.Header>
              <Card.Body>
                {galleryPhotos.length === 0 ? (
                  <EmptyState
                    title="Chưa có hình ảnh"
                    description="Thư viện hình ảnh của câu lạc bộ chưa có dữ liệu trong cơ sở dữ liệu."
                  />
                ) : (
                  /* GALLERY BENTO GRID */
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-auto md:h-[450px]">
                    {/* Main Big Photo (Left - 7 cols) */}
                    <div className="md:col-span-7 h-[260px] md:h-full rounded-2xl overflow-hidden shadow-sm relative group">
                      <img
                        src={galleryPhotos[0] || defaultFallbackImage}
                        alt={`${venue.venue_name} Photo 1`}
                        onError={(e) => { e.currentTarget.src = defaultFallbackImage; }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Small Photos (Right - 5 cols in 2x2 grid) */}
                    <div className="md:col-span-5 grid grid-cols-2 gap-4 h-full">
                      {(galleryPhotos.slice(1, 5)).map((photoUrl, idx) => (
                        <div key={idx} className="rounded-2xl overflow-hidden shadow-sm h-[120px] md:h-full relative group">
                          <img
                            src={photoUrl || defaultFallbackImage}
                            alt={`Gallery Photo ${idx + 2}`}
                            onError={(e) => { e.currentTarget.src = defaultFallbackImage; }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tabs.Panel>

          {/* TAB: TIN TỨC & SỰ KIỆN */}
          <Tabs.Panel value="Tin tức & Sự kiện">
            <Card radius="xl" padding="md" className="border border-border-subtle-medium space-y-4">
              <Card.Header className="mb-2">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Calendar size={20} className="text-brand-orange" />
                  Tin tức, Khuyến mãi & Sự kiện thể thao ({venuePosts.length})
                </h3>
              </Card.Header>
              <Card.Body>
                {venuePosts.length === 0 ? (
                  <EmptyState
                    title="Chưa có bài viết hay sự kiện công khai"
                    description="Cơ sở chưa có chương trình khuyến mãi hay sự kiện mới công bố."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {venuePosts.map((post) => {
                      const cover = post.cover_image_url || post.cover_image?.medium_url || post.cover_image?.image_url;
                      return (
                        <Link
                          key={post.post_id}
                          to={`/posts/${post.slug}`}
                          className="group bg-surface p-4 rounded-2xl border border-border-subtle-medium hover:border-brand-orange transition-all flex flex-col justify-between space-y-3 shadow-xs"
                        >
                          {cover && (
                            <div className="w-full h-40 rounded-xl overflow-hidden bg-gray-100 relative">
                              <img src={cover} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-brand-orange text-white uppercase shadow-xs">
                                {post.content_type}
                              </span>
                            </div>
                          )}

                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand-orange transition-colors line-clamp-2">
                              {post.title}
                            </h4>
                            {post.excerpt && (
                              <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                                {post.excerpt}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-text-muted pt-2 border-t border-gray-100">
                            <span>{new Date(post.publish_at || post.created_at).toLocaleDateString('vi-VN')}</span>
                            <span className="text-brand-orange font-semibold group-hover:underline flex items-center gap-1">
                              Xem chi tiết <ArrowRight size={12} />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tabs.Panel>

          {/* TAB 3: DỊCH VỤ */}
          <Tabs.Panel value="Dịch vụ">
            <Card radius="xl" padding="md" className="border border-border-subtle-medium">
              <Card.Header className="mb-3">
                <h3 className="font-bold text-gray-900 text-lg">Danh sách Dịch vụ & Tiện ích</h3>
              </Card.Header>
              <Card.Body>
                {facilitiesList.length === 0 ? (
                  <EmptyState
                    title="Chưa cập nhật dịch vụ"
                    description="Cơ sở dữ liệu chưa ghi nhận tiện ích bổ sung cho câu lạc bộ này."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {facilitiesList.map((f, i) => (
                      <div key={i} className="p-3 rounded-xl bg-surface-subtle border border-border-subtle flex items-center gap-3">
                        <CheckCircle2 size={20} className="text-emerald-600" />
                        <span className="font-bold text-sm text-gray-900">{f.facility_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tabs.Panel>

          {/* TAB 4: ĐIỀU KHOẢN & QUY ĐỊNH */}
          <Tabs.Panel value="Điều khoản & quy định">
            <Card radius="xl" padding="md" className="border border-border-subtle-medium space-y-3 text-xs">
              <h3 className="font-bold text-gray-900 text-base">Quy định chung của Câu lạc bộ</h3>
              <ul className="list-disc pl-5 space-y-2 text-text-muted leading-relaxed">
                <li>Khách hàng vui lòng có mặt đúng giờ theo lịch đã đặt.</li>
                <li>Mặc trang phục và giày thể thao phù hợp với loại mặt sân.</li>
                <li>Giữ gìn vệ sinh chung và bảo vệ trang thiết bị của câu lạc bộ.</li>
                <li>Quy định hủy/đổi lịch tuân theo chính sách chung của SportHubAI.</li>
              </ul>
            </Card>
          </Tabs.Panel>

          {/* TAB 5: ĐÁNH GIÁ */}
          <Tabs.Panel value="Đánh giá">
            <Card radius="xl" padding="md" className="border border-border-subtle-medium space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <Star size={18} className="text-amber-500 fill-amber-500" />
                  Đánh giá từ người chơi ({reviewsList.length})
                </h3>

                {venue.average_rating && (
                  <div className="text-sm font-extrabold text-gray-900">
                    Trung bình: <span className="text-amber-500">{venue.average_rating} ★</span>
                  </div>
                )}
              </div>

              {reviewsList.length === 0 ? (
                <EmptyState
                  title="Chưa có đánh giá nào"
                  description="Câu lạc bộ chưa có đánh giá nào từ khách hàng trên cơ sở dữ liệu."
                />
              ) : (
                <div className="space-y-3">
                  {reviewsList.map((r, i) => (
                    <div key={i} className="p-4 rounded-xl bg-surface-subtle border border-border-subtle space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-orange/20 text-brand-orange font-bold flex items-center justify-center">
                            {(r.customer?.full_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{r.customer?.full_name || 'Người chơi'}</p>
                            <p className="text-[10px] text-text-muted">{r.court?.court_name || 'Sân con'} • {new Date(r.created_at || Date.now()).toLocaleDateString('vi-VN')}</p>
                          </div>
                        </div>

                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={14} className={s <= r.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'} />
                          ))}
                        </div>
                      </div>

                      <p className="text-gray-700 leading-relaxed italic">"{r.comment || 'Khách hàng không để lại bình luận.'}"</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Tabs.Panel>
        </Tabs>
      </section>

      {/* 4. SIMILAR VENUES SECTION USING REUSABLE VENUECARD */}
      <section className="container mx-auto px-4 max-w-5xl mt-16 pt-10 border-t border-border-subtle-medium">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Sân tương tự gần đây</h2>
            <p className="text-sm text-text-muted">Các câu lạc bộ chất lượng cao cùng môn thể thao hoặc khu vực</p>
          </div>
          <Link to="/search">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={16} />}>
              Xem tất cả
            </Button>
          </Link>
        </div>

        {similarVenues.length === 0 ? (
          <EmptyState
            size="sm"
            title="Chưa có sân tương tự"
            description="Hiện chưa tìm thấy câu lạc bộ tương tự ở gần vị trí này trên cơ sở dữ liệu."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarVenues.map((v) => (
              <VenueCard
                key={v.venue_id || v.id}
                venue={v}
                onBook={(targetVenue) => navigate(`/venues/${targetVenue.venue_id || targetVenue.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* CHỌN HÌNH THỨC & ĐỐI TƯỢNG ĐẶT MODAL */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSelectVisualBooking={(targetType) => {
          setIsBookingModalOpen(false);
          navigate(`/venues/${id}/booking`, { state: { bookingTarget: targetType } });
        }}
        venue={venue}
      />

      {/* NOTICE MODAL */}
      {noticeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-border-subtle-medium">
            <h3 className="text-base font-bold text-gray-900">{noticeModal.title}</h3>
            <p className="text-xs text-text-muted leading-relaxed">{noticeModal.message}</p>
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

