#!/usr/bin/env bash
# Quick installation script for Rock Paper Scissors

set -e

echo "=========================================="
echo "Rock Paper Scissors - Installation Script"
echo "=========================================="
echo ""

# Check if AppImage exists
if [ ! -f "dist/Rock Paper Scissors-1.0.0.AppImage" ]; then
    echo "❌ AppImage not found. Building it now..."
    npm run build:appimage
fi

# Make AppImage executable
chmod +x "dist/Rock Paper Scissors-1.0.0.AppImage"

echo "✓ AppImage is ready!"
echo ""
echo "Choose installation option:"
echo "1) Run from current directory (no installation)"
echo "2) Install system-wide (requires sudo)"
echo ""
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        echo ""
        echo "✓ No installation needed!"
        echo ""
        echo "You can run the game using:"
        echo "  ./dist/Rock\\ Paper\\ Scissors-1.0.0.AppImage"
        echo ""
        echo "Or double-click: RockPaperScissors.desktop"
        ;;
    2)
        echo ""
        echo "Installing system-wide..."
        
        # Create directory
        sudo mkdir -p /opt/rock-paper-scissors
        
        # Copy AppImage
        sudo cp "dist/Rock Paper Scissors-1.0.0.AppImage" /opt/rock-paper-scissors/
        sudo chmod +x "/opt/rock-paper-scissors/Rock Paper Scissors-1.0.0.AppImage"
        
        # Copy icon
        sudo mkdir -p /usr/share/icons/hicolor/scalable/apps
        sudo cp assets/scissors-icon.svg /usr/share/icons/hicolor/scalable/apps/rockpaperscissors.svg
        
        # Create .desktop file
        cat > /tmp/rockpaperscissors.desktop << 'EOF'
[Desktop Entry]
Name=Rock Paper Scissors
Comment=Play Rock Paper Scissors (AI + Multiplayer)
Exec=/opt/rock-paper-scissors/Rock Paper Scissors-1.0.0.AppImage
Icon=rockpaperscissors
Terminal=false
Type=Application
Categories=Game;
EOF
        
        # Install .desktop file
        sudo cp /tmp/rockpaperscissors.desktop /usr/share/applications/
        sudo chmod 644 /usr/share/applications/rockpaperscissors.desktop
        
        # Update desktop database
        sudo update-desktop-database 2>/dev/null || true
        
        echo ""
        echo "✓ Installation complete!"
        echo ""
        echo "The game is now available in your application menu."
        echo "Search for 'Rock Paper Scissors' to launch it."
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Installation finished!"
echo "=========================================="
