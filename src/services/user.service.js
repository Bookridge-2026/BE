const { Op } = require("sequelize");
const db = require("../models");

const blockService = require("./block.service");

const getFriendStatus = async (myId, targetId) => {
  const isBlocked = await blockService.isBlocked(myId, targetId);
  if (isBlocked) return "BLOCKED";
  if (Number(myId) === Number(targetId)) return "ME";

  const friend = await db.friend.findOne({
    where: {
      [Op.or]: [
        { userId1: myId, userId2: targetId },
        { userId1: targetId, userId2: myId },
      ],
    },
  });
  if (friend) return "FRIENDS";

  const request = await db.friendRequest.findOne({
    where: {
      status: "PENDING",
      [Op.or]: [
        { senderId: myId, receiverId: targetId },
        { senderId: targetId, receiverId: myId },
      ],
    },
  });
  if (!request) return "NONE";
  if (Number(request.senderId) === Number(myId)) {
    return "REQUEST_SENT";
  }
  return "REQUEST_RECEIVED";
};

const searchUserByCode = async (myId, userCode) => {
  const user = await db.user.findOne({
    where: { userCode },
    attributes: ["userId", "nickname", "userCode", "profileImageUrl"],
  });

  if (!user) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  const friendStatus = await getFriendStatus(myId, user.userId);
  const isBlocked = friendStatus === "BLOCKED";

  return {
    userId: user.userId,
    nickname: user.nickname,
    userCode: user.userCode,
    profileImageUrl: user.profileImageUrl,
    friendStatus,
    isBlocked,
  };
};

module.exports = {
  searchUserByCode,
  getFriendStatus,
};