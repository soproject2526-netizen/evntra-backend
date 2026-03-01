module.exports = (sequelize, DataTypes) => {
  const Favorite = sequelize.define('Favorite', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    event_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }
  }, {
    tableName: 'favorites',
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ['user_id','event_id'] }]
  });
  return Favorite;
};
