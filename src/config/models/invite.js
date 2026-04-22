module.exports = (sequelize, DataTypes) => {
  const Invite = sequelize.define(
    "Invite",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },

      sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      receiver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      event_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true, // optional (if invite is event-based)
      },

      status: {
        type: DataTypes.ENUM("sent", "accepted", "rejected"),
        defaultValue: "sent",
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "invites",
      underscored: true,
      timestamps: false,
    },
  );

  // ✅ Associations (SAFE like your Order model)
  Invite.associate = (models) => {
    if (models.User) {
      Invite.belongsTo(models.User, {
        foreignKey: "sender_id",
        as: "sender",
      });

      Invite.belongsTo(models.User, {
        foreignKey: "receiver_id",
        as: "receiver",
      });
    }

    if (models.Event) {
      Invite.belongsTo(models.Event, {
        foreignKey: "event_id",
        as: "event",
      });
    }
  };

  return Invite;
};
