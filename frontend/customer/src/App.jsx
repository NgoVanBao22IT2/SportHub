import { Routes, Route } from 'react-router-dom';
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
    </Routes>
  );
}

export default App;
