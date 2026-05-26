const db = require("../models");

// 방 기본 정보 조회
const getRoomDetail = async (roomId) => {
    const roomData = await db.room.findOne({
        where: { roomId },
        include: [
            {
                model: db.book,             
                as: "book",
                attributes: ["title", "publisher", "thumbnail", "totalPage"],
            },
        ],
        attributes: ["roomId", "state", "startDate", "period"],
    });

    if (!roomData) throw new Error("방을 찾을 수 없습니다");
    return roomData;
};

// 멤버 목록 조회
const getMembers = async (roomId) => {
    const members = await db.member.findAll({  
        where: { roomId },
        attributes: ["memberId", "color", "role", "maxPage", "state"],
        include: [
            {
                model: db.user,              
                as: "user",
                attributes: ["nickname", "profileImageUrl"],
            },
        ],
    });

    if (!members.length) throw new Error("멤버를 찾을 수 없습니다");
    return members;
};

// 멤버 진행률 조회
const getMembersProgress = async (roomId) => {
    const roomData = await db.room.findOne({
        where: { roomId },
        include: [
            {
                model: db.book,             
                as: "book",
                attributes: ["totalPage"],
            },
            {
                model: db.member,      
                as: "members",
                attributes: ["memberId", "color", "maxPage"],
                include: [
                    {
                        model: db.user, 
                        as: "user",
                        attributes: ["nickname", "profileImageUrl"],
                    },
                ],
            },
        ],
    });

    if (!roomData) throw new Error("방을 찾을 수 없습니다");

    const totalPage = roomData.book.totalPage;

    const progress = roomData.members.map((member) => ({  
        memberId: member.memberId,
        nickname: member.user.nickname,
        profileImageUrl: member.user.profileImageUrl,
        color: member.color,
        maxPage: member.maxPage,
        totalPage,
        progressPercent: Math.round((member.maxPage / totalPage) * 100),
    }));

    return progress;
};

module.exports = { getRoomDetail, getMembers, getMembersProgress };