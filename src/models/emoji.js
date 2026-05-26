module.exports = (sequelize, DataTypes) =>{
    const Emoji = sequelize.define(
        "Emoji",
        {
            emojiId:{
                type: DataTypes.BIGINT,
                primaryKey : true,
                autoIncrement : true,
                allowNull : false,
                comment: "이모지아이디",
            },
            page:{
                type : DataTypes.INTEGER,
                allowNull: false,
                comment:"쪽수",
            },
        },
        {
            tableName: "emoji",
            timestamps: true,
        }
    );

    Emoji.associate = (models)=> {
        Emoji.belongsTo(models.member, {
            foreignKey: "memberId",
            as: "member",
        });

        Emoji.belongsTo(models.emojiType, { 
            foreignKey: "emojiTypeId",
            as: "emojiType",
        });
    };
    return Emoji;
}