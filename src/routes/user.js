const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");

const passport = require("passport");

const isLogin = passport.authenticate("jwt", { session: false });

router.get("/me", isLogin, userController.getMe);
router.get("/search", isLogin, userController.searchUserByCode);
router.get("/:userId/profile", isLogin, userController.getUserProfile);

module.exports = router;