import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from './components/CustomerLayout';
import HomePage from './pages/customer/HomePage';
import VenueDetail from './pages/customer/VenueDetail';
import VisualBooking from './pages/customer/VisualBooking';
import BookingDetail from './pages/customer/BookingDetail';
import Search from './pages/Search';
import Booking from './pages/Booking';
import Checkout from './pages/Checkout';
import MyBooking from './pages/MyBooking';
import Favorite from './pages/Favorite';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
import OwnerLayout from './components/OwnerLayout';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerBookings from './pages/owner/OwnerBookings';
import OwnerBookingDetail from './pages/owner/OwnerBookingDetail';
import OwnerSchedules from './pages/owner/OwnerSchedules';
import OwnerVenues from './pages/owner/OwnerVenues';
import OwnerVenueDetail from './pages/owner/OwnerVenueDetail';
import OwnerPaymentAccounts from './pages/owner/OwnerPaymentAccounts';
import OwnerPayments from './pages/owner/OwnerPayments';
import OwnerPaymentDetail from './pages/owner/OwnerPaymentDetail';
import OwnerRevenue from './pages/owner/OwnerRevenue';
import OwnerReviews from './pages/owner/OwnerReviews';
import OwnerReviewDetail from './pages/owner/OwnerReviewDetail';
import OwnerNotifications from './pages/owner/OwnerNotifications';
import OwnerProfile from './pages/owner/OwnerProfile';
import OwnerBranches from './pages/owner/OwnerBranches';
import OwnerCourts from './pages/owner/OwnerCourts';
import OwnerPricing from './pages/owner/OwnerPricing';
import OwnerServices from './pages/owner/OwnerServices';

import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOwners from './pages/admin/AdminOwners';
import AdminVenues from './pages/admin/AdminVenues';
import AdminCourts from './pages/admin/AdminCourts';
import AdminBookings from './pages/admin/AdminBookings';
import AdminPayments from './pages/admin/AdminPayments';
import AdminReviews from './pages/admin/AdminReviews';
import AdminReports from './pages/admin/AdminReports';
import AdminOwnerRegistrations from './pages/admin/AdminOwnerRegistrations';
import OwnerRegistrationPage from './pages/customer/OwnerRegistrationPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<CustomerLayout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="search" element={<Search />} />
        <Route path="venues/:id" element={<VenueDetail />} />
        <Route
          path="venues/:id/booking"
          element={
            <ProtectedRoute>
              <VisualBooking />
            </ProtectedRoute>
          }
        />
        
        {/* Auth Public Routes */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="verify-otp" element={<VerifyOTP />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />

        {/* Protected Customer Routes */}
        <Route
          path="booking"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-bookings"
          element={
            <ProtectedRoute>
              <MyBooking />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-bookings/:bookingId"
          element={
            <ProtectedRoute>
              <BookingDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="favorites"
          element={
            <ProtectedRoute>
              <Favorite />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="owner-registration"
          element={
            <ProtectedRoute>
              <OwnerRegistrationPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Protected Owner Routes */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
            <OwnerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="bookings" element={<OwnerBookings />} />
        <Route path="bookings/:bookingId" element={<OwnerBookingDetail />} />
        <Route path="schedules" element={<OwnerSchedules />} />
        <Route path="venues" element={<OwnerVenues />} />
        <Route path="venues/:venueId" element={<OwnerVenueDetail />} />
        <Route path="branches" element={<OwnerBranches />} />
        <Route path="courts" element={<OwnerCourts />} />
        <Route path="pricing" element={<OwnerPricing />} />
        <Route path="services" element={<OwnerServices />} />
        <Route path="payment-accounts" element={<OwnerPaymentAccounts />} />
        <Route path="payments" element={<OwnerPayments />} />
        <Route path="payments/:paymentId" element={<OwnerPaymentDetail />} />
        <Route path="revenue" element={<OwnerRevenue />} />
        <Route path="reviews" element={<OwnerReviews />} />
        <Route path="reviews/:reviewId" element={<OwnerReviewDetail />} />
        <Route path="notifications" element={<OwnerNotifications />} />
        <Route path="profile" element={<OwnerProfile />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="owner-registrations" element={<AdminOwnerRegistrations />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="owners" element={<AdminOwners />} />
        <Route path="venues" element={<AdminVenues />} />
        <Route path="courts" element={<AdminCourts />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>
    </Routes>
  );
}

export default App;
