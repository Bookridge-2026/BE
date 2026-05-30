module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      notificationId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: "알림아이디",
      },

      receiverUserId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: "알림 수신 유저",
        references: { model: "user", key: "userId" },
      },

      senderMemberId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: "행동을 한 멤버 (room 내 — color 참조용)",
        references: { model: "member", key: "memberId" },
      },

      senderUserId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: "친구 신청 발신 유저",
        references: { model: "user", key: "userId" },
      },

      type: {
        type: DataTypes.ENUM("comment", "reply", "emoji", "ocr", "friend_request", "friend_accepted"),
        allowNull: false,
        comment: "알림 종류",
      },
      isRead: {
        type: DataTypes.TINYINT(1),
        allowNull: false,
        defaultValue: 0,
        comment: "읽음 여부",
      },

      commentId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: "type=comment 일 때",
        references: { model: "comment", key: "commentId" },
      },

      replyId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: "type=reply 일 때",
        references: { model: "reply", key: "replyId" },
      },

      emojiId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: "type=emoji 일 때",
        references: { model: "emoji", key: "emojiId" },
      },

      ocrHighlightId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: "type=ocr 일 때 (ocrHighlight 기준)",
        references: { model: "ocrHighlight", key: "ocrHighlightId" },
      },
    },
    {
      tableName: "notification",
      timestamps: true,
      updatedAt: false,
    }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.user, {
      foreignKey: "receiverUserId",
      as: "receiver",
    });

    Notification.belongsTo(models.member, {
      foreignKey: "senderMemberId",
      as: "senderMember",
    });

    Notification.belongsTo(models.user, {
      foreignKey: "senderUserId",
      as: "senderUser",
    });

    Notification.belongsTo(models.comment, {
      foreignKey: "commentId",
      as: "comment",
    });

    Notification.belongsTo(models.reply, {
      foreignKey: "replyId",
      as: "reply",
    });

    Notification.belongsTo(models.emoji, {
      foreignKey: "emojiId",
      as: "emoji",
    });

    Notification.belongsTo(models.ocrHighlight, {
      foreignKey: "ocrHighlightId",
      as: "ocrHighlight",
    });
  };

  return Notification;
};