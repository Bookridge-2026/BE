const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

//아래 양식으로 모델 생성
// db.subscriber = require("./subscriber.js")(sequelize, Sequelize);
db.book = require("./book.js")(sequelize, Sequelize);     
db.user = require("./user.js")(sequelize, Sequelize);     
db.room = require("./room.js")(sequelize, Sequelize);     
db.member = require("./member.js")(sequelize, Sequelize);  
db.comment = require("./comment.js")(sequelize, Sequelize);
db.reply = require("./reply.js")(sequelize, Sequelize);    
db.emojiType = require("./emojiType.js")(sequelize, Sequelize);
db.emoji = require("./emoji.js")(sequelize, Sequelize);    
db.friend = require("./friend.js")(sequelize, Sequelize);
db.friendRequest = require("./friendRequest.js")(sequelize, Sequelize);


Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;