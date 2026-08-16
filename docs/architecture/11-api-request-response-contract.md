# TÀI LIỆU HỢP ĐỒNG YÊU CẦU VÀ PHẢN HỒI API (API REQUEST / RESPONSE CONTRACT SPECIFICATION)
**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.06.04.03 (Micro-Corrected Revision)  
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
**Ngày cập nhật:** 2026-08-08  

---

## 1. PURPOSE (MỤC TIÊU TÀI LIỆU)

Tài liệu này định nghĩa và **chốt khóa duy nhất** Hợp đồng Yêu cầu và Phản hồi API (API Request / Response Contract) cho toàn bộ hệ thống Backend API của SportHubAI.

Mục tiêu chính:
1. Xác định cấu trúc vỏ phản hồi thành công (Response Envelope) chuẩn hóa cho các API Single Resource, Collection Resource và Action Endpoint.
2. Quy định các nguyên tắc thiết kế Data Transfer Objects (DTOs) tách biệt hoàn toàn giữa Request DTO và Response DTO, ngăn chặn việc rò rỉ thực thể nội bộ.
3. Thống nhất quy ước kiểu dữ liệu JSON (`camelCase`), chuẩn hóa biểu diễn Ngày/Giờ (`ISO 8601`), Tiền tệ (`VND Integer Amount`), Boolean (`true/false`), Enum và cách xử lý trường rỗng/null.
4. Tuyên bố quyền hạn sở hữu tuyệt đối của Server (Server Authority) đối với các trường trạng thái, giá tiền và dữ liệu kiểm toán.
5. Đảm bảo tính tương thích và bảo tồn 100% các quyết định nghiệp vụ đã được phê duyệt.

---

## 2. SCOPE (PHẠM VI ÁP DỤNG)

- **Phạm vi Phủ sóng:** Áp dụng bắt buộc cho tất cả các DTOs giao tiếp công khai (Public API Contracts) giữa Frontend Website (Customer, Owner, Admin Portals) và Backend API dưới đường dẫn `/api/v1`.
- **Giới hạn Ranh giới:**
  - KHÔNG đặc tả chi tiết Hợp đồng Lỗi API (Error Contract - Thuộc về Task 01.06.04.04).
  - KHÔNG đặc tả chi tiết Tham số Truy vấn Phân trang (Pagination Query Parameters - Thuộc về Task 01.06.04.05).
  - KHÔNG đặc tả các Headers hạ tầng như Header Authentication, Header Idempotency, Header Correlation ID.
  - KHÔNG viết mã nguồn DTO Class, Controller code hay SQL.

---

## 3. SOURCE OF TRUTH (NGUỒN SỰ THẬT VÀ TÍNH KẾ THỪA)

Tài liệu này kế thừa và tuân thủ tuyệt đối các quyết định đã `APPROVED`:

| Thành Phần Kiến Trúc | Quyết Định Đã APPROVED | Giới Hạn Tương Tác DTO Contract |
|---|---|---|
| **API Base Path** | `/api/v1` | Tất cả DTOs áp dụng chung cho phiên bản `v1` |
| **Backend Architecture** | Modular Monolith (Website Scope Only) | DTOs chuẩn hóa nhất quán cho 10 Domain Modules |
| **Core MVP Entities** | ĐÚNG 13 Core MVP Entities | DTOs không trả trực tiếp ORM/DB Entity |
| **Booking State Machine** | ĐÚNG 8 Trạng Thái Đặt Sân | Enum DTO biểu diễn đúng 8 trạng thái chuẩn |
| **Server Authority** | Backend là Nguồn Sự Thật Duy Nhất | Client không được tự gửi các trường Server-owned |
| **MoMo IPN Verification** | IPN Callback ngầm phía Backend | Client không được gửi DTO xác nhận thanh toán giả |

---

## 4. PUBLIC API CONTRACT (HỢP ĐỒNG GIAO TIẾP CÔNG KHAI API)

Request DTO và Response DTO đóng vai trò là **Hợp đồng Công khai duy nhất (Public Contract)** giữa Frontend và Backend.

```text
Frontend Website Client
        │
    JSON Request Payload
        │
        ▼
   API Request DTO ──(Map)──> Application Input DTO
                                      │
                                      ▼
                                Domain Execution
                                      │
                                      ▼
  API Response DTO <──(Map)── Application Output Result
        │
        ▼
   JSON Response Payload
        │
        ▼
Frontend Website Client
```

- **Tính Độc Lập:** Frontend chỉ phụ thuộc vào cấu trúc của Request/Response DTOs. Frontend **không được phụ thuộc** vào Domain Entity, ORM Model, Database Schema hay các đối tượng Application nội bộ.

---

## 5. DTO BOUNDARY (RANH GIỚI BẮT BUỘC CỦA DTO)

- **Cấm Bộc Lộ Thực Thể Nội Bộ:** Tuyệt đối không trả trực tiếp Domain Entities, ORM Models (Sequelize/Prisma), Database Records hay Repository Objects ra API.
- **Bắt Buộc Ánh Xạ (Mapping Layer):**
  - **Chiều Vào (Request):** `JSON Payload -> API Request DTO -> Application Input DTO -> Use Case`.
  - **Chiều Ra (Response):** `Application Output -> API Response DTO -> JSON Payload`.
- **Ranh Giới Rõ Ràng:** DTO chỉ là vỏ bọc dữ liệu cho API Contract, không chứa Business Rules hay Domain Logic.

---

## 6. REQUEST DTO PRINCIPLES (NGUYÊN TẮC DỊCH VỤ REQUEST DTO)

Request DTO chỉ được phép chứa các thuộc tính mà Client có quyền và được phép cung cấp cho Use Case:

- ✅ **Client ĐƯỢC PHÉP gửi:** Các thông số tìm kiếm, dữ liệu nhập liệu từ biểu mẫu (Form input), ID tài nguyên tham chiếu hợp lệ.
- ❌ **Client CẤM KHÔNG ĐƯỢC gửi (Server-owned fields):** `userId` (lấy từ auth token context), `ownerId` (lấy từ tenant context), `bookingStatus`, `paymentStatus`, `finalPrice`, `totalAmount`, `createdAt`, `updatedAt`, các trường Audit Log nội bộ.
- Nếu Client cố tình gửi các trường do Server quản lý, Backend sẽ **lập tức từ chối (Reject 400 Bad Request)** theo quy tắc an ninh.

---

## 7. RESPONSE DTO PRINCIPLES (NGUYÊN TẮC DỊCH VỤ RESPONSE DTO)

Response DTO chỉ chứa dữ liệu cần thiết phục vụ cho việc hiển thị của Frontend:

- ✅ **Chỉ trả dữ liệu đã được sanitize:** Dữ liệu đã làm sạch và công khai cho vai trò người dùng tương ứng.
- ❌ **CẤM HOÀN TOÀN BỘC LỘ (Sensitive Exposure):** Mật khẩu (`password`), Chuỗi băm mật khẩu (`passwordHash`), Mã OTP (`otpSecret`), Mã băm OTP (`otpHash`), Signature Secret của MoMo, Chuỗi kết nối Database, Stack trace nội bộ hay Credentials của hạ tầng.

---

## 8. RESPONSE ENVELOPE (CẤU TRÚC VỎ PHẢN HỒI THÀNH CÔNG DUY NHẤT)

Tất cả các phản hồi HTTP thành công (`2xx Successful Responses`) từ bất kỳ API nào trong 10 Domain Modules bắt buộc phải được bọc trong một **Cấu trúc Vỏ Phản Hồi Thành Công duy nhất (Unified Response Envelope)**:

```json
{
  "data": { ... } | [ ... ]
}
```

Tuyệt đối không để xảy ra tình trạng Module A dùng `{"data": ...}`, Module B dùng `{"result": ...}`, Module C dùng `{"item": ...}`.

---

## 9. SINGLE RESOURCE RESPONSE (CẤU TRÚC PHẢN HỒI TÀI NGUYÊN ĐƠN)

API trả về một tài nguyên đơn lẻ (Single Resource API) có cấu trúc bắt buộc:

```json
{
  "data": {
    "id": "123",
    "propertyName": "propertyValue"
  }
}
```

---

## 10. COLLECTION RESPONSE (CẤU TRÚC PHẢN HỒI TẬP HỢP TÀI NGUYÊN)

API trả về danh sách tài nguyên (Collection Resource API) có cấu trúc bắt buộc:

```json
{
  "data": [
    {
      "id": "123",
      "propertyName": "propertyValue"
    },
    {
      "id": "124",
      "propertyName": "propertyValue"
    }
  ],
  "meta": { }
}
```

*Lưu ý:* Cấu trúc chi tiết của đối tượng `meta` phục vụ phân trang sẽ được quy định tại `TASK 01.06.04.05`. Task này chỉ chốt cấu trúc tổng thể mảng dữ liệu nằm trong trường `"data"`.

---

## 11. EMPTY COLLECTION CONVENTION (QUY ƯỚC TẬP HỢP RỐNG)

Khi một API Collection được truy vấn thành công nhưng không có bản ghi nào thỏa mãn, Backend bắt buộc phải trả về mảng rỗng `[]` trong trường `"data"`:

```json
{
  "data": [],
  "meta": { }
}
```

- ❌ **CẤM:** Không trả về `"data": null`.
- ❌ **CẤM:** Không trả về `"data": {}`.
- ❌ **CẤM:** Không trả về chuỗi `"NO_DATA"`.

---

## 12. NULLABILITY & PRESENCE CONVENTION (QUY ƯỚC GIÁ TRỊ NULL VÀ SỰ TỒN TẠI TRƯỜNG)

Hệ thống phân định rạch ròi 3 trạng thái thuộc tính trong JSON DTO:

1. **Required Field (Trường Bắt Buộc):** Bắt buộc phải có mặt trong JSON và không được nhận giá trị `null`.
2. **Optional Request Field (Trường Tùy Chọn Khi Tạo/Cập Nhật):** Có thể không xuất hiện trong JSON Request. Nếu không gửi, Backend giữ nguyên giá trị cũ hoặc dùng giá trị mặc định.
3. **Nullable Field (Trường Cho Phép Rỗng):** Bắt buộc phải xuất hiện trong JSON Response với giá trị `null` nếu thuộc tính đó chưa có dữ liệu.

```json
{
  "name": "Sân Cầu Lông Số 1",
  "description": null
}
```

---

## 13. JSON FIELD NAMING CONVENTION (QUY ƯỚC ĐẶT TÊN TRƯỜNG JSON)

Tất cả các thuộc tính (Keys) trong JSON Request Payload và JSON Response Payload bắt buộc phải tuân thủ chuẩn **`camelCase`**:

```json
{
  "venueId": "venue-101",
  "branchName": "Chi Nhánh Quận 1",
  "totalAmount": 200000,
  "createdAt": "2026-08-08T10:00:00+07:00"
}
```

- ❌ **CẤM MIXED CASE:** Không dùng `venue_id` (snake_case), không dùng `VenueId` (PascalCase) trong JSON contract.

---

## 14. ID REPRESENTATION (QUY ƯỚC BIỂU DIỄN MÃ ĐỊNH DANH ID)

- **Tên Trường ID:** Sử dụng trường `"id"` cho đối tượng chính và `{resource}Id` cho các đối tượng tham chiếu (Ví dụ: `"id": "123"`, `"venueId": "456"`).
- **Trạng Thái Kiểu Dữ Liệu ID:** Kiểu biểu diễn cụ thể của ID trên JSON (String vs Integer) giữ nguyên `TBD — Pending Database Architecture Confirmation`.

---

## 15. DATE / TIME REPRESENTATION (QUY ƯỚC BIỂU DIỄN NGÀY VÀ GIỜ)

Tất cả các trường ngày và giờ trên API phải tuân thủ chuẩn định dạng quốc tế:

1. **Chỉ Ngày (Date Only):** Định dạng `YYYY-MM-DD` (Ví dụ: `"2026-08-10"`).
2. **Chỉ Giờ (Time Only):** Định dạng 24-hour `HH:mm:ss` (Ví dụ: `"14:30:00"`).
3. **Ngày & Giờ (DateTime / Timestamp):** Chuẩn **ISO 8601** kèm độ lệch múi giờ (Ví dụ: `"2026-08-10T14:30:00+07:00"`).

- ❌ **CẤM BẤT KỲ ĐỊNH DẠNG TÙY Ý:** Không dùng `"08/10/2026"`, `"10-08-2026"`, hay `"Aug 10 2026"`.

---

## 16. TIMEZONE REPRESENTATION (QUY ƯỚC MÚI GIỜ HỆ THỐNG)

- **Business Timezone:** Tất cả dữ liệu thời gian nghiệp vụ (Lịch hoạt động sân, Khung giờ đặt sân, Đếm ngược hold 10m, Timestamp giao dịch) bắt buộc phải tuân thủ Múi giờ chuẩn của hệ thống: **Múi giờ Việt Nam (`UTC+07:00`)**.
- API Response DTO bắt buộc phải thể hiện độ lệch múi giờ `+07:00` trong chuỗi ISO 8601 để Frontend hiển thị chính xác mà không cần tự suy đoán.

---

## 17. MONEY REPRESENTATION (QUY ƯỚC BIỂU DIỄN TIỀN TỆ)

Để tránh hoàn toàn lỗi mất độ chính xác do số thực (Floating-point precision issues), dữ liệu tiền tệ trong API DTOs bắt buộc phải được biểu diễn theo chuẩn **Số Nguyên (Integer Amount) và Đơn Vị Tiền Tệ**:

```json
{
  "price": {
    "amount": 150000,
    "currency": "VND"
  }
}
```

- **Số Nguyên Việt Nam Đồng:** Trường `amount` là số nguyên dương biểu thị giá trị thực tế theo Đồng Việt Nam (VND).
- ❌ **CẤM:** Không trả về số thực (Ví dụ cấm: `150000.50`), không trả về chuỗi tiền tệ kèm ký tự phân cách (Ví dụ cấm: `"150,000 VNĐ"`).

---

## 18. BOOLEAN REPRESENTATION (QUY ƯỚC BIỂU DIỄN BOOLEAN)

Dữ liệu Boolean trên JSON DTO bắt buộc phải dùng chuẩn JSON Boolean:

```json
{
  "isActive": true,
  "isAvailable": false
}
```

- ❌ **CẤM:** Không dùng chuỗi `"true"` / `"false"`.
- ❌ **CẤM:** Không dùng số `1` / `0`.

---

## 19. ENUM REPRESENTATION (QUY ƯỚC BIỂU DIỄN ENUM NGHIỆP VỤ)

Tất cả các Enum nghiệp vụ trả về trên API DTOs phải là **Chuỗi Chữ Hoa (Upper-case String)**. 

### Quy Tắc Chốt Hạ Booking State Enum:
Booking State Enum phải sử dụng chính xác **8 Booking States** đã được APPROVED trong Backend Architecture / Booking State Machine:

```json
"status": "AVAILABLE" | "HOLDING" | "PAYMENT_PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "EXPIRED" | "PAYMENT_FAILED"
```

- ❌ **CẤM THÊM/ĐỔI STATE:** Không được tự thêm các trạng thái ngoài tập 8 states này (như `PENDING_PAYMENT`, `HOLD`, `NO_SHOW`, `REFUNDED`).
- ❌ **CẤM:** Không trả về số nguyên Enum từ Database (Ví dụ cấm: `"status": 2`).

---

## 20. STATE FIELDS AUTHORITY (QUYỀN QUẢN LÝ THUỘC TÍNH TRẠNG THÁI)

- Các thuộc tính trạng thái (`bookingStatus`, `paymentStatus`, `accountStatus`, `ownerApplicationStatus`) hoàn toàn thuộc quyền sở hữu độc quyền của **Backend Server (Server Authority)**.
- Client tuyệt đối không có quyền truyền các trường trạng thái này trong Request DTO để tự ý thay đổi dữ liệu. Mọi sự chuyển đổi trạng thái phải thông qua các Action Endpoints hoặc Use Cases hợp lệ do Backend điều phối.

---

## 21. READ DTO VS WRITE DTO PRINCIPLE (TÁCH BIỆT DTO ĐỌC VÀ GHI)

Phân hệ Backend bắt buộc phải thiết kế tách biệt giữa DTO phục vụ Đọc dữ liệu (Read/Response DTO) và DTO phục vụ Ghi dữ liệu (Write/Request DTO):

- **Create Request DTO:** Chỉ chứa các trường cần cho việc tạo mới.
- **Update Request DTO:** Chỉ chứa các trường được phép sửa đổi.
- **Response DTO:** Chứa thông tin tổng hợp đầy đủ phục vụ hiển thị.
- ❌ **CẤM:** Không tái sử dụng một Class/Interface DTO duy nhất cho cả `POST`, `PATCH` và `GET`.

---

## 22. CREATE REQUEST DTO PRINCIPLES (NGUYÊN TẮC DTO TẠO MỚI)

Create Request DTO chỉ chứa các thuộc tính do Client nhập liệu:

```json
// POST /api/v1/bookings
{
  "courtId": "court-101",
  "bookingDate": "2026-08-10",
  "startTime": "14:00:00",
  "endTime": "15:00:00"
}
```

- ❌ **CẤM KHÔNG NHẬN:** `id`, `createdAt`, `status`, `paymentStatus`, `totalAmount` trong Create Request DTO. Các thông số này do Backend tự tính toán và sinh ra.

---

## 23. UPDATE REQUEST DTO PRINCIPLES (NGUYÊN TẮC DTO CẬP NHẬT `PATCH`)

Update Request DTO (`PATCH`) chỉ cho phép Client truyền các thuộc tính được quyền chỉnh sửa (Partial Update):

```json
// PATCH /api/v1/venues/venue-101
{
  "venueName": "Tên Sân Đã Cập Nhật",
  "description": "Mô tả mới"
}
```

- ❌ **CẤM KHÔNG CHO SỬA QUA PATCH:** Cấm truyền `status: "CONFIRMED"` trong `PATCH /bookings/{id}` để cố tình đổi trạng thái đơn. Trạng thái đơn phải đi qua Action Endpoint `POST /bookings/{id}/cancellation` hoặc quy trình thanh toán MoMo IPN.

---

## 24. IMMUTABLE FIELDS PRINCIPLE (NGUYÊN TẮC THUỘC TÍNH BẤT BIẾN)

Các thuộc tính sau được coi là **Bất biến (Immutable)** sau khi tài nguyên đã được tạo ra:

- `id` (Mã định danh tài nguyên)
- `createdAt`, `createdBy` (Dấu vết khởi tạo)
- `ownershipIdentity` (Quyền sở hữu tài nguyên)

Nếu Request DTO gửi lên cố tình thay đổi các thuộc tính bất biến này, Backend sẽ lập tức từ chối request.

---

## 25. SERVER-CALCULATED FIELDS AUTHORITY (QUYỀN TÍNH TOÁN DỮ LIỆU CỦA SERVER)

Backend là Nguồn sự thật độc quyền chịu trách nhiệm tính toán các dữ liệu nghiệp vụ nhạy cảm:

- Khả dụng khung giờ (`Slot Availability`).
- Tính toán tổng tiền đơn hàng (`Price & Total Amount Calculation`).
- Thời gian đếm ngược đếm hết hạn giữ chỗ 10m (`Hold Expiry Timestamp`).
- Dấu vết thời gian giao dịch (`Timestamps`).

❌ **CẤM TIN DỮ LIỆU GIÁ CLIENT:** Backend tuyệt đối không nhận và không tin tưởng giá tiền do Client tự gửi lên trong Request Payload.

---

## 26. NESTED OBJECTS RULES (QUY TẮC ĐỐI TƯỢNG LỒNG TRONG RESPONSE)

Response DTO có thể chứa các đối tượng lồng nhau (Nested Objects) để tối ưu hóa hiển thị cho Frontend:

```json
{
  "data": {
    "id": "booking-101",
    "bookingDate": "2026-08-10",
    "court": {
      "id": "court-01",
      "courtName": "Sân Cầu Lông A1"
    }
  }
}
```

- **Ranh Giới Bắt Buộc:** Mức độ lồng đối tượng do Response DTO kiểm soát. Tuyệt đối **không trả toàn bộ đồ thị ORM Entities (ORM Entity Graph)** và không tạo lồng phụ thuộc vòng (Circular Nested References).

---

## 27. RESOURCE REFERENCES RULES (QUY TẮC THAM CHIẾU TÀI NGUYÊN)

Khi tài nguyên chỉ cần tham chiếu đến tài nguyên khác mà không cần hiển thị chi tiết, Response DTO chỉ trả về Mã định danh ID tham chiếu:

```json
{
  "data": {
    "id": "booking-101",
    "courtId": "court-01",
    "venueId": "venue-10"
  }
}
```

Giúp payload nhỏ gọn và tránh phình to kích thước dữ liệu truyền qua mạng.

---

## 28. UNKNOWN REQUEST FIELDS CONTRACT (QUY TẮC XỬ LÝ TRƯỜNG KHÔNG XÁC ĐỊNH TRONG REQUEST)

Khi Client gửi Request Payload chứa các thuộc tính không nằm trong Hợp đồng Request DTO (Unknown / Extra Fields):

```json
// Client gửi Request thừa trường unexpectedField:
{
  "courtId": "court-101",
  "bookingDate": "2026-08-10",
  "unexpectedField": "maliciousPayload"
}
```

- **Quy Tắc Hợp Đồng API Công Khai (Public API Contract Rule):** Backend xem đây là một Request không hợp lệ / không đúng định dạng (Malformed / Invalid Request) và **TỪ CHỐI BẮT BUỘC (REJECT) -> HTTP 400 Bad Request**.
- ❌ **CẤM SILENTLY STRIP:** API Contract cấm tuyệt đối việc âm thầm loại bỏ (silently strip) trường thừa mà vẫn xử lý thành công. Tất cả các endpoint trong 10 Domain Modules phải áp dụng quy tắc từ chối nhất quán này.
- *Ghi chú implementation:* Cấu hình chi tiết của thư viện Framework Validation để thực thi quy tắc Reject này tại tầng mã nguồn giữ trạng thái `TBD`.

---

## 29. RESPONSE COMPATIBILITY & EVOLUTION RULES (TƯƠNG THÍCH VÀ PHÁT TRIỂN RESPONSE)

- **Thêm Trường Không Phá Vỡ (Non-breaking Change):** Việc bổ sung một thuộc tính mới vào Response DTO được coi là thay đổi không phá vỡ và không cần tăng API Major Version.
- **Thay Đổi Phá Vỡ (Breaking Changes):** Các hành vi sau bị CẤM trên phiên bản hiện tại (Yêu cầu tăng API Version `/api/v2`):
  - Xóa bỏ một thuộc tính đang tồn tại trong Response DTO.
  - Đổi tên một thuộc tính trong Response DTO.
  - Thay đổi kiểu dữ liệu của thuộc tính (Ví dụ: Đổi từ `number` sang `string`, hoặc từ `object` sang `array`).

---

## 30. REQUEST COMPATIBILITY & EVOLUTION RULES (TƯƠNG THÍCH VÀ PHÁT TRIỂN REQUEST)

- **Thêm Trường Bắt Buộc Là Breaking Change:** Bổ sung một trường bắt buộc (`Required Field`) mới vào Request DTO là một Breaking Change vì sẽ làm lỗi các Client hiện tại.
- **Thêm Trường Tùy Chọn (Optional Field):** Bổ sung trường tùy chọn có thể thực hiện mà không làm tăng API Major Version.

---

## 31. RESPONSE DATA AUTHORITY (QUYỀN TÁC GIẢ NGUYÊN BẢN CỦA DỮ LIỆU PHẢN HỒI)

Toàn bộ dữ liệu trả về trong Response DTO bắt buộc phải phản ánh trạng thái chuẩn trực tiếp từ Server (Server-Authoritative State):

- **Booking Domain:** `status`, `price`, `availabilityResult`.
- **Payment Domain:** `paymentStatus`, `paidAmount`, `momoTransId`.
- **User Domain:** `role`, `accountStatus`.

---

## 32. SECURITY & SENSITIVE FIELD MASKING (AN NINH VÀ CHE GIẤU DỮ LIỆU NHẠY CẢM)

Mọi Response DTO phải đi qua bộ lọc an ninh để loại bỏ 100% các dữ liệu nhạy cảm:

| Nhóm Dữ Liệu Nhạy Cảm | Trạng Thái Bộc Lộ Trên API DTO | Quy Tắc An Ninh |
|---|---|---|
| Mật khẩu (`password`, `passwordHash`) | ❌ **CẤM HOÀN TOÀN** | Không bao giờ xuất hiện trong DTO |
| Mã OTP (`otpSecret`, `otpHash`) | ❌ **CẤM HOÀN TOÀN** | Chỉ phát qua Email thực tế, cấm trả về DTO |
| MoMo Secret Keys / Signatures | ❌ **CẤM HOÀN TOÀN** | Chỉ nằm tại Backend Infrastructure |
| Database / SQL Connection String | ❌ **CẤM HOÀN TOÀN** | Bọc kín trong Server Environment |
| System Stack Traces / Internal Errors| ❌ **CẤM HOÀN TOÀN** | Chỉ ghi log server, cấm trả Client |

---

## 33. RESPONSE META PRINCIPLES (NGUYÊN TẮC TRƯỜNG META TRONG ENVELOPE)

Cấu trúc Response Envelope có thể chứa đối tượng tùy chọn `"meta"` để truyền các thông tin bổ trợ (như thông tin truy vết Request ID hoặc metadata phân trang):

```json
{
  "data": [ ... ],
  "meta": {
    "requestId": "req-xyz-123"
  }
}
```

*Lưu ý:* Cấu trúc chi tiết của metadata phân trang (`pageIndex`, `pageSize`, `totalItems`) giữ nguyên `TBD — Refer to TASK 01.06.04.05`.

---

## 34. RESPONSE LINKS & HATEOAS POLICY (CHÍNH SÁCH CÁC LIÊN KẾT HATEOAS)

- **Không Áp Dụng HATEOAS:** Hệ thống API của SportHubAI cho giai đoạn MVP **KHÔNG áp dụng kiến trúc HATEOAS** (Hypermedia as the Engine of Application State).
- API Response DTO sẽ không chứa các thuộc tính liên kết tự mô tả như `_links`, `_self`, `_next` để giữ cho Hợp đồng API đơn giản, nhẹ và tối ưu cho Frontend Website.

---

## 35. ACTION RESPONSE PRINCIPLES (NGUYÊN TẮC PHẢN HỒI CỦA ACTION ENDPOINTS)

Các Action Endpoints (như `POST /bookings/{id}/cancellation` hay `POST /auth/otp-verification`) bắt buộc phải tuân thủ chuẩn Response Envelope:

1. **Nếu Action có trả về tài nguyên đã cập nhật:** Trả về tài nguyên đó trong trường `"data"`:
   ```json
   {
     "data": {
       "id": "booking-101",
       "status": "CANCELLED"
     }
   }
   ```
2. **Nếu Action không trả về tài nguyên cụ thể:** Trả về đối tượng trạng thái thực thi trong trường `"data"`:
   ```json
   {
     "data": {
       "success": true
     }
   }
   ```

---

## 36. HTTP BODY & CONTENT-TYPE RULES (QUY TẮC BODY VÀ ĐỊNH DẠNG DỮ LIỆU)

- **Content-Type Standard:** Tất cả các Request và Response có chứa Body bắt buộc phải sử dụng Header: `Content-Type: application/json; charset=utf-8`.
- **Phương thức HTTP `GET`:** Tuyệt đối không chứa Request Body.
- **Phương thức HTTP `POST` / `PATCH`:** Bắt buộc gửi Request Payload dạng JSON.
- **Phương thức HTTP `DELETE`:** Không mặc định yêu cầu Request Body.

---

## 37. API CONTRACT VS DATABASE SCHEMA (PHÂN BIỆT HỢP ĐỒNG API VÀ DATABASE SCHEMA)

Hợp đồng API DTO **không phải là bản sao 1:1 của Database Schema**:

- Database có thể chứa các cột nội bộ: `created_by_user_id`, `is_deleted_flag`, `lock_version`.
- API Response DTO chỉ trả về các thuộc tính có ý nghĩa ngữ nghĩa công khai cho Client: `createdBy`, `status`.
- Thiết kế API DTO phục vụ góc nhìn của API Consumer chứ không phục vụ góc nhìn lưu trữ của Database.

---

## 38. API CONTRACT VS DOMAIN MODEL (PHÂN BIỆT HỢP ĐỒNG API VÀ DOMAIN MODEL)

Hợp đồng API DTO **không phải là bản sao 1:1 của Domain Entity**:

- Domain Entity chứa các quy tắc nghiệp vụ nội bộ, các phương thức tính toán và các thuộc tính bảo mật trong bộ nhớ.
- API DTO chỉ đóng vai trò là cấu trúc truyền tải dữ liệu đơn thuần (Plain Data Carrier) bọc ngoài ranh giới API.

---

## 39. CROSS-MODULE CONSISTENCY (TÍNH NHẤT QUÁN GIỮA CÁC MODULE)

Tất cả 10 Domain Modules (`auth`, `users`, `venues`, `courts`, `bookings`, `payments`, `reviews`, `notifications`, `audit`, `ai`) bắt buộc phải sử dụng chung 100%:

- Cấu trúc Response Envelope (`{"data": ...}`).
- Quy ước kiểu chữ thuộc tính JSON (`camelCase`).
- Quy ước Ngày/Giờ (ISO 8601 `UTC+07:00`).
- Quy ước Tiền tệ (`amount` integer VND).
- Quy ước Enum chuỗi chữ hoa.
- Quy tắc từ chối trường thừa (Reject Unknown Request Fields -> 400).
- Quy tắc che giấu dữ liệu nhạy cảm.

---

## 40. DTO NAMING CONVENTIONS (QUY ƯỚC ĐẶT TÊN DTO CLASSES/INTERFACES)

Tên các DTOs trong thiết kế ứng dụng phải thể hiện rõ ràng ngữ nghĩa và vai trò:

- **Create Request DTO:** `Create{Resource}Request` (Ví dụ: `CreateBookingRequest`, `CreateVenueRequest`).
- **Update Request DTO:** `Update{Resource}Request` (Ví dụ: `UpdateVenueRequest`).
- **Response DTO:** `{Resource}Response` (Ví dụ: `BookingResponse`, `VenueResponse`, `PaymentResponse`).
- ❌ **CẤM DÙNG TÊN CHUNG CHUNG:** Không đặt tên `DataDTO`, `CommonDTO`, `GenericDTO`.

---

## 41. ENDPOINT DTO EXAMPLES (VÍ DỤ MINH HỌA HỢP ĐỒNG DTO CHUẨN)

Dưới đây là một số ví dụ minh họa về cấu trúc JSON DTOs thành công tuân thủ 100% hợp đồng API:

### Example 1: Single Resource Response (`GET /api/v1/bookings/book-101`)
```json
{
  "data": {
    "id": "book-101",
    "courtId": "court-01",
    "bookingDate": "2026-08-10",
    "startTime": "14:00:00",
    "endTime": "15:00:00",
    "status": "HOLDING",
    "holdExpiryTimestamp": "2026-08-08T10:19:48+07:00",
    "price": {
      "amount": 150000,
      "currency": "VND"
    },
    "createdAt": "2026-08-08T10:09:48+07:00"
  }
}
```

### Example 2: Collection Resource Response (`GET /api/v1/venues`)
```json
{
  "data": [
    {
      "id": "venue-01",
      "venueName": "Sân Thể Thao Phong Thần",
      "address": "123 Đường ABC, Quận 1",
      "totalBranches": 2
    }
  ],
  "meta": { }
}
```

---

## 42. OPEN QUESTIONS / TBD PRESERVATION (BẢO LƯU CÁC MỤC CHƯA CHỐT)

Task 01.06.04.03 đã chốt duy nhất Cấu trúc Response Envelope, JSON `camelCase`, Quy ước Ngày/Giờ/Tiền tệ, DTO Boundary và Quy tắc Reject Unknown Fields. Các mục sau tiếp tục giữ trạng thái `TBD` chờ các sub-task tiếp theo xử lý:

1. **API-TBD-003: Exact Error Contract Schema:** Cấu trúc chi tiết của Đối tượng lỗi API giữ trạng thái `TBD — Refer to TASK 01.06.04.04`.
2. **API-TBD-005: Idempotency Header & Key Format:** Tên Header Idempotency và định dạng Key giữ trạng thái `TBD — Refer to TASK 01.06.04.09`.
3. **API-TBD-006: Correlation ID Header Name:** Tên Header Correlation ID giữ trạng thái `TBD — Refer to Observability Architecture`.
4. **API-TBD-008: Pagination Metadata Schema:** Cấu trúc thuộc tính chi tiết trong đối tượng `meta` phân trang giữ trạng thái `TBD — Refer to TASK 01.06.04.05`.
5. **API-TBD-009: ID Field Data Type:** Kiểu dữ liệu định danh ID (String vs Integer) giữ trạng thái `TBD — Pending Database Architecture Confirmation`.
6. **API-TBD-010: Framework Validation Implementation Config:** Cấu hình thư viện Framework Validation cụ thể để thực thi Reject 400 tại tầng mã nguồn giữ trạng thái `TBD`.

---

## 43. NON-GOALS (CÁC NỘI DUNG KHÔNG THỰC HIỆN TRONG TASK NÀY)

- ❌ Không định nghĩa Schema phản hồi lỗi (Error Response Schema).
- ❌ Không định nghĩa các tham số query phân trang, lọc, sắp xếp.
- ❌ Không định nghĩa Header Authentication hay mã hóa Token.
- ❌ Không viết mã nguồn TypeScript DTO classes hay Validator decorators.
- ❌ Không thay đổi bất kỳ Business Rule hay Booking State nào.

---

## 44. DEFINITION OF DONE (DoD) - TASK 01.06.04.03

```text
Public API Contract      = PASS (Đã định nghĩa ranh giới DTOs giữa Client và Backend)
DTO Boundary             = PASS (Cấm trả trực tiếp ORM/DB/Domain Entities ra API)
Request DTO Principles   = PASS (Cấm nhận các trường thuộc Server Authority từ Client)
Response DTO Principles  = PASS (Chỉ trả dữ liệu sanitized, cấm bộc lộ thông tin nhạy cảm)
Response Envelope        = PASS (Chốt duy nhất cấu trúc envelope: {"data": ...})
Single Resource Response = PASS (Nhất quán {"data": { "id": "..." }})
Collection Response      = PASS (Nhất quán {"data": [ ... ], "meta": { }})
Empty Collection         = PASS (Chốt mảng rỗng {"data": []})
Nullability Convention   = PASS (Phân biệt rõ Required, Optional và Nullable)
JSON Field Naming        = PASS (Chốt khóa duy nhất camelCase cho toàn bộ JSON Keys)
ID Representation        = PASS (Giữ quy ước id/{resource}Id, kiểu dữ liệu ID TBD đúng)
Date/Time Representation = PASS (ISO 8601 cho DateTime, YYYY-MM-DD cho Date, HH:mm:ss cho Time)
Timezone Representation  = PASS (Bảo tồn múi giờ chuẩn Việt Nam UTC+07:00)
Money Representation     = PASS (Chốt cấu trúc { amount: integer, currency: "VND" })
Boolean Representation   = PASS (Chốt JSON boolean true/false)
Enum Representation      = PASS (Sử dụng chính xác 8 Booking States APPROVED trong Backend Architecture)
Unknown Request Fields   = PASS (Public API Contract chốt Reject Unknown Request Fields -> 400 Bad Request)
Server Authority         = PASS (Backend sở hữu độc quyền trạng thái, giá tiền và timestamps)
Read vs Write DTOs       = PASS (Tách biệt CreateRequest, UpdateRequest và Response DTOs)
Immutable Fields         = PASS (id, createdAt, ownership identity là bất biến)
Security & Masking       = PASS (Che giấu 100% passwords, OTP, secrets, stack traces)
Content-Type             = PASS (Chốt application/json; charset=utf-8)
Cross-Module Consistency = PASS (Áp dụng thống nhất trên 10 Domain Modules)
No Implementation Code   = PASS (Zero SQL, Zero Code, Zero Error Schema, Zero Pagination Schema)
TBD Preservation         = PASS (Bảo lưu 100% TBD cho các task 01.06.04.04 đến 01.06.04.10)

TASK 01.06.04.03 = PASS
```

---
*Tài liệu Hợp đồng Yêu cầu và Phản hồi API được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
