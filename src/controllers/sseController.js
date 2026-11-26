const { ocrPage: OcrPage, member: Member } = require('../models');
const { publisher, subscriber } = require('../config/redisConfig');

const clients = new Map();

const OCR_CHANNEL = 'ocr:sse';

const sendToLocalClients = (ocrPageId, event, data) => {
    const pageClients = clients.get(String(ocrPageId)) || [];
    pageClients.forEach(client => {
        client.write(`event: ${event}\n`);
        client.write(`data: ${JSON.stringify(data)}\n\n`);
    });
};

subscriber.subscribe(OCR_CHANNEL).catch((err) => {
    console.error('[Redis:sub] 채널 구독 실패:', err.message);
});

subscriber.on('message', (channel, message) => {
    if (channel !== OCR_CHANNEL) return;
    try {
        const { ocrPageId, event, data } = JSON.parse(message);
        sendToLocalClients(ocrPageId, event, data);
    } catch (err) {
        console.error('[Redis:sub] 메시지 처리 실패:', err.message);
    }
});

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

    const heartbeat = setInterval(() => {
        res.write(': ping\n\n');
    }, 25000);

    req.on('close', () => {
        clearInterval(heartbeat);
        const updated = clients.get(ocrPageId).filter(c => c !== res);
        clients.set(ocrPageId, updated);
    });
};  

exports.broadcast = (ocrPageId, event, data) => {
    const message = JSON.stringify({ ocrPageId: String(ocrPageId), event, data });

    publisher.publish(OCR_CHANNEL, message).catch((err) => {
        console.error('[Redis:pub] 발행 실패, 로컬 전송으로 대체:', err.message);
        sendToLocalClients(ocrPageId, event, data);
    });
};
