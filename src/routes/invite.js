const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room.controller");

// GET /api/invite/:inviteCode
router.get("/:inviteCode", roomController.getRoomByInviteCode);

module.exports = router;
