# SportHub – Hệ thống đặt lịch sân thể thao online (Concurrent Multi-User Architecture)

SportHub là hệ thống đặt lịch sân thể thao trực tuyến đa vai trò với kiến trúc **One Shared Backend API + One Shared MySQL Database + 3 Independent Frontends** cho phép **Admin**, **Owner**, và **Customer** truy cập và thao tác đồng thời trên 3 cổng riêng biệt.

---

## 🏗 Kiến trúc Hệ thống

```text
                                  ┌───────────────────────────┐
                                  │    Express REST API       │
                                  │      (Port 3000)          │
                                  │   http://localhost:3000   │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │    MySQL 8.0 Database     │
                                  │     (sporthubai_dev)      │
                                  └─────────────┬─────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
    ┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
    │     ADMIN FRONTEND      │    │     OWNER FRONTEND      │    │    CUSTOMER FRONTEND    │
    │     frontend/admin      │    │     frontend/owner      │    │    frontend/customer    │
    │       (Port 5173)       │    │       (Port 5174)       │    │       (Port 5175)       │
    │  http://localhost:5173  │    │  http://localhost:5174  │    │  http://localhost:5175  │
    └─────────────────────────┘    └─────────────────────────┘    └─────────────────────────┘
```

---

## 🚀 Cài đặt & Khởi chạy Dự án

### 1. Khởi chạy Backend API (Port 3000)
```bash
cd backend
npm install
npm run dev
```
- API Endpoint: `http://localhost:3000/api/v1`
- Health Check: `http://localhost:3000/health`

### 2. Khởi chạy Admin Frontend (Port 5173)
```bash
cd frontend/admin
npm install
npm run dev
```
- URL: `http://localhost:5173`

### 3. Khởi chạy Owner Frontend (Port 5174)
```bash
cd frontend/owner
npm install
npm run dev
```
- URL: `http://localhost:5174`

### 4. Khởi chạy Customer Frontend (Port 5175)
```bash
cd frontend/customer
npm install
npm run dev
```
- URL: `http://localhost:5175`

---

## 🔐 Phân Quyền & Bảo Mật

- **Stateless JWT Bearer Authentication**: Xác thực độc lập từng request qua Header `Authorization: Bearer <token>`.
- **Role-Based Access Control (RBAC)**: Backend kiểm tra role qua `requireRole('ADMIN')`, `requireRole('OWNER')`, `requireRole('CUSTOMER')`.
- **Tab Isolation**: Quản lý phiên làm việc độc lập theo từng tab trình duyệt (`sessionStorage` primary sandbox), cho phép mở 3 tab cho 3 role khác nhau trên cùng 1 trình duyệt mà không bị xung đột token.
- **Double Booking Protection**: Sử dụng InnoDB Pessimistic Locking (`lock: transaction.LOCK.UPDATE`) và MySQL Transactions chống đặt trùng lịch sân.

---

## 🧪 Test Suites

### Chạy Test Multi-User Concurrent API & Double Booking
```bash
node backend/test_multi_user_concurrent.js
```
