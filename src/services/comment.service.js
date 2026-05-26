const db = require("../models");

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

module.exports = { getPages };