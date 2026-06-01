const express = require("express");
const router = express.Router();
const passport = require("passport");
const notificationController = require("../controllers/notification.controller");
const isLogin = passport.authenticate("jwt", { session: false });

router.get("/", isLogin, notificationController.getNotifications);
router.patch("/read-all", isLogin, notificationController.readAllNotifications);
router.patch("/:notificationId/read", isLogin, notificationController.readNotification);

module.exports = router;