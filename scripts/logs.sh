#!/usr/bin/env bash
set -e

MODE="$1"
DEVICE_SERIAL="$2"

if [ -z "$MODE" ]; then
    echo "Usage: ./scripts/logs.sh <clear|dump> [device_serial]"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOGS_DIR"

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

if [ "$MODE" = "clear" ]; then
    echo "Clearing logcat..."
    "${ADB_CMD[@]}" logcat -c
    echo "Logcat cleared."
elif [ "$MODE" = "dump" ]; then
    echo "Dumping logcat..."
    "${ADB_CMD[@]}" logcat -d > "$LOGS_DIR/app.txt"
    "${ADB_CMD[@]}" logcat -d "*:E" > "$LOGS_DIR/errors.txt"
    echo "Saved to $LOGS_DIR/app.txt and $LOGS_DIR/errors.txt"
else
    echo "Invalid mode: $MODE. Choose 'clear' or 'dump'."
    exit 1
fi
