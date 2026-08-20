'use strict';

const { v4: uuidv4 } = require('uuid');
const { Venue, VenueImage, Court, sequelize } = require('../models');

// High quality sport category fallback images
const FALLBACK_SPORT_COVERS = {
  'Cầu lông': 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop',
  'Pickleball': 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1200&auto=format&fit=crop',
  'Bóng đá': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop',
  'Tennis': 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop',
  'Default': 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop'
};

const FALLBACK_SPORT_AVATARS = {
  'Cầu lông': 'https://images.unsplash.com/photo-1521537634581-0dced2efa2a3?q=80&w=400&auto=format&fit=crop',
  'Pickleball': 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=400&auto=format&fit=crop',
  'Bóng đá': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=400&auto=format&fit=crop',
  'Tennis': 'https://images.unsplash.com/photo-1530915534664-4ac6423ca938?q=80&w=400&auto=format&fit=crop',
  'Default': 'https://images.unsplash.com/photo-1521537634581-0dced2efa2a3?q=80&w=400&auto=format&fit=crop'
};

async function ensureAllVenuesHaveCoverAndAvatar() {
  console.log('=== KÍCH HOẠT QUY TẮC: 100% CƠ SỞ ĐỀU PHẢI CÓ CẢ AVATAR VÀ COVER ===');

  const dbVenues = await Venue.findAll();
  console.log(`[Database] Đã tìm thấy ${dbVenues.length} Venues.`);

  const covers = await VenueImage.findAll({ where: { is_cover: true } });
  const avatars = await VenueImage.findAll({ where: { is_avatar: true } });

  const coverVenueIds = new Set(covers.map((c) => c.venue_id));
  const avatarVenueIds = new Set(avatars.map((a) => a.venue_id));

  let fixedAvatarCount = 0;
  let fixedCoverCount = 0;
  const newRecordsToInsert = [];

  for (const venue of dbVenues) {
    const venueId = venue.venue_id;
    const ownerUserId = venue.owner_user_id;

    const hasCover = coverVenueIds.has(venueId);
    const hasAvatar = avatarVenueIds.has(venueId);

    // If venue already has both cover and avatar, skip
    if (hasCover && hasAvatar) continue;

    // Fetch all existing images for this venue
    const venueImages = await VenueImage.findAll({ where: { venue_id: venueId } });

    // 1. Fix missing Cover
    if (!hasCover) {
      // Try to promote an existing image or existing avatar to cover
      const existingAvatar = venueImages.find((i) => i.is_avatar || i.image_type === 'AVATAR');
      const existingVenueImg = venueImages.find((i) => i.image_url);

      const coverUrlToUse = existingAvatar?.image_url || existingVenueImg?.image_url || FALLBACK_SPORT_COVERS['Default'];

      if (existingVenueImg) {
        await existingVenueImg.update({
          image_type: 'COVER',
          is_cover: true,
          is_primary: true,
          status: 'PUBLISHED'
        });
      } else {
        newRecordsToInsert.push({
          image_id: uuidv4(),
          venue_id: venueId,
          uploaded_by: ownerUserId,
          target_type: 'VENUE',
          target_id: venueId,
          image_url: coverUrlToUse,
          medium_url: coverUrlToUse,
          large_url: coverUrlToUse,
          image_type: 'COVER',
          title: `${venue.venue_name} - Ảnh bìa`,
          is_cover: true,
          is_avatar: false,
          is_primary: true,
          is_active: true,
          status: 'PUBLISHED',
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      fixedCoverCount++;
    }

    // 2. Fix missing Avatar
    if (!hasAvatar) {
      // Try to promote an existing image or cover to avatar
      const existingCover = venueImages.find((i) => i.is_cover || i.image_type === 'COVER');
      const existingVenueImg = venueImages.find((i) => i.image_url && !i.is_cover);

      const avatarUrlToUse = existingCover?.image_url || existingVenueImg?.image_url || FALLBACK_SPORT_AVATARS['Default'];

      if (existingVenueImg) {
        await existingVenueImg.update({
          image_type: 'AVATAR',
          is_avatar: true,
          status: 'PUBLISHED'
        });
      } else {
        newRecordsToInsert.push({
          image_id: uuidv4(),
          venue_id: venueId,
          uploaded_by: ownerUserId,
          target_type: 'VENUE',
          target_id: venueId,
          image_url: avatarUrlToUse,
          medium_url: avatarUrlToUse,
          thumbnail_url: avatarUrlToUse,
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
      fixedAvatarCount++;
    }
  }

  if (newRecordsToInsert.length > 0) {
    await VenueImage.bulkCreate(newRecordsToInsert, { ignoreDuplicates: true });
  }

  // Final Verification
  const finalCovers = await VenueImage.findAll({ where: { is_cover: true } });
  const finalAvatars = await VenueImage.findAll({ where: { is_avatar: true } });

  const finalCoverVenueIds = new Set(finalCovers.map((c) => c.venue_id));
  const finalAvatarVenueIds = new Set(finalAvatars.map((a) => a.venue_id));

  let finalMissingCover = 0;
  let finalMissingAvatar = 0;
  dbVenues.forEach((v) => {
    if (!finalCoverVenueIds.has(v.venue_id)) finalMissingCover++;
    if (!finalAvatarVenueIds.has(v.venue_id)) finalMissingAvatar++;
  });

  console.log('=== KẾT QUẢ ĐỒNG BỘ HOÀN HẢO ===');
  console.log(`- Đã bổ sung cờ Ảnh bìa (Cover) cho: ${fixedCoverCount} cơ sở`);
  console.log(`- Đã bổ sung cờ Ảnh đại diện (Avatar) cho: ${fixedAvatarCount} cơ sở`);
  console.log(`- Tổng số Venues trong Database: ${dbVenues.length}`);
  console.log(`- Số Venues có Ảnh bìa (is_cover = true): ${finalCoverVenueIds.size} / ${dbVenues.length} (${finalMissingCover === 0 ? '100% HOÀN HẢO' : 'CẦN KIỂM TRA'})`);
  console.log(`- Số Venues có Ảnh đại diện (is_avatar = true): ${finalAvatarVenueIds.size} / ${dbVenues.length} (${finalMissingAvatar === 0 ? '100% HOÀN HẢO' : 'CẦN KIỂM TRA'})`);

  process.exit(0);
}

ensureAllVenuesHaveCoverAndAvatar();
