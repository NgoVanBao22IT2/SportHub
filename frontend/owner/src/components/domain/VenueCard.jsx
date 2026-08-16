import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Heart, Star, ImageOff } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

/**
 * Reusable VenueCard Domain Component for SportHubAI Platform
 *
 * @param {Object} props
 * @param {Object} props.venue - Venue data object from backend API
 * @param {'default' | 'compact'} [props.variant='default'] - Card layout variant
 * @param {string} [props.href] - Optional target link URL (e.g. `/venues/${venue_id}`)
 * @param {Function} [props.onBook] - Callback fired when clicking 'Đặt lịch' button
 * @param {Function} [props.onFavorite] - Callback fired when clicking Favorite heart button
 * @param {boolean} [props.isFavorite=false] - Favorite state
 * @param {boolean} [props.showRating=true] - Toggle rating display
 * @param {boolean} [props.showLocation=true] - Toggle location display
 * @param {string} [props.className=''] - Additional extension class
 */
export default function VenueCard({
  venue,
  variant = 'default',
  href,
  onBook,
  onFavorite,
  isFavorite = false,
  showRating = true,
  showLocation = true,
  className = '',
  ...restProps
}) {
  const [imageError, setImageError] = useState(false);

  if (!venue) return null;

  // Extract venue details safely from data model
  const venueId = venue.venue_id || venue.id;
  const venueName = venue.venue_name || venue.name || 'Sân thể thao';
  const targetHref = href || (venueId ? `/venues/${venueId}` : '#');

  // Extract branch location string safely
  const locationStr = venue.branches && venue.branches.length > 0
    ? (venue.branches[0].ward_district_city || venue.branches[0].street_address || 'Địa chỉ đang cập nhật')
    : (venue.location || 'Địa chỉ đang cập nhật');

  // Extract primary venue image URL safely from dataset / DB API
  const defaultFallbackImage = "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop";

  const datasetImage = venue.image_url ||
    venue.cover_image ||
    (Array.isArray(venue.images) && venue.images.length > 0
      ? (typeof venue.images[0] === 'string' ? venue.images[0] : venue.images[0]?.image_url)
      : null);

  const displayImage = (!imageError && datasetImage) ? datasetImage : defaultFallbackImage;

  // Normalize rating & review count from real API data
  const ratingValue = venue.average_rating || venue.rating || null;
  const reviewCountStr = venue.review_count ? `(${venue.review_count})` : '';

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFavorite) onFavorite(venue);
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
            'absolute top-3 right-3 z-10 w-9 h-9 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-orange',
            isFavorite
              ? 'bg-surface text-status-error'
              : 'bg-surface/80 backdrop-blur-md text-text-muted hover:text-status-error hover:bg-surface'
          ].join(' ')}
        >
          <Heart size={16} className={isFavorite ? 'fill-current text-status-error' : ''} />
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
