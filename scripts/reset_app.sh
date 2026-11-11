#!/usr/bin/env bash
set -e

DEVICE_SERIAL="$1"

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

echo "Clearing app data for com.yourname.territorygrid..."
"${ADB_CMD[@]}" shell pm clear com.yourname.territorygrid
echo "App state reset completed."
