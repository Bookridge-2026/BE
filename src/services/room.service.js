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

// 참여 중인 방 조회 (홈)
// service/roomService.js

const getJoinedRooms = async (userId) => {
    const today = new Date();

    const rooms = await db.room.findAll({
        include: [
            {
                model: db.member,
                as: "members",
                where: { userId, state: "attend" },
                attributes: ["maxPage"],
            },
            {
                model: db.book,
                as: "book",
                attributes: ["title", "author", "publisher", "thumbnail", "totalPage"],
            },
            {
                model: db.member,
                as: "allMembers",
                where: { state: "attend" },
                attributes: ["color"],
                include: [
                    {
                        model: db.user,
                        as: "user",
                        attributes: ["profileImageUrl"],
                    },
                ],
            },
        ],
        attributes: ["roomId", "state", "startDate", "period", "atLeastPeople"],
    });

    if (rooms.length === 0) throw new Error("참여 중인 방이 없습니다");

    return rooms.map((room) => {
        const myMember = room.members[0];
        const totalPages = room.book.totalPage;
        const maxReadPage = myMember.maxPage;

        // 독서 진행률 계산
        const progressRate = totalPages > 0
            ? Math.floor((maxReadPage / totalPages) * 100)
            : 0;

        // 남은 일수 계산 (ongoing일 때만)
        let daysLeft = null;
        if (room.state === "ongoing" && room.startDate) {
            const endDate = new Date(room.startDate);
            endDate.setDate(endDate.getDate() + room.period);
            daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        }

        // 멤버 프로필 이미지
        const memberProfiles = room.allMembers.map((m) => ({
            profileImageUrl: m.user.profileImageUrl,
            color: m.color,
        }));

        return {
            roomId: room.roomId,
            state: room.state,
            book: {
                title: room.book.title,
                author: room.book.author,
                publisher: room.book.publisher,
                thumbnail: room.book.thumbnail,
            },
            period: room.period,
            ...(room.state === "ongoing" && { daysLeft }),
            atLeastPeople: room.atLeastPeople,
            progressRate,
            maxReadPage,
            totalPages,
            memberProfiles,
        };
    });
};

module.exports = { getRoomDetail, getMembers, getMembersProgress, getJoinedRooms };