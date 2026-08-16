# API ARCHITECTURE — TASK 01.06.04.07.01
## PAYMENT API ARCHITECTURE — ARCHITECTURE DECISION SPECIFICATION

**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.06.04.07.01 (Payment API Architecture Decision Phase)  
**Parent Task:** 01.06.04.07 — Payment API Architecture (APPROVED on 2026-08-08 by Architecture Owner / API Owner)  
**Trạng thái:** ARCHITECTURE DECISION READY — PENDING APPROVAL  
**Phiên bản:** REVISION — BLOCKING CORRECTIONS RESOLVED  
**Tham chiếu nguồn:**  
- [01-actors-and-permissions.md](file:///e:/SportHubAI/docs/requirements/01-actors-and-permissions.md)  
- [02-use-cases-and-user-flows.md](file:///e:/SportHubAI/docs/requirements/02-use-cases-and-user-flows.md) (`UC-PAY-001`, `UC-PAY-002`, `UC-PAY-REFUND`)  
- [03-functional-requirements.md](file:///e:/SportHubAI/docs/requirements/03-functional-requirements.md) (`FR-PAY-001` đến `FR-PAY-005`)  
- [04-business-rules.md](file:///e:/SportHubAI/docs/requirements/04-business-rules.md) (`BR-PAY-001`, `BR-BOOK-003`)  
- [05-data-model.md](file:///e:/SportHubAI/docs/requirements/05-data-model.md)  
- [06-system-architecture.md](file:///e:/SportHubAI/docs/architecture/06-system-architecture.md)  
- [07-frontend-architecture.md](file:///e:/SportHubAI/docs/architecture/07-frontend-architecture.md)  
- [08-backend-architecture.md](file:///e:/SportHubAI/docs/architecture/08-backend-architecture.md)  
- [09-api-architectural-principles.md](file:///e:/SportHubAI/docs/architecture/09-api-architectural-principles.md) (`TASK 01.06.04.01` APPROVED)  
- [10-api-versioning-and-naming.md](file:///e:/SportHubAI/docs/architecture/10-api-versioning-and-naming.md) (`TASK 01.06.04.02` APPROVED)  
- [11-api-request-response-contract.md](file:///e:/SportHubAI/docs/architecture/11-api-request-response-contract.md) (`TASK 01.06.04.03` APPROVED)  
- [12-api-error-contract.md](file:///e:/SportHubAI/docs/architecture/12-api-error-contract.md) (`TASK 01.06.04.04` APPROVED)  
- [13-api-pagination-filtering-sorting-contract.md](file:///e:/SportHubAI/docs/architecture/13-api-pagination-filtering-sorting-contract.md) (`TASK 01.06.04.05` APPROVED)  
- [14-api-architecture-task-map.md](file:///e:/SportHubAI/docs/architecture/14-api-architecture-task-map.md)  
- [16-api-architecture-06-01-idempotency-safe-retry.md](file:///e:/SportHubAI/docs/architecture/16-api-architecture-06-01-idempotency-safe-retry.md) đến [23-api-architecture-06-08-idempotency-final-readiness-handoff.md](file:///e:/SportHubAI/docs/architecture/23-api-architecture-06-08-idempotency-final-readiness-handoff.md) (`TASK 01.06.04.06` APPROVED Baseline)  
**Ngày hiệu chỉnh:** 2026-08-08  

---

## 1. ARCHITECTURE CONTEXT (BỐI CẢNH KIẾN TRÚC)

Nhiệm vụ thuộc Sub-task `01.06.04.07.01` thiết lập **Tài liệu Quyết định Kiến trúc API Thanh toán (Payment API Architecture Decision Specification)** cho Parent Task `01.06.04.07 Payment API Architecture` (đã được Architecture Owner / API Owner phê duyệt phạm vi ngày 2026-08-08).

Tài liệu này xác định ranh giới kiến trúc cấp hệ thống cho Phân hệ API Thanh toán bao gồm:
1. Ranh giới trách nhiệm giữa Client, Payment API Domain, Booking Domain và External Payment Provider (MoMo).
2. Quyết định Kiến trúc cho Khởi tạo Thanh toán (`POST /api/v1/payments`), Webhook/IPN Callback từ MoMo (`POST /api/v1/payments/momo-ipn`), Tra cứu Trạng thái, Thẩm định Chữ ký Bảo mật, và Hoàn tiền (Refund API).
3. Giải quyết Khoảng trống Kỹ thuật **`GAP-IDEMP-004`** (Refund API Endpoint URI Specification) ở đúng cấp độ Kiến trúc API.
4. Kế thừa 100% các quyết định Hợp đồng API (`TASK 01.06.04.03` Success Contract, `TASK 01.06.04.04` Error Contract) và Giao thức Idempotency đã `APPROVED` (`TASK 01.06.04.06.01` đến `.06.08`).

---

## 2. PAYMENT API RESPONSIBILITY (TRÁCH NHIỆM NÒNG CỐT CỦA PHÂN HỆ PAYMENT API)

Phân hệ Payment API chịu trách nhiệm quản lý ranh giới giao tiếp thanh toán của toàn hệ thống SportHubAI với các chức năng độc quyền:
- **Xác lập Payment Intent:** Tiếp nhận yêu cầu thanh toán từ Client, kiểm tra hợp lệ thông tin booking, khởi tạo ý định thanh toán (Payment Intent) và thiết lập liên kết với đơn giữ chỗ (Booking Hold).
- **Tích hợp Cổng Thanh toán Đối tác (MoMo Provider Integration):** Tạo payload giao tiếp với MoMo, tạo URL thanh toán (Payment Gateway Redirect URL) và xử lý phản hồi từ MoMo.
- **Tiếp nhận & Thẩm định Callback (MoMo IPN Handling):** Tiếp nhận tín hiệu IPN Callback từ MoMo, thực hiện xác thực chữ ký (Signature Verification), lọc trùng lặp sự kiện dựa trên `momoTransId` làm Primary Integration Deduplication Identifier, và đồng bộ trạng thái giao dịch.
- **Cung cấp API Tra cứu Trạng thái Thanh toán (Payment Status Query):** Trả về trạng thái thanh toán chuẩn hóa cho Client.
- **Quản lý Luồng Hoàn tiền (Refund Processing):** Tiếp nhận và xử lý yêu cầu hoàn tiền cho các đơn hàng bị hủy hợp lệ theo Business Rules.

---

## 3. API BOUNDARY (RANH GIỚI GIAO TIẾP VÀ TƯƠNG TÁC HỆ THỐNG)

```text
┌─────────────────┐       HTTP Client Request (Idempotency-Key)       ┌──────────────────────────────┐
│  Client App /   │ ────────────────────────────────────────────────> │                              │
│   Frontend UI   │ <──────────────────────────────────────────────── │                              │
└─────────────────┘         Standard Success/Error Envelope           │                              │
                                                                      │     PAYMENT API DOMAIN       │
                                                                      │    (Thin Controller REST)    │
┌─────────────────┐           Verify Booking & State Transition       │                              │
│ Booking Domain  │ <───────────────────────────────────────────────> │                              │
└─────────────────┘                                                   │                              │
                                                                      │                              │
┌─────────────────┐       Outbound Payment Intent Creation Request    │                              │
│ External MoMo   │ <───────────────────────────────────────────────  │                              │
│ Payment Gateway │ ────────────────────────────────────────────────> │                              │
└─────────────────┘     Inbound MoMo IPN Callback (momoTransId Primary)└──────────────────────────────┘
```

- **Client → Payment API Boundary:** Giao tiếp qua giao thức RESTful HTTP/HTTPS trên base path `/api/v1/payments`. Sử dụng Bearer Token cho Authentication & RBAC Authorization, tuân thủ Envelope chuẩn `TASK 01.06.04.03` (`{"data": ...}`).
- **Payment API → Booking Domain Boundary:** Payment API tương tác trực tiếp với Booking Domain để kiểm tra trạng thái đơn đặt sân (`BOOKING_HOLD_ACTIVE`), đảm bảo quy tắc giữ chỗ 10 phút (`BR-BOOK-003`). Payment API **KHÔNG** chứa logic nghiệp vụ quản lý sân hay tính lịch rảnh/bận của sân.
- **Payment API → MoMo Provider Boundary:**
  - *Outbound:* Khởi tạo Payment Intent và lấy Redirect PayURL từ MoMo (`orderId` được dùng làm Correlation / Transaction Matching Identifier).
  - *Inbound:* Tiếp nhận `POST /api/v1/payments/momo-ipn` trực tiếp từ MoMo Server. Đây là ranh giới Tích hợp Bên ngoài (External Integration Trust Boundary), áp dụng cơ chế Xác thực Chữ ký cryptographic (Signature Verification) và khóa lọc trùng `momoTransId` làm **Primary Integration Deduplication Identifier** (`BR-PAY-001`).
- **Payment API → Refund Boundary:** Luồng Hoàn tiền (Refund) là một thành phần nghiệp vụ nằm trực tiếp trong ranh giới Phân hệ Payment API Domain.

---

## 4. PAYMENT LIFECYCLE (VÒNG ĐỜI KHÁI NIỆM CỦA GIAO DỊCH THANH TOÁN)

Mô hình hóa Vòng đời Khái niệm Cấp Kiến trúc chuẩn hóa 5 trạng thái chính thức (Official 5-State Payment Lifecycle):

```text
       [Client Kickoff]
              │
              ▼
        1. INITIATED  (Payment Intent Created, Redirect URL generated)
              │
              ├──────────────────────────────────────────┐
              ▼ (MoMo Processing)                        ▼ (Timeout / Cancel)
         2. PROCESSING                              4. FAILED / EXPIRED
              │                                          │
       ┌──────┴──────────────────────┐                   │
       ▼ (MoMo IPN Success)          ▼ (MoMo IPN Fail)   │
  3. SUCCESS                    4. FAILED ───────────────┘
       │
       ▼ (Valid Booking Cancel Flow)
  5. REFUNDED
```

- **`INITIATED`**: Đã khởi tạo thành công ý định thanh toán tại hệ thống Backend SportHubAI.
- **`PROCESSING`**: Người dùng đã được chuyển hướng sang cổng thanh toán MoMo và giao dịch đang được MoMo xử lý.
- **`SUCCESS`**: MoMo xác nhận thanh toán thành công qua IPN hợp lệ; tiền đã về tài khoản hệ thống.
- **`FAILED`**: Giao dịch bị thất bại do người dùng hủy, tài khoản không đủ tiền, hoặc hết thời gian chờ (Expired).
- **`REFUNDED`**: Giao dịch đã được hoàn lại toàn bộ tiền thành công cho người dùng theo chính sách hủy đơn.
- **Lưu ý về Hoàn tiền một phần (Partial Refund):** Trạng thái hoàn tiền một phần (`PARTIALLY_REFUNDED`) **chưa phải là Official System Status** trong Source of Truth hiện tại và được đánh dấu là `TBD / Future Contract Decision`.

---

## 5. INITIALIZE PAYMENT ARCHITECTURE (`POST /api/v1/payments`)

- **Resource Endpoint:** `POST /api/v1/payments`
- **Quyền Hạn Thực Thi (RBAC):** Yêu cầu xác thực Bearer Token đại diện cho Người đặt sân (`Customer`).
- **Idempotency Requirement (Kế thừa TASK 01.06.04.06.02 Category A):**
  - Đợt thao tác khởi tạo thanh toán là một Mutation Operation quan trọng (`Category A`).
  - Client **BẮT BUỘC (MUST)** gửi kèm Header **`Idempotency-Key`**.
  - Thiếu Header -> Server ngắt tuyến và trả về `HTTP 400 Bad Request` với mã lỗi `"MISSING_IDEMPOTENCY_KEY"`.
  - Khóa trùng lặp trong trạng thái `IN_PROGRESS` -> `HTTP 409 Conflict` (`"IDEMPOTENCY_REQUEST_IN_PROGRESS"`).
  - Khóa trùng lặp khác Payload -> `HTTP 400 Bad Request` (`"IDEMPOTENCY_KEY_PAYLOAD_MISMATCH"`).
  - Khóa trùng lặp đã `COMPLETED` -> **Option A Strict Response Replay** trả lại chính xác PayURL và Envelope gốc mà KHÔNG gọi đúp sang MoMo.
- **Request Body Payload Contract (Inherited TASK 01.06.04.03):**
  - Đòi hỏi `bookingId` (UUID string), `paymentMethod` (`"MOMO"`), `amount` (VND Integer), `returnUrl` (String URI).
- **Success Response Envelope (Inherited TASK 01.06.04.03):**
  - Trả về `HTTP 201 Created` với `{"data": {"paymentId": "...", "bookingId": "...", "amount": 200000, "status": "INITIATED", "payUrl": "https://payment.momo.vn/..."}}`.

---

## 6. MOMO IPN ARCHITECTURE (`POST /api/v1/payments/momo-ipn`)

- **Resource Endpoint:** `POST /api/v1/payments/momo-ipn`
- **Bản Chất Kiến Trúc:** **EXTERNAL INTEGRATION CALLBACK / WEBHOOK** (Không phải Client HTTP API).
- **Authentication & Trust Boundary:**
  - Không dùng Bearer Token của Client.
  - Server xác minh tính hợp lệ của IPN Callback dựa trên **MoMo HMAC SHA256 Signature Verification** sử dụng Secret Key được cấu hình an toàn trên Server.
- **Idempotency & Deduplication Semantics (Inherited BR-PAY-001 & TASK 01.06.04.06.01):**
  - Tuyệt đối **KHÔNG** áp dụng HTTP `Idempotency-Key` Header của Client API cho luồng MoMo IPN Callback.
  - **`momoTransId`** (Mã giao dịch phía MoMo) đóng vai trò là **Primary Integration Deduplication Identifier** (khóa lọc trùng độc quyền).
  - **`orderId`** đóng vai trò là **Correlation / Transaction Matching Identifier** (mã liên kết đối chiếu giao dịch đơn đặt sân).
  - Khi MoMo gửi lặp lại IPN Callback cho một `momoTransId` đã được xử lý thành công trước đó: Backend thực hiện lọc trùng an toàn dựa trên `momoTransId`, KHÔNG cập nhật đúp trạng thái Booking, và trả về phản hồi chuẩn theo Hợp đồng Tích hợp MoMo (`HTTP 204 No Content` hoặc `HTTP 200 OK {"resultCode": 0}`).

---

## 7. PAYMENT VERIFICATION ARCHITECTURE (KIẾN TRÚC THẨM ĐỊNH GIAO DỊCH)

Quy trình thẩm định an toàn thông tin cho giao dịch thanh toán tuân thủ 4 bước kiểm tra nghiêm ngặt:
1. **Signature Integrity Check:** Kiểm tra tính toàn vẹn chữ ký HMAC SHA256 do MoMo gửi kèm trong IPN payload để chống giả mạo request.
2. **Transaction Identity Matching:** Đối chiếu Correlation Identifier (`orderId`) và `requestId` trong IPN payload với bản ghi Payment Intent trong cơ sở dữ liệu.
3. **Amount Matching:** Đối chiếu số tiền giao dịch (`amount`) trong IPN payload với số tiền gốc của đơn hàng Booking. Nếu phát hiện sai lệch số tiền -> Đánh dấu giao dịch bị lỗi bất thường và cảnh báo gian lận.
4. **State Transition Validation:** Chỉ cho phép chuyển trạng thái đơn hàng sang `SUCCESS` nếu trạng thái hiện tại là `INITIATED` hoặc `PROCESSING`.

---

## 8. PAYMENT STATUS ARCHITECTURE (KIẾN TRÚC TRA CỨU TRẠNG THÁI THANH TOÁN)

- **Resource Endpoint:** `GET /api/v1/payments/{id}`
- **Quyền Hạn Thực Thi (RBAC):** Khách hàng sở hữu đơn thanh toán hoặc Venue Owner / System Admin (`403 Forbidden` nếu truy cập chéo tài nguyên).
- **Single Source of Truth:** Trạng thái giao dịch lưu giữ tại Phân hệ Backend SportHubAI làm căn cứ thẩm quyền duy nhất (Server Authority).
- **Client Status Abstraction:** Chuyển đổi mã trạng thái nội bộ MoMo (`resultCode`) thành 5 trạng thái khái niệm chuẩn hóa chính thức của hệ thống (`INITIATED`, `PROCESSING`, `SUCCESS`, `FAILED`, `REFUNDED`) trước khi gửi phản hồi về Client DTO.

---

## 9. REFUND ARCHITECTURE (`GAP-IDEMP-004 RESOLUTION`)

Tài liệu này chính thức đề xuất Quyết định Kiến trúc để giải quyết Khoảng trống Kỹ thuật **`GAP-IDEMP-004`**:

- **Proposed Endpoint URI:** **`POST /api/v1/payments/{id}/refunds`**
- **Status Approval Classification:** **`ARCHITECTURE DECISION — PROPOSED`**
- **Quyền Hạn Thực Thi (RBAC):** Yêu cầu xác thực Bearer Token đại diện cho Người đặt sân (Hủy đơn trong hạn định) hoặc Venue Owner / System Admin (Hoàn tiền thủ công).
- **Nghiệp Vụ Hoàn Tiền (Refund Business Semantics):**
  - Kiểm tra điều kiện hoàn tiền dựa trên chính sách hủy sân (`BR-BOOK-003`).
  - Khởi tạo giao dịch hoàn tiền sang cổng thanh toán MoMo (MoMo Refund API).
  - Cập nhật trạng thái đơn thanh toán thành `REFUNDED`.
- **Idempotency Applicability:** Thao tác `POST /api/v1/payments/{id}/refunds` thuộc loại **Category A Mutation**. Client **BẮT BUỘC (MUST)** gửi kèm Header `Idempotency-Key` để chống phát lệnh hoàn tiền đúp hai lần cho cùng một giao dịch.

---

## 10. IDEMPOTENCY INTEGRATION (KẾ THỪA 100% IDEMPOTENCY BASELINE TASK .06)

Payment API Architecture chính thức kế thừa và tích hợp 100% khung giao thức Idempotency đã được duyệt từ `TASK 01.06.04.06.01` đến `.06.08`:

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PAYMENT IDEMPOTENCY INTEGRATION MATRIX                                               │
├───────────────────────────────┼───────────────────────────────┼─────────────────────────────────┼──────────────────────┤
│ API Operation                 │ Category                      │ Idempotency Header Requirement  │ Deduplication Mechanism│
├───────────────────────────────┼───────────────────────────────┼─────────────────────────────────┼──────────────────────┤
│ `POST /api/v1/payments`       │ Category A (REQUIRED)         │ MUST send `Idempotency-Key`     │ 3-Tuple Key Scope    │
│ `POST /api/v1/payments/momo-ipn`│ Integration Callback (Special)│ FORBIDDEN / NOT APPLICABLE      │ `momoTransId` Filter │
│ `GET /api/v1/payments/{id}`   │ Category C (Read Query)       │ FORBIDDEN / NOT APPLICABLE      │ Read Only / Safe     │
│ `POST /api/v1/payments/{id}/refunds`│ Category A (REQUIRED)   │ MUST send `Idempotency-Key`     │ 3-Tuple Key Scope    │
└───────────────────────────────┴───────────────────────────────┴─────────────────────────────────┴──────────────────────┘
```

---

## 11. SECURITY BOUNDARY (RANH GIỚI BẢO MẬT THANH TOÁN)

- **Authentication & RBAC:** Tất cả các Client APIs (`POST /payments`, `GET /payments/{id}`, `POST /payments/{id}/refunds`) đều yêu cầu Bearer Access Token hợp lệ. Thẩm định phân quyền RBAC được thực hiện **TRƯỚC** khi tra cứu Idempotency Record.
- **Provider IPN Security:** Luồng MoMo IPN Callback bắt buộc kiểm tra Chữ ký số HMAC SHA256. Từ chối ngay các request giả mạo từ IP hoặc Caller lạ không đúng signature (`HTTP 400 Bad Request`).
- **Bảo Vệ Dữ Liệu Nhạy Cảm (Sensitive Data Protection):**
  - Khóa bí mật (MoMo Secret Key, Access Key, Partner Code) BẮT BUỘC lưu trữ trong Environment Variables của Server, tuyệt đối KHÔNG đưa vào source code hay API Contract.
  - Thông tin phản hồi Replay tuyệt đối KHÔNG lưu vết hoặc bộc lộ dữ liệu tài khoản ngân hàng nhạy cảm ở dạng Plaintext.

---

## 12. ERROR HANDLING BOUNDARY (RANH GIỚI XỬ LÝ LỖI PHÂN HỆ PAYMENT)

Tất cả các phản hồi lỗi từ Phân hệ Payment API BẮT BUỘC tuân thủ Hợp đồng Error Envelope của tài liệu **`TASK 01.06.04.04`**:

```json
{
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "Giao dịch thanh toán qua MoMo không thành công.",
    "details": []
  }
}
```

- **Bảng Mã Lỗi Phân Hệ Payment (Payment Error Code Mapping):**
  - `MISSING_IDEMPOTENCY_KEY` (HTTP 400): Thiếu header Idempotency-Key cho API `POST /payments`.
  - `IDEMPOTENCY_REQUEST_IN_PROGRESS` (HTTP 409): Giao dịch khởi tạo thanh toán trùng Key đang xử lý.
  - `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` (HTTP 400): Giao dịch khởi tạo thanh toán trùng Key khác số tiền hoặc bookingId.
  - `PAYMENT_BOOKING_NOT_FOUND` (HTTP 404): `bookingId` không tồn tại trong hệ thống.
  - `PAYMENT_BOOKING_EXPIRED` (HTTP 400): Đơn giữ chỗ đã hết hạn 10 phút (`BR-BOOK-003`).
  - `PAYMENT_SIGNATURE_INVALID` (HTTP 400): Chữ ký MoMo IPN không hợp lệ.
  - `PAYMENT_AMOUNT_MISMATCH` (HTTP 400): Số tiền trong IPN không khớp với đơn đặt sân.
- **External Dependency Requirement:** Việc đăng ký chính thức các mã lỗi trên vào Bảng Error Code Registry toàn hệ thống thuộc về phụ thuộc ngoại vi **`Task 12 Error Registry`** (`GAP-IDEMP-001`).

---

## 13. RELIABILITY & PROVIDER TIMEOUT SEMANTICS (TÍNH TIN CẦU VÀ XỬ LÝ SỰ CỐ GIAO DỊCH)

- **Phân biệt Rõ rệt giữa Infrastructure HTTP 500 và Provider Timeout:**
  - *Infrastructure HTTP 500 (Server Failure):* Tuân thủ baseline `TASK 01.06.04.06.05` — Record idempotency không được lưu hoàn tất; Client được phép Clean Retry với cùng `Idempotency-Key`.
  - *Client Request Timeout (Mạng rớt giữa Client & Backend):*
    - Nếu request đã xử lý xong tại Server -> Client retry nhận lại **Option A Strict Response Replay**.
    - Nếu request vẫn đang xử lý -> Client retry nhận `HTTP 409 Conflict` (`IDEMPOTENCY_REQUEST_IN_PROGRESS`).
  - *Provider Timeout / Unknown Provider Outcome (Sự cố kết nối giữa Backend & MoMo):*
    - **CẢNH BÁO KIẾN TRÚC:** Provider Timeout tạo ra trạng thái **`UNKNOWN PROVIDER OUTCOME`** (Chưa xác định MoMo đã nhận tiền hay chưa).
    - **CẤM** tự động đánh dấu payment trạng thái `FAILED` khi chưa có phản hồi xác thực từ MoMo.
    - **CẤM** tự động cho phép Client Clean Retry tạo đơn thanh toán mới để tránh nguy cơ thanh toán đúp hai lần (Duplicate Payment Risk).
    - Trạng thái đối soát sự cố Provider Timeout / Unknown Outcome được quản lý dưới mã bảo lưu **`TBD-PAY-003`** (Provider Timeout / Unknown Outcome Reconciliation).
- **Sự Cố MoMo Gửi Trùng IPN (MoMo IPN Duplicate Retry):** Backend nhận dạng `momoTransId` (Primary Deduplication Identifier) đã xử lý -> Trả về kết quả thành công cho MoMo và bỏ qua logic cập nhật đúp vào cơ sở dữ liệu.

---

## 14. EXTERNAL DEPENDENCIES (CÁC PHỤ THUỘ KỸ THUẬT BÊN NGOÀI)

- **Task 12 Error Registry:** Chờ Task 12 cập nhật đồng bộ các mã lỗi phân hệ Payment vào Bảng Error Code Registry toàn hệ thống (`GAP-IDEMP-001`).
- **Task 01.08.01 (Infrastructure Architecture):** Chờ Task Hạ tầng quy định thông số Retention/TTL chính thức cho việc lưu trữ tạm Idempotency Record (`GAP-IDEMP-002`).

---

## 15. EXPLICIT OUT OF SCOPE (CÁC NỘI DUNG TUYỆT ĐỐI KHÔNG THỰC HIỆN TRONG TASK NÀY)

- ❌ **KHÔNG** viết mã nguồn triển khai (Zero TypeScript, Java, Controller, Service, Interceptor, hay Express code).
- ❌ **KHÔNG** tạo Database Schema, Sequelize Model, hay file Database Migration cho bảng Payment.
- ❌ **KHÔNG** tích hợp trực tiếp MoMo Node.js SDK hay viết code mã hóa HMAC SHA256.
- ❌ **KHÔNG** chọn công nghệ hạ tầng triển khai (Cấm chọn Redis, DB tables, Memory Cache, Distributed Lock, Queue, Outbox Pattern).
- ❌ **KHÔNG** làm lệch bất kỳ Hợp đồng API hay Quyết định Idempotency nào đã `APPROVED` (`.01`..`.05` và `.06.01`..`.06.08`).

---

## 16. ARCHITECTURE DECISION MATRIX (MA TRẬN QUYẾT ĐỊNH KIẾN TRÚC PAYMENT API)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       PAYMENT API ARCHITECTURE DECISION MATRIX                                         │
├───────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────┼───────────────┤
│ Decision Area                 │ Architectural Decision Summary                   │ Authority Source    │ Status        │
├───────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────┼───────────────┤
│ API Base Path & Version       │ `/api/v1/payments` (RESTful, JSON camelCase)    │ TASK 01.06.04.02    │ APPROVED BASE │
│ Success Envelope Schema       │ `{"data": ..., "meta": ...}`                     │ TASK 01.06.04.03    │ APPROVED BASE │
│ Error Envelope Schema         │ `{"error": {"code": ..., "message": ...}}`       │ TASK 01.06.04.04    │ APPROVED BASE │
│ Idempotency Protocol          │ `Idempotency-Key` (Category A MUST send)         │ TASK 01.06.04.06    │ APPROVED BASE │
│ Payment API Domain Boundary   │ Dedicated Payment Domain separate from Booking   │ Task 01.06.04.07.01 │ DECISION      │
│ Initialize Payment Endpoint   │ `POST /api/v1/payments`                          │ Task 01.06.04.07.01 │ DECISION      │
│ MoMo IPN Callback Endpoint    │ `POST /api/v1/payments/momo-ipn`                 │ Task 01.06.04.07.01 │ DECISION      │
│ MoMo Deduplication Identifier │ `momoTransId` (Primary Integration Dedup Key)    │ BR-PAY-001, .06.01  │ APPROVED BASE │
│ Transaction Correlation ID    │ `orderId` (Payment/Booking Correlation Matching) │ Task 01.06.04.07.01 │ DECISION      │
│ Payment Status Endpoint       │ `GET /api/v1/payments/{id}`                      │ Task 01.06.04.07.01 │ DECISION      │
│ Refund API Endpoint URI       │ `POST /api/v1/payments/{id}/refunds`             │ Task 01.06.04.07.01 │ PROPOSED      │
│ Provider Timeout Semantics    │ Unknown Outcome / No Auto-Clean-Retry            │ Task 01.06.04.07.01 │ DECISION(TBD) │
│ Error Code Registry Alignment │ Sync 7 Payment Error Codes into System Registry  │ Task 12 Error Reg   │ DEPENDENCY    │
│ Infrastructure Implementation │ Technology choices (Redis/DB/Locks)              │ Infra Architecture  │ OUT OF SCOPE  │
└───────────────────────────────┴──────────────────────────────────────────────────┴─────────────────────┴───────────────┘
```

---

## 17. OPEN TBDS (DANH MỤC CÁC NỘI DUNG BẢO LƯU CHỜ QUYẾT ĐỊNH)

- **`TBD-PAY-001` (MoMo Provider Error Mapping Details):** Chi tiết bảng ánh xạ 100% các mã lỗi nội bộ từ MoMo sang mã lỗi hệ thống SportHubAI sẽ được cập nhật ở bước lập Hợp đồng API đặc tả chi tiết.
- **`TBD-PAY-002` (Refund URI Final Approval):** Đường dẫn đề xuất `POST /api/v1/payments/{id}/refunds` giữ trạng thái PROPOSED cho đến khi có quyết định phê duyệt chính thức Hợp đồng API từ API Owner.
- **`TBD-PAY-003` (Provider Timeout / Unknown Outcome Reconciliation):** Quy trình đối soát trạng thái giao dịch chưa rõ kết quả khi gặp sự cố Provider Timeout giữa Backend và MoMo chờ đặc tả cơ chế reconciliation chính thức.

---

## 18. TRACEABILITY MATRIX (MA TRẬN TRUY XUẤT NGUỒN GỐC QUYẾT ĐỊNH)

| Architectural Decision | Requirement / Business Rule Basis | API Baseline Source | Status |
|---|---|---|---|
| Payment Intent Creation (`POST /payments`) | `UC-PAY-001`, `FR-PAY-001`, `BR-PAY-001` | TASK 01.06.04.03 | **TRACEABLE** |
| MoMo IPN Callback (`POST /payments/momo-ipn`) | `UC-PAY-002`, `FR-PAY-003`, `BR-PAY-001` | TASK 01.06.04.06.01 | **TRACEABLE** |
| `momoTransId` Primary Deduplication | `BR-PAY-001` | TASK 01.06.04.06.01 | **TRACEABLE** |
| Category A `Idempotency-Key` Requirement | `API-TBD-005` | TASK 01.06.04.06.02 | **TRACEABLE** |
| RBAC Authorization BEFORE Idempotency Lookup | Security Architecture Principle | TASK 01.06.04.06.06 | **TRACEABLE** |
| Refund API Proposed Endpoint | `UC-PAY-REFUND`, `BR-BOOK-003` | GAP-IDEMP-004 Resolution | **TRACEABLE** |
| Error Envelope Compatibility | `FR-PAY-005` | TASK 01.06.04.04 | **TRACEABLE** |

---

## 19. DEFINITION OF DONE (TIÊU CHÍ HOÀN THÀNH REVISION TASK .07.01)

- [x] Ranh giới Phân hệ Payment API (Payment API Boundary) được xác định rõ ràng.
- [x] Vòng đời Giao dịch Thanh toán 5 bước chính thức (`INITIATED`, `PROCESSING`, `SUCCESS`, `FAILED`, `REFUNDED`) được mô hình hóa ở mức Kiến trúc (`PARTIALLY_REFUNDED` được ghi nhận chuẩn xác là `TBD`).
- [x] Kiến trúc Khởi tạo Thanh toán (`POST /api/v1/payments`) được xác định.
- [x] Ranh giới Tích hợp MoMo IPN Callback (`POST /api/v1/payments/momo-ipn`) và vai trò của `momoTransId` (Primary Integration Deduplication Identifier) được chuẩn hóa.
- [x] Phân biệt rõ rệt giữa Infrastructure HTTP 500 và Provider Timeout (Unknown Outcome được quản lý dưới `TBD-PAY-003`).
- [x] Thẩm quyền tài liệu được chuẩn hóa tuyệt đối: `TASK 01.06.04.03` (Success Contract), `TASK 01.06.04.04` (Error Contract), và `Task 12 Error Registry` (Phụ thuộc ngoại vi).
- [x] Giải quyết Khoảng trống Kỹ thuật **`GAP-IDEMP-004`** ở cấp độ Kiến trúc bằng URI đề xuất `POST /api/v1/payments/{id}/refunds` (trạng thái `PROPOSED`).
- [x] Kế thừa 100% Giao thức Idempotency từ `TASK 01.06.04.06.01` đến `.06.08`.
- [x] Bảo tồn tính **Technology-Agnostic** (Zero Redis, zero DB schema, zero code implementation).
- [x] **Trạng thái Approval Gate được thiết lập chuẩn xác:** `ARCHITECTURE DECISION READY — PENDING APPROVAL` (Revision: `BLOCKING CORRECTIONS RESOLVED`).

---

## 20. APPROVAL GATE (PHẦN PHÊ DUYỆT BẮT BUỘC)

```text
================================================================================────────
                               APPROVAL DECISION SECTION
================================================================================────────

TASK:                  01.06.04.07.01

NAME:                  Payment API Architecture Decision

STATUS:                ARCHITECTURE DECISION READY — PENDING APPROVAL

REVISION:              BLOCKING CORRECTIONS RESOLVED

APPROVAL DECISION:     TBD (Awaiting Architecture Owner / API Owner Re-validation)

APPROVED BY:           TBD

APPROVED AT:           TBD

================================================================================────────
READY FOR ARCHITECTURE OWNER / API OWNER RE-VALIDATION.
================================================================================────────
```

---
*Tài liệu Quyết định Kiến trúc API Thanh toán được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
