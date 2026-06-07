const { Op } = require("sequelize");
const db = require("../models");
const notificationService = require("./notificationService");

const blockService = require("./blockService");

const sendFriendRequest = async (senderId, receiverId) => {
  if (Number(senderId) === Number(receiverId)) {
    throw new Error("자기 자신에게 친구 요청을 보낼 수 없습니다.");
  }

  // 차단 여부 확인 (양방향) - 내가 상대를 차단했거나, 상대가 나를 차단한 경우 모두 불가
  const isBlocked = await blockService.isBlocked(senderId, receiverId);
  const isBlockedReverse = await blockService.isBlocked(receiverId, senderId);
  if (isBlocked || isBlockedReverse) {
    throw new Error("현재 친구 요청을 보낼 수 없습니다.");
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

  // 친구 요청 알림 추가
  await notificationService.createFriendRequestNotification({
    senderUserId: senderId,
    receiverUserId: receiverId,
  }).catch(console.error);


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

  // 수락 알림 → 요청 보낸 사람에게
  await notificationService.createFriendAcceptedNotification({
    acceptorUserId: userId,           
    receiverUserId: request.senderId, 
  }).catch(console.error);

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

const getFriendsForInvite = async ({ userId, roomId, search }) => {

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
          as: 'user1',
          attributes: ['userId', 'nickname'],
        },
        {
          model: db.user,
          as: 'user2',
          attributes: ['userId', 'nickname'],
        },
      ],
    });

    const friendUsers = friends.map((f) => {
      return Number(f.userId1) === userId ? f.user2 : f.user1;
    });

    if (friendUsers.length === 0) return [];

    const members = await db.member.findAll({
      where: {
        roomId,
        userId: friendUsers.map((f) => f.userId),
      },
      attributes: ['userId', 'state'],
    });

    const memberMap = new Map(
      members.map((m) => [Number(m.userId), m.state])
    );

    const result = friendUsers.map((friend) => {
      const state = memberMap.get(Number(friend.userId));

      let inviteStatus = 'none';
      if (state === 'invited') inviteStatus = 'invited';
      if (state === 'pending') inviteStatus = 'pending';
      if (state === 'attend') inviteStatus = 'attend';

      return {
        userId: friend.userId,
        nickname: friend.nickname,
        inviteStatus,
      };
    });

    const filtered = search
      ? result.filter((f) => f.nickname.includes(search))
      : result;

    return filtered;
};

const inviteFriend = async ({ roomId, targetUserId }) => {

  const targetUser = await db.user.findOne({
    where: { userId: targetUserId },
  });

  if (!targetUser) {
    const err = new Error('존재하지 않는 유저입니다.');
    err.code = 'USER_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const existing = await db.member.findOne({
    where: {
      roomId,
      userId: targetUserId,
    },
    attributes: ['state'],
  });
  
  if (existing?.state === 'invited') {
    const err = new Error('이미 초대된 사용자입니다.');
    err.code = 'ALREADY_INVITED';
    err.status = 400;
    throw err;
  }
  if (existing?.state === 'pending') {
    const err = new Error('이미 참여요청한 사용자입니다.');
    err.code = 'ALREADY_PENDING';
    err.status = 400;
    throw err;
  }
  if (existing?.state === 'attend') {
    const err = new Error('이미 방에 참여 중인 사용자입니다.');
    err.code = 'ALREADY_ATTEND';
    err.status = 400;
    throw err;
  }

  const invite = await db.member.create({
    roomId,
    userId: targetUserId,
    state: 'invited',
    role: 'member',
    particTime: new Date(),
    ocrChance: 5,
    maxPage: 0,
    color:'',
    pokeCount: 0,
  });

  return invite;
};


module.exports = {
  sendFriendRequest,
  getReceivedFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  deleteFriend,
  getFriendsForInvite,
  inviteFriend
};