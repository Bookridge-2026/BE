const { ocrPage: OcrPage, member: Member } = require('../models');
const clients = new Map();

exports.subscribe = async (req, res) => {
    const { ocrPageId } = req.params;
    const userId = req.user.userId;

    const ocrPage = await OcrPage.findByPk(ocrPageId);
    if (!ocrPage) return res.status(404).json({ 
        success: false,
        message: '존재하지 않는 OCR페이지입니다.',
        error: { code: 'OCRPAGE_NOT_FOUND' },
    });

    const member = await Member.findOne({ where: { userId, roomId: ocrPage.roomId } });
    if (!member) return res.status(404).json({
        success: false,
        message: '존재하지 않는 멤버입니다.',
        error: { code: 'MEMBER_NOT_FOUND' },
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    if (!clients.has(ocrPageId)) clients.set(ocrPageId, []);
    clients.get(ocrPageId).push(res);

    req.on('close', () => {
        const updated = clients.get(ocrPageId).filter(c => c !== res);
        clients.set(ocrPageId, updated);
    });
    };

    exports.broadcast = (ocrPageId, event, data) => {
    const pageClients = clients.get(String(ocrPageId)) || [];
    pageClients.forEach(client => {
        client.write(`event: ${event}\n`);
        client.write(`data: ${JSON.stringify(data)}\n\n`);
    });
};