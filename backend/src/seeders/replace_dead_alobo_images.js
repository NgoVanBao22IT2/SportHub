'use strict';

const { Op } = require('sequelize');
const { Venue, VenueImage, Branch, Court, sequelize } = require('../models');

// High resolution curated sport venue image pools (100% active CDN links)
const SPORT_IMAGE_POOLS = {
  'Pickleball': [
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop'
  ],
  'Cầu lông': [
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1521537634581-0dced2efa2a3?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop'
  ],
  'Bóng đá': [
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=1200&auto=format&fit=crop'
  ],
  'Tennis': [
    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1530915534664-4ac6423ca938?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?q=80&w=1200&auto=format&fit=crop'
  ],
  'Default': [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop'
  ]
};

function getSportCategory(venue) {
  const name = (venue.venue_name || '').toLowerCase();
  const sportFromCourt = venue.branches?.[0]?.courts?.[0]?.sport_category;

  if (name.includes('pickleball') || sportFromCourt === 'Pickleball') return 'Pickleball';
  if (name.includes('cầu lông') || name.includes('badminton') || sportFromCourt === 'Cầu lông') return 'Cầu lông';
  if (name.includes('bóng đá') || name.includes('fc') || name.includes('sân cỏ') || sportFromCourt === 'Bóng đá') return 'Bóng đá';
  if (name.includes('tennis') || sportFromCourt === 'Tennis') return 'Tennis';
  return 'Default';
}

function getDeterministicSportImage(venueId, sportCategory, imageOffset = 0) {
  const pool = SPORT_IMAGE_POOLS[sportCategory] || SPORT_IMAGE_POOLS['Default'];
  let hash = 0;
  const str = String(venueId);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = (Math.abs(hash) + imageOffset) % pool.length;
  return pool[index];
}

async function replaceDeadAloboImagesFast() {
  console.log('=== CHUYỂN ĐỔI BẠCH THẮNG CÁC LINK ẢNH HỎNG ALOBO SANG ẢNH CHẤT LƯỢNG CAO ===');
  const startTime = Date.now();

  const dbVenues = await Venue.findAll({
    attributes: ['venue_id', 'venue_name'],
    include: [{ model: Branch, as: 'branches', attributes: ['branch_id'], include: [{ model: Court, as: 'courts', attributes: ['sport_category'] }] }]
  });

  const venueSportMap = new Map();
  dbVenues.forEach((v) => {
    venueSportMap.set(v.venue_id, getSportCategory(v));
  });

  const aloboImages = await VenueImage.findAll({
    attributes: ['image_id', 'venue_id', 'image_url'],
    where: {
      image_url: { [Op.like]: '%m-files.alobo.vn%' }
    }
  });

  console.log(`[Database] Tìm thấy ${aloboImages.length} bản ghi hình ảnh chứa link m-files.alobo.vn.`);

  // Group image IDs by target URL
  const updatesByUrl = new Map();
  const imagesByVenue = new Map();

  aloboImages.forEach((img) => {
    if (!imagesByVenue.has(img.venue_id)) {
      imagesByVenue.set(img.venue_id, []);
    }
    imagesByVenue.get(img.venue_id).push(img);
  });

  aloboImages.forEach((img) => {
    const venueId = img.venue_id;
    const list = imagesByVenue.get(venueId) || [];
    const offset = list.indexOf(img);
    const sportCat = venueSportMap.get(venueId) || 'Default';
    const targetUrl = getDeterministicSportImage(venueId, sportCat, offset);

    if (!updatesByUrl.has(targetUrl)) {
      updatesByUrl.set(targetUrl, []);
    }
    updatesByUrl.get(targetUrl).push(img.image_id);
  });

  let totalUpdated = 0;
  const chunkSize = 1000;

  for (const [newUrl, imageIds] of updatesByUrl.entries()) {
    for (let i = 0; i < imageIds.length; i += chunkSize) {
      const chunk = imageIds.slice(i, i + chunkSize);
      await VenueImage.update(
        {
          image_url: newUrl,
          medium_url: newUrl,
          large_url: newUrl,
          thumbnail_url: newUrl,
          original_url: newUrl
        },
        { where: { image_id: chunk } }
      );
      totalUpdated += chunk.length;
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`=== HOÀN TẤT CHUYỂN ĐỔI ${totalUpdated} LINK ẢNH HỎNG SANG ẢNH CHẤT LƯỢNG CAO TRONG ${durationSec} GIÂY ===`);
  process.exit(0);
}

replaceDeadAloboImagesFast();
