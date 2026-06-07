const { 
  notification: Notification, 
  user: User, 
  member: Member, 
  comment: Comment, 
  reply: Reply, 
  emoji: Emoji, 
  ocrHighlight: OcrHighlight, 
  ocrPage: OcrPage, 
  room: Room, 
  book: Book 
} = require("../models");
const blockService = require("../services/blockService");



/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "서버 오류"
 *     NotificationUser:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           example: "5"
 *         nickname:
 *           type: string
 *           example: "이수민"
 *         roomColor:
 *           type: string
 *           nullable: true
 *           example: "#afa9ec"
 *     NotificationBook:
 *       type: object
 *       properties:
 *         isbn:
 *           type: string
 *           example: "9788936434267"
 *         title:
 *           type: string
 *           example: "채식주의자"
 *         roomId:
 *           type: string
 *           example: "12"
 *         page:
 *           type: integer
 *           example: 45
 *     NotificationItem:
 *       type: object
 *       properties:
 *         notificationId:
 *           type: string
 *           example: "101"
 *         type:
 *           type: string
 *           enum: [comment, reply, emoji, ocr, friend_request, friend_accepted]
 *         isRead:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         user:
 *           $ref: '#/components/schemas/NotificationUser'
 *         book:
 *           nullable: true
 *           $ref: '#/components/schemas/NotificationBook'
 *         preview:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * tags:
 *   name: Notification
 *   description: 알림 관련 API
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: 알림 목록 조회
 *     description: 로그인한 유저의 알림을 새 알림(isRead=false)과 이전 알림(isRead=true)으로 분리해서 반환합니다.
 *     tags: [Notification]
 *     responses:
 *       200:
 *         description: 알림 목록 조회 성공
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
 *                     newNotifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/NotificationItem'
 *                     oldNotifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/NotificationItem'
 *       401:
 *         description: 로그인 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.getNotifications = async (req, res) => {
  try {
    const receiverUserId = req.user.userId;
    const blockedUserIds = await blockService.getBlockedUserIds(receiverUserId);
    const blockedUserIdSet = new Set(blockedUserIds.map(String));

    const notifications = await Notification.findAll({
      where: { receiverUserId },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Member,
          as: "senderMember",
          attributes: ["memberId", "color"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["userId", "nickname"],
            },
            {
              model: Room,
              as: "room",
              attributes: ["roomId"],
              include: [{ model: Book, as: "book", attributes: ["isbn", "title"] }],
            },
          ],
        },
        {
          model: User,
          as: "senderUser",
          attributes: ["userId", "nickname"],
        },
        {
          model: Comment,
          as: "comment",
          attributes: ["commentId", "comment", "page"],
          required: false,
        },
        {
          model: Reply,
          as: "reply",
          attributes: ["replyId", "content"],
          required: false,
          include: [
            {
              model: Comment,
              as: "comment",
              attributes: ["commentId", "page"],
            },
          ],
        },
        {
          model: Emoji,
          as: "emoji",
          attributes: ["emojiId", "page"],
          required: false,
        },
        {
          model: OcrHighlight,
          as: "ocrHighlight",
          attributes: ["ocrHighlightId"],
          required: false,
          include: [
            {
              model: OcrPage,
              as: "ocrPage",
              attributes: ["ocrPageId", "page", "roomId"],
            },
          ],
        },
      ],
    });

    const formatted = notifications
      .filter((n) => {
        const senderId = n.senderUser?.userId ?? n.senderMember?.user?.userId;
        if (!senderId) return true;
        return !blockedUserIdSet.has(String(senderId));
      })
      .map((n) => formatNotification(n));

    return res.status(200).json({
      success: true,
      data: {
        newNotifications: formatted.filter((n) => !n.isRead),
        oldNotifications: formatted.filter((n) => n.isRead),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
};

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   patch:
 *     summary: 단건 읽음 처리
 *     description: 알림 항목 클릭 시 호출. 본인 알림이 아니면 404를 반환합니다.
 *     tags: [Notification]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 101
 *         description: 읽음 처리할 알림 ID
 *     responses:
 *       200:
 *         description: 읽음 처리 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: 로그인 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 알림 없음 (본인 알림이 아니거나 존재하지 않음)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "알림을 찾을 수 없습니다."
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.readNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const receiverUserId = req.user.userId;

    const notification = await Notification.findOne({
      where: { notificationId, receiverUserId },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "알림을 찾을 수 없습니다." });
    }

    await notification.update({ isRead: 1 });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
};

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: 전체 읽음 처리
 *     description: 로그인 유저의 읽지 않은 알림을 전부 읽음 처리합니다.
 *     tags: [Notification]
 *     responses:
 *       200:
 *         description: 전체 읽음 처리 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: 로그인 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
exports.readAllNotifications = async (req, res) => {
  try {
    const receiverUserId = req.user.userId;

    await Notification.update(
      { isRead: 1 },
      { where: { receiverUserId, isRead: 0 } }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
};



function formatNotification(n) {
  const base = {
    notificationId: String(n.notificationId),
    type: n.type,
    isRead: !!n.isRead,
    createdAt: n.createdAt,
  };

  if (n.type === "friend_request" || n.type === "friend_accepted") {
    return {
        ...base,
        user: {
        userId: String(n.senderUser?.userId),
        nickname: n.senderUser?.nickname,
        roomColor: null,
        },
        book: null,
        preview: null,
    };
    }

  const sender = n.senderMember;
  const roomId = sender?.room?.roomId;
  const book = sender?.room?.book;

  let page = null;
  let preview = null;

  if (n.type === "comment" && n.comment) {
    page = n.comment.page;
    preview = n.comment.comment;
  } else if (n.type === "reply" && n.reply) {
    page = n.reply.comment?.page ?? null;
    preview = n.reply.content;
  } else if (n.type === "emoji" && n.emoji) {
    page = n.emoji.page;
    preview = null;
  } else if (n.type === "ocr" && n.ocrHighlight?.ocrPage) {
    page = n.ocrHighlight.ocrPage.page;
    preview = null;
  }

  return {
    ...base,
    user: {
      userId: String(sender?.user?.userId),
      nickname: sender?.user?.nickname,
      roomColor: sender?.color ?? null,
    },
    book: book
      ? { isbn: book.isbn, title: book.title, roomId: String(roomId), page }
      : null,
    preview,
  };
}