module.exports = (sequelize, DataTypes) => {
  const Share = sequelize.define('Share', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    event_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    platform: { type: DataTypes.STRING(80), allowNull: true }
  }, {
    tableName: 'shares',
    underscored: true,
    timestamps: true
  });

  return Share;
};
