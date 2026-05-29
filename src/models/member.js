module.exports = (sequelize, DataTypes) =>{
    const Member = sequelize.define(
        "Member",
        {
            memberId:{
                type: DataTypes.BIGINT,
                primaryKey : true,
                autoIncrement : true,
                allowNull : false,
                comment: "멤버아이디",
            },
            state:{
                type : DataTypes.ENUM("invited","attend"),
                allowNull: false,
                comment:"상태",
            },
            particTime:{
                type: DataTypes.DATE,
                allowNull: false,
                comment: "참여시간",
            },
            role: {
                type: DataTypes.ENUM("leader", "member"),
                allowNull: false,
                comment: "역할",
            },
            ocrChance: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: "OCR페이지생성기회",
            },
            maxPage: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: "최대 읽은 페이지",
            },
            color: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: "고유색",
            },
        },
        {
            tableName: "member",
            timestamps: true,  
        }
    );

     Member.associate = (models) => {

        Member.belongsTo(models.user, {
            foreignKey: "userId",
            as: "user",
        });

        Member.belongsTo(models.room, {
            foreignKey: "roomId",
            as: "room",
        });
        
        Member.hasMany(models.comment, {
            foreignKey: "memberId",
            as: "comments",
        });
        
        Member.hasMany(models.reply, {
            foreignKey: "memberId",
            as: "replies",
        });

        Member.hasMany(models.emoji, {
            foreignKey: "memberId",
            as: "emojis",
        });

        Member.hasMany(models.ocrComment, { foreignKey: 'memberId' });
     };
     return Member;
}