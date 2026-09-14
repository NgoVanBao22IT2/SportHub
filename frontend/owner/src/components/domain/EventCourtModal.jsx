import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, Users, Tag, MapPin, Sparkles, Trophy } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

/**
 * Modal to Create / Edit an Event Court (Vé Social / Sân sự kiện) for Owner
 */
export default function EventCourtModal({ isOpen, onClose, onSave, eventData, venues = [] }) {
  const [venueId, setVenueId] = useState('');
  const [title, setTitle] = useState('');
  const [courtName, setCourtName] = useState('');
  const [skillLevel, setSkillLevel] = useState('2.5 -> 3.0');
  const [playDate, setPlayDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('20:00');
  const [endTime, setEndTime] = useState('23:00');
  const [ticketPrice, setTicketPrice] = useState('90000');
  const [maxParticipants, setMaxParticipants] = useState('8');
  const [status, setStatus] = useState('PUBLISHED');
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
      setCourtName(eventData.court_name || 'Pickleball 1');
      setSkillLevel(eventData.skill_level || '2.5 -> 3.0');
      setPlayDate(eventData.play_date || eventData.date || new Date().toISOString().split('T')[0]);
      setStartTime(eventData.start_time || '20:00');
      setEndTime(eventData.end_time || '23:00');
      setTicketPrice(eventData.ticket_price ? String(eventData.ticket_price) : '90000');
      setMaxParticipants(eventData.max_participants ? String(eventData.max_participants) : '8');
      setStatus(eventData.status || 'PUBLISHED');
    } else {
      setTitle('');
      setCourtName('Pickleball 1');
      setSkillLevel('2.5 -> 3.0');
      setPlayDate(new Date().toISOString().split('T')[0]);
      setStartTime('20:00');
      setEndTime('23:00');
      setTicketPrice('90000');
      setMaxParticipants('8');
      setStatus('PUBLISHED');
    }
    setErrorMsg('');
  }, [eventData, isOpen, venues]);

  if (!isOpen) return null;

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
      const eventMeta = {
        court_name: courtName.trim() || 'Sân sự kiện',
        skill_level: skillLevel.trim() || '2.5 -> 3.0',
        play_date: playDate,
        start_time: startTime,
        end_time: endTime,
        ticket_price: Number(ticketPrice),
        max_participants: Number(maxParticipants) || 8
      };

      const payload = {
        venue_id: venueId,
        title: title.trim(),
        content: title.trim(),
        content_type: 'EVENT',
        excerpt: JSON.stringify(eventMeta),
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

          {/* Court Name & Skill Rating */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Tên sân *</label>
              <input
                type="text"
                placeholder="VD: Sân 1, Sân 02,..."
                value={courtName}
                onChange={(e) => setCourtName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 font-semibold focus:border-accent-primary focus:outline-none"
                required
              />
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
