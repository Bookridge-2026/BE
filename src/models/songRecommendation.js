module.exports = (sequelize, DataTypes) => {
  const SongRecommendation = sequelize.define(
    "SongRecommendation",
    {
      songRecommendationId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      artist: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "songRecommendation",
      timestamps: false,
    }
  );

  SongRecommendation.associate = (models) => {
    SongRecommendation.belongsTo(models.room, {
      foreignKey: "roomId",
      as: "room",
    });
  };

  return SongRecommendation;
};