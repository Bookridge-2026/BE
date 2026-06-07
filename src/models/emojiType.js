module.exports = (sequelize, DataTypes) =>{
    const EmojiType = sequelize.define(
        "EmojiType",
        {
            emojiTypeId:{
                type: DataTypes.BIGINT,
                primaryKey : true,
                autoIncrement : true,
                allowNull : false,
                comment: "이모지종류아이디",
            },
            emojiUrl: {
                type: DataTypes.STRING,
                allowNull: true,       
                defaultValue: "none",  
                comment: "이모지URL",
                },
            },
        {
            tableName: "emojitype",
            timestamps: false,
        }
    );

    
    EmojiType.associate = (models) => {
    
    EmojiType.hasMany(models.emoji, {   
        foreignKey: "emojiTypeId",
        as: "emojis",
    });
};
    return EmojiType;
}