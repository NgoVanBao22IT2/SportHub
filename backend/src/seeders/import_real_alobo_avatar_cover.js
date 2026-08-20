'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Venue, VenueImage, sequelize } = require('../models');

async function importRealAloboAvatarCoverFast() {
  console.log('=== IMPORT 100% ẢNH THẬT (AVATAR & COVER) TỪ data_img.json VÀO DATABASE (SIÊU TỐC) ===');
  const startTime = Date.now();

  const jsonPath = path.join(__dirname, '../../../data_img.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Không tìm thấy tệp data_img.json tại:', jsonPath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const jsonContent = JSON.parse(rawData);
  const jsonVenues = jsonContent.venues || [];
  console.log(`[data_img.json] Đã đọc ${jsonVenues.length} cơ sở từ tệp JSON.`);

  const dbVenues = await Venue.findAll({ attributes: ['venue_id', 'venue_name', 'owner_user_id'] });
  console.log(`[Database] Đã tải ${dbVenues.length} venues từ MySQL.`);

  const venueNameMap = new Map();
  dbVenues.forEach((v) => {
    const normName = v.venue_name.trim().toLowerCase();
    venueNameMap.set(normName, v);
  });

  // Prepare batch updates for venues table
  const avatarCoverData = [];
  const dbImages = await VenueImage.findAll({ attributes: ['image_id', 'venue_id', 'is_avatar', 'is_cover'] });

  const avatarImageByVenue = new Map();
  const coverImageByVenue = new Map();
  dbImages.forEach((img) => {
    if (img.is_avatar) avatarImageByVenue.set(img.venue_id, img.image_id);
    if (img.is_cover) coverImageByVenue.set(img.venue_id, img.image_id);
  });

  const venueUpdates = [];
  const avatarImageUpdates = [];
  const coverImageUpdates = [];
  const newImagesToInsert = [];

  for (const jv of jsonVenues) {
    const normName = jv.venue_name ? jv.venue_name.trim().toLowerCase() : '';
    const venue = venueNameMap.get(normName);
    if (!venue) continue;

    const venueId = venue.venue_id;
    const avatarUrl = jv.avatar || (jv.images && jv.images.find((i) => i.type === 'avatar')?.url) || null;
    const coverUrl = jv.cover || (jv.images && jv.images.find((i) => i.type === 'cover')?.url) || null;

    if (avatarUrl || coverUrl) {
      venueUpdates.push({ venue_id: venueId, avatar: avatarUrl, cover: coverUrl });
    }

    if (avatarUrl) {
      const existingAvatarId = avatarImageByVenue.get(venueId);
      if (existingAvatarId) {
        avatarImageUpdates.push({ image_id: existingAvatarId, url: avatarUrl });
      } else {
        newImagesToInsert.push({
          image_id: uuidv4(),
          venue_id: venueId,
          uploaded_by: venue.owner_user_id,
          target_type: 'VENUE',
          target_id: venueId,
          image_url: avatarUrl,
          medium_url: avatarUrl,
          thumbnail_url: avatarUrl,
          large_url: avatarUrl,
          original_url: avatarUrl,
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

    if (coverUrl) {
      const existingCoverId = coverImageByVenue.get(venueId);
      if (existingCoverId) {
        coverImageUpdates.push({ image_id: existingCoverId, url: coverUrl });
      } else {
        newImagesToInsert.push({
          image_id: uuidv4(),
          venue_id: venueId,
          uploaded_by: venue.owner_user_id,
          target_type: 'VENUE',
          target_id: venueId,
          image_url: coverUrl,
          medium_url: coverUrl,
          thumbnail_url: coverUrl,
          large_url: coverUrl,
          original_url: coverUrl,
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

  console.log(`[Processing] Đã chuẩn bị ${venueUpdates.length} venues updates, ${avatarImageUpdates.length} avatar image updates, ${coverImageUpdates.length} cover image updates.`);

  // 1. Bulk Update venues table
  for (const item of venueUpdates) {
    await Venue.update(
      { avatar: item.avatar, cover: item.cover },
      { where: { venue_id: item.venue_id } }
    );
  }

  // 2. Bulk Update avatar venue_images
  const avatarByUrlMap = new Map();
  avatarImageUpdates.forEach(item => {
    if (!avatarByUrlMap.has(item.url)) avatarByUrlMap.set(item.url, []);
    avatarByUrlMap.get(item.url).push(item.image_id);
  });

  const chunkSize = 1000;
  for (const [url, ids] of avatarByUrlMap.entries()) {
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      await VenueImage.update(
        { image_url: url, medium_url: url, thumbnail_url: url, large_url: url, original_url: url, image_type: 'AVATAR' },
        { where: { image_id: chunk } }
      );
    }
  }

  // 3. Bulk Update cover venue_images
  const coverByUrlMap = new Map();
  coverImageUpdates.forEach(item => {
    if (!coverByUrlMap.has(item.url)) coverByUrlMap.set(item.url, []);
    coverByUrlMap.get(item.url).push(item.image_id);
  });

  for (const [url, ids] of coverByUrlMap.entries()) {
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      await VenueImage.update(
        { image_url: url, medium_url: url, thumbnail_url: url, large_url: url, original_url: url, image_type: 'COVER', is_primary: true },
        { where: { image_id: chunk } }
      );
    }
  }

  if (newImagesToInsert.length > 0) {
    await VenueImage.bulkCreate(newImagesToInsert, { ignoreDuplicates: true });
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`=== HOÀN TẤT IMPORT 100% ẢNH THẬT TỪ data_img.json VÀO DATABASE TRONG ${durationSec} GIÂY ===`);
  process.exit(0);
}

importRealAloboAvatarCoverFast();
