# 📰 Makale Özeti Yapan Tool

Türkçe makaleleri hızlıca özetleyen, anahtar kelimeleri çıkaran ve duygu analizi yapan web uygulaması.

## ✨ Özellikler

- 📝 **Metin Özeti**: Makaleleri istenilen orana göre özetle
- 🔑 **Anahtar Kelimeler**: Makale hakkında en önemli kelimeleri bul
- 😊 **Duygu Analizi**: Metnin duygusunu (pozitif/negatif/nötr) analiz et
- 🌐 **URL Desteği**: Web sayfalarından direkt özet yap (Yakında)
- 📄 **PDF Upload**: PDF dosyalarını yükleyip özetle (Yakında)
- 📥 **Tek Tıkla Paylaş**: Özeti Twitter, LinkedIn'de paylaş
- 🎨 **Modern Arayüz**: React ile güzel ve hızlı kullanıcı deneyimi

## 🛠️ Teknik Stack

- **Frontend**: React 18 + CSS3
- **Backend**: Node.js + Express
- **NLP**: Natural.js (Türkçe dil işleme)
- **Styling**: Modern CSS with Animations

## 📋 Proje Yapısı

```
makale-ozeti/
├── backend/
│   ├── server.js              # Express sunucu
│   ├── package.json           # Backend dependencies
│   └── routes/
│       └── api.js             # API endpoints
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Ana component
│   │   ├── App.css            # Stil dosyası
│   │   ├── components/        # React components
│   │   │   ├── TextInput.jsx
│   │   │   └── SummaryDisplay.jsx
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   └── package.json           # Frontend dependencies
└── README.md
```

## 🚀 Hızlı Başlama

### Gereksinimler
- Node.js 16+
- npm veya yarn

### Kurulum

```bash
# Repository'yi kopyala
git clone https://github.com/bariscandasci/makale-ozeti.git
cd makale-ozeti

# Backend kur ve başlat (Terminal 1)
cd backend
npm install
npm start

# Frontend kur ve başlat (Terminal 2 - yeni pencere)
cd frontend
npm install
npm start
```

✅ Browser'da açılacak: **http://localhost:3000**

## 📖 API Endpoints

### POST /api/summarize
Metni özetle

**Request:**
```json
{
  "text": "Makale metni...",
  "summaryRatio": 0.3
}
```

**Response:**
```json
{
  "summary": "Özet metni...",
  "keywords": ["anahtar1", "anahtar2", ...],
  "sentiment": "positive",
  "originalLength": 10,
  "summaryLength": 3
}
```

## 📚 Geliştirme Aşamaları

### ✅ Aşama 1: MVP (Tamamlandı)
- [x] Proje yapısı
- [x] Basit özet API'si
- [x] Frontend bağlantısı
- [x] Anahtar kelimeler
- [x] Duygu analizi

### ⏳ Aşama 2: Genişleme
- [ ] URL scraping
- [ ] PDF upload
- [ ] Geliştirilmiş duygu analizi

### ⏳ Aşama 3: İleri Özellikler
- [ ] Kullanıcı hesapları
- [ ] Özet geçmişi
- [ ] Browser extension
- [ ] Paylaşma seçenekleri

## 🧪 Kullanım

1. **Metin Gir**: Makale, haber veya herhangi bir Türkçe metni kopyala-yapıştır
2. **Özet Oranını Ayarla**: Kaydırıcıyla %10 ile %100 arasında seç
3. **Özet Yap**: Butonuna tıkla
4. **Sonuçları Görüntüle**: 
   - Oluşturulan özeti oku
   - Anahtar kelimeleri gözlemle
   - Duygu analizini kontrol et
5. **Paylaş**: Twitter veya LinkedIn'de paylaş

## 🤝 Katkıda Bulunma

Bu proje eğitim amaçlı açık kaynak projedir. Katkılarınızı bekliyorum!

1. Fork et
2. Feature branch oluştur (`git checkout -b feature/AmazingFeature`)
3. Commit et (`git commit -m 'Add some AmazingFeature'`)
4. Push et (`git push origin feature/AmazingFeature`)
5. Pull Request aç

## 📝 Lisans

MIT - Detaylar için [LICENSE](LICENSE) dosyasını incele

## ✍️ Yazar

[Barış Çandaş](https://github.com/bariscandasci)

## 📞 İletişim

Sorularınız, önerileriniz veya hata bildirimleri için [issues](https://github.com/bariscandasci/makale-ozeti/issues) kısmında bildirin.

---

**Made with ❤️ for Turkish NLP enthusiasts**
