# Changelog

Tüm önemli değişiklikler bu dosyada izlenir. Sürüm biçimi `MAJOR.MINOR.PATCH`.

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
