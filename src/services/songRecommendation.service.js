const axios = require("axios");
const db = require("../models");

// 방 시작 시 책 줄거리 기반 노래 5곡 추천 생성 & 저장
const generateSongRecommendations = async (roomId) => {
  const room = await db.room.findOne({
    where: { roomId },
    include: [
      {
        model: db.book,
        as: "book",
        attributes: ["title", "author", "content"],
      },
    ],
  });

  if (!room) throw new Error("방을 찾을 수 없습니다.");
  if (!room.book) throw new Error("책 정보를 찾을 수 없습니다.");

  const existing = await db.songRecommendation.findAll({
    where: { roomId },
    order: [["createdAt", "ASC"]],
  });

  if (existing.length > 0) {
    return {
      roomId,
      recommendations: formatRecommendations(existing),
    };
  }

  const songs = await fetchSongsFromGPT(room.book);

  if (songs.length < 5) {
    throw new Error("노래 추천은 최소 5곡 이상이어야 합니다.");
  }

  const songsWithUrl = await Promise.all(
    songs.slice(0, 5).map(async (song) => {
      const url = await fetchYoutubeUrl(`${song.artist} ${song.title} MV`);
      return { ...song, url };
    })
  );

  const created = await db.songRecommendation.bulkCreate(
    songsWithUrl.map((song) => ({
      roomId,
      title: song.title,
      artist: song.artist,
      url: song.url ?? null,
    }))
  );

  return {
    roomId,
    recommendations: formatRecommendations(created),
  };
};

// GPT로 노래 추천 목록 가져오기
const fetchSongsFromGPT = async (book) => {
  const prompt = `
아래 책 정보를 읽고, 책의 분위기·주제·감성에 어울리는 한국 노래 5곡을 추천해줘.
최신 곡(2020년대)과 명곡(2000~2010년대)을 적절히 섞어서 추천해줘.
반드시 아래 JSON 형식으로만 응답해. 설명이나 다른 텍스트는 절대 포함하지 마.

책 제목: ${book.title}
저자: ${book.author}
줄거리: ${book.content || "줄거리 정보 없음"}

응답 형식:
{
  "recommendations": [
    { "title": "노래 제목", "artist": "가수 이름" }
  ]
}
`.trim();

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "너는 책 분위기에 맞는 한국 노래를 추천하는 음악 큐레이터야. " +
            "반드시 한국 노래만 추천하고, 최신 트렌드 곡과 시대를 초월한 명곡을 균형 있게 섞어서 추천해. " +
            "항상 JSON 형식으로만 응답해.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const raw = response.data.choices[0].message.content;
  const parsed = JSON.parse(raw);
  const songs = parsed.recommendations;

  if (!Array.isArray(songs) || songs.length === 0) {
    throw new Error("노래 추천 응답 형식이 올바르지 않습니다.");
  }

  return songs;
};

// YouTube Data API v3로 노래 검색 후 첫 번째 영상 URL 반환
const fetchYoutubeUrl = async (query) => {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          key: process.env.YOUTUBE_API_KEY,
          q: query,
          part: "snippet",
          type: "video",
          maxResults: 1,
          videoCategoryId: "10",
        },
      }
    );

    const videoId = response.data.items?.[0]?.id?.videoId;
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
  } catch {
     // YouTube 조회 실패해도 노래 추천 자체는 살림
    return null;
  }
};

// 저장된 추천 중 랜덤 1곡 조회
const getRandomSongRecommendation = async (roomId) => {
  const recommendations = await db.songRecommendation.findAll({
    where: { roomId },
  });

  if (!recommendations.length) {
    throw new Error("저장된 노래 추천이 없습니다.");
  }

  const random =
    recommendations[Math.floor(Math.random() * recommendations.length)];

  return formatRecommendation(random);
};

// 저장된 추천 목록 조회
const getSongRecommendations = async (roomId) => {
  const recommendations = await db.songRecommendation.findAll({
    where: { roomId },
    order: [["createdAt", "DESC"]],
  });

  return {
    recommendations: formatRecommendations(recommendations),
  };
};

const formatRecommendation = (record) => ({
  songRecommendationId: record.songRecommendationId,
  title: record.title,
  artist: record.artist,
  url: record.url ?? null,
});

const formatRecommendations = (records) =>
  records.map((record) => formatRecommendation(record));

module.exports = {
  generateSongRecommendations,
  getRandomSongRecommendation,
  getSongRecommendations,
};
