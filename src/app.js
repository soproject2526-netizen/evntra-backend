const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require("fs");
app.set('trust proxy', 1);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(helmet());
app.use(cors()); // you can restrict origins in production
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

// SINGLE ENTRY POINT FOR ROUTES
const routes = require('./config/routes');
app.use('/api', routes);

// Static uploads
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'))
);
console.log("Uploads path:", path.join(__dirname, '../uploads'));

app.get("/debug-uploads", (req, res) => {
  const dir = path.join(__dirname, "../uploads/events");

  if (!fs.existsSync(dir)) {
    return res.send("uploads/events folder NOT found");
  }

  const files = fs.readdirSync(dir);
  res.json(files);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

module.exports = app;
