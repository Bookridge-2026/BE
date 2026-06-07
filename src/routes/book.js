const express = require("express");
const router = express.Router();
const passport = require("passport");
const { jwtStrategy } = require("../config/auth.config");
const bookController = require("../controllers/bookController");

passport.use(jwtStrategy);
const isLogin = passport.authenticate("jwt", { session: false });

// GET  /api/books/search?keyword=해리포터&page=1&size=10
router.get("/search", bookController.searchBooks);

// PATCH /api/books/:isbn/total-page
router.patch("/:isbn/total-page", isLogin, bookController.updateTotalPage);

module.exports = router;
