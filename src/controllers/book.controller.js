const bookService = require("../services/book.service");

/**
 * @swagger
 * tags:
 *   name: Book
 *   description: 도서 검색 및 동기화 API
 */

/**
 * @swagger
 * /api/books/search:
 *   get:
 *     summary: 도서 검색 (카카오 API)
 *     description: 키워드로 카카오 도서 API를 검색합니다. (HOME-02)
 *     tags: [Book]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색할 책 제목 또는 저자
 *         example: 해리포터
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 결과 수 (최대 50)
 *     responses:
 *       200:
 *         description: 검색 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 books:
 *                   - isbn: "9788983920690"
 *                     title: "해리 포터와 마법사의 돌"
 *                     author: "J.K. 롤링"
 *                     publisher: "문학수첩"
 *                     translator: "김혜원"
 *                     thumbnail: "https://thumbnail.kakaocdn.net/..."
 *                     url: "https://search.daum.net/..."
 *                     datetime: "1999-12-01T00:00:00.000Z"
 *                     totalPage: 0
 *                 meta:
 *                   totalCount: 42
 *                   pageableCount: 42
 *                   isEnd: false
 *                   currentPage: 1
 *       400:
 *         description: 검색어 없음
 *       500:
 *         description: 카카오 API 오류 또는 서버 오류
 */
const searchBooks = async (req, res) => {
  try {
    const { keyword, page = 1, size = 10 } = req.query;

    if (!keyword || keyword.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "검색어를 입력해주세요." });
    }

    const result = await bookService.searchBooks(
      keyword.trim(),
      Number(page),
      Number(size),
    );
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { searchBooks };
