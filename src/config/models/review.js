// src/models/review.js
module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define(
    "Review",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },

      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      event_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      organizer_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },

      comment: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      is_anonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "reviews",
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "event_id"], // prevent duplicate review
        },
      ],
    }
  );

  Review.associate = (models) => {
    Review.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });

    Review.belongsTo(models.Event, {
      foreignKey: "event_id",
      as: "event",
    });
  };

  return Review;
};