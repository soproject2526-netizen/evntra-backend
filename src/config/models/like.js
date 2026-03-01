// src/models/like.js
module.exports = (sequelize, DataTypes) => {
  const Like = sequelize.define('Like', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    event_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }
  }, {
    tableName: 'likes',
    underscored: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ['user_id', 'event_id'] }
    ]
  });

  return Like;
};
