const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow;

function checkServerReady(url, cb) {
  const req = http.get(url, (res) => {
    if (res.statusCode < 500) {
      cb(true);
    } else {
      setTimeout(() => checkServerReady(url, cb), 500);
    }
  });
  req.on('error', () => {
    setTimeout(() => checkServerReady(url, cb), 500);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'MARS — Music Platform',
    icon: path.join(__dirname, '..', 'assets', 'mars.ico'),
    backgroundColor: '#F2F4F8',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const appUrl = 'http://localhost:3000';

  checkServerReady(appUrl, () => {
    mainWindow.loadURL(appUrl);
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
