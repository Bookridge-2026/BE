const memberService = require("../services/member.service");

/**
 * @swagger
 * tags:
 *   name: Member
 *   description: 방 멤버 관련 API
 */

/**
 * @swagger
 * /api/rooms/{roomId}/members/{memberId}/poke:
 *   post:
 *     summary: 멤버 콕 찌르기
 *     description: 진행 중(ongoing)인 방에서 방장이 멤버를 콕 찔러 pokeCount를 증가시킵니다. pokeCount >= pokeLimit이면 canKick이 true입니다.
 *     tags: [Member]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 방 ID
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 콕 찔릴 멤버의 ID
 *     responses:
 *       200:
 *         description: 콕 찌르기 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 멤버를 콕 찔렀습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     memberId:
 *                       type: integer
 *                       example: 2
 *                     pokeCount:
 *                       type: integer
 *                       example: 1
 *                     pokeLimit:
 *                       type: integer
 *                       example: 3
 *                     canKick:
 *                       type: boolean
 *                       example: false
 *       500:
 *         description: 서버 오류
 */

const pokeMember = async (req, res) => {
  try {
    const { roomId, memberId } = req.params;
    const userId = req.user.userId;

    const result = await memberService.pokeMember(roomId, userId, memberId);

    return res.status(200).json({
      success: true,
      data: result,
      message: "멤버를 콕 찔렀습니다.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/rooms/{roomId}/members/{memberId}:
 *   delete:
 *     summary: 멤버 강퇴
 *     description: 진행 중(ongoing)인 방에서 방장이 멤버를 강퇴합니다. pokeCount >= pokeLimit일 때만 강퇴 가능합니다.
 *     tags: [Member]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 방 ID
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 강퇴할 멤버의 ID
 *     responses:
 *       200:
 *         description: 강퇴 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 멤버를 강퇴했습니다.
 *       500:
 *         description: 서버 오류
 */

const kickMember = async (req, res) => {
  try {
    const { roomId, memberId } = req.params;
    const userId = req.user.userId;

    const message = await memberService.kickMember(roomId, userId, memberId);

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  pokeMember,
  kickMember,
};