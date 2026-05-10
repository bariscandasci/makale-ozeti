import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SummaryDisplay from './SummaryDisplay';
import TextInput from './TextInput';

function getApiError(error, fallback) {
  return error?.response?.data?.error || fallback;
}

function Dashboard() {
  const navigate = useNavigate();
  const { logout, subscription, user } = useAuth();
  const [text, setText] = useState('');
  const [summaryRatio, setSummaryRatio] = useState(0.3);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [menuOpen, setMenuOpen] = useState(false);

  const memberSince = useMemo(() => {
    if (!user?.createdAt) {
      return 'Yeni kullanıcı';
    }

    return new Date(user.createdAt).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [user]);

  const showMessage = (type, text) => setMessage({ type, text });

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const response = await api.get('/history');
      setHistory(response.data.history || []);
    } catch (error) {
      const apiError = error?.response?.status;
      if (apiError === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }

      showMessage('error', getApiError(error, 'Geçmiş kayıtları alınamadı.'));
    } finally {
      setHistoryLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSummarize = async () => {
    if (!text.trim()) {
      showMessage('error', 'Lütfen özetlemek istediğiniz metni girin.');
      return;
    }

    try {
      setSummaryLoading(true);
      setMessage({ type: '', text: '' });
      const response = await api.post('/summarize', {
        text,
        summaryRatio,
      });

      setSummary(response.data.historyItem);
      setHistory((current) => [response.data.historyItem, ...current]);
      showMessage('success', 'Özet hazır. Geçmişine kaydedildi.');
    } catch (error) {
      showMessage('error', getApiError(error, 'Özet oluşturulamadı.'));
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleReset = () => {
    setText('');
    setSummary(null);
    setMessage({ type: '', text: '' });
  };

  const handleSelectHistory = (item) => {
    setSummary(item);
    setText(item.originalText);
    showMessage('success', 'Geçmiş kaydı görüntüleniyor.');
  };

  const handleDeleteHistory = async (id) => {
    try {
      setDeletingId(id);
      await api.delete(`/history/${id}`);
      setHistory((current) => current.filter((item) => item.id !== id));
      if (summary?.id === id) {
        setSummary(null);
      }
      showMessage('success', 'Geçmiş kaydı silindi.');
    } catch (error) {
      showMessage('error', getApiError(error, 'Geçmiş kaydı silinemedi.'));
    } finally {
      setDeletingId('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Üretim paneli</span>
          <h1>Makale özetlerini güvenli SaaS panelinden yönet.</h1>
          <p>
            Yeni özet oluştur, önceki analizlere dön ve tüm çıktıları kişisel hesabında sakla.
          </p>
        </div>

        <div className="user-menu">
          <button
            className="user-menu-trigger"
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span>{user?.email}</span>
            <span>▾</span>
          </button>

          {menuOpen && (
            <div className="user-menu-dropdown">
              <button type="button" onClick={() => setMenuOpen(false)}>
                Profil
              </button>
              <button type="button" onClick={handleLogout}>
                Çıkış yap
              </button>
            </div>
          )}
        </div>
      </header>

      {message.text && (
        <div className={`banner ${message.type === 'error' ? 'banner-error' : 'banner-success'}`}>
          {message.text}
        </div>
      )}

      <main className="dashboard-grid">
        <section className="panel panel-main">
          <div className="panel-header">
            <h2>Yeni özet oluştur</h2>
            <span className="status-pill">{subscription?.tier || 'free'} plan</span>
          </div>

          <TextInput
            text={text}
            setText={setText}
            summaryRatio={summaryRatio}
            setSummaryRatio={setSummaryRatio}
            onSummarize={handleSummarize}
            onReset={handleReset}
            loading={summaryLoading}
          />

          {summary ? (
            <SummaryDisplay summary={summary} />
          ) : (
            <div className="empty-card">
              <h3>Henüz bir özet seçmedin</h3>
              <p>Metnini girip özet oluşturduğunda sonuçlar burada görünecek.</p>
            </div>
          )}
        </section>

        <aside className="dashboard-sidebar">
          <section className="panel">
            <div className="panel-header">
              <h2>Profil</h2>
            </div>
            <dl className="profile-grid">
              <div>
                <dt>E-posta</dt>
                <dd>{user?.email}</dd>
              </div>
              <div>
                <dt>Plan</dt>
                <dd>{subscription?.tier || 'free'}</dd>
              </div>
              <div>
                <dt>Durum</dt>
                <dd>{subscription?.status || 'active'}</dd>
              </div>
              <div>
                <dt>Üyelik</dt>
                <dd>{memberSince}</dd>
              </div>
            </dl>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Özet geçmişi</h2>
              <span>{history.length}</span>
            </div>

            {historyLoading ? (
              <div className="empty-card">
                <p>Geçmiş kayıtların yükleniyor...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="empty-card">
                <p>İlk özetini oluşturduğunda burada listelenecek.</p>
              </div>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <article key={item.id} className="history-item">
                    <button
                      className="history-select"
                      type="button"
                      onClick={() => handleSelectHistory(item)}
                    >
                      <strong>{item.summary.slice(0, 72)}...</strong>
                      <span>
                        {new Date(item.createdAt).toLocaleString('tr-TR', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </button>
                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => handleDeleteHistory(item.id)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? 'Siliniyor...' : 'Sil'}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
      </main>
    </div>
  );
}

export default Dashboard;
