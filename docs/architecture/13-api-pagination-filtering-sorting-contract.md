# TÀI LIỆU HỢP ĐỒNG PHÂN TRANG, LỌC VÀ SẮP XẾP API (API PAGINATION / FILTERING / SORTING CONTRACT SPECIFICATION)
**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.06.04.05 (Micro-Corrected Revision)  
**Trạng thái:** Standardized Architecture Specification  
**Tham chiếu nguồn:**  
- [01-actors-and-permissions.md](file:///e:/SportHubAI/docs/requirements/01-actors-and-permissions.md) (APPROVED)  
- [02-use-cases-and-user-flows.md](file:///e:/SportHubAI/docs/requirements/02-use-cases-and-user-flows.md) (APPROVED)  
- [03-functional-requirements.md](file:///e:/SportHubAI/docs/requirements/03-functional-requirements.md) (APPROVED)  
- [04-business-rules.md](file:///e:/SportHubAI/docs/requirements/04-business-rules.md) (APPROVED)  
- [05-data-model.md](file:///e:/SportHubAI/docs/requirements/05-data-model.md) (APPROVED)  
- [06-system-architecture.md](file:///e:/SportHubAI/docs/architecture/06-system-architecture.md) (APPROVED)  
- [07-frontend-architecture.md](file:///e:/SportHubAI/docs/architecture/07-frontend-architecture.md) (APPROVED)  
- [08-backend-architecture.md](file:///e:/SportHubAI/docs/architecture/08-backend-architecture.md) (APPROVED)  
- [09-api-architectural-principles.md](file:///e:/SportHubAI/docs/architecture/09-api-architectural-principles.md) (APPROVED)  
- [10-api-versioning-and-naming.md](file:///e:/SportHubAI/docs/architecture/10-api-versioning-and-naming.md) (APPROVED)  
- [11-api-request-response-contract.md](file:///e:/SportHubAI/docs/architecture/11-api-request-response-contract.md) (APPROVED)  
- [12-api-error-contract.md](file:///e:/SportHubAI/docs/architecture/12-api-error-contract.md) (APPROVED)  
**Ngày cập nhật:** 2026-08-08  

---

## 1. PURPOSE (MỤC TIÊU TÀI LIỆU)

Tài liệu này định nghĩa và **chốt khóa duy nhất** Hợp đồng API Công khai (Public API Contract) cho các tính năng:
1. **Phân trang (Pagination)**
2. **Bộ lọc dữ liệu (Filtering)**
3. **Sắp xếp (Sorting)**

áp dụng thống nhất trên tất cả các danh mục tài liệu công khai (Collection Endpoints) của hệ thống SportHubAI.

Mục tiêu chính:
1. Chuẩn hóa cấu trúc tham số truy vấn (Query Parameters) và metadata phân trang trong vỏ phản hồi `{"data": [...], "meta": { "pagination": { ... } }}`.
2. Quy định cơ chế phân trang dựa trên số trang (`Page-based / Offset Pagination`) 1-indexed, giới hạn định mức `pageSize` mặc định và tối đa.
3. Chuẩn hóa cú pháp lọc bằng `camelCase` và cú pháp sắp xếp `sort=field:dir` (`asc` / `desc`).
4. Thiết lập quy tắc An toàn An ninh và Danh sách Trắng (Whitelist Boundary): Từ chối các tham số lọc/sắp xếp không hợp lệ (Reject 400 Bad Request) và bảo vệ tuyệt đối ranh giới phân quyền dữ liệu.

---

## 2. SCOPE (PHẠM VI ÁP DỤNG)

- **Phạm vi Phủ sóng:** Áp dụng bắt buộc cho tất cả các API trả về Tập hợp Tài nguyên (Collection Endpoints, như `GET /api/v1/venues`, `GET /api/v1/bookings`, `GET /api/v1/courts`) dưới đường dẫn `/api/v1`.
- **Giới hạn Ranh giới:**
  - KHÔNG áp dụng cho các API trả về Tài nguyên Đơn (Single Resource Endpoints, như `GET /api/v1/venues/{venueId}`).
  - KHÔNG viết mã nguồn triển khai SQL queries, Query Builder, ORM indexes, hay Full-text Search Engine (Elasticsearch).

---

## 3. SOURCE OF TRUTH (NGUỒN SỰ THẬT VÀ TÍNH KẾ THỪA)

Tài liệu này kế thừa và tuân thủ tuyệt đối các quyết định đã `APPROVED`:

| Thành Phần Kiến Trúc | Quyết Định Đã APPROVED | Giới Hạn Tương Tác Pagination/Filter/Sort Contract |
|---|---|---|
| **API Base Path** | `/api/v1` | Áp dụng chung cho tất cả các Collection Endpoints |
| **Success Envelope** | `{"data": [...], "meta": {}}` | Tái sử dụng và mở rộng đối tượng `meta.pagination` |
| **Unknown Fields** | Reject -> 400 Bad Request | Filter/Sort field không nằm trong Whitelist bị từ chối 400 |
| **Date/Time Contract** | `YYYY-MM-DD` / `ISO 8601` | Lọc theo thời gian tuân thủ Múi giờ Việt Nam `UTC+07:00` |
| **Error Contract** | `{"error": { "code": ... }}` | Tái sử dụng 100% Error Envelope từ Task 01.06.04.04 |
| **Security Boundary** | RBAC + Owner Isolation | Filter/Sort không bao giờ được phép bypass authorization |

---

## 4. COLLECTION RESPONSE INTEGRATION (TÍCH HỢP VỚI CẤU TRÚC PHẢN HỒI TẬP HỢP)

Kế thừa chuẩn Hợp đồng Phản hồi tại Task 01.06.04.03, tất cả các API Collection khi có phân trang bắt buộc phải bọc dữ liệu trong cấu trúc duy nhất:

```json
{
  "data": [
    {
      "id": "item-1",
      "propertyName": "value1"
    },
    {
      "id": "item-2",
      "propertyName": "value2"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 85,
      "totalPages": 5
    }
  }
}
```

---

## 5. PAGINATION STRATEGY (CHIẾN LƯỢC PHÂN TRANG CHUẨN HÓA)

- **Chiến Lược Chốt Duy Nhất:** Hệ thống chốt duy nhất Chiến lược Phân trang Dựa trên Số trang (**Page-based / Offset Pagination**) cho toàn bộ các API Collection của hệ thống MVP.
- **Tính Nhất Quán:** Tất cả các Collection Endpoints bắt buộc dùng chung tham số `page` và `pageSize`. Tuyệt đối không pha trộn Cursor Pagination (`?cursor=...`) hoặc `offset`/`limit` tùy tiện trong hợp đồng `/api/v1`.

---

## 6. PAGE NUMBERING RULES (QUY TẮC ĐÁNH SỐ TRANG)

- **Đánh Số Trang 1-Indexed:** Chỉ số trang `page` **bắt đầu từ 1** (`page=1` đại diện cho trang đầu tiên).
- **Tham Số Chuyển Lên:** `?page=1`
- ❌ **CẤM:** Không sử dụng 0-indexed (`pageIndex=0`) trên đường dẫn URL công khai để tránh gây nhầm lẫn cho Client.

---

## 7. PAGE SIZE & LIMITS (GIỚI HẠN KÍCH THƯỚC TRANG)

Tất cả các API Collection đều quy định rõ hạn ngạch kích thước trang:

| Tham Số (Query Param) | Tên Tham Số | Giá Trị Mặc Định (Default) | Giá Trị Tối Thiểu (Min) | Giá Trị Tối Đa (Max) |
|---|---|---|---|---|
| **Số Trang** | `page` | `1` | `1` | Không giới hạn |
| **Kích Thước Trang** | `pageSize` | `20` | `1` | `100` |

### Quy Tắc Xử Lý Hạn Ngạch Vượt Giới Hạn:
- Nếu Client truyền `page < 1` hoặc `pageSize < 1`: Backend **từ chối ngay (Reject 400 Bad Request)** kèm mã lỗi `VALIDATION_ERROR` hoặc `INVALID_REQUEST_FORMAT`.
- Nếu Client truyền `pageSize > 100` (Vượt quá giới hạn tối đa `Max=100`): Backend **từ chối (Reject 400 Bad Request)** để ép Client tuân thủ hạn ngạch, bảo vệ hiệu năng hệ thống.

---

## 8. PAGINATION METADATA STRUCTURE (CẤU TRÚC ĐỐI TƯỢNG METADATA PHÂN TRANG)

Đối tượng `meta.pagination` trong vỏ phản hồi bắt buộc phải chứa đúng 4 thuộc tính chuẩn hóa:

| Thuộc Tính Meta | Kiểu Dữ Liệu | Diễn Giải Semantics |
|---|---|---|
| `page` | `integer` | Chỉ số trang hiện tại đang được phản hồi (1-indexed). |
| `pageSize` | `integer` | Số lượng bản ghi tối đa được lấy trên trang này. |
| `totalItems` | `integer` | Tổng số lượng bản ghi thỏa mãn điều kiện lọc trong cơ sở dữ liệu. |
| `totalPages` | `integer` | Tổng số trang khả dụng (`Math.ceil(totalItems / pageSize)`). |

---

## 9. EMPTY COLLECTION RESPONSE (QUY ƯỚC PHẢN HỒI TẬP HỢP RỐNG VỚI META)

Khi danh sách tìm kiếm không có bản ghi nào thỏa mãn (`totalItems = 0`), Backend vẫn phản hồi trạng thái `HTTP 200 OK` kèm mảng rỗng và metadata chuẩn:

```json
{
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 0,
      "totalPages": 0
    }
  }
}
```

- ❌ **CẤM:** Tuyệt đối không trả về lỗi `404 Not Found` khi tập hợp rỗng.

---

## 10. SINGLE RESOURCE VS COLLECTION SCOPE (RANH GIỚI ÁP DỤNG PHÂN TRANG)

- ✅ **Áp dụng Phân trang:** Các API truy vấn danh sách (e.g. `GET /api/v1/venues`, `GET /api/v1/branches/{branchId}/courts`, `GET /api/v1/bookings`).
- ❌ **KHÔNG áp dụng Phân trang:** Các API truy vấn chi tiết một tài nguyên (e.g. `GET /api/v1/venues/{venueId}`, `GET /api/v1/bookings/{bookingId}`). Các API tài nguyên đơn chỉ phản hồi `{"data": { ... }}` không có đối tượng `meta.pagination`.

---

## 11. FILTERING PRINCIPLES (NGUYÊN TẮC BỘ LỌC DỮ LIỆU)

- **Định Dạng Vận Chuyển:** Toàn bộ các tiêu chí lọc dữ liệu bắt buộc phải truyền qua **URL Query Parameters** của phương thức HTTP `GET`.
- ❌ **CẤM:** Không truyền dữ liệu lọc trong Request Body cho phương thức HTTP `GET`.

---

## 12. FILTER PARAMETER NAMING (QUY ƯỚC ĐẶT TÊN THAM SỐ LỌC)

Tất cả các tham số lọc trên URL phải tuân thủ chuẩn **`camelCase`** tương thích với Naming Convention tại Task 10:

- `GET /api/v1/venues?city=Hanoi&sportType=BADMINTON`
- `GET /api/v1/bookings?branchId=branch-101&status=CONFIRMED`
- ❌ **CẤM:** Không dùng `branch_id` (snake_case), không dùng `branch-id` (kebab-case) trong Query Parameters.

---

## 13. FILTER OPERATORS (QUY ƯỚC TOÁN TỬ LỌC DỮ LIỆU)

- **Mặc Định Bằng (Implicit Equality):** Đối với giai đoạn MVP, các tham số lọc đơn giản mặc định mang ý nghĩa toán tử **BẰNG (`Equal =`)**:
  - `?status=CONFIRMED` tương đương với `status EQUALS CONFIRMED`.
  - `?branchId=branch-101` tương đương với `branchId EQUALS branch-101`.
- **Giới Hạn Cú Pháp:** Không tự ý phát minh các cú pháp toán tử phức tạp trên URL (như `status.eq=...` hay `filter[status]=...`) khi không có yêu cầu đặc thù được phê duyệt.

---

## 14. MULTIPLE FILTERS EVALUATION (QUY TẮC KẾT HỢP NHIỀU BỘ LỌC - LOGICAL AND)

Khi Client truyền đồng thời nhiều tham số lọc trên URL, hệ thống bắt buộc phải đánh giá theo phép toán logic **`AND`** (Tất cả các điều kiện phải đồng thời thỏa mãn):

```text
GET /api/v1/bookings?branchId=branch-101&status=CONFIRMED
──> Kết quả: Tìm các Booking thuộc branch-101 VÀ có status = CONFIRMED.
```

- ❌ **CẤM:** Không tự hỗ trợ phép toán `OR` trong MVP khi chưa có yêu cầu nghiệp vụ phê duyệt.

---

## 15. MULTIPLE VALUES FILTERING (LỌC NHIỀU GIÁ TRỊ TRÊN MỘT TRƯỜNG)

- **Cú Pháp Phẩy (Comma-separated Values):** Nếu một trường hỗ trợ lọc theo danh sách nhiều giá trị tùy chọn, cú pháp truyền trên URL sử dụng dấu phẩy `,`:
  ```text
  GET /api/v1/bookings?status=CONFIRMED,HOLDING
  ```
- **Ranh Giới Whitelist Bắt Buộc:** Việc lọc nhiều giá trị (Multiple-value filtering) **CHỈ ĐƯỢC HỖ TRỢ CHO CÁC TRƯỜNG ĐƯỢC CHỈ ĐỊNH RÕ TRONG WHITELIST** của Resource Contract. Không mặc định mọi trường filter đều hỗ trợ truyền nhiều giá trị.
- **Trạng Thái TBD:** Các trường cụ thể hỗ trợ lọc nhiều giá trị giữ nguyên `TBD — Defined per Resource Contract`.
- ❌ **CẤM MULTI-SYNTAX:** Không dùng cú pháp mảng ngoặc vuông `status[]=CONFIRMED&status[]=HOLDING`. Không thêm syntax thứ hai.

---

## 16. DATE & TIME RANGE FILTERING (QUY ƯỚC LỌC THEO KHOẢNG THỜI GIAN)

Các tham số lọc theo khoảng thời gian phải tuân thủ tuyệt đối Chuẩn Date/Time tại Task 11 (`YYYY-MM-DD` cho Date, ISO 8601 `UTC+07:00` cho DateTime):

```text
GET /api/v1/bookings?startDate=2026-08-10&endDate=2026-08-15
```

- **Tên Tham Số Chốt Duy Nhất Cho Khoảng Ngày:** Bắt buộc sử dụng duy nhất cặp tham số **`startDate` & `endDate`**.
- ❌ **CẤM:** Tuyệt đối không dùng `fromDate` / `toDate`.
- **Khoảng Giờ Trong Ngày:** Cặp tham số `startTime` & `endTime` (`HH:mm:ss`).
- ❌ **CẤM:** Tuyệt đối không tự chuyển đổi múi giờ ngoài múi giờ chuẩn Việt Nam `UTC+07:00`.

---

## 17. FILTER WHITELIST PRINCIPLE (QUY TẮC DANH SÁCH TRẮNG BỘ LỌC)

- **Chỉ Cho Phép Trường Được Expose:** Client **CHỈ ĐƯỢC PHÉP** lọc theo các thuộc tính đã được Public API Contract quy định công khai cho endpoint đó.
- ❌ **CẤM BỘ LỌC HẠ TẦNG NỘI BỘ:** Cấm tuyệt đối không cho phép Client lọc theo các cột cơ sở dữ liệu nội bộ (Database internal columns), chuỗi băm mật khẩu (`passwordHash`), dữ liệu Audit nội bộ chưa expose, hay các trường thuộc bảng ORM không thuộc hợp đồng.

---

## 18. UNKNOWN FILTER BEHAVIOR (HÀNH VI XỬ LÝ THAM SỐ LỌC KHÔNG XÁC ĐỊNH)

Khi Client truyền một tham số lọc nằm ngoài Danh sách trắng (Unknown Filter Parameter):

```text
GET /api/v1/venues?unknownCustomFilter=xyz
```

- **Quy Tắc Hợp Đồng API Công Khai:** Backend lập tức từ chối và phản hồi lỗi **`HTTP 400 Bad Request`** kèm mã lỗi `UNKNOWN_REQUEST_FIELD` hoặc `VALIDATION_ERROR` (Khớp 100% với quy tắc Reject tại Task 11).
- ❌ **CẤM BỎ QUA ÂM THẦM:** Cấm tuyệt đối việc bỏ qua (silently ignore) tham số lọc thừa mà vẫn trả về danh sách dữ liệu.

---

## 19. INVALID FILTER VALUE HANDLING (XỬ LÝ GIÁ TRỊ LỌC KHÔNG HỢP LỆ)

API Contract phân định rạch ròi 2 nhóm lỗi khi Client truyền giá trị lọc không hợp lệ:

1. **Malformed / Invalid Query Parameter Syntax (`HTTP 400 Bad Request`):** 
   - Lỗi do cú pháp truy vấn bị sai định dạng (Ví dụ: `?page=abc`, `?sort=createdAt` thiếu cú pháp `:direction`).
   - Backend trả về `HTTP 400 Bad Request` kèm mã lỗi `INVALID_REQUEST_FORMAT` hoặc `UNKNOWN_REQUEST_FIELD`.
2. **Valid Query Syntax But Invalid Semantic Value (`HTTP 422 Unprocessable Content`):**
   - Cú pháp truy vấn đúng nhưng giá trị dữ liệu vi phạm kiểm tra ngữ nghĩa/kiểu thuộc tính (Ví dụ: `?status=INVALID_ENUM_VALUE` hoặc `?startDate=not-a-date`).
   - Backend trả về `HTTP 422 Unprocessable Content` kèm mã lỗi `VALIDATION_ERROR`.

- ❌ **CẤM:** Không để một lỗi ngữ nghĩa bị trả về 2 HTTP status code bất định tùy thuộc vào implementation.

---

## 20. SORTING PRINCIPLES (NGUYÊN TẮC SẮP XẾP DỮ LIỆU)

- **Định Dạng Vận Chuyển:** Thao tác sắp xếp dữ liệu được truyền qua tham số truy vấn duy nhất trên URL: **`sort`**.

---

## 21. SORT PARAMETER & SYNTAX (CÚ PHÁP SẮP XẾP CHUẨN HÓA)

Chốt khóa duy nhất Cú pháp Sắp xếp trên URL theo dạng **`sort=fieldName:direction`**:

```text
GET /api/v1/venues?sort=createdAt:desc
GET /api/v1/courts?sort=courtName:asc
```

- **Tên Trường:** Viết theo chuẩn `camelCase` của DTO Response.
- **Dấu Phân Cách:** Dấu hai chấm `:`.
- ❌ **CẤM MULTI-SYNTAX:** Không dùng dấu trừ (e.g. `sort=-createdAt`), không dùng 2 params rời (e.g. `sortField=createdAt&sortDir=desc`).

---

## 22. SORT DIRECTIONS (HƯỚNG SẮP XẾP HỢP LỆ)

Chỉ hỗ trợ duy nhất 2 giá trị hướng sắp xếp:

- **`asc`:** Sắp xếp tăng dần (Ascending).
- **`desc`:** Sắp xếp giảm dần (Descending).

```text
GET /api/v1/bookings?sort=bookingDate:asc
```

- ❌ **CẤM:** Không dùng `ASC`/`DESC` chữ hoa, không dùng `up`/`down`.

---

## 23. MULTIPLE SORT FIELDS (SẮP XẾP THEO NHIỀU TRƯỜNG)

Khi cần sắp xếp theo nhiều trường ưu tiên, các tiêu chí phân tách bằng dấu phẩy `,` theo đúng thứ tự ưu tiên từ trái sang phải:

```text
GET /api/v1/bookings?sort=bookingDate:asc,startTime:asc
```

- **Ý Nghĩa:** Sắp xếp danh sách theo `bookingDate` tăng dần trước; nếu trùng ngày thì sắp xếp tiếp theo `startTime` tăng dần.

---

## 24. SORT WHITELIST PRINCIPLE (QUY TẮC DANH SÁCH TRẮNG SẮP XẾP)

- **Chỉ Cho Phép Trường Được Expose:** Client **CHỈ ĐƯỢC PHÉP** sắp xếp theo các thuộc tính đã được chỉ định trong Danh sách trắng (Sort Whitelist) của từng endpoint.
- ❌ **CẤM CỘT NỘI BỘ:** Cấm tuyệt đối việc cho phép Client truyền tên cột SQL nội bộ hoặc các trường nhạy cảm để sắp xếp.

---

## 25. DEFAULT SORTING RULES (QUY TẮC SẮP XẾP MẶC ĐỊNH CHUNG)

- **Nguyên Tắc Bắt Buộc (Deterministic Ordering):** Để tránh việc danh sách trả về bị xáo trộn vị trí giữa các trang phân trang, mọi Collection Endpoint bắt buộc phải có một **Thứ tự Sắp xếp Mặc định Định hình (Deterministic Default Ordering)** phía Backend khi Client không truyền tham số `sort`.
- **Trạng Thái TBD Per Resource:** Thuộc tính sắp xếp mặc định và hướng sắp xếp cụ thể cho từng tài nguyên (Default Sort Field + Direction per Resource) giữ nguyên `TBD — Defined per Resource Contract`.
- ❌ **CẤM:** Không phụ thuộc vào thứ tự ngẫu nhiên của Database ("Database Default Order").

---

## 26. UNKNOWN & INVALID SORT BEHAVIOR (XỬ LÝ LỖI SẮP XẾP KHÔNG HỢP LỆ)

- **Trường Sắp Xếp Không Hợp Lệ / Ngoài Whitelist:** Phản hồi lỗi **`HTTP 400 Bad Request`** kèm mã lỗi `UNKNOWN_REQUEST_FIELD` hoặc `VALIDATION_ERROR`.
- **Cú Pháp Sắp Xếp Sai (Thiếu direction `:asc`/`:desc` hoặc sai direction):** Phản hồi lỗi **`HTTP 400 Bad Request`** kèm mã lỗi `INVALID_REQUEST_FORMAT`.

---

## 27. COMBINED QUERY SEMANTICS (LUỒNG XỬ LÝ KẾT HỢP LỌC, SẮP XẾP VÀ PHÂN TRANG)

Khi Client truyền đồng thời các tham số Filter, Sort và Pagination trên cùng một request URL:

```text
GET /api/v1/bookings?branchId=b-101&status=CONFIRMED&sort=createdAt:desc&page=1&pageSize=20
```

Backend bắt buộc phải thực thi theo đúng thứ tự logic 3 bước:

```text
1. FILTERING ──> Lọc tập bản ghi thỏa mãn điều kiện (branchId = b-101 AND status = CONFIRMED)
       │
       ▼
2. SORTING   ──> Sắp xếp tập bản ghi đã lọc theo tiêu chí (createdAt DESC)
       │
       ▼
3. PAGINATING──> Cắt lát lấy trang tương ứng (Trang 1, lấy 20 bản ghi) & Tính toán Total Metadata
```

---

## 28. QUERY PARAMETER ORDER & ENCODING (THỨ TỰ THAM SỐ VÀ MÃ HÓA URL)

- **Thứ Tự Không Ảnh Hưởng Semantics:** Thứ tự xuất hiện của các Query Parameters trên URL không làm thay đổi kết quả xử lý của Backend (`?page=1&status=ACTIVE` có kết quả 100% giống `?status=ACTIVE&page=1`).
- **URL Encoding:** Các giá trị tham số trên URL có chứa ký tự đặc biệt hoặc khoảng trắng bắt buộc phải được mã hóa chuẩn **Percent-Encoding (URL Encoding)** (Ví dụ: `?venueName=S%C3%A2n%20B%C3%B3ng`).

---

## 29. SEARCH VS FILTERING BOUNDARIES (RANH GIỚI GIỮA TÌM KIẾM VÀ BỘ LỌC)

- **Phân Biệt Rõ Ràng:** Lọc (`Filtering`) là việc truy vấn chính xác theo các thuộc tính có cấu trúc. Tìm kiếm từ khóa ngữ nghĩa (`Full-text Search`) là việc tìm kiếm chuỗi tự do.
- **Ranh Giới Scope MVP:** Tính năng Tìm kiếm toàn văn qua Search Engine (Elasticsearch / Full-text Search Engine) nằm ngoài phạm vi Hợp đồng API MVP. Không tự ý định nghĩa các tham số query phức tạp như `?q=` hay `?searchEngine=true` trong task này.

---

## 30. SECURITY & AUTHORIZATION BOUNDARY (RANH GIỚI BẢO MẬT VÀ PHÂN QUYỀN)

- **Không Bypass Authorization:** Việc truyền tham số Filter hoặc Sort **tuyệt đối KHÔNG ĐƯỢC PHÉP vượt qua Rào cản Phân quyền (RBAC & Owner Tenant Isolation)**.
- **Ví Dụ Ràng Buộc:** Nếu Customer A thực hiện `GET /api/v1/bookings?userId=userB`, Backend phải kiểm tra phân quyền và từ chối `403 Forbidden` (chức không trả về dữ liệu của User B). Nếu Owner B thực hiện `GET /api/v1/bookings?branchId=branchOfOwnerA`, Backend áp dụng ranh giới cô lập dữ liệu để từ chối hoặc lọc phạm vi dữ liệu hợp lệ của chính Owner đó.

---

## 31. ERROR CONTRACT INTEGRATION (TÍCH HỢP HỢP ĐỒNG LỖI)

Tất cả các lỗi phát sinh do Phân trang, Lọc hoặc Sắp xếp không hợp lệ bắt buộc phải tái sử dụng **100% Cấu trúc Phản hồi Lỗi (Error Envelope)** đã phê duyệt tại Task 12:

```json
{
  "error": {
    "code": "INVALID_REQUEST_FORMAT",
    "message": "Invalid query parameter syntax.",
    "requestId": "req-pag-001"
  }
}
```

- ❌ **CẤM:** Không tự tiện tạo cấu trúc vỏ báo lỗi riêng như `{"paginationError": ...}` hay `{"filterError": ...}`.

---

## 32. BACKWARD COMPATIBILITY & EVOLUTION (TƯƠNG THÍCH NGƯỢC VÀ PHÁT TRIỂN)

- **Bổ Sung Filter Tùy Chọn (Non-breaking Change):** Bổ sung một tham số lọc tùy chọn mới vào Whitelist của API được coi là thay đổi không phá vỡ.
- **Thay Đổi Phá Vỡ (Breaking Changes):** Các hành vi sau bị CẤM trên phiên bản hiện tại (Yêu cầu cân nhắc tăng API Major Version `/api/v2`):
  - Đổi tên tham số `page`, `pageSize`, `sort`, `startDate`, `endDate`.
  - Đổi chỉ số trang từ 1-indexed sang 0-indexed.
  - Thay đổi cấu trúc đối tượng `meta.pagination`.
  - Giảm hạn ngạch `pageSize` tối đa.
  - Xóa bỏ một thuộc tính đang cho phép lọc/sắp xếp trong Whitelist.

---

## 33. OPEN QUESTIONS / TBD PRESERVATION & DEFINITION OF DONE (DoD)

### Open Questions / TBD Preservation:
Task 01.06.04.05 đã chốt duy nhất Phân trang Page-based (1-indexed, default=20, max=100), Metadata `meta.pagination`, Cú pháp Lọc `camelCase` toán tử `AND`, Cú pháp `startDate`/`endDate`, Cú pháp Sắp xếp `sort=field:dir` (`asc`/`desc`), và Quy tắc phân định lỗi HTTP 400 vs 422. Các mục sau tiếp tục giữ trạng thái `TBD` cho các task Hợp đồng Resource chuyên biệt:

1. **API-TBD-013: Resource-Specific Filter Whitelists:** Danh sách chi tiết các trường được phép filter/sort cho từng Endpoint cụ thể (như `GET /venues`, `GET /bookings`) giữ trạng thái `TBD — Defined per Resource Contract`.
2. **API-TBD-014: Default Sort Field per Resource:** Field sắp xếp mặc định chi tiết cho từng tài nguyên cụ thể giữ trạng thái `TBD — Defined per Resource Contract`.
3. **API-TBD-015: Multiple-Value Filterable Fields per Resource:** Danh sách chi tiết các trường hỗ trợ truyền nhiều giá trị phân tách bằng dấu phẩy giữ trạng thái `TBD — Defined per Resource Contract`.

---

### DEFINITION OF DONE (DoD) - TASK 01.06.04.05

```text
Collection Response      = PASS (Tái sử dụng vỏ chuẩn {"data": [...], "meta": { "pagination": { ... } }})
Pagination Strategy      = PASS (Chốt duy nhất Page-based / Offset Pagination)
Page Numbering           = PASS (Chốt 1-indexed: page=1 là trang đầu tiên)
Page Size Limits         = PASS (Default=20, Min=1, Max=100; vượt Max reject 400)
Pagination Metadata      = PASS (Chốt 4 trường: page, pageSize, totalItems, totalPages)
Empty Collection         = PASS (Trả mảng rỗng {"data": []} kèm meta chuẩn, cấm 404)
Single Resource Scope    = PASS (Chỉ áp dụng phân trang cho Collection Endpoints)
Filter Query Convention  = PASS (Truyền trên URL Query Parameters dạng camelCase)
Filter Operators         = PASS (Mặc định toán tử BẰNG Implicit Equality)
Multiple Filters         = PASS (Đánh giá đồng thời nhiều filter theo phép toán logic AND)
Multiple Values Filter   = PASS (Truyền phẩy ?status=CONFIRMED,HOLDING chỉ áp dụng cho field được whitelist, spec TBD)
Date Filter Syntax       = PASS (Chốt duy nhất cặp startDate & endDate; cấm fromDate/toDate)
Filter Whitelist         = PASS (Chỉ lọc trên DTO fields công khai, cấm DB/ORM/Audit internal columns)
Unknown Filter Behavior  = PASS (Truyền filter ngoài Whitelist bị từ chối Reject 400 Bad Request)
Invalid Filter Value     = PASS (Cú pháp sai -> 400 Bad Request; Giá trị vi phạm ngữ nghĩa -> 422 Unprocessable Content)
Sort Parameter & Syntax  = PASS (Chốt duy nhất cú pháp ?sort=fieldName:direction)
Sort Directions          = PASS (Chốt 2 giá trị asc và desc)
Multiple Sort Fields     = PASS (Hỗ trợ phân tách bằng dấu phẩy ?sort=date:asc,time:asc)
Sort Whitelist           = PASS (Chỉ sắp xếp trên DTO fields công khai)
Default Sorting Rules    = PASS (Yêu cầu Deterministic Default Ordering; exact default sort per resource TBD)
Unknown/Invalid Sort     = PASS (Sort field ngoài Whitelist hoặc sai syntax/direction bị Reject 400)
Combined Query Flow      = PASS (Thực thi chuẩn 3 bước: Filter -> Sort -> Paginate)
Query Parameter Order    = PASS (Thứ tự tham số URL không ảnh hưởng semantics)
Search vs Filter Boundary= PASS (Full-text Search Engine nằm ngoài phạm vi MVP)
Security Boundary        = PASS (Filter/Sort tuyệt đối không bypass RBAC & Owner Isolation)
Error Contract Reused    = PASS (Tái sử dụng 100% Error Envelope {"error": { ... }} từ Task 12)
Backward Compatibility   = PASS (Quy tắc bảo vệ Client khi thay đổi tham số phân trang)
No Implementation Code   = PASS (Zero SQL, Zero Code, Zero DB Index, Zero ORM Query Builder)
TBD Preservation         = PASS (Bảo lưu Whitelists & Default Sort per resource cho các task sau)

TASK 01.06.04.05 = PASS
```

---
*Tài liệu Hợp đồng Phân trang, Lọc và Sắp xếp API được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
