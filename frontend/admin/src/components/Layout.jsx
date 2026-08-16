
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
