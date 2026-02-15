# Electron AppImage Fix Summary

## Issues Fixed

### 1. ✅ Infinite Tab Opening
**Problem**: The AppImage was opening new tabs repeatedly until it crashed.

**Root Cause**: The Electron app wasn't preventing `window.open()` calls from the web content.

**Solution**: Added `setWindowOpenHandler()` to deny all attempts to open new windows:
```javascript
mainWindow.webContents.setWindowOpenHandler(() => {
  return { action: 'deny' };
});
```

### 2. ✅ Blank Screen
**Problem**: The window showed blank content on startup.

**Root Causes**:
- Window was shown before content loaded
- Server might not be ready when window tries to load
- No error handling for failed loads

**Solutions**:
- Set `show: false` in BrowserWindow options
- Only show window after `ready-to-show` event fires
- Added `did-fail-load` handler to retry if server isn't ready
- Increased timeout for server startup (3 seconds)
- Added better logging for debugging

### 3. ✅ Multiple Windows
**Problem**: Multiple windows could be created simultaneously.

**Solution**: Added check in `createWindow()` to prevent duplicate windows:
```javascript
if (mainWindow) {
  return;
}
```

### 4. ✅ CORS Configuration
**Problem**: Socket.IO might fail due to CORS issues in Electron.

**Solution**: Set `ALLOWED_ORIGINS` environment variable when starting server:
```javascript
env: { 
  ...process.env, 
  PORT: '3000',
  ALLOWED_ORIGINS: 'http://localhost:3000,http://127.0.0.1:3000'
}
```

## Changes Made

### electron-main.js
1. Added `serverReady` flag to track server state
2. Prevent multiple windows with guard check
3. Hide window until ready (`show: false`)
4. Show window on `ready-to-show` event
5. Block all `window.open()` attempts
6. Added `did-fail-load` error handling with retry
7. Better logging for debugging
8. Set ALLOWED_ORIGINS environment variable
9. Increased server startup timeout to 3 seconds

## Testing

To test the fixed AppImage:
```bash
./dist/Rock\ Paper\ Scissors-1.0.0.AppImage
```

Expected behavior:
- Window opens after ~1-3 seconds (server startup time)
- No blank screen
- No infinite tab opening
- Game loads correctly
- Socket.IO connects successfully

## If Issues Persist

### Debug the AppImage
Run with console output to see errors:
```bash
./dist/Rock\ Paper\ Scissors-1.0.0.AppImage 2>&1 | tee appimage.log
```

### Check Server Logs
Look for "[Server]" prefixed messages in the output

### Common Issues

1. **Port already in use**: Another instance is running
   - Solution: Kill other instances: `killall "Rock Paper Scissors"`

2. **Server won't start**: Missing dependencies
   - Solution: Rebuild: `npm run build:appimage`

3. **Still blank**: Server startup is slow
   - The 3-second timeout should handle this, but you can increase it in electron-main.js

## AppImage Location

The rebuilt AppImage is at:
`dist/Rock Paper Scissors-1.0.0.AppImage` (101 MB)

You can now run it directly or use the .desktop file.
