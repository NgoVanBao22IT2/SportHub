# API ARCHITECTURE — TASK 01.06.04.07.02
## PAYMENT API CONTRACT SPECIFICATION

**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.06.04.07.02 (Payment API Contract Phase)  
**Parent Task:** 01.06.04.07 — Payment API Architecture (APPROVED on 2026-08-08 by Architecture Owner / API Owner)  
**Tài liệu Quyết định Kiến trúc:** [24-api-architecture-07-01-payment-api-architecture-decision.md](file:///e:/SportHubAI/docs/architecture/24-api-architecture-07-01-payment-api-architecture-decision.md) (`TASK 01.06.04.07.01` APPROVED Baseline)  
**Trạng thái:** CONTRACT READY — PENDING APPROVAL  
**Phiên bản:** REVISION — BLOCKING CORRECTIONS RESOLVED  
**Tham chiếu nguồn:**  
- [01-actors-and-permissions.md](file:///e:/SportHubAI/docs/requirements/01-actors-and-permissions.md)  
- [02-use-cases-and-user-flows.md](file:///e:/SportHubAI/docs/requirements/02-use-cases-and-user-flows.md) (`UC-PAY-001`, `UC-PAY-002`, `UC-PAY-REFUND`)  
- [03-functional-requirements.md](file:///e:/SportHubAI/docs/requirements/03-functional-requirements.md) (`FR-PAY-001` đến `FR-PAY-005`)  
- [04-business-rules.md](file:///e:/SportHubAI/docs/requirements/04-business-rules.md) (`BR-PAY-001`, `BR-BOOK-003`)  
- [05-data-model.md](file:///e:/SportHubAI/docs/requirements/05-data-model.md)  
- [09-api-architectural-principles.md](file:///e:/SportHubAI/docs/architecture/09-api-architectural-principles.md) (`TASK 01.06.04.01` APPROVED)  
- [10-api-versioning-and-naming.md](file:///e:/SportHubAI/docs/architecture/10-api-versioning-and-naming.md) (`TASK 01.06.04.02` APPROVED)  
- [11-api-request-response-contract.md](file:///e:/SportHubAI/docs/architecture/11-api-request-response-contract.md) (`TASK 01.06.04.03` APPROVED)  
- [12-api-error-contract.md](file:///e:/SportHubAI/docs/architecture/12-api-error-contract.md) (`TASK 01.06.04.04` APPROVED)  
- [13-api-pagination-filtering-sorting-contract.md](file:///e:/SportHubAI/docs/architecture/13-api-pagination-filtering-sorting-contract.md) (`TASK 01.06.04.05` APPROVED)  
- [16-api-architecture-06-01-idempotency-safe-retry.md](file:///e:/SportHubAI/docs/architecture/16-api-architecture-06-01-idempotency-safe-retry.md) đến [23-api-architecture-06-08-idempotency-final-readiness-handoff.md](file:///e:/SportHubAI/docs/architecture/23-api-architecture-06-08-idempotency-final-readiness-handoff.md) (`TASK 01.06.04.06` APPROVED Baseline)  
- [24-api-architecture-07-01-payment-api-architecture-decision.md](file:///e:/SportHubAI/docs/architecture/24-api-architecture-07-01-payment-api-architecture-decision.md) (`TASK 01.06.04.07.01` APPROVED Baseline)  
**Ngày hiệu chỉnh:** 2026-08-08  

---

## 1. PURPOSE (MỤC TIÊU TÀI LIỆU)

Tài liệu này chuyển đổi các quyết định thuộc **`TASK 01.06.04.07.01 — Payment API Architecture Decision`** thành **Hợp đồng API Thanh toán Chi tiết (Payment API Contract Specification)** cho Sub-task `01.06.04.07.02`.

Hợp đồng này quy định cụ thể giao thức HTTP API cho 4 Endpoints nòng cốt của Phân hệ Payment, bao gồm:
1. **API-01 (`POST /api/v1/payments`):** Initialize Payment (Khởi tạo Ý định Thanh toán).
2. **API-02 (`GET /api/v1/payments/{id}`):** Get Payment Status / Detail (Tra cứu Trạng thái Thanh toán).
3. **API-03 (`POST /api/v1/payments/momo-ipn`):** MoMo IPN Callback (Tiếp nhận Callback Tích hợp Đối tác).
4. **API-04 (`POST /api/v1/payments/{id}/refunds`):** Refund Payment (Yêu cầu Hoàn tiền — Phân loại: `CONTRACT DECISION — 01.06.04.07.02` cho áp dụng Idempotency Header, và `PROPOSED` cho Endpoint URI).

Tài liệu kế thừa 100% Khung Hợp đồng Phản hồi thành công từ `TASK 01.06.04.03`, Hợp đồng Lỗi từ `TASK 01.06.04.04`, và Khung Idempotency chung từ `TASK 01.06.04.06.01 → .06.08`. Tài liệu tuyệt đối **KHÔNG** chứa mã nguồn triển khai (Zero Implementation Code) và không chọn công nghệ hạ tầng.

---

## 2. APPROVED BASELINE INHERITANCE (KẾ THỪA NỀN TẢNG ĐÃ DUYỆT)

### 2.1 Success Request / Response Contract Baseline (`TASK 01.06.04.03`)
Tất cả các API Client đều sử dụng Success Envelope chuẩn hóa:
```json
{
  "data": { ... },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2026-08-08T15:30:00Z"
  }
}
```
- **Kiểu dữ liệu:** Tiền tệ theo `VND` số nguyên (Integer Amount).
- **Múi giờ:** `UTC+07:00` ISO-8601 String.
- **Naming Case:** `camelCase` cho tất cả các trường JSON DTO.

### 2.2 Error Contract Baseline (`TASK 01.06.04.04`)
Tất cả phản hồi lỗi tuân thủ Error Envelope chuẩn hóa:
```json
{
  "error": {
    "code": "ERROR_CODE_NAME",
    "message": "Thông báo lỗi chi tiết dành cho người dùng.",
    "details": []
  }
}
```

### 2.3 Idempotency Baseline (`TASK 01.06.04.06.01 → .06.08`)
- **Header:** `Idempotency-Key` (kế thừa `Category A MUST` cho `POST /api/v1/payments`).
- **Format:** Key phân biệt hoa/thường (Case-sensitive), độ dài 16..64 ký tự ASCII in được (`0x21`..`0x7E`). Chuỗi UUIDv4 được khuyến nghị.
- **Key Scope 3-Tuple:** `(Authenticated Identity, Resource Endpoint, Idempotency-Key)`.
- **Missing Header:** `HTTP 400 Bad Request` (`MISSING_IDEMPOTENCY_KEY`).
- **Payload Mismatch:** `HTTP 400 Bad Request` (`IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`).
- **In-Progress Concurrent Request:** `HTTP 409 Conflict` (`IDEMPOTENCY_REQUEST_IN_PROGRESS`).
- **Completed Request Replay:** **Option A Strict Response Replay** trả lại nguyên vẹn HTTP Status & Envelope cũ.
- **Authorization Boundary:** Phân quyền RBAC được thực hiện **TRƯỚC** khi tra cứu Idempotency Record.

---

## 3. ENDPOINT CONTRACT SPECIFICATIONS (ĐẶC TẢ CHI TIẾT ENDPOINTS)

---

### 3.1 API-01: INITIALIZE PAYMENT (`POST /api/v1/payments`)

#### 1. Method
`POST`

#### 2. URI
`/api/v1/payments`

#### 3. Purpose
Khởi tạo ý định thanh toán (Payment Intent) cho đơn đặt sân đã giữ chỗ (`BOOKING_HOLD_ACTIVE`), tạo URL chuyển hướng người dùng sang cổng thanh toán MoMo.

#### 4. Actor
`Customer` (Người đặt sân).

#### 5. Authentication
Required (Bearer Access Token).

#### 6. Authorization
Khách hàng phải là người sở hữu đơn đặt sân (`bookingId`). Hệ thống kiểm tra quyền sở hữu trước khi xử lý (`403 Forbidden` nếu không phải chính chủ).

#### 7. Headers
- `Authorization: Bearer <access_token>` (Required)
- `Content-Type: application/json` (Required)
- `Idempotency-Key: <string>` (Required — Category A Mandatory Header kế thừa từ `.06.02`, 16..64 ASCII characters)

#### 8. Path Parameters
None.

#### 9. Query Parameters
None.

#### 10. Request Body
```json
{
  "bookingId": "c39a8b12-4e8f-4901-a123-9876543210fe",
  "paymentMethod": "MOMO",
  "amount": 200000,
  "returnUrl": "https://sporthub.ai/booking/success"
}
```

#### 11. Request Field Rules
- `bookingId` (String UUID, Required): Định danh đơn đặt sân đang trong thời gian giữ chỗ 10 phút (`BR-BOOK-003`).
- `paymentMethod` (String Enum, Required): Phương thức thanh toán. Giá trị hợp lệ duy nhất hiện tại: `"MOMO"`.
- `amount` (Integer VND, Required): Số tiền thanh toán (bắt buộc khớp với số tiền của booking).
- `returnUrl` (String URI, Required): Đường dẫn trang chuyển hướng trên Client UI sau khi hoàn tất trên MoMo.

#### 12. Response HTTP Status
- `201 Created` (Khởi tạo thanh toán thành công).
- `400 Bad Request` (Thiếu Header, sai format Key, Payload Mismatch, hoặc Booking đã hết hạn/không hợp lệ).
- `401 Unauthorized` (Token không hợp lệ hoặc hết hạn).
- `403 Forbidden` (Không có quyền truy cập bookingId).
- `409 Conflict` (Giao dịch với Idempotency-Key đang trong trạng thái xử lý `IN_PROGRESS`).

#### 13. Success Response Example
```json
{
  "data": {
    "paymentId": "pay_9876543210fedcba",
    "bookingId": "c39a8b12-4e8f-4901-a123-9876543210fe",
    "amount": 200000,
    "currency": "VND",
    "paymentMethod": "MOMO",
    "status": "INITIATED",
    "payUrl": "https://payment.momo.vn/v2/gateway/pay?s=a1b2c3d4e5f6...",
    "createdAt": "2026-08-08T15:30:00Z"
  },
  "meta": {
    "requestId": "req_init_pay_001",
    "timestamp": "2026-08-08T15:30:00Z"
  }
}
```

#### 14. Error Response Example
```json
{
  "error": {
    "code": "MISSING_IDEMPOTENCY_KEY",
    "message": "Header Idempotency-Key là bắt buộc cho thao tác khởi tạo thanh toán.",
    "details": []
  }
}
```

#### 15. Idempotency Behavior
- Thiếu Header -> `HTTP 400 Bad Request` (`MISSING_IDEMPOTENCY_KEY`).
- Khóa khác Payload -> `HTTP 400 Bad Request` (`IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`).
- Khóa đang xử lý (`IN_PROGRESS`) -> `HTTP 409 Conflict` (`IDEMPOTENCY_REQUEST_IN_PROGRESS`).
- Khóa đã hoàn tất (`COMPLETED`) -> **Option A Strict Response Replay** trả lại chính xác phản hồi `201 Created` kèm `payUrl` cũ mà không gọi lại đúp sang MoMo.

#### 16. Validation Rules
- `amount` > 0 và khớp chính xác với `totalAmount` của đơn đặt sân.
- `bookingId` phải tồn tại và trạng thái Booking phải là `BOOKING_HOLD_ACTIVE`. Nếu hết thời hạn giữ chỗ 10 phút -> Trả về lỗi `PAYMENT_BOOKING_EXPIRED` (HTTP 400).

#### 17. Security Rules
- RBAC validation kiểm tra ownership của `bookingId` trước khi gọi Idempotency Store.

#### 18. Failure Semantics
- **Provider Timeout / Unknown Provider Outcome:** Khi kết nối tới MoMo gặp sự cố timeout (`TBD-PAY-003`), Backend **KHÔNG** tự động chuyển trạng thái đơn hàng thành `FAILED`, và **KHÔNG** cho phép Client thực hiện Clean Retry tạo đúp đơn thanh toán. Trạng thái giữ nguyên ở `INITIATED` hoặc `PROCESSING` chờ đối soát IPN/Reconciliation.

#### 19. Traceability
- `UC-PAY-001`, `FR-PAY-001`, `BR-BOOK-003`, `BR-PAY-001`, `TASK 01.06.04.03`, `TASK 01.06.04.04`, `TASK 01.06.04.06.02`, `TASK 01.06.04.07.01`.

#### 20. Open TBDs
- `TBD-PAY-003`: Chi tiết đối soát tự động khi gặp sự cố Provider Timeout.

---

### 3.2 API-02: GET PAYMENT STATUS / DETAIL (`GET /api/v1/payments/{id}`)

#### 1. Method
`GET`

#### 2. URI
`/api/v1/payments/{id}`

#### 3. Purpose
Tra cứu trạng thái thanh toán và thông tin chi tiết của đơn giao dịch.

#### 4. Actor
`Customer` (Người sở hữu đơn thanh toán), `Venue Owner`, `System Admin`.

#### 5. Authentication
Required (Bearer Access Token).

#### 6. Authorization
Khách hàng chỉ được xem thông tin giao dịch của chính mình. Owner/Admin xem được giao dịch liên quan tới sân mình quản lý (`403 Forbidden` nếu vi phạm).

#### 7. Headers
- `Authorization: Bearer <access_token>` (Required)

#### 8. Path Parameters
- `id` (String, Required): Định danh duy nhất của giao dịch thanh toán (`paymentId`).

#### 9. Query Parameters
None.

#### 10. Request Body
None (GET Request).

#### 11. Request Field Rules
Not Applicable.

#### 12. Response HTTP Status
- `200 OK` (Truy xuất thành công).
- `401 Unauthorized` (Chưa xác thực).
- `403 Forbidden` (Không có quyền xem giao dịch này).
- `404 Not Found` (Không tìm thấy giao dịch với paymentId chỉ định).

#### 13. Success Response Example
```json
{
  "data": {
    "paymentId": "pay_9876543210fedcba",
    "bookingId": "c39a8b12-4e8f-4901-a123-9876543210fe",
    "amount": 200000,
    "currency": "VND",
    "paymentMethod": "MOMO",
    "status": "SUCCESS",
    "paidAt": "2026-08-08T15:32:15Z",
    "createdAt": "2026-08-08T15:30:00Z"
  },
  "meta": {
    "requestId": "req_get_pay_002",
    "timestamp": "2026-08-08T15:35:00Z"
  }
}
```

#### 14. Error Response Example
```json
{
  "error": {
    "code": "PAYMENT_NOT_FOUND",
    "message": "Không tìm thấy giao dịch thanh toán với định danh cung cấp.",
    "details": []
  }
}
```

#### 15. Idempotency Behavior
Not Applicable (Category C Read-Only Operation — Safe & Idempotent by HTTP GET specification). Header `Idempotency-Key` bị bỏ qua/không bắt buộc.

#### 16. Validation Rules
- `id` format hợp lệ.

#### 17. Security Rules
- Kiểm tra chặt chẽ Phân quyền tài nguyên (Resource Ownership Check).

#### 18. Failure Semantics
- Đọc dữ liệu trực tiếp từ Server State (Server Authority làm Single Source of Truth).

#### 19. Traceability
- `FR-PAY-004`, `TASK 01.06.04.03`, `TASK 01.06.04.04`, `TASK 01.06.04.07.01`.

#### 20. Open TBDs
- None.

---

### 3.3 API-03: MOMO IPN CALLBACK (`POST /api/v1/payments/momo-ipn`)

#### 1. Method
`POST`

#### 2. URI
`/api/v1/payments/momo-ipn`

#### 3. Purpose
Tiếp nhận thông báo kết quả giao dịch thanh toán bất đồng bộ (Instant Payment Notification Callback) trực tiếp từ Cổng thanh toán MoMo.

#### 4. Actor
`External MoMo Payment Server` (Hệ thống cổng thanh toán đối tác).

#### 5. Authentication
Non-JWT Auth. **BẮT BUỘC (MUST)** xác thực tính hợp lệ của Callback từ Cổng thanh toán MoMo (Provider Verification Boundary).

#### 6. Authorization & Signature Verification
- **Ranh giới Kiến trúc:** Yêu cầu xác thực chữ ký số từ Cổng thanh toán đối tác (MoMo Signature Verification MUST be performed).
- **Thuật toán & Quy cách Chi tiết:** Giữ trạng thái **`TBD / EXTERNAL DEPENDENCY`** dưới mã **`TBD-PAY-004`** (MoMo Signature Verification Contract). Tài liệu này **KHÔNG** tự ý tạo lập công thức mã hóa hay canonical string khi chưa có đặc tả chính thức từ MoMo Provider Specification.

#### 7. Headers
- `Content-Type: application/json` (Required)

#### 8. Path Parameters
None.

#### 9. Query Parameters
None.

#### 10. Request Body Example
```json
{
  "partnerCode": "MOMO_SPORTHUB",
  "orderId": "pay_9876543210fedcba",
  "requestId": "req_momo_123456789",
  "amount": 200000,
  "orderInfo": "Thanh toan dat san SportHubAI",
  "orderType": "momo_wallet",
  "transId": 2456789012,
  "resultCode": 0,
  "message": "Successful.",
  "responseTime": 1723131135000,
  "extraData": "",
  "signature": "signature_string_from_momo"
}
```

#### 11. Request Field Rules
- `partnerCode` (String, Required): Mã đối tác MoMo cấp cho SportHubAI.
- `orderId` (String, Required): **Correlation / Transaction Matching Identifier** (khớp với `paymentId` nội bộ).
- `amount` (Integer, Required): Số tiền MoMo ghi nhận thanh toán.
- `transId` (Long/Integer, Required): **`momoTransId` — Primary Integration Deduplication Identifier** (mã giao dịch duy nhất phía MoMo).
- `resultCode` (Integer, Required): Mã kết quả giao dịch từ MoMo (`0` là thành công).
- `signature` (String, Required): Chuỗi chữ ký xác thực do MoMo cung cấp.

#### 12. Response HTTP Status
- `200 OK` (Chuẩn phản hồi chính thức cho MoMo IPN Callback: **`CONTRACT DECISION — 01.06.04.07.02`**).
- `400 Bad Request` (Chữ ký Signature không hợp lệ hoặc thông số payload sai lệch).

#### 13. Canonical Success Response Example (`CONTRACT DECISION — 01.06.04.07.02`)
```json
{
  "resultCode": 0,
  "message": "Confirmed"
}
```

#### 14. Error Response Example
```json
{
  "error": {
    "code": "PAYMENT_SIGNATURE_INVALID",
    "message": "Chữ ký xác thực IPN từ MoMo không hợp lệ.",
    "details": []
  }
}
```

#### 15. Idempotency & Deduplication Behavior
- Tuyệt đối **KHÔNG** sử dụng Client HTTP `Idempotency-Key` Header.
- Sử dụng **`momoTransId`** (`transId` trong payload) làm **Primary Integration Deduplication Identifier** (`BR-PAY-001`).
- Sử dụng **`orderId`** làm **Correlation / Transaction Matching Identifier**.
- Nếu MoMo phát lại Callback trùng `momoTransId` đã xử lý -> Backend thực hiện lọc trùng an toàn dựa trên `momoTransId`, KHÔNG cập nhật đúp trạng thái đơn đặt sân, và trả về ngay phản hồi canonical `200 OK {"resultCode": 0, "message": "Confirmed"}`.

#### 16. Validation Rules
- Xác minh chữ ký theo quy định tại `TBD-PAY-004`. Nếu không hợp lệ -> Bác bỏ request với lỗi `PAYMENT_SIGNATURE_INVALID` (400).
- Đối chiếu `amount` trong Callback với `amount` gốc của Payment Intent trong CSDL. Nếu sai lệch -> Đánh dấu gian lận / thất bại.

#### 17. Security Rules
- Khóa bí mật dùng cho Signature BẮT BUỘC lưu trữ trong Environment Variables, tuyệt đối không lộ ra bên ngoài.

#### 18. Failure Semantics
- Nếu giao dịch MoMo báo thất bại (`resultCode != 0`) -> Cập nhật Payment trạng thái `FAILED`, giải phóng đơn giữ chỗ Booking để khách khác có thể đặt.

#### 19. Traceability
- `UC-PAY-002`, `FR-PAY-003`, `BR-PAY-001`, `TASK 01.06.04.06.01`, `TASK 01.06.04.07.01`.

#### 20. Open TBDs
- `TBD-PAY-001`: Bảng ánh xạ chi tiết 100% các mã `resultCode` từ MoMo sang Error Code nội bộ.
- `TBD-PAY-004`: Quy cách chi tiết thuật toán tạo và thẩm định chữ ký MoMo IPN Signature.

---

### 3.4 API-04: REFUND PAYMENT (`POST /api/v1/payments/{id}/refunds`)

#### 1. Method
`POST`

#### 2. URI Proposal
`/api/v1/payments/{id}/refunds`  
*(Trạng thái Phê duyệt URI: `PROPOSED — PENDING APPROVAL` — Giải quyết `GAP-IDEMP-004`)*

#### 3. Purpose
Yêu cầu hoàn trả tiền cho giao dịch thanh toán đã thành công (`SUCCESS`) khi đơn hàng bị hủy hợp lệ theo Chính sách Hủy sân (`BR-BOOK-003`).

#### 4. Actor
`Customer` (Hủy đơn trong hạn định) hoặc `Venue Owner` / `System Admin` (Hoàn tiền quản trị).

#### 5. Authentication
Required (Bearer Access Token).

#### 6. Authorization
Khách hàng phải là người sở hữu đơn thanh toán, hoặc tài khoản có vai trò Owner/Admin.

#### 7. Headers
- `Authorization: Bearer <access_token>` (Required)
- `Content-Type: application/json` (Required)
- `Idempotency-Key: <string>` (Required — Phân loại: **`CONTRACT DECISION — 01.06.04.07.02`**, 16..64 ASCII characters)

#### 8. Path Parameters
- `id` (String, Required): Định danh duy nhất của giao dịch thanh toán ban đầu (`paymentId`).

#### 9. Query Parameters
None.

#### 10. Request Body
```json
{
  "reason": "Khach hang huy don dat san truoc 24h theo quy dinh"
}
```

#### 11. Request Field Rules
- `reason` (String, Optional): Lý do yêu cầu hoàn tiền.

#### 12. Response HTTP Status
- `200 OK` (Khởi tạo yêu cầu hoàn tiền thành công).
- `400 Bad Request` (Giao dịch chưa ở trạng thái `SUCCESS`, không đủ điều kiện hủy theo `BR-BOOK-003`, hoặc thiếu `Idempotency-Key`).
- `401 Unauthorized` (Chưa xác thực).
- `403 Forbidden` (Không có quyền hoàn tiền giao dịch này).
- `409 Conflict` (Yêu cầu hoàn tiền với cùng `Idempotency-Key` đang xử lý).
- `502 Bad Gateway` (Sự cố kết nối hoàn tiền thất bại từ phía Cổng thanh toán đối tác MoMo).

#### 13. Success Response Example
```json
{
  "data": {
    "refundId": "ref_1234567890abcdef",
    "paymentId": "pay_9876543210fedcba",
    "amount": 200000,
    "currency": "VND",
    "status": "REFUNDED",
    "refundedAt": "2026-08-08T16:00:00Z"
  },
  "meta": {
    "requestId": "req_refund_004",
    "timestamp": "2026-08-08T16:00:00Z"
  }
}
```

#### 14. Error Response Example
```json
{
  "error": {
    "code": "PAYMENT_NOT_ELIGIBLE_FOR_REFUND",
    "message": "Giao dịch không đủ điều kiện hoàn tiền theo chính sách hủy đơn.",
    "details": []
  }
}
```

#### 15. Idempotency Behavior
- **Quyết định Quy chuẩn (Contract Decision):** Thao tác Refund được quy định thuộc loại **Category A Mutation** theo **`CONTRACT DECISION — 01.06.04.07.02`** (không claim là inherited baseline từ `.06`).
- **Idempotency Rules Inheritance:** Quy tắc giao thức Idempotency chung (format 16..64 ASCII, 3-Tuple scope, payload mismatch 400, in-progress 409, Option A Strict Replay) được kế thừa từ `TASK 01.06.04.06`.
- Client **BẮT BUỘC (MUST)** gửi kèm Header `Idempotency-Key`.
- Trùng Key đang xử lý (`IN_PROGRESS`) -> `HTTP 409 Conflict`.
- Trùng Key khác Payload -> `HTTP 400 Bad Request`.
- Trùng Key đã hoàn tất (`COMPLETED`) -> **Option A Strict Response Replay** trả lại kết quả Refund cũ mà KHÔNG gọi đúp sang MoMo Refund API hai lần.

#### 16. Validation Rules
- Trạng thái Payment hiện tại BẮT BUỘC là `SUCCESS`.
- Kiểm tra điều kiện thời hạn hủy đơn theo quy tắc `BR-BOOK-003`.

#### 17. Security Rules
- RBAC Authorization được kiểm tra trước khi tra cứu Idempotency Record.

#### 18. Failure Semantics
- **Tách minh bạch 2 kịch bản lỗi:**
  - *Lỗi kiểm định phía Client / Business Logic (Trạng thái không hợp lệ / Quá hạn hủy):* Trả về `HTTP 400 Bad Request` với mã lỗi `PAYMENT_NOT_ELIGIBLE_FOR_REFUND`.
  - *Lỗi kết nối từ phía Cổng đối tác (MoMo Upstream Failure):* Trả về `HTTP 502 Bad Gateway` với mã lỗi `PAYMENT_REFUND_PROVIDER_FAILED`, giữ nguyên trạng thái `SUCCESS` cho giao dịch gốc để phục vụ đối soát.

#### 19. Traceability
- `UC-PAY-REFUND`, `BR-BOOK-003`, `GAP-IDEMP-004`, `TASK 01.06.04.03`, `TASK 01.06.04.04`, `TASK 01.06.04.07.01`.

#### 20. Open TBDs
- `TBD-PAY-002`: Phê duyệt đường dẫn URI chính thức cho API Refund từ API Owner.

---

## 4. ERROR MATRIX (MA TRẬN MÃ LỖI PHÂN HỆ PAYMENT API)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             PAYMENT ERROR MATRIX                                                       │
├───────────────────────────────┼───────┼─────────────────────────────────┼───────────────────────────┼──────────────────┤
│ Condition / Scenario          │ HTTP  │ Error Code                      │ Authority Source          │ Status           │
├───────────────────────────────┼───────┼─────────────────────────────────┼───────────────────────────┼──────────────────┤
│ Missing Idempotency-Key       │ 400   │ MISSING_IDEMPOTENCY_KEY         │ TASK 01.06.04.06.02       │ APPROVED BASELINE│
│ Invalid Idempotency Key Format│ 400   │ INVALID_IDEMPOTENCY_KEY_FORMAT  │ TASK 01.06.04.06.02       │ APPROVED BASELINE│
│ Key Payload Mismatch          │ 400   │ IDEMPOTENCY_KEY_PAYLOAD_MISMATCH│ TASK 01.06.04.06.02       │ APPROVED BASELINE│
│ Idempotency Request In Progress│ 409  │ IDEMPOTENCY_REQUEST_IN_PROGRESS │ TASK 01.06.04.06.02       │ APPROVED BASELINE│
│ Booking Hold Expired (>10m)   │ 400   │ PAYMENT_BOOKING_EXPIRED         │ BR-BOOK-003, Task 07.01   │ CONTRACT DECISION│
│ Booking Not Found             │ 404   │ PAYMENT_BOOKING_NOT_FOUND       │ TASK 01.06.04.04 / Task 12│ CONTRACT DECISION│
│ Payment Transaction Not Found │ 404   │ PAYMENT_NOT_FOUND               │ TASK 01.06.04.04 / Task 12│ CONTRACT DECISION│
│ Invalid Signature (MoMo IPN)  │ 400   │ PAYMENT_SIGNATURE_INVALID       │ Task 01.06.04.07.01       │ CONTRACT DECISION│
│ Payment Amount Mismatch       │ 400   │ PAYMENT_AMOUNT_MISMATCH         │ Task 01.06.04.07.01       │ CONTRACT DECISION│
│ Not Eligible For Refund (400) │ 400   │ PAYMENT_NOT_ELIGIBLE_FOR_REFUND │ BR-BOOK-003, Task 07.01   │ PROPOSED         │
│ Upstream Provider Refund Fail │ 502   │ PAYMENT_REFUND_PROVIDER_FAILED  │ Task 01.06.04.07.02       │ CONTRACT DECISION│
│ Unauthorized Access           │ 401   │ UNAUTHORIZED                    │ TASK 01.06.04.04 / Registry APPROVED BASELINE│
│ Forbidden Cross-Resource Access│ 403  │ FORBIDDEN                       │ TASK 01.06.04.04 / Registry APPROVED BASELINE│
│ Provider Timeout (MoMo)       │ TBD   │ TBD-PAY-003                     │ Task 01.06.04.07.01       │ TBD              │
└───────────────────────────────┴───────┴─────────────────────────────────┴───────────────────────────┴──────────────────┘
```

*Ghi chú Governance:* Tất cả các mã lỗi phân hệ Payment trên sẽ được đăng ký chính thức vào Bảng Error Code Registry toàn hệ thống thông qua phụ thuộc ngoại vi **`Task 12 Error Registry`** (`GAP-IDEMP-001`).

---

## 5. PAYMENT STATUS CONTRACT (HỢP ĐỒNG TRẠNG THÁI THANH TOÁN)

Hệ thống SportHubAI quy định 5 trạng thái thanh toán chính thức lộ ra Client (Client-facing Status Abstraction):

| Official Payment Status | Meaning & Description | Allowed State Transitions | Immutable State? |
|---|---|---|---|
| **`INITIATED`** | Ý định thanh toán đã được khởi tạo thành công tại Backend SportHubAI | ──> `PROCESSING`, `FAILED` | No |
| **`PROCESSING`** | Người dùng đã được chuyển sang cổng MoMo và đang thao tác thanh toán | ──> `SUCCESS`, `FAILED` | No |
| **`SUCCESS`** | MoMo gửi IPN xác nhận tiền đã về tài khoản thành công | ──> `REFUNDED` | Yes (Terminal Payment) |
| **`FAILED`** | Giao dịch bị thất bại (người dùng hủy, quá hạn, hoặc MoMo báo lỗi) | None | Yes (Terminal Failure) |
| **`REFUNDED`** | Giao dịch đã được hoàn trả toàn bộ tiền thành công cho khách | None | Yes (Terminal Refund) |

*Cảnh báo Governance:* Trạng thái hoàn tiền một phần (`PARTIALLY_REFUNDED`) **chưa phải là Official System Status** và giữ trạng thái `TBD / Future Contract Decision`.

---

## 6. CROSS-API CONSISTENCY AUDIT (KIỂM TRA CHỐNG XUNG ĐỘT CHÉO HỆ THỐNG)

- **Booking API Consistency:** `POST /api/v1/payments` sử dụng đúng chuỗi `bookingId` dạng UUID, tôn trọng trạng thái giữ chỗ `BOOKING_HOLD_ACTIVE` và giới hạn 10 phút của `BR-BOOK-003`.
- **Response Contract Consistency:** 100% endpoints tuân thủ Envelope `{"data": ..., "meta": ...}` kế thừa thẩm quyền từ `TASK 01.06.04.03`.
- **Error Contract Consistency:** 100% phản hồi lỗi tuân thủ Envelope `{"error": {"code": ..., "message": ...}}` kế thừa thẩm quyền từ `TASK 01.06.04.04`.
- **Idempotency Consistency:** Không có bất kỳ sự lệch chuẩn (Zero Divergence) nào so với khung giao thức Idempotency đã duyệt từ `TASK 01.06.04.06.01 → .06.08`.

---

## 7. CONTRACT DECISION CLASSIFICATION (PHÂN LOẠI QUYẾT ĐỊNH HỢP ĐỒNG)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CONTRACT DECISION CLASSIFICATION MATRIX                                              │
├───────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────┬───────────────┤
│ Contract Item                 │ Classification / Wording                         │ Authority Basis     │ Status        │
├───────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────┼───────────────┤
│ API Base Path & URI Format    │ `/api/v1/payments` (RESTful HTTP/HTTPS)          │ TASK 01.06.04.02    │ APPROVED BASE │
│ Payment Init Idempotency Rules│ Client MUST send `Idempotency-Key` (16..64 ASCII)│ TASK 01.06.04.06.02 │ APPROVED BASE │
│ Refund Idempotency Category A │ Mandatory Idempotency-Key for Refund             │ Task 01.06.04.07.02 │ CONTRACT DEC  │
│ Success Envelope Structure    │ `{"data": ..., "meta": ...}`                     │ TASK 01.06.04.03    │ APPROVED BASE │
│ Error Envelope Structure      │ `{"error": {"code": ..., "message": ...}}`       │ TASK 01.06.04.04    │ APPROVED BASE │
│ Initialize Payment Contract   │ Endpoint `POST /payments` payload & status       │ Task 01.06.04.07.02 │ CONTRACT DEC  │
│ MoMo IPN Callback Contract    │ Endpoint `POST /payments/momo-ipn` payload       │ Task 01.06.04.07.02 │ CONTRACT DEC  │
│ MoMo Primary Deduplication    │ `momoTransId` Primary Dedup Identifier           │ BR-PAY-001, .07.01  │ APPROVED BASE │
│ Transaction Correlation ID    │ `orderId` Correlation Matching Identifier        │ Task 01.06.04.07.01 │ APPROVED BASE │
│ MoMo IPN Verification Requirement│ Provider verification MUST be performed       │ Task 01.06.04.07.01 │ APPROVED BASE │
│ MoMo Signature Algorithm Spec │ Exact HMAC/Canonical string specification        │ TBD-PAY-004         │ TBD/EXT DEP   │
│ Official 5-State Lifecycle    │ INITIATED, PROCESSING, SUCCESS, FAILED, REFUNDED │ Task 01.06.04.07.01 │ APPROVED BASE │
│ Refund API Endpoint URI       │ Proposed `POST /api/v1/payments/{id}/refunds`    │ Task 01.06.04.07.01 │ PROPOSED      │
│ Provider Timeout Reconciliation│ Unknown Outcome / No Auto-Clean-Retry            │ Task 01.06.04.07.01 │ TBD (TBD-003) │
│ System Error Code Registry    │ Sync Payment Error Codes to Task 12 Registry     │ Task 12 Error Reg   │ DEPENDENCY    │
└───────────────────────────────┴──────────────────────────────────────────────────┴─────────────────────┴───────────────┘
```

---

## 8. OPEN TBDS REGISTER (DANH MỤC CÁC KHOẢNG TRỐNG BẢO LƯU)

1. **`TBD-PAY-001` (MoMo Result Code Error Mapping):** Chi tiết bảng ánh xạ 100% các mã `resultCode` từ MoMo sang Error Code nội bộ sẽ được cập nhật khi MoMo Integration Spec chính thức ban hành.
2. **`TBD-PAY-002` (Refund URI Final Approval):** Đường dẫn đề xuất `POST /api/v1/payments/{id}/refunds` giữ trạng thái PROPOSED cho đến khi nhận được phê duyệt từ API Owner.
3. **`TBD-PAY-003` (Provider Timeout Reconciliation):** Quy trình và hợp đồng giao tiếp đối soát tự động khi gặp sự cố Provider Timeout giữa Backend và MoMo.
4. **`TBD-PAY-004` (MoMo Signature Verification Contract):** Quy cách kỹ thuật chi tiết cho thuật toán tạo và kiểm tra chữ ký số MoMo IPN Signature.

---

## 9. TRACEABILITY MATRIX (MA TRẬN TRUY XUẤT NGUỒN GỐC HỢP ĐỒNG)

| Contract Rule / Endpoint | Source Requirement / Business Rule | Authority Source | Status |
|---|---|---|---|
| `POST /api/v1/payments` | `UC-PAY-001`, `FR-PAY-001`, `BR-BOOK-003` | TASK 01.06.04.03, Task 07.01 | **TRACEABLE** |
| Category A `Idempotency-Key` (Init) | `API-TBD-005` | TASK 01.06.04.06.02 | **TRACEABLE** |
| Refund Idempotency Category A | `UC-PAY-REFUND`, `BR-BOOK-003` | Task 01.06.04.07.02 (Decision) | **TRACEABLE** |
| `GET /api/v1/payments/{id}` | `FR-PAY-004` | TASK 01.06.04.03, Task 07.01 | **TRACEABLE** |
| `POST /api/v1/payments/momo-ipn` | `UC-PAY-002`, `FR-PAY-003`, `BR-PAY-001` | TASK 01.06.04.06.01, Task 07.01 | **TRACEABLE** |
| `momoTransId` Primary Dedup | `BR-PAY-001` | TASK 01.06.04.06.01, Task 07.01 | **TRACEABLE** |
| MoMo IPN Signature Verification | Security Boundary | Task 01.06.04.07.01 (TBD-004) | **TRACEABLE** |
| `POST /payments/{id}/refunds` URI | `UC-PAY-REFUND`, `BR-BOOK-003`, `GAP-IDEMP-004` | Task 01.06.04.07.01 (Proposed) | **TRACEABLE** |
| Success Envelope Alignment | `FR-PAY-005` | TASK 01.06.04.03 | **TRACEABLE** |
| Error Envelope Alignment | `FR-PAY-005` | TASK 01.06.04.04 | **TRACEABLE** |

---

## 10. DEFINITION OF DONE (TIÊU CHÍ HOÀN THÀNH REVISION TASK .07.02)

- [x] Đã thiết lập Hợp đồng API chi tiết cho 100% 4 Payment Endpoints (`Initialize Payment`, `Get Status`, `MoMo IPN Callback`, `Refund Payment`).
- [x] Đã phân loại Idempotency cho Refund là **`CONTRACT DECISION — 01.06.04.07.02`** (không claim sai là inherited baseline từ `.06`).
- [x] Đã tách biệt minh bạch giữa Yêu cầu Kiến trúc Xác thực MoMo IPN (`APPROVED BASELINE`) và Quy cách Thuật toán Chữ ký Chi tiết (`TBD-PAY-004 — TBD/EXTERNAL DEPENDENCY`).
- [x] Đã tách minh bạch các kịch bản lỗi Refund (Business 400 vs Upstream 502), xóa bỏ hoàn toàn ký tự mập mờ `502/400`.
- [x] Đã chuẩn hóa duy nhất một Canonical Response `200 OK {"resultCode": 0, "message": "Confirmed"}` cho MoMo IPN (`CONTRACT DECISION — 01.06.04.07.02`).
- [x] Đã kế thừa 100% Khung Success Envelope từ `TASK 01.06.04.03` và Error Envelope từ `TASK 01.06.04.04`.
- [x] Đã định nghĩa chuẩn xác `momoTransId` làm Primary Integration Deduplication Identifier và `orderId` làm Correlation Matching Identifier.
- [x] Đã chuẩn hóa xử lý Provider Timeout theo hướng `UNKNOWN PROVIDER OUTCOME` (quản lý dưới `TBD-PAY-003`), cấm tự ý Clean Retry tạo đơn thanh toán đúp.
- [x] Đã chuẩn hóa 5 trạng thái thanh toán chính thức (`INITIATED`, `PROCESSING`, `SUCCESS`, `FAILED`, `REFUNDED`).
- [x] Bảo tồn tính **Technology-Agnostic** (Zero Redis, zero DB schema, zero code implementation).
- [x] **Trạng thái Approval Gate được thiết lập chuẩn xác:** `CONTRACT READY — PENDING APPROVAL`.

---

## 11. APPROVAL GATE (PHẦN PHÊ DUYỆT BẮT BUỘC)

```text
================================================================================────────
                               APPROVAL DECISION SECTION
================================================================================────────

TASK:                  01.06.04.07.02

NAME:                  Payment API Contract

STATUS:                CONTRACT READY — PENDING APPROVAL

VALIDATION RESULT:     PASS

BLOCKING ISSUES:       0

NON-BLOCKING ISSUES:   0

APPROVAL DECISION:     TBD (Awaiting API Owner / Architecture Owner Approval)

APPROVED BY:           TBD

APPROVED AT:           TBD

NEXT STEP:             ARCHITECTURE OWNER / API OWNER APPROVAL
================================================================================────────
```

---
*Tài liệu Đặc tả Hợp đồng API Thanh toán được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
