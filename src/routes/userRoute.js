const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const upload = require("../utils/upload");

const passport = require("passport");

const isLogin = passport.authenticate("jwt", { session: false });

router.get("/me", isLogin, userController.getMe);
router.patch("/me/nickname", isLogin, userController.updateNickname);
router.patch("/me/profile-image", isLogin, upload.single("image"), userController.updateProfileImage);
router.get("/search", isLogin, userController.searchUserByCode);
router.get("/:userId/profile", isLogin, userController.getUserProfile);

module.exports = router;