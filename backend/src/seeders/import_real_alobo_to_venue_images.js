'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Venue, VenueImage, sequelize } = require('../models');

async function importRealAloboToVenueImagesFast() {
  console.log('=== IMPORT 100% ẢNH THẬT (AVATAR & COVER) VÀO BẢNG venue_images (SIÊU TỐC) ===');
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

  const venueAvatarMap = new Map();
  const venueCoverMap = new Map();

  for (const jv of jsonVenues) {
    const normName = jv.venue_name ? jv.venue_name.trim().toLowerCase() : '';
    const venue = venueNameMap.get(normName);
    if (!venue) continue;

    const avatarUrl = jv.avatar || (jv.images && jv.images.find((i) => i.type === 'avatar')?.url) || null;
    const coverUrl = jv.cover || (jv.images && jv.images.find((i) => i.type === 'cover')?.url) || null;

    if (avatarUrl) venueAvatarMap.set(venue.venue_id, avatarUrl);
    if (coverUrl) venueCoverMap.set(venue.venue_id, coverUrl);
  }

  // Update venue_images records per venue
  let totalVenueImagesUpdated = 0;

  for (const [venueId, avatarUrl] of venueAvatarMap.entries()) {
    const coverUrl = venueCoverMap.get(venueId) || null;
    const [affected] = await VenueImage.update(
      { avatar: avatarUrl, cover: coverUrl },
      { where: { venue_id: venueId } }
    );
    totalVenueImagesUpdated += affected;

    // Update avatar image record
    await VenueImage.update(
      { image_url: avatarUrl, medium_url: avatarUrl, thumbnail_url: avatarUrl, large_url: avatarUrl, original_url: avatarUrl },
      { where: { venue_id: venueId, is_avatar: true } }
    );

    // Update cover image record
    if (coverUrl) {
      await VenueImage.update(
        { image_url: coverUrl, medium_url: coverUrl, thumbnail_url: coverUrl, large_url: coverUrl, original_url: coverUrl },
        { where: { venue_id: venueId, is_cover: true } }
      );
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`=== HOÀN TẤT IMPORT CỘT avatar VÀ cover VÀO BẢNG venue_images TRONG ${durationSec} GIÂY ===`);
  console.log(`- Số bản ghi venue_images đã được cập nhật 2 cột [avatar] và [cover]: ${totalVenueImagesUpdated}`);

  process.exit(0);
}

importRealAloboToVenueImagesFast();
