const vision = require('@google-cloud/vision');
const { member: Member, room:Room, ocrPage:OcrPage, book:Book, sequelize, ocrHighlight:OcrHighlight, ocrComment:OcrComment } = require('../models');
const notificationService = require("./notification.service");
const blockService = require("./block.service");

const client = new vision.ImageAnnotatorClient();

exports.getOcrPage = async (roomId, page) => {

  const pageNum = parseInt(page);

  if (!page || isNaN(pageNum) || pageNum === 0) {
    const err = new Error('쪽수를 찾을 수 없습니다.');
    err.code = 'PAGE_NOT_FOUND';
    err.status = 422;
    throw err;
  }

  const ocrPages = await OcrPage.findAll({
    where: {
      roomId,
      page: pageNum
    },
    attributes: ['ocrPageId', 'page', 'roomId']
  });

  return ocrPages;
}

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

exports.saveOcr = async (page, text, roomId, member) => {

  if (member.ocrChance <= 0) {
    const err = new Error('ocr페이지 생성 횟수를 전부 소진했습니다.');
    err.code = 'OCR_CHANCE_EXHAUSTED';
    err.status = 403;
    throw err;
  }

  const room = await Room.findByPk(roomId, {
    include: [{ model:Book, as:'book'}]
  });

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

    if (member.maxPage < ocrPage.page) {
      member.maxPage = ocrPage.page;
      await member.save({ transaction: t });
    }
  
    await member.decrement('ocrChance', { by: 1, transaction: t });
  })

  return ocrPage;
  
};

exports.newOcrComment = async (selectedText, startIndex, endIndex, content, ocrPageId, member) => {

  const ocrPage = await OcrPage.findByPk(ocrPageId);

  if (!ocrPage) {
    const err = new Error('존재하지 않는 OCR페이지입니다.');
    err.code = 'OCRPAGE_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const existingHighlight = await OcrHighlight.findOne({
    where: { startIndex, endIndex, ocrPageId }
  });

  if(existingHighlight){
    const result = await exports.existingOcrComment(content, existingHighlight.ocrHighlightId, member);
    return result;
  }

  if (!content || content.length === 0) {
    const err = new Error('코멘트를 찾을 수 없습니다.');
    err.code = 'COMMENT_NOT_FOUND';
    err.status = 422;
    throw err;
  }

  let highlight, ocrComment;

  await sequelize.transaction(async (t) => {

    highlight = await OcrHighlight.create({
      selectedText,
      startIndex,
      endIndex,
      ocrPageId:ocrPageId,
    }, { transaction: t });

    if (member.maxPage < ocrPage.page) {
      member.maxPage = ocrPage.page;
      await member.save({ transaction: t });
    }

    ocrComment = await OcrComment.create({
      comment: content,
      memberId:member.memberId,
      ocrHighlightId: highlight.ocrHighlightId
    }, { transaction: t });
  })

  // OCR 알림
  await notificationService.createOcrNotification({
    ocrHighlight: highlight,
    senderMemberId: member.memberId,
  }).catch(console.error);

  return {
    highlightId: highlight.ocrHighlightId,
    ocrPageId: ocrPage.ocrPageId,
    selectedText: highlight.selectedText,
    startIndex: highlight.startIndex,
    endIndex: highlight.endIndex,
    ocrComments: [{
      ocrCommentId: ocrComment.ocrCommentId,
      content: ocrComment.comment,
      color: member.color,
      createdAt: ocrComment.createdAt,
    }]
  };
  
}

exports.existingOcrComment = async(content, highlightId, member) => {

  const highlight = await OcrHighlight.findByPk(highlightId);

  if (!highlight) {
    const err = new Error('존재하지 않는 하이라이트입니다.');
    err.code = 'HIGHLIGHT_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (!content || content.length === 0) {
    const err = new Error('코멘트를 찾을 수 없습니다.');
    err.code = 'COMMENT_NOT_FOUND';
    err.status = 422;
    throw err;
  }

  let updatedHighlight;

  await sequelize.transaction(async (t) => {

    await OcrComment.create({
      comment: content,
      memberId:member.memberId,
      ocrHighlightId: highlight.ocrHighlightId
    }, { transaction: t });

    updatedHighlight = await OcrHighlight.findByPk(highlightId, {
      include: [{
        model: OcrComment,
        as: 'ocrComments',
        include: [{ model: Member}]
      }],
      transaction: t
    });

    const ocrPage = await OcrPage.findByPk(ocrPageId, { transaction: t });

    if (member.maxPage < ocrPage.page) {
      member.maxPage = ocrPage.page;
      await member.save({ transaction: t });
    }
  })

  await notificationService.createOcrNotification({
    ocrHighlight: highlight,
    senderMemberId: member.memberId,
  });

  return {
    highlightId: updatedHighlight.ocrHighlightId,
    ocrPageId: updatedHighlight.ocrPageId,
    selectedText: updatedHighlight.selectedText,
    startIndex: updatedHighlight.startIndex,
    endIndex: updatedHighlight.endIndex,
    ocrComments: updatedHighlight.ocrComments.map(comment => ({
      ocrCommentId: comment.ocrCommentId,
      content: comment.comment,
      color: comment.Member.color,
      createdAt: comment.createdAt,
    }))
  };
}

exports.getOcrHighlights = async (ocrPageId) => {

  const ocrPage = await OcrPage.findByPk(ocrPageId, {
    include:[{
      model: OcrHighlight,
      as: 'ocrHighlights',
    }]
  });

  if (!ocrPage) {
    const err = new Error('존재하지 않는 OCR페이지입니다.');
    err.code = 'OCRPAGE_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  return {
    ocrPageId: ocrPage.ocrPageId,
    roomId: ocrPage.roomId,
    page: ocrPage.page,
    text: ocrPage.text,
    createdAt: ocrPage.createdAt,
    highlights: ocrPage.ocrHighlights.map(highlight => ({
      highlightId: highlight.ocrHighlightId,
      selectedText: highlight.selectedText,
      startIndex: highlight.startIndex,
      endIndex: highlight.endIndex,
    }))
  };

}

exports.getOcrComments = async(highlightId, userId) => {

  const highlight = await OcrHighlight.findByPk(highlightId, {
    include: [{
      model: OcrComment,
      as: 'ocrComments',
      include: [{ model: Member}] 
    }]
  });

  if (!highlight) {
    const err = new Error('존재하지 않는 하이라이트입니다.');
    err.code = 'HIGHLIGHT_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  let blockedUserIds = [];
  if (userId) {
    blockedUserIds = await blockService.getBlockedUserIds(userId);
  }
  const blockedUserIdSet = new Set(blockedUserIds.map(String));

  return {
    highlightId: highlight.ocrHighlightId,
    ocrPageId: highlight.ocrPageId,
    selectedText: highlight.selectedText,
    startIndex: highlight.startIndex,
    endIndex: highlight.endIndex,
    ocrComments: highlight.ocrComments
    .filter(comment => !blockedUserIdSet.has(String(comment.Member.userId)))
    .map(comment => ({
      ocrCommentId: comment.ocrCommentId,
      content: comment.comment,
      color: comment.Member.color,
      createdAt: comment.createdAt,
    }))
  };
}

exports.deleteOcrComment = async(ocrCommentId, member) => {
  
  const ocrComment = await OcrComment.findByPk(ocrCommentId);

  if (!ocrComment) {
    const err = new Error('존재하지 않는 ocr코멘트입니다.');
    err.code = 'OCRCOMMENT_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (ocrComment.memberId != member.memberId) {
    const err = new Error('해당 코멘트를 삭제할 권한이 없습니다.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  await ocrComment.destroy();
}