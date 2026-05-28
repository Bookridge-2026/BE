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


// -- 코멘트 CRUD -- 


/**
 * @swagger
 * /api/rooms/{roomId}/comments:
 *   get:
 *     summary: 코멘트 목록 조회
 *     description: 특정 페이지의 코멘트 목록을 조회합니다
 *     tags: [Comment]
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
 *                 - commentId: 1
 *                   comment: "오 캡틴 마이 캡틴"
 *                   content: "오, 선장님! 나의 선장님!"
 *                   page: 159
 *                   isDeleted: false
 *                   member:
 *                     memberId: 1
 *                     nickname: "홍길동"
 *                     color: "#FFB6C1"
 *                   replyCount: 2
 */
const getComments = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { page } = req.query;   
        const comments = await commentService.getComments(roomId, page);
        return res.status(200).json({ success: true, data: comments });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/rooms/{roomId}/comments:
 *   post:
 *     summary: 코멘트 작성
 *     description: 페이지 수 입력 후 책 구절과 코멘트 작성
 *     tags: [Comment]
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
 *               page:
 *                 type: integer
 *                 example: 159
 *               content:
 *                 type: string
 *                 example: "오, 선장님! 나의 선장님!"
 *               comment:
 *                 type: string
 *                 example: "오 캡틴 마이 캡틴"
 *     responses:
 *       201:
 *         description: 생성 성공
 */
const createComment = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { page, content, comment } = req.body;
        
        const userId = req.user.userId;
        const newComment = await commentService.createComment(roomId, page, content, comment);
        return res.status(201).json({ success: true, data: newComment });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/rooms/{roomId}/comments/{commentId}:
 *   patch:
 *     summary: 코멘트 수정
 *     description: 구절(content)은 수정 불가, 코멘트(comment)만 수정 가능
 *     tags: [Comment]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: commentId
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
 *               comment:
 *                 type: string
 *                 example: "수정된 코멘트 내용"
 *     responses:
 *       200:
 *         description: 수정 성공
 */
const updateComment = async (req, res) => {
    try {
        const { roomId, commentId } = req.params;
        const { comment } = req.body;
        const userId = req.user.userId;            
        const updated = await commentService.updateComment(roomId, userId, commentId, comment);
        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
  // comment만 받음! content는 수정 X


/**
 * @swagger
 * /api/rooms/{roomId}/comments/{commentId}:
 *   delete:
 *     summary: 코멘트 삭제
 *     description: 대댓글 있으면 soft delete, 없으면 hard delete
 *     tags: [Comment]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 삭제 성공
 */
const deleteComment = async (req, res) => {
    try {
        const { roomId, commentId } = req.params;
        const userId = req.user.userId;         
        const result = await commentService.deleteComment(roomId, userId, commentId);
        return res.status(200).json({ success: true, message: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// -- 대댓글 CRD --
/**
 * @swagger
 * /api/rooms/{roomId}/comments/{commentId}/replies:
 *   get:
 *     summary: 대댓글 목록 조회
 *     description: 해당 코멘트의 대댓글을 모두 가져옵니다
 *     tags: [Comment]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: commentId
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
 *                 - replyId: 1
 *                   content: "영크크 말고 영크크"
 *                   member:
 *                     memberId: 2
 *                     nickname: "정바미"
 *                     color: "#FFD700"
 *                   createdAt: "2024-01-01T00:00:00.000Z"
 */
const getReplies = async (req, res) => {
    try {
        const { commentId } = req.params;
        const replies = await commentService.getReplies(commentId);
        return res.status(200).json({ success: true, data: replies });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/rooms/{roomId}/comments/{commentId}/replies:
 *   post:
 *     summary: 대댓글 작성
 *     tags: [Comment]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: commentId
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
 *               content:
 *                 type: string
 *                 example: "영크크 말고 영크크"
 *     responses:
 *       201:
 *         description: 생성 성공
 */
const createReply = async (req, res) => {
    try {
        const { roomId, commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;           
        const reply = await commentService.createReply(roomId, userId, commentId, content);
        return res.status(201).json({ success: true, data: reply });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * @swagger
 * /api/rooms/{roomId}/comments/{commentId}/replies/{replyId}:
 *   delete:
 *     summary: 대댓글 삭제
 *     description: 대댓글 삭제 후 남은 대댓글 없고 코멘트가 soft delete 상태면 코멘트도 삭제
 *     tags: [Comment]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 삭제 성공
 */
const deleteReply = async (req, res) => {
    try {
        const { roomId, commentId, replyId } = req.params;
        const userId = req.user.userId;         
        const result = await commentService.deleteReply(roomId, userId, commentId, replyId);
        return res.status(200).json({ success: true, message: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
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