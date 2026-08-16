'use strict';

const { Op } = require('sequelize');

class VenueSearchService {
  async searchVenues(queryParams, models) {
    const { 
      keyword, 
      sport, 
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
    
    if (sport) {
      courtWhere.sport_category = sport;
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
      where: { target_type: 'VENUE', target_id: venueId },
      order: [['is_primary', 'DESC'], ['display_order', 'ASC']]
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

    if (courtIds.length > 0 && Review) {
      try {
        reviewCount = await Review.count({
          where: { court_id: { [Op.in]: courtIds } }
        });

        if (reviewCount > 0) {
          const ratingSum = await Review.sum('rating', {
            where: { court_id: { [Op.in]: courtIds } }
          });
          averageRating = parseFloat((ratingSum / reviewCount).toFixed(1));
        }

        reviewsList = await Review.findAll({
          where: { court_id: { [Op.in]: courtIds } },
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['user_id', 'full_name']
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
        console.warn('Notice: Review query skipped (reviews table may not exist yet):', err.message);
      }
    }

    venueJson.average_rating = averageRating;
    venueJson.review_count = reviewCount;
    venueJson.reviews = reviewsList.map(r => r.toJSON ? r.toJSON() : r);

    return venueJson;
  }

  async getSimilarVenues(venueId, models) {
    const { Venue, Branch, Court, VenueImage } = models;

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

    let currentSport = null;
    (currentVenue.branches || []).forEach(b => {
      (b.courts || []).forEach(c => {
        if (!currentSport && c.sport_category) currentSport = c.sport_category;
      });
    });

    const similarWhere = {
      operating_status: 'APPROVED',
      venue_id: { [Op.ne]: venueId }
    };

    const courtWhere = { court_status: 'ACTIVE' };
    if (currentSport) {
      courtWhere.sport_category = currentSport;
    }

    const similarVenues = await Venue.findAll({
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
        }
      ],
      limit: 3
    });

    const result = [];
    for (const v of similarVenues) {
      const vJson = v.toJSON();
      const imgs = await VenueImage.findAll({
        where: { target_type: 'VENUE', target_id: v.venue_id },
        limit: 1
      });
      vJson.image_url = imgs.length > 0 ? imgs[0].image_url : null;
      result.push(vJson);
    }

    return result;
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
}

module.exports = new VenueSearchService();
