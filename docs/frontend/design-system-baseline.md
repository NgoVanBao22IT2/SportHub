# Frontend Design System Baseline

## 1. Purpose

Tài liệu này tổng hợp và đặc tả **hiện trạng hệ thống thiết kế giao diện (Design System Baseline)** của dự án SportHubAI dựa trên việc kiểm tra toàn bộ mã nguồn Frontend hiện tại (`tailwind.config.js`, `src/index.css`, `Navbar.jsx`, `Footer.jsx`, `CustomerLayout.jsx`, `HomePage.jsx`, `VenueDetail.jsx`).

Mục đích:
* Ghi nhận chính xác các giá trị Visual Tokens, Typography, Color Palette, Component Patterns đang tồn tại trong mã nguồn.
* Đánh giá các điểm bất bất đồng bộ (Inconsistencies) và thiếu sót (Design System Gaps) trước khi thiết kế các Primitives tiêu chuẩn.
* TUYỆT ĐỐI KHÔNG tự ý tái thiết kế, thay đổi màu sắc, refactor hay chỉnh sửa các trang đang chạy.

---

## 2. Existing Design Tokens

| Category | Existing Value | Source | Usage | Recommendation |
|---|---|---|---|---|
| **Color (Primary)** | `#09b69b` | `tailwind.config.js` (`colors.primary`) | Header, Footer background, CTA buttons, active tabs, icon highlights | **KEEP** |
| **Color (Secondary)** | `#f9f9f9` | `tailwind.config.js` (`colors.secondary`) | Light section backgrounds, page background fallback | **KEEP** |
| **Color (Dark)** | `#111827` | `tailwind.config.js` (`colors.dark`) | Dark card backgrounds, high-contrast banners | **KEEP** |
| **Color (Accent/CTA)** | `bg-orange-500` / `#f97316` | Hardcoded in `Navbar`, `HomePage`, `VenueDetail` | Primary action buttons ("Đăng ký", "Đặt sân ngay", "Đặt lịch") | **STANDARDIZE** |
| **Color (Accent Hover)** | `hover:bg-orange-600` | Hardcoded in `Navbar`, `HomePage`, `VenueDetail` | Button hover state | **STANDARDIZE** |
| **Color (Accent Light)** | `bg-orange-100`, `text-orange-600` | Hardcoded in `HomePage`, `VenueDetail` | Rating badge bg, secondary button bg | **STANDARDIZE** |
| **Color (Emerald Light)**| `bg-emerald-50`, `text-emerald-500` | Hardcoded in `HomePage`, `VenueDetail` | Category icon background, checkmark icons | **STANDARDIZE** |
| **Color (Blue Accent)** | `bg-blue-50`, `text-blue-600` | Hardcoded in `HomePage`, `VenueDetail` | Ecosystem cards, info icons | **STANDARDIZE** |
| **Typography (Family)**| `'Inter', sans-serif` | `tailwind.config.js` & Google Fonts | Global body & heading typography | **KEEP** |
| **Typography (Base)** | `antialiased text-gray-900 bg-white font-sans` | `src/index.css` | Global `<body>` reset | **KEEP** |
| **Spacing (Container)**| `max-w-7xl` (1280px), `max-w-5xl` (1024px) | `Navbar`, `Footer`, `HomePage`, `VenueDetail` | Page content width constraints | **STANDARDIZE** |
| **Radius (Card)** | `rounded-2xl` (16px), `rounded-3xl` (24px) | `HomePage`, `VenueDetail` | Feature cards, promo banners | **STANDARDIZE** |
| **Radius (Button/Input)**| `rounded-lg` (8px), `rounded-full` (9999px) | `Navbar`, `HomePage`, `VenueDetail` | Search box, buttons, pills | **STANDARDIZE** |
| **Shadow (Card)** | `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl` | `HomePage`, `VenueDetail` | Card elevation hierarchy | **STANDARDIZE** |
| **Breakpoint** | `md` (768px), `lg` (1024px) | `Navbar`, `Footer`, `HomePage`, `VenueDetail` | Responsive layout switching | **KEEP** |

---

## 3. Typography

### Font Family
* **Primary Sans:** `'Inter', sans-serif` (đã khai báo trong `tailwind.config.js` và áp dụng cho toàn bộ `body` tại `src/index.css`).

### Heading Scale (Đang sử dụng thực tế trong code)
* **Display / Hero Heading:** `text-4xl md:text-5xl lg:text-6xl` (`font-bold`, `drop-shadow-md`) - Ví dụ: Hero section tại `HomePage.jsx`.
* **Section Heading (H2):** `text-2xl md:text-3xl` (`font-bold`, `text-gray-900`) - Ví dụ: "Khám phá", "Sân thể thao nổi bật" tại `HomePage.jsx`.
* **Card / Subsection Heading (H3):** `text-2xl md:text-3xl` hoặc `text-xl` (`font-bold`, `text-gray-900`) - Ví dụ: Tên sân tại `VenueDetail.jsx`.
* **Feature Title (H4):** `text-xl` (`font-bold`, `text-gray-900`) - Ví dụ: Ecosystem cards.

### Body & Caption Scale
* **Body Large:** `text-lg` (`text-white/90`) - Subtitle dưới hero banner.
* **Body Normal:** `text-sm` (`text-gray-600`, `leading-relaxed`) - Mô tả sân, giới thiệu, văn bản thông thường.
* **Caption / Label Small:** `text-xs` (`font-medium`, `text-gray-500`) - Input labels, rating badge text, timestamps.
* **Micro Tag:** `text-[10px]` - Badges "Sắp ra mắt", "(1k+) reviews".

---

## 4. Color System

### Base Palette (Khai báo tại Config)
* **`primary` (`#09b69b`):** Màu thương hiệu xanh ngọc emerald. Dùng làm nền Header/Footer, viền tab active, icon chính.
* **`secondary` (`#f9f9f9`):** Màu xám nhạt nền phụ.
* **`dark` (`#111827`):** Màu xám đen Slate-900.

### Palette Thực Tế (Hardcoded trong Component Pages)
* **Brand Accents (Nổi bật & Nút bấm):**
  * `bg-orange-500` / `hover:bg-orange-600`: Nút Đặt lịch, Đăng ký.
  * `bg-orange-400` / `hover:bg-orange-500`: Nút Đặt lịch ở Venue Cards.
  * `bg-orange-100` / `text-orange-600`: Rating badge, nút Đặt lịch dạng viền nhạt.
* **Status Colors:**
  * **Success / Available:** `text-emerald-500`, `bg-emerald-50`, `border-emerald-100`.
  * **Rating / Warning:** `text-yellow-400`, `fill-yellow-400`, `bg-orange-100`.
  * **Error / Badge:** `bg-red-500` (Red dot trên nút thông báo).
* **Neutrals:**
  * Backgrounds: `bg-white`, `bg-gray-50`, `bg-gray-50/50`.
  * Borders: `border-gray-100`, `border-gray-200`, `border-gray-300`, `border-white/20`.
  * Texts: `text-gray-900`, `text-gray-800`, `text-gray-700`, `text-gray-600`, `text-gray-500`, `text-gray-400`, `text-white`, `text-white/90`.

---

## 5. Spacing

Hệ thống Spacing tuân theo thang chuẩn 4px của Tailwind:
* **Padding Nội dung Trang:** `px-4` (Mobile), `py-12`, `py-16`, `py-24` (Sections).
* **Gap Lưới (Grid Gaps):** `gap-3`, `gap-4`, `gap-6`, `gap-8`, `gap-16`.
* **Margin Phần tử:** `mb-1`, `mb-2`, `mb-4`, `mb-6`, `mb-8`, `mb-10`.
* **Component Padding:** `p-2 md:p-3` (Search box), `p-5`, `p-6`, `p-8` (Cards & Sections).

---

## 6. Radius & Shadows

### Border Radius
* `rounded-md` (6px): Logo badge, tag "Mã: NEWPICA".
* `rounded-lg` (8px): Nút bấm chuẩn, ô input search, card vị trí map.
* `rounded-xl` (12px): Ô tìm kiếm lớn, card giới thiệu, logo venue.
* `rounded-2xl` (16px): Card sân thể thao nổi bật, bento photo, card tổng quan venue.
* `rounded-3xl` (24px): Banner khuyến mãi lớn, card hệ sinh thái AI.
* `rounded-full` (9999px): Nút đăng nhập/đăng ký dạng pill, nút Yêu thích tròn, avatar icon.

### Shadows
* `shadow-sm`: Border shadow nhẹ cho Card.
* `shadow-md`: Banner khuyến mãi, logo container.
* `shadow-lg`: Card thông tin venue nổi, hover effect trên category card.
* `shadow-xl`: Khung tìm kiếm Hero.
* `shadow-2xl`: Hero Image container trong phần Ecosystem.

---

## 7. Responsive System

### Breakpoints
* **`md` (768px):** Chuyển đổi Navbar từ mobile sang desktop links; Chuyển Search box từ dạng dọc (stack) sang dạng ngang (flex-row); Chuyển grid sân từ 1 cột sang 2 cột.
* **`lg` (1024px):** Chuyển grid sân nổi bật từ 2 cột sang 4 cột; Chuyển Layout thông tin sân từ 1 cột sang 3 cột (2 cột info + 1 cột map).

### Container Constraints
* `max-w-7xl` (1280px): Dùng cho Navbar, Footer, HomePage container.
* `max-w-5xl` (1024px): Dùng cho VenueDetail container.

---

## 8. Existing Component Inventory

| Component Pattern | Existing Location | Reused? | Candidate Category |
|---|---|---|---|
| **Header Layout / Navbar** | `src/components/Navbar.jsx` | Yes (`CustomerLayout`) | **COMPOSITE** |
| **Footer Layout** | `src/components/Footer.jsx` | Yes (`CustomerLayout`) | **COMPOSITE** |
| **Page Layout Wrapper** | `src/components/CustomerLayout.jsx` | Yes (`App.jsx`) | **FOUNDATION** |
| **Hero Search Bar** | `src/pages/customer/HomePage.jsx` | No (Page-specific) | **FEATURE-SPECIFIC** |
| **Venue Card Item** | `src/pages/customer/HomePage.jsx`, `VenueDetail.jsx` | Yes (Duplicated code) | **PRIMITIVE / COMPOSITE** |
| **Sport Category Card** | `src/pages/customer/HomePage.jsx` | No | **COMPOSITE** |
| **Promo Banner Card** | `src/pages/customer/HomePage.jsx` | No | **FEATURE-SPECIFIC** |
| **Venue Overlapping Info Card**| `src/pages/customer/VenueDetail.jsx` | No | **FEATURE-SPECIFIC** |
| **Tab Bar Navigation** | `src/pages/customer/VenueDetail.jsx` | No | **PRIMITIVE** |
| **Bento Gallery Grid** | `src/pages/customer/VenueDetail.jsx` | No | **COMPOSITE** |
| **Rating Badge** | `HomePage.jsx`, `VenueDetail.jsx` | Yes (Hardcoded inline) | **PRIMITIVE** |
| **Favorite Heart Button** | `HomePage.jsx`, `VenueDetail.jsx` | Yes (Hardcoded inline) | **PRIMITIVE** |
| **Primary Action Button** | Inline across all pages | Yes (Inconsistent styles) | **PRIMITIVE** |
| **Form Text Input** | `HomePage.jsx` Search Box | Inline | **PRIMITIVE** |

---

## 9. Existing Page Patterns

### `HomePage.jsx` Patterns
1. **Hero Section:** Ảnh nền lớn `500px` phủ màng đen `bg-black/40`, chữ tiêu đề `text-4xl md:text-6xl`, thanh search float bo góc `rounded-xl`.
2. **Category Grid:** Lưới 6 cột trên Desktop (`grid-cols-2 md:grid-cols-3 lg:grid-cols-6`), card trắng bo góc `rounded-2xl` hiệu ứng hover scale icon.
3. **Banner Section:** Lưới bất đối xứng `lg:grid-cols-3`, banner chính chiếm 2 cột có màng mờ mầu xanh gradient.
4. **Venue Listing:** Lưới 4 cột (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`), card tràn viền ảnh `h-48`, nút Đặt lịch màu cam nhạt `bg-orange-100 text-orange-600`.

### `VenueDetail.jsx` Patterns
1. **Hero Banner:** Banner `400px` có ảnh nền.
2. **Overlapping Info Card:** Card màu trắng đè lên Hero Banner (`-mt-24 z-10`), logo nhô lên phía trên (`-mt-12 md:-mt-16`), thông tin chính xếp bên trái và 2 nút Action bên phải.
3. **Tabs Navigation:** Thanh tab cuộn ngang (`overflow-x-auto border-b`), đường viền bên dưới màu primary khi active (`border-primary text-primary`).
4. **Bento Gallery:** Khung 12 cột trên desktop (`grid-cols-12`), 1 ảnh chính 7 cột bên trái + 4 ảnh phụ lưới 2x2 bên phải (5 cột), ô cuối có overlay xem tất cả.

---

## 10. Inconsistencies Report

### INC-001: Không đồng bộ màu sắc Nút bấm Đặt Lịch (CTA Buttons)
* **Location:** `HomePage.jsx` (Dòng 195) vs `VenueDetail.jsx` (Dòng 126) vs `VenueDetail.jsx` Similar Venues (Dòng 319).
* **Description:** Nút "Đặt lịch" ở cùng 1 dạng Card sân nhưng có 3 kiểu màu khác nhau.
* **Evidence:**
  * `HomePage.jsx`: `bg-orange-100 hover:bg-orange-500 text-orange-600 hover:text-white`
  * `VenueDetail.jsx` (Header Card): `bg-orange-500 hover:bg-orange-600 text-white`
  * `VenueDetail.jsx` (Similar Card): `bg-orange-400 hover:bg-orange-500 text-white`
* **Severity:** HIGH (Ảnh hưởng trực tiếp đến nhận diện thương hiệu và tính nhất quán UX).

---

### INC-002: Trùng lặp và không nhất quán mã nguồn Card Sân (Venue Card Duplicate)
* **Location:** `HomePage.jsx` (Dòng 174-200) vs `VenueDetail.jsx` (Dòng 228-252).
* **Description:** Cùng hiển thị Card Sân thể thao nhưng được viết lặp lại code 2 lần độc lập với kích thước ảnh (`h-48` vs `h-44`), màu sắc rating badge (`bg-white/90` vs `bg-white/90 backdrop-blur-sm`), và màu nút Yêu thích khác nhau.
* **Evidence:** `HomePage.jsx` dùng `bg-white/50 backdrop-blur-md text-gray-700`, trong khi `VenueDetail.jsx` dùng `bg-black/20 backdrop-blur-md text-white`.
* **Severity:** MEDIUM (Gây tốn thời gian bảo trì và khác biệt giao diện nhẹ).

---

### INC-003: Không nhất quán kích thước bo góc (Border Radius Inconsistency)
* **Location:** Toàn bộ `HomePage.jsx` và `VenueDetail.jsx`.
* **Description:** Sử dụng hỗn hợp rất nhiều cấp độ bo góc không theo quy tắc rõ ràng (`rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full`).
* **Evidence:** Card sản phẩm dùng `rounded-2xl`, nhưng banner dùng `rounded-3xl`, ô search dùng `rounded-xl`, nút bấm dùng lúc `rounded-lg`, lúc `rounded-full`.
* **Severity:** LOW (Ảnh hưởng thẩm mỹ visual nhịp nhàng).

---

### INC-004: Giá trị màu sắc bị Hardcode thay vì dùng Tailwind Tokens
* **Location:** `Navbar.jsx`, `HomePage.jsx`, `VenueDetail.jsx`.
* **Description:** Nhiều vị trí sử dụng trực tiếp các class màu ngẫu nhiên của Tailwind (`text-green-200`, `bg-emerald-50`, `bg-orange-500`, `bg-blue-50`, `text-orange-600`) thay vì dùng các tokens ngữ nghĩa (Semantic Tokens).
* **Evidence:** `Navbar.jsx` dùng `hover:text-green-200` khi background là `bg-primary` (`#09b69b`).
* **Severity:** MEDIUM.

---

## 11. Design System Gaps

1. **Thiếu Semantic Color Tokens:**
   * Chưa có token cho `surface`, `border-subtle`, `text-muted`, `accent-primary`, `status-success`, `status-warning`, `status-error`.
2. **Thiếu Primitive UI Components:**
   * Chưa có Reusable Component cho: `Button`, `Input`, `Badge`, `Card`, `Modal`, `Tabs`, `Skeleton`, `EmptyState`, `ErrorState`. Tất cả đang được viết inline HTML/Tailwind trực tiếp trong Pages.
3. **Thiếu Form & Input States:**
   * Các ô Input chưa có thiết kế chuẩn cho `Focus ring`, `Error state`, `Disabled state`, `Helper text`.
4. **Thiếu Data Loading & Empty Patterns:**
   * `HomePage.jsx` và `VenueDetail.jsx` đang dùng Vòng xoay Spinner cơ bản (`animate-spin`) thay vì Skeleton loader chuẩn theo khung layout.
   * Empty state đang là text thuần `"Chưa có sân thể thao nào."` thiếu hình minh họa và CTA khôi phục.

---

## 12. Recommended Foundation (Hướng Đề Xuất Cho Phase Tiếp Theo)

* **Thiết lập Semantic Tokens:** Mở rộng `tailwind.config.js` để định nghĩa màu Nổi bật (`brand-orange`: `#f97316`), màu Nền (`surface`), màu Trạng thái (`success`, `warning`, `error`).
* **Trích xuất Primitives:** Đóng gói các thành phần giao diện nhỏ dùng lại nhiều lần thành Component Primitives độc lập đặt tại `src/components/ui/`:
  * `Button.jsx` (Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`)
  * `Badge.jsx` (Variants: `success`, `warning`, `neutral`, `rating`)
  * `Card.jsx` & `VenueCard.jsx` (Component Card chuẩn hóa dùng chung cho Trang chủ, Search và Similar Venues)
  * `Input.jsx` (Hỗ trợ Label, Icon, Error message)
  * `Skeleton.jsx` (Thay thế spinner xoay)

---

## 13. Risks

* **Risk 01 (Visual Regression):** Việc chuẩn hóa các nút bấm và Card có thể làm thay đổi kích thước nhẹ trên giao diện Trang chủ nếu không kiểm tra kỹ trên các màn hình Mobile/Desktop.
* **Risk 02 (Props Drift):** Nếu trích xuất `VenueCard` không bao quát hết các trường dữ liệu bị thiếu từ Backend (ví dụ `rating` hoặc `phone`), card có thể bị lỗi vỡ layout khi nhận data thật.

---

## 14. Open Questions

1. **OQ-DS-01:** Màu cam (`#f97316` / `orange-500`) có chính thức được công nhận là màu Accent/CTA chính của hệ thống bên cạnh màu xanh ngọc (`primary: #09b69b`) để đưa vào `tailwind.config.js` không?
2. **OQ-DS-02:** Chuẩn bo góc cho Button và Card trong hệ thống sẽ thống nhất là `rounded-lg` (8px) / `rounded-xl` (12px) hay tiếp tục giữ `rounded-2xl` (16px)?

---

**AUDIT BASELINE COMPLETE.**  
File báo cáo đã được khởi tạo thành công tại: `docs/frontend/design-system-baseline.md`.  
Đã tuân thủ 100% chỉ định: KHÔNG chỉnh sửa code production, KHÔNG refactor trang hiện tại, KHÔNG cài thêm thư viện.  
Đang dừng lại chờ chỉ thị phê duyệt cho Task tiếp theo!
