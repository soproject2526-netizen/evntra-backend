// src/models/event_subcategory.js
module.exports = (sequelize, DataTypes) => {
  const EventSubcategory = sequelize.define(
    'EventSubcategory',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },

      event_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },

      subcategory_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      }
    },
    {
      tableName: 'event_subcategories',
      underscored: true,
      timestamps: false
    }
  );

  EventSubcategory.associate = (models) => {
    EventSubcategory.belongsTo(models.Event, {
      foreignKey: 'event_id',
      onDelete: 'CASCADE'
    });

    EventSubcategory.belongsTo(models.Subcategory, {
      foreignKey: 'subcategory_id',
      onDelete: 'CASCADE'
    });
  };

  return EventSubcategory;
};
