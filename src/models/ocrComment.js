const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const OcrComment = sequelize.define('ocrComment', {
        ocrCommentId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        comment: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        memberId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'member',  
                key: 'memberId',
            },
        },
        ocrHighlightId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'ocrHighlight', 
                key: 'ocrHighlightId',
            },
        },
    }, {
        tableName: 'ocrComment',
        timestamps: true,
    });

    OcrComment.associate = (models) => {
        OcrComment.belongsTo(models.ocrHighlight, { foreignKey: 'ocrHighlightId' });
        OcrComment.belongsTo(models.member, { foreignKey: 'memberId' });
    };

    return OcrComment;
};