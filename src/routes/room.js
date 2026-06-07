const express = require("express");
const router = express.Router();
const passport = require("passport");


const commentController = require("../controllers/commentController");
const emojiController = require("../controllers/emojiController");
const memberController = require("../controllers/memberController");
const roomController = require("../controllers/roomController");
const songRecommendationController = require("../controllers/songRecommendationController");

const isLogin = passport.authenticate("jwt", { session: false });

// 참여 중인 방 조회 (홈)
router.get("/joined", isLogin, roomController.getJoinedRooms);

// 내 방 조회 (마이페이지)
router.get("/my", isLogin, roomController.getMyRooms);

// 내 책 모아보기
router.get("/my/books", isLogin, roomController.getMyBooks);


// 방 목록 / 생성
// GET  /api/rooms?keyword=해리포터&status=waiting&page=1
router.get("/", roomController.getRooms);
// POST /api/rooms
router.post("/", isLogin, roomController.createRoom);

// 방 참여 / 시작 / 초대
// POST  /api/rooms/:roomId/join
router.post("/:roomId/join", isLogin, roomController.joinRoom);
// PATCH /api/rooms/:roomId/start
router.patch("/:roomId/start", isLogin, roomController.startRoom);
// POST  /api/rooms/:roomId/invite
router.post("/:roomId/invite", isLogin, roomController.createInviteCode);

// 노래 추천
router.post("/:roomId/songs/recommendations", isLogin, songRecommendationController.generateSongRecommendations);
router.get("/:roomId/songs/recommendations/random", isLogin, songRecommendationController.getRandomSongRecommendation);
router.get("/:roomId/songs/recommendations", isLogin, songRecommendationController.getSongRecommendations);

// 방 세부 기본
router.get("/:roomId", roomController.getRoomDetail);
router.get("/:roomId/pages", commentController.getPages);
router.get("/:roomId/members/progress", isLogin, roomController.getMembersProgress);

// 멤버 조회
router.get("/:roomId/members", roomController.getMembers);

// 초대 수락 / 거절 (본인이 직접)
router.patch("/:roomId/invite/accept", isLogin, roomController.acceptInvite);
router.patch("/:roomId/invite/reject", isLogin, roomController.rejectInvite);

// 입장 요청 수락 / 거절 (방장이)
router.patch("/:roomId/users/:userId/accept", isLogin, roomController.acceptMember);
router.patch("/:roomId/users/:userId/reject", isLogin, roomController.rejectMember);

// 멤버 콕 찌르기 / 강퇴
router.post("/:roomId/members/:memberId/poke", isLogin, memberController.pokeMember);
router.delete("/:roomId/members/:memberId", isLogin, memberController.kickMember);




//---------------------------------

// 일반 코멘트
router.get("/:roomId/comments", isLogin, commentController.getComments);
router.post("/:roomId/comments", isLogin, commentController.createComment);
router.patch(
  "/:roomId/comments/:commentId",
  isLogin,
  commentController.updateComment,
);
router.delete(
  "/:roomId/comments/:commentId",
  isLogin,
  commentController.deleteComment,
);

// 대댓글
router.get(
  "/:roomId/comments/:commentId/replies",
  isLogin,
  commentController.getReplies,
);
router.post(
  "/:roomId/comments/:commentId/replies",
  isLogin,
  commentController.createReply,
);
router.delete(
  "/:roomId/comments/:commentId/replies/:replyId",
  isLogin,
  commentController.deleteReply,
);

// 이모지 반응
router.get("/:roomId/reactions", isLogin, emojiController.getReactions);
router.post("/:roomId/reactions", isLogin, emojiController.addReaction);
router.delete(
  "/:roomId/reactions/:emojiId",
  isLogin,
  emojiController.removeReaction,
);

module.exports = router;
