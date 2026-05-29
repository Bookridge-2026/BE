const { member: Member } = require('../models');

exports.isMember = async (req, res, next) => {
    try {
        const {roomId} = req.params;
        const userId = req.user.userId;
        const member = await Member.findOne({ where: { userId, roomId, state: 'attend' } });
        if (!member) {
        return res.status(404).json({
            success: false,
            message: '존재하지 않는 멤버입니다.',
            error: { code: 'MEMBER_NOT_FOUND' }
        });
        }

        req.member = member;
        next();
    } catch (err) {
        res.status(500).json({ success: false, code:err.code, message: err.message });
    }
};