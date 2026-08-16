# TÀI LIỆU YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS SPECIFICATION)
**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.03 (Final Coverage & Boundary Corrected)  
**Trạng thái:** Standardized Specification  
**Tham chiếu:**  
- [01-actors-and-permissions.md](file:///e:/SportHubAI/docs/requirements/01-actors-and-permissions.md) (APPROVED)  
- [02-use-cases-and-user-flows.md](file:///e:/SportHubAI/docs/requirements/02-use-cases-and-user-flows.md) (APPROVED)  
**Ngày cập nhật:** 2026-08-08  

---

## 1. Tổng Quan & Nguyên Tắc Chuyển Đổi

Tài liệu này chuyển đổi toàn bộ các Use Case và User Flow đã được phê duyệt (`APPROVED`) ở Task 01.01 và Task 01.02 thành tập hợp các **Yêu cầu chức năng (Functional Requirements - FR)** có định danh chuẩn hóa, có thể kiểm thử (`Testable`), và đảm bảo độ bao phủ truy vết (`100% Traceability Coverage`).

### Nguyên Tắc Thiết Lập Requirement:
1. **Mô tả WHAT, độc lập tuyệt đối với HOW:** Tuyệt đối không mô tả Database (tables, columns, SQL queries, FK/PK), REST API Endpoints (methods, URLs, HTTP status codes), Controller, Service, Repository, Queue, Worker, UI components hoặc code implementation.
2. **Không tự tạo Business Rules mới / Giữ nguyên TBD:** Các vấn đề đang là Open Question (như tỷ lệ hoàn tiền hủy đơn, quy trình duyệt trả sau tại sân, phạm vi đối tượng review Venue/Court, kênh phát thông báo) được bảo lưu đúng trạng thái `TBD — Business Decision Required`.
3. **Phân cấp Mức độ Ưu tiên (Priority Mapping):**
   - `MUST`: Bắt buộc cho phạm vi MVP (Mapping với Use Case `MVP`).
   - `SHOULD` / `COULD`: Tùy chọn / Ứng viên phát triển (Mapping với Use Case `OPTIONAL / MVP Candidate`).
   - `FUTURE`: Chức năng quy hoạch phiên bản sau (Mapping với Use Case `FUTURE`).
   - `TBD`: Chưa chốt quyết định nghiệp vụ (Mapping với Use Case `TBD`).

---

## 2. Quy Ước Mã Yêu Cầu Chức Năng (Requirement ID Convention)

- `FR-AUTH-xxx`: Xác thực & Quản lý Tài khoản (Authentication & Account Management)
- `FR-GUEST-xxx`: Tìm kiếm & Khám phá công khai (Guest Browsing & Discovery)
- `FR-CUST-xxx`: Quản lý Hồ sơ, Yêu thích & Đơn hàng của Customer (Customer Account & Profile)
- `FR-BOOK-xxx`: Động cơ Đặt lịch & Quản lý Slot (Booking Engine & Availability)
- `FR-PAY-xxx`: Tích hợp Thanh toán (Payment Integration)
- `FR-VENUE-xxx`: Quản lý Cơ sở Thể thao (Venue Management)
- `FR-COURT-xxx`: Quản lý Sân con & Tiện ích (Court Management)
- `FR-SCHED-xxx`: Lịch vận hành & Cấu hình Bảng giá (Schedule & Pricing)
- `FR-OWNER-xxx`: Vận hành, Đặt tại sân & Báo cáo của Owner (Owner Operations & Reports)
- `FR-ADMIN-xxx`: Kiểm duyệt, Quản trị & Giám sát của Admin (Admin Supervision)
- `FR-REVIEW-xxx`: Đánh giá & Phản hồi (Review Management)
- `FR-NOTI-xxx`: Thông báo hệ thống (Notification Engine)
- `FR-SYS-xxx`: Tác vụ nền tự động hệ thống (System Automated Processing)

---

## 3. Yêu Cầu Chức Năng Chi Tiết (Detailed Functional Requirements)

### 3.1. Authentication & Account Management (FR-AUTH)

#### FR-AUTH-001: Customer Account Registration
- **Requirement ID:** FR-AUTH-001
- **Requirement Name:** Customer Account Registration
- **Description:** Hệ thống phải cho phép người dùng đăng ký tài khoản Customer mới bằng cách cung cấp các thông tin bắt buộc gồm Họ tên, Email, Mật khẩu và Số điện thoại.
- **Actor:** GUEST / CUSTOMER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-001 Register`
- **Preconditions:** Người dùng chưa đăng nhập. Email chưa tồn tại trong hệ thống.
- **Trigger:** Người dùng điền thông tin đăng ký và gửi yêu cầu.
- **Functional Behavior:**
  1. System kiểm tra tính đầy đủ của dữ liệu và kiểm tra Email trùng lặp.
  2. System tạo tài khoản ở trạng thái `UNVERIFIED`.
  3. System khởi tạo mã OTP xác thực và gửi tới địa chỉ Email thực của người dùng (Không sử dụng OTP giả lập trong luồng vận hành).
- **Success Result:** Tài khoản được khởi tạo thành công ở trạng thái `UNVERIFIED`, thông báo yêu cầu xác thực OTP gửi tới Email.
- **Failure / Exception:** Nếu Email đã tồn tại hoặc thông tin không hợp lệ, System từ chối đăng ký và hiển thị thông báo lỗi rõ ràng.
- **Business Rules:** `BR-001`
- **Acceptance Criteria:**
  - *Given:* Người dùng cung cấp Email hợp lệ chưa đăng ký trên hệ thống.
  - *When:* Người dùng gửi Form đăng ký.
  - *Then:* Tài khoản được tạo ở trạng thái `UNVERIFIED` và một Email chứa mã OTP xác thực được gửi đến hộp thư của người dùng.

#### FR-AUTH-002: Email OTP Verification
- **Requirement ID:** FR-AUTH-002
- **Requirement Name:** Email OTP Verification
- **Description:** Hệ thống phải xác thực mã OTP do người dùng nhập từ Email để chuyển trạng thái tài khoản từ `UNVERIFIED` sang `ACTIVE`.
- **Actor:** CUSTOMER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-002 Verify Email OTP`
- **Preconditions:** Tài khoản đã được đăng ký và đang ở trạng thái `UNVERIFIED`.
- **Trigger:** Người dùng nhập mã OTP và nhấn xác thực.
- **Functional Behavior:**
  1. System so sánh mã OTP người dùng nhập với mã OTP đã tạo.
  2. System kiểm tra thời hạn hiệu lực của OTP (Thời gian hết hạn OTP và giới hạn số lần gửi lại: `TBD`).
  3. Nếu mã hợp lệ, System chuyển trạng thái tài khoản thành `ACTIVE`.
- **Success Result:** Tài khoản được kích hoạt `ACTIVE`, người dùng có thể thực hiện đăng nhập.
- **Failure / Exception:** Nếu OTP không chính xác hoặc hết hạn, System thông báo lỗi và cung cấp lựa chọn gửi lại OTP.
- **Business Rules:** `BR-001`
- **Acceptance Criteria:**
  - *Given:* Tài khoản ở trạng thái `UNVERIFIED` và có OTP còn hiệu lực.
  - *When:* Người dùng nhập đúng mã OTP.
  - *Then:* Trạng thái tài khoản chuyển thành `ACTIVE`.

#### FR-AUTH-003: User Login Authentication
- **Requirement ID:** FR-AUTH-003
- **Requirement Name:** User Login Authentication
- **Description:** Hệ thống phải xác thực thông tin tài khoản (Email và Mật khẩu) và thiết lập phiên làm việc với quyền tương ứng (`CUSTOMER`, `OWNER`, `ADMIN`).
- **Actor:** CUSTOMER / OWNER / ADMIN
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-003 Login`
- **Preconditions:** Tài khoản đã tồn tại trong hệ thống.
- **Trigger:** Người dùng nhập Email, Mật khẩu và nhấn "Đăng nhập".
- **Functional Behavior:**
  1. System kiểm tra Email và Mật khẩu khớp với dữ liệu lưu trữ.
  2. System kiểm tra trạng thái tài khoản. Nếu `UNVERIFIED` hoặc `SUSPENDED`, System từ chối đăng nhập.
  3. Nếu tài khoản `ACTIVE`, System thiết lập phiên làm việc theo vai trò của người dùng.
- **Success Result:** Người dùng đăng nhập thành công và được xác thực quyền hạn làm việc.
- **Failure / Exception:** System hiển thị thông báo "Email hoặc mật khẩu không chính xác" hoặc thông báo tài khoản bị tạm khóa.
- **Business Rules:** `BR-001`
- **Acceptance Criteria:**
  - *Given:* Tài khoản người dùng ở trạng thái `ACTIVE`.
  - *When:* Người dùng nhập đúng Email và Mật khẩu.
  - *Then:* Đăng nhập thành công và phiên làm việc được thiết lập.

#### FR-AUTH-004: Password Reset via OTP
- **Requirement ID:** FR-AUTH-004
- **Requirement Name:** Password Reset via OTP
- **Description:** Hệ thống phải hỗ trợ người dùng quên mật khẩu xác thực qua mã OTP Email để đặt lại mật khẩu mới.
- **Actor:** CUSTOMER / OWNER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-005 Forgot Password`, `UC-C-006 Reset Password`
- **Preconditions:** Email người dùng tồn tại trên hệ thống.
- **Trigger:** Người dùng yêu cầu quên mật khẩu và xác nhận Email.
- **Functional Behavior:**
  1. System kiểm tra sự tồn tại của Email.
  2. System tạo mã OTP khôi phục mật khẩu gửi tới Email người dùng.
  3. Sau khi xác thực đúng mã OTP, System cập nhật mật khẩu mới do người dùng thiết lập.
- **Success Result:** Mật khẩu mới được cập nhật thành công.
- **Failure / Exception:** Nếu Email không tồn tại hoặc OTP sai, System hiển thị thông báo lỗi.
- **Business Rules:** `BR-001`
- **Acceptance Criteria:**
  - *Given:* Người dùng nhập Email tài khoản đã đăng ký.
  - *When:* Người dùng xác thực đúng OTP và nhập mật khẩu mới.
  - *Then:* Mật khẩu mới được lưu thành công.

#### FR-AUTH-005: User Logout
- **Requirement ID:** FR-AUTH-005
- **Requirement Name:** User Logout
- **Description:** Hệ thống phải cho phép người dùng đã đăng nhập thực hiện đăng xuất và hủy bỏ phiên làm việc hiện tại.
- **Actor:** CUSTOMER / OWNER / ADMIN
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-004 Logout`
- **Preconditions:** Người dùng đang trong phiên đăng nhập.
- **Trigger:** Người dùng nhấn nút "Đăng xuất".
- **Functional Behavior:**
  1. System hủy bỏ phiên làm việc của người dùng.
  2. System chuyển hướng người dùng về trạng thái GUEST.
- **Success Result:** Đăng xuất thành công, phiên làm việc bị chấm dứt.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-001`
- **Acceptance Criteria:**
  - *Given:* Người dùng đang ở trạng thái đã đăng nhập.
  - *When:* Người dùng nhấn "Đăng xuất".
  - *Then:* Phiên làm việc bị hủy và người dùng trở về quyền GUEST.

#### FR-AUTH-006: Change Password
- **Requirement ID:** FR-AUTH-006
- **Requirement Name:** Change Password
- **Description:** Hệ thống cho phép người dùng đang đăng nhập đổi mật khẩu tài khoản bằng cách xác nhận mật khẩu cũ và nhập mật khẩu mới.
- **Actor:** CUSTOMER / OWNER / ADMIN
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-007 Change Password`
- **Preconditions:** Người dùng đã đăng nhập thành công.
- **Trigger:** Người dùng nhập mật khẩu hiện tại, mật khẩu mới và xác nhận đổi.
- **Functional Behavior:**
  1. System xác minh mật khẩu hiện tại chính xác.
  2. System kiểm tra mật khẩu mới đáp ứng quy định định dạng an toàn.
  3. System cập nhật mật khẩu mới cho tài khoản.
- **Success Result:** Mật khẩu được thay đổi thành công.
- **Failure / Exception:** Nếu mật khẩu hiện tại không đúng, System báo lỗi từ chối cập nhật.
- **Business Rules:** `BR-001`
- **Acceptance Criteria:**
  - *Given:* Người dùng đã đăng nhập.
  - *When:* Người dùng nhập đúng mật khẩu hiện tại và mật khẩu mới hợp lệ.
  - *Then:* Mật khẩu tài khoản được đổi thành công.

---

### 3.2. Guest Browsing & Discovery Requirements (FR-GUEST)

#### FR-GUEST-001: Browse Homepage & Sports Categories
- **Requirement ID:** FR-GUEST-001
- **Requirement Name:** Browse Homepage & Sports Categories
- **Description:** Hệ thống phải cho phép người dùng xem trang chủ, các môn thể thao phân loại và danh sách sân nổi bật.
- **Actor:** GUEST / CUSTOMER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-G-001 Browse Homepage`, `UC-G-002 Browse Sports`
- **Preconditions:** N/A.
- **Trigger:** Người dùng truy cập trang chủ hệ thống.
- **Functional Behavior:**
  1. System hiển thị thông tin trang chủ, bao gồm danh mục môn thể thao (Bóng đá, Cầu lông, Pickleball, Tennis,...).
  2. System hiển thị danh sách các Venue ở trạng thái `APPROVED`.
- **Success Result:** Giao diện trang chủ hiển thị thông tin công khai chính xác.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-004`
- **Acceptance Criteria:**
  - *Given:* Khách truy cập trang chủ.
  - *When:* Trang chủ được tải.
  - *Then:* Danh mục môn thể thao và các sân `APPROVED` được hiển thị công khai.

#### FR-GUEST-002: Search & Filter Venues
- **Requirement ID:** FR-GUEST-002
- **Requirement Name:** Search & Filter Venues
- **Description:** Hệ thống phải cho phép tìm kiếm sân theo từ khóa, địa điểm và lọc theo các tiêu chí giá cả, môn thể thao, tiện ích.
- **Actor:** GUEST / CUSTOMER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-G-003 Search Venue`, `UC-G-004 Filter Venue`, `UC-G-005 View Venue List`, `UC-C-008 Search & Filter Venues`
- **Preconditions:** N/A.
- **Trigger:** Người dùng nhập từ khóa tìm kiếm hoặc chọn bộ lọc.
- **Functional Behavior:**
  1. System lọc và trả về danh sách các Venue `APPROVED` thỏa mãn tiêu chí.
  2. System ẩn hoàn toàn các Venue ở trạng thái `PENDING`, `REJECTED` hoặc `SUSPENDED`.
- **Success Result:** Danh sách sân phù hợp được hiển thị.
- **Failure / Exception:** Nếu không có sân phù hợp, System thông báo "Không tìm thấy cơ sở thể thao phù hợp".
- **Business Rules:** `BR-004`
- **Acceptance Criteria:**
  - *Given:* Các Venue `APPROVED` có trong hệ thống.
  - *When:* Người dùng áp dụng bộ lọc môn thể thao và khu vực.
  - *Then:* Chỉ danh sách các sân `APPROVED` khớp với bộ lọc mới được hiển thị.

#### FR-GUEST-003: View Venue Detail, Map & Public Info
- **Requirement ID:** FR-GUEST-003
- **Requirement Name:** View Venue Detail, Map & Public Information
- **Description:** Hệ thống phải cho phép người dùng xem thông tin chi tiết Venue, địa chỉ bản đồ và các thông tin chính sách công khai.
- **Actor:** GUEST / CUSTOMER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-G-006 View Venue Detail`, `UC-G-007 View Venue Map`, `UC-G-008 View Public Information`
- **Preconditions:** Venue được chọn đang ở trạng thái `APPROVED`.
- **Trigger:** Người dùng chọn một Venue cụ thể.
- **Functional Behavior:**
  1. System hiển thị mô tả, bộ sưu tập ảnh, tiện ích, quy định sân, vị trí bản đồ và bảng giá tham khảo của Venue.
- **Success Result:** Chi tiết Venue được hiển thị đầy đủ.
- **Failure / Exception:** Nếu Venue bị tạm khóa hoặc chưa duyệt, System chặn xem chi tiết.
- **Business Rules:** `BR-004`
- **Acceptance Criteria:**
  - *Given:* Venue ở trạng thái `APPROVED`.
  - *When:* Người dùng chọn xem chi tiết Venue.
  - *Then:* Tất cả hình ảnh, tiện ích, bản đồ và bảng giá của Venue được hiển thị.

#### FR-GUEST-004: Guest Protected Action Guard
- **Requirement ID:** FR-GUEST-004
- **Requirement Name:** Guest Protected Action Guard
- **Description:** Hệ thống phải chặn và yêu cầu đăng nhập khi GUEST cố gắng thực hiện các thao tác bảo vệ (Đặt sân, Thêm yêu thích, Viết đánh giá).
- **Actor:** GUEST
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-G-006`, `UC-C-011`, `UC-C-014`
- **Preconditions:** Người dùng chưa đăng nhập.
- **Trigger:** GUEST nhấn nút "Đặt sân ngay" hoặc "Yêu thích".
- **Functional Behavior:**
  1. System kiểm tra trạng thái xác thực của người dùng.
  2. System chặn thao tác và hiển thị yêu cầu Đăng nhập / Đăng ký.
- **Success Result:** Yêu cầu đăng nhập hiển thị, bảo vệ chức năng dành riêng cho Customer.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-001`
- **Acceptance Criteria:**
  - *Given:* Người dùng chưa đăng nhập.
  - *When:* Người dùng nhấn đặt sân.
  - *Then:* Thao tác bị chặn và giao diện yêu cầu đăng nhập xuất hiện.

---

### 3.3. Customer Profile, Favorites & Bookings (FR-CUST)

#### FR-CUST-001: Manage Personal Profile
- **Requirement ID:** FR-CUST-001
- **Requirement Name:** Manage Personal Profile
- **Description:** Hệ thống cho phép Customer xem và cập nhật thông tin cá nhân (Họ tên, Số điện thoại, Ảnh đại diện).
- **Actor:** CUSTOMER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-021 Manage Personal Profile`
- **Preconditions:** Customer đã đăng nhập.
- **Trigger:** Customer gửi thông tin cập nhật trang cá nhân.
- **Functional Behavior:**
  1. System cập nhật thông tin cá nhân của chính Customer đó.
  2. Trực tiếp ngăn chặn việc sửa thuộc tính phân quyền `role` trong Form hồ sơ.
- **Success Result:** Thông tin cá nhân được cập nhật.
- **Failure / Exception:** Nếu Số điện thoại không hợp lệ, System báo lỗi.
- **Business Rules:** `BR-001`
- **Acceptance Criteria:**
  - *Given:* Customer đã đăng nhập.
  - *When:* Customer thay đổi Họ tên và bấm Lưu.
  - *Then:* Hồ sơ cá nhân của Customer được cập nhật thành công.

#### FR-CUST-002: Favorite Venues Management
- **Requirement ID:** FR-CUST-002
- **Requirement Name:** Favorite Venues Management
- **Description:** Hệ thống cho phép Customer thêm Venue vào danh sách yêu thích hoặc xóa khỏi danh sách yêu thích.
- **Actor:** CUSTOMER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-010 Add / Remove Favorite`
- **Preconditions:** Customer đã đăng nhập. Venue ở trạng thái `APPROVED`.
- **Trigger:** Customer nhấn biểu tượng Trái tim / Yêu thích.
- **Functional Behavior:**
  1. System cập nhật danh sách sân yêu thích cá nhân của Customer.
- **Success Result:** Venue được thêm/xóa khỏi danh sách yêu thích cá nhân thành công.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-001`
- **Acceptance Criteria:**
  - *Given:* Customer đang xem Venue `APPROVED`.
  - *When:* Customer nhấn "Thêm vào yêu thích".
  - *Then:* Venue được lưu vào danh sách sân yêu thích của Customer.

#### FR-CUST-003: View Own Booking History & Detail
- **Requirement ID:** FR-CUST-003
- **Requirement Name:** View Own Booking History & Detail
- **Description:** Hệ thống cho phép Customer xem danh sách lịch sử đơn đặt sân và chi tiết từng đơn do chính mình tạo.
- **Actor:** CUSTOMER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-016 View Own Bookings`
- **Preconditions:** Customer đã đăng nhập.
- **Trigger:** Customer mở trang quản lý đơn đặt sân cá nhân.
- **Functional Behavior:**
  1. System chỉ cho phép Customer xem các Booking thuộc chính Customer đó và từ chối truy cập Booking của Customer khác.
- **Success Result:** Danh sách và chi tiết đơn đặt sân của cá nhân hiển thị chính xác.
- **Failure / Exception:** Cố tình truy cập đơn của người khác sẽ bị từ chối truy cập.
- **Business Rules:** `BR-002`
- **Acceptance Criteria:**
  - *Given:* Customer có lịch sử đặt sân.
  - *When:* Customer mở danh sách đơn của tôi.
  - *Then:* Chỉ hiển thị các đơn đặt sân do chính Customer đó khởi tạo.

#### FR-CUST-004: View Personal Notifications
- **Requirement ID:** FR-CUST-004
- **Requirement Name:** View Personal Notifications
- **Description:** Hệ thống cho phép Customer xem danh sách các thông báo cá nhân (Xác nhận đặt sân, Hủy đơn, Nhắc lịch chơi).
- **Actor:** CUSTOMER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-020 View Notifications`
- **Preconditions:** Customer đã đăng nhập.
- **Trigger:** Customer mở hộp thông báo.
- **Functional Behavior:**
  1. System hiển thị danh sách thông báo gửi riêng cho Customer.
  2. Hỗ trợ đánh dấu đã đọc hoặc xóa thông báo cá nhân.
- **Success Result:** Danh sách thông báo cá nhân hiển thị đầy đủ.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-002`
- **Acceptance Criteria:**
  - *Given:* Customer có thông báo mới từ hệ thống.
  - *When:* Customer mở hộp thư thông báo.
  - *Then:* Các thông báo được hiển thị đầy đủ.

#### FR-CUST-005: Request Reschedule Action
- **Requirement ID:** FR-CUST-005
- **Requirement Name:** Request Reschedule Action
- **Description:** Cho phép Customer gửi yêu cầu dời lịch / đổi khung giờ chơi đối với đơn đặt sân `CONFIRMED` theo chính sách của Venue.
- **Actor:** CUSTOMER
- **Priority:** FUTURE
- **Status:** FUTURE
- **Source Use Case:** `UC-C-018 Request Reschedule Action`
- **Preconditions:** Chức năng được quy hoạch cho phiên bản tương lai.
- **Trigger:** Customer chọn "Yêu cầu dời lịch".
- **Functional Behavior:**
  1. Yêu cầu dời lịch được xử lý theo chính sách quy hoạch tương lai.
- **Success Result:** N/A (Phiên bản Future).
- **Failure / Exception:** N/A.
- **Business Rules:** `OQ-005`
- **Acceptance Criteria:**
  - N/A (Tính năng Future).

#### FR-CUST-006: Submit & View Owner Application
- **Requirement ID:** FR-CUST-006
- **Requirement Name:** Submit & View Owner Application
- **Description:** Cho phép Customer điền Form đăng ký nâng cấp thành Owner và xem trạng thái phê duyệt của Admin.
- **Actor:** CUSTOMER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-001 Submit Owner Application`, `UC-O-002 View Owner Application Status`
- **Preconditions:** Customer đã đăng nhập và chưa là Owner.
- **Trigger:** Customer gửi Form đăng ký đối tác Owner.
- **Functional Behavior:**
  1. System lưu đơn đăng ký với trạng thái `PENDING_REVIEW`.
  2. Customer có thể xem trạng thái duyệt đơn (`PENDING_REVIEW`, `APPROVED`, `REJECTED`).
- **Success Result:** Đơn đăng ký Owner được ghi nhận và đưa vào hàng chờ duyệt của Admin.
- **Failure / Exception:** Nếu thông tin thiếu, báo lỗi validation.
- **Business Rules:** `BR-001`
- **Acceptance Criteria:**
  - *Given:* Customer chưa là Owner.
  - *When:* Customer gửi Form đăng ký làm đối tác.
  - *Then:* Đơn đăng ký chuyển trạng thái `PENDING_REVIEW` và chờ Admin kiểm duyệt.

---

### 3.4. Booking Engine & Availability Requirements (FR-BOOK)

#### FR-BOOK-001: View Court Availability Grid
- **Requirement ID:** FR-BOOK-001
- **Requirement Name:** View Court Availability Grid
- **Description:** Hệ thống hiển thị bảng tình trạng khả dụng của các slot giờ chơi của từng sân con theo ngày được chọn.
- **Actor:** GUEST / CUSTOMER / OWNER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-009 View Court Availability`
- **Preconditions:** Venue `APPROVED`, Court `ACTIVE`.
- **Trigger:** Người dùng chọn ngày xem lịch sân.
- **Functional Behavior:**
  1. System hiển thị các trạng thái slot: `AVAILABLE`, `HOLDING`, `CONFIRMED`, `BLOCKED`, `MAINTENANCE`.
  2. System hiển thị bảng giá tương ứng theo khung giờ.
- **Success Result:** Trạng thái khả dụng hiển thị chính xác.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-004`
- **Acceptance Criteria:**
  - *Given:* Người dùng chọn ngày xem sân.
  - *When:* Bảng lịch tải hoàn tất.
  - *Then:* Trạng thái khả dụng và giá của từng slot được hiển thị đúng dữ liệu thực tế.

#### FR-BOOK-002: Slot Selection, Services & Coupon Application
- **Requirement ID:** FR-BOOK-002
- **Requirement Name:** Slot Selection, Services & Coupon Application
- **Description:** Cho phép Customer chọn slot trống, chọn thêm các dịch vụ đi kèm và áp dụng mã giảm giá hợp lệ trước khi tạo đơn.
- **Actor:** CUSTOMER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-011 Select Court & Slot`, `UC-C-012 Select Extra Services`, `UC-C-013 Apply Promotion Coupon`
- **Preconditions:** Slot được chọn ở trạng thái `AVAILABLE`.
- **Trigger:** Customer chọn slot, thêm dịch vụ và nhập mã giảm giá.
- **Functional Behavior:**
  1. System ghi nhận các slot trống được chọn và danh sách dịch vụ thêm.
  2. System kiểm tra điều kiện mã coupon và tính toán lại tổng tiền phải thanh toán theo quy tắc giá, dịch vụ và khuyến mãi áp dụng.
- **Success Result:** Đơn đặt sân được tổng hợp đầy đủ chi tiết trước bước giữ chỗ.
- **Failure / Exception:** Nếu mã coupon không hợp lệ/hết hạn, System báo lỗi không áp dụng được.
- **Business Rules:** `BR-001`
- **Acceptance Criteria:**
  - *Given:* Customer chọn slot trống và nhập mã giảm giá hợp lệ.
  - *When:* Customer bấm áp dụng mã.
  - *Then:* Tổng số tiền thanh toán được cập nhật tương ứng theo quy định khuyến mãi.

#### FR-BOOK-003: Slot Availability Validation & Hold Creation
- **Requirement ID:** FR-BOOK-003
- **Requirement Name:** Slot Availability Validation & Hold Creation
- **Description:** Khi Customer khởi tạo Online Booking, hệ thống kiểm tra sự khả dụng của slot và khóa tạm thời slot sang `HOLDING` trong 10 phút.
- **Actor:** CUSTOMER
- **Supporting Actor:** SYSTEM
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-014 Create Booking Hold`
- **Preconditions:** Customer đã đăng nhập. Slot đang ở trạng thái `AVAILABLE`.
- **Trigger:** Customer nhấn "Đặt sân / Tiến hành thanh toán".
- **Functional Behavior:**
  1. System kiểm tra sự khả dụng của slot.
  2. If `AVAILABLE`, System tạo Booking `HOLDING` và giữ slot trong đếm ngược 10 phút.
- **Success Result:** Đơn `HOLDING` được khởi tạo, timer 10 phút bắt đầu chạy.
- **Failure / Exception:** If slot bị chiếm bởi người khác, System báo lỗi *"Khung giờ này vừa có người giữ chỗ"*.
- **Business Rules:** `BR-001`, `BR-005`, `BR-010`
- **Acceptance Criteria:**
  - *Given:* Slot đang `AVAILABLE`.
  - *When:* Customer đặt giữ chỗ online.
  - *Then:* Slot chuyển sang `HOLDING` trong 10 phút.

#### FR-BOOK-004: Double Booking Prevention
- **Requirement ID:** FR-BOOK-004
- **Requirement Name:** Double Booking Prevention
- **Description:** Hệ thống phải ngăn chặn các yêu cầu giữ chỗ đồng thời cho cùng một sân/khung giờ, tuyệt đối không cho phép 2 request đồng thời giữ/đặt thành công cùng 1 slot.
- **Actor:** SYSTEM
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-014 Create Booking Hold`
- **Preconditions:** Hai hoặc nhiều request gửi lên đồng thời cho cùng 1 slot.
- **Trigger:** Concurrent booking requests gửi tới Backend.
- **Functional Behavior:**
  1. System kiểm tra và xử lý giữ chỗ cho các yêu cầu đồng thời.
  2. Request duy nhất thành công đầu tiên nhận trạng thái `HOLDING`, các request khác bị từ chối.
- **Success Result:** Chỉ duy nhất 1 booking hold tạo thành công cho slot.
- **Failure / Exception:** Request đến sau bị báo lỗi slot đã không còn khả dụng.
- **Business Rules:** `BR-010`
- **Acceptance Criteria:**
  - *Given:* Hai khách hàng A và B cùng bấm đặt 1 slot tại cùng thời điểm.
  - *When:* Hệ thống xử lý đồng thời 2 request.
  - *Then:* Chỉ 1 khách hàng giữ chỗ thành công, khách hàng còn lại nhận thông báo từ chối.

#### FR-BOOK-005: Payment Pending State Creation
- **Requirement ID:** FR-BOOK-005
- **Requirement Name:** Payment Pending State Creation
- **Description:** Khi bắt đầu quá trình thanh toán MoMo, hệ thống chuyển đơn hàng sang trạng thái `PAYMENT_PENDING` và chờ tín hiệu xác thực ngầm.
- **Actor:** CUSTOMER / SYSTEM
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-015 Make Payment via MoMo`
- **Preconditions:** Booking ở trạng thái `HOLDING` chưa hết 10 phút.
- **Trigger:** Customer chọn phương thức MoMo và gửi yêu cầu thanh toán.
- **Functional Behavior:**
  1. System cập nhật trạng thái đơn thành `PAYMENT_PENDING`.
  2. Đơn **KHÔNG ĐƯỢC** chuyển sang `CONFIRMED` chỉ dựa trên giao diện trình duyệt chuyển hướng.
- **Success Result:** Đơn ở trạng thái `PAYMENT_PENDING`.
- **Failure / Exception:** Nếu đơn đã hết hạn hold, từ chối chuyển sang `PAYMENT_PENDING`.
- **Business Rules:** `BR-007`, `BR-008`
- **Acceptance Criteria:**
  - *Given:* Đơn hàng `HOLDING` còn thời hạn.
  - *When:* Customer mở trang thanh toán MoMo.
  - *Then:* Trạng thái đơn chuyển thành `PAYMENT_PENDING`.

#### FR-BOOK-006: Booking Confirmation via Verified Payment Callback
- **Requirement ID:** FR-BOOK-006
- **Requirement Name:** Booking Confirmation via Verified Payment Callback
- **Description:** Backend chuyển trạng thái đơn sang `CONFIRMED` chỉ sau khi xác minh thành công callback thanh toán ngầm (Server-to-Server Callback) từ MoMo.
- **Actor:** SYSTEM
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-S-003 Process Payment Callback (IPN)`, `UC-S-004 Update Booking Status Automatically`
- **Preconditions:** Booking ở trạng thái `PAYMENT_PENDING`. Callback gửi tới Backend.
- **Trigger:** MoMo gửi Server Callback ngầm xác nhận giao dịch thành công.
- **Functional Behavior:**
  1. Backend xác minh chữ ký mã hóa và số tiền giao dịch hợp lệ.
  2. Backend đổi trạng thái Booking sang `CONFIRMED` và Payment sang `PAID`.
  3. Kích hoạt gửi thông báo xác nhận tự động (`FR-NOTI-001`).
- **Success Result:** Booking được tự động chuyển thành `CONFIRMED`.
- **Failure / Exception:** Nếu xác minh chữ ký thất bại, Backend từ chối xác nhận.
- **Business Rules:** `BR-007`, `BR-008`, `BR-012`
- **Acceptance Criteria:**
  - *Given:* Đơn ở trạng thái `PAYMENT_PENDING`.
  - *When:* Backend xác minh thành công Server Callback ngầm từ MoMo.
  - *Then:* Trạng thái đơn chuyển sang `CONFIRMED` và slot được đặt chính thức.

#### FR-BOOK-007: Booking Payment Failure Handling
- **Requirement ID:** FR-BOOK-007
- **Requirement Name:** Booking Payment Failure Handling
- **Description:** Khi thanh toán thất bại hoặc người dùng hủy thanh toán, hệ thống chuyển đơn sang `PAYMENT_FAILED` và giải phóng slot về `AVAILABLE`.
- **Actor:** CUSTOMER / SYSTEM
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-S-002 Release Expired Slot`, `UC-C-015 Make Payment via MoMo`
- **Preconditions:** Booking ở `HOLDING` hoặc `PAYMENT_PENDING`.
- **Trigger:** Callback báo thanh toán thất bại hoặc người dùng bấm Hủy thanh toán.
- **Functional Behavior:**
  1. System cập nhật đơn thành `PAYMENT_FAILED`.
  2. System lập tức nhả slot về trạng thái `AVAILABLE`.
- **Success Result:** Đơn thành `PAYMENT_FAILED`, slot trở lại `AVAILABLE`.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-006`
- **Acceptance Criteria:**
  - *Given:* Đơn hàng ở trạng thái `PAYMENT_PENDING`.
  - *When:* Giao dịch thanh toán bị từ chối hoặc hủy.
  - *Then:* Đơn hàng chuyển sang `PAYMENT_FAILED` và slot lập tức trống trở lại.

#### FR-BOOK-008: Booking Hold Expiration Handling
- **Requirement ID:** FR-BOOK-008
- **Requirement Name:** Booking Hold Expiration Handling
- **Description:** Khi quá 10 phút hold mà không có xác thực thanh toán thành công, hệ thống tự động chuyển đơn sang `EXPIRED` và giải phóng slot.
- **Actor:** SYSTEM
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-S-001 Expire Booking Hold`, `UC-S-002 Release Expired Slot`
- **Preconditions:** Đơn `HOLDING` hoặc `PAYMENT_PENDING` quá thời gian 10 phút.
- **Trigger:** Tác vụ tự động quét định kỳ của hệ thống.
- **Functional Behavior:**
  1. System phát hiện các đơn quá hạn 10 phút chưa thanh toán thành công.
  2. System đổi trạng thái đơn sang `EXPIRED` và giải phóng slot về `AVAILABLE`.
- **Success Result:** Đơn bị `EXPIRED`, slot được nhả lại cộng đồng.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-005`, `BR-006`
- **Acceptance Criteria:**
  - *Given:* Đơn đặt sân quá thời hạn 10 phút hold chưa hoàn tất thanh toán.
  - *When:* Hệ thống quét tự động.
  - *Then:* Đơn hàng chuyển thành `EXPIRED` và slot được nhả về `AVAILABLE`.

#### FR-BOOK-009: Customer Booking Cancellation
- **Requirement ID:** FR-BOOK-009
- **Requirement Name:** Customer Booking Cancellation
- **Description:** Cho phép Customer hủy đơn đặt sân `CONFIRMED` thuộc sở hữu của mình dựa trên việc kiểm tra điều kiện khả thi trong chính sách hủy áp dụng của Venue.
- **Actor:** CUSTOMER
- **Supporting Actor:** SYSTEM
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-017 Cancel Booking Action`
- **Preconditions:** Booking thuộc sở hữu của Customer và đang ở trạng thái `CONFIRMED`.
- **Trigger:** Customer gửi yêu cầu hủy đơn.
- **Functional Behavior:**
  1. System nạp Chính sách hủy sân (Venue Cancellation Policy) tương ứng.
  2. System kiểm tra điều kiện khả thi cho phép hủy (`Cancellation Eligibility`).
  3. Nếu đủ điều kiện, System chuyển đơn thành `CANCELLED` và nhả slot đặt sân về `AVAILABLE` (`Release Booking Slot`).
  4. Cơ chế hoàn tiền đánh dấu: `TBD — Business Decision Required` (`OQ-001`).
- **Success Result:** Đơn thành `CANCELLED`, slot trở lại `AVAILABLE`.
- **Failure / Exception:** Nếu không đủ điều kiện hủy, System từ chối yêu cầu hủy.
- **Business Rules:** `BR-002`, `BR-011`
- **Acceptance Criteria:**
  - *Given:* Đơn `CONFIRMED` thuộc sở hữu của Customer đủ điều kiện hủy theo chính sách Venue.
  - *When:* Customer gửi yêu cầu hủy.
  - *Then:* Đơn chuyển trạng thái `CANCELLED` và slot được giải phóng thành `AVAILABLE`.

---

### 3.5. Payment Integration Requirements (FR-PAY)

#### FR-PAY-001: MoMo Payment Request Generation
- **Requirement ID:** FR-PAY-001
- **Requirement Name:** MoMo Payment Request Generation
- **Description:** Hệ thống khởi tạo yêu cầu thanh toán hợp lệ kết nối cổng MoMo cho các đơn đặt sân ở trạng thái `HOLDING`.
- **Actor:** CUSTOMER / SYSTEM
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-015 Make Payment via MoMo`
- **Preconditions:** Booking ở trạng thái `HOLDING`.
- **Trigger:** Customer chọn phương thức MoMo và thanh toán.
- **Functional Behavior:**
  1. System tính toán tổng số tiền thanh toán theo quy tắc bảng giá, dịch vụ và khuyến mãi áp dụng.
  2. System khởi tạo phiên giao dịch cổng MoMo và nhận liên kết thanh toán.
  3. Chuyển hướng trình duyệt Customer sang giao diện thanh toán MoMo.
- **Success Result:** Khách hàng được chuyển hướng sang cổng thanh toán an toàn.
- **Failure / Exception:** Nếu ngắt kết nối cổng thanh toán, hiển thị thông báo báo lỗi và giữ đơn ở `HOLDING` để thử lại.
- **Business Rules:** `BR-007`
- **Acceptance Criteria:**
  - *Given:* Đơn hàng `HOLDING` còn hiệu lực.
  - *When:* Customer chọn thanh toán MoMo.
  - *Then:* Phiên thanh toán được tạo thành công và trình duyệt chuyển hướng sang MoMo.

#### FR-PAY-002: Server-to-Server Payment Callback Verification
- **Requirement ID:** FR-PAY-002
- **Requirement Name:** Server-to-Server Payment Callback Verification (Source of Truth)
- **Description:** Backend tiếp nhận và xác thực tín hiệu Server Callback ngầm (IPN) gửi từ MoMo làm căn cứ duy nhất (Source of Truth) để ghi nhận kết quả thanh toán `PAID`.
- **Actor:** SYSTEM
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-S-003 Process Payment Callback (IPN)`
- **Preconditions:** Giao dịch được khởi tạo trên cổng MoMo.
- **Trigger:** MoMo gửi Server Callback ngầm tới Backend.
- **Functional Behavior:**
  1. Backend xác minh chữ ký số và dữ liệu giao dịch từ MoMo.
  2. Nếu hợp lệ, ghi nhận thanh toán `PAID` làm căn cứ để chuyển booking thành `CONFIRMED`.
- **Success Result:** Giao dịch được xác minh thành công từ Server MoMo.
- **Failure / Exception:** Nếu chữ ký số sai, Backend từ chối xử lý và báo lỗi cho cổng thanh toán.
- **Business Rules:** `BR-008`
- **Acceptance Criteria:**
  - *Given:* MoMo gửi dữ liệu callback thanh toán về Backend.
  - *When:* Backend xác minh chữ ký số hợp lệ.
  - *Then:* Giao dịch thanh toán được ghi nhận `PAID` chính thức.

---

### 3.6. Venue Management Requirements (FR-VENUE)

#### FR-VENUE-001: Create Venue Registration
- **Requirement ID:** FR-VENUE-001
- **Requirement Name:** Create Venue Registration
- **Description:** Cho phép OWNER tạo cơ sở thể thao mới ở trạng thái ban đầu `PENDING` để chờ Admin kiểm duyệt.
- **Actor:** OWNER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-003 Create Venue`
- **Preconditions:** Tài khoản có vai trò `OWNER` hợp lệ.
- **Trigger:** Owner điền Form tạo Venue và gửi.
- **Functional Behavior:**
  1. Owner điền thông tin Venue (Tên, môn thể thao, địa chỉ, hình ảnh, mô tả).
  2. System khởi tạo Venue với trạng thái `PENDING`.
  3. Venue `PENDING` bị ẩn khỏi kết quả tìm kiếm của Customer.
- **Success Result:** Venue được tạo ở trạng thái `PENDING` chờ duyệt.
- **Failure / Exception:** Nếu thiếu dữ liệu bắt buộc, báo lỗi validation.
- **Business Rules:** `BR-003`, `BR-004`
- **Acceptance Criteria:**
  - *Given:* Owner nhập đầy đủ thông tin Venue mới.
  - *When:* Owner bấm tạo Venue.
  - *Then:* Venue được khởi tạo với trạng thái `PENDING` và ẩn khỏi trang public.

#### FR-VENUE-002: Update Own Venue Information
- **Requirement ID:** FR-VENUE-002
- **Requirement Name:** Update Own Venue Information
- **Description:** Cho phép Owner cập nhật thông tin mô tả, ảnh đại diện, số điện thoại liên hệ của các Venue thuộc quyền sở hữu của mình.
- **Actor:** OWNER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-004 Update Own Venue`
- **Preconditions:** Venue thuộc quản lý của chính Owner (`Venue managed by current Owner`).
- **Trigger:** Owner lưu thông tin chỉnh sửa Venue.
- **Functional Behavior:**
  1. System kiểm tra quyền sở hữu của Owner đối với Venue.
  2. System cập nhật thông tin thay đổi.
- **Success Result:** Thông tin Venue được cập nhật.
- **Failure / Exception:** Nếu Owner không sở hữu Venue, System từ chối quyền thao tác.
- **Business Rules:** `BR-003`
- **Acceptance Criteria:**
  - *Given:* Owner quản lý Venue A.
  - *When:* Owner cập nhật mô tả Venue A.
  - *Then:* Thông tin Venue A được cập nhật thành công.

#### FR-VENUE-003: Manage Venue Gallery Images
- **Requirement ID:** FR-VENUE-003
- **Requirement Name:** Manage Venue Gallery Images
- **Description:** Cho phép Owner tải lên, xem và xóa các hình ảnh thuộc bộ sưu tập ảnh của Venue thuộc sở hữu của mình.
- **Actor:** OWNER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-005 Manage Venue Images & Facilities`
- **Preconditions:** Venue thuộc quản lý của Owner.
- **Trigger:** Owner tải lên hoặc xóa hình ảnh sân.
- **Functional Behavior:**
  1. System lưu trữ và cập nhật danh sách ảnh hiển thị của Venue.
- **Success Result:** Bộ sưu tập ảnh của Venue được cập nhật.
- **Failure / Exception:** Định dạng tập tin không phải là ảnh bị từ chối.
- **Business Rules:** `BR-003`
- **Acceptance Criteria:**
  - *Given:* Owner quản lý Venue.
  - *When:* Owner tải lên ảnh mới cho Venue.
  - *Then:* Ảnh được thêm vào bộ sưu tập ảnh của Venue thành công.

#### FR-VENUE-004: Manage Venue Facilities
- **Requirement ID:** FR-VENUE-004
- **Requirement Name:** Manage Venue Facilities
- **Description:** Cho phép Owner quản lý và cấu hình danh sách các tiện ích (Đèn chiếu sáng, wifi, bãi xe, căng tin, phòng thay đồ) của Venue thuộc sở hữu của mình.
- **Actor:** OWNER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-005 Manage Venue Images & Facilities`
- **Preconditions:** Venue thuộc quản lý của Owner.
- **Trigger:** Owner chọn danh sách tiện ích và lưu.
- **Functional Behavior:**
  1. System lưu danh sách các tiện ích gắn kèm với Venue.
- **Success Result:** Danh sách tiện ích của Venue được cập nhật.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-003`
- **Acceptance Criteria:**
  - *Given:* Owner quản lý Venue.
  - *When:* Owner chọn thêm tiện ích "Bãi đỗ xe ô tô".
  - *Then:* Tiện ích mới được lưu và hiển thị trên chi tiết Venue.

#### FR-VENUE-005: Manage Venue Branches
- **Requirement ID:** FR-VENUE-005
- **Requirement Name:** Manage Venue Branches
- **Description:** Cho phép Owner tạo và chỉnh sửa thông tin các Chi nhánh (`Branch`) thuộc Venue mà Owner sở hữu.
- **Actor:** OWNER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-006 Manage Branches & Courts`
- **Preconditions:** Venue thuộc quản lý của Owner.
- **Trigger:** Owner thêm hoặc sửa Chi nhánh.
- **Functional Behavior:**
  1. System cập nhật danh sách chi nhánh thuộc Venue của Owner.
- **Success Result:** Chi nhánh mới hoặc thông tin chi nhánh được cập nhật.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-003`
- **Acceptance Criteria:**
  - *Given:* Owner quản lý Venue.
  - *When:* Owner tạo Chi nhánh mới cho Venue.
  - *Then:* Chi nhánh mới được khởi tạo thuộc Venue đó.

---

### 3.7. Court Management Requirements (FR-COURT)

#### FR-COURT-001: Create & Manage Courts
- **Requirement ID:** FR-COURT-001
- **Requirement Name:** Create & Manage Courts
- **Description:** Cho phép Owner khởi tạo các sân con (`Court`) mới thuộc Chi nhánh/Venue do mình sở hữu.
- **Actor:** OWNER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-006 Manage Branches & Courts`
- **Preconditions:** Branch/Venue thuộc quản lý của Owner.
- **Trigger:** Owner nhập tên sân con, loại mặt sân và bấm tạo.
- **Functional Behavior:**
  1. System tạo sân con mới gắn với Branch/Venue ở trạng thái ban đầu `ACTIVE`.
- **Success Result:** Sân con được khởi tạo thành công.
- **Failure / Exception:** Tên sân con trùng trong cùng chi nhánh báo lỗi.
- **Business Rules:** `BR-003`
- **Acceptance Criteria:**
  - *Given:* Owner quản lý Chi nhánh A.
  - *When:* Owner tạo "Sân con 01" thuộc Chi nhánh A.
  - *Then:* Sân con 01 được khởi tạo ở trạng thái `ACTIVE`.

#### FR-COURT-002: Update Court Information
- **Requirement ID:** FR-COURT-002
- **Requirement Name:** Update Court Information
- **Description:** Cho phép Owner cập nhật tên, mô tả, loại thảm/mặt sân và bộ sưu tập ảnh của sân con thuộc sở hữu của mình.
- **Actor:** OWNER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-006 Manage Branches & Courts`, `UC-O-011 Court Images`
- **Preconditions:** Court thuộc quản lý của Owner.
- **Trigger:** Owner lưu thông tin chỉnh sửa sân con.
- **Functional Behavior:**
  1. System cập nhật thông tin chi tiết của sân con.
- **Success Result:** Thông tin sân con được cập nhật.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-003`
- **Acceptance Criteria:**
  - *Given:* Owner sở hữu Sân con 01.
  - *When:* Owner sửa loại mặt sân của Sân con 01.
  - *Then:* Thông tin mặt sân của Sân con 01 được cập nhật.

#### FR-COURT-003: Court Status Management & Maintenance
- **Requirement ID:** FR-COURT-003
- **Requirement Name:** Court Status Management & Maintenance
- **Description:** Cho phép Owner chuyển trạng thái hoạt động của sân con giữa `ACTIVE` và `MAINTENANCE` (Bảo trì).
- **Actor:** OWNER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-009 Set Court Maintenance`, `UC-O-010 Change Court Status`
- **Preconditions:** Court thuộc sở hữu của Owner.
- **Trigger:** Owner đổi trạng thái sân con.
- **Functional Behavior:**
  1. System cập nhật trạng thái sân con thành `MAINTENANCE`.
  2. Sân con ở trạng thái `MAINTENANCE` lập tức ẩn khỏi bảng đặt sân của Customer.
- **Success Result:** Trạng thái sân con chuyển thành `MAINTENANCE` và ngừng nhận đơn mới.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-003`
- **Acceptance Criteria:**
  - *Given:* Sân con đang `ACTIVE`.
  - *When:* Owner chuyển sang `MAINTENANCE`.
  - *Then:* Sân con ngừng hiển thị khả dụng trên trang đặt lịch của Customer.

---

### 3.8. Schedule & Pricing Requirements (FR-SCHED)

#### FR-SCHED-001: Configure Operating Hours
- **Requirement ID:** FR-SCHED-001
- **Requirement Name:** Configure Operating Hours
- **Description:** Cho phép Owner thiết lập khung giờ mở cửa và đóng cửa theo từng ngày trong tuần cho Venue/Branch của mình.
- **Actor:** OWNER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-007 Configure Operating Hours & Pricing`
- **Preconditions:** Venue thuộc quản lý của Owner.
- **Trigger:** Owner lưu cấu hình giờ hoạt động.
- **Functional Behavior:**
  1. System áp dụng giờ mở/đóng cửa để sinh các slot khả dụng trong ngày.
- **Success Result:** Khung giờ hoạt động được lưu và áp dụng vào bảng lịch đặt sân.
- **Failure / Exception:** Giờ mở cửa sau giờ đóng cửa báo lỗi.
- **Business Rules:** `BR-003`
- **Acceptance Criteria:**
  - *Given:* Owner quản lý Venue.
  - *When:* Owner cài đặt giờ hoạt động từ 06:00 đến 22:00.
  - *Then:* Bảng lịch đặt sân chỉ hiển thị các slot nằm trong khoảng 06:00 - 22:00.

#### FR-SCHED-002: Configure Pricing & Peak Hour Rules
- **Requirement ID:** FR-SCHED-002
- **Requirement Name:** Configure Pricing & Peak Hour Rules
- **Description:** Cho phép Owner cấu hình giá đặt sân theo khung giờ thường, giờ vàng (Peak hours) và ngày cuối tuần/ngày lễ.
- **Actor:** OWNER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-007 Configure Operating Hours & Pricing`
- **Preconditions:** Venue thuộc quản lý của Owner.
- **Trigger:** Owner thiết lập bảng giá.
- **Functional Behavior:**
  1. System lưu bảng giá theo khoảng giờ và loại ngày.
  2. System áp dụng mức giá tương ứng khi Customer chọn slot giờ chơi.
- **Success Result:** Bảng giá áp dụng chính xác cho từng khung giờ.
- **Failure / Exception:** Giá không hợp lệ (<= 0) báo lỗi.
- **Business Rules:** `BR-003`
- **Acceptance Criteria:**
  - *Given:* Owner thiết lập giá giờ vàng từ 17:00 - 20:00.
  - *When:* Customer chọn slot 18:00 - 19:00.
  - *Then:* Mức giá giờ vàng được áp dụng cho đơn đặt sân.

#### FR-SCHED-003: Manual Slot Blocking & Unblocking
- **Requirement ID:** FR-SCHED-003
- **Requirement Name:** Manual Slot Blocking & Unblocking
- **Description:** Cho phép Owner chủ động khóa thủ công (`BLOCKED`) hoặc mở khóa (`AVAILABLE`) các slot giờ chơi của sân con thuộc sở hữu.
- **Actor:** OWNER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-008 Block / Unblock Court Slot`
- **Preconditions:** Court thuộc sở hữu của Owner. Slot chọn đang `AVAILABLE`.
- **Trigger:** Owner nhấn Khóa hoặc Mở khóa slot.
- **Functional Behavior:**
  1. System cập nhật trạng thái slot thành `BLOCKED` (nếu khóa) hoặc `AVAILABLE` (nếu mở khóa).
  2. Slot `BLOCKED` không cho phép Customer đặt online.
- **Success Result:** Slot chuyển sang `BLOCKED` hoặc `AVAILABLE`.
- **Failure / Exception:** Không thể khóa slot đã có đơn `HOLDING`, `PAYMENT_PENDING` hoặc `CONFIRMED`.
- **Business Rules:** `BR-003`
- **Acceptance Criteria:**
  - *Given:* Slot giờ chơi đang `AVAILABLE`.
  - *When:* Owner bấm khóa slot thủ công.
  - *Then:* Slot chuyển sang `BLOCKED` và Customer không thể đặt.

---

### 3.9. Owner Operations & Reports Requirements (FR-OWNER)

#### FR-OWNER-001: Manual Offline Booking Creation
- **Requirement ID:** FR-OWNER-001
- **Requirement Name:** Manual Offline Booking Creation
- **Description:** Cho phép Owner nhập đơn đặt sân thủ công cho khách đặt trực tiếp tại sân hoặc qua điện thoại (Manual Offline Booking).
- **Actor:** OWNER
- **Supporting Actor:** SYSTEM
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-011 Create Manual Offline Booking`
- **Preconditions:** Slot chọn đang `AVAILABLE` và sân thuộc quản lý của Owner.
- **Trigger:** Owner điền thông tin khách và nhấn "Tạo đơn đặt tại sân".
- **Functional Behavior:**
  1. System kiểm tra sự khả dụng của slot.
  2. If `AVAILABLE`, System tạo Booking `CONFIRMED` với nguồn `MANUAL_OFFLINE`.
  3. Slot được khóa chính thức trên lịch vận hành.
- **Success Result:** Đơn đặt thủ công được tạo ở trạng thái `CONFIRMED`.
- **Failure / Exception:** Từ chối tạo nếu slot đang bị giữ online (`HOLDING`) hoặc đã được đặt (`CONFIRMED`).
- **Business Rules:** `BR-001`, `BR-003`, `BR-010`
- **Acceptance Criteria:**
  - *Given:* Slot giờ chơi đang `AVAILABLE`.
  - *When:* Owner tạo đơn đặt tại sân qua Owner Portal.
  - *Then:* Slot được đặt ở trạng thái `CONFIRMED` với nguồn `MANUAL_OFFLINE`.

#### FR-OWNER-002: Operational Check-in
- **Requirement ID:** FR-OWNER-002
- **Requirement Name:** Operational Check-in
- **Description:** Cho phép Owner ghi nhận khách hàng đã đến sân chơi đối với các đơn đặt sân ở trạng thái `CONFIRMED`.
- **Actor:** OWNER
- **Priority:** SHOULD / MVP Candidate
- **Status:** APPROVED (Optional Scope)
- **Source Use Case:** `UC-O-012 Check-in / Operational Action`
- **Preconditions:** Booking thuộc Venue của Owner và đang ở trạng thái `CONFIRMED`.
- **Trigger:** Owner nhấn "Check-in" trên đơn.
- **Functional Behavior:**
  1. System ghi nhận trạng thái vận hành đã check-in cho đơn đặt sân.
- **Success Result:** Đơn hàng cập nhật ghi nhận check-in.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-003`
- **Acceptance Criteria:**
  - *Given:* Đơn đặt sân `CONFIRMED` thuộc Venue của Owner.
  - *When:* Owner bấm "Check-in".
  - *Then:* Đơn ghi nhận khách đã đến sân thành công.

#### FR-OWNER-003: Owner Booking Cancellation per Operational Policy
- **Requirement ID:** FR-OWNER-003
- **Requirement Name:** Owner Booking Cancellation per Operational Policy
- **Description:** Cho phép Owner hủy đơn đặt sân vì lý do sự cố vận hành sân khẩn cấp (như hỏng đèn, thời tiết xấu).
- **Actor:** OWNER
- **Supporting Actor:** SYSTEM
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-013 Cancel Booking per Policy`
- **Preconditions:** Booking thuộc Venue của Owner.
- **Trigger:** Owner chọn hủy đơn khẩn cấp và nhập lý do.
- **Functional Behavior:**
  1. System chuyển trạng thái đơn thành `CANCELLED`.
  2. System nhả slot và gửi thông báo báo hủy đền bù tới Customer.
- **Success Result:** Đơn bị hủy, thông báo được gửi cho Customer.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-003`
- **Acceptance Criteria:**
  - *Given:* Đơn đặt sân thuộc Venue của Owner.
  - *When:* Owner hủy đơn do sự cố khẩn cấp.
  - *Then:* Trạng thái đơn chuyển thành `CANCELLED` và thông báo được phát tới Customer.

#### FR-OWNER-004: View Own Venue Bookings & Customer Detail
- **Requirement ID:** FR-OWNER-004
- **Requirement Name:** View Own Venue Bookings & Customer Detail
- **Description:** Cho phép Owner xem danh sách, chi tiết và thông tin liên hệ của khách đặt tại các Venue thuộc quyền sở hữu của mình.
- **Actor:** OWNER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-010 View Own Venue Bookings`
- **Preconditions:** Owner đã đăng nhập.
- **Trigger:** Owner mở trang quản lý đơn đặt sân.
- **Functional Behavior:**
  1. System hiển thị danh sách đơn đặt sân tại các Venue của Owner.
  2. Từ chối cho xem đơn thuộc Venue của Owner khác.
- **Success Result:** Danh sách đơn tại sân của Owner hiển thị chính xác.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-003`
- **Acceptance Criteria:**
  - *Given:* Owner quản lý Venue A.
  - *When:* Owner mở danh sách booking.
  - *Then:* Chỉ các đơn đặt tại Venue A được hiển thị.

#### FR-OWNER-005: Manage Extra Services & Venue Promotions
- **Requirement ID:** FR-OWNER-005
- **Requirement Name:** Manage Extra Services & Venue Promotions
- **Description:** Cho phép Owner quản lý danh mục dịch vụ đi kèm (Thuê vợt, nước uống) và mã giảm giá riêng của Venue do mình sở hữu.
- **Actor:** OWNER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-014 Manage Services & Promotions`
- **Preconditions:** Venue thuộc sở hữu của Owner.
- **Trigger:** Owner tạo hoặc sửa dịch vụ / voucher.
- **Functional Behavior:**
  1. System lưu danh mục dịch vụ và mã ưu đãi riêng của Venue.
- **Success Result:** Dịch vụ và voucher của Venue được ghi nhận.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-003`
- **Acceptance Criteria:**
  - *Given:* Owner quản lý Venue A.
  - *When:* Owner thêm dịch vụ "Thuê vợt cầu lông - 20k".
  - *Then:* Dịch vụ mới xuất hiện cho Customer chọn khi đặt sân tại Venue A.

#### FR-OWNER-006: View Revenue & Court Utilization Reports
- **Requirement ID:** FR-OWNER-006
- **Requirement Name:** View Revenue & Court Utilization Reports
- **Description:** Cho phép Owner xem báo cáo thống kê doanh thu và tỷ lệ lấp đầy sân thuộc cơ sở do mình sở hữu theo ngày/tháng/năm.
- **Actor:** OWNER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-O-015 View Revenue & Utilization Report`
- **Preconditions:** Owner đã đăng nhập.
- **Trigger:** Owner mở trang báo cáo thống kê.
- **Functional Behavior:**
  1. System tổng hợp doanh thu và hiệu suất lấp đầy sân thuộc Venue của Owner.
  2. Không cho phép xem doanh thu của Owner khác.
- **Success Result:** Báo cáo doanh thu riêng của Owner được hiển thị.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-003`
- **Acceptance Criteria:**
  - *Given:* Owner đăng nhập hệ thống.
  - *When:* Owner xem báo cáo doanh thu tháng.
  - *Then:* Báo cáo hiển thị tổng doanh thu chỉ tính từ các đơn tại Venue của Owner đó.

---

### 3.10. Admin Supervision Requirements (FR-ADMIN)

#### FR-ADMIN-001: View & Manage User Status
- **Requirement ID:** FR-ADMIN-001
- **Requirement Name:** View & Manage User Status
- **Description:** Cho phép Admin xem danh sách tất cả người dùng và thực hiện Tạm khóa (`Suspend`) hoặc Kích hoạt lại (`Activate`) tài khoản vi phạm.
- **Actor:** ADMIN
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-A-001 View Users & Manage Status`
- **Preconditions:** Admin đã đăng nhập.
- **Trigger:** Admin thay đổi trạng thái tài khoản người dùng.
- **Functional Behavior:**
  1. System cập nhật trạng thái tài khoản thành `SUSPENDED` hoặc `ACTIVE`.
  2. Tài khoản `SUSPENDED` bị đăng xuất ngay lập tức và từ chối đăng nhập.
- **Success Result:** Trạng thái tài khoản người dùng được cập nhật.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-001`
- **Acceptance Criteria:**
  - *Given:* Admin đang quản lý danh sách User.
  - *When:* Admin chọn khóa tài khoản User A (`SUSPENDED`).
  - *Then:* Tài khoản User A bị khóa và không thể đăng nhập hệ thống.

#### FR-ADMIN-002: Review & Approve Owner Application
- **Requirement ID:** FR-ADMIN-002
- **Requirement Name:** Review & Approve Owner Application
- **Description:** Cho phép Admin xem xét và Phê duyệt (`Approve`) hoặc Từ chối (`Reject`) các đơn đăng ký nâng cấp làm đối tác Owner.
- **Actor:** ADMIN
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-A-002 Review & Approve Owner Application`
- **Preconditions:** Đơn đăng ký Owner đang ở trạng thái `PENDING_REVIEW`.
- **Trigger:** Admin chọn Phê duyệt hoặc Từ chối.
- **Functional Behavior:**
  1. If `APPROVE`: Role tài khoản nâng thành `OWNER`.
  2. If `REJECT`: Tài khoản giữ role `CUSTOMER`, ghi nhận lý do từ chối.
- **Success Result:** Đơn đăng ký được duyệt hoặc từ chối chính xác.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-001`
- **Acceptance Criteria:**
  - *Given:* Có đơn đăng ký Owner `PENDING_REVIEW`.
  - *When:* Admin duyệt chấp nhận.
  - *Then:* Role của tài khoản chuyển thành `OWNER`.

#### FR-ADMIN-003: Review & Approve Venue
- **Requirement ID:** FR-ADMIN-003
- **Requirement Name:** Review & Approve Venue
- **Description:** Cho phép Admin kiểm duyệt Phê duyệt (`Approve`) hoặc Từ chối (`Reject`) Venue mới tạo do Owner gửi.
- **Actor:** ADMIN
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-A-003 Review & Approve Venue`
- **Preconditions:** Venue ở trạng thái `PENDING`.
- **Trigger:** Admin bấm Phê duyệt hoặc Từ chối Venue.
- **Functional Behavior:**
  1. If `APPROVE`: Venue chuyển trạng thái `APPROVED` và hiển thị công khai trên Customer Website.
  2. If `REJECT`: Venue chuyển trạng thái `REJECTED`, ghi nhận lý do trả về cho Owner.
- **Success Result:** Venue `APPROVED` xuất hiện công khai trên trang khách hàng.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-004`
- **Acceptance Criteria:**
  - *Given:* Venue ở trạng thái `PENDING`.
  - *When:* Admin nhấn Phê duyệt (`APPROVE`).
  - *Then:* Venue chuyển thành `APPROVED` và xuất hiện công khai trên Customer Website.

#### FR-ADMIN-004: Suspend & Activate Venue
- **Requirement ID:** FR-ADMIN-004
- **Requirement Name:** Suspend & Activate Venue
- **Description:** Cho phép Admin Đình chỉ (`Suspend`) hoặc Mở lại hoạt động đối với Venue vi phạm chính sách sàn.
- **Actor:** ADMIN
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-A-004 Suspend / Activate Venue`
- **Preconditions:** Admin đã đăng nhập.
- **Trigger:** Admin đổi trạng thái Venue sang `SUSPENDED` hoặc `APPROVED`.
- **Functional Behavior:**
  1. If `SUSPENDED`: Venue lập tức ẩn khỏi kết quả tìm kiếm public và ngừng nhận đơn mới.
- **Success Result:** Trạng thái hoạt động của Venue bị đình chỉ hoặc kích hoạt lại.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-004`
- **Acceptance Criteria:**
  - *Given:* Venue đang hoạt động công khai.
  - *When:* Admin chọn đình chỉ Venue (`SUSPENDED`).
  - *Then:* Venue bị ẩn khỏi Customer Website và không thể đặt lịch mới.

#### FR-ADMIN-005: View All Bookings & Handle Exceptional Cases
- **Requirement ID:** FR-ADMIN-005
- **Requirement Name:** View All Bookings & Handle Exceptional Cases
- **Description:** Cho phép Admin xem toàn bộ danh sách đơn đặt sân trên toàn hệ thống và can thiệp xử lý các trường hợp khiếu nại/tranh chấp đặc biệt.
- **Actor:** ADMIN
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-A-005 View All Bookings`, `UC-A-006 Handle Exceptional Cases`
- **Preconditions:** Admin đã đăng nhập.
- **Trigger:** Admin xem hoặc can thiệp đơn hàng.
- **Functional Behavior:**
  1. System cho phép Admin tra cứu tất cả đơn đặt sân toàn sàn.
  2. Hỗ trợ Admin can thiệp hủy/điều chỉnh đơn trong trường hợp tranh chấp khẩn cấp.
- **Success Result:** Đơn hàng được Admin can thiệp xử lý theo thẩm quyền quản trị.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-002`, `BR-003`
- **Acceptance Criteria:**
  - *Given:* Admin mở trang giám sát đơn hàng.
  - *When:* Admin tra cứu đơn đặt sân toàn sàn.
  - *Then:* Tất cả đơn hàng của mọi Venue được hiển thị đầy đủ cho Admin.

#### FR-ADMIN-006: View All Payment Transaction Logs
- **Requirement ID:** FR-ADMIN-006
- **Requirement Name:** View All Payment Transaction Logs
- **Description:** Cho phép Admin giám sát lịch sử tất cả các giao dịch thanh toán MoMo phát sinh trên toàn hệ thống.
- **Actor:** ADMIN
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-A-007 View Payments / Transaction Logs`
- **Preconditions:** Admin đã đăng nhập.
- **Trigger:** Admin mở trang tra cứu giao dịch thanh toán.
- **Functional Behavior:**
  1. System hiển thị nhật ký các giao dịch thanh toán toàn sàn.
- **Success Result:** Lịch sử giao dịch thanh toán toàn sàn hiển thị đầy đủ.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-008`
- **Acceptance Criteria:**
  - *Given:* Giao dịch thanh toán phát sinh trên hệ thống.
  - *When:* Admin xem nhật ký thanh toán.
  - *Then:* Chi tiết thông tin giao dịch thanh toán được hiển thị cho Admin.

#### FR-ADMIN-007: Moderate Reported Reviews
- **Requirement ID:** FR-ADMIN-007
- **Requirement Name:** Moderate Reported Reviews
- **Description:** Cho phép Admin kiểm duyệt, ẩn hoặc xóa các đánh giá (Reviews) bị báo cáo vi phạm tiêu chuẩn cộng đồng.
- **Actor:** ADMIN
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-A-008 Moderate Review`
- **Preconditions:** Có review bị báo cáo vi phạm.
- **Trigger:** Admin ẩn hoặc xóa review.
- **Functional Behavior:**
  1. System xử lý ẩn review bị vi phạm khỏi giao diện hiển thị công khai.
- **Success Result:** Review vi phạm bị xử lý ẩn/xóa.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-009`
- **Acceptance Criteria:**
  - *Given:* Review bị báo cáo vi phạm chứa nội dung không phù hợp.
  - *When:* Admin duyệt chọn ẩn review.
  - *Then:* Review bị ẩn hoàn toàn khỏi trang chi tiết Venue.

#### FR-ADMIN-008: View System Dashboard & Reports
- **Requirement ID:** FR-ADMIN-008
- **Requirement Name:** View System Dashboard & Reports
- **Description:** Cho phép Admin xem báo cáo tổng quan toàn hệ thống (Tổng doanh thu sàn, tổng số booking, số lượng người dùng và sân đấu).
- **Actor:** ADMIN
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-A-009 View System Dashboard`
- **Preconditions:** Admin đã đăng nhập.
- **Trigger:** Admin mở Dashboard quản trị.
- **Functional Behavior:**
  1. System tổng hợp chỉ số thống kê tổng thể toàn nền tảng.
- **Success Result:** Báo cáo Dashboard hệ thống được hiển thị.
- **Failure / Exception:** N/A.
- **Business Rules:** N/A.
- **Acceptance Criteria:**
  - *Given:* Admin truy cập trang chủ quản trị.
  - *When:* Dashboard tải xong.
  - *Then:* Tổng quan doanh thu và chỉ số hoạt động toàn sàn được hiển thị.

#### FR-ADMIN-009: View System Audit Logs
- **Requirement ID:** FR-ADMIN-009
- **Requirement Name:** View System Audit Logs
- **Description:** Cho phép Admin tra cứu nhật ký ghi lại tất cả các thao tác quản trị nhạy cảm của Admin và Owner trên hệ thống.
- **Actor:** ADMIN
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-A-010 View System Audit Logs`
- **Preconditions:** Admin đã đăng nhập.
- **Trigger:** Admin mở nhật ký Audit Logs.
- **Functional Behavior:**
  1. System hiển thị danh sách nhật ký các hành động quản trị (Duyệt sân, khóa user, chỉnh giá sân,...).
- **Success Result:** Nhật ký hệ thống hiển thị chính xác.
- **Failure / Exception:** N/A.
- **Business Rules:** N/A.
- **Acceptance Criteria:**
  - *Given:* Thao tác quản trị nhạy cảm diễn ra.
  - *When:* Admin tra cứu Audit Logs.
  - *Then:* Nhật ký thao tác ghi rõ Actor, thời gian và hành động thực hiện.

---

### 3.11. Review Management Requirements (FR-REVIEW)

#### FR-REVIEW-001: Completed Booking Review Submission
- **Requirement ID:** FR-REVIEW-001
- **Requirement Name:** Completed Booking Review Submission
- **Description:** System ghi nhận đánh giá được gửi sau khi Customer hoàn thành một đơn đặt sân hợp lệ (`COMPLETED`).
- **Actor:** CUSTOMER
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-C-019 Review Completed Booking`
- **Preconditions:** Booking thuộc sở hữu của Customer và có trạng thái `COMPLETED`.
- **Trigger:** Customer gửi Form đánh giá.
- **Functional Behavior:**
  1. System kiểm tra đơn đặt sân có trạng thái `COMPLETED`.
  2. Quy tắc `1 booking = 1 review` được áp dụng như một `MVP Candidate — Business Decision Required`.
  3. Review Target: `TBD — Business Decision Required (OQ-003)`.
  4. System ghi nhận đánh giá được gửi sau khi xác minh đơn hàng hợp lệ.
- **Success Result:** Đánh giá được ghi nhận thành công.
- **Failure / Exception:** Từ chối nếu đơn chưa `COMPLETED`.
- **Business Rules:** `BR-009`
- **Acceptance Criteria:**
  - *Given:* Customer có đơn đặt sân trạng thái `COMPLETED`.
  - *When:* Customer gửi đánh giá sao và bình luận.
  - *Then:* Đánh giá được hệ thống ghi nhận thành công.

---

### 3.12. Notification Engine Requirements (FR-NOTI)

#### FR-NOTI-001: Automated System Event Notifications
- **Requirement ID:** FR-NOTI-001
- **Requirement Name:** Automated System Event Notifications
- **Description:** Hệ thống tự động tạo thông báo gửi tới người dùng khi phát sinh các sự kiện hệ thống (Xác thực OTP, Xác nhận đặt sân, Hủy đơn, Hết hạn hold).
- **Actor:** SYSTEM
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-S-005 Send Notifications & OTP Emails`
- **Preconditions:** Sự kiện hệ thống phát sinh.
- **Trigger:** Trạng thái đơn hoặc tài khoản thay đổi.
- **Functional Behavior:**
  1. System tạo thông báo gửi tới người dùng tương ứng.
  2. Kênh phát thông báo chi tiết đánh dấu: `Notification Delivery Channels: TBD — Business Decision Required` (`OQ-006`). ngoại trừ Email OTP bắt buộc gửi qua Email thực.
- **Success Result:** Thông báo được khởi tạo và chuyển tới người dùng.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-001`, `BR-007`
- **Acceptance Criteria:**
  - *Given:* Đơn đặt sân chuyển trạng thái `CONFIRMED`.
  - *When:* Sự kiện hoàn tất.
  - *Then:* Thông báo xác nhận được tự động khởi tạo gửi tới Customer.

---

### 3.13. System Automated Processing Requirements (FR-SYS)

#### FR-SYS-001: Automatic Booking Completion Processing
- **Requirement ID:** FR-SYS-001
- **Requirement Name:** Automatic Booking Completion Processing
- **Description:** Hệ thống tự động phát hiện các đơn đặt sân đã xác nhận có giờ chơi kết thúc để chuyển trạng thái sang `COMPLETED`.
- **Actor:** SYSTEM
- **Priority:** MUST
- **Status:** APPROVED
- **Source Use Case:** `UC-S-006 Mark Booking Completed`
- **Preconditions:** Booking `CONFIRMED` và giờ chơi đã qua.
- **Trigger:** Hệ thống tự động quét kiểm tra định kỳ (`OQ-004`).
- **Functional Behavior:**
  1. System kiểm tra các đơn `CONFIRMED` có thời gian kết thúc < Hiện tại.
  2. System chuyển trạng thái đơn thành `COMPLETED`.
  3. Kích hoạt quyền gửi Đánh giá cho Customer.
- **Success Result:** Đơn tự động chuyển sang `COMPLETED`.
- **Failure / Exception:** N/A.
- **Business Rules:** `BR-009`
- **Acceptance Criteria:**
  - *Given:* Đơn `CONFIRMED` có thời gian chơi đã kết thúc.
  - *When:* Hệ thống thực hiện kiểm tra tự động.
  - *Then:* Đơn hàng chuyển sang trạng thái `COMPLETED`.

---

## 4. Bảng Tổng Hợp Yêu Cầu Chức Năng (Functional Requirement Matrix)

| Requirement ID | Tên Yêu Cầu Chức Năng | Actor | Priority | Status | Source Use Case |
|---|---|---|---|---|---|
| **FR-AUTH-001** | Customer Account Registration | GUEST/CUSTOMER | MUST | APPROVED | UC-C-001 |
| **FR-AUTH-002** | Email OTP Verification | CUSTOMER | MUST | APPROVED | UC-C-002 |
| **FR-AUTH-003** | User Login Authentication | CUST/OWNER/ADMIN| MUST | APPROVED | UC-C-003 |
| **FR-AUTH-004** | Password Reset via OTP | CUSTOMER/OWNER | MUST | APPROVED | UC-C-005, UC-C-006 |
| **FR-AUTH-005** | User Logout | CUST/OWNER/ADMIN| MUST | APPROVED | UC-C-004 |
| **FR-AUTH-006** | Change Password | CUST/OWNER/ADMIN| MUST | APPROVED | UC-C-007 |
| **FR-GUEST-001**| Browse Homepage & Sports Categories | GUEST/CUSTOMER | MUST | APPROVED | UC-G-001, UC-G-002 |
| **FR-GUEST-002**| Search & Filter Venues | GUEST/CUSTOMER | MUST | APPROVED | UC-G-003, 004, 005, UC-C-008 |
| **FR-GUEST-003**| View Venue Detail, Map & Public Info | GUEST/CUSTOMER | MUST | APPROVED | UC-G-006, UC-G-007, UC-G-008 |
| **FR-GUEST-004**| Guest Protected Action Guard | GUEST | MUST | APPROVED | UC-G-006, UC-C-011, UC-C-014 |
| **FR-CUST-001** | Manage Personal Profile | CUSTOMER | MUST | APPROVED | UC-C-021 |
| **FR-CUST-002** | Favorite Venues Management | CUSTOMER | MUST | APPROVED | UC-C-010 |
| **FR-CUST-003** | View Own Booking History & Detail | CUSTOMER | MUST | APPROVED | UC-C-016 |
| **FR-CUST-004** | View Personal Notifications | CUSTOMER | MUST | APPROVED | UC-C-020 |
| **FR-CUST-005** | Request Reschedule Action | CUSTOMER | FUTURE | FUTURE | UC-C-018 |
| **FR-CUST-006** | Submit & View Owner Application | CUSTOMER | MUST | APPROVED | UC-O-001, UC-O-002 |
| **FR-BOOK-001** | View Court Availability Grid | GUEST/CUST/OWNER| MUST | APPROVED | UC-C-009 |
| **FR-BOOK-002** | Slot, Services & Coupon Application | CUSTOMER | MUST | APPROVED | UC-C-011, UC-C-012, UC-C-013 |
| **FR-BOOK-003** | Atomic Availability & Hold Creation | CUSTOMER | MUST | APPROVED | UC-C-014 |
| **FR-BOOK-004** | Double Booking Prevention | SYSTEM | MUST | APPROVED | UC-C-014 |
| **FR-BOOK-005** | Payment Pending State Creation | CUSTOMER/SYSTEM| MUST | APPROVED | UC-C-015 |
| **FR-BOOK-006** | Confirmation via Verified Callback | SYSTEM | MUST | APPROVED | UC-S-003, UC-S-004 |
| **FR-BOOK-007** | Booking Payment Failure Handling | CUSTOMER/SYSTEM| MUST | APPROVED | UC-S-002, UC-C-015 |
| **FR-BOOK-008** | Booking Hold Expiration Handling | SYSTEM | MUST | APPROVED | UC-S-001, UC-S-002 |
| **FR-BOOK-009** | Customer Booking Cancellation | CUSTOMER | MUST | APPROVED | UC-C-017 |
| **FR-PAY-001**  | MoMo Payment Request Generation | CUSTOMER/SYSTEM| MUST | APPROVED | UC-C-015 |
| **FR-PAY-002**  | Server Callback IPN Verification | SYSTEM | MUST | APPROVED | UC-S-003 |
| **FR-VENUE-001**| Create Venue Registration | OWNER | MUST | APPROVED | UC-O-003 |
| **FR-VENUE-002**| Update Own Venue Information | OWNER | MUST | APPROVED | UC-O-004 |
| **FR-VENUE-003**| Manage Venue Gallery Images | OWNER | MUST | APPROVED | UC-O-005 |
| **FR-VENUE-004**| Manage Venue Facilities | OWNER | MUST | APPROVED | UC-O-005 |
| **FR-VENUE-005**| Manage Venue Branches | OWNER | MUST | APPROVED | UC-O-006 |
| **FR-COURT-001**| Create & Manage Courts | OWNER | MUST | APPROVED | UC-O-006 |
| **FR-COURT-002**| Update Court Information | OWNER | MUST | APPROVED | UC-O-006, UC-O-011 |
| **FR-COURT-003**| Court Status Management & Maintenance| OWNER | MUST | APPROVED | UC-O-009, UC-O-010 |
| **FR-SCHED-001**| Configure Operating Hours | OWNER | MUST | APPROVED | UC-O-007 |
| **FR-SCHED-002**| Configure Pricing & Peak Hour Rules | OWNER | MUST | APPROVED | UC-O-007 |
| **FR-SCHED-003**| Manual Slot Blocking & Unblocking | OWNER | MUST | APPROVED | UC-O-008 |
| **FR-OWNER-001**| Manual Offline Booking Creation | OWNER | MUST | APPROVED | UC-O-011 |
| **FR-OWNER-002**| Operational Check-in | OWNER | SHOULD | APPROVED | UC-O-012 |
| **FR-OWNER-003**| Owner Cancellation per Policy | OWNER | MUST | APPROVED | UC-O-013 |
| **FR-OWNER-004**| View Own Venue Bookings & Detail | OWNER | MUST | APPROVED | UC-O-010 |
| **FR-OWNER-005**| Manage Extra Services & Promotions | OWNER | MUST | APPROVED | UC-O-014 |
| **FR-OWNER-006**| View Revenue & Utilization Reports | OWNER | MUST | APPROVED | UC-O-015 |
| **FR-ADMIN-001**| View & Manage User Status | ADMIN | MUST | APPROVED | UC-A-001 |
| **FR-ADMIN-002**| Review & Approve Owner Application | ADMIN | MUST | APPROVED | UC-A-002 |
| **FR-ADMIN-003**| Review & Approve Venue | ADMIN | MUST | APPROVED | UC-A-003 |
| **FR-ADMIN-004**| Suspend & Activate Venue | ADMIN | MUST | APPROVED | UC-A-004 |
| **FR-ADMIN-005**| View Bookings & Exceptional Cases | ADMIN | MUST | APPROVED | UC-A-005, UC-A-006 |
| **FR-ADMIN-006**| View All Payment Transaction Logs | ADMIN | MUST | APPROVED | UC-A-007 |
| **FR-ADMIN-007**| Moderate Reported Reviews | ADMIN | MUST | APPROVED | UC-A-008 |
| **FR-ADMIN-008**| View System Dashboard & Reports | ADMIN | MUST | APPROVED | UC-A-009 |
| **FR-ADMIN-009**| View System Audit Logs | ADMIN | MUST | APPROVED | UC-A-010 |
| **FR-REVIEW-001**| Completed Booking Review Submission | CUSTOMER | MUST | APPROVED | UC-C-019 |
| **FR-NOTI-001** | Automated System Event Notifications | SYSTEM | MUST | APPROVED | UC-S-005 |
| **FR-SYS-001**  | Automatic Booking Completion Processing| SYSTEM | MUST | APPROVED | UC-S-006 |

---

## 5. Ma Trận Truy Vết Hoàn Chỉnh (Traceability Matrix: 60 Use Cases -> 56 FRs)

| Mã Use Case | Tên Use Case trong Task 01.02 | Functional Requirements Tương Ứng | Trạng thái FR |
|---|---|---|---|
| `UC-G-001` | Browse Homepage | FR-GUEST-001 | APPROVED |
| `UC-G-002` | Browse Sports Categories | FR-GUEST-001 | APPROVED |
| `UC-G-003` | Search Venue | FR-GUEST-002 | APPROVED |
| `UC-G-004` | Filter Venue | FR-GUEST-002 | APPROVED |
| `UC-G-005` | View Venue List | FR-GUEST-002 | APPROVED |
| `UC-G-006` | View Venue Detail | FR-GUEST-003, FR-GUEST-004 | APPROVED |
| `UC-G-007` | View Venue Map | FR-GUEST-003 | APPROVED |
| `UC-G-008` | View Public Information | FR-GUEST-003 | APPROVED |
| `UC-C-001` | Register Account | FR-AUTH-001 | APPROVED |
| `UC-C-002` | Verify Email OTP | FR-AUTH-002 | APPROVED |
| `UC-C-003` | Login | FR-AUTH-003 | APPROVED |
| `UC-C-004` | Logout | FR-AUTH-005 | APPROVED |
| `UC-C-005` | Forgot Password | FR-AUTH-004 | APPROVED |
| `UC-C-006` | Reset Password | FR-AUTH-004 | APPROVED |
| `UC-C-007` | Change Password | FR-AUTH-006 | APPROVED |
| `UC-C-008` | Search & Filter Venues | FR-GUEST-002 | APPROVED |
| `UC-C-009` | View Court Availability | FR-BOOK-001 | APPROVED |
| `UC-C-010` | Add / Remove Favorite | FR-CUST-002 | APPROVED |
| `UC-C-011` | Select Court & Slot | FR-BOOK-002, FR-GUEST-004 | APPROVED |
| `UC-C-012` | Select Extra Services | FR-BOOK-002 | APPROVED |
| `UC-C-013` | Apply Promotion Coupon | FR-BOOK-002 | APPROVED |
| `UC-C-014` | Create Booking Hold | FR-BOOK-003, FR-BOOK-004, FR-GUEST-004 | APPROVED |
| `UC-C-015` | Make Payment via MoMo | FR-BOOK-005, FR-BOOK-007, FR-PAY-001 | APPROVED |
| `UC-C-016` | View Own Bookings | FR-CUST-003 | APPROVED |
| `UC-C-017` | Cancel Booking Action | FR-BOOK-009 | APPROVED |
| `UC-C-018` | Request Reschedule Action | FR-CUST-005 | FUTURE |
| `UC-C-019` | Review Completed Booking | FR-REVIEW-001 | APPROVED |
| `UC-C-020` | View Notifications | FR-CUST-004 | APPROVED |
| `UC-C-021` | Manage Personal Profile | FR-CUST-001 | APPROVED |
| `UC-O-001` | Submit Owner Application | FR-CUST-006 | APPROVED |
| `UC-O-002` | View Owner Application Status | FR-CUST-006 | APPROVED |
| `UC-O-003` | Create Venue | FR-VENUE-001 | APPROVED |
| `UC-O-004` | Update Own Venue | FR-VENUE-002 | APPROVED |
| `UC-O-005` | Manage Venue Images & Facilities | FR-VENUE-003, FR-VENUE-004 | APPROVED |
| `UC-O-006` | Manage Branches & Courts | FR-VENUE-005, FR-COURT-001, FR-COURT-002| APPROVED |
| `UC-O-007` | Configure Operating Hours & Pricing| FR-SCHED-001, FR-SCHED-002 | APPROVED |
| `UC-O-008` | Block / Unblock Court Slot | FR-SCHED-003 | APPROVED |
| `UC-O-009` | Set Court Maintenance | FR-COURT-003 | APPROVED |
| `UC-O-010` | View Own Venue Bookings | FR-OWNER-004 | APPROVED |
| `UC-O-011` | Create Manual Offline Booking | FR-OWNER-001 | APPROVED |
| `UC-O-012` | Check-in / Operational Action | FR-OWNER-002 | APPROVED (Optional)|
| `UC-O-013` | Cancel Booking per Policy | FR-OWNER-003 | APPROVED |
| `UC-O-014` | Manage Services & Promotions | FR-OWNER-005 | APPROVED |
| `UC-O-015` | View Revenue & Utilization Report | FR-OWNER-006 | APPROVED |
| `UC-A-001` | View All Users & Manage Status | FR-ADMIN-001 | APPROVED |
| `UC-A-002` | Review Owner Application | FR-ADMIN-002 | APPROVED |
| `UC-A-003` | Review & Approve Venue | FR-ADMIN-003 | APPROVED |
| `UC-A-004` | Suspend / Activate Venue | FR-ADMIN-004 | APPROVED |
| `UC-A-005` | View All System Bookings | FR-ADMIN-005 | APPROVED |
| `UC-A-006` | Handle Exceptional Cases | FR-ADMIN-005 | APPROVED |
| `UC-A-007` | View All Payment Logs | FR-ADMIN-006 | APPROVED |
| `UC-A-008` | Moderate Reported Reviews | FR-ADMIN-007 | APPROVED |
| `UC-A-009` | View System Dashboard | FR-ADMIN-008 | APPROVED |
| `UC-A-010` | View System Audit Logs | FR-ADMIN-009 | APPROVED |
| `UC-S-001` | Expire Booking Hold | FR-BOOK-008 | APPROVED |
| `UC-S-002` | Release Expired Slot | FR-BOOK-007, FR-BOOK-008 | APPROVED |
| `UC-S-003` | Process Payment Callback (IPN) | FR-BOOK-006, FR-PAY-002 | APPROVED |
| `UC-S-004` | Update Status Automatically | FR-BOOK-006 | APPROVED |
| `UC-S-005` | Send Notifications & OTP Emails | FR-NOTI-001 | APPROVED |
| `UC-S-006` | Mark Booking Completed | FR-SYS-001 | APPROVED |

---

## 6. Open Questions & TBD Requirements

- **OQ-001: Cancellation Refund Policy Implementation:** Chi tiết tỷ lệ hoàn tiền khi Customer hủy đơn hợp lệ (hoàn tự động qua MoMo Refund hay xử lý thủ công) là `TBD — Business Decision Required`.
- **OQ-002: Pay-at-venue Confirmation Flow:** Đơn đặt trả sau tại sân có cần Owner bấm nhận đơn trên ứng dụng không hay tự động `CONFIRMED` kèm phạt bùng hàng (No-show)?
- **OQ-003: Review Target Scope:** Đánh giá của khách hàng sẽ gắn theo cấp độ Venue chung hay chi tiết tới từng Sân con (`Court`)?
- **OQ-004: Automatic Completion Frequency:** Tần suất tác vụ tự động hệ thống quét đổi trạng thái đơn sang `COMPLETED` sau khi hết giờ chơi.
- **OQ-005: Reschedule Policy & Pricing Difference:** Quy trình dời lịch (`Request Reschedule`) và tính toán chênh lệch giá giờ chơi thuộc phạm vi phiên bản `FUTURE`.
- **OQ-006: Notification Delivery Channels:** Kênh phân phối thông báo chi tiết (Email vs SMS vs Push Notification) được đánh dấu `TBD — Business Decision Required`.

---

## 7. Definition of Done (DoD) - Task 01.03 Final Coverage Pass

- [x] Đã thiết lập 56 Functional Requirements với mã ID chuẩn hóa, cover 100% 60 Use Cases của Task 01.02.
- [x] Đã mô tả đầy đủ thông tin: ID, Name, Description, Actor, Priority, Status, Source Use Case, Preconditions, Trigger, Functional Behavior, Acceptance Criteria (`Given/When/Then`).
- [x] Đã xóa toàn bộ các thuật ngữ/chi tiết implementation leakage (`WHERE clause`, `403 Forbidden`, `HTTP POST IPN`, `Cron Job implementation detail`, `Bảng giá hardcode`).
- [x] Đã thay thế `Actor: ALL` bằng việc phân định rõ từng Actor (`GUEST / CUSTOMER / OWNER / ADMIN / SYSTEM`).
- [x] Không tự tạo business rule mới, bảo lưu tất cả các mục `TBD — Business Decision Required`.
- [x] Lập bảng Functional Requirement Matrix và Traceability Matrix hoàn chỉnh.
- [x] Không thay đổi file `01-actors-and-permissions.md` và `02-use-cases-and-user-flows.md`.

---
*Tài liệu được cập nhật bởi Antigravity AI Assistant cho dự án SportHubAI.*
