module.exports = (sequelize, DataTypes) => {
    const Book = sequelize.define(
        "Book",
        {
            isbn: {
                type: DataTypes.STRING,
                primaryKey: true,  
                allowNull: false,
                comment: "ISBN키",
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: "책제목",
            },
            url: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: "책상세URL",
            },
            datetime: {
                type: DataTypes.DATE,
                allowNull: false,
                comment: "출판날짜",
            },
            author: {
                type: DataTypes.TEXT,
                allowNull: false,
                comment: "저자",
            },
            publisher: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: "출판사",
            },
            translator: {
                type: DataTypes.TEXT,
                allowNull: true,   
                comment: "번역가",
            },
            thumbnail: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: "표지URL",
            },
            totalPage: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: "전체쪽수",
            },
        },
        {
            tableName: "book",  
            timestamps: false,
        }
    );

    Book.associate = (models) => {
        Book.hasMany(models.room, {
            foreignKey: "isbn",
            as: "rooms",
        });
    };

    return Book;
};