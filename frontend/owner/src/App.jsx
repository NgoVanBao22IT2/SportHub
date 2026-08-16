import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import OwnerLayout from './components/OwnerLayout';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerBookings from './pages/owner/OwnerBookings';
import OwnerBookingDetail from './pages/owner/OwnerBookingDetail';
import OwnerSchedules from './pages/owner/OwnerSchedules';
import OwnerVenues from './pages/owner/OwnerVenues';
import OwnerVenueDetail from './pages/owner/OwnerVenueDetail';
import OwnerBranches from './pages/owner/OwnerBranches';
import OwnerCourts from './pages/owner/OwnerCourts';
import OwnerPricing from './pages/owner/OwnerPricing';
import OwnerServices from './pages/owner/OwnerServices';
import OwnerPaymentAccounts from './pages/owner/OwnerPaymentAccounts';
import OwnerPayments from './pages/owner/OwnerPayments';
import OwnerPaymentDetail from './pages/owner/OwnerPaymentDetail';
import OwnerRevenue from './pages/owner/OwnerRevenue';
import OwnerReviews from './pages/owner/OwnerReviews';
import OwnerReviewDetail from './pages/owner/OwnerReviewDetail';
import OwnerNotifications from './pages/owner/OwnerNotifications';
import OwnerProfile from './pages/owner/OwnerProfile';
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
