// src/models/event.js
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    organizer_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    //likes_count: {type: DataTypes.INTEGER,allowNull: false,defaultValue: 0},
    city_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    venue_name: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    lat: { type: DataTypes.DECIMAL(10, 7) },
    lng: { type: DataTypes.DECIMAL(10, 7) },
    price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: 'INR' },
    is_free: { type: DataTypes.BOOLEAN, defaultValue: false },
    capacity: { type: DataTypes.INTEGER, defaultValue: 0 },
    start_time: { type: DataTypes.DATE },
    end_time: { type: DataTypes.DATE },
    status: { type: DataTypes.ENUM('draft', 'published', 'cancelled'), defaultValue: 'published' }
  }, {
    tableName: 'events',
    underscored: true,
    timestamps: true
  });

  Event.associate = (models) => {
    Event.belongsTo(models.City, {
      foreignKey: 'city_id',
      as: 'city'
    });

    Event.hasMany(models.EventMedia, {
      foreignKey: 'event_id',
      as: 'media'
    });

    Event.belongsTo(models.User, {
      foreignKey: "organizer_id",
      as: "organizer"
    });
  };

  return Event;
};
