import React, { useState } from 'react';
import './SummaryDisplay.css';

function SummaryDisplay({ summary }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform) => {
    const text = encodeURIComponent(summary.summary);
    let url = '';

    if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${text}`;
    } else if (platform === 'linkedin') {
      url = `https://www.linkedin.com/sharing/share-offsite/?url=about:blank&summary=${text}`;
    }

    if (url) window.open(url, '_blank');
  };

  const getSentimentEmoji = () => {
    switch (summary.sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😞';
      default:
        return '😐';
    }
  };

  const getSentimentText = () => {
    switch (summary.sentiment) {
      case 'positive':
        return 'Olumlu';
      case 'negative':
        return 'Olumsuz';
      default:
        return 'Nötr';
    }
  };

  return (
    <div className="summary-display-container">
      <h2>✨ Özet Sonuçları</h2>

      <div className="summary-box">
        <h3>📄 Özet</h3>
        <p className="summary-text">{summary.summary}</p>
        <button className="btn-copy" onClick={handleCopy}>
          {copied ? '✓ Kopyalandı!' : '📋 Kopyala'}
        </button>
      </div>

      <div className="keywords-box">
        <h3>🔑 Anahtar Kelimeler</h3>
        <div className="keywords-list">
          {summary.keywords && summary.keywords.map((keyword, index) => (
            <span key={index} className="keyword-tag">
              #{keyword}
            </span>
          ))}
        </div>
      </div>

      <div className="sentiment-box">
        <h3>😊 Duygu Analizi</h3>
        <div className="sentiment-display">
          <span className="sentiment-emoji">{getSentimentEmoji()}</span>
          <span className="sentiment-text">{getSentimentText()}</span>
        </div>
      </div>

      <div className="stats-box">
        <h3>📊 İstatistikler</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Orijinal Cümle</span>
            <span className="stat-value">{summary.originalLength}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Özet Cümle</span>
            <span className="stat-value">{summary.summaryLength}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Sıkıştırma</span>
            <span className="stat-value">
              {Math.round(
                ((summary.originalLength - summary.summaryLength) / summary.originalLength) * 100
              )}
              %
            </span>
          </div>
        </div>
      </div>

      <div className="share-box">
        <h3>📤 Paylaş</h3>
        <div className="share-buttons">
          <button
            className="share-btn twitter"
            onClick={() => handleShare('twitter')}
          >
            𝕏 Twitter
          </button>
          <button
            className="share-btn linkedin"
            onClick={() => handleShare('linkedin')}
          >
            in LinkedIn
          </button>
        </div>
      </div>
    </div>
  );
}

export default SummaryDisplay;
