# Rock Paper Scissors - AppImage Distribution

## Quick Start

### Option 1: Run the AppImage directly
Simply double-click the AppImage file or run from terminal:
```bash
./dist/Rock\ Paper\ Scissors-1.0.0.AppImage
```

### Option 2: Use the launch script
```bash
./launch-appimage.sh
```

### Option 3: Use the .desktop file
Double-click `RockPaperScissors.desktop` to launch the game.

## Installation

### System-wide installation (Optional)
To install the game system-wide:

1. Copy the AppImage to a permanent location:
```bash
sudo cp "dist/Rock Paper Scissors-1.0.0.AppImage" /opt/rock-paper-scissors/
sudo chmod +x "/opt/rock-paper-scissors/Rock Paper Scissors-1.0.0.AppImage"
```

2. Copy the .desktop file to applications:
```bash
sudo cp RockPaperScissors.desktop /usr/share/applications/
```

3. Update the Exec path in the .desktop file:
```bash
sudo sed -i 's|Exec=.*|Exec=/opt/rock-paper-scissors/Rock Paper Scissors-1.0.0.AppImage|' /usr/share/applications/RockPaperScissors.desktop
```

4. Copy the icon:
```bash
sudo mkdir -p /usr/share/icons/hicolor/scalable/apps
sudo cp assets/scissors-icon.svg /usr/share/icons/hicolor/scalable/apps/rockpaperscissors.svg
sudo sed -i 's|Icon=.*|Icon=rockpaperscissors|' /usr/share/applications/RockPaperScissors.desktop
```

5. Update desktop database:
```bash
sudo update-desktop-database
```

Now the game will appear in your application menu!

## Rebuilding the AppImage

If you make changes to the code and want to rebuild:
```bash
npm run build:appimage
```

The new AppImage will be created in the `dist/` directory.

## Features

- **Player vs AI Mode**: Three difficulty levels (Easy, Medium, Hard)
- **Player vs Player Mode**: Real-time multiplayer with room codes
- **Smart AI**: Pattern recognition and Markov chain analysis
- **Modern UI**: Smooth animations and responsive design
- **Score Tracking**: First to 5 points wins

## Technical Details

- **AppImage Size**: ~101 MB
- **Platform**: Linux (x64)
- **Electron Version**: 29.4.6
- **Node.js Bundled**: Yes (self-contained)

## Troubleshooting

### AppImage won't run
Make sure it's executable:
```bash
chmod +x "dist/Rock Paper Scissors-1.0.0.AppImage"
```

### .desktop file error
Make sure the .desktop file is executable and has the correct Exec path:
```bash
chmod +x RockPaperScissors.desktop
```

### Permission denied
If you get permission errors, check file permissions:
```bash
ls -l "dist/Rock Paper Scissors-1.0.0.AppImage"
ls -l RockPaperScissors.desktop
```

### FUSE errors
If you get FUSE-related errors, try running with `--appimage-extract-and-run`:
```bash
./dist/Rock\ Paper\ Scissors-1.0.0.AppImage --appimage-extract-and-run
```

## License

MIT
