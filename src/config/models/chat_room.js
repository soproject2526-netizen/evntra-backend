// src/models/chat_room.js
module.exports = (sequelize, DataTypes) => {
  const ChatRoom = sequelize.define('ChatRoom', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    event_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    name: { type: DataTypes.STRING }
  }, {
    tableName: 'chat_rooms',
    underscored: true,
    timestamps: true
  });

  return ChatRoom;
};
