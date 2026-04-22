const express = require("express");
const router = express.Router();

const {
  getInviteFriends,
  sendInvite,
  bulkInvite,
  getMyInvites,
} = require("../controllers/inviteController");

const authMiddleware = require("../../middleware/authMiddleware");

router.get("/friends", authMiddleware, getInviteFriends);
router.post("/send", authMiddleware, sendInvite);
router.post("/bulk", authMiddleware, bulkInvite);
router.get("/my-invites", authMiddleware, getMyInvites);

module.exports = router;