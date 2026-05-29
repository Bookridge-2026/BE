
/**
 * @swagger
 * tags:
 *   name: OCR
 *   description: OCR 관련 API
 */
const express = require('express');
const router = express.Router();
const passport = require('passport');
const multer = require('multer');                             
const {extractText, saveOcr} = require('../controllers/ocrController');
const { googleStrategy, jwtStrategy } = require('../config/auth.config');

passport.use(googleStrategy);
passport.use(jwtStrategy);

const isLogin = passport.authenticate('jwt', { session: false });
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/ocr:
 *   post:
 *     summary: 이미지에서 텍스트 추출 (OCR)
 *     tags: [OCR]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: OCR 처리할 이미지 파일
 *     responses:
 *       200:
 *         description: 텍스트 추출 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                   example: "추출된 텍스트 내용"
 *       400:
 *         description: 이미지 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "이미지가 없습니다."
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "OCR 실패"
 */
router.post('/extract', upload.single('image'), isLogin, extractText);

/**
 * @swagger
 * /api/ocr/room/{roomId}/ocrSave:
 *   post:
 *     summary: OCR 페이지 저장
 *     tags: [OCR]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 방 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - page
 *               - text
 *             properties:
 *               page:
 *                 type: integer
 *                 description: 페이지 번호
 *                 example: 5
 *               text:
 *                 type: string
 *                 description: OCR 추출 텍스트
 *                 example: "추출된 텍스트 내용"
 *     responses:
 *       200:
 *         description: OCR 페이지 저장 성공
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
 *                   example: "OCR페이지가 정상적으로 생성되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     ocrPageId:
 *                       type: integer
 *                       example: 1
 *                     page:
 *                       type: integer
 *                       example: 5
 *                     text:
 *                       type: string
 *                       example: "추출된 텍스트 내용"
 *                     roomId:
 *                       type: integer
 *                       example: 1
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: 멤버 또는 방을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "존재하지 않는 방입니다."
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "ROOM_NOT_FOUND"
 *       422:
 *         description: 유효하지 않은 텍스트 또는 페이지
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "텍스트를 찾을 수 없습니다."
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "TEXT_NOT_FOUND"
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "서버 오류가 발생했습니다."
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "INTERNAL_SERVER_ERROR"
 */
router.post('/room/:roomId/ocrSave', isLogin, saveOcr);

module.exports = router;