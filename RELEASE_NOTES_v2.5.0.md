# ColdBend Pro v2.5.0 — Release Notları

**Release:** v2.5.0 (kararlı)
**Tarih:** 2026-10-12
**Standartlar:** ASME B31.8 Md. 841.2.3 · ASME B31.4 Md. 406.2.1 · İşveren şartnamesi
**Sürüm birliği:** Arayüz rozeti = kod = paket = dosya adları → **v2.5.0**

## Bu sürümde neler var (v2.4.0'dan farkı)

- **Update Manager (yeni):** Program artık yeni sürümleri kendisi denetler.
  - Başlıktaki ⟳ rozet butonu: açılışta günde 1 kez sessiz kontrol (sonuç 24 saat önbellekte).
  - Rozet durumu: `v2.5.0 • Güncel` (yeşil) veya `Yeni sürüm: vX` (sarı).
  - Tıklayınca açılan modal: sürüm karşılaştırması, release notları ve platforma özel
    indirme düğmeleri (Mac → `.dmg`, Windows → Portable/Setup `.exe`, her platformda Web `.zip`).
  - Çevrimdışı/sahada kullanımda otomatik denetim sessizce atlanır; manuel denetimde
    açıklayıcı mesaj gösterilir.
- Çekirdek hesaplar (incelme, ovallik, geri yaylanma, pulls, Method-2, ripple, seam-clock)
  ve `updateUI()` → pulls → imalat kartı → 2D → 3D zinciri değişmemiştir.

## İndirilenler (5 dosya)

| # | Kullanım | Dosya | Açıklama |
|---|---|---|---|
| 1 | **Browser** (macOS + Windows) | `ColdBend-Pro-Web-v2.5.0.zip` | Zip'i açıp `index.html` dosyasını çift tıklayın — tarayıcıda çalışır, sunucu/internet gerekmez |
| 2 | **macOS Desktop** (Intel) | `ColdBend-Pro-2.5.0-x64.dmg` | Sürükle-bırak kurulum (Applications) |
| 3 | **macOS Desktop** (Apple Silicon) | `ColdBend-Pro-2.5.0-arm64.dmg` | Sürükle-bırak kurulum (Applications) |
| 4 | **Windows Taşınabilir** (10/11 x64) | `ColdBend-Pro-Portable-2.5.0.exe` | Kurulumsuz — çift tıklayın, doğrudan çalışır |
| 5 | **Windows Kurulumlu** (10/11 x64) | `ColdBend-Pro-Setup-2.5.0.exe` | NSIS sihirbazı; Masaüstü + Başlat kısayolu oluşturur |

## Kurulum / Çalıştırma

**Browser (1):** Zip'i klasöre çıkarın → `index.html` dosyasını çift tıklayın.

**macOS (2–3):** `.dmg` dosyasını açın → simgeyi Applications klasörüne sürükleyin.
İmzasız dağıtımda ilk açılış: sağ-tık → Aç.

**Windows Portable (4):** `.exe` dosyasını çift tıklayın, kurulum yoktur.

**Windows Setup (5):** `.exe` dosyasını çalıştırıp sihirbazı izleyin.

## Doğrulama

- `npm run check` → sözdizimi hatasız.
- Kritik formüller regresyonsuzdur.
- `prt*`, `matVal*`, `kpi*` ID bağlantıları korunur; TR arayüz, karanlık/aydınlık tema, A4 baskı.

## Bilinen kısıtlar

- Masaüstü paketler kod imzasızdır (ad-hoc); ilk açılışta işletim sistemi onayı gerekir.
- Sürüm denetimi GitHub API kullanır (saatte 60 istek limiti); önbellek sayesinde normal
  kullanımda limite takılmaz.
