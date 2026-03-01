module.exports = (sequelize, DataTypes) => {
  const OrganizerKYC = sequelize.define('OrganizerKYC', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },

    organizer_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true
    },

    aadhar_document: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    pan_document: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    verification_video: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },

    rejection_reason: {
      type: DataTypes.STRING(255)
    },

    verified_by: {
      type: DataTypes.BIGINT.UNSIGNED
    },

    verified_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'organizer_kyc',
    timestamps: true,
    underscored: true
  });

  return OrganizerKYC;
};
