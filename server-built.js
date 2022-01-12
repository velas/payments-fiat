const http = require('http');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser')
const { PORT } = require('./api/consts');
const simplexv1 = require('./api/routers/simplex_v1');
const fixerv1 = require('./api/routers/fixer_v1');
const simplexv1sockets = require('./api/sockets/simplex_v1');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.json())

app.use(express.static('build'))

app.use('/api/v1/simplex', simplexv1);
app.use('/api/v1/rates', fixerv1);

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'build/index.html'));
});

simplexv1sockets.init(io);

server.listen(PORT, () => {
  console.log(`Listening at port ${PORT}`)
});
