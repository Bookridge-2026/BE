const songRecommendationService = require("../services/songRecommendation.service");

/**
 * @swagger
 * tags:
 *   name: SongRecommendation
 *   description: 책 줄거리 기반 노래 추천 API
 */

/**
 * @swagger
 * /api/rooms/{roomId}/songs/recommendations:
 *   post:
 *     summary: 노래 추천 생성
 *     description: 방의 책 정보를 기반으로 노래 추천 5곡을 생성하고 저장합니다. 이미 저장된 추천이 있으면 기존 추천을 반환합니다.
 *     tags: [SongRecommendation]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 방 ID
 *     responses:
 *       201:
 *         description: 추천 생성/반환 성공
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
 *                   example: 노래 추천이 생성되었습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     roomId:
 *                       type: integer
 *                       example: 1
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           songRecommendationId:
 *                             type: integer
 *                             example: 10
 *                           title:
 *                             type: string
 *                             example: 밤편지
 *                           artist:
 *                             type: string
 *                             example: 아이유
 *                           url:
 *                             type: string
 *                             nullable: true
 *                             example: https://www.youtube.com/watch?v=...
 *       500:
 *         description: 서버 오류
 */

const generateSongRecommendations = async (req, res) => {
  try {
    const { roomId } = req.params;
    const result = await songRecommendationService.generateSongRecommendations(roomId);

    return res.status(201).json({
      success: true,
      data: result,
      message: "노래 추천이 생성되었습니다.",
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
 * /api/rooms/{roomId}/songs/recommendations/random:
 *   get:
 *     summary: 랜덤 추천 노래 1곡 조회
 *     description: 저장된 추천 노래 중 랜덤으로 1곡을 조회합니다.
 *     tags: [SongRecommendation]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 방 ID
 *     responses:
 *       200:
 *         description: 조회 성공
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
 *                     songRecommendationId:
 *                       type: integer
 *                       example: 10
 *                     title:
 *                       type: string
 *                       example: 밤편지
 *                     artist:
 *                       type: string
 *                       example: 아이유
 *                     url:
 *                       type: string
 *                       nullable: true
 *                       example: https://www.youtube.com/watch?v=...
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-05-30T12:34:56.000Z
 *       404:
 *         description: 저장된 추천 없음
 *       500:
 *         description: 서버 오류
 */

const getRandomSongRecommendation = async (req, res) => {
  try {
    const { roomId } = req.params;
    const recommendation =
      await songRecommendationService.getRandomSongRecommendation(roomId);

    return res.status(200).json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    const status = error.message === "저장된 노래 추천이 없습니다." ? 404 : 500;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/rooms/{roomId}/songs/recommendations:
 *   get:
 *     summary: 추천 노래 목록 조회
 *     description: 방에 저장된 추천 노래 전체 목록을 조회합니다.
 *     tags: [SongRecommendation]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 방 ID
 *     responses:
 *       200:
 *         description: 조회 성공
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
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           songRecommendationId:
 *                             type: integer
 *                             example: 10
 *                           roomId:
 *                             type: integer
 *                             example: 1
 *                           title:
 *                             type: string
 *                             example: 밤편지
 *                           artist:
 *                             type: string
 *                             example: 아이유
 *                           url:
 *                             type: string
 *                             nullable: true
 *                             example: https://www.youtube.com/watch?v=...
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: 2026-05-30T12:34:56.000Z
 *       500:
 *         description: 서버 오류
 */

const getSongRecommendations = async (req, res) => {
  try {
    const { roomId } = req.params;
    const result = await songRecommendationService.getSongRecommendations(roomId);

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
  generateSongRecommendations,
  getRandomSongRecommendation,
  getSongRecommendations,
};
