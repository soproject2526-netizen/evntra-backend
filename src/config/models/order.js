// module.exports = (sequelize, DataTypes) => {
//   const Order = sequelize.define(
//     "Order",
//     {
//       id: {
//         type: DataTypes.BIGINT.UNSIGNED,
//         primaryKey: true,
//         autoIncrement: true,
//       },
//       user_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//       },

//       event_id: {
//         type: DataTypes.BIGINT.UNSIGNED,
//         allowNull: false,
//       },

//       customer_id: {
//         type: DataTypes.INTEGER,
//         allowNull: true, // ✅ IMPORTANT
//       },

//       ticket_type: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },

//       quantity: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//       },

//       price_per_ticket: {
//         type: DataTypes.DECIMAL(10, 2),
//         allowNull: false,
//       },

//       total_price: {
//         type: DataTypes.DECIMAL(10, 2),
//         allowNull: false,
//       },
//       attendance_status: {
//         type: DataTypes.ENUM("booked", "attended", "cancelled"),
//         field: "attendance_status", // 🔥 IMPORTANT
//       },
//     },
//     {
//       tableName: "orders",
//       underscored: true,
//       timestamps: false,
//     },
//   );

//   // ✅ Define associate as a function
//   // Order.associate = (models) => {
//   //   Order.belongsTo(models.Event, { foreignKey: "event_id", as: "event" });

//   //   // Order.belongsTo(models.EventTicket, {
//   //   //   foreignKey: "ticket_type",
//   //   //   targetKey: "ticket_type",
//   //   //   as: "ticket",
//   //   // });

//   //   Order.belongsTo(models.EventTicket, {
//   //     foreignKey: "ticket_type",
//   //     targetKey: "ticket_type",
//   //     as: "ticket",
//   //     constraints: false,
//   //   });

//   //   Order.belongsTo(models.User, { foreignKey: "user_id", as: "user" }); // 🔹 link to user
//   // };

//   Order.associate = (models) => {
//     // ✅ SAFE CHECKS (VERY IMPORTANT)

//     if (models.Event) {
//       Order.belongsTo(models.Event, {
//         foreignKey: "event_id",
//         as: "event",
//       });
//     }

//     if (models.EventTicket) {
//       Order.belongsTo(models.EventTicket, {
//         foreignKey: "ticket_type",
//         targetKey: "ticket_type",
//         as: "ticket",
//         constraints: false,
//       });
//     }

//     if (models.User) {
//       Order.belongsTo(models.User, {
//         foreignKey: "user_id",
//         as: "user",
//       });
//     }
//   };

//   return Order;
// };


module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // event_id: {
      // type: DataTypes.BIGINT.UNSIGNED,
      // allowNull: false, },


      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      ticket_type: {
        type: DataTypes.ENUM('VIP', 'GENERAL'),
        allowNull: false,
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      price_per_ticket: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      // ✅ REQUIRED FOR STEP 2 LOGIC
      status: {
        type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
    },
    {
      tableName: 'orders',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  // Associations
  Order.associate = models => {
    Order.belongsTo(models.Event, {
      foreignKey: 'event_id',
      as: 'event',
    });
  };

  return Order;
};
