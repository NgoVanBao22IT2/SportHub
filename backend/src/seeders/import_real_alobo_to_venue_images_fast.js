'use strict';

const fs = require('fs');
const path = require('path');
const { Venue, sequelize } = require('../models');

async function importRealAloboToVenueImagesUltraFast() {
  console.log('=== IMPORT 100% ẢNH THẬT (AVATAR & COVER) VÀO BẢNG venue_images (BẰNG RAW BATCH SQL) ===');
  const startTime = Date.now();

  const jsonPath = path.join(__dirname, '../../../data_img.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Không tìm thấy tệp data_img.json tại:', jsonPath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const jsonContent = JSON.parse(rawData);
  const jsonVenues = jsonContent.venues || [];

  const dbVenues = await Venue.findAll({ attributes: ['venue_id', 'venue_name'] });

  const venueNameMap = new Map();
  dbVenues.forEach((v) => {
    const normName = v.venue_name.trim().toLowerCase();
    venueNameMap.set(normName, v.venue_id);
  });

  const venueIdToAvatar = new Map();
  const venueIdToCover = new Map();

  for (const jv of jsonVenues) {
    const normName = jv.venue_name ? jv.venue_name.trim().toLowerCase() : '';
    const venueId = venueNameMap.get(normName);
    if (!venueId) continue;

    const avatarUrl = jv.avatar || (jv.images && jv.images.find((i) => i.type === 'avatar')?.url) || null;
    const coverUrl = jv.cover || (jv.images && jv.images.find((i) => i.type === 'cover')?.url) || null;

    if (avatarUrl) venueIdToAvatar.set(venueId, avatarUrl);
    if (coverUrl) venueIdToCover.set(venueId, coverUrl);
  }

  console.log(`[Processing] Chuẩn bị cập nhật cho ${venueIdToAvatar.size} venues có Avatar và ${venueIdToCover.size} venues có Cover.`);

  // Process updates in chunks of 500 venues to keep query size small
  const venueIds = Array.from(new Set([...venueIdToAvatar.keys(), ...venueIdToCover.keys()]));
  const chunkSize = 500;
  let totalUpdated = 0;

  for (let i = 0; i < venueIds.length; i += chunkSize) {
    const chunk = venueIds.slice(i, i + chunkSize);
    
    let avatarCaseClause = 'CASE venue_id ';
    let coverCaseClause = 'CASE venue_id ';

    chunk.forEach((vId) => {
      const av = venueIdToAvatar.get(vId) || '';
      const cv = venueIdToCover.get(vId) || '';
      if (av) avatarCaseClause += `WHEN ${sequelize.escape(vId)} THEN ${sequelize.escape(av)} `;
      if (cv) coverCaseClause += `WHEN ${sequelize.escape(vId)} THEN ${sequelize.escape(cv)} `;
    });

    avatarCaseClause += 'ELSE avatar END';
    coverCaseClause += 'ELSE cover END';

    const rawQuery = `
      UPDATE venue_images 
      SET avatar = ${avatarCaseClause},
          cover = ${coverCaseClause}
      WHERE venue_id IN (${chunk.map((vId) => sequelize.escape(vId)).join(',')});
    `;

    const [result] = await sequelize.query(rawQuery);
    totalUpdated += (result?.affectedRows || result || 0);
  }

  // Set image_url for is_avatar and is_cover records to the exact real URLs
  await sequelize.query(`
    UPDATE venue_images 
    SET image_url = avatar, medium_url = avatar, thumbnail_url = avatar, large_url = avatar, original_url = avatar
    WHERE is_avatar = 1 AND avatar IS NOT NULL AND avatar != '';
  `);

  await sequelize.query(`
    UPDATE venue_images 
    SET image_url = cover, medium_url = cover, thumbnail_url = cover, large_url = cover, original_url = cover
    WHERE is_cover = 1 AND cover IS NOT NULL AND cover != '';
  `);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`=== HOÀN TẤT IMPORT RAW BATCH ${totalUpdated} BẢN GHI VÀO venue_images TRONG ${durationSec} GIÂY ===`);
  process.exit(0);
}

importRealAloboToVenueImagesUltraFast();
