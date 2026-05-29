const { Op } = require("sequelize");
const db = require("../models");

const isBlocked = async (blockerId, blockedUserId) => {
  const block = await db.userBlock.findOne({
    where: { blockerId, blockedUserId },
  });

  return !!block;
};

const getBlockedUserIds = async (userId) => {
  const blocks = await db.userBlock.findAll({
    where: { blockerId: userId },
    attributes: ["blockedUserId"],
  });

  return blocks.map((block) => block.blockedUserId);
};

const blockUser = async (blockerId, blockedUserId) => {
  if (Number(blockerId) === Number(blockedUserId)) {
    throw new Error("자기 자신을 차단할 수 없습니다.");
  }

  const targetUser = await db.user.findOne({
    where: { userId: blockedUserId },
  });

  if (!targetUser) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  const alreadyBlocked = await isBlocked(blockerId, blockedUserId);

  if (alreadyBlocked) {
    throw new Error("이미 차단한 사용자입니다.");
  }

  const block = await db.userBlock.create({
    blockerId,
    blockedUserId,
  });

  // 친구 관계 삭제
  await db.friend.destroy({
    where: {
      [Op.or]: [
        { userId1: blockerId, userId2: blockedUserId },
        { userId1: blockedUserId, userId2: blockerId },
      ],
    },
  });

  // 대기 중 친구 요청 거절 처리
  await db.friendRequest.update(
    { status: "REJECTED", updatedAt: new Date() },
    {
      where: {
        status: "PENDING",
        [Op.or]: [
          { senderId: blockerId, receiverId: blockedUserId },
          { senderId: blockedUserId, receiverId: blockerId },
        ],
      },
    }
  );

  return {
    blockId: block.blockId,
    message: "사용자를 차단했습니다.",
  };
};

const unblockUser = async (blockerId, blockedUserId) => {
  const block = await db.userBlock.findOne({
    where: { blockerId, blockedUserId },
  });

  if (!block) {
    throw new Error("차단 내역을 찾을 수 없습니다.");
  }

  await block.destroy();

  return "차단을 해제했습니다.";
};

const getBlockedUsers = async (userId) => {
  const blocks = await db.userBlock.findAll({
    where: { blockerId: userId },
    include: [
      {
        model: db.user,
        as: "blockedUser",
        attributes: ["userId", "nickname", "userCode", "profileImageUrl"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return blocks.map((block) => ({
    blockId: block.blockId,
    userId: block.blockedUser.userId,
    nickname: block.blockedUser.nickname,
    userCode: block.blockedUser.userCode,
    profileImageUrl: block.blockedUser.profileImageUrl,
    createdAt: block.createdAt,
  }));
};

module.exports = {
  isBlocked,
  getBlockedUserIds,
  blockUser,
  unblockUser,
  getBlockedUsers,
};