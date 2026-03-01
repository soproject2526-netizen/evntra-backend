// src/models/comment.js
module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    event_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    parent_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: false }
  }, {
    tableName: 'comments',
    underscored: true,
    timestamps: true
  });

  return Comment;
};
