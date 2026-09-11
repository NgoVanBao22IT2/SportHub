'use strict';

const mysql = require('mysql2/promise');
const crypto = require('crypto');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '123456789',
  database: process.env.DB_NAME || 'sporthub_db'
};

const CITIES = [
  'Quận Hải Châu, Đà Nẵng',
  'Quận Thanh Khê, Đà Nẵng',
  'Quận Sơn Trà, Đà Nẵng',
  'Quận Ngu Hanh Son, Đà Nẵng',
  'Quận 1, TP. Hồ Chí Minh',
  'Quận 3, TP. Hồ Chí Minh',
  'Quận 7, TP. Hồ Chí Minh',
  'Quận Bình Thạnh, TP. Hồ Chí Minh',
  'Quận Cầu Giấy, Hà Nội',
  'Quận Nam Từ Liêm, Hà Nội'
];

const SPORTS = ['Cầu lông', 'Pickleball', 'Bóng đá', 'Tennis', 'Bóng rổ'];

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop'
];

const AVATAR_IMAGES = [
  'https://images.unsplash.com/photo-1521537634581-0dced2efa2a3?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1530915534664-4ac6423ca938?q=80&w=400&auto=format&fit=crop'
];

async function restoreAllData() {
  console.log('🚀 Bắt đầu khôi phục toàn bộ dữ liệu database...');
  const conn = await mysql.createConnection(DB_CONFIG);
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

  try {
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0;');

    // 1. Ensure Default Facilities exist
    console.log('1️⃣ Khôi phục danh mục tiện ích (Facilities)...');
    const defaultFacilities = [
      { id: 'fac_1', name: 'Wifi miễn phí', icon: 'wifi', desc: 'Sóng mạnh toàn khu vực sân' },
      { id: 'fac_2', name: 'Bãi đỗ xe ô tô & xe máy', icon: 'parking', desc: 'Rộng rãi có bảo vệ 24/7' },
      { id: 'fac_3', name: 'Căng tin & Giải khát', icon: 'coffee', desc: 'Phục vụ nước uống, đồ ăn nhẹ' },
      { id: 'fac_4', name: 'Đèn chiếu sáng tiêu chuẩn', icon: 'lightbulb', desc: 'Hệ thống LED chống chói thi đấu' },
      { id: 'fac_5', name: 'Phòng tắm & Thay đồ', icon: 'shower', desc: 'Nước nóng lạnh sạch sẽ' },
      { id: 'fac_6', name: 'Cho thuê dụng cụ', icon: 'sports', desc: 'Vợt, bóng, giày thể thao chất lượng' }
    ];

    for (const f of defaultFacilities) {
      await conn.execute(
        `INSERT INTO facilities (facility_id, facility_name, icon_name, description, created_at)
         VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE facility_name = VALUES(facility_name)`,
        [f.id, f.name, f.icon, f.desc, nowStr]
      );
    }

    // 2. Fetch all OWNER users
    console.log('2️⃣ Tải danh sách tài khoản Chủ sân (OWNER)...');
    const [owners] = await conn.execute(
      `SELECT user_id, full_name, phone_number FROM users WHERE primary_role = 'OWNER'`
    );
    console.log(`📦 Tìm thấy ${owners.length} tài khoản Chủ sân.`);

    // Check existing venue owners
    const [existingVenues] = await conn.execute(`SELECT owner_user_id FROM venues`);
    const existingOwnerSet = new Set(existingVenues.map(v => v.owner_user_id));

    const missingOwners = owners.filter(o => !existingOwnerSet.has(o.user_id));
    console.log(`🔨 Cần khôi phục Venue/Branch/Courts cho ${missingOwners.length} Chủ sân.`);

    // Batch insert variables
    const venueInserts = [];
    const branchInserts = [];
    const courtInserts = [];
    const schedInserts = [];
    const imgInserts = [];
    const facInserts = [];
    const accountInserts = [];

    let count = 0;
    for (const owner of missingOwners) {
      count++;
      const vId = crypto.randomUUID();
      const bId = crypto.randomUUID();

      let rawName = owner.full_name || 'Cụm Sân Thể Thao';
      if (rawName.startsWith('Chủ sân ')) {
        rawName = rawName.replace('Chủ sân ', '');
      }
      const venueName = rawName;
      const phone = owner.phone_number || '0905123456';
      const cityLoc = CITIES[count % CITIES.length];
      const sportCat = SPORTS[count % SPORTS.length];

      // Venue
      venueInserts.push([
        vId, owner.user_id, venueName, phone,
        `Hệ thống cụm sân thể thao ${venueName} chất lượng cao, phục vụ tập luyện và thi đấu chuyên nghiệp.`,
        'APPROVED', nowStr, nowStr
      ]);

      // Branch
      branchInserts.push([
        bId, vId, `${venueName} - Chi nhánh chính`,
        `${(count % 150) + 1} Đường Nguyễn Hữu Thọ`, cityLoc,
        phone, 'ACTIVE', nowStr, nowStr
      ]);

      // Courts (2-4 courts per venue)
      const numCourts = (count % 3) + 2;
      for (let c = 1; c <= numCourts; c++) {
        const courtId = crypto.randomUUID();
        
        const courtName = `Sân 0${c}`;
        courtInserts.push([
          courtId, bId, courtName, sportCat, 'ACTIVE',
          'Thảm thảm thảm tiêu chuẩn thi đấu quốc tế', nowStr, nowStr
        ]);
      }

      // Schedule (05:00 - 23:00)
      schedInserts.push([
        crypto.randomUUID(), 'VENUE', vId, 'MONDAY_TO_SUNDAY',
        '05:00:00', '23:00:00', 1, nowStr, nowStr
      ]);

      // Images
      const coverUrl = COVER_IMAGES[count % COVER_IMAGES.length];
      const avatarUrl = AVATAR_IMAGES[count % AVATAR_IMAGES.length];
      imgInserts.push([
        crypto.randomUUID(), vId, owner.user_id, 'VENUE', vId,
        avatarUrl, coverUrl, avatarUrl, avatarUrl, coverUrl, coverUrl,
        'COVER', `${venueName} Cover`, 'Hình ảnh trang bìa sân', `${venueName} Cover`,
        1, 0, 1, 1, 1, 102400, 'image/jpeg', 'PUBLISHED', '[]', 1920, 1080, null, null, null, null, nowStr, nowStr
      ]);

      // Facilities
      facInserts.push([vId, 'fac_1', nowStr]);
      facInserts.push([vId, 'fac_2', nowStr]);
      facInserts.push([vId, 'fac_4', nowStr]);

      // Payment Account
      accountInserts.push([
        crypto.randomUUID(), vId, 'MOMO', venueName,
        phone, 'MoMo Wallet', phone, null, 1, nowStr, nowStr
      ]);
    }

    // Execute Batch Inserts
    if (venueInserts.length > 0) {
      console.log('📌 Đang nạp dữ liệu Venues...');
      await conn.query(
        `INSERT IGNORE INTO venues (venue_id, owner_user_id, venue_name, contact_phone, venue_description, operating_status, created_at, updated_at) VALUES ?`,
        [venueInserts]
      );
    }

    if (branchInserts.length > 0) {
      console.log('📌 Đang nạp dữ liệu Branches...');
      await conn.query(
        `INSERT IGNORE INTO branches (branch_id, venue_id, branch_name, street_address, ward_district_city, branch_phone, branch_status, created_at, updated_at) VALUES ?`,
        [branchInserts]
      );
    }

    if (courtInserts.length > 0) {
      console.log('📌 Đang nạp dữ liệu Courts...');
      await conn.query(
        `INSERT IGNORE INTO courts (court_id, branch_id, court_name, sport_category, court_status, surface_features, created_at, updated_at) VALUES ?`,
        [courtInserts]
      );
    }

    if (schedInserts.length > 0) {
      console.log('📌 Đang nạp dữ liệu Operating Schedules...');
      await conn.query(
        `INSERT IGNORE INTO operating_schedules (schedule_id, scope_target_type, scope_target_id, day_of_week_pattern, open_time, close_time, is_active, created_at, updated_at) VALUES ?`,
        [schedInserts]
      );
    }

    if (imgInserts.length > 0) {
      console.log('📌 Đang nạp dữ liệu Venue Images...');
      await conn.query(
        `INSERT IGNORE INTO venue_images (image_id, venue_id, uploaded_by, target_type, target_id, avatar, cover, thumbnail_url, medium_url, large_url, original_url, image_type, title, caption, alt_text, display_order, is_primary, is_cover, is_avatar, is_active, file_size, mime_type, status, tags, width, height, event_id, promotion_id, tournament_id, course_id, created_at, updated_at) VALUES ?`,
        [imgInserts]
      );
    }

    if (facInserts.length > 0) {
      console.log('📌 Đang nạp dữ liệu Venue Facilities...');
      await conn.query(
        `INSERT IGNORE INTO venue_facilities (venue_id, facility_id, created_at) VALUES ?`,
        [facInserts]
      );
    }

    if (accountInserts.length > 0) {
      console.log('📌 Đang nạp dữ liệu Venue Payment Accounts...');
      await conn.query(
        `INSERT IGNORE INTO venue_payment_accounts (account_id, venue_id, payment_method, account_name, account_number, bank_name, phone_number, qr_code_url, is_active, created_at, updated_at) VALUES ?`,
        [accountInserts]
      );
    }

    // 3. Restore Banners
    console.log('3️⃣ Khôi phục Banners quảng cáo...');
    const banners = [
      [
        crypto.randomUUID(), 'Ưu đãi Đặt sân 24/7', 'Giảm 20% cho khung giờ vàng từ 14:00 - 17:00',
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop',
        '/venues', 'CUSTOMER', 1, 1, nowStr, nowStr
      ],
      [
        crypto.randomUUID(), 'Giải đấu Pickleball Mở Rộng 2026', 'Đăng ký ngay hôm nay để nhận giải thưởng lên tới 50 triệu VNĐ',
        'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1200&auto=format&fit=crop',
        '/community', 'ALL', 2, 1, nowStr, nowStr
      ]
    ];
    await conn.query(
      `INSERT IGNORE INTO banners (banner_id, title, description, image_url, target_url, audience, display_order, is_active, created_at, updated_at) VALUES ?`,
      [banners]
    );

    // 4. Restore Sample Bookings & Payments & Reviews
    console.log('4️⃣ Khôi phục Đặt sân (Bookings) & Thanh toán (Payments) & Đánh giá (Reviews)...');
    const [customers] = await conn.execute(`SELECT user_id FROM users WHERE primary_role = 'CUSTOMER' LIMIT 5`);
    const [courts] = await conn.execute(`SELECT court_id, branch_id FROM courts LIMIT 5`);

    if (customers.length > 0 && courts.length > 0) {
      const custId = customers[0].user_id;
      const courtId = courts[0].court_id;

      // Get venue_id from branch
      const [branchRow] = await conn.execute(`SELECT venue_id FROM branches WHERE branch_id = ?`, [courts[0].branch_id]);
      const venueId = branchRow[0] ? branchRow[0].venue_id : null;

      const bookingId = 'booking_sample_01';
      const paymentId = 'payment_sample_01';

      await conn.execute(
        `INSERT IGNORE INTO bookings (booking_id, customer_user_id, court_id, booking_date, start_time, end_time, total_price, deposit_amount, booking_status, payment_status, created_at, updated_at)
         VALUES (?, ?, ?, CURDATE(), '18:00:00', '19:30:00', 150000.00, 150000.00, 'CONFIRMED', 'PAID', ?, ?)`,
        [bookingId, custId, courtId, nowStr, nowStr]
      );

      await conn.execute(
        `INSERT IGNORE INTO booking_status_history (history_id, booking_id, previous_status, new_status, changed_by_user_id, change_reason, created_at)
         VALUES (?, ?, 'PENDING', 'CONFIRMED', ?, 'Khách hàng hoàn tất thanh toán MoMo', ?)`,
        [crypto.randomUUID(), bookingId, custId, nowStr]
      );

      await conn.execute(
        `INSERT IGNORE INTO payments (payment_id, booking_id, user_id, payment_method, payment_status, amount, currency, provider_order_id, provider_request_id, paid_at, created_at, updated_at)
         VALUES (?, ?, ?, 'MOMO', 'SUCCESS', 150000.00, 'VND', 'ORDER_SPORTHUB_001', 'REQ_SPORTHUB_001', ?, ?, ?)`,
        [paymentId, bookingId, custId, nowStr, nowStr, nowStr]
      );

      if (venueId) {
        await conn.execute(
          `INSERT IGNORE INTO reviews (review_id, booking_id, customer_user_id, court_id, venue_id, rating, comment, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 5, 'Sân rất đẹp, sạch sẽ, đèn sáng tốt, chủ sân thân thiện!', 'PUBLISHED', ?, ?)`,
          [crypto.randomUUID(), bookingId, custId, courtId, venueId, nowStr, nowStr]
        );
      }
    }

    await conn.execute('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✅ KHÔI PHỤC THÀNH CÔNG TOÀN BỘ DỮ LIỆU CÁC BẢNG IN DATABASE!');

  } catch (err) {
    console.error('❌ Lỗi khi nạp dữ liệu khôi phục:', err);
  } finally {
    await conn.end();
  }
}

restoreAllData();
