# DATABASE ARCHITECTURE — TASK 03.03
## PHYSICAL VENUE TABLES SPECIFICATION

**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 03.03 (Venue Tables Phase)  
**Parent Task:** PHASE 03 — Database Architecture  
**Previous Tasks:** 03.01 — Database ERD (APPROVED), 03.02 — Auth Tables (APPROVED)  
**Next Task:** 03.04 — Booking Tables  
**Trạng thái:** VALIDATION COMPLETE — PASS WITH NON-BLOCKING GAPS  
**Phiên bản:** OFFICIAL SPECIFICATION  
**Tham chiếu nguồn:**  
- [01-actors-and-permissions.md](file:///e:/SportHubAI/docs/requirements/01-actors-and-permissions.md) (APPROVED)  
- [02-use-cases-and-user-flows.md](file:///e:/SportHubAI/docs/requirements/02-use-cases-and-user-flows.md) (APPROVED)  
- [03-functional-requirements.md](file:///e:/SportHubAI/docs/requirements/03-functional-requirements.md) (`FR-VENUE-001..005`, `FR-COURT-001..003`, `FR-SCHED-001..003`, `FR-CUST-002`)  
- [04-business-rules.md](file:///e:/SportHubAI/docs/requirements/04-business-rules.md) (`BR-VENUE-001..002`, `BR-COURT-001`, `BR-SCHED-001`, `BR-PRICE-001`)  
- [05-data-model.md](file:///e:/SportHubAI/docs/requirements/05-data-model.md) (Entities 3.3 Venue, 3.4 Branch, 3.5 Court, 3.6 OperatingSchedule, 3.7 SlotBlocking, 3.12 FavoriteVenue)  
- [06-system-architecture.md](file:///e:/SportHubAI/docs/architecture/06-system-architecture.md) (MySQL Relational Database Baseline)  
- [08-backend-architecture.md](file:///e:/SportHubAI/docs/architecture/08-backend-architecture.md) (Module 3 Venue & Branch, Module 4 Court & Availability, Module 5 Schedule & Pricing)  
- [29-database-erd.md](file:///e:/SportHubAI/docs/architecture/29-database-erd.md) (APPROVED 03.01 Baseline)  
- [30-database-auth-tables.md](file:///e:/SportHubAI/docs/architecture/30-database-auth-tables.md) (APPROVED 03.02 Baseline)  
**Ngày lập:** 2026-08-08  

---

## 1. PURPOSE & TASK IDENTITY (MỤC TIÊU VÀ PHẠM VI TASK 03.03)

Tài liệu này đặc tả chi tiết **Thiết kế Bảng Vật lý Phân hệ Cơ sở Thể thao (Physical Venue Tables Specification)** thuộc **TASK 03.03** của Phân hệ Kiến trúc Cơ sở Dữ liệu (Phase 03 — Database Architecture).

Mục tiêu cốt lõi của Task 03.03:
1. **Chuyển đổi Thực thể Venue Domain sang Physical Schemas:** Cụ thể hóa cấu trúc các bảng CSDL vật lý thuộc miền Venue (`venues`, `branches`, `courts`, `operating_schedules`, `slot_blockings`, `favorite_venues`, `facilities`, `venue_facilities`, `venue_images`) kế thừa 100% từ Nguồn Sự Thật `05-data-model.md` và `29-database-erd.md`.
2. **Đảm bảo Nguyên tắc Cô lập Tài nguyên Theo Owner (Strict Owner Tenant Isolation):** Đảm bảo quan hệ `User (Owner) 1 : N Venue 1 : N Branch 1 : N Court` tuân thủ tuyệt đối quy tắc `BR-VENUE-002`.
3. **Quản lý TBD Kiến trúc (TBD Governance Preservation):** Bảo toàn trạng thái TBD cho mục `TBD-DM-006` (OperatingSchedule Scope Target) và `TBD-DM-001` (Review Target Scope) mà không tự ý dùng giả định để chốt cứng.
4. **Phân định Ranh giới Phân đoạn Task (Task Boundary Rule):** Chỉ xử lý CSDL phân hệ Venue. Không lấn sang phân hệ Đặt sân (`03.04 — Booking Tables`), Thanh toán (`03.05 — Payment Tables`), hay các chỉ mục/ràng buộc vật lý chuyên sâu (`03.06 — Index & Constraints`).

---

## 2. SOURCE OF TRUTH AUDIT MATRIX (MA TRẬN TRA CỨU NGUỒN SỰ THẬT)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             SOURCE OF TRUTH AUDIT MATRIX                                               │
├─────────────────────┬───────────────────────────────────────────────┬───────────────────────────┬──────────────────────┤
│ Topic / Feature     │ Primary Source Document                       │ Confirmed Decision        │ Status               │
├─────────────────────┼───────────────────────────────────────────────┼───────────────────────────┼──────────────────────┤
│ Venue Identity      │ 05-data-model.md 3.3, 29-database-erd.md      │ `venue_id` (PK)           │ **CONFIRMED**        │
│ Owner Relation      │ 05-data-model.md 3.3, BR-VENUE-002            │ `owner_user_id` -> `users`│ **CONFIRMED (1:N)**  │
│ Branch Identity     │ 05-data-model.md 3.4, FR-VENUE-005            │ `branch_id` (PK)          │ **CONFIRMED (1:N)**  │
│ Court Identity      │ 05-data-model.md 3.5, FR-COURT-001            │ `court_id` (PK)           │ **CONFIRMED (1:N)**  │
│ Operating Schedule  │ 05-data-model.md 3.6, FR-SCHED-001..002       │ `schedule_id` (PK)        │ **TBD (TBD-DM-006)** │
│ Slot Blocking       │ 05-data-model.md 3.7, FR-SCHED-003, BR-SCHED  │ `block_id` (PK)           │ **CONFIRMED (1:N)**  │
│ Favorite Venue      │ 05-data-model.md 3.12, FR-CUST-002            │ Composite PK (User, Venue)│ **CONFIRMED (M:N)**  │
│ Venue Facilities    │ FR-VENUE-004, UC-O-005                        │ Amenity catalog & junction│ **CONFIRMED**        │
│ Venue/Court Images  │ FR-VENUE-003, FR-COURT-002                    │ Media gallery storage     │ **CONFIRMED**        │
│ Operating Status    │ 05-data-model.md 3.3, BR-VENUE-001            │ Enum status (`PENDING`..) │ **CONFIRMED**        │
└─────────────────────┴───────────────────────────────────────────────┴───────────────────────────┴──────────────────────┘
```

---

## 3. VENUE TABLE INVENTORY (DANH MỤC CÁC BẢNG PHÂN HỆ VENUE)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             VENUE TABLE INVENTORY MATRIX                                               │
├─────┬──────────────────────────┬──────────────────────────────────────────────┬──────────────────────┬─────────────────┤
│ No. │ Physical Table Name      │ Purpose & Functional Scope                   │ Authority Source     │ Status          │
├─────┼──────────────────────────┼──────────────────────────────────────────────┼──────────────────────┼─────────────────┤
│ 1   │ `venues`                 │ Lưu thông tin Thương hiệu / Cơ sở thể thao   │ 05-data-model.md 3.3 │ **CONFIRMED**   │
│ 2   │ `branches`               │ Lưu thông tin Chi nhánh / Địa điểm cụ thể    │ 05-data-model.md 3.4 │ **CONFIRMED**   │
│ 3   │ `courts`                 │ Lưu thông tin Sân con thi đấu                │ 05-data-model.md 3.5 │ **CONFIRMED**   │
│ 4   │ `operating_schedules`    │ Khung giờ vận hành & bảng giá cấu hình       │ 05-data-model.md 3.6 │ **TBD-DM-006**  │
│ 5   │ `slot_blockings`         │ Lịch khóa slot thủ công của Owner            │ 05-data-model.md 3.7 │ **CONFIRMED**   │
│ 6   │ `favorite_venues`        │ Bản lưu các Venue yêu thích của Customer     │ 05-data-model.md 3.12│ **CONFIRMED**   │
│ 7   │ `facilities`             │ Danh mục các tiện ích (Đèn, bãi xe, wifi...) │ FR-VENUE-004         │ **CONFIRMED**   │
│ 8   │ `venue_facilities`       │ Bảng liên kết Tiện ích ↔ Venue               │ FR-VENUE-004         │ **CONFIRMED**   │
│ 9   │ `venue_images`           │ Bộ sưu tập hình ảnh Venue & Court            │ FR-VENUE-003, COURT2 │ **CONFIRMED**   │
└─────┴──────────────────────────┴──────────────────────────────────────────────┴──────────────────────┴─────────────────┘
```

---

## 4. DETAILED TABLE-BY-TABLE SPECIFICATIONS

---

### 4.1 TABLE: `venues`

#### Purpose
Lưu thông tin thương hiệu / đơn vị cơ sở thể thao do Owner sở hữu, quản lý các Chi nhánh (`branches`).

#### Source of Truth
`05-data-model.md` Section 3.3, `FR-VENUE-001..004`, `BR-VENUE-001..002`, `29-database-erd.md`.

#### Columns Specification

| Column | Logical Type | Nullable | Default | Key | Description / Business Rules | Status |
|---|---|---|---|---|---|---|
| `venue_id` | Logical UUID / Identity | NOT NULL | Auto/Gen | PK | Mã định danh duy nhất của Venue | **CONFIRMED** |
| `owner_user_id` | Logical UUID / Identity | NOT NULL | None | FK | Tham chiếu Owner quản lý (`users.user_id`) | **CONFIRMED** |
| `venue_name` | String / Text | NOT NULL | None | None | Tên thương hiệu/cơ sở thể thao (`FR-VENUE-001`) | **CONFIRMED** |
| `contact_phone` | String / Text | NOT NULL | None | None | Số điện thoại hotline liên hệ Venue (`FR-VENUE-001`) | **CONFIRMED** |
| `venue_description` | Text | NULLABLE | NULL | None | Mô tả giới thiệu thương hiệu Venue | **CONFIRMED** |
| `operating_status` | Enum (`PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`) | NOT NULL | `PENDING` | None | Trạng thái duyệt & vận hành Venue (`BR-VENUE-001`) | **CONFIRMED** |
| `created_at` | Timestamp | NOT NULL | CURRENT_TS | None | Mốc thời gian khởi tạo Venue | **CONFIRMED** |
| `updated_at` | Timestamp | NOT NULL | CURRENT_TS | None | Mốc thời gian cập nhật gần nhất | **CONFIRMED** |

#### Constraints & Business Rules
- **Approval Rule:** Venue mới khởi tạo ở `operating_status = PENDING`. Chỉ `APPROVED` mới xuất hiện công khai trên Customer Website (`BR-VENUE-001`).
- **Owner Isolation:** Thao tác quản trị Venue bắt buộc đối chiếu `owner_user_id` (`BR-VENUE-002`).

---

### 4.2 TABLE: `branches`

#### Purpose
Lưu thông tin chi nhánh / địa điểm cụ thể thuộc một Venue, quản lý địa chỉ thực tế và danh sách các sân con (`courts`).

#### Source of Truth
`05-data-model.md` Section 3.4, `FR-VENUE-005`, `29-database-erd.md`.

#### Columns Specification

| Column | Logical Type | Nullable | Default | Key | Description / Business Rules | Status |
|---|---|---|---|---|---|---|
| `branch_id` | Logical UUID / Identity | NOT NULL | Auto/Gen | PK | Mã định danh duy nhất của Chi nhánh | **CONFIRMED** |
| `venue_id` | Logical UUID / Identity | NOT NULL | None | FK | Tham chiếu Venue cấp cha (`venues.venue_id`) | **CONFIRMED** |
| `branch_name` | String / Text | NOT NULL | None | None | Tên chi nhánh (Ví dụ: Chi nhánh Quận 1) | **CONFIRMED** |
| `street_address` | String / Text | NOT NULL | None | None | Địa chỉ số nhà/tên đường thực tế của chi nhánh | **CONFIRMED** |
| `ward_district_city` | String / Text | NOT NULL | None | None | Tên Phường/Xã, Quận/Huyện, Tỉnh/Thành phố | **CONFIRMED** |
| `geo_coordinates` | Text / JSON / Point | NULLABLE | NULL | None | Tọa độ địa lý (Vĩ độ, Kinh độ) phục vụ tìm kiếm bản đồ | **CONFIRMED** |
| `branch_phone` | String / Text | NOT NULL | None | None | Số điện thoại liên hệ chi nhánh (`FR-VENUE-005`) | **CONFIRMED** |
| `branch_status` | Enum (`ACTIVE`, `INACTIVE`) | NOT NULL | `ACTIVE` | None | Trạng thái hoạt động chi nhánh | **CONFIRMED** |
| `created_at` | Timestamp | NOT NULL | CURRENT_TS | None | Mốc thời gian khởi tạo chi nhánh | **CONFIRMED** |
| `updated_at` | Timestamp | NOT NULL | CURRENT_TS | None | Mốc thời gian cập nhật gần nhất | **CONFIRMED** |

---

### 4.3 TABLE: `courts`

#### Purpose
Lưu thông tin sân con thi đấu thuộc một Chi nhánh (`branch_id`), dùng xếp lịch và quản lý trạng thái khả dụng.

#### Source of Truth
`05-data-model.md` Section 3.5, `FR-COURT-001..003`, `BR-COURT-001`, `29-database-erd.md`.

#### Columns Specification

| Column | Logical Type | Nullable | Default | Key | Description / Business Rules | Status |
|---|---|---|---|---|---|---|
| `court_id` | Logical UUID / Identity | NOT NULL | Auto/Gen | PK | Mã định danh duy nhất của Sân con | **CONFIRMED** |
| `branch_id` | Logical UUID / Identity | NOT NULL | None | FK | Tham chiếu Chi nhánh trực thuộc (`branches.branch_id`) | **CONFIRMED** |
| `court_name` | String / Text | NOT NULL | None | None | Tên hoặc Số hiệu sân con (Ví dụ: Sân A1) | **CONFIRMED** |
| `sport_category` | String / Enum | NOT NULL | None | None | Bộ môn thể thao (Cầu lông, Bóng đá, Pickleball...) | **CONFIRMED** |
| `court_status` | Enum (`ACTIVE`, `MAINTENANCE`, `INACTIVE`) | NOT NULL | `ACTIVE` | None | Trạng thái vận hành sân con (`BR-COURT-001`) | **CONFIRMED** |
| `surface_features` | Text | NULLABLE | NULL | None | Đặc điểm mặt sân (Sân thảm, Sân gỗ, Trong nhà) | **CONFIRMED** |
| `created_at` | Timestamp | NOT NULL | CURRENT_TS | None | Mốc thời gian khởi tạo sân con | **CONFIRMED** |
| `updated_at` | Timestamp | NOT NULL | CURRENT_TS | None | Mốc thời gian cập nhật gần nhất | **CONFIRMED** |

#### Constraints & Business Rules
- Khi `court_status = MAINTENANCE`, tất cả các slot của sân con này lập tức ẩn khỏi trang đặt lịch public (`BR-COURT-001`).

---

### 4.4 TABLE: `operating_schedules`

#### Purpose
Cấu hình khung giờ mở/đóng cửa và khung giá dịch vụ theo ngày trong tuần/ngày lễ.

#### Source of Truth
`05-data-model.md` Section 3.6, `FR-SCHED-001..002`, `BR-PRICE-001`, `TBD-DM-006`.

#### Columns Specification

| Column | Logical Type | Nullable | Default | Key | Description / Business Rules | Status |
|---|---|---|---|---|---|---|
| `schedule_id` | Logical UUID / Identity | NOT NULL | Auto/Gen | PK | Mã định danh khung lịch vận hành | **CONFIRMED** |
| `scope_target_type` | Enum (`VENUE`, `BRANCH`, `COURT`) | NOT NULL | None | None | Loại đối tượng áp dụng lịch (`Provisional / TBD-DM-006`) | **TBD-DM-006** |
| `scope_target_id` | Logical UUID / Identity | NOT NULL | None | FK | Mã đối tượng áp dụng lịch (`Provisional / TBD-DM-006`) | **TBD-DM-006** |
| `day_scope` | String / Text | NOT NULL | None | None | Ngày áp dụng trong tuần (T2-T6, T7, CN) hoặc Ngày lễ | **CONFIRMED** |
| `opening_time` | Time | NOT NULL | None | None | Giờ mở cửa bắt đầu hoạt động (`FR-SCHED-001`) | **CONFIRMED** |
| `closing_time` | Time | NOT NULL | None | None | Giờ đóng cửa kết thúc hoạt động (`FR-SCHED-001`) | **CONFIRMED** |
| `base_hourly_price` | Decimal / Numeric | NOT NULL | None | None | Giá niêm yết cơ bản theo giờ (`BR-PRICE-001`) | **CONFIRMED** |
| `peak_price_rules` | Text / JSON Structure | NULLABLE | NULL | None | Quy tắc khung giờ vàng Peak-hour & điều chỉnh giá | **CONFIRMED** |
| `created_at` | Timestamp | NOT NULL | CURRENT_TS | None | Mốc thời gian khởi tạo lịch | **CONFIRMED** |
| `updated_at` | Timestamp | NOT NULL | CURRENT_TS | None | Mốc thời gian cập nhật lịch | **CONFIRMED** |

*Ghi chú TBD-DM-006:* Phạm vi áp dụng của `OperatingSchedule` (mức Venue, Branch hay Court) giữ trạng thái `TBD-DM-006 OPEN DECISION`. Các cột `scope_target_type` và `scope_target_id` được ghi nhận dưới dạng thiết kế dự phòng (Provisional Design).

---

### 4.5 TABLE: `slot_blockings`

#### Purpose
Lưu vết các slot giờ chơi bị Owner khóa thủ công (bảo trì đột xuất, sự kiện riêng hoặc giữ chỗ vãng lai).

#### Source of Truth
`05-data-model.md` Section 3.7, `FR-SCHED-003`, `BR-SCHED-001`.

#### Columns Specification

| Column | Logical Type | Nullable | Default | Key | Description / Business Rules | Status |
|---|---|---|---|---|---|---|
| `block_id` | Logical UUID / Identity | NOT NULL | Auto/Gen | PK | Mã định danh bản ghi khóa slot | **CONFIRMED** |
| `court_id` | Logical UUID / Identity | NOT NULL | None | FK | Tham chiếu Sân con bị khóa (`courts.court_id`) | **CONFIRMED** |
| `block_date` | Date | NOT NULL | None | None | Ngày áp dụng khóa slot (`FR-SCHED-003`) | **CONFIRMED** |
| `start_time` | Time | NOT NULL | None | None | Khung giờ bắt đầu khóa | **CONFIRMED** |
| `end_time` | Time | NOT NULL | None | None | Khung giờ kết thúc khóa | **CONFIRMED** |
| `block_reason` | String / Text | NULLABLE | NULL | None | Lý do khóa slot thủ công (`FR-SCHED-003`) | **CONFIRMED** |
| `created_by_owner_id` | Logical UUID / Identity | NOT NULL | None | FK | Tham chiếu Owner tạo lệnh khóa (`users.user_id`)| **CONFIRMED** |
| `created_at` | Timestamp | NOT NULL | CURRENT_TS | None | Mốc thời gian khởi tạo bản ghi khóa | **CONFIRMED** |

#### Constraints & Business Rules
- Không được phép khóa thủ công các slot đã có đơn `HOLDING`, `PAYMENT_PENDING`, hoặc `CONFIRMED` (`BR-SCHED-001`).

---

### 4.6 TABLE: `favorite_venues`

#### Purpose
Bảng liên kết nhiều-nhiều (M:N) lưu danh sách các Cơ sở thể thao (`venues`) được Customer lưu vào danh mục yêu thích.

#### Source of Truth
`05-data-model.md` Section 3.12, `FR-CUST-002`, `UC-C-010`.

#### Columns Specification

| Column | Logical Type | Nullable | Default | Key | Description / Business Rules | Status |
|---|---|---|---|---|---|---|
| `customer_user_id` | Logical UUID / Identity | NOT NULL | None | PK/FK | Tham chiếu Khách hàng (`users.user_id`) | **CONFIRMED** |
| `venue_id` | Logical UUID / Identity | NOT NULL | None | PK/FK | Tham chiếu Venue yêu thích (`venues.venue_id`) | **CONFIRMED** |
| `added_at` | Timestamp | NOT NULL | CURRENT_TS | None | Mốc thời gian bookmark yêu thích | **CONFIRMED** |

---

### 4.7 TABLE: `facilities`

#### Purpose
Danh mục các tiện ích công cộng phục vụ thi đấu (Đèn chiếu sáng, Wifi, Bãi xe ô tô, Căng tin, Phòng thay đồ...).

#### Source of Truth
`FR-VENUE-004`, `UC-O-005`.

#### Columns Specification

| Column | Logical Type | Nullable | Default | Key | Description / Business Rules | Status |
|---|---|---|---|---|---|---|
| `facility_id` | Logical UUID / Identity | NOT NULL | Auto/Gen | PK | Mã định danh tiện ích | **CONFIRMED** |
| `facility_name` | String / Text | NOT NULL | None | UK | Tên tiện ích (Ví dụ: Bãi đỗ xe ô tô) | **CONFIRMED** |
| `facility_icon` | String / Text | NULLABLE | NULL | None | Mã biểu tượng / Icon hiển thị tiện ích | **CONFIRMED** |
| `created_at` | Timestamp | NOT NULL | CURRENT_TS | None | Mốc thời gian tạo bản ghi | **CONFIRMED** |

---

### 4.8 TABLE: `venue_facilities`

#### Purpose
Bảng liên kết nhiều-nhiều (M:N) giữa Venue và Danh mục Tiện ích (`facilities`).

#### Source of Truth
`FR-VENUE-004`, `UC-O-005`.

#### Columns Specification

| Column | Logical Type | Nullable | Default | Key | Description / Business Rules | Status |
|---|---|---|---|---|---|---|
| `venue_id` | Logical UUID / Identity | NOT NULL | None | PK/FK | Tham chiếu Venue (`venues.venue_id`) | **CONFIRMED** |
| `facility_id` | Logical UUID / Identity | NOT NULL | None | PK/FK | Tham chiếu Tiện ích (`facilities.facility_id`) | **CONFIRMED** |
| `created_at` | Timestamp | NOT NULL | CURRENT_TS | None | Mốc thời gian gán tiện ích | **CONFIRMED** |

---

### 4.9 TABLE: `venue_images`

#### Purpose
Lưu vết bộ sưu tập hình ảnh thuộc Venue hoặc Court phục vụ quảng bá truyền thông.

#### Source of Truth
`FR-VENUE-003`, `FR-COURT-002`, `UC-O-005`, `UC-O-011`.

#### Columns Specification

| Column | Logical Type | Nullable | Default | Key | Description / Business Rules | Status |
|---|---|---|---|---|---|---|
| `image_id` | Logical UUID / Identity | NOT NULL | Auto/Gen | PK | Mã định danh bản ghi hình ảnh | **CONFIRMED** |
| `target_type` | Enum (`VENUE`, `COURT`) | NOT NULL | None | None | Loại đối tượng sở hữu hình ảnh | **CONFIRMED** |
| `target_id` | Logical UUID / Identity | NOT NULL | None | FK | Mã đối tượng sở hữu (Venue ID hoặc Court ID) | **CONFIRMED** |
| `image_url` | String / Text | NOT NULL | None | None | Đường dẫn lưu trữ hình ảnh (URL/CDN Path) | **CONFIRMED** |
| `display_order` | Integer | NOT NULL | 0 | None | Thứ tự sắp xếp hiển thị hình ảnh trong bộ sưu tập | **CONFIRMED** |
| `is_primary` | Boolean / Flag | NOT NULL | FALSE | None | Cờ đánh dấu ảnh đại diện chính | **CONFIRMED** |
| `created_at` | Timestamp | NOT NULL | CURRENT_TS | None | Mốc thời gian tải ảnh lên | **CONFIRMED** |

---

## 5. VENUE RELATIONSHIP MATRIX (MA TRẬN MỐI QUAN HỆ VENUE DOMAIN)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           VENUE RELATIONSHIP MATRIX TABLE                                              │
├───────────────────┼─────────────────────────┼─────────────┼────────────────────┼───────────┼──────────────┼────────────┤
│ Parent Table      │ Child Table             │ Cardinality │ Logical FK Column  │ Optional? │ Physical FK  │ Status     │
├───────────────────┼─────────────────────────┼─────────────┼────────────────────┼───────────┼──────────────┼────────────┤
│ `users` (Owner)   │ `venues`                │ `1 : N`     │ `owner_user_id`    │ Required  │ TBD (Task3.6)│ CONFIRMED  │
│ `venues`          │ `branches`              │ `1 : N`     │ `venue_id`         │ Required  │ TBD (Task3.6)│ CONFIRMED  │
│ `branches`        │ `courts`                │ `1 : N`     │ `branch_id`        │ Required  │ TBD (Task3.6)│ CONFIRMED  │
│ `courts`          │ `slot_blockings`        │ `1 : N`     │ `court_id`         │ Required  │ TBD (Task3.6)│ CONFIRMED  │
│ `users` (Owner)   │ `slot_blockings`        │ `1 : N`     │ `created_by_owner` │ Required  │ TBD (Task3.6)│ CONFIRMED  │
│ `users` (Customer)│ `favorite_venues`       │ `1 : N`     │ `customer_user_id` │ Required  │ TBD (Task3.6)│ CONFIRMED  │
│ `venues`          │ `favorite_venues`       │ `1 : N`     │ `venue_id`         │ Required  │ TBD (Task3.6)│ CONFIRMED  │
│ `venues`          │ `venue_facilities`      │ `1 : N`     │ `venue_id`         │ Required  │ TBD (Task3.6)│ CONFIRMED  │
│ `facilities`      │ `venue_facilities`      │ `1 : N`     │ `facility_id`      │ Required  │ TBD (Task3.6)│ CONFIRMED  │
│ *(Scope Target)*  │ `operating_schedules`   │ `TBD`       │ `scope_target_id`  │ Required  │ TBD-DM-006    │ TBD-DM-006 │
└───────────────────┴─────────────────────────┴─────────────┴────────────────────┴───────────┴──────────────┴────────────┘
```

*Phân định Ranh giới Phân đoạn Task:*
- Hành vi ràng buộc khóa ngoại vật lý (`ON DELETE` / `ON UPDATE` CASCADE, RESTRICT, SET NULL) cho các bảng Venue được hoãn xử lý chính thức sang **Task 03.06 (Index & Constraints)**.

---

## 6. VENUE DATABASE ERD (MERMAID DIAGRAM)

```mermaid
erDiagram
    USERS ||--o{ VENUES : "owns (owner_user_id)"
    USERS ||--o{ SLOT_BLOCKINGS : "creates (created_by_owner_id)"
    USERS ||--o{ FAVORITE_VENUES : "bookmarks (customer_user_id)"

    VENUES ||--o{ BRANCHES : "contains (venue_id)"
    VENUES ||--o{ FAVORITE_VENUES : "bookmarked_in (venue_id)"
    VENUES ||--o{ VENUE_FACILITIES : "has_facility (venue_id)"

    BRANCHES ||--o{ COURTS : "manages (branch_id)"

    COURTS ||--o{ SLOT_BLOCKINGS : "applied_to (court_id)"

    FACILITIES ||--o{ VENUE_FACILITIES : "assigned_in (facility_id)"

    OPERATING_SCHEDULES }|..|| TARGET_SCOPE : "applied_to (Scope Target: TBD-DM-006 OPEN)"
    VENUE_IMAGES }|..|| TARGET_MEDIA : "attached_to (Target Scope: VENUE/COURT)"

    VENUES {
        venue_id PK
        owner_user_id FK
        venue_name
        contact_phone
        venue_description
        operating_status
        created_at
        updated_at
    }

    BRANCHES {
        branch_id PK
        venue_id FK
        branch_name
        street_address
        ward_district_city
        geo_coordinates
        branch_phone
        branch_status
        created_at
        updated_at
    }

    COURTS {
        court_id PK
        branch_id FK
        court_name
        sport_category
        court_status
        surface_features
        created_at
        updated_at
    }

    OPERATING_SCHEDULES {
        schedule_id PK
        scope_target_type_tbd_DM006
        scope_target_id_tbd_DM006 FK
        day_scope
        opening_time
        closing_time
        base_hourly_price
        peak_price_rules
        created_at
        updated_at
    }

    SLOT_BLOCKINGS {
        block_id PK
        court_id FK
        block_date
        start_time
        end_time
        block_reason
        created_by_owner_id FK
        created_at
    }

    FAVORITE_VENUES {
        customer_user_id PK_FK
        venue_id PK_FK
        added_at
    }

    FACILITIES {
        facility_id PK
        facility_name UK
        facility_icon
        created_at
    }

    VENUE_FACILITIES {
        venue_id PK_FK
        facility_id PK_FK
        created_at
    }

    VENUE_IMAGES {
        image_id PK
        target_type
        target_id FK
        image_url
        display_order
        is_primary
        created_at
    }
```

---

## 7. REQUIREMENTS TRACEABILITY MATRIX (VENUE DOMAIN)

| Requirement / Business Rule | Target Venue Table | Target Column / Relationship | Verification Result | Status |
|---|---|---|---|---|
| **FR-VENUE-001 (Create Venue)** | `venues` | `owner_user_id`, `venue_name`, `operating_status=PENDING` | Initial pending state supported | **PASS** |
| **FR-VENUE-002 (Update Venue)** | `venues` | `venue_description`, `contact_phone`, `updated_at` | Property update supported | **PASS** |
| **FR-VENUE-003 (Gallery)** | `venue_images` | `target_type=VENUE`, `target_id`, `image_url` | Image gallery management supported | **PASS** |
| **FR-VENUE-004 (Facilities)** | `facilities`, `venue_facilities` | `facility_name`, `venue_id`, `facility_id` | Amenity association supported | **PASS** |
| **FR-VENUE-005 (Branches)** | `branches` | `venue_id`, `branch_name`, `street_address` | Multi-branch hierarchy supported | **PASS** |
| **FR-COURT-001 (Create Court)** | `courts` | `branch_id`, `court_name`, `sport_category` | Sub-court registration supported | **PASS** |
| **FR-COURT-002 (Update Court)** | `courts`, `venue_images` | `surface_features`, `target_type=COURT` | Court detail & photo supported | **PASS** |
| **FR-COURT-003 (Maintenance)** | `courts` | `court_status=MAINTENANCE` | Maintenance availability block supported | **PASS** |
| **FR-SCHED-001 (Hours)** | `operating_schedules` | `opening_time`, `closing_time`, `day_scope` | Business hours supported | **PASS** |
| **FR-SCHED-002 (Pricing)** | `operating_schedules` | `base_hourly_price`, `peak_price_rules` | Peak pricing calculation supported | **PASS** |
| **FR-SCHED-003 (Slot Block)** | `slot_blockings` | `court_id`, `block_date`, `start_time`, `end_time` | Manual slot blocking supported | **PASS** |
| **FR-CUST-002 (Favorite)** | `favorite_venues` | `customer_user_id`, `venue_id` | M:N bookmarking supported | **PASS** |
| **BR-VENUE-001 (Approval)** | `venues` | `operating_status IN (PENDING, APPROVED...)` | Public visibility restriction supported | **PASS** |
| **BR-VENUE-002 (Owner Isolation)**| `venues` | `owner_user_id` | Owner tenant boundary enforced | **PASS** |

---

## 8. CROSS-TASK ARCHITECTURE CONSISTENCY

- **Consistency với Task 03.01 (Database ERD):**
  - Giữ nguyên 100% Khóa chính `venue_id`, `branch_id`, `court_id`, `schedule_id`, `block_id`, và Composite Key `(customer_user_id, venue_id)`.
  - Giữ nguyên bảo lưu `TBD-DM-006` cho `OperatingSchedule` và `TBD-DM-001` cho `Review`.
- **Consistency với Task 03.02 (Auth Tables):**
  - Tham chiếu chính xác Khóa ngoại `owner_user_id` và `customer_user_id` tới `users.user_id` ở Task 03.02.
- **Consistency với Backend Architecture (08-backend-architecture.md):**
  - Khớp 100% ranh giới Module 3 (Venue & Branch), Module 4 (Court & Availability), và Module 5 (Schedule & Pricing).

---

## 9. OPEN TBD DECISIONS REGISTER (VENUE DOMAIN)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           OPEN TBD DECISIONS REGISTER TABLE                                            │
├──────────────┬──────────────────────────────────┬───────────────┬───────────┬───────────────────┬──────────────────────┤
│ Decision ID  │ Open Decision Description        │ Status        │ Impact    │ Authority Owner   │ Required Next Action │
├──────────────┼──────────────────────────────────┼───────────────┼───────────┼───────────────────┼──────────────────────┤
│ `TBD-DM-006` │ OperatingSchedule Scope Target   │ OPEN DECISION │ Low (Non) │ Architecture Owner│ Finalize Schedule    │
│ `TBD-DM-001` │ Review Target Scope (Venue/Court)│ OPEN DECISION │ Low (Non) │ Business / Product│ Resolve OQ-003       │
│ `TBD-VENUE-01`│ Geo Coordinates Indexing Spec   │ OPEN DECISION │ Low (Non) │ Database Architect│ Defer to Task 03.06  │
└──────────────┴──────────────────────────────────┴───────────────┴───────────┴───────────────────┴──────────────────────┘
```

---

## 10. SCOPE BOUNDARY CHECK

- **IN SCOPE:**
  - Bảng vật lý phân hệ Venue (`venues`, `branches`, `courts`, `operating_schedules`, `slot_blockings`, `favorite_venues`, `facilities`, `venue_facilities`, `venue_images`).
  - Cột, kiểu dữ liệu logical, tính Nullable, Khóa chính/Khóa ngoại logical.
  - Ma trận truy vết yêu cầu Venue và bảo mật phân quyền Owner.
- **OUT OF SCOPE (DEFERRED TO DOWNSTREAM TASKS):**
  - Task 03.04: Booking Physical Tables (`bookings`).
  - Task 03.05: Payment Physical Tables (`payments`).
  - Task 03.06: Physical Database Indexes, Foreign Key Constraints (`CASCADE` / `RESTRICT`), & SQL DDL scripts.
  - Phase 08: Động cơ tính toán Slot khả dụng (Availability Engine) & phát hiện xung đột lịch.
  - Mã nguồn Backend / ORM models / REST API implementation.

---

## 11. FINAL VALIDATION TABLE

| Check | Result | Evidence / Note |
|---|---|---|
| Venue Table Inventory | PASS | 9 physical tables specified; All aligned with 05-data-model.md & 29-database-erd.md |
| Venue Table | PASS | Detailed columns, PK `venue_id`, owner FK, approval status enum verified |
| Branch Table | PASS | Detailed columns, PK `branch_id`, venue FK, address & status verified |
| Court Table | PASS | Detailed columns, PK `court_id`, branch FK, maintenance status verified |
| Facility Model | PASS | `facilities` catalog & `venue_facilities` M:N junction specified |
| Image Model | PASS | `venue_images` gallery specified for Venue & Court targets |
| OperatingSchedule | PASS | `operating_schedules` specified; `TBD-DM-006` scope target preserved |
| Slot Blocking | PASS | `slot_blockings` specified for Owner manual blocking (`BR-SCHED-001`) |
| PK Consistency | PASS | 100% aligned with Task 03.01 PK identities (`venue_id`, `branch_id`, `court_id`...) |
| FK Consistency | PASS | Logical FK relationships specified; Physical FK actions deferred to Task 03.06 |
| Cardinality | PASS | Aligned with approved 03.01 relationships (`Venue 1:N Branch 1:N Court`) |
| Nullability | PASS | Column nullability strictly derived from business requirements |
| Unique Semantics | PASS | Facility name uniqueness & Composite Favorite key verified |
| Security | PASS | Zero password/secret duplication; Strict Owner Tenant isolation enforced |
| 03.01 Consistency | PASS | 100% consistent with Task 03.01 Core MVP ERD baseline |
| 03.02 Consistency | PASS | 100% consistent with Task 03.02 User FK references (`users.user_id`) |
| Requirements Traceability | PASS | 100% traceable to FR-VENUE, FR-COURT, FR-SCHED, BR-VENUE, BR-COURT, BR-SCHED |
| TBD Governance | PASS | Open decisions tracked transparently under TBD-DM-006, TBD-DM-001, TBD-VENUE-01 |
| Scope Control | PASS | Zero scope creep into Booking (03.04), Payment (03.05), or DDL (03.06) |
| Contradiction Scan | PASS | Zero internal contradictions detected across document |
| Approval Readiness | READY FOR APPROVAL | PASS WITH NON-BLOCKING GAPS |

---

## 12. DEFINITION OF DONE (DoD) & FINAL APPROVAL GATE

```text
================================================================================────────
                               APPROVAL DECISION SECTION
================================================================================────────

TASK:                  03.03 — Venue Tables

STATUS:                VALIDATION COMPLETE — PASS WITH NON-BLOCKING GAPS

TABLES:                venues, branches, courts, operating_schedules, 
                       slot_blockings, favorite_venues, facilities, 
                       venue_facilities, venue_images

CONFIRMED DECISIONS:   Venue PK venue_id, Owner FK owner_user_id, 1:N Branch/Court Hierarchy,
                       Enum Status Models, Manual Slot Blocking, Gallery & Facility Tables

INHERITED TBDs:        TBD-DM-006 (OperatingSchedule Scope Target),
                       TBD-DM-001 (Review Target Scope)

NEW TBDs:              TBD-VENUE-01 (Geo Coordinates Indexing Spec)

BLOCKING ISSUES:       0

NON-BLOCKING GAPS:     3 TBD Data Model / Index Configurations

03.01 CONSISTENCY:     PASS (100% Aligned with 29-database-erd.md Baseline)

03.02 CONSISTENCY:     PASS (100% Aligned with 30-database-auth-tables.md Baseline)

VENUE DOMAIN TRACEABILITY: PASS (100% Traceable to FR-VENUE/COURT/SCHED & BR-VENUE/COURT/SCHED)

SECURITY:              PASS (Strict Owner Isolation Enforced, Zero Key Duplication)

CONTRADICTION SCAN:    PASS (Zero Contradictions Across ERD, Matrices, and Boundaries)

FINAL VALIDATION:      PASS WITH NON-BLOCKING GAPS

FINAL STATUS:          PASS WITH NON-BLOCKING GAPS

APPROVAL READINESS:    READY FOR APPROVAL

NEXT TASK:             03.04 — Booking Tables
================================================================================────────
```

---

## 13. NEXT TASK HANDOFF

- **Next Task:** **`TASK 03.04 — Booking Tables`**
- Task 03.03 khép lại giai đoạn thiết kế CSDL Phân hệ Cơ sở Thể thao (Venue Domain). Mọi chi tiết thiết kế bảng vật lý cho Phân hệ Đặt sân (`bookings`, các trạng thái vòng đời 8 bước, đơn thủ công tại sân) sẽ được triển khai tại Task 03.04.

---
*Tài liệu Đặc tả Bảng Vật lý Phân hệ Cơ sở Thể thao được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
