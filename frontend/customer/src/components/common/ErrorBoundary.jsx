import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { logError } from '../../utils/errorLogger';

/**
 * Global React Error Boundary Component
 * Catches unhandled render errors, logs them safely, and renders a branded fallback UI.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError({
      source: 'react-boundary',
      action: 'componentDidCatch',
      error,
      metadata: { componentStack: errorInfo?.componentStack }
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-gray-900">
                Đã xảy ra sự cố không mong muốn
              </h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                Hệ thống gặp lỗi khi hiển thị giao diện. Bạn có thể thử tải lại trang hoặc quay về trang chủ.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all"
              >
                <RotateCcw size={16} />
                <span>Tải lại trang</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Home size={16} />
                <span>Trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
