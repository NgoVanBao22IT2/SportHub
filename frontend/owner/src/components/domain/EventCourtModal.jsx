import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, Users, Tag, MapPin, Sparkles, Trophy, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { uploadOwnerMedia } from '../../api/owner';



/**
 * Modal to Create / Edit an Event Court (Vé Social / Sân sự kiện) for Owner
 */
const normalizeCourtName = (name) => {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b(sân|san|court|bàn|ban)\s*0+(\d+)\b/gi, '$1 $2');
};

export default function EventCourtModal({ isOpen, onClose, onSave, eventData, venues = [] }) {
  const [venueId, setVenueId] = useState('');
  const [courtId, setCourtId] = useState('');
  const [title, setTitle] = useState('');
  const [courtName, setCourtName] = useState('');
  const [skillLevel, setSkillLevel] = useState('2.5 -> 3.0');
  const [playDate, setPlayDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('20:00');
  const [endTime, setEndTime] = useState('23:00');
  const [ticketPrice, setTicketPrice] = useState('90000');
  const [maxParticipants, setMaxParticipants] = useState('8');
  const [note, setNote] = useState('bao gồm 1 nước 1 trứng 1 chuối');
  const [status, setStatus] = useState('PUBLISHED');

  // Derive available courts for selected venue
  const selectedVenue = venues.find(v => (v.venue_id || v.id) === venueId);
  const availableCourts = React.useMemo(() => {
    if (!selectedVenue) return [];
    const courtsList = [];
    if (selectedVenue.branches && Array.isArray(selectedVenue.branches)) {
      selectedVenue.branches.forEach(b => {
        if (b.courts && Array.isArray(b.courts)) {
          courtsList.push(...b.courts);
        }
      });
    } else if (selectedVenue.courts && Array.isArray(selectedVenue.courts)) {
      courtsList.push(...selectedVenue.courts);
    }
    return courtsList.sort((a, b) => (a.court_name || a.name || '').localeCompare(b.court_name || b.name || '', undefined, { numeric: true, sensitivity: 'base' }));
  }, [selectedVenue]);

  // Image Cover States
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageId, setCoverImageId] = useState('');
  const [pendingCoverBase64, setPendingCoverBase64] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (venues.length > 0 && !venueId) {
      setVenueId(venues[0].venue_id || venues[0].id || '');
    }
  }, [venues, venueId]);

  useEffect(() => {
    if (eventData) {
      setVenueId(eventData.venue_id || (venues[0]?.venue_id || venues[0]?.id || ''));
      setTitle(eventData.title || eventData.content || '');
      
      let meta = {};
      if (eventData.excerpt && typeof eventData.excerpt === 'string' && eventData.excerpt.startsWith('{')) {
        try { meta = JSON.parse(eventData.excerpt); } catch (_) {}
      }

      const initialCourtName = eventData.court_name || meta.court_name || eventData.location || (availableCourts[0]?.court_name || 'Sân 01');
      const matchedCourt = availableCourts.find(c =>
        (eventData.court_id && (c.court_id === eventData.court_id || c.id === eventData.court_id)) ||
        (meta.court_id && (c.court_id === meta.court_id || c.id === meta.court_id)) ||
        (normalizeCourtName(c.court_name || c.name) === normalizeCourtName(initialCourtName))
      );

      setCourtName(matchedCourt ? (matchedCourt.court_name || matchedCourt.name) : initialCourtName);
      setCourtId(matchedCourt ? (matchedCourt.court_id || matchedCourt.id) : (eventData.court_id || meta.court_id || ''));
      setSkillLevel(eventData.skill_level || meta.skill_level || '2.5 -> 3.0');
      setPlayDate(eventData.play_date || meta.play_date || eventData.date || new Date().toISOString().split('T')[0]);
      setStartTime(eventData.start_time || meta.start_time || '20:00');
      setEndTime(eventData.end_time || meta.end_time || '23:00');
      setTicketPrice(eventData.ticket_price ? String(eventData.ticket_price) : (meta.ticket_price ? String(meta.ticket_price) : '90000'));
      setMaxParticipants(eventData.max_participants ? String(eventData.max_participants) : (meta.max_participants ? String(meta.max_participants) : '8'));
      
      let rawNote = eventData.note || meta.note;
      if (!rawNote && eventData.amenities) rawNote = eventData.amenities;
      setNote((rawNote && !rawNote.includes('->')) ? rawNote : 'bao gồm 1 nước 1 trứng 1 chuối');
      
      setStatus(eventData.status || 'PUBLISHED');

      let existingImg = eventData.cover_image_url || eventData.cover_image?.image_url || meta.cover_image_url || meta.image_url;
      let existingId = eventData.cover_image_id || meta.cover_image_id;
      setCoverImageUrl(existingImg || '');
      setCoverImageId(existingId || '');
      setPendingCoverBase64('');
    } else {
      setTitle('');
      const defaultCourt = availableCourts[0];
      setCourtId(defaultCourt?.court_id || defaultCourt?.id || '');
      setCourtName(defaultCourt?.court_name || defaultCourt?.name || 'Sân 01');
      setSkillLevel('2.5 -> 3.0');
      setPlayDate(new Date().toISOString().split('T')[0]);
      setStartTime('20:00');
      setEndTime('23:00');
      setTicketPrice('90000');
      setMaxParticipants('8');
      setNote('bao gồm 1 nước 1 trứng 1 chuối');
      setStatus('PUBLISHED');
      setCoverImageUrl('');
      setCoverImageId('');
      setPendingCoverBase64('');
    }
    setErrorMsg('');
  }, [eventData, isOpen, venues]);

  useEffect(() => {
    if (!eventData && availableCourts.length > 0 && !courtId) {
      setCourtId(availableCourts[0].court_id || availableCourts[0].id || '');
      setCourtName(availableCourts[0].court_name || availableCourts[0].name || '');
    }
  }, [availableCourts, eventData, courtId]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Dung lượng ảnh không được vượt quá 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingCoverBase64(reader.result);
      setCoverImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!venueId) {
      setErrorMsg('Vui lòng chọn cơ sở / chi nhánh sân.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tên trận / sự kiện.');
      return;
    }
    if (!ticketPrice || Number(ticketPrice) <= 0) {
      setErrorMsg('Giá vé phải lớn hơn 0.');
      return;
    }

    setSubmitting(true);
    try {
      let finalCoverImageId = coverImageId;
      let finalCoverImageUrl = coverImageUrl;

      if (pendingCoverBase64 && venueId) {
        try {
          const uploadRes = await uploadOwnerMedia(venueId, {
            base64_image: pendingCoverBase64,
            image_type: 'EVENT',
            title: `Ảnh vé sự kiện: ${title.trim()}`,
            status: 'PUBLISHED'
          });

          const createdImg = uploadRes?.data?.[0];
          if (createdImg) {
            finalCoverImageId = createdImg.image_id;
            finalCoverImageUrl = createdImg.medium_url || createdImg.large_url || createdImg.original_url || createdImg.image_url;
          }
        } catch (uploadErr) {
          console.error('Failed to upload image:', uploadErr);
        }
      }

      const cleanCoverUrl = (finalCoverImageUrl && !finalCoverImageUrl.startsWith('data:')) ? finalCoverImageUrl : (coverImageUrl && !coverImageUrl.startsWith('data:') ? coverImageUrl : '');

      const eventMeta = {
        court_id: courtId || null,
        court_name: courtName.trim() || 'Sân sự kiện',
        skill_level: skillLevel.trim() || '2.5 -> 3.0',
        play_date: playDate,
        start_time: startTime,
        end_time: endTime,
        ticket_price: Number(ticketPrice),
        max_participants: Number(maxParticipants) || 8,
        note: note.trim() || 'bao gồm 1 nước 1 trứng 1 chuối',
        cover_image_url: cleanCoverUrl,
        cover_image_id: finalCoverImageId
      };

      const payload = {
        venue_id: venueId,
        court_id: courtId || null,
        title: title.trim(),
        content: title.trim(),
        content_type: 'EVENT',
        excerpt: JSON.stringify(eventMeta),
        cover_image_id: finalCoverImageId || null,
        cover_image_url: cleanCoverUrl || null,
        location: courtName.trim() || 'Sân sự kiện',
        discount_info: skillLevel.trim() || '2.5 -> 3.0',
        fee_amount: Number(ticketPrice),
        max_participants: Number(maxParticipants) || 8,
        start_at: `${playDate}T${startTime}:00`,
        end_at: `${playDate}T${endTime}:00`,
        court_name: courtName.trim() || 'Sân sự kiện',
        skill_level: skillLevel.trim() || '2.5 -> 3.0',
        play_date: playDate,
        start_time: startTime,
        end_time: endTime,
        ticket_price: Number(ticketPrice),
        note: note.trim() || 'bao gồm 1 nước 1 chuối',
        status: status || 'PUBLISHED'
      };

      await onSave(payload, eventData?.id || eventData?.post_id);
      onClose();
    } catch (err) {
      console.error('Error saving event court:', err);
      setErrorMsg(err.message || 'Không thể lưu sân sự kiện. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-border-subtle-medium overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center font-bold">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {eventData ? 'Chỉnh sửa Sân sự kiện / Vé Social' : 'Tạo Sân sự kiện mới (Vé Social)'}
              </h3>
              <p className="text-xs text-text-muted">
                Tạo suất xé vé giao lưu ghép sân hiển thị cho khách hàng
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-gray-900 rounded-full hover:bg-surface transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Select Venue */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Cơ sở / Chi nhánh sân *</label>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 font-semibold focus:border-accent-primary focus:outline-none"
              required
            >
              {venues.map((v) => (
                <option key={v.venue_id || v.id} value={v.venue_id || v.id}>
                  {v.venue_name || v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Event Title */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Tiêu đề sự kiện *</label>
            <input
              type="text"
              placeholder="VD: Giao lưu Cầu lông phong trào, ..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 font-semibold focus:border-accent-primary focus:outline-none"
              required
            />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <label className="block font-bold text-gray-700">Hình ảnh sự kiện / Banner vé *</label>
            
            <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-border-subtle-medium hover:border-accent-primary transition-all bg-surface-subtle p-3 flex flex-col items-center justify-center min-h-[140px] text-center">
              {coverImageUrl ? (
                <div className="relative w-full h-36 rounded-xl overflow-hidden group shadow-xs">
                  <img
                    src={coverImageUrl}
                    alt="Preview cover"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label
                      htmlFor="event-cover-file-input"
                      className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-900 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Upload size={14} /> Thay ảnh từ máy
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImageUrl('');
                        setCoverImageId('');
                        setPendingCoverBase64('');
                      }}
                      className="px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Trash2 size={14} /> Xóa ảnh
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="event-cover-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center p-4 w-full h-full space-y-1.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center font-bold">
                    <ImageIcon size={20} />
                  </div>
                  <span className="font-bold text-gray-800 text-xs">Bấm vào đây để tải ảnh từ thiết bị</span>
                  <span className="text-[11px] text-text-muted">Định dạng JPG, PNG, WEBP (Tối đa 10MB)</span>
                </label>
              )}

              <input
                id="event-cover-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Court Name & Skill Rating */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Tên sân *</label>
              {availableCourts.length > 0 ? (
                <select
                  value={courtId || (availableCourts.find(c => normalizeCourtName(c.court_name || c.name) === normalizeCourtName(courtName))?.court_id || '')}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setCourtId(selId);
                    const selCourt = availableCourts.find(c => (c.court_id || c.id) === selId);
                    if (selCourt) {
                      setCourtName(selCourt.court_name || selCourt.name);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 font-semibold focus:border-accent-primary focus:outline-none"
                  required
                >
                  <option value="">-- Chọn sân áp dụng --</option>
                  {availableCourts.map((c) => (
                    <option key={c.court_id || c.id} value={c.court_id || c.id}>
                      {c.court_name || c.name} {c.sport_category ? `(${c.sport_category})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="VD: Sân 01, Sân 02,..."
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 font-semibold focus:border-accent-primary focus:outline-none"
                  required
                />
              )}
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Trình độ / Level *</label>
              <input
                type="text"
                placeholder="VD: 1.5 -> 2.0, Cơ bản"
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 font-semibold focus:border-accent-primary focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Play Date & Time Slots */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Ngày chơi *</label>
              <input
                type="date"
                value={playDate}
                onClick={(e) => { try { e.currentTarget.showPicker(); } catch (_) {} }}
                onChange={(e) => setPlayDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 font-semibold focus:border-accent-primary focus:outline-none cursor-pointer"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Giờ bắt đầu *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 font-semibold focus:border-accent-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Giờ kết thúc *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 font-semibold focus:border-accent-primary focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Ticket Price & Max Slots */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Giá vé (VNĐ / vé) *</label>
              <input
                type="number"
                placeholder="VD: 80000"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 font-semibold focus:border-accent-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Số vé tối đa *</label>
              <input
                type="number"
                placeholder="VD: 8"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 font-semibold focus:border-accent-primary focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Note / Amenities */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Ghi chú / Tiện ích bao gồm</label>
            <input
              type="text"
              placeholder="VD: bao gồm 1 nước 1 trứng 1 chuối,..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 font-semibold focus:border-accent-primary focus:outline-none"
            />
          </div>

          {/* Status Select */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Trạng thái *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 font-semibold focus:border-accent-primary focus:outline-none"
            >
              <option value="PUBLISHED">Mở bán vé (Hiển thị LIVE)</option>
              <option value="DRAFT">Tạm ẩn / Bản nháp</option>
              <option value="ARCHIVED">Đã đóng vé</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
              className="bg-accent-primary hover:bg-emerald-600 font-bold"
            >
              {submitting ? 'Đang lưu...' : (eventData ? 'Cập nhật sân sự kiện' : 'Tạo sân sự kiện')}
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
}
