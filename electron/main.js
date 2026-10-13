/**
 * ColdBend Pro v2.6.0 — Electron Main Process
 * Tarayıcıda çalışan mevcut web uygulamasını (index.html + app.js)
 * macOS (.dmg) ve Windows (.exe) masaüstü uygulaması olarak paketler.
 * Mevcut hesap motoruna dokunmaz; sadece BrowserWindow kabuğudur.
 */
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// Tek doğruluk kaynağı: package.json (arayüz rozetiyle aynı olmalı)
const APP_VERSION = require('../package.json').version;
const isMac = process.platform === 'darwin';

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: `ColdBend Pro v${APP_VERSION}`,
    backgroundColor: '#0b0f19',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    autoHideMenuBar: false,
    show: false
  });

  // Yerel web uygulaması — sunucu gerektirmez, file:// ile çalışır.
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show();
  });

  // Dış bağlantıları (CDN fallback, doküman) varsayılan tarayıcıda aç.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Uygulama menüsü (TR) — Yazdır / PDF (imalat kartı) kısayollarını korur.
function buildMenu() {
  const template = [
    ...(isMac
      ? [
          {
            label: 'ColdBend Pro',
            submenu: [
              { label: `ColdBend Pro v${APP_VERSION} Hakkında`, role: 'about' },
              { type: 'separator' },
              { label: 'Çıkış', role: 'quit' }
            ]
          }
        ]
      : []),
    {
      label: 'Dosya',
      submenu: [
        {
          label: 'İmalat Kartı Yazdır / PDF',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            if (mainWindow) mainWindow.webContents.print({ printBackground: true });
          }
        },
        { type: 'separator' },
        isMac ? { label: 'Kapat', role: 'close' } : { label: 'Çıkış', role: 'quit' }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        { label: 'Yeniden Yükle', role: 'reload' },
        { label: 'Yakınlaştır', role: 'zoomIn' },
        { label: 'Uzaklaştır', role: 'zoomOut' },
        { label: 'Gerçek Boyut', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Tam Ekran', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Yardım',
      submenu: [
        {
          label: `Release Notları (v${APP_VERSION})`,
          click: async () => {
            await shell.openExternal(
              `https://github.com/SLedgehammer-dev12/Cold-Bending/releases/tag/v${APP_VERSION}`
            );
          }
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});

// Chromium güvenlik uyarılarını saha kullanımında sessiz geçme.
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
