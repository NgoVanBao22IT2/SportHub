# TÀI LIỆU QUY ƯỚC ĐỊNH PHIÊN BẢN VÀ ĐẶT TÊN API (API VERSIONING & NAMING SPECIFICATION)
**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.06.04.02 (Sub-task thuộc Task 01.06.04 — API Architecture & Contract)  
**Trạng thái:** Standardized Architecture Specification  
**Tham chiếu nguồn:**  
- [01-actors-and-permissions.md](file:///e:/SportHubAI/docs/requirements/01-actors-and-permissions.md) (APPROVED)  
- [02-use-cases-and-user-flows.md](file:///e:/SportHubAI/docs/requirements/02-use-cases-and-user-flows.md) (APPROVED)  
- [03-functional-requirements.md](file:///e:/SportHubAI/docs/requirements/03-functional-requirements.md) (APPROVED)  
- [04-business-rules.md](file:///e:/SportHubAI/docs/requirements/04-business-rules.md) (APPROVED)  
- [05-data-model.md](file:///e:/SportHubAI/docs/requirements/05-data-model.md) (APPROVED)  
- [06-system-architecture.md](file:///e:/SportHubAI/docs/architecture/06-system-architecture.md) (APPROVED)  
- [07-frontend-architecture.md](file:///e:/SportHubAI/docs/architecture/07-frontend-architecture.md) (APPROVED)  
- [08-backend-architecture.md](file:///e:/SportHubAI/docs/architecture/08-backend-architecture.md) (APPROVED)  
- [09-api-architectural-principles.md](file:///e:/SportHubAI/docs/architecture/09-api-architectural-principles.md) (APPROVED)  
**Ngày tạo:** 2026-08-08  

---

## 1. PURPOSE (MỤC TIÊU TÀI LIỆU)

Tài liệu này định nghĩa và **chốt khóa duy nhất** Chiến lược Định phiên bản (API Versioning Strategy) và Quy ước Đặt tên URI (API Naming Conventions) cho toàn bộ giao diện lập trình ứng dụng Backend của hệ thống SportHubAI.

Mục tiêu chính:
1. Đảm bảo tính nhất quán hoàn toàn trong thiết kế URI cho tất cả các phân hệ và module API.
2. Xây dựng cấu trúc URI chuẩn hướng tài nguyên (Resource-Oriented Design) theo phong cách RESTful HTTP API over HTTPS.
3. Ngăn chặn triệt để phong cách RPC-style (Remote Procedure Call) và việc bộc lộ chi tiết công nghệ hạ tầng nội bộ qua URL.
4. Bảo tồn 100% thuật ngữ nghiệp vụ (Domain Terminology), 13 Core MVP Entities, 10 Domain Modules và các quy tắc nghiệp vụ đã phê duyệt.

---

## 2. SCOPE (PHẠM VI ÁP DỤNG)

- **Phạm vi Phủ sóng:** Áp dụng bắt buộc cho tất cả các Public API Endpoints phục vụ Customer Website, Owner Portal và Admin Portal.
- **Giới hạn Ranh giới:**
  - KHÔNG áp dụng cho giao tiếp nội bộ giữa các module trong Modular Monolith (Do giao tiếp nội bộ thực hiện trực tiếp trong bộ nhớ qua Application Use Cases).
  - KHÔNG định nghĩa danh sách thuộc tính DTO chi tiết, Error Schema, Response Envelope, Pagination Schema hay Header Auth/Idempotency (Các nội dung này thuộc về sub-task 01.06.04.03 đến 01.06.04.10).
  - KHÔNG viết mã nguồn triển khai Controller, Middleware hay SQL scripts.

---

## 3. SOURCE OF TRUTH (NGUỒN SỰ THẬT VÀ TÍNH KẾ THỪA)

Tài liệu này kế thừa và tuân thủ tuyệt đối các quyết định đã `APPROVED`:

| Thành Phần Kiến Trúc | Quyết Định Đã APPROVED | Giới Hạn Tương Tác API |
|---|---|---|
| **API Architectural Style** | RESTful HTTP API over HTTPS | Hướng tài nguyên (Resource-oriented), Không RPC |
| **Backend Architecture** | Modular Monolith (Website Scope Only) | API duy nhất cho 3 Web App, Không API Mobile |
| **Domain Modules** | ĐÚNG 10 Domain Modules | Ánh xạ đồng bộ sang nhóm tài nguyên Public API |
| **Core MVP Entities** | ĐÚNG 13 Core MVP Entities | Giữ chuẩn thuật ngữ nghiệp vụ Domain Entities |
| **Booking State Machine** | 8 Trạng Thái Đặt Sân Chuẩn | Không đổi tên trạng thái đơn qua URI |
| **Tenant Ownership Isolation** | Owner Ownership Scope Boundary | Resource URL hỗ trợ điều hướng ownership hợp lệ |

---

## 4. API VERSIONING STRATEGY (CHIẾN LƯỢC ĐỊNH PHIÊN BẢN API)

Hệ thống chốt khóa duy nhất chiến lược định phiên bản API qua đường dẫn URI (**URI Path Versioning Strategy**):

```text
/api/v1/{resource}
```

### Ràng Buộc Định Phiên Bản:
- **Đại Diện Cho Hợp Đồng (API Contract Version):** Phiên bản trên URI đại diện độc quyền cho mức độ tương thích của Hợp đồng giao tiếp công khai (API Contract).
- **Không Expose Hạ Tầng:** Version trên URI **KHÔNG** đại diện cho phiên bản Database, phiên bản ứng dụng, phiên bản mã nguồn hay phiên bản Domain Module nội bộ.
- **Tính Nhất Quán:** Tuyệt đối không pha trộn chiến lược URI Versioning (`/api/v1`) với Header-based Versioning (`Accept: application/vnd...`) cho cùng một cơ chế phân phiên bản.

---

## 5. API BASE PATH (ĐƯỜNG DẪN CƠ SỞ API)

Tất cả các Endpoint API công khai của hệ thống SportHubAI bắt buộc phải bắt đầu bằng đường dẫn cơ sở (Base Path):

```text
/api/v1
```

### Quy Tắc Chuẩn Hóa Base Path:
- ✅ **Chuẩn:** `/api/v1/venues`, `/api/v1/courts`, `/api/v1/bookings`, `/api/v1/payments`.
- ❌ **Cấm:** Không dùng `/api/version1/`, không dùng `/api/API/v1/`, không dùng `/api/2026/v1/`.
- ❌ **Cấm Mixed Path:** Không cho phép một số module dùng `/api/v1/venues` trong khi module khác dùng `/venues/v1`.

---

## 6. VERSION LIFECYCLE RULES (QUY TẮC VÒNG ĐỜI PHIÊN BẢN API)

Chỉ số phiên bản API (`v1`) chỉ được tăng lên phiên bản mới (`v2`) khi và chỉ khi có **SỰ THAY ĐỔI PHÁ VỠ HỢP ĐỒNG (BREAKING CONTRACT CHANGE)**:

```text
Breaking API Contract Change ──> Increment Major Version (e.g. /api/v1 ──> /api/v2)
Non-breaking Addition / Internal Refactor ──> Maintain Current Version (/api/v1)
```

### Trường Hợp KHÔNG Tăng API Version:
- ❌ Sửa lỗi kỹ thuật nội bộ (Bug fixes).
- ❌ Tối ưu hóa hiệu năng hệ thống (Performance improvements).
- ❌ Tái cấu trúc mã nguồn Backend (Internal refactoring).
- ❌ Cập nhật/nâng cấp hệ quản trị cơ sở dữ liệu MySQL (Database migrations).
- ❌ Thêm thuộc tính tùy chọn không phá vỡ Client (Non-breaking DTO additions).
- ❌ Thay đổi cấu hình hạ tầng mạng/server.

---

## 7. RESOURCE NAMING (QUY ƯỚC ĐẶT TÊN TÀI NGUYÊN)

Tất cả các tài nguyên (Resources) trong đường dẫn URI phải tuân thủ nghiêm ngặt 3 quy tắc:

1. **Chữ Thường (Lowercase):** Tất cả ký tự URI phải là chữ in thường.
2. **Danh Từ Số Nhiều (Plural Nouns):** Định danh danh mục tập hợp tài nguyên bắt buộc dùng danh từ số nhiều.
3. **Kebab-Case Cho Từ Ghép:** Tài nguyên có tên gồm nhiều từ ghép bắt buộc phân tách bằng dấu gạch ngang (`-`).

```text
✅ CHUẨN:
/api/v1/venues
/api/v1/branches
/api/v1/courts
/api/v1/owner-applications
/api/v1/operating-schedules
/api/v1/slot-blockings

❌ CẤM:
/api/v1/Venues (Chữ hoa)
/api/v1/venue (Số ít)
/api/v1/ownerApplications (CamelCase)
/api/v1/owner_applications (Snake_case)
```

---

## 8. COLLECTION / RESOURCE NAMING (QUY ƯỚC TẬP HỢP VÀ TÀI NGUYÊN ĐƠN)

Đường dẫn URI biểu diễn rạch ròi giữa Tập hợp tài nguyên (Collection) và Một tài nguyên cụ thể (Single Resource):

| Loại Tài Nguyên | Cấu Trúc URI Chuẩn | Ví Dụ Minh Họa | HTTP Method |
|---|---|---|---|
| **Collection Root** | `/api/v1/{plural-resources}` | `/api/v1/venues` | `GET` (Read list) / `POST` (Create) |
| **Single Resource** | `/api/v1/{plural-resources}/{resourceId}` | `/api/v1/venues/{venueId}` | `GET` (Read detail) / `PATCH` (Update) |
| **Nested Collection** | `/api/v1/{parent}/{parentId}/{children}` | `/api/v1/venues/{venueId}/branches` | `GET` (Read child list) |
| **Nested Resource** | `/api/v1/{parent}/{parentId}/{children}/{childId}` | `/api/v1/branches/{branchId}/courts/{courtId}` | `GET` (Read child detail) |

---

## 9. IDENTIFIER NAMING (QUY ƯỚC ĐẶT TÊN MÃ ĐỊNH DANH PATH PARAMETER)

Tên của Tham số Đường dẫn (Path Parameter) trong URI bắt buộc phải đính kèm **Tên Tài Nguyên + Id** viết theo chuẩn `camelCase`:

```text
{venueId}
{branchId}
{courtId}
{bookingId}
{paymentId}
{reviewId}
{userId}
{applicationId}
```

### Ràng Buộc Chống Mơ Hồ:
- ❌ **Cấm dùng tên chung chung:** Không dùng `/venues/{id}` hoặc `/bookings/{id}` nhằm tránh gây xung đột mơ hồ khi lồng tài nguyên (Nested Resources).
- ❌ **Cấm dùng kebab-case hoặc snake_case cho Path Parameter:** Không dùng `{venue_id}` hoặc `{venue-id}`.
- 💡 *Lưu ý:* Task này chỉ quy định Quy ước Đặt tên Identifier Name, không quy định kiểu dữ liệu của ID (Integer vs UUID) để bảo toàn ranh giới Database Architecture.

---

## 10. NESTED RESOURCE RULES (QUY TẮC LỒNG TÀI NGUYÊN VÀ ĐỘ SÂU URI)

- **Nguyên Tắc Lồng Tài Nguyên:** Lồng tài nguyên (Nested Resources) chỉ được áp dụng khi mối quan hệ cha-con mang tính điều hướng trực tiếp theo phân cấp nghiệp vụ.
- **Giới Hạn Độ Sâu Tối Đa (Max Depth Rule):** Độ sâu lồng tài nguyên trên URI **không được vượt quá 2 cấp (Maximum 2 levels)** sau collection root:

```text
✅ HỢP LỆ (Depth <= 2):
GET /api/v1/venues/{venueId}/branches           (Cấp 1: Chi nhánh thuộc Venue)
GET /api/v1/branches/{branchId}/courts          (Cấp 1: Sân con thuộc Chi nhánh)

❌ CẤM NỔI LỒNG QUÁ SÂU (Depth > 2):
GET /api/v1/venues/{venueId}/branches/{branchId}/courts/{courtId}/bookings/{bookingId}
```

- **Canonical Direct Endpoints:** Mỗi tài nguyên chính (như `Booking`, `Payment`, `Review`) phải có một đường dẫn trực tiếp cấp cao nhất (Canonical Endpoint) để truy cập nhanh:
  - `GET /api/v1/bookings/{bookingId}`
  - `GET /api/v1/payments/{paymentId}`

---

## 11. HTTP METHOD CONVENTION (QUY ƯỚC NGHĨA VỤ PHƯƠNG THỨC HTTP)

Hệ thống tuân thủ chặt chẽ ngữ nghĩa chuẩn của các phương thức HTTP:

- **`GET`:** Truy vấn và đọc dữ liệu (Thao tác an toàn, không thay đổi trạng thái hệ thống).
- **`POST`:** Tạo mới một tài nguyên trong Collection, hoặc kích hoạt một hành vi nghiệp vụ đặc thù (Action Endpoint).
- **`PATCH`:** Cập nhật một phần dữ liệu của tài nguyên hiện có (Partial Update).
- **`DELETE`:** Xóa tài nguyên khỏi hệ thống nếu Business Rules cho phép.

```text
❌ CẤM THIẾT KẾ SAI NGHĨA VỤ HTTP:
POST /api/v1/getVenues (Dùng POST để đọc dữ liệu)
GET  /api/v1/bookings/{bookingId}/cancel (Dùng GET để thay đổi trạng thái đơn)
```

---

## 12. ACTION ENDPOINT CONVENTION (QUY ƯỚC CHO HÀNH ĐỘNG NGHIỆP VỤ ĐẶC THÙ)

Đối với các hành vi nghiệp vụ phức tạp không thể biểu diễn bằng các thao tác CRUD thuần túy (như Hủy đơn đặt sân, Xác nhận thanh toán, Duyệt đơn Owner), URI phải sử dụng cấu trúc **Action Endpoint hướng tài nguyên**:

```text
POST /api/v1/{resources}/{resourceId}/{action-name}
```

### Chuẩn Hóa Tên Action Endpoints:
- Tên Action phải là **Danh từ hành động (Action Noun)** viết theo dạng `kebab-case`.
- Phương thức HTTP đi kèm bắt buộc là `POST`.

```text
✅ CHUẨN ACTION ENDPOINTS:
POST /api/v1/bookings/{bookingId}/cancellation      (Hành động Hủy đơn đặt sân)
POST /api/v1/owner-applications/{applicationId}/approval   (Hành động Duyệt đơn Owner)
POST /api/v1/owner-applications/{applicationId}/rejection  (Hành động Từ chối đơn Owner)
POST /api/v1/auth/otp-verification                  (Hành động Xác thực mã OTP)

❌ CẤM RPC-STYLE ACTIONS:
POST /api/v1/cancelBooking
POST /api/v1/approveOwnerApplication
```

---

## 13. QUERY PARAMETER NAMING (QUY ƯỚC ĐẶT TÊN THAM SỐ TRUY VẤN)

Tất cả các Tham số Truy vấn (Query Parameters) trên URL bắt buộc phải tuân thủ chuẩn **`camelCase`**:

```text
GET /api/v1/courts?branchId=123&sportType=BADMINTON&startDate=2026-08-10&endDate=2026-08-10
```

### Quy Tắc Thống Nhất Query Parameter:
- ✅ **Chuẩn `camelCase`:** `startDate`, `endDate`, `branchId`, `sportType`, `pageIndex`, `pageSize`.
- ❌ **Cấm:** Không dùng `start_date` (snake_case), không dùng `start-date` (kebab-case).

---

## 14. PATH PARAMETER NAMING (QUY ƯỚC ĐẶT TÊN THAM SỐ ĐƯỜNG DẪN)

Các Tham số Đường dẫn (Path Parameters) bắt buộc tuân thủ chuẩn **`camelCase`**:

- `/api/v1/venues/{venueId}`
- `/api/v1/branches/{branchId}`
- `/api/v1/courts/{courtId}`
- `/api/v1/bookings/{bookingId}`
- `/api/v1/payments/{paymentId}`
- `/api/v1/users/{userId}`

---

## 15. CASE CONVENTION MATRIX (MA TRẬN QUY ƯỚC KIỂU CHỮ)

| Thành Phần Trong URI | Quy Ước Kiểu Chữ (Case Format) | Ví Dụ minh Họa |
|---|---|---|
| **Static URI Segments** | `lowercase` | `/api/v1/venues` |
| **Multi-word Resources** | `kebab-case` | `/api/v1/owner-applications` |
| **Action Endpoint Segments**| `kebab-case` | `/api/v1/bookings/{bookingId}/cancellation` |
| **Path Parameters** | `camelCase` | `/api/v1/branches/{branchId}` |
| **Query Parameters** | `camelCase` | `?startDate=2026-08-10&sportType=SOCCER` |
| **JSON DTO Fields** | *TBD — Refer to TASK 01.06.04.03* | *Chờ task Request/Response Contract* |

---

## 16. DOMAIN TERMINOLOGY ALIGNMENT (SỰ TƯƠNG THÍCH VỚI THUẬT NGỮ DOMAIN)

Tên tài nguyên trên URI phải bảo tồn hoàn toàn thuật ngữ nghiệp vụ đã được phê duyệt trong Task 01.05 (Data Model) và Task 01.06.03 (Backend Architecture).

### Bảng Ánh Xạ Thuật Ngữ Nghiệp Vụ Sang Resource URI:

| Core Entity / Domain Concept | Approved Domain Terminology | Standardized Public Resource URI |
|---|---|---|
| **Venue Entity** | Venue | `/api/v1/venues` |
| **Branch Entity** | Branch | `/api/v1/branches` |
| **Court Entity** | Court | `/api/v1/courts` |
| **OperatingSchedule Entity** | Operating Schedule | `/api/v1/operating-schedules` |
| **SlotBlocking Entity** | Slot Blocking | `/api/v1/slot-blockings` |
| **Booking Entity** | Booking | `/api/v1/bookings` |
| **Payment Entity** | Payment | `/api/v1/payments` |
| **Review Entity** | Review | `/api/v1/reviews` |
| **Notification Entity** | Notification | `/api/v1/notifications` |
| **FavoriteVenue Entity** | Favorite Venue | `/api/v1/favorite-venues` |
| **OwnerApplication Entity** | Owner Application | `/api/v1/owner-applications` |
| **AuditLog Entity** | Audit Log | `/api/v1/audit-logs` |

*Cấm Tự Đổi Thuật Ngữ:* Tuyệt đối không tự đổi `venues` thành `facilities`, không đổi `branches` thành `locations`, không đổi `courts` thành `fields`, không đổi `bookings` thành `reservations`.

---

## 17. BOOKING API NAMING (QUY ƯỚC ĐẶT TÊN API ĐẶT SÂN)

Phân hệ Đặt sân (Booking Domain) sử dụng tập hợp tài nguyên `/api/v1/bookings`:

- **Danh sách / Tạo đơn:** `GET /api/v1/bookings`, `POST /api/v1/bookings`
- **Chi tiết đơn:** `GET /api/v1/bookings/{bookingId}`
- **Hủy đơn hàng:** `POST /api/v1/bookings/{bookingId}/cancellation`

---

## 18. VENUE / BRANCH / COURT NAMING (QUY ƯỚC API ĐỊA ĐIỂM SÂN BÃI)

Phân hệ Cơ sở sân thể thao giữ đúng cấu trúc cấp bậc địa lý 3 tầng:

- **Cơ sở thể thao (Venue):** `/api/v1/venues`, `/api/v1/venues/{venueId}`
- **Chi nhánh (Branch):** `/api/v1/branches`, `/api/v1/venues/{venueId}/branches`, `/api/v1/branches/{branchId}`
- **Sân con (Court):** `/api/v1/courts`, `/api/v1/branches/{branchId}/courts`, `/api/v1/courts/{courtId}`

---

## 19. PAYMENT NAMING (QUY ƯỚC ĐẶT TÊN API THANH TOÁN)

- **Tài Nguyên Thanh Toán:** `/api/v1/payments`, `/api/v1/payments/{paymentId}`
- **Callback / IPN Endpoint:** Tiếp nhận phản hồi ngầm từ máy chủ MoMo:
  - `POST /api/v1/payments/momo/ipn`
- **Quy Tắc Bảo Mật Name:** Tuyệt đối không tạo các endpoint bộc lộ chi tiết hạ tầng như `/api/v1/momo/updateDatabase` hay `/api/v1/payments/executeSql`.

---

## 20. AUTHENTICATION NAMING (QUY ƯỚC ĐẶT TÊN API XÁC THỰC)

Các Endpoint liên quan đến nghiệp vụ Xác thực và Tài khoản tập trung dưới nhóm tài nguyên `/api/v1/auth`:

- `/api/v1/auth/register` (Đăng ký tài khoản)
- `/api/v1/auth/login` (Đăng nhập)
- `/api/v1/auth/otp-dispatch` (Yêu cầu phát mã OTP Email)
- `/api/v1/auth/otp-verification` (Xác thực mã OTP Email)
- `/api/v1/auth/password-reset` (Đặt lại mật khẩu)

---

## 21. ANTI-RPC RULES (QUY TẮC LOẠI BỎ PHONG CÁCH RPC-STYLE)

Nghiêm cấm tuyệt đối việc sử dụng phong cách RPC (Remote Procedure Call) chứa động từ trong đường dẫn URI công khai:

```text
❌ DANH SÁCH URI RPC-STYLE BỊ CẤM HOÀN TOÀN:
/api/v1/getVenues
/api/v1/createBooking
/api/v1/updateBooking
/api/v1/deleteBooking
/api/v1/checkCourtAvailability
/api/v1/doPayment

✅ CHUYỂN ĐỔI SANG RESTFUL RESOURCE-ORIENTED DESIGN:
GET    /api/v1/venues
POST   /api/v1/bookings
PATCH  /api/v1/bookings/{bookingId}
DELETE /api/v1/bookings/{bookingId}
GET    /api/v1/courts/availability
POST   /api/v1/payments
```

---

## 22. RESERVED WORDS (DỰ PHÒNG CÁC TỪ KHÓA BỊ CẤM TRÊN URI)

Tuyệt đối không sử dụng các từ khóa thể hiện công nghệ triển khai hoặc kiến trúc nội bộ làm tên tài nguyên công khai trên URI:

- ❌ `/database`, `/db`, `/sql`
- ❌ `/repository`, `/repo`
- ❌ `/service`, `/usecase`
- ❌ `/controller`, `/router`
- ❌ `/model`, `/entity`, `/orm`
- ❌ `/api/v1/repositories/bookings`

---

## 23. API NAMING CONSISTENCY (TÍNH NHẤT QUÁN TOÀN HỆ THỐNG)

- **Một Chuẩn Duy Nhất:** Tất cả 10 Domain Modules trong Backend Modular Monolith bắt buộc phải áp dụng chung một bộ quy ước đặt tên này.
- **Không Cho Phép Module Tự Ý Đổi:** Module `Booking` không được tự chọn `snake_case` trong khi Module `Venue` chọn `kebab-case`. Hợp đồng API là một diện mạo công khai thống nhất (Unified Public Interface).

---

## 24. BACKWARD COMPATIBILITY (NGUYÊN TẮC TƯƠNG THÍCH NGƯỢC)

- **Bảo Vệ API Contract:** Các chỉnh sửa bổ sung tính năng không được làm đứt gãy Client đang vận hành (Non-breaking changes).
- **Quy Tắc Thay Đổi Đường Dẫn:** Không âm thầm đổi tên đường dẫn URI, đổi tên tham số path/query parameter hay thay đổi ý nghĩa phương thức HTTP trên phiên bản `v1` hiện tại. Nếu có thay đổi phá vỡ (Breaking Change), bắt buộc phải phát hành phiên bản mới `/api/v2`.

---

## 25. ENDPOINT EXAMPLES (MINH HỌA MINH CHỨNG QUY ƯỚC TÊN ENDPOINT)

Dưới đây là bảng ví dụ minh họa về tên các Endpoint đại diện tuân thủ 100% quy ước đặt tên (Lưu ý: Bảng này chỉ minh họa quy ước Naming, không phải là toàn bộ đặc tả API Contract):

```text
-- PHÂN HỆ AUTHENTICATION
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/otp-verification

-- PHÂN HỆ VENUES & BRANCHES & COURTS
GET    /api/v1/venues
GET    /api/v1/venues/{venueId}
GET    /api/v1/venues/{venueId}/branches
GET    /api/v1/branches/{branchId}
GET    /api/v1/branches/{branchId}/courts
GET    /api/v1/courts/{courtId}

-- PHÂN HỆ BOOKINGS & PAYMENTS
GET    /api/v1/bookings
POST   /api/v1/bookings
GET    /api/v1/bookings/{bookingId}
PATCH  /api/v1/bookings/{bookingId}
POST   /api/v1/bookings/{bookingId}/cancellation

POST   /api/v1/payments
GET    /api/v1/payments/{paymentId}
POST   /api/v1/payments/momo/ipn

-- PHÂN HỆ REVIEWS & OWNER APPLICATIONS
POST   /api/v1/reviews
GET    /api/v1/owner-applications
POST   /api/v1/owner-applications/{applicationId}/approval
```

---

## 26. OPEN QUESTIONS / TBD PRESERVATION (BẢO LƯU CÁC MỤC CHƯA CHỐT FOR SUBSEQUENT TASKS)

Task 01.06.04.02 đã giải quyết triệt để và **chốt khóa 100% API Versioning Strategy (`/api/v1`) và Naming Conventions**. Tuy nhiên, các mục sau tiếp tục được bảo lưu trạng thái `TBD` chờ các sub-task chuyên biệt tiếp theo xử lý:

1. **API-TBD-002: Exact Response Envelope Schema:** Cấu trúc chi tiết của Vỏ phản hồi DTO giữ trạng thái `TBD — Refer to TASK 01.06.04.03`.
2. **API-TBD-003: Exact Error Contract Schema:** Cấu trúc chi tiết của Đối tượng lỗi API giữ trạng thái `TBD — Refer to TASK 01.06.04.04`.
3. **API-TBD-005: Idempotency Header & Key Format:** Tên Header Idempotency và định dạng Key giữ trạng thái `TBD — Refer to TASK 01.06.04.09`.
4. **API-TBD-006: Correlation ID Header Name:** Tên Header Correlation ID giữ trạng thái `TBD — Refer to Observability Architecture`.
5. **API-TBD-007: JSON DTO Field Case Format:** Kiểu chữ của các thuộc tính trong JSON Request/Response DTO (camelCase vs snake_case) giữ trạng thái `TBD — Refer to TASK 01.06.04.03`.
6. **API-TBD-008: Pagination Query Parameter Specs:** Chi tiết tham số phân trang (`pageIndex`, `pageSize`, `cursor`) giữ trạng thái `TBD — Refer to TASK 01.06.04.05`.

---

## 27. DEFINITION OF DONE (DoD) - TASK 01.06.04.02

```text
API Versioning Strategy  = PASS (Chốt khóa duy nhất URI Path Versioning: /api/v1)
API Base Path            = PASS (Chốt khóa duy nhất Base Path: /api/v1)
Version Scope            = PASS (Chỉ áp dụng ở API Contract Boundary)
Version Lifecycle Rules  = PASS (Chỉ tăng Version khi có Breaking Contract Change)
Resource Naming          = PASS (Chữ thường lowercase, danh từ số nhiều plural nouns)
Multi-Word Resources     = PASS (Sử dụng kebab-case: e.g. /owner-applications)
Collection vs Single     = PASS (Collection: /venues, Single Resource: /venues/{venueId})
Resource Identifier      = PASS (Dùng resource-prefixed camelCase: {venueId}, {bookingId})
Nested Resource Rules    = PASS (Tối đa 2 cấp nesting; có Canonical direct endpoints)
HTTP Method Convention   = PASS (Tuân thủ ngữ nghĩa chuẩn GET/POST/PATCH/DELETE)
Action Endpoint Rule     = PASS (Dùng resource-oriented action noun: POST /bookings/{id}/cancellation)
Query Parameter Naming   = PASS (Chốt khóa duy nhất camelCase: ?startDate=...&branchId=...)
Path Parameter Naming    = PASS (Chốt khóa duy nhất camelCase: {courtId})
Case Convention Matrix   = PASS (Chốt khóa URI lowercase, kebab-case, camelCase)
Domain Terminology       = PASS (Bảo tồn 100% thuật ngữ Domain Approved)
Booking Naming           = PASS (Nhất quán /api/v1/bookings)
Venue/Branch/Court Naming= PASS (Nhất quán /venues, /branches, /courts)
Payment Naming           = PASS (Nhất quán /payments, MoMo IPN Callback không expose DB/Infra)
Authentication Naming    = PASS (Nhất quán /api/v1/auth/...)
Anti-RPC Rules           = PASS (Cấm hoàn toàn RPC-style /getVenues, /createBooking)
Reserved Words           = PASS (Cấm dùng từ khóa infra/db/repository/service trên URL)
Naming Consistency       = PASS (Thống nhất 100% trên 10 Domain Modules)
Backward Compatibility   = PASS (Quy tắc bảo vệ Client vận hành)
Endpoint Examples        = Complete (Bảng minh họa quy ước Naming chuẩn)
No Implementation Code   = PASS (Zero SQL, Zero Code, Zero OpenAPI, Zero DTO Schema)
TBD Preservation         = PASS (Bảo lưu 100% TBD cho các task sau)

TASK 01.06.04.02 = PASS
```

---
*Tài liệu Quy ước Định phiên bản và Đặt tên API được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
