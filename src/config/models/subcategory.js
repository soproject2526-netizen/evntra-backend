// src/models/subcategory.js
module.exports = (sequelize, DataTypes) => {
  const Subcategory = sequelize.define('Subcategory', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    category_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false }
  }, {
    tableName: 'subcategories',
    underscored: true,
    timestamps: true
  });

  Subcategory.associate = (models) => {
    // optional; associations are set in models/index.js
  };

  return Subcategory;
};
