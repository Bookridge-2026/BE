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
 *     description: |
 *       구글 로그인 성공 후 유저 여부에 따라 다르게 처리합니다.
 *       - 기존 유저: 프론트 홈으로 리디렉션 (accessToken, refreshToken 쿼리파라미터로 전달)
 *       - 신규 유저: 프론트 닉네임 입력 페이지로 리디렉션 (tempToken 쿼리파라미터로 전달)
 *     tags: [OAuth2]
 *     responses:
 *       302:
 *         description: |
 *           기존 유저 - https://bookridge-sswu.vercel.app/home?accessToken=...&refreshToken=...
 *           신규 유저 - https://bookridge-sswu.vercel.app/nickname?tempToken=...
 *       301:
 *         description: 로그인 실패 시 /login-failed로 리다이렉트
 */

/**
 * @swagger
 * /api/oauth2/register:
 *   post:
 *     summary: 회원가입
 *     description: 신규 유저가 닉네임 입력 후 회원가입을 완료합니다. tempToken과 nickname을 받아 유저를 생성하고 정식 토큰을 발급합니다.
 *     tags: [OAuth2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             tempToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             nickname: "홍길동"
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: 잘못된 요청 (닉네임 중복 또는 필수값 누락)
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "이미 사용 중인 닉네임입니다."
 *       401:
 *         description: 유효하지 않은 tempToken
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "유효하지 않은 tempToken입니다."
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
const { googleStrategy, jwtStrategy, generateAccessToken, generateRefreshToken } = require('../config/auth.config');
const crypto = require('crypto');

passport.use(googleStrategy);
passport.use(jwtStrategy);

const isLogin = passport.authenticate('jwt', { session: false });

router.get(
    '/login/google', 
    passport.authenticate('google', { session: false }));

router.get(
    '/callback/google',
    passport.authenticate('google', { session: false, failureRedirect: '/login-failed' }),
    (req, res) => {
        const user = req.user;

        if (user.isNewUser) {
            // 신규 유저 → 임시 토큰 발급 후 닉네임 입력 페이지로
            const tempToken = jwt.sign(
                { googleId: user.googleId, email: user.email, isNewUser: true },
                process.env.JWT_SECRET,
                { expiresIn: '10m' }
            );
            return res.redirect(`${process.env.FRONTEND_URL}/nickname?tempToken=${tempToken}`); 
        }

        // 기존 유저 → 정식 토큰 발급 후 홈으로
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        return res.redirect(`${process.env.FRONTEND_URL}/home?accessToken=${accessToken}&refreshToken=${refreshToken}`);
    } //프론트에서 토큰 localStorage 저장 후 URL에서 토큰 제거
);

router.post('/register', async (req, res) => {
    const { tempToken, nickname } = req.body;

    if (!tempToken || !nickname) {
        return res.status(400).json({ success: false, message: "tempToken과 nickname은 필수입니다." });
    }

    // 1. 토큰 검증
    let payload;
    try {
        payload = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ success: false, message: "유효하지 않은 tempToken입니다." });
    }

    if (!payload.isNewUser) {
        return res.status(400).json({ success: false, message: "유효하지 않은 요청입니다." });
    }

    try {
        const db = require('../models');

        // 2. 닉네임 중복 확인
        const exists = await db.user.findOne({ where: { nickname } });
        if (exists) {
            return res.status(400).json({ success: false, message: "이미 사용 중인 닉네임입니다." });
        }

        // 3. userCode 생성
        let userCode;
        let codeExists;
        do {
            userCode = crypto.randomBytes(4).toString('hex');
            codeExists = await db.user.findOne({ where: { userCode } });
        } while (codeExists);

        // 4. 유저 생성 (기본 이미지 사용)
        const newUser = await db.user.create({
            googleId: payload.googleId,
            email: payload.email,
            nickname,
            profileImageUrl: "https://bookridge.s3.ap-northeast-2.amazonaws.com/profile.svg",
            userCode,
            updatedAt: new Date(),
        });

        // 5. 정식 토큰 발급
        const accessToken = generateAccessToken({ id: newUser.userId, email: newUser.email });
        const refreshToken = generateRefreshToken({ id: newUser.userId });

        return res.status(201).json({ success: true, accessToken, refreshToken });

    } catch (error) {
        return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
});

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
