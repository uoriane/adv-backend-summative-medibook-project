require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');

const port = Number(process.env.PORT || 3000);

pool.getConnection()
  .then((connection) => {
    connection.release();
    app.listen(port, () => console.log(`MediBook API listening on port ${port}`));
  })
  .catch((error) => {
    console.error('Cannot start MediBook: MySQL is unavailable.', error.message);
    process.exit(1);
  });
