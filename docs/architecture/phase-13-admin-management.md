# PHASE 13 — Admin Dashboard & Platform Administration

## Task Documentation

### 13.01 Admin Dashboard
- **Implementation**: `AdminDashboard.jsx` frontend and `AdminController.getDashboard` backend.
- **API Endpoint**: `GET /api/v1/admin/dashboard`.
- **Authorization**: `ADMIN` role only.
- **Validation**: Enforced by JWT auth and aggregate query logic.
- **Data Source**: Aggregates from `User`, `Venue`, `Booking`, `Payment` tables.
- **Security Test**: `CUSTOMER` / `OWNER` receive `403 Forbidden`.
- **Regression Result**: PASS.
- **TBD Dependency**: None.

### 13.02 User Management
- **Implementation**: `AdminUsers.jsx` frontend and `AdminController.getUsers`, `AdminController.updateUser` backend.
- **API Endpoint**: `GET /api/v1/admin/users`, `PATCH /api/v1/admin/users/:id`.
- **Authorization**: `ADMIN` role only.
- **Validation**: Strict field whitelist for updates (only `primary_role` and `account_status`). Excludes `password_hash` from reads.
- **Data Source**: `User` table.
- **Security Test**: Role escalation protection verified. Non-admins cannot alter their role via standard endpoints.
- **Regression Result**: PASS.

### 13.03 Owner Management
- **Implementation**: Uses User Management APIs filtered by `primary_role = 'OWNER'`.
- **API Endpoint**: `GET /api/v1/admin/users?role=OWNER`.
- **Authorization**: `ADMIN` role.
- **Validation**: Ensures we do not fabricate an unauthorized `OwnerApplication` table.
- **Data Source**: `User` table.
- **Regression Result**: PASS.

### 13.04 Venue Approval
- **Implementation**: `AdminVenues.jsx` and `AdminController.getVenues`, `AdminController.updateVenueStatus`.
- **API Endpoint**: `GET /api/v1/admin/venues`, `PATCH /api/v1/admin/venues/:id/status`.
- **Authorization**: `ADMIN` role.
- **Validation**: Validates transition to `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`.
- **Data Source**: `Venue` table.
- **Regression Result**: PASS.

### 13.05 Booking Management
- **Implementation**: `AdminBookings.jsx` and `AdminController.getBookings`.
- **API Endpoint**: `GET /api/v1/admin/bookings`.
- **Authorization**: `ADMIN` role.
- **Validation**: Platform-wide read-only visibility. Excludes sensitive customer data where appropriate.
- **Data Source**: `Booking` table.
- **Regression Result**: PASS.

### 13.06 Payment Management
- **Implementation**: `AdminPayments.jsx` and `AdminController.getPayments`.
- **API Endpoint**: `GET /api/v1/admin/payments`.
- **Authorization**: `ADMIN` role.
- **Validation**: Read-only platform-wide payment states. Backend remains authoritative for MoMo integration.
- **Data Source**: `Payment` table.
- **Regression Result**: PASS.

### 13.07 Review Management
- **Implementation**: NOT IMPLEMENTED.
- **REASON**: `TBD-PH07-RATING-01` remains active. `Review`/`Rating` models do not exist in the Core MVP 19-table ERD.
- **Regression Result**: PASS WITH NON-BLOCKING GAPS.

### 13.08 Reports
- **Implementation**: NOT IMPLEMENTED.
- **REASON**: The MVP architectural Source of Truth defines no explicit Reporting domain (e.g., Report snapshot tables, PDF generator, BI warehouse).
- **Regression Result**: PASS WITH NON-BLOCKING GAPS.

## TBD GOVERNANCE
- **TBD-BOOK-01**: PRESERVED.
- **TBD-DM-006**: PRESERVED.
- **TBD-PAY-003**: PRESERVED.
- **TBD-PH07-RATING-01**: PRESERVED.
- **TBD-PH08-PRICE-01**: PRESERVED.
- **TBD-PH09-RESCHEDULE-PRICE-01**: PRESERVED.
