1) Ensure .env is configured (DB credentials, JWT_SECRET, S3 keys)
2) Run migrations (SQL files in migrations/) against your DB:
   mysql -u root -p evntra_db < migrations/20251006_add_counters_and_indexes.sql
   mysql -u root -p evntra_db < migrations/20251006_triggers_counters.sql

3) Install dependencies
   npm install

   Required libs (if not present):
   npm install sequelize mysql2 dotenv aws-sdk socket.io jsonwebtoken uuid

4) Start server (dev)
   node src/server.js

5) Seed data:
   node seeders/seedDashboard.js

6) Import Postman collection (I provided earlier) and test endpoints:
   GET {{base_url}}/api/dashboard
