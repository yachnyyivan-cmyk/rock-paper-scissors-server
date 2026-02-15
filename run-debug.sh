#!/usr/bin/env bash
# Run the AppImage with debug output

cd "$(dirname "$0")"

echo "Starting Rock Paper Scissors AppImage with debug output..."
echo "Debug log will be saved to: debug.log"
echo ""

./dist/Rock\ Paper\ Scissors-1.0.0.AppImage 2>&1 | tee debug.log
