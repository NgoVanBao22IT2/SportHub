# PHASE 12 — Owner Dashboard & Venue Operations

## Task Documentation

### 12.01 Owner Dashboard
- **Implementation**: `OwnerDashboard.jsx` frontend and `OwnerController.getDashboard` backend.
- **API Used**: `GET /api/v1/owner/dashboard`.
- **Authorization**: `OWNER` role only.
- **Ownership Rule**: Metrics strictly filtered by `Venue.owner_user_id === req.user.userId`.
- **Validation**: Enforced by JWT auth and aggregate query logic.
- **Test Result**: PASS.
- **TBD Dependency**: None.

### 12.02 Venue Management
- **Implementation**: Reuses Phase 06 `VenueController`.
- **API Used**: `GET /api/v1/owner/venues`, `POST /api/v1/venues`, etc.
- **Authorization**: `OWNER` role.
- **Ownership Rule**: Strictly filters and validates by `req.user.userId`.
- **Test Result**: PASS.

### 12.03 Branch Management
- **Implementation**: Reuses Phase 06 `BranchController`.
- **API Used**: `GET /api/v1/venues/:venueId/branches`, etc.
- **Authorization**: `OWNER` role.
- **Ownership Rule**: Branch mutation checks Venue ownership.
- **Test Result**: PASS.

### 12.04 Court Management
- **Implementation**: Reuses Phase 06 `CourtController`.
- **API Used**: `POST /api/v1/venues/.../courts`.
- **Authorization**: `OWNER` role.
- **Ownership Rule**: Full chain `Venue -> Branch -> Court` ownership validation.
- **Test Result**: PASS.

### 12.05 Schedule
- **Implementation**: Reuses Phase 06 `ScheduleController`.
- **API Used**: `POST /api/v1/schedules/...`.
- **Authorization**: `OWNER` role.
- **Ownership Rule**: Schedule hierarchy pricing checks.
- **Test Result**: PASS.

### 12.06 Booking Management
- **Implementation**: `OwnerBookings.jsx` and `OwnerController.getBookings`.
- **API Used**: `GET /api/v1/owner/bookings`.
- **Authorization**: `OWNER` role.
- **Ownership Rule**: Joined via `Court -> Branch -> Venue` where `Venue.owner_user_id === req.user.userId`.
- **Test Result**: PASS.

### 12.07 Customer
- **Implementation**: `OwnerCustomers.jsx` and `OwnerController.getCustomers`.
- **API Used**: `GET /api/v1/owner/customers`.
- **Authorization**: `OWNER` role.
- **Ownership Rule**: Filters users who made bookings on Owner's venues.
- **Test Result**: PASS.

### 12.08 Pricing
- **Implementation**: Reuses OperatingSchedule logic from Phase 08.
- **API Used**: Extends Schedule APIs.
- **Authorization**: `OWNER` role.
- **Ownership Rule**: Preserves existing `COURT -> BRANCH -> VENUE` hierarchy.
- **Test Result**: PASS.

### 12.09 Services
- **Implementation**: NOT IMPLEMENTED.
- **REASON**: Source of truth gap. `ServiceItem` is Optional / MVP Candidate and not in Core ERD.
- **Test Result**: PASS WITH NON-BLOCKING GAPS.

### 12.10 Promotion
- **Implementation**: NOT IMPLEMENTED.
- **REASON**: Source of truth gap. `PromotionCoupon` is Optional / MVP Candidate and not in Core ERD.
- **Test Result**: PASS WITH NON-BLOCKING GAPS.

### 12.11 Revenue
- **Implementation**: `OwnerRevenue.jsx` and `OwnerController.getRevenue`.
- **API Used**: `GET /api/v1/owner/revenue`.
- **Authorization**: `OWNER` role.
- **Ownership Rule**: Calculates aggregate from strictly `PAID` payments belonging to `CONFIRMED`/`COMPLETED` bookings owned by the current owner.
- **Test Result**: PASS.

## TBD GOVERNANCE
- **TBD-BOOK-01**: PRESERVED.
- **TBD-DM-006**: PRESERVED.
- **TBD-PAY-001**: RESOLVED (Phase 10).
- **TBD-PAY-002**: RESOLVED (Phase 10).
- **TBD-PAY-003**: PRESERVED (Network failure manual reconciliation).
- **TBD-PAY-004**: RESOLVED (Phase 10).
- **TBD-PH07-RATING-01**: PRESERVED.
- **TBD-PH08-PRICE-01**: PRESERVED.
- **TBD-PH09-RESCHEDULE-PRICE-01**: PRESERVED.
