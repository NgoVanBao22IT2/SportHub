import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Heart, Star, ImageOff } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useFavorites } from '../../context/FavoritesContext';

import { getVenueImageUrl, getDeterministicFallback } from '../../utils/imageUrl';

/**
 * Reusable VenueCard Domain Component for SportHubAI Platform
 */
export default function VenueCard({
  venue,
  variant = 'default',
  href,
  onBook,
  onFavorite,
  isFavorite: isFavoriteProp,
  showRating = true,
  showLocation = true,
  className = '',
  ...restProps
}) {
  const [imageError, setImageError] = useState(false);
  const { isFavorite: checkIsFavorite, toggleFavorite } = useFavorites();

  if (!venue) return null;

  // Extract venue details safely from data model
  const venueId = venue.venue_id || venue.id;
  const venueName = venue.venue_name || venue.name || 'Sân thể thao';
  const targetHref = href || (venueId ? `/venues/${venueId}` : '#');

  // Determine active favorite status: prop override or from global FavoritesContext
  const isFavorite = isFavoriteProp !== undefined ? isFavoriteProp : checkIsFavorite(venueId);

  // Extract branch location string safely
  const locationStr = venue.branches && venue.branches.length > 0
    ? (venue.branches[0].ward_district_city || venue.branches[0].street_address || 'Địa chỉ đang cập nhật')
    : (venue.location || 'Địa chỉ đang cập nhật');

  // Purpose-driven image resolution selection with deterministic seed fallback
  const displayImage = !imageError 
    ? getVenueImageUrl(venue, 'card', venue) 
    : getDeterministicFallback(venue);

  // Normalize rating & review count from real API data
  const ratingValue = venue.average_rating || venue.rating || null;
  const reviewCountStr = venue.review_count ? `(${venue.review_count})` : '';

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFavorite) {
      onFavorite(venue);
    } else {
      await toggleFavorite(venue);
    }
  };

  const handleBookClick = (e) => {
    if (onBook) {
      e.preventDefault();
      onBook(venue);
    }
  };

  return (
    <Card
      variant="default"
      padding="none"
      radius="lg"
      className={[
        'group border border-border-subtle hover:border-border-subtle-medium hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col',
        variant === 'compact' ? 'max-w-sm' : 'w-full',
        className
      ].filter(Boolean).join(' ')}
      {...restProps}
    >
      {/* 1. VENUE IMAGE CONTAINER */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-muted flex items-center justify-center select-none">
        <img
          src={displayImage}
          alt={`${venueName} - sân thể thao`}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Floating Rating Badge */}
        {showRating && (
          <div className="absolute top-3 left-3 z-10">
            <Badge
              variant="rating"
              size="sm"
              leftIcon={<Star size={12} className="fill-current text-brand-orange-hover" />}
              ariaLabel={ratingValue ? `Đánh giá ${ratingValue}` : 'Chưa có đánh giá'}
            >
              {ratingValue ? (
                <>
                  {ratingValue} <span className="text-text-muted text-[11px] font-normal ml-0.5">{reviewCountStr}</span>
                </>
              ) : (
                'Mới'
              )}
            </Badge>
          </div>
        )}

        {/* Favorite Action Button (Touch target min 44x44px compliant) */}
        <button
          type="button"
          aria-label={isFavorite ? 'Bỏ lưu sân yêu thích' : 'Lưu sân yêu thích'}
          onClick={handleFavoriteClick}
          className={[
            'absolute top-3 right-3 z-10 w-9 h-9 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400 cursor-pointer',
            isFavorite
              ? 'bg-white text-red-500 shadow-md scale-105 hover:scale-110'
              : 'bg-white/80 backdrop-blur-md text-gray-400 hover:text-red-500 hover:bg-white hover:scale-105'
          ].join(' ')}
        >
          <Heart
            size={18}
            className={isFavorite ? 'fill-red-500 text-red-500 transition-colors duration-200' : 'text-gray-500 hover:text-red-500 transition-colors duration-200'}
          />
        </button>
      </div>

      {/* 2. VENUE CARD CONTENT */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-1.5">
          <Link to={targetHref} className="block group-hover:text-brand-orange transition-colors">
            <h3 className="font-bold text-lg text-gray-900 leading-snug truncate" title={venueName}>
              {venueName}
            </h3>
          </Link>

          {showLocation && (
            <div className="flex items-center text-xs text-text-muted gap-1">
              <MapPin size={14} className="flex-shrink-0 text-text-muted" />
              <span className="truncate">{locationStr}</span>
            </div>
          )}
        </div>

        {/* 3. PRIMARY BOOKING CTA */}
        <Link to={targetHref} onClick={handleBookClick} className="block w-full">
          <Button
            variant="primary"
            size="md"
            fullWidth
            leftIcon={<Calendar size={16} />}
          >
            Đặt lịch
          </Button>
        </Link>
      </div>
    </Card>
  );
}
