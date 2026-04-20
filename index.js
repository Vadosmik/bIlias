const express = require('express');
const app = express();
const port = 8080; // Możesz zmienić na taki, jaki masz w docker-compose

app.get('/', (req, res) => {
  res.send('Backend bIlias działa poprawnie! 🚀');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Serwer nasłuchuje na http://localhost:${port}`);
});