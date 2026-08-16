const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'frontend', 'src');
const pagesDir = path.join(baseDir, 'pages');
const componentsDir = path.join(baseDir, 'components');
const apiDir = path.join(baseDir, 'api');

[pagesDir, componentsDir, apiDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// API Client
fs.writeFileSync(path.join(apiDir, 'client.js'), `
import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = \`Bearer \${token}\`;
    return config;
});

export default api;
`);

// Router & App
fs.writeFileSync(path.join(baseDir, 'App.jsx'), `
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
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

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
            <Route index element={<Homepage />} />
            <Route path="search" element={<Search />} />
            <Route path="venues" element={<VenueList />} />
            <Route path="venues/:id" element={<VenueDetail />} />
            
            {/* Protected Routes */}
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
`);

fs.writeFileSync(path.join(baseDir, 'main.jsx'), `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`);

fs.writeFileSync(path.join(componentsDir, 'Layout.jsx'), `
import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const Layout = () => (
    <div className="layout">
        <header>
            <nav>
                <Link to="/">Home</Link> | 
                <Link to="/search">Search</Link> | 
                <Link to="/venues">Venues</Link> | 
                <Link to="/my-bookings">My Bookings</Link> | 
                <Link to="/profile">Profile</Link>
            </nav>
        </header>
        <main>
            <Outlet />
        </main>
    </div>
);

export default Layout;
`);

// Generate Pages
const pages = [
    'Homepage', 'Search', 'VenueList', 'VenueDetail', 'Booking',
    'Checkout', 'Payment', 'MyBooking', 'BookingDetail', 'Favorite',
    'Review', 'Profile', 'Notification'
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
    if (page === 'Review' || page === 'Notification') {
        content = `
import React from 'react';

const ${page} = () => {
    return (
        <div className="page-container error-state">
            <h1>${page}</h1>
            <p>NOT IMPLEMENTED - TBD GAP. The ${page} domain is not fully approved in the backend schema.</p>
        </div>
    );
};

export default ${page};
`;
    }
    fs.writeFileSync(path.join(pagesDir, `${page}.jsx`), content);
});

// index.css
fs.writeFileSync(path.join(baseDir, 'index.css'), `
:root {
  --primary-color: #3b82f6;
  --bg-color: #0f172a;
  --text-color: #f8fafc;
}
body {
  margin: 0;
  font-family: 'Inter', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
}
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
header {
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}
nav a {
  color: var(--primary-color);
  text-decoration: none;
  margin-right: 1rem;
}
.page-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.error-state {
  border: 1px solid #ef4444;
  padding: 1rem;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
}
`);

console.log('Frontend generated successfully.');
