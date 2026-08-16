'use strict';

const { FavoriteVenue, Venue, Branch, VenueImage, Review, Court, Op } = require('../models');

class FavoriteService {
  /**
   * Fetch all favorite venues for a user with venue details.
   */
  static async getFavorites(userId) {
    const favoriteRecords = await FavoriteVenue.findAll({
      where: { customer_user_id: userId },
      order: [['added_at', 'DESC']]
    });

    if (!favoriteRecords || favoriteRecords.length === 0) {
      return [];
    }

    const venueIds = favoriteRecords.map(f => f.venue_id);

    const venues = await Venue.findAll({
      where: {
        venue_id: { [Op.in]: venueIds },
        operating_status: 'APPROVED'
      },
      include: [
        {
          model: Branch,
          as: 'branches',
          required: false,
          attributes: ['branch_id', 'branch_name', 'street_address', 'ward_district_city', 'geo_coordinates']
        }
      ]
    });

    // Map images, ratings for each venue
    const venueList = await Promise.all(venues.map(async (v) => {
      const vJson = v.toJSON();

      // Images
      const primaryImage = await VenueImage.findOne({
        where: { target_type: 'VENUE', target_id: v.venue_id, is_primary: true }
      });
      if (primaryImage) {
        vJson.image_url = primaryImage.image_url;
      } else {
        const firstImg = await VenueImage.findOne({
          where: { target_type: 'VENUE', target_id: v.venue_id }
        });
        vJson.image_url = firstImg ? firstImg.image_url : null;
      }

      // Ratings
      const branches = await Branch.findAll({ where: { venue_id: v.venue_id }, attributes: ['branch_id'] });
      const branchIds = branches.map(b => b.branch_id);
      const courts = await Court.findAll({ where: { branch_id: { [Op.in]: branchIds } }, attributes: ['court_id'] });
      const courtIds = courts.map(c => c.court_id);

      if (courtIds.length > 0 && Review) {
        try {
          const reviewCount = await Review.count({ where: { court_id: { [Op.in]: courtIds } } });
          vJson.review_count = reviewCount;
          if (reviewCount > 0) {
            const sumRating = await Review.sum('rating', { where: { court_id: { [Op.in]: courtIds } } });
            vJson.average_rating = parseFloat((sumRating / reviewCount).toFixed(1));
          } else {
            vJson.average_rating = null;
          }
        } catch (e) {
          vJson.review_count = 0;
          vJson.average_rating = null;
        }
      }

      return vJson;
    }));

    return venueList;
  }

  /**
   * Add a venue to user's favorites.
   */
  static async addFavorite(userId, venueId) {
    if (!venueId) {
      const err = new Error('venue_id is required');
      err.statusCode = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    // Check venue existence
    const venue = await Venue.findByPk(venueId);
    if (!venue) {
      const err = new Error('Venue not found');
      err.statusCode = 404;
      err.code = 'VENUE_NOT_FOUND';
      throw err;
    }

    // Check existing favorite
    const existing = await FavoriteVenue.findOne({
      where: { customer_user_id: userId, venue_id: venueId }
    });

    if (existing) {
      const err = new Error('Venue already in favorites');
      err.statusCode = 409;
      err.code = 'DUPLICATE_FAVORITE';
      throw err;
    }

    const created = await FavoriteVenue.create({
      customer_user_id: userId,
      venue_id: venueId,
      added_at: new Date()
    });

    return created;
  }

  /**
   * Remove a venue from user's favorites.
   */
  static async removeFavorite(userId, venueId) {
    if (!venueId) {
      const err = new Error('venue_id is required');
      err.statusCode = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const existing = await FavoriteVenue.findOne({
      where: { customer_user_id: userId, venue_id: venueId }
    });

    if (!existing) {
      const err = new Error('Favorite not found');
      err.statusCode = 404;
      err.code = 'FAVORITE_NOT_FOUND';
      throw err;
    }

    await existing.destroy();
    return { success: true, message: 'Removed from favorites' };
  }
}

module.exports = FavoriteService;
