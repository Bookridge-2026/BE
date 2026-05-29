const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const OcrPage = sequelize.define('ocrPage', {
        ocrPageId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        page: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        roomId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'room', 
                key: 'roomId',
            },
        },
    }, {
        tableName: 'ocrPage',
        timestamps: true,
    });

    OcrPage.associate = (models) => {
        OcrPage.belongsTo(models.room, { foreignKey: 'roomId' });
        OcrPage.hasMany(models.ocrComment, { foreignKey: 'ocrPageId' });
    };

    return OcrPage;
};