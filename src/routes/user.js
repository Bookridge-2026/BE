const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");

const passport = require("passport");
const { jwtStrategy } = require("../config/auth.config");

passport.use(jwtStrategy);
const isLogin = passport.authenticate("jwt", { session: false });

router.get("/search", isLogin, userController.searchUserByCode);

module.exports = router;