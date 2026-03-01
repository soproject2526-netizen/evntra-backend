// src/server.js (updated)
require('dotenv').config();
const app = require('./src/app');
const http = require('http');
const server = http.createServer(app);
const { initSocket } = require('./src/sockets/socketServer');

const io = initSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
