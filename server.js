const express = require('express');
const bodyParser = require('body-parser')
const { PORT } = require('./api/consts');
const simplexv1 = require('./api/routers/simplex_v1');

const app = express();
app.use(bodyParser.json())

app.use(express.static('public'))

app.use('/api/v1/simplex', simplexv1);

app.listen(PORT, () => {
  console.log(`Listening at port ${PORT}`)
});
