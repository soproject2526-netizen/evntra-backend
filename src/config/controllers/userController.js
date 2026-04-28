const { City, User ,order} = require('../models');

async function selectCity(req, res, next) {
  try {
    const { city_id } = req.body;

    if (!city_id)
      return res.status(400).json({ message: 'city_id is required' });

    // Check city exists & active
    const city = await City.findOne({
      where: { id: city_id, is_active: true }
    });

    if (!city)
      return res.status(404).json({ message: 'City not found' });

    // Save selected city to logged-in user
    // req.user.city_id = city_id;
    // await req.user.save();

    // Fetch logged-in user from DB (req.user is JWT payload)
    const user = await User.findByPk(req.user.id);

    if (!user)
      return res.status(404).json({ message: 'User not found' });

    user.city_id = city_id;
    await user.save();



    return res.json({
      success: true,
      message: 'City selected successfully',
      city: {
        id: city.id,
        name: city.name,
        state: city.state,
        slug: city.slug
      }
    });

  } catch (err) {
    next(err);
  }
}

// User Profile

async function getUserProfile(req, res, next) {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "first_name",
        "last_name",
        "full_name",
        "email",
        "phone",
        "city_id",
        "profile_image",
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const host = req.protocol + "://" + req.get("host"); 

    
const profileImageUrl = user.profile_image
      ? `${host}/${user.profile_image.replace(/\\/g, "/")}`
      : null;

    return res.json({
      success: true,
      data: {
        ...user.dataValues,
        profile_image: profileImageUrl,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function updateUserProfile(req, res, next) {
  try {
    const userId = req.user.id;

    const { first_name, last_name, phone, city_id, email } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required",
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let profile_image = user.profile_image; // ✅ KEEP OLD IMAGE

    // ✅ ONLY UPDATE IF FILE IS SENT
    if (req.file && req.file.path) {
      profile_image = `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`;
    }

    const full_name = `${first_name} ${last_name}`;

    await user.update({
      first_name,
      last_name,
      full_name,
      email,
      phone,
      city_id,
      profile_image,
    });

    
    const profileImageUrl = profile_image ? profile_image: null;

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        ...user.dataValues,
        profile_image: profileImageUrl,
      },
    });

  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    next(err);
  }
}

async function getUserProfileStats(req, res) {
  try {
    const userId = req.user.id;

    //  Fetch all orders of user with event info
    const orders = await Order.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Event,
          as: "event",
          attributes: ["id", "title", "start_time"],
        },
      ],
      order: [["id", "DESC"]],
    });

    //  Tickets (each order = ticket)

    const tickets = orders.map((o) => ({
      ticketId: o.id,
      eventId: o.event_id,
      eventTitle: o.event?.title || "",
      price: Number(o.total_price),
      quantity: o.quantity,
      status: o.attendance_status,
    }));

    //  Total tickets purchased

    const ticketsPurchased = orders.reduce(
      (sum, o) => sum + (o.quantity || 0),
      0,
    );

    //  Total spent

    const totalSpent = orders.reduce(
      (sum, o) => sum + Number(o.total_price || 0),
      0,
    );

    const normalizeStatus = (status) => (status || "").toLowerCase().trim();

    //  BOOKED EVENTS (group by event)

    const bookedOrders = orders.filter(
      (o) => normalizeStatus(o.attendance_status) === "booked",
    );

    const bookedEventsMap = new Map();

    bookedOrders.forEach((o) => {
      if (!o.event) return; // 🔥 skip broken relation

      if (!bookedEventsMap.has(o.event_id)) {
        bookedEventsMap.set(o.event_id, {
          id: o.event.id,
          title: o.event.title,
          date: o.event.start_time,
          status: "Upcoming",
          ticketCount: o.quantity,
        });
      } else {
        bookedEventsMap.get(o.event_id).ticketCount += o.quantity;
      }
    });

    orders.forEach((o) => {
      console.log(o.id, o.attendance_status, o.event?.title);
    });

    const bookedEvents = Array.from(bookedEventsMap.values());

    // ATTENDED EVENTS (group by event)

    const attendedOrders = orders.filter(
      (o) => normalizeStatus(o.attendance_status) === "attended",
    );

    const attendedEventsMap = new Map();

    attendedOrders.forEach((o) => {
      if (!o.event) return;

      if (!attendedEventsMap.has(o.event_id)) {
        attendedEventsMap.set(o.event_id, {
          id: o.event.id,
          title: o.event.title,
          date: o.event.start_time,
        });
      }
    });

    const attendedEvents = Array.from(attendedEventsMap.values());

    // FINAL RESPONSE

    return res.json({
      success: true,
      data: {
        bookedEventsCount: bookedEvents.length,
        ticketsPurchased,
        eventsAttended: attendedEvents.length,
        totalSpent,
        bookedEvents,
        tickets,
        attendedEvents,
      },
    });
  } catch (error) {
    console.error("User profile stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile stats",
      error: error.message,
    });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await User.findAll({
      attributes: [
        "id",
        "first_name",
        "last_name",
        "full_name",
        "email",
        "phone",
        "role",
        "is_verified",
        "created_at",
      ],
      order: [["created_at", "DESC"]],
    });

    return res.json({
      success: true,
      totalUsers: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
}

module.exports = {
  selectCity, getUserProfile,
  updateUserProfile,
  getUserProfileStats,
  getAllUsers
};