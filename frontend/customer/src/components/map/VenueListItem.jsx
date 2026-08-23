import React, { useState } from 'react';
import { Star, MapPin, Heart } from 'lucide-react';
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
  return `Từ ${new Intl.NumberFormat('vi-VN').format(price)}đ`;
};

/**
 * VenueListItem Component (Phase 6 Polish)
 * Interactive list row representation of a venue with quick favorite toggle and accessible keyboard navigation.
 */
function VenueListItem({
  venue,
  isSelected = false,
  onSelectVenue
}) {
  const [imageError, setImageError] = useState(false);
  const { isFavorite: checkIsFavorite, toggleFavorite } = useFavorites();

  if (!venue) return null;

  const venueId = venue.venue_id || venue.id;
  const venueName = venue.name || venue.venue_name || 'Sân thể thao';
  const branchName = venue.branch_name || '';
  const sportCategory = venue.sport_category || 'Thể thao';
  const address = venue.address || `${venue.street_address || ''}, ${venue.ward_district_city || ''}`.replace(/^,\s*/, '').trim();
  const numRating = Number(venue.average_rating || venue.rating || 0);
  const rating = numRating > 0 ? numRating.toFixed(1) : null;
  const reviewCount = Number(venue.review_count || venue.rating_count || 0);
  const priceDisplay = formatPrice(venue.min_price);

  const isFav = checkIsFavorite(venueId);

  const displayImage = !imageError
    ? (venue.cover_image || getVenueImageUrl(venue, 'card', venueId))
    : getDeterministicFallback(venueId);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(venue);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectVenue && onSelectVenue(venue)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onSelectVenue) {
          e.preventDefault();
          onSelectVenue(venue);
        }
      }}
      aria-label={`Xem vị trí sân ${venueName}`}
      aria-selected={isSelected}
      className={`group flex items-start gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-emerald-50/80 border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
          : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        <img
          src={displayImage}
          alt={venueName}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
          <SportIcon sport={sportCategory} size={10} className="text-white" />
          <span>{sportCategory}</span>
        </div>
      </div>

      {/* Info Body */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-20">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h4 className={`text-sm font-bold truncate transition-colors ${isSelected ? 'text-emerald-700' : 'text-gray-900 group-hover:text-emerald-600'}`}>
              {venueName}
            </h4>

            {/* Quick Favorite Icon */}
            <button
              type="button"
              onClick={handleFavoriteClick}
              aria-label={isFav ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
              className="p-1 -mr-1 -mt-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Heart size={14} className={isFav ? 'fill-red-500 text-red-500' : 'hover:fill-red-200'} />
            </button>
          </div>

          {branchName && (
            <p className="text-[11px] text-gray-500 truncate font-medium">{branchName}</p>
          )}

          <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1 truncate">
            <MapPin size={12} className="text-emerald-600 flex-shrink-0" />
            <span className="truncate">{address || 'Đang cập nhật'}</span>
          </div>
        </div>

        {/* Rating & Price */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="flex items-center gap-1 text-amber-500 font-semibold text-[11px]">
            {rating ? (
              <>
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span>{rating}</span>
                <span className="text-gray-400 font-normal">({reviewCount})</span>
              </>
            ) : (
              <span className="text-gray-400 font-normal text-[10px]">Chưa có đánh giá</span>
            )}
          </div>

          <div className="font-bold text-emerald-600 text-xs">
            {priceDisplay}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(VenueListItem);
