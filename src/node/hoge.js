const express = require('express');
const app = express();
const port = 5228;

app.get('/', (req, res) => {
  res.send('Hello');
});

app.listen(port, () => {
  console.log(`Express app listening at http://localhost:${port}`);
});