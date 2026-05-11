import React, { useState } from 'react';
import './TrainingDataForm.css';

function TrainingDataForm() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setMessageType('');

    const token = localStorage.getItem('token');

    if (!token) {
      setMessageType('error');
      setMessage('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    if (!text.trim() || !summary.trim()) {
      setMessageType('error');
      setMessage('Metin ve özet alanları boş bırakılamaz.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:3001/api/training/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, summary }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'Eğitim verisi kaydedilemedi.');
      }

      setMessageType('success');
      setMessage(data?.message || 'Eğitim verisi başarıyla kaydedildi.');
      setText('');
      setSummary('');
    } catch (error) {
      setMessageType('error');
      setMessage(error.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="training-form" onSubmit={handleSubmit}>
      {message && (
        <div className={`banner ${messageType === 'success' ? 'banner-success' : 'banner-error'}`}>
          {message}
        </div>
      )}

      <label className="training-label">
        <span>Metin</span>
        <textarea
          className="text-input"
          placeholder="Makaleyi yapıştır..."
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={loading}
          rows="6"
        />
      </label>

      <label className="training-label">
        <span>Özet</span>
        <textarea
          className="text-input"
          placeholder="Özeti yaz..."
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          disabled={loading}
          rows="5"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="primary-button"
      >
        {loading ? 'Kaydediliyor...' : 'Eğitim Verisini Kaydet'}
      </button>
    </form>
  );
}

export default TrainingDataForm;