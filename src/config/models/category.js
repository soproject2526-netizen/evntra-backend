// src/models/category.js
module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    emoji: { type: DataTypes.STRING(10) },
    order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_default: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'categories',
    underscored: true,
    timestamps: true
  });

  return Category;
};
