# TÀI LIỆU ĐẶC TẢ MÔ HÌNH DỮ LIỆU LOGICAL & ERD (DATA MODEL SPECIFICATION)
**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 01.05 (Final Consistency Corrected Specification)  
**Trạng thái:** Standardized Specification  
**Tham chiếu nguồn:**  
- [01-actors-and-permissions.md](file:///e:/SportHubAI/docs/requirements/01-actors-and-permissions.md) (APPROVED)  
- [02-use-cases-and-user-flows.md](file:///e:/SportHubAI/docs/requirements/02-use-cases-and-user-flows.md) (APPROVED)  
- [03-functional-requirements.md](file:///e:/SportHubAI/docs/requirements/03-functional-requirements.md) (APPROVED)  
- [04-business-rules.md](file:///e:/SportHubAI/docs/requirements/04-business-rules.md) (APPROVED)  
**Ngày cập nhật:** 2026-08-08  

---

## 1. MỤC TIÊU & NGUYÊN TẮC NỀN TẢNG

Tài liệu này đặc tả **Mô hình Dữ liệu Logical (Logical Data Model)** và biểu đồ ERD cho hệ thống SportHubAI. Mô hình dữ liệu được xây dựng hoàn toàn từ các yêu cầu nghiệp vụ, luồng sử dụng và quy tắc nghiệp vụ đã được phê duyệt (`APPROVED`) tại Task 01.01 đến Task 01.04.

### Nguyên Tắc Thiết Lập Quy Tắc Mô Hình Dữ Liệu:
1. **Nguồn Sự Thật Duy Nhất (Source Fidelity):**
   - Mọi Entity, Attribute, Relationship, và Constraint đều phải truy xuất trực tiếp từ các yêu cầu `APPROVED` (UC, FR, BR).
   - Đã bổ sung cấu trúc phân cấp chuẩn `Venue -> Branch -> Court` theo đúng `FR-VENUE-005` và `UC-O-004`.
   - Tuyệt đối không tự ý thêm/xóa nghiệp vụ, không tự chốt các mục `TBD` (như Refund Policy `OQ-001`, Review Target `OQ-003`, Notification Channels `OQ-006`, Reschedule Policy `OQ-005`, Operating Schedule Scope `TBD-DM-006`). Các trường hợp chưa chốt được ghi nhận rõ `TBD — Data Modeling Decision Required`.
2. **Trình Bày Mức Logical (Zero Physical Type Leakage):**
   - Tập trung định nghĩa Thực thể (Entity), Thuộc tính nghiệp vụ (Attribute), Mối quan hệ (Relationship), Cấp số (Cardinality), và Ràng buộc nghiệp vụ (Business Constraint).
   - Loại bỏ hoàn toàn các kiểu dữ liệu vật lý (`string`, `int`, `decimal`, `date`, `timestamp`, `VARCHAR`, `DATETIME`, `BIGINT`, etc.) khỏi sơ đồ Mermaid ERD và các bảng mô tả. Không chứa SQL `CREATE TABLE`, ORM models (Sequelize/Prisma), hay API/Controller/Service code.
3. **Bảo Lưu Chuẩn Xác Trạng Thái Đơn Hàng:**
   - Bảo lưu tuyệt đối **tập 8 trạng thái** đơn đặt sân chuẩn: `AVAILABLE`, `HOLDING`, `PAYMENT_PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `PAYMENT_FAILED`.
4. **Phân Định Phạm Vi Core MVP vs Extended Model:**
   - Tách biệt rõ ràng **13 thực thể thuộc phạm vi Cốt lõi MVP (Core MVP)** với các thực thể Mở rộng/Tương lai (Optional/Future).

---

## 2. PHÂN TÍCH ỨNG VIÊN THỰC THỂ (ENTITY CANDIDATE ANALYSIS)

Dưới đây là bảng phân tích toàn bộ các ứng viên thực thể được sàng lọc từ Task 01.01 đến Task 01.04:

| Candidate Entity | Nguồn Nghiệp Vụ | Cần Thiết? | Quyết Định | Lý Do Nghiệp Vụ |
|---|---|---|---|---|
| **User** | FR-AUTH-001..006, BR-AUTH-001..004 | Có | Core Entity | Lưu trữ thông tin tài khoản người dùng, vai trò (`CUSTOMER`, `OWNER`, `ADMIN`) và trạng thái xác thực. |
| **OwnerApplication** | FR-CUST-006, FR-ADMIN-001, BR-USER-002 | Có | Core Entity | Quản lý đơn đăng ký nâng cấp tài khoản từ Customer lên Owner và lịch sử duyệt của Admin. |
| **Venue** | FR-VENUE-001..004, BR-VENUE-001..002 | Có | Core Entity | Quản lý thông tin thương hiệu/đơn vị cơ sở thể thao do Owner sở hữu. |
| **Branch** | FR-VENUE-005, UC-O-004 | Có | Core Entity | Quản lý các chi nhánh/địa điểm cụ thể trực thuộc Venue (Phân cấp `Venue -> Branch -> Court`). |
| **Court** | FR-COURT-001..003, BR-COURT-001 | Có | Core Entity | Quản lý thông tin sân con trực thuộc Branch, loại môn thể thao và trạng thái vận hành/bảo trì. |
| **OperatingSchedule** | FR-SCHED-001..002, BR-SCHED-001, BR-PRICE-001 | Có | Core Entity | Cấu hình khung giờ mở/đóng cửa và bảng giá giờ chơi. Scope áp dụng giữ `TBD — Refer to TBD-DM-006`. |
| **SlotBlocking** | FR-SCHED-003, BR-SCHED-001 | Có | Core Entity | Quản lý các slot giờ chơi bị Owner khóa thủ công đối với slot đang `AVAILABLE`. |
| **Booking** | FR-BOOK-001..009, BR-BOOK-001..014 | Có | Core Entity | Thực thể trung tâm lưu trữ thông tin đặt sân, giữ chỗ 10 phút, trạng thái đơn và thời gian sử dụng. |
| **Payment** | FR-PAY-001..002, BR-PAY-001..003 | Có | Core Entity | Quản lý giao dịch thanh toán MoMo, xác thực Server Callback (IPN) ngầm và trạng thái tiền. |
| **Review** | FR-REVIEW-001, BR-REVIEW-001..002 | Có | Core Entity | Ghi nhận đánh giá sao và bình luận của Customer sau khi hoàn thành đơn `COMPLETED`. |
| **Notification** | FR-NOTI-001, BR-NOTI-001..002 | Có | Core Entity | Ghi nhận các thông báo hệ thống tạo ra gửi tới người dùng (OTP, Booking Confirmed, Cancelled, Expired). |
| **FavoriteVenue** | FR-CUST-002, UC-C-010 | Có | Core Entity | Lưu trữ danh sách các cơ sở thể thao yêu thích được Customer đánh dấu bookmark (`UC-C-010`). |
| **AuditLog** | FR-ADMIN-009, UC-A-010, UC-O-010 | Có | Core Entity | Ghi vết nhật ký các thao tác nhạy cảm của Admin và Owner phục vụ giám sát. |
| **ServiceItem** | FR-OWNER-005, UC-O-014 | Có | Optional Entity | Dịch vụ đi kèm tại sân (thuê vợt, nước uống). Thuộc phạm vi MVP Candidate / Optional. |
| **PromotionCoupon** | FR-OWNER-005, FR-BOOK-002, UC-O-014 | Có | Optional Entity | Mã giảm giá ưu đãi do Owner/Hệ thống phát hành. Thuộc phạm vi MVP Candidate / Optional. |
| **RescheduleRequest** | FR-CUST-005, UC-C-018, OQ-005 | Không (Core) | Future Entity | Yêu cầu dời lịch chơi. Thuộc phạm vi tính năng Tương lai (`FUTURE / OQ-005`). |
| **Guest** | FR-GUEST-001..004 | Không | Không Tạo Entity | Guest là người dùng chưa đăng nhập, không cần lưu trữ tài khoản trong cơ sở dữ liệu. |

---

## 3. ĐẶC TẢ CHI TIẾT CÁC THỰC THỂ CỐT LÕI (CORE MVP ENTITIES)

### 3.1. ENTITY: USER

#### Purpose
Đại diện cho tài khoản định danh người dùng trong hệ thống, bao gồm thông tin xác thực, thông tin cá nhân, vai trò chính (`CUSTOMER`, `OWNER`, `ADMIN`) và trạng thái kích hoạt tài khoản.

#### Source
`FR-AUTH-001` -> `FR-AUTH-006`, `FR-CUST-001`, `BR-AUTH-001` -> `BR-AUTH-004`, `BR-USER-001` -> `BR-USER-003`, `UC-C-001` -> `UC-C-007`.

#### Key Business Attributes

| Attribute | Meaning | Required? | Notes / Business Rules |
|---|---|---|---|
| **User Identifier** | Mã định danh duy nhất của người dùng | Required | Business Key |
| **Full Name** | Họ và tên đầy đủ | Required | `FR-AUTH-001` |
| **Email Address** | Địa chỉ Email người dùng | Required | Email thực tế nhận mã OTP xác thực (`BR-AUTH-001`) |
| **Phone Number** | Số điện thoại liên hệ | Required | `FR-AUTH-001` |
| **Password Credential** | Thông tin xác thực mật khẩu | Required | Được bảo mật và xác minh qua `FR-AUTH-003` |
| **Primary Role** | Vai trò chính của người dùng | Required | Nhận giá trị `CUSTOMER`, `OWNER`, hoặc `ADMIN` (`BR-USER-003`) |
| **Account Status** | Trạng thái hoạt động tài khoản | Required | Nhận giá trị `UNVERIFIED`, `ACTIVE`, `SUSPENDED` (`BR-AUTH-003`) |
| **Email Verified Timestamp** | Thời điểm xác thực OTP Email | Optional | Ghi nhận khi tài khoản chuyển từ `UNVERIFIED` sang `ACTIVE` |
| **Created Timestamp** | Thời điểm khởi tạo tài khoản | Required | Ghi nhận mốc thời gian đăng ký |

#### Relationships

| Related Entity | Relationship | Cardinality | Optionality | Notes |
|---|---|---|---|---|
| **OwnerApplication** | submits | 1 : N | Optional | Customer gửi đơn xin làm Owner |
| **Venue** | owns | 1 : N | Optional | Owner sở hữu 1 hoặc nhiều Venue |
| **SlotBlocking** | creates | 1 : N | Optional | Owner khởi tạo lịch khóa slot |
| **Booking** | creates | 1 : N | Optional | Customer tạo đơn đặt sân |
| **Review** | submits | 1 : N | Optional | Customer gửi đánh giá (`FR-REVIEW-001`) |
| **FavoriteVenue** | marks | 1 : N | Optional | Customer lưu Venue yêu thích (`UC-C-010`) |
| **Notification** | receives | 1 : N | Optional | Người dùng nhận thông báo |
| **AuditLog** | executes | 1 : N | Optional | Actor (Admin/Owner) thực hiện thao tác nhạy cảm |

#### Business Constraints
- Mỗi Email chỉ gắn liền với một tài khoản duy nhất.
- Tài khoản mới tạo mặc định có `Primary Role = CUSTOMER` và `Account Status = UNVERIFIED`.
- Chỉ người dùng có `Account Status = ACTIVE` mới được phép đăng nhập (`BR-AUTH-003`).

---

### 3.2. ENTITY: OWNER_APPLICATION

#### Purpose
Lưu trữ thông tin đơn đăng ký đối tác (nâng cấp từ tài khoản `CUSTOMER` lên `OWNER`) và ghi nhận trạng thái xét duyệt của Admin.

#### Source
`FR-CUST-006`, `FR-ADMIN-001`, `BR-USER-002`, `UC-O-001`, `UC-A-002`.

#### Key Business Attributes

| Attribute | Meaning | Required? | Notes / Business Rules |
|---|---|---|---|
| **Application Identifier** | Mã định danh đơn đăng ký | Required | Business Key |
| **Applicant User Identifier** | Mã người dùng gửi đơn | Required | Tham chiếu đến `User` (Phải là Customer) |
| **Business License / ID Info** | Thông tin xác minh doanh nghiệp/cá nhân | Required | `FR-CUST-006` |
| **Application Status** | Trạng thái xét duyệt | Required | Nhận giá trị `PENDING_REVIEW`, `APPROVED`, `REJECTED` |
| **Reviewer Admin Identifier** | Mã Admin thực hiện duyệt | Optional | Tham chiếu đến `User` (Admin) |
| **Rejection Reason** | Lý do từ chối đăng ký | Optional | Bắt buộc nhập khi Status = `REJECTED` |
| **Submitted Timestamp** | Thời điểm gửi đơn | Required | Ghi nhận thời gian nộp đơn |
| **Reviewed Timestamp** | Thời điểm Admin xử lý đơn | Optional | Ghi nhận thời gian Admin duyệt/từ chối |

#### Relationships

| Related Entity | Relationship | Cardinality | Optionality | Notes |
|---|---|---|---|---|
| **User (Customer)** | submitted by | N : 1 | Required | Đơn được gửi từ duy nhất 1 Customer |
| **User (Admin)** | reviewed by | N : 1 | Optional | Đơn được xét duyệt bởi 1 Admin |

#### Business Constraints
- Đơn khởi tạo ở trạng thái `PENDING_REVIEW`.
- Khi Status chuyển sang `APPROVED`, `Primary Role` của Applicant User tự động cập nhật thành `OWNER` (`BR-USER-002`).

---

### 3.3. ENTITY: VENUE

#### Purpose
Đại diện cho Thương hiệu / Đơn vị cơ sở thể thao do Owner sở hữu và quản lý, là thực thể cấp cha quản lý danh sách các Chi nhánh (`Branch`).

#### Source
`FR-VENUE-001` -> `FR-VENUE-004`, `FR-ADMIN-002`, `FR-ADMIN-004`, `BR-VENUE-001` -> `BR-VENUE-002`, `UC-O-003`, `UC-A-003`.

#### Key Business Attributes

| Attribute | Meaning | Required? | Notes / Business Rules |
|---|---|---|---|
| **Venue Identifier** | Mã định danh cơ sở thể thao | Required | Business Key |
| **Owner User Identifier** | Mã Owner quản lý | Required | Tham chiếu đến `User` (Role phải là Owner) |
| **Venue Name** | Tên thương hiệu/cơ sở thể thao | Required | `FR-VENUE-001` |
| **Contact Phone Number** | Số điện thoại hotline đại diện | Required | `FR-VENUE-001` |
| **Venue Description** | Mô tả giới thiệu thương hiệu sân | Optional | `FR-VENUE-001` |
| **Operating Status** | Trạng thái duyệt & hoạt động | Required | Nhận giá trị `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED` |
| **Created Timestamp** | Thời điểm tạo thông tin Venue | Required | Ghi nhận thời gian tạo |

#### Relationships

| Related Entity | Relationship | Cardinality | Optionality | Notes |
|---|---|---|---|---|
| **User (Owner)** | owned by | N : 1 | Required | Thuộc sở hữu của duy nhất 1 Owner (`BR-VENUE-002`) |
| **Branch** | contains | 1 : N | Required | Chứa 1 hoặc nhiều Chi nhánh cụ thể (`FR-VENUE-005`) |
| **FavoriteVenue** | bookmarked in | 1 : N | Optional | Khách hàng lưu vào yêu thích (`UC-C-010`) |

#### Business Constraints
- Venue mới tạo khởi tạo ở trạng thái `PENDING`.
- Chỉ các Venue có `Operating Status = APPROVED` mới được hiển thị công khai cho Customer tìm kiếm và đặt lịch (`BR-VENUE-001`).
- Đảm bảo tính cô lập tài nguyên: Owner A chỉ quản lý các Venue do Owner A sở hữu (`BR-VENUE-002`).

---

### 3.4. ENTITY: BRANCH

#### Purpose
Đại diện cho Chi nhánh / Địa điểm cụ thể thuộc một Cơ sở thể thao (`Venue`), trực tiếp quản lý địa chỉ vị trí và các sân con (`Court`).

#### Source
`FR-VENUE-005`, `UC-O-004`.

#### Key Business Attributes

| Attribute | Meaning | Required? | Notes / Business Rules |
|---|---|---|---|
| **Branch Identifier** | Mã định danh chi nhánh | Required | Business Key |
| **Venue Identifier** | Mã Venue cấp cha | Required | Tham chiếu đến `Venue` |
| **Branch Name** | Tên chi nhánh (ví dụ: Chi nhánh Quận 1) | Required | `FR-VENUE-005` |
| **Street Address** | Địa chỉ chi nhánh | Required | Địa chỉ thực tế của chi nhánh |
| **Ward / District / City** | Phường/Xã, Quận/Huyện, Tỉnh/Thành phố | Required | Phục vụ tìm kiếm và lọc vị trí |
| **Geo Coordinates** | Tọa độ địa lý (Vĩ độ, Kinh độ) | Optional | Phục vụ hiển thị bản đồ (`FR-GUEST-003`) |
| **Branch Phone** | Số điện thoại liên hệ chi nhánh | Required | `FR-VENUE-005` |
| **Branch Operating Status** | Trạng thái hoạt động chi nhánh | Required | Nhận giá trị `ACTIVE`, `INACTIVE` |
| **Created Timestamp** | Thời điểm khởi tạo chi nhánh | Required | Ghi nhận thời gian tạo |

#### Relationships

| Related Entity | Relationship | Cardinality | Optionality | Notes |
|---|---|---|---|---|
| **Venue** | belongs to | N : 1 | Required | Trực thuộc duy nhất 1 Venue cấp cha |
| **Court** | manages | 1 : N | Required | Quản lý 1 hoặc nhiều sân con (`Court`) |

#### Business Constraints
- Phân cấp bắt buộc: `Owner -> Venue -> Branch -> Court`.

---

### 3.5. ENTITY: COURT

#### Purpose
Đại diện cho Sân con cụ thể thuộc một Chi nhánh (`Branch`), dùng để tổ chức các trận đấu và xếp lịch đặt chỗ.

#### Source
`FR-COURT-001` -> `FR-COURT-003`, `BR-COURT-001`, `UC-O-005`, `UC-O-009`.

#### Key Business Attributes

| Attribute | Meaning | Required? | Notes / Business Rules |
|---|---|---|---|
| **Court Identifier** | Mã định danh sân con | Required | Business Key |
| **Branch Identifier** | Mã Chi nhánh trực thuộc | Required | Tham chiếu đến `Branch` |
| **Court Name / Code** | Tên hoặc Số hiệu sân con (ví dụ: Sân A1) | Required | `FR-COURT-001` |
| **Sport Category** | Bộ môn thể thao (Cầu lông, Bóng đá, Pickleball) | Required | Phục vụ tìm kiếm theo môn thể thao |
| **Court Operational Status** | Trạng thái vận hành sân con | Required | Nhận giá trị `ACTIVE`, `MAINTENANCE`, `INACTIVE` |
| **Surface Features** | Đặc điểm mặt sân (Sân thảm, Sân gỗ, Trong nhà) | Optional | `FR-COURT-002` |

#### Relationships

| Related Entity | Relationship | Cardinality | Optionality | Notes |
|---|---|---|---|---|
| **Branch** | belongs to | N : 1 | Required | Thuộc về duy nhất 1 Chi nhánh (`Branch`) |
| **Booking** | reserved in | 1 : N | Optional | Nhận các đơn đặt sân qua thời gian |
| **SlotBlocking** | blocked in | 1 : N | Optional | Nhận các lịch khóa thủ công |

#### Business Constraints
- Khi `Court Operational Status = MAINTENANCE`, tất cả các slot giờ chơi của sân con này lập tức ẩn khỏi bảng khả dụng của Customer (`BR-COURT-001`).

---

### 3.6. ENTITY: OPERATING_SCHEDULE

#### Purpose
Cấu hình khung giờ mở/đóng cửa và khung giá dịch vụ theo ngày trong tuần hoặc ngày đặc biệt.

#### Source
`FR-SCHED-001`, `FR-SCHED-002`, `BR-PRICE-001`, `UC-O-006`, `UC-O-007`.

#### Key Business Attributes

| Attribute | Meaning | Required? | Notes / Business Rules |
|---|---|---|---|
| **Schedule Identifier** | Mã định danh lịch vận hành | Required | Business Key |
| **Schedule Application Scope** | Phạm vi áp dụng lịch vận hành | Required | `TBD — Refer to TBD-DM-006` (Venue / Branch / Court) |
| **Day Of Week / Scope** | Ngày áp dụng trong tuần hoặc Ngày lễ | Required | Ví dụ: Thứ Hai - Thứ Sáu, Cuối tuần |
| **Opening Time** | Giờ mở cửa | Required | Giờ bắt đầu hoạt động trong ngày |
| **Closing Time** | Giờ đóng cửa | Required | Giờ kết thúc hoạt động trong ngày |
| **Base Hourly Price** | Giá cơ bản theo giờ | Required | Giá áp dụng cho khung giờ thường (`BR-PRICE-001`) |
| **Peak Hour Price Rule** | Quy tắc giá khung giờ cao điểm | Optional | Định nghĩa giờ Peak-hour và mức giá điều chỉnh |

#### Relationships

| Related Entity | Relationship | Cardinality | Optionality | Notes |
|---|---|---|---|---|
| *(Target Scope)* | applied to | TBD | Required | Phạm vi áp dụng giữ trạng thái `TBD — Refer to TBD-DM-006` |

---

### 3.7. ENTITY: SLOT_BLOCKING

#### Purpose
Lưu trữ thông tin các slot giờ chơi bị Owner khóa thủ công (do bảo trì đột xuất, sự kiện riêng hoặc khách vãng lai giữ cố định).

#### Source
`FR-SCHED-003`, `BR-SCHED-001`, `UC-O-008`.

#### Key Business Attributes

| Attribute | Meaning | Required? | Notes / Business Rules |
|---|---|---|---|
| **Block Identifier** | Mã định danh lịch khóa | Required | Business Key |
| **Court Identifier** | Mã sân con bị khóa | Required | Tham chiếu đến `Court` |
| **Block Date** | Ngày bị khóa slot | Required | Ngày áp dụng |
| **Start Time** | Giờ bắt đầu khóa | Required | Khung giờ bắt đầu |
| **End Time** | Giờ kết thúc khóa | Required | Khung giờ kết thúc |
| **Block Reason** | Lý do khóa thủ công | Optional | Ví dụ: Bảo trì lưới, Đặt sự kiện |
| **Created By User Identifier** | Mã Owner thực hiện khóa | Required | Tham chiếu đến `User` (Owner) |

#### Relationships

| Related Entity | Relationship | Cardinality | Optionality | Notes |
|---|---|---|---|---|
| **Court** | applied to | N : 1 | Required | Khóa áp dụng cho 1 Court cụ thể |
| **User (Owner)** | created by | N : 1 | Required | Khóa tạo bởi Owner sở hữu |

#### Business Constraints
- Owner chỉ được khóa các slot ở trạng thái `AVAILABLE`. Không được ghi đè khóa lên slot đã có đơn `HOLDING`, `PAYMENT_PENDING`, hoặc `CONFIRMED` (`BR-SCHED-001`).

---

### 3.8. ENTITY: BOOKING

#### Purpose
Thực thể trung tâm lưu trữ thông tin đơn đặt sân, quản lý đếm ngược giữ chỗ 10 phút, nguồn khởi tạo và toàn bộ vòng đời chuyển trạng thái của đơn hàng.

#### Source
`FR-BOOK-001` -> `FR-BOOK-009`, `BR-BOOK-001` -> `BR-BOOK-014`, `UC-C-014` -> `UC-C-017`, `UC-O-011`, `UC-S-001` -> `UC-S-006`.

#### Key Business Attributes

| Attribute | Meaning | Required? | Notes / Business Rules |
|---|---|---|---|
| **Booking Identifier** | Mã định danh đơn đặt sân | Required | Business Key |
| **Customer User Identifier** | Mã khách hàng đặt sân | Conditional | Bắt buộc đối với Online Booking (`Required`); Không bắt buộc với Manual Offline Booking (`Optional`) |
| **Court Identifier** | Mã sân con được đặt | Required | Tham chiếu đến `Court` |
| **Booking Date** | Ngày sử dụng sân | Required | Ngày diễn ra trận đấu |
| **Start Time** | Giờ bắt đầu chơi | Required | Giờ bắt đầu khung slot |
| **End Time** | Giờ kết thúc chơi | Required | Giờ kết thúc khung slot |
| **Total Amount** | Tổng tiền đơn đặt sân | Required | Tính tự động từ đơn giá slot & dịch vụ (`BR-PAY-003`) |
| **Booking Source** | Nguồn tạo đơn hàng | Required | Nhận giá trị `ONLINE_CUSTOMER` hoặc `MANUAL_OFFLINE` (`BR-OWNER-001`) |
| **Booking Status** | Trạng thái đơn đặt sân | Required | Tuân thủ đúng 8 trạng thái: `AVAILABLE`, `HOLDING`, `PAYMENT_PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `PAYMENT_FAILED` |
| **Hold Expiry Timestamp** | Thời điểm hết hạn 10 phút hold | Optional | Ghi nhận cho đơn ở trạng thái `HOLDING` (`BR-BOOK-002`) |
| **Cancellation Reason** | Lý do hủy đơn đặt sân | Optional | Ghi nhận khi đơn chuyển sang `CANCELLED` |
| **Created Timestamp** | Thời điểm khởi tạo đơn hàng | Required | Mốc thời gian đặt đơn |

#### Relationships

| Related Entity | Relationship | Cardinality | Optionality | Notes |
|---|---|---|---|---|
| **User (Customer)** | placed by | N : 1 | Conditional | Thuộc về 1 Customer (Online Booking) |
| **Court** | booked for | N : 1 | Required | Thuộc về 1 Court cụ thể |
| **Payment** | paid via | 1 : 0..1 | Optional | Liên kết với giao dịch thanh toán MoMo |
| **Review** | reviewed by | 1 : 0..1 | Optional | Liên kết với đánh giá (Khi Status = `COMPLETED`) |

#### Business Constraints
- Ràng buộc chống Double Booking: Cùng một `Court` + `Booking Date` + khung giờ (`Start Time` -> `End Time`) không thể tồn tại hai Booking cùng ở trạng thái hoạt động (`HOLDING`, `PAYMENT_PENDING`, `CONFIRMED`) (`BR-BOOK-003`).
- Thời gian đếm ngược trạng thái `HOLDING` có hiệu lực tối đa đúng 10 phút (`BR-BOOK-002`).

---

### 3.9. ENTITY: PAYMENT

#### Purpose
Quản lý giao dịch thanh toán MoMo kết nối với đơn đặt sân, lưu trữ trạng thái tiền và thông tin xác thực Server Callback ngầm.

#### Source
`FR-PAY-001`, `FR-PAY-002`, `BR-PAY-001` -> `BR-PAY-003`, `UC-C-015`, `UC-S-003`, `UC-S-004`.

#### Key Business Attributes

| Attribute | Meaning | Required? | Notes / Business Rules |
|---|---|---|---|
| **Payment Identifier** | Mã định danh giao dịch thanh toán | Required | Business Key |
| **Booking Identifier** | Mã đơn đặt sân tương ứng | Required | Tham chiếu đến `Booking` |
| **Payment Gateway Method** | Phương thức cổng thanh toán | Required | Nhận giá trị `MOMO` trong phạm vi MVP (`BR-PAY-001`) |
| **Transaction Reference** | Mã giao dịch tham chiếu từ MoMo | Optional | Mã giao dịch MoMo cấp sau khi tạo phiên |
| **Payment Amount** | Số tiền giao dịch thanh toán | Required | Số tiền gửi qua cổng MoMo |
| **Payment Status** | Trạng thái giao dịch thanh toán | Required | Nhận giá trị `PENDING`, `PAID`, `FAILED` |
| **Callback Verified Timestamp**| Thời điểm xác thực MoMo Callback | Optional | Ghi mốc thời gian nhận Server Callback ngầm |

#### Relationships

| Related Entity | Relationship | Cardinality | Optionality | Notes |
|---|---|---|---|---|
| **Booking** | belongs to | N : 1 | Required | Khi một Payment tồn tại, nó bắt buộc phải thuộc về đúng 1 Booking |

#### Business Constraints
- **MoMo Server Callback (IPN)** gửi trực tiếp tới hệ thống là nguồn xác thực duy nhất (Source of Truth) để cập nhật `Payment Status = PAID` và chuyển đơn đặt sân sang `CONFIRMED` (`BR-PAY-002`, `BR-BOOK-005`).

---

### 3.10. ENTITY: REVIEW

#### Purpose
Ghi nhận đánh giá phản hồi (điểm sao và bình luận) của Customer sau khi đã trải nghiệm và hoàn thành lượt chơi tại sân.

#### Source
`FR-REVIEW-001`, `BR-REVIEW-001`, `BR-REVIEW-002`, `UC-C-019`.

#### Key Business Attributes

| Attribute | Meaning | Required? | Notes / Business Rules |
|---|---|---|---|
| **Review Identifier** | Mã định danh đánh giá | Required | Business Key |
| **Customer User Identifier** | Mã khách hàng gửi đánh giá | Required | Tham chiếu đến `User` (Customer) |
| **Booking Identifier** | Mã đơn đặt sân đã chơi | Required | Tham chiếu đến `Booking` (Phải ở trạng thái `COMPLETED`) |
| **Rating Score** | Số sao đánh giá (1 đến 5 sao) | Required | Điểm số đánh giá chất lượng |
| **Comment Text** | Nội dung bình luận chi tiết | Optional | `FR-REVIEW-001` |
| **Review Target Scope** | Đối tượng nhận đánh giá | Required | `TBD — Refer to OQ-003` (Venue vs Court) |
| **Submitted Timestamp** | Thời điểm gửi đánh giá | Required | Ghi nhận thời gian tạo đánh giá |

#### Relationships

| Related Entity | Relationship | Cardinality | Optionality | Notes |
|---|---|---|---|---|
| **User (Customer)** | written by | N : 1 | Required | Viết bởi duy nhất 1 Customer |
| **Booking** | belongs to | N : 1 | Required | Khi một Review tồn tại, nó bắt buộc thuộc về đúng 1 Booking (`BR-REVIEW-001`) |

#### Business Constraints
- Chỉ đơn đặt sân ở trạng thái `COMPLETED` mới có quyền khởi tạo Review (`BR-REVIEW-001`).

---

### 3.11. ENTITY: NOTIFICATION

#### Purpose
Ghi nhận danh sách các thông báo tự động do hệ thống tạo ra để phát tới người dùng (Xác thực OTP, Đặt sân thành công, Hủy đơn, Hết hạn giữ chỗ).

#### Source
`FR-NOTI-001`, `BR-NOTI-001`, `BR-NOTI-002`, `UC-S-005`.

#### Key Business Attributes

| Attribute | Meaning | Required? | Notes / Business Rules |
|---|---|---|---|
| **Notification Identifier** | Mã định danh thông báo | Required | Business Key |
| **Recipient User Identifier** | Mã người dùng nhận thông báo | Required | Tham chiếu đến `User` |
| **Notification Event Type** | Loại sự kiện phát thông báo | Required | Nhận giá trị `OTP_VERIFY`, `BOOKING_CONFIRMED`, `BOOKING_CANCELLED`, `HOLD_EXPIRED` |
| **Notification Message** | Nội dung thông báo hiển thị | Required | `FR-NOTI-001` |
| **Read Status** | Trạng thái đọc thông báo | Required | Nhận giá trị `UNREAD`, `READ` |
| **Created Timestamp** | Thời điểm tạo thông báo | Required | Mốc thời gian hệ thống phát thông báo |

#### Relationships

| Related Entity | Relationship | Cardinality | Optionality | Notes |
|---|---|---|---|---|
| **User** | sent to | N : 1 | Required | Gửi tới 1 User xác định |

---

### 3.12. ENTITY: FAVORITE_VENUE

#### Purpose
Thực thể liên kết biểu diễn mối quan hệ nhiều-nhiều (M:N) giữa Customer và các Cơ sở thể thao (`Venue`) được đánh dấu yêu thích.

#### Source
`FR-CUST-002`, `UC-C-010`.

#### Key Business Attributes

| Attribute | Meaning | Required? | Notes / Business Rules |
|---|---|---|---|
| **Customer User Identifier** | Mã khách hàng lưu yêu thích | Required | Tham chiếu đến `User` |
| **Venue Identifier** | Mã Venue được lưu yêu thích | Required | Tham chiếu đến `Venue` |
| **Added Timestamp** | Thời điểm lưu vào danh sách | Required | Ghi nhận thời gian bookmark (`UC-C-010`) |

---

### 3.13. ENTITY: AUDIT_LOG

#### Purpose
Ghi vết nhật ký các thao tác nhạy cảm của Admin và Owner (Phê duyệt Venue, khóa tài khoản, duyệt Owner, cập nhật bảng giá) phục vụ công tác giám sát hệ thống.

#### Source
`FR-ADMIN-009`, `UC-A-010`, `UC-O-010`.

#### Key Business Attributes

| Attribute | Meaning | Required? | Notes / Business Rules |
|---|---|---|---|
| **Audit Identifier** | Mã định danh nhật ký | Required | Business Key |
| **Actor User Identifier** | Mã người dùng thực hiện thao tác | Required | Tham chiếu đến `User` (Admin hoặc Owner) |
| **Action Performed** | Thao tác thực hiện | Required | Ví dụ: `APPROVE_VENUE`, `SUSPEND_USER`, `UPDATE_PRICING` |
| **Target Entity Type** | Loại thực thể bị tác động | Required | Ví dụ: `User`, `Venue`, `Court`, `Booking` |
| **Target Entity Identifier** | Mã thực thể bị tác động | Required | ID của thực thể bị tác động |
| **Action Details** | Chi tiết thông số ghi nhận | Optional | Mô tả chi tiết lý do/thông tin tác động |
| **Created Timestamp** | Thời điểm thực hiện thao tác | Required | Mốc thời gian thao tác |

#### Relationships

| Related Entity | Relationship | Cardinality | Optionality | Notes |
|---|---|---|---|---|
| **User** | executed by | N : 1 | Required | Thao tác được thực hiện bởi 1 Actor User (Admin hoặc Owner) |

---

## 4. MA TRẬN MỐI QUAN HỆ & CẤP SỐ (RELATIONSHIP & CARDINALITY MATRIX)

| Thực Thể A | Mối Quan Hệ (Relationship) | Thực Thể B | Cardinality | Optionality | Nguồn Quy Tắc / Requirements |
|---|---|---|---|---|---|
| **User (Customer)** | nộp đơn nâng cấp | **OwnerApplication** | `1 : N` | Optional | `FR-CUST-006`, `BR-USER-002` |
| **User (Admin)** | xét duyệt đơn | **OwnerApplication** | `1 : N` | Optional | `FR-ADMIN-001`, `BR-USER-002` |
| **User (Owner)** | sở hữu cơ sở | **Venue** | `1 : N` | Optional | `FR-VENUE-001`, `BR-VENUE-002` |
| **User (Owner)** | khởi tạo lịch khóa | **SlotBlocking** | `1 : N` | Optional | `FR-SCHED-003`, `BR-SCHED-001` |
| **Venue** | chứa các chi nhánh | **Branch** | `1 : N` | Required | `FR-VENUE-005`, `UC-O-004` |
| **Branch** | quản lý các sân con | **Court** | `1 : N` | Required | `FR-COURT-001`, `BR-VENUE-001` |
| **OperatingSchedule**| phạm vi áp dụng | *(Target Scope)* | `TBD` | Required | `FR-SCHED-001`, `TBD-DM-006` |
| **Court** | có lịch khóa thủ công| **SlotBlocking** | `1 : N` | Optional | `FR-SCHED-003`, `BR-SCHED-001` |
| **Court** | nhận đơn đặt sân | **Booking** | `1 : N` | Optional | `FR-BOOK-001`, `BR-BOOK-003` |
| **User (Customer)** | khởi tạo đơn đặt | **Booking** | `1 : N` | Optional | `FR-BOOK-001`, `BR-BOOK-001` |
| **User (Customer)** | viết đánh giá | **Review** | `1 : N` | Optional | `FR-REVIEW-001`, `BR-REVIEW-001` |
| **Booking** | thanh toán qua | **Payment** | `1 : 0..1` *(TBD 1:N)* | Optional | `FR-PAY-001`, `BR-PAY-002` |
| **Booking** | nhận đánh giá | **Review** | `1 : 0..1` | Optional | `FR-REVIEW-001`, `BR-REVIEW-001` |
| **User** | nhận thông báo | **Notification** | `1 : N` | Optional | `FR-NOTI-001`, `BR-NOTI-001` |
| **User (Customer)** | đánh dấu yêu thích | **Venue** | `M : N` | Optional | `FR-CUST-002`, `UC-C-010` (qua `FavoriteVenue`) |
| **User (Actor)** | tạo nhật ký | **AuditLog** | `1 : N` | Optional | `FR-ADMIN-009`, `UC-A-010`, `UC-O-010` |

---

## 5. MA TRẬN RÀNG BUỘC NGHIỆP VỤ DỮ LIỆU (BUSINESS CONSTRAINT MATRIX)

| Ràng Buộc Nghiệp Vụ | Các Thực Thể Liên Quan | Quy Tắc Nghiệp Vụ | Nguồn Tham Chiếu |
|---|---|---|---|
| **Chống Đặt Trùng Sân (Double Booking)** | `Booking`, `Court` | Cùng một Court + Booking Date + Khung giờ không thể có 2 Booking hợp lệ cùng giữ (`HOLDING`, `PAYMENT_PENDING`, `CONFIRMED`). | `BR-BOOK-003`, `FR-BOOK-004` |
| **Giữ Chỗ Đếm Ngược 10 Phút** | `Booking` | Đơn hàng ở trạng thái `HOLDING` có thuộc tính `Hold Expiry Timestamp` giới hạn tối đa đúng 10 phút. | `BR-BOOK-002`, `FR-BOOK-003` |
| **Xác Thực Thanh Toán Nguồn Sự Thật** | `Booking`, `Payment` | Đơn hàng chuyển sang `CONFIRMED` chỉ khi `Payment Status` đổi thành `PAID` thông qua MoMo Server Callback (IPN) ngầm. | `BR-PAY-002`, `BR-BOOK-005`, `FR-PAY-002` |
| **Khóa Slot Thủ Công Chiếm Giữ** | `SlotBlocking`, `Court`, `Booking` | SlotBlocking chỉ được áp dụng trên các slot ở trạng thái `AVAILABLE`. Không được ghi đè lên slot đã có Booking giữ chỗ hoặc đặt. | `BR-SCHED-001`, `FR-SCHED-003` |
| **Đánh Giá Đơn Hoàn Thành** | `Review`, `Booking`, `User` | Review chỉ có thể tạo khi đơn đặt sân liên kết đạt trạng thái `COMPLETED` và người gửi đúng là Customer sở hữu đơn. | `BR-REVIEW-001`, `FR-REVIEW-001` |
| **Cô Lập Dữ Liệu Theo Owner (Tenant Isolation)** | `User`, `Venue`, `Branch`, `Court`, `Booking` | Owner A chỉ được truy vấn và thao tác trên Venue A -> Branch A -> Court A -> Booking A có `Owner User Identifier` thuộc chính Owner A. tuyệt đối không truy cập tài nguyên của Owner B. | `BR-VENUE-002`, `FR-VENUE-002` |

---

## 6. SƠ ĐỒ SỰ THỂ LOGICAL CORE MVP (CORE MVP ERD - EXACT 13 CORE ENTITIES)

Dưới đây là sơ đồ Mermaid ERD mô tả Mô hình Dữ liệu Logical cho **đúng 13 thực thể Cốt lõi MVP (Core MVP)**. Sơ đồ đã được loại bỏ hoàn toàn các kiểu dữ liệu vật lý (`string`, `int`, `decimal`, `timestamp`, `date`) và bổ sung đầy đủ `OPERATING_SCHEDULE` (Entity độc lập do scope áp dụng TBD) cùng mối quan hệ `USER 1:N SLOT_BLOCKING` và `USER 1:N REVIEW`:

```mermaid
erDiagram
    USER ||--o{ OWNER_APPLICATION : "submits (Applicant)"
    USER ||--o{ OWNER_APPLICATION : "reviews (Admin)"
    USER ||--o{ VENUE : "owns (Owner)"
    USER ||--o{ SLOT_BLOCKING : "creates (Owner)"
    USER ||--o{ BOOKING : "places (Customer)"
    USER ||--o{ REVIEW : "writes (Customer)"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ FAVORITE_VENUE : "bookmarks"
    USER ||--o{ AUDIT_LOG : "executes (Actor)"

    VENUE ||--o{ BRANCH : "contains"
    VENUE ||--o{ FAVORITE_VENUE : "bookmarked_in"

    BRANCH ||--o{ COURT : "manages"

    COURT ||--o{ SLOT_BLOCKING : "applied_to"
    COURT ||--o{ BOOKING : "booked_for"

    BOOKING ||--o| PAYMENT : "paid_via"
    BOOKING ||--o| REVIEW : "reviewed_by"

    USER {
        user_id PK
        full_name
        email
        phone_number
        primary_role
        account_status
        email_verified_at
        created_at
    }

    OWNER_APPLICATION {
        application_id PK
        applicant_user_id FK
        business_info
        application_status
        reviewer_admin_id FK
        rejection_reason
        submitted_at
        reviewed_at
    }

    VENUE {
        venue_id PK
        owner_user_id FK
        venue_name
        contact_phone
        operating_status
        created_at
    }

    BRANCH {
        branch_id PK
        venue_id FK
        branch_name
        street_address
        ward_district_city
        branch_phone
        branch_status
        created_at
    }

    COURT {
        court_id PK
        branch_id FK
        court_name
        sport_category
        court_status
    }

    OPERATING_SCHEDULE {
        schedule_id PK
        application_scope_tbd
        day_scope
        opening_time
        closing_time
        base_hourly_price
    }

    SLOT_BLOCKING {
        block_id PK
        court_id FK
        block_date
        start_time
        end_time
        block_reason
        created_by_owner_id FK
    }

    BOOKING {
        booking_id PK
        customer_user_id FK
        court_id FK
        booking_date
        start_time
        end_time
        total_amount
        booking_source
        booking_status
        hold_expiry_at
        created_at
    }

    PAYMENT {
        payment_id PK
        booking_id FK
        payment_method
        transaction_ref
        payment_amount
        payment_status
        callback_verified_at
    }

    REVIEW {
        review_id PK
        customer_user_id FK
        booking_id FK
        rating_score
        comment_text
        review_target_scope
        submitted_at
    }

    NOTIFICATION {
        notification_id PK
        recipient_user_id FK
        event_type
        message_content
        read_status
        created_at
    }

    FAVORITE_VENUE {
        customer_user_id FK
        venue_id FK
        added_at
    }

    AUDIT_LOG {
        audit_id PK
        actor_user_id FK
        action_performed
        target_entity_type
        target_entity_id
        created_at
    }
```

---

## 7. MÔ HÌNH DỮ LIỆU MỞ RỘNG (EXTENDED / FUTURE DATA MODEL)

Dưới đây là các thực thể thuộc phạm vi Tùy chọn (Optional / MVP Candidate) hoặc Phát triển trong Tương lai (Future Scope), được tách riêng để không làm phức tạp Core MVP ERD:

### 7.1. ENTITY: SERVICE_ITEM (Optional / MVP Candidate)
- **Purpose:** Quản lý danh mục dịch vụ đi kèm do Owner tạo (thuê vợt, bán nước uống, bóng chơi).
- **Source:** `FR-OWNER-005`, `UC-O-014`.
- **Key Attributes:** Service Identifier, Venue Identifier, Service Name, Unit Price, Availability Status.
- **Relationship:** `Venue 1 : N ServiceItem`.

### 7.2. ENTITY: PROMOTION_COUPON (Optional / MVP Candidate)
- **Purpose:** Quản lý các mã giảm giá, khuyến mãi áp dụng khi đặt sân.
- **Source:** `FR-OWNER-005`, `FR-BOOK-002`, `UC-O-014`.
- **Key Attributes:** Coupon Identifier, Venue Identifier, Coupon Code, Discount Percentage / Amount, Valid From, Valid To, Usage Limit.
- **Relationship:** `Venue 1 : N PromotionCoupon`.

### 7.3. ENTITY: RESCHEDULE_REQUEST (Future Scope)
- **Purpose:** Quản lý lịch sử và yêu cầu dời lịch chơi đối với đơn `CONFIRMED`.
- **Source:** `FR-CUST-005`, `UC-C-018`, `OQ-005`.
- **Key Attributes:** Request Identifier, Booking Identifier, New Date, New Start Time, New End Time, Price Difference, Request Status (`PENDING`, `APPROVED`, `REJECTED`).
- **Relationship:** `Booking 1 : N RescheduleRequest`.

---

## 8. CÁC QUYẾT ĐỊNH MÔ HÌNH DỮ LIỆU CHỜ CHỐT (TBD DATA MODEL DECISIONS)

Dưới đây là danh sách các vấn đề mô hình hóa dữ liệu còn giữ trạng thái `TBD` do phụ thuộc vào các quyết định nghiệp vụ chưa chốt (Open Questions):

1. **TBD-DM-001: Review Target Scope Representation (Gắn Đánh Giá):**
   - *Vấn đề:* Đánh giá của khách hàng sẽ được liên kết trực tiếp tới `Venue` hay chi tiết tới từng `Court`?
   - *Tác động:* Cấu trúc thuộc tính `Review Target Scope` và mối quan hệ giữa `Review` với `Venue`/`Court`.
   - *Nguồn tham chiếu:* `OQ-003 Review Target Scope`, `BR-REVIEW-002`.

2. **TBD-DM-002: Cancellation Refund Representation (Lưu Vết Hoàn Tiền):**
   - *Vấn đề:* Khi đơn bị hủy, dữ liệu số tiền hoàn (% hoàn tiền, số tiền thực hoàn) sẽ được lưu trực tiếp trong `Booking` hay tạo thực thể `RefundTransaction` riêng?
   - *Tác động:* Cấu trúc thực thể `Booking` / `Payment`.
   - *Nguồn tham chiếu:* `OQ-001 Cancellation Refund Policy Implementation`, `BR-CANCEL-002`.

3. **TBD-DM-003: Payment Cardinality (Số Lượng Giao Dịch Thanh Toán):**
   - *Vấn đề:* Một `Booking` có quan hệ `1 : 0..1` với `Payment` hay `1 : N` (trong trường hợp cho phép thanh toán lại khi giao dịch trước thất bại)?
   - *Tác động:* Cấp số Cardinality của quan hệ `Booking ↔ Payment`.
   - *Nguồn tham chiếu:* `BR-PAY-001`, `FR-PAY-001`.

4. **TBD-DM-004: Pay-at-venue Representation (Thanh Toán Trả Sau Tại Sân):**
   - *Vấn đề:* Cần bổ sung trạng thái `UNPAID` trong `Payment` hay không nếu Venue cho phép đặt trước trả sau tại sân?
   - *Tác động:* Tập giá trị thuộc tính `Payment Status`.
   - *Nguồn tham chiếu:* `OQ-002 Pay-at-venue Flow Confirmation`, `BR-PAY-004`.

5. **TBD-DM-005: Notification Delivery Representation (Lịch Sử Kênh Phát Thông Báo):**
   - *Vấn đề:* Có cần lưu vết kênh phát thực tế (Email vs SMS vs Push) trong thực thể `Notification` hay không?
   - *Tác động:* Thuộc tính bổ sung của `Notification`.
   - *Nguồn tham chiếu:* `OQ-006 Notification Delivery Channels`, `BR-NOTI-002`.

6. **TBD-DM-006: Operating Schedule Application Scope (Phạm Vi Áp Dụng Lịch Vận Hành):**
   - *Vấn đề:* Lịch vận hành và bảng giá (`OperatingSchedule`) được cấu hình chung ở cấp `Venue`, cấp `Branch` hay chi tiết tới từng `Court`?
   - *Tác động:* Khóa ngoại và quan hệ của `OperatingSchedule`. Giữ nguyên trạng thái TBD, không tự chốt quan hệ cứng.
   - *Nguồn tham chiếu:* `FR-SCHED-001`, `FR-SCHED-002`, `UC-O-006`.

---

## 9. MA TRẬN TRUY VẾT DỮ LIỆU (DATA MODEL TRACEABILITY MATRIX)

| Thực Thể (Entity) | Functional Requirement | Business Rule | Use Case |
|---|---|---|---|
| **User** | FR-AUTH-001 -> FR-AUTH-006, FR-CUST-001 | BR-AUTH-001 -> BR-AUTH-004, BR-USER-001..003 | UC-C-001 -> UC-C-007 |
| **OwnerApplication** | FR-CUST-006, FR-ADMIN-001 | BR-USER-002 | UC-O-001, UC-A-002 |
| **Venue** | FR-VENUE-001 -> FR-VENUE-004, FR-ADMIN-002 | BR-VENUE-001, BR-VENUE-002 | UC-O-003, UC-A-003 |
| **Branch** | FR-VENUE-005 | BR-VENUE-002 | UC-O-004 |
| **Court** | FR-COURT-001 -> FR-COURT-003 | BR-COURT-001 | UC-O-005, UC-O-009 |
| **OperatingSchedule** | FR-SCHED-001, FR-SCHED-002 | BR-PRICE-001 | UC-O-006, UC-O-007 |
| **SlotBlocking** | FR-SCHED-003 | BR-SCHED-001 | UC-O-008 |
| **Booking** | FR-BOOK-001 -> FR-BOOK-009 | BR-BOOK-001 -> BR-BOOK-014 | UC-C-014 -> UC-C-017, UC-O-011 |
| **Payment** | FR-PAY-001, FR-PAY-002 | BR-PAY-001 -> BR-PAY-003 | UC-C-015, UC-S-003 |
| **Review** | FR-REVIEW-001 | BR-REVIEW-001, BR-REVIEW-002 | UC-C-019 |
| **Notification** | FR-NOTI-001 | BR-NOTI-001, BR-NOTI-002 | UC-S-005 |
| **FavoriteVenue** | FR-CUST-002 | N/A | UC-C-010 |
| **AuditLog** | FR-ADMIN-009 | BR-ADMIN-001 | UC-A-010, UC-O-010 |
| **ServiceItem** *(Optional)*| FR-OWNER-005 | N/A | UC-O-014 |
| **PromotionCoupon** *(Optional)*| FR-OWNER-005, FR-BOOK-002 | N/A | UC-O-014 |
| **RescheduleRequest** *(Future)*| FR-CUST-005 | BR-CUST-005 (TBD) | UC-C-018 |

---

## 10. DEFINITION OF DONE (DoD) - TASK 01.05

- [x] Đã tạo file tài liệu tiêu chuẩn: [docs/requirements/05-data-model.md](file:///e:/SportHubAI/docs/requirements/05-data-model.md).
- [x] Đã bổ sung thực thể `Branch` và cập nhật chính xác phân cấp dữ liệu `Venue -> Branch -> Court` theo đúng `FR-VENUE-005` và `UC-O-004`.
- [x] Đã đưa `OPERATING_SCHEDULE` vào sơ đồ Mermaid ERD dưới dạng thực thể độc lập; giữ nguyên `Operating Schedule Application Scope` là `TBD — Refer to TBD-DM-006` do `OQ-006` chưa được quyết định.
- [x] Chuẩn hóa chiều quan hệ và Optionality cho `Payment` (`Booking 1 : 0..1 Payment | Optional` ở góc nhìn Booking; `Payment N : 1 Booking | Required` ở góc nhìn Payment) và `Review` (`Booking 1 : 0..1 Review | Optional` ở góc nhìn Booking; `Review N : 1 Booking | Required` ở góc nhìn Review).
- [x] Bổ sung quan hệ `User (Customer) writes Review | 1 : N | Optional` vào Relationship Matrix đồng bộ hoàn toàn với Entity Specification và Mermaid ERD.
- [x] Sơ đồ Mermaid ERD đảm bảo chứa chính xác **đủ 13 Core MVP Entities**.
- [x] Loại bỏ hoàn toàn các kiểu dữ liệu vật lý (`string`, `int`, `decimal`, `date`, `timestamp`, `VARCHAR`, `DATETIME`) khỏi sơ đồ Mermaid ERD.
- [x] Đặc tả chi tiết **13 Core MVP Entities** với mục đích, nguồn gốc, bảng thuộc tính nghiệp vụ, mối quan hệ và ràng buộc.
- [x] Sửa thuộc tính và quan hệ `AuditLog` dùng `Actor User Identifier` hỗ trợ cả Admin (`UC-A-010`) và Owner (`UC-O-010`).
- [x] Chuẩn hóa truy vết `FavoriteVenue` trỏ về `UC-C-010`.
- [x] Mở rộng Ràng buộc Cô lập Dữ liệu Theo Owner (Tenant Isolation) theo phân cấp `Owner -> Venue -> Branch -> Court -> Booking`.
- [x] Tách riêng Mô hình Dữ liệu Mở rộng (Extended / Future Model) không trộn lẫn vào Core MVP.
- [x] Liệt kê và đặc tả các Quyết định Mô hình Dữ liệu chưa chốt (`TBD Data Model Decisions`).
- [x] Xây dựng Ma trận Truy vết Dữ liệu đầy đủ (`Entity -> FR -> BR -> UC`).
- [x] Tuyệt đối không chứa bất kỳ chi tiết Physical Database leakage nào (SQL, kiểu dữ liệu vật lý, ORM, API, Code).
- [x] Bảo lưu tuyệt đối các tài liệu `01.01`, `01.02`, `01.03`, `01.04`.

---
*Tài liệu được cập nhật bởi Antigravity AI Assistant cho dự án SportHubAI.*
