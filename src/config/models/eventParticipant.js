module.exports = (sequelize, DataTypes) => {
  const EventParticipant = sequelize.define('EventParticipant', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    event_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'Events',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'event_participants',
    timestamps: false, // optional, set to true if you want createdAt/updatedAt
    indexes: [
      { fields: ['event_id'] },
      { fields: ['user_id'] },
      { unique: true, fields: ['event_id', 'user_id'] } // prevent duplicates
    ]
  });

  EventParticipant.associate = (models) => {
    EventParticipant.belongsTo(models.Event, { foreignKey: 'event_id', as: 'event' });
    EventParticipant.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return EventParticipant;
};