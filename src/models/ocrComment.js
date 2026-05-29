const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const OcrComment = sequelize.define('ocrComment', {
        ocrCommentId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        startIndex: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        endIndex: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
        ocrPageId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'ocrPage', 
                key: 'ocrPageId',
            },
        },
    }, {
        tableName: 'ocrComment',
        timestamps: true,
    });

    OcrComment.associate = (models) => {
        OcrComment.belongsTo(models.ocrPage, { foreignKey: 'ocrPageId' });
        OcrComment.belongsTo(models.member, { foreignKey: 'memberId' });
    };

    return OcrComment;
};