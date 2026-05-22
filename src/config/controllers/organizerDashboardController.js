const { Op, Sequelize } = require("sequelize");
const { Event, Order, City, User, Withdrawal } = require("../models");
const { getRuntimeStatus } = require("../../utils/eventRuntimeStatus");

/**
 * GET /api/organizer/dashboard/overview
 */
/**
 * GET /api/organizer/dashboard/overview
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const events = await Event.findAll({
      where: { user_id: organizerId },
      attributes: ["id", "status", "start_time", "end_time"],
      raw: true,
    });

    const eventIds = events.map((e) => e.id);

    // ✅ FIX: Early return when no events exist
    if (!eventIds.length) {
      return res.json({
        success: true,
        data: {
          total_events: 0,
          pending_events: 0,
          approved_events: 0,
          active_events: 0,
          rejected_events: 0,
          total_bookings: 0,
          total_revenue: 0,
        },
      });
    }

    // ---------- Booking stats ----------
    const bookingStats = await Order.findOne({
      attributes: [
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total_bookings"],
        [
          Sequelize.fn(
            "COALESCE",
            Sequelize.fn("SUM", Sequelize.col("total_price")),
            0,
          ),
          "total_revenue",
        ],
      ],
      where: {
        event_id: { [Op.in]: eventIds },
        status: "PAID",
      },
      raw: true,
    });

    // ---------- Active events count ----------
    const now = new Date();

    const activeEventsCount = events.filter((e) => {
      const start = new Date(e.start_time);
      const end = new Date(e.end_time);

      return (
        e.status === "ACTIVE" ||
        (e.status === "APPROVED" && now >= start && now <= end)
      );
    }).length;

    return res.json({
      success: true,
      data: {
        total_events: events.length,
        pending_events: events.filter((e) => e.status === "PENDING").length,
        approved_events: events.filter((e) => e.status === "APPROVED").length,
        active_events: activeEventsCount,
        rejected_events: events.filter((e) => e.status === "REJECTED").length,
        total_bookings: Number(bookingStats.total_bookings || 0),
        total_revenue: Number(bookingStats.total_revenue || 0),
      },
    });
  } catch (error) {
    console.error("Overview error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/organizer/dashboard/events
 */
exports.getOrganizerEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const offset = (page - 1) * limit;

    const { rows: events, count } = await Event.findAndCountAll({
      where: {
        user_id: userId,
        status: { [Op.in]: ["PENDING", "APPROVED", "ACTIVE", "REJECTED"] },
      },
      include: [
        {
          model: City,
          as: "city",
          attributes: ["id", "name"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    const eventIds = events.map((e) => e.id);

    // Booking stats per event
    const stats = await Order.findAll({
      where: { event_id: eventIds, status: "PAID" },
      attributes: [
        "event_id",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total_bookings"],
        [Sequelize.fn("SUM", Sequelize.col("quantity")), "total_attendees"],
        [Sequelize.fn("SUM", Sequelize.col("total_price")), "total_revenue"],
      ],
      group: ["event_id"],
      raw: true,
    });

    const statsMap = {};
    stats.forEach((r) => {
      statsMap[r.event_id] = {
        total_bookings: Number(r.total_bookings || 0),
        total_attendees: Number(r.total_attendees || 0),
        total_revenue: Number(r.total_revenue || 0),
      };
    });

    const now = new Date();

    // const mapUIStatus = (e) => {
    //   const start = new Date(e.start_date);
    //   const end = new Date(e.end_date);

    //   if (e.status === 'PENDING') return 'PENDING';
    //   if (e.status === 'REJECTED') return 'REJECTED';
    //   if (e.status === 'ACTIVE') return 'ACTIVE';
    //   if (e.status === 'APPROVED') {
    //     if (now < start) return 'APPROVED';
    //     if (now >= start && now <= end) return 'ACTIVE';
    //     if (now > end) return 'COMPLETED';
    //   }
    //   return 'UNKNOWN';
    // };

    // const mapRuntimeStatus = (e) => {
    //   const start = new Date(e.start_date);
    //   const end = new Date(e.end_date);

    //   if (e.status === 'PENDING') return 'UPCOMING';
    //   if (e.status === 'REJECTED') return 'REJECTED';
    //   if (e.status === 'ACTIVE') return now >= start && now <= end ? 'ACTIVE' : now < start ? 'UPCOMING' : 'COMPLETED';
    //   if (e.status === 'APPROVED') return now < start ? 'UPCOMING' : now >= start && now <= end ? 'ACTIVE' : 'COMPLETED';

    //   return 'UNKNOWN';
    // };

    const mapUIStatus = (e) => {
      const start = new Date(e.start_date);
      const end = new Date(e.end_date);
      const now = new Date();

      if (e.status === "PENDING") return "PENDING";
      if (e.status === "REJECTED") return "REJECTED"; // ✅ handle rejected
      if (e.status === "ACTIVE") return "ACTIVE";
      if (e.status === "APPROVED") {
        if (now < start) return "APPROVED";
        if (now >= start && now <= end) return "ACTIVE";
        if (now > end) return "COMPLETED";
      }
      return "UNKNOWN";
    };

    const mapRuntimeStatus = (e) => {
      const start = new Date(e.start_date);
      const end = new Date(e.end_date);
      const now = new Date();

      if (e.status === "PENDING") return "UPCOMING";
      if (e.status === "REJECTED") return "REJECTED"; // ✅ handle rejected
      if (e.status === "ACTIVE")
        return now >= start && now <= end
          ? "ACTIVE"
          : now < start
            ? "UPCOMING"
            : "COMPLETED";
      if (e.status === "APPROVED")
        return now < start
          ? "UPCOMING"
          : now >= start && now <= end
            ? "ACTIVE"
            : "COMPLETED";

      return "UNKNOWN";
    };

    return res.json({
      success: true,
      pagination: {
        total: count,
        page,
        limit,
        total_pages: Math.ceil(count / limit),
      },
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        start_date: e.start_date,
        end_date: e.end_date,
        ui_status: mapUIStatus(e),
        db_status: e.status,
        venue_name: e.venue_name || "—",
        city: e.city?.name || "—",
        total_bookings: statsMap[e.id]?.total_bookings || 0,
        total_attendees: statsMap[e.id]?.total_attendees || 0,
        total_revenue: statsMap[e.id]?.total_revenue || 0,
        runtime_status: mapRuntimeStatus(e),
      })),
    });
  } catch (error) {
    console.error("Events error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/organizer/dashboard/bookings
 */
exports.getOrganizerBookings = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;

    const { count, rows } = await Order.findAndCountAll({
      include: [
        {
          model: Event,
          as: "event",
          where: { user_id: organizerId },
          attributes: ["id", "title"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });

    return res.json({
      success: true,
      pagination: {
        total: count,
        page,
        limit,
        total_pages: Math.ceil(count / limit),
      },
      data: rows.map((order) => ({
        id: order.id,
        event_id: order.event_id,
        event_title: order.event.title,
        ticket_type: order.ticket_type,
        quantity: order.quantity,
        total_price: order.total_price,
        created_at: order.created_at,
      })),
    });
  } catch (error) {
    console.error("Bookings error:", error);
    res.status(500).json({ success: false });
  }
};

// ---------- Event bookings per event ----------
exports.getEventBookings = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const eventId = req.params.eventId;

    const { count, rows } = await Order.findAndCountAll({
      where: { event_id: eventId },
      include: [
        {
          model: Event,
          as: "event",
          attributes: ["id", "title", "venue_name", "user_id"],
          where: { user_id: organizerId },
          required: true,
          include: [
            {
              model: City,
              as: "city",
              attributes: ["id", "name"],
              required: false,
            },
          ],
        },
        {
          model: User,
          as: "customer",
          attributes: ["id", "full_name", "email"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.json({
      success: true,
      pagination: {
        total: count,
        page: 1,
        limit: count,
        total_pages: 1,
      },
      data: rows.map((order) => ({
        id: order.id,
        event_id: order.event_id,
        event_title: order.event?.title || "",
        venue_name: order.event?.venue_name || null,
        city_name: order.event?.city?.name || null,
        customer_name: order.customer?.full_name || "",
        customer_email: order.customer?.email || "",
        ticket_type: order.ticket_type,
        quantity: order.quantity,
        total_price: order.total_price,
        created_at: order.created_at,
      })),
    });
  } catch (error) {
    console.error("Event bookings error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load event bookings" });
  }
};

// ---------- Revenue ----------
exports.getOrganizerRevenue = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const revenueResult = await Order.findOne({
      attributes: [
        [
          Sequelize.fn(
            "COALESCE",
            Sequelize.fn("SUM", Sequelize.col("total_price")),
            0,
          ),
          "total_revenue",
        ],
      ],
      include: [
        {
          model: Event,
          as: "event",
          where: { user_id: organizerId },
          attributes: [],
        },
      ],
      where: { status: "PAID" },
      raw: true,
    });

    const totalRevenue = Number(revenueResult.total_revenue || 0);
    const platformFee = totalRevenue * 0.1;
    const netEarnings = totalRevenue - platformFee;

    const withdrawnResult = await Withdrawal.findOne({
      attributes: [
        [
          Sequelize.fn(
            "COALESCE",
            Sequelize.fn("SUM", Sequelize.col("amount")),
            0,
          ),
          "withdrawn_amount",
        ],
      ],
      where: { organizer_id: organizerId, status: "APPROVED" },
      raw: true,
    });
    const pendingResult = await Withdrawal.findOne({
      attributes: [
        [
          Sequelize.fn(
            "COALESCE",
            Sequelize.fn("SUM", Sequelize.col("amount")),
            0,
          ),
          "pending_amount",
        ],
      ],
      where: { organizer_id: organizerId, status: "PENDING" },
      raw: true,
    });

    const availableBalance = Math.max(
      netEarnings -
        Number(withdrawnResult.withdrawn_amount || 0) -
        Number(pendingResult.pending_amount || 0),
      0,
    );

    return res.json({
      success: true,
      data: {
        total_revenue: totalRevenue,
        platform_fee: platformFee,
        net_earnings: netEarnings,
        withdrawn_amount: Number(withdrawnResult.withdrawn_amount || 0),
        available_balance: availableBalance,
      },
    });
  } catch (error) {
    console.error("Revenue error:", error);
    res.status(500).json({ success: false, message: "Failed to load revenue" });
  }
};

// ---------- Withdrawals summary ----------
exports.getWithdrawalsSummary = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const result = await Withdrawal.findOne({
      where: { organizer_id: organizerId },
      attributes: [
        [
          Sequelize.fn(
            "COALESCE",
            Sequelize.fn(
              "SUM",
              Sequelize.literal(`CASE WHEN status='APPROVED' THEN amount END`),
            ),
            0,
          ),
          "withdrawn_amount",
        ],
        [
          Sequelize.fn(
            "COALESCE",
            Sequelize.fn(
              "SUM",
              Sequelize.literal(`CASE WHEN status='PENDING' THEN amount END`),
            ),
            0,
          ),
          "pending_amount",
        ],
      ],
      raw: true,
    });

    return res.json({
      success: true,
      data: {
        withdrawn_amount: Number(result.withdrawn_amount || 0),
        pending_amount: Number(result.pending_amount || 0),
      },
    });
  } catch (error) {
    console.error("Withdrawal summary error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load withdrawals summary" });
  }
};

// ---------- Withdrawals list ----------
exports.getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.findAll({
      where: { organizer_id: req.user.id },
      order: [["requested_at", "DESC"]],
    });

    return res.json({ success: true, data: withdrawals });
  } catch (error) {
    console.error("Withdrawals list error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load withdrawals" });
  }
};

// ---------- Create withdrawal ----------
// exports.createWithdrawal = async (req, res) => {
//   try {
//     const { amount } = req.body;
//     const organizerId = req.user.id;

//     if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

//     const revenue = await Order.findOne({
//       attributes: [[Sequelize.fn('SUM', Sequelize.col('total_price')), 'total']],
//       include: [{ model: Event, as: 'event', where: { user_id: organizerId }, attributes: [] }],
//       where: { status: 'PAID' },
//       raw: true
//     });

//     const totalRevenue = Number(revenue?.total || 0);
//     const platformFee = totalRevenue * 0.1;
//     const netEarnings = totalRevenue - platformFee;

//     const withdrawn = await Withdrawal.sum('amount', { where: { organizer_id: organizerId, status: 'APPROVED' } });

//     const availableBalance = netEarnings - Number(withdrawn || 0);

//     if (amount > availableBalance) return res.status(400).json({ success: false, message: 'Insufficient available balance' });

//     const withdrawal = await Withdrawal.create({ organizer_id: organizerId, amount, status: 'PENDING' });

//     return res.json({ success: true, data: withdrawal });
//   } catch (error) {
//     console.error('Create withdrawal error:', error);
//     res.status(500).json({ success: false, message: 'Failed to create withdrawal' });
//   }
// };

const { getOrganizerWallet } = require("../../services/organizerWalletService");

exports.createWithdrawal = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { amount } = req.body;

    // 1️⃣ Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // 2️⃣ Get wallet (🔥 SINGLE SOURCE OF TRUTH)
    const wallet = await getOrganizerWallet(organizerId);

    const availableBalance = wallet.available_balance;

    // 3️⃣ Check balance
    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient available balance",
      });
    }

    // 4️⃣ Create withdrawal
    const withdrawal = await Withdrawal.create({
      organizer_id: organizerId,
      amount,
      status: "PENDING",
    });

    return res.json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    console.error("Create withdrawal error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create withdrawal",
    });
  }
};
