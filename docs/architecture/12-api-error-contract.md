# TÀI LIỆU HỢP ĐỒNG LỖI API (API ERROR CONTRACT SPECIFICATION)
**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.06.04.04 (Micro-Corrected Revision)  
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
**Ngày cập nhật:** 2026-08-08  

---

## 1. PURPOSE (MỤC TIÊU TÀI LIỆU)

Tài liệu này định nghĩa và **chốt khóa duy nhất** Hợp đồng Lỗi API (API Error Contract) cho toàn bộ phân hệ Backend API của hệ thống SportHubAI.

Mục tiêu chính:
1. Thiết lập Cấu trúc Vỏ Phản hồi Lỗi (Error Envelope) thống nhất trên toàn bộ 10 Domain Modules.
2. Quy định Mã lỗi máy đọc được (`error.code` dạng `UPPER_SNAKE_CASE`) để Frontend xử lý logic độc lập với chuỗi thông điệp mô tả (`error.message`).
3. Ánh xạ chính xác các danh mục lỗi nghiệp vụ và kỹ thuật sang Mã trạng thái HTTP (HTTP Status Codes) tiêu chuẩn (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`, `502`, `503`).
4. Định nghĩa cấu trúc báo lỗi kiểm tra dữ liệu theo trường (Field-level Validation Errors) hỗ trợ kiểm tra mảng/trường lồng nhau.
5. Bảo vệ an toàn an ninh hệ thống: Tuyệt đối che giấu 100% chi tiết lỗi hạ tầng, SQL thô, ORM exceptions, stack traces và dữ liệu nhạy cảm ra API Public Contract.

---

## 2. SCOPE (PHẠM VI ÁP DỤNG)

- **Phạm vi Phủ sóng:** Áp dụng bắt buộc cho tất cả các phản hồi lỗi (`4xx Client Errors` và `5xx Server Errors`) của mọi API Endpoints dưới đường dẫn `/api/v1`.
- **Giới hạn Ranh giới:**
  - KHÔNG định nghĩa DTOs phản hồi thành công (`2xx` - Thuộc về Task 01.06.04.03).
  - KHÔNG đặc tả Tham số Truy vấn Phân trang/Lọc (Thuộc về Task 01.06.04.05).
  - KHÔNG viết mã nguồn Exception Interceptor, Exception Filter hay SQL scripts.

---

## 3. SOURCE OF TRUTH (NGUỒN SỰ THẬT VÀ TÍNH KẾ THỪA)

Tài liệu này kế thừa và tuân thủ tuyệt đối các quyết định đã `APPROVED`:

| Thành Phần Kiến Trúc | Quyết Định Đã APPROVED | Giới Hạn Tương Tác Error Contract |
|---|---|---|
| **API Base Path** | `/api/v1` | Áp dụng Error Contract thống nhất cho `/api/v1` |
| **Success Envelope** | `{"data": ...}` | Tách biệt hoàn toàn với Error Envelope `{"error": ...}` |
| **Unknown Fields** | Reject -> 400 Bad Request | Request thừa trường bị từ chối với HTTP 400 |
| **Booking States** | Đúng 8 Trạng Thái APPROVED | Lỗi chuyển trạng thái giữ nguyên 8 states chuẩn |
| **Backend Architecture** | Modular Monolith (Website Scope Only) | Đồng bộ 100% Error Envelope trên 10 Domain Modules |
| **Security Boundary** | Layered Defense & Zero Secret Leakage | Cấm bộc lộ Stack Trace, SQL, ORM, Provider Secrets |

---

## 4. PUBLIC ERROR CONTRACT (HỢP ĐỒNG LỖI CÔNG KHAI API)

Phản hồi lỗi API đóng vai trò là một **Hợp đồng Công khai (Public API Contract)** giữa Backend và Frontend:

- ✅ **Frontend ĐƯỢC PHÉP phụ thuộc vào:** Mã trạng thái HTTP, Mã lỗi máy đọc được (`error.code`), Cấu trúc báo lỗi chi tiết theo trường (`error.details.fields`).
- 💡 **Sử Dụng Trường Request ID (Troubleshooting Only):** Frontend **CÓ THỂ (MAY)** hiển thị hoặc trích xuất trường `error.requestId` khi thuộc tính này xuất hiện để hỗ trợ công tác gỡ lỗi/chăm sóc khách hàng. Frontend **TUYỆT ĐỐI KHÔNG ĐƯỢC (MUST NOT)** phụ thuộc vào `requestId` cho logic nghiệp vụ hay điều khiển luồng ứng dụng.
- ❌ **Frontend CẤM KHÔNG ĐƯỢC phụ thuộc vào:** Tên lớp Exception nội bộ (`BookingNotFoundException`), Stack trace, Cấu trúc câu lệnh SQL, Lỗi ORM Framework hay Thông điệp kỹ thuật thô của server.

---

## 5. ERROR ENVELOPE (CẤU TRÚC VỎ PHẢN HỒI LỖI DUY NHẤT)

Tất cả các phản hồi lỗi từ Backend API bắt buộc phải bọc trong **Một Cấu Trúc Vỏ Phản Hồi Lỗi Duy Nhất (Unified Error Envelope)**:

```json
{
  "error": {
    "code": "ERROR_CODE_NAME",
    "message": "Human-readable error description message.",
    "details": { ... },
    "requestId": "req-unique-correlation-id"
  }
}
```

- ❌ **CẤM:** Không trả về chuỗi lỗi thô (Ví dụ cấm: `{"error": "Booking not found"}`).
- ❌ **CẤM:** Không dùng thuộc tính `{"success": false}` làm vỏ bọc hợp đồng chính.
- ❌ **CẤM:** Không cho phép các Domain Module tự tạo vỏ báo lỗi riêng.

---

## 6. ERROR OBJECT (CẤU TRÚC ĐỐI TƯỢNG LỖI CHUẨN)

Đối tượng lỗi bên trong trường `"error"` bắt buộc phải chứa 2 thuộc tính cốt lõi và 2 thuộc tính bổ trợ tùy chọn:

| Thuộc Tính | Kiểu Dữ Liệu | Tính Bắt Buộc | Diễn Giải Semantics |
|---|---|---|---|
| `code` | `string` | **Bắt buộc** | Mã lỗi máy đọc được (Machine-readable code) dạng `UPPER_SNAKE_CASE`. |
| `message` | `string` | **Bắt buộc** | Thông điệp mô tả lỗi cho người dùng/developer dạng chuỗi đọc được (Human-readable). |
| `details` | `object` | *Tùy chọn* | Đối tượng chứa thông tin lỗi cấu trúc chi tiết (như danh sách các trường bị lỗi). |
| `requestId` | `string` | *Tùy chọn (OPTIONAL)* | Mã nhận diện truy vết yêu cầu (Correlation / Request ID) phục vụ debugging. Không bắt buộc xuất hiện trong mọi error response. |

---

## 7. HTTP STATUS CONVENTION (QUY ƯỚC MÃ TRẠNG THÁI HTTP)

Mã trạng thái HTTP (HTTP Status Code) đại diện cho **Danh mục lỗi ở cấp vận chuyển/API (API Category)**:

| HTTP Status Code | Danh Mục Lỗi (Error Category) | Ý Nghĩa Ngữ Nghĩa (Semantic Meaning) |
|---|---|---|
| **`400 Bad Request`** | Transport / Syntax Error | Request sai định dạng JSON, cú pháp malformed hoặc gửi thừa trường không xác định (`Unknown Request Field`). |
| **`401 Unauthorized`** | Authentication Failure | Yêu cầu thiếu thông tin xác thực hoặc Token/Credential không hợp lệ/hết hạn. |
| **`403 Forbidden`** | Authorization Failure | Người dùng đã xác thực danh tính nhưng không đủ quyền thực hiện (Vi phạm RBAC hoặc Owner Isolation). |
| **`404 Not Found`** | Resource Not Found | Tài nguyên yêu cầu không tồn tại hoặc bị che giấu bởi chính sách an ninh. |
| **`409 Conflict`** | Resource State Conflict | Xung đột trạng thái tài nguyên hoặc xung đột đồng thời (như đặt trùng slot `Double Booking`). |
| **`422 Unprocessable Content`**| Semantic Validation Failure | Cú pháp JSON đúng nhưng vi phạm kiểm tra ngữ nghĩa/ràng buộc thuộc tính (như `endTime <= startTime`). |
| **`429 Too Many Requests`** | Rate Limit Exceeded | Client gửi vượt quá giới hạn tần suất yêu cầu cho phép. |
| **`500 Internal Server Error`** | System Internal Error | Sự cố nội bộ Backend không lường trước (Server Exception). |
| **`502 Bad Gateway`** | External Service Error | Dịch vụ bên ngoài (MoMo Gateway, Email Provider, AI Service) phản hồi lỗi hoặc không kết nối được. |
| **`503 Service Unavailable`** | Service Temporary Down | Hạ tầng Backend hoặc dịch vụ phụ thuộc tạm thời ngưng hoạt động để bảo trì. |

---

## 8. ERROR CODE CONVENTION (QUY ƯỚC MÃ LỖI MÁY ĐỌC ĐƯỢC)

Thuộc tính `error.code` là Nguồn xác định nguyên nhân lỗi cho Client (Machine-readable Identifier):

- **Định Dạng Bắt Buộc:** Viết bằng chữ in hoa, phân tách bằng dấu gạch dưới (`UPPER_SNAKE_CASE`).
- **Tính Bất Biến:** Mã lỗi phải cố định, độc nhất trong API Contract và không thay đổi theo thời gian trong cùng API version.
- **Ranh Giới Sạch:**
  - ❌ **CẤM chèn HTTP Status vào Mã Lỗi:** Không dùng `404_BOOKING_NOT_FOUND` hay `ERR_500`.
  - ❌ **CẤM chèn Tên Công Nghệ Hạ Tầng:** Không dùng `MYSQL_DUPLICATE_KEY` hay `NESTJS_VALIDATION_ERROR`.
  - ✅ **Chuẩn:** `BOOKING_NOT_FOUND`, `BOOKING_SLOT_OCCUPIED`, `VALIDATION_ERROR`.

---

## 9. ERROR MESSAGE CONVENTION (QUY ƯỚC THÔNG ĐIỆP LỖI MÔ TẢ)

- **Mục Đích:** Thuộc tính `error.message` phục vụ cho con người đọc (Human-readable description).
- **Cấm Tuyệt Đối Lỗi Kỹ Thuật Thô:**
  - ❌ Không chứa câu lệnh SQL (Ví dụ cấm: `"SQLSTATE[23000]: Integrity constraint violation"`).
  - ❌ Không chứa Tên Exception/Stack Trace (Ví dụ cấm: `"NullPointerException at BookingService.java:142"`).
  - ❌ Không chứa thông tin bí mật hay đường dẫn file nội bộ server.
- **Quy Tắc Xử Lý Frontend:** Frontend **không được parse chuỗi `error.message`** để rẽ nhánh logic nghiệp vụ; việc rẽ nhánh logic bắt buộc dựa trên `error.code`.

---

## 10. VALIDATION ERROR ARCHITECTURE (KIẾN TRÚC BÁO LỖI KIỂM TRA DỮ LIỆU)

Khi Request bị vi phạm quy tắc kiểm tra dữ liệu đầu vào (Validation Failure), API trả về mã lỗi chuẩn `VALIDATION_ERROR`:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": {
      "fields": [
        {
          "field": "startTime",
          "code": "REQUIRED",
          "message": "Start time is required."
        }
      ]
    }
  }
}
```

---

## 11. FIELD-LEVEL VALIDATION ERROR STRUCTURE (CẤU TRÚC BÁO LỖI THEO TRƯỜNG)

Danh sách lỗi vi phạm chi tiết theo trường nằm trong thuộc tính `error.details.fields` (Mảng đối tượng):

| Thuộc Tính Trong Field Error | Kiểu Dữ Liệu | Diễn Giải | Ví Dụ |
|---|---|---|---|
| `field` | `string` | Tên thuộc tính bị lỗi theo dạng `camelCase` (hỗ trợ nested path bằng dấu chấm `.`). | `"startTime"`, `"customer.phone"` |
| `code` | `string` | Mã loại vi phạm kiểm tra (`UPPER_SNAKE_CASE`). | `"REQUIRED"`, `"INVALID_FORMAT"`, `"MIN_VALUE"` |
| `message` | `string` | Thông điệp mô tả lỗi chi tiết cho trường đó. | `"Start time is required."` |

### Hỗ Trợ Nhiều Lỗi Đồng Thời (Multiple Validation Errors):
Backend phản hồi danh sách **tất cả các trường bị lỗi trong một lần trả về** để Frontend hiển thị trọn vẹn trên biểu mẫu (Form UI), tránh ép người dùng phải sửa từng lỗi qua nhiều lần bấm submit.

---

## 12. AUTHENTICATION ERRORS (LỖI XÁC THỰC DANH TÍNH - HTTP 401)

Lỗi xác thực danh tính xảy ra khi Client gọi API bảo vệ nhưng thiếu hoặc sai thông tin xác thực:

- **Mã Trạng Thái:** `401 Unauthorized`.
- **Mã Lỗi Chuẩn:**
  - `AUTHENTICATION_REQUIRED`: Yêu cầu chưa cung cấp thông tin xác thực.
  - `AUTHENTICATION_INVALID`: Credentials/Token xác thực không hợp lệ hoặc đã hết hạn.
- **Bảo Mật An Ninh:** Tuyệt đối không trả về thông tin thư viện token (JWT exception), không in chuỗi secret key hay stack trace ra phản hồi.

---

## 13. AUTHORIZATION ERRORS (LỖI PHÂN QUYỀN TRUY CẬP - HTTP 403)

Lỗi phân quyền xảy ra khi danh tính đã xác thực thành công nhưng không có quyền thực thi Use Case:

- **Mã Trạng Thái:** `403 Forbidden`.
- **Mã Lỗi Chuẩn:** `FORBIDDEN`.
- **Ranh Giới Bảo Mật:** Áp dụng thống nhất cho cả vi phạm vai trò người dùng (RBAC Failure) và vi phạm phân vùng dữ liệu đối tác (`Owner Tenant Isolation Boundary`). Không bộc lộ chi tiết phân quyền nội bộ hệ thống.

---

## 14. NOT FOUND ERRORS (LỖI KHÔNG TÌM THẤY TÀI NGUYÊN - HTTP 404)

Lỗi xảy ra khi tài nguyên yêu cầu không tồn tại trong hệ thống:

- **Mã Trạng Thái:** `404 Not Found`.
- **Mã Lỗi Chuẩn:** `{RESOURCE}_NOT_FOUND` (Ví dụ: `BOOKING_NOT_FOUND`, `VENUE_NOT_FOUND`, `COURT_NOT_FOUND`, `PAYMENT_NOT_FOUND`).
- **Quy Tắc Che Giấu Bảo Mật (Security Masking):** Nếu chính sách an ninh yêu cầu che giấu sự tồn tại của tài nguyên ngoài phạm vi sở hữu của Owner, hệ thống được phép phản hồi `404 Not Found` (thay vì `403 Forbidden`) để ngăn chặn việc dò quét dữ liệu (Data Enumeration).

---

## 15. CONFLICT ERRORS (LỖI XUNG ĐỘT TRẠNG THÁI / ĐỒNG THỜI - HTTP 409)

Lỗi xảy ra khi thao tác yêu cầu bị xung đột với trạng thái hiện tại của tài nguyên hoặc có xung đột đồng thời:

- **Mã Trạng Thái:** `409 Conflict`.
- **Mã Lỗi Chuẩn:**
  - `BOOKING_SLOT_OCCUPIED`: Khung giờ đặt sân đã bị người khác đặt hoặc khóa.
  - `RESOURCE_STATE_CONFLICT`: Trạng thái tài nguyên xung đột với thao tác.
  - `DUPLICATE_RESOURCE`: Tài nguyên đã tồn tại trong hệ thống.

---

## 16. BUSINESS RULE ERRORS (LỖI VI PHẠM QUY TẮC NGHIỆP VỤ)

Các lỗi vi phạm Business Rules (đã được định nghĩa tại Task 01.04) được phản hồi kèm Mã lỗi nghiệp vụ rõ ràng:

- **Quy Tắc Phân Tầng:** HTTP Status đại diện cho nhóm lỗi (`409 Conflict` hoặc `422 Unprocessable Content`), thuộc tính `error.code` đại diện cho quy tắc nghiệp vụ cụ thể bị vi phạm.
- ❌ **CẤM:** Không tự tiện phát minh thêm hàng loạt mã lỗi nghiệp vụ khi không có Use Case hoặc Business Rule tương ứng hỗ trợ.

---

## 17. BOOKING ERRORS (LỖI TRONG PHÂN HỆ ĐẶT SÂN)

Bảo tồn nguyên trạng **8 Trạng thái Đặt sân Chuẩn (8 Approved Booking States)** từ Backend Architecture:

- **Phân Biệt Rõ:** Trạng thái đơn đặt sân (`Booking Status`) và Mã lỗi API (`Error Code`) là 2 khái niệm hoàn toàn khác nhau.
- **Mã Lỗi Đặt Sân Chuẩn:**
  - `BOOKING_NOT_FOUND`: Đơn đặt sân không tồn tại.
  - `BOOKING_SLOT_OCCUPIED`: Slot đã bị giữ chỗ/đặt bởi người khác (`BR-BOOK-003`).
  - `BOOKING_HOLD_EXPIRED`: Đơn giữ chỗ 10 phút đã hết hạn (`BR-BOOK-002`).
  - `BOOKING_STATE_INVALID`: Chuyển trạng thái đơn không hợp lệ theo Máy trạng thái đơn hàng (`Booking State Machine`).
  - `BOOKING_CANCELLATION_INVALID`: Đơn hàng không đủ điều kiện để hủy (`BR-CANCEL-001`).

---

## 18. PAYMENT ERRORS (LỖI TRONG PHÂN HỆ THANH TOÁN)

- **Mã Lỗi Thanh Toán Chuẩn:**
  - `PAYMENT_NOT_FOUND`: Giao dịch thanh toán không tồn tại.
  - `PAYMENT_INVALID_AMOUNT`: Số tiền thanh toán không khớp với đơn hàng (`BR-PAY-002`).
  - `PAYMENT_STATE_INVALID`: Trạng thái thanh toán không cho phép thực hiện thao tác.
  - `PAYMENT_PROVIDER_ERROR`: Phản hồi lỗi từ Cổng thanh toán MoMo.
- **Ranh Giới An Ninh:** MoMo IPN Callback vẫn là Nguồn sự thật (Source of Truth). Tuyệt đối **không bộc lộ Chữ ký số MoMo (HMAC Signature)**, MoMo Secret Keys hay chi tiết lỗi thô từ MoMo SDK trong phản hồi API.

---

## 19. RATE LIMIT ERRORS (LỖI VƯỢT QUÁ TẦN SUẤT YÊU CẦU - HTTP 429)

Khi Client gửi số lượng yêu cầu vượt quá định mức cho phép trong một khoảng thời gian:

- **Mã Trạng Thái:** `429 Too Many Requests`.
- **Mã Lỗi Chuẩn:** `RATE_LIMIT_EXCEEDED`.
- **Mô Tả:** `"Too many requests. Please try again later."`

---

## 20. EXTERNAL SERVICE ERRORS (LỖI DỊCH VỤ BÊN NGOÀI - HTTP 502 / 503)

Khi Infrastructure Adapter gặp sự cố không thể kết nối hoặc nhận phản hồi lỗi từ Dịch vụ Bên ngoài (MoMo Gateway, Real Email Provider, External AI Service):

- **Mã Trạng Thái:** `502 Bad Gateway` (Dịch vụ bên ngoài phản hồi lỗi) hoặc `503 Service Unavailable` (Dịch vụ ngưng kết nối).
- **Mã Lỗi Chuẩn:** `EXTERNAL_SERVICE_ERROR`.
- **Bảo Mật An Ninh:** Phản hồi API chỉ trả về mã lỗi chuẩn chung. Tuyệt đối **không trả về Exception thô** của SDK bên ngoài (Cấm trả: `MoMoSDKException`, `SmtpTransportException`, `OpenAIException`).

---

## 21. INTERNAL SERVER ERRORS (LỖI SỰ CỐ NỘI BỘ BACKEND - HTTP 500)

Khi xảy ra lỗi ngoại lệ không lường trước (Unhandled Server Exception) trong quá trình xử lý:

- **Mã Trạng Thái:** `500 Internal Server Error`.
- **Mã Lỗi Chuẩn:** `INTERNAL_SERVER_ERROR`.
- **Nội Dung Phản Hồi Chuẩn:**
  ```json
  {
    "error": {
      "code": "INTERNAL_SERVER_ERROR",
      "message": "An unexpected internal server error occurred. Please try again later.",
      "requestId": "req-998877"
    }
  }
  ```
- **Bảo Mật Tuyệt Đối:** Phản hồi `500` **tuyệt đối KHÔNG chứa Stack Trace**, mã SQL, tên file mã nguồn, tên class hay thông tin hạ tầng nội bộ. Toàn bộ chi tiết lỗi thô chỉ được ghi lại trong Technical System Logs phía Server.

---

## 22. ERROR DETAILS & METADATA (THUỘC TÍNH CHI TIẾT BỔ TRỢ DETAIL)

- Thuộc tính `error.details` chỉ được sử dụng khi Client cần dữ liệu lỗi có cấu trúc máy đọc được để hỗ trợ giao diện.
- **Ranh Giới:** `details` chỉ chứa dữ liệu an toàn được định nghĩa trong contract (như mảng `fields` kiểm tra dữ liệu). Tuyệt đối **không biến `details` thành nơi xả dữ liệu Exception thô** (Exception Dump).

---

## 23. REQUEST / CORRELATION ID EXPOSURE (RANH GIỚI HIỂN THỊ MÃ TRUY VẾT LỖI)

- Đối tượng lỗi có thể đính kèm thuộc tính tùy chọn `error.requestId` để hỗ trợ công tác troubleshooting / kỹ thuật khi có:
  ```json
  "requestId": "req-20260808-abcd-1234"
  ```
- **Ranh Giới Semantics:**
  - `requestId` là thuộc tính **OPTIONAL**, không bắt buộc xuất hiện trong mọi phản hồi lỗi.
  - Frontend **CÓ THỂ (MAY)** sử dụng `error.requestId` khi trường này xuất hiện để hiển thị thông tin hỗ trợ kỹ thuật cho người dùng.
  - Frontend **TUYỆT ĐỐI KHÔNG ĐƯỢC (MUST NOT)** phụ thuộc vào `requestId` để điều khiển luồng ứng dụng hay logic nghiệp vụ.
  - Tên Header Correlation ID và cơ chế sinh requestId tiếp tục giữ nguyên `TBD — Refer to Observability Architecture`.

---

## 24. SECURITY & SENSITIVE MASKING (CHE GIẤU DỮ LIỆU NHẠY CẢM TRONG ERROR)

Bộ lọc Phản hồi Lỗi (Error Response Filter) bắt buộc phải che giấu 100% các dữ liệu nhạy cảm trước khi gửi về Client:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY ERROR RESPONSE MASKING FILTER                          │
│                                                                                        │
│ ❌ REMOVE & MASK:                                                                      │
│   - Passwords & Password Hashes                                                        │
│   - OTP Secrets & OTP Hashes                                                           │
│   - MoMo HMAC Signatures & API Secret Keys                                             │
│   - Database Connection String, Hostnames, Ports                                       │
│   - SQL Execution Queries & Database Error Codes                                       │
│   - Server Stack Traces, File System Paths & Class Names                               │
│   - Internal Infrastructure Topology & Credentials                                     │
│                                                                                        │
│ ✔ ONLY RETURN:                                                                         │
│   - HTTP Status + Clean Error Envelope (code, message, details, requestId optional)   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 25. CROSS-MODULE ERROR CONSISTENCY (TÍNH NHẤT QUÁN CẢNH BÁO LỖI GIỮA CÁC MODULE)

Tất cả 10 Domain Modules trong Backend Modular Monolith bắt buộc phải dùng chung 100%:
- Cấu trúc Error Envelope (`{"error": { ... }}`).
- Quy ước mã lỗi `UPPER_SNAKE_CASE`.
- Quy ước danh mục mã trạng thái HTTP.
- Quy chuẩn mảng báo lỗi chi tiết theo trường (`details.fields`).
- Quy tắc che giấu dữ liệu nhạy cảm.

---

## 26. BACKWARD COMPATIBILITY OF ERROR CONTRACT (TƯƠNG THÍCH NGƯỢC HỢP ĐỒNG LỖI)

- **Quy Tắc Tương Thích:** Trong cùng một phiên bản API (`/api/v1`), Backend **KHÔNG ĐƯỢC**:
  - Đổi tên một mã lỗi `error.code` đã phát hành.
  - Thay đổi ý nghĩa ngữ nghĩa của một mã lỗi.
  - Thay đổi cấu trúc mảng `details.fields`.
- **Thêm Mã Lỗi Mới:** Việc bổ sung một `error.code` mới được coi là thay đổi không phá vỡ (Non-breaking change). Frontend bắt buộc phải viết mã dựa trên `error.code` thay vì parse chuỗi `error.message`.

---

## 27. ERROR CODE REGISTRY (DANH MỤC MÃ LỖI CHUẨN HÓA TOÀN SYSTEM)

Danh mục Mã lỗi (Error Code Registry) được phân định rạch ròi thành 2 nhóm: **CORE / APPROVED ERROR CODES** (Mã lỗi cốt lõi đã có use case/contract rõ ràng) và **CONDITIONAL / RESERVED ERROR CODES** (Mã lỗi chung dự phòng, bắt buộc phải có Use Case hoặc Business Rule cụ thể mới được phép phát ra).

### Group 1: CORE / APPROVED ERROR CODES (Mã Lỗi Cốt Lõi Đã APPROVED)

| Category | Error Code (`UPPER_SNAKE_CASE`) | HTTP Status | Diễn Giải Ngữ Nghĩa |
|---|---|---|---|
| **TRANSPORT** | `INVALID_REQUEST_FORMAT` | 400 | Cú pháp JSON malformed hoặc request không hợp lệ. |
| **TRANSPORT** | `UNKNOWN_REQUEST_FIELD` | 400 | Request chứa trường thừa không xác định (Reject 400). |
| **AUTH** | `AUTHENTICATION_REQUIRED` | 401 | Yêu cầu xác thực nhưng chưa cung cấp token. |
| **AUTH** | `AUTHENTICATION_INVALID` | 401 | Token/Credential không hợp lệ hoặc đã hết hạn. |
| **AUTHORIZATION** | `FORBIDDEN` | 403 | Không đủ quyền thực hiện (RBAC / Tenant Isolation). |
| **VALIDATION** | `VALIDATION_ERROR` | 422 / 400 | Vi phạm quy tắc kiểm tra dữ liệu đầu vào. |
| **RESOURCE** | `RESOURCE_NOT_FOUND` | 404 | Tài nguyên yêu cầu không tồn tại. |
| **BOOKING** | `BOOKING_NOT_FOUND` | 404 | Đơn đặt sân không tồn tại. |
| **BOOKING** | `BOOKING_SLOT_OCCUPIED` | 409 | Slot sân đã bị chiếm hoặc khóa (`Double Booking`). |
| **BOOKING** | `BOOKING_HOLD_EXPIRED` | 409 | Thời gian 10 phút giữ chỗ đã hết hạn (`BR-BOOK-002`). |
| **BOOKING** | `BOOKING_STATE_INVALID` | 409 | Chuyển trạng thái đơn không hợp lệ (State Machine). |
| **BOOKING** | `BOOKING_CANCELLATION_INVALID`| 409 | Đơn hàng không đủ điều kiện để hủy (`BR-CANCEL-001`). |
| **PAYMENT** | `PAYMENT_NOT_FOUND` | 404 | Giao dịch thanh toán không tồn tại. |
| **RATE_LIMIT** | `RATE_LIMIT_EXCEEDED` | 429 | Vượt quá giới hạn tần suất gọi API. |
| **SYSTEM** | `INTERNAL_SERVER_ERROR` | 500 | Sự cố ngoại lệ nội bộ hệ thống Backend. |
| **EXTERNAL** | `EXTERNAL_SERVICE_ERROR` | 502 / 503 | Dịch vụ bên ngoài gặp sự cố hoặc ngưng kết nối. |

### Group 2: CONDITIONAL / RESERVED ERROR CODES (Mã Lỗi Dự Phòng Có Điều Kiện)

Các mã lỗi dưới đây mang tính chất dự phòng chung (Generic Error Codes). **CẤM TỰ Ý SỬ DỤNG** nếu không có Use Case, Business Rule hoặc API Contract cụ thể được phê duyệt tương ứng:

| Category | Error Code (`UPPER_SNAKE_CASE`) | HTTP Status | Điều Kiện Áp Dụng Ràng Buộc |
|---|---|---|---|
| **RESOURCE** | `RESOURCE_STATE_CONFLICT` | 409 | Chỉ dùng khi Use Case chỉ định rõ xung đột trạng thái tài nguyên tổng quát. |
| **RESOURCE** | `DUPLICATE_RESOURCE` | 409 | Chỉ dùng khi Business Rule định nghĩa quy tắc chống trùng lặp cụ thể. |
| **PAYMENT** | `PAYMENT_INVALID_AMOUNT` | 400 / 409 | Chỉ dùng khi có Use Case xác thực số tiền thanh toán không khớp đơn. |
| **PAYMENT** | `PAYMENT_STATE_INVALID` | 409 | Chỉ dùng khi có Use Case kiểm tra trạng thái giao dịch MoMo. |
| **PAYMENT** | `PAYMENT_PROVIDER_ERROR` | 502 | Chỉ dùng khi MoMo SDK / IPN phàn hồi lỗi hạ tầng thanh toán. |

---

## 28. ENDPOINT ERROR EXAMPLES (VÍ DỤ PHẢN HỒI LỖI MINH HỌA)

### Example 1: Request Validation Error (`422 Unprocessable Content`)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": {
      "fields": [
        {
          "field": "startTime",
          "code": "REQUIRED",
          "message": "Start time is required."
        },
        {
          "field": "bookingDate",
          "code": "INVALID_FORMAT",
          "message": "Date format must be YYYY-MM-DD."
        }
      ]
    },
    "requestId": "req-val-001"
  }
}
```

### Example 2: Double Booking Slot Conflict (`409 Conflict`)
```json
{
  "error": {
    "code": "BOOKING_SLOT_OCCUPIED",
    "message": "The selected court and time slot is already booked or held by another user.",
    "requestId": "req-book-409"
  }
}
```

### Example 3: Authentication Required (`401 Unauthorized`)
```json
{
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authentication token is missing or invalid.",
    "requestId": "req-auth-401"
  }
}
```

### Example 4: Internal Server Error (`500 Internal Server Error`)
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected internal server error occurred. Please try again later.",
    "requestId": "req-sys-500"
  }
}
```

---

## 29. OPEN QUESTIONS / TBD PRESERVATION (BẢO LƯU CÁC MỤC CHƯA CHỐT)

Task 01.06.04.04 đã chốt duy nhất Cấu trúc Error Envelope, Error Code Registry phân loại Core/Conditional, HTTP Status Mapping và Field Validation Structure. Các mục sau tiếp tục giữ trạng thái `TBD` cho các sub-task hạ tầng tiếp theo:

1. **API-TBD-005: Idempotency Header Name:** Tên Header Idempotency giữ trạng thái `TBD — Refer to TASK 01.06.04.09`.
2. **API-TBD-006: Correlation ID Header Name:** Tên Header Correlation ID trên HTTP Request/Response giữ trạng thái `TBD — Refer to Observability Architecture`.
3. **API-TBD-011: Framework Exception Filter Class:** Mã nguồn lớp Exception Filter nội bộ của Web Framework giữ trạng thái `TBD`.
4. **API-TBD-012: External Payment Retry Strategy:** Chiến lược thử lại (Retry Policy) khi MoMo IPN gặp sự cố hạ tầng giữ trạng thái `TBD`.

---

## 30. NON-GOALS (CÁC NỘI DUNG KHÔNG THỰC HIỆN TRONG TASK NÀY)

- ❌ Không định nghĩa DTOs phản hồi thành công (`2xx`).
- ❌ Không đặc tả tham số query phân trang (`pageIndex`, `pageSize`).
- ❌ Không định nghĩa Header Authentication hay cơ chế tạo JWT.
- ❌ Không viết mã nguồn Exception Interceptor hay TypeScript classes.
- ❌ Không thay đổi bất kỳ Business Rule hay Booking State nào.

---

## 31. DEFINITION OF DONE (DoD) - TASK 01.06.04.04

```text
Error Envelope           = PASS (Chốt duy nhất cấu trúc envelope: {"error": { ... }})
Error Object             = PASS (Chốt đầy đủ code, message, details, requestId optional)
Machine-Readable Code    = PASS (Chốt error.code dạng UPPER_SNAKE_CASE)
Human-Readable Message   = PASS (Chốt error.message mô tả sạch, cấm chứa stack trace/SQL)
HTTP Status Convention   = PASS (Ánh xạ chuẩn 400, 401, 403, 404, 409, 422, 429, 500, 502, 503)
400 Bad Request          = PASS (Cho malformed request & unknown request fields)
401 Unauthorized         = PASS (Cho lỗi thiếu/sai thông tin xác thực)
403 Forbidden            = PASS (Cho lỗi vi phạm phân quyền RBAC & Owner Isolation)
404 Not Found            = PASS (Cho tài nguyên không tồn tại, hỗ trợ security masking)
409 Conflict             = PASS (Cho xung đột trạng thái & đúp đè slot đặt sân Double Booking)
422 Unprocessable Content= PASS (Cho vi phạm rào cản ngữ nghĩa validation)
429 Too Many Requests    = PASS (Cho lỗi vượt quá định mức tần suất gọi API)
500 Internal Server Error= PASS (Cho lỗi hệ thống nội bộ, che giấu 100% stack trace)
External Service Errors  = PASS (502/503 cho lỗi MoMo/Email/AI, cấm leak SDK Exception)
Validation Error Struct  = PASS (Chốt cấu trúc chuẩn details.fields mảng các trường bị lỗi)
Field-Level Validation   = PASS (Bao gồm field, code, message hỗ trợ nested fields)
Multiple Validation Error= PASS (Báo tất cả các trường lỗi trong 1 response)
Booking Errors           = PASS (Bảo tồn 8 Booking States chuẩn, tách biệt status vs error code)
Payment Errors           = PASS (Bảo tồn MoMo IPN Source of Truth, cấm leak secret/signature)
Security & Masking       = PASS (Che giấu 100% passwords, OTP, secrets, SQL, stack traces)
Request ID Semantics     = PASS (requestId là OPTIONAL, Frontend MAY dùng cho troubleshooting, MUST NOT phụ thuộc cho flow control)
Correlation Header TBD   = PASS (Tên Correlation Header giữ nguyên TBD ở Observability Architecture)
Error Code Registry      = PASS (Phân định rạch ròi CORE/APPROVED Error Codes và CONDITIONAL/RESERVED Error Codes)
Cross-Module Consistency = PASS (Áp dụng thống nhất trên 10 Domain Modules)
Backward Compatibility   = PASS (Cấm đổi tên code/status trong cùng 1 API version)
Framework Exclusivity    = PASS (Không phụ thuộc exception class của web framework)
No Implementation Code   = PASS (Zero SQL, Zero Code, Zero DTO Success, Zero Pagination)
TBD Preservation         = PASS (Bảo lưu 100% TBD cho các task tiếp theo)

TASK 01.06.04.04 = PASS
```

---
*Tài liệu Hợp đồng Lỗi API được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
