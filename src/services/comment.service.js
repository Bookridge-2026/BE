const db = require("../models");

const getMemberByUserId = async (roomId, userId) => {
    const member = await db.member.findOne({
        where: { roomId, userId },
    });
    if (!member) throw new Error("해당 방의 멤버가 아닙니다");
    return member;
};


const getPages = async (roomId) => {
    const commentPages = await db.comment.findAll({
        attributes: ["page"],
        include: [
            {
                model: db.member,
                as: "member",
                attributes: [],       
                where: { roomId },    
                required: true,       
            },
        ],
        group: ["comment.page"],
    });


    const emojiPages = await db.emoji.findAll({
        attributes: ["page"],
        include: [
            {
                model: db.member,
                as: "member",
                attributes: [],
                where: { roomId },  
                required: true,
            },
        ],
        group: ["emoji.page"],
    });

    const commentPageNums = commentPages.map((c) => c.page);
    const emojiPageNums = emojiPages.map((e) => e.page);

    const allPages = [...new Set([...commentPageNums, ...emojiPageNums])].sort(
        (a, b) => a - b
    );

    return { pages: allPages };


};


// -- 코멘트 CRUD --
const getComments = async (roomId, page) => {
    const where = {};
    if (page) where.page = page;

    const comments = await db.comment.findAll({
        where,
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
                model: db.reply,
                as: "replies",
                attributes: ["replyId"],
            },
        ],
        order: [["createdAt", "ASC"]],
    });

    if (!comments.length) return [];

    return comments.map((c) => ({
        commentId: c.commentId,
        comment: c.isDeleted ? "삭제된 코멘트입니다" : c.comment,
        content: c.isDeleted ? null : c.content,
        page: c.page,
        isDeleted: c.isDeleted,
        member: c.isDeleted ? null : {
            memberId: c.member.memberId,
            nickname: c.member.user.nickname,
            color: c.member.color,
        },
        replyCount: c.replies.length,
    }));
};


// 코멘트 작성
const createComment = async (roomId, userId, page, content, comment) => {
    const member = await getMemberByUserId(roomId, userId);
    if (!member) throw new Error("해당 방의 멤버가 아닙니다");

    const newComment = await db.comment.create({
        comment,
        content,
        page,
        memberId: member.memberId,
        isDeleted: false,
    });

    return newComment;
};

// 코멘트 수정 (comment만 수정, content는 수정 X)
const updateComment = async (roomId, userId, commentId, comment) => {
    const member = await getMemberByUserId(roomId, userId);  

    const targetComment = await db.comment.findOne({
        where: { commentId, memberId: member.memberId },     
    });
    if (!targetComment) throw new Error("코멘트를 찾을 수 없습니다");
    if (targetComment.isDeleted) throw new Error("삭제된 코멘트입니다");

    await targetComment.update({ comment });
    return targetComment;
};


// 코멘트 삭제 (soft delete / hard delete 자동 판단)
const deleteComment = async (roomId, userId, commentId) => {
    const member = await getMemberByUserId(roomId, userId);  

    const targetComment = await db.comment.findOne({
        where: { commentId, memberId: member.memberId },  
        include: [{ model: db.reply, as: "replies" }],
    });
    if (!targetComment) throw new Error("코멘트를 찾을 수 없습니다");

    if (targetComment.replies.length > 0) {
        await targetComment.update({ isDeleted: true, comment: "삭제된 코멘트입니다" });
    } else {
        await targetComment.destroy();
    }
    return "코멘트가 삭제되었습니다";
};


// -- 대댓글 CRD --
// 대댓글 목록 조회
const getReplies = async (commentId) => {
    const replies = await db.reply.findAll({
        where: { commentId },
        include: [
            {
                model: db.member,
                as: "member",
                attributes: ["memberId", "color"],
                include: [
                    {
                        model: db.user,
                        as: "user",
                        attributes: ["nickname"],
                    },
                ],
            },
        ],
        order: [["createdAt", "ASC"]],
    });

    return replies.map((r) => ({
        replyId: r.replyId,
        content: r.content,
        createdAt: r.createdAt,
        member: {
            memberId: r.member.memberId,
            nickname: r.member.user.nickname,
            color: r.member.color,
        },
    }));
};

// 대댓글 작성
const createReply = async (roomId, userId, commentId, content) => {
    const member = await getMemberByUserId(roomId, userId);  
    const comment = await db.comment.findOne({ where: { commentId } });
    if (!comment) throw new Error("코멘트를 찾을 수 없습니다");
    if (comment.isDeleted) throw new Error("삭제된 코멘트에는 대댓글을 달 수 없습니다");

    const reply = await db.reply.create({
        content,
        memberId: member.memberId,  
        commentId,
    });
    return reply;
};

// 대댓글 삭제
const deleteReply = async (roomId, userId, commentId, replyId) => {
    const member = await getMemberByUserId(roomId, userId); 

    const reply = await db.reply.findOne({
        where: { replyId, commentId, memberId: member.memberId },  
    });
    if (!reply) throw new Error("대댓글을 찾을 수 없습니다");

    await reply.destroy();

    const remainingReplies = await db.reply.count({ where: { commentId } });
    if (remainingReplies === 0) {
        const comment = await db.comment.findOne({ where: { commentId } });
        if (comment && comment.isDeleted) {
            await comment.destroy();
        }
    }
    return "대댓글이 삭제되었습니다";
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