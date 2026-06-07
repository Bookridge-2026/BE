const { Op } = require("sequelize");
const db = require("../models");

const blockService = require("./blockService");

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

const getUserProfile = async (myId, targetUserId) => {
  const user = await db.user.findOne({
    where: { userId: targetUserId },
    attributes: ["userId", "nickname", "userCode", "profileImageUrl"],
  });

  if (!user) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  const friendStatus = await getFriendStatus(myId, user.userId);
  const isBlocked = friendStatus === "BLOCKED";

  const recentMember = await db.member.findOne({
    where: { userId: targetUserId },
    include: [
      {
        model: db.room,
        as: "room",
        where: { state: "ongoing" },
        attributes: ["roomId"],
        include: [
          {
            model: db.book,
            as: "book",
            attributes: ["title"],
          },
        ],
      },
    ],
    order: [["particTime", "DESC"]],
  });

  const roomBooks = await db.member.findAll({
    where: { userId: targetUserId },
    include: [
      {
        model: db.room,
        as: "room",
        where: { state: { [Op.in]: ["ongoing", "closed"] } },
        attributes: ["roomId", "state", "startDate"],
        include: [
          {
            model: db.book,
            as: "book",
            attributes: ["title", "author"],
          },
        ],
      },
    ],
    order: [["particTime", "DESC"]],
  });

  const books = roomBooks
    .filter((member) => member.room && member.room.book)
    .map((member) => ({
      roomId: member.room.roomId,
      state: member.room.state,
      startDate: member.room.startDate,
      title: member.room.book.title,
      author: member.room.book.author,
    }));

  const uniqueBooks = Array.from(
    new Map(books.map((book) => [`${book.title}|${book.author}`, book])).values(),
  );

  return {
    userId: user.userId,
    nickname: user.nickname,
    profileImageUrl: user.profileImageUrl,
    userCode: user.userCode,
    friendStatus,
    isBlocked,
    recentBookTitle: recentMember?.room?.book?.title ?? null,
    books: uniqueBooks,
  };
};

const updateNickname = async (userId, nickname) => {
  if (!nickname) throw new Error("닉네임을 입력해주세요.");

  const exists = await db.user.findOne({ where: { nickname } });
  if (exists && Number(exists.userId) !== Number(userId)) {
    throw new Error("이미 사용 중인 닉네임입니다.");
  }

  await db.user.update({ nickname }, { where: { userId } });
  return { nickname };
};

const updateProfileImage = async (userId, profileImageUrl) => {
  if (!profileImageUrl) throw new Error("이미지 업로드에 실패했습니다.");

  await db.user.update({ profileImageUrl }, { where: { userId } });
  return { profileImageUrl };
};

module.exports = {
  searchUserByCode,
  getFriendStatus,
  getUserProfile,
  updateNickname,
  updateProfileImage,
};