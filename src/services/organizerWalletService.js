const { Op, Sequelize } = require('sequelize');
const { Event, Order, Withdrawal } = require('../config/models');

exports.getOrganizerWallet = async (organizerId) => {
  try {
    // 1️⃣ Get organizer events
    const events = await Event.findAll({
      where: { user_id: organizerId },
      attributes: ['id'],
      raw: true
    });

    const eventIds = events.map(e => e.id);

    // No events = empty wallet
    if (!eventIds.length) {
      return {
        total_revenue: 0,
        platform_fee: 0,
        net_earnings: 0,
        withdrawn_amount: 0,
        pending_amount: 0,
        available_balance: 0
      };
    }

    // 2️⃣ Total revenue from PAID orders
    const revenueResult = await Order.findOne({
      attributes: [
        [
          Sequelize.fn(
            'COALESCE',
            Sequelize.fn('SUM', Sequelize.col('total_price')),
            0
          ),
          'total_revenue'
        ]
      ],
      where: {
        event_id: { [Op.in]: eventIds },
        status: 'PAID'
      },
      raw: true
    });

    const totalRevenue = Number(revenueResult?.total_revenue || 0);

    // 3️⃣ Platform fee (10%)
    const platformFee = Math.round(totalRevenue * 0.1);

    // 4️⃣ Net earnings
    const netEarnings = totalRevenue - platformFee;

    // 5️⃣ Withdrawn amount (APPROVED)
    const withdrawnAmount =
      (await Withdrawal.sum('amount', {
        where: {
          organizer_id: organizerId,
          status: 'APPROVED'
        }
      })) || 0;

    // 6️⃣ Pending withdrawals
    const pendingAmount =
      (await Withdrawal.sum('amount', {
        where: {
          organizer_id: organizerId,
          status: 'PENDING'
        }
      })) || 0;

    // 7️⃣ Available balance
    const availableBalance =
      netEarnings - withdrawnAmount - pendingAmount;

    return {
      total_revenue: totalRevenue,
      platform_fee: platformFee,
      net_earnings: netEarnings,
      withdrawn_amount: withdrawnAmount,
      pending_amount: pendingAmount,
      available_balance: availableBalance < 0 ? 0 : availableBalance
    };

  } catch (error) {
    console.error('❌ Wallet service error:', error);
    throw error; // VERY IMPORTANT
  }
};