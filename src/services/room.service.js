const { Op } = require("sequelize");
const db = require("../models");
const bookService = require("./book.service");

// 고유 색상 부여
const COLOR_PALETTE = [
  "#F28B82",
  "#FBBC04",
  "#FFF475",
  "#CCFF90",
  "#A8DAB5",
  "#CBF0F8",
  "#AECBFA",
  "#D7AEFB",
  "#FDCFE8",
  "#E6C9A8",
];

const pickRandomColor = (usedColors) => {
  const available = COLOR_PALETTE.filter((c) => !usedColors.includes(c));
  const pool = available.length > 0 ? available : COLOR_PALETTE;
  return pool[Math.floor(Math.random() * pool.length)];
};

// 방 목록 조회 (검색 + 필터)
// waiting / ongoing / closed / expired
const getRooms = async ({ keyword, status, page = 1, size = 10 }) => {
  const where = {};

  if (status) {
    where.state = status;
  }

  // keyword가 있으면 Book 테이블 title로 필터
  const bookWhere = {};
  if (keyword) {
    bookWhere.title = { [Op.like]: `%${keyword}%` };
  }

  const offset = (Number(page) - 1) * Number(size);

  const { count, rows } = await db.room.findAndCountAll({
    where,
    include: [
      {
        model: db.book,
        as: "book",
        attributes: ["isbn", "title", "author", "thumbnail", "publisher"],
        where: Object.keys(bookWhere).length ? bookWhere : undefined,
        required: !!keyword,
      },
      {
        model: db.member,
        as: "members",
        attributes: ["memberId"],
      },
    ],
    distinct: true,
    limit: Number(size),
    offset,
    order: [["createdAt", "DESC"]],
  });

  const rooms = rows.map((room) => ({
    roomId: room.roomId,
    state: room.state,
    period: room.period,
    atLeastPeople: room.atLeastPeople,
    poke: room.poke,
    detail: room.detail,
    startDate: room.startDate,
    currentMembers: room.members.length,
    book: room.book,
  }));

  return {
    rooms,
    meta: {
      totalCount: count,
      totalPages: Math.ceil(count / size),
      currentPage: Number(page),
    },
  };
};

// 방 생성
const createRoom = async (
  userId,
  { isbn, period, atLeastPeople, poke, detail },
) => {
  // 1) 입력값 검증
  if (!isbn) throw new Error("ISBN은 필수입니다.");
  if (!period || period < 1 || period > 90)
    throw new Error("기간은 1~90일이어야 합니다.");
  if (!atLeastPeople || atLeastPeople < 1 || atLeastPeople > 10)
    throw new Error("최소 인원은 1~10명이어야 합니다.");
  if (poke && (poke < 1 || poke > 30)) throw new Error("poke는 1~30번만 설정할 수 있습니다.");

  // 2) ISBN 기반 Book 동기화 (없으면 카카오 API에서 저장)
  await bookService.syncBookByIsbn(isbn);

  // 3) 방 생성 (상태=waiting, startDate=오늘)
  const room = await db.room.create({
    isbn,
    period,
    atLeastPeople,
    state: "waiting",
    startDate: new Date(),
    poke: poke ?? 3,
    detail: detail ?? null,
  });

  // 4) 방장 멤버 등록 + 랜덤 색상 부여
  const color = pickRandomColor([]);
  const member = await db.member.create({
    userId,
    roomId: room.roomId,
    state: "attend",
    particTime: new Date(),
    role: "leader",
    ocrChance: 5,
    maxPage: 0,
    color,
  });

  return { room, member };
};

// 방 참여
const joinRoom = async (userId, roomId) => {
  // 1) 방 존재 확인
  const room = await db.room.findOne({
    where: { roomId },
    include: [
      {
        model: db.member,
        as: "members",
        attributes: ["memberId", "userId", "color"],
      },
    ],
  });
  if (!room) throw new Error("방을 찾을 수 없습니다.");

  // 2) 방 상태 확인 (waiting만 참여 가능)
  if (room.state !== "waiting") throw new Error("모집 중인 방이 아닙니다.");

  // 3) 중복 참여 확인
  const alreadyJoined = room.members.some(
    (m) => String(m.userId) === String(userId),
  );
  if (alreadyJoined) throw new Error("이미 참여 중인 방입니다.");

  // 4) 차단 여부 확인 - 방 내 멤버가 나를 차단했거나 내가 차단한 멤버가 있으면 경고
  const memberUserIds = room.members.map((m) => m.userId);
  const blockConflict = await db.userBlock.findOne({
    where: {
      [Op.or]: [
        { blockerId: userId, blockedUserId: { [Op.in]: memberUserIds } },
        { blockerId: { [Op.in]: memberUserIds }, blockedUserId: userId },
      ],
    },
  });
  if (blockConflict) {
    throw new Error(
      "차단 관계가 있는 멤버가 포함된 방에는 참여할 수 없습니다.",
    );
  }

  // 5) 랜덤 색상 부여 (기존 멤버 색상과 겹치지 않게)
  const usedColors = room.members.map((m) => m.color);
  const color = pickRandomColor(usedColors);

  // 6) 멤버 등록
  const member = await db.member.create({
    userId,
    roomId,
    state: "attend",
    particTime: new Date(),
    role: "member",
    ocrChance: 5,
    maxPage: 0,
    color,
  });

  return member;
};

// 방 시작 (waiting → ongoing)
const startRoom = async (userId, roomId) => {
  const room = await db.room.findOne({ where: { roomId } });
  if (!room) throw new Error("방을 찾을 수 없습니다.");

  // 방장 권한 확인
  const leader = await db.member.findOne({
    where: { roomId, userId, role: "leader" },
  });
  if (!leader) throw new Error("방장만 방을 시작할 수 있습니다.");

  // 상태 검증
  if (room.state !== "waiting")
    throw new Error("모집 중인 방만 시작할 수 있습니다.");

  // 최소 인원 검증
  const memberCount = await db.member.count({
    where: { roomId, state: "attend" },
  });
  if (memberCount < room.atLeastPeople) {
    throw new Error(
      `최소 ${room.atLeastPeople}명 이상이어야 방을 시작할 수 있습니다.`,
    );
  }

  await room.update({ state: "ongoing", startDate: new Date() });
  return room;
};

// 초대 코드 생성
const createInviteCode = async (userId, roomId) => {
  const room = await db.room.findOne({ where: { roomId } });
  if (!room) throw new Error("방을 찾을 수 없습니다.");

  // 방장 또는 멤버만 초대 가능
  const member = await db.member.findOne({ where: { roomId, userId } });
  if (!member) throw new Error("방 멤버만 초대 코드를 생성할 수 있습니다.");

  if (room.state !== "waiting")
    throw new Error("모집 중인 방만 초대 코드를 생성할 수 있습니다.");

  const inviteCode = Buffer.from(`${roomId}:${Date.now()}`).toString(
    "base64url",
  );

  return { inviteCode, roomId };
};

// 초대 코드로 방 정보 조회
const getRoomByInviteCode = async (inviteCode) => {
  let roomId;
  try {
    const decoded = Buffer.from(inviteCode, "base64url").toString("utf8");
    roomId = decoded.split(":")[0];
  } catch {
    throw new Error("유효하지 않은 초대 코드입니다.");
  }

  const room = await db.room.findOne({
    where: { roomId },
    include: [
      {
        model: db.book,
        as: "book",
        attributes: ["isbn", "title", "author", "thumbnail", "publisher"],
      },
      {
        model: db.member,
        as: "members",
        attributes: ["memberId"],
      },
    ],
  });

  if (!room) throw new Error("방을 찾을 수 없습니다.");
  if (room.state !== "waiting")
    throw new Error("이미 시작되었거나 종료된 방입니다.");

  return {
    roomId: room.roomId,
    state: room.state,
    period: room.period,
    atLeastPeople: room.atLeastPeople,
    detail: room.detail,
    currentMembers: room.members.length,
    book: room.book,
  };
};

// 기존 함수 (팀원 코드) 유지
const getRoomDetail = async (roomId) => {
  const roomData = await db.room.findOne({
    where: { roomId },
    include: [
      {
        model: db.book,
        as: "book",
        attributes: ["title", "publisher", "thumbnail", "totalPage"],
      },
    ],
    attributes: ["roomId", "state", "startDate", "period"],
  });

  if (!roomData) throw new Error("방을 찾을 수 없습니다.");
  return roomData;
};

const getMembers = async (roomId) => {
  const room = await db.room.findOne({ where: { roomId } });
  if (!room) throw new Error("방을 찾을 수 없습니다.");

  const members = await db.member.findAll({
    where: { roomId },
    attributes: [
      "memberId",
      "userId",
      "color",
      "role",
      "maxPage",
      "state",
      "pokeCount",
    ],
    include: [
      {
        model: db.user,
        as: "user",
        attributes: ["nickname", "profileImageUrl"],
      },
    ],
  });

  if (!members.length) throw new Error("멤버를 찾을 수 없습니다.");

  return members.map((member) => ({
    memberId: member.memberId,
    userId: member.userId,
    color: member.color,
    role: member.role,
    maxPage: member.maxPage,
    state: member.state,
    pokeCount: member.pokeCount,
    poke: room.poke,
    canKick: member.pokeCount >= room.poke,
    user: member.user,
  }));
};

const getMembersProgress = async (roomId) => {
  const roomData = await db.room.findOne({
    where: { roomId },
    include: [
      {
        model: db.book,
        as: "book",
        attributes: ["totalPage"],
      },
      {
        model: db.member,
        as: "members",
        attributes: ["memberId", "color", "maxPage"],
        include: [
          {
            model: db.user,
            as: "user",
            attributes: ["nickname", "profileImageUrl"],
          },
        ],
      },
    ],
  });

  if (!roomData) throw new Error("방을 찾을 수 없습니다.");

  const totalPage = roomData.book.totalPage;

  const progress = roomData.members.map((member) => ({
    memberId: member.memberId,
    nickname: member.user.nickname,
    profileImageUrl: member.user.profileImageUrl,
    color: member.color,
    maxPage: member.maxPage,
    totalPage,
    progressPercent:
      totalPage > 0 ? Math.round((member.maxPage / totalPage) * 100) : 0,
  }));

  return progress;
};

module.exports = {
  getRooms,
  createRoom,
  joinRoom,
  startRoom,
  createInviteCode,
  getRoomByInviteCode,
  getRoomDetail,
  getMembers,
  getMembersProgress,
};
