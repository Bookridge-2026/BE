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
const { subscribe } = require('../controllers/sseController');                       
const {extractText, saveOcr, newOcrComment, existingOcrComment, getOcrHighlights, getOcrComments} = require('../controllers/ocrController');
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

/**
 * @swagger
 * /api/ocr/ocrPage/{ocrPageId}/createOcrComment:
 *   post:
 *     summary: 새로운 OCR 코멘트 생성
 *     tags: [OCR]
 *     parameters:
 *       - in: path
 *         name: ocrPageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: OCR 페이지 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selectedText
 *               - startIndex
 *               - endIndex
 *               - content
 *             properties:
 *               selectedText:
 *                 type: string
 *                 example: "하이라이트할 텍스트"
 *               startIndex:
 *                 type: integer
 *                 example: 20
 *               endIndex:
 *                 type: integer
 *                 example: 34
 *               content:
 *                 type: string
 *                 example: "첫 번째 메모 내용"
 *     responses:
 *       "200":
 *         description: 새로운 OCR 코멘트 생성 성공
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
 *                   example: "새로운 OCR코멘트가 성공적으로 생성되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     highlightId:
 *                       type: integer
 *                       example: 10
 *                     selectedText:
 *                       type: string
 *                       example: "하이라이트할 텍스트"
 *                     startIndex:
 *                       type: integer
 *                       example: 20
 *                     endIndex:
 *                       type: integer
 *                       example: 34
 *                     ocrCommentId:
 *                       type: integer
 *                       example: 21
 *                     content:
 *                       type: string
 *                       example: "첫 번째 메모 내용"
 *                     color:
 *                       type: string
 *                       example: "#F6D36B"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-28T12:00:00.000Z"
 *       "404":
 *         description: 멤버 또는 OCR 페이지를 찾을 수 없음
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
 *                   example: "존재하지 않는 멤버입니다."
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "MEMBER_NOT_FOUND"
 *       "422":
 *         description: 텍스트 내용 없음
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
 *       "500":
 *         description: 서버 내부 오류
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
 *                   example: "Internal Server Error"
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: null
 */
router.post('/ocrPage/:ocrPageId/createOcrComment', isLogin, newOcrComment);

/**
 * @swagger
 * /api/ocr/highlight/{highlightId}/createOcrComment:
 *   post:
 *     summary: 기존 하이라이트에 OCR 코멘트 추가
 *     tags: [OCR]
 *     parameters:
 *       - in: path
 *         name: highlightId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 하이라이트 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "첫 번째 메모 내용"
 *     responses:
 *       "200":
 *         description: OCR 코멘트 생성 성공
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
 *                   example: "OCR코멘트가 성공적으로 생성되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     highlightId:
 *                       type: integer
 *                       example: 10
 *                     selectedText:
 *                       type: string
 *                       example: "하이라이트할 텍스트"
 *                     startIndex:
 *                       type: integer
 *                       example: 20
 *                     endIndex:
 *                       type: integer
 *                       example: 34
 *                     ocrComments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           ocrCommentId:
 *                             type: integer
 *                             example: 21
 *                           content:
 *                             type: string
 *                             example: "첫 번째 메모 내용"
 *                           color:
 *                             type: string
 *                             example: "#F6D36B"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-05-28T12:00:00.000Z"
 *       "404":
 *         description: 멤버 또는 하이라이트를 찾을 수 없음
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
 *                   example: "존재하지 않는 멤버입니다."
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "MEMBER_NOT_FOUND"
 *       "422":
 *         description: 코멘트 내용 없음
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
 *                   example: "코멘트를 찾을 수 없습니다."
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "COMMENT_NOT_FOUND"
 *       "500":
 *         description: 서버 내부 오류
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
 *                   example: "Internal Server Error"
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: null
 */
router.post('/highlight/:highlightId/createOcrComment', isLogin, existingOcrComment);

/**
 * @swagger
 * /api/ocr/rooms/{roomId}/ocrPage/{ocrPageId}:
 *   get:
 *     summary: OCR 페이지의 하이라이트 목록 조회
 *     tags: [OCR]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 방 ID
 *       - in: path
 *         name: ocrPageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: OCR 페이지 ID
 *     responses:
 *       "200":
 *         description: OCR 페이지 하이라이트 목록 조회 성공
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
 *                   example: "해당 OCR 페이지의 코멘트들을 성공적으로 불러왔습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     ocrPageId:
 *                       type: integer
 *                       example: 1
 *                     roomId:
 *                       type: integer
 *                       example: 3
 *                     page:
 *                       type: integer
 *                       example: 159
 *                     text:
 *                       type: string
 *                       example: "저장된 OCR 텍스트"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-28T12:00:00.000Z"
 *                     highlights:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           highlightId:
 *                             type: integer
 *                             example: 10
 *                           selectedText:
 *                             type: string
 *                             example: "하이라이트 테스트용 문장"
 *                           startIndex:
 *                             type: integer
 *                             example: 20
 *                           endIndex:
 *                             type: integer
 *                             example: 34
 *       "404":
 *         description: 멤버 또는 OCR 페이지를 찾을 수 없음
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
 *                   example: "존재하지 않는 멤버입니다."
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "MEMBER_NOT_FOUND"
 *       "500":
 *         description: 서버 내부 오류
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
 *                   example: "Internal Server Error"
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: null
 */
router.get('/rooms/:roomId/ocrPage/:ocrPageId', isLogin, getOcrHighlights)

router.get('/ocrPage/:ocrPageId/sse', isLogin, subscribe);

/**
 * @swagger
 * /api/ocr/highlight/{highlightId}/OcrComments:
 *   get:
 *     summary: 하이라이트의 OCR 코멘트 목록 조회
 *     tags: [OCR]
 *     parameters:
 *       - in: path
 *         name: highlightId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 하이라이트 ID
 *     responses:
 *       "200":
 *         description: 하이라이트 코멘트 목록 조회 성공
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
 *                   example: "해당 하이라이트의 코멘트들을 성공적으로 불러왔습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     highlightId:
 *                       type: integer
 *                       example: 10
 *                     ocrPageId:
 *                       type: integer
 *                       example: 1
 *                     selectedText:
 *                       type: string
 *                       example: "하이라이트 테스트용 문장"
 *                     startIndex:
 *                       type: integer
 *                       example: 20
 *                     endIndex:
 *                       type: integer
 *                       example: 34
 *                     ocrComments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           ocrCommentId:
 *                             type: integer
 *                             example: 21
 *                           content:
 *                             type: string
 *                             example: "첫 번째 메모 내용"
 *                           color:
 *                             type: string
 *                             example: "#F6D36B"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-05-28T12:00:00.000Z"
 *       "404":
 *         description: 멤버 또는 하이라이트를 찾을 수 없음
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
 *                   example: "존재하지 않는 멤버입니다."
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "MEMBER_NOT_FOUND"
 *       "500":
 *         description: 서버 내부 오류
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
 *                   example: "Internal Server Error"
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: null
 */
router.get('/highlight/:highlightId/OcrComments', isLogin, getOcrComments);

module.exports = router;