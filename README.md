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

## 🤖 Model Fine-tuning

Eğitim verileri ile BART modeli fine-tune edebilirsiniz:

### 1) Python Bağımlılıkları Kur

```bash
cd backend
pip install -r requirements-training.txt
```

### 2) Eğitim Verileri Hazırla

Dashboard'daki "Eğitim Verisi Ekle" formundan metin-özet çiftleri girin.

### 3) Model Eğitim Komutunu Çalıştır

```bash
python train_model.py
```

**Parametreler:**
- `MONGODB_URI`: MongoDB bağlantı adresi
- `Epochs`: 3
- `Batch Size`: 2
- `Model`: facebook/bart-large-cnn
- `Çıktı`: `./trained_model/` dizini

**Çıktı:**
```
========================================
BART Model Fine-tuning Pipeline
========================================
✅ GPU available: NVIDIA GPU name (or CPU)
✅ MongoDB connection successful
✅ Loaded X training samples
Training for 3 epochs with batch size 2...
✅ Training completed
✅ Model saved to ./trained_model
```

### 4) Eğitim Verisi API Endpoints

- `POST /api/training/add` - Eğitim verisi ekle (JWT required)
- `GET /api/training/list` - Tüm eğitim verilerini getir (JWT required)
- `DELETE /api/training/:id` - Eğitim verisini sil (JWT required)

**Örnek POST isteği:**
```json
{
  "text": "Makale veya rapor metni...",
  "summary": "Özeti..."
}
```

## 🚀 Inference Server

Eğitim yapılmış model ile tahmin yapmak için inference server'ı başlatabilirsiniz:

### 1) Model Eğit

```bash
python train_model.py
```

### 2) Inference Server'ı Başlat

```bash
python inference_server.py
```

Server port 5000'de çalışır.

### 3) API Endpoints

**GET /health**
```bash
curl http://localhost:5000/health
```

**GET /api/model-status**
```bash
curl http://localhost:5000/api/model-status
```

Response:
```json
{
  "status": "ready",
  "model": "facebook/bart-large-cnn",
  "device": "cuda",
  "max_input_length": 512,
  "max_output_length": 128
}
```

**POST /api/summarize**
```bash
curl -X POST http://localhost:5000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"text": "Makale metni..."}'
```

Response:
```json
{
  "status": "success",
  "summary": "Özeti...",
  "confidence": 0.92,
  "input_length": 250,
  "output_length": 45
}
```

**POST /api/retrain** (MongoDB'den veri ile yeniden eğit)
```bash
curl -X POST http://localhost:5000/api/retrain
```

### 4) Environment Variables

`.env` dosyasına ekleyin:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/makale-ozeti
INFERENCE_PORT=5000
```

### 5) CORS Ayarı

- Inference server: `http://localhost:3000` ve `http://127.0.0.1:3000` için CORS açık
- Express.js Backend: Kendi CORS ayarlarını kullanır

