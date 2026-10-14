# ColdBend Pro v2.6.2 — Release Notları

**Release:** v2.6.2 (hotfix / kararlı)  
**Tarih:** 2026-10-15  
**Standartlar:** ASME B31.8 Md. 841.2.3 & Md. 833 · ASME B31.4 Md. 406.2.1 & Md. 402.3 · API 5L / ISO 3183 · BOTAŞ 5120 Rev 7 / İşveren Şartnamesi  
**Sürüm birliği:** Arayüz rozeti = kod = paket = dosya adları → **v2.6.2**

---

## Bu Sürümde Neler Var (v2.6.1'den Farkı)

### 1. JSON Proje Dosyası İçe Aktarma (Import Project JSON)
- **Kayıtlı Projeleri Geri Yükleme:** Önceden dışa aktarılmış `.json` büküm hesaplama dosyalarını tek tıkla uygulamaya geri yükleyen `JSON Yükle` butonu (`#btnImportJSON`) ve dosya seçici eklendi.
- **Normalleştirilmiş Şema Desteği:** Hem ColdBend Pro'nun tam hiyerarşik imalat ve tasarım veri yapısını (`project`, `pipeSpecifications`, `bendDesign`, `siteAsBuiltVerification`) hem de doğrudan durum yedeklerini algılayıp doğrular.
- **Otomatik Canlı Senkronizasyon:** Yüklenen veriler güvenli sayısal sınır filtrelerinden (clamping) geçirilerek `state` ve tüm form alanlarına aktarılır; hesaplama motoru, 2D teknik çizim, 3D model, paso tablosu ve yazdırma föyü anında yenilenir.

### 2. 3D Yüksek Çözünürlüklü PNG Resim Yakalama (Snapshot)
- **Tek Tıkla Ekran Görüntüsü:** 3D WebGL sahnesinden doğrudan yüksek kaliteli PNG resmi indiren `📷 Resim Kaydet` düğmesi (`#btn3dSnapshot`) ve `P` klavye kısayolu eklendi.
- **Güvenilir WebGL Yakalama:** Çizim tamponunun temizlenmesini önleyen `preserveDrawingBuffer: true` altyapısı ile şeffaf/temiz çıktı garantisi sağlandı.
- **Akıllı Dosya Adlandırma:** Görüntüler boru numarasına göre otomatik adlandırılır (`ColdBend_3D_[BoruNo].png`).

### 3. 3D Tam Ekran CAD Modu & Stüdyo Klavye Kısayolları
- **Tam Ekran Görünüm:** 3D çizim alanına çift tıklayarak veya `⛶ Tam Ekran` butonu (`#btn3dFullscreen`) / `F` kısayolu ile tam ekran CAD inceleme modu.
- **Profesyonel Navigasyon Kısayolları:**
  - `Space`: Büküm animasyonunu başlat / duraklat.
  - `Sağ Ok (ArrowRight)`: Sonraki büküm adımına / pasoya ilerle.
  - `Sol Ok (ArrowLeft)`: Önceki büküm adımına geri dön.
  - `Home`: İlk duruma (0. adım - düz boru) dön.
  - `End`: Son adıma (tamamlanmış büküm) git.
  - `1 - 4`: Hızlı kamera açılarına geç (1: İzo, 2: Üst, 3: Yan, 4: Ön).

### 4. 3D Hızlı Kamera Açı Önayarları (CAD Camera Presets)
- Standart mühendislik izleme açıları için tek tıkla geçiş sağlayan buton grubu:
  - `İzo` (İzometrik CAD Perspektifi)
  - `Üst` (Plan / Kuşbakışı Görünüm)
  - `Yan` (Profil Görünümü)
  - `Ön` (Boru Ağzı / Kesit Görünümü)
- Kameranın hedef merkezi ve yukarı (`up`) vektörü gimbal-lock oluşmayacak şekilde otomatik konumlandırılır.

### 5. AutoCAD DXF İmalat Ölçülendirmesi & ASME Başlık Bloğu (Title Block)
- **Ölçülendirme Katmanı (DIMENSIONS / Renk 6 - Magenta):** Ön teğet ($L_{t1}$), arka teğet ($L_{t2}$), dış çap ($OD$), büküm yarıçapı ($R_{\text{bend}}$), yay açısı ($\theta_{\text{arc}}$) ve yay boyu ($L_{\text{arc}}$) teknik ölçü entity'leri.
- **ASME Başlık Bloğu (TITLE_BLOCK / Renk 4 - Cyan):** Çizimin sağ alt köşesinde proje adı, boru no, et kalınlığı, çelik kalitesi, büküm açısı, ovalleşme ve cidar incelme limitlerini içeren 7 satırlı resmi mühendislik onay tablosu.

### 6. 3D İnteraktif Zaman Çizelgesi (Timeline Scrubber) ve İki Yönlü Kontroller
- 3D bükümün herhangi bir anına anında atlamayı sağlayan zaman çizelgesi kaydırıcısı (`#slider3dStep`).
- `◀ Geri` ve `İleri ▶` adım butonları ile paso tablosundaki aktif satır ve 3D boru deformasyonu arasında iki yönlü tam senkronizasyon.

### 7. Pürüzsüz Spiral Kaynak Dikişi & İntrados/Ekstrados Oryantasyon Düzeltmesi
- **Pürüzsüz SAWH Dikişi:** Spiral kaynak dikişinin büküm eğrisi boyunca boru yüzeyini tam takip etmesi için Frenet-Serret paralel transport çatısı ve uyarlanabilir adım yoğunluğu uygulandı.
- **Gerilme Oryantasyonu:** 3D modelde ve gerilme lejantında basma (intrados / iç kavis) ve çekme (extrados / dış kavis) renklerinin ve etiketlerinin 180° ters gösterilmesine yol açan açı sapması düzeltildi.

---

## İndirilenler (5 Dosya)

| # | Kullanım | Dosya | Açıklama |
|---|---|---|---|
| 1 | **Browser** (macOS + Windows) | `ColdBend-Pro-Web-v2.6.2.zip` | Zip'i açıp `index.html` dosyasını çift tıklayın — tarayıcıda çalışır, sunucu/internet gerekmez |
| 2 | **macOS Desktop** (Intel) | `ColdBend-Pro-2.6.2-x64.dmg` | Sürükle-bırak kurulum (Applications) |
| 3 | **macOS Desktop** (Apple Silicon) | `ColdBend-Pro-2.6.2-arm64.dmg` | Sürükle-bırak kurulum (Applications) |
| 4 | **Windows Taşınabilir** (10/11 x64) | `ColdBend-Pro-Portable-2.6.2.exe` | Kurulumsuz — çift tıklayın, doğrudan çalışır |
| 5 | **Windows Kurulumlu** (10/11 x64) | `ColdBend-Pro-Setup-2.6.2.exe` | NSIS sihirbazı; Masaüstü + Başlat kısayolu oluşturur |

---

## Kurulum / Çalıştırma

- **Browser (1):** Zip'i klasöre çıkarın → `index.html` dosyasını çift tıklayın.
- **macOS (2 veya 3):** `.dmg` dosyasını açın → ColdBend Pro ikonunu Applications klasörüne sürükleyin.
- **Windows Taşınabilir (4):** `ColdBend-Pro-Portable-2.6.2.exe` dosyasını çift tıklayın.
- **Windows Kurulumlu (5):** `ColdBend-Pro-Setup-2.6.2.exe` dosyasını çalıştırıp kurulum adımlarını takip edin.
