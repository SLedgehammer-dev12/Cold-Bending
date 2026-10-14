# ColdBend Pro v2.6.1 — Release Notları

**Release:** v2.6.1 (hotfix / kararlı)  
**Tarih:** 2026-10-14  
**Standartlar:** ASME B31.8 Md. 841.2.3 & Md. 833 · ASME B31.4 Md. 406.2.1 & Md. 402.3 · API 5L / ISO 3183 · BOTAŞ 5120 Rev 7 / İşveren Şartnamesi  
**Sürüm birliği:** Arayüz rozeti = kod = paket = dosya adları → **v2.6.1**

---

## Bu Sürümde Neler Var (v2.6.0'dan Farkı)

### 1. Web Versiyonunda Mouse Roller ile Akıcı Sayfa Kaydırma (Canvas Wheel Trap Çözümü)
- **Çizim Alanı Tekerlek Kilidi Giderildi:** Web tarayıcısı sürümünde fare imleci merkezdeki büyük 2D CAD ve 3D WebGL çizim alanlarının üzerindeyken sayfa kaydırmasının kilitlenmesi engellendi.
- **Doğal Sayfa Gezinimi:** Fare tekerleği artık çizim alanlarının üzerinden geçerken sayfayı takılmadan, doğal ve akıcı bir şekilde aşağı/yukarı kaydırır.
- **Ctrl/Cmd Destekli Yakınlaştırma (Zoom):** Çizim alanında fare tekerleği ile yakınlaştırma yapmak için standart web/CAD davranışı olarak `Ctrl` (veya Mac'te `Cmd`) tuşuna basılı tutulması (veya izleme dörtgeninde çift parmak kıstırma yapılması) yeterlidir.
- **Klavyesiz Kontrol Düğmeleri:** Çizim üzerindeki `+`, `−`, `Yaya Odaklan` ve `Sıfırla` düğmeleri klavye kullanmadan tek tıkla yakınlaştırma sağlamaya devam eder.
- **Başlık Çubuğu Scroll Aktarımı:** Sayfa en üstündeyken `.app-header` üzerinden tekerlek çevrildiğinde kaydırma doğrudan içerik paneline iletilir.
- **Akıcı Momentum:** `.content-panel` ve `.sidebar-panel` üzerindeki `overscroll-behavior: contain` kaldırılarak `scroll-behavior: smooth` ve `-webkit-overflow-scrolling: touch` entegre edildi.

### 2. 3D Sabit Büküm Makinesi & İlerleyen Boru Kinematiği
- **Gerçek Saha Kinematiği:** Standart 3D animasyon esnasında büküm makinesi zemin ızgarası üzerinde $(0,0,0)$ koordinatında sabit kalır.
- **$C^1$ Sürekli İlerleme:** Boru bükülmemiş arka ucuyla ($-X$) kalıba girer, kalıpta bükülerek bent ark halinde ($+X$) dışarı çıkar.
- **Hidrolik Ram Basma/Bırakma Döngüsü:** Her adımda hidrolik ram boruya baskı uygular, boru bir paso boyu (${\Delta s}$) ilerlerken ram yukarı kalkar.
- **İstasyon Halkaları ve Girth Weld:** Paso yüzükleri ve boru gövdesindeki çevresel kaynak (girth weld) borunun fiziksel eksenine kilitli olarak boruyla birlikte hareket eder.

### 3. İnteraktif Mühendislik Hesaplama Bilgi Popover'ları (ⓘ)
- **Kapsam:** Tüm KPI özet kartlarına, Paso tablosu başlığına ve 6 ASME doğrulama matris kartına interaktif bilgi tetikleyicileri (ⓘ) eklendi.
- **Zengin İçerik:** Her popover; ilgili formül türevini, ASME B31.8 / B31.4 standart maddesini, kabul/ret sınırını ve mühendislik açıklamasını gösterir.
- **Metin Seçim & Kopyalama Koruması:** Popover açıkken içindeki formülleri veya açıklamaları fareyle seçip kopyalarken kartın kapanması engellendi (`e.target.closest('.info-popover')` koruması).
- **Hover Köprüsü (Flicker Önleme):** İkon ile popover arasındaki boşluğa görünmez hit-area köprüsü eklenerek farenin karta geçişinde oluşan titreme ve kapanma giderildi.
- **Klavye Erişilebilirliği (a11y):** `tabindex="0"` düğmelerine `Enter` veya `Space` tuşlarıyla açma/kapama desteği sağlandı; `Escape` veya dışarı tıklama ile temiz kapanma eklendi.
- **Yazdırma İzolasyonu:** Resmi A4 imalat çıktısında bilgi simgeleri otomatik gizlenir.

### 4. Şantiye As-Built Ölçüm & QC Tolerans Tahkik Paneli
- **Saha Girdileri:** Spool no, muayene tarihi, ölçülen açı ($\theta_{\text{meas}}$), ekstrados et kalınlığı ($t_{\text{meas}}$), ovalleşme ve ondülasyon/ripple ($h_{\text{meas}}$).
- **Tasarım Değerlerini Otomatik Doldur:** Tasarım hesap sonuçlarını tek tıkla sahaya referans doldurma olanağı.
- **Tolerans Sapma Karşılaştırması:** $|\Delta\theta| \le 0.20^\circ$, $t \ge t_{\min}$, Ovalite $\le \%2.50$, Ripple $\le \%1.0 D$ limitleri anlık denetlenir ve resmi QC Kabul/Ret kaşesi basılır.

### 5. Ağaç Bükümü Gizli Modu (Easter Egg)
- **Erişim:** 3D sekmesinde `agac` veya `tree` yazılarak aktifleşir.
- **Saha Sahnesi:** Gerçekçi iş makineleri (ekskavatörler), yere sabit orantılı ağaç ve arkasında baretli şantiye şefi.
- **Tebrik Animasyonu:** Son paso tamamlandığında şantiye şefi tebrik (`thumbs-up`) animasyonu yapar ve ekranda başarı rozeti belirir.

---

## İndirilenler (5 Dosya)

| # | Kullanım | Dosya | Açıklama |
|---|---|---|---|
| 1 | **Browser** (macOS + Windows) | `ColdBend-Pro-Web-v2.6.1.zip` | Zip'i açıp `index.html` dosyasını çift tıklayın — tarayıcıda çalışır, sunucu/internet gerekmez |
| 2 | **macOS Desktop** (Intel) | `ColdBend-Pro-2.6.1-x64.dmg` | Sürükle-bırak kurulum (Applications) |
| 3 | **macOS Desktop** (Apple Silicon) | `ColdBend-Pro-2.6.1-arm64.dmg` | Sürükle-bırak kurulum (Applications) |
| 4 | **Windows Taşınabilir** (10/11 x64) | `ColdBend-Pro-Portable-2.6.1.exe` | Kurulumsuz — çift tıklayın, doğrudan çalışır |
| 5 | **Windows Kurulumlu** (10/11 x64) | `ColdBend-Pro-Setup-2.6.1.exe` | NSIS sihirbazı; Masaüstü + Başlat kısayolu oluşturur |

---

## Kurulum / Çalıştırma

- **Browser (1):** Zip'i klasöre çıkarın → `index.html` dosyasını çift tıklayın.
- **macOS (2–3):** `.dmg` dosyasını açın → simgeyi Applications klasörüne sürükleyin. İmzasız dağıtımda ilk açılış: sağ-tık → Aç.
- **Windows Portable (4):** `.exe` dosyasını çift tıklayın, kurulum gerektirmez.
- **Windows Setup (5):** `.exe` dosyasını çalıştırıp sihirbazı izleyin.

---

## Doğrulama & Kalite Güvencesi

- `npm run check` → 0 hata, sözdizimi doğrulanmış.
- `[1/3] Çekirdek formül imzaları`: 5/5 geçti (`incelme`, `kalınlaşma`, `geri-yaylanma`, `ovallik-mandrel`, `fiber-gerilme`).
- `[2/3] ID bağlantıları`: 271/271 DOM ID tam eşleşti.
- `[3/3] Sürüm birliği`: rozet = `v2.6.1`, `APP_VERSION` = `2.6.1`, `preload` = `2.6.1`, `package.json` = `2.6.1`.
- A4 yazdırma düzeni, koyu/açık temalar ve tüm ASME B31.8 / B31.4 formülleri tam uyumlu çalışmaktadır.
