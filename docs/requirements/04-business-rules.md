# TÀI LIỆU ĐẶC TẢ QUY TẮC NGHIỆP VỤ (BUSINESS RULES SPECIFICATION)
**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.04 (Final Correction Pass)  
**Trạng thái:** Standardized Specification  
**Tham chiếu:**  
- [01-actors-and-permissions.md](file:///e:/SportHubAI/docs/requirements/01-actors-and-permissions.md) (APPROVED)  
- [02-use-cases-and-user-flows.md](file:///e:/SportHubAI/docs/requirements/02-use-cases-and-user-flows.md) (APPROVED)  
- [03-functional-requirements.md](file:///e:/SportHubAI/docs/requirements/03-functional-requirements.md) (APPROVED)  
**Ngày cập nhật:** 2026-08-08  

---

## 1. MỤC TIÊU & NGUYÊN TẮC THIẾT LẬP

Tài liệu này đặc tả toàn bộ các **Business Rules (BR)** chi phối sự vận hành của hệ thống SportHubAI. Các Business Rule trả lời câu hỏi *"Hệ thống phải tuân theo quy tắc nghiệp vụ nào?"* và độc lập hoàn toàn với công nghệ triển khai.

### Nguyên Tắc Thiết Lập Quy Tắc Nghiệp Vụ:
1. **Truy vết 3 tầng (Traceability Chain):** `Use Case (UC) -> Functional Requirement (FR) -> Business Rule (BR)`. Mỗi Business Rule phải có nguồn gốc rõ ràng từ tài liệu đã phê duyệt (`APPROVED`).
2. **Không tự bịa Business Rule:**
   - Các nội dung đã `APPROVED` ở 01.01, 01.02, 01.03 được chuyển đổi thành Quy tắc nghiệp vụ chính thức (`Status: APPROVED`).
   - Các nội dung đang ở dạng `TBD`, `Business Decision Required`, hoặc `Open Question (OQ-xxx)` tuyệt đối không tự chốt giá trị (như % hoàn tiền, mốc giờ hủy, thời hạn OTP). Các mục này được ghi nhận rõ `Status: TBD — Refer to OQ-xxx`.
3. **Tuyệt đối không chứa Implementation Leakage:** Không mô tả SQL, Database schema, REST API, HTTP methods/status codes, Redis, Controllers, Services, hay code implementation.

---

## 2. QUY ƯỚC MÃ BUSINESS RULE (ID CONVENTION)

- `BR-AUTH-xxx`: Quy tắc Xác thực & Tài khoản (Authentication)
- `BR-USER-xxx`: Quy tắc Phân quyền Role & Chuyển đổi Role (User & Role)
- `BR-BOOK-xxx`: Quy tắc Đặt lịch & Trạng thái Đơn hàng (Booking & State)
- `BR-SLOT-xxx`: Quy tắc Quản lý Slot & Khả dụng (Slot & Availability)
- `BR-PAY-xxx` : Quy tắc Thanh toán & Xác thực Giao dịch (Payment)
- `BR-CANCEL-xxx`: Quy tắc Hủy đơn & Hoàn tiền (Cancellation & Refund)
- `BR-VENUE-xxx`: Quy tắc Quản lý Cơ sở Thể thao (Venue)
- `BR-COURT-xxx`: Quy tắc Quản lý Sân con (Court)
- `BR-SCHED-xxx`: Quy tắc Lịch vận hành & Khóa slot (Schedule)
- `BR-PRICE-xxx`: Quy tắc Bảng giá & Giờ cao điểm (Pricing)
- `BR-OWNER-xxx`: Quy tắc Vận hành Owner & Đặt tại sân (Owner Operations)
- `BR-CUST-xxx` : Quy tắc Dịch vụ & Tài khoản Khách hàng (Customer Services)
- `BR-REVIEW-xxx`: Quy tắc Đánh giá & Phản hồi (Review)
- `BR-NOTI-xxx` : Quy tắc Thông báo Hệ thống (Notification)
- `BR-ADMIN-xxx`: Quy tắc Kiểm duyệt & Giám sát Admin (Admin Supervision)
- `BR-SYS-xxx`  : Quy tắc Tác vụ Tự động Hệ thống (System Automation)

---

## 3. QUY TẮC NGHIỆP VỤ CHI TIẾT THEO NHÓM

### 3.1. Authentication Rules (BR-AUTH)

#### BR-AUTH-001 — Account Registration Verification
- **Rule Type:** Validation / Security
- **Statement:** Mọi tài khoản Customer mới đăng ký phải được xác thực thành công qua mã OTP gửi tới địa chỉ Email thực tế của người dùng trước khi được cấp quyền sử dụng các chức năng yêu cầu đăng nhập.
- **Condition:** Người dùng thực hiện đăng ký tài khoản Customer mới.
- **Outcome:** Tài khoản khởi tạo ở trạng thái `UNVERIFIED`. Hệ thống tạo mã OTP và gửi về Email thực tế. Chỉ khi nhập đúng OTP hợp lệ, tài khoản mới chuyển sang `ACTIVE`.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-AUTH-001`, `FR-AUTH-002`, `UC-C-001`, `UC-C-002`

#### BR-AUTH-002 — OTP Expiration & Resend Limits
- **Rule Type:** Time Constraint / Security Policy
- **Statement:** Mã OTP xác thực Email chỉ có hiệu lực trong một khoảng thời gian giới hạn và bị hạn chế số lần yêu cầu gửi lại để chống rác/spam.
- **Condition:** Người dùng yêu cầu nhận hoặc xác thực mã OTP.
- **Outcome:** Thời gian hết hạn của OTP và số lần yêu cầu gửi lại được quản lý theo cấu hình an ninh hệ thống.
- **Priority:** MUST
- **Status:** TBD — Refer to OQ-006
- **Source:** `FR-AUTH-002`, `UC-C-002`

#### BR-AUTH-003 — Account Status Login Restriction
- **Rule Type:** Authorization / Access Control
- **Statement:** Người dùng chỉ được phép đăng nhập vào hệ thống khi tài khoản ở trạng thái `ACTIVE`. Tài khoản `UNVERIFIED` hoặc `SUSPENDED` bị từ chối đăng nhập.
- **Condition:** Người dùng thực hiện đăng nhập bằng Email và Mật khẩu.
- **Outcome:** Hệ thống từ chối phiên đăng nhập nếu tài khoản chưa kích hoạt hoặc đang bị tạm khóa.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-AUTH-003`, `FR-ADMIN-001`, `UC-C-003`, `UC-A-001`

#### BR-AUTH-004 — Password Change Verification
- **Rule Type:** Security Constraint
- **Statement:** Việc thay đổi mật khẩu tài khoản yêu cầu xác minh chính xác mật khẩu hiện tại trước khi thiết lập mật khẩu mới.
- **Condition:** Người dùng yêu cầu đổi mật khẩu trong phần Cài đặt tài khoản.
- **Outcome:** Mật khẩu mới chỉ được cập nhật nếu mật khẩu hiện tại được xác minh đúng.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-AUTH-006`, `UC-C-007`

---

### 3.2. User & Role Rules (BR-USER)

#### BR-USER-001 — Default Role Assignment
- **Rule Type:** Authorization Policy
- **Statement:** Mọi người dùng mới hoàn tất đăng ký và xác thực tài khoản thành công đều nhận duy nhất vai trò mặc định là `CUSTOMER`.
- **Condition:** Tài khoản mới được xác thực kích hoạt `ACTIVE`.
- **Outcome:** Hệ thống gán quyền `CUSTOMER`.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-AUTH-001`, `UC-C-001`

#### BR-USER-002 — Owner Upgrade Approval Flow
- **Rule Type:** State Transition / Approval Policy
- **Statement:** Tài khoản `CUSTOMER` muốn chuyển đổi thành `OWNER` phải gửi Form đăng ký đối tác (`Submit Owner Application`) và chỉ nhận vai trò `OWNER` sau khi được Admin phê duyệt (`APPROVE`).
- **Condition:** Customer gửi đơn nâng cấp tài khoản thành Owner.
- **Outcome:** Đơn đăng ký ghi nhận trạng thái `PENDING_REVIEW`. Nếu Admin `APPROVE`, vai trò tài khoản chuyển sang `OWNER`. Nếu `REJECT`, tài khoản giữ nguyên vai trò `CUSTOMER`.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-CUST-006`, `FR-ADMIN-001`, `UC-O-001`, `UC-A-002`

#### BR-USER-003 — Single Primary Role Constraint
- **Rule Type:** Authorization Constraint
- **Statement:** Trong luồng vận hành chính, mỗi tài khoản người dùng tại một thời điểm chỉ hoạt động dưới một vai trò chính định danh (`CUSTOMER`, `OWNER`, hoặc `ADMIN`).
- **Condition:** Truy cập các chức năng thuộc hệ thống.
- **Outcome:** Phân định rõ ràng quyền hạn và giao diện của từng Actor.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-AUTH-003`, `UC-C-003`

---

### 3.3. Customer Services Rules (BR-CUST)

#### BR-CUST-005 — Booking Reschedule Policy & Pricing Difference (FUTURE)
- **Rule Type:** Policy Constraint / Pricing Policy
- **Statement:** Quy trình dời lịch (`Request Reschedule`) và tính toán chênh lệch giá giữa khung giờ cũ và khung giờ mới thuộc phạm vi phát triển phiên bản tương lai.
- **Condition:** Customer gửi yêu cầu dời lịch/đổi khung giờ chơi cho đơn `CONFIRMED`.
- **Outcome:** Quy trình xử lý dời lịch tuân thủ theo quyết định nghiệp vụ quy hoạch phiên bản sau.
- **Priority:** FUTURE
- **Status:** TBD — Refer to OQ-005
- **Source:** `FR-CUST-005`, `UC-C-018`

---

### 3.4. Booking Engine Rules (BR-BOOK)

#### BR-BOOK-001 — Customer Online Booking Authorization
- **Rule Type:** Authorization Policy
- **Statement:** Chỉ người dùng có tài khoản `CUSTOMER` đã đăng nhập mới được phép khởi tạo đơn đặt sân trực tuyến (`ONLINE BOOKING`) thông qua Customer Website.
- **Condition:** Người dùng nhấn nút "Đặt sân ngay" trên trang web khách hàng.
- **Outcome:** Nếu chưa đăng nhập (GUEST), hệ thống chặn thao tác và yêu cầu đăng nhập.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-GUEST-004`, `FR-BOOK-003`, `UC-C-014`

#### BR-BOOK-002 — Booking Slot Hold Countdown Duration
- **Rule Type:** Time Constraint / State Policy
- **Statement:** Khi Customer khởi tạo Online Booking thành công, hệ thống khóa tạm thời slot giờ chơi sang trạng thái `HOLDING` trong thời gian đếm ngược đúng **10 phút**.
- **Condition:** Customer bấm tiến hành thanh toán cho slot khả dụng (`AVAILABLE`).
- **Outcome:** Đơn hàng được tạo ở trạng thái `HOLDING` và duy trì hiệu lực giữ chỗ trong 10 phút.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-BOOK-003`, `UC-C-014`

#### BR-BOOK-003 — Double Booking Prevention
- **Rule Type:** Business Constraint
- **Statement:** Hệ thống phải ngăn chặn các yêu cầu giữ chỗ đồng thời cho cùng một sân/khung giờ. Một sân con (`Court`) và khung giờ chơi (`Time Slot`) tại một ngày xác định tuyệt đối không thể bị chiếm giữ hoặc đặt thành công bởi hai Booking hợp lệ cùng một lúc.
- **Condition:** Nhiều yêu cầu đặt chỗ gửi lên cho cùng một sân và khung giờ.
- **Outcome:** Hệ thống đảm bảo chỉ có duy nhất một yêu cầu thành công tạo giữ chỗ (`HOLDING`) hoặc đặt sân (`CONFIRMED`). Các yêu cầu còn lại bị từ chối với thông báo slot không khả dụng.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-BOOK-004`, `UC-C-014`

#### BR-BOOK-004 — Payment Pending State Transition
- **Rule Type:** State Policy
- **Statement:** Khi Customer chuyển sang giao diện thanh toán MoMo, đơn hàng từ `HOLDING` chuyển sang `PAYMENT_PENDING`. Trạng thái đơn **KHÔNG ĐƯỢC** chuyển sang `CONFIRMED` chỉ dựa trên việc trình duyệt chuyển hướng (Frontend Redirect).
- **Condition:** Customer chọn phương thức thanh toán MoMo.
- **Outcome:** Đơn đặt sân nhận trạng thái `PAYMENT_PENDING` và chờ xác thực ngầm.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-BOOK-005`, `FR-PAY-001`, `UC-C-015`

#### BR-BOOK-005 — Verified Payment Confirmation
- **Rule Type:** Payment / State Policy
- **Statement:** Giao dịch thanh toán phải được xác minh hợp lệ qua **MoMo Server Callback (IPN)** trước khi Booking được chuyển từ `PAYMENT_PENDING` sang `CONFIRMED`. MoMo Server Callback (IPN) là nguồn xác thực tính đúng đắn duy nhất (Source of Truth) cho trạng thái thanh toán `PAID`.
- **Condition:** MoMo Server Callback gửi tín hiệu xác thực giao dịch thành công.
- **Outcome:** Đơn hàng chuyển sang trạng thái `CONFIRMED`, slot được đặt chính thức tự động.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-BOOK-006`, `FR-PAY-002`, `UC-S-003`, `UC-S-004`

#### BR-BOOK-006 — Hold & Payment Failure Expiration
- **Rule Type:** State Transition / Automation
- **Statement:** Nếu quá 10 phút hold mà không có xác nhận thanh toán thành công, hoặc giao dịch thanh toán bị hủy/từ chối, đơn hàng chuyển sang `EXPIRED` hoặc `PAYMENT_FAILED` và slot lập tức giải phóng về `AVAILABLE`.
- **Condition:** Hết thời gian đếm ngược 10 phút hoặc giao dịch thanh toán thất bại.
- **Outcome:** Đơn đổi trạng thái tương ứng, slot trở lại trạng thái trống cho cộng đồng đặt.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-BOOK-006`, `FR-BOOK-007`, `UC-S-001`, `UC-S-002`

#### BR-BOOK-007 — Automatic Booking Completion
- **Rule Type:** State Transition / Automation
- **Statement:** Đơn đặt sân ở trạng thái `CONFIRMED` sẽ tự động được chuyển sang trạng thái `COMPLETED` sau khi khung giờ sử dụng sân thực tế đã kết thúc.
- **Condition:** Giờ kết thúc của slot chơi < Thời gian hiện tại của hệ thống.
- **Outcome:** Đơn hàng nhận trạng thái `COMPLETED`, kích hoạt quyền gửi Đánh giá (`Review`) cho Customer.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-SYS-001`, `UC-S-006`

---

## 4. BOOKING STATE TRANSITION RULES (BR-BOOK-008 -> BR-BOOK-014)

Hệ thống tuân thủ nghiêm ngặt **tập 8 trạng thái** đơn đặt sân: `AVAILABLE`, `HOLDING`, `PAYMENT_PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `PAYMENT_FAILED`.

```text
               ┌──────────────┐
               │  AVAILABLE   │ (Trạng thái slot ban đầu)
               └──────┬───────┘
                      │ (Customer Creates Online Booking)
                      ▼
               ┌──────────────┐
               │   HOLDING    │ (Giữ chỗ 10 phút)
               └──────┬───────┘
                      │ (Create Payment Request)
                      ▼
               ┌──────────────┐
               │PAYMENT_PENDING│ (Chờ MoMo Server Callback)
               └──────┬───────┘
                      │
        ┌─────────────┼─────────────┐
        ▼ (Success Callback)▼ (Failed Callback) ▼ (Timeout > 10m)
┌──────────────┐┌──────────────┐┌───────────┐
│  CONFIRMED   ││PAYMENT_FAILED││  EXPIRED  │
└──────┬───────┘└──────┬───────┘└─────┬─────┘
       │               │              │
 ┌─────┴─────┐         ▼              ▼
 ▼           ▼   (Release Slot)(Release Slot)
┌─────────┐┌─────────┐
│COMPLETED││CANCELLED│
└─────────┘└────┬────┘
                ▼
         (Release Slot)
```

### Bảng Chi Tiết Quy Tắc Chuyển Trạng Thái:

#### BR-BOOK-008 — Hold Reservation Transition
- **From:** `AVAILABLE`
- **Trigger:** Customer gửi yêu cầu khởi tạo Online Booking.
- **Condition:** Slot được chọn đang ở trạng thái `AVAILABLE`.
- **To:** `HOLDING`
- **Source:** `FR-BOOK-002`, `FR-BOOK-003`, `UC-C-014`

#### BR-BOOK-009 — Initiate Payment Transition
- **From:** `HOLDING`
- **Trigger:** Customer chọn phương thức thanh toán MoMo.
- **Condition:** Đơn hàng đang ở trạng thái `HOLDING` và chưa quá thời gian 10 phút đếm ngược.
- **To:** `PAYMENT_PENDING`
- **Source:** `FR-BOOK-005`, `FR-PAY-001`, `UC-C-015`

#### BR-BOOK-010 — Payment Success Confirmation Transition
- **From:** `PAYMENT_PENDING`
- **Trigger:** MoMo Server Callback xác nhận giao dịch thanh toán thành công.
- **Condition:** Chữ ký số và số tiền giao dịch được xác minh hợp lệ.
- **To:** `CONFIRMED`
- **Source:** `FR-BOOK-006`, `FR-PAY-002`, `UC-S-003`, `UC-S-004`

#### BR-BOOK-011 — Payment Failure Release Transition
- **From:** `HOLDING` hoặc `PAYMENT_PENDING`
- **Trigger:** MoMo Server Callback phản hồi giao dịch thất bại hoặc Customer bấm hủy thanh toán.
- **Condition:** Giao dịch thanh toán không thành công.
- **To:** `PAYMENT_FAILED` (Slot lập tức chuyển về `AVAILABLE`).
- **Source:** `FR-BOOK-007`, `UC-S-002`

#### BR-BOOK-012 — Hold Timeout Expiration Transition
- **From:** `HOLDING` hoặc `PAYMENT_PENDING`
- **Trigger:** Thời gian đếm ngược 10 phút kết thúc.
- **Condition:** Hệ thống không nhận được xác thực thanh toán `PAID` thành công từ MoMo Server Callback.
- **To:** `EXPIRED` (Slot lập tức chuyển về `AVAILABLE`).
- **Source:** `FR-BOOK-008`, `UC-S-001`, `UC-S-002`

#### BR-BOOK-013 — Customer/Owner Cancellation Transition
- **From:** `CONFIRMED`
- **Trigger:** Customer hoặc Owner gửi yêu cầu hủy đơn đặt sân.
- **Condition:** Đơn đặt sân đáp ứng điều kiện khả thi trong chính sách hủy áp dụng.
- **To:** `CANCELLED` (Slot chuyển về `AVAILABLE`).
- **Source:** `FR-BOOK-009`, `FR-OWNER-003`, `UC-C-017`, `UC-O-013`

#### BR-BOOK-014 — Play Time Completion Transition
- **From:** `CONFIRMED`
- **Trigger:** Thời gian khung giờ chơi kết thúc.
- **Condition:** Giờ kết thúc của slot < Thời gian hiện tại.
- **To:** `COMPLETED`
- **Source:** `FR-SYS-001`, `UC-S-006`

---

### 3.5. Payment Rules (BR-PAY)

#### BR-PAY-001 — Payment Gateway Scope (MVP)
- **Rule Type:** Integration Policy
- **Statement:** Trong phạm vi MVP, cổng thanh toán trực tuyến được hỗ trợ duy nhất là **MoMo**. Các cổng thanh toán khác (VNPAY, ZaloPay, Thẻ quốc tế) thuộc danh mục mở rộng tương lai.
- **Condition:** Khách hàng thực hiện thanh toán trực tuyến.
- **Outcome:** Hệ thống kết nối phiên thanh toán qua MoMo Payment Gateway.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-PAY-001`, `UC-C-015`

#### BR-PAY-002 — Payment Verification Source of Truth
- **Rule Type:** Security Constraint
- **Statement:** Tín hiệu **MoMo Server Callback** gửi trực tiếp tới hệ thống là nguồn xác thực tính đúng đắn duy nhất (Source of Truth) cho trạng thái thanh toán `PAID`.
- **Condition:** Xác minh kết quả giao dịch thanh toán.
- **Outcome:** Trình duyệt chuyển hướng (Frontend Redirect) chỉ đóng vai trò điều hướng giao diện và không bao giờ được dùng làm căn cứ tự đổi đơn sang `CONFIRMED`.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-PAY-002`, `UC-S-003`

#### BR-PAY-003 — Payable Amount Calculation
- **Rule Type:** Pricing Calculation
- **Statement:** Tổng số tiền thanh toán của đơn đặt sân được hệ thống tính toán tự động căn cứ trên giá các slot giờ chơi được chọn, phí dịch vụ đi kèm (nếu có) và giá trị giảm trừ từ mã ưu đãi hợp lệ (nếu có).
- **Condition:** Khởi tạo yêu cầu thanh toán đơn đặt sân.
- **Outcome:** Mức tiền thanh toán được ghi nhận chính xác cho phiên giao dịch thanh toán.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-BOOK-002`, `FR-PAY-001`, `UC-C-013`, `UC-C-015`

#### BR-PAY-004 — Pay-at-venue Acceptance Flow (TBD)
- **Rule Type:** Payment Policy
- **Statement:** Quy trình xử lý và xác nhận cho hình thức đặt sân thanh toán trả sau tại sân (Pay-at-venue) được đánh dấu `TBD — Refer to OQ-002`.
- **Condition:** Khách hàng chọn hình thức thanh toán trả sau tại sân (nếu Venue cho phép).
- **Outcome:** Đơn hàng xử lý theo quyết định nghiệp vụ chốt sau.
- **Priority:** MUST
- **Status:** TBD — Refer to OQ-002
- **Source:** `FR-BOOK-002`, `UC-C-014`

---

### 3.6. Cancellation & Refund Rules (BR-CANCEL)

#### BR-CANCEL-001 — Customer Cancellation Eligibility
- **Rule Type:** Policy Constraint
- **Statement:** Customer chỉ có thể hủy đơn đặt sân `CONFIRMED` thuộc sở hữu của mình nếu đơn đặt sân đó thỏa mãn điều kiện khả thi trong Chính sách hủy áp dụng của Venue.
- **Condition:** Customer gửi yêu cầu hủy đơn `CONFIRMED`.
- **Outcome:** Hệ thống kiểm tra điều kiện khả thi. Nếu hợp lệ, đơn chuyển sang `CANCELLED` và slot được giải phóng (`Release Booking Slot`). Nếu không hợp lệ, yêu cầu bị từ chối.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-BOOK-009`, `UC-C-017`

#### BR-CANCEL-002 — Cancellation Refund Policy (TBD)
- **Rule Type:** Financial Policy
- **Statement:** Chi tiết quy định hoàn tiền (tỷ lệ % hoàn tiền, thời hạn chót cho phép hủy hoàn tiền, phương thức hoàn tiền tự động hay thủ công) được xác định là `TBD — Business Decision Required`.
- **Condition:** Đơn đặt sân được hủy thành công.
- **Outcome:** Xử lý hoàn tiền được thực hiện theo quyết định kinh doanh chốt sau.
- **Priority:** MUST
- **Status:** TBD — Refer to OQ-001
- **Source:** `FR-BOOK-009`, `UC-C-017`

---

### 3.7. Venue & Court Rules (BR-VENUE / BR-COURT)

#### BR-VENUE-001 — Venue Approval Requirement
- **Rule Type:** State / Governance Policy
- **Statement:** Cơ sở thể thao mới tạo mặc định ở trạng thái `PENDING`. Chỉ những Venue chuyển sang trạng thái `APPROVED` bởi Admin mới xuất hiện công khai trên Customer Website cho người chơi tìm kiếm và đặt lịch.
- **Condition:** Owner tạo Venue mới hoặc Admin kiểm duyệt Venue.
- **Outcome:** Venue `PENDING` hoặc `REJECTED` hoàn toàn bị ẩn khỏi giao diện khách hàng.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-VENUE-001`, `FR-ADMIN-003`, `UC-O-003`, `UC-A-003`

#### BR-VENUE-002 — Venue Strict Tenant Isolation
- **Rule Type:** Authorization Constraint
- **Statement:** Owner A chỉ có quyền truy cập, chỉnh sửa thông tin, xem đơn hàng và báo cáo đối với các Venue thuộc quyền sở hữu của Owner A. Owner A tuyệt đối không thể thao tác trên tài nguyên của Owner B.
- **Condition:** Owner truy cập các chức năng quản trị cơ sở thể thao.
- **Outcome:** Hệ thống từ chối thao tác nếu tài nguyên không thuộc quyền sở hữu của Owner đang đăng nhập.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-VENUE-002`, `FR-OWNER-004`, `UC-O-004`, `UC-O-010`

#### BR-COURT-001 — Court Maintenance Availability Block
- **Rule Type:** Availability Constraint
- **Statement:** Khi sân con (`Court`) được Owner chuyển sang trạng thái `MAINTENANCE` (Bảo trì), tất cả các slot giờ chơi của sân con đó lập tức ẩn khỏi bảng đặt lịch khả dụng của Customer.
- **Condition:** Owner chuyển trạng thái sân con sang `MAINTENANCE`.
- **Outcome:** Sân con ngừng nhận mọi đơn đặt mới trên Customer Website.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-COURT-003`, `UC-O-009`

---

### 3.8. Schedule & Pricing Rules (BR-SCHED / BR-PRICE)

#### BR-SCHED-001 — Manual Slot Blocking Constraint
- **Rule Type:** Constraint Policy
- **Statement:** Owner được quyền khóa thủ công (`BLOCKED`) các slot giờ chơi ở trạng thái `AVAILABLE`. Owner không thể khóa các slot đã có đơn online ở trạng thái `HOLDING`, `PAYMENT_PENDING`, hoặc `CONFIRMED`.
- **Condition:** Owner chọn khóa slot giờ chơi thủ công.
- **Outcome:** Slot `AVAILABLE` chuyển thành `BLOCKED` và không thể đặt online. Nếu slot đã có đơn đặt, hệ thống báo lỗi từ chối khóa.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-SCHED-003`, `UC-O-008`

#### BR-PRICE-001 — Dynamic Slot Price Application
- **Rule Type:** Pricing Calculation
- **Statement:** Mức giá hiển thị và tính tiền cho từng slot giờ chơi được áp dụng tự động theo bảng giá cấu hình của Venue (Phân biệt giờ thường, giờ cao điểm Peak-hour, ngày cuối tuần/ngày lễ).
- **Condition:** Khách hàng hoặc Owner chọn slot giờ chơi trong lịch vận hành.
- **Outcome:** Slot nhận đúng đơn giá được cấu hình tương ứng với khung giờ và ngày chơi.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-SCHED-002`, `UC-O-007`

---

### 3.9. Owner Operations Rules (BR-OWNER)

#### BR-OWNER-001 — Manual Offline Booking Source & Validation
- **Rule Type:** Operational Policy
- **Statement:** Owner được phép khởi tạo đơn đặt tại sân (`MANUAL_OFFLINE BOOKING`) cho khách vãng lai qua Owner Portal. Đơn thủ công vẫn phải kiểm tra tình trạng slot trống và không được ghi đè lên các slot đang `HOLDING` hoặc `CONFIRMED`.
- **Condition:** Owner nhập đơn đặt tại sân trực tiếp hoặc qua điện thoại.
- **Outcome:** Slot được đặt với trạng thái `CONFIRMED` và ghi nhận nguồn đơn là `MANUAL_OFFLINE`.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-OWNER-001`, `UC-O-011`

#### BR-OWNER-002 — Operational Check-in Requirement
- **Rule Type:** Operational Policy
- **Statement:** Owner được phép ghi nhận trạng thái Check-in tại sân đối với các đơn đặt sân `CONFIRMED` khi khách hàng tới sử dụng dịch vụ.
- **Condition:** Khách hàng có đơn `CONFIRMED` tới sân chơi.
- **Outcome:** Đơn hàng ghi nhận thời gian check-in của khách hàng.
- **Priority:** SHOULD / MVP Candidate
- **Status:** APPROVED (Optional Scope)
- **Source:** `FR-OWNER-002`, `UC-O-012`

---

### 3.10. Review Rules (BR-REVIEW)

#### BR-REVIEW-001 — Review Eligibility Requirement
- **Rule Type:** Policy Constraint
- **Statement:** Customer chỉ có thể gửi Đánh giá sao và Bình luận đối với đơn đặt sân ở trạng thái `COMPLETED` do chính mình sở hữu.
- **Condition:** Customer gửi đánh giá cho đơn hàng.
- **Outcome:** Hệ thống ghi nhận đánh giá sau khi xác minh đơn hàng ở trạng thái `COMPLETED`. Các đơn chưa chơi hoặc bị hủy không thể đánh giá.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-REVIEW-001`, `UC-C-019`

#### BR-REVIEW-002 — Review Target Scope & Frequency (TBD)
- **Rule Type:** Policy Constraint
- **Statement:** Tần suất đánh giá và Phạm vi đối tượng review (Đánh giá chung Venue hay chi tiết từng sân con `Court`) được xác định là `TBD — Refer to OQ-003`.
- **Condition:** Customer gửi đánh giá cho đơn đặt sân `COMPLETED`.
- **Outcome:** Xử lý hiển thị và phạm vi đánh giá được thực hiện theo quyết định nghiệp vụ chốt sau.
- **Priority:** MUST
- **Status:** TBD — Refer to OQ-003
- **Source:** `FR-REVIEW-001`, `UC-C-019`

---

### 3.11. Notification Rules (BR-NOTI)

#### BR-NOTI-001 — Notification Trigger Rules
- **Rule Type:** Automation Policy
- **Statement:** WHEN phát sinh các sự kiện: Mã OTP xác thực, Xác nhận đặt sân `CONFIRMED`, Hủy đơn `CANCELLED`, hoặc Hết hạn hold `EXPIRED` -> THEN hệ thống tự động khởi tạo thông báo tương ứng tới người dùng.
- **Condition:** Sự kiện hệ thống tương ứng xảy ra.
- **Outcome:** Thông báo tương ứng được khởi tạo.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-NOTI-001`, `UC-S-005`

#### BR-NOTI-002 — Notification Delivery Channels (TBD)
- **Rule Type:** Delivery Policy
- **Statement:** Kênh phân phối thông báo chi tiết (Email vs SMS vs Push Notification) được đánh dấu `TBD — Refer to OQ-006` (Ngoại trừ mã OTP xác thực tài khoản bắt buộc gửi qua Email thực tế).
- **Condition:** Hệ thống phát thông báo tới người dùng.
- **Outcome:** Kênh phát thông báo tuân thủ cấu hình quyết định nghiệp vụ.
- **Priority:** MUST
- **Status:** TBD — Refer to OQ-006
- **Source:** `FR-NOTI-001`, `UC-S-005`

---

### 3.12. Admin Supervision Rules (BR-ADMIN)

#### BR-ADMIN-001 — Platform Administrative Authority
- **Rule Type:** Authorization Policy
- **Statement:** Admin có quyền quản trị toàn hệ thống: Tạm khóa/Kích hoạt tài khoản người dùng, Phê duyệt/Từ chối đơn làm Owner, Phê duyệt/Đình chỉ Venue, Xem toàn bộ đơn đặt sân và nhật ký thanh toán toàn sàn.
- **Condition:** Admin thực hiện các thao tác quản trị trên Admin Portal.
- **Outcome:** Thao tác quản trị được thực thi trên toàn hệ thống và ghi nhận vào nhật ký hệ thống (`Audit Logs`).
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-ADMIN-001` -> `FR-ADMIN-009`, `UC-A-001` -> `UC-A-010`

---

### 3.13. System Automated Processing Rules (BR-SYS)

#### BR-SYS-001 — Automatic Booking Completion Behavior
- **Rule Type:** State Transition / Automation
- **Statement:** Đơn đặt sân ở trạng thái `CONFIRMED` tự động chuyển sang `COMPLETED` sau khi khung giờ chơi đã kết thúc.
- **Condition:** Giờ kết thúc của slot < Thời gian hiện tại.
- **Outcome:** Đơn nhận trạng thái `COMPLETED` và kích hoạt quyền Đánh giá cho Customer.
- **Priority:** MUST
- **Status:** APPROVED
- **Source:** `FR-SYS-001`, `UC-S-006`

#### BR-SYS-002 — Automatic Completion Processing Frequency (TBD)
- **Rule Type:** Time Policy
- **Statement:** Tần suất kiểm tra và chuyển trạng thái đơn tự động sang `COMPLETED` được đánh dấu `TBD — Refer to OQ-004`.
- **Condition:** Hệ thống thực hiện quét và cập nhật đơn kết thúc.
- **Outcome:** Tần suất xử lý tuân thủ theo quyết định nghiệp vụ chốt sau.
- **Priority:** MUST
- **Status:** TBD — Refer to OQ-004
- **Source:** `FR-SYS-001`, `UC-S-006`

---

## 5. BUSINESS RULES REQUIRING DECISIONS (CÁC QUY TẮC CHỜ CHỐT - TBD)

Dưới đây là danh sách các Quy tắc nghiệp vụ chưa thể xác định giá trị cụ thể do phụ thuộc vào các quyết định kinh doanh chưa chốt (Open Questions):

| Mã Business Rule | Tên Quy Tắc Nghiệp Vụ | Trạng thái | Nguồn Open Question / Reference |
|---|---|---|---|
| **BR-AUTH-002** | OTP Expiration & Resend Limits | `TBD` | `OQ-006 Notification Channels / Security Policy` |
| **BR-CANCEL-002**| Cancellation Refund Policy (% & Deadline)| `TBD` | `OQ-001 Cancellation Refund Policy Implementation` |
| **BR-REVIEW-002**| Review Target Scope & Frequency | `TBD` | `OQ-003 Review Target Scope` |
| **BR-NOTI-002**  | Notification Delivery Channels | `TBD` | `OQ-006 Notification Delivery Channels` |
| **BR-SYS-002**   | Automatic Completion Processing Frequency| `TBD` | `OQ-004 Automatic Completion Frequency` |
| **BR-CUST-005**  | Booking Reschedule Policy & Difference| `TBD` | `OQ-005 Reschedule Policy (Future Scope)` |
| **BR-PAY-004**   | Pay-at-venue Acceptance Flow | `TBD` | `OQ-002 Pay-at-venue Flow Confirmation` |

---

## 6. MA TRẬN TRUY VẾT (TRACEABILITY MATRIX: BR -> FR -> UC)

| Mã Business Rule | Mã Functional Requirement | Mã Source Use Case | Trạng thái |
|---|---|---|---|
| **BR-AUTH-001** | FR-AUTH-001, FR-AUTH-002 | UC-C-001, UC-C-002 | APPROVED |
| **BR-AUTH-002** | FR-AUTH-002 | UC-C-002 | TBD (OQ-006) |
| **BR-AUTH-003** | FR-AUTH-003, FR-ADMIN-001 | UC-C-003, UC-A-001 | APPROVED |
| **BR-AUTH-004** | FR-AUTH-006 | UC-C-007 | APPROVED |
| **BR-USER-001** | FR-AUTH-001 | UC-C-001 | APPROVED |
| **BR-USER-002** | FR-CUST-006, FR-ADMIN-001 | UC-O-001, UC-A-002 | APPROVED |
| **BR-USER-003** | FR-AUTH-003 | UC-C-003 | APPROVED |
| **BR-CUST-005** | FR-CUST-005 | UC-C-018 | TBD (OQ-005) |
| **BR-BOOK-001** | FR-GUEST-004, FR-BOOK-003 | UC-C-014 | APPROVED |
| **BR-BOOK-002** | FR-BOOK-003 | UC-C-014 | APPROVED |
| **BR-BOOK-003** | FR-BOOK-004 | UC-C-014 | APPROVED |
| **BR-BOOK-004** | FR-BOOK-005, FR-PAY-001 | UC-C-015 | APPROVED |
| **BR-BOOK-005** | FR-BOOK-006, FR-PAY-002 | UC-S-003, UC-S-004 | APPROVED |
| **BR-BOOK-006** | FR-BOOK-006, FR-BOOK-007 | UC-S-001, UC-S-002 | APPROVED |
| **BR-BOOK-007** | FR-SYS-001 | UC-S-006 | APPROVED |
| **BR-BOOK-008** | FR-BOOK-002, FR-BOOK-003 | UC-C-014 | APPROVED |
| **BR-BOOK-009** | FR-BOOK-005, FR-PAY-001 | UC-C-015 | APPROVED |
| **BR-BOOK-010** | FR-BOOK-006, FR-PAY-002 | UC-S-003, UC-S-004 | APPROVED |
| **BR-BOOK-011** | FR-BOOK-007 | UC-S-002 | APPROVED |
| **BR-BOOK-012** | FR-BOOK-008 | UC-S-001, UC-S-002 | APPROVED |
| **BR-BOOK-013** | FR-BOOK-009, FR-OWNER-003 | UC-C-017, UC-O-013 | APPROVED |
| **BR-BOOK-014** | FR-SYS-001 | UC-S-006 | APPROVED |
| **BR-PAY-001**   | FR-PAY-001 | UC-C-015 | APPROVED |
| **BR-PAY-002**   | FR-PAY-002 | UC-S-003 | APPROVED |
| **BR-PAY-003**   | FR-BOOK-002, FR-PAY-001 | UC-C-013, UC-C-015 | APPROVED |
| **BR-PAY-004**   | FR-BOOK-002 | UC-C-014 | TBD (OQ-002) |
| **BR-CANCEL-001**| FR-BOOK-009 | UC-C-017 | APPROVED |
| **BR-CANCEL-002**| FR-BOOK-009 | UC-C-017 | TBD (OQ-001) |
| **BR-VENUE-001** | FR-VENUE-001, FR-ADMIN-003| UC-O-003, UC-A-003 | APPROVED |
| **BR-VENUE-002** | FR-VENUE-002, FR-OWNER-004| UC-O-004, UC-O-010 | APPROVED |
| **BR-COURT-001** | FR-COURT-003 | UC-O-009 | APPROVED |
| **BR-SCHED-001** | FR-SCHED-003 | UC-O-008 | APPROVED |
| **BR-PRICE-001** | FR-SCHED-002 | UC-O-007 | APPROVED |
| **BR-OWNER-001** | FR-OWNER-001 | UC-O-011 | APPROVED |
| **BR-OWNER-002** | FR-OWNER-002 | UC-O-012 | APPROVED (Optional)|
| **BR-REVIEW-001**| FR-REVIEW-001 | UC-C-019 | APPROVED |
| **BR-REVIEW-002**| FR-REVIEW-001 | UC-C-019 | TBD (OQ-003) |
| **BR-NOTI-001**  | FR-NOTI-001 | UC-S-005 | APPROVED |
| **BR-NOTI-002**  | FR-NOTI-001 | UC-S-005 | TBD (OQ-006) |
| **BR-ADMIN-001** | FR-ADMIN-001 -> FR-ADMIN-009| UC-A-001 -> UC-A-010| APPROVED |
| **BR-SYS-001**   | FR-SYS-001 | UC-S-006 | APPROVED |
| **BR-SYS-002**   | FR-SYS-001 | UC-S-006 | TBD (OQ-004) |

---

## 7. DEFINITION OF DONE (DoD) - TASK 01.04

- [x] Đã tạo file tài liệu tiêu chuẩn: [docs/requirements/04-business-rules.md](file:///e:/SportHubAI/docs/requirements/04-business-rules.md).
- [x] Đã cập nhật chính xác tập 8 trạng thái đơn đặt sân: `AVAILABLE`, `HOLDING`, `PAYMENT_PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `PAYMENT_FAILED`.
- [x] Chuẩn hóa toàn bộ các mã Booking Transition Rules sang `BR-BOOK-008` -> `BR-BOOK-014` (Không dùng mã `BTR-xxx` độc lập).
- [x] Đã loại bỏ hoàn toàn các thuật ngữ Backend/Implementation khỏi các quy tắc thanh toán và chuyển trạng thái.
- [x] Thống nhất thuật ngữ **MoMo Server Callback (IPN)** ở lần xuất hiện đầu tiên và **MoMo Server Callback** ở các quy tắc tiếp theo.
- [x] Loại bỏ hoàn toàn từ khóa `Cron`, `Worker`, `Queue`, `Scheduler` khỏi các quy tắc nghiệp vụ.
- [x] Bổ sung đầy đủ chi tiết cho tất cả các quy tắc `TBD` (`BR-SYS-002`, `BR-CUST-005`, `BR-PAY-004`) và đưa vào Traceability Matrix.
- [x] Chuẩn hóa quy tắc Đánh giá (`BR-REVIEW-001`, `BR-REVIEW-002`): giữ điều kiện `COMPLETED`, giữ Target và Frequency ở trạng thái `TBD`.
- [x] Đổi tên tiêu đề `BR-NOTI-001` thành `Notification Trigger Rules` và loại bỏ thuật ngữ Event-driven architecture.
- [x] Mọi `APPROVED` Business Rule đều có truy vết 3 tầng `BR -> FR -> UC`. Mọi `TBD` Business Rule đều có truy vết `BR -> FR -> UC -> OQ`.
- [x] Bảo lưu tuyệt đối các tài liệu `01.01`, `01.02`, `01.03`.

---
*Tài liệu được cập nhật bởi Antigravity AI Assistant cho dự án SportHubAI.*
