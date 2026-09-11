# BÁO CÁO PHÂN TÍCH YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION)
## DỰ ÁN: SPORTHUB – HỆ THỐNG ĐẶT LỊCH SÂN THỂ THAO TRỰC TUYẾN (CONCURRENT MULTI-USER ARCHITECTURE)

* **Dự án**: SportHubAI (Hệ thống đặt lịch sân thể thao trực tuyến đa người dùng xử lý đồng thời)
* **Chức danh người lập**: Kỹ sư Quản lý Dự án Phần mềm (Software Project Manager)
* **Ngày lập báo cáo**: 04/09/2026
* **Phiên bản tài liệu**: 1.0.0
* **Trạng thái**: Hoàn thành phân tích toàn diện codebase & kiến trúc hệ thống

---

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)

### 1.1 Giới thiệu dự án
**SportHub** là nền tảng thương mại điện tử dịch vụ thể thao (Sports-Tech Platform) cung cấp giải pháp kết nối thời gian thực giữa Khách hàng có nhu cầu chơi thể thao, Chủ sở hữu cụm sân (Court Owners) và Quản trị viên hệ thống (System Admins).

Hệ thống được thiết kế theo kiến trúc **Concurrent Multi-User Architecture** với cấu trúc **One Shared Express REST API Backend + One Shared MySQL 8.0 Database + 3 Independent Frontends**, phục vụ cho 3 nhóm đối tượng người dùng thao tác độc lập và đồng thời trên các cổng dịch vụ riêng biệt:
1. **Customer Frontend** (Port 5175): Dành cho người chơi tìm kiếm sân, đặt lịch, thanh toán trực tuyến, đánh giá và tìm đối thủ/ghép đội.
2. **Owner Frontend** (Port 5174): Dành cho chủ sân/quản lý cụm sân điều hành lịch đặt, khóa sân bảo trì, xem báo cáo doanh thu và cấu hình giá.
3. **Admin Frontend** (Port 5173): Dành cho ban quản trị duyệt hồ sơ chủ sân, quản lý người dùng, banner quảng cáo và giám sát toàn sàn.

```text
                                  ┌───────────────────────────┐
                                  │    Express REST API       │
                                  │      (Port 3000)          │
                                  │   http://localhost:3000   │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │    MySQL 8.0 Database     │
                                  │     (sporthubai_dev)      │
                                  └─────────────┬─────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
    ┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
    │     ADMIN FRONTEND      │    │     OWNER FRONTEND      │    │    CUSTOMER FRONTEND    │
    │     frontend/admin      │    │     frontend/owner      │    │    frontend/customer    │
    │       (Port 5173)       │    │       (Port 5174)       │    │       (Port 5175)       │
    └─────────────────────────┘    └─────────────────────────┘    └─────────────────────────┘
```

### 1.2 Bối cảnh & Mục tiêu chiến lược
* **Bài toán thực tế**: Ngành kinh doanh sân thể thao (Cầu lông, Bóng đá, Tennis, Pickleball, Bóng rổ, v.v.) đối mặt với tình trạng đặt trùng sân (Double Booking) khi xử lý qua điện thoại/tin nhắn, thất thoát doanh thu, thiếu công cụ thống kê và trải nghiệm đặt sân của người chơi còn thủ công.
* **Mục tiêu của hệ thống**:
  * Tự động hóa 100% quy trình tìm sân - chọn giờ - thanh toán - xác nhận đặt chỗ.
  * Giải quyết triệt để sự cố **Double Booking** ở mức độ miligiây khi có nhiều người cùng thao tác đặt 1 khung giờ trên 1 sân.
  * Tối ưu hóa công suất lấp đầy sân (Occupancy Rate) thông qua cơ chế tính giá linh hoạt theo khung giờ cao điểm/thấp điểm (Dynamic Peak/Off-Peak Pricing).
  * Tăng cường kết nối cộng đồng người chơi thể thao thông qua phân hệ ghép đội và giao lưu.

### 1.3 Đối tượng sử dụng & Các tác nhân (Actors & Stakeholders)

| Tác nhân (Actor) | Mô tả vai trò & Trách nhiệm trong hệ thống |
| :--- | :--- |
| **Customer (Khách hàng)** | Người chơi thể thao sử dụng cổng Customer để tra cứu sân, kiểm tra lịch trống, đặt sân, thanh toán online (MoMo/VietQR), viết đánh giá, lưu cụm sân yêu thích và giao lưu tìm đồng đội. |
| **Owner (Chủ sân / Quản lý)** | Đối tác kinh doanh sử dụng cổng Owner để quản lý danh sách sân, thiết lập bảng giá chi tiết, khóa lịch sân bảo trì, xác nhận/check-in khách đặt sân và theo dõi biểu đồ doanh thu. |
| **Admin (Quản trị viên)** | Ban quản trị hệ thống sử dụng cổng Admin để thẩm định & phê duyệt hồ sơ đăng ký của Chủ sân, quản lý tài khoản người dùng, quản lý danh mục tiện ích, quản lý banner quảng cáo và xem tổng quan vận hành toàn sàn. |
| **System (Hệ thống tự động)** | Các tiến trình chạy ngầm (Background Workers/Cron), cổng thanh toán bên thứ ba (MoMo API, VietQR), dịch vụ gửi Email (Nodemailer), Cloud Storage. |

---

## 2. PHÂN TÍCH YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS - FR)

Dựa trên phân tích chi tiết toàn bộ codebase (`backend/src/routes`, `controllers`, `services`, `models` và 3 ứng dụng frontend), các yêu cầu chức năng được chuẩn hóa thành 10 phân hệ cốt lõi sau:

---

### 2.1 Phân hệ Xác thực & Phân quyền (Authentication & Authorization Module)

* **FR-AUTH-01: Đăng ký & Đăng nhập tài khoản**
  * Cho phép người dùng đăng ký tài khoản Khách hàng (Customer) với Email, Mật khẩu, Họ tên, Số điện thoại.
  * Đăng nhập chuẩn mã hóa mật khẩu (`bcrypt`), trả về cặp JWT Token (Access Token & Refresh Token).
  * Hỗ trợ đăng nhập độc lập trên cả 3 cổng (Admin, Owner, Customer).

* **FR-AUTH-02: Phân quyền truy cập theo vai trò (RBAC - Role-Based Access Control)**
  * Kiểm soát quyền hạn API ở Backend thông qua Middleware `requireRole(['ADMIN', 'OWNER', 'CUSTOMER'])`.
  * Đảm bảo tài khoản Customer không thể gọi API của Owner/Admin và ngược lại.

* **FR-AUTH-03: Cách ly phiên làm việc theo Tab trình duyệt (Tab Isolation & Sandbox)**
  * Lưu trữ JWT Token tại `sessionStorage` của từng cổng frontend độc lập.
  * Cho phép 1 người dùng mở đồng thời 3 tab trình duyệt đại diện cho 3 vai trò (Admin - Port 5173, Owner - Port 5174, Customer - Port 5175) trên cùng 1 máy tính mà không bị va chạm hay dính chéo token.

* **FR-AUTH-04: Quên mật khẩu & Đổi mật khẩu**
  * Quy trình quên mật khẩu qua mã OTP xác minh gửi về Email hoặc Password Reset Token có thời hạn.
  * Đổi mật khẩu trong trang quản lý tài khoản cá nhân.

---

### 2.2 Phân hệ Khách hàng - Đặt sân & Trải nghiệm (Customer Portal)

#### 2.2.1 Tìm kiếm & Khám phá Cụm sân (Venue Search & Discovery)
* **FR-CUST-01: Bộ lọc & Tìm kiếm đa tiêu chí (Advanced Search)**
  * Tìm kiếm theo từ khóa (Tên cụm sân, địa chỉ).
  * Lọc theo Môn thể thao: Cầu lông (Badminton), Bóng đá (Football), Tennis, Pickleball, Bóng rổ (Basketball), v.v.
  * Lọc theo Vị trí (Tỉnh/Thành phố, Quận/Huyện, Tọa độ địa lý/Khoảng cách).
  * Lọc theo Khoảng giá (Min/Max Price) và Tiện ích (Có đèn thắp sáng, Wifi, Phòng thay đồ, Bãi đỗ xe ô tô, Thuê dụng cụ).
* **FR-CUST-02: Xem chi tiết Cụm sân (Venue Detail View)**
  * Hiển thị thông tin tổng quan, bộ sưu tập hình ảnh sân (Venue Images Gallery), danh sách tiện ích.
  * Hiển thị vị trí bản đồ, giờ mở/đóng cửa và danh sách các sân con (Courts).
  * Hiển thị điểm đánh giá trung bình (Rating score) và danh sách nhận xét thực tế từ khách hàng.

#### 2.2.2 Kiểm tra Khung giờ Trống & Tính giá Linh hoạt (Availability & Dynamic Pricing)
* **FR-CUST-03: Truy vấn Ô lịch trống thời gian thực (Real-Time Availability Grid)**
  * Cho phép chọn ngày đặt sân cụ thể.
  * Hiển thị ma trận khung giờ (Time-slot Grid: 30 phút hoặc 60 phút mỗi slot) cho từng sân con.
  * Phân biệt rõ trạng thái khung giờ bằng màu sắc: Trống (Available), Đã đặt (Booked), Đang chờ thanh toán (Pending Payment), Bị khóa bảo trì (Blocked).
* **FR-CUST-04: Tính đơn giá động (Dynamic Pricing Engine)**
  * Tự động tính tổng tiền chính xác dựa trên bảng giá cấu hình theo:
    * Khung giờ thường (Off-Peak) vs Khung giờ vàng/cao điểm (Peak Hours - ví dụ: 17:00 - 21:00).
    * Ngày thường (T2 - T6) vs Cuối tuần (T7, CN) hoặc Ngày lễ.

#### 2.2.3 Động cơ Đặt lịch & Chống Đặt trùng (Booking Engine & Anti-Double Booking)
* **FR-CUST-05: Tạo đơn đặt sân (Booking Creation)**
  * Khách chọn sân con, ngày chơi, giờ bắt đầu (`start_time`) và giờ kết thúc (`end_time`).
  * Hệ thống tự động kiểm tra thời gian hợp lệ (phải nằm trong giờ vận hành của cụm sân, giờ bắt đầu < giờ kết thúc).
* **FR-CUST-06: Cơ chế chống Đặt trùng tuyệt đối (Double Booking Protection Engine)**
  * Áp dụng khóa giao dịch ở mức cơ sở dữ liệu (**InnoDB Pessimistic Locking** - `lock: transaction.LOCK.UPDATE`).
  * Khi có 2 khách hàng bấm đặt cùng 1 sân tại cùng 1 miligiây, request 1 giữ khóa dữ liệu, request 2 phải chờ. Sau khi request 1 tạo đơn thành công, request 2 lập tức bị chối bỏ với thông báo lỗi "Khung giờ đã được đặt", loại bỏ hoàn toàn rủi ro trùng lịch.
* **FR-CUST-07: Quản lý Trạng thái Đơn hàng (Booking Lifecycle)**
  * Đơn đặt chuyển giao qua các trạng thái chuẩn: `PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `CHECKED_IN` / `COMPLETED` (hoặc `CANCELLED` / `EXPIRED`).
  * Ghi lại toàn bộ lịch sử thay đổi trạng thái vào bảng `BookingStatusHistory`.

#### 2.2.4 Thanh toán & Quản lý Đơn hàng (Payments & Transaction Management)
* **FR-CUST-08: Thanh toán Đa phương thức (Multi-channel Payment Integration)**
  * Tích hợp Cổng thanh toán MoMo: Tạo QR Thanh toán, chuyển hướng app MoMo, nhận thông báo giao dịch tự động qua Webhook/IPN.
  * Thanh toán Chuyển khoản Ngân hàng qua VietQR (Tự động sinh mã QR chứa nội dung chuyển khoản mã đơn hàng).
  * Thanh toán trực tiếp bằng tiền mặt/thẻ tại sân (Cash on Check-in).
* **FR-CUST-09: Hủy đơn & Yêu cầu Hoàn tiền (Cancellation & Refund Policy)**
  * Khách hàng được quyền hủy đơn trước thời hạn quy định (ví dụ: trước 24h).
  * Tự động hoặc thủ công khởi tạo giao dịch hoàn tiền (`RefundTransaction`) dựa trên chính sách hoàn tiền của cụm sân.

#### 2.2.5 Đánh giá & Phản hồi (Reviews & Ratings)
* **FR-CUST-10: Đánh giá có xác thực (Verified Booking Reviews)**
  * Chỉ khách hàng đã hoàn thành đơn đặt sân (`COMPLETED`) tại cụm sân mới có quyền gửi Đánh giá (Số sao từ 1 đến 5) và Nhận xét (Nội dung + Hình ảnh).
  * Tự động cập nhật lại điểm trung bình Rating của cụm sân.

#### 2.2.6 Cụm sân Yêu thích (Favorite Venues)
* **FR-CUST-11: Lưu sân yêu thích**
  * Thêm/Xóa cụm sân vào danh sách yêu thích cá nhân để xem lại và đặt nhanh.

#### 2.2.7 Cộng đồng Thể thao & Thách đấu (Sports Community & Matchmaking)
* **FR-CUST-12: Tìm đối thủ & Ghép đội (Community Posts & Matchmaking)**
  * Đăng bài tìm người chơi cùng, tìm đối thủ giao lưu (ghi rõ môn thể thao, thời gian, sân chơi, trình độ, chia sẻ tiền sân).
  * Cho phép người chơi khác gửi yêu cầu tham gia (`PostApplication`), chủ bài đăng duyệt hoặc từ chối.

---

### 2.3 Phân hệ Chủ sân - Quản lý Cụm sân & Vận hành (Owner Portal)

#### 2.3.1 Đăng ký Đối tác & Xét duyệt (Owner Registration)
* **FR-OWN-01: Gửi hồ sơ đăng ký Chủ sân**
  * Đăng ký tài khoản Owner, điền thông tin doanh nghiệp/cá nhân, thông tin cụm sân, upload Giấy phép kinh doanh / Căn cước công dân.
  * Hồ sơ đi vào trạng thái `PENDING_APPROVAL` chờ Admin xét duyệt.

#### 2.3.2 Quản lý Cụm sân, Chi nhánh & Sân con (Venues, Branches & Courts)
* **FR-OWN-02: Quản lý Thông tin Cụm sân & Chi nhánh**
  * Cập nhật tên cụm sân, mô tả, địa chỉ chi tiết, hotline, tọa độ Google Maps.
  * Upload hình ảnh thực tế của cụm sân (Venue Gallery Images).
  * Gắn danh mục tiện ích phục vụ (Bãi xe, Căn tin, Wifi, Đèn chiếu sáng).
* **FR-OWN-03: Quản lý Sân con (Courts Management)**
  * Thêm/Sửa/Xóa các sân con trong cụm (Sân 1, Sân 2, Sân VIP...).
  * Thùy chỉnh loại mặt sân (Cỏ nhân tạo, Thảm PVC, Gỗ, Bê tông), kích thước (Sân 5 người, Sân 7 người, Sân đôi, Sân đơn).
  * Bật/Tắt trạng thái hoạt động của từng sân con (`ACTIVE` / `INACTIVE`).

#### 2.3.3 Quản lý Lịch vận hành & Quy tắc Khóa sân (Operating Schedules & Slot Blocking)
* **FR-OWN-04: Cấu hình Khung giờ & Bảng giá (Operating Schedule & Pricing Rules)**
  * Thiết lập giờ mở cửa - đóng cửa mặc định cho từng ngày trong tuần.
  * Thiết lập bảng giá linh hoạt theo từng khoảng giờ trong ngày (Peak vs Off-Peak).
* **FR-OWN-05: Khóa khung giờ bảo trì / Giải đấu (Slot Blocking & Block Rules)**
  * Chủ sân có thể chủ động khóa các khung giờ đột xuất (Bảo trì sân, tổ chức giải đấu nội bộ, khách vãng lai đặt ngoài).
  * Khóa theo ô lịch đơn lẻ (`SlotBlocking`) hoặc khóa lặp lại theo quy tắc (`CourtBlockRule`).

#### 2.3.4 Quản lý Đơn đặt & Check-in tại sân (Booking Management & Check-in)
* **FR-OWN-06: Tiếp nhận & Xác nhận Đơn đặt**
  * Hiển thị danh sách đơn đặt sân theo ngày/tuần/tháng dưới dạng danh sách hoặc lịch trực quan (Calendar View).
  * Xác nhận đơn đặt, hủy đơn (nếu có sự cố bất khả kháng).
* **FR-OWN-07: Check-in khách chơi tại sân**
  * Thực hiện chuyển trạng thái đơn hàng sang `CHECKED_IN` khi khách hàng đến sân nhận chỗ.

#### 2.3.5 Báo cáo Doanh thu & Analytics (Financial Reports & Dashboard)
* **FR-OWN-08: Dashboard Thống kê Kpi & Doanh thu**
  * Biểu đồ doanh thu theo thời gian (Ngày, Tuần, Tháng, Năm).
  * Thống kê tổng số lượt đặt, tỷ lệ lấp đầy sân (Occupancy Rate), khung giờ được đặt nhiều nhất.
  * Thống kê tỷ lệ đơn hoàn tiền/hủy đơn.

#### 2.3.6 Quản lý Bài đăng & Cấu hình Thanh toán (Venue Posts & Payment Settings)
* **FR-OWN-09: Bài đăng Thông báo / Khuyến mãi (Venue Posts)**
  * Tạo các bài đăng thông báo giải đấu, chương trình giảm giá áp dụng tại cụm sân.
* **FR-OWN-10: Cấu hình Tài khoản Nhận tiền (Payment Account Settings)**
  * Cấu hình thông tin Ngân hàng, số tài khoản, tên chủ tài khoản, upload Mã QR chuyển khoản để nhận tiền thanh toán trực tiếp từ khách.

---

### 2.4 Phân hệ Quản trị viên - Quản trị Hệ thống (Admin Portal)

#### 2.4.1 Kiểm duyệt Hồ sơ Đăng ký Chủ sân (Owner Approval Workflow)
* **FR-ADM-01: Duyệt / Từ chối Hồ sơ Chủ sân**
  * Xem danh sách các hồ sơ đăng ký chủ sân đang chờ duyệt (`PENDING_APPROVAL`).
  * Đánh giá chi tiết tài liệu, hình ảnh giấy phép kinh doanh.
  * Thao tác Phê duyệt (**Approve**): Hệ thống tự động nâng cấp tài khoản thành `OWNER`, khởi tạo cụm sân mặc định (`syncApprovedRegistrationsToVenues`) và gửi Email thông báo thành công.
  * Thao tác Từ chối (**Reject**): Ghi rõ lý do từ chối và tự động gửi Email thông báo tới người đăng ký.

#### 2.4.2 Quản lý Người dùng & Phân quyền (User & RBAC Management)
* **FR-ADM-02: Quản lý danh sách Người dùng toàn sàn**
  * Tra cứu, xem chi tiết tất cả tài khoản Customer, Owner, Admin.
  * Thực hiện Khóa tài khoản (Block/Suspend) nếu phát hiện vi phạm hoặc Mở khóa tài khoản (Unblock).

#### 2.4.3 Quản lý Master Data & Marketing (Facilities & Banners)
* **FR-ADM-03: Quản lý Danh mục Tiện ích (Facility Master Data)**
  * Thêm, sửa, xóa các tiện ích hệ thống (Đèn chiếu sáng, Wifi, Thuê trang phục, Căn tin...).
* **FR-ADM-04: Quản lý Banner Quảng cáo (Banner Management)**
  * Đăng tải và quản lý danh sách Banner hiển thị trên trang chủ Customer Portal (Vị trí, Liên kết điều hướng, Trạng thái ẩn/hiện).

#### 2.4.4 Giám sát Hệ thống & Báo cáo Tổng quan (System Monitoring & Analytics)
* **FR-ADM-05: Dashboard Giám sát Toàn diện (System-wide Analytics)**
  * Báo cáo tổng số lượng cụm sân, tổng người dùng, tổng lượt đặt sân trên toàn hệ thống.
  * Báo cáo tổng doanh thu sàn và kiểm toán lịch sử giao dịch thanh toán/hoàn tiền.

---

### 2.5 Phân hệ Thông báo & Tích hợp (Notifications & Integrations)

* **FR-NOTIF-01: Hệ thống Thông báo Nội ứng dụng (In-App Notification Center)**
  * Gửi thông báo thời gian thực khi đơn đặt sân thay đổi trạng thái (Xác nhận, Hủy, Nhắc lịch sắp chơi).
  * Thông báo cho Owner khi có khách đặt mới.
  * Thông báo cho người đăng ký khi hồ sơ chủ sân được phê duyệt/từ chối.
* **FR-NOTIF-02: Tích hợp Gửi Email tự động (Email Service)**
  * Gửi email xác nhận đặt sân, email chứa mã OTP khôi phục mật khẩu, email thông báo kết quả duyệt tài khoản đối tác.

---

## 3. PHÂN TÍCH YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

Yêu cầu phi chức năng được xây dựng dựa trên tiêu chuẩn quốc tế **ISO/IEC 25010** về chất lượng phần mềm, đảm bảo hệ thống đạt mức độ tin cậy, bảo mật và hiệu năng cao nhất.

---

### 3.1 Hiệu năng & Ràng buộc Thời gian thực (Performance Efficiency)

* **NFR-PERF-01: Thời gian Phản hồi API (API Response Time)**
  * 95% số lượng request đọc dữ liệu (GET `/venues`, GET `/availability`) phải phản hồi trong thời gian **< 200ms**.
  * Request ghi dữ liệu (POST `/bookings`, POST `/payments`) phải hoàn tất trong **< 500ms** (chưa tính thời gian chờ kết nối gateway bên thứ ba).
* **NFR-PERF-02: Tải trang Frontend (Page Load Time)**
  * Trang Customer / Owner / Admin Frontend đạt chỉ số First Contentful Paint (FCP) **< 1.2s** và Time to Interactive (TTI) **< 2.0s** nhờ công cụ đóng gói Vite.
* **NFR-PERF-03: Tối ưu hóa Truy vấn Cơ sở Dữ liệu (Database Indexing & Query Optimization)**
  * Tất cả các bảng quan trọng (`bookings`, `courts`, `venues`, `slot_blockings`) phải được đánh chỉ mục (Index) đầy đủ trên các trường tần suất tra cứu cao (`court_id`, `booking_date`, `user_id`, `status`).

---

### 3.2 Khả năng Xử lý Đồng thời & Cấu trúc Khóa Dữ liệu (Concurrency & Data Integrity)

* **NFR-CONC-01: Kiểm soát Tranh chấp Đồng thời (Pessimistic Concurrency Control)**
  * Hệ thống phải chịu được tải đặt sân dồn dập tại các khung giờ vàng (Peak Traffic).
  * Bắt buộc sử dụng cơ chế **MySQL InnoDB Pessimistic Locking** (`SELECT ... FOR UPDATE`) trong một Sequelize Transaction duy nhất khi thực thi đặt sân.
  * Đảm bảo tính toàn vẹn tuyệt đối (ACID Compliant): **Không bao giờ cho phép 2 đơn hàng trùng lặp tồn tại trên cùng 1 sân con tại cùng 1 khoảng thời gian**.
* **NFR-CONC-02: Quản lý Kết nối Database (Connection Pooling)**
  * Cấu hình Pool kết nối MySQL (`max: 20-50 connections`, `idle: 10000ms`, `acquire: 30000ms`) để tránh quá tải RAM hệ thống khi có hàng ngàn truy vấn đồng thời.

---

### 3.3 Tính An toàn & Bảo mật (Security & Safety Standards)

* **NFR-SEC-01: Xác thực & Mã hóa Dữ liệu (Authentication & Cryptography)**
  * 100% mật khẩu người dùng phải được mã hóa một chiều bằng thuật toán **bcrypt** (Work factor >= 10) trước khi lưu vào DB.
  * Truyền tải dữ liệu bắt buộc qua giao thức an toàn **HTTPS / TLS 1.3**.
  * Token xác thực JWT có thời hạn sống ngắn (Access Token: 15-60 phút), sử dụng Refresh Token để gia hạn an toàn.
* **NFR-SEC-02: Phòng chống các Lỗ hổng Mã độc (Vulnerability Protection)**
  * **SQL Injection**: Tận dụng triệt để Parametrized Queries & Object Relational Mapping (ORM Sequelize).
  * **Cross-Site Scripting (XSS)**: Validate và sanitize toàn bộ input đầu vào (`express-validator`).
  * **Cross-Origin Resource Sharing (CORS)**: Cấu hình CORS chặt chẽ ở Backend, chỉ cho phép các domain được ủy quyền (Khung domain Frontend local, LAN IP và Ngrok Tunnel an toàn).
* **NFR-SEC-03: An toàn Webhook Cổng Thanh toán (Webhook Signature Verification)**
  * Tất cả IPN Callback từ MoMo / VNPAY đều phải kiểm tra và xác minh chữ ký số **HMAC SHA256** trước khi cập nhật trạng thái đơn hàng trong DB, chống giả mạo request giao dịch (Replay Attack / Fake IPN).
* **NFR-SEC-04: Định danh Request (Correlation Tracking & Auditing)**
  * Tự động sinh mã định danh duy nhất `X-Request-ID` (`crypto.randomUUID()`) cho mọi HTTP Request để phục vụ truy vết lỗi và kiểm toán bảo mật.

---

### 3.4 Khả năng Mở rộng & Kiến trúc (Scalability & Architecture)

* **NFR-SCA-01: Kiến trúc Độc lập & Sẵn sàng Mở rộng (Modular Architecture)**
  * Tách biệt hoàn toàn giữa Backend REST API và Frontend (Decoupled Frontend-Backend Architecture).
  * Mã nguồn Backend tổ chức theo mô hình **Layered Architecture** (Routes $\rightarrow$ Middlewares $\rightarrow$ Controllers $\rightarrow$ Services $\rightarrow$ Models) giúp dễ dàng tách thành các Microservices (Booking Service, Payment Service, Venue Service) khi quy mô tăng trưởng.
* **NFR-SCA-02: Thích ứng Môi trường Đa thiết bị & Mạng (LAN & Remote Tunneling)**
  * Hệ thống hỗ trợ cấu hình động IP mạng nội bộ (`LOCAL_NETWORK_IP`) và tự động nhận diện domain Ngrok (`ngrok-free.app`), cho phép chạy demo và test thực địa trên các thiết bị di động thực tế trong cùng mạng Wi-Fi hoặc qua Internet.

---

### 3.5 Khả năng Phục hồi & Độ Tin cậy (Reliability & Availability)

* **NFR-REL-01: Độ Sẵn sàng của Hệ thống (System Availability / Uptime)**
  * Cam kết chỉ số Uptime đạt **99.9%** trong điều kiện vận hành sản xuất.
* **NFR-REL-02: Phục hồi Giao dịch Lỗi (Transaction Rollback & Error Handling)**
  * Mọi thao tác thất bại trong quy trình đặt sân hoặc thanh toán đều phải thực hiện **Rollback** tự động, không để lại dữ liệu rác (Orphan Records).
  * Hệ thống có Middleware xử lý lỗi tập trung (Global Error Handler) đảm bảo không bị crash tiến trình Node.js khi gặp unhandled exceptions.

---

### 3.6 Trải nghiệm Người dùng & Tương thích (Usability & Compatibility)

* **NFR-USA-01: Thiết kế Giao diện Hiện đại & Đáp ứng (Responsive UI/UX)**
  * Giao diện thiết kế theo chuẩn Dark Mode / Modern Aesthetic, màu sắc hài hòa, trải nghiệm mượt mà với hiệu ứng vi mô (Micro-animations).
  * Hiển thị tối ưu 100% trên các thiết bị: Desktop, Laptop, Tablet và Smartphone.
* **NFR-USA-02: Phản hồi Trạng thái Thao tác (User Feedback & Loading States)**
  * Mọi thao tác ghi dữ liệu, đặt sân, thanh toán đều có phản hồi thị giác tức thì (Toast notifications, Loading Skeleton/Spinners, Dialog xác nhận).

---

### 3.7 Khả năng Bảo trì & Kiểm thử (Maintainability & Testability)

* **NFR-MAI-01: Bộ Kịch bản Kiểm thử Tự động (Automated Test Suites)**
  * Hệ thống có sẵn bộ kịch bản test tích hợp tự động kiểm thử khả năng xử lý đồng thời (`test_multi_user_concurrent.js`, `test_concurrency.js`, `test_callback_concurrency.js`, `test_momo.js`).
  * Cho phép chạy kiểm thử tự động việc 2 người cùng bấm đặt sân 1 thời điểm để đảm bảo hệ thống luôn hoạt động đúng thiết kế.

---

## 4. MA TRẬN TRUY XUẤT YÊU CẦU (REQUIREMENTS TRACEABILITY MATRIX - RTM)

Bảng RTM dưới đây ánh xạ giữa Yêu cầu Chức năng (FR), Mô tả và Thành phần Mã nguồn (Source Code Mapping) hiện tại trong dự án:

| Mã Yêu cầu (Req ID) | Tên Chức năng | Thành phần Backend (Routes / Services / Models) | Thành phần Frontend (UI Apps) |
| :--- | :--- | :--- | :--- |
| **FR-AUTH-01/02** | Đăng ký, Đăng nhập, RBAC | `auth.routes.js`, `auth.service.js`, `User.js` | Tất cả 3 App (Auth Pages & Context) |
| **FR-AUTH-03** | Cách ly Session theo Tab | `sessionStorage` token management | Client-side Session Sandboxing |
| **FR-CUST-01/02** | Tìm kiếm & Chi tiết cụm sân | `venue-search.routes.js`, `venue-search.service.js` | Customer App (`VenueSearch`, `VenueDetail`) |
| **FR-CUST-03/04** | Kiểm tra khung giờ & Đơn giá | `availability.routes.js`, `pricing.service.js` | Customer App (`AvailabilityGrid`) |
| **FR-CUST-05/06** | Đặt lịch & Chống đặt trùng | `booking.routes.js`, `booking.service.js` | Customer App (`BookingCheckout`) |
| **FR-CUST-08/09** | Thanh toán & Hoàn tiền | `payment.routes.js`, `payment.service.js`, `Payment.js` | Customer App (`PaymentModal`, `OrderHistory`) |
| **FR-CUST-10** | Đánh giá & Phản hồi | `review.routes.js`, `review.service.js`, `Review.js` | Customer App (`ReviewSection`) |
| **FR-CUST-12** | Cộng đồng & Thách đấu | `community.routes.js`, `community.service.js` | Customer App (`CommunityFeed`) |
| **FR-OWN-01** | Đăng ký làm Chủ sân | `owner-registration.routes.js`, `owner-registration.service.js` | Customer/Owner App (`OwnerRegistration`) |
| **FR-OWN-02/03** | Quản lý Sân con & Chi nhánh | `owner.routes.js`, `court.service.js`, `Court.js` | Owner App (`OwnerCourts`, `CourtFormModal`) |
| **FR-OWN-04/05** | Cấu hình giá & Khóa lịch | `slot-blocking.routes.js`, `schedule.service.js` | Owner App (`OwnerSchedules`, `SlotBlocking`) |
| **FR-OWN-07** | Check-in & Quản lý đơn | `owner.routes.js`, `booking.service.js` | Owner App (`OwnerBookings`) |
| **FR-OWN-08** | Thống kê Doanh thu | `owner.routes.js`, `owner.service.js` | Owner App (`OwnerDashboard`, `OwnerPayments`) |
| **FR-ADM-01** | Duyệt hồ sơ Chủ sân | `admin.routes.js`, `admin.service.js` | Admin App (`PendingOwners`) |
| **FR-ADM-02** | Quản lý Người dùng | `admin.routes.js`, `admin.service.js` | Admin App (`UserManagement`) |
| **FR-ADM-03/04** | Quản lý Banner & Master Data| `admin.routes.js`, `banner.service.js`, `facility.service.js` | Admin App (`BannerManager`, `FacilityManager`) |

---

## 5. KẾT LUẬN & ĐỀ XUẤT VẬN HÀNH (CONCLUSION & RECOMMENDATIONS)

### 5.1 Đánh giá tổng quan từ Project Manager
Dự án **SportHubAI** đã được thiết kế và hoàn thiện cấu trúc phần mềm rất bài bản, đáp ứng đầy đủ các tiêu chuẩn khắt khe của một hệ thống thương mại điện tử chuyên ngành thể thao:
1. **Kiến trúc vững chắc**: Việc chia tách 3 Cổng Frontend độc lập trên cùng 1 Backend API & MySQL giúp phân định rõ ràng trải nghiệm người dùng và vai trò quản lý.
2. **Giải pháp kỹ thuật ưu việt**: Sử dụng **Pessimistic Locking** ở tầng MySQL Transaction xử lý tận gốc bài toán Double Booking mà nhiều hệ thống đặt lịch truyền thống gặp phải.
3. **Đầy đủ phân hệ nghiệp vụ**: Bao phủ toàn bộ vòng đời từ Đăng ký chủ sân $\rightarrow$ Phê duyệt $\rightarrow$ Thiết lập cấu hình sân $\rightarrow$ Khách tìm kiếm $\rightarrow$ Đặt sân & Thanh toán online $\rightarrow$ Check-in $\rightarrow$ Báo cáo doanh thu & Đánh giá.

### 5.2 Khuyến nghị nâng cấp cho các giai đoạn tiếp theo (Roadmap Proposals)
1. **Tích hợp Socket.io / WebSocket**: Chuyển đổi các thông báo in-app và cập nhật trạng thái ô lịch trống từ dạng Polling/HTTP sang thời gian thực (Push Notification via WebSockets).
2. **Cơ chế Cache Redis**: Bổ sung bộ nhớ đệm Redis cho các API tìm kiếm cụm sân và bảng giá tĩnh để giảm tải trực tiếp cho MySQL Database khi lượng truy cập tăng vọt lên hàng triệu request/ngày.
3. **Ứng dụng Di động Native / Progressive Web App (PWA)**: Đóng gói Customer Frontend thành app di động (React Native hoặc PWA) để tối ưu hóa trải nghiệm quét mã QR Check-in tại sân và nhận Push Notifications trên điện thoại.

---
*Báo cáo được lập và phê duyệt bởi Software Project Manager - Dự án SportHubAI.*
