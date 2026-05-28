const db = require("../models");


const getMemberByUserId = async (roomId, userId) => {
    const member = await db.member.findOne({
        where: { roomId, userId },
    });
    if (!member) throw new Error("해당 방의 멤버가 아닙니다");
    return member;
};

/*
이모지 그냥 cdn으로 넣어버릴까... 
UPDATE emojiType SET emojiUrl = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f62e.svg' WHERE emojiTypeId = 1; -- 😮
UPDATE emojiType SET emojiUrl = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f622.svg' WHERE emojiTypeId = 2; -- 😢
UPDATE emojiType SET emojiUrl = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/2764.svg'  WHERE emojiTypeId = 3; -- ❤️
UPDATE emojiType SET emojiUrl = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f44d.svg' WHERE emojiTypeId = 4; -- 👍
UPDATE emojiType SET emojiUrl = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f525.svg' WHERE emojiTypeId = 5; -- 🔥
*/

// 페이지별 이모지 조회
const getReactions = async (roomId, page) => {
    if (!page) return [];

    const reactions = await db.emoji.findAll({
        where: { page },
        include: [
            {
                model: db.member,
                as: "member",
                where: { roomId },
                required: true,
                attributes: ["memberId", "color"],
                include: [
                    {
                        model: db.user,
                        as: "user",
                        attributes: ["nickname"],
                    },
                ],
            },
            {
                model: db.emojiType,
                as: "emojiType",
                attributes: ["emojiTypeId", "emojiUrl"],
            },
        ],
        order: [["createdAt", "ASC"]],
    });

    return reactions.map((r) => ({
        emojiId: r.emojiId,
        page: r.page,
        emojiType: {
            emojiTypeId: r.emojiType.emojiTypeId,
            emojiUrl: r.emojiType.emojiUrl,
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

    const emoji = await db.emoji.create({
        memberId: member.memberId,
        emojiTypeId,
        page,
    });
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