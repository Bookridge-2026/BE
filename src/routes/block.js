const express = require("express");
const router = express.Router();

const blockController = require("../controllers/block.controller");

const passport = require("passport");
const { jwtStrategy } = require("../config/auth.config");

passport.use(jwtStrategy);
const isLogin = passport.authenticate("jwt", { session: false });

router.post("/:userId", isLogin, blockController.blockUser);
router.get("/", isLogin, blockController.getBlockedUsers);
router.delete("/:userId", isLogin, blockController.unblockUser);

module.exports = router;