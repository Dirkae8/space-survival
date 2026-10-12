#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  exec python3 launch_game.py
elif command -v python >/dev/null 2>&1; then
  exec python launch_game.py
else
  echo "Python 3 is required. Install Python, then run this script again."
  exit 1
fi
