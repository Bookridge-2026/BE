const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");

// GET /api/invite/:inviteCode
router.get("/:inviteCode", roomController.getRoomByInviteCode);

module.exports = router;
