const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const apiRouter = require('./routes/api');

dotenv.config();

const app = express();

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultOriginPatterns = [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/];

app.use(
  cors({
    origin(origin, callback) {
      const isDefaultLocalOrigin = defaultOriginPatterns.some((pattern) => pattern.test(origin || ''));
      const isConfiguredOrigin = configuredOrigins.includes(origin);

      if (!origin || isConfiguredOrigin || (!configuredOrigins.length && isDefaultLocalOrigin)) {
        return callback(null, true);
      }

      console.warn(`Blocked CORS origin: ${origin}`);
      return callback(new Error('CORS isteğine izin verilmiyor'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api', apiRouter);

app.get('/health', (req, res) => {
  const db = require('./config/db');

  res.json({
    status: 'OK',
    message: 'Server is running',
    database: db.isDatabaseReady() ? 'connected' : 'development-memory',
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err.stack);
  return res.status(500).json({
    error: err.message || 'Internal server error',
  });
});

module.exports = app;
