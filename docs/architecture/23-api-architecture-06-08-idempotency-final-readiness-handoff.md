# API ARCHITECTURE — TASK 01.06.04.06.08
## IDEMPOTENCY FINAL READINESS, IMPLEMENTATION BOUNDARY & ARCHITECTURE HANDOFF SPECIFICATION

**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.06.04.06.08 (Final Readiness & Architecture Handoff Phase)  
**Trạng thái:** FINAL READINESS COMPLETE — OPEN DEPENDENCIES — PENDING APPROVAL  
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
- [21-api-architecture-06-06-idempotency-security-observability-audit.md](file:///e:/SportHubAI/docs/architecture/21-api-architecture-06-06-idempotency-security-observability-audit.md) (APPROVED)  
- [22-api-architecture-06-07-idempotency-cross-api-adoption-consistency.md](file:///e:/SportHubAI/docs/architecture/22-api-architecture-06-07-idempotency-cross-api-adoption-consistency.md) (APPROVED)  
**Ngày cập nhật:** 2026-08-08  

---

## 1. PURPOSE (MỤC TIÊU TÀI LIỆU)

Tài liệu này tổng hợp toàn bộ các kết quả và Hợp đồng API Idempotency đã được `APPROVED` (`.06.01` đến `.06.07`) thành **Báo Cáo Sẵn Sàng Kiến Trúc Cuối Cùng, Ranh Giới Triển Khai và Bàn Giao Kiến Trúc Triển Khai (Final Architecture Readiness & Implementation Handoff Specification)** cho sub-task `01.06.04.06.08`:

1. Tổng hợp điểm tựa Hợp đồng Baseline (Approved Idempotency Baseline) và ma trận tiêu chuẩn hợp đồng `RULE-IDEMP-01` đến `RULE-IDEMP-08`.
2. Xác định Ranh giới Triển khai (Implementation Boundary): Phân định rõ các phần đã đủ thẩm quyền lập trình (`CORE CONTRACT READY`), phần phụ thuộc khoảng trống chưa resolved (`DEPENDENCY-CONSTRAINED`), và các phần bảo lưu (`RESERVED / TBD`).
3. Lập Ma Trận Kịch Bản Kiểm Thử Kiến Trúc (`Testability Scenario Matrix T01..T15`) và Bản Bàn Giao Chính Thức (Architecture Handoff) cho Đội ngũ Triển khai Backend / Integration.
4. **Cảnh báo Governance:** Task `.06.08` KHÔNG tạo quyết định kiến trúc mới, KHÔNG viết mã nguồn (zero code), KHÔNG chọn công nghệ hạ tầng (zero Redis/DB/Lock choices), KHÔNG đóng bất kỳ GAP nào chưa có Resolution Authority phê duyệt, và KHÔNG biến các ví dụ/khuyến nghị lịch sử thành hợp đồng bắt buộc.

---

## 2. PREREQUISITES (XÁC MINH ĐIỀU KIỆN TIÊN ĐỀ)

Đã xác minh trạng thái phê duyệt chính thức của 100% tài liệu tiền đề trong hệ thống:
- **`01.06.04.06.01 — Architecture Decision`**: `APPROVED` (ngày 2026-08-08).
- **`01.06.04.06.02 — API Contract`**: `APPROVED` (ngày 2026-08-08).
- **`01.06.04.06.03 — Contract Validation Matrix`**: `APPROVED` (ngày 2026-08-08).
- **`01.06.04.06.04 — Gap Resolution & Dependency Closure`**: `APPROVED` (ngày 2026-08-08).
- **`01.06.04.06.05 — Operational & Failure Semantics`**: `APPROVED` (ngày 2026-08-08).
- **`01.06.04.06.06 — Security, Observability & Audit`**: `APPROVED` (ngày 2026-08-08).
- **`01.06.04.06.07 — Cross-API Adoption & Consistency`**: `APPROVED` (ngày 2026-08-08).
- **Kết Luận Prerequisite:** Đạt 100% điều kiện tiên đề để tiến hành Task `01.06.04.06.08`.

---

## 3. SOURCE OF TRUTH (NGUỒN SỰ THẬT RÀ SOÁT)

Đã rà soát 100% bằng chứng từ:
- `docs/requirements/`: `01` đến `05` (`BR-BOOK-003`, `BR-PAY-001`, `UC-BOOK`, `UC-PAY`, `UC-OWNER`).
- `docs/architecture/`: `06` đến `22` (đặc biệt `11-api-req-resp`, `12-api-error`, `17-api-contract`, `20-operational`, `21-security`, `22-cross-api`).
- Sub-task `01.06.04.09` tiếp tục giữ trạng thái `REFERENCED ONLY`.

---

## 4. AUTHORITY MODEL (MÔ HÌNH QUYỀN HẠN QUYẾT ĐỊNH)

Task `.06.08` đóng vai trò là **Bản Tổng Hợp Sẵn Sàng và Bàn Giao Triển Khai (Consolidation & Handoff Specification)**. Task này không được phép tạo quyết định kiến trúc mới, không được tự ý đóng GAP, và không được override bất kỳ quyết định nào từ các Hợp đồng API đã `APPROVED` (`.01` đến `.07`).

---

## 5. APPROVED IDEMPOTENCY BASELINE (TỔNG HỢP NỀN TẢNG ĐÃ PHÊ DUYỆT)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         APPROVED IDEMPOTENCY BASELINE SUMMARY                                          │
├───────────────────────────────┼──────────────────────────────────────────────────────────────────┼─────────────────────┤
│ Architectural Domain          │ Consolidated Decision Summary                                    │ Source Task & Status│
├───────────────────────────────┼──────────────────────────────────────────────────────────────────┼─────────────────────┤
│ Idempotency Concern           │ Mandatory Architecture Standard for duplication risk mitigation  │ .06.01 APPROVED     │
│ Target API Header             │ `Idempotency-Key` (Case-sensitive, 16..64 ASCII, no whitespace)  │ .06.02 APPROVED     │
│ Mandatory Category A APIs     │ `POST /bookings`, `POST /payments`, `POST /owner-applications`   │ .06.02 APPROVED     │
│ Missing Header Behavior       │ HTTP 400 Bad Request (`MISSING_IDEMPOTENCY_KEY`)                 │ .06.02 APPROVED     │
│ Key Scope Definition          │ 3-Tuple: `(Authenticated Identity, Resource Endpoint, Key)`      │ .06.02 APPROVED     │
│ Duplicate Handling Option     │ Option A Strict Response Replay (exact envelope & HTTP status)   │ .06.01, .02 APPROVED│
│ In-Progress Duplicate         │ HTTP 409 Conflict (`IDEMPOTENCY_REQUEST_IN_PROGRESS`)            │ .06.02 APPROVED     │
│ Payload Mismatch Duplicate    │ HTTP 400 Bad Request (`IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`)        │ .06.02 APPROVED     │
│ Authorization Ordering        │ RBAC Authorization check evaluated BEFORE Idempotency lookup     │ .06.02, .06 APPROVED│
│ Client Retry Semantics        │ Client MUST reuse same Idempotency-Key for retries               │ .06.05 APPROVED     │
│ Log Masking Requirement       │ Log max 8 characters of Idempotency-Key with `requestId`         │ .06.06 APPROVED     │
│ MoMo Integration Boundary     │ `POST /payments` uses Header; IPN Callback uses `momoTransId`    │ BR-PAY-001 APPROVED │
└───────────────────────────────┴──────────────────────────────────────────────────────────────────┴─────────────────────┘
```

---

## 6. FINAL CONTRACT BASELINE (MA TRẬN QUY TẮC HỢP ĐỒNG CUỐI CÙNG RULE 01..08)

| Contract Rule ID | Final Rule Value | Source Specification | Verification Status |
|---|---|---|---|
| **RULE-IDEMP-01** | Header Name = `Idempotency-Key` | Task 06.02 L110 | `APPROVED BASELINE` |
| **RULE-IDEMP-02** | Format = 16..64 ASCII printable (`0x21`..`0x7E`), Case-sensitive | Task 06.02 L120 | `APPROVED BASELINE` |
| **RULE-IDEMP-03** | Scope = `Tuple(Authenticated Identity, Endpoint, Key)` | Task 06.02 L130 | `APPROVED BASELINE` |
| **RULE-IDEMP-04** | Missing Header (Category A) -> HTTP 400 Bad Request | Task 06.02 L190 | `APPROVED BASELINE` |
| **RULE-IDEMP-05** | Payload Mismatch -> HTTP 400 Bad Request | Task 06.02 L210 | `APPROVED BASELINE` |
| **RULE-IDEMP-06** | In-Progress Duplicate -> HTTP 409 Conflict | Task 06.02 L200 | `APPROVED BASELINE` |
| **RULE-IDEMP-07** | Duplicate Completed -> Option A Strict Response Replay | Task 06.02 L140 | `APPROVED BASELINE` |
| **RULE-IDEMP-08** | Client Retry -> MUST reuse same Key | Task 06.05 L160 | `APPROVED BASELINE` |

---

## 7. IMPLEMENTATION BOUNDARY (RANH GIỚI PHÂN LOẠI TRIỂN KHAI)

Ranh giới Triển khai được phân thành 3 cấp độ chính xác:
- **1. IMPLEMENTATION-READY (CORE CONTRACT READY):** 100% các quy tắc hợp đồng API giao tiếp Client-to-Server, quy tắc Replay, Retry, In-Progress, Payload Mismatch, RBAC isolation, và Log masking đã có thẩm quyền chính thức.
- **2. DEPENDENCY-CONSTRAINED:** Các chi tiết phụ thuộc 4 GAPs chưa resolved (`GAP-IDEMP-001` đến `GAP-IDEMP-004`).
- **3. RESERVED / TBD (Bảo lưu quyết định):** Lựa chọn công nghệ hạ tầng (Redis/DB/Lock), thời gian retention TTL kỹ thuật chính thức, tên Replay Header chính thức, và Endpoint URI cho API Refund.

---

## 8. IMPLEMENTATION-READY CHECKLIST (CHECKLIST KIỂM TRA ĐỦ ĐIỀU KIỆN LẬP TRÌNH)

- [x] Header Requirement (`Idempotency-Key` ASCII 16..64 chars).
- [x] Category A Enforcement (`POST /bookings`, `POST /payments`, `POST /owner-applications`).
- [x] Missing Header Behavior (HTTP 400 `MISSING_IDEMPOTENCY_KEY`).
- [x] Key Scope Definition (`Tuple(Authenticated User ID, Endpoint, Key)`).
- [x] In-Progress Handling (HTTP 409 `IDEMPOTENCY_REQUEST_IN_PROGRESS`).
- [x] Payload Mismatch Handling (HTTP 400 `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`).
- [x] Response Replay Mechanics (Option A Strict Replay, zero rerun Use Case).
- [x] Retry Semantics (Client MUST reuse key; clean retry on 500).
- [x] Authorization Boundary (RBAC checked before key lookup).
- [x] Security Requirements (Cross-user/tenant isolation, no PII logging).
- [x] Observability Requirements (Mask max 8 chars, correlation via `requestId`).
- [x] Cross-API Consistency (0 Cross-API Divergence confirmed in `.06.07`).

---

## 9. IMPLEMENTATION-BLOCKING DEPENDENCIES (MA TRẬN QUẢN LÝ KHOẢNG TRỐNG KĨ THUẬT)

| GAP ID | Description | Impact | Blocking Assessment | Owner / Resolution Authority | Target Resolution Task |
|---|---|---|---|---|---|
| **`GAP-IDEMP-001`** | Error Registry Reconciliation | LOW | OPEN / TBD — OWNER ASSESSMENT REQUIRED | Task 12 Error Registry Owner | Task 12 Update |
| **`GAP-IDEMP-002`** | Key Retention Policy / TTL | LOW | OPEN / TBD — OWNER ASSESSMENT REQUIRED | Infrastructure Owner | Task 01.08.01 Infra Arch |
| **`GAP-IDEMP-003`** | Official Replay Header Name | LOW | OPEN / TBD — OWNER ASSESSMENT REQUIRED | API Owner | Task 01.06.04.06.05 / API Decision |
| **`GAP-IDEMP-004`** | Refund API Endpoint URI | LOW | OPEN / TBD — OWNER ASSESSMENT REQUIRED | Payment Architecture Owner | Task 01.06.04.07 Payment API Arch |

---

## 10. ERROR REGISTRY DEPENDENCY (`GAP-IDEMP-001 — ERROR REGISTRY RECONCILIATION`)

- **Status:** **`OPEN / TBD`**.
- **Contract vs Registry Distinction:**
  - Các mã lỗi giao thức Idempotency (`MISSING_IDEMPOTENCY_KEY`, `INVALID_IDEMPOTENCY_KEY_FORMAT`, `IDEMPOTENCY_KEY_TOO_LONG`, `IDEMPOTENCY_REQUEST_IN_PROGRESS`, `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`) được bảo tồn hoàn toàn từ Hợp đồng API đã APPROVED.
  - Việc đăng ký chính thức vào Error Code Registry cấp hệ thống thuộc Task 12 tiếp tục giữ trạng thái **`OPEN`** dưới mã `GAP-IDEMP-001`.
- **Implementation Rule:** Đội ngũ Triển khai **KHÔNG ĐƯỢC PHÉP GIẢ ĐỊNH** rằng việc đăng ký Error Registry của Task 12 đã hoàn tất.

---

## 11. RETENTION DEPENDENCY (`GAP-IDEMP-002 — RETENTION / TTL`)

- **Status:** **`OPEN / TBD`**.
- **Authority:** Pending Infrastructure Architecture / appropriate Architecture Owner decision.
- **Rule:**
  - No production retention / TTL value is approved by TASK 01.06.04.06.08.
  - Implementation team MUST NOT infer or apply a production TTL value from recommendations, examples, historical text, or non-authoritative material.
  - Resolution requires explicit approval from the appropriate Architecture Authority.

---

## 12. REPLAY HEADER DEPENDENCY (`GAP-IDEMP-003 — REPLAY HEADER`)

- **Status:** **`OPEN / TBD`**.
- **Rule:**
  - Replay Header name and semantics are NOT approved by TASK 01.06.04.06.08.
  - TASK 01.06.04.06.08 does NOT authorize implementation of any specific Replay Header.
  - Implementation team MUST NOT implement, standardize, or infer a specific Replay Header from this document.
  - Any previously discussed Replay Header example is NON-AUTHORITATIVE and MUST NOT be implemented until explicitly approved by the appropriate Architecture / API Authority.

---

## 13. REFUND API DEPENDENCY (`GAP-IDEMP-004 — REFUND API SPECIFICATION`)

- **Status:** **`OPEN / TBD`**.
- **Rule:** Luồng Hoàn tiền (Refund) chưa có Endpoint URI chính thức. Đội ngũ Lập trình KHÔNG tự ý tạo endpoint hay tự gán Idempotency cho luồng Refund cho tới khi Task `01.06.04.07 Payment API Architecture` ban hành đặc tả URI chính thức.

---

## 14. CROSS-API READINESS (XÁC MINH SẴN SÀNG CHÉO TOÀN HỆ THỐNG)

- Kết quả từ Task `.06.07` xác nhận 100% các API Mutations hiện tại đều tuân thủ nhất quán quy tắc Idempotency. **Zero Cross-API Divergence Found**.

---

## 15. SECURITY READINESS (XÁC MINH SẴN SÀNG PHÂN HỆ BẢO MẬT)

- Đã xác minh tính sẵn sàng của cơ chế Phân quyền cô lập (User A != User B), RBAC check trước lookup, và quy tắc che log Idempotency Key theo đặc tả Task `.06.06`.

---

## 16. OPERATIONAL READINESS (XÁC MINH SẴN SÀNG PHÂN HỆ VẬN HÀNH)

- Đã xác minh tính sẵn sàng của Vòng đời Yêu cầu Idempotent 7 bước, kịch bản lỗi `400/409/500` và quy tắc retry của Client theo đặc tả Task `.06.05`.

---

## 17. API IMPLEMENTATION CONTRACT MATRIX (MA TRẬN HƯỚNG DẪN DÀNH CHO BACKEND)

| API Component / Requirement | Client Impact | Backend Implementation Ready? | Source Evidence Basis |
|---|---|---|---|
| `POST /api/v1/bookings` | Send `Idempotency-Key` | **READY (Core Contract)** | BR-BOOK-003, Task 06.02 |
| `POST /api/v1/payments` | Send `Idempotency-Key` | **READY (Core Contract)** | BR-PAY-001, Task 06.02 |
| `POST /api/v1/owner-applications` | Send `Idempotency-Key` | **READY (Core Contract)** | UC-OWNER-001, Task 06.02 |
| Missing Key Error (Category A) | Receive HTTP 400 | **READY (Core Contract)** | Task 06.02 L190 |
| Payload Mismatch Error | Receive HTTP 400 | **READY (Core Contract)** | Task 06.02 L210 |
| In-Progress Conflict Error | Receive HTTP 409 | **READY (Core Contract)** | Task 06.02 L200 |
| Response Replay Envelope | Receive Exact Envelope | **READY (Core Contract)** | Task 06.02 L140, Task 11 |

---

## 18. DATA / STORAGE BOUNDARY (RANH GIỚI LƯU TRỮ LOGICAL — TECHNOLOGY-AGNOSTIC)

- **Logical Storage Requirements:** Hệ thống Backend cần một cơ chế lưu tạm Idempotency Record có khả năng:
  1. Tra cứu theo Key Scope 3-Tuple: `(Authenticated User ID, Resource Endpoint, Idempotency-Key)`.
  2. Ghi nhận trạng thái `IN_PROGRESS` và `COMPLETED`.
  3. Lưu vết Response Envelope (Status Code & Body) để phát lại.
- ❌ **RANH GIỚI CẤM:** Kiến trúc API KHÔNG chọn Redis, SQL Table, NoSQL Collection, hay In-Memory Cache. Việc lựa chọn công nghệ cụ thể thuộc về **Backend & Infrastructure Implementation Architecture**.

---

## 19. CONCURRENCY BOUNDARY (RANH GIỚI ĐỒNG THỜI LOGICAL — TECHNOLOGY-AGNOSTIC)

- **Logical Concurrency Requirements:** Hệ thống phải đảm bảo tính nguyên tố (Atomic Execution) khi nhận diện 2 Yêu cầu trùng Key gửi đến cùng một mili-giây: Yêu cầu đầu tiên đi vào thực thi, Yêu cầu thứ hai nhận `HTTP 409 Conflict`.
- ❌ **RANH GIỚI CẤM:** Kiến trúc API KHÔNG chọn Distributed Lock, Redis Redlock, Database Row Lock, Mutex, hay Queue Topology.

---

## 20. OBSERVABILITY HANDOFF (BÀN GIAO KIẾN TRÚC GIÁM SÁT)

- Đội ngũ Triển khai Backend BẮT BUỘC gắn chuỗi **`requestId`** chuẩn của Task 12 vào mọi log sự kiện Idempotency và thực hiện Masking chỉ log 8 ký tự đầu của `Idempotency-Key`.

---

## 21. SECURITY HANDOFF (BÀN GIAO KIẾN TRÚC BẢO MẬT)

- Đội ngũ Triển khai Backend BẮT BUỘC trích xuất User ID và Owner Context trực tiếp từ Server Auth Token, tuyệt đối không tin tưởng client custom headers.

---

## 22. TESTABILITY REQUIREMENTS (MA TRẬN KỊCH BẢN KIỂM THỬ ARCHITECTURE T01..T15)

| Mã Scenario | Kịch Bản Kiểm Thử (Test Scenario) | Expected Result (Kết Quả Kỳ Vọng) | Source Evidence | Readiness Status |
|---|---|---|---|---|
| **T01** | Category A Request mới hợp lệ | Thực thi Use Case, lưu record, trả 201/200 | Task 06.02 L100 | **READY TO TEST** |
| **T02** | Duplicate Request hoàn tất (Cùng Key & Body) | Strict Response Replay exact envelope (201/200) | Task 06.02 L140 | **READY TO TEST** |
| **T03** | Concurrent Duplicate Request (Cùng mili-giây) | Canonical request chạy; Request thứ 2 nhận HTTP 409 | Task 06.02 L110 | **READY TO TEST** |
| **T04** | Missing `Idempotency-Key` (Category A) | HTTP 400 Bad Request (`MISSING_IDEMPOTENCY_KEY`) | Task 06.02 L190 | **READY TO TEST** |
| **T05** | Invalid `Idempotency-Key` Format (<16 chars/space) | HTTP 400 Bad Request (`INVALID_FORMAT`) | Task 06.02 L190 | **READY TO TEST** |
| **T06** | `Idempotency-Key` Too Long (>64 chars) | HTTP 400 Bad Request (`KEY_TOO_LONG`) | Task 06.02 L190 | **READY TO TEST** |
| **T07** | Payload Mismatch (Cùng Key, khác Body) | HTTP 400 Bad Request (`PAYLOAD_MISMATCH`) | Task 06.02 L210 | **READY TO TEST** |
| **T08** | Client Request Timeout (Network lag) | Response Replay nếu xong, hoặc 409 nếu đang chạy | Task 06.05 L160 | **READY TO TEST** |
| **T09** | Connection Reset (Lost response) | Response Replay exact envelope (201/200) | Task 06.02 L140 | **READY TO TEST** |
| **T10** | Infrastructure Server Failure (HTTP 500) | Record không lưu; Client Clean Retry cùng Key | Task 06.05 L150 | **READY TO TEST** |
| **T11** | Client Retry cùng Key sau 500 error | Thực thi Use Case mới bình thường | Task 06.05 L150 | **READY TO TEST** |
| **T12** | Authorization Mismatch (Revoked token) | HTTP 401/403 (No Idempotency lookup) | Task 06.06 L110 | **READY TO TEST** |
| **T13** | Cross-User Key Reuse (User B gửi Key của User A) | Coi là NEW request cho User B; Không leak data A | Task 06.06 L070 | **READY TO TEST** |
| **T14** | Cross-Tenant Key Reuse (Owner B dùng Key Owner A) | Coi là NEW request cho Owner B | Task 06.06 L090 | **READY TO TEST** |
| **T15** | MoMo IPN Callback Duplicate Retry | Deduplicate qua `momoTransId` (`BR-PAY-001`) | BR-PAY-001 | **READY TO TEST** |

---

## 23. NON-GOALS (CÁC NỘI DUNG NẰM NGOÀI PHẠM VI TASK NÀY)

- ❌ KHÔNG viết mã nguồn triển khai (Zero TypeScript, Java, Controller, Interceptor code).
- ❌ KHÔNG chọn công nghệ hạ tầng (Cấm chọn Redis, DB Tables, Locks, Queues, Outbox).
- ❌ KHÔNG tự tạo Endpoint URI cho luồng Hoàn tiền (Refund API).
- ❌ KHÔNG tự ý đóng 4 GAPs chưa được Resolution Authority đóng.
- ❌ KHÔNG làm lệch bất kỳ Hợp đồng API nào đã APPROVED.
- ❌ KHÔNG tự đổi tên hay xóa Task `01.06.04.09` trong Task Map.
- ❌ KHÔNG tự động chuyển trạng thái thành APPROVED.

---

## 24. ARCHITECTURE DECISION TRACEABILITY (BẢNG TRUY XUẤT NGUỒN GỐC QUYẾT ĐỊNH)

| Final Requirement | Source Specification Task | Approval Evidence | Inherited Dependency | Normative Status |
|---|---|---|---|---|
| Header `Idempotency-Key` (Category A MUST) | Task 01.06.04.06.02 | Approved 2026-08-08 | None | `NORMATIVE` |
| Key Scope Tuple `(Identity, Endpoint, Key)` | Task 01.06.04.06.02 | Approved 2026-08-08 | None | `NORMATIVE` |
| In-Progress HTTP 409 Conflict | Task 01.06.04.06.02 | Approved 2026-08-08 | None | `NORMATIVE` |
| Payload Mismatch HTTP 400 Bad Request | Task 01.06.04.06.02 | Approved 2026-08-08 | None | `NORMATIVE` |
| Option A Strict Response Replay | Task 01.06.04.06.01, .02 | Approved 2026-08-08 | `GAP-IDEMP-003` | `NORMATIVE` |
| Key Retention Policy / TTL | Pending Infra Decision | Not approved | `GAP-IDEMP-002` | **`NON-NORMATIVE (TBD)`** |
| Replay Header Specification | Pending API Owner Decision | Not approved | `GAP-IDEMP-003` | **`NON-NORMATIVE (TBD)`** |
| Security Boundary & Log Masking Rule | Task 01.06.04.06.06 | Approved 2026-08-08 | None | `NORMATIVE` |
| Cross-API Adoption Consistency | Task 01.06.04.06.07 | Approved 2026-08-08 | `GAP-IDEMP-001` & `004` | `NORMATIVE` |

---

## 25. FINAL CONTRACT DRIFT AUDIT (KIỂM TRA CHỐNG LỆCH CHUẨN TOÀN TẬP .01 TO .07)

- Rà soát toàn bộ chuỗi từ `.06.01` đến `.06.07`:
- [x] Zero header drift.
- [x] Zero key scope drift.
- [x] Zero HTTP status code drift.
- [x] Zero error code drift.
- [x] Zero replay drift.
- [x] Zero retry drift.
- [x] Zero authorization ordering drift.
- [x] Zero cross-API divergence.
- **Kết Luận Contract Drift:** **100% INTACT (ZERO CONTRACT DRIFT FOUND)**.

---

## 26. READINESS CLASSIFICATION (PHÂN LOẠI TRẠNG THÁI SẴN SÀNG CUỐI CÙNG)

Dựa trên bằng chứng thẩm định toàn diện:
- Tất cả các Hợp đồng API Idempotency cốt lõi (`.01` đến `.07`) đã được phê duyệt chính thức (`CORE CONTRACT READY`).
- Hệ thống vẫn tồn tại 4 GAPs chưa resolved (`DEPENDENCY-CONSTRAINED`).
- **Phân Loại Trạng Thái Cuối Cùng:** **`READY FOR IMPLEMENTATION — WITH EXPLICIT OPEN DEPENDENCIES`**.

---

## 27. FINAL READINESS MATRIX (MA TRẬN TRẠNG THÁI SẴN SÀNG TOÀN DIỆN)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             FINAL READINESS MATRIX                                                     │
├───────────────────────────────┼───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ Domain Area                   │ Final Readiness Status        │ Evidence Basis                │ Open Dependency Status │
├───────────────────────────────┼───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ Architecture Framework (.01)  │ READY FOR IMPLEMENTATION      │ .06.01 APPROVED               │ NONE                   │
│ Executable API Contract (.02) │ READY FOR IMPLEMENTATION      │ .06.02 APPROVED               │ NONE                   │
│ Contract Validation (.03)     │ READY FOR IMPLEMENTATION      │ .06.03 APPROVED               │ NONE                   │
│ Gap Resolution (.04)          │ DEPENDENCY-CONSTRAINED        │ .06.04 APPROVED               │ OPEN (GAP 001..004)    │
│ Operational Semantics (.05)   │ READY FOR IMPLEMENTATION      │ .06.05 APPROVED               │ OPEN (GAP-002 TTL TBD) │
│ Security & Observability (.06)│ READY FOR IMPLEMENTATION      │ .06.06 APPROVED               │ NONE                   │
│ Cross-API Adoption (.07)      │ READY FOR IMPLEMENTATION      │ .06.07 APPROVED               │ OPEN (GAP-001 & 004)   │
│ Testability Requirements      │ READY FOR IMPLEMENTATION      │ Test Matrix T01..T15          │ NONE                   │
│ Technology Boundary           │ RESERVED FOR IMPLEMENTATION   │ Technology-Agnostic Policy    │ NONE (By Design)       │
└───────────────────────────────┴───────────────────────────────┴───────────────────────────────┴────────────────────────┘
```

---

## 28. OPEN DEPENDENCY REGISTER (DANH MỤC CÁC DEPENDENCIES KẾ THỪA NGUYÊN TRẠNG)

Bảo toàn nguyên trạng 100% danh mục 4 GAPs từ Task `.06.04`:
- **`GAP-IDEMP-001`**: Sync 5 error codes into Task 12 Error Registry (`OPEN — EXTERNAL TASK DEPENDENCY`).
- **`GAP-IDEMP-002`**: TTL Key Retention Policy decision (`OPEN — INFRASTRUCTURE DEPENDENCY`).
- **`GAP-IDEMP-003`**: Official Replay Header Name decision (`OPEN — CONTRACT DECISION REQUIRED`).
- **`GAP-IDEMP-004`**: Refund API Endpoint URI specification (`OPEN — SOURCE OF TRUTH DEPENDENCY`).

---

## 29. ARCHITECTURE HANDOFF (BẢN BÀN GIAO KIẾN TRÚC CHO ĐỘI NGŨ TRIỂN KHAI)

```text
================================================================================────────
                                ARCHITECTURE HANDOFF DIRECTIVES
================================================================================────────

1. IMPLEMENTATION MAY USE (Được phép sử dụng các quyết định đã APPROVED):
   ✔ Hợp đồng Header Idempotency-Key cho Category A APIs (POST /bookings, POST /payments, POST /owner-applications).
   ✔ Quy tắc tra cứu Idempotency Record theo Key Scope 3-Tuple (User ID, Endpoint, Key).
   ✔ Xử lý phản hồi ngắt tuyến cho Missing Header (400), Payload Mismatch (400), và In-Progress Conflict (409).
   ✔ Cơ chế Strict Response Replay (Option A) trả lại chính xác Envelope gốc cho Duplicate Completed Request.
   ✔ Quy tắc che log Masking Idempotency Key (tối đa 8 ký tự đầu) đính kèm requestId.

2. IMPLEMENTATION MUST NOT DECIDE (Cấm tự quyết định các nội dung chưa duyệt):
   ❌ CẤM tự ý áp dụng hoặc suy luận con số Retention / TTL cho production từ các khuyến nghị, ví dụ hoặc tài liệu lịch sử trước đó.
   ❌ CẤM tự ý viết code triển khai một tên Replay Header cụ thể dựa trên tài liệu này khi chưa có phê duyệt chính thức.
   ❌ CẤM tự ý coi việc đăng ký Error Registry của Task 12 là đã hoàn tất.
   ❌ CẤM tự ý ban hành hợp đồng API Refund hoặc gán Idempotency cho luồng Refund khi chưa có URI đặc tả.
   ❌ CẤM khóa cứng lựa chọn công nghệ hạ tầng (Redis/Lock/DB) vào trong Hợp đồng API.

3. IMPLEMENTATION MUST WAIT FOR (Bắt buộc chờ các phụ thuộc kỹ thuật):
   ⌛ MUST WAIT FOR GAP-IDEMP-001: Task 12 Error Registry đồng bộ chính thức 5 mã lỗi giao thức.
   ⌛ MUST WAIT FOR GAP-IDEMP-002: Task 01.08.01 Infrastructure Architecture ban hành con số Retention/TTL chính thức.
   ⌛ MUST WAIT FOR GAP-IDEMP-003: API Owner ban hành phê duyệt chính thức tên Replay Header (nếu có).
   ⌛ MUST WAIT FOR GAP-IDEMP-004: Task 01.06.04.07 Payment API Architecture ban hành URI đặc tả chính thức cho API Refund.
================================================================================────────
```

---

## 30. FINAL RESULT (KẾT LUẬN CUỐI CÙNG TỔNG HỢP)

```text
================================================================================────────
                         FINAL ARCHITECTURE HANDOFF SUMMARY
================================================================================────────

Final Result:          FINAL READINESS COMPLETE — OPEN DEPENDENCIES — PENDING APPROVAL

Prerequisite Status:   01.06.04.06.01 TO 01.06.04.06.07 = 100% APPROVED

Contract Drift Audit:  0 Contract Drift Found (100% Compatible)

Inherited Dependencies: 4 Open Dependencies Tracked (GAP-IDEMP-001 to GAP-IDEMP-004)

================================================================================────────
IDEMPOTENCY API ARCHITECTURE SPECIFICATION PACKAGE IS COMPLETE AND READY FOR REVIEW.
================================================================================────────
```

---

## 31. NON-GOALS (CÁC NỘI DUNG KHÔNG THỰC HIỆN TRONG TASK NÀY)

- ❌ KHÔNG viết mã nguồn TypeScript, Java, NestJS Interceptor, Controller hay Service code.
- ❌ KHÔNG chọn công nghệ triển khai (Cấm chọn Redis, DB tables, Lock libraries, Queues).
- ❌ KHÔNG tự tạo API hay Endpoint URI mới cho luồng Refund.
- ❌ KHÔNG sửa đổi bất kỳ Hợp đồng API nào đã APPROVED (`.01` đến `.07`).
- ❌ KHÔNG tự ý đóng 4 GAPs kế thừa từ Task `.06.04`.
- ❌ KHÔNG tự đổi tên hay xóa Task `01.06.04.09` trong Task Map.
- ❌ KHÔNG tự động chuyển trạng thái thành APPROVED.

---

## 32. APPROVAL SECTION (PHẦN PHÊ DUYỆT BẮT BUỘC)

```text
================================================================================────────
                               APPROVAL DECISION SECTION
================================================================================────────

Current Status:        FINAL READINESS COMPLETE — OPEN DEPENDENCIES — PENDING APPROVAL

Proposed Specification: Task 01.06.04.06.08 — Idempotency Final Readiness & Architecture Handoff

Approval Decision:     TBD (Awaiting Architecture Owner / API Owner Review & Approval)

Approved By:           TBD

Approved At:           TBD

================================================================================────────
TASK 01.06.04.06.08 IS READY AND AWAITING OFFICIAL APPROVAL.
================================================================================────────
```

---
*Tài liệu Tổng hợp Sẵn sàng Kiến trúc, Ranh giới Triển khai và Bàn giao Kiến trúc Idempotency được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
