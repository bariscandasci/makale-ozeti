const express = require('express');
const router = express.Router();
const { CohereClientV2 } = require('cohere-ai');
const auth = require('../middleware/auth');
const Summary = require('../models/Summary');

const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY,
});

// POST /api/summarize - AI özeti (korumalı)
router.post('/summarize', auth, async (req, res) => {
  try {
    const { text, summaryRatio = 0.3 } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Metin boş olamaz' });
    }

    // Cohere API çağrısı
    const response = await cohere.summarize({
      text: text,
      length: summaryRatio > 0.5 ? 'long' : 'short',
      format: 'bullets',
      extractiveness: 'high',
    });

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

    const originalLength = text.split(/[.!?]+/).length - 1;
    const summaryLength = response.summary.split(/[.!?]+/).length - 1;

    // Veritabanına kaydet
    const summary = new Summary({
      userId: req.userId,
      originalText: text,
      summary: response.summary,
      keywords,
      sentiment,
      originalLength,
      summaryLength,
    });

    await summary.save();

    res.json({
      _id: summary._id,
      summary: response.summary,
      keywords,
      sentiment,
      originalLength,
      summaryLength,
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

module.exports = router;