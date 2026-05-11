const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Summary = require('../models/Summary');
const TrainingData = require('../models/TrainingData');
const summarizeText = require('../utils/summarizeText');

// POST /api/summarize - AI özeti (korumalı)
router.post('/summarize', auth, async (req, res) => {
  try {
    const { text, summaryRatio = 0.3 } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Metin boş olamaz' });
    }

    const result = summarizeText(text, summaryRatio);

    // Anahtar kelimeleri çıkart
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq = {};
    
    words.forEach(word => {
      const cleaned = word.replace(/[^a-zçğıöşüa-z0-9]/g, '');
      if (cleaned && cleaned.length > 3) {
        wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
      }
    });

    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    // Duygu analizi
    const positiveWords = ['güzel', 'harika', 'iyi', 'mükemmel', 'başarılı'];
    const negativeWords = ['kötü', 'berbat', 'başarısız', 'sorun', 'problem'];

    let sentimentScore = 0;
    const textLower = text.toLowerCase();
    
    positiveWords.forEach(word => {
      const count = (textLower.match(new RegExp(word, 'g')) || []).length;
      sentimentScore += count;
    });
    
    negativeWords.forEach(word => {
      const count = (textLower.match(new RegExp(word, 'g')) || []).length;
      sentimentScore -= count;
    });

    let sentiment = 'neutral';
    if (sentimentScore > 2) sentiment = 'positive';
    if (sentimentScore < -2) sentiment = 'negative';

    // Veritabanına kaydet
    const summary = new Summary({
      userId: req.userId,
      originalText: text,
      summary: result.summary,
      keywords: result.keywords,
      sentiment: result.sentiment,
      originalLength: result.originalLength,
      summaryLength: result.summaryLength,
    });

    await summary.save();

    res.json({
      historyItem: {
        id: summary._id,
        originalText: summary.originalText,
        summary: summary.summary,
        keywords: summary.keywords,
        sentiment: summary.sentiment,
        originalLength: summary.originalLength,
        summaryLength: summary.summaryLength,
        createdAt: summary.createdAt,
      },
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Özet oluşturulurken hata oluştu' });
  }
});

// GET /api/history - Özet geçmişi (korumalı)
router.get('/history', auth, async (req, res) => {
  try {
    const summaries = await Summary.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(summaries);
  } catch (error) {
    res.status(500).json({ error: 'Geçmiş alınamadı' });
  }
});

// DELETE /api/history/:id - Özet sil (korumalı)
router.delete('/history/:id', auth, async (req, res) => {
  try {
    const summary = await Summary.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!summary) {
      return res.status(404).json({ error: 'Özet bulunamadı' });
    }

    res.json({ message: 'Özet silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Silme sırasında hata oluştu' });
  }
});
// POST /api/training/add - Eğitim verisi ekle (korumalı)
router.post('/training/add', auth, async (req, res) => {
  try {
    const { text, summary } = req.body;

    if (!text || !summary) {
      return res.status(400).json({ error: 'Metin ve özet alanları gerekli' });
    }

    if (text.trim().length < 10) {
      return res.status(400).json({ error: 'Metin en az 10 karakter olmalı' });
    }

    if (summary.trim().length < 5) {
      return res.status(400).json({ error: 'Özet en az 5 karakter olmalı' });
    }

    const trainingData = new TrainingData({
      userId: req.userId,
      text: text.trim(),
      summary: summary.trim(),
    });

    await trainingData.save();

    res.status(201).json({
      message: 'Eğitim verisi başarıyla kaydedildi',
      data: {
        id: trainingData._id,
        text: trainingData.text,
        summary: trainingData.summary,
        createdAt: trainingData.createdAt,
      },
    });
  } catch (error) {
    console.error('Training data error:', error);
    res.status(500).json({ error: 'Eğitim verisi kaydedilemedi' });
  }
});

// GET /api/training - Eğitim geçmişi (korumalı)
router.get('/training', auth, async (req, res) => {
  try {
    const trainingData = await TrainingData.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      count: trainingData.length,
      data: trainingData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Eğitim geçmişi alınamadı' });
  }
});

// GET /api/training/list - Eğitim geçmişi (korumalı, alias)
router.get('/training/list', auth, async (req, res) => {
  try {
    const trainingData = await TrainingData.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      count: trainingData.length,
      data: trainingData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Eğitim geçmişi alınamadı' });
  }
});

// DELETE /api/training/:id - Eğitim verisi sil (korumalı)
router.delete('/training/:id', auth, async (req, res) => {
  try {
    const trainingData = await TrainingData.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!trainingData) {
      return res.status(404).json({ error: 'Eğitim verisi bulunamadı' });
    }

    res.json({ message: 'Eğitim verisi silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Silme sırasında hata oluştu' });
  }
});


module.exports = router;