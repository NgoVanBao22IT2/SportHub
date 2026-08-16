'use strict';

const crypto = require('crypto');

class VenueService {
  async createVenue(ownerUserId, data, models, transaction = null) {
    const { venue_name, contact_phone, venue_description } = data;

    const venueId = crypto.randomUUID();

    const venue = await models.Venue.create({
      venue_id: venueId,
      owner_user_id: ownerUserId,
      venue_name,
      contact_phone,
      venue_description,
      operating_status: 'PENDING'
    }, { transaction });

    return venue;
  }

  async getVenuesByOwner(ownerUserId, models) {
    return models.Venue.findAll({
      where: { owner_user_id: ownerUserId },
      include: [
        {
          model: models.Branch,
          as: 'branches',
          include: [
            {
              model: models.Court,
              as: 'courts'
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  async getVenueByIdForOwner(ownerUserId, venueId, models) {
    const venue = await models.Venue.findOne({
      where: { venue_id: venueId, owner_user_id: ownerUserId },
      include: [
        { model: models.Facility, as: 'facilities' }
      ]
    });

    if (!venue) {
      const error = new Error('Venue not found or access denied');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }
    return venue;
  }

  async updateVenue(ownerUserId, venueId, data, models, transaction = null) {
    const venue = await this.getVenueByIdForOwner(ownerUserId, venueId, models);

    const { venue_name, contact_phone, venue_description } = data;

    await venue.update({
      venue_name: venue_name !== undefined ? venue_name : venue.venue_name,
      contact_phone: contact_phone !== undefined ? contact_phone : venue.contact_phone,
      venue_description: venue_description !== undefined ? venue_description : venue.venue_description
    }, { transaction });

    return venue;
  }

  async deleteVenue(ownerUserId, venueId, models, transaction = null) {
    const venue = await this.getVenueByIdForOwner(ownerUserId, venueId, models);
    await venue.destroy({ transaction });
    return { success: true, message: 'Venue deleted successfully' };
  }

  async getVenuePaymentAccounts(venueId, models) {
    const venue = await models.Venue.findByPk(venueId, {
      include: [
        { model: models.User, as: 'owner', attributes: ['user_id', 'full_name', 'phone_number'] },
        { model: models.VenuePaymentAccount, as: 'payment_accounts' }
      ]
    });

    if (!venue) {
      const error = new Error('Venue not found');
      error.statusCode = 404;
      throw error;
    }

    let accounts = venue.payment_accounts || [];

    // If owner hasn't configured custom payment accounts yet, generate server-authoritative accounts from venue owner data
    if (accounts.length === 0) {
      const ownerName = venue.owner?.full_name || venue.venue_name || 'SportHub Owner';
      const phone = venue.contact_phone || venue.owner?.phone_number || '0905123456';
      
      accounts = [
        {
          account_id: `acc_momo_${venueId.substring(0, 8)}`,
          venue_id: venueId,
          payment_method: 'MOMO',
          account_name: ownerName.toUpperCase(),
          account_number: phone,
          bank_name: 'Ví MoMo',
          phone_number: phone,
          qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|${phone}|${encodeURIComponent(ownerName)}||0|0|0`,
          is_active: true
        },
        {
          account_id: `acc_bank_${venueId.substring(0, 8)}`,
          venue_id: venueId,
          payment_method: 'BANK_TRANSFER',
          account_name: ownerName.toUpperCase(),
          account_number: '1903' + phone.substring(1),
          bank_name: 'MB Bank (Ngân hàng Quân Đội)',
          phone_number: phone,
          qr_code_url: `https://img.vietqr.io/image/MB-1903${phone.substring(1)}-compact2.png?accountName=${encodeURIComponent(ownerName)}`,
          is_active: true
        }
      ];
    }

    return accounts;
  }
}

module.exports = new VenueService();
