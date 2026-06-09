const db = require("../models");
const blockService = require("./blockService");

const getAllowedTargets = async (senderUserId, targets) => {
  const results = await Promise.all(
    targets.map(async (m) => {
      try {
        const blockedByReceiver = await blockService.isBlocked(m.userId, senderUserId);
        return blockedByReceiver ? null : m;
      } catch (err) {
        return m;
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
      where: { roomId: sender.roomId },
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
        type: "comment",
        commentId: comment.commentId,
        isRead: 0,
      }))
    );
  } catch (err) {
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
  }
};

exports.createEmojiNotification = async ({ emoji, senderMemberId }) => {
  try {
    const sender = await db.member.findByPk(senderMemberId, { attributes: ["roomId", "userId"] });
    if (!sender) return;

    const roomMembers = await db.member.findAll({
      where: { roomId: sender.roomId }, 
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
        type: "emoji",
        emojiId: emoji.emojiId,
        isRead: 0,
      }))
    );
  } catch (err) {
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
      where: { roomId: ocrPage.roomId},
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
  } catch (err) {
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
  } catch (err) {
  }
};


exports.createPokeNotification = async ({ senderMemberId, targetMemberId }) => {
  try {
    const targetMember = await db.member.findByPk(targetMemberId, {
      attributes: ["userId"],
    });
    if (!targetMember) return;

    const sender = await db.member.findByPk(senderMemberId, {
      attributes: ["userId"],
    });
    if (!sender) return;

    const receiverUserId = targetMember.userId;
    if (String(sender.userId) === String(receiverUserId)) return;

    const blockedByReceiver = await blockService.isBlocked(receiverUserId, sender.userId);
    if (blockedByReceiver) return;

    await db.notification.create({
      receiverUserId,
      senderMemberId,
      type: "poke",
      isRead: 0,
    });
  } catch (err) {}
};