module.exports = (sequelize, DataTypes) => {
  const OrganizerBusinessInfo = sequelize.define('OrganizerBusinessInfo', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },

    organizer_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },

    gst_number: { type: DataTypes.STRING(20) },
    pan_number: { type: DataTypes.STRING(20) },

    country: { type: DataTypes.STRING(100), defaultValue: 'India' },
    address: { type: DataTypes.STRING(500) },

    verified: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'organizer_business_info',
    underscored: true,
    timestamps: true
  });

  return OrganizerBusinessInfo;
};