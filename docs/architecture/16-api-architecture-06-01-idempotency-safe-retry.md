# API ARCHITECTURE — TASK 01.06.04.06.01
## IDEMPOTENCY & SAFE RETRY — ARCHITECTURE DECISION

**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.06.04.06.01 (Architecture Decision Specification)  
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
**Ngày cập nhật:** 2026-08-08  

---

## 1. PURPOSE (MỤC TIÊU TÀI LIỆU)

Tài liệu này xác định và đặc tả **Đặc tả Quyết định Kiến trúc đã được Phê duyệt (Approved Architecture Decision Document)** cho chủ đề **Idempotency & Safe Retry API Contract** (Sub-task `01.06.04.06.01`):

1. Phân định rạch ròi giữa khái niệm Tính trùng lặp an toàn (Idempotency) và Thử lại an toàn (Safe Retry) cấp Giao thức API.
2. Phân tích phạm vi áp dụng (Applicability Categories) cho từng loại API Operation trong hệ thống SportHubAI.
3. Phân tích ranh giới kiến trúc (Idempotency Boundary), ngữ nghĩa Idempotency Key đề xuất, hành vi xử lý Yêu cầu trùng lặp (Duplicate Request Semantics) và Phát lại phản hồi (Response Replay Semantics).
4. Phân tích mô hình sự cố (Failure Model F1..F10), tương tác với nghiệp vụ Đặt sân (`BR-BOOK-003`) và Thanh toán MoMo (`BR-PAY-001`).
5. Đảm bảo tính **Technology-Agnostic**: Tuyệt đối không đưa ra bất kỳ quyết định triển khai hạ tầng hay công nghệ cụ thể nào (Zero Redis, Zero DB tables, Zero lock code, Zero middleware code).
6. **Ranh giới Phân loại:** Phân định chính xác giữa nội dung **`DECIDED`** (Đã có chứng cứ trực tiếp), **`PROPOSED`** (Đề xuất kỹ thuật cho Architecture Owner review) và **`TBD`** (Bảo lưu cho hợp đồng/hạ tầng sau).
7. **Trạng thái:** Tài liệu đã đạt trạng thái **`APPROVED`** chính thức từ Architecture Owner ngày 2026-08-08.

---

## 2. SOURCE OF TRUTH (NGUỒN SỰ THẬT THAM CHIẾU)

Tài liệu kế thừa và phân tích 100% bằng chứng từ:
- **`API-TBD-005`**: Điểm TBD về Idempotency Header & Storage được tham chiếu tại `09` (L471), `10` (L429), `11` (L620), `12` (L474).
- **`BR-BOOK-003`**: Quy tắc ngăn chặn đúp đơn giữ chỗ đặt sân cùng khung giờ.
- **`BR-PAY-001`**: Quy tắc chống đúp giao dịch thanh toán MoMo.
- **`08-backend-architecture.md`**: Ranh giới Transaction Boundary và MoMo IPN Callback Verification.
- **`15-api-architecture-06-candidate-discovery.md`**: Kết quả đệ trình Đề xuất Candidate A cho Task `01.06.04.06`.

---

## 3. EXISTING API ARCHITECTURE BASELINE (NỀN TẢNG KIẾN TRÚC ĐÃ KHÓA)

Giữ nguyên và bảo tồn 100% các quyết định đã `PASS`:
- RESTful HTTP API over HTTPS (`01.06.04.01`).
- URI Path Versioning `/api/v1` (`01.06.04.02`).
- Response Envelope `{"data": ...}`, JSON `camelCase`, ISO 8601 `UTC+07:00`, Money `VND Integer Amount`, 8 Booking States chuẩn, Server Authority (`01.06.04.03`).
- Error Envelope `{"error": { "code": ... }}`, HTTP Statuses, Error Code Registry (`01.06.04.04`).
- Page-based 1-indexed pagination, `meta.pagination`, Filtering/Sorting (`01.06.04.05`).

---

## 4. PROBLEM STATEMENT (TỰA ĐỀ VẤN ĐỀ KIẾN TRÚC)

Trong môi trường mạng Internet chập chờn, khi Client (Customer Website / Owner Portal) gửi một HTTP Request làm thay đổi trạng thái (như Tạo đơn đặt sân `POST /api/v1/bookings` hoặc Khởi tạo thanh toán `POST /api/v1/payments`), request có thể gặp sự cố mất kết nối giữa chừng hoặc timeout trước khi nhận được Response từ Backend.

Nếu Client tự động phát lại (retry) request mà Backend không có cơ chế Idempotency:
- Hệ thống có rủi ro tạo ra **nhiều đơn đặt sân bị trùng lặp** cho cùng một mục đích người dùng.
- Khách hàng có thể bị **trừ tiền đúp** cho cùng một giao dịch.

Cần một Hợp đồng Kiến trúc API thống nhất cấp Giao thức để Client và Backend hợp tác xử lý thử lại an toàn.

---

## 5. TERMINOLOGY (THUẬT NGỮ CHUYÊN NGHÀNH)

Hệ thống phân định rạch ròi 5 khái niệm cốt lõi:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                IDEMPOTENCY VS SAFE RETRY                               │
├───────────────────────────┬────────────────────────────────────────────────────────────┤
│ Thuật Ngữ (Term)          │ Định Nghĩa Kiến Trúc (Architecture Definition)             │
├───────────────────────────┼────────────────────────────────────────────────────────────┤
│ 1. Idempotency            │ Tính chất của một API Operation đảm bảo việc thực thi     │
│ (Tính trùng lặp an toàn)  │ N-lần cùng một thao tác logic sẽ sinh ra kết quả hiệu ứng  │
│                           │ nghiệp vụ trên cơ sở dữ liệu đúng bằng 1-lần duy nhất.    │
├───────────────────────────┼────────────────────────────────────────────────────────────┤
│ 2. Safe Retry             │ Cơ chế cho phép Client chủ động phát lại (re-transmit) một  │
│ (Thử lại an toàn)         │ Request sau sự cố timeout/network failure mà KHÔNG sợ gây │
│                           │ ra hiệu ứng đúp ngoài ý muốn (Unintended side effect).     │
├───────────────────────────┼────────────────────────────────────────────────────────────┤
│ 3. Original Request       │ Yêu cầu HTTP đầu tiên được gửi từ Client cho một thao tác  │
│ (Yêu cầu gốc)             │ logic nghiệp vụ cụ thể.                                   │
├───────────────────────────┼────────────────────────────────────────────────────────────┤
│ 4. Duplicate Request      │ Yêu cầu HTTP phát lại mang cùng Idempotency Key với Yêu    │
│ (Yêu cầu trùng lặp)       │ cầu gốc trước đó.                                          │
├───────────────────────────┼────────────────────────────────────────────────────────────┤
│ 5. Logical Operation      │ Hành động nghiệp vụ có chủ đích của người dùng (Ví dụ:      │
│ (Thao tác logic)          │ Thao tác "Bấm nút xác nhận thanh toán đơn X").             │
└───────────────────────────┴────────────────────────────────────────────────────────────┘
```

---

## 6. APPLICABILITY (PHẠM VI ÁP DỤNG THEO LOẠI OPERATION - PROPOSED CATEGORIES)

Đề xuất phân loại API Operations thành 3 nhóm áp dụng Idempotency để chi tiết hóa ở API Contract:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PROPOSED API APPLICABILITY CATEGORIES                           │
├───────────────────────────┬──────────────────────────────────┬─────────────────────────┤
│ Nhóm Operation (Category) │ Ví Dụ API Endpoints Cụ Thể       │ Quy Tắc Áp Dụng (Prop)  │
├───────────────────────────┼──────────────────────────────────┼─────────────────────────┤
│ Category A: Mutating with │ - POST /api/v1/bookings          │ PROPOSED: REQUIRED      │
│ Duplicate Risk            │ - POST /api/v1/payments          │ Client nên gửi Header   │
│ (Ghi/Tạo có rủi ro đúp)   │ - POST /api/v1/owner-applications│ Idempotency-Key         │
├───────────────────────────┼──────────────────────────────────┼─────────────────────────┤
│ Category B: Mutating      │ - POST /bookings/{id}/cancellation│ PROPOSED: OPTIONAL      │
│ Idempotent by Semantics   │ - PATCH /venues/{id}             │ Vốn đã mang tính an toàn│
│ (Ghi an toàn theo ngữ nghĩa) - DELETE /favorites/{id}       │ theo thiết kế RESTful   │
├───────────────────────────┼──────────────────────────────────┼─────────────────────────┤
│ Category C: Read-Only     │ - GET /api/v1/venues             │ PROPOSED: FORBIDDEN/NA  │
│ Operations (Đọc dữ liệu)  │ - GET /api/v1/bookings/{id}      │ Tuyệt đối không nhận Key│
└───────────────────────────┴──────────────────────────────────┴─────────────────────────┘
```

- ❌ **CẤM ÉP BUỘC TOÀN BỘ:** Không áp đặt quy tắc "Tất cả phương thức POST đều bắt buộc truyền Idempotency-Key". Việc áp dụng phụ thuộc vào danh mục Category A/B/C được duyệt cho từng Endpoint.

---

## 7. IDEMPOTENCY BOUNDARY (RANH GIỚI KIẾN TRÚC ENFORCE - PROPOSED BOUNDARY)

Ranh giới xử lý Idempotency được đề xuất thiết lập tại **Tầng API Gateway / API Controller Boundary (Transport-level Deduplication)** lồng với **Tầng Application Use Case Boundary**:

```text
Client Request (với Idempotency-Key)
       │
       ▼
┌────────────────────────────────────────────────────────────────────────┐
│ API CONTROLLER / TRANSPORT DEDUPARATION BOUNDARY (PROPOSED)           │
│ - Kiểm tra sự tồn tại của Idempotency Key                              │
│ - Phân luồng: [First Request] vs [In-Progress] vs [Completed]          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ (Nếu First Request)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ APPLICATION USE CASE & TRANSACTION BOUNDARY (PROPOSED)                 │
│ - Thực thi Business Logic & Database Persist                           │
│ - Lưu vết Cached Execution Result gắn liền với Idempotency Key          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 8. IDEMPOTENCY KEY SEMANTICS (NGỮ NGHĨA HEADER VÀ KEY - PROPOSED SPECS)

- **Header Name (PROPOSED):** `Idempotency-Key` (Chờ chốt chính thức ở Task `01.06.04.06.02 API Contract`).
- **Quyền Tạo Key:** Client chịu trách nhiệm tạo Key trước khi phát HTTP Request gốc.
- **Định Dạng Key:** `TBD — Defined in Task 01.06.04.06.02 API Contract`.
- **Vòng Đời & Thời Gian Lưu Trữ (Key Retention Lifecycle):** `TBD — Pending Infrastructure Architecture Confirmation`.

---

## 9. KEY SCOPE (RANH GIỚI BẢO MẬT PHẠM VI CỦA KEY - PROPOSED ARCHITECTURE OPTION)

Đề xuất Idempotency Key **bắt buộc được bọc trong Phạm vi bảo mật 3 lớp (3-Tuple Scope)** để triển khai trong API Contract:

$$\text{Key Scope (PROPOSED)} = \text{Tuple}(\text{Authenticated Identity}, \text{Resource Endpoint}, \text{Idempotency-Key})$$

```text
┌────────────────────────────────────────────────────────────────────────┐
│                 PROPOSED IDEMPOTENCY KEY SCOPE OPTION                  │
│                                                                        │
│   [ Authenticated User ID ] + [ HTTP Method & Path ] + [ Key String ]  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

- **Quy Tắc An Ninh:** User A không thể gửi trùng Idempotency Key của User B để lấy lại kết quả phản hồi của User B.

---

## 10. DUPLICATE REQUEST SEMANTICS (NGỮ NGHĨA XỬ LÝ YÊU CẦU TRÙNG LẶP - PROPOSED SEMANTICS)

Khi Backend nhận được một Request có đính kèm `Idempotency-Key`, ngữ nghĩa đề xuất cho các trường hợp xử lý như sau:

| Trường Hợp (Case) | Trạng Thái Xử Lý Trước Đó | Hành Vi Đề Xuất (Proposed Server Behavior) | HTTP Status Phản Hồi (Proposed) |
|---|---|---|---|
| **Case 1** | Yêu cầu mới (First Request) | Cho phép đi tiếp vào Application Use Case để xử lý. | `200` / `201` (Theo API Contract) |
| **Case 2** | Yêu cầu gốc **đang xử lý** (In-Progress) | Từ chối hoặc báo bận để tránh xung đột xử lý song song. | **`409 Conflict`** (PROPOSED code `IDEMPOTENCY_REQUEST_IN_PROGRESS`) |
| **Case 3** | Yêu cầu gốc **đã thành công** (Succeeded) | Bỏ qua việc thực thi Use Case; Phát lại kết quả (Response Replay). | **`200 OK`** / **`201 Created`** (Khớp kết quả gốc) |
| **Case 4** | Yêu cầu gốc **thất bại lỗi Client** (`4xx`) | Bỏ qua việc thực thi Use Case; Phát lại phản hồi lỗi gốc (`4xx`). | Khớp HTTP Status lỗi `4xx` gốc |
| **Case 5** | Yêu cầu gốc **thất bại lỗi Server** (`500`) | Cho phép thực thi lại Use Case (Clean Retry) để sửa lỗi hệ thống. | Xử lý lại từ đầu |
| **Case 6** | Trùng Key nhưng **Payload bị thay đổi** | Từ chối bắt buộc do cố tình tái sử dụng Key cho thao tác khác. | **`400 Bad Request`** (PROPOSED code `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`) |

*Lưu ý:* Các mã lỗi `IDEMPOTENCY_REQUEST_IN_PROGRESS` và `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` mang tính chất **PROPOSED** và không sửa đổi hay làm lệch Task `01.06.04.04 API Error Contract`.

---

## 11. RESPONSE REPLAY SEMANTICS (NGỮ NGHĨA PHÁT LẠI PHẢN HỒI - PROPOSED)

- Khi rơi vào Case 3 (Original Request đã thành công), Backend thực hiện **Phát lại Phản hồi (Response Replay)**.
- **Envelope Nhất Quán:** Response Replay bắt buộc phải bảo tồn 100% cấu trúc Response Envelope `{"data": ...}` của Task 11.
- **Replay Response Header Name:** `TBD — To be specified in Task 01.06.04.06.02 API Contract`.

---

## 12. ERROR CONTRACT INTEGRATION (TÍCH HỢP HỢP ĐỒNG BÁO LỖI API)

Tái sử dụng 100% Cấu trúc Error Envelope `{"error": { ... }}` của Task 12 khi xảy ra các lỗi liên quan đến Idempotency. Các mã lỗi idempotency chi tiết giữ trạng thái **PROPOSED** chờ chốt ở API Contract.

---

## 13. CONCURRENCY INTERACTION (TƯƠNG TÁC GIỮA IDEMPOTENCY VÀ CONCURRENCY CONTROL)

Phân định rạch ròi ranh giới giữa 2 cơ chế kiểm soát:

- **Idempotency (Cấp API Transport):** Ngăn chặn việc **cùng một người dùng** bấm nút 2 lần hoặc Client tự động retry phát trùng cùng 1 request logic.
- **Concurrency Control (Cấp Database / Domain):** Ngăn chặn tranh chấp dữ liệu (Race Conditions / Double Booking) giữa **hai người dùng khác nhau** cùng tranh chấp một khung giờ đặt sân (`BR-BOOK-003`).
- **Quy Tắc Kết Hợp:** Idempotency đứng ở tầng ngoài bọc lấy Request; Concurrency Control (Optimistic/Pessimistic Locking) đứng ở tầng cơ sở dữ liệu bên trong.

---

## 14. BOOKING INTEGRATION (TÍCH HỢP NGHIỆP VỤ ĐẶT SÂN - BR-BOOK-003)

- **Phân Phân Tích Kiến Trúc Tạo Đơn Đặt Sân (`POST /api/v1/bookings`):**
  1. Client tạo `Idempotency-Key` và gửi đính kèm request.
  2. Backend kiểm tra Key Scope. Nếu là First Request: Tiến hành giữ chỗ 10 phút và chuyển trạng thái sang `HOLDING` theo đúng `BR-BOOK-003`.
  3. Nếu Client gặp sự cố mạng và retry gửi lại `POST /api/v1/bookings` với cùng `Idempotency-Key`:
     - Backend phát hiện Case 3 (Đã thành công trước đó).
     - Backend trả lại thông tin đơn hàng đã giữ chỗ (`status: HOLDING`) mà **KHÔNG tạo thêm đơn giữ chỗ thứ hai** và **KHÔNG báo lỗi đúp slot `BOOKING_SLOT_OCCUPIED` cho chính mình**.
- *Lưu ý:* Phân tích trên tuân thủ 100% các Business Rules hiện có, không tự tạo thêm quy tắc `BR-BOOK` mới.

---

## 15. PAYMENT INTEGRATION (TÍCH HỢP NGHIỆP VỤ THANH TOÁN - BR-PAY-001)

Phân định rạch ròi 2 cơ chế xử lý ở 2 ranh giới hoàn toàn khác nhau:

- **A. Client ──> SportHub Payment API (`POST /api/v1/payments`):**
  - Sử dụng **`Idempotency-Key`** theo hợp đồng API Client-to-Server để ngăn chặn việc Client phát trùng yêu cầu tạo MoMo Payment URL.
- **B. MoMo Server ──> SportHub IPN Callback (`POST /api/v1/payments/momo-ipn`):**
  - MoMo IPN Callback deduplication được thực hiện dựa trên **`momoTransId`** theo kiến trúc tích hợp MoMo (`BR-PAY-001`).
- 💡 **Ranh Giới Rõ Ràng:** Task `01.06.04.06.01` định nghĩa ngữ nghĩa idempotency cho luồng Client-to-SportHub API. Cơ chế lọc trùng MoMo Callback vẫn thuộc về phân hệ **Payment / Integration Architecture**.

---

## 16. EXTERNAL SIDE EFFECTS (RANH GIỚI TÁC ĐỘNG PHỤ BÊN NGOÀI)

- **Cảnh Báo Ranh Giới:** Hợp đồng Idempotency API bảo vệ sự đóng băng hiệu ứng của **Business Operation chính (Primary Business Operation)**.
- **Phân Định Downstream Side Effects:** Cơ chế lọc trùng các tác động ngầm phía sau (như gửi Email OTP hay gửi Notification thông báo qua dịch vụ bên ngoài) là một **Vấn đề Kiến trúc Tách biệt (Separate Architecture Concern)**, trừ khi được đặc tả tại một hợp đồng kiến trúc khác.
- **Email / Notification Deduplication Status:** `TBD / Separate Architecture Concern`.

---

## 17. TRANSACTION BOUNDARY (YÊU CẦU ĐỒNG BỘ NGHĨA VỤ LOGIC - LOGICAL ATOMICITY REQUIREMENT)

- **Yêu Cầu Đồng Bộ Logic (Logical Atomicity Requirement):** Hiệu ứng nghiệp vụ (Business Effect) và Trạng thái Idempotency chính thống (Authoritative Idempotency State) bắt buộc phải có mối quan hệ nhất quán (Consistency Relationship) đủ để tránh 2 rủi ro:
  1. Hiệu ứng nghiệp vụ đã xảy ra trên Database nhưng không lưu được trạng thái Idempotency có thể khôi phục.
  2. Trạng thái Idempotency tồn tại nhưng Hiệu ứng nghiệp vụ thực tế lại không tồn tại trong cơ sở dữ liệu.
- **Các Mục Kỹ Thuật Lưu Trữ Giữ Trạng Thái TBD:**
  - Exact persistence mechanism: `TBD`.
  - Exact transaction mechanism: `TBD`.
  - Exact storage: `TBD`.
- ❌ **CẤM KHÓA CÔNG NGHỆ:** Không tự chọn Redis, Database Table, Cache, Lock hay Middleware code ở task này.

---

## 18. FAILURE MODEL (MÔ HÌNH PHÂN TÍCH 10 KỊCH BẢN SỰ CỐ F1..F10)

| Mã Sự Cố (Failure Case) | Kịch Bản Chi Tiết (Detailed Scenario) | Trạng Thái Phân Loại Hành Vi Kiến Trúc |
|---|---|---|
| **F1** | Request chưa bao giờ tới được Server (Rớt mạng từ Client). | Client an tâm retry lại đúng Key đó mà không gây side-effect (`PROPOSED`). |
| **F2** | Request tới Server, Use case thành công nhưng Response rớt trên đường về. | Client retry với cùng Key -> Server phát hiện Case 3, trả lại Cached Response (`PROPOSED`). |
| **F3** | Use case thành công, DB đã lưu nhưng crash trước khi lưu Idempotency record. | Được xử lý bởi `Logical Atomicity Requirement` (`TBD mechanism`). |
| **F4** | Use Case thất bại do lỗi dữ liệu Client (`422`). | Client retry -> Server phát lại Response lỗi `422` tương ứng (`PROPOSED`). |
| **F5** | Client retry liên tục trong khi Original Request đang chạy (Case 2). | Server từ chối `409 Conflict` (`IDEMPOTENCY_REQUEST_IN_PROGRESS` - `PROPOSED`). |
| **F6** | Client retry lại sau khi timeout 30 giây. | Server kiểm tra trạng thái Original Request (nếu xong -> Replay; nếu lỗi 500 -> Clean Retry - `PROPOSED`). |
| **F7** | Hai Request trùng Key tới Server cùng một miligiây (Concurrent duplicate). | Một request vào Use Case, request kia bị chặn `409 Conflict` (`PROPOSED`). |
| **F8** | Dùng cùng Key nhưng gửi Payload dữ liệu khác hoàn toàn (Case 6). | Server từ chối `400 Bad Request` (`IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` - `PROPOSED`). |
| **F9** | User A cố tình gửi trùng Key của User B. | Key Scope chặn lại (User A nhận kết quả xử lý mới của A, không thấy dữ liệu B - `PROPOSED`). |
| **F10** | MoMo IPN gửi lại nhiều lần do mạng chập chờn. | Backend lọc trùng theo `momoTransId` thuộc Payment Integration Architecture (`DECIDED in BR-PAY-001`). |

---

## 19. SECURITY (AN NINH VÀ SỰ TOÀN VẸN CỦA IDEMPOTENCY KEY)

- **Không Thay Thế Authentication:** Idempotency Key tuyệt đối **KHÔNG ĐƯỢC COI LÀ CREDENTIAL BẢO MẬT** và không thay thế cho Authentication Token (`Authorization: Bearer <token>`).
- **Chống Dò Quét Key (Key Guessing Protection):** Do Key Scope được bọc bởi `Authenticated User ID`, việc người dùng khác đoán được chuỗi Key của người dùng khác hoàn toàn không tạo ra lỗ hổng bộc lộ dữ liệu.

---

## 20. AUTHORIZATION INTERACTION (TƯƠNG TÁC VỚI THỦ TỤC PHÂN QUYỀN)

- **Đề Xuất Thứ Tự Thực Thi:** Thủ tục Kiểm tra Phân quyền (Authorization Check - RBAC) **NÊN ĐƯỢC THỰC THI TRƯỚC** khi tra cứu Idempotency Key (`PROPOSED`).
- **Lý Do An Ninh:** Nếu User không có quyền thực hiện Endpoint đó, Server từ chối ngay `403 Forbidden` trước khi chạm vào kho lưu trữ Idempotency, ngăn chặn nguy cơ User A lấy Key của User B để replay response mà User A không có quyền xem.

---

## 21. TENANT / OWNER ISOLATION (CÔ LẬP DỮ LIỆU ĐỐI TÁC OWNER)

- Idempotency Key Scope phải áp dụng triệt để nguyên tắc **Server Authority**:
- Server tự trích xuất `OwnerID` / `TenantContext` từ Auth Token hợp lệ của Server để bọc Key Scope. Tuyệt đối **không tin tưởng bất kỳ Tenant Header nào do Client tự gửi lên**.

---

## 22. OBSERVABILITY REQUIREMENTS (YÊU CẦU GIÁM SÁT VÀ TRUY VẾT)

- Hệ thống Yêu cầu ghi nhận Log kỹ thuật phía Server (Server Technical Logs) mỗi khi có sự kiện phát lại Idempotent Replay hoặc phát hiện xung đột trùng Key.
- *Lưu ý:* Việc lựa chọn công cụ giám sát (Datadog/ELK) giữ nguyên `TBD — Technology Agnostic`.

---

## 23. ARCHITECTURE OPTIONS (CÁC PHƯƠNG ÁN KIẾN TRÚC XEM XẾP)

| Phương Án (Option) | Mô Tả Ngữ Nghĩa (Semantic Description) | Ưu Điểm (Pros) | Nhược Điểm (Cons) |
|---|---|---|---|
| **Option A (Strict Replay)** | Trả lại chính xác Cached Response Envelope gốc cho tất cả các duplicate request hợp lệ. | Nhất quán 100% với Client, Client không cần xử lý logic riêng. | Cần không gian lưu trữ DTO response phía Backend. |
| **Option B (Status Only)** | Chỉ trả về thông báo trạng thái `200 OK` kèm `success: true` cho duplicate request. | Lưu trữ siêu nhẹ. | Phá vỡ Hợp đồng Response DTO của một số API lấy chi tiết entity. |
| **Option C (Conflict Reject)** | Từ chối tất cả duplicate request bằng `409 Conflict`. | Dễ triển khai. | Ép Client phải tự viết code catch lỗi 409 để gọi lại API GET. |

---

## 24. RECOMMENDED ARCHITECTURE (KẾT LUẬN ĐỀ XUẤT KIẾN TRÚC)

- **Đề Xuất Ưu Tiên (Recommended for Architecture Owner Review):** **Option A (Strict Replay)** đối với các API Category A (Tạo đơn `POST /bookings`, Thanh toán `POST /payments`).
- **Lý Do:** Đảm bảo tính minh bạch hoàn toàn cho Client. Khi mạng chập chờn và Client retry, Client nhận lại đúng `BookingResponse` DTO đã tạo trước đó mà không bị gián đoạn luồng trải nghiệm người dùng.

---

## 25. DECISIONS CLASSIFICATION (DANH MỤC PHÂN LOẠI QUYẾT ĐỊNH)

### DECIDED (Các Quyết Định Đã Được Phê Duyệt Nguồn Hỗ Trợ Trực Tiếp):
1. Idempotency & Safe Retry là một API Architecture Concern bắt buộc phải được quy chuẩn hóa cho hệ thống (`APPROVED`).
2. Các API Operations có nguy cơ đúp hiệu ứng nghiệp vụ (như Create Booking, Payment) phải được phân tích và có quy tắc thử lại (retry semantics) rõ ràng (`APPROVED`).
3. MoMo IPN Callback deduplication được xử lý bằng `momoTransId` thuộc Payment Integration Architecture theo `BR-PAY-001` (`APPROVED`).

### PROPOSED (Các Đề Xuất Kỹ Thuật Được Phê Duyệt Khung Thiết Kế):
1. Đề xuất phân loại API Operations theo 3 nhóm (Categories A, B, C).
2. Đề xuất quy tắc Idempotency Key Scope 3-Tuple: `(Authenticated Identity + Resource Endpoint + Idempotency-Key)`.
3. Đề xuất hành vi Trùng Key + Khác Payload -> Reject `400 Bad Request` (`IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`).
4. Đề xuất hành vi Trùng Key khi đang xử lý (In-Progress) -> Reject `409 Conflict` (`IDEMPOTENCY_REQUEST_IN_PROGRESS`).
5. Đề xuất kiểm tra Authorization (RBAC) trước khi tra cứu Idempotency Key.
6. Đề xuất áp dụng Option A (Strict Response Replay) cho Category A.
7. Đề xuất Yêu cầu Đồng bộ Logic (`Logical Atomicity Requirement`) giữa Business Effect và Idempotency State.

### TBD (Các Nội Dung Bảo Lưu Cho Hợp Đồng / Hạ Tầng Tiếp Theo):
1. **API-TBD-016:** Định dạng chuỗi Idempotency Key (`TBD — Task 01.06.04.06.02`).
2. **API-TBD-017:** Thời gian lưu trữ xóa sổ Key (Key Retention & Expiry Policy `TBD`).
3. **API-TBD-019:** Tên HTTP Header chính thức cho Idempotency Key và Replay Header (`TBD — Task 01.06.04.06.02`).
4. **API-TBD-020:** Danh mục Error Codes chính thức cho Idempotency trong Error Registry (`TBD — Task 01.06.04.06.02`).
5. **API-TBD-021:** Cơ chế lưu trữ và giao dịch hạ tầng cụ thể (`TBD — Infrastructure Architecture`).

---

## 26. TASK MAP RECONCILIATION DEFERRAL (DỜI ĐIỀU HOÀ TASK MAP TASK .09)

- Giữ nguyên trạng thái của **`TASK 01.06.04.09`**: `Official Task Name: UNKNOWN`, `Status: REFERENCED ONLY`.
- ⚠️ **Lưu ý:** Việc điều hòa Task Map (Task Map Reconciliation) cho sub-task `.09` chính thức được dời lại (Deferred) và chỉ được thực thi sau khi hoàn tất toàn bộ chuỗi Hợp đồng API Idempotency.

---

## 27. RISKS (CÁC RỦI RO KIẾN TRÚC)

- **Rủi ro bộ nhớ:** Lưu trữ cached response quá lâu có thể làm phình to bộ nhớ Backend -> Cần chính sách dọn dẹp Key hết hạn (Expiry Policy) hợp lý ở giai đoạn triển khai hạ tầng.

---

## 28. NON-GOALS (CÁC NỘI DUNG KHÔNG THỰC HIỆN TRONG TASK NÀY)

- ❌ KHÔNG chọn công nghệ lưu trữ (Cấm chọn Redis, DB tables, DynamoDB, Memory Cache).
- ❌ KHÔNG viết mã nguồn Middleware, Interceptor hay TypeScript class.
- ❌ KHÔNG tạo Business Rules mới cho Đặt sân hay Thanh toán.
- ❌ KHÔNG thay đổi Error Contract tại Task 12 hay Request/Response Contract tại Task 11.
- ❌ KHÔNG tự chốt tên HTTP Header chính thức (Dành cho Task `01.06.04.06.02`).
- ❌ KHÔNG tự ý xóa hay đổi tên Task `01.06.04.09` trong Task Map.

---

## 29. APPROVAL SECTION (PHẦN PHÊ DUYỆT BẮT BUỘC)

```text
================================================================================────────
                               APPROVAL DECISION SECTION
================================================================================────────

Current Status:
APPROVED

Proposed Specification:
Task 01.06.04.06.01 — Idempotency & Safe Retry Architecture Decision

Approval Decision:
APPROVED

Approved By:
Architecture Owner

Approved At:
2026-08-08

================================================================================────────
TASK 01.06.04.06.01 is APPROVED by the Architecture Owner.================================================================================────────
```

---
*Tài liệu Đặc tả Quyết định Kiến trúc Idempotency & Safe Retry được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
