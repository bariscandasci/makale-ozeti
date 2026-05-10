import React from 'react';
import './TextInput.css';

function TextInput({
  text,
  setText,
  summaryRatio,
  setSummaryRatio,
  onSummarize,
  onReset,
  loading
}) {
  return (
    <div className="text-input-container">
      <h2>Metin gir</h2>
      <p className="section-description">
        Makale, rapor veya toplantı notlarını yapıştır. Sistem özeti, anahtar kelimeleri ve duygu
        analizini oluşturup hesabına kaydeder.
      </p>

      <textarea
        className="text-input"
        placeholder="Makale metni veya haberi yapıştır..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
      />

      <div className="controls">
        <div className="ratio-control">
          <label htmlFor="ratio">Özet Oranı: {Math.round(summaryRatio * 100)}%</label>
          <input
            id="ratio"
            type="range"
            min="10"
            max="100"
            step="10"
            value={Math.round(summaryRatio * 100)}
            onChange={(e) => setSummaryRatio(parseInt(e.target.value) / 100)}
            disabled={loading}
            className="slider"
          />
        </div>

        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={onSummarize}
            disabled={loading || !text.trim()}
          >
            {loading ? 'Özet hazırlanıyor...' : 'Özet oluştur'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={onReset}
            disabled={loading}
          >
            Temizle
          </button>
        </div>
      </div>

      {text && (
        <div className="text-stats">
          <span>📊 {text.split(/\s+/).length} kelime</span>
          <span>📄 {text.split(/[.!?]+/).length - 1} cümle</span>
        </div>
      )}
    </div>
  );
}

export default TextInput;
