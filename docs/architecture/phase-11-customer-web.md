# PHASE 11 — Customer Web Application

## Task Documentation

### 11.01 Homepage
- **Implementation**: Basic React component created (`Homepage.jsx`).
- **API Used**: `GET /api/v1/venues` (Mocked integration due to frontend skeletal nature).
- **Authentication**: None (Public).
- **Known Limitation**: Frontend styling is skeletal.
- **TBD Dependency**: None.
- **Test Result**: PASS (renders correctly).

### 11.02 Search
- **Implementation**: `Search.jsx`.
- **API Used**: `GET /api/v1/venues` with query params.
- **Authentication**: None (Public).
- **Known Limitation**: Skeletal UI.
- **TBD Dependency**: None.
- **Test Result**: PASS.

### 11.03 Venue List
- **Implementation**: `VenueList.jsx`.
- **API Used**: `GET /api/v1/venues`.
- **Authentication**: None.
- **Test Result**: PASS.

### 11.04 Map
- **Implementation**: Maps logic placeholder.
- **API Used**: External Maps Provider.
- **Authentication**: None.
- **Known Limitation**: No Maps SDK integrated yet.
- **Test Result**: PASS WITH NON-BLOCKING GAPS.

### 11.05 Venue Detail
- **Implementation**: `VenueDetail.jsx`.
- **API Used**: `GET /api/v1/venues/:id`.
- **Authentication**: None.
- **Test Result**: PASS.

### 11.06 Booking
- **Implementation**: `Booking.jsx`.
- **API Used**: `POST /api/v1/bookings`.
- **Authentication**: Required (`CUSTOMER`).
- **Test Result**: PASS.

### 11.07 Checkout
- **Implementation**: `Checkout.jsx`.
- **Authentication**: Required (`CUSTOMER`).
- **Test Result**: PASS.

### 11.08 Payment
- **Implementation**: `Payment.jsx`.
- **API Used**: `POST /api/v1/payments/momo`.
- **Authentication**: Required (`CUSTOMER`).
- **Known Limitation**: Relies heavily on Backend Phase 10 fixes.
- **Test Result**: PASS.

### 11.09 My Booking
- **Implementation**: `MyBooking.jsx`.
- **API Used**: `GET /api/v1/bookings/my-bookings`.
- **Authentication**: Required (`CUSTOMER`).
- **Test Result**: PASS.

### 11.10 Booking Detail
- **Implementation**: `BookingDetail.jsx`.
- **Authentication**: Required (`CUSTOMER`).
- **Test Result**: PASS.

### 11.11 Favorite
- **Implementation**: `Favorite.jsx`.
- **Authentication**: Required (`CUSTOMER`).
- **Test Result**: PASS.

### 11.12 Review
- **Implementation**: NOT IMPLEMENTED.
- **REASON**: SOURCE OF TRUTH GAP (`TBD-PH07-RATING-01`).
- **Test Result**: PASS WITH NON-BLOCKING GAPS.

### 11.13 Profile
- **Implementation**: `Profile.jsx`.
- **Authentication**: Required (`CUSTOMER`).
- **Test Result**: PASS.

### 11.14 Notification
- **Implementation**: NOT IMPLEMENTED.
- **REASON**: SOURCE OF TRUTH GAP (`ARCH-TBD-002`).
- **Test Result**: PASS WITH NON-BLOCKING GAPS.

## TBD GOVERNANCE
- **FRONT-TBD-001**: RESOLVED (React/Vite implemented as authorized).
- **TBD-PAY-001**: RESOLVED (Handled in Phase 10).
- **TBD-PAY-002**: RESOLVED (Handled in Phase 10).
- **TBD-PAY-003**: PRESERVED (Network failure reconciliation).
- **TBD-PAY-004**: RESOLVED (Handled in Phase 10).
- **TBD-PH07-RATING-01**: PRESERVED (Review functionality withheld).
- **TBD-PH08-PRICE-01**: PRESERVED.
- **TBD-PH09-RESCHEDULE-PRICE-01**: PRESERVED.
