const { User, Invite } = require("../models");

// ✅ 1. Get Invite Friends List
async function getInviteFriends(req, res, next) {
  try {
    const userId = req.user.id;

    // Get all users except current user
    const users = await User.findAll({
      where: {
        id: {
          [require("sequelize").Op.ne]: userId,
        },
      },
      attributes: [
        "id",
        "first_name",
        "last_name",
        "full_name",
        "profile_image",
      ],
      order: [["id", "DESC"]],
    });

    // Get already invited users
    const invites = await Invite.findAll({
      where: { sender_id: userId },
      attributes: ["receiver_id"],
    });

    const invitedIds = invites.map((i) => i.receiver_id);

    const host = req.protocol + "://" + req.get("host");

    const data = users.map((user) => {
      const profileImageUrl = user.profile_image
        ? `${host}/${user.profile_image.replace(/\\/g, "/")}`
        : null;

      return {
        id: user.id,
        name: user.full_name,
        avatar: profileImageUrl,
        invited: invitedIds.includes(user.id),
      };
    });

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

// ✅ 2. Send Invite (Single)
async function sendInvite(req, res, next) {
  try {
    const senderId = req.user.id;
    const { receiver_id, event_id } = req.body;

    if (!receiver_id) {
      return res.status(400).json({
        success: false,
        message: "receiver_id is required",
      });
    }

    // Check already invited
    const existingInvite = await Invite.findOne({
      where: {
        sender_id: senderId,
        receiver_id,
      },
    });

    if (existingInvite) {
      return res.status(400).json({
        success: false,
        message: "Already invited",
      });
    }

    // Create invite
    const invite = await Invite.create({
      sender_id: senderId,
      receiver_id,
      event_id: event_id || null,
    });

    return res.json({
      success: true,
      message: "Invite sent successfully",
      data: invite,
    });
  } catch (err) {
    next(err);
  }
}

// ✅ 3. Bulk Invite (For SEND INVITATION Button)
async function bulkInvite(req, res, next) {
  try {
    const senderId = req.user.id;
    const { receiver_ids, event_id } = req.body;

    if (!receiver_ids || !Array.isArray(receiver_ids)) {
      return res.status(400).json({
        success: false,
        message: "receiver_ids must be an array",
      });
    }

    const invitesData = receiver_ids.map((id) => ({
      sender_id: senderId,
      receiver_id: id,
      event_id: event_id || null,
    }));

    await Invite.bulkCreate(invitesData);

    return res.json({
      success: true,
      message: "Bulk invites sent successfully",
    });
  } catch (err) {
    next(err);
  }
}

// ✅ 4. Get My Sent Invites
async function getMyInvites(req, res, next) {
  try {
    const userId = req.user.id;

    const invites = await Invite.findAll({
      where: { sender_id: userId },
      include: [
        {
          model: User,
          as: "receiver",
          attributes: ["id", "full_name", "profile_image"],
        },
      ],
      order: [["id", "DESC"]],
    });

    const host = req.protocol + "://" + req.get("host");

    const data = invites.map((invite) => ({
      id: invite.id,
      receiver_id: invite.receiver_id,
      name: invite.receiver?.full_name,
      avatar: invite.receiver?.profile_image
        ? `${host}/${invite.receiver.profile_image.replace(/\\/g, "/")}`
        : null,
      status: invite.status,
    }));

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getInviteFriends,
  sendInvite,
  bulkInvite,
  getMyInvites,
};
