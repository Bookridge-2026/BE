const express = require("express");
const router = express.Router();

const commentController = require("../controllers/comment.controller");
const emojiController = require("../controllers/emoji.controller");
const memberController = require("../controllers/member.controller");
const roomController = require("../controllers/room.controller");


const passport = require("passport");
const { jwtStrategy } = require("../config/auth.config");

passport.use(jwtStrategy);
const isLogin = passport.authenticate("jwt", { session: false });


// 방 세부 기본
router.get("/:roomId", roomController.getRoomDetail);
router.get("/:roomId/pages", commentController.getPages);
router.get("/:roomId/members/progress", roomController.getMembersProgress);


// 멤버 조회
router.get("/:roomId/members", roomController.getMembers);


// 일반 코멘트
router.get("/:roomId/comments", commentController.getComments);
router.post("/:roomId/comments", isLogin, commentController.createComment);
router.patch("/:roomId/comments/:commentId", isLogin, commentController.updateComment);
router.delete("/:roomId/comments/:commentId", isLogin, commentController.deleteComment);


// 대댓글
router.get("/:roomId/comments/:commentId/replies", commentController.getReplies);
router.post("/:roomId/comments/:commentId/replies", isLogin, commentController.createReply);
router.delete("/:roomId/comments/:commentId/replies/:replyId", isLogin, commentController.deleteReply);

// 이모지 반응
router.get("/:roomId/reactions", emojiController.getReactions);
router.post("/:roomId/reactions", isLogin, emojiController.addReaction);
router.delete("/:roomId/reactions/:emojiId", isLogin, emojiController.removeReaction);

module.exports = router;