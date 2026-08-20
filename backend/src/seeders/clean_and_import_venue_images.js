'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Venue, VenueImage, sequelize } = require('../models');

async function cleanAndImportVenueImagesFast() {
  console.log('=== BẮT ĐẦU NÂNG CẤP VÀ LÀM SẠCH DỮ LIỆU HÌNH ẢNH (SIÊU TỐC) ===');
  const startTime = Date.now();

  // 1. Read data_img.json file
  const jsonPath = path.join(__dirname, '../../../data_img.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Không tìm thấy tệp data_img.json tại:', jsonPath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const jsonContent = JSON.parse(rawData);
  const jsonVenues = jsonContent.venues || [];
  console.log(`[data_img.json] Đã đọc ${jsonVenues.length} cơ sở từ tệp JSON.`);

  // 2. Fetch all venues & venue_images into memory
  const dbVenues = await Venue.findAll({ attributes: ['venue_id', 'venue_name', 'owner_user_id'] });
  const dbImages = await VenueImage.findAll({ attributes: ['image_id', 'venue_id', 'image_url', 'image_type'] });

  console.log(`[Database] Đã tải ${dbVenues.length} Venues và ${dbImages.length} VenueImages vào bộ nhớ.`);

  // Create name lookup map for venues
  const venueNameMap = new Map();
  dbVenues.forEach((v) => {
    const normName = v.venue_name.trim().toLowerCase();
    venueNameMap.set(normName, v);
  });

  // Create image lookup map: `${venue_id}|${image_url}` -> image_id
  const imageMap = new Map();
  dbImages.forEach((img) => {
    const key = `${img.venue_id}|${img.image_url.trim()}`;
    imageMap.set(key, img);
  });

  const avatarUpdateIds = new Set();
  const coverUpdateIds = new Set();
  const newImagesToInsert = [];
  let processedVenuesCount = 0;

  for (const jv of jsonVenues) {
    const normName = jv.venue_name ? jv.venue_name.trim().toLowerCase() : '';
    const venue = venueNameMap.get(normName);
    if (!venue) continue;

    processedVenuesCount++;
    const venueId = venue.venue_id;
    const ownerUserId = venue.owner_user_id;

    // Extract Avatar URL
    const avatarUrl = jv.avatar || (jv.images && jv.images.find((i) => i.type === 'avatar')?.url) || null;
    if (avatarUrl) {
      const key = `${venueId}|${avatarUrl.trim()}`;
      const existingImg = imageMap.get(key);
      if (existingImg) {
        avatarUpdateIds.add(existingImg.image_id);
      } else {
        const newId = uuidv4();
        newImagesToInsert.push({
          image_id: newId,
          venue_id: venueId,
          uploaded_by: ownerUserId,
          target_type: 'VENUE',
          target_id: venueId,
          image_url: avatarUrl,
          image_type: 'AVATAR',
          title: `${venue.venue_name} - Ảnh đại diện`,
          is_avatar: true,
          is_cover: false,
          is_primary: false,
          is_active: true,
          status: 'PUBLISHED',
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    // Extract Cover URL
    const coverUrl = jv.cover || (jv.images && jv.images.find((i) => i.type === 'cover')?.url) || null;
    if (coverUrl) {
      const key = `${venueId}|${coverUrl.trim()}`;
      const existingImg = imageMap.get(key);
      if (existingImg) {
        coverUpdateIds.add(existingImg.image_id);
      } else {
        const newId = uuidv4();
        newImagesToInsert.push({
          image_id: newId,
          venue_id: venueId,
          uploaded_by: ownerUserId,
          target_type: 'VENUE',
          target_id: venueId,
          image_url: coverUrl,
          image_type: 'COVER',
          title: `${venue.venue_name} - Ảnh bìa`,
          is_avatar: false,
          is_cover: true,
          is_primary: true,
          is_active: true,
          status: 'PUBLISHED',
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
  }

  console.log(`[Processing] Đã khớp ${processedVenuesCount} venues.`);
  console.log(`[Processing] Tìm thấy ${avatarUpdateIds.size} ảnh Avatar để cập nhật cờ is_avatar = 1.`);
  console.log(`[Processing] Tìm thấy ${coverUpdateIds.size} ảnh Cover để cập nhật cờ is_cover = 1.`);
  console.log(`[Processing] Cần chèn mới ${newImagesToInsert.length} bản ghi hình ảnh vào DB.`);

  // 3. Batch DB Execution
  const avatarIdsArr = Array.from(avatarUpdateIds);
  const coverIdsArr = Array.from(coverUpdateIds);

  // Helper chunking for large IN (...) queries
  const chunkSize = 1000;
  for (let i = 0; i < avatarIdsArr.length; i += chunkSize) {
    const chunk = avatarIdsArr.slice(i, i + chunkSize);
    await VenueImage.update(
      { image_type: 'AVATAR', is_avatar: true },
      { where: { image_id: chunk } }
    );
  }

  for (let i = 0; i < coverIdsArr.length; i += chunkSize) {
    const chunk = coverIdsArr.slice(i, i + chunkSize);
    await VenueImage.update(
      { image_type: 'COVER', is_cover: true, is_primary: true },
      { where: { image_id: chunk } }
    );
  }

  if (newImagesToInsert.length > 0) {
    await VenueImage.bulkCreate(newImagesToInsert, { ignoreDuplicates: true });
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`=== HOÀN TẤT NÂNG CẤP VÀ LÀM SẠCH DỮ LIỆU HÌNH ẢNH TRONG ${durationSec} GIÂY ===`);
  process.exit(0);
}

cleanAndImportVenueImagesFast();
