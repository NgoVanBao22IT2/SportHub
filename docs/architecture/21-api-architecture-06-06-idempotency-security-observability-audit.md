# API ARCHITECTURE — TASK 01.06.04.06.06
## IDEMPOTENCY SECURITY, OBSERVABILITY & AUDIT REQUIREMENTS SPECIFICATION

**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.06.04.06.06 (Security, Observability & Audit Requirements Phase)  
**Trạng thái:** SECURITY / OBSERVABILITY / AUDIT READY — OPEN DEPENDENCIES (PENDING APPROVAL)  
**Tham chiếu nguồn:**  
- [01-actors-and-permissions.md](file:///e:/SportHubAI/docs/requirements/01-actors-and-permissions.md)  
- [02-use-cases-and-user-flows.md](file:///e:/SportHubAI/docs/requirements/02-use-cases-and-user-flows.md)  
- [03-functional-requirements.md](file:///e:/SportHubAI/docs/requirements/03-functional-requirements.md)  
- [04-business-rules.md](file:///e:/SportHubAI/docs/requirements/04-business-rules.md) (BR-BOOK-003, BR-PAY-001)  
- [05-data-model.md](file:///e:/SportHubAI/docs/requirements/05-data-model.md)  
- [06-system-architecture.md](file:///e:/SportHubAI/docs/architecture/06-system-architecture.md)  
- [07-frontend-architecture.md](file:///e:/SportHubAI/docs/architecture/07-frontend-architecture.md)  
- [08-backend-architecture.md](file:///e:/SportHubAI/docs/architecture/08-backend-architecture.md)  
- [09-api-architectural-principles.md](file:///e:/SportHubAI/docs/architecture/09-api-architectural-principles.md) (API-TBD-005)  
- [10-api-versioning-and-naming.md](file:///e:/SportHubAI/docs/architecture/10-api-versioning-and-naming.md) (API-TBD-005)  
- [11-api-request-response-contract.md](file:///e:/SportHubAI/docs/architecture/11-api-request-response-contract.md) (API-TBD-005)  
- [12-api-error-contract.md](file:///e:/SportHubAI/docs/architecture/12-api-error-contract.md) (API-TBD-005)  
- [13-api-pagination-filtering-sorting-contract.md](file:///e:/SportHubAI/docs/architecture/13-api-pagination-filtering-sorting-contract.md)  
- [14-api-architecture-task-map.md](file:///e:/SportHubAI/docs/architecture/14-api-architecture-task-map.md)  
- [15-api-architecture-06-candidate-discovery.md](file:///e:/SportHubAI/docs/architecture/15-api-architecture-06-candidate-discovery.md)  
- [16-api-architecture-06-01-idempotency-safe-retry.md](file:///e:/SportHubAI/docs/architecture/16-api-architecture-06-01-idempotency-safe-retry.md) (APPROVED)  
- [17-api-architecture-06-02-idempotency-api-contract.md](file:///e:/SportHubAI/docs/architecture/17-api-architecture-06-02-idempotency-api-contract.md) (APPROVED)  
- [18-api-architecture-06-03-idempotency-contract-validation.md](file:///e:/SportHubAI/docs/architecture/18-api-architecture-06-03-idempotency-contract-validation.md) (APPROVED)  
- [19-api-architecture-06-04-idempotency-gap-resolution.md](file:///e:/SportHubAI/docs/architecture/19-api-architecture-06-04-idempotency-gap-resolution.md) (APPROVED)  
- [20-api-architecture-06-05-idempotency-operational-failure-semantics.md](file:///e:/SportHubAI/docs/architecture/20-api-architecture-06-05-idempotency-operational-failure-semantics.md) (APPROVED)  
**Ngày lập:** 2026-08-08  

---

## 1. PURPOSE (MỤC TIÊU TÀI LIỆU)

Tài liệu này xác định **Đặc tả Yêu cầu Bảo mật, Giám sát và Kiểm toán cho Giao thức Idempotency (Security, Observability & Audit Requirements Specification)** cho sub-task `01.06.04.06.06`:

1. Thiết lập các yêu cầu an toàn thông tin (Security Boundary), chống tấn công dò quét Key (Key Enumeration), ranh giới phân quyền cô lập (Authorization & Tenant Isolation) và xử lý dữ liệu nhạy cảm (Sensitive Data Handling).
2. Quy định yêu cầu Giám sát (Observability Metrics/Events) và Kiểm toán (Audit Requirements vs Operational Logs) cấp Kiến trúc API.
3. Phân định rạch ròi an ninh cho luồng HTTP API Client-to-Server và luồng Callback Tích hợp Thanh toán MoMo.
4. **Cảnh báo Quyền hạn:** Task `.06.06` KHÔNG chọn công nghệ hạ tầng (Zero Redis, DB tables, Kafka, Encryption algorithms), KHÔNG sửa đổi các Hợp đồng đã `APPROVED` (`.01` đến `.06.05`), và KHÔNG thay đổi Task Map `.09`.

---

## 2. PREREQUISITES (XÁC MINH ĐIỀU KIỆN TIÊN ĐỀ)

Đã xác minh trạng thái phê duyệt chính thức của 100% tài liệu tiền đề:
- **`01.06.04.06.01 — Idempotency Architecture Decision`**: `APPROVED` (ngày 2026-08-08).
- **`01.06.04.06.02 — Idempotency API Contract`**: `APPROVED` (ngày 2026-08-08).
- **`01.06.04.06.03 — Contract Validation & Adoption Matrix`**: `APPROVED` (ngày 2026-08-08).
- **`01.06.04.06.04 — Gap Resolution & Dependency Closure`**: `APPROVED` (ngày 2026-08-08).
- **`01.06.04.06.05 — Operational & Failure Semantics`**: `APPROVED` (ngày 2026-08-08).
- **Kết Luận Prerequisite:** Đạt 100% điều kiện tiên đề để tiến hành Task `01.06.04.06.06`.

---

## 3. SOURCE OF TRUTH (NGUỒN SỰ THẬT RÀ SOÁT)

Đã rà soát 100% bằng chứng từ:
- `docs/requirements/`: `01-actors-and-permissions.md`, `02-use-cases-and-user-flows.md`, `03-functional-requirements.md`, `04-business-rules.md` (`BR-BOOK-003`, `BR-PAY-001`), `05-data-model.md`.
- `docs/architecture/`: `06` đến `20` (đặc biệt `12-api-error-contract.md`, `17-api-contract`, `20-operational-semantics`).
- Sub-task `01.06.04.09` tiếp tục giữ trạng thái `REFERENCED ONLY`.

---

## 4. AUTHORITY MODEL (MÔ HÌNH QUYỀN HẠN QUYẾT ĐỊNH)

Task `.06.06` đóng vai trò thiết lập **Khung Yêu cầu Bảo mật và Giám sát (Security & Observability Layer)** dựa trên các Hợp đồng API đã phê duyệt. Task này tuyệt đối không được phép override hay thay đổi bất kỳ quyết định nào từ các tài liệu baseline `.01`..`.05` và `.06.01`..`.06.05`.

---

## 5. SECURITY BOUNDARY (RANH GIỚI BẢO MẬT CỦA IDEMPOTENCY KEY)

- **Mã Định Danh Do Client Cung Cấp (Client-Provided Identifier):** `Idempotency-Key` là một mã định danh giao thức do Client gửi lên để chống trùng lặp request.
- **Cấm Coi Key Là Credential Bảo Mật:** `Idempotency-Key` **TUYỆT ĐỐI KHÔNG PHẢI LÀ**:
  - Authentication Credential (Mật khẩu, OTP).
  - Authorization Token (Bearer Access Token, Session ID).
  - Secret Key (API Secret, Private Signature Key).
- **Quy Tắc An Ninh:** Hệ thống tuyệt đối không dùng `Idempotency-Key` làm căn cứ để xác thực danh tính người dùng hay phân quyền truy cập tài nguyên.

---

## 6. AUTHORIZATION ISOLATION (CÔ LẬP PHÂN QUYỀN TUYỆT ĐỐI)

- **Nguyên Tắc Server Authority:**
  - Danh tính người dùng (`Authenticated User ID`), Vai trò (`RBAC Role`) và Đới tác (`Owner Context / Tenant Context`) BẮT BUỘC được Server trích xuất từ Bearer Access Token đã được ký hợp lệ bởi Server Authority.
  - Server **TUYỆT ĐỐI BỎ QUA HOẶC TỪ CHỐI** các Custom Tenant Headers do Client tự gửi lên (như `X-Tenant-Id` hay `X-Owner-Id`).
- **Cô Lập Trạng Thái (State Isolation):**
  - Trạng thái Idempotency của **User A** tuyệt đối KHÔNG được phát lại (replay) cho **User B**.
  - Trạng thái Idempotency của **Owner A** tuyệt đối KHÔNG được truy cập bởi **Owner B**.

---

## 7. KEY ENUMERATION RISK ANALYSIS (PHÂN TÍCH RỦI RO DÒ QUÉT KEY)

- **Tình Huống Tấn Công (Attacker Scenario):** Kẻ tấn công (User B) đoán hoặc thu thập được một chuỗi `Idempotency-Key: 9b1deb4d-...` do User A gửi trước đó.
- **Đánh Giá Rủi Ro:**
  - Do Idempotency Key Scope được khóa cứng theo Tuple 3 thành phần: `(Authenticated Identity, Resource Endpoint, Idempotency-Key)`.
  - Khi User B gửi Key `9b1deb4d-...`, Server tra cứu theo Scope của User B: `(UserB, Endpoint, Key)`.
  - Server nhận diện đây là một Yêu cầu MỚI (`NEW`) dành riêng cho User B, tuyệt đối **KHÔNG trả lại Cached Response của User A** và **KHÔNG làm lộ sự tồn tại Yêu cầu của User A**.
- **Kết Luận Security:** Rủi ro dò quét Key (Key Enumeration) được vô hiệu hóa hoàn toàn bởi cơ chế 3-Tuple Key Scope.

---

## 8. CROSS-IDENTITY REPLAY PROTECTION (CHỐNG PHÁT LẠI CHÉO DANH TÍNH)

- **Quy Tắc Bảo Vệ:** Ngăn chặn tuyệt đối việc phát lại phản hồi của User A cho User B ngay cả khi gửi cùng HTTP Method, cùng Path URI, và cùng `Idempotency-Key`.
- **Hành Vi Server:** Mỗi User có một không gian Key Scope riêng biệt trong hệ thống backend.

---

## 9. CROSS-TENANT ISOLATION (CÔ LẬP RANH GIỚI TẬP ĐỐI TÁC TENANT)

- **Quy Tắc Cô Lập Đối Tác:** Mọi thao tác Idempotent liên quan đến đối tác Venue Owner (`POST /api/v1/owner-applications`, `PATCH /api/v1/venues/{id}`) được cô lập chặt chẽ bởi `Owner Identity` trích xuất từ Auth Token của Server.
- **Bảo Lưu Đặc Tả Chi Tiết:** Các ngữ nghĩa cô lập Tenant nâng cao (nếu có) được bảo lưu theo tài liệu Phân hệ Security Architecture cấp hệ thống.

---

## 10. PAYLOAD MISMATCH SECURITY (BẢO MẬT KHI LỆCH PAYLOAD - PAYLOAD MISMATCH)

- When Client phát lại một Yêu cầu trùng Key nhưng thay đổi nội dung Request Body (Payload Mismatch):
  - Server ngắt tuyến xử lý và trả về **`HTTP 400 Bad Request`** (`"IDEMPOTENCY_KEY_PAYLOAD_MISMATCH"`).
- **Chống Rò Rỉ Dữ Liệu (Information Leakage Protection):**
  - Phản hồi lỗi `400` tuyệt đối **KHÔNG được tiết lộ**: Payload gốc của yêu cầu trước, dấu vết checksum/hash nội bộ, hay dữ liệu cá nhân (PII) đã lưu vết.
  - Phản hồi lỗi chỉ thông báo ngắn gọn việc trùng Key khác dữ liệu theo đúng cấu trúc Task 12 Error Envelope.

---

## 11. RESPONSE REPLAY SECURITY (BẢO MẬT KHI PHÁT LẠI PHẢN HỒI)

- **Thứ Tự Phân Quyền Trước Khởi Chạy Replay:**
  - Thủ tục Phân quyền RBAC bắt buộc chạy TRƯỚC khi thực hiện Response Replay.
  - Nếu User A bị khóa tài khoản hoặc bị thu hồi quyền truy cập (Revoked Token/Role) sau khi tạo request gốc, các Duplicate Request tiếp theo của User A sẽ bị chặn ngay tại tầng Phân quyền (`HTTP 401/403`) và KHÔNG bao giờ nhận lại Cached Replay Response.

---

## 12. SENSITIVE DATA HANDLING (XỬ LÝ DỮ LIỆU NHẠY CẢM VÀ QUYỀN RIÊNG TƯ)

- **Không Lưu Vết Thông Tin Nhạy Cảm Trong Storage Idempotency:**
  - Dữ liệu lưu vết Idempotency tuyệt đối KHÔNG chứa các thông tin nhạy cảm ở dạng Plaintext: Mật khẩu, OTP, Bearer Access Token, Refresh Token, hoặc Thông tin thẻ thanh toán/Credit Card Details.
- **Bảo Vệ Quyền Riêng Tư (Privacy & Data Minimization):** Chỉ lưu vết vừa đủ thông tin Response DTO đã được sanitized theo Hợp đồng Task 11 để phục vụ việc Response Replay.

---

## 13. LOGGING REQUIREMENTS (YÊU CẦU GHI LOG VẬN HÀNH BẢO MẬT)

Mọi log sự kiện liên quan đến Idempotency BẮT BUỘC phải đính kèm các trường định danh khái niệm (Conceptual Correlation Fields):
- **`requestId`**: Trích xuất từ Task 12 Error/Tracing Contract để correlate toàn bộ luồng request.
- **`authenticatedUserId`**: Định danh người dùng đã xác thực.
- **`endpointPath`**: Đường dẫn HTTP API Resource URI.
- **`idempotencyOutcome`**: Kết quả xử lý (`FIRST_SEEN`, `REPLAYED`, `IN_PROGRESS_REJECTED`, `MISMATCH_REJECTED`).

---

## 14. KEY LOGGING RULES (QUY TẮC MÃ HÓA VÀ RÚT GỌN KEY KHI GHI LOG)

- ⚠️ **QUY TẮC MẶC ĐỊNH BẢO MẬT:** Chuỗi `Idempotency-Key` tuyệt đối **KHÔNG ĐƯỢC GHI LOG DẠNG PLAINTEXT ĐẦY ĐỦ** vào System Operational Logs nếu key dài quá 8 ký tự hoặc chứa rủi ro thông tin.
- **Log Masking Requirement:** Kỹ thuật ghi log hệ thống chỉ được log tối đa **8 ký tự đầu tiên** của `Idempotency-Key` kèm `requestId` (Ví dụ: `KeyPrefix: 9b1deb4d... | requestId: req-idem-001`).

---

## 15. OBSERVABILITY EVENTS (CÁC SỰ KIỆN GIÁM SÁT KHÁI NIỆM - CLASSIFICATION)

Định nghĩa và phân loại các Sự kiện Giám sát Khái niệm (Conceptual Observability Events):

| Event Name | Event Purpose | Classification |
|---|---|---|
| **`IDEMPOTENCY_REQUEST_RECEIVED`** | Ghi nhận Yêu cầu Idempotent mới vào hệ thống | `PROPOSED / TBD` |
| **`IDEMPOTENCY_REPLAY`** | Ghi nhận sự kiện Response Replay thành công | `PROPOSED / TBD` |
| **`IDEMPOTENCY_IN_PROGRESS`** | Ghi nhận sự kiện từ chối 409 do trùng request đang chạy | `PROPOSED / TBD` |
| **`IDEMPOTENCY_PAYLOAD_MISMATCH`** | Ghi nhận sự kiện từ chối 400 do lệch payload | `PROPOSED / TBD` |
| **`IDEMPOTENCY_RETRY`** | Ghi nhận sự kiện Client phát lại request hợp lệ | `PROPOSED / TBD` |

---

## 16. METRICS (CÁC CHỈ SỐ GIÁM SÁT KHÁI NIỆM)

Định nghĩa các Chỉ số Giám sát Khái niệm (Conceptual Metric Signals - Không bắt buộc tên vendor):
- **`idempotency_requests_total`**: Tổng số lượng request có truyền `Idempotency-Key`.
- **`idempotency_replay_total`**: Số lượng request kích hoạt Response Replay thành công.
- **`idempotency_conflict_total`**: Số lượng request bị từ chối do `409 Conflict`.
- **`idempotency_mismatch_total`**: Số lượng request bị từ chối do `400 Payload Mismatch`.

---

## 17. ALERTING SIGNALS (CÁC TÍN HIỆU CẢNH BÁO VẬN HÀNH)

- **Tín Hiệu Cảnh Báo Khái Niệm (Conceptual Operational Signals):**
  - Tỷ lệ `Payload Mismatch` tăng đột biến (High Mismatch Rate Signal) ──> Dấu hiệu Client Frontend bị lỗi gửi sai payload hoặc tấn công bất thường.
  - Tỷ lệ `In-Progress Conflict` tăng đột biến (High 409 Rate Signal) ──> Dấu hiệu Client bấm đúp liên tục hoặc nghẽn mạng nghiêm trọng.
- **Threshold Rule:** Hằng số ngưỡng cảnh báo (Threshold Value) giữ trạng thái `TBD — Defined by Operations Team`.

---

## 18. AUDIT REQUIREMENTS (YÊU CẦU KIỂM TOÁN TÁCH BIỆT)

- **Nghiệp Vụ Bắt Buộc Audit (Audit-Required Operations):** Các thao tác làm thay đổi tài chính hoặc dữ liệu giữ chỗ (`Create Booking`, `Initialize Payment`) có thể yêu cầu lưu trữ bản ghi kiểm toán theo chính sách compliance của hệ thống.
- **Chính Sách Lưu Trữ Audit:** Việc lưu trữ bản ghi Audit được thực hiện theo quy trình Audit riêng, độc lập với vòng đời lưu tạm của Idempotency Key.

---

## 19. AUDIT VS LOG DISTINCTION (PHÂN BIỆT RÕ RÀNG GIỮA LOG VÀ AUDIT)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        OPERATIONAL LOG VS LEGAL AUDIT RECORD                           │
├───────────────────────────┬────────────────────────────────────────────────────────────┤
│ Loại Bản Ghi (Record Type)│ Bản Chất và Mục Đích Kiến Trúc (Architecture Purpose)      │
├───────────────────────────┼────────────────────────────────────────────────────────────┤
│ 1. Operational Log        │ Lưu thông tin kỹ thuật ngắn hạn để Tracing, Debug, Monitor.│
│ (System Operational Logs) │ Không dùng làm bằng chứng pháp lý / compliance.            │
├───────────────────────────┼────────────────────────────────────────────────────────────┤
│ 2. Audit Record           │ Bản ghi kiểm toán nghiệp vụ chính thống, có tính bất biến │
│ (Legal / Business Audit)  │ (Immutable), tuân thủ retention policy lâu dài của hệ thống│
└───────────────────────────┴────────────────────────────────────────────────────────────┘
```

- ❌ **CẤM ĐỒNG NHẤT:** Không được mặc định coi Log vận hành hệ thống là Bản ghi Audit pháp lý.

---

## 20. PAYMENT / MOMO SECURITY (BẢO MẬT RANH GIỚI THANH TOÁN MOMO - BR-PAY-001)

- **Bảo Vệ Dữ Liệu MoMo IPN Callback:** Luồng MoMo IPN Callback tuyệt đối **KHÔNG bộc lộ `momoTransId`**, signature key, hay provider response payload cho các caller không được xác thực từ MoMo Server.
- **Không Dùng Header Thay Thế Security:** Hợp đồng HTTP `Idempotency-Key` KHÔNG thay thế cho cơ chế Signature Verification và Deduplication của MoMo IPN Callback (`BR-PAY-001`).

---

## 21. CALLBACK OBSERVABILITY (GIÁM SÁT LUỒNG INTEGRATION CALLBACK)

- Luồng MoMo IPN Callback được giám sát theo Hợp đồng Tracing riêng thuộc phân hệ Payment Integration Architecture, không trộn lẫn chỉ số với luồng Client HTTP API Idempotency.

---

## 22. PRIVACY & DATA MINIMIZATION (QUYỀN RIÊNG TƯ VÀ THU HẸP DỮ LIỆU)

- **Thu Hẹp Dữ Liệu (Data Minimization):** Hệ thống chỉ lưu giữ vừa đủ thông tin Response Payload trong thời hạn lưu trữ quy định để phục vụ phát lại phản hồi.
- **Retention Period:** Thời gian dọn dẹp Key hết hạn tiếp tục duy trì mã `GAP-IDEMP-002 / TBD-IDEMP-002` (chờ Task Hạ tầng 01.08.01).

---

## 23. OPEN DEPENDENCIES (KẾ THỪA 100% CÁC GAPS TỪ TASK .06.04)

Giữ nguyên trạng thái 4 GAPs kế thừa từ Task `01.06.04.06.04`:
- **`GAP-IDEMP-001`**: Sync mã lỗi vào Error Registry Task 12 (`OPEN — EXTERNAL TASK DEPENDENCY`).
- **`GAP-IDEMP-002`**: TTL retention period chưa chốt số kỹ thuật (`OPEN — INFRASTRUCTURE DEPENDENCY`).
- **`GAP-IDEMP-003`**: Replay Header Name chính thức giữ `TBD-IDEMP-003` (`OPEN — CONTRACT DECISION REQUIRED`).
- **`GAP-IDEMP-004`**: Endpoint URI của API Refund chưa chốt (`OPEN — SOURCE OF TRUTH DEPENDENCY`).

---

## 24. SECURITY THREAT MATRIX (MA TRẬN MỐI ĐỌA DỌA AN NINH VÀ KIỂM SOÁT)

| Mã Threat | Tình Huống Đe Dọa An Ninh (Threat Scenario) | Cơ Cơ Kiểm Soát Hiện Có (Existing Control) | Severity | Owner |
|---|---|---|---|---|
| **T01** | Cross-user response replay | 3-Tuple Key Scope `(Identity, Endpoint, Key)` | `CRITICAL` (Controlled) | API Security |
| **T02** | Cross-tenant response replay | Server Authority Auth Token Context | `HIGH` (Controlled) | API Security |
| **T03** | Key enumeration scanning | User ID Scope isolation | `MEDIUM` (Controlled) | API Security |
| **T04** | Payload mismatch data leakage | Error 400 without internal hash exposure | `MEDIUM` (Controlled) | API Security |
| **T05** | Sensitive response replay after access revoked | RBAC Authorization evaluated BEFORE replay | `HIGH` (Controlled) | API Security |
| **T06** | Key leakage via operational logs | Key Masking Rule (Log max 8 chars) | `MEDIUM` (Controlled) | Security Audit |
| **T07** | Plaintext sensitive data logging | PII/Credential filtering in Idempotency storage | `HIGH` (Controlled) | Security Audit |
| **T08** | Callback confusion (MoMo IPN spoofing) | Independent `momoTransId` verification (`BR-PAY-001`) | `HIGH` (Controlled) | Integration Team |
| **T09** | Unauthorized replay request | Bearer Token authentication required | `HIGH` (Controlled) | API Security |
| **T10** | Duplicate payment charge exposure | Category A MUST send Key + Strict Replay | `CRITICAL` (Controlled) | Payment Security |

---

## 25. OBSERVABILITY MATRIX (MA TRẬN CHỈ SỐ VÀ SỰ KIỆN GIÁM SÁT)

| Signal Name | Source | Required? | Data Tracked | Privacy Risk | Status |
|---|---|---|---|---|---|
| `idempotency_requests_total` | API Gateway / Controller | Recommended | Endpoint, Method, Outcome | Low | `PROPOSED` |
| `idempotency_replay_total` | Idempotency Interceptor | Recommended | Endpoint, User ID Hash, `requestId` | Low | `PROPOSED` |
| `idempotency_conflict_total` | Idempotency Interceptor | Recommended | Endpoint, Key Masked | Low | `PROPOSED` |
| `idempotency_mismatch_total` | Idempotency Interceptor | Recommended | Endpoint, Key Masked | Low | `PROPOSED` |

---

## 26. AUDIT MATRIX (MA TRẬN NGHĨA VỤ KIỂM TOÁN NGHIỆP VỤ)

| Event Name | Audit Required? | Evidence Basis | Retention Policy | Status |
|---|---|---|---|---|
| `BOOKING_HOLD_CREATED` | Yes | `BR-BOOK-003`, `UC-BOOK-001` | System Audit Policy | `APPROVED BASELINE` |
| `PAYMENT_INTENT_CREATED` | Yes | `BR-PAY-001`, `UC-PAY-001` | Financial Audit Policy | `APPROVED BASELINE` |
| `IDEMPOTENCY_REPLAY_TRIGGERED` | Optional (Log level) | Task 06.02 Replay Rules | Inherited GAP-IDEMP-002 | `TBD (GAP-002)` |

---

## 27. SECURITY GAP REGISTER (DANH MỤC KHOẢNG TRỐNG AN NINH)

- **Kết Quả Rà Soát Khoảng Trống An Ninh (Security Gap Audit):**
  - Đã rà soát 100% kịch bản an ninh đối chiếu với Nguồn Sự Thật. Tất cả các mối đe dọa an ninh chính (T01..T10) đều đã có cơ chế kiểm soát trực tiếp từ Hợp đồng API `01.06.04.06.02`.
  - **Trạng Thái:** **ZERO NEW SECURITY GAPS (0 Security Gaps Created)**.

---

## 28. CONTRACT DRIFT CHECK (KIỂM TRA SỰ LỆCH CHUẨN HỢP ĐỒNG)

Thực hiện kiểm tra đối chiếu chống lệch chuẩn (Contract Drift Audit) với tất cả các tài liệu đã `APPROVED`:
- [x] Không thay đổi Header `Idempotency-Key`.
- [x] Không thay đổi Key Scope 3-Tuple `(Identity, Endpoint, Key)`.
- [x] Không thay đổi quy tắc Retry hay Strict Response Replay.
- [x] Không thay đổi HTTP Status Codes (`400`, `409`, `200/201`).
- [x] Không thay đổi thứ tự Phân quyền RBAC trước Idempotency Lookup.
- **Kết Luận Contract Drift:** **ZERO CONTRACT DRIFT FOUND (100% INTACT)**.

---

## 29. TECHNOLOGY BOUNDARY (RANH GIỚI VẬN HÀNH TECHNOLOGY-AGNOSTIC)

- Tài liệu `.06.06` duy trì tuyệt đối tính **Technology-Agnostic**:
- ❌ **CẤM KHÓA CÔNG NGHỆ Triển Khai:** Không tự chọn Redis, Database Schema, Cache, Distributed Lock, Queue, Kafka, Outbox Pattern, Hashing Algorithm hay Encryption Implementation. Tất cả việc chọn công nghệ thuộc về các Task triển khai Hạ tầng và Security sau.

---

## 30. FINAL RESULT (KẾT LUẬN CUỐI CÙNG TỔNG HỢP)

```text
================================================================================────────
                     FINAL SECURITY & OBSERVABILITY SUMMARY
================================================================================────────

Security Result:       SECURITY / OBSERVABILITY / AUDIT READY — OPEN DEPENDENCIES

Prerequisite Status:   .06.01 = APPROVED | .06.02 = APPROVED | .06.03 = APPROVED | .06.04 = APPROVED | .06.05 = APPROVED

Contract Drift Audit:  0 Contract Drift Found (100% Compatible)

Security Gaps:         0 New Security Gaps Created

Inherited Dependencies: 4 Open Dependencies Tracked (GAP-IDEMP-001 to GAP-IDEMP-004)

================================================================================────────
SECURITY, OBSERVABILITY & AUDIT REQUIREMENTS SPECIFICATION IS READY FOR REVIEW.
================================================================================────────
```

---

## 31. NON-GOALS (CÁC NỘI DUNG KHÔNG THỰC HIỆN TRONG TASK NÀY)

- ❌ KHÔNG chọn công nghệ triển khai (Cấm chọn Redis, DB tables, Kafka, Encryption algorithms).
- ❌ KHÔNG viết mã nguồn TypeScript, Interceptor, Controller hay Security Filter code.
- ❌ KHÔNG làm lệch các Hợp đồng đã APPROVED (`.01` đến `.06.05`).
- ❌ KHÔNG tự ý đóng các GAPs từ Task `.06.04`.
- ❌ KHÔNG tự đổi tên hay xóa Task `01.06.04.09` trong Task Map.
- ❌ KHÔNG tự động chuyển trạng thái thành APPROVED.

---

## 32. APPROVAL SECTION (PHẦN PHÊ DUYỆT BẮT BUỘC)

```text
================================================================================────────
                               APPROVAL DECISION SECTION
================================================================================────────

STATUS: APPROVED

APPROVAL DECISION: APPROVED
APPROVED BY: Architecture Owner / API Owner
APPROVED AT: 2026-08-08

================================================================================────────
TASK 01.06.04.06.06 IS APPROVED by the Architecture Owner.
================================================================================────────
```

---
*Tài liệu Đặc tả Yêu cầu Bảo mật, Giám sát và Kiểm toán Idempotency được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
