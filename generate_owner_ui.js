const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'frontend', 'src');
const pagesDir = path.join(baseDir, 'pages', 'owner');
const componentsDir = path.join(baseDir, 'components');

if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });

// Owner Layout
fs.writeFileSync(path.join(componentsDir, 'OwnerLayout.jsx'), `
import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const OwnerLayout = () => (
    <div className="layout owner-layout">
        <header style={{ background: '#1e293b' }}>
            <nav>
                <Link to="/owner/dashboard">Dashboard</Link> | 
                <Link to="/owner/venues">Venues</Link> | 
                <Link to="/owner/branches">Branches</Link> | 
                <Link to="/owner/courts">Courts</Link> | 
                <Link to="/owner/schedules">Schedules</Link> | 
                <Link to="/owner/bookings">Bookings</Link> | 
                <Link to="/owner/customers">Customers</Link> | 
                <Link to="/owner/revenue">Revenue</Link>
            </nav>
        </header>
        <main>
            <Outlet />
        </main>
    </div>
);

export default OwnerLayout;
`);

// Generate Owner Pages
const pages = [
    'OwnerDashboard', 'OwnerVenues', 'OwnerBranches', 'OwnerCourts', 'OwnerSchedules',
    'OwnerBookings', 'OwnerCustomers', 'OwnerPricing', 'OwnerRevenue', 'OwnerServices', 'OwnerPromotions'
];

pages.forEach(page => {
    let content = `
import React from 'react';

const ${page} = () => {
    return (
        <div className="page-container">
            <h1>${page}</h1>
            <p>Welcome to the ${page} page.</p>
        </div>
    );
};

export default ${page};
`;
    if (page === 'OwnerServices' || page === 'OwnerPromotions') {
        content = `
import React from 'react';

const ${page} = () => {
    return (
        <div className="page-container error-state">
            <h1>${page}</h1>
            <p>NOT IMPLEMENTED - TBD GAP. This domain is marked as Optional / MVP Candidate in the Source of Truth.</p>
        </div>
    );
};

export default ${page};
`;
    }
    fs.writeFileSync(path.join(pagesDir, `${page}.jsx`), content);
});

// Update App.jsx with Owner Routes
const appJsxContent = `
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import OwnerLayout from './components/OwnerLayout';

import Homepage from './pages/Homepage';
import Search from './pages/Search';
import VenueList from './pages/VenueList';
import VenueDetail from './pages/VenueDetail';
import Booking from './pages/Booking';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import MyBooking from './pages/MyBooking';
import BookingDetail from './pages/BookingDetail';
import Favorite from './pages/Favorite';
import Review from './pages/Review';
import Profile from './pages/Profile';
import Notification from './pages/Notification';

import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerVenues from './pages/owner/OwnerVenues';
import OwnerBranches from './pages/owner/OwnerBranches';
import OwnerCourts from './pages/owner/OwnerCourts';
import OwnerSchedules from './pages/owner/OwnerSchedules';
import OwnerBookings from './pages/owner/OwnerBookings';
import OwnerCustomers from './pages/owner/OwnerCustomers';
import OwnerPricing from './pages/owner/OwnerPricing';
import OwnerRevenue from './pages/owner/OwnerRevenue';
import OwnerServices from './pages/owner/OwnerServices';
import OwnerPromotions from './pages/owner/OwnerPromotions';

const PrivateRoute = ({ children, requireRole }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/" />;
    // Very basic role check for frontend skeleton
    if (requireRole === 'OWNER' && localStorage.getItem('role') !== 'OWNER') {
        return <Navigate to="/" />;
    }
    return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC & CUSTOMER ROUTES */}
        <Route path="/" element={<Layout />}>
            <Route index element={<Homepage />} />
            <Route path="search" element={<Search />} />
            <Route path="venues" element={<VenueList />} />
            <Route path="venues/:id" element={<VenueDetail />} />
            
            <Route path="booking" element={<PrivateRoute><Booking /></PrivateRoute>} />
            <Route path="checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
            <Route path="payment" element={<PrivateRoute><Payment /></PrivateRoute>} />
            <Route path="my-bookings" element={<PrivateRoute><MyBooking /></PrivateRoute>} />
            <Route path="bookings/:id" element={<PrivateRoute><BookingDetail /></PrivateRoute>} />
            <Route path="favorites" element={<PrivateRoute><Favorite /></PrivateRoute>} />
            <Route path="review" element={<PrivateRoute><Review /></PrivateRoute>} />
            <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="notifications" element={<PrivateRoute><Notification /></PrivateRoute>} />
        </Route>

        {/* OWNER ROUTES */}
        <Route path="/owner" element={<PrivateRoute requireRole="OWNER"><OwnerLayout /></PrivateRoute>}>
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="venues" element={<OwnerVenues />} />
            <Route path="branches" element={<OwnerBranches />} />
            <Route path="courts" element={<OwnerCourts />} />
            <Route path="schedules" element={<OwnerSchedules />} />
            <Route path="bookings" element={<OwnerBookings />} />
            <Route path="customers" element={<OwnerCustomers />} />
            <Route path="pricing" element={<OwnerPricing />} />
            <Route path="services" element={<OwnerServices />} />
            <Route path="promotions" element={<OwnerPromotions />} />
            <Route path="revenue" element={<OwnerRevenue />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
`;

fs.writeFileSync(path.join(baseDir, 'App.jsx'), appJsxContent);

console.log('Owner Frontend generated successfully.');
