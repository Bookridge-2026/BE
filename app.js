require("dotenv").config({ 
  path: `.env.${process.env.NODE_ENV || "production"}`,
  override: true 
});

const express = require("express");
const cors = require("cors");
const logger = require("morgan");
const createError = require("http-errors");
const passport = require("passport"); // 추가
const { jwtStrategy } = require("./src/config/auth.config"); // 추가
const { swaggerUi, specs } = require("./src/config/swaggerConfig");
const { sequelize } = require("./src/models");
const db = require("./src/models");

const app = express();
const PORT = process.env.PORT || 3000;

async function seedEmojiTypes() {
  const count = await db.emojiType.count();
  if (count > 0) return;

  await db.emojiType.bulkCreate([         
    { emojiTypeId: 1 },
    { emojiTypeId: 2 },
    { emojiTypeId: 3 },
    { emojiTypeId: 4 },
    { emojiTypeId: 5 },
  ]);
  console.log("emojiType 시드 완료");
}


sequelize
  .sync({ force: false })
  .then(async () => {
    console.log("데이터베이스 연결 성공");
    await seedEmojiTypes();
  })
  .catch((err) => console.error(err));

// 미들웨어
app.use(
  cors({
    origin: true,
    credentials: true,
    exposedHeaders: ["Authorization"],
  }),
);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize()); // 추가
passport.use(jwtStrategy); // 추가

app.use("/api", require("./src/routes"));

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// 404
app.use((req, res, next) => next(createError(404)));

// 에러 핸들러
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
});
