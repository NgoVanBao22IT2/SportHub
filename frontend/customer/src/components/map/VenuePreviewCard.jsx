import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Star, MapPin, Navigation, Heart, Calendar, ArrowRight } from 'lucide-react';
import SportIcon from '../common/SportIcon';
import { useFavorites } from '../../context/FavoritesContext';
import { getVenueImageUrl, getDeterministicFallback } from '../../utils/imageUrl';

/**
 * Formats price into Vietnamese currency format
 */
const formatPrice = (price) => {
  if (!price || isNaN(price) || price <= 0) {
    return 'Liên hệ';
  }
  return `Từ ${new Intl.NumberFormat('vi-VN').format(price)}đ/giờ`;
};

/**
 * Rich VenuePreviewCard Component
 * Positioned on the left side of the map with quick actions (Directions, Favorites, Booking, Detail).
 */
function VenuePreviewCard({
  venue,
  onClose,
  className = ''
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isFavorite: checkIsFavorite, toggleFavorite } = useFavorites();

  // Handle keyboard Escape to close preview
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!venue) return null;

  const venueId = venue.venue_id || venue.id;
  const venueName = venue.name || venue.venue_name || 'Sân thể thao';
  const branchName = venue.branch_name || '';
  const sportCategory = venue.sport_category || 'Thể thao';
  const address = venue.address || `${venue.street_address || ''}, ${venue.ward_district_city || ''}`.replace(/^,\s*/, '').trim();
  const rating = venue.average_rating || 4.8;
  const reviewCount = venue.review_count !== undefined ? venue.review_count : 24;
  const priceDisplay = formatPrice(venue.min_price);

  const isFav = checkIsFavorite(venueId);

  // Compute image with fallback utility
  const displayImage = !imageError
    ? (venue.cover_image || getVenueImageUrl(venue, 'card', venueId))
    : getDeterministicFallback(venueId);

  // Google Maps directions URL
  const directionsUrl = (venue.latitude && venue.longitude)
    ? `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueName + ' ' + address)}`;

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(venue);
  };

  return (
    <div
      role="dialog"
      aria-label={`Thông tin sân ${venueName}`}
      className={`relative w-[320px] sm:w-[350px] md:w-[380px] max-w-[calc(100vw-32px)] bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl shadow-2xl overflow-hidden animate-fade-in transition-all duration-200 ${className}`}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng thông tin sân"
        className="absolute top-2.5 right-2.5 z-20 w-7 h-7 bg-black/45 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-xs transition-colors shadow-sm cursor-pointer"
      >
        <X size={15} />
      </button>

      {/* Cover Image & Badges */}
      <div className="relative w-full h-40 sm:h-44 bg-gray-200 overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}

        <img
          src={displayImage}
          alt={venueName}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

        {/* Sport category badge */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600/90 backdrop-blur-xs text-white text-xs font-semibold rounded-full shadow-xs">
          <SportIcon sport={sportCategory} size={12} className="text-white" />
          <span>{sportCategory}</span>
        </div>

        {/* Favorite Quick Action Toggle */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFav ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
          title={isFav ? 'Đã yêu thích' : 'Yêu thích'}
          className="absolute top-2.5 left-2.5 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-700 backdrop-blur-xs flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-pointer"
        >
          <Heart
            size={16}
            className={isFav ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'}
          />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-3.5 sm:p-4 space-y-2.5">
        <div>
          <h3 className="font-bold text-base text-gray-900 line-clamp-1">
            {venueName}
          </h3>
          {branchName && (
            <p className="text-xs text-gray-500 line-clamp-1 font-medium">{branchName}</p>
          )}
        </div>

        {/* Address */}
        <div className="flex items-start gap-1.5 text-xs text-gray-600">
          <MapPin size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2 leading-relaxed">{address || 'Đang cập nhật địa chỉ'}</span>
        </div>

        {/* Rating & Price */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span>{rating}</span>
            <span className="text-gray-400 font-normal">({reviewCount} đánh giá)</span>
          </div>

          <div className="font-bold text-emerald-600 text-sm">
            {priceDisplay}
          </div>
        </div>

        {/* Quick Action Button Group */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Directions Button */}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chỉ đường tới sân trên Google Maps"
            className="py-2 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Navigation size={13} className="text-emerald-600 -rotate-45" />
            <span>Chỉ đường</span>
          </a>

          {/* Booking Button */}
          {venueId ? (
            <Link
              to={`/venues/${venueId}/booking`}
              aria-label="Đặt sân trực tuyến"
              className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
            >
              <Calendar size={13} />
              <span>Đặt sân</span>
            </Link>
          ) : (
            <div className="py-2 px-2.5 bg-gray-100 text-gray-400 text-xs font-semibold rounded-xl text-center">
              Đặt sân
            </div>
          )}
        </div>

        {/* View Detail Link */}
        {venueId && (
          <Link
            to={`/venues/${venueId}`}
            aria-label="Xem chi tiết câu lạc bộ"
            className="w-full py-1.5 text-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1 hover:underline transition-all cursor-pointer"
          >
            <span>Xem thông tin chi tiết</span>
            <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}

export default React.memo(VenuePreviewCard);
