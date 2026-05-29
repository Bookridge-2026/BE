const ocrService = require('../services/ocrService');

exports.extractText = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '이미지가 없습니다.',
        error: { code: 'NO_IMAGE' },
      });
    }

    const text = await ocrService.extractTextFromImage(req.file.buffer); 
    res.status(200).json({ success: true, data: { text } });

  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      error: { code: err.code },
    });
  }
};