const { Op } = require("sequelize");
const db = require("../models");
const bookService = require("./book.service");
const blockService = require("./blockService");

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
        attributes: [
          "isbn",
          "title",
          "author",
          "thumbnail",
          "publisher",
          "totalPage",
        ],
        where: Object.keys(bookWhere).length ? bookWhere : undefined,
        required: !!keyword,
      },
      {
        model: db.member,
        as: "members",
        attributes: ["memberId", "state"],
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
    currentMembers: room.members.filter((m) => m.state === "attend").length,
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
  { isbn, period, atLeastPeople, poke, detail, totalPage },
) => {
  // 1) 입력값 검증
  if (!isbn) throw new Error("ISBN은 필수입니다.");
  if (!period || period < 1 || period > 90)
    throw new Error("기간은 1~90일이어야 합니다.");
  if (!atLeastPeople || atLeastPeople < 1 || atLeastPeople > 10)
    throw new Error("최소 인원은 1~10명이어야 합니다.");
  if (poke && (poke < 1 || poke > 30))
    throw new Error("poke는 1~30번만 설정할 수 있습니다.");

  // 2) ISBN 기반 Book 동기화 (없으면 카카오 API에서 저장)
  await bookService.syncBookByIsbn(isbn);
  if (
    totalPage &&
    Number.isInteger(Number(totalPage)) &&
    Number(totalPage) > 0
  ) {
    await db.book.update({ totalPage: Number(totalPage) }, { where: { isbn } });
  }

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

  // 4) 방장 멤버 등록 (색상은 방 시작 시점에 일괄 배정)
  const member = await db.member.create({
    userId,
    roomId: room.roomId,
    state: "attend",
    particTime: new Date(),
    role: "leader",
    ocrChance: 5,
    maxPage: 0,
    color: null,
  });

  // 5) 최신 book 조회 (totalPage 업데이트 반영)
  const book = await db.book.findOne({ where: { isbn } });

  return { room, member, book };
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

  // 3-1) 정원 초과 확인 (attend + pending 합산 최대 10명)
  const MAX_CAPACITY = 10;
  if (room.members.length >= MAX_CAPACITY) {
    throw new Error("방의 정원(10명)이 초과되었습니다.");
  }

  // 4) 차단 여부 확인 - blockerId/blockedUserId가 모델 명시 컬럼이 아니므로 raw query 사용
  const memberUserIds = room.members.map((m) => m.userId);
  if (memberUserIds.length > 0) {
    const blockRows = await db.sequelize.query(
      `SELECT blockId FROM userBlock
       WHERE (blockerId = :userId AND blockedUserId IN (:memberUserIds))
          OR (blockerId IN (:memberUserIds) AND blockedUserId = :userId)
       LIMIT 1`,
      {
        replacements: { userId, memberUserIds },
        type: db.sequelize.QueryTypes.SELECT,
      },
    );
    if (blockRows.length > 0) {
      throw new Error(
        "차단 관계가 있는 멤버가 포함된 방에는 참여할 수 없습니다.",
      );
    }
  }

  // 5) 멤버 등록 (pending 상태 — 방장 수락 후 attend로 변경, 색상은 방 시작 시 일괄 배정)
  const member = await db.member.create({
    userId,
    roomId,
    state: "pending",
    particTime: new Date(),
    role: "member",
    ocrChance: 5,
    maxPage: 0,
    color: null,
  });

  return member;
};

// 초대 수락
const acceptInvite = async (userId, roomId) => {
  const member = await db.member.findOne({
    where: { roomId, userId, state: "invited" },
  });
  if (!member) throw new Error("초대받은 멤버를 찾을 수 없습니다.");

  // 정원 초과 확인 (attend 기준 최대 10명)
  const attendCount = await db.member.count({
    where: { roomId, state: "attend" },
  });
  if (attendCount >= 10)
    throw new Error("방의 정원(10명)이 초과되어 수락할 수 없습니다.");

  await member.update({ state: "attend" });
  return member;
};

// 초대 거절
const rejectInvite = async (userId, roomId) => {
  const member = await db.member.findOne({
    where: { roomId, userId, state: "invited" },
  });
  if (!member) throw new Error("초대받은 멤버를 찾을 수 없습니다.");

  await member.destroy();
};

// 입장 요청 수락
const acceptMember = async (leaderId, roomId, targetUserId) => {
  // 1) 방 존재 확인
  const room = await db.room.findOne({ where: { roomId } });
  if (!room) throw new Error("방을 찾을 수 없습니다.");

  // 2) 방 상태 확인
  if (room.state !== "waiting") throw new Error("모집 중인 방이 아닙니다.");

  // 3) 방장 확인
  const leaderMember = await db.member.findOne({
    where: { roomId, userId: leaderId, role: "leader" },
  });
  if (!leaderMember) throw new Error("방장만 수락할 수 있습니다.");

  // 4) 대상 멤버 확인 (pending 상태인지)
  const targetMember = await db.member.findOne({
    where: { roomId, userId: targetUserId, state: "pending" },
  });
  if (!targetMember) throw new Error("입장 요청한 멤버를 찾을 수 없습니다.");

  // 5) 정원 초과 확인 (attend 기준 최대 10명)
  const attendCount = await db.member.count({
    where: { roomId, state: "attend" },
  });
  if (attendCount >= 10)
    throw new Error("방의 정원(10명)이 초과되어 수락할 수 없습니다.");

  // 6) attend로 변경
  await targetMember.update({ state: "attend" });

  return targetMember;
};

// 입장 요청 거절
const rejectMember = async (leaderId, roomId, targetUserId) => {
  // 1) 방 존재 확인
  const room = await db.room.findOne({ where: { roomId } });
  if (!room) throw new Error("방을 찾을 수 없습니다.");

  // 2) 방 상태 확인
  if (room.state !== "waiting") throw new Error("모집 중인 방이 아닙니다.");

  // 3) 방장 확인
  const leaderMember = await db.member.findOne({
    where: { roomId, userId: leaderId, role: "leader" },
  });
  if (!leaderMember) throw new Error("방장만 거절할 수 있습니다.");

  // 4) 대상 멤버 확인 (pending 상태인지)
  const targetMember = await db.member.findOne({
    where: { roomId, userId: targetUserId, state: "pending" },
  });
  if (!targetMember) throw new Error("입장 요청한 멤버를 찾을 수 없습니다.");

  // 5) 멤버 삭제
  await targetMember.destroy();
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
  // 방 시작 시 attend 멤버 전원에게 랜덤 색상 일괄 배정
  const attendMembers = await db.member.findAll({
    where: { roomId, state: "attend" },
    attributes: ["memberId"],
  });

  const shuffled = [...COLOR_PALETTE].sort(() => Math.random() - 0.5);
  await Promise.all(
    attendMembers.map((m, i) =>
      m.update({ color: shuffled[i % COLOR_PALETTE.length] }),
    ),
  );

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
        attributes: [
          "isbn",
          "title",
          "author",
          "thumbnail",
          "publisher",
          "totalPage",
        ],
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

//멤버 진행도
const getMembersProgress = async (roomId, userId) => {
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
        attributes: ["memberId", "userId", "color", "maxPage"],
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
  const blockedUserIds = userId
    ? await blockService.getBlockedUserIds(userId)
    : [];
  const blockedUserIdSet = new Set(blockedUserIds.map(String));

  const progress = roomData.members
    .filter((member) => !blockedUserIdSet.has(String(member.userId)))
    .map((member) => ({
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

// 참여 중인 방 조회 (홈)
// service/roomService.js

const getJoinedRooms = async (userId) => {
  const today = new Date();

  const rooms = await db.room.findAll({
    where: { state: { [Op.in]: ["waiting", "ongoing"] } },
    include: [
      {
        model: db.member,
        as: "members",
        where: { userId, state: "attend" },
        attributes: ["maxPage", "role"],
      },
      {
        model: db.book,
        as: "book",
        attributes: ["title", "author", "publisher", "thumbnail", "totalPage"],
      },
      {
        model: db.member,
        as: "allMembers",
        where: { state: "attend" },
        attributes: ["color", "userId"],
        include: [
          {
            model: db.user,
            as: "user",
            attributes: ["profileImageUrl"],
          },
        ],
      },
    ],
    attributes: ["roomId", "state", "startDate", "period", "atLeastPeople"],
  });

  if (rooms.length === 0) throw new Error("참여 중인 방이 없습니다");

  const blockedUserIds = await blockService.getBlockedUserIds(userId);
  const blockedUserIdSet = new Set(blockedUserIds.map(String));

  return rooms.map((room) => {
    const myMember = room.members[0];
    const totalPages = room.book.totalPage;
    const maxReadPage = myMember.maxPage;
    const myRole = myMember.role;

    // 독서 진행률 계산
    const progressRate =
      totalPages > 0 ? Math.floor((maxReadPage / totalPages) * 100) : 0;

    // 남은 일수 계산 (ongoing일 때만)
    let daysLeft = null;
    if (room.state === "ongoing" && room.startDate) {
      const endDate = new Date(room.startDate);
      endDate.setDate(endDate.getDate() + room.period);
      daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    }

    // 멤버 프로필 이미지
    const memberProfiles = room.allMembers
      .filter((m) => !blockedUserIdSet.has(String(m.userId)))
      .map((m) => ({
        profileImageUrl: m.user.profileImageUrl,
        color: m.color,
      }));

    return {
      roomId: room.roomId,
      state: room.state,
      book: {
        title: room.book.title,
        author: room.book.author,
        publisher: room.book.publisher,
        thumbnail: room.book.thumbnail,
      },
      period: room.period,
      ...(room.state === "ongoing" && { daysLeft }),
      atLeastPeople: room.atLeastPeople,
      progressRate,
      maxReadPage,
      myRole,
      totalPages,
      memberProfiles,
    };
  });
};

// 내 방 둘러보기 (마이페이지) - 대기중인 방 / 진행 중인 방 / 종료된 방 각각 조회
const getMyRooms = async (userId, state, nickname) => {
  // waiting일 때
  if (state === "waiting") {
    // 1. 초대받은 방 (state = invited)
    const invitedMembers = await db.member.findAll({
      where: { userId, state: "invited" },
      include: [
        {
          model: db.room,
          as: "room",
          where: { state },
          attributes: ["roomId"],
          include: [
            {
              model: db.book,
              as: "book",
              attributes: ["title", "publisher"],
            },
            {
              model: db.member,
              as: "members",
              where: { role: "leader" },
              attributes: ["userId"],
              include: [
                {
                  model: db.user,
                  as: "user",
                  attributes: ["nickname"],
                },
              ],
            },
          ],
        },
      ],
      attributes: ["memberId"],
    });

    const invitedRooms = invitedMembers.map((m) => ({
      type: "invited",
      roomId: m.room.roomId,
      memberId: m.memberId,
      book: {
        title: m.room.book.title,
        publisher: m.room.book.publisher,
      },
      invitedBy: m.room.members[0]?.user?.nickname ?? null,
    }));

    // 2. 내가 만든 방 (role = leader)
    const leaderMembers = await db.member.findAll({
      where: { userId, role: "leader" },
      include: [
        {
          model: db.room,
          as: "room",
          where: { state },
          attributes: ["roomId", "atLeastPeople"],
          include: [
            {
              model: db.book,
              as: "book",
              attributes: ["title", "publisher"],
            },
            {
              model: db.member,
              as: "members",
              attributes: ["memberId", "userId", "state"],
              include: [
                {
                  model: db.user,
                  as: "user",
                  attributes: ["nickname"],
                },
              ],
            },
          ],
        },
      ],
      attributes: ["memberId"],
    });

    const leaderRooms = leaderMembers.map((m) => {
      const allMembers = m.room.members;
      const currentMembers = allMembers.filter(
        (mem) => mem.state === "attend",
      ).length;
      const pendingMembers = allMembers
        .filter((mem) => mem.state === "pending")
        .map((mem) => ({
          memberId: mem.memberId,
          userId: mem.userId,
          nickname: mem.user?.nickname ?? null,
        }));

      return {
        type: "leader",
        roomId: m.room.roomId,
        memberId: m.memberId,
        book: {
          title: m.room.book.title,
          publisher: m.room.book.publisher,
        },
        currentMembers,
        atLeastPeople: m.room.atLeastPeople,
        pendingMembers,
      };
    });

    // 3. 다른 사용자가 만든 방 (role = member, state = attend or pending)
    const otherMembers = await db.member.findAll({
      where: {
        userId,
        role: "member",
        state: { [Op.in]: ["attend", "pending"] },
      },
      include: [
        {
          model: db.room,
          as: "room",
          where: { state },
          attributes: ["roomId", "atLeastPeople"],
          include: [
            {
              model: db.book,
              as: "book",
              attributes: ["title", "publisher"],
            },
            {
              model: db.member,
              as: "members",
              where: { state: "attend" },
              attributes: ["memberId"],
            },
          ],
        },
      ],
      attributes: ["memberId", "state"],
    });

    const otherRooms = otherMembers.map((m) => ({
      type: "other",
      roomId: m.room.roomId,
      memberId: m.memberId,
      book: {
        title: m.room.book.title,
        publisher: m.room.book.publisher,
      },
      currentMembers: m.room.members.length,
      atLeastPeople: m.room.atLeastPeople,
      myState: m.state,
      myNickname: nickname,
    }));

    return { invitedRooms, leaderRooms, otherRooms };
  }

  // ongoing, closed일 때
  // 1. 내가 만든 방 (role = leader)
  const leaderMembers = await db.member.findAll({
    where: { userId, role: "leader" },
    include: [
      {
        model: db.room,
        as: "room",
        where: { state },
        attributes: ["roomId"],
        include: [
          {
            model: db.book,
            as: "book",
            attributes: ["title", "publisher"],
          },
        ],
      },
    ],
    attributes: ["memberId"],
  });

  const leaderRooms = leaderMembers.map((m) => ({
    type: "leader",
    roomId: m.room.roomId,
    book: {
      title: m.room.book.title,
      publisher: m.room.book.publisher,
    },
  }));

  // 2. 다른 사용자가 만든 방 (role = member, state = attend)
  const otherMembers = await db.member.findAll({
    where: { userId, role: "member", state: "attend" },
    include: [
      {
        model: db.room,
        as: "room",
        where: { state },
        attributes: ["roomId"],
        include: [
          {
            model: db.book,
            as: "book",
            attributes: ["title", "publisher"],
          },
        ],
      },
    ],
    attributes: ["memberId"],
  });

  const otherRooms = otherMembers.map((m) => ({
    type: "other",
    roomId: m.room.roomId,
    book: {
      title: m.room.book.title,
      publisher: m.room.book.publisher,
    },
  }));

  return { leaderRooms, otherRooms };
};

// 내 책 모아보기 (ongoing + closed 방의 책 목록)
const getMyBooks = async (userId) => {
  const members = await db.member.findAll({
    where: { userId, state: "attend" },
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
            attributes: ["title", "publisher"],
          },
        ],
      },
    ],
    attributes: ["memberId"],
  });

  const books = members.map((m) => ({
    roomId: m.room.roomId,
    state: m.room.state,
    startDate: m.room.startDate,
    book: {
      title: m.room.book.title,
      publisher: m.room.book.publisher,
    },
  }));

    // 시작일 오름차순 정렬 (오래된 방이 먼저 나옴)
    books.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  const closedCount = books.filter((b) => b.state === "closed").length;

  return { books, closedCount };
};

module.exports = {
  getRooms,
  createRoom,
  joinRoom,
  acceptInvite,
  rejectInvite,
  acceptMember,
  rejectMember,
  startRoom,
  createInviteCode,
  getRoomByInviteCode,
  getRoomDetail,
  getMembers,
  getMembersProgress,
  getJoinedRooms,
  getMyBooks,
  getMyRooms,
};
