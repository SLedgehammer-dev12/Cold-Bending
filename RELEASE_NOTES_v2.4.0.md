# ColdBend Pro v2.4.0 — Release Notları

**Release:** v2.4.0 (kararlı)
**Tarih:** 2026-10-12
**Standartlar:** ASME B31.8 Md. 841.2.3 · ASME B31.4 Md. 406.2.1 · İşveren şartnamesi
**Sürüm birliği:** Arayüz rozeti = paket = dosya adları → **v2.4.0**

## Bu sürümde neler var (v1.0.0'dan farkı)

- **3D fiber gerilme gradyanı:** Büküm bölgesinde intrados (basınç, mavi) → nötr eksen (çelik) →
  ekstrados (çekme, kırmızı) sürekli renk geçişi. Eğilme fiber teorisiyle hesaplanır
  (σ = E·y/R, ε = y/R, E = 207 000 MPa); tanjantlar nötr kalır, geçişler yumuşatılmıştır.
- **3D lejant:** Görünümün sol üstünde ekstrados/intrados uç değerleri (ε % ve σ MPa) canlı gösterilir.
- **Tema-duyarlı 3D ışıklandırma:** Karanlık temada soğuk ana ışık + sıcak rim + yarımküre dolgusu;
  aydınlık temada yıkanmayı önleyen dengeli pozlama (ACES ton eşleme).
- Çekirdek hesaplar (incelme, ovallik, geri yaylanma, pulls, Method-2, ripple, seam-clock)
  ve `updateUI()` → pulls → imalat kartı → 2D → 3D zinciri değişmemiştir.
- Dağıtım 4 gruba ayrıldı (aşağıdaki tablo).

## İndirilenler

| # | Kullanım | Dosya | Açıklama |
|---|---|---|---|
| 1 | **Browser** (macOS + Windows) | `ColdBend-Pro-Web-v2.4.0.zip` | Zip'i açıp `index.html` dosyasını çift tıklayın — tarayıcıda çalışır, sunucu/internet gerekmez |
| 2 | **macOS Desktop** (Intel + Apple Silicon) | `ColdBend Pro-2.4.0.dmg` | Sürükle-bırak kurulum (Applications) |
| 3 | **Windows Taşınabilir** (10/11 x64) | `ColdBend-Pro-Portable-2.4.0.exe` | Kurulumsuz — çift tıklayın, doğrudan çalışır |
| 4 | **Windows Kurulumlu** (10/11 x64) | `ColdBend-Pro-Setup-2.4.0.exe` | NSIS sihirbazı; Masaüstü + Başlat kısayolu oluşturur |

## Kurulum / Çalıştırma

**Browser (1):** Zip'i klasöre çıkarın → `index.html` dosyasını çift tıklayın.
Alternatif: klasörde `npx serve .` çalıştırıp `http://localhost:3000` adresini açın.

**macOS (2):** `.dmg` dosyasını açın → simgeyi Applications klasörüne sürükleyin.
İmzasız dağıtımda ilk açılış: sağ-tık → Aç.

**Windows Portable (3):** `.exe` dosyasını çift tıklayın, kurulum yoktur.

**Windows Setup (4):** `.exe` dosyasını çalıştırıp sihirbazı izleyin.

Tüm masaüstü sürümlerde `Ctrl/Cmd+P` ile imalat kartı yazdırılır / PDF alınır.

## Doğrulama

- `npm run check` → sözdizimi hatasız.
- Kritik formüller regresyonsuzdur: thinning, ovality, springback, pulls,
  Method-2, ripple, seam-clock hesapları değiştirilmemiştir.
- `prt*`, `matVal*`, `kpi*` ID bağlantıları korunur; TR arayüz, karanlık/aydınlık tema, A4 baskı.

## Bilinen kısıtlar

- Masaüstü paketler kod imzasızdır (ad-hoc); ilk açılışta işletim sistemi onayı gerekir.
- Lejanttaki σ değerleri elastik fiber teorisidir; gerçekte plastik akma ile sınırlıdır —
  kabul/ret kararları cidar incelmesi ve ovallik kontrollerine göre verilir.
- Uygulama ikonu varsayılandır; `build/` altına `icon.icns` / `icon.ico` eklenince kullanılır.
