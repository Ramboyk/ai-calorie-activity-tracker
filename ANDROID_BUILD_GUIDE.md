# NutriTrack AI - Android APK Derleme ve Kurulum Kılavuzu

Bu kılavuz, **NutriTrack AI** projesinin Capacitor 8 ile yapılandırılmış yerel Android platformu üzerinden `app-debug.apk` dosyasını üretme, telefona aktarma ve test etme adımlarını içerir.

---

## 📱 Mimari Özet

* **Paket Kimliği (App ID):** `com.nutritrack.ai`
* **Uygulama Adı:** `NutriTrack AI`
* **Hibrit Sunucu Entegrasyonu:** `https://ai-calorie-activity-tracker.vercel.app`
  * Gemini 3.6 Flash yapay zeka analizi, Upstash Redis rate limiter ve Firebase API rotaları Vercel üzerinde güvenle çalışırken, mobil uygulama yerel Android kabuğu (Capacitor WebView) içinde çalışır.
* **Donanım ve Sistem İzinleri (`AndroidManifest.xml`):**
  * `android.permission.CAMERA`: Kamera ile yemek fotoğrafı çekebilme.
  * `android.permission.INTERNET`: Canlı AI analizi ve API senkronizasyonu.
  * `android.permission.ACCESS_NETWORK_STATE`: Çevrimdışı/çevrimiçi durum tespiti.
  * `android.permission.VIBRATE`: Bildirim ve kullanıcı etkileşim geri bildirimleri.
  * `android.hardware.camera` (`required: false`): Kamerası olmayan veya kısıtlı tabletlerde de yüklenebilir.

---

## 🛠️ Adım 1: Ön Gereksinimler

1. Bilgisayarınızda **Android Studio** (Koala, Ladybug veya üstü) kurulu olmalıdır.
2. Android Studio içerisinde **Android SDK Platform** ve **Android Build-Tools** kurulu olmalıdır.
3. Proje dizininde web varlıklarının Android ile senkronize edildiğinden emin olun:
   ```bash
   npm run cap:sync
   ```

---

## 🚀 Adım 2: Projeyi Android Studio'da Açma

Projeyi Android Studio ile açmak için 2 yöntem kullanabilirsiniz:

### Yöntem 1 (Terminal ile Tek Komut):
```bash
npm run cap:open
```

### Yöntem 2 (Manuel):
1. Android Studio'yu başlatın.
2. **Open** (veya *File -> Open...*) butonuna tıklayın.
3. Projenizin içindeki `android` klasörünü seçin:
   `c:\Users\HP\Documents\AI Calorie & Activity Tracker\android`
4. Projenin açılmasını ve sağ alttaki **Gradle Sync** işleminin tamamlanmasını bekleyin (*"Gradle sync finished"* bildirimi görünecektir).

---

## 📦 Adım 3: Tek Tıkla Debug APK Üretme

1. Android Studio üst menüsünden:
   **`Build`** -> **`Build Bundle(s) / APK(s)`** -> **`Build APK(s)`**
   seçeneğine tıklayın.
2. Gradle derleme işlemi başlayacaktır (genellikle 1-2 dakika sürer).
3. Derleme tamamlandığında sağ alt köşede şu bildirim çıkar:
   > **Build APK(s): APK(s) generated successfully for 1 module.**  
   > `locate` bağlantısı yer alır.
4. `locate` bağlantısına tıkladığınızda APK dosyasının bulunduğu klasör otomatik açılır:
   ```text
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## 📲 Adım 4: APK'yı Telefona Aktarma ve Yükleme

Üretilen `app-debug.apk` dosyasını Android telefonunuza yüklemek için aşağıdaki yöntemlerden birini seçin:

### Yöntem A: USB Kablosu ile
1. Telefonunuzu USB kablosuyla bilgisayara bağlayın ve telefonda **"Dosya Aktarımı / MTP"** modunu seçin.
2. Bilgisayarınızdaki `app-debug.apk` dosyasını telefonun **Download (İndirilenler)** klasörüne kopyalayın.
3. Telefonda **Dosyalarım (Files)** uygulamasını açıp `app-debug.apk` dosyasına dokunun.

### Yöntem B: Google Drive veya WhatsApp Web ile
1. `app-debug.apk` dosyasını Google Drive'ınıza yükleyin veya WhatsApp Web üzerinden kendinize gönderin.
2. Telefonunuzda Drive veya WhatsApp üzerinden dosyayı indirin ve üzerine dokunun.

### Yükleme İzni (İlk Kez Yükleyenler İçin):
* Android "Bu kaynaktan yüklemeye izin ver" uyarısı verirse: **Ayarlar -> Bu kaynaktan izin ver** anahtarını açın.
* Play Protect "Bilinmeyen geliştirici" veya "Zararlı uygulama engellendi" uyarısı verirse: **Ayrıntılar -> Yine de yükle (Install anyway)** seçeneğine dokunun (Geliştirme aşamasındaki debug imzalı tüm APK'lar için bu standarttır).

---

## 🧪 Adım 5: Canlı Test ve Doğrulama Senaryoları

Uygulama açıldıktan sonra aşağıdaki 3 kritik akışı test edebilirsiniz:

1. **Kamera & Görsel Kalite Koruyucusu (Step 3 Entegrasyonu):**
   * "Öğün Analizi" sekmesine geçin ve fotoğraf yükleme alanına dokunun.
   * Kameranızı açarak bir yemek tabağı fotoğrafı çekin.
   * Gerçek zamanlı parlaklık ve netlik analizi rozetini (Mükemmel / Kabul Edilebilir / Çok Karanlık / Bulanık) gözlemleyin.
2. **Canlı Yapay Zeka Analizi:**
   * "Analiz Et" butonuna basarak Vercel backend'i üzerinden Gemini 3.6 Flash modelinin kalori, protein, karbonhidrat ve yağ değerlerini saniyeler içinde çıkardığını doğrulayın.
3. **Tam Çevrimdışı ve Uçak Modu Testi (Step 1, 2, 4 Entegrasyonu):**
   * Telefonunuzu **Uçak Modu**na alın (İnterneti ve Wi-Fi'ı tamamen kapatın).
   * Uygulamayı kapatıp tekrar açın; Service Worker App Shell sayesinde anında açılacaktır.
   * Su ekleme, adım sayacı ve geçmiş günlerin IndexedDB'den anında yüklendiğini görün.
   * Çevrimdışıyken bir yemek fotoğrafı seçtiğinizde fotoğrafın silinmeyip `pending_analyses` (Çevrimdışı Kuyruk) içerisine alındığını doğrulayın.
