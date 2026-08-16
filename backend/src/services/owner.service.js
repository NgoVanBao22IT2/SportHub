const { Booking, Court, Branch, Venue, Payment, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class OwnerService {
  /**
   * Retrieves bookings belonging to the owner's venues
   */
  /**
   * Retrieves bookings belonging to the owner's venues with search and status filters
   */
  static async getBookings(ownerId, options = {}) {
    const { page = 1, limit = 10, status, search, venueId } = options;
    const offset = (page - 1) * limit;

    const whereClause = {};

    // Filter by booking status
    if (status && status !== 'ALL') {
      if (status === 'PENDING') {
        whereClause.booking_status = {
          [Op.in]: ['WAITING_OWNER_CONFIRMATION', 'PAYMENT_PENDING', 'HOLDING']
        };
      } else {
        whereClause.booking_status = status;
      }
    }

    // Filter by search string (Booking ID)
    if (search && search.trim()) {
      whereClause[Op.or] = [
        { booking_id: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    // Venue filter
    const venueWhereClause = { owner_user_id: ownerId };
    if (venueId) {
      venueWhereClause.venue_id = venueId;
    }

    // Customer search condition
    const customerWhereClause = {};
    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      whereClause[Op.or].push(
        { '$customer.full_name$': { [Op.like]: searchPattern } },
        { '$customer.phone_number$': { [Op.like]: searchPattern } },
        { '$customer.email$': { [Op.like]: searchPattern } }
      );
    }

    const { rows, count } = await Booking.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Court,
          as: 'court',
          required: true,
          include: [
            {
              model: Branch,
              as: 'branch',
              required: true,
              include: [
                {
                  model: Venue,
                  as: 'venue',
                  required: true,
                  where: venueWhereClause // CRITICAL: Enforce ownership
                }
              ]
            }
          ]
        },
        {
          model: User,
          as: 'customer',
          attributes: ['user_id', 'full_name', 'email', 'phone_number']
        },
        {
          model: Payment,
          as: 'payments'
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      data: rows,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }

  /**
   * Retrieves single booking by ID owned by the logged-in owner
   */
  static async getBookingById(ownerId, bookingId) {
    const { BookingStatusHistory } = require('../models');

    const booking = await Booking.findOne({
      where: { booking_id: bookingId },
      include: [
        {
          model: Court,
          as: 'court',
          required: true,
          include: [
            {
              model: Branch,
              as: 'branch',
              required: true,
              include: [
                {
                  model: Venue,
                  as: 'venue',
                  required: true,
                  where: { owner_user_id: ownerId }
                }
              ]
            }
          ]
        },
        {
          model: User,
          as: 'customer',
          attributes: ['user_id', 'full_name', 'email', 'phone_number']
        },
        {
          model: Payment,
          as: 'payments'
        },
        {
          model: BookingStatusHistory,
          as: 'status_history'
        }
      ]
    });

    if (!booking) {
      const err = new Error('Đơn đặt sân không tồn tại hoặc không thuộc quyền quản lý của bạn');
      err.statusCode = 404;
      throw err;
    }

    return booking;
  }

  /**
   * Retrieves unique customers who have booked at the owner's venues
   */
  static async getCustomers(ownerId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    // To get unique customers, we find all bookings owned by this owner, grouped by customer_user_id
    const { rows, count } = await User.findAndCountAll({
      include: [
        {
          model: Booking,
          as: 'bookings',
          required: true,
          include: [
            {
              model: Court,
              as: 'court',
              required: true,
              include: [
                {
                  model: Branch,
                  as: 'branch',
                  required: true,
                  include: [
                    {
                      model: Venue,
                      as: 'venue',
                      required: true,
                      where: { owner_user_id: ownerId }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      distinct: true, // Count distinct users
      attributes: ['user_id', 'full_name', 'email', 'phone_number', 'user_status'],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      data: rows,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }

  /**
   * Retrieves revenue metrics strictly from PAID payments
   * Only includes COMPLETED/CONFIRMED bookings.
   */
  static async getRevenue(ownerId) {
    const revenueStats = await Payment.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('Payment.amount')), 'total_revenue'],
        [sequelize.fn('COUNT', sequelize.col('Payment.payment_id')), 'total_transactions']
      ],
      where: {
        payment_status: 'PAID'
      },
      include: [
        {
          model: Booking,
          as: 'booking',
          required: true,
          where: {
            booking_status: {
              [Op.in]: ['CONFIRMED', 'COMPLETED']
            }
          },
          include: [
            {
              model: Court,
              as: 'court',
              required: true,
              include: [
                {
                  model: Branch,
                  as: 'branch',
                  required: true,
                  include: [
                    {
                      model: Venue,
                      as: 'venue',
                      required: true,
                      where: { owner_user_id: ownerId }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      raw: true
    });

    return {
      total_revenue: parseFloat(revenueStats[0].total_revenue) || 0,
      total_transactions: parseInt(revenueStats[0].total_transactions) || 0
    };
  }

  /**
   * Dashboard aggregate endpoint - Enforces 100% Owner Data Isolation via DB Query
   */
  static async getDashboard(ownerId, options = {}) {
    const { Review, Notification } = require('../models');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { venueId } = options;
    const venueWhere = { owner_user_id: ownerId };
    if (venueId && venueId !== 'ALL') {
      venueWhere.venue_id = venueId;
    }

    // Common include for owner data isolation
    const ownerCourtInclude = {
      model: Court,
      as: 'court',
      required: true,
      include: [
        {
          model: Branch,
          as: 'branch',
          required: true,
          include: [
            {
              model: Venue,
              as: 'venue',
              required: true,
              where: venueWhere
            }
          ]
        }
      ]
    };

    // Execute parallel DB queries
    const [
      venueCount,
      courtCount,
      todayBookingsCount,
      confirmedBookingsToday,
      pendingBookingsCount,
      totalBookingsCount,
      todayPayments,
      yesterdayPayments,
      pendingPaymentsList,
      upcomingBookings,
      recentReviews,
      allOwnerReviews,
      unreadNotificationsCount,
      ownerVenues
    ] = await Promise.all([
      // 1. Venues count
      Venue.count({ where: venueWhere }),

      // 2. Courts count
      Court.count({
        include: [
          {
            model: Branch,
            as: 'branch',
            required: true,
            include: [
              {
                model: Venue,
                as: 'venue',
                required: true,
                where: venueWhere
              }
            ]
          }
        ]
      }),

      // 3. Today's Bookings
      Booking.count({
        where: { booking_date: todayStr },
        include: [ownerCourtInclude]
      }),

      // 4. Confirmed Bookings Today
      Booking.count({
        where: { booking_date: todayStr, booking_status: 'CONFIRMED' },
        include: [ownerCourtInclude]
      }),

      // 5. Pending Bookings Needing Owner Confirmation
      Booking.count({
        where: {
          booking_status: { [Op.in]: ['WAITING_OWNER_CONFIRMATION', 'PAYMENT_PENDING', 'HOLDING'] }
        },
        include: [ownerCourtInclude]
      }),

      // 6. Total Bookings Count
      Booking.count({
        include: [ownerCourtInclude]
      }),

      // 7. Today's Realized Revenue Payments
      Payment.findAll({
        where: {
          payment_status: 'SUCCESS',
          paid_at: {
            [Op.gte]: new Date(`${todayStr}T00:00:00.000Z`),
            [Op.lte]: new Date(`${todayStr}T23:59:59.999Z`)
          }
        },
        include: [
          {
            model: Booking,
            as: 'booking',
            required: true,
            include: [ownerCourtInclude]
          }
        ]
      }),

      // 8. Yesterday's Realized Revenue Payments (for % comparison)
      Payment.findAll({
        where: {
          payment_status: 'SUCCESS',
          paid_at: {
            [Op.gte]: new Date(`${yesterdayStr}T00:00:00.000Z`),
            [Op.lte]: new Date(`${yesterdayStr}T23:59:59.999Z`)
          }
        },
        include: [
          {
            model: Booking,
            as: 'booking',
            required: true,
            include: [ownerCourtInclude]
          }
        ]
      }),

      // 9. Pending Payments Needing Action
      Payment.findAll({
        where: {
          payment_status: { [Op.in]: ['INITIATED', 'PROCESSING'] }
        },
        include: [
          {
            model: Booking,
            as: 'booking',
            required: true,
            include: [
              ownerCourtInclude,
              {
                model: User,
                as: 'customer',
                attributes: ['user_id', 'full_name', 'email', 'phone_number']
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 6
      }),

      // 10. Upcoming Bookings (Today & Future)
      Booking.findAll({
        where: {
          booking_date: { [Op.gte]: todayStr }
        },
        include: [
          ownerCourtInclude,
          {
            model: User,
            as: 'customer',
            attributes: ['user_id', 'full_name', 'email', 'phone_number']
          },
          {
            model: Payment,
            as: 'payments'
          }
        ],
        order: [['booking_date', 'ASC'], ['start_time', 'ASC']],
        limit: 6
      }),

      // 11. Recent Customer Reviews
      Review.findAll({
        include: [
          {
            model: Court,
            as: 'court',
            required: true,
            include: [
              {
                model: Branch,
                as: 'branch',
                required: true,
                include: [
                  {
                    model: Venue,
                    as: 'venue',
                    required: true,
                    where: venueWhere
                  }
                ]
              }
            ]
          },
          {
            model: User,
            as: 'customer',
            attributes: ['user_id', 'full_name', 'email', 'phone_number']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 6
      }),

      // 12. All Reviews for Average Rating Calculation
      Review.findAll({
        include: [
          {
            model: Court,
            as: 'court',
            required: true,
            include: [
              {
                model: Branch,
                as: 'branch',
                required: true,
                include: [
                  {
                    model: Venue,
                    as: 'venue',
                    required: true,
                    where: venueWhere
                  }
                ]
              }
            ]
          }
        ]
      }),

      // 13. Unread Notifications Count
      Notification.count({
        where: { recipient_user_id: ownerId, is_read: false }
      }),

      // 14. Owner Venues list
      Venue.findAll({
        where: venueWhere,
        include: [
          {
            model: Branch,
            as: 'branches',
            include: [{ model: Court, as: 'courts' }]
          }
        ]
      })
    ]);

    // Calculate Today's Revenue & Revenue Change %
    const todayRevenue = todayPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const yesterdayRevenue = yesterdayPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    let todayRevenueChangePercent = 0;
    if (yesterdayRevenue > 0) {
      todayRevenueChangePercent = Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);
    } else if (todayRevenue > 0) {
      todayRevenueChangePercent = 100;
    }

    // Calculate Rating Metrics
    const totalReviews = allOwnerReviews.length;
    const ratingSum = allOwnerReviews.reduce((sum, r) => sum + (parseInt(r.rating) || 0), 0);
    const averageRating = totalReviews > 0 ? (ratingSum / totalReviews).toFixed(1) : '0.0';

    // Build last 7 days revenue trend
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    const past7DaysPayments = await Payment.findAll({
      where: {
        payment_status: 'SUCCESS',
        paid_at: {
          [Op.gte]: new Date(`${last7Days[0]}T00:00:00.000Z`),
          [Op.lte]: new Date(`${last7Days[6]}T23:59:59.999Z`)
        }
      },
      include: [
        {
          model: Booking,
          as: 'booking',
          required: true,
          include: [ownerCourtInclude]
        }
      ]
    });

    const revenueMap = {};
    last7Days.forEach(dStr => { revenueMap[dStr] = 0; });
    past7DaysPayments.forEach(p => {
      if (p.paid_at) {
        const dStr = new Date(p.paid_at).toISOString().split('T')[0];
        if (revenueMap[dStr] !== undefined) {
          revenueMap[dStr] += parseFloat(p.amount || 0);
        }
      }
    });

    const chartLabels = last7Days.map(dStr => {
      const parts = dStr.split('-');
      return `${parts[2]}/${parts[1]}`;
    });
    const chartValues = last7Days.map(dStr => revenueMap[dStr]);

    return {
      summary: {
        todayRevenue,
        todayRevenueChangePercent,
        todayBookings: todayBookingsCount,
        confirmedBookingsToday,
        pendingBookingsCount,
        totalBookings: totalBookingsCount,
        pendingPaymentsCount: pendingPaymentsList.length,
        averageRating: parseFloat(averageRating),
        totalReviews,
        unreadNotificationsCount,
        totalVenues: venueCount,
        totalCourts: courtCount
      },
      revenueTrend: {
        labels: chartLabels,
        values: chartValues
      },
      upcomingBookings,
      pendingPayments: pendingPaymentsList,
      recentReviews,
      venues: ownerVenues.map(v => ({
        venue_id: v.venue_id,
        venue_name: v.venue_name,
        sport_type: v.sport_type,
        approval_status: v.approval_status,
        contact_phone: v.contact_phone,
        court_count: (v.branches || []).reduce((sum, b) => sum + (b.courts || []).length, 0)
      }))
    };
  }

  /**
   * Get pending bookings waiting for owner confirmation
   */
  static async getPendingBookings(ownerId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { rows, count } = await Booking.findAndCountAll({
      where: {
        booking_status: {
          [Op.in]: ['WAITING_OWNER_CONFIRMATION', 'PAYMENT_PENDING', 'HOLDING']
        }
      },
      include: [
        {
          model: Court,
          as: 'court',
          required: true,
          include: [
            {
              model: Branch,
              as: 'branch',
              required: true,
              include: [
                {
                  model: Venue,
                  as: 'venue',
                  required: true,
                  where: { owner_user_id: ownerId }
                }
              ]
            }
          ]
        },
        {
          model: User,
          as: 'customer',
          attributes: ['user_id', 'full_name', 'email', 'phone_number']
        },
        {
          model: Payment,
          as: 'payments'
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      data: rows,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }

  /**
   * Approve a booking owned by this venue owner
   */
  static async approveBooking(ownerId, bookingId) {
    const { v4: uuidv4 } = require('uuid');
    const { BookingStatusHistory } = require('../models');

    const booking = await Booking.findOne({
      where: { booking_id: bookingId },
      include: [
        {
          model: Court,
          as: 'court',
          required: true,
          include: [
            {
              model: Branch,
              as: 'branch',
              required: true,
              include: [
                {
                  model: Venue,
                  as: 'venue',
                  required: true,
                  where: { owner_user_id: ownerId }
                }
              ]
            }
          ]
        }
      ]
    });

    if (!booking) {
      const err = new Error('Booking not found or not owned by you');
      err.statusCode = 403;
      throw err;
    }

    const oldStatus = booking.booking_status;
    booking.booking_status = 'CONFIRMED';
    await booking.save();

    await BookingStatusHistory.create({
      history_id: uuidv4(),
      booking_id: bookingId,
      from_status: oldStatus,
      to_status: 'CONFIRMED',
      changed_by_user_id: ownerId,
      change_reason: 'Owner Approved Booking'
    });

    return booking;
  }

  /**
   * Reject a booking owned by this venue owner
   */
  static async rejectBooking(ownerId, bookingId, reason) {
    const { v4: uuidv4 } = require('uuid');
    const { BookingStatusHistory } = require('../models');

    const booking = await Booking.findOne({
      where: { booking_id: bookingId },
      include: [
        {
          model: Court,
          as: 'court',
          required: true,
          include: [
            {
              model: Branch,
              as: 'branch',
              required: true,
              include: [
                {
                  model: Venue,
                  as: 'venue',
                  required: true,
                  where: { owner_user_id: ownerId }
                }
              ]
            }
          ]
        }
      ]
    });

    if (!booking) {
      const err = new Error('Booking not found or not owned by you');
      err.statusCode = 403;
      throw err;
    }

    const oldStatus = booking.booking_status;
    booking.booking_status = 'REJECTED';
    booking.rejection_reason = reason || 'Chủ sân từ chối đơn hàng';
    await booking.save();

    await BookingStatusHistory.create({
      history_id: uuidv4(),
      booking_id: bookingId,
      from_status: oldStatus,
      to_status: 'REJECTED',
      changed_by_user_id: ownerId,
      change_reason: `Owner Rejected: ${reason || 'Không thể phục vụ'}`
    });

    return booking;
  }

  /**
   * Block a court slot by venue owner with conflict validation
   */
  static async blockCourtSlot(ownerId, { courtId, date, startTime, endTime, reason }) {
    const { v4: uuidv4 } = require('uuid');
    const { SlotBlocking } = require('../models');

    // 1. Ownership check
    const court = await Court.findOne({
      where: { court_id: courtId },
      include: [
        {
          model: Branch,
          as: 'branch',
          required: true,
          include: [
            {
              model: Venue,
              as: 'venue',
              required: true,
              where: { owner_user_id: ownerId }
            }
          ]
        }
      ]
    });

    if (!court) {
      const err = new Error('Sân con không tồn tại hoặc không thuộc quyền quản lý của bạn.');
      err.statusCode = 403;
      throw err;
    }

    // 2. Conflict check: Check if an active booking overlaps with this time slot
    const activeBooking = await Booking.findOne({
      where: {
        court_id: courtId,
        booking_date: date,
        booking_status: {
          [Op.in]: ['HOLDING', 'PAYMENT_PENDING', 'WAITING_OWNER_CONFIRMATION', 'CONFIRMED', 'COMPLETED']
        },
        start_time: { [Op.lt]: endTime },
        end_time: { [Op.gt]: startTime }
      }
    });

    if (activeBooking) {
      const err = new Error('Khung giờ này đã có đơn đặt sân đang hoạt động. Không thể khóa khung giờ.');
      err.statusCode = 409;
      err.code = 'SLOT_ALREADY_BOOKED';
      throw err;
    }

    // 3. Create SlotBlocking
    const block = await SlotBlocking.create({
      block_id: uuidv4(),
      court_id: courtId,
      block_date: date,
      start_time: startTime,
      end_time: endTime,
      block_reason: reason || 'Chủ sân tạm khóa',
      created_by_owner_id: ownerId
    });

    return block;
  }

  /**
   * Unblock a court slot by blockId
   */
  static async unblockCourtSlot(ownerId, blockId) {
    const { SlotBlocking } = require('../models');

    const block = await SlotBlocking.findOne({
      where: { block_id: blockId },
      include: [
        {
          model: Court,
          as: 'court',
          required: true,
          include: [
            {
              model: Branch,
              as: 'branch',
              required: true,
              include: [
                {
                  model: Venue,
                  as: 'venue',
                  required: true,
                  where: { owner_user_id: ownerId }
                }
              ]
            }
          ]
        }
      ]
    });

    if (!block) {
      const err = new Error('Khung giờ bị khóa không tồn tại hoặc bạn không có quyền mở khóa.');
      err.statusCode = 403;
      throw err;
    }

    await block.destroy();
    return { success: true, message: 'Đã mở khóa khung giờ thành công.' };
  }

  /**
   * Get all payment accounts belonging to logged-in owner's venues
   */
  static async getOwnerPaymentAccounts(ownerId) {
    const { VenuePaymentAccount } = require('../models');

    const venues = await Venue.findAll({
      where: { owner_user_id: ownerId },
      attributes: ['venue_id', 'venue_name']
    });

    const venueIds = venues.map(v => v.venue_id);

    const accounts = await VenuePaymentAccount.findAll({
      where: {
        venue_id: { [Op.in]: venueIds.length ? venueIds : ['__NONE__'] }
      },
      include: [
        {
          model: Venue,
          as: 'venue',
          attributes: ['venue_id', 'venue_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return accounts;
  }

  /**
   * Create a new payment account for an owner venue
   */
  static async createOwnerPaymentAccount(ownerId, data) {
    const { v4: uuidv4 } = require('uuid');
    const { VenuePaymentAccount } = require('../models');

    const { venue_id, payment_method, account_name, account_number, bank_name, phone_number, qr_code_url } = data;

    if (!venue_id || !payment_method || !account_name || !account_number) {
      const err = new Error('Thiếu thông tin tài khoản thanh toán bắt buộc.');
      err.statusCode = 400;
      throw err;
    }

    // Verify venue ownership
    const venue = await Venue.findOne({
      where: { venue_id, owner_user_id: ownerId }
    });

    if (!venue) {
      const err = new Error('Câu lạc bộ không tồn tại hoặc không thuộc quyền quản lý của bạn.');
      err.statusCode = 403;
      throw err;
    }

    let finalQrCodeUrl = qr_code_url;
    if (!finalQrCodeUrl) {
      if (payment_method === 'BANK_TRANSFER' && bank_name) {
        finalQrCodeUrl = `https://img.vietqr.io/image/MB-${account_number}-compact2.png?accountName=${encodeURIComponent(account_name)}`;
      } else if (payment_method === 'MOMO' && account_number) {
        finalQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|${account_number}|${encodeURIComponent(account_name)}||0|0|0`;
      }
    }

    const newAccount = await VenuePaymentAccount.create({
      account_id: uuidv4(),
      venue_id,
      payment_method,
      account_name: account_name.toUpperCase(),
      account_number,
      bank_name: bank_name || (payment_method === 'MOMO' ? 'Ví MoMo' : 'Ngân hàng'),
      phone_number: phone_number || account_number,
      qr_code_url: finalQrCodeUrl,
      is_active: true
    });

    return newAccount;
  }

  /**
   * Update an existing payment account
   */
  static async updateOwnerPaymentAccount(ownerId, accountId, data) {
    const { VenuePaymentAccount } = require('../models');

    const account = await VenuePaymentAccount.findOne({
      where: { account_id: accountId },
      include: [
        {
          model: Venue,
          as: 'venue',
          required: true,
          where: { owner_user_id: ownerId }
        }
      ]
    });

    if (!account) {
      const err = new Error('Tài khoản thanh toán không tồn tại hoặc không thuộc quyền quản lý của bạn.');
      err.statusCode = 403;
      throw err;
    }

    if (data.account_name) account.account_name = data.account_name.toUpperCase();
    if (data.account_number) account.account_number = data.account_number;
    if (data.bank_name) account.bank_name = data.bank_name;
    if (data.phone_number) account.phone_number = data.phone_number;
    if (data.qr_code_url) account.qr_code_url = data.qr_code_url;
    if (typeof data.is_active === 'boolean') account.is_active = data.is_active;

    await account.save();
    return account;
  }

  /**
   * Delete a payment account
   */
  static async deleteOwnerPaymentAccount(ownerId, accountId) {
    const { VenuePaymentAccount } = require('../models');

    const account = await VenuePaymentAccount.findOne({
      where: { account_id: accountId },
      include: [
        {
          model: Venue,
          as: 'venue',
          required: true,
          where: { owner_user_id: ownerId }
        }
      ]
    });

    if (!account) {
      const err = new Error('Tài khoản thanh toán không tồn tại hoặc không thuộc quyền quản lý của bạn.');
      err.statusCode = 403;
      throw err;
    }

    await account.destroy();
    return { success: true, message: 'Đã xóa tài khoản thanh toán thành công.' };
  }

  /**
   * Get all payment transactions for venue owner with filters and KPI metrics
   */
  static async getPayments(ownerId, options = {}) {
    const { page = 1, limit = 10, status, search, paymentMethod, venueId } = options;
    const offset = (page - 1) * limit;

    const paymentWhereClause = {};
    if (status && status !== 'ALL') {
      if (status === 'PENDING') {
        paymentWhereClause.payment_status = { [Op.in]: ['INITIATED', 'PROCESSING'] };
      } else {
        paymentWhereClause.payment_status = status;
      }
    }
    if (paymentMethod && paymentMethod !== 'ALL') {
      paymentWhereClause.payment_method = paymentMethod;
    }
    if (search && search.trim()) {
      paymentWhereClause[Op.or] = [
        { payment_id: { [Op.like]: `%${search.trim()}%` } },
        { provider_order_id: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    const venueWhereClause = { owner_user_id: ownerId };
    if (venueId) {
      venueWhereClause.venue_id = venueId;
    }

    const { rows, count } = await Payment.findAndCountAll({
      where: paymentWhereClause,
      include: [
        {
          model: Booking,
          as: 'booking',
          required: true,
          include: [
            {
              model: Court,
              as: 'court',
              required: true,
              include: [
                {
                  model: Branch,
                  as: 'branch',
                  required: true,
                  include: [
                    {
                      model: Venue,
                      as: 'venue',
                      required: true,
                      where: venueWhereClause
                    }
                  ]
                }
              ]
            },
            {
              model: User,
              as: 'customer',
              attributes: ['user_id', 'full_name', 'email', 'phone_number']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // KPI Metrics calculation across owner's venues
    const allOwnerPayments = await Payment.findAll({
      include: [
        {
          model: Booking,
          as: 'booking',
          required: true,
          include: [
            {
              model: Court,
              as: 'court',
              required: true,
              include: [
                {
                  model: Branch,
                  as: 'branch',
                  required: true,
                  include: [
                    {
                      model: Venue,
                      as: 'venue',
                      required: true,
                      where: venueWhereClause
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    const kpis = {
      totalCount: allOwnerPayments.length,
      pendingCount: allOwnerPayments.filter(p => p.payment_status === 'INITIATED' || p.payment_status === 'PROCESSING').length,
      paidCount: allOwnerPayments.filter(p => p.payment_status === 'SUCCESS').length,
      totalAmount: allOwnerPayments.filter(p => p.payment_status === 'SUCCESS').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
      rejectedCount: allOwnerPayments.filter(p => p.payment_status === 'FAILED').length
    };

    return {
      data: rows,
      kpis,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }

  /**
   * Get single payment detail by paymentId for owner
   */
  static async getPaymentById(ownerId, paymentId) {
    const payment = await Payment.findOne({
      where: { payment_id: paymentId },
      include: [
        {
          model: Booking,
          as: 'booking',
          required: true,
          include: [
            {
              model: Court,
              as: 'court',
              required: true,
              include: [
                {
                  model: Branch,
                  as: 'branch',
                  required: true,
                  include: [
                    {
                      model: Venue,
                      as: 'venue',
                      required: true,
                      where: { owner_user_id: ownerId }
                    }
                  ]
                }
              ]
            },
            {
              model: User,
              as: 'customer',
              attributes: ['user_id', 'full_name', 'email', 'phone_number']
            }
          ]
        }
      ]
    });

    if (!payment) {
      const err = new Error('Giao dịch thanh toán không tồn tại hoặc không thuộc quyền quản lý của bạn.');
      err.statusCode = 404;
      throw err;
    }

    return payment;
  }

  /**
   * Approve payment transaction atomically with DB transaction
   */
  static async approvePaymentTransaction(ownerId, paymentId) {
    const { sequelize, BookingStatusHistory } = require('../models');
    const { v4: uuidv4 } = require('uuid');

    const transaction = await sequelize.transaction();

    try {
      const payment = await Payment.findOne({
        where: { payment_id: paymentId },
        include: [
          {
            model: Booking,
            as: 'booking',
            required: true,
            include: [
              {
                model: Court,
                as: 'court',
                required: true,
                include: [
                  {
                    model: Branch,
                    as: 'branch',
                    required: true,
                    include: [
                      {
                        model: Venue,
                        as: 'venue',
                        required: true,
                        where: { owner_user_id: ownerId }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        transaction
      });

      if (!payment) {
        const err = new Error('Giao dịch không tồn tại hoặc bạn không có quyền phê duyệt.');
        err.statusCode = 403;
        throw err;
      }

      // Concurrency check
      if (payment.payment_status === 'SUCCESS') {
        const err = new Error('Giao dịch thanh toán này đã được duyệt trước đó.');
        err.statusCode = 409;
        err.code = 'PAYMENT_ALREADY_PROCESSED';
        throw err;
      }

      if (payment.payment_status === 'FAILED') {
        const err = new Error('Giao dịch này đã bị từ chối trước đó, không thể phê duyệt lại.');
        err.statusCode = 400;
        throw err;
      }

      // 1. Update Payment Status
      payment.payment_status = 'SUCCESS';
      payment.paid_at = new Date();
      await payment.save({ transaction });

      // 2. Update Booking Status
      const booking = payment.booking;
      const oldBookingStatus = booking.booking_status;
      booking.booking_status = 'CONFIRMED';
      await booking.save({ transaction });

      // 3. Log Status History
      await BookingStatusHistory.create({
        history_id: uuidv4(),
        booking_id: booking.booking_id,
        from_status: oldBookingStatus,
        to_status: 'CONFIRMED',
        changed_by_user_id: ownerId,
        change_reason: 'Owner Approved Payment Transaction'
      }, { transaction });

      await transaction.commit();
      return payment;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Reject payment transaction atomically with DB transaction
   */
  static async rejectPaymentTransaction(ownerId, paymentId, reason) {
    const { sequelize, BookingStatusHistory } = require('../models');
    const { v4: uuidv4 } = require('uuid');

    const transaction = await sequelize.transaction();

    try {
      const payment = await Payment.findOne({
        where: { payment_id: paymentId },
        include: [
          {
            model: Booking,
            as: 'booking',
            required: true,
            include: [
              {
                model: Court,
                as: 'court',
                required: true,
                include: [
                  {
                    model: Branch,
                    as: 'branch',
                    required: true,
                    include: [
                      {
                        model: Venue,
                        as: 'venue',
                        required: true,
                        where: { owner_user_id: ownerId }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        transaction
      });

      if (!payment) {
        const err = new Error('Giao dịch không tồn tại hoặc bạn không có quyền từ chối.');
        err.statusCode = 403;
        throw err;
      }

      if (payment.payment_status === 'FAILED') {
        const err = new Error('Giao dịch thanh toán này đã bị từ chối trước đó.');
        err.statusCode = 409;
        err.code = 'PAYMENT_ALREADY_PROCESSED';
        throw err;
      }

      if (payment.payment_status === 'SUCCESS') {
        const err = new Error('Giao dịch này đã được duyệt thành công trước đó, không thể từ chối.');
        err.statusCode = 400;
        throw err;
      }

      // 1. Update Payment Status
      payment.payment_status = 'FAILED';
      payment.failed_at = new Date();
      await payment.save({ transaction });

      // 2. Update Booking Status
      const booking = payment.booking;
      const oldBookingStatus = booking.booking_status;
      booking.booking_status = 'REJECTED';
      booking.rejection_reason = reason || 'Chủ sân từ chối giao dịch thanh toán';
      await booking.save({ transaction });

      // 3. Log Status History
      await BookingStatusHistory.create({
        history_id: uuidv4(),
        booking_id: booking.booking_id,
        from_status: oldBookingStatus,
        to_status: 'REJECTED',
        changed_by_user_id: ownerId,
        change_reason: `Owner Rejected Payment: ${reason || 'Không hợp lệ'}`
      }, { transaction });

      await transaction.commit();
      return payment;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Comprehensive Owner Revenue & Financial Analytics Service
   */
  static async getRevenue(ownerId, options = {}) {
    const { from, to, venueId, courtId, paymentMethod, page = 1, limit = 10, search } = options;

    // Date range setup
    const now = new Date();
    const endDate = to ? new Date(`${to}T23:59:59.999Z`) : new Date(now.setHours(23, 59, 59, 999));
    
    let startDate;
    if (from) {
      startDate = new Date(`${from}T00:00:00.000Z`);
    } else {
      // Default to 30 days ago
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    // Venue scoping for Owner Data Isolation
    const venueWhere = { owner_user_id: ownerId };
    if (venueId) {
      venueWhere.venue_id = venueId;
    }

    const courtWhere = {};
    if (courtId) {
      courtWhere.court_id = courtId;
    }

    const paymentWhere = {
      payment_status: 'SUCCESS',
      paid_at: {
        [Op.between]: [startDate, endDate]
      }
    };

    if (paymentMethod && paymentMethod !== 'ALL') {
      paymentWhere.payment_method = paymentMethod;
    }

    // 1. Fetch all successful payments in period for owner
    const payments = await Payment.findAll({
      where: paymentWhere,
      include: [
        {
          model: Booking,
          as: 'booking',
          required: true,
          include: [
            {
              model: Court,
              as: 'court',
              required: true,
              where: Object.keys(courtWhere).length ? courtWhere : undefined,
              include: [
                {
                  model: Branch,
                  as: 'branch',
                  required: true,
                  include: [
                    {
                      model: Venue,
                      as: 'venue',
                      required: true,
                      where: venueWhere
                    }
                  ]
                }
              ]
            },
            {
              model: User,
              as: 'customer',
              attributes: ['user_id', 'full_name', 'email', 'phone_number']
            }
          ]
        }
      ],
      order: [['paid_at', 'DESC']]
    });

    // Filter by search string if provided
    let filteredPayments = payments;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredPayments = payments.filter(p =>
        (p.payment_id || '').toLowerCase().includes(q) ||
        (p.booking_id || '').toLowerCase().includes(q) ||
        (p.booking?.customer?.full_name || '').toLowerCase().includes(q) ||
        (p.booking?.customer?.phone_number || '').toLowerCase().includes(q) ||
        (p.booking?.court?.court_name || '').toLowerCase().includes(q)
      );
    }

    // Gross & Net Revenue Summary
    const totalTransactions = filteredPayments.length;
    const grossRevenue = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const netRevenue = grossRevenue; // Net revenue equals gross revenue in current schema
    const averageTransactionValue = totalTransactions > 0 ? Math.round(grossRevenue / totalTransactions) : 0;

    // Previous Period Comparison Calculation
    const dayDiff = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - dayDiff);
    const prevEndDate = new Date(startDate);

    const prevPayments = await Payment.findAll({
      where: {
        payment_status: 'SUCCESS',
        paid_at: { [Op.between]: [prevStartDate, prevEndDate] }
      },
      include: [
        {
          model: Booking,
          as: 'booking',
          required: true,
          include: [
            {
              model: Court,
              as: 'court',
              required: true,
              where: Object.keys(courtWhere).length ? courtWhere : undefined,
              include: [
                {
                  model: Branch,
                  as: 'branch',
                  required: true,
                  include: [
                    {
                      model: Venue,
                      as: 'venue',
                      required: true,
                      where: venueWhere
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    const previousPeriodRevenue = prevPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    let revenueChangePercent = 0;
    if (previousPeriodRevenue > 0) {
      revenueChangePercent = Math.round(((grossRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100);
    } else if (grossRevenue > 0) {
      revenueChangePercent = 100;
    }

    // Generate Continuous Daily Chart Data
    const chartMap = {};
    const currD = new Date(startDate);
    while (currD <= endDate) {
      const dStr = currD.toISOString().split('T')[0];
      chartMap[dStr] = 0;
      currD.setDate(currD.getDate() + 1);
    }

    filteredPayments.forEach(p => {
      if (p.paid_at) {
        const pDateStr = new Date(p.paid_at).toISOString().split('T')[0];
        if (chartMap[pDateStr] !== undefined) {
          chartMap[pDateStr] += parseFloat(p.amount || 0);
        }
      }
    });

    const chartLabels = Object.keys(chartMap).map(dStr => {
      const parts = dStr.split('-');
      return `${parts[2]}/${parts[1]}`;
    });
    const chartValues = Object.values(chartMap);

    // Revenue by Venue Aggregation
    const venueMap = {};
    filteredPayments.forEach(p => {
      const v = p.booking?.court?.branch?.venue;
      if (v) {
        const vId = v.venue_id;
        if (!venueMap[vId]) {
          venueMap[vId] = {
            venue_id: vId,
            venue_name: v.venue_name,
            revenue: 0,
            transaction_count: 0
          };
        }
        venueMap[vId].revenue += parseFloat(p.amount || 0);
        venueMap[vId].transaction_count += 1;
      }
    });

    const byVenue = Object.values(venueMap).map(v => ({
      ...v,
      percentage: grossRevenue > 0 ? Math.round((v.revenue / grossRevenue) * 100) : 0
    }));

    // Revenue by Court Aggregation
    const courtMap = {};
    filteredPayments.forEach(p => {
      const c = p.booking?.court;
      const vName = c?.branch?.venue?.venue_name || 'Câu lạc bộ';
      if (c) {
        const cId = c.court_id;
        if (!courtMap[cId]) {
          courtMap[cId] = {
            court_id: cId,
            court_name: c.court_name,
            venue_name: vName,
            revenue: 0,
            transaction_count: 0
          };
        }
        courtMap[cId].revenue += parseFloat(p.amount || 0);
        courtMap[cId].transaction_count += 1;
      }
    });

    const byCourt = Object.values(courtMap)
      .map(c => ({
        ...c,
        average_value: c.transaction_count > 0 ? Math.round(c.revenue / c.transaction_count) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Revenue by Payment Method Aggregation
    const methodMap = {};
    filteredPayments.forEach(p => {
      const m = p.payment_method || 'OTHER';
      if (!methodMap[m]) {
        methodMap[m] = { method: m, revenue: 0, transaction_count: 0 };
      }
      methodMap[m].revenue += parseFloat(p.amount || 0);
      methodMap[m].transaction_count += 1;
    });

    const byPaymentMethod = Object.values(methodMap).map(m => ({
      ...m,
      percentage: grossRevenue > 0 ? Math.round((m.revenue / grossRevenue) * 100) : 0
    }));

    // Paginated Transactions for Table View
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    const paginatedPayments = filteredPayments.slice(offset, offset + limitNum);

    return {
      summary: {
        grossRevenue,
        netRevenue,
        totalTransactions,
        averageTransactionValue
      },
      comparison: {
        previousPeriodRevenue,
        revenueChangePercent
      },
      chart: {
        labels: chartLabels,
        values: chartValues
      },
      byVenue,
      byCourt,
      byPaymentMethod,
      transactions: paginatedPayments,
      meta: {
        total: totalTransactions,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalTransactions / limitNum) || 1
      }
    };
  }

  /**
   * Get all customer reviews for owner's venues/courts with filters, KPIs & distribution
   */
  static async getReviews(ownerId, options = {}) {
    const { Review } = require('../models');
    const { page = 1, limit = 10, search, venueId, courtId, rating, sort = 'NEWEST' } = options;
    const offset = (page - 1) * limit;

    const reviewWhere = {};
    if (rating && rating !== 'ALL') {
      reviewWhere.rating = parseInt(rating);
    }

    const venueWhere = { owner_user_id: ownerId };
    if (venueId) {
      venueWhere.venue_id = venueId;
    }

    const courtWhere = {};
    if (courtId) {
      courtWhere.court_id = courtId;
    }

    let orderClause = [['created_at', 'DESC']];
    if (sort === 'OLDEST') orderClause = [['created_at', 'ASC']];
    if (sort === 'RATING_HIGH_LOW') orderClause = [['rating', 'DESC'], ['created_at', 'DESC']];
    if (sort === 'RATING_LOW_HIGH') orderClause = [['rating', 'ASC'], ['created_at', 'DESC']];

    // Fetch all reviews for owner to compute real KPI metrics & Star Distribution
    const allOwnerReviews = await Review.findAll({
      where: reviewWhere,
      include: [
        {
          model: Court,
          as: 'court',
          required: true,
          where: Object.keys(courtWhere).length ? courtWhere : undefined,
          include: [
            {
              model: Branch,
              as: 'branch',
              required: true,
              include: [
                {
                  model: Venue,
                  as: 'venue',
                  required: true,
                  where: venueWhere
                }
              ]
            }
          ]
        },
        {
          model: User,
          as: 'customer',
          attributes: ['user_id', 'full_name', 'email', 'phone_number']
        },
        {
          model: Booking,
          as: 'booking',
          attributes: ['booking_id', 'booking_date', 'start_time', 'end_time']
        }
      ],
      order: orderClause
    });

    // Filter by search string if present
    let filtered = allOwnerReviews;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = allOwnerReviews.filter(r =>
        (r.review_id || '').toLowerCase().includes(q) ||
        (r.comment || '').toLowerCase().includes(q) ||
        (r.customer?.full_name || '').toLowerCase().includes(q) ||
        (r.customer?.phone_number || '').toLowerCase().includes(q) ||
        (r.court?.court_name || '').toLowerCase().includes(q)
      );
    }

    // KPI Metrics calculation
    const totalReviews = filtered.length;
    const ratingSum = filtered.reduce((sum, r) => sum + (parseInt(r.rating) || 0), 0);
    const averageRating = totalReviews > 0 ? (ratingSum / totalReviews).toFixed(1) : '0.0';

    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    filtered.forEach(r => {
      const star = parseInt(r.rating);
      if (starCounts[star] !== undefined) starCounts[star] += 1;
    });

    const starDistribution = {
      5: totalReviews > 0 ? Math.round((starCounts[5] / totalReviews) * 100) : 0,
      4: totalReviews > 0 ? Math.round((starCounts[4] / totalReviews) * 100) : 0,
      3: totalReviews > 0 ? Math.round((starCounts[3] / totalReviews) * 100) : 0,
      2: totalReviews > 0 ? Math.round((starCounts[2] / totalReviews) * 100) : 0,
      1: totalReviews > 0 ? Math.round((starCounts[1] / totalReviews) * 100) : 0
    };

    // Paginated slice
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const startIdx = (pageNum - 1) * limitNum;
    const paginatedReviews = filtered.slice(startIdx, startIdx + limitNum);

    return {
      reviews: paginatedReviews,
      kpis: {
        totalReviews,
        averageRating: parseFloat(averageRating),
        starCounts,
        starDistribution
      },
      meta: {
        total: totalReviews,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalReviews / limitNum) || 1
      }
    };
  }

  /**
   * Get single review detail owned by logged in owner
   */
  static async getReviewById(ownerId, reviewId) {
    const { Review } = require('../models');

    const review = await Review.findOne({
      where: { review_id: reviewId },
      include: [
        {
          model: Court,
          as: 'court',
          required: true,
          include: [
            {
              model: Branch,
              as: 'branch',
              required: true,
              include: [
                {
                  model: Venue,
                  as: 'venue',
                  required: true,
                  where: { owner_user_id: ownerId }
                }
              ]
            }
          ]
        },
        {
          model: User,
          as: 'customer',
          attributes: ['user_id', 'full_name', 'email', 'phone_number']
        },
        {
          model: Booking,
          as: 'booking'
        }
      ]
    });

    if (!review) {
      const err = new Error('Đánh giá không tồn tại hoặc không thuộc quyền quản lý của bạn.');
      err.statusCode = 404;
      throw err;
    }

    return review;
  }

  /**
   * Owner replies to a customer review
   */
  static async replyReview(ownerId, reviewId, replyContent) {
    const { Review } = require('../models');

    if (!replyContent || !replyContent.trim()) {
      const err = new Error('Nội dung phản hồi không được để trống.');
      err.statusCode = 400;
      throw err;
    }

    const review = await Review.findOne({
      where: { review_id: reviewId },
      include: [
        {
          model: Court,
          as: 'court',
          required: true,
          include: [
            {
              model: Branch,
              as: 'branch',
              required: true,
              include: [
                {
                  model: Venue,
                  as: 'venue',
                  required: true,
                  where: { owner_user_id: ownerId }
                }
              ]
            }
          ]
        }
      ]
    });

    if (!review) {
      const err = new Error('Đánh giá không tồn tại hoặc bạn không có quyền phản hồi.');
      err.statusCode = 403;
      throw err;
    }

    review.owner_reply = replyContent.trim();
    review.owner_reply_at = new Date();
    await review.save();

    return review;
  }

  /**
   * Internal helper to create persistent notifications
   */
  static async createNotification(data, options = {}) {
    const { Notification } = require('../models');
    const { v4: uuidv4 } = require('uuid');

    const { recipient_user_id, notification_type, title, message, entity_type, entity_id } = data;
    if (!recipient_user_id || !notification_type || !title) return null;

    const notif = await Notification.create({
      notification_id: uuidv4(),
      recipient_user_id,
      notification_type,
      title,
      message: message || title,
      entity_type: entity_type || null,
      entity_id: entity_id || null,
      is_read: false
    }, { transaction: options.transaction });

    return notif;
  }

  /**
   * Get paginated notifications for owner
   */
  static async getNotifications(ownerId, options = {}) {
    const { Notification } = require('../models');
    const { page = 1, limit = 10, type, isRead, search } = options;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = { recipient_user_id: ownerId };

    if (type && type !== 'ALL') {
      whereClause.notification_type = type;
    }

    if (isRead !== undefined && isRead !== 'ALL') {
      whereClause.is_read = isRead === 'true' || isRead === true;
    }

    if (search && search.trim()) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search.trim()}%` } },
        { message: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    const { rows, count } = await Notification.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const unreadCount = await Notification.count({
      where: { recipient_user_id: ownerId, is_read: false }
    });

    return {
      notifications: rows,
      unreadCount,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)) || 1
      }
    };
  }

  /**
   * Get unread notification count for badge
   */
  static async getUnreadNotificationCount(ownerId) {
    const { Notification } = require('../models');
    const unreadCount = await Notification.count({
      where: { recipient_user_id: ownerId, is_read: false }
    });
    return unreadCount;
  }

  /**
   * Get single notification detail by ID with ownership scope & auto mark read
   */
  static async getNotificationById(ownerId, notificationId) {
    const { Notification } = require('../models');

    const notification = await Notification.findOne({
      where: { notification_id: notificationId, recipient_user_id: ownerId }
    });

    if (!notification) {
      const err = new Error('Thông báo không tồn tại hoặc không thuộc quyền sở hữu của bạn.');
      err.statusCode = 404;
      throw err;
    }

    if (!notification.is_read) {
      notification.is_read = true;
      notification.read_at = new Date();
      await notification.save();
    }

    return notification;
  }

  /**
   * Mark single notification as read
   */
  static async markNotificationAsRead(ownerId, notificationId) {
    const { Notification } = require('../models');

    const notification = await Notification.findOne({
      where: { notification_id: notificationId, recipient_user_id: ownerId }
    });

    if (!notification) {
      const err = new Error('Thông báo không tồn tại hoặc bạn không có quyền cập nhật.');
      err.statusCode = 403;
      throw err;
    }

    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();

    return notification;
  }

  /**
   * Mark all owner notifications as read
   */
  static async markAllNotificationsAsRead(ownerId) {
    const { Notification } = require('../models');

    await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { recipient_user_id: ownerId, is_read: false } }
    );

    return { success: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc.' };
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(ownerId, notificationId) {
    const { Notification } = require('../models');

    const notification = await Notification.findOne({
      where: { notification_id: notificationId, recipient_user_id: ownerId }
    });

    if (!notification) {
      const err = new Error('Thông báo không tồn tại hoặc bạn không có quyền xóa.');
      err.statusCode = 403;
      throw err;
    }

    await notification.destroy();
    return { success: true, message: 'Đã xóa thông báo thành công.' };
  }

  /**
   * Get owner profile information
   */
  static async getOwnerProfile(ownerId) {
    const { User, Venue, Court, Branch } = require('../models');

    const user = await User.findByPk(ownerId, {
      attributes: ['user_id', 'full_name', 'email', 'phone_number', 'primary_role', 'account_status', 'created_at', 'updated_at']
    });

    if (!user) {
      const err = new Error('Không tìm thấy thông tin tài khoản Chủ sân.');
      err.statusCode = 404;
      throw err;
    }

    const venueCount = await Venue.count({ where: { owner_user_id: ownerId } });
    const courtCount = await Court.count({
      include: [
        {
          model: Branch,
          as: 'branch',
          required: true,
          include: [
            {
              model: Venue,
              as: 'venue',
              required: true,
              where: { owner_user_id: ownerId }
            }
          ]
        }
      ]
    });

    return {
      user,
      stats: {
        totalVenues: venueCount,
        totalCourts: courtCount
      }
    };
  }

  /**
   * Update owner profile info (name, phone)
   */
  static async updateOwnerProfile(ownerId, data) {
    const { User } = require('../models');

    const user = await User.findByPk(ownerId);
    if (!user) {
      const err = new Error('Tài khoản Chủ sân không tồn tại.');
      err.statusCode = 404;
      throw err;
    }

    const { full_name, phone_number } = data;

    if (!full_name || !full_name.trim()) {
      const err = new Error('Họ và tên không được để trống.');
      err.statusCode = 400;
      throw err;
    }

    if (!phone_number || !phone_number.trim()) {
      const err = new Error('Số điện thoại không được để trống.');
      err.statusCode = 400;
      throw err;
    }

    // Phone format validation (VN 10 digits starting with 0)
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    if (!phoneRegex.test(phone_number.trim())) {
      const err = new Error('Số điện thoại không hợp lệ. Vui lòng nhập SĐT Việt Nam hợp lệ (10 chữ số).');
      err.statusCode = 400;
      throw err;
    }

    user.full_name = full_name.trim();
    user.phone_number = phone_number.trim();
    await user.save();

    return {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      primary_role: user.primary_role,
      account_status: user.account_status,
      created_at: user.created_at
    };
  }

  /**
   * Change owner password securely
   */
  static async changeOwnerPassword(ownerId, { currentPassword, newPassword, confirmPassword }) {
    const bcrypt = require('bcryptjs');
    const { User } = require('../models');

    if (!currentPassword || !newPassword || !confirmPassword) {
      const err = new Error('Vui lòng nhập đầy đủ thông tin mật khẩu.');
      err.statusCode = 400;
      throw err;
    }

    if (newPassword !== confirmPassword) {
      const err = new Error('Mật khẩu mới và mật khẩu xác nhận không trùng khớp.');
      err.statusCode = 400;
      throw err;
    }

    if (newPassword.length < 6) {
      const err = new Error('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findByPk(ownerId);
    if (!user) {
      const err = new Error('Tài khoản Chủ sân không tồn tại.');
      err.statusCode = 404;
      throw err;
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      const err = new Error('Mật khẩu hiện tại không chính xác.');
      err.statusCode = 400;
      err.code = 'CURRENT_PASSWORD_INVALID';
      throw err;
    }

    // Hash new password & save
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return { success: true, message: 'Đổi mật khẩu thành công.' };
  }
}

module.exports = OwnerService;
