const jwt = require('jsonwebtoken'); 
const crypto = require('crypto');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const db = require('../models/index'), User = db.user;

const secret = process.env.JWT_SECRET;

// 토큰 생성 함수
const generateAccessToken = (user) => { 
  return jwt.sign(
    { id: user.id, email: user.email },
    secret,
    { expiresIn: '1h' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    secret,
    { expiresIn: '14d' }
  );
}; 

const googleVerify = async (profile) => {
  const email = profile.emails?.[0]?.value; // Google 프로필에서 이메일 추출
  if (!email) {
    throw new Error(`profile.email was not found: ${profile}`);
  }

  // 이메일로 기존 사용자 조회
  const user = await User.findOne({ where: { email } });
  if (user !== null) { // 기존 사용자 존재
    return { id: user.userId, email: user.email, name: user.nickname };
  }

  // 기존 사용자 없으면 새로 생성
  let userCode;
  let exists;
  do {
  userCode = crypto.randomBytes(4).toString('hex'); // 8자리 랜덤 문자열
  exists = await User.findOne({ where: { userCode } });
  } while (exists); // 중복이면 다시 생성

  const created = await User.create({
    googleId: profile.id,
    email: email,
    nickname: profile.displayName,
    profileImageUrl: profile.photos?.[0]?.value || '',
    userCode: userCode,
    updatedAt: new Date(),
  });

  return { id: created.userId, email: created.email, name: created.nickname };
  
};

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.PASSPORT_GOOGLE_CLIENT_ID,
    clientSecret: process.env.PASSPORT_GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/oauth2/callback/google',
    scope: ['email', 'profile'],
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
      const user = await googleVerify(profile); // 콜백 URL로 요청 오면 자동 실행
      const jwtAccessToken = generateAccessToken(user); // 1시간 토큰 발급
      const jwtRefreshToken = generateRefreshToken(user); // 14일 토큰 발급
      return cb(null, {
        accessToken: jwtAccessToken,
        refreshToken: jwtRefreshToken,
        user: user,
      });
    } catch (err) {
      return cb(err);
    }
  }
);

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

const jwtStrategy = new JwtStrategy( // 토큰 검증 
  jwtOptions,
  async (payload, done) => {
    try {
      const user = await User.findOne({
        where: { userId: payload.id }, // payload : { id: user.id, email: user.email }
      });
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  }
 
);

module.exports = { googleStrategy, jwtStrategy, generateAccessToken, generateRefreshToken };
