const roomService = require("../services/room.service");

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   get:
 *     summary: 방 기본 정보 조회
 *     description: 방 정보와 책 제목, 출판사 등을 조회합니다
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
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 roomId: 1
 *                 state: "ongoing"
 *                 startDate: "2024-01-01"
 *                 period: 30
 *                 book:
 *                   title: "죽은 시인의 사회"
 *                   publisher: "서교출판사"
 *                   thumbnail: "https://thumbnail.jpg"
 *                   totalPage: 320
 */
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
 *     description: 방의 멤버 목록과 색상, 역할, 닉네임 등을 조회합니다
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
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - memberId: 1
 *                   color: "#FFB6C1"
 *                   role: "leader"
 *                   state: "attend"
 *                   maxPage: 160
 *                   user:
 *                     nickname: "홍길동"
 *                     profileImageUrl: "https://profile1.jpg"
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
 *     description: 각 멤버가 책을 얼마나 읽었는지 % 로 반환합니다
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
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - memberId: 1
 *                   nickname: "홍길동"
 *                   color: "#FFB6C1"
 *                   maxPage: 160
 *                   totalPage: 320
 *                   progressPercent: 50
 *                 - memberId: 2
 *                   nickname: "정바미"
 *                   color: "#FFD700"
 *                   maxPage: 80
 *                   totalPage: 320
 *                   progressPercent: 25
 */
const getMembersProgress = async (req, res) => {
    try {
        const { roomId } = req.params;
        const progress = await roomService.getMembersProgress(roomId);
        return res.status(200).json({ success: true, data: progress });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getRoomDetail, getMembers, getMembersProgress };