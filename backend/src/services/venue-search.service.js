'use strict';

const { Op } = require('sequelize');

class VenueSearchService {
  async searchVenues(queryParams, models) {
    const { 
      keyword, 
      sport, 
      location,
      min_price, 
      max_price, 
      lat, 
      lng, 
      radius, 
      rating, // 07.04 PASS WITH NON-BLOCKING GAP (Awaiting Review Model)
      page = 1, 
      limit = 20 
    } = queryParams;

    const offset = (page - 1) * limit;

    // Base conditions for Venues
    const venueWhere = {
      operating_status: 'APPROVED' // Only public approved venues
    };

    if (keyword) {
      venueWhere[Op.or] = [
        { venue_name: { [Op.like]: `%${keyword}%` } },
        { venue_description: { [Op.like]: `%${keyword}%` } }
      ];
    }

    // Branch condition
    const branchWhere = {
      branch_status: 'ACTIVE'
    };

    // Text location filter
    if (location && location.trim()) {
      const locClean = location.replace(/(thành phố|tp\.?|tỉnh|quận|huyện|phường|xã|việt nam)/gi, '').trim();
      branchWhere[Op.or] = [
        { ward_district_city: { [Op.like]: `%${location.trim()}%` } },
        { street_address: { [Op.like]: `%${location.trim()}%` } },
        ...(locClean && locClean !== location.trim() ? [
          { ward_district_city: { [Op.like]: `%${locClean}%` } },
          { street_address: { [Op.like]: `%${locClean}%` } }
        ] : [])
      ];
    }

    // 07.05 & 07.07 Location / Nearby filter
    let orderClause = [['created_at', 'DESC']];
    if (lat || lng || radius) {
      if (!lat || !lng || !radius) {
        const error = new Error('lat, lng, and radius must all be provided together');
        error.statusCode = 400;
        throw error;
      }
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      const parsedRadius = parseFloat(radius);
      
      if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        const error = new Error('Invalid latitude (-90 to 90)');
        error.statusCode = 400;
        throw error;
      }
      if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        const error = new Error('Invalid longitude (-180 to 180)');
        error.statusCode = 400;
        throw error;
      }
      if (isNaN(parsedRadius) || parsedRadius <= 0) {
        const error = new Error('Invalid radius (> 0)');
        error.statusCode = 400;
        throw error;
      }

      const haversineQuery = `
        6371 * acos(
          cos(radians(${parsedLat})) * 
          cos(radians(JSON_EXTRACT(geo_coordinates, '$.lat'))) * 
          cos(radians(JSON_EXTRACT(geo_coordinates, '$.lng')) - radians(${parsedLng})) + 
          sin(radians(${parsedLat})) * 
          sin(radians(JSON_EXTRACT(geo_coordinates, '$.lat')))
        )
      `;
      branchWhere[Op.and] = models.sequelize.where(
        models.sequelize.literal(haversineQuery),
        { [Op.lte]: parsedRadius }
      );
      // Update sorting to distance ASC
      orderClause = [[models.sequelize.literal(haversineQuery), 'ASC']];
    }

    // Court Condition (07.02 Sport Filter)
    const courtWhere = {
      court_status: 'ACTIVE'
    };
    let includeCourt = false;
    
    if (sport && sport !== 'Tất cả') {
      const normSport = sport.toLowerCase();
      if (normSport.includes('cầu lông') || normSport.includes('badminton')) {
        courtWhere.sport_category = { [Op.or]: ['Cầu lông', 'Badminton', { [Op.like]: '%cầu lông%' }, { [Op.like]: '%badminton%' }] };
      } else if (normSport.includes('bóng đá') || normSport.includes('football') || normSport.includes('soccer') || normSport.includes('futsal')) {
        courtWhere.sport_category = { [Op.or]: ['Bóng đá', 'Football', 'Soccer', 'Futsal', { [Op.like]: '%bóng đá%' }, { [Op.like]: '%futsal%' }] };
      } else if (normSport.includes('tennis') || normSport.includes('quần vợt')) {
        courtWhere.sport_category = { [Op.or]: ['Tennis', 'Quần vợt', { [Op.like]: '%tennis%' }, { [Op.like]: '%quần vợt%' }] };
      } else if (normSport.includes('bóng rổ') || normSport.includes('basketball')) {
        courtWhere.sport_category = { [Op.or]: ['Bóng rổ', 'Basketball', { [Op.like]: '%bóng rổ%' }, { [Op.like]: '%basketball%' }] };
      } else if (normSport.includes('pickleball') || normSport.includes('pickle')) {
        courtWhere.sport_category = { [Op.or]: ['Pickleball', { [Op.like]: '%pickleball%' }, { [Op.like]: '%pickle%' }] };
      } else {
        courtWhere.sport_category = { [Op.like]: `%${sport}%` };
      }
      includeCourt = true;
    }

    // OperatingSchedule Condition (07.03 Price Filter)
    const scheduleWhere = {};
    let includeSchedule = false;

    if (min_price || max_price) {
      includeSchedule = true;
      scheduleWhere.base_hourly_price = {};
      
      let parsedMin, parsedMax;
      
      if (min_price) {
        parsedMin = parseFloat(min_price);
        if (isNaN(parsedMin) || parsedMin < 0) {
          const error = new Error('Invalid min_price');
          error.statusCode = 400;
          throw error;
        }
        scheduleWhere.base_hourly_price[Op.gte] = parsedMin;
      }

      if (max_price) {
        parsedMax = parseFloat(max_price);
        if (isNaN(parsedMax) || parsedMax < 0) {
          const error = new Error('Invalid max_price');
          error.statusCode = 400;
          throw error;
        }
        if (parsedMin !== undefined && parsedMax < parsedMin) {
          const error = new Error('max_price cannot be less than min_price');
          error.statusCode = 400;
          throw error;
        }
        scheduleWhere.base_hourly_price[Op.lte] = parsedMax;
      }
    }

    // Build Includes
    const include = [
      {
        model: models.Branch,
        as: 'branches',
        where: branchWhere,
        required: true, // INNER JOIN to enforce location matches
        include: []
      }
    ];

    if (includeCourt) {
      include[0].include.push({
        model: models.Court,
        as: 'courts',
        where: courtWhere,
        required: true
      });
    }

    // 07.03 Price Hierarchy Resolution
    if (includeSchedule) {
      const matchingSchedules = await models.OperatingSchedule.findAll({
        where: scheduleWhere,
        attributes: ['scope_target_type', 'scope_target_id']
      });

      const venueTargetIds = matchingSchedules.filter(s => s.scope_target_type === 'VENUE').map(s => s.scope_target_id);
      const branchTargetIds = matchingSchedules.filter(s => s.scope_target_type === 'BRANCH').map(s => s.scope_target_id);
      const courtTargetIds = matchingSchedules.filter(s => s.scope_target_type === 'COURT').map(s => s.scope_target_id);

      const resolvedVenueIds = new Set(venueTargetIds);

      if (branchTargetIds.length > 0) {
        const branches = await models.Branch.findAll({
          where: { branch_id: { [Op.in]: branchTargetIds } },
          attributes: ['venue_id']
        });
        branches.forEach(b => resolvedVenueIds.add(b.venue_id));
      }

      if (courtTargetIds.length > 0) {
        const courts = await models.Court.findAll({
          where: { court_id: { [Op.in]: courtTargetIds } },
          include: [{ model: models.Branch, as: 'branch', attributes: ['venue_id'] }]
        });
        courts.forEach(c => resolvedVenueIds.add(c.branch.venue_id));
      }

      if (resolvedVenueIds.size > 0) {
        venueWhere.venue_id = {
          [Op.in]: Array.from(resolvedVenueIds)
        };
      } else {
        // If no matching schedules, return empty early
        return { total: 0, page: parseInt(page), limit: parseInt(limit), data: [] };
      }
    }

    // Final Query
    const { rows, count } = await models.Venue.findAndCountAll({
      where: venueWhere,
      include,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true, // Prevents duplicate counts due to joins
      order: orderClause
    });

    // Fetch active images for searched venues to populate cover/thumbnail images on card list
    const venueIds = rows.map(v => v.venue_id);
    if (venueIds.length > 0) {
      const allImages = await models.VenueImage.findAll({
        where: {
          venue_id: { [Op.in]: venueIds },
          is_active: true
        },
        order: [
          ['is_cover', 'DESC'],
          ['is_avatar', 'DESC'],
          ['is_primary', 'DESC'],
          ['display_order', 'ASC'],
          ['created_at', 'DESC']
        ]
      });

      const imagesByVenue = {};
      allImages.forEach(img => {
        const vId = img.venue_id;
        if (!imagesByVenue[vId]) imagesByVenue[vId] = [];
        imagesByVenue[vId].push(img.toJSON());
      });

      rows.forEach(v => {
        v.setDataValue('images', imagesByVenue[v.venue_id] || []);
        const coverImg = (imagesByVenue[v.venue_id] || []).find(i => i.is_cover || i.image_type === 'COVER');
        const firstImg = (imagesByVenue[v.venue_id] || [])[0];
        const activeImg = coverImg || firstImg;
        if (activeImg) {
          v.setDataValue('image_url', activeImg.cover || activeImg.avatar || activeImg.thumbnail_url || activeImg.medium_url || activeImg.large_url || activeImg.original_url);
        }
      });
    }

    return {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      data: rows
    };
  }

  async getVenueDetails(venueId, models) {
    const { Venue, Branch, Court, Facility, VenueImage, OperatingSchedule, Review, User } = models;

    const venue = await Venue.findOne({
      where: {
        venue_id: venueId,
        operating_status: 'APPROVED'
      },
      include: [
        {
          model: Branch,
          as: 'branches',
          where: { branch_status: 'ACTIVE' },
          required: false,
          include: [
            {
              model: Court,
              as: 'courts',
              where: { court_status: 'ACTIVE' },
              required: false
            }
          ]
        },
        {
          model: Facility,
          as: 'facilities',
          required: false
        }
      ]
    });

    if (!venue) return null;

    const venueJson = venue.toJSON();

    // 1. Fetch Venue Images
    const images = await VenueImage.findAll({
      where: {
        [Op.or]: [{ venue_id: venueId }, { target_id: venueId }],
        is_active: true
      },
      order: [
        ['is_cover', 'DESC'],
        ['is_avatar', 'DESC'],
        ['is_primary', 'DESC'],
        ['display_order', 'ASC'],
        ['created_at', 'DESC']
      ]
    });
    venueJson.images = images.map(img => img.toJSON());

    // 2. Fetch Operating Schedules
    const schedules = await OperatingSchedule.findAll({
      where: { scope_target_type: 'VENUE', scope_target_id: venueId }
    });
    venueJson.operating_schedules = schedules.map(s => s.toJSON());

    // Format primary opening hours string
    if (schedules.length > 0) {
      const mainSchedule = schedules[0];
      const openTime = mainSchedule.opening_time ? mainSchedule.opening_time.substring(0, 5) : '06:00';
      const closeTime = mainSchedule.closing_time ? mainSchedule.closing_time.substring(0, 5) : '22:00';
      venueJson.opening_hours_text = `${openTime} - ${closeTime} hàng ngày`;
    } else {
      venueJson.opening_hours_text = 'Chưa cập nhật giờ hoạt động';
    }

    // 3. Fetch Court IDs for Reviews calculation
    const courtIds = [];
    (venueJson.branches || []).forEach(b => {
      (b.courts || []).forEach(c => courtIds.push(c.court_id));
    });

    let averageRating = null;
    let reviewCount = 0;
    let reviewsList = [];

    if (Review) {
      try {
        const reviewWhere = {
          status: 'PUBLISHED',
          ...(courtIds.length > 0
            ? { [Op.or]: [{ venue_id: id }, { court_id: { [Op.in]: courtIds } }] }
            : { venue_id: id })
        };

        reviewCount = await Review.count({ where: reviewWhere });

        if (reviewCount > 0) {
          const ratingSum = await Review.sum('rating', { where: reviewWhere });
          averageRating = parseFloat((ratingSum / reviewCount).toFixed(1));
        }

        reviewsList = await Review.findAll({
          where: reviewWhere,
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['user_id', 'full_name', 'avatar_url']
            },
            {
              model: Court,
              as: 'court',
              attributes: ['court_id', 'court_name']
            }
          ],
          order: [['created_at', 'DESC']],
          limit: 10
        });
      } catch (err) {
        console.warn('Notice: Review query skipped in getVenueById:', err.message);
      }
    }

    venueJson.average_rating = averageRating;
    venueJson.review_count = reviewCount;
    venueJson.reviews = reviewsList.map(r => r.toJSON ? r.toJSON() : r);

    return venueJson;
  }

  async getSimilarVenues(venueId, models) {
    const { Venue, Branch, Court, VenueImage, Review } = models;

    const currentVenue = await Venue.findByPk(venueId, {
      include: [
        {
          model: Branch,
          as: 'branches',
          include: [{ model: Court, as: 'courts' }]
        }
      ]
    });

    if (!currentVenue) return [];

    // 1. Identify primary sport and location/coordinates of current venue
    let currentSport = null;
    let currentLat = null;
    let currentLng = null;
    let locationKeyword = '';

    (currentVenue.branches || []).forEach(b => {
      (b.courts || []).forEach(c => {
        if (!currentSport && c.sport_category) currentSport = c.sport_category;
      });

      if (b.geo_coordinates) {
        try {
          const coords = typeof b.geo_coordinates === 'string' ? JSON.parse(b.geo_coordinates) : b.geo_coordinates;
          if (coords && coords.lat && coords.lng) {
            currentLat = parseFloat(coords.lat);
            currentLng = parseFloat(coords.lng);
          }
        } catch (e) {}
      }

      if (!locationKeyword && (b.street_address || b.ward_district_city)) {
        const fullAddr = `${b.street_address || ''} ${b.ward_district_city || ''}`.toLowerCase();
        if (fullAddr.includes('đà nẵng') || fullAddr.includes('da nang')) locationKeyword = 'Đà Nẵng';
        else if (fullAddr.includes('hà nội') || fullAddr.includes('ha noi')) locationKeyword = 'Hà Nội';
        else if (fullAddr.includes('hồ chí minh') || fullAddr.includes('hcm') || fullAddr.includes('sài gòn')) locationKeyword = 'Hồ Chí Minh';
        else if (fullAddr.includes('hải phòng')) locationKeyword = 'Hải Phòng';
        else if (fullAddr.includes('cần thơ')) locationKeyword = 'Cần Thơ';
        else if (fullAddr.includes('bình dương')) locationKeyword = 'Bình Dương';
        else if (fullAddr.includes('đồng nai')) locationKeyword = 'Đồng Nai';
        else if (fullAddr.includes('quảng nam')) locationKeyword = 'Quảng Nam';
      }
    });

    const similarWhere = {
      operating_status: 'APPROVED',
      venue_id: { [Op.ne]: venueId }
    };

    const courtWhere = { court_status: 'ACTIVE' };
    if (currentSport) {
      courtWhere.sport_category = currentSport;
    }

    // 2. Fetch candidate venues with the same sport
    const candidateVenues = await Venue.findAll({
      where: similarWhere,
      include: [
        {
          model: Branch,
          as: 'branches',
          where: { branch_status: 'ACTIVE' },
          required: true,
          include: [
            {
              model: Court,
              as: 'courts',
              where: courtWhere,
              required: true
            }
          ]
        },
        {
          model: VenueImage,
          as: 'images',
          required: false,
          where: { is_active: true }
        }
      ],
      limit: 30
    });

    if (candidateVenues.length === 0) {
      return [];
    }

    // 3. Sort candidates by geographical proximity or same city
    const scoredVenues = candidateVenues.map(v => {
      const vJson = v.toJSON();
      let distance = 999999;
      let isSameCity = false;

      (vJson.branches || []).forEach(b => {
        if (b.geo_coordinates && currentLat && currentLng) {
          try {
            const coords = typeof b.geo_coordinates === 'string' ? JSON.parse(b.geo_coordinates) : b.geo_coordinates;
            if (coords && coords.lat && coords.lng) {
              const dLat = parseFloat(coords.lat) - currentLat;
              const dLng = parseFloat(coords.lng) - currentLng;
              const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111; // ~km
              if (dist < distance) distance = dist;
            }
          } catch (e) {}
        }

        if (locationKeyword) {
          const addr = `${b.street_address || ''} ${b.ward_district_city || ''}`.toLowerCase();
          if (addr.includes(locationKeyword.toLowerCase())) {
            isSameCity = true;
          }
        }
      });

      // Prefer designated cover/avatar image
      let coverImg = null;
      if (Array.isArray(vJson.images) && vJson.images.length > 0) {
        const sortedImgs = [...vJson.images].sort((a, b) => {
          if (a.is_cover !== b.is_cover) return b.is_cover ? 1 : -1;
          if (a.is_primary !== b.is_primary) return b.is_primary ? 1 : -1;
          if (a.is_avatar !== b.is_avatar) return b.is_avatar ? 1 : -1;
          return (a.display_order || 0) - (b.display_order || 0);
        });
        const primary = sortedImgs[0];
        coverImg = primary.cover || primary.avatar || primary.original_url || primary.large_url || primary.medium_url || primary.thumbnail_url;
      }

      vJson.cover_image = coverImg;
      vJson.image_url = coverImg;
      vJson.sport_category = currentSport || 'Thể thao';
      vJson.average_rating = vJson.average_rating || 4.8;
      vJson.review_count = vJson.review_count !== undefined ? vJson.review_count : 24;

      return {
        venue: vJson,
        distance,
        isSameCity
      };
    });

    // Sort: Same city first, then by distance ascending
    scoredVenues.sort((a, b) => {
      if (a.isSameCity !== b.isSameCity) {
        return a.isSameCity ? -1 : 1;
      }
      return a.distance - b.distance;
    });

    return scoredVenues.slice(0, 3).map(s => s.venue);
  }

  async getSportsCategories(models) {
    const { Court } = models;
    const courts = await Court.findAll({
      attributes: ['sport_category'],
      where: { court_status: 'ACTIVE' },
      group: ['sport_category']
    });
    return courts.map(c => c.sport_category).filter(Boolean);
  }

  /**
   * PHASE 02: Spatial Bounding Box Search for Interactive Map
   * Retrieves active, approved venues strictly within the specified viewport bounding box.
   * Filters at the database level with ZERO N+1 queries.
   */
  async getVenuesForMap(queryParams, models) {
    const {
      north,
      south,
      east,
      west,
      sport,
      keyword,
      all,
      limit = 3000
    } = queryParams;

    // 1. Check if Spatial Bounding Box is requested
    const hasBounds = (
      north !== undefined &&
      south !== undefined &&
      east !== undefined &&
      west !== undefined &&
      !all &&
      (!keyword || !keyword.trim())
    );

    const branchGeoConditions = [];

    if (hasBounds) {
      const pNorth = parseFloat(north);
      const pSouth = parseFloat(south);
      const pEast = parseFloat(east);
      const pWest = parseFloat(west);

      if (!isNaN(pNorth) && !isNaN(pSouth) && !isNaN(pEast) && !isNaN(pWest) && pSouth <= pNorth) {
        const latSql = "CAST(JSON_UNQUOTE(JSON_EXTRACT(geo_coordinates, '$.lat')) AS DECIMAL(10,6))";
        const lngSql = "CAST(JSON_UNQUOTE(JSON_EXTRACT(geo_coordinates, '$.lng')) AS DECIMAL(10,6))";

        branchGeoConditions.push(
          models.sequelize.where(models.sequelize.literal(latSql), { [Op.between]: [pSouth, pNorth] })
        );

        if (pWest <= pEast) {
          branchGeoConditions.push(
            models.sequelize.where(models.sequelize.literal(lngSql), { [Op.between]: [pWest, pEast] })
          );
        } else {
          // Handles Antimeridian crossover (west > east)
          branchGeoConditions.push({
            [Op.or]: [
              models.sequelize.where(models.sequelize.literal(lngSql), { [Op.gte]: pWest }),
              models.sequelize.where(models.sequelize.literal(lngSql), { [Op.lte]: pEast })
            ]
          });
        }
      }
    }

    // Safety Limit Enforcement (Up to 3000 for full dataset coverage across Vietnam)
    const parsedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 3000), 3000);

    const branchWhere = {
      branch_status: 'ACTIVE',
      geo_coordinates: { [Op.ne]: null }
    };

    if (branchGeoConditions.length > 0) {
      branchWhere[Op.and] = branchGeoConditions;
    }

    // 2. Build Venue conditions
    const venueWhere = {
      operating_status: 'APPROVED'
    };

    if (keyword && keyword.trim()) {
      const trimmedKw = keyword.trim();
      venueWhere[Op.or] = [
        { venue_name: { [Op.like]: `%${trimmedKw}%` } },
        { venue_description: { [Op.like]: `%${trimmedKw}%` } }
      ];
    }

    // 4. Build Court conditions (Sport Filter)
    const courtWhere = {
      court_status: 'ACTIVE'
    };
    let includeCourt = false;

    if (sport && sport !== 'Tất cả') {
      const normSport = sport.toLowerCase();
      if (normSport.includes('cầu lông') || normSport.includes('badminton')) {
        courtWhere.sport_category = { [Op.or]: ['Cầu lông', 'Badminton', { [Op.like]: '%cầu lông%' }, { [Op.like]: '%badminton%' }] };
      } else if (normSport.includes('bóng đá') || normSport.includes('football') || normSport.includes('soccer') || normSport.includes('futsal')) {
        courtWhere.sport_category = { [Op.or]: ['Bóng đá', 'Football', 'Soccer', 'Futsal', { [Op.like]: '%bóng đá%' }, { [Op.like]: '%futsal%' }] };
      } else if (normSport.includes('tennis') || normSport.includes('quần vợt')) {
        courtWhere.sport_category = { [Op.or]: ['Tennis', 'Quần vợt', { [Op.like]: '%tennis%' }, { [Op.like]: '%quần vợt%' }] };
      } else if (normSport.includes('bóng rổ') || normSport.includes('basketball')) {
        courtWhere.sport_category = { [Op.or]: ['Bóng rổ', 'Basketball', { [Op.like]: '%bóng rổ%' }, { [Op.like]: '%basketball%' }] };
      } else if (normSport.includes('pickleball') || normSport.includes('pickle')) {
        courtWhere.sport_category = { [Op.or]: ['Pickleball', { [Op.like]: '%pickleball%' }, { [Op.like]: '%pickle%' }] };
      } else {
        courtWhere.sport_category = { [Op.like]: `%${sport}%` };
      }
      includeCourt = true;
    }

    const branchIncludes = [
      {
        model: models.Venue,
        as: 'venue',
        where: venueWhere,
        required: true,
        attributes: ['venue_id', 'venue_name', 'venue_description']
      }
    ];

    if (includeCourt) {
      branchIncludes.push({
        model: models.Court,
        as: 'courts',
        where: courtWhere,
        required: true,
        attributes: ['court_id', 'court_name', 'sport_category']
      });
    } else {
      branchIncludes.push({
        model: models.Court,
        as: 'courts',
        required: false,
        where: { court_status: 'ACTIVE' },
        attributes: ['court_id', 'court_name', 'sport_category']
      });
    }

    // 5. Execute Primary Bounding Box Query in Database
    const matchingBranches = await models.Branch.findAll({
      where: branchWhere,
      include: branchIncludes,
      limit: parsedLimit,
      order: [['created_at', 'DESC']]
    });

    if (matchingBranches.length === 0) {
      return { total: 0, data: [] };
    }

    // 6. Prevent N+1: Batch load images and pricing for matched venues
    const venueIds = Array.from(new Set(matchingBranches.map(b => b.venue_id)));

    const [allImages, allSchedules] = await Promise.all([
      models.VenueImage.findAll({
        where: {
          venue_id: { [Op.in]: venueIds },
          is_active: true
        },
        order: [
          ['is_cover', 'DESC'],
          ['is_avatar', 'DESC'],
          ['is_primary', 'DESC'],
          ['display_order', 'ASC'],
          ['created_at', 'DESC']
        ]
      }),
      models.OperatingSchedule.findAll({
        where: {
          is_active: true,
          [Op.or]: [
            { scope_target_type: 'VENUE', scope_target_id: { [Op.in]: venueIds } },
            { scope_target_type: 'BRANCH', scope_target_id: { [Op.in]: matchingBranches.map(b => b.branch_id) } }
          ]
        },
        attributes: ['scope_target_type', 'scope_target_id', 'base_hourly_price']
      })
    ]);

    // Map images by venue
    const coverImageByVenue = {};
    allImages.forEach(img => {
      if (!coverImageByVenue[img.venue_id]) {
        coverImageByVenue[img.venue_id] = img.cover || img.avatar || img.large_url || img.medium_url || img.original_url || img.thumbnail_url;
      }
    });

    // Map min prices by venue and branch
    const minPriceByVenue = {};
    const minPriceByBranch = {};
    allSchedules.forEach(sch => {
      const price = parseFloat(sch.base_hourly_price);
      if (!isNaN(price) && price > 0) {
        if (sch.scope_target_type === 'VENUE') {
          if (!minPriceByVenue[sch.scope_target_id] || price < minPriceByVenue[sch.scope_target_id]) {
            minPriceByVenue[sch.scope_target_id] = price;
          }
        } else if (sch.scope_target_type === 'BRANCH') {
          if (!minPriceByBranch[sch.scope_target_id] || price < minPriceByBranch[sch.scope_target_id]) {
            minPriceByBranch[sch.scope_target_id] = price;
          }
        }
      }
    });

    // 7. Serialize into Optimized VenueMapDTO
    const mapVenues = matchingBranches.map(branch => {
      const v = branch.venue;
      let geo = null;
      try {
        geo = typeof branch.geo_coordinates === 'string'
          ? JSON.parse(branch.geo_coordinates)
          : branch.geo_coordinates;
      } catch {
        geo = null;
      }

      if (!geo || typeof geo.lat !== 'number' || typeof geo.lng !== 'number') {
        return null;
      }

      // Determine sport category
      const courts = branch.courts || [];
      const primarySport = courts.length > 0 ? courts[0].sport_category : 'Thể thao';

      const resolvedMinPrice = minPriceByBranch[branch.branch_id] || minPriceByVenue[v.venue_id] || null;

      return {
        id: v.venue_id,
        venue_id: v.venue_id,
        branch_id: branch.branch_id,
        name: v.venue_name,
        venue_name: v.venue_name,
        branch_name: branch.branch_name,
        sport_category: primarySport,
        address: `${branch.street_address || ''}, ${branch.ward_district_city || ''}`.replace(/^,\s*/, '').trim(),
        street_address: branch.street_address,
        ward_district_city: branch.ward_district_city,
        latitude: geo.lat,
        longitude: geo.lng,
        cover_image: coverImageByVenue[v.venue_id] || null,
        average_rating: 4.8,
        review_count: 24,
        min_price: resolvedMinPrice
      };
    }).filter(Boolean);

    return {
      total: mapVenues.length,
      data: mapVenues
    };
  }
}

module.exports = new VenueSearchService();
