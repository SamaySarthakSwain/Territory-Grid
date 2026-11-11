#!/usr/bin/env bash
echo "========================================="
echo "LAUNCHING TERRITORY GRID WEB SIMULATION"
echo "Serving: design_refs/html/ at http://localhost:8080"
echo "========================================="

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python -m http.server 8080 --directory "$DIR/design_refs/html"
