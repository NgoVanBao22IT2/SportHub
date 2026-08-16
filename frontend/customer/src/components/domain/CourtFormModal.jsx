import React, { useState, useEffect } from 'react';
import { X, Building2, Save } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function CourtFormModal({
  isOpen,
  onClose,
  court,
  onSubmit,
  loading
}) {
  const [form, setForm] = useState({
    court_name: '',
    sport_category: 'PICKLEBALL',
    court_status: 'ACTIVE',
    surface_features: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (court) {
      setForm({
        court_name: court.court_name || '',
        sport_category: court.sport_category || 'PICKLEBALL',
        court_status: court.court_status || 'ACTIVE',
        surface_features: court.surface_features || ''
      });
    } else {
      setForm({
        court_name: '',
        sport_category: 'PICKLEBALL',
        court_status: 'ACTIVE',
        surface_features: ''
      });
    }
    setError('');
  }, [court, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.court_name.trim()) {
      setError('Vui lòng nhập tên sân con.');
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-border-subtle-medium shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-subtle">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <Building2 size={18} className="text-brand-orange" />
            {court ? `Chỉnh sửa Sân ${court.court_name}` : 'Thêm Sân con mới'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-lg text-text-muted hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <Input
              label="Tên sân con *"
              name="court_name"
              placeholder="VD: Sân 1, Sân VIP..."
              value={form.court_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-900 block">Loại hình thể thao *</label>
            <select
              name="sport_category"
              value={form.sport_category}
              onChange={handleChange}
              className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 focus:border-brand-orange focus:outline-none text-xs"
            >
              <option value="PICKLEBALL">Pickleball</option>
              <option value="BADMINTON">Cầu lông (Badminton)</option>
              <option value="TENNIS">Tennis</option>
              <option value="FOOTBALL">Bóng đá</option>
              <option value="BASKETBALL">Bóng rổ</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-900 block">Trạng thái sân *</label>
            <select
              name="court_status"
              value={form.court_status}
              onChange={handleChange}
              className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 focus:border-brand-orange focus:outline-none text-xs"
            >
              <option value="ACTIVE">Hoạt động (Active)</option>
              <option value="MAINTENANCE">Bảo trì (Maintenance)</option>
              <option value="INACTIVE">Tạm ngưng (Inactive)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-900 block">Đặc điểm / Mặt sân</label>
            <input
              type="text"
              name="surface_features"
              placeholder="VD: Thảm tiêu chuẩn BWF, Đèn LED chống chói..."
              value={form.surface_features}
              onChange={handleChange}
              className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 focus:border-brand-orange focus:outline-none text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={loading} leftIcon={<Save size={16} />}>
              {court ? 'Lưu thay đổi' : 'Tạo sân con'}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
