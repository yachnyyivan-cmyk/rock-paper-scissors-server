const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;
let serverReady = false;
let server;

function createWindow() {
  // Prevent multiple windows from being created
  if (mainWindow) {
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false, // Don't show until ready
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Show window when ready to avoid blank screen
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Prevent opening new windows (fix infinite tab opening)
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Handle page load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Window] Failed to load:', errorCode, errorDescription);
    // Retry after a short delay if server isn't ready yet
    if (!serverReady) {
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.loadURL('http://localhost:3000');
        }
      }, 1000);
    }
  });

  mainWindow.loadURL('http://localhost:3000');
  
  mainWindow.on('closed', () => {
    mainWindow = null;
    // Quit the app when window is closed (except on macOS)
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

async function startServer() {
  try {
    console.log('[Server] Starting Express server...');
    
    // Load the server module directly (don't spawn a separate process)
    const gameServer = require('./server/server.js');
    
    // The server module exports the GameServer instance which has a .server property
    if (gameServer && gameServer.server) {
      server = gameServer.server;
      serverReady = true;
      console.log('[Server] Express server started successfully');
      
      // Wait a bit for server to fully initialize
      setTimeout(() => {
        createWindow();
      }, 500);
    } else {
      throw new Error('Server module did not export server instance');
    }
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    
    // Fallback: try to create window anyway after a delay
    setTimeout(() => {
      console.log('[Server] Attempting to create window despite server error');
      createWindow();
    }, 2000);
  }
}

app.on('ready', () => {
  startServer();
});

app.on('window-all-closed', () => {
  // On macOS, keep the app running even when all windows are closed
  // On other platforms, quit the app
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked and no windows are open
  if (BrowserWindow.getAllWindows().length === 0 && serverReady) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // Clean up server when app quits
  if (server && server.close) {
    try {
      console.log('[Server] Shutting down...');
      server.close();
    } catch (error) {
      console.error('[Server] Error during shutdown:', error);
    }
  }
});
