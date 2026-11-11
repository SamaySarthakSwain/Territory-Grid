#!/usr/bin/env bash
set -e

DEVICE_SERIAL="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Resolve ADB
ADB="adb"
if ! command -v adb &> /dev/null; then
    if [ -f "$HOME/Library/Android/sdk/platform-tools/adb" ]; then
        ADB="$HOME/Library/Android/sdk/platform-tools/adb"
    elif [ -f "$ANDROID_HOME/platform-tools/adb" ]; then
        ADB="$ANDROID_HOME/platform-tools/adb"
    else
        echo "Error: adb command not found. Add platform-tools to PATH."
        exit 1
    fi
fi

ADB_CMD=("$ADB")
if [ -n "$DEVICE_SERIAL" ]; then
    ADB_CMD+=("-s" "$DEVICE_SERIAL")
fi

echo "Installing debug APK..."
./gradlew installDebug

echo "Launching MainActivity..."
"${ADB_CMD[@]}" shell am start -n com.yourname.territorygrid/com.yourname.territorygrid.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER

echo "Waiting 3 seconds..."
sleep 3
echo "Application launched successfully."
