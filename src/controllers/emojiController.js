const emojiService = require("../services/emojiService");

/**
 * @swagger
 * tags:
 *   name: Emoji
 *   description: 이모지 반응 관련 API
 */

/**
 * @swagger
 * /api/rooms/{roomId}/reactions:
 *   get:
 *     summary: 페이지별 이모지 조회
 *     description: 특정 쪽수에 있는 모든 이모지를 가져옵니다
 *     tags: [Emoji]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *         example: 159
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - emojiId: 1
 *                   page: 159
 *                   emojiType:
 *                     emojiTypeId: 1
 *                     emojiUrl: "https://emoji.img/surprised.png"
 *                   member:
 *                     memberId: 1
 *                     nickname: "홍길동"
 *                     color: "#FFB6C1"
 */
const getReactions = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { page } = req.query;
        const userId = req.user?.userId;
        const reactions = await emojiService.getReactions(roomId, page, userId);
        return res.status(200).json({ success: true, data: reactions });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


/**
 * @swagger
 * /api/rooms/{roomId}/reactions:
 *   post:
 *     summary: 이모지 반응 추가
 *     description: 5개 이모지 중 선택해서 추가, 이미 추가한 경우 취소(토글)
 *     tags: [Emoji]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emojiTypeId:
 *                 type: integer
 *                 example: 1
 *               page:
 *                 type: integer
 *                 example: 159
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 toggled: true
 *                 emoji:
 *                   emojiId: 1
 *                   memberId: 1
 *                   emojiTypeId: 1
 *                   page: 159
 */
const addReaction = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { emojiTypeId, page } = req.body;
        const userId = req.user.userId;            
        const result = await emojiService.addReaction(roomId, userId, emojiTypeId, page);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/rooms/{roomId}/reactions/{emojiId}:
 *   delete:
 *     summary: 이모지 반응 삭제
 *     description: emojiId로 이모지 삭제
 *     tags: [Emoji]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: emojiId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "이모지가 삭제되었습니다"
 */
const removeReaction = async (req, res) => {
    try {
        const { roomId, emojiId } = req.params;
        const userId = req.user.userId;           
        const result = await emojiService.removeReaction(roomId, userId, emojiId);
        return res.status(200).json({ success: true, message: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getReactions, addReaction, removeReaction };