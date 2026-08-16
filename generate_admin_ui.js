const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'frontend', 'src');
const pagesDir = path.join(baseDir, 'pages', 'admin');
const componentsDir = path.join(baseDir, 'components');

if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });

// Admin Layout
fs.writeFileSync(path.join(componentsDir, 'AdminLayout.jsx'), `
import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const AdminLayout = () => (
    <div className="layout admin-layout">
        <header style={{ background: '#7f1d1d', color: 'white' }}>
            <nav>
                <Link to="/admin/dashboard" style={{ color: 'white' }}>Dashboard</Link> | 
                <Link to="/admin/users" style={{ color: 'white' }}>Users</Link> | 
                <Link to="/admin/owners" style={{ color: 'white' }}>Owners</Link> | 
                <Link to="/admin/venues" style={{ color: 'white' }}>Venues</Link> | 
                <Link to="/admin/bookings" style={{ color: 'white' }}>Bookings</Link> | 
                <Link to="/admin/payments" style={{ color: 'white' }}>Payments</Link> | 
                <Link to="/admin/reviews" style={{ color: 'white' }}>Reviews</Link> | 
                <Link to="/admin/reports" style={{ color: 'white' }}>Reports</Link>
            </nav>
        </header>
        <main>
            <Outlet />
        </main>
    </div>
);

export default AdminLayout;
`);

// Generate Admin Pages
const pages = [
    'AdminDashboard', 'AdminUsers', 'AdminOwners', 'AdminVenues', 
    'AdminBookings', 'AdminPayments', 'AdminReviews', 'AdminReports'
];

pages.forEach(page => {
    let content = `
import React from 'react';

const ${page} = () => {
    return (
        <div className="page-container">
            <h1>${page}</h1>
            <p>Welcome to the ${page} administration page.</p>
        </div>
    );
};

export default ${page};
`;
    if (page === 'AdminReviews' || page === 'AdminReports') {
        content = `
import React from 'react';

const ${page} = () => {
    return (
        <div className="page-container error-state">
            <h1>${page}</h1>
            <p>NOT IMPLEMENTED - TBD GAP. This domain is not part of the Core MVP Schema.</p>
        </div>
    );
};

export default ${page};
`;
    }
    fs.writeFileSync(path.join(pagesDir, `${page}.jsx`), content);
});

// We need to insert AdminRoutes into App.jsx
// Rather than rewriting the entire App.jsx, let's just generate a snippet we can inject
const adminRoutesSnippet = `
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOwners from './pages/admin/AdminOwners';
import AdminVenues from './pages/admin/AdminVenues';
import AdminBookings from './pages/admin/AdminBookings';
import AdminPayments from './pages/admin/AdminPayments';
import AdminReviews from './pages/admin/AdminReviews';
import AdminReports from './pages/admin/AdminReports';

/* INSIDE ROUTES */
        {/* ADMIN ROUTES */}
        <Route path="/admin" element={<PrivateRoute requireRole="ADMIN"><AdminLayout /></PrivateRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="owners" element={<AdminOwners />} />
            <Route path="venues" element={<AdminVenues />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="reports" element={<AdminReports />} />
        </Route>
`;

fs.writeFileSync(path.join(baseDir, 'admin_routes_snippet.js'), adminRoutesSnippet);
console.log('Admin Frontend generated successfully. Please update App.jsx with admin_routes_snippet.js');
