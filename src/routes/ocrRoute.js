
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
const {extractText} = require('../controllers/ocrController');
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
router.post('/', upload.single('image'), isLogin, extractText);

module.exports = router;