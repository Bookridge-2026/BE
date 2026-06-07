const db = require("../models");
const blockService = require("./blockService");

const getAllowedTargets = async (senderUserId, targets) => {
  const results = await Promise.all(
    targets.map(async (m) => {
      try {
        const blockedByReceiver = await blockService.isBlocked(m.userId, senderUserId);
        return blockedByReceiver ? null : m;
      } catch (err) {
        console.error("[알림] isBlocked 에러 - userId:", m.userId, err);
        return m; // 에러 나도 일단 포함
      }
    })
  );
  return results.filter(Boolean);
};

exports.createCommentNotification = async ({ comment, senderMemberId }) => {
  try {
    const sender = await db.member.findByPk(senderMemberId, {
      attributes: ["roomId", "userId"],
    });
    if (!sender) return;

    const roomMembers = await db.member.findAll({
      where: { roomId: sender.roomId, state: "attend" }, // ← state 필터 추가
      attributes: ["memberId", "userId"],
    });

    console.log("[알림] comment - 방 attend 멤버 수:", roomMembers.length);

    const targets = await getAllowedTargets(
      sender.userId,
      roomMembers.filter((m) => String(m.memberId) !== String(senderMemberId))
    );

    console.log("[알림] comment - 최종 대상:", targets.length);
    if (targets.length === 0) return;

    await db.notification.bulkCreate(
      targets.map((m) => ({
        receiverUserId: m.userId,
        senderMemberId,
        type: "comment",
        commentId: comment.commentId,
        isRead: 0,
      }))
    );
  } catch (err) {
    console.error("[알림] createCommentNotification 에러:", err);
  }
};

exports.createReplyNotification = async ({ reply, senderMemberId }) => {
  try {
    const originalComment = await db.comment.findByPk(reply.commentId, {
      include: [{ model: db.member, as: "member", attributes: ["userId"] }],
    });
    if (!originalComment) return;

    const receiverUserId = originalComment.member?.userId;
    if (!receiverUserId) return;

    const sender = await db.member.findByPk(senderMemberId, { attributes: ["userId"] });
    if (String(sender?.userId) === String(receiverUserId)) return;

    const blockedByReceiver = await blockService.isBlocked(receiverUserId, sender.userId);
    if (blockedByReceiver) return;

    await db.notification.create({
      receiverUserId,
      senderMemberId,
      type: "reply",
      replyId: reply.replyId,
      isRead: 0,
    });
  } catch (err) {
    console.error("[알림] createReplyNotification 에러:", err);
  }
};

exports.createEmojiNotification = async ({ emoji, senderMemberId }) => {
  try {
    const sender = await db.member.findByPk(senderMemberId, { attributes: ["roomId", "userId"] });
    if (!sender) return;

    const roomMembers = await db.member.findAll({
      where: { roomId: sender.roomId, state: "attend" }, // ← state 필터 추가
      attributes: ["memberId", "userId"],
    });

    console.log("[알림] emoji - 방 attend 멤버 수:", roomMembers.length);

    const targets = await getAllowedTargets(
      sender.userId,
      roomMembers.filter((m) => String(m.memberId) !== String(senderMemberId))
    );

    console.log("[알림] emoji - 최종 대상:", targets.length);
    if (targets.length === 0) return;

    await db.notification.bulkCreate(
      targets.map((m) => ({
        receiverUserId: m.userId,
        senderMemberId,
        type: "emoji",
        emojiId: emoji.emojiId,
        isRead: 0,
      }))
    );
  } catch (err) {
    console.error("[알림] createEmojiNotification 에러:", err);
  }
};

exports.createOcrNotification = async ({ ocrHighlight, senderMemberId }) => {
  try {
    const ocrPage = await db.ocrPage.findByPk(ocrHighlight.ocrPageId, {
      attributes: ["roomId"],
    });
    if (!ocrPage) return;

    const sender = await db.member.findByPk(senderMemberId, { attributes: ["userId"] });
    if (!sender) return;

    const roomMembers = await db.member.findAll({
      where: { roomId: ocrPage.roomId, state: "attend" }, // ← state 필터 추가
      attributes: ["memberId", "userId"],
    });

    const targets = await getAllowedTargets(
      sender.userId,
      roomMembers.filter((m) => String(m.memberId) !== String(senderMemberId))
    );

    if (targets.length === 0) return;

    await db.notification.bulkCreate(
      targets.map((m) => ({
        receiverUserId: m.userId,
        senderMemberId,
        type: "ocr",
        ocrHighlightId: ocrHighlight.ocrHighlightId,
        isRead: 0,
      }))
    );
  } catch (err) {
    console.error("[알림] createOcrNotification 에러:", err);
  }
};

exports.createFriendRequestNotification = async ({ senderUserId, receiverUserId }) => {
  try {
    if (String(senderUserId) === String(receiverUserId)) return;

    const blockedByReceiver = await blockService.isBlocked(receiverUserId, senderUserId);
    if (blockedByReceiver) return;

    await db.notification.create({
      receiverUserId,
      senderUserId,
      senderMemberId: null,
      type: "friend_request",
      isRead: 0,
    });
    console.log("[알림] friend_request 생성 완료");
  } catch (err) {
    console.error("[알림] createFriendRequestNotification 에러:", err);
  }
};

exports.createFriendAcceptedNotification = async ({ acceptorUserId, receiverUserId }) => {
  try {
    if (String(acceptorUserId) === String(receiverUserId)) return;

    const blockedByReceiver = await blockService.isBlocked(receiverUserId, acceptorUserId);
    if (blockedByReceiver) return;

    await db.notification.create({
      receiverUserId,
      senderUserId: acceptorUserId,
      senderMemberId: null,
      type: "friend_accepted",
      isRead: 0,
    });
    console.log("[알림] friend_accepted 생성 완료");
  } catch (err) {
    console.error("[알림] createFriendAcceptedNotification 에러:", err);
  }
};