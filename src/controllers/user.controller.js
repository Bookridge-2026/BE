const userService = require("../services/user.service");
/**
 * @swagger
 * tags:
 *   name: User
 *   description: 유저 관련 API
 */

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: 유저 코드로 유저 검색
 *     description: 유저 코드를 통해 유저를 검색합니다.
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: userCode
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색할 유저의 userCode
 *     responses:
 *       200:
 *         description: 검색 성공
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
 *                     userId:
 *                       type: integer
 *                       example: 2
 *                     nickname:
 *                       type: string
 *                       example: 홍길동
 *                     userCode:
 *                       type: string
 *                       example: a1b2c3d4
 *                     profileImageUrl:
 *                       type: string
 *                       example: https://lh3.googleusercontent.com/...
 *       500:
 *         description: 서버 오류
 */

const searchUserByCode = async (req, res) => {
  try {
    const myId = req.user.userId;
    const { userCode } = req.query;

    const result = await userService.searchUserByCode(myId, userCode);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  searchUserByCode,
};