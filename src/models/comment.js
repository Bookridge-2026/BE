module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    "Comment",
    {
      commentId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: "코멘트아이디",
      },
      comment: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "코멘트내용",
      },
      page: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "쪽수",
      },
      content: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "책 구절",
      },
      isDeleted: {
        type: DataTypes.TINYINT(1),
        allowNull: false,
        defaultValue: 0,
        comment: "삭제여부",
      },
    },
    {
      tableName: "comment",       
      timestamps: true,           
    }
  );

  Comment.associate = (models) => {
    Comment.belongsTo(models.member, {
      foreignKey: "memberId",
      as: "member",
    });

    Comment.hasMany(models.reply, {
      foreignKey: "commentId",
      as: "replies",
    });
  };

  return Comment;
};