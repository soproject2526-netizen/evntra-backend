// src/models/event_media.js
module.exports = (sequelize, DataTypes) => {
  const EventMedia = sequelize.define('EventMedia', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    event_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    media_type: { type: DataTypes.ENUM('image','video','banner'), defaultValue: 'image' },
    url: { type: DataTypes.STRING(1000), allowNull: false },
    order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
    width: { type: DataTypes.INTEGER, allowNull: true },
    original_filename: { type: DataTypes.STRING,allowNull: false},
    storage_filename: { type: DataTypes.STRING,allowNull: false},
    height: { type: DataTypes.INTEGER, allowNull: true },
    duration_seconds: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    tableName: 'event_media',
    underscored: true,
    timestamps: true  
  });

  return EventMedia;
};
