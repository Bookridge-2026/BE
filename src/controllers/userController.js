const userService = require("../services/userService");

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: 유저 코드로 유저 검색
 *     description: 유저 코드를 통해 유저를 검색합니다. 친구 상태와 차단 여부를 함께 반환합니다.
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
 *                       nullable: true
 *                       example: https://lh3.googleusercontent.com/...
 *                     friendStatus:
 *                       type: string
 *                       enum: [FRIENDS, BLOCKED, REQUEST_SENT, REQUEST_RECEIVED, NONE, ME]
 *                       example: NONE
 *                       description: 친구 상태
 *                     isBlocked:
 *                       type: boolean
 *                       example: false
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

/**
 * @swagger
 * /api/users/{userId}/profile:
 *   get:
 *     summary: 유저 프로필 조회
 *     description: 특정 유저의 프로필을 조회합니다. 친구 상태, 차단 여부, 최근 책 정보를 함께 반환합니다.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 조회할 유저의 userId
 *     responses:
 *       200:
 *         description: 프로필 조회 성공
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
 *                     profileImageUrl:
 *                       type: string
 *                       nullable: true
 *                       example: https://lh3.googleusercontent.com/...
 *                     userCode:
 *                       type: string
 *                       example: a1b2c3d4
 *                     friendStatus:
 *                       type: string
 *                       enum: [FRIENDS, BLOCKED, REQUEST_SENT, REQUEST_RECEIVED, NONE, ME]
 *                       example: FRIENDS
 *                       description: 친구 상태
 *                     isBlocked:
 *                       type: boolean
 *                       example: false
 *                     recentBookTitle:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                       description: 최근 읽은 책 제목
 *                     books:
 *                       type: array
 *                       description: 사용자의 책 목록
 *                       items:
 *                         type: object
 *                       example: []
 *       500:
 *         description: 서버 오류
 */
const getUserProfile = async (req, res) => {
  try {
    const myId = req.user.userId;
    const { userId } = req.params;

    const profile = await userService.getUserProfile(myId, userId);

    return res.status(200).json({
      success: true,
      data: profile,
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
 * /api/users/me:
 *   get:
 *     summary: 내 프로필 조회
 *     description: 현재 로그인한 유저의 프로필 이미지와 닉네임을 반환합니다.
 *     tags: [User]
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
 *                 nickname: "홍길동"
 *                 profileImageUrl: "https://bookridge.s3.ap-northeast-2.amazonaws.com/profile.svg"
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "에러 메시지"
 */
const getMe = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            data: {
                nickname: req.user.nickname,
                profileImageUrl: req.user.profileImageUrl,
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/users/me/nickname:
 *   patch:
 *     summary: 닉네임 수정
 *     description: 현재 로그인한 유저의 닉네임을 수정합니다.
 *     tags: [User]
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nickname
 *             properties:
 *               nickname:
 *                 type: string
 *                 example: "새닉네임"
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 nickname: "새닉네임"
 *       400:
 *         description: 닉네임 없음 / 중복 닉네임
 *       500:
 *         description: 서버 오류
 */
const updateNickname = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { nickname } = req.body;

        const result = await userService.updateNickname(userId, nickname);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        const status = error.message.includes("이미 사용 중인") ? 400 : 500;
        return res.status(status).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/users/me/profile-image:
 *   patch:
 *     summary: 프로필 이미지 수정
 *     description: 현재 로그인한 유저의 프로필 이미지를 수정합니다. multipart/form-data로 이미지 파일을 전송합니다.
 *     tags: [User]
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 업로드할 이미지 파일
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 profileImageUrl: "https://bookridge.s3.ap-northeast-2.amazonaws.com/bookridge/1234567890.jpg"
 *       400:
 *         description: 이미지 파일 없음
 *       500:
 *         description: 서버 오류
 */
const updateProfileImage = async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "이미지 파일을 업로드해주세요." });
        }

        const profileImageUrl = req.file.location;
        const result = await userService.updateProfileImage(userId, profileImageUrl);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
  searchUserByCode,
  getUserProfile,
  getMe,
  updateNickname,
  updateProfileImage,
};