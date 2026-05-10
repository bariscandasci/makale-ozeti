const jwt = require('jsonwebtoken');

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    if (!['development', 'test', undefined].includes(process.env.NODE_ENV)) {
      throw new Error('JWT_SECRET üretim ortamında zorunludur.');
    }

    console.warn('⚠️ JWT_SECRET tanımlı değil. Development fallback secret kullanılıyor.');
  }

  return process.env.JWT_SECRET || 'development-only-secret';
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkilendirme token\'ı gerekli' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = { userId: payload.userId };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
  }
}

module.exports = {
  authMiddleware,
  getJwtSecret,
};
