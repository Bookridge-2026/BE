const express = require("express");
const router = express.Router();
const bookController = require("../controllers/book.controller");

// GET /api/books/search?keyword=해리포터&page=1&size=10
router.get("/search", bookController.searchBooks);

module.exports = router;
