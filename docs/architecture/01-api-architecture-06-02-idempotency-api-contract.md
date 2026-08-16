# API ARCHITECTURE — TASK 01.06.04.06.02
## IDEMPOTENCY API CONTRACT

**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.06.04.06.02 (Executable API Contract Specification)  
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
**Ngày cập nhật:** 2026-08-08  

---

## 1. PURPOSE (MỤC TIÊU TÀI LIỆU)

Tài liệu này xác định **Hợp đồng API giao thức Idempotency & Safe Retry chính thức (Idempotency API Contract Specification)** cho nhánh công việc `01.06.04.06.02`:

1. Chuyển thể các đề xuất kỹ thuật từ `01.06.04.06.01` dựa trên khung kiến trúc đã phê duyệt (`APPROVED`) thành các quy tắc Hợp đồng API có tính thực thi (Executable API Contract Decisions made in `06.02`).
2. Quy chuẩn hóa giao thức HTTP Header, định dạng Key Scope, ngữ nghĩa khớp Yêu cầu (Request Matching), quy tắc Thử lại (Retry Contract), và Phát lại Phản hồi (Response Replay).
3. Đảm bảo tính kế thừa 100% các hợp đồng API baseline đã chốt (`.01` đến `.05`).
4. **Quyền Hạn Hợp Đồng (Contract Authority):** Tài liệu `01.06.04.06.02` là **Nguồn Quyền Hạn Duy Nhất (Authoritative Contract)** cho giao thức HTTP Client-to-SportHub API Idempotency. Task `01.06.04.09` tiếp tục duy trì trạng thái `REFERENCED ONLY` trong Task Map và không tạo hợp đồng song song.
5. **Trạng thái:** Tài liệu đã đạt trạng thái **`APPROVED`** chính thức từ Architecture Owner / API Owner ngày 2026-08-08.

---

## 2. SCOPE (PHẠM VI HỢP ĐỒNG)

Hợp đồng này quy định quy tắc giao tiếp HTTP giữa Client (Customer Website, Owner Portal, Admin Portal) và Server (Backend Modular Monolith) trên toàn bộ các Endpoint thuộc danh mục API áp dụng Idempotency dưới base path `/api/v1`.

---

## 3. SOURCE OF TRUTH (NGUỒN SỰ THẬT QUY ĐỊNH)

Hợp đồng này bắt buộc tuân thủ và vận hành trên nền tảng:
- Quyết định Kiến trúc `01.06.04.06.01` (`APPROVED`).
- Bằng chứng Business Rules `BR-BOOK-003` (Giữ chỗ 10m slot), `BR-PAY-001` (MoMo Payment deduplication).
- Các hợp đồng baseline: `09-api-architectural-principles.md`, `10-api-versioning-and-naming.md`, `11-api-request-response-contract.md`, `12-api-error-contract.md`, `13-api-pagination-filtering-sorting-contract.md`.

---

## 4. RELATIONSHIP TO EXISTING API CONTRACTS (MỐI QUAN HỆ VỚI CÁC CONTRACT ĐÃ CHỐT)

- **Với `.01 Principles`:** Kế thừa nguyên tắc Stateless API và Thin Controller.
- **Với `.02 Versioning`:** Vận hành độc quyền dưới tiền tố `/api/v1`.
- **Với `.03 Request/Response`:** Kế thừa 100% cấu trúc Response Envelope `{"data": ...}`, JSON `camelCase`, ISO 8601 `UTC+07:00`, Money integer `VND`, và 8 Booking States chuẩn (`AVAILABLE`, `HOLDING`, `PAYMENT_PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `PAYMENT_FAILED`).
- **Với `.04 Error Contract`:** Tái sử dụng 100% cấu trúc Error Envelope `{"error": { "code": ..., "message": ... }}` và bảng ánh xạ HTTP Statuses.
- **Với `.05 Pagination`:** Không làm thay đổi hay can thiệp vào quy tắc phân trang `meta.pagination`.

---

## 5. APPLICABILITY (MA TRẬN ÁP DỤNG HỢP ĐỒNG API - VERIFIED ENDPOINTS)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        VERIFIED API CONTRACT APPLICABILITY                             │
├────────────────────────────┬────────┬───────────────┬──────────────────────────────────┤
│ API Operation / Resource   │ Method │ Idempotency   │ Phân Loại Ranh Giới (Evidence)   │
├────────────────────────────┼────────┼───────────────┼──────────────────────────────────┤
│ Create Booking             │ POST   │ REQUIRED      │ Category A: Risk duplicate hold  │
│ Initialize Payment         │ POST   │ REQUIRED      │ Category A: Risk duplicate charge│
│ Submit Owner Application   │ POST   │ REQUIRED      │ Category A: Risk duplicate app   │
├────────────────────────────┼────────┼───────────────┼──────────────────────────────────┤
│ Cancel Booking             │ POST   │ OPTIONAL      │ Category B: Mutating idempotent  │
│ Update Venue Details       │ PATCH  │ OPTIONAL      │ Category B: Idempotent REST update│
│ Remove Favorite Venue      │ DELETE │ OPTIONAL      │ Category B: Idempotent delete    │
├────────────────────────────┼────────┼───────────────┼──────────────────────────────────┤
│ Search / List Venues       │ GET    │ NOT APPLICABLE│ Category C: Read-only safe query │
│ Get Booking Detail         │ GET    │ NOT APPLICABLE│ Category C: Read-only safe query │
├────────────────────────────┼────────┼───────────────┼──────────────────────────────────┤
│ Future / Unverified APIs   │ TBD    │ TBD           │ Endpoint Verification Required   │
└────────────────────────────┴────────┴───────────────┴──────────────────────────────────┘
```

- **Quy Tắc Hợp Đồng (REQUIRED Enforcement):**
  - Đối với operations **`REQUIRED`** (Category A): Client **BẮT BUỘC (MUST)** truyền Header `Idempotency-Key`.
  - Nếu Client gửi Request thiếu Header `Idempotency-Key` tới API thuộc Category A, Server từ chối ngay lập tức với lỗi `HTTP 400 Bad Request` và mã lỗi `"MISSING_IDEMPOTENCY_KEY"`.
  - Đối với operations **`NOT APPLICABLE`** (`GET`): Server bỏ qua mọi Header Idempotency nếu Client tự gửi kèm.

---

## 6. HTTP HEADER CONTRACT (QUY ƯỚC DỰNG HEADER HTTP - CONTRACT DECISION 06.02)

- **Header Name:** `Idempotency-Key` (**CONTRACT DECISION — 06.02**).
- **Vị Trí:** Request Header.
- **Required/Optional:** Bắt buộc đối với Category A; Tùy chọn đối với Category B.
- **Xử Lý Khoảng Trắng:** Server tự động loại bỏ khoảng trắng đầu/cuối (Trim whitespace) trước khi tra cứu.
- **Giá Trị Rỗng (Empty Value):** Nếu Header có giá trị rỗng (`Idempotency-Key: ` hoặc `Idempotency-Key: ""`), Server từ chối ngay với lỗi `HTTP 400 Bad Request` (`INVALID_IDEMPOTENCY_KEY_FORMAT`).
- **Độ Dài Tối Đa:** 64 ký tự (**CONTRACT DECISION — 06.02**).
- **Bảng Ký Tự Cho Phép:** Ký tự in được ASCII (ASCII printable characters `0x21` đến `0x7E`, không bao gồm khoảng trắng).
- **Encoding:** UTF-8 / ASCII string.

---

## 7. KEY FORMAT (QUY CÁCH CHUỖI KEY - CONTRACT REQUIREMENT & RECOMMENDATION)

- **Contract Requirements:** Chuỗi `Idempotency-Key` phải mang tính Case-sensitive, có độ dài từ 16 đến 64 ký tự ASCII in được (`0x21`..`0x7E`, không chứa khoảng trắng).
- **Client Recommendation:** Client NÊN dùng định dạng `UUIDv4` (e.g. `9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`) hoặc chuỗi ngẫu nhiên có độ entropy cao. UUIDv4 là khuyến nghị kỹ thuật, không phải điều kiện bắt buộc duy nhất (Not a strict MUST).
- **Bảo Lưu Đặc Tả Mẫu Regex (TBD Register):** `TBD-IDEMP-001: Strict regex pattern enforcement for key format`.

---

## 8. KEY SCOPE (PHẠM VI NGUYÊN TỬ CỦA KEY SCOPE - CONTRACT DECISION 06.02)

Phạm vi nhận diện Idempotency Key được khóa cứng theo Tuple 3 thành phần (**CONTRACT DECISION — 06.02**, dựa trên khung đề xuất của `06.01`):

$$\text{Key Scope} = \text{Tuple}(\text{Authenticated Identity}, \text{Resource Endpoint}, \text{Idempotency-Key})$$

```text
┌────────────────────────────────────────────────────────────────────────┐
│               CONTRACT DECISION KEY SCOPE TUPLE (06.02)                │
│                                                                        │
│  ( authenticatedUserId , "POST /api/v1/bookings" , "Idempotency-Key" ) │
└────────────────────────────────────────────────────────────────────────┘
```

- **Ranh Giới Bảo Mật:**
  - Cùng Key + Cùng User ID + Cùng Endpoint ──> **Cùng thao tác Idempotent**.
  - Cùng Key + Khác User ID ──> **Hai thao tác ĐỘC LẬP** (Chống việc User B xem response của User A).
  - Cùng Key + Khác Endpoint ──> **Hai thao tác ĐỘC LẬP**.

---

## 9. REQUEST MATCHING (QUY TẮC KHỚP YÊU CẦU TRÙNG LẶP)

Yêu cầu được coi là **Yêu Cầu Trùng Lặp Hợp Lệ (Valid Duplicate Request)** khi và chỉ khi thỏa mãn đồng thời 4 điều kiện:
1. Cùng `Authenticated User ID` (Đã được xác thực qua Authorization Bearer Token).
2. Cùng `HTTP Method` và `Resource Path` (e.g. `POST /api/v1/bookings`).
3. Cùng chuỗi `Idempotency-Key`.
4. Cùng Request Payload (Khớp về cấu trúc JSON dữ liệu gửi lên).

---

## 10. DUPLICATE REQUEST CONTRACT (QUY TẮC PHÂN LUỒNG XỬ LÝ YÊU CẦU TRÙNG LẶP)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                DUPLICATE REQUEST FLOW CONTRACT (06.02)                 │
├───────────────────┬────────────────────────────────────────────────────┤
│ Trạng Thái Request│ Quy Tắc Phản Hồi Của Server (Server Response Contract) │
├───────────────────┼────────────────────────────────────────────────────┤
│ 1. First Request  │ Thực thi Use Case -> Trả kết quả Response Envelope gốc│
│ 2. In-Progress    │ Trả lỗi HTTP 409 Conflict (IDEMPOTENCY_IN_PROGRESS)│
│ 3. Completed      │ Phát lại Response Envelope gốc (Strict Replay)      │
│ 4. Client Error   │ Phát lại Response Lỗi 4xx gốc                       │
│ 5. Server Error   │ Cho phép thực thi lại Use Case mới (Clean Retry)   │
│ 6. Payload Change │ Trả lỗi HTTP 400 Bad Request (PAYLOAD_MISMATCH)   │
└───────────────────┴────────────────────────────────────────────────────┘
```

---

## 11. CONCURRENT REQUEST CONTRACT (QUY TẮC XỬ LÝ REQUEST SONG SONG - CONTRACT DECISION 06.02)

- Khi Request A và Request B mang cùng Key Scope tới Server gần như đồng thời (Concurrent Requests):
  - Request nào vào hệ thống trước sẽ giành quyền xử lý (**Canonical Request**).
  - Request đến sau trong khi Request đầu chưa xử lý xong sẽ bị từ chối ngay với mã lỗi **`HTTP 409 Conflict`** và `error.code = "IDEMPOTENCY_REQUEST_IN_PROGRESS"` (**CONTRACT DECISION — 06.02**, dựa trên khung đề xuất `06.01`).
  - Client nhận mã 409 NÊN chờ một khoảng thời gian (Exponential Backoff) rồi mới thử lại.

---

## 12. PAYLOAD MISMATCH CONTRACT (XỬ LÝ LỖI TRÙNG KEY KHÁC PAYLOAD - CONTRACT DECISION 06.02)

- Nếu Client phát lại một Request mang cùng `Idempotency-Key` nhưng Request Body bị thay đổi (Payload Mismatch):
  - Server ngắt tuyến xử lý ngay lập tức và trả về **`HTTP 400 Bad Request`** với `error.code = "IDEMPOTENCY_KEY_PAYLOAD_MISMATCH"` (**CONTRACT DECISION — 06.02**, dựa trên khung đề xuất `06.01`).
  - **Hướng dẫn Client:** Client BẮT BUỘC phải tạo một `Idempotency-Key` mới nếu muốn thực hiện một thao tác với dữ liệu khác.

---

## 13. RETRY CONTRACT (QUY TẮC THỬ LẠI DÀNH CHO CLIENT)

- **Nghĩa Vụ Của Client khi Thử Lại (Retry Same Operation):** Client BẮT BUỘC (MUST) tái sử dụng chính xác chuỗi `Idempotency-Key` cũ khi retry một thao tác chưa nhận được kết quả (do timeout hoặc rớt mạng).
- **Cấm Tạo Key Mới Khi Retry:** Client TUYỆT ĐỐI KHÔNG ĐƯỢC sinh `Idempotency-Key` mới khi phát lại cùng một thao tác nghiệp vụ có sẵn.
- **Tạo Key Mới Khi Thao Tác Mới:** Client BẮT BUỘC phải sinh `Idempotency-Key` mới khi người dùng bấm nút thực hiện một thao tác nghiệp vụ mới hoàn toàn.

---

## 14. COMPLETED REQUEST / RESPONSE REPLAY CONTRACT (HỢP ĐỒNG PHÁT LẠI PHẢN HỒI - CONTRACT DECISION 06.02)

- Khi Yêu cầu trùng lặp rơi vào trạng thái đã hoàn thành trước đó (Completed Request):
  - Backend thực hiện **Strict Response Replay (CONTRACT DECISION — 06.02)**.
  - Server trả lại chính xác HTTP Status Code gốc (`200 OK` hoặc `201 Created`) và Response Body gốc tuân thủ 100% Response Envelope `{"data": ...}` của Task 11.
  - **Replay Response Header Name:** `TBD-IDEMP-003: Replay Metadata Header Name (e.g. Idempotency-Replay: true is illustrative pending TBD-IDEMP-003)`.

---

## 15. FAILED REQUEST CONTRACT (QUY TẮC XỬ LÝ KHI YÊU CẦU GỐC BỊ LỖI)

1. **Business Failure (`4xx` ngoại trừ 401/403):** Nếu request gốc bị từ chối do lỗi nghiệp vụ (ví dụ: `422 Unprocessable Content` do hết slot sân), kết quả lỗi này được lưu vết và phát lại chính xác cho các duplicate requests tiếp theo.
2. **Validation Failure (`400 Bad Request`):** Được phát lại chính xác cấu trúc error envelope lỗi 400 gốc.
3. **Authorization Failure (`401` / `403`):** Không lưu vết Idempotency (Do thủ tục Auth chạy trước).
4. **Server Infrastructure Failure (`500 Internal Server Error`):** Không lưu vết kết quả thành công. Cho phép Client phát lại request để retry thực thi lại Use Case.

---

## 16. ERROR CONTRACT INTEGRATION (TÍCH HỢP HỢP ĐỒNG BÁO LỖI TASK 12)

Tất cả phản hồi lỗi liên quan đến Idempotency BẮT BUỘC phải tái sử dụng 100% cấu trúc Error Envelope của Task 12:

```json
{
  "error": {
    "code": "IDEMPOTENCY_KEY_PAYLOAD_MISMATCH",
    "message": "The provided Idempotency-Key has already been used with a different request payload.",
    "details": {
      "field": "Idempotency-Key",
      "issue": "Payload checksum mismatch"
    },
    "requestId": "req-idem-400-001"
  }
}
```

- ⚠️ **Lưu Ý Phân Định Quyền Hạn Mã Lỗi:** Các mã lỗi `MISSING_IDEMPOTENCY_KEY`, `INVALID_IDEMPOTENCY_KEY_FORMAT`, `IDEMPOTENCY_KEY_TOO_LONG`, `IDEMPOTENCY_REQUEST_IN_PROGRESS`, `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` là các mã lỗi **đề xuất cấp Hợp đồng 06.02 (Contract-level proposed codes — pending Error Registry reconciliation with Task 12)** và bảo lưu mã `TBD-IDEMP-004`.

---

## 17. AUTHORIZATION ORDERING CONTRACT (THỨ TỰ KIỂM TRA PHÂN QUYỀN - CONTRACT DECISION 06.02)

Thủ tục kiểm tra Phân quyền (Authorization & RBAC) **BẮT BUỘC CHẠY TRƯỚC** thủ tục tra cứu Idempotency Key (**CONTRACT DECISION — 06.02**, dựa trên đề xuất an ninh từ `06.01`):

```text
Incoming HTTP Request
       │
       ▼
1. Authentication & Authorization Check (RBAC)
       │ ── (Thất bại) ──> Return 401 Unauthorized / 403 Forbidden
       ▼ (Thành công)
2. Idempotency Key Lookup & Scope Matching
```

- **Đảm Bảo An Ninh:** Ngăn chặn User A cố tình gửi trùng Key của User B để lấy lại thông tin phản hồi của User B mà User A không có quyền truy cập.

---

## 18. TENANT / OWNER ISOLATION CONTRACT (CÔ LẬP DỮ LIỆU ĐỚI TÁC SERVER AUTHORITY)

- Hợp đồng Idempotency tuân thủ tuyệt đối nguyên tắc **Server Authority**.
- `OwnerID` và `TenantContext` dùng để bọc Key Scope BẮT BUỘC được trích xuất từ Authentication Token được Server ký hợp lệ.
- Server **TUYỆT ĐỐI BỎ QUA HOẶC TỪ CHỐI** các Custom Tenant Headers do Client tự gửi lên (như `X-Tenant-Id` hay `X-Owner-Id`).

---

## 19. VALIDATION CONTRACT (BẢNG QUY TẮC VERIFY KỸ THUẬT - CONTRACT DECISION 06.02)

| Tình Huống Validation | Điều Kiện Kích Hoạt | HTTP Status | Proposed Error Code (Pending TBD-IDEMP-004) |
|---|---|---|---|
| **Missing Required Key** | Endpoint Category A nhưng không có Header | `400 Bad Request` | `MISSING_IDEMPOTENCY_KEY` |
| **Malformed Key** | Key có chứa ký tự khoảng trắng hoặc ngoài ASCII | `400 Bad Request` | `INVALID_IDEMPOTENCY_KEY_FORMAT` |
| **Empty Key** | Header có giá trị rỗng | `400 Bad Request` | `INVALID_IDEMPOTENCY_KEY_FORMAT` |
| **Exceeds Max Length** | Key dài hơn 64 ký tự | `400 Bad Request` | `IDEMPOTENCY_KEY_TOO_LONG` |
| **In-Progress Conflict** | Key đang được xử lý bởi request khác | `409 Conflict` | `IDEMPOTENCY_REQUEST_IN_PROGRESS` |
| **Payload Mismatch** | Trùng Key nhưng nội dung Request Body khác | `400 Bad Request` | `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` |

---

## 20. LIFECYCLE & RETENTION CONTRACT (VÒNG ĐỜI VÀ THỜI GIAN LƯU TRỮ KEY)

- **Thời Điểm Kích Hoạt Key:** Key có hiệu lực ngay khi Request gốc bắt đầu đi vào Tầng Controller Boundary.
- **Thời Gian Hợp Lệ Của Key (Retention Period):** `TBD-IDEMP-002: Key Retention Period Specification` (Khoảng thời gian 24 giờ là khuyến nghị kỹ thuật, không phải điều kiện bắt buộc đã duyệt).
- **Hành Vi Khi Key Hết Hạn (After Expiration):** Sau khi hết thời gian lưu trữ, bản ghi Key bị xóa sổ. Nếu Client gửi lại Key đó, Server đối xử như một First Request mới hoàn toàn.

---

## 21. SECURITY CONTRACT (BẢO MẬT VÀ TOÀN VẸN DỮ LIỆU)

- **Tính Riêng Tư Của Key:** Idempotency Key không chứa dữ liệu nhạy cảm (không chứa thông tin cá nhân PII, mật khẩu hay token).
- **Log Masking:** Kỹ thuật ghi log hệ thống chỉ được log tối đa 8 ký tự đầu của `Idempotency-Key` kèm `requestId` để truy vết, tránh bộc lộ đầy đủ chuỗi key nếu key chứa thông tin nhạy cảm.

---

## 22. OBSERVABILITY CONTRACT (YÊU CẦU GIÁM SÁT THU THẬP LOG)

- Mọi sự kiện liên quan đến Idempotency (First Request, Replay Triggered, Conflict 409, Payload Mismatch 400) BẮT BUỘC phải đính kèm **`requestId`** chuẩn của Task 12 để phục vụ Tracing và Troubleshooting.
- **Log Event Classification:**
  - `IDEMPOTENCY_FIRST_SEEN`: Yêu cầu gốc lần đầu.
  - `IDEMPOTENCY_REPLAY_SUCCESS`: Phát lại phản hồi thành công.
  - `IDEMPOTENCY_CONFLICT_REJECTED`: Từ chối do trùng key đang chạy.
  - `IDEMPOTENCY_MISMATCH_REJECTED`: Từ chối do đổi payload.

---

## 23. BOOKING INTEGRATION CONTRACT (HỢP ĐỒNG ÁP DỤNG NGHIỆP VỤ ĐẶT SÂN)

- **Endpoint Tạo Đơn Đặt Sân:** `POST /api/v1/bookings` (Bắt buộc Category A).
- **Luồng Xử Lý Hợp Đồng:**
  - First Request với `Idempotency-Key: idem-book-101` ──> Backend tạo đơn, giữ chỗ 10m (`status: HOLDING`), trả về `201 Created` kèm Booking DTO theo `BR-BOOK-003`.
  - Client bị rớt mạng, retry lại đúng `POST /api/v1/bookings` với `Idempotency-Key: idem-book-101`:
    - Backend tra cứu Key Scope, phát hiện Case 3 (Completed).
    - Backend thực hiện Response Replay, trả lại `201 Created` (hoặc `200 OK`) kèm chính Booking DTO đã giữ chỗ trước đó (`status: HOLDING`).
    - **Không tạo đơn thứ 2, không báo lỗi trùng slot `BOOKING_SLOT_OCCUPIED` cho chính Client đó.**

---

## 24. PAYMENT INTEGRATION CONTRACT (HỢP ĐỒNG ÁP DỤNG NGHIỆP VỤ THANH TOÁN)

- **Luồng Client Tạo Giao Dịch Thanh Toán (`POST /api/v1/payments`):**
  - Áp dụng Idempotency API Contract này với `Idempotency-Key`. Ngăn chặn việc Client tạo đúp 2 đường link thanh toán MoMo cho cùng một đơn đặt sân.
- **Luồng MoMo IPN Callback (`POST /api/v1/payments/momo-ipn`):**
  - **Tách Rời Ranh Giới:** Luồng MoMo IPN Callback sử dụng **`momoTransId`** làm khóa lọc trùng theo Hợp đồng Kiến trúc Tích hợp Thanh toán (`BR-PAY-001`). Hợp đồng HTTP `Idempotency-Key` này KHÔNG thay thế cho `momoTransId`.

---

## 25. EXTERNAL SIDE EFFECTS CONTRACT (RANH GIỚI TÁC ĐỘNG PHỤ BÊN NGOÀI)

- Hợp đồng Idempotency API này bảo vệ sự đóng băng hiệu ứng của **Thao Tác Nghiệp Vụ Chính (Primary API Operation)**.
- **Downstream Notifications & Emails:** Việc gửi Email OTP, Email xác nhận đơn hay Push Notification qua dịch vụ bên ngoài được quản lý bởi cơ chế Deduplication riêng thuộc phân hệ Notification Architecture. Response Replay tại giao thức API sẽ KHÔNG kích hoạt gửi lại Email lần 2.

---

## 26. CONCURRENCY VS IDEMPOTENCY INTERACTION CONTRACT

```text
Client A (User 1) ──> POST /bookings (Key: A1) ──┐
                                                 ├──> API Idempotency Layer (Deduplicates User 1 retry)
Client A (User 1 Retry) ──> POST /bookings (A1) ──┘
                                                 
Client B (User 2) ──> POST /bookings (Key: B1) ───> Resource-level Concurrency Control (Separate Concern)
```

- Idempotency xử lý lặp trùng từ **cùng một người dùng/client**.
- Resource-level Concurrency Control là một **Vấn đề Kiến trúc Tách biệt (Separate Domain/Data Architecture Concern)** dùng để xử lý tranh chấp slot giữa hai người dùng khác nhau.

---

## 27. API EXAMPLES (8 VÍ DỤ MINH HỌA HỢP ĐỒNG CHI TIẾT)

### Example 1: First Successful Request (Yêu cầu gốc thành công)
```http
POST /api/v1/bookings HTTP/1.1
Host: api.sporthub.vn
Authorization: Bearer eyJhbGciOi...
Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
Content-Type: application/json

{
  "courtId": "court-123",
  "bookingDate": "2026-08-10",
  "startTime": "08:00",
  "endTime": "09:00"
}
```
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "data": {
    "id": "book-777",
    "courtId": "court-123",
    "status": "HOLDING",
    "totalAmount": { "amount": 150000, "currency": "VND" },
    "createdAt": "2026-08-08T19:25:00+07:00"
  }
}
```

---

### Example 2: Retry After Lost Response (Thử lại sau khi rớt kết quả)
```http
POST /api/v1/bookings HTTP/1.1
Host: api.sporthub.vn
Authorization: Bearer eyJhbGciOi...
Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
Content-Type: application/json

{
  "courtId": "court-123",
  "bookingDate": "2026-08-10",
  "startTime": "08:00",
  "endTime": "09:00"
}
```
```http
HTTP/1.1 201 Created
Idempotency-Replay: true
Content-Type: application/json

{
  "data": {
    "id": "book-777",
    "courtId": "court-123",
    "status": "HOLDING",
    "totalAmount": { "amount": 150000, "currency": "VND" },
    "createdAt": "2026-08-08T19:25:00+07:00"
  }
}
```
*(Lưu ý: Header `Idempotency-Replay: true` mang tính minh họa pending TBD-IDEMP-003).*

---

### Example 3: Duplicate Completed Request (Gửi lại khi đã xong)
*(Nhận lại chính xác Response Envelope gốc kèm Header `Idempotency-Replay: true` minh họa như Example 2).*

---

### Example 4: Concurrent Duplicate Request (Gửi trùng khi request gốc đang chạy)
```http
POST /api/v1/bookings HTTP/1.1
Host: api.sporthub.vn
Authorization: Bearer eyJhbGciOi...
Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
```
```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "error": {
    "code": "IDEMPOTENCY_REQUEST_IN_PROGRESS",
    "message": "A request with the same Idempotency-Key is currently being processed. Please wait.",
    "requestId": "req-idem-409-001"
  }
}
```

---

### Example 5: Same Key + Different Payload (Trùng Key nhưng đổi dữ liệu)
```http
POST /api/v1/bookings HTTP/1.1
Host: api.sporthub.vn
Authorization: Bearer eyJhbGciOi...
Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
Content-Type: application/json

{
  "courtId": "court-999",
  "bookingDate": "2026-08-12",
  "startTime": "10:00",
  "endTime": "11:00"
}
```
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": {
    "code": "IDEMPOTENCY_KEY_PAYLOAD_MISMATCH",
    "message": "The provided Idempotency-Key has already been used with a different request payload.",
    "details": {
      "field": "Idempotency-Key",
      "issue": "Payload mismatch for existing key"
    },
    "requestId": "req-idem-400-002"
  }
}
```

---

### Example 6: Same Key + Different Identity (Trùng Key nhưng khác User)
- User B gửi `Idempotency-Key: 9b1deb4d-...` trùng với User A trước đó.
- Key Scope nhận diện User B là một Scope hoàn toàn mới `(UserB, POST /bookings, Key)`.
- Backend đối xử như First Request cho User B (Không trả lại đơn của User A).

---

### Example 7: Same Key + Different Endpoint (Trùng Key nhưng khác API Path)
- User A gửi `Idempotency-Key: 9b1deb4d-...` lên `POST /api/v1/payments`.
- Key Scope nhận diện Endpoint mới `(UserA, POST /payments, Key)`.
- Backend đối xử như First Request cho Endpoint Payments (Không trả lại đơn từ Endpoint Bookings).

---

### Example 8: Missing Key on Category A Endpoint (Thiếu Header ở API bắt buộc)
```http
POST /api/v1/bookings HTTP/1.1
Host: api.sporthub.vn
Authorization: Bearer eyJhbGciOi...
```
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": {
    "code": "MISSING_IDEMPOTENCY_KEY",
    "message": "The Idempotency-Key header is required for this endpoint.",
    "details": {
      "field": "Idempotency-Key",
      "issue": "Header missing"
    },
    "requestId": "req-idem-400-003"
  }
}
```

---

## 28. CONTRACT MATRIX (BẢNG TỔNG HỢP QUY TẮC HỢP ĐỒNG API CHI TIẾT)

| Mã Quy Tắc (Rule ID) | Nội Dung Quy Tắc Hợp Đồng (Contract Decision) | Căn Cứ / Contract Authority | Trạng Thái |
|---|---|---|---|
| **RULE-IDEMP-01** | Header Naming = `Idempotency-Key` (ASCII, max 64 chars, trimmed). | Contract Decision in 06.02 (based on 06.01 approved framework) | **DECIDED** |
| **RULE-IDEMP-02** | Key Scope = `Tuple(Authenticated User ID, Endpoint, Key)`. | Contract Decision in 06.02 (based on 06.01 proposed framework) | **DECIDED** |
| **RULE-IDEMP-03** | Mutating API Category A bắt buộc (MUST) gửi `Idempotency-Key`. Missing -> 400 Bad Request (`MISSING_IDEMPOTENCY_KEY`). | Contract Decision in 06.02 (based on 06.01 framework) | **DECIDED** |
| **RULE-IDEMP-04** | Response Replay áp dụng Option A (Strict Replay exact envelope). | Contract Decision in 06.02 (based on 06.01 proposed framework) | **DECIDED** |
| **RULE-IDEMP-05** | Request đang xử lý -> Trả `HTTP 409 Conflict` (`IDEMPOTENCY_REQUEST_IN_PROGRESS`). | Contract Decision in 06.02 (based on 06.01 proposed framework) | **DECIDED** |
| **RULE-IDEMP-06** | Trùng Key khác Payload -> Trả `HTTP 400 Bad Request` (`IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`). | Contract Decision in 06.02 (based on 06.01 proposed framework) | **DECIDED** |
| **RULE-IDEMP-07** | Phân quyền RBAC bắt buộc chạy TRƯỚC thủ tục tra cứu Key. | Contract Decision in 06.02 (based on 06.01 security proposal) | **DECIDED** |
| **RULE-IDEMP-08** | Client retry BẮT BUỘC dùng lại Key cũ; cấm tạo Key mới cho cùng thao tác. | Contract Decision in 06.02 (based on 06.01 retry principles) | **DECIDED** |
| **RULE-IDEMP-09** | MoMo IPN Callback deduplication dùng `momoTransId`. | Approved Architecture Baseline (`BR-PAY-001`, Task 06.01) | **APPROVED BASELINE** |
| **RULE-IDEMP-10** | Replay Metadata Response Header Name (`Idempotency-Replay`). | TBD-IDEMP-003 | **TBD** |
| **RULE-IDEMP-11** | Exact Strict Regex Pattern cho Key String validation. | TBD-IDEMP-001 | **TBD** |
| **RULE-IDEMP-12** | Key Retention & Expiry Policy. | TBD-IDEMP-002 | **TBD** |

---

## 29. TBD REGISTER (DANH MỤC CÁC MỤC BẢO LƯU CHƯA CHỐT)

| TBD ID | Mô Tả Mục Bảo Lưu (Description) | Lý Do Bảo Lưu | Blocking? | Owner | Target Task |
|---|---|---|---|---|---|
| **`TBD-IDEMP-001`** | Strict Regex Pattern cho Idempotency Key String | Cần thống nhất thư viện Validator của Frontend & Backend | No | API Team | Task 01.07.01 |
| **`TBD-IDEMP-002`** | Key Retention & Expiry Policy (Khuyến nghị 24h) | Phụ thuộc vào năng lực bộ nhớ hạ tầng Backend | No | Infra Team | Task 01.08.01 |
| **`TBD-IDEMP-003`** | Tên Response Replay Header chính thức (`Idempotency-Replay`) | Chờ review bổ sung từ API Owner | No | API Owner | Task 01.06.04.06.03 |
| **`TBD-IDEMP-004`** | Đăng ký chính thức các mã lỗi Idempotency vào Error Registry | Cần sync bổ sung với Task `12-api-error-contract.md` | No | API Owner | Task 01.06.04.06.03 |
| **`TBD-IDEMP-005`** | Xử lý Task Map Reconciliation cho Sub-task `.09` | Chờ hoàn tất toàn bộ chuỗi Task `.06.xx` | No | Architecture Owner | Task 01.06.04 Task Map Update |

---

## 30. NON-GOALS (CÁC NỘI DUNG KHÔNG THỰC HIỆN TRONG HỢP ĐỒNG NÀY)

- ❌ KHÔNG chọn công nghệ triển khai (Cấm chọn Redis, DB table, Memory Cache, Lock library).
- ❌ KHÔNG tạo DB schema hay ORM Model entities.
- ❌ KHÔNG viết mã nguồn TypeScript, Interceptor, hay Middleware.
- ❌ KHÔNG tự ý thay đổi hay làm lệch các hợp đồng baseline `01.06.04.01` đến `01.06.04.05`.
- ❌ KHÔNG tự thay đổi hay đổi tên Task `01.06.04.09` trong Task Map.
- ❌ KHÔNG tự động chuyển trạng thái thành `APPROVED`.

---

## 31. APPROVAL SECTION (PHẦN PHÊ DUYỆT BẮT BUỘC)

```text
================================================================================────────
                               APPROVAL DECISION SECTION
================================================================================────────

Current Status:        APPROVED

Approval Decision:     APPROVED

Approved By:           Architecture Owner / API Owner

Approved At:           2026-08-08

================================================================================────────
TASK 01.06.04.06.02 IS APPROVED BY ARCHITECTURE OWNER / API OWNER ON 2026-08-08.
================================================================================────────
```

---
*Tài liệu Đặc tả Hợp đồng API Idempotency được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
