const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OcrHighlight = sequelize.define('ocrHighlight', {
    ocrHighlightId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    selectedText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    startIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    endIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ocrPageId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'ocrPage',
        key: 'ocrPageId',
      },
    },
  }, {
    tableName: 'ocrHighlight',
    timestamps: true,
  });

  OcrHighlight.associate = (models) => {
    OcrHighlight.belongsTo(models.ocrPage, { foreignKey: 'ocrPageId' });
    OcrHighlight.hasMany(models.ocrComment, { foreignKey: 'ocrHighlightId' })
  };

  return OcrHighlight;
};