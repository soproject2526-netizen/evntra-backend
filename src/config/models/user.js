// src/models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      full_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
      },

      phone: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      role: {
        type: DataTypes.ENUM('user', 'organizer', 'admin'),
        allowNull: false,
        defaultValue: 'user',
      },

      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      city_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      profile_image: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      reset_code: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },

      reset_code_expiry: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'user',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return User;
};
