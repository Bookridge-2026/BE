const { extractTextFromImage, saveOcr, newOcrComment, existingOcrComment, getOcrHighlights, getOcrComments, deleteOcrComment, getOcrPage } = require('../services/ocrService');
const { broadcast } = require('./sseController');

exports.getOcrPage = async (req, res) =>  {
  try {

    const { roomId, page } = req.params;

    const result = await getOcrPage(roomId, page);

    res.status(200).json({ 
      success: true, 
      message: "해당 쪽수에 존재하는 OCR 페이지를 성공적으로 불러왔습니다.",
      data: result 
    });

  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      error: { code: err.code },
    });
  }
}

exports.extractText = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '이미지가 없습니다.',
        error: { code: 'NO_IMAGE' },
      });
    }

    const text = await extractTextFromImage(req.file.buffer); 
    res.status(200).json({ success: true, data: { text } });

  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      error: { code: err.code },
    });
  }
};

exports.saveOcr = async (req, res) => {
  try{

    const { page, text } = req.body;
    const { roomId } = req.params;

    const result = await saveOcr(page, text, roomId, req.member); 

    res.status(200).json({ 
      success: true, 
      message: "OCR페이지가 정상적으로 생성되었습니다.",
      data: result 
    });
  
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      error: { code: err.code },
    });
  }
}

exports.newOcrComment = async (req, res) => {
  try{

    const { selectedText, startIndex, endIndex, content } = req.body;
    const { ocrPageId } = req.params;

    const result = await newOcrComment(selectedText, startIndex, endIndex, content, ocrPageId, req.member);

    broadcast(ocrPageId, 'new-highlight', result);

    res.status(200).json({ 
      success: true, 
      message: "새로운 OCR코멘트가 성공적으로 생성되었습니다.",
      data: result 
    });

  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      error: { code: err.code },
    });
  }
}

exports.existingOcrComment = async(req, res) => {
  try{

    const { content } = req.body;
    const { highlightId } = req.params;

    const result = await existingOcrComment(content, highlightId, req.member);

    res.status(200).json({ 
      success: true, 
      message: "OCR코멘트가 성공적으로 생성되었습니다.",
      data: result 
    });

  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      error: { code: err.code },
    });
  } 
}

exports.getOcrHighlights = async(req, res) => {
  try{
    const { ocrPageId } = req.params;
    const userId = req.user?.userId;

    const result = await getOcrHighlights(ocrPageId, userId);

    res.status(200).json({ 
      success: true, 
      message: "해당 OCR 페이지의 하이라이트들을 성공적으로 불러왔습니다.",
      data: result 
    });

  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      error: { code: err.code },
    });
  } 
}

exports.getOcrComments = async(req, res) => {
  try{
    const { highlightId } = req.params;
    const userId = req.user?.userId;

    const result = await getOcrComments(highlightId, userId);

    res.status(200).json({ 
      success: true, 
      message: "해당 하이라이트의 코멘트들을 성공적으로 불러왔습니다.",
      data: result 
    });

  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      error: { code: err.code },
    });
  } 
}

exports.deleteOcrComment = async(req, res) => {
  try{

    const { ocrCommentId } = req.params;

    const result = await deleteOcrComment(ocrCommentId, req.member);

    res.status(200).json({ 
      success: true, 
      message: "해당 코멘트를 성공적으로 삭제했습니다."
    });

  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      error: { code: err.code },
    });
  } 
}