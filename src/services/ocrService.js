const vision = require('@google-cloud/vision');
const { member: Member, room:Room, ocrPage:OcrPage, book:Book, sequelize, ocrHighlight:OcrHighlight, ocrComment:OcrComment, ocrHighlight } = require('../models');

const client = new vision.ImageAnnotatorClient();

exports.extractTextFromImage = async (imageBuffer) => {

  let result;

  try {
    [result] = await client.textDetection({ image: { content: imageBuffer } });
  } catch (e) {
    const err = new Error('OCR 처리 중 오류가 발생했습니다.');
    err.code = 'OCR_FAIL';
    err.status = 500;
    throw err;
  }
  const detections = result.textAnnotations;

  if (!detections || detections.length === 0) {
    const err = new Error('텍스트를 찾을 수 없습니다.');
    err.code = 'TEXT_NOT_FOUND';
    err.status = 422;
    throw err;
  }

  return detections[0].description;
};

exports.saveOcr = async (page, text, roomId, userId) => {

  const room = await Room.findByPk(roomId, {
    include: [{ model:Book, as:'book'}]
  });

  const member = await Member.findOne({ where: { userId } });

  if (!member) {
    const err = new Error('존재하지 않는 멤버입니다.');
    err.code = 'MEMBER_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (!room) {
    const err = new Error('존재하지 않는 방입니다.');
    err.code = 'ROOM_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (!text || text.length === 0) {
    const err = new Error('텍스트를 찾을 수 없습니다.');
    err.code = 'TEXT_NOT_FOUND';
    err.status = 422;
    throw err;
  }

  if (!page || page < 0 || page > room.book.totalPage) {
    const err = new Error('페이지를 찾을 수 없습니다.');
    err.code = 'PAGE_NOT_FOUND';
    err.status = 422;
    throw err;
  }

  let ocrPage;

  const ocr = await sequelize.transaction(async (t) => {

    ocrPage = await OcrPage.create({
      page,
      text,
      roomId
    }, { transaction: t });

  
    await member.decrement('ocrChance', { by: 1, transaction: t });
  })

  return ocrPage;
  
};

exports.newOcrComment = async (selectedText, startIndex, endIndex, content, ocrPageId, userId) => {
  const ocrPage = await OcrPage.findByPk(ocrPageId);

  const member = await Member.findOne({ where: { userId } });

  if (!member) {
    const err = new Error('존재하지 않는 멤버입니다.');
    err.code = 'MEMBER_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (!ocrPage) {
    const err = new Error('존재하지 않는 ocr페이지입니다.');
    err.code = 'OCRPAGE_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (!content || content.length === 0) {
    const err = new Error('텍스트를 찾을 수 없습니다.');
    err.code = 'TEXT_NOT_FOUND';
    err.status = 422;
    throw err;
  }

  let highlight, ocrComment;

  const newOcrComment = await sequelize.transaction(async (t) => {

    highlight = await OcrHighlight.create({
      selectedText,
      startIndex,
      endIndex,
      ocrPageId:ocrPageId
    }, { transaction: t });

    ocrComment = await OcrComment.create({
      comment,
      memberId:member.memberId,
      ocrHighlightId: highlight.ocrHighlightId
    }, { transaction: t });
  })

  return {
    highlightId: highlight.ocrHighlightId,
    selectedText: highlight.selectedText,
    startIndex: highlight.startIndex,
    endIndex: highlight.endIndex,
    ocrComments: [{
      ocrCommentId: ocrComment.ocrCommentId,
      highlightId: highlight.ocrHighlightId,
      content: ocrComment.comment,
      color: ocrComment.color,
      createdAt: ocrComment.createdAt,
    }]
  };
  

}