// // src/config/db.js
// require('dotenv').config();
// const { Sequelize } = require('sequelize');

// // Create Sequelize instance using environment variables
// const sequelize = new Sequelize(
//   process.env.DB_NAME || process.env.DB_NAME || 'evntra_db',
//   process.env.DB_USER || process.env.DB_USER || 'evntra_user',
//   process.env.DB_PASS || process.env.DB_PASS || 'WelcomeToAPP',
//   {
//     host: process.env.DB_HOST || process.env.DB_HOST || 'localhost',
//     port: process.env.DB_PORT || process.env.DB_PORT || 3306,
//     dialect: process.env.DB_DIALECT || 'mysql',
//     logging: process.env.DB_LOGGING === 'true' ? console.log : false,
//     timezone: '+05:30', // India Standard Time
//     pool: {
//       max: 10,
//       min: 0,
//       acquire: 30000,
//       idle: 10000,
//     },
//     define: {
//       underscored: true,
//       timestamps: true,
//     },
//   }
// );

// // Test database connection
// (async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('✅ Database connection established successfully.');
//   } catch (error) {
//     console.error('❌ Unable to connect to the database:', error);
//   }
// })();

// module.exports = sequelize;


// src/config/db.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

// 🔴 Validate required env variables (prevents silent crash)
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
  console.error('❌ Missing required database environment variables');
  process.exit(1);
}

// ✅ Create Sequelize instance (NO wrong fallbacks)
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',

    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    timezone: '+05:30',

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    define: {
      underscored: true,
      timestamps: true,
    },

    // ✅ Important for Railway MySQL SSL
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
);

// ✅ Test DB connection safely
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ DB Connection Error:', error.message);
  }
})();

module.exports = sequelize;