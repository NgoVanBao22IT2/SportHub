import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import OwnerLayout from './components/OwnerLayout';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerBookings from './pages/OwnerBookings';
import OwnerBookingDetail from './pages/OwnerBookingDetail';
import OwnerSchedules from './pages/OwnerSchedules';
import OwnerVenues from './pages/OwnerVenues';
import OwnerVenueDetail from './pages/OwnerVenueDetail';
import OwnerBranches from './pages/OwnerBranches';
import OwnerCourts from './pages/OwnerCourts';
import OwnerPricing from './pages/OwnerPricing';
import OwnerServices from './pages/OwnerServices';
import OwnerPaymentAccounts from './pages/OwnerPaymentAccounts';
import OwnerPayments from './pages/OwnerPayments';
import OwnerPaymentDetail from './pages/OwnerPaymentDetail';
import OwnerRevenue from './pages/OwnerRevenue';
import OwnerReviews from './pages/OwnerReviews';
import OwnerReviewDetail from './pages/OwnerReviewDetail';
import OwnerNotifications from './pages/OwnerNotifications';
import OwnerProfile from './pages/OwnerProfile';
import OwnerMedia from './pages/OwnerMedia';
import OwnerPosts from './pages/OwnerPosts';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
            <OwnerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/owner/dashboard" replace />} />
        <Route path="dashboard" element={<Navigate to="/owner/dashboard" replace />} />
        <Route path="owner" element={<Navigate to="/owner/dashboard" replace />} />
        <Route path="owner/dashboard" element={<OwnerDashboard />} />
        <Route path="owner/bookings" element={<OwnerBookings />} />
        <Route path="owner/bookings/:bookingId" element={<OwnerBookingDetail />} />
        <Route path="owner/schedules" element={<OwnerSchedules />} />
        <Route path="owner/venues" element={<OwnerVenues />} />
        <Route path="owner/venues/:venueId" element={<OwnerVenueDetail />} />
        <Route path="owner/media" element={<OwnerMedia />} />
        <Route path="owner/posts" element={<OwnerPosts />} />
        <Route path="owner/branches" element={<OwnerBranches />} />
        <Route path="owner/courts" element={<OwnerCourts />} />
        <Route path="owner/pricing" element={<OwnerPricing />} />
        <Route path="owner/services" element={<OwnerServices />} />
        <Route path="owner/payment-accounts" element={<OwnerPaymentAccounts />} />
        <Route path="owner/payments" element={<OwnerPayments />} />
        <Route path="owner/payments/:paymentId" element={<OwnerPaymentDetail />} />
        <Route path="owner/revenue" element={<OwnerRevenue />} />
        <Route path="owner/reviews" element={<OwnerReviews />} />
        <Route path="owner/reviews/:reviewId" element={<OwnerReviewDetail />} />
        <Route path="owner/notifications" element={<OwnerNotifications />} />
        <Route path="owner/profile" element={<OwnerProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/owner/dashboard" replace />} />
    </Routes>
  );
}

export default App;
