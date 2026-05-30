module.exports = (sequelize, DataTypes) => {
    const Room = sequelize.define(
        "Room",
        {
            roomId: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                comment: "방아이디",
            },
            period: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: "교환독서기간",
            },
            atLeastPeople: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: "최소인원수",
            },
            state: { //회의 내용 맞춰 변경해주세요!!
                type: DataTypes.ENUM("waiting", "ongoing", "closed", "expired"),
                allowNull: false,
                comment: "상태",
            },
            startDate: {
                type: DataTypes.DATEONLY, //시간X, 날짜만
                allowNull: false,
                comment: "시작날짜",
            },
            poke: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: "찌르기횟수(강퇴조건)",
            },
            detail: {
                type: DataTypes.STRING,
                allowNull: true, 
                comment: "방상세설명",
            },
            
        },
        {
            tableName: "room",
            timestamps: true,
            updatedAt: false
        }
    );

    Room.associate = (models) => {
        Room.belongsTo(models.book, {
            foreignKey: "isbn",
            as: "book",
        });

        Room.hasMany(models.member, {
            foreignKey: "roomId",
            as: "members",
        });

        Room.hasMany(models.member, {
            foreignKey: "roomId",
            as: "allMembers",
        });

    };

    return Room;
};