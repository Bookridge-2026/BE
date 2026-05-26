// 지금은 에러 안나게 빈 함수만

const kickMember = async (req, res) => {
    return res.status(200).json({ success: true, message: "준비중" });
};

module.exports = { kickMember };