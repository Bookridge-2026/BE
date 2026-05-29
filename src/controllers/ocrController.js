const { extractTextFromImage, saveOcr } = require('../services/ocrService');

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
    const userId = req.user.userId;

    const result = await saveOcr(page, text, roomId, userId);
    res.status(200).json({ 
      success: true, 
      message: "OCR페이지가 정상적으로 생성되었습니다.",
      data: result });
  
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      error: { code: err.code },
    });
  }
}