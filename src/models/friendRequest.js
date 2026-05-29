module.exports = (sequelize, DataTypes) => {
  const FriendRequest = sequelize.define(
    "FriendRequest",
    {
      friendRequestId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      status: {
        type: DataTypes.ENUM("PENDING", "ACCEPTED", "REJECTED"),
        allowNull: false,
        defaultValue: "PENDING",
      },

      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "friendRequest",
      timestamps: false,
    }
  );

  FriendRequest.associate = (models) => {
    FriendRequest.belongsTo(models.user, {
      foreignKey: "senderId",
      as: "sender",
    });

    FriendRequest.belongsTo(models.user, {
      foreignKey: "receiverId",
      as: "receiver",
    });
  };

  return FriendRequest;
};