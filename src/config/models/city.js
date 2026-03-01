// src/models/city.js
module.exports = (sequelize, DataTypes) => {
  const City = sequelize.define('City', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING },
    country: { type: DataTypes.STRING, defaultValue: 'India' },
    slug: { type: DataTypes.STRING }
  }, {
    tableName: 'cities',
    underscored: true,
    timestamps: true
  });

  City.associate = (models) => {
  City.hasMany(models.Event, {
    foreignKey: 'city_id',
    as: 'events'
  });
};

  return City;
};
