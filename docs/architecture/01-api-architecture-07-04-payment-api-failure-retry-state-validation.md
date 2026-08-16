# API ARCHITECTURE — TASK 01.06.04.07.04
## PAYMENT API FAILURE, RETRY & STATE TRANSITION CONSISTENCY VALIDATION SPECIFICATION

**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.06.04.07.04 (Payment API Failure & State Validation Phase)  
**Parent Task:** 01.06.04.07 — Payment API Architecture (APPROVED on 2026-08-08 by Architecture Owner / API Owner)  
**Tài liệu Tiền đề:**  
- [24-api-architecture-07-01-payment-api-architecture-decision.md](file:///e:/SportHubAI/docs/architecture/24-api-architecture-07-01-payment-api-architecture-decision.md) (`TASK 01.06.04.07.01` APPROVED Baseline)  
- [25-api-architecture-07-02-payment-api-contract.md](file:///e:/SportHubAI/docs/architecture/25-api-architecture-07-02-payment-api-contract.md) (`TASK 01.06.04.07.02` APPROVED Baseline)  
- [26-api-architecture-07-03-payment-api-contract-validation.md](file:///e:/SportHubAI/docs/architecture/26-api-architecture-07-03-payment-api-contract-validation.md) (`TASK 01.06.04.07.03` APPROVED Baseline)  
**Trạng thái:** VALIDATION READY — PENDING APPROVAL  
**Kết quả Thẩm định (Validation Result):** PASS WITH NON-BLOCKING GAPS  
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
- [16-api-architecture-06-01-idempotency-safe-retry.md](file:///e:/SportHubAI/docs/architecture/16-api-architecture-06-01-idempotency-safe-retry.md) đến [23-api-architecture-06-08-idempotency-final-readiness-handoff.md](file:///e:/SportHubAI/docs/architecture/23-api-architecture-06-08-idempotency-final-readiness-handoff.md) (`TASK 01.06.04.06` APPROVED Baseline)  
- [14-api-architecture-task-map.md](file:///e:/SportHubAI/docs/architecture/14-api-architecture-task-map.md)  
**Ngày lập:** 2026-08-08  

---

## 1. PURPOSE & OBJECTIVE (MỤC TIÊU VÀ PHẠM VI THẨM ĐỊNH NÂNG CAO)

Tài liệu này thực hiện **Thẩm định Tính Nhất quán trong Xử lý Lỗi, Thử lại và Chuyển Trạng thái Giao dịch Thanh toán (Payment API Failure, Retry & State Transition Consistency Validation Specification)** cho Sub-task `01.06.04.07.04`.

Mục tiêu chuyên sâu của task này:
1. **State Transition Consistency:** Thẩm định ma trận chuyển trạng thái giao dịch thanh toán, đảm bảo không có bất kỳ chuyển đổi trạng thái phi lý (Illegal State Transition) hay xung đột trạng thái đích (Conflicting Terminal Outcomes).
2. **Provider Failure & Timeout Safety:** Thẩm định các kịch bản sự cố từ cổng thanh toán MoMo (Timeout, Business Failure, Late IPN Callback), đảm bảo duy trì nguyên tắc **`UNKNOWN PROVIDER OUTCOME`**, tuyệt đối chống rủi ro thanh toán đúp (Duplicate Payment Risk).
3. **Retry Safety Classification:** Phân loại minh bạch các cơ chế thử lại (`SAFE RETRY`, `UNSAFE RETRY`, `STRICT REPLAY`, `UNKNOWN OUTCOME`).
4. **Idempotency Reconciliation:** Xác minh tính an toàn Idempotency cho cả luồng Khởi tạo (`POST /payments`), Callback (`POST /payments/momo-ipn`), và Hoàn tiền (`POST /payments/{id}/refunds`).
5. **Technology-Agnostic Guarantee:** Task chỉ kiểm tra mặt ngữ nghĩa kiến trúc (Architectural Semantics Validation), **KHÔNG** viết mã nguồn triển khai, KHÔNG tạo Database Schema, và KHÔNG lựa chọn công nghệ hạ tầng (Zero Redis/Lock/Queue).

---

## 2. OFFICIAL PAYMENT STATES (5 TRẠNG THÁI THANH TOÁN CHÍNH THỨC)

Hệ thống SportHubAI duy trì độc quyền 5 trạng thái thanh toán chính thức lộ ra Client (Client-facing Official Payment Statuses):

```text
1. INITIATED   ──> Ý định thanh toán đã được khởi tạo thành công tại Backend SportHubAI.
2. PROCESSING  ──> Người dùng đã chuyển sang cổng MoMo và đang thao tác thanh toán.
3. SUCCESS     ──> MoMo gửi IPN xác nhận giao dịch thành công (Terminal State).
4. FAILED      ──> Giao dịch thất bại do người dùng hủy, hết hạn, hoặc MoMo báo lỗi (Terminal State).
5. REFUNDED    ──> Giao dịch đã hoàn trả toàn bộ tiền cho khách hàng thành công (Terminal State).
```

- **Quy tắc Quản trị Trạng thái:** Tuyệt đối **KHÔNG** đưa các từ khóa như `PENDING`, `CANCELLED`, `EXPIRED`, `PARTIALLY_REFUNDED`, hay `UNKNOWN` vào danh mục Mã Trạng thái Thanh toán Chính thức (Official Payment Statuses).
- **Diễn đạt Sự cố Provider Timeout:** Điều kiện chưa xác định kết quả từ MoMo được biểu diễn dưới dạng **`UNKNOWN PROVIDER OUTCOME`** — đây là một Điều kiện Kết quả Sự cố (Outcome Condition), **KHÔNG** phải là một Mã Trạng thái Thanh toán Chính thức.

---

## 3. STATE TRANSITION MATRIX (MA TRẬN CHUYỂN TRẠNG THÁI GIAO DỊCH)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         PAYMENT STATE TRANSITION MATRIX                                                │
├─────────────────┼───────────────────────────────┼─────────────────┼───────────┼────────────────────────────────────────┤
│ Current State   │ Event / Trigger Condition     │ Expected State  │ Allowed?  │ Authority Source & Business Logic      │
├─────────────────┼───────────────────────────────┼─────────────────┼───────────┼────────────────────────────────────────┤
│ `INITIATED`     │ Client redirected to MoMo     │ `PROCESSING`    │ **YES**   │ Task 07.01 (Normal Checkout Flow)      │
│ `INITIATED`     │ Booking hold timeout (>10m)   │ `FAILED`        │ **YES**   │ BR-BOOK-003, Task 07.01 (Expired)      │
│ `PROCESSING`    │ MoMo IPN Success (code 0)     │ `SUCCESS`       │ **YES**   │ BR-PAY-001, Task 07.01 (Paid)          │
│ `PROCESSING`    │ MoMo IPN Failure (code != 0)  │ `FAILED`        │ **YES**   │ BR-PAY-001, Task 07.01 (Declined)      │
│ `SUCCESS`       │ Valid Refund Processed        │ `REFUNDED`      │ **YES**   │ BR-BOOK-003, Task 07.01 (Cancelled)    │
│ `SUCCESS`       │ MoMo IPN Failure received late│ `SUCCESS`       │ **NO**    │ Terminal State Safety (Blocked)        │
│ `FAILED`        │ Late MoMo IPN Success arrives │ `FAILED`        │ **NO**    │ Terminal State Safety (Reconciliation) │
│ `REFUNDED`      │ MoMo IPN Success / Late IPN   │ `REFUNDED`      │ **NO**    │ Terminal State Safety (Blocked)        │
│ `REFUNDED`      │ Duplicate Refund Request      │ `REFUNDED`      │ **NO**    │ Option A Strict Replay (Replayed Only) │
└─────────────────┴───────────────────────────────┴─────────────────┴───────────┴────────────────────────────────────────┘
```

---

## 4. INITIALIZE PAYMENT FAILURE MATRIX (F-01 TO F-07)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   INITIALIZE PAYMENT FAILURE SEMANTICS MATRIX                                          │
├───────┬───────────────────────────────────────┬─────────────────────────────┬─────────────┬────────────────────────────┤
│ Code  │ Scenario / Condition                  │ API Outcome / HTTP Status   │ Payment State│ Side Effect & Retry Policy │
├───────┼───────────────────────────────────────┼─────────────────────────────┼─────────────┼────────────────────────────┤
│ F-01  │ Valid request with new Idempotency-Key│ HTTP 201 Created            │ `INITIATED` │ PayURL generated.          │
│ F-02  │ Missing Idempotency-Key (Category A)  │ HTTP 400 Bad Request        │ `NONE`      │ No payment created.        │
│ F-03  │ Idempotency Key Payload Mismatch      │ HTTP 400 Bad Request        │ `NONE`      │ No payment created.        │
│ F-04  │ Same Key & Payload after completed    │ HTTP 201 Strict Replay      │ `INITIATED` │ Replays PayURL. Zero MoMo. │
│ F-05  │ Same Key while request IN_PROGRESS    │ HTTP 409 Conflict           │ `PROCESSING`│ No duplicate payment.      │
│ F-06  │ MoMo Gateway Business Failure (sync)  │ HTTP 400 / 502              │ `FAILED`    │ Booking hold released.     │
│ F-07  │ MoMo Provider Connection Timeout      │ UNKNOWN PROVIDER OUTCOME    │ `PROCESSING`│ NO Auto-FAILED. NO Clean Retry│
└───────┴───────────────────────────────────────┴─────────────────────────────┴─────────────┴────────────────────────────┤
```

---

## 5. PROVIDER TIMEOUT SAFETY & UNKNOWN OUTCOME RECONCILIATION

### 5.1 MoMo Provider Timeout Scenario Analysis
```text
[Client App] ──(POST /payments)──> [SportHubAI Backend] ──(Create PayURL)──> [External MoMo Gateway]
                                                                                      │
                                                                           (Timeout / Network Drop)
                                                                                      │
[Client App] <──(UNKNOWN OUTCOME)── [SportHubAI Backend] <────────────────────────────┘
```

### 5.2 Strict Rules for Provider Timeout Handling
1. **No Automatic Failure Transition:** Khi đợt gọi tới cổng MoMo bị timeout, Backend **TUYỆT ĐỐI KHÔNG** tự ý đánh dấu đơn thanh toán thành `FAILED`, vì MoMo có thể đã khởi tạo giao dịch thành công phía họ.
2. **No Unsafe Clean Retry:** Backend **TUYỆT ĐỐI KHÔNG** cho phép Client thực hiện Clean Retry với Key mới hoặc tự do tạo đúp Payment Intent mới cho cùng một đơn đặt sân, nhằm ngăn ngừa nguy cơ người dùng bị trừ tiền hai lần (Duplicate Payment Risk).
3. **Outcome Abstraction & Reconciliation:** Tình trạng sự cố được quản lý dưới mã bảo lưu kiến trúc **`TBD-PAY-003`** (Provider Timeout / Unknown Outcome Reconciliation). Trạng thái đơn thanh toán duy trì ở `INITIATED` hoặc `PROCESSING` cho tới khi nhận được tín hiệu MoMo IPN Callback hoặc tiến hành đối soát chính thức.

---

## 6. LATE & DUPLICATE PROVIDER CALLBACK SEMANTICS

### 6.1 Late MoMo IPN Callback Arrival
Khi MoMo IPN Callback gửi tới muộn sau thời điểm kết nối giữa Client và Backend bị timeout:
- **Transaction Correlation:** Backend đối chiếu Correlation Identifier (**`orderId`**) trong IPN payload để tìm đúng bản ghi Payment Intent trong cơ sở dữ liệu.
- **State Update:** Nếu Payment Intent đang ở `INITIATED` hoặc `PROCESSING` và IPN báo `resultCode == 0` -> Cập nhật chuyển trạng thái thành **`SUCCESS`** và xác nhận đơn đặt sân thành công.

### 6.2 Duplicate MoMo IPN Delivery
Khi MoMo phát lại Callback nhiều lần cho cùng một giao dịch:
- **Primary Deduplication Identifier:** Backend lọc trùng đúp tuyệt đối dựa trên mã giao dịch MoMo **`momoTransId`** (`transId` trong payload).
- **Zero Side-Effect Guarantee:** Các Callback trùng `momoTransId` đã xử lý trước đó sẽ bị bỏ qua (Zero Side-Effect), không cập nhật đúp trạng thái đơn đặt sân, và trả ngay phản hồi canonical `HTTP 200 OK {"resultCode": 0, "message": "Confirmed"}` theo `CONTRACT DECISION — 01.06.04.07.02`.

### 6.3 Reordered / Illegal IPN Prevention
- Nếu đơn thanh toán đã chuyển sang trạng thái cuối cùng **`SUCCESS`**, một Callback báo lỗi đến sau (`resultCode != 0`) sẽ bị bác bỏ (Blocked), không cho phép hạ trạng thái từ `SUCCESS` xuống `FAILED`.

---

## 7. REFUND FAILURE & RETRY SEMANTICS

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      REFUND FAILURE & RETRY MATRIX                                                     │
├───────────────────────────────┼───────────────────────────────┼─────────────────┼──────────────────────────────────────┤
│ Refund Scenario / Condition   │ MoMo Refund Gateway Response  │ Payment State   │ Side Effect & Retry Semantics        │
├───────────────────────────────┼───────────────────────────────┼─────────────────┼──────────────────────────────────────┤
│ Refund Success                │ MoMo Refund SUCCESS (code 0)  │ `REFUNDED`      │ Booking cancelled, Money refunded.   │
│ Business Validation Failure   │ Invalid state / Hold active   │ `SUCCESS`       │ HTTP 400. Payment remains `SUCCESS`. │
│ MoMo Gateway Refund Failure   │ MoMo Refund FAIL (code != 0)  │ `SUCCESS`       │ HTTP 502. Payment remains `SUCCESS`. │
│ MoMo Refund Gateway Timeout   │ Timeout / Connection Drop     │ `SUCCESS`       │ UNKNOWN OUTCOME. Payment remains `SUCCESS`.│
│ Duplicate Refund Retry (Key)  │ Client Retries Same Key       │ `REFUNDED`      │ Option A Strict Replay. Zero 2nd Refund.│
└───────────────────────────────┴───────────────────────────────┴─────────────────┴──────────────────────────────────────┘
```

- **Safety Guarantee:** Một giao dịch hoàn tiền bị thất bại hoặc bị timeout **KHÔNG** làm thay đổi trạng thái gốc `SUCCESS` của đơn thanh toán thành `REFUNDED`, bảo vệ tính nguyên tố và tránh báo hoàn tiền giả (False Refund).

---

## 8. RETRY SAFETY CLASSIFICATION (PHÂN LOẠI AN TOÀN THỬ LẠI)

Mọi thao tác thử lại (Retry Operation) trong Phân hệ Payment API được phân loại theo 4 cấp độ an toàn:

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      RETRY SAFETY CLASSIFICATION TABLE                                                 │
├───────────────────┼──────────────────────────────────────────────────────────┼─────────────────────────────────────────┤
│ Retry Category    │ Behavioral Semantics                                     │ Applicable Scenarios                    │
├───────────────────┼──────────────────────────────────────────────────────────┼─────────────────────────────────────────┤
│ **`SAFE RETRY`**  │ Retry an toàn không gây side-effect (Read-only query)    │ `GET /api/v1/payments/{id}`             │
│ **`STRICT REPLAY`**│ Replay trả lại kết quả cũ qua Idempotency Store (Option A)│ `POST /payments` & `POST /refunds` cùng Key│
│ **`UNSAFE RETRY`**│ Retry có rủi ro tạo đơn thanh toán đúp (Forbidden)       │ Re-submitting with NEW Key on Timeout   │
│ **`UNKNOWN OUTCOME`│ Chưa xác định kết quả phía MoMo, cấm tự động thử lại      │ MoMo Gateway Connection Timeout         │
└───────────────────┴──────────────────────────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 9. DETAILED FAILURE SCENARIO MATRIX (F01 TO F15)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    COMPREHENSIVE FAILURE SCENARIO MATRIX                                               │
├─────┬────────────────────────────────┬───────────────────┬──────────────┬──────────────┬───────────────┬───────────────┤
│ ID  │ Scenario Description           │ Provider Outcome  │ API Result   │ Payment State│ Retry Allowed │ Side Effect   │
├─────┼────────────────────────────────┼───────────────────┼──────────────┼──────────────┼───────────────┼───────────────┤
│ F01 │ Missing Idempotency-Key        │ Not Executed      │ HTTP 400     │ `NONE`       │ YES (with Key)│ None          │
│ F02 │ Invalid Key Format (<16 chars) │ Not Executed      │ HTTP 400     │ `NONE`       │ YES (valid Key)│ None         │
│ F03 │ Payload Mismatch               │ Not Executed      │ HTTP 400     │ `NONE`       │ NO (same Key) │ None          │
│ F04 │ Strict Replay (Same Key)       │ Previously Done   │ HTTP 201     │ `INITIATED`  │ YES (Replay)  │ Zero MoMo Call│
│ F05 │ Request In-Progress            │ Executing         │ HTTP 409     │ `PROCESSING` │ YES (Wait)    │ None          │
│ F06 │ Provider Synchronous Success   │ SUCCESS           │ HTTP 201     │ `INITIATED`  │ YES (Replay)  │ PayURL created│
│ F07 │ Provider Business Failure      │ REJECTED          │ HTTP 400/502 │ `FAILED`     │ NO (Clean New)│ Hold Released │
│ F08 │ Provider Timeout               │ UNKNOWN           │ TBD-PAY-003  │ `PROCESSING` │ NO Auto-Retry │ Reconcile Req │
│ F09 │ Late IPN Callback Arrival      │ SUCCESS (Code 0)  │ HTTP 200     │ `SUCCESS`    │ N/A (Server)  │ State -> SUCCESS│
│ F10 │ Duplicate IPN (`momoTransId`)  │ SUCCESS (Code 0)  │ HTTP 200     │ `SUCCESS`    │ N/A (Server)  │ Zero Extra Upd│
│ F11 │ Unknown IPN (`orderId` missing)│ UNKNOWN           │ HTTP 400     │ `NONE`       │ N/A (Server)  │ Manual Audit  │
│ F12 │ Refund Success                 │ SUCCESS           │ HTTP 200     │ `REFUNDED`   │ YES (Replay)  │ Money Refunded│
│ F13 │ Refund Business Failure        │ REJECTED          │ HTTP 400     │ `SUCCESS`    │ NO            │ Remains SUCCESS│
│ F14 │ Refund Provider Timeout        │ UNKNOWN           │ HTTP 502/TBD │ `SUCCESS`    │ NO Auto-Retry │ Remains SUCCESS│
│ F15 │ Refund Duplicate Retry (Key)   │ Previously Done   │ HTTP 200     │ `REFUNDED`   │ YES (Replay)  │ Zero 2nd Refund│
└─────┴────────────────────────────────┴───────────────────┴──────────────┴──────────────┴───────────────┴───────────────┘
```

---

## 10. CROSS-DOMAIN FAILURE RECONCILIATION

- **Booking Domain Reconciliation:** Khi đơn thanh toán chuyển sang `FAILED` (do hết hạn 10m `BR-BOOK-003` hoặc MoMo báo từ chối), Backend phát tín hiệu giải phóng trạng thái giữ chỗ `BOOKING_HOLD_ACTIVE` của Booking Domain. Khi thanh toán `SUCCESS`, Booking chuyển trạng thái chính thức sang `BOOKING_CONFIRMED`.
- **Auth & Authorization Security Reconciliation:** Thao tác truy cập không hợp lệ (`401 Unauthorized` hoặc `403 Forbidden`) bị chặn ngắt tuyến ngay tại Lớp Bảo mật Auth, tuyệt đối **KHÔNG** làm ghi nhận hay biến đổi Idempotency Record và Payment State.

---

## 11. VALIDATION TEST SCENARIOS (V1 TO V12)

| Mã Scenario | Kịch Bản Thẩm Định Kỹ Thuật (Validation Test Scenario) | Result & Behavior (Kết Quả Kỳ Vọng) | Status |
|---|---|---|---|
| **V1** | Client gửi `POST /payments` trùng Key & Payload sau khi thành công | Server trả lại phản hồi `201 Created` cũ qua **Option A Strict Replay**. | **PASS** |
| **V2** | Client gửi `POST /payments` trùng Key nhưng khác Payload | Server trả về lỗi `HTTP 400 Bad Request` (`PAYLOAD_MISMATCH`). | **PASS** |
| **V3** | Client gửi `POST /payments` trùng Key khi request đang chạy | Server trả về lỗi `HTTP 409 Conflict` (`IDEMPOTENCY_REQUEST_IN_PROGRESS`). | **PASS** |
| **V4** | Giao dịch khởi tạo thanh toán MoMo báo thành công đồng bộ | Trạng thái Payment ghi nhận `INITIATED`, trả về `payUrl` chuyển hướng. | **PASS** |
| **V5** | MoMo từ chối giao dịch thanh toán đồng bộ | Trạng thái Payment ghi nhận `FAILED`, giải phóng đơn giữ chỗ Booking. | **PASS** |
| **V6** | Kết nối MoMo bị Provider Timeout | Trạng thái ghi nhận `UNKNOWN PROVIDER OUTCOME` (`TBD-PAY-003`), cấm auto-Clean-Retry. | **PASS** |
| **V7** | Timeout kết nối sau đó MoMo IPN gửi tín hiệu thành công muộn | Correlation qua `orderId`, đối soát cập nhật trạng thái thành `SUCCESS`. | **PASS** |
| **V8** | MoMo gửi đúp Callback trùng `momoTransId` | Lọc trùng theo `momoTransId`, trả `200 OK {"resultCode": 0, "message": "Confirmed"}`. | **PASS** |
| **V9** | Tín hiệu IPN báo lỗi đến sau khi Payment đã ở `SUCCESS` | Khóa trạng thái cuối (Terminal State Safety), giữ nguyên `SUCCESS`. | **PASS** |
| **V10** | Yêu cầu Refund hợp lệ được MoMo xử lý thành công | Trạng thái Payment chuyển chính thức từ `SUCCESS` ──> `REFUNDED`. | **PASS** |
| **V11** | Yêu cầu Refund bị từ chối hoặc lỗi kết nối MoMo | Giữ nguyên trạng thái `SUCCESS`, không chuyển lầm sang `REFUNDED`. | **PASS** |
| **V12** | Client phát lại `POST /refunds` trùng Key sau khi Refund xong | Server trả lại kết quả Refund cũ qua **Option A Strict Replay**, zero 2nd refund. | **PASS** |

---

## 12. GAP CLASSIFICATION & CONFLICT DETECTION (PHÂN LOẠI KHOẢNG TRỐNG VÀ XUNG ĐỘT)

### 12.1 Conflict Detection Audit
- **Kết quả Kiểm tra Xung đột Kiến trúc:** **ZERO BLOCKING CONFLICTS FOUND** (0 xung đột chặn). Tất cả các quy tắc xử lý lỗi, thử lại và chuyển trạng thái hoàn toàn tuân thủ `.07.01`, `.07.02`, `.07.03` và baseline `.06`.

### 12.2 Gap Classification Register
- **`GAP-PAY-001` (System Error Code Registry Sync):** Phụ thuộc ngoại vi chờ Task 12 đăng ký mã lỗi vào Registry hệ thống (`EXTERNAL DEPENDENCY`).
- **`GAP-PAY-002` (Infrastructure Key Retention TTL):** Phụ thuộc ngoại vi chờ Task 01.08.01 ban hành TTL chính thức (`EXTERNAL DEPENDENCY`).
- **`GAP-PAY-003` (Provider Timeout Reconciliation Spec - `TBD-PAY-003`):** Bảo lưu TBD về quy trình đối soát tự động khi MoMo timeout (`NON-BLOCKING GAP / TBD`).
- **`GAP-PAY-004` (MoMo Signature Verification Spec - `TBD-PAY-004`):** Bảo lưu TBD về quy cách thuật toán chi tiết tạo chữ ký MoMo (`NON-BLOCKING GAP / TBD`).

---

## 13. TRACEABILITY MATRIX (MA TRẬN TRUY XUẤT NGUỒN GỐC KĨ THUẬT)

| Rule ID | Consistency Rule Description | Source Baseline | Authority Source | Scenario | Result |
|---|---|---|---|---|---|
| **TR-PAY-F01** | Strict Replay on Duplicate Initialize | `API-TBD-005` | TASK 01.06.04.06.02 | Scenario V1 | **PASS** |
| **TR-PAY-F02** | Payload Mismatch Protection | `API-TBD-005` | TASK 01.06.04.06.02 | Scenario V2 | **PASS** |
| **TR-PAY-F03** | In-Progress Lock Protection | `API-TBD-005` | TASK 01.06.04.06.02 | Scenario V3 | **PASS** |
| **TR-PAY-F04** | Provider Timeout Safety (Unknown Outcome) | Architecture Principle | Task 01.06.04.07.01 | Scenario V6 | **PASS** |
| **TR-PAY-F05** | Late IPN Reconciliation | `BR-PAY-001` | Task 01.06.04.07.01 | Scenario V7 | **PASS** |
| **TR-PAY-F06** | `momoTransId` Primary Deduplication | `BR-PAY-001` | TASK 01.06.04.06.01 | Scenario V8 | **PASS** |
| **TR-PAY-F07** | Terminal State Immutability (`SUCCESS`) | State Machine Rule | Task 01.06.04.07.01 | Scenario V9 | **PASS** |
| **TR-PAY-F08** | Refund Failure Safety (Remains SUCCESS) | `BR-BOOK-003` | Task 01.06.04.07.02 | Scenario V11 | **PASS** |
| **TR-PAY-F09** | Strict Replay on Duplicate Refund | Idempotency Rule | Task 01.06.04.07.02 | Scenario V12 | **PASS** |

---

## 14. DEFINITION OF DONE (TIÊU CHÍ HOÀN THÀNH TASK .07.04)

- [x] Đã thiết lập Ma trận Chuyển trạng thái Thanh toán chính thức (State Transition Matrix) cho 5 trạng thái (`INITIATED`, `PROCESSING`, `SUCCESS`, `FAILED`, `REFUNDED`).
- [x] Đã thiết lập Ma trận Xử lý Lỗi Khởi tạo Thanh toán (`F-01..F-07`) và Ma trận Lỗi Chuyên sâu (`F01..F15`).
- [x] Đã chứng minh tính an toàn sự cố Provider Timeout (`UNKNOWN PROVIDER OUTCOME` — `TBD-PAY-003`), cấm auto-FAILED và cấm auto-Clean-Retry.
- [x] Đã chứng minh quy định lọc trùng `momoTransId` (Primary Integration Deduplication Identifier) và đối chiếu `orderId` (Correlation Matching Identifier) cho MoMo IPN Callback.
- [x] Đã chứng minh tính an toàn cho luồng Refund Failure & Retry (giữ trạng thái `SUCCESS` khi lỗi cổng, Strict Replay khi trùng Key).
- [x] Đã phân loại minh bạch 4 cấp độ thử lại (`SAFE RETRY`, `STRICT REPLAY`, `UNSAFE RETRY`, `UNKNOWN OUTCOME`).
- [x] Đã hoàn thành 12 kịch bản thẩm định kỹ thuật (`Scenario V1..V12`).
- [x] Đã xác nhận **ZERO BLOCKING CONFLICTS** và phân loại 4 GAPs/Dependencies phi ngắt tuyến.
- [x] Bảo tồn tính **Technology-Agnostic** (Zero Redis, zero DB schema, zero code implementation).
- [x] **Kết quả Thẩm định thiết lập chuẩn xác:** `PASS WITH NON-BLOCKING GAPS`.

---

## 15. FINAL DOCUMENT STATUS & APPROVAL GATE

```text
================================================================================────────
                               APPROVAL DECISION SECTION
================================================================================────────

TASK:                  01.06.04.07.04

NAME:                  Payment API Failure, Retry & State Transition Consistency Validation

STATUS:                VALIDATION READY — PENDING APPROVAL

VALIDATION RESULT:     PASS WITH NON-BLOCKING GAPS

BLOCKING ISSUES:       0

NON-BLOCKING GAPS:     4

EXTERNAL DEPENDENCIES: 2

APPROVAL DECISION:     TBD (Awaiting Architecture Owner / API Owner Review & Approval)

APPROVED BY:           TBD

APPROVED AT:           TBD

NEXT STEP:             ARCHITECTURE OWNER / API OWNER REVIEW
================================================================================────────
```

---
*Tài liệu Đặc tả Thẩm định Tính Nhất quán trong Xử lý Lỗi, Thử lại và Chuyển Trạng thái Giao dịch Thanh toán được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
