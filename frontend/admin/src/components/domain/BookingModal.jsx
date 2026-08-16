import React, { useState } from 'react';
import { X, Calendar, Ticket, ChevronRight, Sparkles, User, Users, Building2, ArrowLeft } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

/**
 * BOOKING FLOW MODAL:
 * Step 1: Hình thức đặt (Đặt lịch theo sân - Trực quan / Mua vé Social)
 * Step 2: Đối tượng đặt (Cá nhân / CLB đội nhóm / Doanh nghiệp)
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Function} props.onSelectVisualBooking
 * @param {Object} [props.venue]
 */
export default function BookingModal({ isOpen, onClose, onSelectVisualBooking, venue }) {
  const [step, setStep] = useState(1); // 1: Hình thức đặt, 2: Đối tượng đặt
  const [selectedTarget, setSelectedTarget] = useState('INDIVIDUAL');

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleSelectBookingType = () => {
    setStep(2); // Transition to Step 2: Đối tượng đặt
  };

  const handleConfirmTarget = (targetType) => {
    setStep(1);
    onSelectVisualBooking(targetType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-border-subtle-medium overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle-medium bg-surface-subtle">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="p-1.5 text-text-muted hover:text-gray-900 rounded-full hover:bg-surface transition-colors"
                aria-label="Quay lại bước 1"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              
              <h2 className="text-xl font-bold text-gray-900">
                {step === 1 ? 'CHỌN HÌNH THỨC ĐẶT' : 'CHỌN ĐỐI TƯỢNG ĐẶT'}
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-text-muted hover:text-gray-900 rounded-full hover:bg-surface transition-colors"
            aria-label="Đóng modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {/* STEP 1: HÌNH THỨC ĐẶT */}
          {step === 1 && (
            <>
              {/* OPTION 1: ĐẶT LỊCH THEO SÂN - TRỰC QUAN */}
              <Card
                radius="xl"
                padding="lg"
                className="border-2 border-brand-orange bg-brand-orange/5 hover:bg-brand-orange/10 transition-all cursor-pointer group relative overflow-hidden"
                onClick={handleSelectBookingType}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-orange text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <Calendar size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-base group-hover:text-brand-orange transition-colors">
                        ĐẶT LỊCH THEO SÂN - TRỰC QUAN
                      </h3>
                      
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Đặt lịch theo sân trên bảng trạng thái sân, lựa chọn nhiều khung giờ và nhiều sân cùng lúc.
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-brand-orange mt-1 group-hover:translate-x-1 transition-transform" />
                </div>

                
              </Card>

              {/* OPTION 2: MUA VÉ SOCIAL */}
              <Card
                radius="xl"
                padding="lg"
                className="border-2 border-[#09b69b] bg-accent-primary/5 hover:bg-accent-primary/10 transition-all cursor-pointer group relative overflow-hidden"
                onClick={handleSelectBookingType}

              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-primary text-white flex items-center justify-center flex-shrink-0">
                    <Ticket size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-700 group-hover:text-accent-primary text-base">
                        MUA VÉ SOCIAL
                      </h3>
                      <Badge variant="secondary" size="sm" leftIcon={<Sparkles size={12} />}>
                        NEW
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Tham gia các trận giao lưu ghép sân social ticket dành cho cá nhân và nhóm thể thao.
                    </p>
                  </div>
                      <ChevronRight size={20} className="text-accent-primary mt-1 group-hover:translate-x-1 transition-transform" />

                </div>
                
              </Card>
            </>
          )}

          {/* STEP 2: ĐỐI TƯỢNG ĐẶT */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-text-muted mb-2">
                Vui lòng chọn loại hình đối tượng để áp dụng bảng giá
              </p>

              {/* Target Option 1: Cá nhân / Nhóm nhỏ */}
              <Card
                radius="xl"
                padding="md"
                className={`border-2 transition-all cursor-pointer ${
                  selectedTarget === 'INDIVIDUAL'
                    ? 'border-brand-orange bg-brand-orange/5'
                    : 'border-border-subtle-medium hover:border-brand-orange/40 bg-surface'
                }`}
                onClick={() => setSelectedTarget('INDIVIDUAL')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold">
                    <User size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm">Giá chung</h4>
                  </div>
                  
                </div>
              </Card>

              {/* Target Option 2: CLB / Đội nhóm cố định */}
              <Card
                radius="xl"
                padding="md"
                className={`border-2 transition-all cursor-pointer ${
                  selectedTarget === 'CLUB'
                    ? 'border-[#09b69b] bg-accent-primary/5'
                    : 'border-border-subtle-medium hover:border-accent-primary/40 bg-surface'
                }`}
                onClick={() => setSelectedTarget('CLUB')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center font-bold">
                    <Users size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm">Học sinh - Sinh viên</h4>
                  </div>
                  
                </div>
              </Card>

              

              <div className="pt-3 border-t border-border-subtle-medium flex justify-end items-center">
                
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={<ChevronRight size={16} />}
                  onClick={() => handleConfirmTarget(selectedTarget)}
                >
                  Xác nhận & Chọn sân/giờ
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-surface-subtle border-t border-border-subtle-medium flex justify-between items-center text-xs text-text-muted">
          <span>{venue ? venue.venue_name : 'SportHub Platform'}</span>
          
        </div>

      </div>
    </div>
  );
}
