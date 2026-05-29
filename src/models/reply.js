module.exports = (sequelize, DataTypes) => {
    const Reply = sequelize.define(
        "Reply",
        {
            replyId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            comment: "대댓글아이디" 
        },

            content:{
                type : DataTypes.STRING,
                allowNull : false,
                comment : "내용",
            },
            isDeleted : {
                type : DataTypes.TINYINT(1),
                allowNull : false,
                defaultValue: 0,
                comment: "삭제여부",
            },
        },
            {
                tableName: "reply",
                timestamps: true,
                updateAt : false,
            }
        
    );

    Reply.associate = (models) => {
        Reply.belongsTo(models.comment, {
            foreignKey: "commentId",
            as: "comment",
        });

        Reply.belongsTo(models.member, {  
            foreignKey: "memberId",
            as: "member",
        });
    };
    return Reply;
};