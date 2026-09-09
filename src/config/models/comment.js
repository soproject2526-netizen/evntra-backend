// src/models/comment.js

module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    'Comment',
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

      event_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      parent_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },

      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'comments',
      underscored: true,
      timestamps: false,
    }
  );

  Comment.associate = (models) => {
    Comment.belongsTo(models.Event, {
      foreignKey: 'event_id',
      as: 'event',
    });

    Comment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    Comment.belongsTo(models.Comment, {
      foreignKey: 'parent_id',
      as: 'parent',
    });

    Comment.hasMany(models.Comment, {
      foreignKey: 'parent_id',
      as: 'replies',
    });
  };

  return Comment;
};