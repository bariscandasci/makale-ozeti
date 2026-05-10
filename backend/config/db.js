const mongoose = require('mongoose');

let databaseReady = false;
const DB_SERVER_SELECTION_TIMEOUT_MS = Number(process.env.DB_SERVER_SELECTION_TIMEOUT_MS || 5000);

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('⚠️ MONGODB_URI tanımlı değil. Uygulama development memory store ile çalışacak.');
    databaseReady = false;
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: DB_SERVER_SELECTION_TIMEOUT_MS,
    });
    databaseReady = true;
    console.log('✅ MongoDB bağlantısı kuruldu');
    return true;
  } catch (error) {
    databaseReady = false;
    console.warn(`⚠️ MongoDB bağlantısı kurulamadı: ${error.message}`);
    console.warn('⚠️ Uygulama development memory store ile çalışmaya devam ediyor.');
    return false;
  }
}

function isDatabaseReady() {
  return databaseReady && mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  isDatabaseReady,
};
