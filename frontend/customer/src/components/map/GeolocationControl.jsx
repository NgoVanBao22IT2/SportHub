import React, { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

/**
 * GeolocationControl Component
 * Prominent circular GPS button that marks user location with red marker on map.
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
    <div className={`relative flex items-center ${className}`}>
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

      {/* Prominent Circular GPS Button */}
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={locating}
        aria-label="Định vị vị trí hiện tại"
        title="Định vị vị trí hiện tại"
        className="w-12 h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-200 disabled:opacity-75 ring-4 ring-white/80 border border-emerald-500/30 group cursor-pointer"
      >
        {locating ? (
          <Loader2 size={24} className="animate-spin text-white" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
          >
            {/* 4 outer crosshair tick marks */}
            <line x1="2" y1="12" x2="5.5" y2="12" />
            <line x1="18.5" y1="12" x2="22" y2="12" />
            <line x1="12" y1="2" x2="12" y2="5.5" />
            <line x1="12" y1="18.5" x2="12" y2="22" />
            {/* Outer ring */}
            <circle cx="12" cy="12" r="6.8" />
            {/* Solid center dot */}
            <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default React.memo(GeolocationControl);
