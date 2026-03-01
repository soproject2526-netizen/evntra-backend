// src/models/message.js
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    room_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    sender_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    message: { type: DataTypes.TEXT },
    attachments: { type: DataTypes.TEXT } // could be JSON-encoded string of urls
  }, {
    tableName: 'messages',
    underscored: true,
    timestamps: true
  });

  return Message;
};
