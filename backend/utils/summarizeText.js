const natural = require('natural');

const tokenizer = new natural.SentenceTokenizer();

const turkishStopwords = [
  've', 'veya', 'ancak', 'fakat', 'bir', 'bu', 'şu', 'o', 'ben', 'sen', 'biz', 'siz', 'onlar',
  'beni', 'benim', 'bize', 'bizim', 'seni', 'senin', 'size', 'sizin',
  'onu', 'onun', 'ona', 'onları', 'onların', 'onlara',
  'bunu', 'bunun', 'buna', 'bunlar', 'bunları', 'bunların', 'bunlara',
  'şunu', 'şunun', 'şuna', 'şunlar', 'şunları', 'şunların', 'şunlara',
  'de', 'da', 'mi', 'mı', 'mu', 'mü', 'var', 'yok',
  'için', 'üzere', 'ile', 'dan', 'den', 'tan', 'ten', 'daha', 'çok', 'az',
  'hep', 'hiç', 'her', 'tüm', 'ne', 'neyi', 'neden', 'nereye', 'nasıl',
];

function summarizeText(text, ratio = 0.3) {
  const sentences = tokenizer.tokenize(text);

  if (sentences.length === 0) {
    return {
      summary: '',
      keywords: [],
      sentiment: 'neutral',
      originalLength: 0,
      summaryLength: 0,
    };
  }

  const summaryLength = Math.max(1, Math.ceil(sentences.length * ratio));
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq = {};

  words.forEach((word) => {
    const cleaned = word.replace(/[^a-zçğıöşü0-9]/gi, '');
    if (cleaned && !turkishStopwords.includes(cleaned)) {
      wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
    }
  });

  const scoredSentences = sentences.map((sentence, index) => {
    let score = 0;

    sentence
      .toLowerCase()
      .split(/\s+/)
      .forEach((word) => {
        const cleaned = word.replace(/[^a-zçğıöşü0-9]/gi, '');
        score += wordFreq[cleaned] || 0;
      });

    return { sentence: sentence.trim(), score, index };
  });

  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, summaryLength)
    .sort((a, b) => a.index - b.index);

  const keywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  const positiveWords = ['güzel', 'harika', 'iyi', 'mükemmel', 'başarılı', 'başarı', 'mutlu'];
  const negativeWords = ['kötü', 'berbat', 'başarısız', 'hüzün', 'üzüntü', 'sorun', 'problem'];

  let sentimentScore = 0;
  const textLower = text.toLowerCase();

  positiveWords.forEach((word) => {
    sentimentScore += (textLower.match(new RegExp(word, 'g')) || []).length;
  });

  negativeWords.forEach((word) => {
    sentimentScore -= (textLower.match(new RegExp(word, 'g')) || []).length;
  });

  let sentiment = 'neutral';
  if (sentimentScore > 2) {
    sentiment = 'positive';
  } else if (sentimentScore < -2) {
    sentiment = 'negative';
  }

  return {
    summary: topSentences.map((item) => item.sentence).join(' ') || text.substring(0, 200),
    keywords,
    sentiment,
    originalLength: sentences.length,
    summaryLength: topSentences.length,
  };
}

module.exports = summarizeText;
