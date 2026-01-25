const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let serverProcess;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      contextIsolation: true,
    },
  });
  mainWindow.loadURL('http://localhost:3000');
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startServer() {
  const serverPath = path.join(__dirname, 'server', 'server.js');
  serverProcess = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: process.env.PORT || '3000' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let started = false;
  const tryCreateWindow = () => {
    if (!started) {
      started = true;
      createWindow();
    }
  };

  serverProcess.stdout.on('data', (data) => {
    const msg = data.toString();
    if (msg.includes('Game server running')) {
      tryCreateWindow();
    }
  });

  // Fallback in case log doesn't match
  setTimeout(() => {
    tryCreateWindow();
  }, 1500);

  serverProcess.on('exit', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

app.on('ready', () => {
  startServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (_) {}
  }
});
