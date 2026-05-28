// TODO: 알림 기능 연결
// 친구 요청 보냄 → receiver에게 FRIEND_REQUEST 알림
// 친구 요청 수락함 → sender에게 FRIEND_ACCEPTED 알림

const { Op } = require("sequelize");
const db = require("../models");


const blockService = require("./block.service");

const sendFriendRequest = async (senderId, receiverId) => {
  if (Number(senderId) === Number(receiverId)) {
    throw new Error("자기 자신에게 친구 요청을 보낼 수 없습니다.");
  }

  // 차단 여부 확인 (양방향)
  const isBlocked = await blockService.isBlocked(senderId, receiverId);
  const isBlockedReverse = await blockService.isBlocked(receiverId, senderId);
  if (isBlocked || isBlockedReverse) {
    throw new Error("차단된 사용자에게 친구 요청을 보낼 수 없습니다.");
  }

  const receiver = await db.user.findOne({
    where: { userId: receiverId },
  });

  if (!receiver) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  const existingFriend = await db.friend.findOne({
    where: {
      [Op.or]: [
        { userId1: senderId, userId2: receiverId },
        { userId1: receiverId, userId2: senderId },
      ],
    },
  });

  if (existingFriend) {
    throw new Error("이미 친구입니다.");
  }

  const existingRequest = await db.friendRequest.findOne({
    where: {
      status: "PENDING",
      [Op.or]: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
  });

  if (existingRequest) {
    throw new Error("이미 대기 중인 친구 요청이 있습니다.");
  }

  const friendRequest = await db.friendRequest.create({
    senderId,
    receiverId,
    status: "PENDING",
  });

  return friendRequest;
};

const getReceivedFriendRequests = async (receiverId) => {
  const requests = await db.friendRequest.findAll({
    where: {
      receiverId,
      status: "PENDING",
    },
    include: [
      {
        model: db.user,
        as: "sender",
        attributes: ["userId", "nickname", "userCode", "profileImageUrl"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return requests.map((request) => ({
    friendRequestId: request.friendRequestId,
    sender: {
      userId: request.sender.userId,
      nickname: request.sender.nickname,
      userCode: request.sender.userCode,
      profileImageUrl: request.sender.profileImageUrl,
    },
    createdAt: request.createdAt,
  }));
};

const acceptFriendRequest = async (friendRequestId, userId) => {
  const request = await db.friendRequest.findOne({
    where: { friendRequestId },
  });

  if (!request) {
    throw new Error("친구 요청을 찾을 수 없습니다.");
  }

  if (Number(request.receiverId) !== Number(userId)) {
    throw new Error("친구 요청을 수락할 권한이 없습니다.");
  }

  if (request.status !== "PENDING") {
    throw new Error("이미 처리된 친구 요청입니다.");
  }

  const userId1 = Math.min(request.senderId, request.receiverId);
  const userId2 = Math.max(request.senderId, request.receiverId);

  await db.friend.create({
    userId1,
    userId2,
  });

  await request.update({
    status: "ACCEPTED",
    updatedAt: new Date(),
  });

  return "친구 요청을 수락했습니다.";
};

const rejectFriendRequest = async (friendRequestId, userId) => {
  const request = await db.friendRequest.findOne({
    where: { friendRequestId },
  });

  if (!request) {
    throw new Error("친구 요청을 찾을 수 없습니다.");
  }

  if (Number(request.receiverId) !== Number(userId)) {
    throw new Error("친구 요청을 거절할 권한이 없습니다.");
  }

  if (request.status !== "PENDING") {
    throw new Error("이미 처리된 친구 요청입니다.");
  }

  await request.update({
    status: "REJECTED",
    updatedAt: new Date(),
  });

  return "친구 요청을 거절했습니다.";
};

const getFriends = async (userId) => {
  const friends = await db.friend.findAll({
    where: {
      [Op.or]: [
        { userId1: userId },
        { userId2: userId },
      ],
    },
    include: [
      {
        model: db.user,
        as: "user1",
        attributes: ["userId", "nickname", "userCode", "profileImageUrl"],
      },
      {
        model: db.user,
        as: "user2",
        attributes: ["userId", "nickname", "userCode", "profileImageUrl"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return friends.map((friend) => {
    const targetUser =
      Number(friend.userId1) === Number(userId) ? friend.user2 : friend.user1;

    return {
      friendId: friend.friendId,
      userId: targetUser.userId,
      nickname: targetUser.nickname,
      userCode: targetUser.userCode,
      profileImageUrl: targetUser.profileImageUrl,
      createdAt: friend.createdAt,
    };
  });
};

const deleteFriend = async (myId, targetUserId) => {
  const friend = await db.friend.findOne({
    where: {
      [Op.or]: [
        { userId1: myId, userId2: targetUserId },
        { userId1: targetUserId, userId2: myId },
      ],
    },
  });

  if (!friend) {
    throw new Error("친구 관계를 찾을 수 없습니다.");
  }

  await friend.destroy();

  return "친구를 삭제했습니다.";
};

module.exports = {
  sendFriendRequest,
  getReceivedFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  deleteFriend
};