/**
 * @swagger
 * tags:
 *   name: OAuth2
 *   description: 구글 소셜 로그인 인증
 */

/**
 * @swagger
 * /api/oauth2/login/google:
 *   get:
 *     summary: 구글 로그인
 *     description: 구글 OAuth2 로그인 페이지로 리다이렉트합니다.
 *     tags: [OAuth2]
 *     responses:
 *       302:
 *         description: 구글 로그인 페이지로 리다이렉트
 */

/**
 * @swagger
 * /api/oauth2/callback/google:
 *   get:
 *     summary: 구글 로그인 콜백
 *     description: 구글 로그인 성공 후 프론트로 리디렉션하면서 JWT 토큰을 전달합니다.
 *     tags: [OAuth2]
 *     responses:
 *       302:
 *         description: 로그인 성공 - 프론트로 리디렉션 (accessToken, refreshToken 쿼리파라미터로 전달)
 *         headers:
 *           Location:
 *             description: "https://bookridge-sswu.vercel.app?accessToken=...&refreshToken=..."
 *             schema:
 *               type: string
 *       301:
 *         description: 로그인 실패 시 /login-failed로 리다이렉트
 */

/**
 * @swagger
 * /api/oauth2/mypage:
 *   get:
 *     summary: 마이페이지
 *     description: JWT 토큰 인증 후 유저 정보를 반환합니다.
 *     tags: [OAuth2]
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: 인증 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 인증 성공! 1님의 마이페이지입니다.
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     googleId:
 *                       type: string
 *                       example: 1234567890
 *                     email:
 *                       type: string
 *                       example: test@gmail.com
 *                     nickname:
 *                       type: string
 *                       example: 홍길동
 *                     profileImageUrl:
 *                       type: string
 *                       example: https://lh3.googleusercontent.com/...
 *                     userCode:
 *                       type: string
 *                       example: a1b2c3d4
 *       401:
 *         description: 인증 실패
 */

/**
 * @swagger
 * /api/oauth2/refresh:
 *   post:
 *     summary: 액세스 토큰 재발급
 *     description: refreshToken으로 새로운 accessToken을 재발급합니다.
 *     tags: [OAuth2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: 재발급 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "유효하지 않은 refreshToken입니다."
 */

const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { googleStrategy, jwtStrategy } = require('../config/auth.config');

passport.use(googleStrategy);
passport.use(jwtStrategy);

const isLogin = passport.authenticate('jwt', { session: false });

router.get('/login/google', passport.authenticate('google', { session: false }));

router.get(
  '/callback/google',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login-failed',
  }),
  (req, res) => {
    const { accessToken, refreshToken } = req.user;
    res.redirect(`${process.env.FRONTEND_URL}?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  }
);

router.get('/mypage', isLogin, (req, res) => {
  res.status(200).json({
    message: `인증 성공! ${req.user.userId}님의 마이페이지입니다.`,
    user: req.user,
  });
});

router.post('/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ success: false, message: "refreshToken이 없습니다." });
    }

    try {
        const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const newAccessToken = jwt.sign(
            { id: payload.id, email: payload.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        return res.status(200).json({ success: true, accessToken: newAccessToken });
    } catch (error) {
        return res.status(401).json({ success: false, message: "유효하지 않은 refreshToken입니다." });
    }
});

module.exports = router;
