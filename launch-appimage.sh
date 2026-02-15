#!/usr/bin/env bash
# Launch script for Rock Paper Scissors AppImage

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPIMAGE="$SCRIPT_DIR/dist/Rock Paper Scissors-1.0.0.AppImage"

if [ ! -f "$APPIMAGE" ]; then
    echo "AppImage not found: $APPIMAGE"
    echo "Please build the AppImage first by running: npm run build:appimage"
    exit 1
fi

# Make sure AppImage is executable
chmod +x "$APPIMAGE"

# Launch the AppImage
exec "$APPIMAGE" "$@"
