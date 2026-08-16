# API ARCHITECTURE TASK MAP (01.06.04)
**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** Task Map Reconstruction — 01.06.04 (API Architecture)  
**Trạng thái:** Micro-Corrected Task Map Audit  
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
**Ngày cập nhật:** 2026-08-08  

---

## 1. PURPOSE (MỤC TIÊU TÀI LIỆU)

Tài liệu này đóng vai trò là **Sơ đồ Bản đồ Công việc Kiến trúc API (API Architecture Task Map)** cho nhánh task `01.06.04 — API Architecture`.

Tài liệu này:
1. Phân định tuyệt đối rạch ròi giữa: **Official Task Name**, **Referenced Topic**, **Scope**, và **Boundary Reference**.
2. Phân định rõ ràng các task đã được xác nhận (`CONFIRMED`), các task chỉ được tham chiếu gián tiếp (`REFERENCED ONLY`), và các task chưa có thông tin (`UNDEFINED`).
3. Xác định ranh giới phụ thuộc (Dependencies), khoảng trống mã số (Numbering Gaps) và kiểm tra xung đột (Contradictions).
4. KHÔNG tự thiết kế API mới, KHÔNG tự bổ sung Business Rules, KHÔNG tự đặt official name khi chưa có căn cứ từ Nguồn Sự Thật.

---

## 2. SCOPE (PHẠM VI)

Phạm vi phân tích độc quyền tập trung vào nhánh kiến trúc:

```text
01.06.04 — API Architecture
├── 01.06.04.01 — API Architectural Principles (CONFIRMED)
├── 01.06.04.02 — API Versioning & Naming (CONFIRMED)
├── 01.06.04.03 — Request / Response Contract (CONFIRMED)
├── 01.06.04.04 — API Error Contract (CONFIRMED)
├── 01.06.04.05 — Pagination / Filtering / Sorting Contract (CONFIRMED)
├── 01.06.04.06 — UNKNOWN (UNDEFINED)
├── 01.06.04.07 — UNKNOWN (UNDEFINED)
├── 01.06.04.08 — UNKNOWN (UNDEFINED)
├── 01.06.04.09 — UNKNOWN (REFERENCED ONLY: Idempotency Header & Key Format)
└── 01.06.04.10 — UNKNOWN (REFERENCED ONLY: Upper Range Boundary)
```

---

## 3. SOURCE OF TRUTH (NGUỒN SỰ THẬT ĐÃ RÀ SOÁT)

Đã rà soát 100% các tệp tin trong hai thư mục tài liệu chính của dự án:
- `docs/requirements/`: `01-actors-and-permissions.md`, `02-use-cases-and-user-flows.md`, `03-functional-requirements.md`, `04-business-rules.md`, `05-data-model.md`.
- `docs/architecture/`: `06-system-architecture.md`, `07-frontend-architecture.md`, `08-backend-architecture.md`, `09-api-architectural-principles.md`, `10-api-versioning-and-naming.md`, `11-api-request-response-contract.md`, `12-api-error-contract.md`, `13-api-pagination-filtering-sorting-contract.md`.

---

## 4. STATUS MODEL (MÔ HÌNH TRẠNG THÁI TASK MAP)

Trạng thái của từng sub-task trong Task Map được đánh giá theo 5 mức độ tiêu chuẩn:

| Trạng Thái (Status) | Tiêu Chí Đánh Giá Bằng Chứng (Evidence Criteria) |
|---|---|
| **`CONFIRMED`** | Có bằng chứng trực tiếp: Official Task Name + File tài liệu đặc tả đã tạo + Căn cứ mã Task ID trong tài liệu. |
| **`PARTIALLY CONFIRMED`** | Có bằng chứng về task nhưng thiếu một phần tên chính thức hoặc phạm vi chưa đầy đủ. |
| **`REFERENCED ONLY`** | Mã Task ID được nhắc tới rõ ràng trong danh mục TBD/phụ thuộc của tài liệu đã duyệt, nhưng chưa có file đặc tả và Official Task Name chưa được xác nhận bởi Source of Truth. |
| **`UNDEFINED`** | Tuyệt đối không tìm thấy bất kỳ bằng chứng trực tiếp hay tham chiếu nào trong toàn bộ Nguồn Sự Thật. |
| **`CONTRADICTION`** | Phát hiện có sự mâu thuẫn về tên task hoặc scope giữa các nguồn tài liệu. |

---

## 5. TASK MAP (BẢNG BẢN ĐỒ TASK 01.06.04.01 ──> 01.06.04.10)

| Task ID | Official Task Name | Document Filename | Status | Referenced Topic / Source Evidence |
|---|---|---|---|---|
| **`01.06.04.01`** | API Architectural Principles | `09-api-architectural-principles.md` | **`CONFIRMED`** | Direct Task ID & Title in `docs/architecture/09-api-architectural-principles.md` |
| **`01.06.04.02`** | API Versioning & Naming | `10-api-versioning-and-naming.md` | **`CONFIRMED`** | Direct Task ID & Title in `docs/architecture/10-api-versioning-and-naming.md` |
| **`01.06.04.03`** | Request / Response Contract | `11-api-request-response-contract.md` | **`CONFIRMED`** | Direct Task ID & Title in `docs/architecture/11-api-request-response-contract.md` |
| **`01.06.04.04`** | API Error Contract | `12-api-error-contract.md` | **`CONFIRMED`** | Direct Task ID & Title in `docs/architecture/12-api-error-contract.md` |
| **`01.06.04.05`** | Pagination / Filtering / Sorting Contract | `13-api-pagination-filtering-sorting-contract.md` | **`CONFIRMED`** | Direct Task ID & Title in `docs/architecture/13-api-pagination-filtering-sorting-contract.md` |
| **`01.06.04.06`** | UNKNOWN | `NONE` | **`UNDEFINED`** | No direct evidence or reference found in `docs/` |
| **`01.06.04.07`** | UNKNOWN | `NONE` | **`UNDEFINED`** | No direct evidence or reference found in `docs/` |
| **`01.06.04.08`** | UNKNOWN | `NONE` | **`UNDEFINED`** | No direct evidence or reference found in `docs/` |
| **`01.06.04.09`** | UNKNOWN | `NONE` | **`REFERENCED ONLY`** | Referenced Topic: Idempotency Header & Key Format (in TBD-005 of `09`, `10`, `11`, `12`) |
| **`01.06.04.10`** | UNKNOWN | `NONE` | **`REFERENCED ONLY`** | Upper Range Boundary (`01.06.04.03..10` in `10` L36 & `11` L665) |

---

## 6. TASK SCOPE MAP (BẢN ĐỒ PHẠM VI CỦA TỪNG TASK)

| Task ID | Scope Summary | Confidence Level | Căn Cứ Chứng Minh |
|---|---|---|---|
| **`01.06.04.01`** | Nền tảng kiến trúc RESTful HTTP API, HTTPS, Thin Controller, Stateless API, Auth/Authz boundary, Error principles. | **HIGH** | `docs/architecture/09-api-architectural-principles.md` |
| **`01.06.04.02`** | Chiến lược URI Versioning (`/api/v1`), Naming conventions cho resources, path/query params, HTTP methods. | **HIGH** | `docs/architecture/10-api-versioning-and-naming.md` |
| **`01.06.04.03`** | Hợp đồng DTOs, Success Envelope `{"data": ...}`, camelCase, UTC+07:00, Money VND, 8 Booking States, Server Authority. | **HIGH** | `docs/architecture/11-api-request-response-contract.md` |
| **`01.06.04.04`** | Hợp đồng Lỗi, Unified Error Envelope `{"error": { ... }}`, HTTP status code mapping, `error.code` UPPER_SNAKE_CASE, validation error fields. | **HIGH** | `docs/architecture/12-api-error-contract.md` |
| **`01.06.04.05`** | Hợp đồng Phân trang Page-based (1-indexed, default=20, max=100), `meta.pagination`, Filtering (`startDate`/`endDate`), Sorting (`sort=field:dir`). | **HIGH** | `docs/architecture/13-api-pagination-filtering-sorting-contract.md` |
| **`01.06.04.06`** | UNKNOWN — No direct Source of Truth found. | **NONE** | Chưa có tài liệu chứng minh. |
| **`01.06.04.07`** | UNKNOWN — No direct Source of Truth found. | **NONE** | Chưa có tài liệu chứng minh. |
| **`01.06.04.08`** | UNKNOWN — No direct Source of Truth found. | **NONE** | Chưa có tài liệu chứng minh. |
| **`01.06.04.09`** | Idempotency-related API decisions are referenced by TBD-005, but official task name and complete scope are not confirmed by a dedicated Source of Truth. | **MEDIUM** | Tham chiếu chủ đề Idempotency tại TBD-005 của `09`, `10`, `11`, `12`. |
| **`01.06.04.10`** | UNKNOWN — Referenced only as the upper boundary of the 01.06.04.03..10 task range. | **NONE** | Tham chiếu ranh giới chuỗi task tại `10` và `11`. |

---

## 7. DOCUMENT MAPPING (ÁNH XẠ TỆP TÀI LIỆU)

- `01.06.04.01` ──> `docs/architecture/09-api-architectural-principles.md`
- `01.06.04.02` ──> `docs/architecture/10-api-versioning-and-naming.md`
- `01.06.04.03` ──> `docs/architecture/11-api-request-response-contract.md`
- `01.06.04.04` ──> `docs/architecture/12-api-error-contract.md`
- `01.06.04.05` ──> `docs/architecture/13-api-pagination-filtering-sorting-contract.md`
- `01.06.04.06` ──> `NONE`
- `01.06.04.07` ──> `NONE`
- `01.06.04.08` ──> `NONE`
- `01.06.04.09` ──> `NONE` (Chưa tạo file đặc tả riêng)
- `01.06.04.10` ──> `NONE` (Chưa tạo file đặc tả riêng)

---

## 8. DEPENDENCY MAP (BẢN ĐỒ PHỤ THUỘC GIỮA CÁC TASK)

```text
01.06.04.01 (Principles)
    │
    ▼
01.06.04.02 (Versioning & Naming)
    │
    ▼
01.06.04.03 (Request / Response Contract)
    │
    ├───────────────────────┐
    ▼                       ▼
01.06.04.04 (Error Contract) 01.06.04.05 (Pagination / Filtering / Sorting)
    │                       │
    └───────────┬───────────┘
                ▼
01.06.04.09 (Idempotency Topic - Referenced)
```

---

## 9. CROSS REFERENCES (CÁC THAM CHIẾU GIỮA CÁC TÀI LIỆU)

1. **`09-api-architectural-principles.md`**:
   - Tham chiếu `01.06.04.02` cho URI Versioning (`API-TBD-001`).
   - Tham chiếu `01.06.04.03` cho Response Envelope Schema (`API-TBD-002`).
   - Tham chiếu `01.06.04.04` cho Error Contract Schema (`API-TBD-003`).
   - Tham chiếu `01.06.04.09` cho Idempotency Header & Storage (`API-TBD-005`).
2. **`10-api-versioning-and-naming.md`**:
   - Tham chiếu `01.06.04.03` cho JSON DTO Field Case Format (`API-TBD-007`).
   - Tham chiếu `01.06.04.04` cho Error Contract Schema (`API-TBD-003`).
   - Tham chiếu `01.06.04.05` cho Pagination Query Parameter Specs (`API-TBD-008`).
   - Tham chiếu `01.06.04.09` cho Idempotency Header & Key Format (`API-TBD-005`).
3. **`11-api-request-response-contract.md`**:
   - Tham chiếu `01.06.04.04` cho Exact Error Contract Schema (`API-TBD-003`).
   - Tham chiếu `01.06.04.05` cho Pagination Metadata Schema (`API-TBD-008`).
   - Tham chiếu `01.06.04.09` cho Idempotency Header & Key Format (`API-TBD-005`).
4. **`12-api-error-contract.md`**:
   - Tái sử dụng DTO Boundary từ `01.06.04.03`.
   - Tham chiếu `01.06.04.09` cho Idempotency Header Name (`API-TBD-005`).
5. **`13-api-pagination-filtering-sorting-contract.md`**:
   - Tái sử dụng Success Envelope `{"data": [...], "meta": {}}` từ `01.06.04.03`.
   - Tái sử dụng Error Envelope `{"error": { ... }}` từ `01.06.04.04`.

---

## 10. NUMBERING GAPS (KHOẢNG TRỐNG MÃ SỐ TASK)

- Các task từ **`01.06.04.01` đến `01.06.04.05`** đã hoàn thành liên tục (`CONFIRMED` & `PASS`).
- **Khoảng trống Mã số (Gap):**
  - **`01.06.04.06`**: Thiếu file đặc tả và Official Task Name = UNKNOWN (`UNDEFINED`).
  - **`01.06.04.07`**: Thiếu file đặc tả và Official Task Name = UNKNOWN (`UNDEFINED`).
  - **`01.06.04.08`**: Thiếu file đặc tả và Official Task Name = UNKNOWN (`UNDEFINED`).
  - **`01.06.04.09`**: Official Task Name = UNKNOWN, được tham chiếu chủ đề (Idempotency Header & Key Format) tại TBD-005 (`REFERENCED ONLY`).
  - **`01.06.04.10`**: Official Task Name = UNKNOWN, Scope = UNKNOWN, được tham chiếu làm ranh giới chuỗi sub-task `01.06.04.03..10` (`REFERENCED ONLY`).

---

## 11. CONTRADICTIONS CHECK (KIỂM TRA XUNG ĐỘT)

- **Kết quả Kiểm tra:** KHÔNG phát hiện mâu thuẫn (No Contradictions) giữa các tài liệu đã chốt `01.06.04.01` đến `01.06.04.05`.
- Tất cả các quyết định đã được micro-correct và chốt khóa nhất quán 100%: URI `/api/v1`, JSON `camelCase`, Múi giờ `UTC+07:00`, Tiền tệ `VND Integer Amount`, 8 Booking States chuẩn, Reject Unknown Request Fields -> 400, Envelope `{"data": ...}` & `{"error": ...}`, Page-based 1-indexed pagination (`default=20`, `max=100`), Cú pháp lọc `startDate`/`endDate`, Cú pháp sắp xếp `sort=fieldName:dir`.

---

## 12. CONFIRMED TASKS LIST (DANH SÁCH TASK ĐÃ XÁC NHẬN)

1. **`TASK 01.06.04.01 — API Architectural Principles`** (`PASS`)
2. **`TASK 01.06.04.02 — API Versioning & Naming`** (`PASS`)
3. **`TASK 01.06.04.03 — Request / Response Contract`** (`PASS`)
4. **`TASK 01.06.04.04 — API Error Contract`** (`PASS`)
5. **`TASK 01.06.04.05 — Pagination / Filtering / Sorting Contract`** (`PASS`)

---

## 13. UNDEFINED & UNREFERENCED TASKS LIST (DANH SÁCH TASK CHƯA CÓ NGUỒN)

1. **`TASK 01.06.04.06`**: `UNDEFINED` (No direct Source of Truth found).
2. **`TASK 01.06.04.07`**: `UNDEFINED` (No direct Source of Truth found).
3. **`TASK 01.06.04.08`**: `UNDEFINED` (No direct Source of Truth found).
4. **`TASK 01.06.04.09`**: `REFERENCED ONLY` (Official Task Name = UNKNOWN; Referenced Topic = Idempotency Header & Key Format).
5. **`TASK 01.06.04.10`**: `REFERENCED ONLY` (Official Task Name = UNKNOWN; Upper Range Boundary).

---

## 14. RECOMMENDATIONS (KHUYẾN NGHỊ DUY NHẤT)

- **Khuyến nghị duy nhất:** Vui lòng cung cấp tài liệu Phân rã Công việc (Task Breakdown) hoặc Lộ trình Kiến trúc (Architecture Roadmap Source of Truth) chính thức quy định rõ tên task và phạm vi đặc tả cho các sub-task chưa xác định (`01.06.04.06`, `01.06.04.07`, `01.06.04.08`, `01.06.04.09`, `01.06.04.10`).
- ❌ **CẤM KHUYẾN NGHỊ TỰ PHÁT:** Tuyệt đối không khuyến nghị tự chọn chủ đề API (như Authentication, Rate Limit, Webhooks hay Caching) khi chưa có căn cứ từ Nguồn Sự Thật.

---
*Tài liệu API Architecture Task Map được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
