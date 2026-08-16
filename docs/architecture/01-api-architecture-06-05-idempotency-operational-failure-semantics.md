# API ARCHITECTURE — TASK 01.06.04.06.05
## IDEMPOTENCY OPERATIONAL & FAILURE SEMANTICS SPECIFICATION

**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.06.04.06.05 (Operational & Failure Semantics Phase)  
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
- [19-api-architecture-06-04-idempotency-gap-resolution.md](file:///e:/SportHubAI/docs/architecture/19-api-architecture-06-04-idempotency-gap-resolution.md) (APPROVED)  
**Ngày cập nhật:** 2026-08-08  

---

## 1. PURPOSE (MỤC TIÊU TÀI LIỆU)

Tài liệu này chuyển thể các quyết định Hợp đồng Idempotency đã được phê duyệt (`.06.01` đến `.06.04`) thành **Đặc tả Ngữ nghĩa Vận hành và Xử lý Sự cố Cấp Kiến trúc (Operational & Failure Semantics Specification)** cho sub-task `01.06.04.06.05`:

1. Mô tả chi tiết vòng đời (Lifecycle) của một Yêu cầu Idempotent, quy tắc thử lại (Retry), quy tắc xử lý trùng lặp (Duplicate), kịch bản lỗi (Failure), phát lại phản hồi (Replay), request đang xử lý (In-Progress) và lệch payload (Payload Mismatch).
2. Phân định rạch ròi ranh giới Phân quyền (Authorization Boundary) và luồng Callback Tích hợp Thanh toán MoMo.
3. Xác định yêu cầu Giám sát (Observability) và Sự kiện Kiểm toán (Audit Events) ở cấp độ khái niệm (Conceptual Level).
4. **Cảnh báo Quyền hạn:** Task `.06.05` KHÔNG tạo mã nguồn triển khai, KHÔNG chọn công nghệ hạ tầng (Redis, DB schema, Locks, Queues), KHÔNG làm lệch các Hợp đồng đã `APPROVED` và KHÔNG thay đổi Task Map `.09`.

---

## 2. PREREQUISITES (XÁC MINH ĐIỀU KIỆN TIÊN ĐỀ)

Đã xác minh trạng thái phê duyệt chính thức của 100% tài liệu tiền đề:
- **`01.06.04.06.01 — Idempotency Architecture Decision`**: `APPROVED` (ngày 2026-08-08).
- **`01.06.04.06.02 — Idempotency API Contract`**: `APPROVED` (ngày 2026-08-08).
- **`01.06.04.06.03 — Contract Validation & Adoption Matrix`**: `APPROVED` (ngày 2026-08-08).
- **`01.06.04.06.04 — Gap Resolution & Dependency Closure`**: `APPROVED` (ngày 2026-08-08).
- **Kết Luận Prerequisite:** Đạt 100% điều kiện tiên đề để tiến hành Task `01.06.04.06.05`.

---

## 3. SOURCE OF TRUTH (NGUỒN SỰ THẬT RÀ SOÁT)

Đã rà soát 100% bằng chứng từ:
- `docs/requirements/`: `01` đến `05` (đặc biệt `BR-BOOK-003`, `BR-PAY-001`).
- `docs/architecture/`: `06` đến `19` (đặc biệt `11-api-request-response-contract.md`, `12-api-error-contract.md`, `17-api-contract`).
- Sub-task `01.06.04.09` tiếp tục giữ trạng thái `REFERENCED ONLY`.

---

## 4. AUTHORITY MODEL (MÔ HÌNH QUYỀN HẠN QUYẾT ĐỊNH)

Task `.06.05` đóng vai trò là **Tài liệu Giải thích Ngữ nghĩa Vận hành (Operational Interpretation)** cho Hợp đồng API đã phê duyệt. Task này tuyệt đối không được phép override hay thay đổi bất kỳ điều khoản nào từ các tài liệu baseline `.01`..`.05` và `.06.01`..`.06.04`.

---

## 5. IDEMPOTENCY LIFECYCLE (VÒNG ĐỜI VẬN HÀNH CỦA YÊU CẦU IDEMPOTENT)

Vòng đời khái niệm (Conceptual Lifecycle) của một Idempotent Request trải qua 7 bước:

```text
Incoming HTTP Request (với Idempotency-Key Header)
       │
       ▼
1. AUTHENTICATION & AUTHORIZATION (RBAC Check)
       │ ── (Thất bại) ──> Return HTTP 401 / 403 (No Idempotency Lookup)
       ▼ (Thành công)
2. IDEMPOTENCY KEY VALIDATION (Format & Length Check)
       │ ── (Thất bại) ──> Return HTTP 400 (MISSING / INVALID FORMAT)
       ▼ (Thành công)
3. IDEMPOTENCY RECORD LOOKUP (Match Key Scope Tuple: Identity + Endpoint + Key)
       │
       ├─────> [Case A: Existing IN_PROGRESS] ────> Return HTTP 409 (IDEMPOTENCY_REQUEST_IN_PROGRESS)
       ├─────> [Case B: Existing COMPLETED] ──────> Match Payload?
       │                                                 ├─ Yes ──> Strict Response Replay (200/201 Envelope)
       │                                                 └─ No ───> Return HTTP 400 (PAYLOAD_MISMATCH)
       └─────> [Case C: NO EXISTING RECORD / NEW]
                                 │
                                 ▼
                   4. BUSINESS USE CASE PROCESSING
                                 │
                                 ▼
                   5. SAVE EXECUTION RESULT & STATE
                                 │
                                 ▼
                   6. RETURN RESPONSE TO CLIENT
```

---

## 6. REQUEST STATES (CÁC TRẠNG THÁI KHÁI NIỆM - CONCEPTUAL STATES)

Định nghĩa các Trạng thái Khái niệm (Conceptual / Derived States) dùng cho tài liệu mô hình hóa vận hành (không phải implementation DB column requirements):

- **`NEW`**: Yêu cầu lần đầu xuất hiện với Key Scope tương ứng.
- **`IN_PROGRESS`**: Yêu cầu gốc đang được thực thi trong hệ thống Backend.
- **`COMPLETED`**: Yêu cầu gốc đã hoàn thành thực thi và kết quả phản hồi đã được ghi nhận.
- **`FAILED`**: Yêu cầu gốc bị lỗi do dữ liệu đầu vào hoặc lỗi nghiệp vụ không thể thử lại.
- **`RETRYABLE_FAILURE`**: Yêu cầu gốc gặp sự cố hạ tầng hệ thống (`HTTP 500`), cho phép Client phát lại Yêu cầu với cùng Key.
- **`MISMATCH`**: Yêu cầu trùng Key nhưng phát hiện thay đổi nội dung Request Payload.
- **`REPLAYED`**: Yêu cầu lặp trùng hợp lệ nhận lại phản hồi gốc đã lưu vết.

---

## 7. NEW REQUEST SEMANTICS (NGỮ NGHĨA YÊU CẦU MỚI)

- Khi Key Scope `(Identity, Endpoint, Key)` chưa từng tồn tại trong hệ thống:
  - Backend ghi nhận trạng thái tạm `IN_PROGRESS` và cho phép Yêu cầu đi tiếp vào tầng thực thi nghiệp vụ (Application Use Case).
  - Sau khi Use Case hoàn tất, kết quả Response Envelope gốc được lưu vết và trạng thái chuyển sang `COMPLETED`.

---

## 8. IN-PROGRESS SEMANTICS (NGỮ NGHĨA YÊU CẦU ĐANG XỬ LÝ - CONTRACT DECISION 06.02)

- Nếu một Yêu cầu mới tới Backend mang cùng Key Scope với một Yêu cầu đang ở trạng thái `IN_PROGRESS`:
  - Server ngắt tuyến xử lý ngay lập tức và từ chối với mã lỗi **`HTTP 409 Conflict`**.
  - Mã lỗi hệ thống: `"IDEMPOTENCY_REQUEST_IN_PROGRESS"`.
  - Hướng dẫn Client: NÊN thực hiện Exponential Backoff và thử lại sau.

---

## 9. COMPLETED REQUEST / REPLAY (NGỮ NGHĨA PHÁT LẠI YÊU CẦU ĐÃ HOÀN THÀNH)

- Khi Yêu cầu trùng lặp mang cùng Key Scope và Payload khớp với Yêu cầu đã `COMPLETED`:
  - Backend thực hiện **Strict Response Replay (Option A)**.
  - Server trả lại chính xác HTTP Status Code gốc (`200 OK` hoặc `201 Created`) và Response Body gốc tuân thủ Envelope Task 11.
  - **Side-Effect Free:** Tuyệt đối KHÔNG thực thi lại Business Use Case, KHÔNG tạo đúp đơn hàng hay giao dịch thanh toán.

---

## 10. FAILED REQUEST SEMANTICS (NGỮ NGHĨA YÊU CẦU BỊ LỖI)

- **Non-retryable Failure (`4xx` ngoại trừ 401/403):** Các lỗi do Client (như `422 Unprocessable Content` do hết slot) được lưu vết. Khi Client phát lại đúng Key Scope đó, Backend phát lại chính xác phản hồi lỗi `4xx` gốc.
- **Retryable Server Failure (`HTTP 500`):** Lỗi hạ tầng Server `500` KHÔNG được lưu vết thành công. Client được phép thử lại an toàn (Clean Retry) bằng cách sử dụng chính chuỗi `Idempotency-Key` cũ.

---

## 11. TIMEOUT & RETRY SEMANTICS (NGỮ NGHĨA TIMEOUT VÀ THỬ LẠI DÀNH CHO CLIENT)

- **Nguyên Tắc Timeout:** Việc Client bị timeout không đồng nghĩa với việc Server đã thực thi thất bại. Server có thể chưa chạy, đang chạy (`IN_PROGRESS`), hoặc đã hoàn thành (`COMPLETED`).
- **Client MUST Reuse Key:** Khi retry sau kịch bản timeout hoặc connection reset cho cùng một thao tác nghiệp vụ, Client **BẮT BUỘC (MUST)** tái sử dụng chính xác chuỗi `Idempotency-Key` cũ. Tuyệt đối KHÔNG sinh Key mới cho cùng một thao tác.

---

## 12. PAYLOAD MISMATCH SEMANTICS (NGỮ NGHĨA LỖI LỆCH PAYLOAD)

- Nếu Yêu cầu phát lại mang cùng `Idempotency-Key` nhưng nội dung Request Payload bị thay đổi:
  - Backend ngắt tuyến xử lý và trả về **`HTTP 400 Bad Request`**.
  - Mã lỗi hệ thống: `"IDEMPOTENCY_KEY_PAYLOAD_MISMATCH"`.
  - Không thực thi Use Case, không ghi đè bản ghi gốc, không reset trạng thái Key.

---

## 13. AUTHORIZATION BOUNDARY (RANH GIỚI PHÂN QUYỀN VÀ BẢO MẬT)

- **Thứ Tự Đánh Giá:** Thủ tục Authentication & RBAC Authorization **BẮT BUỘC CHẠY TRƯỚC** khi chạm tới tầng tra cứu Idempotency Key Scope.
- **Server Authority Isolation:** Key Scope bọc chặt bởi `Authenticated User ID` được ký chính thức bởi Server. Client không thể mạo danh identity hoặc mạo danh tenant để truy cập phản hồi của người dùng khác.

---

## 14. KEY REUSE RULES (QUY TẮC TÁI SỬ DỤNG KEY)

- **Cùng Thao Tác Logic (Same Logical Operation):** Client BẮT BUỘC dùng cùng `Idempotency-Key`.
- **Thao Tác Logic Mới (New Logical Operation):** Client BẮT BUỘC tạo `Idempotency-Key` mới hoàn toàn.
- **Cấm Tái Sử Dụng Sai Scope:** Cấm dùng 1 Key cho nhiều thao tác độc lập khác nhau.

---

## 15. RETRY SEMANTICS MATRIX (MA TRẬN QUY TẮC THỬ LẠI CHI TIẾT)

| Scenario (Kịch Bản Thử Lại) | Same Key? | Retry Allowed? | Expected Result (Kết Quả Kỳ Vọng) |
|---|---|---|---|
| **Response Lost (Rớt mạng)** | `MUST` | Yes | Response Replay gốc (`200`/`201`) |
| **Timeout 30s** | `MUST` | Yes | Response Replay nếu xong, hoặc `409` nếu đang chạy |
| **Connection Reset** | `MUST` | Yes | Safe Replay hoặc Clean Retry |
| **Server Error (`500`)** | `MUST` | Yes | Clean Retry thực thi lại Use Case mới |
| **Client Validation Error (`422`)** | `MUST` | Yes | Response Replay lại lỗi `422` gốc |
| **In-Progress (`409`)** | `MUST` | Yes (Wait & Retry) | Chờ Exponential Backoff rồi retry cùng Key |
| **Payload Mismatch (`400`)** | `NO` | No (Must Change Key) | Reject `400 IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` |
| **Completed Request** | `MUST` | Yes | Strict Response Replay exact envelope |

---

## 16. SIDE-EFFECT SAFETY (AN TOÀN NGHĨA VỤ TÁC ĐỘNG PHỤ NGHỆP VỤ)

- **Chống Đúp Hiệu Ứng Nghiệp Vụ Chính (Primary Business Side-Effect):**
  - Luồng retry `POST /api/v1/bookings` không tạo đơn giữ chỗ thứ hai (`BR-BOOK-003`).
  - Luồng retry `POST /api/v1/payments` không tạo đúp 2 payment intents MoMo (`BR-PAY-001`).
- **Downstream External Notifications:** Việc gửi Email xác nhận hay Push Notification thuộc ranh giới Notification Deduplication riêng, không phát lại đúp Email khi xảy ra Response Replay cấp API.

---

## 17. PAYMENT / MOMO BOUNDARY (RANH GIỚI TÍCH HỢP THANH TOÁN MOMO)

- **Client Payment API (`POST /api/v1/payments`):** Sử dụng HTTP `Idempotency-Key` theo Hợp đồng API Client-to-Server.
- **MoMo IPN Callback (`POST /api/v1/payments/momo-ipn`):** Sử dụng **`momoTransId`** làm khóa lọc trùng độc quyền theo Hợp đồng Tích hợp Thanh toán MoMo (`BR-PAY-001`). Hợp đồng HTTP `Idempotency-Key` KHÔNG áp dụng cho luồng IPN Callback này.

---

## 18. OBSERVABILITY REQUIREMENTS (YÊU CẦU GIÁM SÁT VÀ TRACING KHÁI NIỆM)

- **Correlation Identifiers:** Mọi log sự kiện vận hành Idempotency BẮT BUỘC phải gắn liền với **`requestId`** chuẩn của Task 12 để truy vết toàn luồng.
- **Log Masking Safety:** Ghi log hệ thống chỉ được log 8 ký tự đầu của chuỗi `Idempotency-Key` (e.g. `9b1deb4d...`) đính kèm `requestId`. Tuyệt đối không log thông tin nhạy cảm.

---

## 19. AUDIT EVENTS (CÁC SỰ KIỆN KIỂM TOÁN KHÁI NIỆM - PROPOSED / TBD)

Định nghĩa các Sự kiện Kiểm toán Khái niệm (Conceptual Audit Events - `PROPOSED / TBD`):
- `IDEMPOTENCY_REQUEST_RECEIVED`: Ghi nhận Yêu cầu mới vào hệ thống.
- `IDEMPOTENCY_REPLAY`: Ghi nhận sự kiện phát lại phản hồi thành công.
- `IDEMPOTENCY_MISMATCH`: Ghi nhận sự kiện từ chối do lệch payload.
- `IDEMPOTENCY_IN_PROGRESS`: Ghi nhận sự kiện từ chối do trùng request đang xử lý.
- `IDEMPOTENCY_RETRY`: Ghi nhận sự kiện retry hợp lệ từ Client.

---

## 20. SECURITY (BẢO MẬT VÀ CHỐNG RÒ RỈ THÔNG TIN)

- **Chống Dò Quét Key (Key Enumeration Protection):** Do Key Scope được bọc bởi User ID đã xác thực, kẻ tấn công không thể gửi thử Key của người khác để lấy lại dữ liệu nhạy cảm.
- **Không Tiết Lộ Cấu Trúc Nội Bộ:** Response Replay không làm rò rỉ thông tin hạ tầng hay cơ chế lưu trữ nội bộ phía Server.

---

## 21. FAILURE SEMANTICS MATRIX (MA TRẬN XỬ LÝ 11 KỊCH BẢN SỰ CỐ F01..F11)

| Mã Failure | Tình Huống Sự Cố (Failure Scenario) | Server State | Client Retry | Same Key? | Expected Outcome (Kết Quả Kỳ Vọng) | Evidence / Basis |
|---|---|---|---|---|---|---|
| **F01** | Validation Failure (Missing/Invalid Key) | None | Yes | Fix Format | HTTP 400 Bad Request (`MISSING/INVALID_FORMAT`) | Task 06.02 L190 |
| **F02** | Authentication Failure (Invalid Bearer Token) | None | Yes | Same/New | HTTP 401 Unauthorized (No Idempotency lookup) | Task 06.02 L170 |
| **F03** | Authorization Failure (Forbidden Action) | None | Yes | Same/New | HTTP 403 Forbidden (RBAC checked before key) | Task 06.02 L170 |
| **F04** | Client Request Timeout (Network lag) | Processing/Done | Yes | `MUST` | Response Replay if done, or 409 if in-progress | Task 06.01 L210 |
| **F05** | Connection Reset (Lost response) | Completed | Yes | `MUST` | Response Replay exact envelope (200/201) | Task 06.02 L140 |
| **F06** | In-Progress Duplicate Request | In-Progress | Yes (Wait) | `MUST` | HTTP 409 Conflict (`REQUEST_IN_PROGRESS`) | Task 06.02 L110 |
| **F07** | Infrastructure Server Failure (HTTP 500) | Failed (Not saved) | Yes | `MUST` | Clean Retry allowed (Re-execute Use Case) | Task 06.02 L150 |
| **F08** | Payload Mismatch (Same Key, different body) | Completed | No (Change Key) | `NO` | HTTP 400 Bad Request (`PAYLOAD_MISMATCH`) | Task 06.02 L120 |
| **F09** | Completed Duplicate Request | Completed | Yes | `MUST` | Strict Response Replay exact envelope | Task 06.02 L140 |
| **F10** | Duplicate Concurrent Request (Same millisecond) | In-Progress | Yes (Wait) | `MUST` | Canonical runs; Second gets HTTP 409 Conflict | Task 06.02 L110 |
| **F11** | MoMo IPN Callback Duplicate Retry | External Callback | Yes | N/A (momoID) | Deduplicated via `momoTransId` (`BR-PAY-001`) | BR-PAY-001, 06.01 |

---

## 22. OPERATIONAL BOUNDARIES (RANH GIỚI VẬN HÀNH TECHNOLOGY-AGNOSTIC)

- Tài liệu `.06.05` duy trì tuyệt đối tính **Technology-Agnostic**:
- ❌ **CẤM KHÓA CÔNG NGHỆ Triển Khai:** Không tự chọn Redis, Database Table, Memory Cache, Lock Library, Distributed Lock, Worker, Outbox Pattern hay Message Broker. Tất cả việc chọn công nghệ thuộc về các Task triển khai Hạ tầng và Backend sau.

---

## 23. OPEN DEPENDENCIES (KẾ THỪA CÁC KHOẢNG TRỐNG KỸ THUẬT TỪ TASK .06.04)

Duy trì 100% các khoảng trống kỹ thuật kế thừa từ Task `01.06.04.06.04`:
- **`GAP-IDEMP-001`**: Mã lỗi chưa sync chính thức vào Error Registry của Task 12 (`OPEN — EXTERNAL TASK DEPENDENCY`).
- **`GAP-IDEMP-002`**: TTL retention period chưa chốt số kỹ thuật (`OPEN — INFRASTRUCTURE DEPENDENCY`).
- **`GAP-IDEMP-003`**: Replay Header Name chính thức giữ `TBD-IDEMP-003` (`OPEN — CONTRACT DECISION REQUIRED`).
- **`GAP-IDEMP-004`**: Endpoint URI của API Refund chưa chốt (`OPEN — SOURCE OF TRUTH DEPENDENCY`).

---

## 24. CONTRACT DRIFT CHECK (KIỂM TRA SỰ LỆCH CHUẨN HỢP ĐỒNG)

Thực hiện kiểm tra đối chiếu chống lệch chuẩn (Contract Drift Audit) với tất cả các tài liệu đã `APPROVED`:
- [x] Không thay đổi mã lỗi HTTP Status Code.
- [x] Không thay đổi quy tắc Header `Idempotency-Key`.
- [x] Không thay đổi Key Scope 3-Tuple `(Identity, Endpoint, Key)`.
- [x] Không thay đổi quy tắc bắt buộc Category A.
- [x] Không thay đổi quy tắc Option A Strict Response Replay.
- **Kết Luận Contract Drift:** **ZERO CONTRACT DRIFT FOUND (100% INTACT)**.

---

## 25. FINAL RESULT (KẾT LUẬN CUỐI CÙNG TỔNG HỢP)

```text
================================================================================────────
                            FINAL OPERATIONAL SEMANTICS SUMMARY
================================================================================────────

Operational Result:    OPERATIONAL SEMANTICS READY — OPEN DEPENDENCIES

Prerequisite Status:   .06.01 = APPROVED | .06.02 = APPROVED | .06.03 = APPROVED | .06.04 = APPROVED

Contract Drift Audit:  0 Contract Drift Found (100% Compatible)

Inherited Dependencies: 4 Open Dependencies Tracked (GAP-IDEMP-001 to GAP-IDEMP-004)

================================================================================────────
OPERATIONAL & FAILURE SEMANTICS SPECIFICATION IS APPROVED BY ARCHITECTURE OWNER ON 2026-08-08.
================================================================================────────
```

---

## 26. NON-GOALS (CÁC NỘI DUNG KHÔNG THỰC HIỆN TRONG TASK NÀY)

- ❌ KHÔNG chọn công nghệ triển khai (Cấm chọn Redis, DB tables, Memory Cache, Lock Library).
- ❌ KHÔNG viết mã nguồn TypeScript, Interceptor, Controller hay Middleware code.
- ❌ KHÔNG làm lệch các Hợp đồng đã APPROVED (`.01` đến `.06.04`).
- ❌ KHÔNG tự ý đóng các GAPs từ Task `.06.04`.
- ❌ KHÔNG tự đổi tên hay xóa Task `01.06.04.09` trong Task Map.
- ❌ KHÔNG tự động chuyển trạng thái thành APPROVED.

---

## 27. APPROVAL SECTION (PHẦN PHÊ DUYỆT BẮT BUỘC)

```text
================================================================================────────
                               APPROVAL DECISION SECTION
================================================================================────────

Status:                APPROVED

Approval Decision:     APPROVED

Approved By:           Architecture Owner / API Owner

Approved At:           2026-08-08

================================================================================────────
TASK 01.06.04.06.05 IS APPROVED BY ARCHITECTURE OWNER / API OWNER ON 2026-08-08.
================================================================================────────
```

---
*Tài liệu Đặc tả Ngữ nghĩa Vận hành và Xử lý Sự cố Idempotency được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
