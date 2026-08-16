# DATABASE ARCHITECTURE — TASK 03.04
## PHYSICAL BOOKING TABLES SPECIFICATION

**Hệ thống:** Website Đặt Lịch Sân Thể Thao Trực Tuyến (SportHubAI)  
**Mã Task:** 03.04 (Booking Tables Phase)  
**Parent Task:** PHASE 03 — Database Architecture  
**Previous Tasks:** 03.01 — Database ERD (APPROVED), 03.02 — Auth Tables (APPROVED), 03.03 — Venue Tables (APPROVED)  
**Next Task:** 03.05 — Payment Tables  
**Trạng thái:** VALIDATION COMPLETE — PASS WITH NON-BLOCKING GAPS  
**Phiên bản:** AUDIT-CONSISTENT & REMEDIATED SPECIFICATION  
**Tham chiếu nguồn:**  
- [01-actors-and-permissions.md](file:///e:/SportHubAI/docs/requirements/01-actors-and-permissions.md) (APPROVED)  
- [02-use-cases-and-user-flows.md](file:///e:/SportHubAI/docs/requirements/02-use-cases-and-user-flows.md) (`UC-C-011`..`018`, `UC-O-011`..`013`, `UC-S-001`..`006`)  
- [03-functional-requirements.md](file:///e:/SportHubAI/docs/requirements/03-functional-requirements.md) (`FR-BOOK-001..009`, `FR-OWNER-001..004`, `FR-SYS-001`)  
- [04-business-rules.md](file:///e:/SportHubAI/docs/requirements/04-business-rules.md) (`BR-BOOK-001..014`, `BR-OWNER-001`, `BR-CANCEL-001..002`)  
- [05-data-model.md](file:///e:/SportHubAI/docs/requirements/05-data-model.md) (Entity 3.8 Booking)  
- [06-system-architecture.md](file:///e:/SportHubAI/docs/architecture/06-system-architecture.md) (MySQL Relational Database Baseline)  
- [08-backend-architecture.md](file:///e:/SportHubAI/docs/architecture/08-backend-architecture.md) (Module 6 Booking Engine, Module 7 State Machine)  
- [29-database-erd.md](file:///e:/SportHubAI/docs/architecture/29-database-erd.md) (APPROVED 03.01 Baseline)  
- [30-database-auth-tables.md](file:///e:/SportHubAI/docs/architecture/30-database-auth-tables.md) (APPROVED 03.02 Baseline)  
- [31-database-venue-tables.md](file:///e:/SportHubAI/docs/architecture/31-database-venue-tables.md) (APPROVED 03.03 Baseline)  
**Ngày lập:** 2026-08-08  

---

## 1. PURPOSE & TASK IDENTITY (MỤC TIÊU VÀ PHẠM VI TASK 03.04)

Tài liệu này đặc tả chi tiết **Thiết kế Bảng Vật lý Phân hệ Đặt Sân (Physical Booking Tables Specification)** thuộc **TASK 03.04** của Phân hệ Kiến trúc Cơ sở Dữ liệu (Phase 03 — Database Architecture).

Mục tiêu cốt lõi của Task 03.04:
1. **Chuyển đổi Thực thể Booking Domain sang Physical Schemas:** Cụ thể hóa cấu trúc bảng CSDL vật lý cho miền Booking (`bookings` và bảng nhật ký lịch sử trạng thái `booking_status_history`) kế thừa 100% từ Nguồn Sự Thật `05-data-model.md` và `29-database-erd.md`.
2. **Hỗ trợ Đầy đủ 8 Trạng thái Vòng đời Đơn hàng (8 Booking States Support):** Lưu vết chính xác tập 8 trạng thái (`AVAILABLE`, `HOLDING`, `PAYMENT_PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `PAYMENT_FAILED`) và mốc thời gian giữ chỗ 10 phút (`hold_expiry_at`) theo quy tắc `BR-BOOK-001..014`.
3. **Đảm bảo Ranh giới Phân định Thanh toán (Payment Domain Boundary Separation):** Không rò rỉ các thuộc tính giao dịch ngoại vi (MoMo IPN signatures, payload callback, refund logs) vào bảng `bookings`. Các thuộc tính này thuộc ranh giới phân hệ Thanh toán (**Task 03.05 — Payment Tables**).
4. **Cung cấp Thuộc tính Định danh Xung đột (Concurrency Conflict Identity):** Cung cấp đầy đủ thuộc tính định danh xung đột (`court_id`, `booking_date`, `start_time`, `end_time`, `booking_status`) làm đầu vào logic cho động cơ phát hiện xung đột và bảo vệ đặt trùng tại Phase 08 và Phase 09.
5. **Phân định Ranh giới Phân đoạn Task (Task Boundary Rule):** Chỉ thiết kế CSDL cho Booking Domain. Không lấn sang phân hệ Thanh toán (`03.05`), chỉ mục/ràng buộc vật lý chuyên sâu (`03.06`), động cơ tính giá (`Phase 08`), hay mã nguồn API (`Phase 09`).

---

## 2. SOURCE OF TRUTH AUDIT MATRIX (MA TRẬN TRA CỨU NGUỒN SỰ THẬT)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             SOURCE OF TRUTH AUDIT MATRIX                                               │
├─────────────────────┬───────────────────────────────────────────────┬───────────────────────────┬──────────────────────┤
│ Topic / Feature     │ Primary Source Document                       │ Confirmed Decision        │ Status               │
├─────────────────────┼───────────────────────────────────────────────┼───────────────────────────┼──────────────────────┤
│ Booking Identity    │ 05-data-model.md 3.8, 29-database-erd.md      │ `booking_id` (PK)         │ **CONFIRMED**        │
│ Customer Relation   │ 05-data-model.md 3.8, FR-OWNER-001            │ `customer_user_id` (FK)   │ **CONFIRMED** (Cond) │
│ Court Relation      │ 05-data-model.md 3.8, FR-BOOK-001             │ `court_id` (FK)           │ **CONFIRMED (N:1)**  │
│ Booking Time        │ 05-data-model.md 3.8, BR-BOOK-001             │ Date + Start/End Time     │ **CONFIRMED**        │
│ Booking Status      │ 04-business-rules.md BR-BOOK-008..014         │ Enum 8 trạng thái chuẩn   │ **CONFIRMED**        │
│ 10m Hold Countdown  │ FR-BOOK-003, BR-BOOK-002, UC-C-014            │ `hold_expiry_at` (TS)     │ **CONFIRMED**        │
│ Booking Source      │ FR-OWNER-001, BR-OWNER-001                    │ `ONLINE_CUSTOMER`/`OFFLINE`│ **CONFIRMED**       │
│ Price Snapshot      │ 05-data-model.md 3.8, BR-PAY-003              │ `total_amount` (Decimal)  │ **CONFIRMED**        │
│ Cancellation        │ FR-BOOK-009, BR-CANCEL-001                    │ Reason & Cancelled By/At  │ **CONFIRMED**        │
│ Payment Relation    │ 29-database-erd.md, BR-PAY-002                │ Logical `Booking ↔ Payment`│ **TBD (TBD-DM-003)** │
│ Reschedule Scope    │ OQ-005, FR-CUST-005                           │ Future Scope Entity       │ **FUTURE (OUT MVP)** │
└─────────────────────┴───────────────────────────────────────────────┴───────────────────────────┴──────────────────────┘
```

---

## 3. BOOKING TABLE INVENTORY (DANH MỤC CÁC BẢNG PHÂN HỆ BOOKING)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             BOOKING TABLE INVENTORY MATRIX                                             │
├─────┬──────────────────────────┬──────────────────────────────────────────────┬──────────────────────┬─────────────────┤
│ No. │ Physical Table Name      │ Purpose & Functional Scope                   │ Authority Source     │ Status          │
├─────┼──────────────────────────┼──────────────────────────────────────────────┼──────────────────────┼─────────────────┤
│ 1   │ `bookings`               │ Lưu trữ đơn đặt sân chính & trạng thái 8 bước│ 05-data-model.md 3.8 │ **CONFIRMED**   │
│ 2   │ `booking_status_history` │ Lưu vết lịch sử chuyển trạng thái (Audit Log)│ 08-backend-arch 7    │ **CONFIRMED**   │
│ 3   │ `booking_items`          │ Bảng chuẩn hóa nhiều sân con trong 1 đơn đặt │ 05-data-model.md 3.8 │ **DEPRECATED**  │
└─────┴──────────────────────────┴──────────────────────────────────────────────┴──────────────────────┴─────────────────┘
```

*Ghi chú Cấu trúc Booking Item:* Nguồn Sự Thật `05-data-model.md` Section 3.8 và `29-database-erd.md` xác nhận mỗi `Booking` trực tiếp đại diện cho duy nhất 1 Sân con (`Court`) trong 1 khung giờ xác định (`Court 1 : N Booking`). Do đó, bảng chuẩn hóa `booking_items` rã nhiều sân con **KHÔNG** thuộc danh mục bảng vật lý MVP của SportHubAI (`DEPRECATED FOR MVP (Single Court Slot Baseline)`).

---

## 4. DETAILED TABLE-BY-TABLE SPECIFICATIONS

---

### 4.1 TABLE: `bookings`

#### Purpose
Lưu trữ thông tin đơn đặt sân, quản lý mốc thời gian giữ chỗ 10 phút (`hold_expiry_at`), nguồn khởi tạo (`ONLINE_CUSTOMER` / `MANUAL_OFFLINE`), và toàn bộ 8 trạng thái chuyển đổi của đơn hàng.

#### Source of Truth
`05-data-model.md` Section 3.8, `FR-BOOK-001..009`, `FR-OWNER-001`, `BR-BOOK-001..014`, `BR-OWNER-001`, `BR-CANCEL-001`, `29-database-erd.md`.

#### Columns Specification

| Column | Logical Type | Nullable | Default | Key | Description / Business Rules | Status |
|---|---|---|---|---|---|---|
| `booking_id` | Logical UUID / Identity | NOT NULL | Auto/Gen | PK | Mã định danh duy nhất của đơn đặt sân | **CONFIRMED** |
| `customer_user_id` | Logical UUID / Identity | NULLABLE | NULL | FK | Tham chiếu Khách hàng (`users.user_id`). Bắt buộc khi ONLINE; NULL khi MANUAL_OFFLINE khách lẻ | **CONFIRMED** |
| `court_id` | Logical UUID / Identity | NOT NULL | None | FK | Tham chiếu Sân con được đặt (`courts.court_id`) | **CONFIRMED** |
| `booking_date` | Date | NOT NULL | None | None | Ngày diễn ra trận đấu (`FR-BOOK-001`) | **CONFIRMED** |
| `start_time` | Time | NOT NULL | None | None | Giờ bắt đầu chơi trong ngày (`FR-BOOK-001`) | **CONFIRMED** |
| `end_time` | Time | NOT NULL | None | None | Giờ kết thúc chơi trong ngày (`FR-BOOK-001`) | **CONFIRMED** |
| `total_amount` | Decimal / Numeric | NOT NULL | None | None | Tổng tiền đơn đặt sân đã áp dụng giá & khuyến mãi (`BR-PAY-003`) | **CONFIRMED** |
| `currency` | String / Text | NOT NULL | `'VND'` | None | Đơn vị tiền tệ giao dịch | **CONFIRMED** |
| `booking_source` | Enum (`ONLINE_CUSTOMER`, `MANUAL_OFFLINE`) | NOT NULL | `ONLINE_CUSTOMER` | None | Nguồn khởi tạo đơn hàng (`BR-OWNER-001`) | **CONFIRMED** |
| `booking_status` | Enum (`AVAILABLE`, `HOLDING`, `PAYMENT_PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `PAYMENT_FAILED`) | NOT NULL | `HOLDING` | None | Trạng thái vòng đời đơn đặt sân (`BR-BOOK-008..014`) | **CONFIRMED** |
| `hold_expiry_at` | Timestamp | NULLABLE | NULL | None | Mốc thời gian hết hạn 10 phút đếm ngược (Khi `status = HOLDING`) | **CONFIRMED** |
| `cancellation_reason` | Text | NULLABLE | NULL | None | Lý do hủy đơn (Khi `status = CANCELLED`) | **CONFIRMED** |
| `cancelled_by_user_id` | Logical UUID / Identity | NULLABLE | NULL | FK | Tham chiếu người thực hiện hủy đơn (`users.user_id`) | **CONFIRMED** |
| `cancelled_at` | Timestamp | NULLABLE | NULL | None | Mốc thời gian đơn bị hủy | **CONFIRMED** |
| `created_at` | Timestamp | NOT NULL | CURRENT_TS | None | Mốc thời gian tạo đơn đặt sân | **CONFIRMED** |
| `updated_at` | Timestamp | NOT NULL | CURRENT_TS | None | Mốc thời gian cập nhật gần nhất | **CONFIRMED** |

#### Logical Constraints & Business Rules Clarification
- **Customer Nullability Rule:** `customer_user_id` bắt buộc (`NOT NULL`) đối với đơn `booking_source = ONLINE_CUSTOMER`. Với đơn `MANUAL_OFFLINE` đặt trực tiếp tại sân cho khách vãng lai không có tài khoản, `customer_user_id` cho phép `NULL` (`BR-OWNER-001`).
- **Hold Expiration Boundary:** Task 03.04 lưu trữ thuộc tính `hold_expiry_at` nhưng **KHÔNG (DOES NOT)** tự động kích hoạt tiến trình tự chuyển trạng thái sang `EXPIRED`. Động cơ quét hết hạn thuộc về downstream worker / scheduler architecture.
- **Cancellation Actor Authorization:** Thuộc tính `cancelled_by_user_id` tham chiếu `users.user_id`. Việc phân quyền kiểm tra vai trò người thực hiện hủy (`CUSTOMER` sở hữu đơn vs `OWNER` quản lý sân) thuộc phân hệ Backend Application / RBAC và không bị hardcode tại tầng CSDL.
- **Price Snapshot Semantics:** `total_amount` và `currency` đại diện cho giá trị snapshot giao dịch đã duyệt tại thời điểm tạo đơn. Logic tính toán giá, giảm trừ khuyến mãi và thuế thuộc về pricing domain và nằm ngoài Task 03.04.

---

### 4.2 TABLE: `booking_status_history`

#### Purpose
Lưu vết nhật ký lịch sử chuyển đổi trạng thái của đơn đặt sân phục vụ công tác kiểm tra, truy vết sự cố và audit vết giao dịch.

#### Source of Truth
`08-backend-architecture.md` Section 7 (Module 7 State Machine Audit Log).

#### Columns Specification

| Column | Logical Type | Nullable | Default | Key | Description / Business Rules | Status |
|---|---|---|---|---|---|---|
| `history_id` | Logical UUID / Identity | NOT NULL | Auto/Gen | PK | Mã định danh bản ghi lịch sử trạng thái | **CONFIRMED** |
| `booking_id` | Logical UUID / Identity | NOT NULL | None | FK | Tham chiếu Đơn đặt sân (`bookings.booking_id`)| **CONFIRMED** |
| `from_status` | Enum (8 Booking States) | NULLABLE | NULL | None | Trạng thái nguồn trước khi chuyển đổi | **CONFIRMED** |
| `to_status` | Enum (8 Booking States) | NOT NULL | None | None | Trạng thái đích sau khi chuyển đổi | **CONFIRMED** |
| `changed_by_user_id` | Logical UUID / Identity | NULLABLE | NULL | FK | Tham chiếu người/hệ thống đổi trạng thái (NULL đại diện cho tác vụ hệ thống tự động) | **CONFIRMED** |
| `change_reason` | String / Text | NULLABLE | NULL | None | Diễn giải lý do đổi trạng thái (Ví dụ: System Timeout, User Cancel) | **CONFIRMED** |
| `created_at` | Timestamp | NOT NULL | CURRENT_TS | None | Mốc thời gian ghi nhận bản ghi lịch sử | **CONFIRMED** |

*Ghi chú Semantic về Actor:* `changed_by_user_id` nhận giá trị `NULL` đại diện cho các chuyển đổi trạng thái do hệ thống tự động thực thi (System-generated state transition, ví dụ: cronjob quét hết hạn hold), tuân thủ định nghĩa state machine của Backend Architecture.

---

## 5. BOOKING STATUS MODEL & CONFLICT IDENTITY

### 5.1 Booking Status Model & State Semantics
- **Tập 8 Trạng thái Chuẩn:** `AVAILABLE`, `HOLDING`, `PAYMENT_PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `PAYMENT_FAILED` (`BR-BOOK-008..014`).
- **Lưu ý Ranh giới Trạng thái (Status Boundary Clarification):**
  - Giá trị `AVAILABLE` được bảo tồn vì thuộc tập trạng thái chính thức của Nguồn Sự Thật.
  - **Booking Lifecycle ≠ Court Slot Availability:** Trạng thái vòng đời `Booking` không đồng nhất tuyệt đối với trạng thái khả dụng thực tế của Sân con (`Court Slot Availability`). Quan hệ ngữ nghĩa này sẽ tiếp tục được thẩm định và đối chiếu tại Task 08.01 và Task 09.04.

### 5.2 Time Model & Concurrency Conflict Identity
- **Mô hình Lưu Trữ Thời Gian (Time Storage Model):**
  - Sử dụng cặp cột rời **`booking_date` (Date)** kết hợp **`start_time` (Time)** và **`end_time` (Time)** tuân thủ 100% Nguồn Sự Thật `05-data-model.md` Section 3.8.
- **Định Danh Xung Đột Chống Đặt Trùng (Conflict Identity Matrix):**

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           CONCURRENCY CONFLICT IDENTITY MATRIX                                         │
├──────────────────────────┬─────────────────────────────────────────────────────────┬───────────────────┬───────────────┤
│ Field / Property         │ Role in Conflict Identity                               │ Authority Source  │ Status        │
├──────────────────────────┼─────────────────────────────────────────────────────────┼───────────────────┼───────────────┤
│ `court_id`               │ Định danh Sân con bị tranh chấp slot                    │ BR-BOOK-003       │ **REQUIRED**  │
│ `booking_date`           │ Ngày diễn ra trận đấu                                   │ BR-BOOK-003       │ **REQUIRED**  │
│ `start_time`             │ Giờ bắt đầu khung slot                                  │ BR-BOOK-003       │ **REQUIRED**  │
│ `end_time`               │ Giờ kết thúc khung slot                                 │ BR-BOOK-003       │ **REQUIRED**  │
│ `booking_status`         │ Cờ lọc trạng thái đang chiếm giữ (`HOLDING`, `CONFIRMED`)│ BR-BOOK-003, 011  │ **REQUIRED**  │
└──────────────────────────┴─────────────────────────────────────────────────────────┴───────────────────┴───────────────┘
```

> [!WARNING]  
> **CẢNH BÁO QUAN TRỌNG VỀ ĐẶT TRÙNG (DOUBLE BOOKING PREVENTION WARNING):**  
> Bộ thuộc tính Conflict Identity (`court_id`, `booking_date`, `start_time`, `end_time`, `booking_status`) là đầu vào logic cho thuật toán phát hiện xung đột. Bộ thuộc tính này **TUYỆT ĐỐI KHÔNG DÙNG LÀM RÀNG BUỘC UNIQUE CSDL (MUST NOT BE INTERPRETED AS A DATABASE UNIQUE CONSTRAINT)**. Các khoảng thời gian trùng đè (Overlapping time intervals) đòi hỏi động cơ phát hiện xung đột và xử lý tranh chấp đồng thời thuộc quyền sở hữu của **Task 08.05 (Conflict Detection)** và **Task 09.03 (Double Booking Protection)**. Schema Task 03.04 hỗ trợ dữ liệu nhưng không độc lập đảm bảo ngăn chặn đặt trùng ở tầng CSDL.

---

## 6. PAYMENT & REVIEW BOUNDARY SEPARATION

- **Ranh giới Phân định Thanh toán (Payment Boundary):**
  - Bảng `bookings` tuyệt đối **KHÔNG lưu trữ** dữ liệu giao dịch cổng MoMo (`trans_id`, `signature`, raw IPN JSON payload, tài khoản ngân hàng).
  - Không thêm cột `booking.payment_id` khi quyết định cấp số **`TBD-DM-003 — OPEN DECISION`** (`Booking ||..o{ Payment`) chưa được duyệt chính thức từ phân hệ Thanh toán.
  - Cấp số và cấu trúc liên kết `Booking ↔ Payment` phải được chốt chính thức bởi thiết kế Phân hệ Thanh toán trước khi đóng băng ràng buộc khóa ngoại liên phân hệ (Cross-domain FK).
- **Ranh giới Phân định Đánh giá (Review Boundary & Logical Dependency):**
  - Thực thể `REVIEWS` nằm ngoài phạm vi bảng vật lý của Task 03.04 (EXTERNAL / OUT OF SCOPE).
  - Quan hệ `Booking ||--o| Review` trong sơ đồ ERD thuần túy biểu diễn điều kiện cho phép nghiệp vụ (`Review Eligibility Relationship` khi `booking_status = COMPLETED` theo `BR-REVIEW-001`) và không tạo khóa ngoại vật lý trong scope 03.04.

---

## 7. BOOKING RELATIONSHIP MATRIX (MA TRẬN MỐI QUAN HỆ BOOKING DOMAIN)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           BOOKING RELATIONSHIP MATRIX TABLE                                            │
├───────────────────┼─────────────────────────┼─────────────┼────────────────────┼───────────┼──────────────┼────────────┤
│ Parent Table      │ Child Table             │ Cardinality │ Logical FK Column  │ Optional? │ Physical FK  │ Status     │
├───────────────────┼─────────────────────────┼─────────────┼────────────────────┼───────────┼──────────────┼────────────┤
│ `users` (Customer)│ `bookings`              │ `1 : N`     │ `customer_user_id` │ Optional* │ TBD (Task3.6)│ CONFIRMED  │
│ `courts`          │ `bookings`              │ `1 : N`     │ `court_id`         │ Required  │ TBD (Task3.6)│ CONFIRMED  │
│ `users` (Cancel)  │ `bookings`              │ `1 : N`     │ `cancelled_by_user`│ Optional  │ TBD (Task3.6)│ CONFIRMED  │
│ `bookings`        │ `booking_status_history`│ `1 : N`     │ `booking_id`       │ Required  │ TBD (Task3.6)│ CONFIRMED  │
│ `users` (Actor)   │ `booking_status_history`│ `1 : N`     │ `changed_by_user`  │ Optional  │ TBD (Task3.6)│ CONFIRMED  │
│ `bookings`        │ `payments` (Task 03.05) │ `TBD-DM-003`│ Logical Ref        │ Optional  │ TBD-DM-003    │ TBD-DM-003 │
└───────────────────┴─────────────────────────┴─────────────┴────────────────────┴───────────┴──────────────┴────────────┘
```

*\*Optional khi booking_source = MANUAL_OFFLINE.*

---

## 8. BOOKING DATABASE ERD (MERMAID DIAGRAM)

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : "places (customer_user_id)"
    USERS ||--o{ BOOKINGS : "cancels (cancelled_by_user_id)"
    USERS ||--o{ BOOKING_STATUS_HISTORY : "changes_status (changed_by_user_id)"

    COURTS ||--o{ BOOKINGS : "booked_for (court_id)"

    BOOKINGS ||--o{ BOOKING_STATUS_HISTORY : "tracks_history (booking_id)"
    BOOKINGS ||..o{ PAYMENTS_EXTERNAL : "paid_via (Cardinality: TBD-DM-003 OPEN)"
    BOOKINGS ||--o| REVIEWS_EXTERNAL : "reviewed_by (Eligibility: CONFIRMED)"

    BOOKINGS {
        booking_id PK
        customer_user_id FK
        court_id FK
        booking_date
        start_time
        end_time
        total_amount
        currency
        booking_source
        booking_status
        hold_expiry_at
        cancellation_reason
        cancelled_by_user_id FK
        cancelled_at
        created_at
        updated_at
    }

    BOOKING_STATUS_HISTORY {
        history_id PK
        booking_id FK
        from_status
        to_status
        changed_by_user_id FK
        change_reason
        created_at
    }
```

*Ghi chú ERD:* `PAYMENTS_EXTERNAL` và `REVIEWS_EXTERNAL` đại diện cho các ranh giới phụ thuộc logic ngoài phạm vi bảng vật lý của Task 03.04.

---

## 9. REQUIREMENTS TRACEABILITY MATRIX (BOOKING DOMAIN)

All currently confirmed Booking requirements are traceable; open architectural decisions and inherited dependencies remain explicitly tracked.

| Requirement / Business Rule | Target Booking Table | Target Column / Relationship | Verification Result | Status |
|---|---|---|---|---|
| **FR-BOOK-001 (Availability Grid)**| `bookings` | `court_id`, `booking_date`, `start_time`, `end_time` | Slot grid availability supported | **PASS** |
| **FR-BOOK-002 (Slot Select)** | `bookings` | `total_amount`, `currency` | Total amount calculation supported | **PASS** |
| **FR-BOOK-003 (Hold 10m)** | `bookings` | `booking_status=HOLDING`, `hold_expiry_at` | 10-minute hold countdown supported | **PASS** |
| **FR-BOOK-009 (Cancel)** | `bookings` | `booking_status=CANCELLED`, `cancellation_reason` | Booking cancellation supported | **PASS** |
| **FR-OWNER-001 (Manual Offline)**| `bookings` | `booking_source=MANUAL_OFFLINE`, `customer_user_id=NULL` | Offline manual booking supported | **PASS** |
| **BR-BOOK-003 (Double Booking)**| `bookings` | Conflict Identity Tuple (`court_id`, `date`, `time`, `status`)| Concurrency conflict identity supported | **PASS** |
| **BR-BOOK-008..014 (8 States)** | `bookings`, `booking_status_history`| `booking_status`, `from_status`, `to_status` | 8 booking state transitions supported | **PASS** |
| **BR-OWNER-001 (Offline Source)**| `bookings` | `booking_source` | Manual offline source flag supported | **PASS** |
| **BR-CANCEL-001 (Cancellation)** | `bookings` | `cancelled_by_user_id`, `cancelled_at` | Cancellation audit supported | **PASS** |

---

## 10. CROSS-TASK ARCHITECTURE CONSISTENCY

- **Consistency với Task 03.01 (Database ERD):**
  - Giữ nguyên 100% Khóa chính `booking_id` đã phê duyệt tại Task 03.01 (`29-database-erd.md`).
  - Giữ nguyên quan hệ `Court 1 : N Booking` và bảo lưu `TBD-DM-003` (Payment Cardinality).
- **Consistency với Task 03.02 (Auth Tables) & Task 03.03 (Venue Tables):**
  - Tham chiếu chính xác Khóa ngoại `customer_user_id` -> `users.user_id` (Task 03.02) và `court_id` -> `courts.court_id` (Task 03.03).
- **Compatibility với Downstream Phases:**
  - **Phase 08 (Availability & Conflict):** Cung cấp bộ thuộc tính định danh xung đột chuẩn xác cho động cơ kiểm tra khả dụng.
  - **Phase 09 (Booking Implementation):** Cung cấp cấu trúc bảng lưu vết 8 trạng thái và đơn thủ công tại sân.
  - **Phase 10 (Payment Implementation):** Đảm bảo ranh giới phân định sạch với bảng `payments`.

---

## 11. TBD GOVERNANCE & GAP CLASSIFICATION

### 11.1 Booking-Owned Open Items
```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           BOOKING-OWNED OPEN ITEMS TABLE                                               │
├──────────────┬──────────────────────────────────┬───────────────┬───────────┬───────────────────┬──────────────────────┤
│ Decision ID  │ Open Decision Description        │ Status        │ Impact    │ Authority Owner   │ Required Next Action │
├──────────────┼──────────────────────────────────┼───────────────┼───────────┼───────────────────┼──────────────────────┤
│ `TBD-BOOK-01`│ Timezone Storage Specification   │ OPEN DECISION │ Medium    │ Database Architect│ Defer to Task 03.06  │
└──────────────┴──────────────────────────────────┴───────────────┴───────────┴───────────────────┴──────────────────────┘
```

*Đánh giá TBD-BOOK-01:* Trạng thái `NON-BLOCKING GAPS`, mức ảnh hưởng kiến trúc `MEDIUM`. Quy tắc lưu múi giờ (Local Venue Time vs UTC timestamp vs offset-aware storage) ảnh hưởng tới biên ngày đặt sân, thời hạn đếm ngược 10 phút, và thông báo nhắc lịch. Kiến trúc bảo tồn cấu trúc rời `Date + Time` và hoãn chốt phương án vật lý sang Task 03.06 và Backend Engine.

### 11.2 Inherited Architectural Dependencies
```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      INHERITED ARCHITECTURAL DEPENDENCIES TABLE                                        │
├──────────────┬──────────────────────────────────┬───────────────────────────────────────┬──────────────────────────────┤
│ Dependency ID│ Open Decision Description        │ Impact on Task 03.04                  │ Resolution Authority / Task  │
├──────────────┼──────────────────────────────────┼───────────────────────────────────────┼──────────────────────────────┤
│ `TBD-DM-003` │ Payment Cardinality (1:0..1/1:N) │ Giữ ranh giới đứt nét; Chưa tạo FK    │ Task 03.05 Payment Tables    │
│ `TBD-DM-004` │ Pay-at-venue Status (UNPAID)     │ Inherited dependency                  │ Business / Product (OQ-002)  │
│ `TBD-DM-001` │ Review Target Scope (Venue/Court)│ Inherited dependency (Review Scope)   │ Business / Product (OQ-003)  │
│ `TBD-DM-002` │ Cancellation Refund Log Format   │ Inherited dependency (Refund Logs)    │ Business / Payment (OQ-001)  │
└──────────────┴──────────────────────────────────┴───────────────────────────────────────┴──────────────────────────────┘
```

---

## 12. SCOPE BOUNDARY CHECK

- **IN SCOPE:**
  - Bảng vật lý phân hệ Booking (`bookings` và `booking_status_history`).
  - Thuộc tính, kiểu dữ liệu logical, tính Nullable, Khóa chính/Khóa ngoại logical.
  - Bộ định danh xung đột đặt trùng và ma trận truy vết 8 trạng thái đơn hàng.
- **OUT OF SCOPE (DEFERRED TO DOWNSTREAM TASKS):**
  - Task 03.05: Payment Physical Tables (`payments`).
  - Task 03.06: Physical Database Indexes, Foreign Key Constraints (`CASCADE` / `RESTRICT`), & SQL DDL scripts.
  - Phase 08: Thuật toán phát hiện xung đột thời gian trùng lặp thực tế (`08.05`).
  - Phase 09: Cơ chế khóa giao dịch chống đặt trùng (`09.03`) và Mã nguồn Backend Controllers.

---

## 13. FINAL VALIDATION TABLE

| Check | Result | Evidence / Note |
|---|---|---|
| Booking Core Schema | PASS | `bookings` table specified with 16 logical attributes |
| Booking Status Model | PASS WITH SEMANTIC DEPENDENCY | 8 states supported; Booking Lifecycle ≠ Slot Availability clarify |
| Customer Relation | PASS | `customer_user_id` FK specified; Conditional nullability for MANUAL_OFFLINE |
| Court Relation | PASS | `court_id` FK specified; 1:N relationship aligned with Task 03.01 |
| Time Model | PASS WITH TBD | `booking_date`, `start_time`, `end_time` specified per approved 03.01 baseline |
| Timezone | NON-BLOCKING TBD | Tracked transparently under TBD-BOOK-01 (Medium Impact) |
| Hold Expiration | PASS — persistence only | `hold_expiry_at` persisted; Automatic worker transition deferred |
| Cancellation | PASS | `cancellation_reason`, `cancelled_by_user_id`, `cancelled_at` specified |
| Reschedule | DEFERRED | Future Scope (`OQ-005`) preserved; Out of MVP scope |
| Price Snapshot | PASS | `total_amount` & `currency` specified (`BR-PAY-003`) |
| Payment Boundary | PASS WITH TBD-DM-003 | Zero payment gateway transaction secrets in `bookings`; Clean separation |
| Conflict Identity | PASS — logical only | Tuple (`court_id`, `date`, `time`, `status`) documented for concurrency |
| Double Booking Prevention | DEFERRED TO 08.05 / 09.03 | Schema supports identity; Concurrency locking deferred downstream |
| Status History | PASS | `booking_status_history` specified; NULL actor semantic clarified |
| PK | PASS | 100% aligned with Task 03.01 PK identity (`booking_id`) |
| Logical FK | PASS | Logical FK relationships specified; Physical FK actions deferred to Task 03.06 |
| Physical Constraints | DEFERRED TO 03.06 | Physical UNIQUE, exclusion constraints, index strategy deferred |
| Security | PASS | Zero password/secret duplication; Customer relation references Auth User |
| 03.01 Consistency | PASS | 100% consistent with Task 03.01 Core MVP ERD baseline |
| 03.02 Consistency | PASS | 100% consistent with Task 03.02 User FK references (`users.user_id`) |
| 03.03 Consistency | PASS | 100% consistent with Task 03.03 Court FK references (`courts.court_id`) |
| Phase 08 Compatibility | PASS | Conflict Identity Tuple specified for Availability Engine |
| Phase 09 Compatibility | PASS | 8 Booking States & State Transition Audit supported |
| Phase 10 Compatibility | PASS WITH PAYMENT TBD | Clean Payment domain boundary preserved |
| Scope Control | PASS | Zero scope creep into Payment (03.05), DDL (03.06), or Locking Engine (Phase 08/09) |
| TBD Governance | PASS | Booking-owned items & inherited dependencies explicitly classified |
| Traceability | PASS — CONFIRMED REQUIREMENTS | Confirmed requirements traceable; Open dependencies tracked |
| Contradiction Scan | PASS | Zero internal contradictions detected across document |

---

## 14. DEFINITION OF DONE (DoD) & FINAL APPROVAL GATE

```text
================================================================================────────
                               APPROVAL DECISION SECTION
================================================================================────────

TASK:                  03.04 — Booking Tables

FINAL DECISION:        PASS WITH NON-BLOCKING GAPS

APPROVAL READINESS:    READY FOR APPROVAL

BLOCKING ISSUES:       0

OPEN / NON-BLOCKING:
1. TBD-BOOK-01 — Timezone Storage Specification
2. TBD-DM-003 — Payment Relationship/Cardinality
3. Other inherited TBDs — explicitly classified as dependencies

MANDATORY DOWNSTREAM HANDOFF:
- 03.05 — Payment Tables must resolve Payment relationship implications.
- 03.06 — Index & Constraints must finalize physical constraints/indexes.
- 08.01 — Court Availability must validate timezone and availability semantics.
- 08.05 — Conflict Detection must implement overlap logic.
- 09.03 — Double Booking Protection must implement concurrency protection.
- 09.04 — Booking Status must validate lifecycle semantics.

NEXT TASK:             03.05 — Payment Tables
================================================================================────────
```

---

## 15. NEXT TASK HANDOFF

- **Next Task:** **`TASK 03.05 — Payment Tables`**
- Task 03.04 khép lại giai đoạn thiết kế CSDL Phân hệ Đặt Sân (Booking Domain). Mọi chi tiết thiết kế bảng vật lý cho Phân hệ Thanh toán (`payments`, cổng MoMo IPN logs, đối soát giao dịch) sẽ được triển khai tại Task 03.05.

---
*Tài liệu Đặc tả Bảng Vật lý Phân hệ Đặt Sân (Phiên bản Hiệu chỉnh) được thiết lập bởi Antigravity AI Assistant cho dự án SportHubAI.*
