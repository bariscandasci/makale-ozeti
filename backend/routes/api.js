const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const { authMiddleware, getJwtSecret } = require('../middleware/auth');
const {
  createSummary,
  createUser,
  deleteSummaryById,
  findUserByEmail,
  findUserById,
  getSubscriptionByUserId,
  getSummariesByUserId,
} = require('../services/dataStore');
const summarizeText = require('../utils/summarizeText');

const router = express.Router();
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla kimlik doğrulama isteği. Lütfen daha sonra tekrar deneyin.' },
});
const protectedRouteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.' },
});

function validateEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || normalizedEmail.length > 254 || normalizedEmail.includes(' ')) {
    return false;
  }

  const parts = normalizedEmail.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart || domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return false;
  }

  const domainLabels = domainPart.split('.');
  if (domainLabels.length < 2) {
    return false;
  }

  return domainLabels.every((label) => /^[a-z0-9-]+$/i.test(label) && !label.startsWith('-') && !label.endsWith('-'));
}

function safeUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function generateToken(userId) {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '7d' });
}

router.post('/auth/register', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'Geçerli bir e-posta adresi girin' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Şifre en az 8 karakter olmalı' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { user, subscription } = await createUser({
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      token: generateToken(user.id),
      user: safeUserResponse(user),
      subscription,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Kayıt oluşturulurken hata oluştu' });
  }
});

router.post('/auth/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre gerekli' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
    }

    const subscription = await getSubscriptionByUserId(user.id);

    return res.json({
      token: generateToken(user.id),
      user: safeUserResponse(user),
      subscription,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Giriş yapılırken hata oluştu' });
  }
});

router.post('/auth/profile', protectedRouteLimiter, authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const subscription = await getSubscriptionByUserId(user.id);

    return res.json({
      user: safeUserResponse(user),
      subscription,
    });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: 'Profil bilgisi alınamadı' });
  }
});

router.post('/summarize', protectedRouteLimiter, authMiddleware, async (req, res) => {
  try {
    const { text, summaryRatio = 0.3 } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Metin boş olamaz' });
    }

    if (text.trim().length < 40) {
      return res.status(400).json({ error: 'Özet için en az 40 karakterlik metin girin' });
    }

    if (typeof summaryRatio !== 'number' || summaryRatio < 0.1 || summaryRatio > 1) {
      return res.status(400).json({ error: 'Özet oranı 0.1 ile 1 arasında olmalı' });
    }

    const result = summarizeText(text, summaryRatio);
    const historyItem = await createSummary({
      userId: req.user.userId,
      originalText: text.trim(),
      summary: result.summary,
      keywords: result.keywords,
      sentiment: result.sentiment,
      originalLength: result.originalLength,
      summaryLength: result.summaryLength,
    });

    return res.json({
      ...result,
      historyItem,
    });
  } catch (error) {
    console.error('Summarize error:', error);
    return res.status(500).json({ error: 'Özet oluşturulurken hata oluştu' });
  }
});

router.get('/history', protectedRouteLimiter, authMiddleware, async (req, res) => {
  try {
    const history = await getSummariesByUserId(req.user.userId);
    return res.json({ history });
  } catch (error) {
    console.error('History error:', error);
    return res.status(500).json({ error: 'Geçmiş kayıtları alınamadı' });
  }
});

router.delete('/history/:id', protectedRouteLimiter, authMiddleware, async (req, res) => {
  try {
    const deleted = await deleteSummaryById(req.params.id, req.user.userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Silinecek kayıt bulunamadı' });
    }

    return res.json({ message: 'Geçmiş kaydı silindi' });
  } catch (error) {
    console.error('Delete history error:', error);
    return res.status(500).json({ error: 'Geçmiş kaydı silinemedi' });
  }
});

module.exports = router;
