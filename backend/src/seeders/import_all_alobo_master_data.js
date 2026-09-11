'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const models = require('../models');

async function importAllAloboMasterData() {
  console.log('🚀 Starting Comprehensive Import for Alobo Master Data & Images...');
  const startTime = Date.now();

  // 1. Resolve Dataset File Paths
  const masterJsonPath = path.join(__dirname, '../../../alobo_booking_master_cleaned.json');
  const imagesJsonPath = path.join(__dirname, '../../../alobo_all_venue_images.json');

  if (!fs.existsSync(masterJsonPath)) {
    console.error('❌ Master dataset not found at:', masterJsonPath);
    process.exit(1);
  }
  if (!fs.existsSync(imagesJsonPath)) {
    console.error('❌ Images dataset not found at:', imagesJsonPath);
    process.exit(1);
  }

  // 2. Read and Parse JSON Datasets
  console.log('📦 Loading JSON datasets into memory...');
  const masterData = JSON.parse(fs.readFileSync(masterJsonPath, 'utf8'));
  const imagesData = JSON.parse(fs.readFileSync(imagesJsonPath, 'utf8'));

  console.log(`   - Master venues count: ${masterData.length}`);
  console.log(`   - Images venues count: ${imagesData.length}`);

  // Create image lookup map keyed by venue id (and normalized name)
  const imagesMap = new Map();
  const imagesNameMap = new Map();
  imagesData.forEach(imgItem => {
    if (imgItem.id) imagesMap.set(imgItem.id, imgItem);
    if (imgItem.name) {
      const normName = imgItem.name.trim().toLowerCase();
      imagesNameMap.set(normName, imgItem);
    }
  });

  const defaultPasswordHash = await bcrypt.hash('OwnerPassword123!', 10);
  const now = new Date();

  // 3. Disable Foreign Key Checks and Clean Existing Seed Data
  await models.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

  try {
    console.log('🧹 Cleaning previous dataset tables...');
    await models.BookingStatusHistory.destroy({ where: {} });
    await models.Payment.destroy({ where: {} });
    await models.Booking.destroy({ where: {} });
    await models.SlotBlocking.destroy({ where: {} });
    await models.VenueImage.destroy({ where: {} });
    await models.OperatingSchedule.destroy({ where: {} });
    await models.Court.destroy({ where: {} });
    await models.Branch.destroy({ where: {} });
    await models.Venue.destroy({ where: {} });
    await models.User.destroy({ where: { primary_role: ['OWNER', 'CUSTOMER'] } });

    // 4. Create Customer Users Pool
    const customersToCreate = [];
    const customerIds = [];
    for (let c = 1; c <= 10; c++) {
      const cId = crypto.randomUUID();
      customerIds.push(cId);
      customersToCreate.push({
        user_id: cId,
        full_name: `Khách hàng Alobo ${c}`,
        email: `customer_alobo_${c}@sporthub.ai`,
        phone_number: `098000000${String(c).padStart(2, '0')}`,
        password_hash: defaultPasswordHash,
        primary_role: 'CUSTOMER',
        account_status: 'ACTIVE',
        email_verified_at: now,
        createdAt: now,
        updatedAt: now,
        created_at: now,
        updated_at: now
      });
    }

    const usersToCreate = [...customersToCreate];
    const venuesToCreate = [];
    const branchesToCreate = [];
    const courtsToCreate = [];
    const schedulesToCreate = [];
    const imagesToCreate = [];
    const bookingsToCreate = [];
    const bookingHistoriesToCreate = [];
    const blockingsToCreate = [];

    let customerIdx = 0;

    // Helper function to extract price
    const parsePriceRange = (priceObj) => {
      let basePrice = 80000;
      if (priceObj && priceObj.range) {
        const match = priceObj.range.match(/([\d,]+)/);
        if (match) {
          const parsed = parseInt(match[1].replace(/,/g, ''), 10);
          if (!isNaN(parsed) && parsed > 0 && parsed <= 10000000) basePrice = parsed;
        }
      }
      return basePrice;
    };

    // Helper function to extract opening hours
    const parseOpeningHours = (hoursStr, gridObj) => {
      let openTime = '06:00:00';
      let closeTime = '22:00:00';

      if (gridObj && gridObj.opening_time && gridObj.closing_time) {
        const oMatch = gridObj.opening_time.match(/(\d+):(\d+)/);
        const cMatch = gridObj.closing_time.match(/(\d+):(\d+)/);
        if (oMatch) openTime = `${String(oMatch[1]).padStart(2, '0')}:${String(oMatch[2]).padStart(2, '0')}:00`;
        if (cMatch) closeTime = `${String(cMatch[1]).padStart(2, '0')}:${String(cMatch[2]).padStart(2, '0')}:00`;
        return { openTime, closeTime };
      }

      if (hoursStr && typeof hoursStr === 'string' && hoursStr.includes('–')) {
        const parts = hoursStr.split('–').map(p => p.trim());
        if (parts[0]) {
          const match = parts[0].match(/(\d+):?(\d+)?/);
          if (match) {
            const h = parseInt(match[1], 10);
            const m = match[2] ? parseInt(match[2], 10) : 0;
            if (!isNaN(h) && h >= 0 && h < 24) {
              openTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
            }
          }
        }
        if (parts[1]) {
          const match = parts[1].match(/(\d+):?(\d+)?/);
          if (match) {
            const h = parseInt(match[1], 10);
            const m = match[2] ? parseInt(match[2], 10) : 0;
            if (!isNaN(h) && h >= 0 && h <= 24) {
              const hFormatted = h === 24 ? 23 : h;
              const mFormatted = h === 24 ? 59 : m;
              closeTime = `${String(hFormatted).padStart(2, '0')}:${String(mFormatted).padStart(2, '0')}:00`;
            }
          }
        }
      }
      return { openTime, closeTime };
    };

    // 5. Process Each Venue in Master Dataset
    console.log('⚡ Processing venues, courts, slots, schedules, and images...');
    for (let i = 0; i < masterData.length; i++) {
      const item = masterData[i];
      const cleanSlug = (item.id || `venue_${i}`).replace(/[^a-zA-Z0-9_]/g, '_');
      const selectedDate = item.selected_date || '2026-08-15';

      // 5.1 Owner User
      const ownerUserId = crypto.randomUUID();
      const ownerEmail = `owner_${i}_${cleanSlug.substring(0, 40)}@sporthub.ai`;
      const ownerPhone = (item.phone || `090${String(i).padStart(7, '0')}`).substring(0, 20);
      const ownerName = `Chủ sân ${(item.venue || item.venue_name || 'Thể thao')}`.substring(0, 100);

      usersToCreate.push({
        user_id: ownerUserId,
        full_name: ownerName,
        email: ownerEmail.substring(0, 255),
        phone_number: ownerPhone,
        password_hash: defaultPasswordHash,
        primary_role: 'OWNER',
        account_status: 'ACTIVE',
        email_verified_at: now,
        createdAt: now,
        updatedAt: now,
        created_at: now,
        updated_at: now
      });

      // 5.2 Venue
      const venueId = crypto.randomUUID();
      const venueName = (item.venue || item.venue_name || 'Sân thể thao').substring(0, 255);
      const sportTypesStr = Array.isArray(item.sport_type) ? item.sport_type.join(', ') : (item.sport_type || 'Thể thao');
      const priceRangeStr = item.price?.range || 'Đang cập nhật';
      const venueDesc = `Địa chỉ: ${item.address || 'Đang cập nhật'}. Môn thể thao: ${sportTypesStr}. Bảng giá: ${priceRangeStr}. Giờ mở cửa: ${item.opening_hours || '06:00 - 22:00'}. Đặt lịch online trực tiếp trên SportHubAI kết nối Alobo.`;

      venuesToCreate.push({
        venue_id: venueId,
        owner_user_id: ownerUserId,
        venue_name: venueName,
        contact_phone: ownerPhone,
        venue_description: venueDesc,
        operating_status: 'APPROVED',
        created_at: now,
        updated_at: now
      });

      // 5.3 Branch
      const branchId = crypto.randomUUID();
      const branchName = (item.branch || 'Cơ sở chính').substring(0, 255);
      const city = (item.location?.city || 'Việt Nam').substring(0, 255);
      const lat = item.location?.latitude || 10.776889;
      const lng = item.location?.longitude || 106.700806;

      branchesToCreate.push({
        branch_id: branchId,
        venue_id: venueId,
        branch_name: branchName,
        street_address: (item.address || 'Đang cập nhật').substring(0, 500),
        ward_district_city: city,
        geo_coordinates: JSON.stringify({ lat, lng }),
        branch_phone: ownerPhone,
        branch_status: 'ACTIVE',
        created_at: now,
        updated_at: now
      });

      // 5.4 Courts & Time Slots
      const sportCategory = (Array.isArray(item.sport_type) && item.sport_type[0]) ? String(item.sport_type[0]).substring(0, 50) : 'Pickleball';
      const gridCourts = item.time_slot_grid?.courts || [];
      const diagramCourts = item.court_diagram?.courts || [];
      const courtTotal = item.court?.total || 4;

      const actualCourtCount = Math.max(gridCourts.length, diagramCourts.length, courtTotal, 1);
      const basePrice = parsePriceRange(item.price);
      const slotPrice = Math.round(basePrice / 2); // 30-min slot price

      for (let c = 0; c < actualCourtCount; c++) {
        const courtId = crypto.randomUUID();
        let courtName = `Sân ${c + 1}`;
        if (gridCourts[c] && gridCourts[c].court_name) {
          courtName = gridCourts[c].court_name;
        } else if (diagramCourts[c] && diagramCourts[c].name) {
          courtName = diagramCourts[c].name;
        }

        courtsToCreate.push({
          court_id: courtId,
          branch_id: branchId,
          court_name: courtName.substring(0, 100),
          sport_category: sportCategory,
          court_status: 'ACTIVE',
          surface_features: 'Thảm tiêu chuẩn thi đấu',
          created_at: now,
          updated_at: now
        });

        // Slots Mapping
        const gridCourt = gridCourts[c];
        if (gridCourt && Array.isArray(gridCourt.slots)) {
          for (const slot of gridCourt.slots) {
            const startTimeStr = `${slot.start_time}:00`;
            const endTimeStr = `${slot.end_time}:00`;

            if (slot.status === 'da_dat') {
              const customerId = customerIds[customerIdx % customerIds.length];
              customerIdx++;

              const bookingId = crypto.randomUUID();
              bookingsToCreate.push({
                booking_id: bookingId,
                customer_user_id: customerId,
                court_id: courtId,
                booking_date: selectedDate,
                start_time: startTimeStr,
                end_time: endTimeStr,
                total_amount: slotPrice,
                currency: 'VND',
                booking_source: 'ONLINE_CUSTOMER',
                booking_status: 'CONFIRMED',
                createdAt: now,
                updatedAt: now,
                created_at: now,
                updated_at: now
              });

              bookingHistoriesToCreate.push({
                history_id: crypto.randomUUID(),
                booking_id: bookingId,
                from_status: 'PENDING',
                to_status: 'CONFIRMED',
                changed_by_user_id: customerId,
                change_reason: 'Khách hàng đặt lịch thành công qua Alobo',
                createdAt: now,
                created_at: now
              });
            } else if (slot.status === 'khoa' || slot.status === 'su_kien') {
              const reason = slot.status === 'su_kien' ? 'Sự kiện / Giải đấu' : 'Chủ sân khoá lịch';

              blockingsToCreate.push({
                block_id: crypto.randomUUID(),
                court_id: courtId,
                block_date: selectedDate,
                start_time: startTimeStr,
                end_time: endTimeStr,
                block_reason: reason,
                created_by_owner_id: ownerUserId,
                createdAt: now,
                created_at: now
              });
            }
          }
        }
      }

      // 5.5 OperatingSchedule
      const { openTime, closeTime } = parseOpeningHours(item.opening_hours, item.time_slot_grid);
      schedulesToCreate.push({
        schedule_id: crypto.randomUUID(),
        scope_target_type: 'VENUE',
        scope_target_id: venueId,
        day_scope: 'EVERYDAY',
        opening_time: openTime,
        closing_time: closeTime,
        base_hourly_price: basePrice,
        created_at: now,
        updated_at: now
      });

      // 5.6 VenueImages (Combining master JSON + images JSON dataset)
      const imageMeta = imagesMap.get(item.id) || imagesNameMap.get(venueName.trim().toLowerCase());
      const addedUrls = new Set();
      let orderIndex = 0;

      // Extract Avatar URL
      const avatarUrl = imageMeta?.avatar || (Array.isArray(imageMeta?.images) && imageMeta.images.find(i => i.type === 'avatar')?.url) || (Array.isArray(item.images) && item.images.find(i => typeof i === 'string' && i.includes('avatar')) ? item.images.find(i => typeof i === 'string' && i.includes('avatar')) : null);

      if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.startsWith('http')) {
        addedUrls.add(avatarUrl.trim());
        imagesToCreate.push({
          image_id: crypto.randomUUID(),
          venue_id: venueId,
          uploaded_by: ownerUserId,
          target_type: 'VENUE',
          target_id: venueId,
          avatar: avatarUrl.trim(),
          cover: null,
          thumbnail_url: avatarUrl.trim(),
          medium_url: avatarUrl.trim(),
          original_url: avatarUrl.trim(),
          image_type: 'AVATAR',
          title: `${venueName} - Ảnh đại diện`,
          display_order: orderIndex++,
          is_primary: false,
          is_cover: false,
          is_avatar: true,
          is_active: true,
          status: 'PUBLISHED',
          created_at: now,
          updated_at: now
        });
      }

      // Extract Cover URL
      const coverUrl = imageMeta?.cover || (Array.isArray(imageMeta?.images) && imageMeta.images.find(i => i.type === 'cover')?.url) || (Array.isArray(item.images) && item.images.find(i => typeof i === 'string' && i.includes('cover')) ? item.images.find(i => typeof i === 'string' && i.includes('cover')) : null);

      if (coverUrl && typeof coverUrl === 'string' && coverUrl.startsWith('http')) {
        addedUrls.add(coverUrl.trim());
        imagesToCreate.push({
          image_id: crypto.randomUUID(),
          venue_id: venueId,
          uploaded_by: ownerUserId,
          target_type: 'VENUE',
          target_id: venueId,
          avatar: null,
          cover: coverUrl.trim(),
          thumbnail_url: coverUrl.trim(),
          medium_url: coverUrl.trim(),
          original_url: coverUrl.trim(),
          image_type: 'COVER',
          title: `${venueName} - Ảnh bìa`,
          display_order: orderIndex++,
          is_primary: true,
          is_cover: true,
          is_avatar: false,
          is_active: true,
          status: 'PUBLISHED',
          created_at: now,
          updated_at: now
        });
      }

      // Additional Images from Master & Image Metadata
      const rawImageList = [];
      if (Array.isArray(item.images)) rawImageList.push(...item.images);
      if (imageMeta && Array.isArray(imageMeta.images)) {
        imageMeta.images.forEach(img => {
          if (img && img.url) rawImageList.push(img.url);
        });
      }

      for (const imgUrl of rawImageList) {
        if (typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
          const trimmedUrl = imgUrl.trim();
          if (!addedUrls.has(trimmedUrl)) {
            addedUrls.add(trimmedUrl);
            imagesToCreate.push({
              image_id: crypto.randomUUID(),
              venue_id: venueId,
              uploaded_by: ownerUserId,
              target_type: 'VENUE',
              target_id: venueId,
              avatar: null,
              cover: null,
              thumbnail_url: trimmedUrl,
              medium_url: trimmedUrl,
              original_url: trimmedUrl,
              image_type: 'VENUE',
              title: `${venueName} - Ảnh gallery ${orderIndex}`,
              display_order: orderIndex++,
              is_primary: false,
              is_cover: false,
              is_avatar: false,
              is_active: true,
              status: 'PUBLISHED',
              created_at: now,
              updated_at: now
            });
          }
        }
      }
    }

    console.log(`⚡ Data compilation finished in ${((Date.now() - startTime) / 1000).toFixed(2)}s.`);
    console.log(`📊 Statistics to Bulk Insert:`);
    console.log(`   - Users: ${usersToCreate.length}`);
    console.log(`   - Venues: ${venuesToCreate.length}`);
    console.log(`   - Branches: ${branchesToCreate.length}`);
    console.log(`   - Courts: ${courtsToCreate.length}`);
    console.log(`   - Operating Schedules: ${schedulesToCreate.length}`);
    console.log(`   - Venue Images: ${imagesToCreate.length}`);
    console.log(`   - Bookings: ${bookingsToCreate.length}`);
    console.log(`   - Booking Histories: ${bookingHistoriesToCreate.length}`);
    console.log(`   - Slot Blockings: ${blockingsToCreate.length}`);

    const CHUNK_SIZE = 1000;

    console.log('   ⏳ Bulk inserting Users...');
    for (let i = 0; i < usersToCreate.length; i += CHUNK_SIZE) {
      await models.User.bulkCreate(usersToCreate.slice(i, i + CHUNK_SIZE));
    }

    console.log('   ⏳ Bulk inserting Venues...');
    for (let i = 0; i < venuesToCreate.length; i += CHUNK_SIZE) {
      await models.Venue.bulkCreate(venuesToCreate.slice(i, i + CHUNK_SIZE));
    }

    console.log('   ⏳ Bulk inserting Branches...');
    for (let i = 0; i < branchesToCreate.length; i += CHUNK_SIZE) {
      await models.Branch.bulkCreate(branchesToCreate.slice(i, i + CHUNK_SIZE));
    }

    console.log('   ⏳ Bulk inserting Courts...');
    for (let i = 0; i < courtsToCreate.length; i += CHUNK_SIZE) {
      await models.Court.bulkCreate(courtsToCreate.slice(i, i + CHUNK_SIZE));
    }

    console.log('   ⏳ Bulk inserting Operating Schedules...');
    for (let i = 0; i < schedulesToCreate.length; i += CHUNK_SIZE) {
      await models.OperatingSchedule.bulkCreate(schedulesToCreate.slice(i, i + CHUNK_SIZE));
    }

    console.log('   ⏳ Bulk inserting Venue Images...');
    for (let i = 0; i < imagesToCreate.length; i += CHUNK_SIZE) {
      await models.VenueImage.bulkCreate(imagesToCreate.slice(i, i + CHUNK_SIZE));
    }

    console.log('   ⏳ Bulk inserting Bookings...');
    for (let i = 0; i < bookingsToCreate.length; i += CHUNK_SIZE) {
      await models.Booking.bulkCreate(bookingsToCreate.slice(i, i + CHUNK_SIZE));
    }

    console.log('   ⏳ Bulk inserting Booking Histories...');
    for (let i = 0; i < bookingHistoriesToCreate.length; i += CHUNK_SIZE) {
      await models.BookingStatusHistory.bulkCreate(bookingHistoriesToCreate.slice(i, i + CHUNK_SIZE));
    }

    console.log('   ⏳ Bulk inserting Slot Blockings...');
    for (let i = 0; i < blockingsToCreate.length; i += CHUNK_SIZE) {
      await models.SlotBlocking.bulkCreate(blockingsToCreate.slice(i, i + CHUNK_SIZE));
    }

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ FULL IMPORT COMPLETED SUCCESSFULLY IN ${durationSec}s!`);
  } catch (error) {
    console.error('❌ SEEDING FAILED!', error);
    process.exit(1);
  } finally {
    await models.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
  }
}

importAllAloboMasterData().then(() => {
  process.exit(0);
});
