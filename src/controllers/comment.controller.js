const commentService = require("../services/comment.service");

/**
 * @swagger
 * /api/rooms/{roomId}/pages:
 *   get:
 *     summary: 페이지 목록 조회
 *     description: 코멘트 또는 이모지가 있는 페이지 번호 목록을 조회합니다
 *     tags: [Comment]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 pages: [23, 45, 159]
 */
const getPages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const pages = await commentService.getPages(roomId);
        return res.status(200).json({ success: true, data: pages });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getComments = async (req, res) => {
    return res.status(200).json({ success: true, message: "준비중" });
};
const createComment = async (req, res) => {
    return res.status(200).json({ success: true, message: "준비중" });
};
const updateComment = async (req, res) => {
    return res.status(200).json({ success: true, message: "준비중" });
};
const deleteComment = async (req, res) => {
    return res.status(200).json({ success: true, message: "준비중" });
};
const getReplies = async (req, res) => {
    return res.status(200).json({ success: true, message: "준비중" });
};
const createReply = async (req, res) => {
    return res.status(200).json({ success: true, message: "준비중" });
};
const deleteReply = async (req, res) => {
    return res.status(200).json({ success: true, message: "준비중" });
};

module.exports = {
    getPages,
    getComments,
    createComment,
    updateComment,
    deleteComment,
    getReplies,
    createReply,
    deleteReply,
};