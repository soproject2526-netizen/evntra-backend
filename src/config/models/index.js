// src/models/index.js
const fs = require('fs');
const path = require('path');
const sequelize = require('../db'); // <-- make sure this exports a Sequelize instance
const Sequelize = require('sequelize');

const db = {};
fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });


Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// import model files
db.User = require('./user')(sequelize, Sequelize.DataTypes);
db.City = require('./city')(sequelize, Sequelize.DataTypes);
db.Category = require('./category')(sequelize, Sequelize.DataTypes);
db.Subcategory = require('./subcategory')(sequelize, Sequelize.DataTypes);
db.Event = require('./event')(sequelize, Sequelize.DataTypes);
db.EventMedia = require('./event_media')(sequelize, Sequelize.DataTypes);
db.OrganizerBusinessInfo = require('./organizer_business_info')(sequelize, Sequelize.DataTypes);
db.OrganizerKYC = require('./organizer_kyc')(sequelize, Sequelize.DataTypes);
db.EventSubcategory = require('./event_subcategory')(sequelize, Sequelize.DataTypes);
db.Like = require('./like')(sequelize, Sequelize.DataTypes);
db.Comment = require('./comment')(sequelize, Sequelize.DataTypes);
db.Notification = require('./notification')(sequelize, Sequelize.DataTypes);
db.ChatRoom = require('./chat_room')(sequelize, Sequelize.DataTypes);
db.ChatRoomMoreInfo = require('./chat_room_more_info')(sequelize, Sequelize.DataTypes);
db.Message = require('./message')(sequelize, Sequelize.DataTypes);

// ASSOCIATIONS

// User
db.User.hasMany(db.Event, { foreignKey: 'organizer_id', as: 'organized_events' });
db.User.hasMany(db.Like, { foreignKey: 'user_id' });
db.User.hasMany(db.Comment, { foreignKey: 'user_id' });
db.User.hasMany(db.Notification, { foreignKey: 'user_id' });
db.User.hasMany(db.Message, { foreignKey: 'sender_id' });

// City
db.City.hasMany(db.Event, { foreignKey: 'city_id', as: 'events' });
// Event → City  ✅ THIS IS MANDATORY
db.Event.belongsTo(db.City, { foreignKey: 'city_id', as: 'city' });


// Category / Subcategory
db.Category.hasMany(db.Subcategory, { foreignKey: 'category_id', as: 'subcategories' });
db.Subcategory.belongsTo(db.Category, { foreignKey: 'category_id', as: 'category' });
db.Category.hasMany(db.Event, {
  foreignKey: 'category_id',
  as: 'events'
});

db.Event.belongsTo(db.Category, {
  foreignKey: 'category_id',
  as: 'category'
});


// Event <-> Subcategory (many-to-many)
db.Event.belongsToMany(db.Subcategory, {
  through: db.EventSubcategory,
  foreignKey: 'event_id',
  otherKey: 'subcategory_id',
  as: 'subcategories'
});
db.Subcategory.belongsToMany(db.Event, {
  through: db.EventSubcategory,
  foreignKey: 'subcategory_id',
  otherKey: 'event_id',
  as: 'events'
});
db.Event.belongsTo(db.User, { foreignKey: 'organizer_id', as: 'organizer' });

// Event -> media
db.Event.hasMany(db.EventMedia, { foreignKey: 'event_id', as: 'media' });
db.EventMedia.belongsTo(db.Event, { foreignKey: 'event_id' });

db.User.hasOne(db.OrganizerBusinessInfo, {
  foreignKey: 'organizer_id',
  as: 'business_info'
});

db.OrganizerBusinessInfo.belongsTo(db.User, {
  foreignKey: 'organizer_id',
  as: 'organizer'
});

db.User.hasOne(db.OrganizerKYC, {
  foreignKey: 'organizer_id',
  as: 'kyc'
});

db.OrganizerKYC.belongsTo(db.User, {
  foreignKey: 'organizer_id',
  as: 'organizer'
});

// Event -> likes/comments
db.Event.hasMany(db.Like, { foreignKey: 'event_id' });
db.Like.belongsTo(db.Event, { foreignKey: 'event_id' });

db.Event.hasMany(db.Comment, { foreignKey: 'event_id' });
db.Comment.belongsTo(db.Event, { foreignKey: 'event_id' });

// Chat rooms / messages
db.Event.hasOne(db.ChatRoom, { foreignKey: 'event_id', as: 'chat_room' });
db.ChatRoom.belongsTo(db.Event, { foreignKey: 'event_id' });

db.ChatRoom.hasMany(db.Message, { foreignKey: 'room_id', as: 'messages' });
db.Message.belongsTo(db.ChatRoom, { foreignKey: 'room_id' });

db.Message.belongsTo(db.User, { foreignKey: 'sender_id', as: 'sender' });

// Notification belongsTo User
db.Notification.belongsTo(db.User, { foreignKey: 'user_id' });

module.exports = db;
