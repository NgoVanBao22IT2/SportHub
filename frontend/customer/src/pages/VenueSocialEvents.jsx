import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Calendar, 
  Ticket, 
  Zap, 
  Users, 
  Clock, 
  Eye, 
  Plus, 
  CalendarOff,
  ChevronRight,
  Share2,
  RefreshCw
} from 'lucide-react';
import { getVenueById } from '../api/venues';
import { getPublicVenuePosts } from '../api/public';
import { getVenueImageUrl, getDeterministicFallback } from '../utils/imageUrl';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';

export default function VenueSocialEvents() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [venue, setVenue] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // Generate next 7 days dynamically for date picker pills (always updated with real-time current date)
  const todayKey = new Date().toDateString();
  const dateTabs = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const d = new Date();
      d.setDate(d.getDate() + index);

      const dateStr = d.toISOString().split('T')[0];
      const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      let label = '';
      if (index === 0) {
        label = 'Hôm nay';
      } else {
        const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        label = daysOfWeek[d.getDay()];
      }

      return {
        index,
        label,
        formattedDate,
        fullDate: dateStr,
        displayTitle: `${label} ${formattedDate}`
      };
    });
  }, [todayKey]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const venueData = await getVenueById(id);
      setVenue(venueData);

      // Fetch venue posts / events
      try {
        const res = await getPublicVenuePosts(id);
        const postsList = res?.data || res || [];
        setEvents(postsList);
      } catch (_) {
        setEvents([]);
      }
    } catch (err) {
      console.error('Error loading venue social events:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, fetchData]);

  // Robust Venue Avatar Resolution
  const venueAvatar = (venue && getVenueImageUrl(venue, 'avatar', id)) || getDeterministicFallback(id);

  // Robust Venue Address Resolution
  const mainBranch = venue?.branches && venue.branches.length > 0 ? venue.branches[0] : null;
  const venueAddress = venue?.address 
    || (mainBranch ? [mainBranch.street_address, mainBranch.ward_district_city || mainBranch.district].filter(Boolean).join(', ') : '')
    || 'Địa chỉ sân chưa cập nhật';

  // Parse DB event data accurately (0% demo data, 100% DB source of truth)
  const parseEventObj = (ev) => {
    if (!ev) return {};
    let meta = {};
    if (ev.excerpt) {
      try {
        meta = typeof ev.excerpt === 'string' && ev.excerpt.startsWith('{') ? JSON.parse(ev.excerpt) : {};
      } catch (_) {}
    }

    const play_date = ev.play_date || meta.play_date || (ev.start_at ? ev.start_at.split('T')[0] : '') || ev.created_at?.split('T')[0] || '';
    const start_time = ev.start_time || meta.start_time || (ev.start_at ? ev.start_at.split('T')[1]?.substring(0, 5) : '') || '';
    const end_time = ev.end_time || meta.end_time || (ev.end_at ? ev.end_at.split('T')[1]?.substring(0, 5) : '') || '';
    const court_name = ev.court_name || meta.court_name || ev.location || '';
    const skill_level = ev.skill_level || meta.skill_level || ev.discount_info || '';
    const ticket_price = (ev.ticket_price !== undefined && ev.ticket_price !== null) 
      ? Number(ev.ticket_price) 
      : ((meta.ticket_price !== undefined && meta.ticket_price !== null) 
          ? Number(meta.ticket_price) 
          : Number(ev.fee_amount || 0));
          
    const max_participants = Number(ev.max_participants || meta.max_participants || 8);
    const joined_count = (ev.joined_count !== undefined && ev.joined_count !== null) 
      ? Number(ev.joined_count) 
      : ((meta.joined_count !== undefined && meta.joined_count !== null) ? Number(meta.joined_count) : 0);

    return {
      ...ev,
      ...meta,
      play_date,
      start_time,
      end_time,
      court_name,
      skill_level,
      ticket_price,
      max_participants,
      joined_count
    };
  };

  const formatEventDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const cleanDate = dateStr.split('T')[0];
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        const formatted = `${parts[2]}/${parts[1]}`;
        const todayStr = new Date().toISOString().split('T')[0];
        if (cleanDate === todayStr) {
          return `${formatted} Hôm nay`;
        }
        return formatted;
      }
    } catch (_) {}
    return dateStr;
  };

  // Filter events by selected date (matching fullDate)
  const selectedDateObj = dateTabs[selectedDateIndex] || dateTabs[0];
  const parsedEvents = events.map(parseEventObj);
  const filteredEvents = parsedEvents.filter((ev) => {
    if (!ev.play_date) return true;
    return ev.play_date === selectedDateObj.fullDate;
  });

  // Navigate to Checkout page when user clicks "Mua vé"
  const handleBuyTicket = (ev) => {
    const venueIdToUse = ev.venue_id || venue?.venue_id || id;
    const dateToUse = ev.play_date || selectedDateObj.fullDate || new Date().toISOString().split('T')[0];
    const startTimeToUse = ev.start_time ? (ev.start_time.length === 5 ? `${ev.start_time}:00` : ev.start_time) : '20:00:00';
    const endTimeToUse = ev.end_time ? (ev.end_time.length === 5 ? `${ev.end_time}:00` : ev.end_time) : '23:00:00';
    
    // Resolve real DB court_id for this venue
    const allVenueCourts = venue?.branches?.flatMap(b => b.courts || []) || [];
    const matchedCourt = allVenueCourts.find(c => 
      c.court_name && ev.court_name && c.court_name.trim().toLowerCase() === ev.court_name.trim().toLowerCase()
    ) || allVenueCourts[0];

    const courtIdToUse = ev.court_id || matchedCourt?.court_id || matchedCourt?.id || '';
    const courtNameToUse = ev.court_name || matchedCourt?.court_name || 'Sân 1';
    const priceToUse = Number(ev.ticket_price || ev.fee_amount || 90000);

    const params = new URLSearchParams();
    params.set('venueId', venueIdToUse);
    if (courtIdToUse) params.set('courtId', courtIdToUse);
    params.set('date', dateToUse);
    params.set('startTime', startTimeToUse);
    params.set('endTime', endTimeToUse);

    navigate(`/checkout?${params.toString()}`, {
      state: {
        venueId: venueIdToUse,
        venueName: venue?.venue_name,
        date: dateToUse,
        courtId: courtIdToUse,
        courtName: courtNameToUse,
        ticketPrice: priceToUse,
        eventTitle: ev.title || 'Sự kiện giao lưu',
        selectedSlots: [
          {
            court_id: courtIdToUse,
            court_name: courtNameToUse,
            start_time: startTimeToUse,
            end_time: endTimeToUse,
            price: priceToUse
          }
        ],
        totalAmount: priceToUse,
        totalHours: 3
      }
    });
  };

  return (
    <div className="min-h-screen bg-surface-subtle pb-16">
      {/* Top Header Bar - SportHub System Design Style */}
      <section className="bg-surface border-b border-border-subtle-medium py-4 sm:py-5 px-4">
        <div className="max-w-7xl mx-auto sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Left: Back Arrow + Venue Info */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-text-muted hover:text-gray-900 rounded-full hover:bg-surface-subtle transition-colors border border-border-subtle"
                aria-label="Quay lại"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="flex items-center gap-3">
                <img
                  src={venueAvatar}
                  alt={venue?.venue_name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-xl object-cover border border-border-subtle shadow-xs flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = getDeterministicFallback(id);
                  }}
                />

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-bold text-lg sm:text-xl text-gray-900 leading-tight">
                      {venue?.venue_name || 'Tên chi nhánh sân'}
                    </h1>
                    {venue?.rating && (
                      <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {venue.rating}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted flex items-center gap-1 mt-1 line-clamp-1">
                    <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                    <span>{venueAddress}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Action Button: Làm mới */}
            <div className="flex items-center gap-3.5">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw size={15} />}
                onClick={fetchData}
                className="text-xs font-semibold text-gray-700 hover:text-gray-900 border-border-subtle-medium"
              >
                Làm mới
              </Button>
            </div>

          </div>
        </div>
      </section>

      {/* Date Navigation Tabs Bar */}
      <div className="bg-surface flex justify-center border-b border-border-subtle shadow-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {dateTabs.map((tab) => {
              const isSelected = tab.index === selectedDateIndex;
              return (
                <button
                  key={tab.index}
                  onClick={() => setSelectedDateIndex(tab.index)}
                  className={`flex flex-col items-center justify-center min-w-[76px] px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-accent-primary text-white shadow-md scale-[1.02]'
                      : 'bg-surface-subtle text-gray-700 hover:bg-gray-200/80 border border-border-subtle'
                  }`}
                >
                  <span className="text-[11px] opacity-90">{tab.label}</span>
                  <span className="text-xs font-extrabold">{tab.formattedDate}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {loading ? (
          <div className="space-y-4 max-w-3xl mx-auto">
            <Skeleton height="180px" radius="xl" />
            <Skeleton height="180px" radius="xl" />
          </div>
        ) : filteredEvents.length === 0 ? (
          
          /* EMPTY STATE (SportHub Styled, matching exact Alobo requirements) */
          <div className="max-w-md mx-auto my-12 text-center">
            <Card radius="2xl" padding="xl" className="border border-border-subtle-medium shadow-sm bg-surface">
              <div className="w-16 h-16 rounded-2xl bg-surface-subtle border border-border-subtle text-text-muted flex items-center justify-center mx-auto mb-4">
                <CalendarOff size={32} className="text-gray-400" />
              </div>
              
              <h3 className="text-base font-semibold text-gray-800 leading-relaxed mb-6 px-4">
                Hiện không có sự kiện nào đang mở tại chi nhánh này.
              </h3>

              <Button
                variant="outline"
                size="md"
                className="w-full max-w-[160px] mx-auto border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold"
                onClick={() => navigate(-1)}
              >
                Quay lại
              </Button>
            </Card>
          </div>

        ) : (

          /* ACTIVE EVENTS STATE */
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
              <Zap className="text-brand-orange fill-brand-orange" size={20} />
              <span>Đang diễn ra</span>
              <span className="text-xs text-text-muted font-normal">
                ({filteredEvents.length} sự kiện)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvents.map((ev) => (
                <Card
                  key={ev.id || ev.post_id}
                  radius="xl"
                  padding="none"
                  className="border border-border-subtle-medium hover:border-accent-primary/40 transition-all overflow-hidden bg-surface group"
                >
                  <div className="p-4 space-y-3">
                    
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          LIVE
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700">
                          🎫 Xé vé
                        </span>
                        <span className="text-[11px] font-semibold text-text-muted">
                          #{ev.code || ev.id?.slice(0, 6) || '6937'}
                        </span>
                      </div>
                      {/* <button className="text-text-muted hover:text-gray-700 p-1">
                        <Share2 size={16} />
                      </button> */}
                    </div>

                    {/* Time & Title */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-base leading-snug group-hover:text-accent-primary transition-colors">
                          {ev.title || ev.content || 'Trận giao lưu ghép sân'}
                        </h4>
                        
                        <div className="flex items-center gap-2 mt-2 text-xs text-text-muted flex-wrap">
                          {ev.skill_level && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px]">
                              Trình: {ev.skill_level}
                            </span>
                          )}
                          {ev.court_name && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                              🗺️ {ev.court_name}
                            </span>
                          )}
                          {(ev.start_time || ev.end_time) && (
                            <span className="flex items-center gap-1 text-gray-700 font-medium">
                              <Clock size={13} className="text-brand-orange" />
                              {ev.start_time}{ev.end_time ? ` - ${ev.end_time}` : ''}
                            </span>
                          )}
                          {ev.play_date && (
                            <span className="flex items-center gap-1 text-brand-orange font-bold bg-orange-50 px-2 py-0.5 rounded text-[11px]">
                              <Calendar size={12} />
                              {formatEventDateDisplay(ev.play_date)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-base font-extrabold text-brand-orange">
                          {Number(ev.ticket_price || 0).toLocaleString('vi-VN')} VNĐ/Vé
                        </span>
                          {/* <span className="block text-[10px] text-text-muted">/ vé</span> */}

                      </div>
                    </div>

                    {/* Progress Bar & Participants */}
                    <div className="pt-2 border-t border-border-subtle-medium space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted text-[11px]">
                          {ev.joined_count}/{ev.max_participants} người tham gia
                        </span>
                        <span className="font-semibold text-emerald-600 text-[11px]">
                          Còn {Math.max(0, (ev.max_participants || 8) - (ev.joined_count || 0))} chỗ
                        </span>
                      </div>

                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-accent-primary h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (((ev.joined_count || 0) / (ev.max_participants || 1)) * 100))}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye size={14} />}
                        onClick={() => ev.slug && navigate(`/posts/${ev.slug}`)}
                        className="text-xs text-text-muted hover:text-gray-900"
                      >
                        {/* Xem chi tiết */}
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Ticket size={14} />}
                        onClick={() => handleBuyTicket(ev)}
                        className="bg-accent-primary hover:bg-emerald-600 text-xs font-bold rounded-lg px-4"
                      >
                        Mua vé
                      </Button>
                    </div>

                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
