# TÀI LIỆU PHÂN TÍCH ACTORS, ROLES, PERMISSIONS & OWNERSHIP RULES
**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.01 (Refined)  
**Trạng thái:** Standardized / MVP Specification  
**Ngày cập nhật:** 2026-08-08  

---

## 1. System Actors (Chuẩn Hóa Các Actor Trong Hệ Thống)

Hệ thống phân định rõ ràng giữa **Human Actors** (Người dùng hệ thống) và **System Actor** (Tác vụ tự động):

### 1.1. Human Actors
| Actor | Phân loại | Mô tả |
|---|---|---|
| **GUEST** | Unauthenticated User | Người dùng chưa đăng nhập. Chỉ có thể xem thông tin công khai (danh sách sân, tìm kiếm, lọc, xem chi tiết sân, bản đồ, giá tham khảo). |
| **CUSTOMER** | Authenticated User | Người dùng đã đăng ký và sử dụng hệ thống để tìm kiếm, đặt sân, thanh toán và quản lý booking của chính mình. |
| **OWNER** | Authenticated Partner | Chủ sân / đơn vị kinh doanh sân thể thao, được Admin phê duyệt để quản lý Venue, Chi nhánh (Branch), Sân con (Court), khung giờ, bảng giá và các đơn đặt sân thuộc quyền sở hữu của mình. |
| **ADMIN** | System Administrator | Quản trị viên hệ thống có quyền quản lý toàn hệ thống (Duyệt Owner, duyệt Venue, xử lý vi phạm, xem báo cáo tổng thể). |

### 1.2. System Actor
| Actor | Phân loại | Mô tả |
|---|---|---|
| **SYSTEM** | Automated Background Task | Tác vụ tự động của hệ thống (Background Worker / Cron Job). Không phải là một Human Role. Thực hiện các công việc: Tự động hết hạn hold slot (`EXPIRED`), tự động nhả slot khi thanh toán thất bại (`PAYMENT_FAILED`), gửi thông báo nhắc lịch (`Send Notifications`), và chạy các scheduled jobs định kỳ. |

---

## 2. Customer Responsibilities (Trách Nhiệm & Chức Năng Của Customer)

Customer đại diện cho nhóm người dùng cuối có nhu cầu tìm kiếm và đặt lịch sân thể thao.

### Chức năng Customer ĐƯỢC PHÉP thực hiện:
- **Tài khoản & Xác thực:**
  - Đăng ký tài khoản (Register), Đăng nhập / Đăng xuất (Login / Logout).
  - Xác thực Email bằng mã OTP.
  - Quên mật khẩu (Forgot Password), Đặt lại mật khẩu (Reset Password).
  - Đổi mật khẩu cá nhân (Change Password), Cập nhật thông tin cá nhân (Profile Management).
- **Khám phá & Tìm kiếm:**
  - Xem danh sách Venue công khai, Tìm kiếm theo tên, địa điểm, môn thể thao.
  - Bộ lọc nâng cao (Giá, khoảng cách, tiện ích, đánh giá sao, khung giờ trống).
  - Xem chi tiết Venue (Hình ảnh, vị trí bản đồ, tiện ích, quy định).
  - Xem lịch trống của từng sân con (Court availability) theo ngày/khung giờ.
- **Đặt sân & Thanh toán (MVP Scope):**
  - Chọn sân con (Court), ngày chơi, khung giờ (Time slot).
  - Chọn thêm dịch vụ đi kèm (Thuê dụng cụ, nước uống,...).
  - Áp dụng mã giảm giá / khuyến mãi (Apply Coupon/Promotion).
  - Tạo đơn đặt sân ở trạng thái giữ chỗ tạm thời (`HOLDING`).
  - Thanh toán trực tuyến ưu tiên qua **MoMo** (Tùy chọn: **Cash / Pay at venue** tại sân nếu quy định cơ sở cho phép).
- **Quản lý Đơn hàng & Tương tác:**
  - Xem danh sách và chi tiết đơn đặt sân của chính mình (View own bookings).
  - Hủy đơn đặt sân của chính mình (`Cancel Booking`) theo chính sách hủy sân của Venue.
  - Đăng ký dời lịch/đổi giờ chơi (`Request Reschedule`) theo quy định và tình trạng slot trống.
  - Lưu sân yêu thích (Add to Favorites).
  - Đánh giá & Bình luận (`Review`) cho các đơn đặt sân đã hoàn thành (`COMPLETED`).
  - Xem và quản lý thông báo cá nhân.

### Chức năng Customer KHÔNG ĐƯỢC PHÉP thực hiện:
- **KHÔNG ĐƯỢC arbitrary UPDATE Booking:** Customer **KHÔNG** có quyền gọi API sửa trực tiếp thông tin đơn hàng (`UPDATE /bookings/:id`) như thay đổi tùy ý Court, Date, Time Slot, Price hay Status. Việc Hủy hoặc Đổi lịch bắt buộc phải thông qua các Business Actions riêng biệt (`Cancel Booking`, `Request Reschedule`) với các bước kiểm tra policy nghiêm ngặt.
- Không được xem hồ sơ hoặc đơn đặt sân của Customer khác.
- Không được đặt sân ở trạng thái ẩn (`INACTIVE`), chưa duyệt (`PENDING`) hoặc bảo trì (`MAINTENANCE`).
- Không được truy cập giao diện hoặc API của Owner / Admin.

---

## 3. Owner Responsibilities (Trách Nhiệm & Chức Năng Của Owner)

Owner đại diện cho các đối tác kinh doanh sở hữu cơ sở thể thao.

### Chức năng Owner ĐƯỢC PHÉP thực hiện:
- **Quản lý Venue & Cơ sở vật chất:**
  - Tạo Venue mới (Trạng thái ban đầu `PENDING`, chờ Admin duyệt).
  - Cập nhật thông tin Venue thuộc sở hữu của mình.
  - Quản lý các Chi nhánh / Cụm sân (Branches) và Sân con (Courts).
  - Upload ảnh sân, cấu hình danh sách tiện ích (Facilities).
- **Cấu hình Vận hành & Giá:**
  - Cấu hình khung giờ hoạt động (Operating Hours).
  - Cấu hình bảng giá chi tiết (Giá giờ thường, Peak-hour, cuối tuần/ngày lễ).
  - Khóa / Mở khóa khung giờ sân thủ công (`Block/Unblock courts` để bảo trì hoặc giữ sân offline).
  - Chuyển trạng thái sân sang bảo trì (`MAINTENANCE`).
- **Quản lý Booking thuộc quyền sở hữu:**
  - Xem danh sách và chi tiết booking thuộc Venue/Branch/Court của chính mình.
  - Xem thông tin liên hệ cần thiết của Customer phục vụ đón tiếp tại sân.
  - Tạo đơn đặt sân thủ công trực tiếp tại sân (`Create manual/offline booking`).
  - Xử lý các tác vụ vận hành: Check-in cho khách, Hủy booking theo chính sách/quy định đền bù khẩn cấp.
  - Quản lý dịch vụ đi kèm và chương trình khuyến mãi riêng của sân.
  - Xem báo cáo doanh thu và tỷ lệ lấp đầy sân thuộc sở hữu của mình.

### Chức năng Owner KHÔNG ĐƯỢC PHÉP thực hiện:
- **KHÔNG ĐƯỢC thủ công Confirm/Reject đơn hàng online đã thanh toán:** Trong luồng MVP, khi Customer thanh toán thành công qua MoMo, hệ thống **tự động chuyển trạng thái thành `CONFIRMED`**. Owner không cần và không được yêu cầu bấm Duyệt (Confirm) thủ công đối với các đơn online này. *(Lưu ý: Luồng Confirm/Reject thủ công được phân loại là Optional / Future Extension).*
- **KHÔNG** được chỉnh sửa, xem hoặc thao tác trên Venue, Branch, Court, Booking hoặc Báo cáo doanh thu của Owner khác.
- **KHÔNG** được truy cập các chức năng quản trị hệ thống của Admin.

---

## 4. Admin Responsibilities (Trách Nhiệm & Chức Năng Của Admin)

Admin là quản trị viên hệ thống có toàn quyền giám sát vận hành nền tảng.

### Chức năng Admin ĐƯỢC PHÉP thực hiện:
- **Quản lý Người dùng & Owner:**
  - Phê duyệt / Từ chối đơn đăng ký làm Owner (`Approve/Reject Owner Applications`).
  - Tạm khóa (`Suspend`) hoặc Kích hoạt lại (`Activate`) tài khoản Customer / Owner.
- **Kiểm duyệt Venue:**
  - Phê duyệt hoặc Từ chối Venue mới do Owner gửi (`Approve/Reject Venues`). Chỉ Venue `APPROVED` mới hiển thị trên Customer Website.
  - Tạm dừng hoạt động của Venue nếu phát hiện vi phạm.
- **Giám sát Đơn hàng & Thanh toán toàn sàn:**
  - Xem danh sách và chi tiết TẤT CẢ các đơn đặt sân trên toàn hệ thống.
  - Xem lịch sử tất cả các giao dịch thanh toán (MoMo logs).
  - Hỗ trợ xử lý tranh chấp, khiếu nại hoặc hủy booking trong các trường hợp đặc biệt.
- **Quản trị Nội dung & Hệ thống:**
  - Quản lý, ẩn/xóa các đánh giá (Reviews) bị báo cáo vi phạm.
  - Xem báo cáo thống kê tổng thể toàn hệ thống.
  - Xem nhật ký hệ thống (`Audit Logs`).
  - Quản lý các cấu hình hệ thống (Thời gian hold slot mặc định, phí hoa hồng, cấu hình cổng thanh toán).

---

## 5. Payment MVP Scope (Phạm Vi Thanh Toán MVP)

Để đảm bảo tính đơn giản và hiệu quả cho giai đoạn MVP, phạm vi thanh toán được chốt như sau:

- **Cổng thanh toán ưu tiên (Core MVP):** **MoMo** (Tích hợp MoMo Payment Gateway API).
- **Thanh toán tại sân (Optional Business Rule):** **Cash / Pay at venue** (Áp dụng nếu Venue cho phép đặt trước trả sau hoặc đối với đơn offline do Owner tạo).
- **Phạm vi mở rộng (Future Extension - KHÔNG thuộc MVP):** VNPAY, ZaloPay, Viettel Money, Thẻ quốc tế (Visa/Mastercard). Các cổng này sẽ được xem xét ở các phiên bản tiếp theo.

---

## 6. MVP Booking Flow & Booking State Machine

### 6.1. Core MVP Booking Flow (Luồng Đặt Lịch Chuẩn)

```text
Customer
   │
   ▼
Select Venue ──► Select Court ──► Select Date ──► Select Time Slot
   │
   ▼
Check Availability
   │
   ▼
Create Temporary Hold (Status: HOLDING)
   │
   ├──────────────────────────────────────────────────┐
   ▼ (Customer Proceeds to Payment)                   ▼ (Customer Abandons / Timeout > 10m)
Payment (MoMo)                                     SYSTEM / Cron Job Expiration
   │                                                  │
   ├──────────────────────────────┐                   ▼
   ▼ (Payment Success)            ▼ (Payment Failed)  Status: EXPIRED ──► Release Slot
Status: CONFIRMED             Status: PAYMENT_FAILED 
                              └─► Release Slot
```

- **Thời gian Hold mặc định:** **10 phút** (`10 minutes`). Đây là cấu hình kinh doanh (Business Configuration) và có thể thay đổi linh hoạt qua System Settings.

---

### 6.2. Booking State Machine (Máy Trạng Thái Đơn Đặt Sân)

Hệ thống sử dụng tập 7 trạng thái chuẩn hóa sau:

```text
               ┌──────────────┐
               │   HOLDING    │ (Tạo hold tạm thời - 10 phút)
               └──────┬───────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐┌───────────┐┌──────────────┐
│PAYMENT_FAILED││  EXPIRED  ││PAYMENT_PENDING│ (Chờ MoMo IPN callback)
└──────────────┘└───────────┘└──────┬───────┘
                                    │ (Payment Success)
                                    ▼
                             ┌──────────────┐
                             │  CONFIRMED   │ (Tự động xác nhận)
                             └──────┬───────┘
                                    │
                       ┌────────────┴────────────┐
                       ▼                         ▼
                ┌──────────────┐          ┌──────────────┐
                │  CANCELLED   │          │  COMPLETED   │ (Sau giờ chơi)
                └──────────────┘          └──────────────┘
```

| Trạng thái | Mô tả chi tiết |
|---|---|
| **HOLDING** | Slot đang được giữ tạm thời cho Customer trong thời gian quy định (Mặc định 10 phút). Chưa gọi thanh toán. |
| **PAYMENT_PENDING** | Đang chờ kết quả phản hồi (Callback/IPN) từ cổng thanh toán MoMo. |
| **CONFIRMED** | Thanh toán thành công (hoặc duyệt trả sau tại sân). Booking đã được xác nhận **tự động**, slot được khóa chính thức. |
| **COMPLETED** | Khung giờ đặt sân đã kết thúc thành công. Customer có quyền gửi Đánh giá (Review). |
| **CANCELLED** | Booking bị hủy bởi Customer (theo chính sách hủy) hoặc bị hủy bởi Admin/Owner (trường hợp bất khả kháng). |
| **EXPIRED** | Quá thời hạn hold (10 phút) mà Customer không thực hiện thanh toán. SYSTEM tự động chuyển trạng thái và nhả slot. |
| **PAYMENT_FAILED** | Thanh toán MoMo thất bại hoặc Customer chủ động bấm Hủy thanh toán. Slot ngay lập tức được nhả về trạng thái trống. |

---

## 7. Customer Booking Business Actions (Hạn Chế Update Tùy Ý)

Customer **KHÔNG** có quyền gọi API `UPDATE` thông thường để sửa chi tiết booking. Mọi thay đổi phải đi qua 2 Business Actions:

### 7.1. Cancel Booking (Hủy Đơn)
```text
Customer ──► Request Cancel Booking ──► Backend Check Cancellation Policy
                                                 │
                                ┌────────────────┴────────────────┐
                                ▼ (Satisfied Policy)              ▼ (Violated Policy)
                       Status: CANCELLED                 Reject Request
                       Trigger Refund (MoMo)             (No Refund / Error 400)
```

### 7.2. Request Reschedule (Đổi Lịch)
```text
Customer ──► Request Reschedule ──► Check Reschedule Policy & New Slot Availability
                                                 │
                                ┌────────────────┴────────────────┐
                                ▼ (Available & Valid Policy)      ▼ (Unavailable / Incompatible)
                       Update Court/Slot                 Reject Request
                       Calculate Price Difference        (Notify Customer)
                       Confirm New Schedule
```

---

## 8. Dual Ownership Model for Bookings (Mô Hình Sở Hữu Hai Chiều)

Mỗi Booking trên hệ thống chịu sự chi phối sở hữu theo 2 chiều độc lập:

```text
   CUSTOMER SIDE                                OWNER / VENUE SIDE
┌─────────────────┐                            ┌─────────────────┐
│    CUSTOMER     │                            │      OWNER      │
└────────┬────────┘                            └────────┬────────┘
         │ (Owns booking history)                       │ (Owns business facility)
         ▼                                              ▼
┌─────────────────┐                            ┌─────────────────┐
│     BOOKING     │ ◄───────────────────────── │      VENUE      │
└─────────────────┘                            └────────┬────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  BRANCH / COURT │
                                               └─────────────────┘
```

1. **Customer Ownership (Chiều Khách hàng):**
   - Customer sở hữu lịch sử đặt sân của mình.
   - Thao tác cho phép: View own bookings, Cancel own booking, Request reschedule own booking, Review completed booking.
2. **Owner / Venue Ownership (Chiều Chủ sân):**
   - Owner sở hữu cơ sở hạ tầng (Venue -> Branch -> Court) nơi diễn ra booking.
   - Thao tác cho phép: View bookings of own venue, Check-in khách, Cancel booking theo chính sách vận hành của cơ sở.
   - **Tuyệt đối không:** Owner A xem hoặc sửa booking diễn ra tại Venue của Owner B.
3. **Admin Administrative Scope:** Admin có quyền truy cập tất cả booking trên hệ thống cho mục đích quản trị và giải quyết tranh chấp.

> **Quy tắc An ninh Kỹ thuật (Mandatory Constraint):**  
> Phân quyền Booking **KHÔNG ĐƯỢC** chỉ dựa duy nhất vào `booking_id`. Backend phải kiểm tra quan hệ giữa Authenticated User (`user_id`) với Booking hoặc Venue/Court chứa booking đó.

---

## 9. Authorization Principles (RBAC + ABAC / Ownership Principles)

Mọi API request đến Backend đều phải trải qua 3 cấp độ kiểm tra:

```text
[ Client Request ]
       │
       ▼
[ 1. AUTHENTICATION ] ──► Kiểm tra JWT Token valid? (Identity: User ID = 123)
       │
       ▼
[ 2. RBAC GUARD ]    ──► Role có được phép gọi endpoint này? (Role: OWNER)
       │
       ▼
[ 3. ABAC / OWNERSHIP CHECK ] ──► Resource có thuộc về User không?
                                  (e.g., Query: Court.branch.venue.owner_id == User.id)
       │
       ▼
[ EXECUTE BUSINESS LOGIC ]
```

- **Nguyên tắc vàng:** **Không bao giờ tin tưởng Client ID**. Mọi ID gửi từ Frontend (`venue_id`, `court_id`, `booking_id`) đều bị coi là không an toàn cho đến khi Backend xác minh thành công quan hệ sở hữu trong Database.

---

## 10. Detailed Permission Matrix (Ma Trận Phân Quyền Đã Cập Nhật)

> **Ký hiệu:** `C` (Create), `R` (Read), `U` (Update), `D` (Delete), `AP` (Approve), `RJ` (Reject), `own` (Thuộc sở hữu cá nhân/tài nguyên của mình), `pub` (Dữ liệu công khai), `BA` (Business Action riêng biệt).

| Resource (Tài nguyên) | Sub-Resource / Action | GUEST | CUSTOMER | OWNER | ADMIN |
|---|---|---|---|---|---|
| **User Profile** | Own Profile | - | R, U (profile) | R, U (profile) | R, U, D |
| | Other Profiles | - | - | R (contact only) | R, U, Suspend/Activate |
| **Owner Application**| Application Form | - | C (Apply), R(own) | R(own) | R, AP, RJ |
| **Venue** | Public Approved Venues | R (pub) | R (pub) | R (pub) | R |
| | Unapproved/Pending Venue | - | - | C, R(own), U(own), D(own) | R, AP, RJ, Suspend |
| **Branch / Court** | Court Details & Gallery | R (pub) | R (pub) | C(own), R(own), U(own), D(own) | R, U, D |
| | Block / Maintenance | - | R (availability) | U(own - Block/Unblock) | R, U |
| **Schedule / Slot** | Slot Availability | R | R | R(own), U(own config) | R |
| | Pricing Rules | - | - | C(own), R(own), U(own) | R |
| **Booking** | Create Hold / Book Slot | - | C (Hold slot) | C (Manual offline) | - |
| | View Booking | - | R (own bookings) | R (own venue bookings) | R (All system bookings) |
| | Update Booking Arbitrarily| - | **NO (Forbidden)**| **NO (Forbidden)** | Force U (Admin override) |
| | Cancel Booking Action | - | BA (own policy check)| BA (own venue policy) | BA (Admin override) |
| | Reschedule Action | - | BA (own policy check)| - | BA (Admin override) |
| **Payment** | MoMo / Pay at venue | - | C (Execute pay) | R (own venue payments) | R (All system payment logs) |
| **Review** | Venue Reviews | R (pub) | C (if COMPLETED), R | R(own venue), Reply(own) | R, D (Moderation), Reports |
| **Favorite** | Favorites List | - | C, R(own), D(own) | - | - |
| **Report** | Revenue & Stats | - | - | R (own revenue/stats) | R (System-wide reports) |
| **Audit Logs** | System Audit Logs | - | - | - | R (Full Audit Trail) |

---

## 11. Remaining Ambiguities (Các Vấn Đề Cần Thống Nhất Bổ Sung)

1. **Chính sách Hủy & Hoàn tiền MoMo:** Tỷ lệ hoàn tiền khi Hủy đơn trước X giờ (vd: Hủy trước 24h hoàn 100%, trước 12h hoàn 50%, sát 6h không hoàn) do hệ thống quy định chung hay cho phép từng Owner tự cấu hình theo Venue?
2. **Quy trình Khách chọn "Pay at venue" (Thanh toán tại sân):** Đơn đặt trả sau tại sân có cần Owner bấm duyệt chấp nhận giữ sân không, hay tự động `CONFIRMED` với điều kiện nếu khách bùng hàng (No-show) sẽ bị khóa tài khoản Customer?

---

## 12. Definition of Done (DoD) - Task 01.01 Refinement

- [x] Actors đã được chuẩn hóa thành 4 Human Actors (`GUEST`, `CUSTOMER`, `OWNER`, `ADMIN`) và 1 System Actor (`SYSTEM`).
- [x] Payment MVP được chốt ưu tiên **MoMo** (và tùy chọn Cash/Pay at venue), các cổng khác đưa vào Future Extension.
- [x] Booking Flow chuẩn và thời gian hold (10 phút) đã được xác định.
- [x] Booking State Machine được chuẩn hóa với 7 trạng thái (`HOLDING`, `PAYMENT_PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `PAYMENT_FAILED`).
- [x] Customer bị cấm tùy ý `UPDATE` booking, thay bằng 2 Business Actions: `Cancel Booking` và `Request Reschedule`.
- [x] Owner không cần Confirm thủ công cho đơn hàng online đã thanh toán thành công qua MoMo.
- [x] Mô hình Ownership Hai Chiều (Customer ownership vs Owner/Venue ownership) và ràng buộc không tin tưởng `booking_id` đã được làm rõ.
- [x] Phân quyền 3 lớp (Authentication -> RBAC -> ABAC/Ownership) được thiết lập chặt chẽ.
- [x] Matrix phân quyền đã được cập nhật đồng bộ.
- [x] Tuyệt đối không tạo code, không tạo database schema hay API implementation.

---
*Tài liệu được cập nhật bởi Antigravity AI Assistant cho dự án SportHubAI.*
