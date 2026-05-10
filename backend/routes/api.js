const express = require('express');
const router = express.Router();
const natural = require('natural');
const tokenizer = new natural.SentenceTokenizer();

// Türkçe stop words
const turkishStopwords = [
  've', 'veya', 'ancak', 'fakat', 'bir', 'bir', 'bu', 'şu', 'o', 'ben', 'sen', 'o', 'biz', 'siz', 'onlar',
  'ben', 'beni', 'benim', 'bize', 'biz', 'bizim', 'sen', 'seni', 'senin', 'size', 'siz', 'sizin',
  'o', 'onu', 'onun', 'ona', 'onlar', 'onları', 'onların', 'onlara',
  'bu', 'bunu', 'bunun', 'buna', 'bunlar', 'bunları', 'bunların', 'bunlara',
  'şu', 'şunu', 'şunun', 'şuna', 'şunlar', 'şunları', 'şunların', 'şunlara',
  'de', 'da', 'mi', 'mı', 'mu', 'mü', 'var', 'yok', 'var', 'yok',
  'için', 'üzere', 'ile', 'dan', 'den', 'tan', 'ten', 'daha', 'çok', 'az',
  'hep', 'hiç', 'her', 'tüm', 'ne', 'neyi', 'neden', 'nereye', 'nasıl'
];

// Özet alma fonksiyonu
function summarizeText(text, ratio = 0.3) {
  try {
    // Cümlelere böl
    const sentences = tokenizer.tokenize(text);
    
    if (sentences.length === 0) {
      return { summary: '', keywords: [], sentiment: 'neutral' };
    }

    // Özetlenecek cümle sayısı
    const summaryLength = Math.max(1, Math.ceil(sentences.length * ratio));

    // Basit score hesapla (kelimelerin sıklığına göre)
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq = {};

    words.forEach(word => {
      const cleaned = word.replace(/[^a-zçğıöşüa-z0-9]/g, '');
      if (cleaned && !turkishStopwords.includes(cleaned)) {
        wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
      }
    });

    // Cümleleri score'la
    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      
      sentenceWords.forEach(word => {
        const cleaned = word.replace(/[^a-zçğıöşüa-z0-9]/g, '');
        score += wordFreq[cleaned] || 0;
      });

      return { sentence: sentence.trim(), score, index };
    });

    // En yüksek score'lu cümleleri seç
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, summaryLength)
      .sort((a, b) => a.index - b.index);

    const summary = topSentences.map(s => s.sentence).join(' ');

    // Anahtar kelimeleri çıkart
    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    // Duygu analizi (basit)
    const positiveWords = ['güzel', 'harika', 'iyi', 'mükemmel', 'başarılı', 'başarı', 'mutlu', 'sevindi'];
    const negativeWords = ['kötü', 'berbat', 'başarısız', 'hüzün', 'üzüntü', 'sorun', 'problem', 'olumsuz'];

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

    return {
      summary: summary || text.substring(0, 200),
      keywords,
      sentiment,
      originalLength: sentences.length,
      summaryLength: topSentences.length
    };
  } catch (error) {
    console.error('Error summarizing:', error);
    throw error;
  }
}

// POST /api/summarize - Metin özeti
router.post('/summarize', (req, res) => {
  try {
    const { text, summaryRatio = 0.3 } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Metin boş olamaz' });
    }

    if (summaryRatio < 0.1 || summaryRatio > 1) {
      return res.status(400).json({ error: 'Özet oranı 0.1 ile 1 arasında olmalı' });
    }

    const result = summarizeText(text, summaryRatio);
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Özet oluşturulurken hata oluştu' });
  }
});

module.exports = router;
