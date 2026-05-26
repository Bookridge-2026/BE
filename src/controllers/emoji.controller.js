// 이모지 API는 나중에 구현 예정
// 지금은 에러 안나게 빈 함수만

const addReaction = async (req, res) => {
    return res.status(200).json({ success: true, message: "준비중" });
};

const removeReaction = async (req, res) => {
    return res.status(200).json({ success: true, message: "준비중" });
};

module.exports = { addReaction, removeReaction };