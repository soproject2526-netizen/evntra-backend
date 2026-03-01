module.exports = (sequelize, DataTypes) => {
  const ChatRoomMoreInfo = sequelize.define(
    'ChatRoomMoreInfo',
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
      organizer_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      }
    },
    {
      tableName: 'chat_room_more_info',
      timestamps: false,
      underscored: true
    }
  );

  ChatRoomMoreInfo.associate = models => {
    ChatRoomMoreInfo.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    ChatRoomMoreInfo.belongsTo(models.User, {
      foreignKey: 'organizer_id',
      as: 'organizer'
    });

    ChatRoomMoreInfo.belongsTo(models.Event, {
      foreignKey: 'event_id',
      as: 'event'
    });
  };

  return ChatRoomMoreInfo;
};
