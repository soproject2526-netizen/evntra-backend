module.exports = (sequelize, DataTypes) => {
  const EventTicket = sequelize.define(
    "EventTicket",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },

      event_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      ticket_type: {
        type: DataTypes.ENUM("VIP", "GENERAL"),
        allowNull: false,
      },

      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "event_tickets",
      underscored: true,
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );

  EventTicket.associate = (models) => {
    EventTicket.belongsTo(models.Event, {
      foreignKey: "event_id",
      as: "event",
    });
  };

  return EventTicket;
};