#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_ROOT/logs"

mkdir -p "$LOGS_DIR"
BUILD_LOG="$LOGS_DIR/build.txt"

cd "$PROJECT_ROOT"
echo "Starting Gradle assembleDebug build..."

if [ -f "$PROJECT_ROOT/gradlew" ]; then
    ./gradlew assembleDebug 2>&1 | tee "$BUILD_LOG"
else
    gradle assembleDebug 2>&1 | tee "$BUILD_LOG"
fi

echo -e "\nBuild complete. Last 40 lines of build log:"
tail -n 40 "$BUILD_LOG"
