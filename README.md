# 📰 Makale Özeti SaaS

Türkçe makaleleri özetleyen uygulamanın SaaS sürümü. Kullanıcı hesabı oluşturma, JWT tabanlı kimlik doğrulama, özet geçmişi, abonelik katmanı ve üretime hazır yapılandırma içerir.

## ✨ Öne Çıkan Özellikler

- **MongoDB entegrasyonu**: Kullanıcı, abonelik ve özet geçmişi kayıtları
- **JWT authentication**: Kayıt ol, giriş yap, korumalı profil ve geçmiş rotaları
- **Özet geçmişi**: Önceki özetleri görüntüleme ve silme
- **Profesyonel dashboard**: Profil kartı, özet oluşturucu ve geçmiş paneli
- **Responsive UI**: Login/signup akışları, kullanıcı menüsü, bildirimler ve loading durumları
- **Deployment-ready**: Ortam değişkenleri, CORS, Render/Railway uyumlu port ayarı

## 🧱 Teknoloji Yığını

- **Frontend**: React 18, React Router, Axios
- **Backend**: Node.js, Express
- **Veritabanı**: MongoDB + Mongoose
- **Güvenlik**: bcryptjs, jsonwebtoken
- **NLP**: Natural.js

## 📁 Proje Yapısı

```text
makale-ozeti/
├── backend/
│   ├── app.js
│   ├── server.js
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── models/
│   ├── routes/api.js
│   ├── services/dataStore.js
│   └── utils/summarizeText.js
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/AuthContext.jsx
│       ├── services/api.js
│       ├── App.jsx
│       └── App.test.jsx
└── README.md
```

## 🚀 Lokal Kurulum

### 1) Backend ortam değişkenleri

`/backend/.env.example` dosyasını kopyalayın:

```bash
cd backend
cp .env.example .env
```

Örnek içerik:

```env
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/makale-ozeti
JWT_SECRET=replace-with-a-long-random-secret
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
```

### 2) Frontend ortam değişkenleri (opsiyonel)

```bash
cd ../frontend
cp .env.example .env
```

Varsayılan geliştirme akışında `package.json` proxy ayarı ile backend `http://localhost:3001` adresine yönlenir.

### 3) Bağımlılıklar ve çalışma

```bash
# Backend
cd backend
npm install
npm start

# Frontend (ayrı terminal)
cd ../frontend
npm install
npm start
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

> Not: `MONGODB_URI` verilmezse uygulama geliştirme amaçlı geçici in-memory store ile açılır. Üretimde mutlaka gerçek MongoDB bağlantısı sağlayın.

## 🔐 API Rotaları

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/profile` _(protected)_

### Summary

- `POST /api/summarize` _(protected, geçmişe kaydeder)_
- `GET /api/history` _(protected)_
- `DELETE /api/history/:id` _(protected)_

### Örnek kayıt isteği

```json
{
  "email": "demo@example.com",
  "password": "strongPass123"
}
```

### Örnek özet isteği

```json
{
  "text": "Uzun makale metni...",
  "summaryRatio": 0.3
}
```

## 🧪 Komutlar

### Frontend

```bash
npm test -- --watch=false
npm run build
```

### Backend

```bash
npm start
```

## ☁️ Deployment Notları

- Render/Railway için backend servisinde `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN` tanımlayın.
- Frontend için gerekirse `REACT_APP_API_URL` ile API adresini belirtin.
- Üretimde güçlü bir `JWT_SECRET` ve yönetilen MongoDB servisi kullanın.
