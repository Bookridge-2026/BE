const friendService = require("../services/friend.service");

const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId } = req.body;

    const friendRequest = await friendService.sendFriendRequest(
      senderId,
      receiverId
    );

    return res.status(201).json({
      success: true,
      message: "친구 요청을 보냈습니다.",
      data: {
        friendRequestId: friendRequest.friendRequestId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getReceivedFriendRequests = async (req, res) => {
  try {
    const receiverId = req.user.userId;

    const requests = await friendService.getReceivedFriendRequests(receiverId);

    return res.status(200).json({
      success: true,
      data: {
        requests,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendRequestId } = req.params;

    const message = await friendService.acceptFriendRequest(friendRequestId, userId);

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendRequestId } = req.params;

    const message = await friendService.rejectFriendRequest(friendRequestId, userId);

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFriends = async (req, res) => {
  try {
    const userId = req.user.userId;

    const friends = await friendService.getFriends(userId);

    return res.status(200).json({
      success: true,
      data: {
        friends,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteFriend = async (req, res) => {
  try {
    const myId = req.user.userId;
    const { userId } = req.params;

    const message = await friendService.deleteFriend(myId, userId);

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  sendFriendRequest,
  getReceivedFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  deleteFriend,
};