const axios = require("axios");
const db = require("../models");

// 카카오 도서 API 검색
const searchBooks = async (keyword, page = 1, size = 10) => {
  if (!keyword || keyword.trim() === "") {
    throw new Error("검색어를 입력해주세요.");
  }

  const response = await axios.get("https://dapi.kakao.com/v3/search/book", {
    params: { query: keyword, page, size },
    headers: {
      Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
    },
  });

  const { documents, meta } = response.data;

  // 카카오 API는 totalPage를 제공하지 않음 → 0으로 반환
  // 실제 값은 방 생성 후 PATCH /api/books/:isbn/total-page 로 업데이트
  const books = documents.map((doc) => ({
    isbn: doc.isbn.split(" ").pop(),
    title: doc.title,
    author: doc.authors.join(", "),
    publisher: doc.publisher,
    translator: doc.translators.join(", ") || null,
    thumbnail: doc.thumbnail,
    url: doc.url,
    datetime: doc.datetime,
    content: doc.contents || null,
    totalPage: 0,
  }));

  return {
    books,
    meta: {
      totalCount: meta.total_count,
      pageableCount: meta.pageable_count,
      isEnd: meta.is_end,
      currentPage: page,
    },
  };
};

// ISBN 기반 Book DB 동기화
// totalPage는 카카오 API가 미제공 -> 0으로 저장 후 사용자가 직접 입력
const syncBookByIsbn = async (isbn) => {
  // 1) 이미 DB에 있으면 그대로 반환
  const existing = await db.book.findOne({ where: { isbn } });
  if (existing) return existing;

  // 2) 카카오 API로 책 기본 정보 조회
  const response = await axios.get("https://dapi.kakao.com/v3/search/book", {
    params: { query: isbn, target: "isbn" },
    headers: {
      Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
    },
  });

  const doc = response.data.documents?.[0];
  if (!doc) throw new Error("해당 ISBN의 책 정보를 찾을 수 없습니다.");

  // 3) DB 저장 (totalPage는 0, 이후 PATCH /api/books/:isbn/total-page 로 업데이트)
  const book = await db.book.create({
    isbn,
    title: doc.title,
    url: doc.url,
    datetime: doc.datetime,
    author: doc.authors.join(", "),
    publisher: doc.publisher,
    translator: doc.translators.join(", ") || null,
    thumbnail: doc.thumbnail,
    content: doc.contents || null,
    totalPage: 0,
  });

  return book;
};

// totalPage 직접 입력 업데이트
const updateTotalPage = async (isbn, totalPage) => {
  if (!Number.isInteger(totalPage) || totalPage < 1) {
    throw new Error("올바른 페이지 수를 입력해주세요. (1 이상의 정수)");
  }

  const book = await db.book.findOne({ where: { isbn } });
  if (!book) throw new Error("책 정보를 찾을 수 없습니다.");

  await book.update({ totalPage });
  return book;
};

module.exports = { searchBooks, syncBookByIsbn, updateTotalPage };
