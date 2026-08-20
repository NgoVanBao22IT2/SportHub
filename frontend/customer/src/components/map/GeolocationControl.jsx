import React, { useState } from 'react';
import { Crosshair, Loader2, CheckCircle2 } from 'lucide-react';

/**
 * GeolocationControl Component - Alobo-style floating action GPS button
 */
function GeolocationControl({ map = null, onLocate = null, className = '' }) {
  const [locating, setLocating] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  const handleLocateMe = () => {
    if (locating) return;

    if (!navigator.geolocation) {
      setFeedback({
        type: 'error',
        message: 'Trình duyệt không hỗ trợ định vị GPS.'
      });
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    setLocating(true);
    setFeedback(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const { latitude, longitude } = position.coords;

        if (map && typeof map.flyTo === 'function') {
          map.flyTo([latitude, longitude], 15, {
            duration: 1.2,
            easeLinearity: 0.25
          });
        }

        if (onLocate) {
          onLocate({ latitude, longitude });
        }

        setFeedback({
          type: 'success',
          message: 'Đã định vị vị trí của bạn'
        });
        setTimeout(() => setFeedback(null), 3000);
      },
      (error) => {
        setLocating(false);
        let msg = 'Không thể xác định vị trí hiện tại.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Bạn đã từ chối quyền truy cập vị trí.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Hết thời gian chờ phản hồi GPS.';
        }
        setFeedback({
          type: 'error',
          message: msg
        });
        setTimeout(() => setFeedback(null), 4000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Toast Feedback Badge */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`absolute right-14 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl animate-fade-in pointer-events-none z-50 flex items-center gap-1.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-700 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {feedback.type === 'success' && <CheckCircle2 size={13} className="text-emerald-200" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleLocateMe}
        disabled={locating}
        aria-label="Định vị vị trí hiện tại"
        title="Vị trí của tôi"
        className="w-11 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 disabled:opacity-75 ring-2 ring-white/90 cursor-pointer"
      >
        {locating ? (
          <Loader2 size={20} className="animate-spin text-white" />
        ) : (
          <Crosshair size={20} className="stroke-[2.4]" />
        )}
      </button>
    </div>
  );
}

export default React.memo(GeolocationControl);
