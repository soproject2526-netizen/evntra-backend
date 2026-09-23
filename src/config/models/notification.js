// src/models/notification.js
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      reference_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      reference_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },

      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'notifications',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Notification;
};
