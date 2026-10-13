# ColdBend Pro v2.6.0 — Release Notları

**Release:** v2.6.0 (kararlı)
**Tarih:** 2026-10-13
**Standartlar:** ASME B31.8 Md. 841.2.3 & Md. 833 · ASME B31.4 Md. 406.2.1 & Md. 402.3 · API 5L / ISO 3183 · İşveren Şartnamesi
**Sürüm birliği:** Arayüz rozeti = kod = paket = dosya adları → **v2.6.0**

## Bu sürümde neler var (v2.5.0'dan farkı)

- **Açık / Koyu Tema (Light & Dark Mode):** Yüksek okunurluğa sahip açık tema (`☀️ Açık Tema` / `🌙 Koyu Tema`), `localStorage` tercih kaydı ve 2D/3D/Method-2 şemalarında tam tema uyumu.
- **10-Aşamalı Mühendislik ve Saha QC Güncellemesi:**
  1. **Çevresel Alın Kaynağı (Girth Weld) Doğrulaması:** ASME B31.8 Md. 841.2.3(a)(5) uyarınca kaynağın büküm yayında (`PC`–`PT`) olup olmadığının tespiti, `%100 RT` uyarısı ve 2D/3D halka gösterimi.
  2. **A4 QC İmalat Föyünde 2D Vektörel CAD Çizimi:** Yazdırılabilir QC kartına ölçekli, yüksek kontrastlı 2D teknik büküm şeması gömülmesi.
  3. **Excel CSV & JSON Dışa Aktarımı:** Büküm paso tablosu ve mühendislik özetinin UTF-8 BOM destekli Türkçe Excel `.csv` ve `.json` formatlarında indirilmesi.
  4. **Boru Ağırlığı & Sahada Kaldırma (Rigging) Hesabı:** API 5L birim ağırlık (`kg/m`), toplam kütle (`Ton`), çift sideboom sapan yükü ve önerilen minimum sapan SWL (`DAF = 1.25`).
  5. **Topografik Eğim & Kot Farkından Büküm Hesaplayıcı:** Yüzde eğim (`%`), derece (`°`) veya 3 noktalı (`KP` + `Kot Z`) harita verisinden net büküm açısı ve `Overbend`/`Sagbend` tespiti.
  6. **Tasarım Sıcaklığı Katsayısı $T$ (Temperature Derating):** ASME B31.8 Tablo 841.1.8-1 doğrusal enterpolasyonu ile yüksek sıcaklıklarda efektif akma dayanımı ve Barlow minimum et kalınlığı ($t_{\min}$) revizyonu.
  7. **2D CAD İnteraktif Zoom, Pan & Yaya Odaklanma:** Fare tekerleği ile imleç merkezli yakınlaştırma (`%60`–`%500`), sürükle-kaydır (Pan) ve `🎯 Yaya Odaklan` (`PC`–`PT` otomatik kadrajlama).
  8. **Bileşik Gerilme & Von Mises Eşdeğer Gerilme Tahkiki:** ASME B31.8 Md. 833 & B31.4 Md. 402.3 uyarınca Çevresel ($S_h$), Boyuna ($S_L$) ve Von Mises ($S_{eq} \le 0.90 \cdot \text{SMYS} \cdot T$) gerilme analizi.
  9. **Büküm Makinesi Kalıp & Sıkma Pimi Tutma Payı Kontrolü:** Ön ve arka düz uçların minimum makine kavrama boyuna ($L_{\text{clamp,min}} = \max(1.2 \cdot D, 1.50\text{ m})$) uygunluk denetimi.
  10. **İnteraktif Operatör Paso Denetim Modu:** Paso tablosu satır seçimi, `◀ Önceki` / `Sonraki ▶` ve klavye ok tuşları (`ArrowLeft`/`ArrowRight`) ile adım adım 2D istasyon etiketi ve 3D halka/kalıp senkronizasyonu.
- **NPS 12" (OD 323.9 mm) Sınıflandırma Düzeltmesi:** OD $\le 325\text{ mm}$ boruların ASME B31.8 Tablo 841.2.3-1'de doğru şekilde NPS 12 sınıfına ($R_{\min} = 18D$, Yöntem 2 limiti $3.20^\circ/D$) atanması sağlandı.

## İndirilenler (5 dosya)

| # | Kullanım | Dosya | Açıklama |
|---|---|---|---|
| 1 | **Browser** (macOS + Windows) | `ColdBend-Pro-Web-v2.6.0.zip` | Zip'i açıp `index.html` dosyasını çift tıklayın — tarayıcıda çalışır, sunucu/internet gerekmez |
| 2 | **macOS Desktop** (Intel) | `ColdBend-Pro-2.6.0-x64.dmg` | Sürükle-bırak kurulum (Applications) |
| 3 | **macOS Desktop** (Apple Silicon) | `ColdBend-Pro-2.6.0-arm64.dmg` | Sürükle-bırak kurulum (Applications) |
| 4 | **Windows Taşınabilir** (10/11 x64) | `ColdBend-Pro-Portable-2.6.0.exe` | Kurulumsuz — çift tıklayın, doğrudan çalışır |
| 5 | **Windows Kurulumlu** (10/11 x64) | `ColdBend-Pro-Setup-2.6.0.exe` | NSIS sihirbazı; Masaüstü + Başlat kısayolu oluşturur |

## Kurulum / Çalıştırma

**Browser (1):** Zip'i klasöre çıkarın → `index.html` dosyasını çift tıklayın.

**macOS (2–3):** `.dmg` dosyasını açın → simgeyi Applications klasörüne sürükleyin.
İmzasız dağıtımda ilk açılış: sağ-tık → Aç.

**Windows Portable (4):** `.exe` dosyasını çift tıklayın, kurulum yoktur.

**Windows Setup (5):** `.exe` dosyasını çalıştırıp sihirbazı izleyin.

## Doğrulama

- `npm run check` → sözdizimi hatasız.
- Tüm ASME B31.8 / B31.4 mühendislik formülleri regresyonsuzdur.
- `prt*`, `matVal*`, `kpi*` ID bağlantıları korunur; TR arayüz, karanlık/aydınlık tema, A4 baskı.
