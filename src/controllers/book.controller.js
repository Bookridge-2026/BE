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
 *     description: 키워드로 카카오 도서 API를 검색합니다. (HOME-02) totalPage는 방 생성 시 Open Library API에서 자동 저장됩니다.
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
 *                     totalPage: 0
 *                 meta:
 *                   totalCount: 42
 *                   pageableCount: 42
 *                   isEnd: false
 *                   currentPage: 1
 *       400:
 *         description: 검색어 없음
 *       500:
 *         description: 카카오 API 오류
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

/**
 * @swagger
 * /api/books/{isbn}/total-page:
 *   patch:
 *     summary: 책 총 페이지 수 업데이트
 *     description: |
 *       Open Library에 데이터가 없어 totalPage가 0인 경우, 방장이 직접 입력합니다.
 *       방 상세 화면에서 totalPage === 0 일 때 입력 UI를 노출하는 방식으로 연동합니다.
 *     tags: [Book]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: isbn
 *         required: true
 *         schema:
 *           type: string
 *         example: "9788983920690"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - totalPage
 *             properties:
 *               totalPage:
 *                 type: integer
 *                 example: 328
 *                 description: 책의 전체 페이지 수 (1 이상)
 *     responses:
 *       200:
 *         description: 업데이트 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "총 페이지 수가 업데이트되었습니다."
 *               data:
 *                 isbn: "9788983920690"
 *                 totalPage: 328
 *       400:
 *         description: 잘못된 페이지 수
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 책 없음
 */
const updateTotalPage = async (req, res) => {
  try {
    const { isbn } = req.params;
    const { totalPage } = req.body;

    if (totalPage === undefined || totalPage === null) {
      return res
        .status(400)
        .json({ success: false, message: "totalPage를 입력해주세요." });
    }

    const book = await bookService.updateTotalPage(isbn, Number(totalPage));
    return res.status(200).json({
      success: true,
      message: "총 페이지 수가 업데이트되었습니다.",
      data: { isbn: book.isbn, totalPage: book.totalPage },
    });
  } catch (error) {
    const status = error.message.includes("찾을 수 없습니다") ? 404 : 400;
    return res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { searchBooks, updateTotalPage };
