#!/usr/bin/env bash
PORT=${1:-8088}
echo "========================================="
echo "LAUNCHING TERRITORY GRID WEB SIMULATION"
echo "Serving: design_refs/html/ at http://localhost:$PORT"
echo "========================================="

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python -m http.server $PORT --directory "$DIR/design_refs/html"
