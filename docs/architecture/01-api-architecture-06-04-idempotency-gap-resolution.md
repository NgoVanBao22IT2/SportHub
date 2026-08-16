# API ARCHITECTURE — TASK 01.06.04.06.04
## IDEMPOTENCY GAP RESOLUTION & DEPENDENCY CLOSURE

**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.06.04.06.04 (Gap Resolution & Dependency Closure Phase)  
**Trạng thái:** APPROVED  
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
**Ngày cập nhật:** 2026-08-08  

---

## 1. PURPOSE (MỤC TIÊU TÀI LIỆU)

Tài liệu này thực hiện **Quản lý Khoảng trống và Phụ thuộc Kỹ thuật (Gap Resolution & Dependency Closure Specification)** cho phân hệ Idempotency API Contract (`Sub-task 01.06.04.06.04`):

1. Quản lý, phân loại và lập sơ đồ phụ thuộc cho 100% các khoảng trống kỹ thuật (GAPs) được xác nhận từ tài liệu thẩm định `01.06.04.06.03` (`GAP-IDEMP-001` đến `GAP-IDEMP-004`).
2. Xác định rõ cơ quan quyền hạn (Resolution Authority) và điều kiện đóng cho từng GAP mà KHÔNG tự ý suy đoán giải quyết bằng kinh nghiệm cá nhân khi thiếu bằng chứng từ Nguồn Sự Thật.
3. Đảm bảo tính toàn vẹn 100% của các Hợp đồng API đã phê duyệt (`01.06.04.01` đến `06.03`). Mọi yêu cầu thay đổi (nếu có) phải đi qua quy trình Change Request.
4. **Cảnh báo Quyền hạn:** Task `.06.04` KHÔNG tạo hợp đồng idempotency mới, KHÔNG tự ý đóng GAP bằng best practice, KHÔNG chọn công nghệ hạ tầng (Redis/DB/Locks) và KHÔNG thay đổi Task Map `.09`.

---

## 2. PREREQUISITES (XÁC MINH ĐIỀU KIỆN TIÊN ĐỀ)

Đã xác minh trạng thái phê duyệt chính thức của các tài liệu tiền đề trong hệ thống:
- **`01.06.04.06.01 — Idempotency & Safe Retry Architecture Decision`**: `APPROVED` (bởi Architecture Owner ngày 2026-08-08).
- **`01.06.04.06.02 — Idempotency API Contract`**: `APPROVED` (bởi Architecture Owner / API Owner ngày 2026-08-08).
- **`01.06.04.06.03 — Idempotency Contract Validation & Adoption Matrix`**: `APPROVED` (bởi Architecture Owner / API Owner ngày 2026-08-08).
- **Kết Luận Prerequisite:** Đạt 100% điều kiện tiên đề để tiến hành Task `01.06.04.06.04`.

---

## 3. SOURCE OF TRUTH (NGUỒN SỰ THẬT RÀ SOÁT)

Đã rà soát 100% bằng chứng từ:
- `docs/requirements/`: `01-actors-and-permissions.md`, `02-use-cases-and-user-flows.md`, `03-functional-requirements.md`, `04-business-rules.md`, `05-data-model.md`.
- `docs/architecture/`: `06` đến `18` (đặc biệt `12-api-error-contract.md`, `17-api-contract`, `18-api-validation`).
- Sub-task `01.06.04.09` giữ trạng thái `REFERENCED ONLY` do Official Task Name vẫn là `UNKNOWN`.

---

## 4. AUTHORITY MODEL (QUY TẮC QUYỀN HẠN QUYẾT ĐỊNH)

- Mọi quyết định đóng GAP phải dựa trên bằng chứng chính thức từ Nguồn Sự Thật hoặc Quyết định của Chủ sở hữu được ủy quyền (Authorized Owner Decision).
- Task `.06.04` tuyệt đối **KHÔNG ĐƯỢC PHÉP TỰ Ý SỬA NGƯỢC** các Hợp đồng đã `APPROVED` (`.06.01`, `.06.02`, `.06.03`). Mọi nhu cầu thay đổi phải lập thủ tục Change Request ở Section 12.

---

## 5. ORIGINAL GAP INVENTORY (DANH MỤC GAPS NGUYÊN BẢN TỪ TASK .06.03)

Bảo toàn nguyên văn 100% danh mục GAP được xác nhận tại Task `01.06.04.06.03`:

| GAP ID | Original Description (Mô Tả Nguyên Bản) | Affected API | Evidence | Impact | Owner |
|---|---|---|---|---|---|
| **`GAP-IDEMP-001`** | Các mã lỗi Idempotency chưa được đồng bộ chính thức vào Error Registry của Task 12 | All Category A APIs | `12-api-error-contract.md` | LOW (Chưa sync mã lỗi) | API Owner |
| **`GAP-IDEMP-002`** | Key Retention Period chưa chốt TTL hạ tầng cụ thể (`TBD-IDEMP-002`) | All Idempotent APIs | `17-api-contract` L320 | LOW (Cần cấu hình TTL) | Infra Team |
| **`GAP-IDEMP-003`** | Tên Response Replay Header chính thức chưa chốt (`TBD-IDEMP-003`) | Replay Responses | `17-api-contract` L230 | LOW (Header minh họa) | API Owner |
| **`GAP-IDEMP-004`** | Thao tác Hoàn tiền (Refund) chưa có Endpoint URI chính thức | Refund Operation | `02-use-cases-and-user-flows` | LOW (Endpoint TBD) | API Team |

---

## 6. GAP-IDEMP-001: ERROR REGISTRY RECONCILIATION

- **Bản Chất Khoảng Trống:**
  - Hợp đồng `.06.02` đã quy định 5 mã lỗi giao thức Idempotency cấp Hợp đồng:
    1. `MISSING_IDEMPOTENCY_KEY` (HTTP 400)
    2. `INVALID_IDEMPOTENCY_KEY_FORMAT` (HTTP 400)
    3. `IDEMPOTENCY_KEY_TOO_LONG` (HTTP 400)
    4. `IDEMPOTENCY_REQUEST_IN_PROGRESS` (HTTP 409)
    5. `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` (HTTP 400)
  - Đối chiếu tài liệu `12-api-error-contract.md`: Danh mục Error Registry cấp hệ thống chưa đưa 5 mã lỗi trên vào bảng danh mục chính thức.
- **Phân Loại Trạng Thái:** **`OPEN — EXTERNAL TASK DEPENDENCY`**.
- **Cơ Quan Quyết Định (Resolution Authority):** Task 12 Error Registry Owner / API Owner.
- **Điều Kiện Đóng (Closure Requirement):** Đóng khi phiên bản cập nhật của Task 12 (Error Registry Update) đăng ký chính thức 5 mã lỗi trên vào Bảng Error Code Registry của hệ thống.

---

## 7. GAP-IDEMP-002: RETENTION POLICY

- **Bản Chất Khoảng Trống:**
  - Thời gian lưu trữ vết Key (`Key Retention Period`) chưa được ấn định con số TTL kỹ thuật cụ thể ở Nguồn Sự Thật.
  - Hợp đồng `.06.02` giữ nguyên mã `TBD-IDEMP-002` và ghi nhận khoảng thời gian 24 giờ là một **Khuyến nghị kỹ thuật (Recommendation)**, không phải Điều kiện bắt buộc đã duyệt (Not an approved requirement).
- **Phân Loại Trạng Thái:** **`OPEN — INFRASTRUCTURE DEPENDENCY`**.
- **Cơ Quan Quyết Định (Resolution Authority):** Infrastructure Architecture Owner / Infra Team.
- **Điều Kiện Đóng (Closure Requirement):** Đóng khi Task `01.08.01 Infrastructure Architecture` chốt hạ tầng lưu trữ (Memory/Cache TTL) và ban hành thông số Retention chính thức.

---

## 8. GAP-IDEMP-003: RESPONSE REPLAY HEADER

- **Bản Chất Khoảng Trống:**
  - Hợp đồng `.06.02` sử dụng Header minh họa `Idempotency-Replay: true` trong các ví dụ API nhưng bảo lưu mã `TBD-IDEMP-003` cho tên Response Replay Header chính thức.
  - Không tự ý chốt cứng các tên thay thế khác (như `Idempotent-Replay`, `X-Idempotency-Replay` hay `Idempotency-Result`) khi chưa có quyết định phê duyệt.
- **Phân Loại Trạng Thái:** **`OPEN — CONTRACT DECISION REQUIRED`**.
- **Cơ Quan Quyết Định (Resolution Authority):** API Contract Owner / API Owner.
- **Điều Kiện Đóng (Closure Requirement):** Đóng khi API Owner phát lệnh chốt tên Replay Header chính thức tại Sub-task `.06.05` hoặc phiên bản sửa đổi Hợp đồng API.

---

## 9. GAP-IDEMP-004: REFUND API SPECIFICATION

- **Bản Chất Khoảng Trống:**
  - Thao tác nghiệp vụ Hoàn tiền (Refund) được đề cập ở cấp độ Use Case (`UC-PAY`) trong `02-use-cases-and-user-flows.md`, nhưng chưa có đặc tả Endpoint URI HTTP chính thức trong Hợp đồng API hiện tại.
  - Thao tác này tạm thời giữ trạng thái `BUSINESS OPERATION — API ENDPOINT TBD`. Tuyệt đối không tự ý bịa đặt endpoint kiểu `POST /api/v1/payments/refunds`.
- **Phân Loại Trạng Thái:** **`OPEN — SOURCE OF TRUTH DEPENDENCY`**.
- **Cơ Quan Quyết Định (Resolution Authority):** Payment & API Architecture Owner.
- **Điều Kiện Đóng (Closure Requirement):** Đóng khi Task `01.06.04.07 Payment API Architecture` được thực hiện và ban hành URI đặc tả chính thức cho luồng Hoàn tiền.

---

## 10. GAP CLASSIFICATION SUMMARY (TỔNG HỢP PHÂN LOẠI TRẠNG THÁI GAPS)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              GAP CLASSIFICATION MATRIX                                 │
├───────────────┬──────────────────────────────────┬─────────────────────────────────────┤
│ GAP ID        │ Tên Khoảng Trống (Gap Title)     │ Phân Loại Trạng Thái (Classification│
├───────────────┼──────────────────────────────────┼─────────────────────────────────────┤
│ GAP-IDEMP-001 │ Error Registry Reconciliation    │ OPEN — EXTERNAL TASK DEPENDENCY     │
│ GAP-IDEMP-002 │ Retention Policy Specification   │ OPEN — INFRASTRUCTURE DEPENDENCY    │
│ GAP-IDEMP-003 │ Response Replay Header Name      │ OPEN — CONTRACT DECISION REQUIRED   │
│ GAP-IDEMP-004 │ Refund API Endpoint URI Spec     │ OPEN — SOURCE OF TRUTH DEPENDENCY   │
└───────────────┴──────────────────────────────────┴─────────────────────────────────────┘
```

---

## 11. RESOLUTION AUTHORITY MATRIX (BẢNG PHÂN CÔNG QUYỀN HẠN GIẢI QUYẾT)

| GAP ID | Authority / Owner | Target Task / Mechanism | Action Required |
|---|---|---|---|
| **GAP-IDEMP-001** | Task 12 Error Registry Owner / API Owner | Task 12 Error Registry Update | Đăng ký 5 mã lỗi Idempotency vào Error Code Registry |
| **GAP-IDEMP-002** | Infrastructure Architecture Owner / Infra Team | Task 01.08.01 Infrastructure Arch | Quy định thông số TTL/Retention chính thức |
| **GAP-IDEMP-003** | API Contract Owner / API Owner | Task 01.06.04.06.05 / API Decision | Phê duyệt tên Replay Metadata Header chính thức |
| **GAP-IDEMP-004** | Payment & API Architecture Owner | Task 01.06.04.07 Payment API Arch | Ban hành URI đặc tả chính thức cho API Refund |

---

## 12. CHANGE REQUESTS (YÊU CẦU THAY ĐỔI HỢP ĐỒNG NẾU CÓ)

- **Kiểm Tra Nhu Cầu Thay Đổi Hợp Đồng:**
  - Không có GAP nào ở trên yêu cầu phải sửa đổi các quyết định đã chốt trong `.06.02` (như Header `Idempotency-Key`, 3-Tuple Key Scope, Category A MUST send, Payload Mismatch 400, In-Progress 409).
- **Trạng Thái Change Requests:** **NONE (Zero Change Requests Required)**. Các Hợp đồng `01.06.04.06.01` và `01.06.04.06.02` được bảo tồn nguyên trạng 100%.

---

## 13. DEPENDENCY MAP (SƠ ĐỒ PHỤ THUỘC KỸ THUẬT)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      IDEMPOTENCY DEPENDENCY MAP                        │
├─────────────────┬──────────────────────────────────────────────────────┤
│ GAP ID          │ Technical Dependency Chain                           │
├─────────────────┼──────────────────────────────────────────────────────┤
│ GAP-IDEMP-001   │ ──> Task 12 Error Registry Update                    │
│ GAP-IDEMP-002   │ ──> Task 01.08.01 Infrastructure Architecture        │
│ GAP-IDEMP-003   │ ──> Task 01.06.04.06.05 / API Owner Approval         │
│ GAP-IDEMP-004   │ ──> Task 01.06.04.07 Payment API Architecture        │
└─────────────────┴──────────────────────────────────────────────────────┘
```

---

## 14. CLOSURE MATRIX (BẢNG THEO DÕI VÀ TIẾN ĐỘ ĐÓNG GAPS)

| GAP ID | Evidence | Authority | Proposed Resolution | Status | Next Action |
|---|---|---|---|---|---|
| **GAP-IDEMP-001** | `12-api-error-contract.md` | Task 12 Owner | Sync 5 error codes into Task 12 | **OPEN** | Await Task 12 update |
| **GAP-IDEMP-002** | `17-api-contract` L320 | Infra Owner | Define TTL in Infra Arch Task | **OPEN** | Await Task 01.08.01 |
| **GAP-IDEMP-003** | `17-api-contract` L230 | API Owner | Confirm official replay header | **OPEN** | Await API Owner decision |
| **GAP-IDEMP-004** | `02-use-cases` UC-PAY | Payment Owner | Define Refund URI in Payment API | **OPEN** | Await Task 01.06.04.07 |

---

## 15. CONTRACT INTEGRITY RE-CHECK (VERIFY TÍNH TOÀN VẸN CỦA APPROVED CONTRACTS)

Thực hiện rà soát lại tính toàn vẹn của Hợp đồng `.06.02` sau khi phân loại GAP:
- [x] Header Name = `Idempotency-Key` (ASCII, max 64 chars, trimmed).
- [x] Category A Requirement = Client MUST send `Idempotency-Key`. Missing header -> `400 Bad Request` (`MISSING_IDEMPOTENCY_KEY`).
- [x] Key Scope = `Tuple(Authenticated Identity, Endpoint, Key)`.
- [x] Retry Semantics = Client MUST reuse same key for retries.
- [x] Strict Response Replay = Option A exact envelope replay.
- [x] Payload Mismatch = `400 Bad Request` (`IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`).
- [x] In-Progress Behavior = `409 Conflict` (`IDEMPOTENCY_REQUEST_IN_PROGRESS`).
- [x] Authorization Ordering = RBAC evaluation BEFORE key lookup.
- **Kết Luận Integrity:** Hợp đồng `.06.02` giữ nguyên tính toàn vẹn 100%.

---

## 16. FINAL VALIDATION RESULT (KẾT LUẬN CUỐI CÙNG TỔNG HỢP)

```text
================================================================================────────
                            FINAL RE-CHECK RESULT SUMMARY
================================================================================────────

Re-check Outcome:      PASS WITH OPEN DEPENDENCIES

Prerequisite Status:   01.06.04.06.01 = APPROVED
                       01.06.04.06.02 = APPROVED
                       01.06.04.06.03 = APPROVED

Contract Integrity:    100% Intact (0 Change Requests Required)

Open Dependencies:     4 Open Dependencies Tracked in Closure Matrix (GAP 001..004)

================================================================================────────
GAP CLASSIFICATION IS COMPLETE WITH ALL DEPENDENCIES MAPPED AND TRACKED.
================================================================================────────
```

---

## 17. NON-GOALS (CÁC NỘI DUNG KHÔNG THỰC HIỆN TRONG TASK NÀY)

- ❌ KHÔNG tạo API hay Hợp đồng Idempotency mới.
- ❌ KHÔNG sửa đổi các Hợp đồng đã APPROVED (`.01` đến `.06.03`).
- ❌ KHÔNG tạo Error Registry mới hay tự ý đổi mã lỗi.
- ❌ KHÔNG tự chọn con số Retention TTL cho hạ tầng.
- ❌ KHÔNG chọn công nghệ hạ tầng (Redis, Database schema, Distributed Lock, Queue, Outbox).
- ❌ KHÔNG tự bịa đặt Endpoint URI cho API Refund.
- ❌ KHÔNG tự đổi tên hay xóa Task `01.06.04.09` trong Task Map.
- ❌ KHÔNG tự động chuyển trạng thái thành APPROVED.

---

## 18. APPROVAL SECTION (PHẦN PHÊ DUYỆT BẮT BUỘC)

```text
================================================================================────────
                               APPROVAL DECISION SECTION
================================================================================────────

Status:                APPROVED

Approval Decision:     APPROVED

Approved By:           Architecture Owner / API Owner

Approved At:           2026-08-08

================================================================================────────
TASK 01.06.04.06.04 IS APPROVED BY ARCHITECTURE OWNER / API OWNER ON 2026-08-08.
================================================================================────────
```

---
*Tài liệu Quản lý Khoảng trống và Phụ thuộc Kỹ thuật Idempotency được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
