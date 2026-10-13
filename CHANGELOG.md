# Changelog

Tüm önemli değişiklikler bu dosyada izlenir. Sürüm biçimi `MAJOR.MINOR.PATCH`.

## [2.6.0] — 2026-10-13

Kapsamlı 10-Aşamalı Mühendislik ve Saha QC Güncellemesi, Açık/Koyu Tema Okunurluk İyileştirmesi ve Sürüm Birliği v2.6.0.

### Eklenen
- **Açık / Koyu Tema (Light & Dark Mode):** Yüksek kontrastlı açık tema (`body.light-theme`), `localStorage` kalıcılığı ve tema-duyarlı 2D/3D/Method-2 renk paleti.
- **1. Adım — Çevresel Alın Kaynağı (Girth Weld) Doğrulaması:** ASME B31.8 Md. 841.2.3(a)(5) uyarınca kaynağın aktif büküm yayı (`PC`–`PT`) içinde olup olmadığının kontrolü, `%100 RT` uyarısı, 2D ve 3D halka gösterimi.
- **2. Adım — A4 QC İmalat Föyünde 2D Vektörel CAD Çizimi:** Yazdırılabilir imalat kartına (`#svgPrintBend2D`) ölçekli, yüksek kontrastlı 2D teknik büküm şeması gömülmesi.
- **3. Adım — Excel CSV & JSON Dışa Aktarımı:** Büküm paso tablosu ve mühendislik özetinin UTF-8 BOM destekli Türkçe Excel `.csv` ve `.json` olarak dışa aktarımı.
- **4. Adım — Boru Ağırlığı & Sahada Kaldırma (Rigging) Hesabı:** API 5L / ISO 3183 birim ağırlık (`kg/m`), toplam boru kütlesi (`Ton`), çift sideboom sapan yükü ve önerilen minimum SWL (`DAF = 1.25`).
- **5. Adım — Topografik Eğim & Kot Farkından Büküm Hesaplayıcı (`#slopeModal`):** Yüzde eğim (`%`), derece (`°`) veya 3 noktalı (`KP` + `Kot Z`) harita verisinden net büküm açısı ve büküm tipi (`Overbend`/`Sagbend`) hesabı.
- **6. Adım — Tasarım Sıcaklığı Katsayısı $T$ (Temperature Derating):** ASME B31.8 Tablo 841.1.8-1 doğrusal enterpolasyonu ile yüksek sıcaklıklarda efektif akma dayanımı ve Barlow minimum et kalınlığı ($t_{\min}$) revizyonu.
- **7. Adım — 2D CAD İnteraktif Zoom, Pan & Yaya Odaklanma:** Fare tekerleği ile imleç merkezli yakınlaştırma (`%60`–`%500`), sürükle-kaydır (Pan) ve `🎯 Yaya Odaklan` (`PC`–`PT` otomatik kadrajlama).
- **8. Adım — Bileşik Gerilme & Von Mises Eşdeğer Gerilme Tahkiki:** ASME B31.8 Md. 833 & B31.4 Md. 402.3 uyarınca Çevresel ($S_h$), Boyuna ($S_L$) ve Von Mises ($S_{eq} \le 0.90 \cdot \text{SMYS} \cdot T$) gerilme analizi.
- **9. Adım — Büküm Makinesi Kalıp & Sıkma Pimi Tutma Payı Kontrolü:** Ön ve arka düz uçların minimum makine kavrama boyuna ($L_{\text{clamp,min}} = \max(1.2 \cdot D, 1.50\text{ m})$) uygunluk denetimi.
- **10. Adım — İnteraktif Operatör Paso Denetim Modu:** Paso tablosu satır seçimi, `◀ Önceki` / `Sonraki ▶` ve klavye ok tuşları (`ArrowLeft`/`ArrowRight`) ile adım adım 2D istasyon etiketi ve 3D halka/kalıp senkronizasyonu.

### Düzeltilen
- **NPS 12" (OD 323.9 mm) ve Küçük Çap Sınıflandırması:** ASME B31.8 Tablo 841.2.3-1 uyarınca OD $\le 325\text{ mm}$ boruların doğru şekilde NPS 12 sınıfına ($R_{\min} = 18D$, Yöntem 2 limiti $3.20^\circ/D$) atanması sağlandı.

### Korunan (regresyon yok)
- Çekirdek formüller ve `updateUI()` → pulls → print → 2D → 3D zinciri, `prt*` / `matVal*` / `kpi*` bağlantıları, TR arayüz, A4 baskı.

## [2.5.0] — 2026-10-12

Yeni özellik: Update Manager. Sürüm birliği v2.5.0.

### Eklenen
- Update Manager (`APP_VERSION`, `checkForUpdates`, `renderUpdateModal`): açılışta sessiz
  günlük GitHub Releases denetimi + başlıkta durum rozeti + manuel denetim butonu +
  platforma göre indirme öneren modal. Çevrimdışında sessiz geçiş.
- Başlık rozeti artık `APP_VERSION` sabitinden üretilir (`syncVersionBadge`).

### Korunan (regresyon yok)
- Çekirdek formüller ve `updateUI()` zinciri, `prt*` / `matVal*` / `kpi*` bağlantıları,
  TR arayüz, tema, A4 baskı.

## [2.4.0] — 2026-10-12

Arayüz rozeti, paket ve dosya adları v2.4.0'da birleştirildi. Dağıtım 4 gruba ayrıldı.

### Eklenen
- 3D fiber gerilme gradyanı (`update3DPipe`): intrados/extrados uç değerlerinden
  (σ = E·y/R, ε = y/R) hesaplanan sürekli renk geçişi, tanjantlarda nötr, kenarlarda
  yumuşak geçiş. Eski ikili kırmızı/mavi eşik mantığı ve sidebend asimetrisi giderildi.
- 3D lejant overlay (`legend3D`, `legend3DValueExt/Int`): uç fiber değerleri canlı.
- Tema-duyarlı 3D ışık rig'i (`tune3DLights`): karanlık/aydınlık temada ayrı
  ambient/ana/rim/yarımküre dengesi + ACES ton eşleme; tema değişiminde 3D yeniden kurulur.
- Browser paketi: `ColdBend-Pro-Web-vX.Y.Z.zip` (CI `build-web` işi).
- Workflow versiyon-dinamik: etiket adından sürüm alır (`v*.*.*`), sonraki
  release'lerde dosya adı/başlık/not yolu otomatik uyar.

### Değişen
- Sürüm rozeti, `package.json`, DMG başlığı, NSIS/Portable dosya adları → v2.4.0.
- `electron/main.js` sürümü `package.json` dosyasından okur (tek kaynak).
- Boru malzemesi `metalness 0.75 → 0.45`, `roughness 0.35 → 0.42` (gradyan okunurluğu).

### Korunan (regresyon yok)
- Çekirdek formüller ve `updateUI()` → pulls → print → 2D → 3D zinciri,
  `prt*` / `matVal*` / `kpi*` bağlantıları, TR arayüz, tema, A4 baskı.

## [1.0.0] — 2026-10-12

İlk kararlı release. Tarayıcı uygulaması değişmeden korunur; masaüstü dağıtım eklenir.

### Eklenen
- Electron kabuğu (`electron/main.js`, `electron/preload.js`): `index.html` dosyasını
  `file://` ile açan, harici bağlantıları sistem tarayıcısına yönlendiren,
  `CmdOrCtrl+P` ile imalat kartı baskısını destekleyen masaüstü sarmalayıcı.
- `package.json` v1.0.0: `electron` + `electron-builder`, `dist:mac` / `dist:win` /
  `dist:all` betikleri, mac (dmg+zip, x64+arm64) ve win (nsis+portable, x64) hedefleri.
- `.github/workflows/release.yml`: `v*.*.*` etiketi veya manuel tetikleme ile
  macOS + Windows derlemesi, artifact yükleme ve GitHub Release yayınlama.
- `RELEASE_NOTES_v1.0.md`: v1.0 sürüm notları (TR).
- `build/` yer tutucu ikon/entitlement notları.

### Değişen
- `index.html` sürüm rozeti: `v2.4 - ASME Compliant` → `v1.0.0 - ASME Compliant`
  (release versiyonu tekilleştirildi).
- `.gitignore`: `node_modules/`, `dist/`, Electron önbellekleri eklendi.

### Korunan (regresyon yok)
- `app.js` hesap çekirdeği: thinning, ovality, springback, pulls, Method-2,
  ripple, seam-clock formülleri ve `updateUI()` → pulls → print → 2D → 3D zinciri.
- `prt*` / `matVal*` / `kpi*` ID bağlantıları, TR arayüz, dark/light tema, A4 baskı.
