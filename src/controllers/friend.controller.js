const friendService = require("../services/friend.service");

/**
 * @swagger
 * tags:
 *   name: Friend
 *   description: 친구 관련 API
 */

/**
 * @swagger
 * /api/friends/requests:
 *   post:
 *     summary: 친구 요청 보내기
 *     description: 다른 유저에게 친구 요청을 보냅니다.
 *     tags: [Friend]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *             properties:
 *               receiverId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: 친구 요청 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 친구 요청을 보냈습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     friendRequestId:
 *                       type: integer
 *                       example: 1
 *       500:
 *         description: 서버 오류
 */

const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId } = req.body;

    const friendRequest = await friendService.sendFriendRequest(
      senderId,
      receiverId
    );

    return res.status(201).json({
      success: true,
      message: "친구 요청을 보냈습니다.",
      data: {
        friendRequestId: friendRequest.friendRequestId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * @swagger
 * /api/friends/requests:
 *   get:
 *     summary: 받은 친구 요청 목록 조회
 *     description: 내가 받은 친구 요청 목록을 조회합니다.
 *     tags: [Friend]
 *     responses:
 *       200:
 *         description: 요청 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     requests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           friendRequestId:
 *                             type: integer
 *                             example: 1
 *                           sender:
 *                             type: object
 *                             properties:
 *                               userId:
 *                                 type: integer
 *                                 example: 2
 *                               nickname:
 *                                 type: string
 *                                 example: 홍길동
 *                               userCode:
 *                                 type: string
 *                                 example: a1b2c3d4
 *                               profileImageUrl:
 *                                 type: string
 *                                 nullable: true
 *                                 example: https://lh3.googleusercontent.com/...
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: 2024-05-29T12:34:56.000Z
 *       500:
 *         description: 서버 오류
 */

const getReceivedFriendRequests = async (req, res) => {
  try {
    const receiverId = req.user.userId;

    const requests = await friendService.getReceivedFriendRequests(receiverId);

    return res.status(200).json({
      success: true,
      data: {
        requests,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * @swagger
 * /api/friends/requests/{friendRequestId}/accept:
 *   patch:
 *     summary: 친구 요청 수락
 *     description: 받은 친구 요청을 수락합니다.
 *     tags: [Friend]
 *     parameters:
 *       - in: path
 *         name: friendRequestId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 친구 요청 ID
 *     responses:
 *       200:
 *         description: 친구 요청 수락 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 친구 요청을 수락했습니다.
 *       500:
 *         description: 서버 오류
 */

const acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendRequestId } = req.params;

    const message = await friendService.acceptFriendRequest(friendRequestId, userId);

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * @swagger
 * /api/friends/requests/{friendRequestId}/reject:
 *   patch:
 *     summary: 친구 요청 거절
 *     description: 받은 친구 요청을 거절합니다.
 *     tags: [Friend]
 *     parameters:
 *       - in: path
 *         name: friendRequestId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 친구 요청 ID
 *     responses:
 *       200:
 *         description: 친구 요청 거절 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 친구 요청을 거절했습니다.
 *       500:
 *         description: 서버 오류
 */

const rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendRequestId } = req.params;

    const message = await friendService.rejectFriendRequest(friendRequestId, userId);

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * @swagger
 * /api/friends:
 *   get:
 *     summary: 친구 목록 조회
 *     description: 내 친구 목록을 조회합니다.
 *     tags: [Friend]
 *     responses:
 *       200:
 *         description: 친구 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     friends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           friendId:
 *                             type: integer
 *                             example: 1
 *                           userId:
 *                             type: integer
 *                             example: 2
 *                           nickname:
 *                             type: string
 *                             example: 홍길동
 *                           userCode:
 *                             type: string
 *                             example: a1b2c3d4
 *                           profileImageUrl:
 *                             type: string
 *                             nullable: true
 *                             example: https://lh3.googleusercontent.com/...
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: 2024-05-29T12:34:56.000Z
 *       500:
 *         description: 서버 오류
 */

const getFriends = async (req, res) => {
  try {
    const userId = req.user.userId;

    const friends = await friendService.getFriends(userId);

    return res.status(200).json({
      success: true,
      data: {
        friends,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * @swagger
 * /api/friends/users/{userId}:
 *   delete:
 *     summary: 친구 삭제
 *     description: 친구를 삭제합니다.
 *     tags: [Friend]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 삭제할 친구의 userId
 *     responses:
 *       200:
 *         description: 친구 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 친구를 삭제했습니다.
 *       500:
 *         description: 서버 오류
 */

const deleteFriend = async (req, res) => {
  try {
    const myId = req.user.userId;
    const { userId } = req.params;

    const message = await friendService.deleteFriend(myId, userId);

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  sendFriendRequest,
  getReceivedFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  deleteFriend,
};