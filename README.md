# NutriTrack AI — AI Calorie & Activity Tracker

NutriTrack AI, yapay zeka destekli besin tanıma, kalori sayımı ve kapsamlı aktivite/hidrasyon takibi sunan yeni nesil bir sağlık ve beslenme takip uygulamasıdır.

## 🚀 Temel Özellikler

- **Yapay Zeka Destekli Görsel Besin Analizi**: Yemek fotoğrafı üzerinden otomatik porsiyon, kalori ve makro besin ayrıştırması (Google Gemini AI Vision).
- **Hassas Enerji & Makro Dengesi**: Dairesel göstergeler ve oran barları ile anlık kalori açığı ve protein/karb/yağ takibi.
- **Entegre Aktivite ve Hidrasyon**: Günlük adım sayısı, yakılan egzersiz kalorisi ve interaktif su tüketim takibi.
- **Haftalık Özet ve Trendler**: 7 günlük kalori, adım ve su dağılımını gösteren görselleştirilmiş grafikler.
- **Modern ve Duyarlı Tasarım**: Stitch UI tasarım sistemini temel alan, mobil öncelikli zarif arayüz.

## 🛠️ Teknoloji Yığını

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, React 19)
- **Dil**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Stil**: [Tailwind CSS](https://tailwindcss.com/)
- **Yapay Zeka**: Google Gemini 2.5 Flash / Vision API
- **Kimlik Doğrulama & Depolama**: Firebase Authentication & Firestore
- **Hız Sınırlama (Rate Limiting)**: Upstash Redis

## 📁 Proje Dizin Mimarisi

```text
├── public/                 # Statik varlıklar ve görseller
├── src/
│   ├── app/                # Next.js App Router sayfaları ve API rotaları
│   │   ├── layout.tsx      # Kök layout ve tema sarmalayıcı
│   │   └── page.tsx        # Başlangıç / Dashboard sayfası
│   ├── components/         # Yeniden kullanılabilir UI bileşenleri
│   ├── context/            # React Context durum yönetim sağlayıcıları
│   ├── lib/                # API istemcileri, veritabanı ve yardımcı fonksiyonlar
│   └── types/              # Katı TypeScript veri modelleri
│       ├── meal.ts         # Öğün, besin ve AI güven modelleri
│       ├── activity.ts     # Egzersiz, adım ve su tüketim modelleri
│       ├── daily.ts        # Günlük özet ve haftalık trend modelleri
│       └── api.ts          # API yanıt ve AI istek şemaları
├── stitch_nutritrack_ai_app_ui/  # Stitch referans UI kaynakları (Değiştirilmez)
├── .env.example            # Örnek ortam değişkenleri şablonu
├── tailwind.config.ts      # Tailwind CSS yapılandırması
└── tsconfig.json           # TypeScript derleyici kuralları
```

## ⚙️ Kurulum ve Çalıştırma

1. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

2. **Ortam Değişkenlerini Tanımlayın:**
   `.env.example` dosyasını `.env.local` olarak kopyalayın ve ilgili API anahtarlarını girin:
   ```bash
   cp .env.example .env.local
   ```

3. **Geliştirme Sunucusunu Başlatın:**
   ```bash
   npm run dev
   ```
   Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

4. **Derleme ve Tip Doğrulama:**
   ```bash
   npm run build
   npm run lint
   ```

## 📄 Lisans
Bu proje özel mülkiyet ve geliştirme lisansına tabidir.
