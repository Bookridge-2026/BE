const blockService = require("../services/block.service");

/**
 * @swagger
 * tags:
 *   name: Block
 *   description: 유저 차단 관련 API
 */

/**
 * @swagger
 * /api/blocks/{userId}:
 *   post:
 *     summary: 유저 차단
 *     description: 특정 유저를 차단합니다.
 *     tags: [Block]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 차단할 유저의 userId
 *     responses:
 *       201:
 *         description: 차단 성공
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
 *                   example: 유저를 차단했습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     blockId:
 *                       type: integer
 *                       example: 1
 *       500:
 *         description: 서버 오류
 */

const blockUser = async (req, res) => {
  try {
    const blockerId = req.user.userId;
    const { userId } = req.params;

    const result = await blockService.blockUser(blockerId, userId);

    return res.status(201).json({
      success: true,
      message: result.message,
      data: {
        blockId: result.blockId,
      },
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
 * /api/blocks:
 *   get:
 *     summary: 차단한 유저 목록 조회
 *     description: 내가 차단한 유저 목록을 조회합니다.
 *     tags: [Block]
 *     responses:
 *       200:
 *         description: 차단 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     blockedUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: integer
 *                             example: 2
 *                           nickname:
 *                             type: string
 *                             example: 홍길동
 *                           userCode:
 *                             type: string
 *                             example: a1b2c3d4
 *                           profileImageUrl:
 *                             type: string
 *                             example: https://lh3.googleusercontent.com/...
 *                           blockId:
 *                             type: integer
 *                             example: 1
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: 2024-05-29T12:34:56.000Z
 *       500:
 *         description: 서버 오류
 */

const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.userId;

    const blockedUsers = await blockService.getBlockedUsers(userId);

    return res.status(200).json({
      success: true,
      data: {
        blockedUsers,
      },
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
 * /api/blocks/{userId}:
 *   delete:
 *     summary: 유저 차단 해제
 *     description: 특정 유저의 차단을 해제합니다.
 *     tags: [Block]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 차단 해제할 유저의 userId
 *     responses:
 *       200:
 *         description: 차단 해제 성공
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
 *                   example: 유저 차단을 해제했습니다.
 *       500:
 *         description: 서버 오류
 */

const unblockUser = async (req, res) => {
  try {
    const blockerId = req.user.userId;
    const { userId } = req.params;

    const message = await blockService.unblockUser(blockerId, userId);

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
  blockUser,
  getBlockedUsers,
  unblockUser,
};