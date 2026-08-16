import React, { useState, useEffect } from 'react';
import { X, CreditCard, Save, Upload, Trash2, QrCode } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

const VIETNAM_BANKS = [
  'MB Bank (Ngân hàng Quân Đội)',
  'Vietcombank (VCB)',
  'Techcombank (TCB)',
  'VietinBank',
  'BIDV',
  'ACB',
  'VPBank',
  'TPBank',
  'Sacombank',
  'Agribank',
  'VIB',
  'HD Bank'
];

export default function PaymentAccountFormModal({
  isOpen,
  onClose,
  account,
  venues,
  onSubmit,
  loading
}) {
  const [form, setForm] = useState({
    venue_id: '',
    payment_method: 'BANK_TRANSFER',
    bank_name: 'MB Bank (Ngân hàng Quân Đội)',
    account_number: '',
    account_name: '',
    phone_number: '',
    qr_code_url: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (account) {
      setForm({
        venue_id: account.venue_id || (venues[0]?.venue_id || ''),
        payment_method: account.payment_method || 'BANK_TRANSFER',
        bank_name: account.bank_name || 'MB Bank (Ngân hàng Quân Đội)',
        account_number: account.account_number || '',
        account_name: account.account_name || '',
        phone_number: account.phone_number || '',
        qr_code_url: account.qr_code_url || ''
      });
    } else {
      setForm({
        venue_id: venues[0]?.venue_id || '',
        payment_method: 'BANK_TRANSFER',
        bank_name: 'MB Bank (Ngân hàng Quân Đội)',
        account_number: '',
        account_name: '',
        phone_number: '',
        qr_code_url: ''
      });
    }
    setError('');
  }, [account, isOpen, venues]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (error) setError('');
  };

  const handleQrFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Dung lượng ảnh QR không được vượt quá 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setForm((f) => ({ ...f, qr_code_url: resizedDataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    if (error) setError('');
  };

  const handleRemoveQr = () => {
    setForm((f) => ({ ...f, qr_code_url: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.venue_id) {
      setError('Vui lòng chọn Câu lạc bộ.');
      return;
    }
    if (!form.account_name.trim()) {
      setError('Vui lòng nhập Tên chủ tài khoản.');
      return;
    }
    if (!form.account_number.trim()) {
      setError('Vui lòng nhập Số tài khoản / Số điện thoại.');
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-border-subtle-medium shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-subtle shrink-0">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <CreditCard size={18} className="text-brand-orange" />
            {account ? 'Chỉnh sửa Tài khoản thanh toán' : 'Thêm Tài khoản thanh toán mới'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Venue Selection */}
          <div className="space-y-1">
            <label className="font-bold text-gray-900 block">Chọn Câu lạc bộ áp dụng *</label>
            <select
              name="venue_id"
              value={form.venue_id}
              onChange={handleChange}
              disabled={Boolean(account)}
              className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 focus:border-brand-orange focus:outline-none text-xs"
            >
              {venues.map((v) => (
                <option key={v.venue_id} value={v.venue_id}>
                  {v.venue_name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div className="space-y-1">
            <label className="font-bold text-gray-900 block">Phương thức thanh toán *</label>
            <select
              name="payment_method"
              value={form.payment_method}
              onChange={handleChange}
              className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 focus:border-brand-orange focus:outline-none text-xs"
            >
              <option value="BANK_TRANSFER">Chuyển khoản Ngân hàng (BANK_TRANSFER)</option>
              <option value="MOMO">Ví MoMo (MOMO)</option>
            </select>
          </div>

          {/* Bank Transfer Specific Fields */}
          {form.payment_method === 'BANK_TRANSFER' ? (
            <>
              <div className="space-y-1">
                <label className="font-bold text-gray-900 block">Tên Ngân hàng *</label>
                <select
                  name="bank_name"
                  value={form.bank_name}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 focus:border-brand-orange focus:outline-none text-xs"
                >
                  {VIETNAM_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label="Số tài khoản ngân hàng (STK) *"
                  name="account_number"
                  placeholder="VD: 190388888888..."
                  value={form.account_number}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <Input
                label="Số điện thoại Ví MoMo *"
                name="account_number"
                placeholder="VD: 0905123456..."
                value={form.account_number}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {/* Account Owner Name */}
          <div>
            <Input
              label="Tên chủ tài khoản (Viết hoa không dấu) *"
              name="account_name"
              placeholder="VD: NGO VAN BAO"
              value={form.account_name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Upload QR Code Image from Local */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-900 block flex items-center justify-between">
              <span>Ảnh QR Code chuyển khoản</span>
              <span className="text-[10px] text-text-muted font-normal">(Không bắt buộc)</span>
            </label>

            {form.qr_code_url ? (
              <div className="flex items-center gap-4 p-3 bg-surface-subtle border border-border-subtle rounded-xl">
                <div className="w-20 h-20 bg-white rounded-lg border p-1 shrink-0 overflow-hidden flex items-center justify-center">
                  <img src={form.qr_code_url} alt="QR Code Preview" className="w-full h-full object-contain" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                    <QrCode size={14} className="text-emerald-600" />
                    Đã chọn ảnh QR Code
                  </p>
                  <p className="text-[11px] text-text-muted">Ảnh QR này sẽ hiển thị cho khách hàng quét thanh toán.</p>
                  <div className="flex gap-3 pt-1">
                    <label className="cursor-pointer text-[11px] font-bold text-brand-orange hover:underline flex items-center gap-1">
                      <Upload size={13} />
                      Đổi ảnh khác
                      <input type="file" accept="image/*" onChange={handleQrFileChange} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveQr}
                      className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      Xóa ảnh QR
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border-subtle-medium hover:border-brand-orange rounded-xl cursor-pointer bg-surface-subtle/50 hover:bg-orange-50/20 transition-all text-center group">
                <Upload size={24} className="text-text-muted group-hover:text-brand-orange mb-1 transition-colors" />
                <span className="text-xs font-bold text-gray-900 group-hover:text-brand-orange transition-colors">
                  Tải ảnh QR Code từ thiết bị (Local)
                </span>
                <span className="text-[10px] text-text-muted mt-0.5">
                  Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 5MB)
                </span>
                <input type="file" accept="image/*" onChange={handleQrFileChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={loading} leftIcon={<Save size={16} />}>
              {account ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
