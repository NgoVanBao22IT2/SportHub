'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const models = require('../models');

async function importAloboVenues() {
  console.log('🚀 Starting Full Master Alobo Venues & Time Slots Import...');

  let jsonPath = path.join(__dirname, '../../../alobo_booking_master_cleaned.json');
  if (!fs.existsSync(jsonPath)) {
    jsonPath = path.join(__dirname, '../../../alobo_venues_master_cleaned.json');
  }
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ JSON dataset file not found at:', jsonPath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const venuesData = JSON.parse(rawData);

  console.log(`📦 Loaded ${venuesData.length} venues from master JSON dataset.`);

  const defaultPasswordHash = await bcrypt.hash('OwnerPassword123!', 10);
  
  // Disable foreign key checks for clean batch sync
  await models.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

  try {
    // Delete previous seeded owners, venues, branches, courts, schedules, images, bookings, blockings
    console.log('🧹 Cleaning previous dataset tables...');
    await models.BookingStatusHistory.destroy({ where: {} });
    await models.Payment.destroy({ where: {} });
    await models.Booking.destroy({ where: {} });
    await models.SlotBlocking.destroy({ where: {} });
    await models.VenueImage.destroy({ where: { target_type: 'VENUE' } });
    await models.OperatingSchedule.destroy({ where: { scope_target_type: 'VENUE' } });
    await models.Court.destroy({ where: {} });
    await models.Branch.destroy({ where: {} });
    await models.Venue.destroy({ where: {} });
    await models.User.destroy({ where: { primary_role: ['OWNER', 'CUSTOMER'] } });

    const now = new Date();

    // Create a pool of customer users for bookings
    const customersToCreate = [];
    const customerIds = [];
    for (let c = 1; c <= 5; c++) {
      const cId = crypto.randomUUID();
      customerIds.push(cId);
      customersToCreate.push({
        user_id: cId,
        full_name: `Khách hàng Alobo ${c}`,
        email: `customer_alobo_${c}@sporthub.ai`,
        phone_number: `098000000${c}`,
        password_hash: defaultPasswordHash,
        primary_role: 'CUSTOMER',
        account_status: 'ACTIVE',
        email_verified_at: now,
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
    const blockingsToCreate = [];

    let customerIdx = 0;

    for (let i = 0; i < venuesData.length; i++) {
      const item = venuesData[i];
      const cleanSlug = (item.id || `venue_${i}`).replace(/[^a-zA-Z0-9_]/g, '_');
      const selectedDate = item.selected_date || '2026-08-15';
      
      // 1. Owner User
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
        created_at: now,
        updated_at: now
      });

      // 2. Venue
      const venueId = crypto.randomUUID();
      const venueName = (item.venue || item.venue_name || 'Sân thể thao').substring(0, 255);
      const venueDesc = `Địa chỉ: ${item.address || 'Đang cập nhật'}. Hệ thống đặt lịch SportHubAI kết nối Alobo.`;

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

      // 3. Branch
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

      // 4. Courts & Slots
      const sportCategory = (Array.isArray(item.sport_type) && item.sport_type[0]) ? item.sport_type[0].substring(0, 50) : 'Pickleball';
      const gridCourts = item.time_slot_grid?.courts || [];
      const diagramCourts = item.court_diagram?.courts || [];
      const courtTotal = item.court?.total || 4;

      const actualCourtCount = Math.max(gridCourts.length, diagramCourts.length, courtTotal, 1);

      let basePrice = 80000;
      if (item.price?.range) {
        const match = item.price.range.match(/([\d,]+)/);
        if (match) {
          const parsed = parseInt(match[1].replace(/,/g, ''), 10);
          if (!isNaN(parsed) && parsed > 0 && parsed <= 10000000) basePrice = parsed;
        }
      }
      const slotPrice = Math.round(basePrice / 2); // 30-minute slot price

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

        // Map Time Slots for this Court
        const gridCourt = gridCourts[c];
        if (gridCourt && Array.isArray(gridCourt.slots)) {
          for (const slot of gridCourt.slots) {
            const startTimeStr = `${slot.start_time}:00`;
            const endTimeStr = `${slot.end_time}:00`;

            if (slot.status === 'da_dat') {
              const customerId = customerIds[customerIdx % customerIds.length];
              customerIdx++;

              bookingsToCreate.push({
                booking_id: crypto.randomUUID(),
                customer_user_id: customerId,
                court_id: courtId,
                booking_date: selectedDate,
                start_time: startTimeStr,
                end_time: endTimeStr,
                total_amount: slotPrice,
                currency: 'VND',
                booking_source: 'ONLINE_CUSTOMER',
                booking_status: 'CONFIRMED',
                created_at: now,
                updated_at: now
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
                created_at: now
              });
            }
          }
        }
      }

      // 5. OperatingSchedule
      let openingTime = '06:00:00';
      let closingTime = '22:00:00';
      if (item.opening_hours && typeof item.opening_hours === 'string' && item.opening_hours.includes('–')) {
        const parts = item.opening_hours.split('–').map(p => p.trim());
        let parsedOpen = null;
        let parsedClose = null;
        
        if (parts[0]) {
          const match = parts[0].match(/(\d+):?(\d+)?/);
          if (match) {
            const h = parseInt(match[1], 10);
            const m = match[2] ? parseInt(match[2], 10) : 0;
            if (!isNaN(h) && h >= 0 && h < 24) {
              parsedOpen = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
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
              parsedClose = `${String(hFormatted).padStart(2, '0')}:${String(mFormatted).padStart(2, '0')}:00`;
            }
          }
        }

        if (parsedOpen && parsedClose && parsedClose > parsedOpen) {
          openingTime = parsedOpen;
          closingTime = parsedClose;
        }
      }

      schedulesToCreate.push({
        schedule_id: crypto.randomUUID(),
        scope_target_type: 'VENUE',
        scope_target_id: venueId,
        day_scope: 'EVERYDAY',
        opening_time: openingTime,
        closing_time: closingTime,
        base_hourly_price: basePrice,
        created_at: now,
        updated_at: now
      });

      // 6. VenueImages
      if (Array.isArray(item.images) && item.images.length > 0) {
        for (let imgIdx = 0; imgIdx < item.images.length; imgIdx++) {
          const imgUrl = item.images[imgIdx];
          if (typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
            imagesToCreate.push({
              image_id: crypto.randomUUID(),
              target_type: 'VENUE',
              target_id: venueId,
              image_url: imgUrl.substring(0, 500),
              display_order: imgIdx,
              is_primary: imgIdx === 0,
              created_at: now
            });
          }
        }
      }
    }

    console.log(`⚡ Bulk inserting database records...`);
    console.log(`   - Users to insert: ${usersToCreate.length}`);
    console.log(`   - Venues to insert: ${venuesToCreate.length}`);
    console.log(`   - Branches to insert: ${branchesToCreate.length}`);
    console.log(`   - Courts to insert: ${courtsToCreate.length}`);
    console.log(`   - Operating Schedules to insert: ${schedulesToCreate.length}`);
    console.log(`   - Images to insert: ${imagesToCreate.length}`);
    console.log(`   - Bookings to insert: ${bookingsToCreate.length}`);
    console.log(`   - Slot Blockings to insert: ${blockingsToCreate.length}`);

    const CHUNK_SIZE = 500;

    
    // Chunk insert Users
    for (let i = 0; i < usersToCreate.length; i += CHUNK_SIZE) {
      await models.User.bulkCreate(usersToCreate.slice(i, i + CHUNK_SIZE));
    }
    // Chunk insert Venues
    for (let i = 0; i < venuesToCreate.length; i += CHUNK_SIZE) {
      await models.Venue.bulkCreate(venuesToCreate.slice(i, i + CHUNK_SIZE));
    }
    // Chunk insert Branches
    for (let i = 0; i < branchesToCreate.length; i += CHUNK_SIZE) {
      await models.Branch.bulkCreate(branchesToCreate.slice(i, i + CHUNK_SIZE));
    }
    // Chunk insert Courts
    for (let i = 0; i < courtsToCreate.length; i += CHUNK_SIZE) {
      await models.Court.bulkCreate(courtsToCreate.slice(i, i + CHUNK_SIZE));
    }
    // Chunk insert Schedules
    for (let i = 0; i < schedulesToCreate.length; i += CHUNK_SIZE) {
      await models.OperatingSchedule.bulkCreate(schedulesToCreate.slice(i, i + CHUNK_SIZE));
    }
    // Chunk insert Images
    for (let i = 0; i < imagesToCreate.length; i += CHUNK_SIZE) {
      await models.VenueImage.bulkCreate(imagesToCreate.slice(i, i + CHUNK_SIZE));
    }
    // Chunk insert Bookings
    console.log('   ⏳ Inserting Bookings in batches...');
    for (let i = 0; i < bookingsToCreate.length; i += CHUNK_SIZE) {
      await models.Booking.bulkCreate(bookingsToCreate.slice(i, i + CHUNK_SIZE));
    }
    // Chunk insert SlotBlockings
    console.log('   ⏳ Inserting SlotBlockings in batches...');
    for (let i = 0; i < blockingsToCreate.length; i += CHUNK_SIZE) {
      await models.SlotBlocking.bulkCreate(blockingsToCreate.slice(i, i + CHUNK_SIZE));
    }

    console.log('✅ FULL MASTER SEEDING WITH TIME SLOTS COMPLETED SUCCESSFULLY!');
    console.log(`🎉 Final Summary:`);
    console.log(`   - Total Users Created: ${usersToCreate.length}`);
    console.log(`   - Total Venues Created: ${venuesToCreate.length}`);
    console.log(`   - Total Branches Created: ${branchesToCreate.length}`);
    console.log(`   - Total Courts Created: ${courtsToCreate.length}`);
    console.log(`   - Total Operating Schedules Created: ${schedulesToCreate.length}`);
    console.log(`   - Total Images Created: ${imagesToCreate.length}`);
    console.log(`   - Total Bookings Created (Confirmed): ${bookingsToCreate.length}`);
    console.log(`   - Total Slot Blockings Created: ${blockingsToCreate.length}`);
  } catch (error) {
    console.error('❌ SEEDING FAILED!', error);
    process.exit(1);
  } finally {
    await models.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
  }
}

importAloboVenues().then(() => {
  process.exit(0);
});


