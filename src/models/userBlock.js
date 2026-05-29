module.exports = (sequelize, DataTypes) => {
  const UserBlock = sequelize.define(
    "UserBlock",
    {
      blockId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "userBlock",
      timestamps: false,
    }
  );

  UserBlock.associate = (models) => {
    UserBlock.belongsTo(models.user, {
      foreignKey: "blockerId",
      as: "blocker",
    });

    UserBlock.belongsTo(models.user, {
      foreignKey: "blockedUserId",
      as: "blockedUser",
    });
  };

  return UserBlock;
};