import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import TextInput from './components/TextInput';
import SummaryDisplay from './components/SummaryDisplay';

function App() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summaryRatio, setSummaryRatio] = useState(0.3);

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError('Lütfen bir metin girin');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/summarize', {
        text: text,
        summaryRatio: summaryRatio
      });

      setSummary(response.data);
    } catch (err) {
      console.error('Error:', err);
      setError('Özet oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setText('');
    setSummary(null);
    setError('');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📰 Makale Özeti Yapan Tool</h1>
        <p>Türkçe makaleleri hızlıca özetle</p>
      </header>

      <main className="app-main">
        <div className="input-section">
          <TextInput
            text={text}
            setText={setText}
            summaryRatio={summaryRatio}
            setSummaryRatio={setSummaryRatio}
            onSummarize={handleSummarize}
            onReset={handleReset}
            loading={loading}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        {summary && (
          <div className="output-section">
            <SummaryDisplay summary={summary} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Made with ❤️ for Turkish NLP enthusiasts</p>
      </footer>
    </div>
  );
}

export default App;
