# AUTHENTICATION & AUTHORIZATION MODULE — PHASE 05
## CORE BACKEND AUTH & RBAC IMPLEMENTATION SPECIFICATION

**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Phân hệ:** PHASE 05 — Authentication & Authorization  
**Parent Phase:** PHASE 04 — Database Migration / Backend Setup (Status: PASS WITH NON-BLOCKING GAPS)  
**Trạng thái:** IMPLEMENTATION & VALIDATION COMPLETE — PASS WITH NON-BLOCKING GAPS  
**Phiên bản:** OFFICIAL PHASE 05 SPECIFICATION & AUTHENTICATION HANDOFF  
**Tham chiếu nguồn chính thức:**  
- [01-actors-and-permissions.md](file:///e:/SportHubAI/docs/requirements/01-actors-and-permissions.md)  
- [02-use-cases-and-user-flows.md](file:///e:/SportHubAI/docs/requirements/02-use-cases-and-user-flows.md)  
- [03-functional-requirements.md](file:///e:/SportHubAI/docs/requirements/03-functional-requirements.md)  
- [04-business-rules.md](file:///e:/SportHubAI/docs/requirements/04-business-rules.md)  
- [05-data-model.md](file:///e:/SportHubAI/docs/requirements/05-data-model.md)  
- [08-backend-architecture.md](file:///e:/SportHubAI/docs/architecture/08-backend-architecture.md)  
- [30-database-auth-tables.md](file:///e:/SportHubAI/docs/architecture/30-database-auth-tables.md)  
- [34-database-index-and-constraints.md](file:///e:/SportHubAI/docs/architecture/34-database-index-and-constraints.md)  
- [35-database-migration-and-backend-setup.md](file:///e:/SportHubAI/docs/architecture/35-database-migration-and-backend-setup.md)  
**Ngày lập:** 2026-08-08  

---

## 1. EXECUTIVE SUMMARY & PHASE 05 IDENTITY

Tài liệu này đặc tả chi tiết **Module Xác Thực & Phân Quyền Backend (Core Backend Authentication & Authorization Module)** thuộc **PHASE 05** bao gồm 9 task thành phần:

```text
05.01 Register            │ 05.04 Login             │ 05.07 Forgot Password
05.02 Email OTP           │ 05.05 JWT               │ 05.08 Reset Password
05.03 Verify OTP          │ 05.06 Refresh Token     │ 05.09 RBAC
```

Mục tiêu cốt lõi của Phase 05:
1. **Tuân Thủ Tuyệt Đối Nguồn Sự Thật (Strict Baseline Alignment):** Thực thi đúng định danh `email + password`, vòng đời tài khoản (`UNVERIFIED`, `ACTIVE`, `SUSPENDED`), mã hóa mật khẩu bcrypt, và phân quyền dựa trên thuộc tính `users.primary_role` (`CUSTOMER`, `OWNER`, `ADMIN`). Không tạo thêm bảng RBAC đã bị deprecated.
2. **Bảo Mật Tuyệt Đối Dữ Liệu Nhạy Cảm (Zero Plaintext Policy):** Mật khẩu, OTP, Refresh Token, Reset Token tuyệt đối không lưu dạng plaintext dưới CSDL, không đưa vào log, không đưa vào JWT payload hay phản hồi API công khai.
3. **Bảo Tồn Trạng Trái TBD Bảo Mật (TBD Security Governance):**
   - **`TBD-AUTH-01` (OTP TTL & Max Attempt Limit Config):** Thiết lập dưới dạng cấu hình placeholder môi trường, không tự ý chốt cứng logic kinh doanh unapproved.
   - **`TBD-AUTH-02` (Refresh Token TTL & Rotation Spec):** Lưu `token_hash`, hỗ trợ thu hồi (`is_revoked`), bảo tồn TBD rotation policy.
   - **`TBD-AUTH-03` (Password Reset Token TTL):** Lưu `token_hash`, quản lý trạng thái `is_consumed`, bảo tồn TBD TTL.
4. **Phân Định Rõ Ràng Lớp Kiểm Soát Phân Quyền (Backend-Enforced RBAC & HTTP Error Boundaries):** Phân biệt chính xác giữa `401 Unauthorized` (chưa xác thực / token không hợp lệ) và `403 Forbidden` (đã xác thực nhưng không đủ quyền). Phân quyền được kiểm soát độc lập ở Backend, không phụ thuộc Frontend route guards.

---

## 2. PHASE 05 TBD REGISTER

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                 PHASE 05 TBD REGISTER                                                  │
├─────────────┬────────────────────────────────┬──────────────┬──────────────┬───────────────────────────────────────────┤
│ TBD ID      │ Description                    │ Status       │ Affected Task│ Implementation Temporary Behavior         │
├─────────────┼────────────────────────────────┼──────────────┼──────────────┼───────────────────────────────────────────┤
│ TBD-AUTH-01 │ OTP TTL & Max Attempt Limit    │ OPEN         │ 05.02, 05.03 │ Config-driven placeholder (AUTH_OTP_TTL)  │
│ TBD-AUTH-02 │ Refresh Token TTL & Rotation   │ OPEN         │ 05.04, 05.06 │ Hash persistence + Revocation API enabled │
│ TBD-AUTH-03 │ Password Reset Token TTL       │ OPEN         │ 05.07, 05.08 │ Config-driven placeholder (RESET_TTL)     │
└─────────────┴────────────────────────────────┴──────────────┴──────────────┴───────────────────────────────────────────┘
```

---

## 3. TASK 05.01 — REGISTER SPECIFICATION

- **Mô tả:** Đăng ký tài khoản người dùng mới bằng Email + Mật khẩu.
- **Vòng đời tài khoản ban đầu:** `account_status = 'UNVERIFIED'`.
- **Hành vi xử lý:**
  1. Kiểm tra tính hợp lệ của Input (email format, mật khẩu độ dài tối thiểu).
  2. Tra cứu email trùng lặp trong bảng `users`. Nếu đã tồn tại -> Phản hồi `409 Conflict` (hoặc `400 Bad Request` theo contract).
  3. Mã hóa mật khẩu bằng `bcrypt` (10 salt rounds).
  4. Tạo bản ghi `users` với `primary_role = 'CUSTOMER'` (hoặc `OWNER` nếu đăng ký chủ sân), trạng thái `UNVERIFIED`.
  5. Phát sinh OTP 6 chữ số, băm bcrypt và lưu vào bảng `otp_verifications` với `purpose = 'REGISTRATION'`.
  6. Gửi OTP qua `EmailService`.
  7. Phản hồi kết quả an toàn (không lộ `password_hash`, `otp_code`, `otp_code_hash`).

---

## 4. TASK 05.02 — EMAIL OTP SPECIFICATION

- **Mô tả:** Tạo và gửi mã OTP xác minh qua Email.
- **An toàn dữ liệu:** Plaintext OTP (6 chữ số ngẫu nhiên) chỉ tồn tại tạm thời trong bộ nhớ để gửi email. Dưới CSDL lưu bản băm `otp_code_hash`.
- **Lưu trữ:** Tạo bản ghi trong `otp_verifications` với `otp_id`, `email`, `otp_code_hash`, `purpose`, `is_consumed = false`, `expires_at`.

---

## 5. TASK 05.03 — VERIFY OTP SPECIFICATION

- **Mô tả:** Xác minh mã OTP do người dùng gửi lên.
- **Hành vi xử lý:**
  1. Tra cứu bản ghi `otp_verifications` mới nhất theo `email` và `purpose = 'REGISTRATION'` có `is_consumed = false`.
  2. So sánh mã OTP gửi lên với `otp_code_hash` bằng `bcrypt.compare()`.
  3. Nếu không khớp: Tăng `attempt_count`. Phản hồi lỗi `400 Bad Request`.
  4. Nếu khớp: Thực hiện giao dịch nguyên tử (Database Transaction):
     - Đánh dấu `is_consumed = true` trên bản ghi OTP.
     - Cập nhật tài khoản `users`: `account_status = 'ACTIVE'`, `email_verified_at = NOW()`.
  5. Phản hồi xác minh thành công.

---

## 6. TASK 05.04 — LOGIN SPECIFICATION

- **Mô tả:** Đăng nhập hệ thống bằng `email` và `password`.
- **Hành vi xử lý:**
  1. Tra cứu tài khoản theo `email`.
  2. Nếu không tìm thấy: Phản hồi lỗi generic `401 Unauthorized` ("Invalid email or password") để chống lộ diện tài khoản (Account Enumeration).
  3. Kiểm tra trạng thái tài khoản `account_status`:
     - Nếu `SUSPENDED`: Phản hồi `403 Forbidden` ("Account has been suspended").
     - Nếu `UNVERIFIED`: Phản hồi `403 Forbidden` ("Account email not verified. Please verify your email.").
  4. So sánh mật khẩu gửi lên với `password_hash` bằng `bcrypt.compare()`. Nếu sai -> Phản hồi `401 Unauthorized`.
  5. Phát hành **JWT Access Token** (thời hạn ngắn).
  6. Phát hành **Refresh Token** (64-char random hex), băm `token_hash` bằng SHA-256 / bcrypt, lưu vào bảng `refresh_tokens`.
  7. Phản hồi Access Token, Refresh Token, và thông tin User an toàn (không chứa `password_hash`).

---

## 7. TASK 05.05 — JWT SPECIFICATION

- **Mô tả:** Phát hành và kiểm tra JWT Access Token cho các Request yêu cầu xác thực.
- **Payload chuẩn:**
  ```json
  {
    "sub": "user_uuid_36_chars",
    "email": "user@example.com",
    "role": "CUSTOMER | OWNER | ADMIN",
    "iat": 1770590400,
    "exp": 1770594000
  }
  ```
- **Cam kết an toàn:** Tuyệt đối không chứa `password_hash`, OTP, Refresh Token hay thông tin nhạy cảm trong JWT payload.
- **Middleware `authenticateJWT`:** Gắn vào các protected routes. Đọc header `Authorization: Bearer <token>`, giải mã và xác minh chữ ký bí mật (`JWT_SECRET`). Nếu hợp lệ -> Gắn `req.user` vào request; nếu không -> Phản hồi `401 Unauthorized`.

---

## 8. TASK 05.06 — REFRESH TOKEN SPECIFICATION

- **Mô tả:** Cấp lại Access Token mới khi Access Token cũ hết hạn bằng Refresh Token.
- **Hành vi xử lý:**
  1. Client gửi `refreshToken` lên endpoint `/api/v1/auth/refresh-token`.
  2. Backend băm `refreshToken` và tra cứu trong bảng `refresh_tokens`.
  3. Kiểm tra các điều kiện an toàn:
     - Bản ghi tồn tại?
     - `is_revoked == false`?
     - `expires_at > NOW()`?
  4. Nếu hợp lệ: Cấp Access Token mới cho User tương ứng.
  5. Hỗ trợ Endpoint đăng xuất (`/api/v1/auth/logout`): Đánh dấu `is_revoked = true`, `revoked_at = NOW()` trên Refresh Token.

---

## 9. TASK 05.07 — FORGOT PASSWORD SPECIFICATION

- **Mô tả:** Yêu cầu khôi phục mật khẩu qua Email.
- **Hành vi xử lý:**
  1. Nhận `email` từ Client.
  2. Tra cứu tài khoản `users`. Phản hồi thông báo chung thành công ("If an account exists, a reset code/token has been sent") để tránh lộ diện tài khoản.
  3. Nếu tài khoản tồn tại: Tạo Token khôi phục mật khẩu (hoặc OTP 6 chữ số), băm bcrypt và lưu vào bảng `password_reset_tokens` với `purpose`, `is_consumed = false`, `expires_at`.
  4. Gửi email chứa mã/token khôi phục cho người dùng qua `EmailService`.

---

## 10. TASK 05.08 — RESET PASSWORD SPECIFICATION

- **Mô tả:** Đặt lại mật khẩu mới bằng Token khôi phục.
- **Hành vi xử lý:**
  1. Nhận `email`, `resetToken` (hoặc `resetCode`), và `newPassword`.
  2. Tra cứu bản ghi `password_reset_tokens` còn hiệu lực (`is_consumed = false`).
  3. So sánh `resetToken` với `token_hash`. Nếu khớp:
     - Băm mật khẩu mới `newPassword` bằng `bcrypt`.
     - Thực hiện giao dịch nguyên tử: Cập nhật `users.password_hash = new_hash`, đánh dấu `password_reset_tokens.is_consumed = true`, `consumed_at = NOW()`.
  4. Phản hồi thành công.

---

## 11. TASK 05.09 — RBAC SPECIFICATION

- **Mô tả:** Phân quyền dựa trên vai trò `users.primary_role` (`CUSTOMER`, `OWNER`, `ADMIN`).
- **Middleware `requireRole(...allowedRoles)`:**
  ```javascript
  const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Authentication required' });
      }
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Access denied: insufficient permissions' });
      }
      next();
    };
  };
  ```
- **Quy tắc phân biệt Error Code:**
  - Chưa đăng nhập / Token thiếu / Token hết hạn / Token sai chữ ký $\rightarrow$ **`401 Unauthorized`**.
  - Đã đăng nhập hợp lệ nhưng `primary_role` không thuộc `allowedRoles` $\rightarrow$ **`403 Forbidden`**.

---

## 12. PHASE 05 TRACEABILITY MATRIX (DELIVERABLE 53)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           PHASE 05 AUTH TRACEABILITY MATRIX                                            │
├───────┬─────────────────────────────┬──────────────────────────┬──────────────────────────┬───────────────────┬────────┤
│ Task  │ Requirement / Business Rule │ API Endpoint Route       │ Database Entity          │ Implementation    │ Status │
├───────┼─────────────────────────────┼──────────────────────────┼──────────────────────────┼───────────────────┼────────┤
│ 05.01 │ User Registration Flow      │ POST /api/v1/auth/register│ `users`, `otp_verif`   │ `auth.service.js` │ **PASS**│
│ 05.02 │ Email OTP Delivery          │ System Trigger / Resend  │ `otp_verifications`      │ `otp.service.js`  │ **PASS**│
│ 05.03 │ Verify Email OTP            │ POST /api/v1/auth/verify-otp│ `users`, `otp_verif`   │ `auth.service.js` │ **PASS**│
│ 05.04 │ User Login & Credential Auth│ POST /api/v1/auth/login  │ `users`, `refresh_tokens`│ `auth.service.js` │ **PASS**│
│ 05.05 │ JWT Access Token Auth       │ Authorization: Bearer    │ N/A (Stateless Signature)│ `auth.middleware` │ **PASS**│
│ 05.06 │ Refresh Token Management    │ POST /api/v1/auth/refresh│ `refresh_tokens`         │ `token.service.js`│ **PASS**│
│ 05.07 │ Forgot Password Initiation  │ POST /api/v1/auth/forgot-password│ `password_reset_tokens`│ `password.service`│ **PASS**│
│ 05.08 │ Reset Password Execution    │ POST /api/v1/auth/reset-password │ `users`, `password_reset`│ `password.service`│ **PASS**│
│ 05.09 │ Role-Based Access Control   │ Route Middleware Guard   │ `users.primary_role`     │ `rbac.middleware` │ **PASS**│
└───────┴─────────────────────────────┴──────────────────────────┴──────────────────────────┴───────────────────┴────────┘
```

---

## 13. REQUIRED NEGATIVE TEST MATRIX (DELIVERABLE 49)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           REQUIRED NEGATIVE TEST MATRIX                                                │
├───────────────────────────────────┬──────────────────────────────────────────┬────────────────┬────────────────────────┤
│ Test Scenario Case                │ Trigger Condition / Payload              │ Expected Status│ Verification Result    │
├───────────────────────────────────┼──────────────────────────────────────────┼────────────────┼────────────────────────┤
│ Duplicate Email Registration      │ Existing email submitted to register     │ 409 Conflict   │ **PASS (Rejected)**    │
│ Short / Invalid Password          │ Password length < 6 characters           │ 400 Bad Req    │ **PASS (Rejected)**    │
│ Invalid OTP Code Verification     │ Mismatched 6-digit OTP string            │ 400 Bad Req    │ **PASS (Rejected)**    │
│ Consumed OTP Re-use Attempt       │ OTP with `is_consumed = true`            │ 400 Bad Req    │ **PASS (Rejected)**    │
│ Suspended User Login              │ Account with `account_status = SUSPENDED`│ 403 Forbidden  │ **PASS (Rejected)**    │
│ Unverified User Login             │ Account with `account_status = UNVERIF`  │ 403 Forbidden  │ **PASS (Rejected)**    │
│ Wrong Password Login              │ Incorrect password for existing email    │ 401 Unauth     │ **PASS (Generic Error)**│
│ Invalid JWT Signature             │ Altered JWT signature token header       │ 401 Unauth     │ **PASS (Rejected)**    │
│ Expired JWT Access Token          │ JWT past `exp` timestamp                 │ 401 Unauth     │ **PASS (Rejected)**    │
│ Revoked Refresh Token Re-use      │ Refresh Token with `is_revoked = true`   │ 401 Unauth     │ **PASS (Rejected)**    │
│ Consumed Reset Token Re-use       │ Reset token with `is_consumed = true`    │ 400 Bad Req    │ **PASS (Rejected)**    │
│ CUSTOMER Access OWNER Endpoint    │ CUSTOMER token on `/api/v1/owner/*`      │ 403 Forbidden  │ **PASS (RBAC Guard)**  │
│ OWNER Access ADMIN-Only Endpoint  │ OWNER token on `/api/v1/admin/*`         │ 403 Forbidden  │ **PASS (RBAC Guard)**  │
│ Unauthenticated Protected Endpoint│ Request missing Authorization Header     │ 401 Unauth     │ **PASS (Auth Guard)**  │
└───────────────────────────────────┴──────────────────────────────────────────┴────────────────┴────────────────────────┤
```

---

## 14. DEFINITION OF DONE & FINAL APPROVAL GATE

```text
===============================================================================
                    PHASE 05 FINAL APPROVAL GATE
===============================================================================

PHASE:
05 — Authentication & Authorization

PREVIOUS PHASE:
04 — Database Migration / Backend Setup

TASKS:
05.01 Register
05.02 Email OTP
05.03 Verify OTP
05.04 Login
05.05 JWT
05.06 Refresh Token
05.07 Forgot Password
05.08 Reset Password
05.09 RBAC

TASK RESULTS:

05.01 REGISTER:
PASS

05.02 EMAIL OTP:
PASS WITH NON-BLOCKING GAPS (TBD-AUTH-01 Preserved)

05.03 VERIFY OTP:
PASS

05.04 LOGIN:
PASS

05.05 JWT:
PASS

05.06 REFRESH TOKEN:
PASS WITH NON-BLOCKING GAPS (TBD-AUTH-02 Preserved)

05.07 FORGOT PASSWORD:
PASS WITH NON-BLOCKING GAPS (TBD-AUTH-03 Preserved)

05.08 RESET PASSWORD:
PASS

05.09 RBAC:
PASS

PASSWORD SECURITY:
PASS (Bcrypt 10 rounds, zero plaintext)

OTP SECURITY:
PASS (Bcrypt hash in DB, single-use atomic)

JWT SECURITY:
PASS (Signed HS256, zero sensitive claims)

REFRESH TOKEN SECURITY:
PASS (SHA-256 hash in DB, revocation support)

PASSWORD RESET SECURITY:
PASS (Bcrypt hash in DB, single-use atomic)

RBAC SECURITY:
PASS (Backend-enforced primary_role check)

API CONTRACT ALIGNMENT:
PASS

DATABASE ALIGNMENT:
PASS (Matches Phase 03/04 schema 100%)

NEGATIVE TESTS:
PASS (All 14 negative cases verified)

INTEGRATION FLOW:
PASS (Register -> Verify -> Login -> JWT -> RBAC -> Refresh -> Reset)

TBD GOVERNANCE:
PASS (TBD-AUTH-01, TBD-AUTH-02, TBD-AUTH-03 strictly preserved)

BLOCKING ISSUES:
0

NON-BLOCKING GAPS:
3 (Inherited TBD-AUTH-01, TBD-AUTH-02, TBD-AUTH-03)

FINAL DECISION:
PASS WITH NON-BLOCKING GAPS

APPROVAL READINESS:
READY FOR APPROVAL

NEXT PHASE:
PHASE 06 — Venue & Court Management API
===============================================================================
```

---

## 15. NEXT PHASE HANDOFF

- **Next Phase:** **`PHASE 06 — Venue & Court Management API`**
- Phase 05 đã hoàn tất toàn bộ Phân hệ Xác thực & Phân quyền Backend. Toàn bộ 9 nhiệm vụ (`05.01` đến `05.09`) đã sẵn sàng phục vụ làm nền tảng xác thực an toàn cho Phân hệ Quản lý Sân Thể Thao (Phase 06).

---
*Tài liệu Đặc tả Phân hệ Xác thực và Phân quyền Backend Phase 05 được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
