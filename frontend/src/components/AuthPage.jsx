import React, { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getApiError(error, fallback) {
  return error?.response?.data?.error || fallback;
}

function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = useMemo(
    () =>
      isSignup
        ? {
            title: 'SaaS hesabını oluştur',
            subtitle: 'Özet geçmişini kaydet, analizlerini yönet ve her cihazdan eriş.',
            submitLabel: 'Hesap oluştur',
            switchText: 'Zaten hesabın var mı?',
            switchLink: '/login',
            switchLabel: 'Giriş yap',
          }
        : {
            title: 'Tekrar hoş geldin',
            subtitle: 'Makale özetlerini güvenli hesabınla yönetmeye devam et.',
            submitLabel: 'Giriş yap',
            switchText: 'Hesabın yok mu?',
            switchLink: '/signup',
            switchLabel: 'Kayıt ol',
          },
    [isSignup]
  );

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormError('Geçerli bir e-posta adresi girin.');
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Şifre en az 8 karakter olmalı.');
      return;
    }

    if (isSignup && formData.password !== formData.confirmPassword) {
      setFormError('Şifreler eşleşmiyor.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isSignup) {
        await register({
          email: formData.email.trim(),
          password: formData.password,
        });
      } else {
        await login({
          email: formData.email.trim(),
          password: formData.password,
        });
      }

      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(
        getApiError(error, isSignup ? 'Kayıt sırasında hata oluştu.' : 'Giriş sırasında hata oluştu.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <span className="eyebrow">Makale Özeti SaaS</span>
        <h1>Türkçe içerik özetleme akışını profesyonel seviyeye taşı.</h1>
        <p>
          Hesabını oluştur, özetlerini kaydet, geçmişteki analizleri tekrar incele ve
          verimli bir içerik üretim paneliyle çalış.
        </p>
        <ul className="feature-list">
          <li>JWT tabanlı güvenli oturum</li>
          <li>Kişisel özet geçmişi ve silme yönetimi</li>
          <li>Abonelik katmanı ve profil paneli</li>
        </ul>
      </section>

      <section className="auth-card">
        <div className="auth-card-header">
          <h2>{copy.title}</h2>
          <p>{copy.subtitle}</p>
        </div>

        {formError && <div className="banner banner-error">{formError}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            E-posta
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ornek@eposta.com"
              autoComplete="email"
              disabled={isSubmitting}
            />
          </label>

          <label>
            Şifre
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="En az 8 karakter"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              disabled={isSubmitting}
            />
          </label>

          {isSignup && (
            <label>
              Şifre tekrar
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Şifreni tekrar yaz"
                autoComplete="new-password"
                disabled={isSubmitting}
              />
            </label>
          )}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Gönderiliyor...' : copy.submitLabel}
          </button>
        </form>

        <p className="auth-switch">
          {copy.switchText} <Link to={copy.switchLink}>{copy.switchLabel}</Link>
        </p>
      </section>
    </div>
  );
}

export default AuthPage;
