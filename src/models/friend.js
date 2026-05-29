module.exports = (sequelize, DataTypes) => {
  const Friend = sequelize.define(
    "Friend",
    {
      friendId: {
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
      tableName: "friend",
      timestamps: false,
    }
  );

  Friend.associate = (models) => {
    Friend.belongsTo(models.user, {
      foreignKey: "userId1",
      as: "user1",
    });

    Friend.belongsTo(models.user, {
      foreignKey: "userId2",
      as: "user2",
    });
  };

  return Friend;
};