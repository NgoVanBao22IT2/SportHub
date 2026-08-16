# API ARCHITECTURE — TASK 01.06.04.06
## CANDIDATE DISCOVERY & PROPOSAL

**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.06.04.06 (Micro-Corrected Proposal Phase)  
**Trạng thái:** PROPOSED — PENDING ARCHITECTURE OWNER APPROVAL  
**Tham chiếu nguồn:**  
- [01-actors-and-permissions.md](file:///e:/SportHubAI/docs/requirements/01-actors-and-permissions.md)  
- [02-use-cases-and-user-flows.md](file:///e:/SportHubAI/docs/requirements/02-use-cases-and-user-flows.md)  
- [03-functional-requirements.md](file:///e:/SportHubAI/docs/requirements/03-functional-requirements.md)  
- [04-business-rules.md](file:///e:/SportHubAI/docs/requirements/04-business-rules.md)  
- [05-data-model.md](file:///e:/SportHubAI/docs/requirements/05-data-model.md)  
- [06-system-architecture.md](file:///e:/SportHubAI/docs/architecture/06-system-architecture.md)  
- [07-frontend-architecture.md](file:///e:/SportHubAI/docs/architecture/07-frontend-architecture.md)  
- [08-backend-architecture.md](file:///e:/SportHubAI/docs/architecture/08-backend-architecture.md)  
- [09-api-architectural-principles.md](file:///e:/SportHubAI/docs/architecture/09-api-architectural-principles.md)  
- [10-api-versioning-and-naming.md](file:///e:/SportHubAI/docs/architecture/10-api-versioning-and-naming.md)  
- [11-api-request-response-contract.md](file:///e:/SportHubAI/docs/architecture/11-api-request-response-contract.md)  
- [12-api-error-contract.md](file:///e:/SportHubAI/docs/architecture/12-api-error-contract.md)  
- [13-api-pagination-filtering-sorting-contract.md](file:///e:/SportHubAI/docs/architecture/13-api-pagination-filtering-sorting-contract.md)  
- [14-api-architecture-task-map.md](file:///e:/SportHubAI/docs/architecture/14-api-architecture-task-map.md)  
**Ngày cập nhật:** 2026-08-08  

---

## 1. PURPOSE (MỤC TIÊU TÀI LIỆU)

Mục tiêu của tài liệu này là thực hiện **Khám phá và Đề xuất Ứng viên (Candidate Discovery & Proposal)** cho sub-task `01.06.04.06`:

1. Phân tích toàn bộ hệ thống hiện tại để xác định các vấn đề kiến trúc API (API Architecture Concerns) quan trọng chưa được khóa sau các sub-tasks từ `01.06.04.01` đến `01.06.04.05`.
2. Xây dựng danh sách 5 Candidates dựa trên bằng chứng thực tế từ Nguồn Sự Thật (`docs/requirements/` và `docs/architecture/`).
3. Đánh giá, chấm điểm và đưa ra Đề xuất Ứng viên phù hợp nhất cho `TASK 01.06.04.06` nhằm đảm bảo tính liên tục và nhất quán của hệ thống.
4. **Cảnh báo Ranh giới:** Tài liệu này là **TỜ TRÌNH ĐỀ XUẤT (PROPOSAL)**, KHÔNG ĐẢM NHẬN VAI TRÒ LÀ QUYẾT ĐỊNH KIẾN TRÚC CUỐI CÙNG (FINAL ARCHITECTURE DECISION). Task `01.06.04.06` tiếp tục giữ trạng thái `PROPOSED` cho đến khi nhận được phê duyệt chính thức từ Project Owner / Architecture Owner.

---

## 2. CURRENT BASELINE (NỀN TẢNG KIẾN TRÚC ĐÃ KHÓA)

Hệ thống đã hoàn thành và chốt khóa 100% 5 Hợp đồng Kiến trúc API tiêu chuẩn:

- **`01.06.04.01 — API Architectural Principles`** (`CONFIRMED / PASS`): Nguyên tắc RESTful HTTP API over HTTPS, Thin Controller, Stateless API, Stateless Authorization.
- **`01.06.04.02 — API Versioning & Naming`** (`CONFIRMED / PASS`): URI Path Versioning (`/api/v1`), kebab-case resources, camelCase path/query params.
- **`01.06.04.03 — Request / Response Contract`** (`CONFIRMED / PASS`): Response Envelope `{"data": ...}`, camelCase JSON, ISO 8601 UTC+07:00, Money integer VND, 8 Booking States, Server Authority, Reject Unknown Request Fields -> 400.
- **`01.06.04.04 — API Error Contract`** (`CONFIRMED / PASS`): Unified Error Envelope `{"error": { ... }}`, machine-readable UPPER_SNAKE_CASE `error.code`, HTTP Status mapping (400, 401, 403, 404, 409, 422, 429, 500, 502, 503), field validation details.
- **`01.06.04.05 — Pagination / Filtering / Sorting Contract`** (`CONFIRMED / PASS`): Page-based 1-indexed pagination (`default=20`, `max=100`), `meta.pagination`, Filtering (`startDate`/`endDate`), Sorting (`sort=field:dir`).

---

## 3. SOURCE OF TRUTH REVIEWED (CÁC NGUỒN ĐÃ RÀ SOÁT)

Đã tiến hành rà soát 100% bằng chứng từ:
1. `docs/requirements/01-actors-and-permissions.md`: Quy tắc phân quyền RBAC và cô lập dữ liệu đối tác (`Owner Tenant Isolation`).
2. `docs/requirements/02-use-cases-and-user-flows.md` & `03-functional-requirements.md`: Luồng đặt sân, thanh toán ngầm MoMo, đăng ký đối tác, tìm kiếm sân.
3. `docs/requirements/04-business-rules.md`: Báo lỗi chống đúp đơn (`BR-BOOK-003`), chống thanh toán đúp (`BR-PAY-001`), thời hạn đếm ngược giữ chỗ 10m (`BR-BOOK-002`).
4. `docs/requirements/05-data-model.md`: 13 Core MVP Entities và quan hệ liên kết.
5. `docs/architecture/06-system-architecture.md` & `08-backend-architecture.md`: Modular Monolith 10 Domain Modules, MoMo IPN Callback verification, Real Email OTP, background job 10m sweep.
6. `docs/architecture/09` đến `13`: Danh mục TBDs còn tồn đọng (`API-TBD-005` Idempotency, `API-TBD-013` Whitelists, `API-TBD-014` Default Sorts).

---

## 4. EXISTING API CONTRACT COVERAGE (MỨC ĐỘ PHỦ CỦA CÁC CONTRACT ĐÃ CÓ)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        EXISTING API CONTRACT COVERAGE MAP                              │
├───────────────────────────────┬────────────────────────────────────────────────────────┤
│ API Domain Area               │ Baseline Coverage Status                               │
├───────────────────────────────┼────────────────────────────────────────────────────────┤
│ Architecture Style & Protocol │ ✅ Fully Solved (RESTful, HTTPS, Thin Controller)      │
│ URI Versioning & Base Path    │ ✅ Fully Solved (URI Path /api/v1)                     │
│ Resource Naming & JSON Case   │ ✅ Fully Solved (Plural kebab-case, DTO camelCase)     │
│ Success Response Structure    │ ✅ Fully Solved (Single Envelope & Collection Meta)    │
│ Data Types & Timezone         │ ✅ Fully Solved (ISO 8601 UTC+07:00, Money integer VND)│
│ Error Structure & Mapping     │ ✅ Fully Solved (Error Envelope, HTTP Statuses)        │
│ Validation & Unknown Fields   │ ✅ Fully Solved (Field-level errors, Reject 400)       │
│ Pagination & Filtering & Sort │ ✅ Fully Solved (Page-based 1-indexed, sort=field:dir) │
├───────────────────────────────┼────────────────────────────────────────────────────────┤
│ Idempotency & Safe Retry      │ ❌ REMAINING GAP (Referenced by TBD-005 in 4 docs)     │
│ Resource Endpoint Whitelists  │ ❌ REMAINING GAP (Referenced by TBD-013..15 in Task 13)│
│ Auth Context & Header Spec    │ ❌ REMAINING GAP (Referenced in Auth Principles)       │
│ Rate Limit Headers Spec       │ ❌ REMAINING GAP (Referenced in Task 12 HTTP 429)      │
│ Async Operation Status Spec   │ ❌ REMAINING GAP (Referenced in Task 11 Action DTOs)   │
└───────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 5. ARCHITECTURE GAP ANALYSIS (PHÂN TÍCH KHOẢNG TRỐNG KIẾN TRÚC)

| Existing Contract | Solved Scope | Remaining Gap |
|---|---|---|
| **01.06.04.01 Principles** | Định hướng RESTful, Stateless, Auth/Authz boundary | Chưa có quy ước Header truyền Authentication Context cụ thể. |
| **01.06.04.02 Versioning** | Chuẩn `/api/v1`, naming convention | Chưa có quy ước Header cho Idempotency Keys. |
| **01.06.04.03 Req/Resp** | Envelope `{"data": ...}`, Datatypes, 8 Booking States | Chưa có cơ chế an toàn khi Client retry request tạo đơn đúp. |
| **01.06.04.04 Error** | Envelope `{"error": ...}`, HTTP Statuses, Error Registry | Chưa có Hợp đồng Header Rate Limit khi gặp HTTP 429. |
| **01.06.04.05 Pagination** | Page-based pagination, Sort syntax, Date range | Chưa có danh sách Whitelist cụ thể cho từng Resource Endpoint. |

---

## 6. API ARCHITECTURE GAP MATRIX (MA TRẬN KHOẢNG TRỐNG KIẾN TRÚC API)

| Concern | Evidence Source | Current Status | Impact if Undefined |
|---|---|---|---|
| **Idempotency & Safe Retry** | `09` (L471), `10` (L429), `11` (L620), `12` (L474), `BR-BOOK-003`, `BR-PAY-001` | **REFERENCED** (`TBD-005`) | **HIGH**: Nguy cơ đúp đơn đặt sân và đúp giao dịch thanh toán khi mạng chập chờn hoặc Client retry. |
| **Resource Endpoint Matrix** | `13` (`API-TBD-013`..`015`), `02-use-cases`, `08-backend-architecture` | **PARTIALLY DEFINED** | **HIGH**: Frontend và Backend không có ma trận Whitelist cụ thể để thực thi Filter/Sort chuẩn cho 10 Modules. |
| **Auth Security Context** | `09` (Stateless Auth), `12` (401/403), `01-actors-and-permissions` | **PARTIALLY DEFINED** | **MEDIUM**: Thiếu quy ước chuẩn về Header Authentication (`Authorization: Bearer <token>`) và Trusted Auth Context mapping. |
| **Rate Limit Headers Spec** | `12` (HTTP 429 `RATE_LIMIT_EXCEEDED`), `BR-AUTH-002` | **REFERENCED** | **MEDIUM**: Client không biết thời gian chờ reset (`Retry-After`) hay định mức còn lại khi bị giới hạn tần suất. |
| **Async Action Status Spec** | `11` (Action Endpoints), `08` (MoMo Callback & AI processing) | **PARTIALLY DEFINED** | **LOW**: Chưa có chuẩn HTTP 202 Accepted và polling status envelope cho các tác vụ xử lý bất đồng bộ dài hạn. |

---

## 7. CANDIDATE LIST (DANH SÁCH 5 ỨNG VIÊN ĐỀ XUẤT)

1. **Candidate A:** `Idempotency & Safe Retry API Contract` (Header Name, Key Semantics, Deduplication & Retry Semantics).
2. **Candidate B:** `Resource Endpoint Contract & Whitelist Matrix Specification` (Per-Resource Endpoint DTOs, Whitelists & Default Sorts).
3. **Candidate C:** `API Authentication Context Contract` (Authentication Header Contract, Trusted Auth Context, Identity-to-Authorization Mapping).
4. **Candidate D:** `API Rate Limiting & Throttling Header Contract` (RateLimit Headers, Retry-After Semantics).
5. **Candidate E:** `Async Operation & Status Polling Contract` (HTTP 202 Accepted, Polling Response Envelope).

---

## 8. CANDIDATE DETAIL (CHI TIẾT NỘI DUNG NĂM ỨNG VIÊN)

### CANDIDATE A: Idempotency & Safe Retry API Contract
- **Problem:** Khi Client bấm nút "Thanh toán" hoặc "Đặt sân" nhưng gặp sự cố chập chờn mạng, Client phát lại HTTP Request (`POST /api/v1/bookings`). Nếu không có hợp đồng Idempotency, hệ thống nguy cơ tạo ra 2 đơn giữ chỗ hoặc 2 giao dịch bị trùng lặp.
- **Evidence:** Được tham chiếu trực tiếp tại **`API-TBD-005`** của cả 4 tài liệu đã phê duyệt (`09` L471, `10` L429, `11` L620, `12` L474) và các Business Rules `BR-BOOK-003`, `BR-PAY-001`.
- **Evidence Strength:** **`HIGH`**
- **Scope (Architecture-level):** 
  - Phạm vi áp dụng Idempotency (Idempotency applicability)
  - Cú pháp và định nghĩa Header Key (Idempotency key semantics: `TBD`)
  - Ngữ nghĩa khử trùng lặp yêu cầu (Request deduplication semantics)
  - Hành vi khi nhận yêu cầu trùng lặp (Duplicate request behavior: `TBD`)
  - Ngữ nghĩa thử lại an toàn (Retry semantics)
  - Ngữ nghĩa phát lại phản hồi (Response replay semantics: `TBD`)
  - Ngữ nghĩa xung đột và xử lý lỗi (Conflict semantics: `TBD`)
  - Vòng đời và thời gian lưu trữ Key (Key retention & lifecycle semantics: `TBD`)
- **Ranh Giới Kiến Trúc:** Không quy định chi tiết kỹ thuật triển khai như Redis, Database Table, Locking implementation, Middleware code, Cache library hay Framework classes.
- **Why it belongs in API Architecture:** Đây là quy ước cấp Giao thức API toàn hệ thống áp dụng cho tất cả các phương thức ghi/tạo (`POST`, `PATCH`).

---

### CANDIDATE B: Resource Endpoint Contract & Whitelist Matrix Specification
- **Problem:** Task 13 đã chốt quy tắc Filter/Sort chung nhưng bảo lưu `API-TBD-013` (Resource Whitelists) và `API-TBD-014` (Default Sorts per resource). Cần một ma trận chốt danh sách Endpoints công khai và danh sách Whitelist cho 10 Domain Modules.
- **Evidence:** Bằng chứng trực tiếp từ `13-api-pagination-filtering-sorting-contract.md` (`API-TBD-013`..`015`) và 13 Core MVP Entities trong `05-data-model.md`.
- **Evidence Strength:** **`HIGH`**
- **Scope (Architecture-level):** Định nghĩa bảng ma trận danh mục Resource Endpoints dưới `/api/v1` kèm Whitelist trường được phép filter, trường hỗ trợ multiple values và trường sort mặc định cho từng resource.
- **Why it belongs in API Architecture:** Giải quyết trực tiếp các điểm `TBD` còn tồn đọng của Task 13.

---

### CANDIDATE C: API Authentication Context Contract
- **Problem:** Task 09 và Task 12 đã chốt nguyên tắc Stateless Auth và mã lỗi `401`/`403`, nhưng chưa chốt quy ước Header truyền Authentication Context (`Authorization: Bearer <token>`) và ranh giới bản đồ danh tính sang phân quyền.
- **Evidence:** `09-api-architectural-principles.md` (Stateless Auth principle), `01-actors-and-permissions.md` (RBAC & Owner Isolation).
- **Evidence Strength:** **`MEDIUM`**
- **Scope (Architecture-level):**
  - Hợp đồng Header xác thực (Authentication header contract)
  - Ngữ nghĩa thông tin xác thực tin cậy (Trusted authentication context)
  - Ánh xạ danh tính đã xác thực sang bối cảnh phân quyền (Mapping authenticated identity to authorization context)
  - Ranh giới cô lập dữ liệu đối tác (`Owner/Tenant isolation boundary`)
  - Tương tác giữa các phản hồi lỗi `401 Unauthorized` và `403 Forbidden`
- **Bảo Vệ Server Authority:** Client **TUYỆT ĐỐI KHÔNG ĐƯỢC** tự quyết định `tenantId`, `ownerId` hay `authorization identity` thông qua các Custom Request Headers do Client tự gửi lên. Mọi context phân quyền đều phải xuất phát từ danh tính được Server xác thực.
- **Why it belongs in API Architecture:** Chuẩn hóa giao diện xác thực HTTP giữa Client và Backend.

---

### CANDIDATE D: API Rate Limiting & Throttling Header Contract
- **Problem:** Task 12 đã định nghĩa mã lỗi `429 Too Many Requests` và `RATE_LIMIT_EXCEEDED`, nhưng chưa chuẩn hóa các Response Headers báo định mức tần suất cho Client.
- **Evidence:** `12-api-error-contract.md` (HTTP 429), `04-business-rules.md` (`BR-AUTH-002` OTP cooldown).
- **Evidence Strength:** **`MEDIUM`**
- **Scope (Architecture-level):** Quy định các HTTP Headers chuẩn phản hồi tần suất gọi API (e.g. `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`) và hành vi xử lý của Client khi gặp 429.
- **Why it belongs in API Architecture:** Đảm bảo trải nghiệm Frontend khi bị chặn giới hạn tần suất.

---

### CANDIDATE E: Async Operation & Status Polling Contract
- **Problem:** Các Action Endpoints (như hủy đơn hoặc xử lý tác vụ AI) có thể mất thời gian xử lý. Cần quy chuẩn phản hồi khi tác vụ chưa hoàn thành ngay lập tức.
- **Evidence:** `11-api-request-response-contract.md` (Action Response principles) và `08-backend-architecture.md` (AI Orchestrator & MoMo Callback).
- **Evidence Strength:** **`LOW`**
- **Scope (Architecture-level):** Định nghĩa mã trạng thái `HTTP 202 Accepted`, cấu trúc DTO phản hồi trạng thái tác vụ hàng chờ (`taskStatusId`) và giao thức truy vấn trạng thái (Status Polling Envelope).
- **Why it belongs in API Architecture:** Chuẩn hóa các thao tác xử lý bất đồng bộ dài hạn trên API.

---

## 9. DEPENDENCY ANALYSIS (PHÂN TÍCH HỆ THỐNG PHỤ THUỘC)

- **Candidate A (Idempotency):** Phụ thuộc trực tiếp `01.06.04.01` (Principles), `01.06.04.03` (Request/Response Contract), `01.06.04.04` (Error Contract).
- **Candidate B (Resource Matrix):** Phụ thuộc trực tiếp `01.06.04.02` (Naming), `01.06.04.03` (Response DTOs), `01.06.04.05` (Pagination/Filter/Sort).
- **Candidate C (Auth Headers):** Phụ thuộc trực tiếp `01.06.04.01` (Stateless Auth), `01.06.04.04` (Error 401/403).
- **Candidate D (Rate Limit Headers):** Phụ thuộc trực tiếp `01.06.04.04` (Error 429).
- **Candidate E (Async Operations):** Phụ thuộc trực tiếp `01.06.04.03` (Action Responses).

---

## 10. RELATIONSHIP WITH EXISTING TASKS (MỐI QUAN HỆ VỚI CÁC TASK ĐÃ PASS)

Tất cả 5 Candidates đều được thiết kế để **KẾ THỪA VÀ BẢO TỒN 100%** các quyết định đã phê duyệt từ `01.06.04.01` đến `01.06.04.05`:
- Tuyệt đối giữ nguyên URI `/api/v1`.
- Tuyệt đối giữ nguyên JSON `camelCase`.
- Tuyệt đối giữ nguyên Response Envelope `{"data": ...}` và Error Envelope `{"error": { ... }}`.
- Tuyệt đối giữ nguyên Múi giờ `UTC+07:00` và Tiền tệ `VND Integer Amount`.

---

## 11. RELATIONSHIP WITH TASK 01.06.04.09 (XỬ LÝ TRÙNG LẶP PHẠM VI VỚI TASK .09)

- **Nếu Candidate A (Idempotency) được phê duyệt cho Task `01.06.04.06`:**
  - Task `01.06.04.06` sẽ chính thức trở thành **Chủ thể sở hữu duy nhất (Sole Authoritative Owner)** của tài liệu `Idempotency & Safe Retry API Contract`.
  - Task `01.06.04.09` **KHÔNG ĐƯỢC TIẾP TỤC BỊ HIỂU LÀ MỘT THẢO LUẬN / CONTRACT IDEMPOTENCY ĐỘC LẬP THỨ HAI**.
  - Task `01.06.04.09` vẫn giữ nguyên: `Official Task Name: UNKNOWN`, `Status: REFERENCED ONLY` và được đánh dấu ghi chú: `"Potentially superseded / reassigned if Candidate A is approved."`
  - ❌ **CẤM:** Tuyệt đối không tự đổi Official Task Name của `.09`, không xóa `.09` và không tự tạo mã task mới.
- **Nếu các Candidate B, C, D, E được phê duyệt cho Task `01.06.04.06`:**
  - Các ứng viên này hoàn toàn độc lập với chủ đề Idempotency của `.09` và giữ nguyên `.09` làm task tham chiếu cho Idempotency về sau.

---

## 12. CANDIDATE SCORING & PRIORITIZATION DISCLAIMER

> ⚠️ **SCORING DISCLAIMER:**  
> Candidate scoring is an architecture prioritization heuristic only. Scores do not constitute Architecture Approval or Final Architecture Decision.

| Tiêu Chí Đánh Giá (Criteria) | Candidate A (Idempotency) | Candidate B (Resource Matrix) | Candidate C (Auth Headers) | Candidate D (Rate Limit) | Candidate E (Async Ops) |
|---|---|---|---|---|---|
| **Business Necessity (0-5)** | 5 | 4 | 4 | 3 | 3 |
| **Architectural Dependency (0-5)** | 5 | 5 | 4 | 3 | 3 |
| **Implementation Blocking Risk (0-5)**| 5 | 4 | 4 | 4 | 3 |
| **Cross-resource Impact (0-5)** | 5 | 5 | 5 | 4 | 4 |
| **Evidence Strength (0-5)** | 5 | 5 | 4 | 4 | 2 |
| **TỔNG ĐIỂM (TOTAL SCORE)** | **25 / 25** | **23 / 25** | **21 / 25** | **18 / 25** | **15 / 25** |

---

## 13. RECOMMENDED CANDIDATE (ỨNG VIÊN ĐƯỢC ĐỀ XUẤT CHÍNH)

### Ứng Viên Đề Xuất Ưu Tiên Số 1:
**Candidate A: `Idempotency & Safe Retry API Contract`**

### Lý Do Đề Xuất (Evidence & Architecture Sequencing):
1. **Bằng Chứng Trực Tiếp Cao Nhất:** Đây là chủ đề duy nhất được chỉ danh và tham chiếu chính thức tại mã **`API-TBD-005`** xuyên suốt 4 tài liệu kiến trúc đã duyệt (`09`, `10`, `11`, `12`).
2. **Rủi Ro Nghiệp Vụ Cấp Thiết:** Hệ thống đặt lịch sân và thanh toán MoMo có các Business Rules nghiêm ngặt chống đúp đơn (`BR-BOOK-003`) và chống thanh toán trùng (`BR-PAY-001`). Nếu không có Hợp đồng Idempotency cấp API, việc Client retry khi mạng chập chờn sẽ gây rủi ro đúp dữ liệu.
3. **Mức Độ Sẵn Sàng Kiến Trúc:** Candidate A hoàn thiện mắt xích giao thức HTTP cho các phương thức ghi (`POST`/`PATCH`) ngay sau khi đã chốt Request/Response Contract (`03`) và Error Contract (`04`).

*Lưu ý:* Vị thế "Recommended Candidate" mang ý nghĩa đề xuất kỹ thuật, **KHÔNG BẰNG NGHĨA VỚI "APPROVED TASK"**. Trạng thái của Task `01.06.04.06` tiếp tục là `PROPOSED — PENDING ARCHITECTURE OWNER APPROVAL`.

---

## 14. ALTERNATIVES (CÁC PHƯƠNG ÁN THAY THẾ CHỜ XEM XẾP)

| Candidate | Lý Do Chưa Đề Xuất Xếp Đầu Tiên (Sequencing Rationale) |
|---|---|
| **Candidate B (Resource Matrix)** | Giá trị rất cao cho 10 Modules nhưng có thể phát triển song song khi chi tiết hóa các Resource Endpoints. |
| **Candidate C (Auth Context)** | Đã được bao hàm một phần bởi nguyên tắc Stateless Auth ở Task 01; có thể chờ chuẩn hóa cùng Security Architecture. |
| **Candidate D (Rate Limit)** | Mã lỗi HTTP 429 đã hoạt động; quy ước Header chi tiết có thể chốt ở sub-task hạ tầng tiếp theo. |
| **Candidate E (Async Ops)** | Phù hợp cho giai đoạn nâng cao khi phát triển các tác vụ AI phức tạp. |

---

## 15. RISKS & TASK MAP RECONCILIATION WARNING

- **Rủi ro nếu không chốt Candidate A (Idempotency):** Frontend sẽ không có quy chuẩn chung về việc gửi Header retry, dẫn đến mỗi module Backend tự xử lý chống trùng lặp theo cách khác nhau, gây mất tính nhất quán kiến trúc Modular Monolith.
- ⚠️ **TASK MAP RECONCILIATION WARNING:**  
  *If Candidate A is approved, the Task Map must be reconciled so that Idempotency has a single authoritative task owner and is not duplicated between 01.06.04.06 and 01.06.04.09.*

---

## 16. OPEN QUESTIONS / TBD PRESERVATION (CÁC MỤC CHỜ XÁC NHẬN)

1. **`API-TBD-005`**: Chờ quyết định phê duyệt chính thức Candidate A từ Architecture Owner để chuyển thành tài liệu đặc tả chính thức.
2. **`API-TBD-013..015`**: Giữ nguyên trạng thái TBD chờ xử lý tại Candidate B hoặc các task Resource Contracts chuyên biệt.

---

## 17. NON-GOALS (CÁC NỘI DUNG KHÔNG THỰC HIỆN TRONG TÀI LIỆU NÀY)

- ❌ KHÔNG chốt quyết định API Contract cuối cùng cho Task `01.06.04.06`.
- ❌ KHÔNG tạo file đặc tả Endpoint, Request/Response DTOs hay Error Codes mới.
- ❌ KHÔNG viết mã nguồn triển khai Redis, Middleware, Controller code hay SQL.
- ❌ KHÔNG tự ý thay đổi các quyết định đã APPROVED từ `01.06.04.01` đến `01.06.04.05`.
- ❌ KHÔNG tự định nghĩa chính thức các task `01.06.04.07`, `01.06.04.08`, `01.06.04.10`.

---

## 18. APPROVAL REQUIRED (PHẦN PHÊ DUYỆT BẮT BUỘC)

```text
================================================================================────────
                               APPROVAL DECISION SECTION
================================================================================────────

Current Status:        PROPOSED — PENDING ARCHITECTURE OWNER REVIEW

Recommended Candidate: Candidate A — Idempotency & Safe Retry API Contract

Approval Decision:     TBD (Awaiting Project Owner / Architecture Owner Selection)

Approved By:           TBD

Approved At:           TBD

================================================================================────────
TASK 01.06.04.06 remains PROPOSED until Project Owner / Architecture Owner approves one candidate.
================================================================================────────
```

---
*Tài liệu Candidate Discovery & Proposal được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
