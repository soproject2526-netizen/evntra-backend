const express = require("express");
const router = express.Router();

const {
  getInviteFriends,
  sendInvite,
  bulkInvite,
  getMyInvites,
} = require("../controllers/inviteController");

// const authMiddleware = require("../../middleware/authMiddleware");

router.get("/friends", getInviteFriends);
router.post("/send", sendInvite);
router.post("/bulk", bulkInvite);
router.get("/my-invites", getMyInvites);

module.exports = router;
