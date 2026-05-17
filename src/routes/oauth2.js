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
 *     description: 구글 로그인 성공 후 JWT 토큰을 반환합니다.
 *     tags: [OAuth2]
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 success:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Google 로그인 성공!
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                           example: eyJhbGci...
 *                         refreshToken:
 *                           type: string
 *                           example: eyJhbGci...
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 1
 *                             email:
 *                               type: string
 *                               example: test@gmail.com
 *                             name:
 *                               type: string
 *                               example: 홍길동
 *                     data:
 *                       type: string
 *                       example: 홍길동
 *       302:
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

const express = require('express');
const router = express.Router();
const passport = require('passport');
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
    res.status(200).json({
      resultType: 'SUCCESS',
      success: {
        message: 'Google 로그인 성공!',
        tokens: req.user,
        data: req.user.user.name,
      },
    });
  }
);

router.get('/mypage', isLogin, (req, res) => {
  res.status(200).json({
    message: `인증 성공! ${req.user.userId}님의 마이페이지입니다.`,
    user: req.user,
  });
});

module.exports = router;
