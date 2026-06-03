const roomService = require("../services/room.service");

/**
 * @swagger
 * tags:
 *   name: Room
 *   description: 방 관련 API
 */

// 방 목록 조회
/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: 방 목록 조회 (검색 + 필터)
 *     description: 책 제목 키워드 및 방 상태로 필터링하여 방 목록을 조회합니다. (ROOM-02)
 *     tags: [Room]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 책 제목 검색어
 *         example: 해리포터
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [waiting, ongoing, closed, expired]
 *         description: 방 상태 필터
 *         example: waiting
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 rooms:
 *                   - roomId: 1
 *                     state: "waiting"
 *                     period: 14
 *                     atLeastPeople: 3
 *                     currentMembers: 2
 *                     detail: "함께 읽어요!"
 *                     book:
 *                       isbn: "9788983920690"
 *                       title: "해리 포터와 마법사의 돌"
 *                       author: "J.K. 롤링"
 *                       thumbnail: "https://..."
 *                 meta:
 *                   totalCount: 20
 *                   totalPages: 2
 *                   currentPage: 1
 */
const getRooms = async (req, res) => {
  try {
    const { keyword, status, page, size } = req.query;
    const result = await roomService.getRooms({ keyword, status, page, size });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 방 생성
/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: 방 생성
 *     description: ISBN 기반으로 교환독서 방을 생성합니다. 방장은 자동으로 leader로 등록되며 랜덤 색상이 부여됩니다. (ROOM-01)
 *     tags: [Room]
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isbn
 *               - period
 *               - atLeastPeople
 *             properties:
 *               isbn:
 *                 type: string
 *                 example: "9788983920690"
 *               period:
 *                 type: integer
 *                 example: 15
 *                 description: 1~90일
 *               atLeastPeople:
 *                 type: integer
 *                 example: 4
 *                 description: 최소 인원 (최대 10명)
 *               poke:
 *                 type: integer
 *                 example: 10
 *                 description: 찌르기 허용 횟수 (기본값 3)
 *               detail:
 *                 type: string
 *                 example: "스포 금지! 10일동안 함께 책 읽어요~~!"
 *     responses:
 *       201:
 *         description: 방 생성 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "방이 생성되었습니다."
 *               data:
 *                 roomId: 5
 *                 state: "waiting"
 *                 period: 15
 *                 member:
 *                   memberId: 10
 *                   role: "leader"
 *                   color: "#AECBFA"
 *       400:
 *         description: 입력값 오류 또는 ISBN 없음
 *       401:
 *         description: 인증 필요
 */
const createRoom = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { isbn, period, atLeastPeople, poke, detail, totalPage } = req.body;
    const { room, member, book } = await roomService.createRoom(userId, {
      isbn,
      period,
      atLeastPeople,
      poke,
      detail,
      totalPage,
    });
    return res.status(201).json({
      success: true,
      message: "방이 생성되었습니다.",
      data: {
        roomId: room.roomId,
        state: room.state,
        period: room.period,
        atLeastPeople: room.atLeastPeople,
        poke: room.poke,
        detail: room.detail,
        book: {
          isbn: book.isbn,
          title: book.title,
          totalPage: book.totalPage,
        },
        member: {
          memberId: member.memberId,
          role: member.role,
          color: member.color,
        },
      },
    });
  } catch (error) {
    const status =
      error.message.includes("필수") || error.message.includes("이어야")
        ? 400
        : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

// 방 참여
/**
 * @swagger
 * /api/rooms/{roomId}/join:
 *   post:
 *     summary: 방 참여
 *     description: 방에 참여합니다. 중복 참여, 차단 관계, 정원 초과를 검증합니다. (ROOM-03)
 *     tags: [Room]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       201:
 *         description: 참여 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "방에 참여했습니다."
 *               data:
 *                 memberId: 12
 *                 role: "member"
 *                 color: "#F28B82"
 *       400:
 *         description: 중복 참여 / 모집 중이 아님 / 차단 관계
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 방 없음
 */
const joinRoom = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { roomId } = req.params;
    const member = await roomService.joinRoom(userId, roomId);
    return res.status(201).json({
      success: true,
      message: "입장 요청이 전송되었습니다. 방장의 수락을 기다려주세요.",
      data: {
        memberId: member.memberId,
        role: member.role,
        color: member.color,
      },
    });
  } catch (error) {
    const status = error.message.includes("찾을 수 없습니다") ? 404 : 400;
    return res.status(status).json({ success: false, message: error.message });
  }
};

// 방 시작
/**
 * @swagger
 * /api/rooms/{roomId}/start:
 *   patch:
 *     summary: 방 시작 (waiting → ongoing)
 *     description: 방장이 방을 시작합니다. 최소 인원 충족 여부를 검증합니다. (ROOM-04)
 *     tags: [Room]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 방 시작 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "방이 시작되었습니다."
 *               data:
 *                 roomId: 1
 *                 state: "ongoing"
 *                 startDate: "2025-05-29"
 *       400:
 *         description: 권한 없음 / 상태 불일치 / 최소 인원 미달
 *       404:
 *         description: 방 없음
 */
const startRoom = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { roomId } = req.params;
    const room = await roomService.startRoom(userId, roomId);
    return res.status(200).json({
      success: true,
      message: "방이 시작되었습니다.",
      data: {
        roomId: room.roomId,
        state: room.state,
        startDate: room.startDate,
      },
    });
  } catch (error) {
    const status = error.message.includes("찾을 수 없습니다") ? 404 : 400;
    return res.status(status).json({ success: false, message: error.message });
  }
};

// 초대 코드 생성
/**
 * @swagger
 * /api/rooms/{roomId}/invite:
 *   post:
 *     summary: 초대 코드 생성
 *     description: 방 멤버가 초대 링크용 코드를 생성합니다.
 *     tags: [Room]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 초대 코드 생성 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 inviteCode: "MToxNzQ4NTAwMDAwMDAw"
 *                 roomId: 1
 *       400:
 *         description: 권한 없음 / 모집 중이 아님
 *       404:
 *         description: 방 없음
 */
const createInviteCode = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { roomId } = req.params;
    const result = await roomService.createInviteCode(userId, roomId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const status = error.message.includes("찾을 수 없습니다") ? 404 : 400;
    return res.status(status).json({ success: false, message: error.message });
  }
};

// 초대 링크 조회
/**
 * @swagger
 * /api/invite/{inviteCode}:
 *   get:
 *     summary: 초대 코드로 방 정보 조회
 *     description: 초대 코드를 통해 참여할 방의 정보를 반환합니다.
 *     tags: [Room]
 *     parameters:
 *       - in: path
 *         name: inviteCode
 *         required: true
 *         schema:
 *           type: string
 *         example: "MTo1NzQ4NTAwMDAwMDAw"
 *     responses:
 *       200:
 *         description: 방 정보 반환
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 roomId: 1
 *                 state: "waiting"
 *                 period: 14
 *                 atLeastPeople: 3
 *                 currentMembers: 2
 *                 book:
 *                   isbn: "9788983920690"
 *                   title: "해리 포터와 마법사의 돌"
 *                   thumbnail: "https://..."
 *       400:
 *         description: 유효하지 않은 코드 / 이미 시작된 방
 *       404:
 *         description: 방 없음
 */
const getRoomByInviteCode = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const result = await roomService.getRoomByInviteCode(inviteCode);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const status = error.message.includes("찾을 수 없습니다") ? 404 : 400;
    return res.status(status).json({ success: false, message: error.message });
  }
};

// 기존 코드
const getRoomDetail = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await roomService.getRoomDetail(roomId);
    return res.status(200).json({ success: true, data: room });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/rooms/{roomId}/members:
 *   get:
 *     summary: 방 멤버 목록 조회
 *     tags: [Room]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 성공
 */
const getMembers = async (req, res) => {
  try {
    const { roomId } = req.params;
    const members = await roomService.getMembers(roomId);
    return res.status(200).json({ success: true, data: members });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/rooms/{roomId}/members/progress:
 *   get:
 *     summary: 멤버 진행률 조회
 *     tags: [Room]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 성공
 */
const getMembersProgress = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.userId;
    const progress = await roomService.getMembersProgress(roomId, userId);
    return res.status(200).json({ success: true, data: progress });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/rooms/joined:
 *   get:
 *     summary: 참여 중인 방 목록 조회
 *     description: 현재 로그인한 유저가 참여 중인 방 목록을 반환합니다 (방 멤버 상태가 attend인 경우)
 *     tags: [Room]
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - roomId: 1
 *                   state: "ongoing"
 *                   book:
 *                     title: "앵무새 죽이기"
 *                     author: "Harper Lee"
 *                     publisher: "열린 책들"
 *                     thumbnail: "https://image.url/book.jpg"
 *                   period: 14
 *                   daysLeft: 5
 *                   minMembers: 3
 *                   progressRate: 32
 *                   maxReadPage: 102
 *                   totalPages: 320
 *                   memberProfiles:
 *                     - profileImage: "https://image.url/user1.jpg"
 *                       color: "#FF0000"
 *                     - profileImage: "https://image.url/user2.jpg"
 *                       color: "#0000FF"
 *                 - roomId: 2
 *                   state: "waiting"
 *                   book:
 *                     title: "채식주의자"
 *                     author: "한강"
 *                     publisher: "창비"
 *                     thumbnail: "https://image.url/book2.jpg"
 *                   period: 7
 *                   minMembers: 2
 *                   progressRate: 0
 *                   maxReadPage: 0
 *                   totalPages: 247
 *                   memberProfiles:
 *                     - profileImage: "https://image.url/user3.jpg"
 *                       color: "#00FF00"
 *       401:
 *         description: 인증 실패 (토큰 없음 또는 만료)
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "에러 메시지"
 */
const getJoinedRooms = async (req, res) => {
  try {
    const userId = req.user.userId;
    const rooms = await roomService.getJoinedRooms(userId);
    return res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/rooms/{roomId}/invite/accept:
 *   patch:
 *     summary: 초대 수락
 *     description: 초대받은 본인이 초대를 수락합니다. state가 invited에서 attend로 변경됩니다.
 *     tags: [Room]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 수락 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "초대를 수락했습니다."
 *               data:
 *                 memberId: 5
 *                 userId: 2
 *                 state: "attend"
 *       400:
 *         description: 초대받은 멤버 없음
 *       404:
 *         description: 방 없음
 */
const acceptInvite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { roomId } = req.params;

    const member = await roomService.acceptInvite(userId, roomId);
    return res.status(200).json({
      success: true,
      message: "초대를 수락했습니다.",
      data: {
        memberId: member.memberId,
        userId: member.userId,
        state: member.state,
      },
    });
  } catch (error) {
    const status = error.message.includes("찾을 수 없습니다") ? 404 : 400;
    return res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/rooms/{roomId}/invite/reject:
 *   patch:
 *     summary: 초대 거절
 *     description: 초대받은 본인이 초대를 거절합니다. 멤버 row가 삭제됩니다.
 *     tags: [Room]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 거절 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "초대를 거절했습니다."
 *       400:
 *         description: 초대받은 멤버 없음
 *       404:
 *         description: 방 없음
 */
const rejectInvite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { roomId } = req.params;

    await roomService.rejectInvite(userId, roomId);
    return res.status(200).json({
      success: true,
      message: "초대를 거절했습니다.",
    });
  } catch (error) {
    const status = error.message.includes("찾을 수 없습니다") ? 404 : 400;
    return res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/rooms/{roomId}/users/{userId}/accept:
 *   patch:
 *     summary: 입장 요청 수락
 *     description: 방장이 pending 상태인 멤버의 입장 요청을 수락합니다. 수락 시 state가 attend로 변경됩니다.
 *     tags: [Room]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 수락할 유저의 userId
 *         example: 3
 *     responses:
 *       200:
 *         description: 수락 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "입장 요청을 수락했습니다."
 *               data:
 *                 memberId: 5
 *                 userId: 3
 *                 state: "attend"
 *       400:
 *         description: 권한 없음 / 방 상태 불일치 / 대상 없음
 *       404:
 *         description: 방 없음
 */
const acceptMember = async (req, res) => {
  try {
    const leaderId = req.user.userId;
    const { roomId, userId } = req.params;

    const member = await roomService.acceptMember(leaderId, roomId, userId);
    return res.status(200).json({
      success: true,
      message: "입장 요청을 수락했습니다.",
      data: {
        memberId: member.memberId,
        userId: member.userId,
        state: member.state,
      },
    });
  } catch (error) {
    const status = error.message.includes("찾을 수 없습니다") ? 404 : 400;
    return res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/rooms/{roomId}/users/{userId}/reject:
 *   patch:
 *     summary: 입장 요청 거절
 *     description: 방장이 pending 상태인 멤버의 입장 요청을 거절합니다. 거절 시 멤버 row가 삭제됩니다.
 *     tags: [Room]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 거절할 유저의 userId
 *         example: 3
 *     responses:
 *       200:
 *         description: 거절 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "입장 요청을 거절했습니다."
 *       400:
 *         description: 권한 없음 / 방 상태 불일치 / 대상 없음
 *       404:
 *         description: 방 없음
 */
const rejectMember = async (req, res) => {
  try {
    const leaderId = req.user.userId;
    const { roomId, userId } = req.params;

    await roomService.rejectMember(leaderId, roomId, userId);
    return res.status(200).json({
      success: true,
      message: "입장 요청을 거절했습니다.",
    });
  } catch (error) {
    const status = error.message.includes("찾을 수 없습니다") ? 404 : 400;
    return res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/rooms/my/books:
 *   get:
 *     summary: 내 책 모아보기
 *     description: 현재 사용자가 참여 중인 방 중 ongoing 또는 closed 상태인 방의 책 목록을 시작일 순으로 반환합니다. closed된 방의 개수도 함께 반환합니다.
 *     tags: [Room]
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 closedCount: 1
 *                 books:
 *                   - roomId: 3
 *                     state: "ongoing"
 *                     startDate: "2026-05-20"
 *                     book:
 *                       title: "어린 왕자"
 *                       publisher: "문학동네"
 *                   - roomId: 4
 *                     state: "closed"
 *                     startDate: "2026-04-01"
 *                     book:
 *                       title: "앵무새 죽이기"
 *                       publisher: "열린 책들"
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
const getMyBooks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await roomService.getMyBooks(userId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/rooms/my:
 *   get:
 *     summary: 내 방 목록 조회
 *     description: |
 *       state 값에 따라 다른 데이터를 반환합니다.
 *       - waiting: 초대받은 방(invitedRooms), 내가 만든 방(leaderRooms), 다른 사용자가 만든 방(otherRooms)
 *       - ongoing/closed: 내가 만든 방(leaderRooms), 다른 사용자가 만든 방(otherRooms)
 *     tags: [Room]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *           enum: [waiting, ongoing, closed]
 *         example: waiting
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             examples:
 *               waiting:
 *                 summary: "state=waiting (대기 중인 방)"
 *                 description: "memberId = 해당 방에서 현재 사용자의 member 테이블 PK"
 *                 value:
 *                   success: true
 *                   data:
 *                     invitedRooms:
 *                       - type: "invited"
 *                         roomId: 1
 *                         memberId: 5
 *                         book:
 *                           title: "앵무새 죽이기"
 *                           publisher: "열린 책들"
 *                         invitedBy: "홍길동"
 *                     leaderRooms:
 *                       - type: "leader"
 *                         roomId: 2
 *                         memberId: 1
 *                         book:
 *                           title: "채식주의자"
 *                           publisher: "창비"
 *                         currentMembers: 2
 *                         atLeastPeople: 3
 *                         pendingMembers:
 *                           - memberId: 7
 *                             userId: 3
 *                             nickname: "김철수"
 *                     otherRooms:
 *                       - type: "other"
 *                         roomId: 3
 *                         memberId: 4
 *                         book:
 *                           title: "82년생 김지영"
 *                           publisher: "민음사"
 *                         currentMembers: 3
 *                         atLeastPeople: 2
 *                         myState: "pending"
 *                         myNickname: "홍길동"
 *               ongoing:
 *                 summary: "state=ongoing (진행 중인 방)"
 *                 description: "memberId = 해당 방에서 현재 사용자의 member 테이블 PK"
 *                 value:
 *                   success: true
 *                   data:
 *                     leaderRooms:
 *                       - type: "leader"
 *                         roomId: 4
 *                         memberId: 2
 *                         book:
 *                           title: "어린 왕자"
 *                           publisher: "문학동네"
 *                     otherRooms:
 *                       - type: "other"
 *                         roomId: 5
 *                         memberId: 9
 *                         book:
 *                           title: "1984"
 *                           publisher: "민음사"
 *               closed:
 *                 summary: "state=closed (종료된 방)"
 *                 description: "memberId = 해당 방에서 현재 사용자의 member 테이블 PK"
 *                 value:
 *                   success: true
 *                   data:
 *                     leaderRooms:
 *                       - type: "leader"
 *                         roomId: 6
 *                         memberId: 3
 *                         book:
 *                           title: "데미안"
 *                           publisher: "민음사"
 *                     otherRooms:
 *                       - type: "other"
 *                         roomId: 7
 *                         memberId: 11
 *                         book:
 *                           title: "노르웨이의 숲"
 *                           publisher: "문학사상"
 *       400:
 *         description: 잘못된 state 값
 *       500:
 *         description: 서버 오류
 */
const getMyRooms = async (req, res) => {
  try {
    const userId = req.user.userId;
    const nickname = req.user.nickname;
    const { state } = req.query;

    const validStates = ["waiting", "ongoing", "closed"];
    if (!state || !validStates.includes(state)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "state 값은 waiting, ongoing, closed 중 하나여야 합니다.",
        });
    }

    const rooms = await roomService.getMyRooms(userId, state, nickname);
    return res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRooms,
  createRoom,
  joinRoom,
  acceptInvite,
  rejectInvite,
  acceptMember,
  rejectMember,
  getMyBooks,
  startRoom,
  createInviteCode,
  getRoomByInviteCode,
  getRoomDetail,
  getMembers,
  getMembersProgress,
  getJoinedRooms,
  getMyRooms,
};
