require('dotenv').config();

const { assertEnv } = require('./config/env');
const connectDB = require('./config/db');

assertEnv();

const app = require('./app');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  });
};

startServer();
