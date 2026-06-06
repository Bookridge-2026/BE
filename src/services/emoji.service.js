const db = require("../models");
const notificationService = require("./notification.service");
const blockService = require("./blockService");

const EMOJI_CDN = {
    1: "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f62e.svg", // 😮
    2: "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f622.svg", // 😢
    3: "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/2764.svg",  // ❤️
    4: "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f44d.svg", // 👍
    5: "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f525.svg", // 🔥
};

const getMemberByUserId = async (roomId, userId) => {
    const member = await db.member.findOne({
        where: { roomId, userId },
    });
    
    return member;
};

// 페이지별 이모지 조회
const getReactions = async (roomId, page, userId) => {
    if (!page) return [];

    const reactions = await db.emoji.findAll({
        where: { page },
        include: [
            {
                model: db.member,
                as: "member",
                where: { roomId },
                required: true,
                attributes: ["memberId", "color", "userId"],
                include: [{ model: db.user, as: "user", attributes: ["nickname"] }],
            },
            {
                model: db.emojiType,
                as: "emojiType",
                attributes: ["emojiTypeId", "emojiUrl"],
            },
        ],
        order: [["createdAt", "ASC"]],
    });

    const blockedUserIds = userId
        ? await blockService.getBlockedUserIds(userId)
        : [];
    const blockedUserIdSet = new Set(blockedUserIds.map(String));

    return reactions
    .filter((r) => !blockedUserIdSet.has(String(r.member.userId)))
    .map((r) => ({
        emojiId: r.emojiId,
        page: r.page,
        emojiType: {
            emojiTypeId: r.emojiType.emojiTypeId,
            emojiUrl: EMOJI_CDN[r.emojiType.emojiTypeId] ?? r.emojiType.emojiUrl, // CDN 우선, 없으면 DB fallback
        },
        member: {
            memberId: r.member.memberId,
            nickname: r.member.user.nickname,
            color: r.member.color,
        },
    }));
};

// 이모지 추가 (토글)
const addReaction = async (roomId, userId, emojiTypeId, page) => {
    const member = await getMemberByUserId(roomId, userId);
    if (!member) throw new Error("해당 방의 멤버가 아닙니다");

    if (page > member.maxPage) {
        await member.update({ maxPage: page });
    }

    const existing = await db.emoji.findOne({
        where: { memberId: member.memberId, page },
    });

    if (existing) {
        if (existing.emojiTypeId === emojiTypeId) {
            await existing.destroy();
            return { toggled: false, message: "이모지 취소" };
        }
        await existing.update({ emojiTypeId });
        return { toggled: true, emoji: existing };
    }

    // 신규 생성 시에만 알림
    const emoji = await db.emoji.create({
        memberId: member.memberId,
        emojiTypeId,
        page,
    });

    await notificationService.createEmojiNotification({
        emoji,
        senderMemberId: member.memberId,
    }).catch(console.error);

    return { toggled: true, emoji };
};

// 이모지 삭제
const removeReaction = async (roomId, userId, emojiId) => {
    const member = await getMemberByUserId(roomId, userId);
    if (!member) throw new Error("해당 방의 멤버가 아닙니다");

    const emoji = await db.emoji.findOne({
        where: { emojiId, memberId: member.memberId },      
    });
    if (!emoji) throw new Error("이모지를 찾을 수 없습니다");

    await emoji.destroy();
    return "이모지가 삭제되었습니다";
};

module.exports = { getReactions, addReaction, removeReaction };  