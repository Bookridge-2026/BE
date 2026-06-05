const express = require("express");
const router = express.Router();
const { isMember } = require('../middlewares/isMember');          

const friendController = require("../controllers/friendController");

const passport = require("passport");
const isLogin = passport.authenticate("jwt", { session: false });

router.get("/", isLogin, friendController.getFriends);

// 친구 요청 보내기
router.post("/requests", isLogin, friendController.sendFriendRequest);

// 받은 친구 요청 목록 조회
router.get("/requests", isLogin, friendController.getReceivedFriendRequests);

router.patch("/requests/:friendRequestId/accept", isLogin, friendController.acceptFriendRequest);
router.patch("/requests/:friendRequestId/reject", isLogin, friendController.rejectFriendRequest);

router.delete("/users/:userId", isLogin, friendController.deleteFriend);

router.get('/invite/room/:roomId', isLogin, isMember, friendController.getFriendsForInvite);
router.post('/invite/room/:roomId', isLogin, isMember, friendController.inviteFriend);

module.exports = router;