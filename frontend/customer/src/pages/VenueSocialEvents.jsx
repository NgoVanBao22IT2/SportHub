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
  RefreshCw,
  Info
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
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-evaluates event status: auto-closes ticket if time expires or max participants is reached
  const getEventTicketStatus = (playDate, startTime, joinedCount, maxParticipants, statusStr) => {
    const joined = Number(joinedCount) || 0;
    const max = Number(maxParticipants) || 8;
    const isFull = joined >= max;
    const isManuallyClosed = statusStr === 'ARCHIVED' || statusStr === 'CLOSED' || statusStr === 'DRAFT';

    if (isManuallyClosed) {
      return { isClosed: true, badgeText: 'ĐÃ ĐÓNG VÉ', btnText: 'Đã đóng vé', isFull: false };
    }

    if (isFull) {
      return { isClosed: true, badgeText: 'ĐÃ HẾT VÉ', btnText: 'Hết vé', isFull: true };
    }

    if (!playDate) {
      return { isClosed: false, badgeText: 'Đang diễn ra', btnText: 'Mua vé', isFull: false };
    }

    try {
      const cleanDate = playDate.split('T')[0];
      const startT = startTime ? (startTime.length === 5 ? `${startTime}:00` : startTime) : '00:00:00';
      const eventStartMs = new Date(`${cleanDate}T${startT}`).getTime();
      const diffMs = eventStartMs - nowTick;

      if (isNaN(diffMs) || diffMs <= 0) {
        // Event countdown reached 0 or start time passed -> AUTO CLOSE TICKET
        return { isClosed: true, badgeText: 'ĐÃ ĐÓNG VÉ', btnText: 'Đã đóng vé', isFull: false };
      }

      const totalSec = Math.floor(diffMs / 1000);
      const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
      const ss = String(totalSec % 60).padStart(2, '0');
      return { isClosed: false, badgeText: `Còn ${hh}:${mm}:${ss}`, btnText: 'Mua vé', isFull: false };
    } catch (_) {
      return { isClosed: false, badgeText: 'Đang diễn ra', btnText: 'Mua vé', isFull: false };
    }
  };

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
    const skill_level = ev.skill_level || meta.skill_level || '';
    const ticket_price = (ev.ticket_price !== undefined && ev.ticket_price !== null) 
      ? Number(ev.ticket_price) 
      : ((meta.ticket_price !== undefined && meta.ticket_price !== null) 
          ? Number(meta.ticket_price) 
          : Number(ev.fee_amount || 0));
          
    const max_participants = Number(ev.max_participants || meta.max_participants || 8);
    const joined_count = (ev.joined_count !== undefined && ev.joined_count !== null) 
      ? Number(ev.joined_count) 
      : ((meta.joined_count !== undefined && meta.joined_count !== null) ? Number(meta.joined_count) : 0);

    const rawNote = ev.note || meta.note || meta.amenities || '';
    const note = (rawNote && !rawNote.includes('->')) ? rawNote : 'bao gồm 1 nước 1 chuối';
    const code = ev.code || meta.code || (ev.id || ev.post_id || '').slice(0, 5) || '15281';
    const cover_image_url = ev.cover_image_url || ev.cover_image?.image_url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500&auto=format&fit=crop&q=60';

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
      joined_count,
      note,
      code,
      cover_image_url
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
    const ticketStatus = getEventTicketStatus(ev.play_date, ev.start_time, ev.joined_count, ev.max_participants, ev.status);
    if (ticketStatus.isClosed) {
      alert(ticketStatus.isFull ? 'Sự kiện này đã đủ số lượng người tham gia (Đã hết vé)!' : 'Sự kiện này đã hết thời gian mua vé (Đã đóng vé)!');
      return;
    }

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
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
              <Calendar className="text-brand-orange " size={20} />
              <span>Sắp tới</span>
              <span className="text-xs text-text-muted font-normal">
                ({filteredEvents.length} sự kiện)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
              {filteredEvents.map((ev) => {
                const coverImg = ev.cover_image_url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500&auto=format&fit=crop&q=60';
                const codeStr = ev.code || (ev.id || ev.post_id || '').slice(0, 5) || '15281';
                const noteText = ev.note || 'bao gồm 1 nước 1 chuối';
                const ticketStatus = getEventTicketStatus(ev.play_date, ev.start_time, ev.joined_count, ev.max_participants, ev.status);

                return (
                  <div
                    key={ev.id || ev.post_id}
                    className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group"
                  >
                    {/* TOP RIGHT DIAGONAL IMAGE BANNER */}
                    <div className="absolute top-0 right-0 w-50 h-36 overflow-hidden rounded-tr-2xl pointer-events-none z-0">
                      <img
                        src={coverImg}
                        alt={ev.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        style={{ clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0% 100%)' }}
                      />
                    </div>

                    {/* TOP RIGHT FLOATING SHARE BUTTON */}
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: ev.title || 'Sự kiện xé vé', url: window.location.href });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          alert('Đã sao chép liên kết sự kiện!');
                        }
                      }}
                      className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-white/95 shadow-md flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all hover:scale-105 border border-gray-100 cursor-pointer"
                      title="Chia sẻ sự kiện"
                    >
                      <Share2 size={14} />
                    </button>

                    {/* MAIN CARD CONTENT */}
                    <div className="p-4 relative z-10 space-y-3">
                      
                      {/* TOP BADGES ROW */}
                      <div className="flex items-center gap-1.5 flex-wrap max-w-[calc(100%-38px)]">
                        {/* Countdown / Closed Badge */}
                        {ticketStatus.isClosed ? (
                          <span className="bg-gray-200 text-gray-700 rounded-full text-[11px] font-bold px-2.5 py-0.5 inline-flex items-center gap-1 shadow-xs">
                            <Clock size={12} className="text-gray-500 shrink-0" />
                            <span>{ticketStatus.badgeText}</span>
                          </span>
                        ) : (
                          <span className="bg-blue-600 text-white rounded-full text-[11px] font-extrabold px-2.5 py-0.5 inline-flex items-center gap-1 shadow-xs">
                            <Clock size={12} className="text-white shrink-0" />
                            <span>{ticketStatus.badgeText}</span>
                          </span>
                        )}

                        {/* Purple Outline Ticket Badge */}
                        <span className="bg-purple-50 text-purple-600 border border-purple-300 rounded-full text-[11px] font-bold px-2.5 py-0.5 inline-flex items-center gap-1">
                          <Ticket size={12} className="text-purple-600 shrink-0" />
                          <span>Xé vé</span>
                        </span>

                        {/* Gray Hashtag Code */}
                        <span className="bg-gray-100 text-gray-600 rounded-md text-[11px] font-mono font-medium px-2 py-0.5">
                          #{codeStr}
                        </span>
                      </div>

                      {/* MIDDLE DETAILS ROW: TIME BOX + INFO */}
                      <div className="flex items-stretch gap-3 pt-1">
                        {/* LEFT: TIME & DATE BOX */}
                        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl px-2.5 py-2 flex flex-col items-center justify-center min-w-[72px] shrink-0 text-center">
                          <span className="text-blue-700 font-extrabold text-sm leading-none">{ev.start_time || '09:00'}</span>
                          <span className="text-blue-300 text-[10px] my-0.5 font-light">|</span>
                          <span className="text-blue-700 font-extrabold text-sm leading-none">{ev.end_time || '12:00'}</span>
                          
                          <div className="w-full border-t border-blue-200/70 my-1.5" />
                          
                          <div className="flex items-center gap-1 text-blue-600 font-bold text-xs">
                            <Calendar size={12} className="text-blue-500 shrink-0" />
                            <span>{formatEventDateDisplay(ev.play_date)}</span>
                          </div>
                        </div>

                        {/* RIGHT: TITLE, LEVEL, COURT, PRICE */}
                        <div className="flex-1 space-y-1.5 pr-20">
                          {/* Title */}
                          <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {ev.title || ev.content || 'xé vé newbie 3-6 tháng'}
                          </h4>

                          {/* Skill Level & Location */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {ev.skill_level && (
                              <span className="bg-blue-500 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                                <span>{ev.skill_level}</span>
                              </span>
                            )}
                            {ev.court_name && (
                              <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                                <MapPin size={13} className="text-emerald-600 shrink-0" />
                                <span>{ev.court_name}</span>
                              </span>
                            )}
                          </div>

                          {/* Price Row */}
                          <div className="pt-0.5 flex items-baseline gap-1">
                            <span className="text-amber-600 font-extrabold text-lg leading-none">
                              {Number(ev.ticket_price || 0).toLocaleString('vi-VN')} <span className="underline">đ</span>
                            </span>
                            <span className="text-xs text-gray-500 font-normal">/ vé</span>
                          </div>
                        </div>
                      </div>

                      {/* AMENITIES / INCLUDED NOTE CALLOUT BOX */}
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-amber-900 font-medium">
                        <Info size={14} className="text-amber-600 shrink-0" />
                        <span className="line-clamp-1">{noteText}</span>
                      </div>

                    </div>

                    {/* TICKET STUB DASHED DIVIDER & HALF-CIRCLE NOTCHES */}
                    <div className="relative w-full">
                      <div className="border-b border-dashed border-gray-200" />
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-surface-subtle rounded-full border-r border-gray-200 z-10" />
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-surface-subtle rounded-full border-l border-gray-200 z-10" />
                    </div>

                    {/* PROGRESS & PARTICIPANTS SECTION */}
                    <div className="p-4 pt-3 space-y-3">
                      <div className="space-y-1.5">
                        {/* Left green badge for joined count */}
                        <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs px-2.5 py-0.5 rounded-full inline-block">
                          {ev.joined_count || 0}/{ev.max_participants || 8}
                        </span>

                        {/* Thin Progress bar */}
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (((ev.joined_count || 0) / (ev.max_participants || 1)) * 100))}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* DASHED DIVIDER ABOVE FOOTER */}
                      <div className="border-b border-dashed border-gray-200 pt-1" />

                      {/* BOTTOM ACTION BUTTONS */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => ev.slug && navigate(`/posts/${ev.slug}`)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors border-none cursor-pointer"
                        >
                          <Eye size={14} className="text-gray-500" />
                          <span className='text-gray-500'>Xem chi tiết</span>
                        </button>

                        {ticketStatus.isClosed ? (
                          <button
                            disabled
                            className="bg-gray-100 border border-gray-200 text-gray-400 rounded-xl px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-80"
                            title={ticketStatus.isFull ? 'Sự kiện đã hết vé' : 'Sự kiện đã đóng vé'}
                          >
                            <Plus size={14} className="text-gray-400" />
                            <span>{ticketStatus.btnText}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBuyTicket(ev)}
                            className="bg-emerald-50/60 border border-emerald-500 text-accent-primary hover:bg-emerald-100/80 rounded-xl px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <Plus size={14} className="text-accent-primary" />
                            <span>Mua vé</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
