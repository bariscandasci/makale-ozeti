import React from 'react';
import './Dashboard.css';
import { useAuth } from '../context/AuthContext';
import TrainingDataForm from './TrainingDataForm';
import TrainingDataList from './TrainingDataList';

function Dashboard() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Makale Özeti</span>
          <h1>🤖 Yapay Zeka Eğit</h1>
          <p>Metin ve özet çiftleri ekleyerek modeli eğitin.</p>
        </div>

        <div className="user-menu">
          <button
            className="user-menu-trigger"
            type="button"
            onClick={handleLogout}
          >
            <span>{user?.email}</span>
            <span>⏻</span>
          </button>
        </div>
      </header>

      <main className="dashboard-grid">
        <section className="panel panel-main">
          <div className="panel-header">
            <h2>Eğitim Verisi Ekle</h2>
            <span className="status-pill">Training</span>
          </div>

          <TrainingDataForm />
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
                <dt>Durum</dt>
                <dd>Aktif</dd>
              </div>
            </dl>
          </section>

          <TrainingDataList />
        </aside>
      </main>
    </div>
  );
}

export default Dashboard;
