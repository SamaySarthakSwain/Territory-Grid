#!/usr/bin/env bash
set -e

NAME="$1"
DEVICE_SERIAL="$2"

if [ -z "$NAME" ]; then
    echo "Usage: ./scripts/shot.sh <name> [device_serial]"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SHOTS_DIR="$PROJECT_ROOT/shots"
mkdir -p "$SHOTS_DIR"

ADB="adb"
if ! command -v adb &> /dev/null; then
    if [ -f "$HOME/Library/Android/sdk/platform-tools/adb" ]; then
        ADB="$HOME/Library/Android/sdk/platform-tools/adb"
    elif [ -f "$ANDROID_HOME/platform-tools/adb" ]; then
        ADB="$ANDROID_HOME/platform-tools/adb"
    else
        echo "Error: adb command not found."
        exit 1
    fi
fi

ADB_CMD=("$ADB")
if [ -n "$DEVICE_SERIAL" ]; then
    ADB_CMD+=("-s" "$DEVICE_SERIAL")
fi

FILE_NAME="$NAME"
if [[ "$FILE_NAME" != *.png ]]; then
    FILE_NAME="${FILE_NAME}.png"
fi

echo "Capturing screenshot to $SHOTS_DIR/$FILE_NAME..."
"${ADB_CMD[@]}" exec-out screencap -p > "$SHOTS_DIR/$FILE_NAME"
echo "Screenshot captured."
