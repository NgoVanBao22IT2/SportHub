import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOwners from './pages/admin/AdminOwners';
import AdminVenues from './pages/admin/AdminVenues';
import AdminReviews from './pages/admin/AdminReviews';
import AdminReports from './pages/admin/AdminReports';
import AdminOwnerRegistrations from './pages/admin/AdminOwnerRegistrations';
import AdminCommunity from './pages/admin/AdminCommunity';
import Login from './pages/Login';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />
        <Route path="admin/owner-registrations" element={<AdminOwnerRegistrations />} />
        <Route path="admin/community" element={<AdminCommunity />} />
        <Route path="admin/users" element={<AdminUsers />} />
        <Route path="admin/owners" element={<AdminOwners />} />
        <Route path="admin/venues" element={<AdminVenues />} />
        <Route path="admin/reviews" element={<AdminReviews />} />
        <Route path="admin/reports" element={<AdminReports />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

export default App;
