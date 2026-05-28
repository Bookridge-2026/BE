const express = require("express");
const router = express.Router();

const friendController = require("../controllers/friend.controller");

const passport = require("passport");
const { jwtStrategy } = require("../config/auth.config");

passport.use(jwtStrategy);
const isLogin = passport.authenticate("jwt", { session: false });

router.get("/", isLogin, friendController.getFriends);

// 친구 요청 보내기
router.post("/requests", isLogin, friendController.sendFriendRequest);

// 받은 친구 요청 목록 조회
router.get("/requests", isLogin, friendController.getReceivedFriendRequests);

router.patch("/requests/:friendRequestId/accept", isLogin, friendController.acceptFriendRequest);
router.patch("/requests/:friendRequestId/reject", isLogin, friendController.rejectFriendRequest);

router.delete("/users/:userId", isLogin, friendController.deleteFriend);

module.exports = router;