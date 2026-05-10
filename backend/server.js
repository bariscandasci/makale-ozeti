const dotenv = require('dotenv');

const app = require('./app');
const { connectDB } = require('./config/db');

dotenv.config();

const PORT = process.env.PORT || 3001;

async function startServer() {
  await connectDB();

  return app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
};
