'use strict';

const crypto = require('crypto');
const { OwnerRegistration, User, Venue, Branch, Court, OperatingSchedule, sequelize } = require('../models');

class OwnerRegistrationService {
  /**
   * Helper: Automatically create Venue, Branch, Courts, and Default Schedule for an approved registration.
   */
  static async _createVenueForRegistration(registration, transaction = null) {
    const existingVenue = await Venue.findOne({
      where: { owner_user_id: registration.user_id },
      transaction
    });

    if (existingVenue) {
      await existingVenue.update({ operating_status: 'APPROVED' }, { transaction });
      return existingVenue;
    }

    const venueId = crypto.randomUUID();
    const branchId = crypto.randomUUID();

    // 1. Create Venue
    const venue = await Venue.create({
      venue_id: venueId,
      owner_user_id: registration.user_id,
      venue_name: registration.business_name,
      contact_phone: registration.phone_number,
      venue_description: registration.description || `Cơ sở kinh doanh ${registration.business_name} (${registration.business_type})`,
      operating_status: 'APPROVED'
    }, { transaction });

    // 2. Create Branch
    const wardDistrictCity = [registration.ward, registration.district, registration.city_province].filter(Boolean).join(', ');
    const branch = await Branch.create({
      branch_id: branchId,
      venue_id: venueId,
      branch_name: `${registration.business_name} - Chi nhánh chính`,
      street_address: registration.street_address,
      ward_district_city: wardDistrictCity || 'TP. Hồ Chí Minh',
      branch_phone: registration.phone_number,
      branch_status: 'ACTIVE'
    }, { transaction });

    // 3. Create Courts
    const numCourts = Math.max(1, parseInt(registration.estimated_courts, 10) || 1);
    for (let i = 1; i <= numCourts; i++) {
      const courtName = numCourts < 10 ? `Sân 0${i}` : `Sân ${i}`;
      await Court.create({
        court_id: crypto.randomUUID(),
        branch_id: branchId,
        court_name: courtName,
        sport_category: registration.sport_categories || 'Cầu lông',
        court_status: 'ACTIVE',
        surface_features: 'Thảm tiêu chuẩn thi đấu'
      }, { transaction });
    }

    // 4. Create Default Operating Schedule
    await OperatingSchedule.create({
      schedule_id: crypto.randomUUID(),
      scope_target_type: 'VENUE',
      scope_target_id: venueId,
      day_scope: 'Monday-Sunday',
      opening_time: '06:00:00',
      closing_time: '23:00:00',
      base_hourly_price: 100000,
      peak_price_rules: 'Khung giờ vàng 17:00 - 22:00: 140.000 đ/giờ'
    }, { transaction });

    return venue;
  }

  /**
   * Sync existing APPROVED registrations to ensure they have corresponding Venue/Branch/Courts created.
   */
  static async syncApprovedRegistrationsToVenues() {
    try {
      const approvedRegistrations = await OwnerRegistration.findAll({
        where: { status: 'APPROVED' }
      });

      for (const reg of approvedRegistrations) {
        await this._createVenueForRegistration(reg);
      }
      console.log(`[OwnerRegistrationService] Synced ${approvedRegistrations.length} approved registrations with venues database.`);
    } catch (err) {
      console.error('[OwnerRegistrationService Sync Error]', err);
    }
  }

  /**
   * Create new owner registration application for a CUSTOMER.
   */
  static async createRegistration(userId, data) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.primary_role === 'OWNER') {
      const error = new Error('Your account is already a Venue Owner (OWNER).');
      error.statusCode = 400;
      error.code = 'ALREADY_OWNER';
      throw error;
    }

    if (user.primary_role === 'ADMIN') {
      const error = new Error('Administrator accounts cannot register as Venue Owner.');
      error.statusCode = 400;
      error.code = 'ADMIN_CANNOT_REGISTER';
      throw error;
    }

    // Check if user has an existing PENDING registration
    const pendingExisting = await OwnerRegistration.findOne({
      where: {
        user_id: userId,
        status: 'PENDING'
      }
    });

    if (pendingExisting) {
      const error = new Error('You already have a venue registration application pending approval.');
      error.statusCode = 400;
      error.code = 'PENDING_REGISTRATION_EXISTS';
      throw error;
    }

    const {
      business_name,
      business_type = 'Cơ sở tư nhân',
      representative_name,
      phone_number,
      email,
      street_address,
      city_province,
      district,
      ward,
      sport_categories = 'Cầu lông',
      estimated_courts = 1,
      description
    } = data;

    // Required fields check
    if (!business_name || !representative_name || !phone_number || !email || !street_address || !city_province || !district || !ward) {
      const error = new Error('Please fill in all required registration fields.');
      error.statusCode = 400;
      error.code = 'MISSING_REQUIRED_FIELDS';
      throw error;
    }

    const registrationId = crypto.randomUUID();

    const registration = await OwnerRegistration.create({
      registration_id: registrationId,
      user_id: userId,
      business_name,
      business_type,
      representative_name,
      phone_number,
      email,
      street_address,
      city_province,
      district,
      ward,
      sport_categories,
      estimated_courts: parseInt(estimated_courts, 10) || 1,
      description,
      status: 'PENDING'
    });

    return registration;
  }

  /**
   * Get latest registration for the logged-in user.
   */
  static async getMyRegistration(userId) {
    const registration = await OwnerRegistration.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    return registration;
  }

  /**
   * Cancel user's own PENDING registration.
   */
  static async cancelMyRegistration(userId, registrationId) {
    const registration = await OwnerRegistration.findOne({
      where: {
        registration_id: registrationId,
        user_id: userId,
        status: 'PENDING'
      }
    });

    if (!registration) {
      const error = new Error('Registration application not found or cannot be cancelled.');
      error.statusCode = 404;
      throw error;
    }

    await registration.update({ status: 'CANCELLED' });
    return registration;
  }

  /**
   * Admin: List all registration applications with pagination & filters.
   */
  static async getAdminRegistrations(options = {}) {
    const { page = 1, limit = 10, status, search } = options;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }

    const { rows, count } = await OwnerRegistration.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['user_id', 'full_name', 'email', 'phone_number', 'primary_role']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['user_id', 'full_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return {
      data: rows,
      meta: { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10) }
    };
  }

  /**
   * Admin: Approve registration with DB Transaction (Update status -> APPROVED & user primary_role -> OWNER).
   */
  static async approveRegistration(adminUserId, registrationId) {
    const t = await sequelize.transaction();

    try {
      const registration = await OwnerRegistration.findByPk(registrationId, { transaction: t });
      if (!registration) {
        const error = new Error('Registration application not found.');
        error.statusCode = 404;
        throw error;
      }

      if (registration.status === 'APPROVED') {
        const error = new Error('Registration application has already been approved.');
        error.statusCode = 400;
        throw error;
      }

      // 1. Update registration status to APPROVED
      await registration.update({
        status: 'APPROVED',
        reviewed_by: adminUserId,
        reviewed_at: new Date()
      }, { transaction: t });

      // 2. Update user primary_role to OWNER
      await User.update({
        primary_role: 'OWNER'
      }, {
        where: { user_id: registration.user_id },
        transaction: t
      });

      // 3. Automatically create Venue, Branch, Courts, and Default Schedule in DB
      await this._createVenueForRegistration(registration, t);

      await t.commit();
      return registration;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Admin: Reject registration with admin note.
   */
  static async rejectRegistration(adminUserId, registrationId, adminNote) {
    const registration = await OwnerRegistration.findByPk(registrationId);
    if (!registration) {
      const error = new Error('Registration application not found.');
      error.statusCode = 404;
      throw error;
    }

    if (!adminNote || !adminNote.trim()) {
      const error = new Error('Rejection reason (admin_note) is required.');
      error.statusCode = 400;
      error.code = 'REJECTION_NOTE_REQUIRED';
      throw error;
    }

    await registration.update({
      status: 'REJECTED',
      admin_note: adminNote.trim(),
      reviewed_by: adminUserId,
      reviewed_at: new Date()
    });

    return registration;
  }

  /**
   * Admin: Update owner registration details.
   */
  static async updateRegistration(adminUserId, registrationId, updateData) {
    const registration = await OwnerRegistration.findByPk(registrationId);
    if (!registration) {
      const error = new Error('Owner registration application not found.');
      error.statusCode = 404;
      throw error;
    }

    const {
      business_name,
      business_type,
      representative_name,
      phone_number,
      email,
      street_address,
      ward,
      district,
      city_province,
      sport_categories,
      estimated_courts,
      description,
      status,
      admin_note
    } = updateData;

    await registration.update({
      business_name: business_name !== undefined ? business_name : registration.business_name,
      business_type: business_type !== undefined ? business_type : registration.business_type,
      representative_name: representative_name !== undefined ? representative_name : registration.representative_name,
      phone_number: phone_number !== undefined ? phone_number : registration.phone_number,
      email: email !== undefined ? email : registration.email,
      street_address: street_address !== undefined ? street_address : registration.street_address,
      ward: ward !== undefined ? ward : registration.ward,
      district: district !== undefined ? district : registration.district,
      city_province: city_province !== undefined ? city_province : registration.city_province,
      sport_categories: sport_categories !== undefined ? sport_categories : registration.sport_categories,
      estimated_courts: estimated_courts !== undefined ? parseInt(estimated_courts, 10) : registration.estimated_courts,
      description: description !== undefined ? description : registration.description,
      status: status !== undefined ? status : registration.status,
      admin_note: admin_note !== undefined ? admin_note : registration.admin_note,
      reviewed_by: adminUserId
    });

    // If Admin manually updates status to APPROVED, upgrade user primary_role to OWNER & create Venue
    if (status === 'APPROVED') {
      await User.update({ primary_role: 'OWNER' }, { where: { user_id: registration.user_id } });
      await this._createVenueForRegistration(registration);
    }

    return registration;
  }

  /**
   * Admin: Delete owner registration application.
   */
  static async deleteRegistration(adminUserId, registrationId) {
    const registration = await OwnerRegistration.findByPk(registrationId);
    if (!registration) {
      const error = new Error('Owner registration application not found.');
      error.statusCode = 404;
      throw error;
    }

    await registration.destroy();
    return { success: true, message: 'Đã xóa hồ sơ đăng ký chủ sân thành công.' };
  }
}

module.exports = OwnerRegistrationService;
