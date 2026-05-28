const userService = require("../services/user.service");

const searchUserByCode = async (req, res) => {
  try {
    const myId = req.user.userId;
    const { userCode } = req.query;

    const result = await userService.searchUserByCode(myId, userCode);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  searchUserByCode,
};