# ColdBend Pro v1.0.0 — Release Notları

**Release:** v1.0.0 (ilk kararlı sürüm)
**Tarih:** 2026-10-12
**Durum:** Stable / Production-ready
**Standartlar:** ASME B31.8 Md. 841.2.3 · ASME B31.4 Md. 406.2.1 · İşveren şartnamesi

## Bu sürümde neler var

- Soğuk saha büküm (Cold Field Bend) hesap motoru: geometri, cidar incelmesi (thinning),
  ovalleşme (ovality), geri yaylanma (springback), pulls sayısı, Method-2, ripple ve seam-clock kontrolleri.
- Pulls tablosu → imalat kartı (print card) → 2D skeç → 3D boru görünümü tam senkron (`updateUI()` zinciri korunur).
- Koyu + açık tema, Türkçe arayüz, A4 baskı düzeni (imalat kartı & QC föyü).
- Yerel `lib/three.min.js` + `lib/OrbitControls.js` ile çevrimdışı (saha) 3D çalışır.
- **Yeni:** Electron masaüstü kabuğu — tarayıcı sürümüne dokunmadan çift tıkla çalışan uygulama.
- **Yeni:** `npm run dist:mac` → macOS `.dmg` (+ `.zip`, x64 + arm64).
- **Yeni:** `npm run dist:win` → Windows `.exe` (NSIS kurulum + Portable).
- **Yeni:** GitHub Actions release hattı (`.github/workflows/release.yml`): `v1.0.0` etiketi →
  otomatik derleme → GitHub Release'e `.dmg` / `.exe` ekleme.

## İndirilenler

| Platform | Dosya | Açıklama |
|---|---|---|
| macOS (Intel + Apple Silicon) | `ColdBend Pro-1.0.0.dmg` | Sürükle-bırak kurulum (Applications) |
| macOS | `ColdBend Pro-1.0.0-mac.zip` | Alternatif arşiv |
| Windows 10/11 (x64) | `ColdBend-Pro-Setup-1.0.0.exe` | NSIS kurulum sihirbazı |
| Windows 10/11 (x64) | `ColdBend-Pro-Portable-1.0.0.exe` | Kurulumsuz taşınabilir |

> Tarayıcıda kullanım aynen devam eder: `index.html` dosyasını doğrudan açın
> veya `npx serve .` ile yerelde sunun. Masaüstü sürüm internet gerektirmez
> (Google Fonts çevrimdışıyken sistem fontuna düşer).

## Kurulum

**macOS:**
1. `.dmg` dosyasını açın, ColdBend Pro simgesini Applications klasörüne sürükleyin.
2. İlk açılışta sağ-tık → Aç (imzasız dağıtımda Gatekeeper onayı).
3. `Cmd+P` ile imalat kartını yazdırın / PDF alın.

**Windows:**
1. `ColdBend-Pro-Setup-1.0.0.exe` dosyasını çalıştırın, sihirbazı izleyin.
2. Masaüstü / Başlat kısayolundan başlatın.
3. Alternatif: Portable `.exe` dosyasını çift tıklayın (kurulum yok).

## Doğrulama

- `npm run check` → `app.js` + `electron/*.js` sözdizimi hatasız geçmeli.
- Kritik formüller regresyonsuzdur: thinning / ovality / springback / pulls /
  Method-2 / ripple / seam hesapları bu sürümde değiştirilmemiştir.
- `prt*`, `matVal*`, `kpi*` ID bağlantıları korunur.

## Bilinen kısıtlar

- macOS/Windows paketleri bu sürümde kod imzasızdır (ad-hoc); ilk açılışta
  işletim sistemi onayı gerekir. Sonraki sürümde Apple Developer / EV imza hedeflenir.
- DMG arka plan resmi ve uygulama ikonları yer tutucudur (`build/` altında
  `icon.icns` / `icon.ico` eklenince otomatik kullanılır).

## Yükseltme

v1.0.0 ilk etiketli sürümdür; önceki etiketsiz dağıtımdan geçişte veri kaybı yoktur
(tüm hesaplar istemcide, kalıcı depolama yalnızca tema tercihidir).
