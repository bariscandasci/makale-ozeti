import React, { useState, useEffect } from 'react';
import './TrainingDataList.css';

function TrainingDataList() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState('');

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Oturum bulunamadı');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/training/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Eğitim geçmişi alınamadı');
      }

      const data = await response.json();
      setTrainings(data.data || []);
    } catch (err) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Bu eğitim verisini silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      setDeleting(id);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Oturum bulunamadı');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/training/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Silme işlemi başarısız');
      }

      setTrainings((current) => current.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.message || 'Silme sırasında hata oluştu');
    } finally {
      setDeleting('');
    }
  };

  const truncate = (text, length) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <section className="panel">
        <div className="panel-header">
          <h2>Eğitim Geçmişi</h2>
        </div>
        <div className="empty-card">
          <p>⏳ Yükleniyor...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <div className="panel-header">
          <h2>Eğitim Geçmişi</h2>
        </div>
        <div className="banner banner-error">
          {error}
        </div>
      </section>
    );
  }

  if (trainings.length === 0) {
    return (
      <section className="panel">
        <div className="panel-header">
          <h2>Eğitim Geçmişi</h2>
          <span>0</span>
        </div>
        <div className="empty-card">
          <p>Eğitim verisi bulunamadı</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Eğitim Geçmişi</h2>
        <span>{trainings.length}</span>
      </div>

      <div className="training-list">
        {trainings.map((item) => (
          <article key={item._id} className="training-item">
            <div className="training-content">
              <div className="training-text">
                <strong>Metin:</strong>
                <p>{truncate(item.text, 100)}</p>
              </div>
              <div className="training-summary">
                <strong>Özet:</strong>
                <p>{truncate(item.summary, 150)}</p>
              </div>
              <div className="training-date">
                {formatDate(item.createdAt)}
              </div>
            </div>
            <button
              className="danger-button"
              type="button"
              onClick={() => handleDelete(item._id)}
              disabled={deleting === item._id}
            >
              {deleting === item._id ? 'Siliniyor...' : 'Sil'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TrainingDataList;
